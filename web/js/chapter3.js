import { applyPixelArt } from "./pixelart.js";
import { PLAYER_DOWN, LORD_BOGO, SHUFFLE_IMP, GATE_ICON, ARRAY_MARKER_ICON, ARCHIVE_SHARD, PIXEL_SIZE as SPRITE_PX } from "./sprites.js";
import { sayLines, isDialogueActive, advance as advanceDialogue } from "./dialogue.js";
import { getState, setState } from "./state.js";
import { startCodeBattle } from "./codeBattle.js";

export const TILE = 42;
const COLS = 13;
const ROWS = 10;

// 1 wall, 0 floor, 2 marker-post clutter, 3 gate closed, 6 gate open,
// 5 Shuffle Imp (minor), 8 secret, 9 Lord Bogo boss
const BASE_MAP = [
  [1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 2, 9, 2, 0, 0, 2, 0, 1],
  [1, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 1],
  [1, 2, 0, 0, 2, 0, 0, 0, 2, 0, 0, 2, 1],
  [1, 0, 0, 5, 0, 0, 2, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
  [1, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const PLAYER_START = { col: 6, row: 8 };

const STARTER_CODE = `def solve(values):
    ordered = values[:]
    # Use loops and comparisons here. No sorted() or .sort().
    # Swap neighbors when they are out of order.
    return ordered`;

let viewport;
let map;
let player = { ...PLAYER_START, facing: "up" };
let playerEl;
let hasGreeted = false;
let onExitToChapter4 = null;

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
  return [
    sortedCase("sealed_1", shuffledDistinct(4, 9)),
    sortedCase("sealed_2", shuffledDistinct(4, 9)),
  ];
}

function generateSealedBogo() {
  return [
    sortedCase("sealed_1", shuffledDistinct(6, 12)),
    sortedCase("sealed_2", shuffledDistinct(6, 12)),
    sortedCase("sealed_3", shuffledDistinct(6, 12)),
  ];
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
  map = BASE_MAP.map((row) => row.slice());

  const { bogoDefeated, shuffleImpCleared } = getState();
  if (shuffleImpCleared) {
    map[5][5] = 0;
  }
  if (bogoDefeated) {
    map[2][6] = 0;
    map[0][6] = 6;
    map[0][7] = 6;
  }

  player = { ...PLAYER_START, facing: "up" };
  render();
  bindInput();

  if (!hasGreeted) {
    hasGreeted = true;
    window.setTimeout(() => {
      sayLines([
        { speaker: "", text: "The Plains stretch out in restless rows, formations shifting whenever no one looks directly at them." },
        { speaker: "Mira Vale", text: "Lord Bogo thinks disorder is freedom. You'll need code that holds even when he reshuffles it." },
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
        appendIcon(tile, ARRAY_MARKER_ICON, false);
      }
      viewport.appendChild(tile);
    }
  }

  if (map[2][6] === 9) placeEntity("bogo", 6, 2, LORD_BOGO, 5);
  if (map[5][5] === 5) placeEntity("imp", 5, 5, SHUFFLE_IMP, SPRITE_PX);
  if (getState().bogoDefeated) placeEntity("archive-shard", 6, 1, ARCHIVE_SHARD, 3);

  playerEl = placeEntity("player", player.col, player.row, PLAYER_DOWN, SPRITE_PX);
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
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 1;
  return map[row][col];
}

function isBlocking(code) {
  return code === 1 || code === 2 || code === 3 || code === 5 || code === 8 || code === 9;
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
  const { dc, dr } = DIR_OFFSET[dir];
  const targetCol = player.col + dc;
  const targetRow = player.row + dr;
  const code = tileAt(targetCol, targetRow);

  if (code === 5) return enterShuffleImpBattle();
  if (code === 9) return enterLordBogoBattle();
  if (code === 8) return findSecret();
  if (code === 6) return onReachOpenGate();
  if (isBlocking(code)) return;

  player.col = targetCol;
  player.row = targetRow;
  if (playerEl) {
    playerEl.style.left = `${player.col * TILE}px`;
    playerEl.style.top = `${player.row * TILE}px`;
  }
}

function enterShuffleImpBattle() {
  sayLines(
    [{ speaker: "", text: "A Shuffle Imp giggles, scrambling a small formation just to watch it fall apart." }],
    () => {
      startCodeBattle({
        title: "Shuffle Imp",
        starterCode: STARTER_CODE,
        publicCases: [sortedCase("public_mixed", [4, 2, 3])],
        generateSealed: generateSealedShuffleImp,
        enemySprite: SHUFFLE_IMP,
        enemyPixelSize: 6,
        returnScreen: "screen-room-ch3",
        roundHint1: "Write Python def solve(values): and sort the visible formation.",
        roundHint2: "The Archive reshuffled the input. Prove your Python still holds.",
        wonHint: "The formation holds its shape. The imp sulks off.",
        onWin: () => {
          setState({ shuffleImpCleared: true });
          map[5][5] = 0;
          render();
          sayLines([
            { speaker: "Mira Vale", text: "Good. It didn't just work once - it works." },
            { speaker: "", text: "The marker posts stop sliding around the path, at least while your invariant holds." },
          ]);
        },
      });
    }
  );
}

function enterLordBogoBattle() {
  const { bogoDefeated } = getState();
  if (bogoDefeated) {
    sayLines([{ speaker: "Lord Bogo", text: "Order again? How dreadfully reliable of you." }]);
    return;
  }
  sayLines(
    [
      { speaker: "Lord Bogo", text: "Order is just luck that hasn't run out yet!" },
      { speaker: "Lord Bogo", text: "Prove your little rule survives a proper reshuffling." },
    ],
    () => {
      startCodeBattle({
        title: "Lord Bogo, Duke of Randomness",
        starterCode: STARTER_CODE,
        publicCases: [sortedCase("public_mixed", [5, 3, 4, 1, 2])],
        generateSealed: generateSealedBogo,
        enemySprite: LORD_BOGO,
        enemyPixelSize: 6,
        returnScreen: "screen-room-ch3",
        roundHint1: "Write Python sorting logic. Lord Bogo is betting you only memorized the sample.",
        roundHint2: "Fresh random formation. The same Python must survive it.",
        wonHint: "Order confirmed. Even Lord Bogo can't shuffle it loose.",
        onWin: () => {
          setState({ bogoDefeated: true, archiveFragmentAwake: true });
          map[2][6] = 0;
          map[0][6] = 6;
          map[0][7] = 6;
          render();
          sayLines([
            { speaker: "Lord Bogo", text: "...Huh. Still ordered. That is - annoyingly consistent." },
            { speaker: "", text: "The Plains settle. For the first time, the formations hold their shape." },
            { speaker: "", text: "The Archive shard answers with a new route: bridges, missing villages, and a map that refuses to stay connected." },
            { speaker: "Mira Vale", text: "Graphreach. Not ready, but it knows we're coming." },
          ]);
        },
      });
    }
  );
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

function onReachOpenGate() {
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
  if (code === 5) enterShuffleImpBattle();
  else if (code === 9) enterLordBogoBattle();
  else if (code === 8) findSecret();
  else if (code === 6) onReachOpenGate();
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
