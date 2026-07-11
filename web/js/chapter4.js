import { applyPixelArt } from "./pixelart.js";
import { BRIDGE_ICON, BRIDGE_WISP, COMPONENT_HERMIT, CYCLE_HOUND, GATE_ICON, GRAPH_NODE_ICON, NULL_FERRYMAN, PIXEL_SIZE as SPRITE_PX } from "./sprites.js";
import { animatePatchrunnerStep, placePatchrunnerEntity, updatePatchrunnerFacing } from "./playerSprite.js";
import { sayLines, isDialogueActive, advance as advanceDialogue } from "./dialogue.js";
import { getState, setState } from "./state.js";
import { startTicketBattle } from "./ticketBattle.js";
import { startCodeBattle } from "./codeBattle.js";
import { fitRoomViewportToScreen } from "./viewportScale.js";

export const TILE = 42;
const COLS = 13;
const ROWS = 10;

const FLOOR = 0;
const WALL = 1;
const CLUTTER = 2;
const CLOSED_GATE = 3;
const BRIDGE_WISP_CODE = 5;
const ROUTE_DOOR = 6;
const CYCLE_HOUND_CODE = 7;
const LORE = 8;
const NULL_FERRYMAN_CODE = 9;
const NULL_ROT = 10;
const COMPONENT_HERMIT_CODE = 11;
const SIDE_DOOR = 12;
const RETURN_DOOR = 13;
const ANCHOR = 14;
const SECRET_DOOR = 17;
const BRIDGE_TILE = 18;
const CHASM = 19;
const CAVE = 20;
const ROOT = 21;
const WATER = 22;
const WITNESS_DIAMOND = 23;
const RECURSIVE_HUSK_CODE = 24;
const NULL_WITNESS_CODE = 25;

const RECURSIVE_HUSK_IMAGE = "assets/characters/recursive-husk/recursive-husk-92.png";
const DIAMOND_TOTAL = 3;

const ROOM_BRIDGEHEAD = 0;
const ROOM_CROSSING = 1;
const ROOM_CHAPEL = 2;
const ROOM_BOSS = 3;
const ROOM_SECRET = 4;

const ROOM_STARTS = [
  { col: 6, row: 8, facing: "up" },
  { col: 6, row: 8, facing: "up" },
  { col: 1, row: 3, facing: "right" },
  { col: 1, row: 5, facing: "right" },
  { col: 11, row: 5, facing: "left" },
];

