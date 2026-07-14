import { isAdminMode } from "./admin.js";
import { advance, isDialogueActive, sayLines } from "./dialogue.js";
import {
  GRAPHREACH_AMBIENCE,
  GRAPHREACH_AREAS,
  GRAPHREACH_CORRIDORS,
  GRAPHREACH_INTERACTIONS,
  GRAPHREACH_ROUTE_PROBES,
  GRAPHREACH_SPAWN,
  GRAPHREACH_WORLD,
  isGraphreachWalkable,
  nearestGraphreachInteraction,
} from "./graphreachSpaceData.js";

const MAP_ASSET = "assets/maps/graphreach/graphreach-space.png";
const PATCHRUNNER_ASSETS = "assets/characters/patchrunner/A_young_field_technician_in/rotations";
const MIRA_ASSETS = "assets/characters/mira/A_woman_in_her_40s/rotations";
const PLAYER_SPEED = 172;
const PLAYER_SCALE = 1.15;

let activeGame = null;
let activeScene = null;
let exitHandler = null;
let hasIntroducedGraphreach = false;
const virtualDirections = new Set();

export function initGraphreachExploration({ onExitToChapter5 } = {}) {
  const host = document.getElementById("graphreach-phaser-host");
  if (!host) throw new Error("Graphreach Phaser host is missing.");
  if (!window.Phaser) throw new Error("Phaser did not load before Graphreach.");

  exitHandler = onExitToChapter5 || null;
  virtualDirections.clear();
  clearInteractionPrompt();
  bindGraphreachDpad();

  if (activeGame) activeGame.destroy(true);
  host.innerHTML = "";
  host.focus({ preventScroll: true });

  activeGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    width: 960,
    height: 640,
    backgroundColor: "#0a0d12",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    render: { pixelArt: true, antialias: false, roundPixels: true },
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: GraphreachScene,
  });
}

class GraphreachScene extends Phaser.Scene {
  constructor() {
    super("GraphreachExploration");
    this.facing = GRAPHREACH_SPAWN.facing;
    this.activeInteraction = null;
  }

  preload() {
    this.load.image("graphreach-map", MAP_ASSET);
    for (const direction of ["north", "south", "east", "west"]) {
      this.load.image(`patchrunner-${direction}`, `${PATCHRUNNER_ASSETS}/${direction}.png`);
    }
    this.load.image("mira-south", `${MIRA_ASSETS}/south.png`);
  }

  create() {
    activeScene = this;
    this.add.image(0, 0, "graphreach-map").setOrigin(0).setDepth(0);
    this.cameras.main.setBounds(0, 0, GRAPHREACH_WORLD.width, GRAPHREACH_WORLD.height);
    this.cameras.main.setZoom(1.12);

    this.createAmbientMotion();
    this.createInteractionMarkers();
    this.createMira();
    this.createPlayer();
    this.createControls();

    if (isAdminMode() && new URLSearchParams(window.location.search).get("graphdebug") === "1") {
      this.drawCollisionOverlay();
    }

    this.cameras.main.startFollow(this.player, true, 0.11, 0.11);
    this.cameras.main.fadeIn(520, 8, 12, 17);
    this.installDebugApi();
    document.body.dataset.graphreachReady = "true";

    if (!hasIntroducedGraphreach && !isAdminMode()) {
      hasIntroducedGraphreach = true;
      this.time.delayedCall(650, () => {
        if (!isGraphreachScreenActive()) return;
        sayLines([
          { speaker: "", text: "Graphreach hangs over a ravine. Its bridges, roots, caves, and ruins still behave like one wounded route." },
          { speaker: "Mira Vale", text: "We can move through the whole space. Stay on the surviving paths, and inspect anything that still remembers being connected." },
        ]);
      });
    }
  }

