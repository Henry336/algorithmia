import { isAdminMode } from "./admin.js";
import { advance, isDialogueActive, sayLines } from "./dialogue.js";
import { getState, setState } from "./state.js";
import {
  CAMPAIGN_WORLD,
  findUnreachableRouteProbes,
  getCampaignChapter,
  getChapterRouteProbes,
  getCollectionValues,
  interactionIsVisible,
  isCampaignWalkable,
  objectiveForChapter,
  regionAtPoint,
  requirementMet,
} from "./campaignAtlasData.js";
import { createCampaignEntity, renderCampaignWorld } from "./campaignAtlasArt.js";

const PATCHRUNNER_ASSETS = "assets/characters/patchrunner/A_young_field_technician_in/rotations";
const MIRA_ASSETS = "assets/characters/mira/A_woman_in_her_40s/rotations";
const SLIME_ASSET = "assets/characters/sorting-slime/A_translucent_lime-green_gelatinous_blob/rotations/south.png";
const BOGO_ASSET = "assets/characters/bogolord/Style_16-bit_horror_pixel_art/rotations/south.png";
const DISPATCHER_ASSET = "assets/characters/dispatcher/dispatcher.png";
const HUSK_ASSET = "assets/characters/recursive-husk/recursive-husk-92.png";
const PLAYER_SPEED = 212;
const PLAYER_SCALE = 1.18;
const PLAYER_PROBES = [[0, 4], [-11, 1], [11, 1], [0, -7]];

let activeGame = null;
let activeScene = null;
let launchChapterIndex = 0;
let launchConfig = {};
const virtualDirections = new Set();
const introducedChapters = new Set();

export function startCampaignChapter(chapterIndex, config = {}) {
  const host = document.getElementById("campaign-atlas-host");
  if (!host) throw new Error("Campaign atlas host is missing.");
  if (!window.Phaser) throw new Error("Phaser did not load before the campaign atlas.");

  launchChapterIndex = Math.max(0, Math.min(5, Number(chapterIndex) || 0));
  launchConfig = config;
  virtualDirections.clear();
  hidePrompt();
  bindCampaignDpad();

  if (activeGame) activeGame.destroy(true);
  activeGame = null;
  activeScene = null;
  host.innerHTML = "";
  host.focus({ preventScroll: true });

  activeGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: 1280,
    height: 720,
    backgroundColor: "#05070b",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    render: { pixelArt: true, antialias: false, roundPixels: true },
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: CampaignAtlasScene,
  });
}

export function stopCampaignAtlas() {
  virtualDirections.clear();
  hidePrompt();
  if (activeGame) activeGame.destroy(true);
  activeGame = null;
  activeScene = null;
  delete window.__campaignAtlasDebug;
  delete document.body.dataset.campaignAtlasReady;
}

export function resumeCampaignAtlas() {
  if (!activeScene) return;
  activeScene.resumeAfterEncounter();
}

class CampaignAtlasScene extends Phaser.Scene {
  constructor() {
    super("CampaignAtlas");
    this.facing = "south";
    this.pausedForEncounter = false;
    this.lastRegionId = null;
    this.entities = [];
    this.entityById = new Map();
    this.sessionVisited = new Set();
  }

  preload() {
    for (const direction of ["north", "south", "east", "west"]) {
      this.load.image(`patchrunner-${direction}`, `${PATCHRUNNER_ASSETS}/${direction}.png`);
    }
    this.load.image("mira", `${MIRA_ASSETS}/south.png`);
    this.load.image("sorting-slime", SLIME_ASSET);
    this.load.image("bogolord", BOGO_ASSET);
    this.load.image("dispatcher", DISPATCHER_ASSET);
    this.load.image("recursive-husk", HUSK_ASSET);
  }

