import { applyPixelArt } from "./pixelart.js";
import { ARCHIVE_SHARD, GATE_ICON, QUEUE_RAIL_ICON, RUNE_SNARL, SORTING_SLIME, PIXEL_SIZE as SPRITE_PX } from "./sprites.js";
import { animatePatchrunnerStep, placeMiraEntity, placePatchrunnerEntity, updatePatchrunnerFacing } from "./playerSprite.js";
import { sayLines, isDialogueActive, advance as advanceDialogue } from "./dialogue.js";
import { getState, setState } from "./state.js";
import { startSortingSlimeBattle } from "./battle.js";

export const TILE = 42;
const COLS = 11;
const ROWS = 9;

// Tile legend: 1 wall, 0 floor, 2 ledger clutter, 3 gate, 4 mira, 5 sorting slime, 6 gate-floor-once-open, 7 rune snarl
const BASE_MAP = [
  [1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1],
  [1, 0, 0, 0, 0, 5, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 4, 0, 0, 0, 0, 0, 7, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const PLAYER_START = { col: 5, row: 7 };
const SORTING_SLIME_POS = { col: 5, row: 3 };
const RUNE_SNARL_POS = { col: 8, row: 5 };

let viewport;
let map;
let player = { ...PLAYER_START, facing: "down" };
let playerEl;
let hasGreeted = false;
let hasWarnedGateOnce = false;
let inputBusy = false;
let onExitToChapter1 = null;

export function initRoom({ onExitToChapter1: exitHandler } = {}) {
  onExitToChapter1 = exitHandler || null;
  viewport = document.getElementById("room-viewport");
  viewport.className = "room-viewport theme-queueworks";
  viewport.style.width = `${COLS * TILE}px`;
  viewport.style.height = `${ROWS * TILE}px`;
  viewport.style.transformOrigin = "top center";
  fitViewportToScreen();
  window.removeEventListener("resize", fitViewportToScreen);
  window.addEventListener("resize", fitViewportToScreen);
  map = BASE_MAP.map((row) => row.slice());

  const { queueworksGateOpen, runeSnarlCleared } = getState();
  if (runeSnarlCleared) {
    map[RUNE_SNARL_POS.row][RUNE_SNARL_POS.col] = 0;
  }
  if (queueworksGateOpen) {
    map[SORTING_SLIME_POS.row][SORTING_SLIME_POS.col] = 0; // slime cleared
    map[0][4] = 6;
    map[0][5] = 6;
  }

  player = { ...PLAYER_START, facing: "down" };
  render();
  bindInput();

  if (!hasGreeted) {
    hasGreeted = true;
    window.setTimeout(() => {
      sayLines([
        { speaker: "", text: "The Queueworks intake hums with stalled machinery." },
        { speaker: "", text: "A stair to the north sits jammed behind a locked gate." },
      ]);
    }, 250);
  }
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
      if (code === 3 || code === 6) {
        appendIcon(tile, GATE_ICON, code === 6);
      } else if (code === 2) {
        appendIcon(tile, QUEUE_RAIL_ICON, false);
      }
      viewport.appendChild(tile);
    }
  }

  const { queueworksGateOpen } = getState();
  if (map[SORTING_SLIME_POS.row][SORTING_SLIME_POS.col] === 5) {
    placeEntity("slime", SORTING_SLIME_POS.col, SORTING_SLIME_POS.row, SORTING_SLIME);
  }
  if (map[RUNE_SNARL_POS.row][RUNE_SNARL_POS.col] === 7) {
    placeEntity("rune-snarl", RUNE_SNARL_POS.col, RUNE_SNARL_POS.row, RUNE_SNARL);
  }
  if (queueworksGateOpen) {
    placeEntity("archive-shard", 5, 1, ARCHIVE_SHARD, 3);
  }
  placeMiraEntity(viewport, 2, 5, TILE, "down");

  playerEl = placePatchrunnerEntity(viewport, player.col, player.row, TILE, player.facing);
}

function tileClass(code, r, c) {
  if (code === 1) return "tile-wall";
  if (code === 3) return "tile-gate";
  if (code === 6) return "tile-gate open";
  if (code === 2) return "tile-ledger";
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

function placeEntity(id, col, row, sprite) {
  let el = viewport.querySelector(`[data-entity="${id}"]`);
  if (!el) {
    el = document.createElement("div");
    el.className = "entity";
    el.dataset.entity = id;
    viewport.appendChild(el);
    const inner = document.createElement("div");
    applyPixelArt(inner, sprite.matrix, sprite.palette, SPRITE_PX);
    el.appendChild(inner);
  }
  el.style.width = `${TILE}px`;
  el.style.height = `${TILE}px`;
  el.style.left = `${col * TILE}px`;
  el.style.top = `${row * TILE}px`;
  return el;
}

function tileAt(col, row) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 1;
  return map[row][col];
}