const ROOM_MAPS = [
  [
    [1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1],
    [1, 21, 21, 19, 0, 18, 18, 18, 0, 19, 21, 21, 1],
    [1, 21, 0, 0, 0, 18, 2, 18, 0, 0, 0, 21, 1],
    [1, 0, 19, 5, 0, 18, 0, 18, 0, 7, 0, 0, 12],
    [1, 0, 0, 0, 21, 18, 8, 18, 21, 0, 0, 19, 1],
    [1, 22, 19, 0, 0, 18, 0, 18, 0, 0, 19, 22, 1],
    [17, 0, 0, 0, 19, 18, 23, 18, 19, 0, 0, 0, 1],
    [1, 22, 22, 0, 0, 18, 0, 18, 0, 0, 22, 22, 1],
    [1, 1, 21, 21, 0, 18, 0, 18, 0, 21, 21, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 19, 10, 0, 0, 18, 14, 18, 0, 0, 10, 19, 1],
    [1, 19, 0, 2, 0, 18, 0, 18, 0, 2, 0, 19, 1],
    [1, 0, 0, 19, 0, 18, 0, 18, 0, 19, 14, 0, 1],
    [1, 0, 10, 0, 14, 18, 8, 18, 0, 0, 0, 0, 3],
    [1, 0, 0, 19, 0, 18, 0, 18, 0, 19, 0, 0, 1],
    [1, 19, 0, 2, 0, 18, 24, 18, 0, 2, 0, 19, 1],
    [1, 19, 10, 0, 0, 18, 0, 18, 23, 0, 10, 19, 1],
    [1, 1, 19, 0, 0, 18, 0, 18, 0, 0, 19, 1, 1],
    [1, 1, 1, 1, 1, 1, 13, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 20, 20, 2, 0, 8, 0, 2, 0, 20, 20, 1, 1],
    [1, 20, 0, 0, 0, 0, 11, 0, 0, 2, 20, 20, 1],
    [13, 0, 0, 20, 2, 0, 0, 0, 2, 0, 8, 20, 1],
    [1, 20, 0, 0, 0, 2, 0, 2, 0, 0, 0, 20, 1],
    [1, 20, 2, 0, 8, 0, 0, 0, 0, 2, 0, 1, 1],
    [1, 1, 20, 0, 0, 0, 2, 0, 0, 20, 20, 1, 1],
    [1, 1, 20, 20, 0, 0, 23, 0, 20, 20, 1, 1, 1],
    [1, 1, 1, 20, 20, 0, 0, 20, 20, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1],
    [1, 19, 10, 0, 2, 18, 18, 18, 2, 0, 10, 19, 1],
    [1, 0, 2, 0, 10, 18, 9, 18, 10, 0, 2, 0, 1],
    [1, 0, 0, 2, 0, 18, 0, 18, 0, 2, 0, 0, 1],
    [1, 2, 0, 0, 2, 18, 10, 18, 2, 0, 0, 2, 1],
    [13, 0, 0, 10, 0, 18, 0, 18, 0, 10, 0, 0, 1],
    [1, 0, 2, 0, 0, 18, 0, 18, 0, 2, 0, 0, 1],
    [1, 19, 0, 0, 2, 18, 8, 18, 2, 0, 19, 0, 1],
    [1, 1, 19, 0, 0, 18, 0, 18, 0, 19, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 10, 10, 19, 1, 1, 1, 19, 10, 10, 10, 1, 1],
    [1, 10, 0, 0, 0, 19, 0, 0, 0, 19, 10, 10, 1],
    [1, 19, 0, 8, 0, 0, 0, 2, 0, 0, 0, 10, 1],
    [1, 10, 0, 0, 2, 10, 0, 0, 0, 19, 0, 0, 1],
    [1, 10, 10, 0, 0, 0, 0, 10, 25, 0, 0, 13, 1],
    [1, 1, 10, 19, 0, 0, 2, 0, 0, 19, 10, 10, 1],
    [1, 1, 10, 10, 0, 19, 0, 0, 10, 10, 10, 1, 1],
    [1, 1, 1, 10, 10, 10, 19, 10, 10, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
];

let viewport;
let map;
let roomIndex = ROOM_BRIDGEHEAD;
let player = { ...ROOM_STARTS[ROOM_BRIDGEHEAD] };
let playerEl;
let hasGreeted = false;
let onExitToChapter5 = null;
let touchedAnchors = new Set();

function graphNode(id, depth, branch) {
  return { id, depth, branch };
}

function solveGraphOrder(nodes) {
  return nodes.slice()
    .sort((a, b) => (a.depth - b.depth) || (a.branch - b.branch))
    .map((node) => node.id);
}

function randomSealedNodes(count) {
  const letters = ["A", "B", "C", "D", "E", "F", "G"];
  const list = Array.from({ length: count }, (_, i) => graphNode(letters[i], Math.floor(i / 2), i % 2));
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function profitCase(name, values) {
  let low = values[0] || 0;
  let best = 0;
  for (const value of values) {
    if (value < low) low = value;
    const gain = value - low;
    if (gain > best) best = gain;
  }
  return { name, input: values, expected: best };
}

function jumpCase(name, values) {
  let reach = 0;
  for (let i = 0; i < values.length; i++) {
    if (i > reach) return { name, input: values, expected: false };
    const nextReach = i + values[i];
    if (nextReach > reach) reach = nextReach;
  }
  return { name, input: values, expected: true };
}

export function initChapter4Room({ onExitToChapter5: exitHandler } = {}) {
  onExitToChapter5 = exitHandler || null;
  viewport = document.getElementById("room-viewport-ch4");
  viewport.className = "room-viewport theme-graphreach";
  viewport.style.width = `${COLS * TILE}px`;
  viewport.style.height = `${ROWS * TILE}px`;
  viewport.style.transformOrigin = "top center";
  fitViewportToScreen();
  window.removeEventListener("resize", fitViewportToScreen);
  window.addEventListener("resize", fitViewportToScreen);
  touchedAnchors = new Set();
  goToRoom(ROOM_BRIDGEHEAD, ROOM_STARTS[ROOM_BRIDGEHEAD], null);
  bindInput();

  if (!hasGreeted) {
    hasGreeted = true;
    window.setTimeout(() => {
      sayLines([
        { speaker: "", text: "Graphreach hangs over a broken ravine: bridges, roots, caves, and paths that only exist when enough nodes agree." },
        { speaker: "Mira Vale", text: "After Bogo, the problem is not order inside a list. It is whether one place can still reach another." },
      ]);
    }, 250);
  }
}

function buildCurrentMap() {
  const next = ROOM_MAPS[roomIndex].map((row) => row.slice());
  const state = getState();
  if (state.bridgeWispCleared) clearCode(next, BRIDGE_WISP_CODE);
  if (state.cycleHoundCleared) clearCode(next, CYCLE_HOUND_CODE);
  if (state.recursiveHuskCleared) clearCode(next, RECURSIVE_HUSK_CODE);
  if (state.componentHermitCleared) clearCode(next, COMPONENT_HERMIT_CODE);
  if (state.nullWitnessDefeated) clearCode(next, NULL_WITNESS_CODE);
  if (state.nullFerrymanDefeated) clearCode(next, NULL_FERRYMAN_CODE);
  clearCollectedDiamonds(next, state.graphDiamonds || []);
  if (roomIndex === ROOM_BRIDGEHEAD && !allDiamondsCollected(state)) next[6][0] = WALL;
  if (roomIndex === ROOM_BRIDGEHEAD && state.bridgeWispCleared && state.cycleHoundCleared) openNorthGate(next);
  if (roomIndex === ROOM_CROSSING && state.bridgeAnchorsAligned) openEastGate(next);
  if (roomIndex === ROOM_BOSS && state.nullFerrymanDefeated) openNorthGate(next);
  return next;
}

function openNorthGate(targetMap) {
  targetMap[0][5] = ROUTE_DOOR;
  targetMap[0][6] = ROUTE_DOOR;
  targetMap[0][7] = ROUTE_DOOR;
}

function openEastGate(targetMap) {
  targetMap[4][12] = ROUTE_DOOR;
}

function clearCode(targetMap, code) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (targetMap[r][c] === code) targetMap[r][c] = FLOOR;
    }
  }
}

