import { applyPixelArt } from "./pixelart.js";
import { ARCHIVE_SHARD, GATE_ICON, GRAPH_NODE_ICON, LEDGER_ICON } from "./sprites.js";
import { animatePatchrunnerStep, placePatchrunnerEntity, updatePatchrunnerFacing } from "./playerSprite.js";
import { sayLines, isDialogueActive, advance as advanceDialogue } from "./dialogue.js";
import { getState, setState } from "./state.js";
import { fitRoomViewportToScreen } from "./viewportScale.js";

const LDtk_URL = "data/ldtk/chapter5_layout.ldtk";
const TILE = 32;
const START_LEVEL = "World_Level_1";
const ITEM_ICON_SCALE = 3;

let viewport;
let project = null;
let levels = [];
let levelById = new Map();
let currentLevel = null;
let collisions = [];
let player = { col: 2, row: 2, facing: "down" };
let playerEl;
let hasGreeted = false;
let loading = false;

export async function initChapter5Room() {
  viewport = document.getElementById("room-viewport-ch5");
  viewport.className = "room-viewport theme-ldtk-test";
  viewport.style.transformOrigin = "top center";
  await ensureProjectLoaded();
  const savedLevel = getState().ldtkChapter5Level || START_LEVEL;
  goToLevel(levelById.get(savedLevel) ? savedLevel : START_LEVEL, getState().ldtkChapter5Player || null);
  bindInput();

  if (!hasGreeted) {
    hasGreeted = true;
    window.setTimeout(() => {
      sayLines([
        { speaker: "", text: "Chapter 5 is loading an LDtk map directly. The tiles are still prototype-rendered, but the room shape comes from your upload." },
        { speaker: "Mira Vale", text: "If this works, the map editor becomes the source of truth instead of handwritten room arrays." },
      ]);
    }, 250);
  }
}

async function ensureProjectLoaded() {
  if (project || loading) return;
  loading = true;
  const response = await fetch(LDtk_URL);
  if (!response.ok) throw new Error(`Could not load ${LDtk_URL}`);
  project = await response.json();
  levels = project.levels || [];
  levelById = new Map(levels.map((level) => [level.identifier, level]));
  loading = false;
}

function goToLevel(identifier, start = null) {
  currentLevel = levelById.get(identifier) || levels[0];
  collisions = readCollisionGrid(currentLevel);
  player = start || inferStart(currentLevel);
  setState({
    ldtkChapter5Level: currentLevel.identifier,
    ldtkChapter5Player: player,
  });
  render();
}

function inferStart(level) {
  const preferred = level.identifier === START_LEVEL ? { col: 2, row: 2, facing: "down" } : null;
  if (preferred && !isBlocking(preferred.col, preferred.row)) return preferred;
  const componentStart = findPlayableComponentStart(level);
  if (componentStart) return componentStart;
  return { col: 0, row: 0, facing: "down" };
}

function findPlayableComponentStart(level) {
  const cols = levelCols(level);
  const rows = levelRows(level);
  const seen = new Set();
  const entities = findLayer(level, "Entities")?.entityInstances || [];
  const components = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const key = `${col},${row}`;
      if (seen.has(key) || collisions[row]?.[col] === 1) continue;
      const queue = [{ col, row }];
      const cells = new Set([key]);
      seen.add(key);
      for (let index = 0; index < queue.length; index += 1) {
        const current = queue[index];
        for (const { dc, dr } of Object.values(DIR_OFFSET)) {
          const next = { col: current.col + dc, row: current.row + dr };
          const nextKey = `${next.col},${next.row}`;
          if (next.col < 0 || next.row < 0 || next.col >= cols || next.row >= rows) continue;
          if (seen.has(nextKey) || collisions[next.row]?.[next.col] === 1) continue;
          seen.add(nextKey);
          cells.add(nextKey);
          queue.push(next);
        }
      }
      const touchesEntity = entities.some((entity) => {
        const [entityCol, entityRow] = gridOf(entity);
        return [{ dc: 0, dr: 0 }, ...Object.values(DIR_OFFSET)]
          .some(({ dc, dr }) => cells.has(`${entityCol + dc},${entityRow + dr}`));
      });
      components.push({ cells, touchesEntity });
    }
  }

  const component = components
    .sort((a, b) => Number(b.touchesEntity) - Number(a.touchesEntity) || b.cells.size - a.cells.size)[0];
  const first = component ? [...component.cells][0].split(",").map(Number) : null;
  return first ? { col: first[0], row: first[1], facing: "down" } : null;
}