function isBlocking(code) {
  return code === 1 || code === 2 || code === 3 || code === 4 || code === 5 || code === 7;
}

const DIR_OFFSET = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
};

function tryMove(dir) {
  if (isDialogueActive() || inputBusy) return;
  player.facing = dir;
  updatePatchrunnerFacing(playerEl, player.facing);
  const { dc, dr } = DIR_OFFSET[dir];
  const targetCol = player.col + dc;
  const targetRow = player.row + dr;
  const code = tileAt(targetCol, targetRow);

  if (code === 4) {
    talkToMira();
    return;
  }
  if (code === 5) {
    enterSortingSlimeBattle();
    return;
  }
  if (code === 7) {
    enterRuneSnarlBattle();
    return;
  }
  if (code === 6) {
    onReachOpenGate();
    return;
  }
  if (isBlocking(code)) return;

  player.col = targetCol;
  player.row = targetRow;
  if (playerEl) {
    playerEl.style.left = `${player.col * TILE}px`;
    playerEl.style.top = `${player.row * TILE}px`;
    animatePatchrunnerStep(playerEl);
  }
}

function talkToMira() {
  const { queueworksGateOpen } = getState();
  if (queueworksGateOpen) {
    sayLines([{ speaker: "Mira Vale", text: "Route's clear. Nice work back there." }]);
    return;
  }
  sayLines([
    { speaker: "Mira Vale", text: "The intake is jammed. Put the runes in order and we can reopen the stair." },
    { speaker: "Mira Vale", text: "The slime is holding the intake shut. Sort the runes and test the repair." },
  ]);
}

function enterSortingSlimeBattle() {
  sayLines(
    [{ speaker: "Mira Vale", text: "That's the slime. Sort the runes and test the repair?" }],
    () => {
      startSortingSlimeBattle({
        onWin: () => {
          setState({ queueworksGateOpen: true });
          map[3][5] = 0;
          map[0][4] = 6;
          map[0][5] = 6;
          render();
          sayLines([
            { speaker: "Mira Vale", text: "Good. It works when the mess changes. That is a repair." },
            { speaker: "", text: "A small Archive shard wakes above the intake, bright as a remembered route." },
            { speaker: "", text: "The stair accepts the repair and the intake starts moving again." },
          ]);
        },
      });
    }
  );
}

function enterRuneSnarlBattle() {
  sayLines(
    [{ speaker: "", text: "Loose routing runes knot into a sparking snarl across the side lane." }],
    () => {
      startSortingSlimeBattle({
        title: "Rune Snarl",
        enemySprite: RUNE_SNARL,
        publicValues: [4, 2, 5, 1],
        onWin: () => {
          setState({ runeSnarlCleared: true });
          map[RUNE_SNARL_POS.row][RUNE_SNARL_POS.col] = 0;
          render();
          sayLines([
            { speaker: "Mira Vale", text: "Good. Same ordering rule, smaller mess. That is how repairs become habits." },
            { speaker: "", text: "The side lane stops spitting loose runes." },
          ]);
        },
      });
    }
  );
}

function onReachOpenGate() {
  if (hasWarnedGateOnce) return;
  hasWarnedGateOnce = true;
  sayLines(
    [
      { speaker: "", text: "The stair accepts the repair. It leads up into the dispatch hall." },
      { speaker: "Mira Vale", text: "That's the Dispatcher's line. Careful up there." },
    ],
    () => {
      if (onExitToChapter1) onExitToChapter1();
    }
  );
}

function bindInput() {
  document.removeEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown);

  const dpad = document.getElementById("dpad");
  dpad.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => handleDirAction(btn.dataset.dir);
  });
}

function handleDirAction(dir) {
  if (document.getElementById("screen-room").classList.contains("active") === false) return;
  if (dir === "interact") {
    if (isDialogueActive()) {
      advanceDialogue();
    } else {
      interactFacing();
    }
    return;
  }
  if (isDialogueActive()) return;
  tryMove(dir);
}

function interactFacing() {
  if (isDialogueActive()) return;
  const { dc, dr } = DIR_OFFSET[player.facing];
  const code = tileAt(player.col + dc, player.row + dr);
  if (code === 4) talkToMira();
  else if (code === 5) enterSortingSlimeBattle();
  else if (code === 7) enterRuneSnarlBattle();
  else if (code === 6) onReachOpenGate();
}

function onKeyDown(e) {
  if (document.getElementById("screen-room").classList.contains("active") === false) return;
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