function clearCollectedDiamonds(targetMap, collected) {
  const collectedSet = new Set(collected);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (targetMap[r][c] === WITNESS_DIAMOND && collectedSet.has(diamondKey(roomIndex, c, r))) {
        targetMap[r][c] = FLOOR;
      }
    }
  }
}

function diamondKey(room, col, row) {
  return `${room}:${col},${row}`;
}

function allDiamondsCollected(state = getState()) {
  return ((state.graphDiamonds || []).length >= DIAMOND_TOTAL);
}

function goToRoom(nextRoom, start, lines) {
  roomIndex = nextRoom;
  map = buildCurrentMap();
  player = { ...start };
  render();
  if (lines) sayLines(lines);
}

function fitViewportToScreen() {
  fitRoomViewportToScreen(viewport, COLS, ROWS, TILE);
}

function render() {
  viewport.innerHTML = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const code = map[r][c];
      const tile = document.createElement("div");
      tile.className = "tile " + tileClass(code, r, c);
      tile.style.left = `${c * TILE}px`;
      tile.style.top = `${r * TILE}px`;
      tile.style.width = `${TILE}px`;
      tile.style.height = `${TILE}px`;
      if (code === CLOSED_GATE || code === ROUTE_DOOR || code === SIDE_DOOR || code === RETURN_DOOR) {
        appendIcon(tile, GATE_ICON, code !== CLOSED_GATE);
      } else if (code === CLUTTER || code === LORE || code === ANCHOR) {
        appendIcon(tile, code === ANCHOR ? GRAPH_NODE_ICON : BRIDGE_ICON, code === LORE);
      }
      viewport.appendChild(tile);
    }
  }

  placeCodeEntity("bridge-wisp", BRIDGE_WISP_CODE, BRIDGE_WISP, SPRITE_PX);
  placeCodeEntity("cycle-hound", CYCLE_HOUND_CODE, CYCLE_HOUND, SPRITE_PX);
  placeRecursiveHuskEntity("recursive-husk", RECURSIVE_HUSK_CODE, "recursive-husk-map-sprite");
  placeCodeEntity("component-hermit", COMPONENT_HERMIT_CODE, COMPONENT_HERMIT, SPRITE_PX);
  placeCodeEntity("null-ferryman", NULL_FERRYMAN_CODE, NULL_FERRYMAN, 5);
  placeRecursiveHuskEntity("null-witness", NULL_WITNESS_CODE, "recursive-husk-map-sprite secret-boss-map-sprite");
  playerEl = placePatchrunnerEntity(viewport, player.col, player.row, TILE, player.facing);
}

function placeCodeEntity(id, code, sprite, pixelSize) {
  const pos = findCode(code);
  if (pos) placeEntity(id, pos.col, pos.row, sprite, pixelSize);
}