function readCollisionGrid(level) {
  const layer = findLayer(level, "Collisions");
  const values = layer?.intGridCsv || [];
  const cols = levelCols(level);
  return Array.from({ length: levelRows(level) }, (_, row) =>
    Array.from({ length: cols }, (_, col) => values[row * cols + col] || 0)
  );
}

function render() {
  const cols = levelCols(currentLevel);
  const rows = levelRows(currentLevel);
  viewport.style.width = `${cols * TILE}px`;
  viewport.style.height = `${rows * TILE}px`;
  viewport.innerHTML = "";
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const tile = document.createElement("div");
      tile.className = `tile ${tileClass(col, row)}`;
      tile.style.left = `${col * TILE}px`;
      tile.style.top = `${row * TILE}px`;
      tile.style.width = `${TILE}px`;
      tile.style.height = `${TILE}px`;
      viewport.appendChild(tile);
    }
  }
  for (const entity of visibleEntities()) placeLdtkEntity(entity);
  playerEl = placePatchrunnerEntity(viewport, player.col, player.row, TILE, player.facing);
  fitViewportToScreen();
}

function tileClass(col, row) {
  const entity = visibleEntities().find((item) => gridOf(item)[0] === col && gridOf(item)[1] === row);
  if (entity?.__identifier === "SecretWall") return "tile-secret-door";
  if (collisions[row]?.[col] === 1) return "tile-wall";
  const edge = row === 0 || col === 0 || row === levelRows(currentLevel) - 1 || col === levelCols(currentLevel) - 1;
  return `tile-floor${edge ? " ldtk-edge" : (row + col) % 2 === 0 ? "" : " alt"}`;
}

function visibleEntities() {
  const collected = new Set(getState().ldtkChapter5Items || []);
  const openedSecrets = new Set(getState().ldtkChapter5Secrets || []);
  return (findLayer(currentLevel, "Entities")?.entityInstances || []).filter((entity) => {
    if (entity.__identifier === "Item" && collected.has(entity.iid)) return false;
    if (entity.__identifier === "SecretWall" && openedSecrets.has(entity.iid)) return false;
    return true;
  });
}

function placeLdtkEntity(entity) {
  const [col, row] = gridOf(entity);
  const el = document.createElement("div");
  el.className = `entity ldtk-entity ldtk-${entity.__identifier.toLowerCase()}`;
  el.dataset.entity = entity.iid;
  el.style.width = `${TILE}px`;
  el.style.height = `${TILE}px`;
  el.style.left = `${col * TILE}px`;
  el.style.top = `${row * TILE}px`;

  if (entity.__identifier === "Door") appendIcon(el, GATE_ICON, isDoorLocked(entity));
  else if (entity.__identifier === "Button") appendIcon(el, GRAPH_NODE_ICON, false);
  else if (entity.__identifier === "Item") appendItemIcon(el, entity);
  else if (entity.__identifier === "SecretWall") appendIcon(el, LEDGER_ICON, true);
  viewport.appendChild(el);
}

function appendIcon(host, sprite, muted) {
  const inner = document.createElement("div");
  applyPixelArt(inner, sprite.matrix, sprite.palette, ITEM_ICON_SCALE);
  if (muted) inner.style.opacity = "0.55";
  host.appendChild(inner);
}

function appendItemIcon(host, entity) {
  const type = fieldValue(entity, "type") || "Item";
  if (type === "KeyA" || type === "KeyB") appendIcon(host, GATE_ICON, false);
  else if (type === "Gold") appendIcon(host, ARCHIVE_SHARD, false);
  else appendIcon(host, LEDGER_ICON, false);
  const badge = document.createElement("span");
  badge.className = "ldtk-item-badge";
  badge.textContent = type.replace("Key", "K");
  host.appendChild(badge);
}

