import { applyPixelArt } from "./pixelart.js";
import { ARRAY_MARKER_ICON, ARCHIVE_SHARD, BACKLOG_CLERK, GATE_ICON, LORD_BOGO, PIVOT_SHADE, PIXEL_SIZE as SPRITE_PX, SHUFFLE_IMP } from "./sprites.js";
import { animatePatchrunnerStep, placePatchrunnerEntity, updatePatchrunnerFacing } from "./playerSprite.js";
import { sayLines, isDialogueActive, advance as advanceDialogue } from "./dialogue.js";
import { getState, setState } from "./state.js";
import { startCodeBattle } from "./codeBattle.js";
import { startBogoBossBattle } from "./bogoBossBattle.js";

export const TILE = 42;
const COLS = 13;
const ROWS = 10;

const FLOOR = 0;
const WALL = 1;
const CLUTTER = 2;
const CLOSED_GATE = 3;
const SHUFFLE_IMP_CODE = 5;
const ROUTE_DOOR = 6;
const PIVOT_SHADE_CODE = 7;
const LORE = 8;
const BOGO_CODE = 9;
const NULL_ROT = 10;
const NULL_ECHO_CODE = 11;
const SIDE_DOOR = 12;
const RETURN_DOOR = 13;
const MIRROR = 14;
const INDEX_GHOST_CODE = 16;
const SECRET_DOOR = 17;
const GRASS = 18;
const ROCK = 19;
const MARSH = 20;
const TREE = 21;