function placeRecursiveHuskEntity(id, code, className) {
  const pos = findCode(code);
  if (!pos) return;
  let el = viewport.querySelector(`[data-entity="${id}"]`);
  if (!el) {
    el = document.createElement("div");
    el.className = "entity recursive-husk-entity";
    el.dataset.entity = id;
    viewport.appendChild(el);
    const img = document.createElement("img");
    img.className = className;
    img.alt = "";
    img.draggable = false;
    img.src = RECURSIVE_HUSK_IMAGE;
    el.appendChild(img);
  }
  el.style.width = `${TILE}px`;
  el.style.height = `${TILE}px`;
  el.style.left = `${pos.col * TILE}px`;
  el.style.top = `${pos.row * TILE}px`;
}

function tileClass(code, r, c) {
  if (code === WALL) return "tile-wall";
  if (code === CLOSED_GATE) return "tile-gate";
  if (code === ROUTE_DOOR || code === SIDE_DOOR || code === RETURN_DOOR) return "tile-gate open";
  if (code === SECRET_DOOR) return "tile-secret-door";
  if (code === NULL_ROT) return "tile-null-rot";
  if (code === BRIDGE_TILE) return "tile-bridge";
  if (code === CHASM) return "tile-chasm";
  if (code === CAVE) return "tile-cave";
  if (code === ROOT) return "tile-root";
  if (code === WATER) return "tile-water";
  if (code === ANCHOR) return "tile-anchor";
  if (code === WITNESS_DIAMOND) return "tile-diamond";
  if (code === CLUTTER || code === LORE) return "tile-ledger";
  return "tile-floor" + ((r + c) % 2 === 0 ? "" : " alt");
}

function appendIcon(tile, sprite, muted) {
  const wrap = document.createElement("div");
  wrap.className = "tile-icon-wrap";
  const el = document.createElement("div");
  applyPixelArt(el, sprite.matrix, sprite.palette, 3);
  if (muted) el.style.opacity = "0.35";
  wrap.appendChild(el);
  tile.appendChild(wrap);
}

function placeEntity(id, col, row, sprite, pixelSize) {
  let el = viewport.querySelector(`[data-entity="${id}"]`);
  if (!el) {
    el = document.createElement("div");
    el.className = "entity";
    el.dataset.entity = id;
    viewport.appendChild(el);
    const inner = document.createElement("div");
    applyPixelArt(inner, sprite.matrix, sprite.palette, pixelSize);
    el.appendChild(inner);
  }
  el.style.width = `${TILE}px`;
  el.style.height = `${TILE}px`;
  el.style.left = `${col * TILE}px`;
  el.style.top = `${row * TILE}px`;
  return el;
}

function tileAt(col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return WALL;
  return map[row][col];
}

function findCode(code) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (map[row][col] === code) return { col, row };
    }
  }
  return null;
}

function isBlocking(code) {
  return code === WALL || code === CLUTTER || code === CLOSED_GATE || code === LORE || code === NULL_ROT ||
    code === ANCHOR || code === SECRET_DOOR || code === CHASM || code === CAVE || code === ROOT || code === WATER ||
    code === BRIDGE_WISP_CODE || code === CYCLE_HOUND_CODE || code === RECURSIVE_HUSK_CODE ||
    code === COMPONENT_HERMIT_CODE || code === NULL_FERRYMAN_CODE || code === NULL_WITNESS_CODE;
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
  const code = tileAt(targetCol, targetRow);
  if (handleSpecialTile(code, targetCol, targetRow)) return;
  if (isBlocking(code)) return;

  player.col = targetCol;
  player.row = targetRow;
  if (playerEl) {
    playerEl.style.left = `${player.col * TILE}px`;
    playerEl.style.top = `${player.row * TILE}px`;
    animatePatchrunnerStep(playerEl);
  }
}

function handleSpecialTile(code, col, row) {
  if (code === BRIDGE_WISP_CODE) return enterBridgeWispBattle(), true;
  if (code === CYCLE_HOUND_CODE) return enterCycleHoundBattle(), true;
  if (code === RECURSIVE_HUSK_CODE) return enterRecursiveHuskBattle(), true;
  if (code === COMPONENT_HERMIT_CODE) return enterComponentHermitBattle(), true;
  if (code === NULL_FERRYMAN_CODE) return enterNullFerrymanBattle(), true;
  if (code === NULL_WITNESS_CODE) return enterNullWitnessBattle(), true;
  if (code === WITNESS_DIAMOND) return collectWitnessDiamond(col, row), true;
  if (code === LORE) return inspectLore(), true;
  if (code === ANCHOR) return alignBridgeAnchor(col, row), true;
  if (code === ROUTE_DOOR) return onReachRouteDoor(), true;
  if (code === SIDE_DOOR) return onReachSideDoor(), true;
  if (code === SECRET_DOOR) return onReachSecretDoor(), true;
  if (code === RETURN_DOOR) return onReachReturnDoor(), true;
  return false;
}