function tileAtEntity(col, row) {
  return visibleEntities().find((entity) => {
    const [entityCol, entityRow] = gridOf(entity);
    return entityCol === col && entityRow === row;
  });
}

function isBlocking(col, row) {
  if (row < 0 || row >= levelRows(currentLevel) || col < 0 || col >= levelCols(currentLevel)) return true;
  if (collisions[row]?.[col] === 1) return true;
  const entity = tileAtEntity(col, row);
  return entity?.__identifier === "SecretWall";
}

const DIR_OFFSET = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};

function tryMove(dir) {
  if (isDialogueActive()) return;
  player.facing = dir;
  updatePatchrunnerFacing(playerEl, player.facing);
  const { dc, dr } = DIR_OFFSET[dir];
  const targetCol = player.col + dc;
  const targetRow = player.row + dr;
  const entity = tileAtEntity(targetCol, targetRow);
  if (entity && handleEntity(entity, dir)) return;
  if (isBlocking(targetCol, targetRow)) return;
  player.col = targetCol;
  player.row = targetRow;
  persistPlayer();
  if (playerEl) {
    playerEl.style.left = `${player.col * TILE}px`;
    playerEl.style.top = `${player.row * TILE}px`;
    animatePatchrunnerStep(playerEl);
  }
}

function interactFacing() {
  const { dc, dr } = DIR_OFFSET[player.facing];
  const entity = tileAtEntity(player.col + dc, player.row + dr);
  if (entity) handleEntity(entity, player.facing);
}

function handleEntity(entity, dir) {
  if (entity.__identifier === "Door") {
    enterDoor(entity, dir);
    return true;
  }
  if (entity.__identifier === "Item") {
    collectItem(entity);
    return true;
  }
  if (entity.__identifier === "Button") {
    pressButton(entity);
    return true;
  }
  if (entity.__identifier === "SecretWall") {
    sayLines([{ speaker: "", text: "The secret wall holds until a linked LDtk button flips it open." }]);
    return true;
  }
  return false;
}

function enterDoor(entity, dir) {
  const lockedWith = fieldValue(entity, "lockedWith");
  if (lockedWith && !(getState().ldtkChapter5Inventory || []).includes(lockedWith)) {
    sayLines([{ speaker: "", text: `The LDtk door is locked with ${lockedWith}.` }]);
    return;
  }
  const destination = findNeighborLevel(currentLevel, entity, dir);
  if (!destination) {
    sayLines([{ speaker: "", text: "This LDtk door is valid, but no neighboring level is positioned behind it yet." }]);
    return;
  }
  goToLevel(destination.identifier, spawnForArrival(destination, opposite(dir)));
}

function findNeighborLevel(level, entity, dir) {
  const [col, row] = gridOf(entity);
  const centerCol = (level.__cWid - 1) / 2;
  const centerRow = (level.__cHei - 1) / 2;
  let direction = dir;
  if (entity.__grid) {
    const horizontalBias = Math.abs(col - centerCol);
    const verticalBias = Math.abs(row - centerRow);
    if (horizontalBias > verticalBias) direction = col < centerCol ? "left" : "right";
    else direction = row < centerRow ? "up" : "down";
  }

  const candidates = levels.filter((other) => other.identifier !== level.identifier);
  if (direction === "right") return candidates.find((other) => other.worldX === level.worldX + level.pxWid && rangesOverlap(level.worldY, level.worldY + level.pxHei, other.worldY, other.worldY + other.pxHei));
  if (direction === "left") return candidates.find((other) => other.worldX + other.pxWid === level.worldX && rangesOverlap(level.worldY, level.worldY + level.pxHei, other.worldY, other.worldY + other.pxHei));
  if (direction === "down") return candidates.find((other) => other.worldY === level.worldY + level.pxHei && rangesOverlap(level.worldX, level.worldX + level.pxWid, other.worldX, other.worldX + other.pxWid));
  if (direction === "up") return candidates.find((other) => other.worldY + other.pxHei === level.worldY && rangesOverlap(level.worldX, level.worldX + level.pxWid, other.worldX, other.worldX + other.pxWid));
  return null;
}

