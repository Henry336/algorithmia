import { applyPixelArt } from "./pixelart.js";
import { BACKLOG_CLERK, EMBER_SORTER, FURNACE_STACK_ICON, GATE_ICON, HEAP_WARDEN, PRIORITY_FORGER, PIXEL_SIZE as SPRITE_PX } from "./sprites.js";
import { animatePatchrunnerStep, placePatchrunnerEntity, updatePatchrunnerFacing } from "./playerSprite.js";
import { sayLines, isDialogueActive, advance as advanceDialogue } from "./dialogue.js";
import { getState, setState } from "./state.js";
import { startTicketBattle } from "./ticketBattle.js";
import { solvePriorityOrder } from "./priorityPolicy.js";

export const TILE = 42;
const COLS = 13;
const ROWS = 10;

const FLOOR = 0;
const WALL = 1;
const CLUTTER = 2;
const CLOSED_GATE = 3;
const EMBER_SORTER_CODE = 5;
const ROUTE_DOOR = 6;
const PRIORITY_FORGER_CODE = 7;
const LORE = 8;
const HEAP_WARDEN_CODE = 9;
const NULL_ROT = 10;
const HEAT_SIFTER_CODE = 11;
const SIDE_DOOR = 12;
const RETURN_DOOR = 13;
const VALVE = 14;
const ASH_AUDITOR_CODE = 16;

const ROOM_INTAKE = 0;
const ROOM_CORE = 1;
const ROOM_ARCHIVE = 2;
const ROOM_BOSS = 3;

const ROOM_STARTS = [
  { col: 6, row: 8, facing: "up" },
  { col: 6, row: 8, facing: "up" },
  { col: 11, row: 5, facing: "left" },
  { col: 6, row: 8, facing: "up" },
];