function collectWitnessDiamond(col, row) {
  const key = diamondKey(roomIndex, col, row);
  const collected = getState().graphDiamonds || [];
  if (collected.includes(key)) return;
  const next = [...collected, key];
  setState({ graphDiamonds: next });
  map[row][col] = FLOOR;
  map = buildCurrentMap();
  render();
  if (next.length >= DIAMOND_TOTAL) {
    sayLines([
      { speaker: "", text: "The third witness diamond clicks without touching anything." },
      { speaker: "The dark", text: "A wall near the beginning remembers it was a door." },
      { speaker: "Mira Vale", text: "Backtrack. Carefully. That sentence sounded too pleased with itself." },
    ]);
    return;
  }
  sayLines([
    { speaker: "", text: `Witness diamond ${next.length}/${DIAMOND_TOTAL} recovered. It feels less like treasure than testimony.` },
  ]);
}

const GRAPH_BATTLE_TEXT = {
  objective: "Build a reachable traversal order: shallower nodes before deeper nodes, left branch before right branch.",
  roundHint1: "Click nodes in breadth-first repair order: depth first, then branch.",
  roundHint2: "Fresh hidden graph. Keep the traversal policy, not the visible letters.",
  wrongPublicHint: "Not quite. Reach nearer nodes first; ties go left branch before right branch.",
  wrongSealedHint: "The first route held, but a fresh graph exposed a memorized path.",
  wonPublicHint: "Traversal order holds. Now prove it on a fresh graph.",
  wonHint: "Reachability confirmed. The bridge accepts the traversal.",
  incompletePickHint: "Every reachable node needs a place in the traversal.",
  flagLabel: (node) => `D${node.depth}.${node.branch}`,
  flagClass: (node) => node.depth >= 2,
  solve: solveGraphOrder,
  generateSealed: randomSealedNodes,
};

function enterBridgeWispBattle() {
  sayLines(
    [{ speaker: "", text: "A Bridge Wisp lights nodes in the wrong order, making near crossings look far away." }],
    () => startGraphBattle({
      title: "Bridge Wisp",
      publicTickets: [graphNode("A", 0, 0), graphNode("B", 1, 0), graphNode("C", 1, 1), graphNode("D", 2, 0)],
      sealedCount: 4,
      enemySprite: BRIDGE_WISP,
      clearFlag: "bridgeWispCleared",
      clearCodeValue: BRIDGE_WISP_CODE,
      winLines: [
        { speaker: "Mira Vale", text: "Good. The bridge cares about reach, not how dramatic the light looks." },
        { speaker: "", text: "A span ahead remembers which side connects first." },
      ],
    })
  );
}

function enterCycleHoundBattle() {
  sayLines(
    [{ speaker: "", text: "A Cycle Hound chases its own trail until every path looks like the same path." }],
    () => startGraphBattle({
      title: "Cycle Hound",
      publicTickets: [graphNode("A", 0, 0), graphNode("B", 1, 1), graphNode("C", 1, 0), graphNode("D", 2, 1), graphNode("E", 2, 0)],
      sealedCount: 5,
      enemySprite: CYCLE_HOUND,
      clearFlag: "cycleHoundCleared",
      clearCodeValue: CYCLE_HOUND_CODE,
      roundHint1: "Cycles waste time. Visit by depth, left branch before right branch, and do not chase noise.",
      winLines: [
        { speaker: "Mira Vale", text: "That loop wanted us to confuse movement with progress." },
        { speaker: "", text: "The hound's trail folds into one clear crossing." },
      ],
    })
  );
}

function enterRecursiveHuskBattle() {
  sayLines(
    [
      { speaker: "", text: "The crossing pinches inward. A hollow thing blocks the bridge, its chest full of smaller versions of itself." },
      { speaker: "Mira Vale", text: "Recursive Husk. It tried to repair itself by going deeper. Now it only accepts proofs that move forward." },
    ],
    () => {
      startCodeBattle({
        title: "Recursive Husk",
        starterCode: `def solve(values):
    low = values[0]
    best = 0
    # Return the best profit from one buy before one sell.
    return best`,
        objective: "Find the maximum one-pass profit. This mini-boss punishes quadratic wandering.",
        publicCases: [profitCase("visible_prices", [7, 1, 5, 3, 6, 4])],
        generateSealed: () => [profitCase("sealed_falling", [7, 6, 4, 3, 1]), profitCase("sealed_late_peak", [2, 4, 1, 9, 3])],
        enemyImage: RECURSIVE_HUSK_IMAGE,
        enemyImageClass: "recursive-husk-battle-sprite",
        returnScreen: "screen-room-ch4",
        roundHint1: "Scan prices left to right. Track the lowest seen price and the best later profit.",
        roundHint2: "Fresh prices. Keep the one-pass invariant; do not search every pair.",
        wonHint: "The husk finds one forward edge and stops folding inward.",
        shortcutBlockMessage: "No shortcut sorting here. This is a scan problem: buy before sell.",
        onWin: () => {
          setState({ recursiveHuskCleared: true });
          clearCode(map, RECURSIVE_HUSK_CODE);
          map = buildCurrentMap();
          render();
          sayLines([
            { speaker: "", text: "The hollow body opens like a bridge knot coming loose." },
            { speaker: "Mira Vale", text: "That was not just harder. It was different. Good. Graphreach should demand more than ordering." },
          ]);
        },
      });
    }
  );
}