const ROOM_APPROACH = 0;
const ROOM_COURT = 1;
const ROOM_LIBRARY = 2;
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
    [1, 18, 18, 19, 0, 0, 0, 0, 0, 19, 18, 18, 1],
    [1, 21, 0, 0, 0, 19, 18, 19, 0, 0, 0, 21, 1],
    [1, 0, 19, 5, 0, 0, 0, 0, 0, 7, 0, 0, 12],
    [1, 0, 0, 0, 21, 0, 19, 0, 21, 0, 0, 19, 1],
    [1, 18, 19, 0, 0, 0, 8, 0, 0, 0, 19, 18, 1],
    [17, 0, 0, 0, 19, 0, 0, 0, 19, 0, 0, 18, 1],
    [1, 20, 20, 0, 0, 0, 0, 0, 0, 0, 20, 20, 1],
    [1, 1, 18, 18, 0, 0, 0, 0, 0, 18, 18, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 20, 10, 0, 0, 2, 0, 0, 2, 0, 10, 20, 1],
    [1, 0, 2, 14, 10, 0, 0, 0, 10, 14, 2, 0, 1],
    [1, 0, 0, 2, 0, 0, 8, 0, 0, 2, 0, 0, 1],
    [1, 2, 0, 0, 14, 10, 11, 10, 0, 0, 0, 2, 3],
    [1, 0, 0, 10, 0, 0, 0, 0, 0, 10, 0, 0, 1],
    [1, 0, 2, 0, 0, 19, 0, 19, 0, 2, 0, 0, 1],
    [1, 20, 0, 0, 2, 0, 8, 0, 2, 0, 0, 20, 1],
    [1, 20, 20, 0, 0, 0, 0, 0, 0, 0, 20, 20, 1],
    [1, 1, 1, 1, 1, 1, 13, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 2, 0, 8, 0, 2, 0, 0, 1, 1, 1],
    [1, 0, 2, 0, 0, 0, 16, 0, 0, 2, 0, 0, 1],
    [13, 0, 0, 0, 2, 0, 0, 0, 2, 0, 8, 0, 1],
    [1, 2, 0, 0, 0, 2, 0, 2, 0, 0, 0, 2, 1],
    [1, 0, 0, 2, 0, 0, 8, 0, 0, 2, 0, 0, 1],
    [1, 0, 2, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 1, 1, 1],
    [1, 20, 10, 0, 2, 0, 0, 0, 2, 0, 10, 20, 1],
    [1, 0, 2, 0, 10, 0, 9, 0, 10, 0, 2, 0, 1],
    [1, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 1],
    [1, 2, 0, 0, 2, 10, 0, 10, 2, 0, 0, 2, 1],
    [13, 0, 0, 10, 0, 0, 2, 0, 0, 10, 0, 0, 1],
    [1, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
    [1, 20, 0, 0, 2, 0, 8, 0, 2, 0, 20, 0, 1],
    [1, 1, 20, 0, 0, 0, 0, 0, 0, 20, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 10, 20, 20, 1, 1, 1, 20, 10, 10, 10, 1, 1],
    [1, 20, 0, 0, 0, 10, 0, 0, 0, 20, 10, 10, 1],
    [1, 10, 0, 8, 0, 0, 0, 2, 0, 0, 0, 10, 1],
    [1, 20, 0, 0, 2, 10, 0, 0, 0, 20, 0, 0, 1],
    [1, 10, 10, 0, 0, 0, 0, 10, 0, 0, 0, 13, 1],
    [1, 1, 10, 20, 0, 0, 2, 0, 0, 20, 10, 10, 1],
    [1, 1, 10, 10, 0, 20, 0, 0, 10, 10, 10, 1, 1],
    [1, 1, 1, 10, 10, 10, 20, 10, 10, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
];

const STARTER_CODE = `def solve(values):
    ordered = values[:]
    # Use loops and comparisons here. No sorted() or .sort().
    # Swap neighbors when they are out of order.
    return ordered`;

let viewport;
let map;
let roomIndex = ROOM_APPROACH;
let player = { ...ROOM_STARTS[ROOM_APPROACH] };
let playerEl;
let hasGreeted = false;
let onExitToChapter4 = null;
let touchedMirrors = new Set();

function shuffledDistinct(count, max) {
  const pool = Array.from({ length: max }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function sortedCase(name, values) {
  return { name, input: values, expected: values.slice().sort((a, b) => a - b) };
}

function generateSealedShuffleImp() {
  return [sortedCase("sealed_1", shuffledDistinct(4, 9)), sortedCase("sealed_2", shuffledDistinct(4, 9))];
}

function generateSealedBogo() {
  return [
    sortedCase("sealed_1", shuffledDistinct(6, 12)),
    sortedCase("sealed_2", shuffledDistinct(6, 12)),
    sortedCase("sealed_3", shuffledDistinct(6, 12)),
  ];
}

function generateSealedPivotShade() {
  return [sortedCase("sealed_1", [3, 1, 3, 2, 1]), sortedCase("sealed_2", shuffledDistinct(5, 10))];
}

export function initChapter3Room({ onExitToChapter4: exitHandler } = {}) {
  onExitToChapter4 = exitHandler || null;
  viewport = document.getElementById("room-viewport-ch3");
  viewport.className = "room-viewport theme-array";
  viewport.style.width = `${COLS * TILE}px`;
  viewport.style.height = `${ROWS * TILE}px`;
  viewport.style.transformOrigin = "top center";
  fitViewportToScreen();
  window.removeEventListener("resize", fitViewportToScreen);
  window.addEventListener("resize", fitViewportToScreen);
  touchedMirrors = new Set();
  goToRoom(ROOM_APPROACH, ROOM_STARTS[ROOM_APPROACH], null);
  bindInput();

  if (!hasGreeted) {
    hasGreeted = true;
    window.setTimeout(() => {
      sayLines([
        { speaker: "", text: "The Plains stretch out in restless rows, formations shifting whenever no one looks directly at them." },
        { speaker: "Mira Vale", text: "These first fields are only the approach. Bogo's court is deeper, where the rows stop agreeing that they exist." },
      ]);
    }, 250);
  }
}

function buildCurrentMap() {
  const next = ROOM_MAPS[roomIndex].map((row) => row.slice());
  const state = getState();
  if (state.shuffleImpCleared) clearCode(next, SHUFFLE_IMP_CODE);
  if (state.pivotShadeCleared) clearCode(next, PIVOT_SHADE_CODE);
  if (state.indexGhostCleared) clearCode(next, INDEX_GHOST_CODE);
  if (state.nullEchoCleared) clearCode(next, NULL_ECHO_CODE);
  if (state.bogoDefeated) clearCode(next, BOGO_CODE);
  if (roomIndex === ROOM_APPROACH && state.shuffleImpCleared && state.pivotShadeCleared) openNorthGate(next);
  if (roomIndex === ROOM_COURT && state.nullEchoCleared && state.arrayMirrorsAligned) openEastGate(next);
  if (roomIndex === ROOM_BOSS && state.bogoDefeated) openNorthGate(next);
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

function goToRoom(nextRoom, start, lines) {
  roomIndex = nextRoom;
  map = buildCurrentMap();
  player = { ...start };
  render();
  if (lines) sayLines(lines);
}

function fitViewportToScreen() {
  const naturalWidth = COLS * TILE;
  const available = window.innerWidth - 24;
  const scale = Math.min(1, available / naturalWidth);
  viewport.style.transform = scale < 1 ? `scale(${scale})` : "";
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
      } else if (code === CLUTTER || code === MIRROR || code === LORE) {
        appendIcon(tile, ARRAY_MARKER_ICON, code === LORE);
      }
      viewport.appendChild(tile);
    }
  }

  placeCodeEntity("bogo", BOGO_CODE, LORD_BOGO, 5);
  placeCodeEntity("imp", SHUFFLE_IMP_CODE, SHUFFLE_IMP, SPRITE_PX);
  placeCodeEntity("pivot", PIVOT_SHADE_CODE, PIVOT_SHADE, SPRITE_PX);
  placeCodeEntity("null-echo", NULL_ECHO_CODE, PIVOT_SHADE, SPRITE_PX);
  placeCodeEntity("index-ghost", INDEX_GHOST_CODE, BACKLOG_CLERK, SPRITE_PX);
  if (getState().bogoDefeated) placeEntity("archive-shard", 6, 1, ARCHIVE_SHARD, 3);
  playerEl = placePatchrunnerEntity(viewport, player.col, player.row, TILE, player.facing);
}

function placeCodeEntity(id, code, sprite, pixelSize) {
  const pos = findCode(code);
  if (pos) placeEntity(id, pos.col, pos.row, sprite, pixelSize);
}

function tileClass(code, r, c) {
  if (code === WALL) return "tile-wall";
  if (code === CLOSED_GATE) return "tile-gate";
  if (code === ROUTE_DOOR || code === SIDE_DOOR || code === RETURN_DOOR) return "tile-gate open";
  if (code === SECRET_DOOR) return "tile-secret-door";
  if (code === NULL_ROT) return "tile-null-rot";
  if (code === MIRROR) return "tile-mirror";
  if (code === GRASS) return "tile-grass";
  if (code === ROCK) return "tile-rock";
  if (code === MARSH) return "tile-marsh";
  if (code === TREE) return "tile-tree";
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
  return code === WALL || code === CLUTTER || code === CLOSED_GATE || code === LORE || code === NULL_ROT || code === MIRROR ||
    code === SECRET_DOOR || code === ROCK || code === MARSH || code === TREE ||
    code === SHUFFLE_IMP_CODE || code === PIVOT_SHADE_CODE || code === BOGO_CODE || code === NULL_ECHO_CODE ||
    code === INDEX_GHOST_CODE;
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
  if (code === SHUFFLE_IMP_CODE) return enterShuffleImpBattle(), true;
  if (code === PIVOT_SHADE_CODE) return enterPivotShadeBattle(), true;
  if (code === INDEX_GHOST_CODE) return enterIndexGhostBattle(), true;
  if (code === NULL_ECHO_CODE) return enterNullEchoBattle(), true;
  if (code === BOGO_CODE) return enterLordBogoBattle(), true;
  if (code === LORE) return inspectLore(col, row), true;
  if (code === MIRROR) return alignArrayMirror(col, row), true;
  if (code === ROUTE_DOOR) return onReachRouteDoor(col, row), true;
  if (code === SIDE_DOOR) return onReachSideDoor(), true;
  if (code === SECRET_DOOR) return onReachSecretDoor(), true;
  if (code === RETURN_DOOR) return onReachReturnDoor(), true;
  return false;
}

function enterShuffleImpBattle() {
  sayLines(
    [{ speaker: "", text: "A Shuffle Imp giggles, scrambling a small formation just to watch it fall apart." }],
    () => startCodeEncounter({
      title: "Shuffle Imp",
      publicCases: [sortedCase("public_mixed", [4, 2, 3])],
      generateSealed: generateSealedShuffleImp,
      enemySprite: SHUFFLE_IMP,
      clearFlag: "shuffleImpCleared",
      clearCodeValue: SHUFFLE_IMP_CODE,
      roundHint1: "Write Python def solve(values): and sort the visible formation.",
      roundHint2: "The Archive reshuffled the input. Prove your Python still holds.",
      wonHint: "The formation holds its shape. The imp sulks off.",
      winLines: [
        { speaker: "Mira Vale", text: "Good. It didn't just work once - it works." },
        { speaker: "", text: "The marker posts stop sliding around the path, at least while your invariant holds." },
      ],
    })
  );
}

function enterPivotShadeBattle() {
  sayLines(
    [{ speaker: "", text: "A Pivot Shade splits the formation around a bad guess and dares your code to recover." }],
    () => startCodeEncounter({
      title: "Pivot Shade",
      publicCases: [sortedCase("public_duplicates", [3, 1, 3, 2])],
      generateSealed: generateSealedPivotShade,
      enemySprite: PIVOT_SHADE,
      clearFlag: "pivotShadeCleared",
      clearCodeValue: PIVOT_SHADE_CODE,
      roundHint1: "Write Python sorting logic that handles duplicates, not just one lucky shuffle.",
      roundHint2: "Fresh formation with repeats. Stability starts by not losing values.",
      wonHint: "The pivot stops flickering. Your ordering held through duplicates.",
      winLines: [
        { speaker: "Mira Vale", text: "Nice. Duplicates are where sloppy sorting starts lying." },
        { speaker: "", text: "The split marker locks into the ground, leaving the path less slippery." },
      ],
    })
  );
}

function enterIndexGhostBattle() {
  sayLines(
    [
      { speaker: "", text: "An Index Ghost points at old array ledgers, always one slot off." },
      { speaker: "Mira Vale", text: "Optional, but this is exactly how quiet corruption starts." },
    ],
    () => startCodeEncounter({
      title: "Index Ghost",
      publicCases: [sortedCase("public_edges", [2, 1, 0, 3])],
      generateSealed: () => [sortedCase("sealed_1", [4, 1, 0, 2]), sortedCase("sealed_2", [1, 1, 0, 1])],
      enemySprite: BACKLOG_CLERK,
      clearFlag: "indexGhostCleared",
      clearCodeValue: INDEX_GHOST_CODE,
      roundHint1: "Sort the full list without skipping the first or last value.",
      wonHint: "The old index settles back onto the page.",
      winLines: [
        { speaker: "", text: "A margin note remains: 'The first Null Rot outbreak began as an off-by-one nobody owned.'" },
        { speaker: "Mira Vale", text: "That sounds painfully believable." },
      ],
    })
  );
}

function enterNullEchoBattle() {
  sayLines(
    [
      { speaker: "", text: "The dark seam repeats your footsteps one beat late, then asks for a sort in your own voice." },
      { speaker: "Mira Vale", text: "Null Echo. It is not an enemy exactly. More like a missing answer wearing an enemy's outline." },
    ],
    () => startCodeEncounter({
      title: "Null Echo",
      publicCases: [sortedCase("public_gap", [2, 0, 2, 1])],
      generateSealed: () => [sortedCase("sealed_1", [0, 3, 0, 1, 2]), sortedCase("sealed_2", [4, 0, 4, 1])],
      enemySprite: PIVOT_SHADE,
      clearFlag: "nullEchoCleared",
      clearCodeValue: NULL_ECHO_CODE,
      roundHint1: "Sort the formation even when zero-value gaps appear.",
      roundHint2: "Fresh gaps. Keep every value; do not let the rot erase anything.",
      wonHint: "The echo loses your voice and collapses back into a seam.",
      winLines: [
        { speaker: "Mira Vale", text: "Zero is a value. Null is a wound. The difference matters." },
        { speaker: "", text: "The dark seam stops widening, but it does not fully close." },
      ],
    })
  );
}

function startCodeEncounter({ title, publicCases, generateSealed, enemySprite, clearFlag, clearCodeValue, roundHint1, roundHint2, wonHint, winLines }) {
  startCodeBattle({
    title,
    starterCode: STARTER_CODE,
    publicCases,
    generateSealed,
    enemySprite,
    enemyPixelSize: 6,
    returnScreen: "screen-room-ch3",
    roundHint1,
    ...(roundHint2 ? { roundHint2 } : {}),
    wonHint,
    onWin: () => {
      setState({ [clearFlag]: true });
      clearCode(map, clearCodeValue);
      map = buildCurrentMap();
      render();
      sayLines(winLines);
    },
  });
}

function enterLordBogoBattle() {
  const { bogoDefeated, nullEchoCleared, arrayMirrorsAligned } = getState();
  if (bogoDefeated) {
    sayLines([{ speaker: "Lord Bogo", text: "Again and again, until again forgets the first time." }]);
    return;
  }
  if (!nullEchoCleared || !arrayMirrorsAligned) {
    sayLines([{ speaker: "Lord Bogo", text: "Not yet. The hollow one has not taught you the shape of nothing." }]);
    return;
  }
  sayLines(
    [
      { speaker: "Lord Bogo", text: "Shuffle once, shuffle forever, shuffle until the last index bites its own tail." },
      { speaker: "Lord Bogo", text: "The empty king counts upward from no number. He laughs when arrays ask how long." },
      { speaker: "Mira Vale", text: "That sounds like nonsense. Which means we should remember it exactly." },
    ],
    () => {
      startBogoBossBattle({
        returnScreen: "screen-room-ch3",
        onWin: () => {
          setState({ bogoDefeated: true, archiveFragmentAwake: true });
          clearCode(map, BOGO_CODE);
          map = buildCurrentMap();
          render();
          sayLines([
            { speaker: "Lord Bogo", text: "...Still ordered. Then the rot must learn to eat the rule, not the row." },
            { speaker: "", text: "The Plains settle, but the black seams under them remain awake." },
            { speaker: "", text: "The Archive shard answers with a route toward bridges, missing villages, and a map that refuses to stay connected." },
            { speaker: "Mira Vale", text: "Graphreach is next. And Henry? Bogo was warning us, not threatening us." },
          ]);
        },
      });
    }
  );
}

function inspectLore(col, row) {
  if (roomIndex === ROOM_APPROACH) return findSecret();
  if (roomIndex === ROOM_COURT) {
    sayLines([
      { speaker: "", text: "A cracked array mirror reflects an empty slot where your reflection should be." },
      { speaker: "Mira Vale", text: "That is not a missing sprite. That is the room lying." },
    ]);
    return;
  }
  if (roomIndex === ROOM_LIBRARY) {
    const { foundArrayLibrarySecret } = getState();
    if (!foundArrayLibrarySecret) setState({ foundArrayLibrarySecret: true });
    sayLines([
      { speaker: "", text: "A book of old proofs has every base case inked over." },
      { speaker: "", text: "The readable note says: 'Unbounded things do not break walls. They convince walls to keep counting.'" },
      { speaker: "Mira Vale", text: "That sounds like Bogo's nonsense wearing a scholar's coat." },
    ]);
    return;
  }
  if (roomIndex === ROOM_SECRET) {
    const { foundArrayDarkSecret } = getState();
    if (!foundArrayDarkSecret) setState({ foundArrayDarkSecret: true });
    sayLines([
      { speaker: "", text: "The marsh reflects the game board without reflecting you." },
      { speaker: "The dark", text: "You found a room because you believed the edge was negotiable." },
      { speaker: "", text: "There is no NPC here. The text appears anyway." },
    ]);
    return;
  }
  sayLines([{ speaker: "", text: "The court record is blank, but the blankness feels deliberate." }]);
}

function alignArrayMirror(col, row) {
  if (getState().arrayMirrorsAligned) {
    sayLines([{ speaker: "", text: "The three mirrors reflect the same ordered row, even through the rot." }]);
    return;
  }
  touchedMirrors.add(`${col},${row}`);
  if (touchedMirrors.size >= 3) {
    setState({ arrayMirrorsAligned: true });
    map = buildCurrentMap();
    render();
    sayLines([
      { speaker: "", text: "Three mirrors agree on one sequence. The court reluctantly admits the path exists." },
      { speaker: "Mira Vale", text: "Boss route open. I dislike that the room needed witnesses." },
    ]);
    return;
  }
  sayLines([{ speaker: "", text: `Mirror ${touchedMirrors.size}/3 holds an ordered reflection. The court still disagrees.` }]);
}

function findSecret() {
  const { foundArrayPlainsSecret } = getState();
  if (foundArrayPlainsSecret) {
    sayLines([{ speaker: "", text: "The buried marker is already dug up." }]);
    return;
  }
  setState({ foundArrayPlainsSecret: true });
  sayLines([
    { speaker: "", text: "A half-buried marker post, carved with mismatched sigils and dice." },
    { speaker: "", text: "It names a 'Bogo Court' - nobles who treat randomness as freedom, and order as a kind of tyranny." },
    { speaker: "Mira Vale", text: "Funny people to argue with. Harder to argue with a repair that just works." },
  ]);
}

function onReachRouteDoor() {
  if (roomIndex === ROOM_APPROACH) {
    if (!(getState().shuffleImpCleared && getState().pivotShadeCleared)) {
      sayLines([{ speaker: "", text: "The north formation refuses to stay open while the approach is still unstable." }]);
      return;
    }
    goToRoom(ROOM_COURT, ROOM_STARTS[ROOM_COURT], [
      { speaker: "", text: "The open field folds into a court of shifting arrays. Null Rot pools in the places where values should be." },
      { speaker: "Mira Vale", text: "This is past ordinary disorder. Step carefully." },
    ]);
    return;
  }
  if (roomIndex === ROOM_COURT) {
    if (!(getState().nullEchoCleared && getState().arrayMirrorsAligned)) {
      sayLines([{ speaker: "", text: "The east arch refuses the boss route. The echo and the mirrors still disagree." }]);
      return;
    }
    goToRoom(ROOM_BOSS, ROOM_STARTS[ROOM_BOSS], [
      { speaker: "", text: "The east arch folds into Bogo's amphitheatre: dice, royal fabric, and empty spaces pretending to be decoration." },
    ]);
    return;
  }
  if (roomIndex === ROOM_BOSS) {
    onExitToChapter4Route();
  }
}

function onReachSideDoor() {
  goToRoom(ROOM_LIBRARY, ROOM_STARTS[ROOM_LIBRARY], [
    { speaker: "", text: "A side library opens behind a row that was not there a moment ago." },
  ]);
}

function onReachSecretDoor() {
  goToRoom(ROOM_SECRET, ROOM_STARTS[ROOM_SECRET], [
    { speaker: "", text: "The marsh grass parts where the map insists there is only edge." },
    { speaker: "", text: "Beyond it, the Array Plains stop pretending to be outdoors." },
  ]);
}

function onReachReturnDoor() {
  if (roomIndex === ROOM_LIBRARY) {
    goToRoom(ROOM_APPROACH, { col: 11, row: 3, facing: "left" }, null);
    return;
  }
  if (roomIndex === ROOM_SECRET) {
    goToRoom(ROOM_APPROACH, { col: 1, row: 6, facing: "right" }, null);
    return;
  }
  if (roomIndex === ROOM_COURT) {
    goToRoom(ROOM_APPROACH, { col: 6, row: 1, facing: "down" }, null);
    return;
  }
  goToRoom(ROOM_COURT, { col: 11, row: 4, facing: "left" }, null);
}

function onExitToChapter4Route() {
  sayLines(
    [
      { speaker: "", text: "The formation opens a clear path onward, but the next bridge is still only a signal in the shard." },
      { speaker: "Mira Vale", text: "That's as far as this build goes. Next repair: Graphreach, when the route is ready." },
    ],
    () => {
      if (onExitToChapter4) onExitToChapter4();
    }
  );
}

function bindInput() {
  document.removeEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown);
  const dpad = document.getElementById("dpad-ch3");
  dpad.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => handleDirAction(btn.dataset.dir);
  });
}

function handleDirAction(dir) {
  if (document.getElementById("screen-room-ch3").classList.contains("active") === false) return;
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
  if (document.getElementById("screen-room-ch3").classList.contains("active") === false) return;
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