function spawnForArrival(level, fromDirection) {
  const doors = (findLayer(level, "Entities")?.entityInstances || []).filter((entity) => entity.__identifier === "Door");
  const sorted = doors
    .map((door) => ({ door, grid: gridOf(door) }))
    .sort((a, b) => edgeScore(a.grid, level, fromDirection) - edgeScore(b.grid, level, fromDirection));
  const door = sorted[0]?.door;
  if (!door) return inferStart(level);
  const [col, row] = gridOf(door);
  const offset = DIR_OFFSET[opposite(fromDirection)];
  return {
    col: Math.max(0, Math.min(levelCols(level) - 1, col + offset.dc)),
    row: Math.max(0, Math.min(levelRows(level) - 1, row + offset.dr)),
    facing: opposite(fromDirection),
  };
}

function edgeScore([col, row], level, direction) {
  if (direction === "left") return col;
  if (direction === "right") return levelCols(level) - col;
  if (direction === "up") return row;
  return levelRows(level) - row;
}

function collectItem(entity) {
  const type = fieldValue(entity, "type") || "Item";
  const collected = new Set(getState().ldtkChapter5Items || []);
  const inventory = new Set(getState().ldtkChapter5Inventory || []);
  collected.add(entity.iid);
  inventory.add(type);
  setState({
    ldtkChapter5Items: [...collected],
    ldtkChapter5Inventory: [...inventory],
  });
  render();
  sayLines([{ speaker: "", text: `Collected LDtk ${type}. Inventory: ${[...inventory].join(", ")}.` }]);
}

function pressButton(entity) {
  const opened = new Set(getState().ldtkChapter5Secrets || []);
  const secretWalls = (findLayer(currentLevel, "Entities")?.entityInstances || []).filter((item) => item.__identifier === "SecretWall");
  for (const wall of secretWalls) opened.add(wall.iid);
  setState({ ldtkChapter5Secrets: [...opened] });
  render();
  sayLines([
    { speaker: "", text: "The LDtk button opens the secret wall in this room." },
    { speaker: "Mira Vale", text: "That one came straight from entity data. Good sign." },
  ]);
}

function persistPlayer() {
  setState({
    ldtkChapter5Level: currentLevel.identifier,
    ldtkChapter5Player: player,
  });
}

function fitViewportToScreen() {
  fitRoomViewportToScreen(viewport, levelCols(currentLevel), levelRows(currentLevel), TILE);
}

function bindInput() {
  document.removeEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown);
  const dpad = document.getElementById("dpad-ch5");
  dpad.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => handleDirAction(btn.dataset.dir);
  });
}

function handleDirAction(dir) {
  if (document.getElementById("screen-room-ch5").classList.contains("active") === false) return;
  if (dir === "interact") {
    if (isDialogueActive()) advanceDialogue();
    else interactFacing();
    return;
  }
  if (isDialogueActive()) return;
  tryMove(dir);
}

function onKeyDown(e) {
  if (document.getElementById("screen-room-ch5").classList.contains("active") === false) return;
  const keyDirs = {
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
  };
  if (keyDirs[e.code]) {
    e.preventDefault();
    if (!isDialogueActive()) tryMove(keyDirs[e.code]);
    return;
  }
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    if (isDialogueActive()) advanceDialogue();
    else interactFacing();
  }
}

function findLayer(level, identifier) {
  return level.layerInstances?.find((layer) => layer.__identifier === identifier);
}

function levelCols(level) {
  return findLayer(level, "Collisions")?.__cWid || Math.floor(level.pxWid / (project?.defaultGridSize || 16));
}

function levelRows(level) {
  return findLayer(level, "Collisions")?.__cHei || Math.floor(level.pxHei / (project?.defaultGridSize || 16));
}

function gridOf(entity) {
  return entity.__grid || [Math.floor(entity.px[0] / 16), Math.floor(entity.px[1] / 16)];
}

function fieldValue(entity, identifier) {
  return entity.fieldInstances?.find((field) => field.__identifier === identifier)?.__value ?? null;
}

function isDoorLocked(entity) {
  const lockedWith = fieldValue(entity, "lockedWith");
  return Boolean(lockedWith && !(getState().ldtkChapter5Inventory || []).includes(lockedWith));
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

function opposite(dir) {
  return { up: "down", down: "up", left: "right", right: "left" }[dir] || "down";
}