function enterComponentHermitBattle() {
  sayLines(
    [
      { speaker: "Component Hermit", text: "People call a piece isolated when they are tired of walking to it." },
      { speaker: "Mira Vale", text: "Optional, but this person has seen Graphreach before the bridges broke." },
    ],
    () => startGraphBattle({
      title: "Component Hermit",
      publicTickets: [graphNode("A", 0, 0), graphNode("B", 1, 0), graphNode("C", 2, 0), graphNode("D", 2, 1)],
      sealedCount: 4,
      enemySprite: COMPONENT_HERMIT,
      clearFlag: "componentHermitCleared",
      clearCodeValue: COMPONENT_HERMIT_CODE,
      wonHint: "The hermit's isolated component agrees to be mapped.",
      winLines: [
        { speaker: "Component Hermit", text: "Disconnected is not dead. It is waiting for an honest bridge." },
        { speaker: "", text: "A chapel ledger updates itself: 'Some missing routes were removed by policy, not disaster.'" },
      ],
    })
  );
}

function startGraphBattle({ title, publicTickets, sealedCount, enemySprite, clearFlag, clearCodeValue, roundHint1, wonHint, winLines }) {
  startTicketBattle({
    title,
    publicTickets,
    sealedCount,
    enemySprite,
    enemyPixelSize: 6,
    returnScreen: "screen-room-ch4",
    ...GRAPH_BATTLE_TEXT,
    ...(roundHint1 ? { roundHint1 } : {}),
    ...(wonHint ? { wonHint } : {}),
    onWin: () => {
      setState({ [clearFlag]: true });
      clearCode(map, clearCodeValue);
      map = buildCurrentMap();
      render();
      sayLines(winLines);
    },
  });
}

function enterNullFerrymanBattle() {
  const { nullFerrymanDefeated, bridgeAnchorsAligned } = getState();
  if (nullFerrymanDefeated) {
    sayLines([{ speaker: "Null Ferryman", text: "Every shore is still a question. You only answered this one." }]);
    return;
  }
  if (!bridgeAnchorsAligned) {
    sayLines([{ speaker: "Null Ferryman", text: "No fare. No route. No proof that the far bank exists." }]);
    return;
  }
  sayLines(
    [
      { speaker: "Null Ferryman", text: "I carry travelers across gaps by deleting the need for a bridge." },
      { speaker: "Mira Vale", text: "That is not transportation. That is erasure with a lantern." },
    ],
    () => {
      startTicketBattle({
        title: "Null Ferryman",
        publicTickets: [
          graphNode("A", 0, 0),
          graphNode("B", 1, 0),
          graphNode("C", 1, 1),
          graphNode("D", 2, 0),
          graphNode("E", 2, 1),
          graphNode("F", 3, 0),
        ],
        sealedCount: 6,
        enemySprite: NULL_FERRYMAN,
        enemyPixelSize: 6,
        returnScreen: "screen-room-ch4",
        ...GRAPH_BATTLE_TEXT,
        roundHint1: "Build the crossing order before the Ferryman turns missing edges into missing memory.",
        wonHint: "The crossing holds. The Ferryman cannot erase a route that has been witnessed.",
        onWin: () => {
          setState({ nullFerrymanDefeated: true });
          clearCode(map, NULL_FERRYMAN_CODE);
          map = buildCurrentMap();
          render();
          sayLines([
            { speaker: "Null Ferryman", text: "...Then the rot will stop cutting bridges. It will cut the idea of shore." },
            { speaker: "", text: "The ravine keeps its shape. For now." },
            { speaker: "Mira Vale", text: "That was a warning. The Null Rot is learning abstractions." },
          ]);
        },
      });
    }
  );
}