const ROOM_MAPS = [
  [
    [1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1],
    [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1],
    [1, 0, 2, 0, 2, 0, 0, 0, 2, 0, 2, 0, 1],
    [1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 12, 1],
    [1, 2, 2, 0, 2, 2, 0, 2, 2, 0, 2, 0, 1],
    [1, 0, 0, 7, 0, 0, 0, 0, 0, 5, 0, 0, 1],
    [1, 0, 2, 2, 0, 2, 0, 2, 0, 2, 2, 0, 1],
    [1, 0, 8, 0, 0, 2, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1],
    [1, 0, 0, 2, 0, 10, 0, 0, 2, 0, 0, 0, 1],
    [1, 0, 2, 0, 2, 0, 14, 0, 2, 0, 10, 0, 1],
    [1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1],
    [1, 2, 10, 0, 14, 2, 11, 2, 14, 0, 2, 1, 1],
    [1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1],
    [1, 0, 2, 0, 0, 10, 0, 0, 0, 2, 0, 0, 1],
    [1, 0, 0, 0, 2, 0, 8, 0, 2, 0, 0, 0, 1],
    [1, 0, 2, 0, 0, 0, 10, 0, 0, 0, 2, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 2, 0, 8, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
    [1, 0, 0, 0, 16, 0, 2, 0, 0, 0, 8, 0, 1],
    [1, 2, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 2, 0, 2, 0, 0, 0, 13, 1],
    [1, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
    [1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  [
    [1, 1, 1, 1, 1, 1, 6, 6, 1, 1, 1, 1, 1],
    [1, 0, 10, 0, 2, 0, 0, 0, 2, 0, 10, 0, 1],
    [1, 0, 2, 0, 10, 0, 9, 0, 10, 0, 2, 0, 1],
    [1, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 1],
    [1, 2, 0, 0, 2, 10, 0, 10, 2, 0, 0, 2, 1],
    [1, 0, 0, 10, 0, 0, 2, 0, 0, 10, 0, 0, 1],
    [1, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
    [1, 0, 0, 0, 2, 0, 13, 0, 2, 0, 8, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
];

let viewport;
let map;
let roomIndex = ROOM_INTAKE;
let player = { ...ROOM_STARTS[ROOM_INTAKE] };
let playerEl;
let hasGreeted = false;
let hasWarnedGateOnce = false;
let onExitToChapter3 = null;
let touchedValves = new Set();

function priorityTicket(id, arrival, priority) {
  return { id, arrival, priority };
}

function randomSealedEmbers(count) {
  const letters = ["A", "B", "C", "D", "E", "F", "G"];
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Array.from({ length: count }, (_, i) => priorityTicket(letters[i], i, pool[i]));
}

export function initChapter2Room({ onExitToChapter3: exitHandler } = {}) {
  onExitToChapter3 = exitHandler || null;
  viewport = document.getElementById("room-viewport-ch2");
  viewport.className = "room-viewport theme-heaplight";
  viewport.style.width = `${COLS * TILE}px`;
  viewport.style.height = `${ROWS * TILE}px`;
  viewport.style.transformOrigin = "top center";
  fitViewportToScreen();
  window.removeEventListener("resize", fitViewportToScreen);
  window.addEventListener("resize", fitViewportToScreen);
  touchedValves = new Set();
  goToRoom(ROOM_INTAKE, ROOM_STARTS[ROOM_INTAKE], null);
  bindInput();

  if (!hasGreeted) {
    hasGreeted = true;
    window.setTimeout(() => {
      sayLines([
        { speaker: "", text: "Heat rolls off the furnace floor. Every ember here fights to be the one that matters most." },
        { speaker: "Mira Vale", text: "This foundry has layers: intake floor, archive side-room, furnace core, then the Warden." },
      ]);
    }, 250);
  }
}

function buildCurrentMap() {
  const next = ROOM_MAPS[roomIndex].map((row) => row.slice());
  const state = getState();
  if (state.emberSorterCleared) clearCode(next, EMBER_SORTER_CODE);
  if (state.priorityForgerCleared) clearCode(next, PRIORITY_FORGER_CODE);
  if (state.ashAuditorCleared) clearCode(next, ASH_AUDITOR_CODE);
  if (state.heatSifterCleared) clearCode(next, HEAT_SIFTER_CODE);
  if (state.heapWardenDefeated) clearCode(next, HEAP_WARDEN_CODE);
  if (roomIndex === ROOM_INTAKE && state.emberSorterCleared && state.priorityForgerCleared) openNorthGate(next);
  if (roomIndex === ROOM_CORE && state.heatSifterCleared && state.foundryCoreAligned) openNorthGate(next);
  if (roomIndex === ROOM_BOSS && state.heapWardenDefeated) openNorthGate(next);
  return next;
}

function openNorthGate(targetMap) {
  targetMap[0][6] = ROUTE_DOOR;
  targetMap[0][7] = ROUTE_DOOR;
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
      } else if (code === CLUTTER || code === VALVE || code === LORE) {
        appendIcon(tile, FURNACE_STACK_ICON, code === LORE);
      }
      viewport.appendChild(tile);
    }
  }

  placeCodeEntity("warden", HEAP_WARDEN_CODE, HEAP_WARDEN, 5);
  placeCodeEntity("ember", EMBER_SORTER_CODE, EMBER_SORTER, SPRITE_PX);
  placeCodeEntity("forger", PRIORITY_FORGER_CODE, PRIORITY_FORGER, SPRITE_PX);
  placeCodeEntity("sifter", HEAT_SIFTER_CODE, EMBER_SORTER, SPRITE_PX);
  placeCodeEntity("ash-auditor", ASH_AUDITOR_CODE, BACKLOG_CLERK, SPRITE_PX);
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
  if (code === NULL_ROT) return "tile-null-rot";
  if (code === VALVE) return "tile-valve";
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
  return code === WALL || code === CLUTTER || code === CLOSED_GATE || code === LORE || code === NULL_ROT || code === VALVE ||
    code === EMBER_SORTER_CODE || code === PRIORITY_FORGER_CODE || code === HEAP_WARDEN_CODE || code === HEAT_SIFTER_CODE ||
    code === ASH_AUDITOR_CODE;
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
  if (code === EMBER_SORTER_CODE) return enterEmberSorterBattle(), true;
  if (code === PRIORITY_FORGER_CODE) return enterPriorityForgerBattle(), true;
  if (code === HEAT_SIFTER_CODE) return enterHeatSifterBattle(), true;
  if (code === ASH_AUDITOR_CODE) return enterAshAuditorBattle(), true;
  if (code === HEAP_WARDEN_CODE) return enterHeapWardenBattle(), true;
  if (code === LORE) return inspectLore(col, row), true;
  if (code === VALVE) return alignFoundryValve(col, row), true;
  if (code === ROUTE_DOOR) return onReachRouteDoor(), true;
  if (code === SIDE_DOOR) return onReachSideDoor(), true;
  if (code === RETURN_DOOR) return onReachReturnDoor(), true;
  return false;
}

const PRIORITY_BATTLE_TEXT = {
  roundHint1: "Click embers in the order the Foundry should burn them: highest priority first.",
  roundHint2: "The Foundry banked a fresh set of embers. Prove the rule still holds.",
  wrongPublicHint: "Not quite. Highest priority goes first; equal priority keeps arrival order.",
  wrongSealedHint: "The visible order held, but a fresh bank of embers exposed a guess.",
  wonPublicHint: "That holds. But can it survive a fresh bank of embers?",
  wonHint: "Priority confirmed. The heap holds its shape.",
  incompletePickHint: "Every ember needs a place in the burn order.",
  flagLabel: (t) => `P${t.priority}`,
  flagClass: (t) => t.priority >= 7,
  solve: solvePriorityOrder,
  generateSealed: randomSealedEmbers,
};

function enterEmberSorterBattle() {
  sayLines(
    [{ speaker: "", text: "An Ember Sorter spins loose, burning whatever it grabs first instead of what matters most." }],
    () => startPriorityBattle({
      title: "Ember Sorter",
      publicTickets: [priorityTicket("A", 0, 3), priorityTicket("B", 1, 7), priorityTicket("C", 2, 5)],
      sealedCount: 3,
      enemySprite: EMBER_SORTER,
      clearFlag: "emberSorterCleared",
      clearCodeValue: EMBER_SORTER_CODE,
      winLines: [
        { speaker: "Mira Vale", text: "Good. The floor cools where it should." },
        { speaker: "", text: "The furnace stack lowers its brightest ember into place instead of thrashing for attention." },
      ],
    })
  );
}

function enterPriorityForgerBattle() {
  sayLines(
    [{ speaker: "", text: "A Priority Forger hammers fake crisis tags onto ordinary embers." }],
    () => startPriorityBattle({
      title: "Priority Forger",
      publicTickets: [priorityTicket("A", 0, 2), priorityTicket("B", 1, 8), priorityTicket("C", 2, 8), priorityTicket("D", 3, 5)],
      sealedCount: 4,
      enemySprite: PRIORITY_FORGER,
      clearFlag: "priorityForgerCleared",
      clearCodeValue: PRIORITY_FORGER_CODE,
      roundHint1: "Audit the forged tags: highest priority first, stable ties by arrival.",
      winLines: [
        { speaker: "Mira Vale", text: "Good catch. A priority queue is only fair if the tags are honest." },
        { speaker: "", text: "The false stamps crack and fall into the furnace grate." },
      ],
    })
  );
}

function enterAshAuditorBattle() {
  sayLines(
    [
      { speaker: "", text: "A brittle audit ledger unfolds itself, demanding every old emergency be burned again in the same order." },
      { speaker: "Mira Vale", text: "Optional, but useful. Old policies explain old disasters." },
    ],
    () => startPriorityBattle({
      title: "Ash Auditor",
      publicTickets: [priorityTicket("A", 0, 5), priorityTicket("B", 1, 5), priorityTicket("C", 2, 9), priorityTicket("D", 3, 1)],
      sealedCount: 4,
      enemySprite: BACKLOG_CLERK,
      clearFlag: "ashAuditorCleared",
      clearCodeValue: ASH_AUDITOR_CODE,
      roundHint1: "Audit the old record: priority first, stable ties by arrival.",
      wonHint: "The archive accepts the audit and releases an old route note.",
      winLines: [
        { speaker: "", text: "A line in the ledger stays readable: 'After the first Null event, leadership stopped calling absence a bug.'" },
        { speaker: "Mira Vale", text: "That is not comforting. But it is useful." },
      ],
    })
  );
}

function enterHeatSifterBattle() {
  sayLines(
    [
      { speaker: "", text: "A Heat Sifter jitters between honest priority and panic, letting Null Rot leak through the grate." },
      { speaker: "Mira Vale", text: "Same rule, uglier room. Clear it before the Warden hears us." },
    ],
    () => startPriorityBattle({
      title: "Heat Sifter",
      publicTickets: [priorityTicket("A", 0, 6), priorityTicket("B", 1, 9), priorityTicket("C", 2, 3), priorityTicket("D", 3, 9)],
      sealedCount: 4,
      enemySprite: EMBER_SORTER,
      clearFlag: "heatSifterCleared",
      clearCodeValue: HEAT_SIFTER_CODE,
      roundHint1: "Sift the fires: highest priority first, stable ties by arrival, no panic jumps.",
      wonHint: "The sifter locks into rhythm. The black seep pulls back from the grate.",
      winLines: [
        { speaker: "Mira Vale", text: "That black flicker is not heat. It eats the labels off things." },
        { speaker: "", text: "The furnace core steadies, but the dark seams remain where the floor was weakest." },
      ],
    })
  );
}

function startPriorityBattle({ title, publicTickets, sealedCount, enemySprite, clearFlag, clearCodeValue, roundHint1, wonHint, winLines }) {
  startTicketBattle({
    title,
    publicTickets,
    sealedCount,
    enemySprite,
    enemyPixelSize: 6,
    returnScreen: "screen-room-ch2",
    ...PRIORITY_BATTLE_TEXT,
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

function enterHeapWardenBattle() {
  const { heapWardenDefeated, heatSifterCleared, foundryCoreAligned } = getState();
  if (heapWardenDefeated) {
    sayLines([{ speaker: "The Heap Warden", text: "The hottest fire still rises first. As it should." }]);
    return;
  }
  if (!heatSifterCleared || !foundryCoreAligned) {
    sayLines([{ speaker: "The Heap Warden", text: "No. First prove the core can tell urgency from decay." }]);
    return;
  }
  sayLines(
    [
      { speaker: "The Heap Warden", text: "Crisis has one shape: the worst fire, first. Nothing else matters." },
      { speaker: "The Heap Warden", text: "Prove your rule survives more than one furnace." },
    ],
    () => {
      startTicketBattle({
        title: "The Heap Warden",
        publicTickets: [
          priorityTicket("A", 0, 4),
          priorityTicket("B", 1, 9),
          priorityTicket("C", 2, 4),
          priorityTicket("D", 3, 7),
          priorityTicket("E", 4, 1),
        ],
        sealedCount: 5,
        enemySprite: HEAP_WARDEN,
        enemyPixelSize: 6,
        returnScreen: "screen-room-ch2",
        ...PRIORITY_BATTLE_TEXT,
        onWin: () => {
          setState({ heapWardenDefeated: true });
          clearCode(map, HEAP_WARDEN_CODE);
          map = buildCurrentMap();
          render();
          sayLines([
            { speaker: "The Heap Warden", text: "...Equal fires can wait their turn fairly. I hadn't proven that before." },
            { speaker: "", text: "The furnace floor settles into a steady, legible heat. Priority becomes a tool again, not a throne." },
          ]);
        },
      });
    }
  );
}

function inspectLore(col, row) {
  if (roomIndex === ROOM_INTAKE) return findSecret();
  if (roomIndex === ROOM_CORE) {
    sayLines([
      { speaker: "", text: "A valve plaque reads: 'Three confirmations before core escalation. One for heat, one for weight, one for absence.'" },
      { speaker: "Mira Vale", text: "Absence as a measured input. That is early Null Rot handling." },
    ]);
    return;
  }
  if (roomIndex === ROOM_ARCHIVE) {
    const { foundHeaplightArchiveSecret } = getState();
    if (!foundHeaplightArchiveSecret) setState({ foundHeaplightArchiveSecret: true });
    sayLines([
      { speaker: "", text: "Old furnace ledgers describe a night when every priority tag went blank at once." },
      { speaker: "", text: "A later hand has underlined: 'Blank is not low priority. Blank is contagious.'" },
      { speaker: "Mira Vale", text: "Someone knew the difference before the Archive forgot it." },
    ]);
    return;
  }
  sayLines([{ speaker: "", text: "The Warden's old oath is carved here, but the last word has burned away." }]);
}

function alignFoundryValve(col, row) {
  if (getState().foundryCoreAligned) {
    sayLines([{ speaker: "", text: "The three valves hum in a steady priority cycle." }]);
    return;
  }
  touchedValves.add(`${col},${row}`);
  if (touchedValves.size >= 3) {
    setState({ foundryCoreAligned: true });
    map = buildCurrentMap();
    render();
    sayLines([
      { speaker: "", text: "Heat, weight, absence. The three valves answer in order." },
      { speaker: "Mira Vale", text: "The boss route is open. Good puzzle, terrible implications." },
    ]);
    return;
  }
  sayLines([{ speaker: "", text: `Valve ${touchedValves.size}/3 locks into place. The core wants three confirmations.` }]);
}

function findSecret() {
  const { foundHeaplightSecret } = getState();
  if (foundHeaplightSecret) {
    sayLines([{ speaker: "", text: "The cooled vent is already open. Just old ash now." }]);
    return;
  }
  setState({ foundHeaplightSecret: true });
  sayLines([
    { speaker: "", text: "A cooled vent shaft, easy to miss between the furnace stacks." },
    { speaker: "", text: "Old tags inside show forged priority stamps: someone was manipulating whose fire burned first." },
    { speaker: "Mira Vale", text: "Importance is only as honest as whoever assigns it. Worth remembering." },
  ]);
}

function onReachRouteDoor() {
  if (roomIndex === ROOM_INTAKE) {
    if (!(getState().emberSorterCleared && getState().priorityForgerCleared)) {
      sayLines([{ speaker: "", text: "The north lift rattles, but the intake floor is still unstable." }]);
      return;
    }
    goToRoom(ROOM_CORE, ROOM_STARTS[ROOM_CORE], [
      { speaker: "", text: "The intake floor gives way to the Foundry core. The heat narrows into black seams." },
      { speaker: "Mira Vale", text: "Null Rot. Only a trace, but traces spread." },
    ]);
    return;
  }
  if (roomIndex === ROOM_CORE) {
    if (!(getState().heatSifterCleared && getState().foundryCoreAligned)) {
      sayLines([{ speaker: "", text: "The boss lift rejects the route. Three valves and the Heat Sifter still matter." }]);
      return;
    }
    goToRoom(ROOM_BOSS, ROOM_STARTS[ROOM_BOSS], [
      { speaker: "", text: "The Warden's chamber is quieter than the core. The silence has weight." },
    ]);
    return;
  }
  if (roomIndex === ROOM_BOSS) {
    onExitToNextChapter();
  }
}

function onReachSideDoor() {
  goToRoom(ROOM_ARCHIVE, ROOM_STARTS[ROOM_ARCHIVE], [
    { speaker: "", text: "A side archive opens off the intake floor. It smells like old ash and older excuses." },
  ]);
}

function onReachReturnDoor() {
  if (roomIndex === ROOM_ARCHIVE) {
    goToRoom(ROOM_INTAKE, { col: 11, row: 3, facing: "left" }, null);
  } else {
    goToRoom(ROOM_CORE, { col: 6, row: 7, facing: "up" }, null);
  }
}

function onExitToNextChapter() {
  if (!getState().heapWardenDefeated) return;
  if (hasWarnedGateOnce) return;
  hasWarnedGateOnce = true;
  sayLines(
    [
      { speaker: "", text: "The vent shaft leads up, out past the furnace floor into open, restless ground." },
      { speaker: "Mira Vale", text: "That's the Array Plains. Watch your footing - the formations shift out there." },
    ],
    () => {
      if (onExitToChapter3) onExitToChapter3();
    }
  );
}

function bindInput() {
  document.removeEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown);
  const dpad = document.getElementById("dpad-ch2");
  dpad.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => handleDirAction(btn.dataset.dir);
  });
}

function handleDirAction(dir) {
  if (document.getElementById("screen-room-ch2").classList.contains("active") === false) return;
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
  if (document.getElementById("screen-room-ch2").classList.contains("active") === false) return;
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