  update(time, delta) {
    if (!isGraphreachScreenActive()) return;

    if (isDialogueActive()) {
      this.updatePlayerPresentation(time, false);
      return;
    }

    const horizontal = this.directionValue("right", "left", this.keys.D, this.keys.A, this.cursors.right, this.cursors.left);
    const vertical = this.directionValue("down", "up", this.keys.S, this.keys.W, this.cursors.down, this.cursors.up);
    const moving = horizontal !== 0 || vertical !== 0;

    if (moving) {
      const length = Math.hypot(horizontal, vertical) || 1;
      const frameDelta = Math.min(delta, 34) / 1000;
      const dx = (horizontal / length) * PLAYER_SPEED * frameDelta;
      const dy = (vertical / length) * PLAYER_SPEED * frameDelta;
      this.movePlayer(dx, dy);
      this.updateFacing(horizontal, vertical);
    }

    this.updatePlayerPresentation(time, moving);
    this.updateInteractionPrompt();
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ W: "W", A: "A", S: "S", D: "D" });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey.on("down", () => this.tryInteract());
    this.enterKey.on("down", () => this.tryInteract());
  }

  createPlayer() {
    this.playerShadow = this.add.ellipse(0, 2, 31, 13, 0x05070a, 0.54);
    this.playerSprite = this.add.image(0, -25, "patchrunner-east").setScale(PLAYER_SCALE);
    this.player = this.add.container(GRAPHREACH_SPAWN.x, GRAPHREACH_SPAWN.y, [this.playerShadow, this.playerSprite]);
    this.player.setDepth(this.player.y + 200);
  }

  createMira() {
    const shadow = this.add.ellipse(0, 2, 30, 12, 0x05070a, 0.5);
    const sprite = this.add.image(0, -25, "mira-south").setScale(1.12);
    this.mira = this.add.container(132, 1068, [shadow, sprite]).setDepth(1268);
    this.tweens.add({ targets: sprite, y: -28, duration: 1300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  createAmbientMotion() {
    this.ambientCounts = { grass: 0, water: 0, routeLights: 0, nullMotes: 0 };

    for (const [index, [x, y]] of GRAPHREACH_AMBIENCE.grass.entries()) {
      const tuft = this.add.rectangle(x, y, 3, 13, 0xa7b89b, 0.54).setOrigin(0.5, 1).setDepth(y - 2);
      this.tweens.add({
        targets: tuft,
        angle: index % 2 === 0 ? 8 : -8,
        scaleY: 0.82,
        duration: 950 + ((index % 4) * 170),
        delay: index * 80,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.ambientCounts.grass += 1;
    }

    const basinGlow = this.add.ellipse(959, 1011, 260, 142, 0x70c9c2, 0.045).setDepth(2);
    this.tweens.add({ targets: basinGlow, alpha: 0.12, scaleX: 0.96, duration: 1900, yoyo: true, repeat: -1 });
    this.ambientCounts.water += 1;
    for (let index = 0; index < 5; index += 1) {
      const streak = this.add.rectangle(1136 + (index * 8), 795 + (index * 19), 3, 42, 0x9adbd5, 0.34).setDepth(3);
      this.tweens.add({
        targets: streak,
        y: streak.y + 92,
        alpha: 0.04,
        duration: 920 + (index * 90),
        delay: index * 150,
        repeat: -1,
      });
      this.ambientCounts.water += 1;
    }

    for (const [index, [x, y]] of GRAPHREACH_AMBIENCE.routeLights.entries()) {
      const light = this.add.rectangle(x, y, 8, 8, 0x70c9c2, 0.68).setAngle(45).setDepth(y + 5);
      this.tweens.add({
        targets: light,
        alpha: 0.18,
        scale: 1.65,
        duration: 980 + (index * 170),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.ambientCounts.routeLights += 1;
    }

    for (const [index, [x, y]] of GRAPHREACH_AMBIENCE.nullMotes.entries()) {
      const mote = this.add.rectangle(x, y, 5 + (index % 2), 5, 0x633b86, 0.75).setDepth(y + 4);
      this.tweens.add({
        targets: mote,
        alpha: 0,
        x: x + (index % 2 === 0 ? 9 : -7),
        duration: 420 + (index * 55),
        yoyo: true,
        repeat: -1,
        ease: "Stepped",
      });
      this.ambientCounts.nullMotes += 1;
    }
  }

  createInteractionMarkers() {
    this.interactionMarkers = [];
    for (const [index, interaction] of GRAPHREACH_INTERACTIONS.entries()) {
      if (interaction.id === "mira") continue;
      const marker = this.add.rectangle(interaction.x, interaction.y - 18, 7, 7, 0xd8a04a, 0.72)
        .setAngle(45)
        .setDepth(interaction.y + 20);
      this.tweens.add({
        targets: marker,
        y: marker.y - 5,
        alpha: 0.28,
        duration: 760 + ((index % 3) * 120),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.interactionMarkers.push(marker);
    }
  }

  directionValue(positiveName, negativeName, positiveKey, negativeKey, positiveCursor, negativeCursor) {
    const positive = positiveKey.isDown || positiveCursor.isDown || virtualDirections.has(positiveName);
    const negative = negativeKey.isDown || negativeCursor.isDown || virtualDirections.has(negativeName);
    return (positive ? 1 : 0) - (negative ? 1 : 0);
  }

  movePlayer(dx, dy) {
    const nextX = this.player.x + dx;
    const nextY = this.player.y + dy;
    if (isGraphreachWalkable(nextX, this.player.y)) this.player.x = nextX;
    if (isGraphreachWalkable(this.player.x, nextY)) this.player.y = nextY;
    this.player.setDepth(this.player.y + 200);
  }

  updateFacing(horizontal, vertical) {
    if (Math.abs(horizontal) > Math.abs(vertical)) this.facing = horizontal > 0 ? "right" : "left";
    else if (vertical !== 0) this.facing = vertical > 0 ? "down" : "up";
    const texture = { up: "north", down: "south", left: "west", right: "east" }[this.facing];
    this.playerSprite.setTexture(`patchrunner-${texture}`);
  }

  updatePlayerPresentation(time, moving) {
    const bob = moving ? Math.sin(time / 74) * 2.2 : Math.sin(time / 420) * 0.8;
    this.playerSprite.y = -25 + bob;
    this.playerShadow.scaleX = moving ? 1.08 : 1;
    this.playerShadow.alpha = moving ? 0.42 : 0.54;
  }

  updateInteractionPrompt() {
    this.activeInteraction = nearestGraphreachInteraction(this.player.x, this.player.y);
    const prompt = document.getElementById("graphreach-interact-prompt");
    if (!prompt) return;
    if (!this.activeInteraction) {
      prompt.classList.add("hidden");
      prompt.textContent = "";
      return;
    }
    prompt.textContent = `Space / Enter  ·  ${this.activeInteraction.label}`;
    prompt.classList.remove("hidden");
  }

  tryInteract(forcedId = null) {
    if (isDialogueActive()) {
      advance();
      return;
    }
    const interaction = forcedId
      ? GRAPHREACH_INTERACTIONS.find((candidate) => candidate.id === forcedId)
      : nearestGraphreachInteraction(this.player.x, this.player.y);
    if (!interaction) return;

    sayLines(interaction.lines, () => {
      if (interaction.kind === "exit" && exitHandler) exitHandler();
    });
  }

  drawCollisionOverlay() {
    const graphics = this.add.graphics().setDepth(40);
    graphics.lineStyle(2, 0x80e2d1, 0.72);
    for (const corridor of GRAPHREACH_CORRIDORS) {
      graphics.lineStyle(corridor.radius * 2, 0x4be0c6, 0.13);
      graphics.beginPath();
      const [firstX, firstY] = corridor.points[0];
      graphics.moveTo(firstX, firstY);
      for (const [x, y] of corridor.points.slice(1)) graphics.lineTo(x, y);
      graphics.strokePath();
    }
    for (const area of GRAPHREACH_AREAS) {
      graphics.fillStyle(0xd8a04a, 0.13);
      if (area.circle) {
        graphics.fillCircle(area.circle[0], area.circle[1], area.circle[2]);
      } else {
        graphics.fillPoints(area.points.map(([x, y]) => new Phaser.Geom.Point(x, y)), true);
      }
    }
  }

  installDebugApi() {
    window.__graphreachDebug = {
      isWalkable: (x, y) => isGraphreachWalkable(x, y),
      routeProbes: GRAPHREACH_ROUTE_PROBES.map((point) => ({ ...point })),
      interactionIds: GRAPHREACH_INTERACTIONS.map((interaction) => interaction.id),
      teleport: (x, y) => {
        if (!isGraphreachWalkable(x, y)) return false;
        this.player.setPosition(x, y);
        this.player.setDepth(y + 200);
        this.updateInteractionPrompt();
        return true;
      },
      teleportToInteraction: (id) => {
        const interaction = GRAPHREACH_INTERACTIONS.find((candidate) => candidate.id === id);
        if (!interaction || !isGraphreachWalkable(interaction.x, interaction.y)) return false;
        this.player.setPosition(interaction.x, interaction.y);
        this.player.setDepth(interaction.y + 200);
        this.updateInteractionPrompt();
        return true;
      },
      interact: (id) => this.tryInteract(id),
      snapshot: () => ({
        ready: true,
        mapWidth: GRAPHREACH_WORLD.width,
        mapHeight: GRAPHREACH_WORLD.height,
        player: { x: Math.round(this.player.x), y: Math.round(this.player.y), facing: this.facing },
        activeInteraction: this.activeInteraction?.id || null,
        interactionCount: GRAPHREACH_INTERACTIONS.length,
        ambience: { ...this.ambientCounts },
      }),
    };
  }
}

function bindGraphreachDpad() {
  const dpad = document.getElementById("dpad-ch4");
  if (!dpad || dpad.dataset.graphreachBound === "true") return;
  dpad.dataset.graphreachBound = "true";

  for (const button of dpad.querySelectorAll("button[data-dir]")) {
    const direction = button.dataset.dir;
    if (direction === "interact") {
      button.addEventListener("click", () => activeScene?.tryInteract());
      continue;
    }
    const press = (event) => {
      event.preventDefault();
      virtualDirections.add(direction);
    };
    const release = (event) => {
      event.preventDefault();
      virtualDirections.delete(direction);
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }
}

function clearInteractionPrompt() {
  const prompt = document.getElementById("graphreach-interact-prompt");
  if (!prompt) return;
  prompt.textContent = "";
  prompt.classList.add("hidden");
}

function isGraphreachScreenActive() {
  return document.getElementById("screen-room-ch4")?.classList.contains("active") === true;
}