function enterNullWitnessBattle() {
  if (getState().nullWitnessDefeated) {
    sayLines([{ speaker: "The Inner Copy", text: "You already reached me. Why is the room still rendering?" }]);
    return;
  }
  sayLines(
    [
      { speaker: "The dark", text: "You collected optional objects because a system rewarded you before." },
      { speaker: "The Inner Copy", text: "Can you still call it secret if the code expected you?" },
      { speaker: "Mira Vale", text: "Do not answer that. Beat it first." },
    ],
    () => {
      startCodeBattle({
        title: "The Inner Copy",
        starterCode: `def solve(values):
    reach = 0
    # Return True if every index can still reach the end.
    return True`,
        objective: "Solve a reachability check: return True if jumps can reach the final index.",
        publicCases: [jumpCase("visible_reachable", [2, 3, 1, 1, 4]), jumpCase("visible_cut", [3, 2, 1, 0, 4])],
        generateSealed: () => [jumpCase("sealed_short", [2, 0, 0]), jumpCase("sealed_gap", [1, 0, 2])],
        enemyImage: RECURSIVE_HUSK_IMAGE,
        enemyImageClass: "recursive-husk-battle-sprite secret-boss-battle-sprite",
        returnScreen: "screen-room-ch4",
        roundHint1: "Track the farthest reachable index. If the current index is beyond it, the route is broken.",
        roundHint2: "Fresh route. Prove reachability without memorizing the visible jumps.",
        wonHint: "The inner copy stops asking who moved the goalpost.",
        shortcutBlockMessage: "Sorting cannot repair reachability. Track the farthest reachable index.",
        onWin: () => {
          setState({ nullWitnessDefeated: true });
          clearCode(map, NULL_WITNESS_CODE);
          map = buildCurrentMap();
          render();
          sayLines([
            { speaker: "The Inner Copy", text: "A player found the hidden room. A function returned True. Neither proves who is outside." },
            { speaker: "", text: "The secret chamber loses its recursion, but the silence keeps one nested echo." },
          ]);
        },
      });
    }
  );
}

function inspectLore() {
  if (roomIndex === ROOM_BRIDGEHEAD) return findBridgeheadSecret();
  if (roomIndex === ROOM_CROSSING) {
    sayLines([
      { speaker: "", text: "A survey marker reads: 'Anchor every bridge to three witnessed nodes. Two nodes make a line. Three make a claim.'" },
      { speaker: "Mira Vale", text: "So the anchors are not decoration. They are proof the crossing exists." },
    ]);
    return;
  }
  if (roomIndex === ROOM_CHAPEL) {
    const { foundGraphreachChapelSecret } = getState();
    if (!foundGraphreachChapelSecret) setState({ foundGraphreachChapelSecret: true });
    sayLines([
      { speaker: "", text: "A chapel register lists villages by connected component. One column is labeled 'removed from map, still reachable by grief.'" },
      { speaker: "Component Hermit", text: "Graphs remember what maps simplify." },
    ]);
    return;
  }
  if (roomIndex === ROOM_SECRET) {
    const { foundGraphreachDarkSecret } = getState();
    if (!foundGraphreachDarkSecret) setState({ foundGraphreachDarkSecret: true });
    sayLines([
      { speaker: "", text: "The cave wall shows a route graph of this room. One node is labeled YOU ARE HERE even when you move." },
      { speaker: "The dark", text: "A player wants exits. A program wants states. Which one are you repairing?" },
      { speaker: "", text: "There is still nobody in the cave, except the copy that waited for you to read this line." },
    ]);
    return;
  }
  sayLines([{ speaker: "", text: "The Ferryman's fare box is empty except for labels torn from bridges." }]);
}

function alignBridgeAnchor(col, row) {
  if (getState().bridgeAnchorsAligned) {
    sayLines([{ speaker: "", text: "The three anchors hold the same connected component." }]);
    return;
  }
  touchedAnchors.add(`${col},${row}`);
  if (touchedAnchors.size >= 3) {
    setState({ bridgeAnchorsAligned: true });
    map = buildCurrentMap();
    render();
    sayLines([
      { speaker: "", text: "Three anchors answer together. The east crossing becomes a route instead of a rumor." },
      { speaker: "Mira Vale", text: "Boss path open. And no, I do not like that bridges now need witnesses." },
    ]);
    return;
  }
  sayLines([{ speaker: "", text: `Anchor ${touchedAnchors.size}/3 records a reachable node. The bridge wants a full component.` }]);
}

function findBridgeheadSecret() {
  const { foundGraphreachSecret } = getState();
  if (foundGraphreachSecret) {
    sayLines([{ speaker: "", text: "The cracked sign has no more useful ink." }]);
    return;
  }
  setState({ foundGraphreachSecret: true });
  sayLines([
    { speaker: "", text: "A cracked road sign points to villages that are no longer drawn on any map." },
    { speaker: "", text: "Someone scratched underneath: 'If a place is unreachable, ask who broke the edge.'" },
    { speaker: "Mira Vale", text: "That is Graphreach in one sentence, unfortunately." },
  ]);
}