  create() {
    activeScene = this;
    this.chapter = getCampaignChapter(launchChapterIndex);
    this.facing = this.chapter.spawn.facing || "south";
    setState({ chapter: this.chapter.number });
    this.worldArt = renderCampaignWorld(this, this.chapter, () => getState());
    this.createPlayer();
    this.createControls();
    this.refreshEntities();
    this.configureCamera();
    this.refreshHud();
    this.installDebugApi();
    this.cameras.main.fadeIn(620, 4, 7, 11);
    document.body.dataset.campaignAtlasReady = "true";
    document.body.dataset.campaignAtlasChapter = String(this.chapter.number);

    const spawnRegion = regionAtPoint(this.chapter, this.player.x, this.player.y);
    this.lastRegionId = spawnRegion?.id || null;
    updateRegionHud(spawnRegion?.name || this.chapter.title);

    if (!introducedChapters.has(this.chapter.id) && !isAdminMode()) {
      introducedChapters.add(this.chapter.id);
      this.time.delayedCall(650, () => {
        if (!campaignScreenIsActive()) return;
        sayLines(this.chapter.intro);
      });
    } else {
      showToast(this.chapter.subtitle, 1800);
    }
  }

  update(time, delta) {
    if (!campaignScreenIsActive()) return;
    this.updatePatrols(delta);
    if (this.pausedForEncounter || isDialogueActive()) {
      this.updatePlayerPresentation(time, false);
      return;
    }

    const horizontal = this.directionValue("right", "left", this.keys.D, this.keys.A, this.cursors.right, this.cursors.left);
    const vertical = this.directionValue("down", "up", this.keys.S, this.keys.W, this.cursors.down, this.cursors.up);
    const moving = horizontal !== 0 || vertical !== 0;
    if (moving) {
      const length = Math.hypot(horizontal, vertical) || 1;
      const seconds = Math.min(delta, 34) / 1000;
      this.movePlayer((horizontal / length) * PLAYER_SPEED * seconds, (vertical / length) * PLAYER_SPEED * seconds);
      this.updateFacing(horizontal, vertical);
    }
    this.updatePlayerPresentation(time, moving);
    this.updateRegion();
    this.updatePrompt();
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ W: "W", A: "A", S: "S", D: "D" });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const interact = () => {
      if (!campaignScreenIsActive()) return;
      if (isDialogueActive()) advance();
      else this.tryInteract();
    };
    this.spaceKey.on("down", interact);
    this.enterKey.on("down", interact);
  }

  createPlayer() {
    this.playerShadow = this.add.ellipse(0, 3, 34, 13, 0x020307, 0.56);
    this.playerSprite = this.add.image(0, 2, `patchrunner-${this.facing}`).setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    this.player = this.add.container(this.chapter.spawn.x, this.chapter.spawn.y, [this.playerShadow, this.playerSprite]);
    this.player.setDepth(this.player.y + 480);
  }

  configureCamera() {
    this.cameras.main.setBounds(0, 0, CAMPAIGN_WORLD.width, CAMPAIGN_WORLD.height);
    this.cameras.main.startFollow(this.player, true, 0.105, 0.105);
    this.resizeToVisibleHost = () => {
      if (!campaignScreenIsActive()) return;
      const host = document.getElementById("campaign-atlas-host");
      const width = Math.max(320, host?.clientWidth || window.innerWidth);
      const height = Math.max(240, host?.clientHeight || window.innerHeight);
      this.scale.resize(width, height);
      this.applyResponsiveZoom(width, height);
    };
    this.resizeToVisibleHost();
    window.addEventListener("resize", this.resizeToVisibleHost);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener("resize", this.resizeToVisibleHost));
  }

  applyResponsiveZoom(width, height) {
    const zoom = Phaser.Math.Clamp(Math.min(width / 1120, height / 690), 0.72, 1.16);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.setDeadzone(Math.min(260, width * 0.2), Math.min(160, height * 0.2));
  }

  directionValue(positiveName, negativeName, positiveLetter, negativeLetter, positiveArrow, negativeArrow) {
    const positive = positiveLetter.isDown || positiveArrow.isDown || virtualDirections.has(positiveName);
    const negative = negativeLetter.isDown || negativeArrow.isDown || virtualDirections.has(negativeName);
    return Number(positive) - Number(negative);
  }

  canOccupy(x, y) {
    return PLAYER_PROBES.every(([offsetX, offsetY]) => isCampaignWalkable(this.chapter, x + offsetX, y + offsetY, getState()));
  }

  movePlayer(dx, dy) {
    const nextX = this.player.x + dx;
    if (this.canOccupy(nextX, this.player.y)) this.player.x = nextX;
    const nextY = this.player.y + dy;
    if (this.canOccupy(this.player.x, nextY)) this.player.y = nextY;
    this.player.setDepth(this.player.y + 480);
  }

  updateFacing(horizontal, vertical) {
    let next = this.facing;
    if (Math.abs(horizontal) > Math.abs(vertical)) next = horizontal > 0 ? "east" : "west";
    else if (vertical !== 0) next = vertical > 0 ? "south" : "north";
    if (next === this.facing) return;
    this.facing = next;
    this.playerSprite.setTexture(`patchrunner-${next}`);
  }

  updatePlayerPresentation(time, moving) {
    if (moving) {
      this.playerSprite.y = 2 - Math.abs(Math.sin(time / 92) * 5);
      this.playerSprite.setScale(PLAYER_SCALE * (1 + (Math.sin(time / 92) * 0.018)), PLAYER_SCALE * (1 - (Math.sin(time / 92) * 0.018)));
      this.playerShadow.setScale(1 - (Math.abs(Math.sin(time / 92)) * 0.08), 1);
    } else {
      this.playerSprite.y = 2 - (Math.sin(time / 620) * 1.8);
      this.playerSprite.setScale(PLAYER_SCALE, PLAYER_SCALE * (1 + (Math.sin(time / 620) * 0.008)));
      this.playerShadow.setScale(1, 1);
    }
  }

  refreshEntities() {
    for (const entity of this.entities) entity.container.destroy(true);
    this.entities = [];
    this.entityById.clear();
    const state = getState();
    for (const interaction of this.chapter.interactions) {
      if (!interactionIsVisible(interaction, state)) continue;
      const entity = createCampaignEntity(this, this.chapter, interaction);
      this.entities.push(entity);
      this.entityById.set(interaction.id, entity);
    }
  }

  updatePatrols(delta) {
    if (this.pausedForEncounter || isDialogueActive()) return;
    for (const entity of this.entities) {
      const points = entity.interaction.patrol;
      if (!points || points.length < 2) continue;
      const target = points[entity.patrolIndex];
      const dx = target[0] - entity.container.x;
      const dy = target[1] - entity.container.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 4) {
        entity.patrolIndex = (entity.patrolIndex + 1) % points.length;
        continue;
      }
      const speed = entity.interaction.type === "enemy" ? 42 : 30;
      const step = Math.min(distance, speed * Math.min(delta, 40) / 1000);
      entity.container.x += (dx / distance) * step;
      entity.container.y += (dy / distance) * step;
      entity.container.setDepth(entity.container.y + 400);
    }
  }

  nearestEntity() {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const entity of this.entities) {
      const distance = Math.hypot(this.player.x - entity.container.x, this.player.y - entity.container.y);
      if (distance <= (entity.interaction.radius || 64) && distance < nearestDistance) {
        nearest = entity;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  nearestClosedGate() {
    const state = getState();
    let nearest = null;
    let distance = Infinity;
    for (const gate of this.chapter.gates) {
      if (requirementMet(gate.requires, state)) continue;
      const bounds = gate.shape.kind === "rect"
        ? { x: gate.shape.x + (gate.shape.width / 2), y: gate.shape.y + (gate.shape.height / 2) }
        : { x: gate.shape.x, y: gate.shape.y };
      const current = Math.hypot(this.player.x - bounds.x, this.player.y - bounds.y);
      if (current < 80 && current < distance) {
        nearest = gate;
        distance = current;
      }
    }
    return nearest;
  }

  updatePrompt() {
    const nearest = this.nearestEntity();
    if (nearest) {
      showPrompt(`[SPACE] ${nearest.interaction.label}`);
      return;
    }
    const gate = this.nearestClosedGate();
    if (gate) {
      showPrompt(`[SEALED] ${gate.label}`);
      return;
    }
    hidePrompt();
  }

  tryInteract() {
    if (this.pausedForEncounter) return;
    const entity = this.nearestEntity();
    if (!entity) {
      const gate = this.nearestClosedGate();
      if (gate) sayLines([{ speaker: "", text: gate.label }]);
      return;
    }
    this.handleInteraction(entity.interaction);
  }

  handleInteraction(interaction) {
    const state = getState();
    if (interaction.requirements && !requirementMet(interaction.requirements, state)) {
      sayLines(interaction.lockedLines || [{ speaker: "", text: "The route is not ready yet." }]);
      return;
    }

    if (["npc", "lore", "secret", "ending"].includes(interaction.type)) {
      if (interaction.foundFlag && !state[interaction.foundFlag]) setState({ [interaction.foundFlag]: true });
      sayLines(interaction.lines || [{ speaker: "", text: "Nothing answers." }], () => this.refreshHud());
      return;
    }
    if (interaction.type === "puzzle") {
      this.handlePuzzle(interaction);
      return;
    }
    if (interaction.type === "collectible") {
      this.collect(interaction);
      return;
    }
    if (interaction.type === "exit") {
      if (!requirementMet(interaction.requirements, state)) {
        sayLines(interaction.lockedLines || [{ speaker: "", text: "The next route is still sealed." }]);
        return;
      }
      this.pausedForEncounter = true;
      this.cameras.main.fadeOut(460, 4, 7, 11);
      this.time.delayedCall(500, () => launchConfig.onExitChapter?.(interaction.nextChapter));
      return;
    }
    if (["enemy", "boss"].includes(interaction.type)) {
      this.beginEncounter(interaction);
    }
  }

  beginEncounter(interaction) {
    this.pausedForEncounter = true;
    hidePrompt();
    const start = () => {
      if (launchConfig.onEncounter) {
        this.input.keyboard.enabled = false;
        launchConfig.onEncounter({
          chapter: this.chapter,
          interaction,
          onComplete: () => this.resumeAfterEncounter(),
        });
      } else {
        this.pausedForEncounter = false;
        this.input.keyboard.enabled = true;
      }
    };
    if (interaction.approach?.length) sayLines(interaction.approach, start);
    else start();
  }

  resumeAfterEncounter() {
    if (!this.scene?.isActive()) return;
    this.pausedForEncounter = false;
    this.input.keyboard.enabled = true;
    this.refreshEntities();
    this.worldArt.refreshGates();
    this.refreshHud();
    this.resizeToVisibleHost?.();
    this.cameras.main.fadeIn(380, 4, 7, 11);
    document.getElementById("campaign-atlas-host")?.focus({ preventScroll: true });
  }

  handlePuzzle(interaction) {
    const puzzle = this.chapter.puzzles[interaction.puzzle];
    if (!puzzle) return;
    const state = getState();
    if (state[puzzle.flag]) {
      sayLines([{ speaker: "", text: `${puzzle.label} is already aligned.` }]);
      return;
    }
    const allProgress = { ...(state.campaignPuzzleProgress || {}) };
    if (puzzle.mode === "sequence") {
      const progress = Array.isArray(allProgress[interaction.puzzle]) ? [...allProgress[interaction.puzzle]] : [];
      const expected = puzzle.solution[progress.length];
      if (interaction.step !== expected) {
        allProgress[interaction.puzzle] = [];
        setState({ campaignPuzzleProgress: allProgress });
        sayLines([
          { speaker: "", text: `${puzzle.label} shudders and resets. That input arrived out of order.` },
          { speaker: "Mira Vale", text: "Read the route, not just the nearest switch. Start from the system's first dependency." },
        ]);
        return;
      }
      progress.push(interaction.step);
      allProgress[interaction.puzzle] = progress;
      const complete = progress.length === puzzle.solution.length;
      setState({ campaignPuzzleProgress: allProgress, ...(complete ? { [puzzle.flag]: true } : {}) });
      if (complete) {
        this.worldArt.refreshGates();
        this.refreshHud();
        sayLines(puzzle.complete);
      } else {
        sayLines([{ speaker: "", text: `${puzzle.label}: ${progress.length}/${puzzle.solution.length} relays holding.` }]);
      }
      return;
    }

    const values = { ...(allProgress[interaction.puzzle] || {}) };
    values[interaction.step] = ((values[interaction.step] || 0) + 1) % puzzle.max;
    allProgress[interaction.puzzle] = values;
    const complete = Object.entries(puzzle.targets).every(([key, target]) => values[key] === target);
    setState({ campaignPuzzleProgress: allProgress, ...(complete ? { [puzzle.flag]: true } : {}) });
    const entity = this.entityById.get(interaction.id);
    if (entity) entity.sprite.setAngle((360 / puzzle.max) * values[interaction.step]);
    if (complete) {
      this.worldArt.refreshGates();
      this.refreshHud();
      sayLines(puzzle.complete);
    } else {
      sayLines([{ speaker: "", text: `${puzzle.label} / ${interaction.step.toUpperCase()}: position ${values[interaction.step]} of ${puzzle.max - 1}.` }]);
    }
  }

  collect(interaction) {
    const state = getState();
    const current = getCollectionValues(state, interaction.collection);
    if (current.includes(interaction.value)) return;
    const next = [...current, interaction.value];
    if (interaction.collection === "graphDiamonds") {
      setState({ graphDiamonds: next });
    } else {
      setState({ campaignCollectibles: { ...(state.campaignCollectibles || {}), [interaction.collection]: next } });
    }
    this.refreshEntities();
    this.worldArt.refreshGates();
    showToast(`${interaction.collection === "graphDiamonds" ? "ARCHIVE DIAMONDS" : "COLLECTED"}: ${next.length}/3`, 2200);
    sayLines([
      { speaker: "", text: "The diamond folds into the Archive shard without adding weight." },
      ...(next.length >= 3 ? [{ speaker: "Mira Vale", text: "All three. The sealed root wall was near the landing. We should backtrack." }] : []),
    ]);
  }

  updateRegion() {
    const region = regionAtPoint(this.chapter, this.player.x, this.player.y);
    if (!region || region.id === this.lastRegionId) return;
    this.lastRegionId = region.id;
    updateRegionHud(region.name);
    showToast(region.name.toUpperCase(), 1300);
    if (!this.sessionVisited.has(region.id)) {
      this.sessionVisited.add(region.id);
      const state = getState();
      const visited = { ...(state.campaignVisitedRegions || {}) };
      const chapterVisited = new Set(visited[this.chapter.id] || []);
      if (!chapterVisited.has(region.id)) {
        chapterVisited.add(region.id);
        visited[this.chapter.id] = [...chapterVisited];
        setState({ campaignVisitedRegions: visited });
      }
    }
  }

  refreshHud() {
    updateCampaignHud(this.chapter, getState());
  }

  installDebugApi() {
    window.__campaignAtlasDebug = {
      chapter: this.chapter.number,
      chapterId: this.chapter.id,
      ready: true,
      snapshot: () => ({
        chapter: this.chapter.number,
        player: { x: Math.round(this.player.x), y: Math.round(this.player.y), facing: this.facing },
        region: this.lastRegionId,
        objective: objectiveForChapter(this.chapter, getState()),
        entities: this.entities.map((entity) => entity.interaction.id),
        ambience: this.worldArt.counts,
      }),
      teleport: (x, y) => {
        if (!isCampaignWalkable(this.chapter, x, y, getState(), { ignoreGates: true })) return false;
        this.player.setPosition(x, y);
        this.updateRegion();
        return true;
      },
      interact: (id) => {
        const interaction = this.chapter.interactions.find((item) => item.id === id);
        if (!interaction) return false;
        this.handleInteraction(interaction);
        return true;
      },
      isWalkable: (x, y, ignoreGates = false) => isCampaignWalkable(this.chapter, x, y, getState(), { ignoreGates }),
      routeProbes: () => getChapterRouteProbes(this.chapter),
      unreachableRouteProbes: () => findUnreachableRouteProbes(this.chapter),
      blockerAudit: () => this.chapter.blockers.map((blocker) => {
        const shape = blocker.shape;
        const center = shape.kind === "rect"
          ? { x: shape.x + (shape.width / 2), y: shape.y + (shape.height / 2) }
          : shape.kind === "polygon"
            ? shape.points.reduce((total, point) => ({ x: total.x + (point[0] / shape.points.length), y: total.y + (point[1] / shape.points.length) }), { x: 0, y: 0 })
            : { x: shape.x, y: shape.y };
        return { id: blocker.id, blocked: !isCampaignWalkable(this.chapter, center.x, center.y, getState(), { ignoreGates: true }) };
      }),
      gateAudit: () => this.chapter.gates.map((gate) => {
        const shape = gate.shape;
        const center = shape.kind === "rect"
          ? { x: shape.x + (shape.width / 2), y: shape.y + (shape.height / 2) }
          : { x: shape.x, y: shape.y };
        return {
          id: gate.id,
          requirementMet: requirementMet(gate.requires, getState()),
          blockedNow: !isCampaignWalkable(this.chapter, center.x, center.y, getState()),
          traversableWhenOpen: isCampaignWalkable(this.chapter, center.x, center.y, getState(), { ignoreGates: true }),
        };
      }),
      concealedVisible: () => this.worldArt.concealed.filter((item) => item.cover.visible).length,
      visibleInteractions: () => this.chapter.interactions.filter((item) => interactionIsVisible(item, getState())).map((item) => item.id),
      refresh: () => this.resumeAfterEncounter(),
    };
  }
}

function updateCampaignHud(chapter, state) {
  document.getElementById("campaign-atlas-chapter").textContent = `CHAPTER ${chapter.number}`;
  document.getElementById("campaign-atlas-title").textContent = chapter.title;
  document.getElementById("campaign-atlas-objective").textContent = objectiveForChapter(chapter, state);
  document.getElementById("campaign-atlas-rot-fill").style.width = `${chapter.nullRot}%`;
  document.getElementById("campaign-atlas-rot-value").textContent = `${String(chapter.nullRot).padStart(2, "0")}%`;
  document.documentElement.style.setProperty("--campaign-accent", `#${chapter.theme.accent.toString(16).padStart(6, "0")}`);
  document.documentElement.style.setProperty("--campaign-warm", `#${chapter.theme.warm.toString(16).padStart(6, "0")}`);
  document.documentElement.style.setProperty("--campaign-rot", `#${chapter.theme.rot.toString(16).padStart(6, "0")}`);
}

function updateRegionHud(name) {
  const target = document.getElementById("campaign-atlas-region");
  if (target) target.textContent = name;
}

function campaignScreenIsActive() {
  return document.getElementById("screen-campaign-atlas")?.classList.contains("active");
}

function showPrompt(text) {
  const prompt = document.getElementById("campaign-atlas-prompt");
  if (!prompt) return;
  prompt.textContent = text;
  prompt.classList.remove("hidden");
}

function hidePrompt() {
  document.getElementById("campaign-atlas-prompt")?.classList.add("hidden");
}

let toastTimer = null;
function showToast(text, duration = 1600) {
  const toast = document.getElementById("campaign-atlas-toast");
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = text;
  toast.classList.remove("hidden");
  toastTimer = window.setTimeout(() => toast.classList.add("hidden"), duration);
}

function bindCampaignDpad() {
  const dpad = document.getElementById("dpad-campaign-atlas");
  if (!dpad || dpad.dataset.bound === "true") return;
  dpad.dataset.bound = "true";
  for (const button of dpad.querySelectorAll("button[data-dir]")) {
    const direction = button.dataset.dir;
    if (direction === "interact") {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (isDialogueActive()) advance();
        else activeScene?.tryInteract();
      });
      continue;
    }
    const start = (event) => {
      event.preventDefault();
      virtualDirections.add(direction);
    };
    const stop = () => virtualDirections.delete(direction);
    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
  }
  window.addEventListener("pointerup", () => virtualDirections.clear());
}