function onReachRouteDoor() {
  if (roomIndex === ROOM_BRIDGEHEAD) {
    if (!(getState().bridgeWispCleared && getState().cycleHoundCleared)) {
      sayLines([{ speaker: "", text: "The north bridge refuses to settle while the Wisp and Hound are still scrambling traversal." }]);
      return;
    }
    goToRoom(ROOM_CROSSING, ROOM_STARTS[ROOM_CROSSING], [
      { speaker: "", text: "The bridgehead opens into a suspended crossing. The ravine below is full of paths that were cut out of the world." },
      { speaker: "Mira Vale", text: "Find the anchors. If the component agrees, the route should hold." },
    ]);
    return;
  }
  if (roomIndex === ROOM_CROSSING) {
    if (!getState().bridgeAnchorsAligned) {
      sayLines([{ speaker: "", text: "The east crossing dissolves before your foot reaches it. Three anchors still need to agree." }]);
      return;
    }
    goToRoom(ROOM_BOSS, ROOM_STARTS[ROOM_BOSS], [
      { speaker: "", text: "The bridge narrows into a ferry dock over nothing." },
    ]);
    return;
  }
  if (roomIndex === ROOM_BOSS) {
    onExitToNextRoute();
  }
}

function onReachSideDoor() {
  goToRoom(ROOM_CHAPEL, ROOM_STARTS[ROOM_CHAPEL], [
    { speaker: "", text: "A chapel built into the cliffside opens behind a bridge marker." },
  ]);
}

function onReachSecretDoor() {
  if (!allDiamondsCollected()) {
    sayLines([{ speaker: "", text: "The wall is smooth here. Three missing witnesses disagree." }]);
    return;
  }
  goToRoom(ROOM_SECRET, ROOM_STARTS[ROOM_SECRET], [
    { speaker: "", text: "A wall near the bridgehead unfolds into a cave the map does not admit." },
    { speaker: "The dark", text: "Thank you for testing the optional path." },
  ]);
}

function onReachReturnDoor() {
  if (roomIndex === ROOM_CHAPEL) {
    goToRoom(ROOM_BRIDGEHEAD, { col: 11, row: 3, facing: "left" }, null);
    return;
  }
  if (roomIndex === ROOM_SECRET) {
    goToRoom(ROOM_BRIDGEHEAD, { col: 1, row: 6, facing: "right" }, null);
    return;
  }
  if (roomIndex === ROOM_CROSSING) {
    goToRoom(ROOM_BRIDGEHEAD, { col: 6, row: 1, facing: "down" }, null);
    return;
  }
  goToRoom(ROOM_CROSSING, { col: 11, row: 4, facing: "left" }, null);
}

function onExitToNextRoute() {
  if (!getState().nullFerrymanDefeated) return;
  sayLines(
    [
      { speaker: "", text: "The far bank opens into a route the Archive has not drawn yet." },
      { speaker: "Mira Vale", text: "That is as far as this build goes. Next chapter needs a new system, not just a new road." },
    ],
    () => {
      if (onExitToChapter5) onExitToChapter5();
    }
  );
}

function bindInput() {
  document.removeEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown);
  const dpad = document.getElementById("dpad-ch4");
  dpad.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => handleDirAction(btn.dataset.dir);
  });
}

function handleDirAction(dir) {
  if (document.getElementById("screen-room-ch4").classList.contains("active") === false) return;
  if (dir === "interact") {
    if (isDialogueActive()) advanceDialogue();
    else interactFacing();
    return;
  }
  if (isDialogueActive()) return;
  tryMove(dir);
}

function interactFacing() {
  if (isDialogueActive()) return;
  const { dc, dr } = DIR_OFFSET[player.facing];
  const col = player.col + dc;
  const row = player.row + dr;
  handleSpecialTile(tileAt(col, row), col, row);
}

function onKeyDown(e) {
  if (document.getElementById("screen-room-ch4").classList.contains("active") === false) return;
  const key = e.code;
  const keyDirs = {
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
  };
  if (keyDirs[key]) {
    e.preventDefault();
    if (isDialogueActive()) return;
    tryMove(keyDirs[key]);
    return;
  }
  if (key === "Space" || key === "Enter") {
    e.preventDefault();
    if (isDialogueActive()) {
      advanceDialogue();
      return;
    }
    interactFacing();
  }
}
