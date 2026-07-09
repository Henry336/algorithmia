import { applyPixelArt } from "./pixelart.js";
import { SORTING_SLIME } from "./sprites.js";

const RUNE_COLORS = ["#c94f4f", "#4f7fc9", "#d8c24a", "#8a4fc9", "#5fbf5f", "#e08a3f", "#4fc9b0"];

const screenBattle = document.getElementById("screen-battle");
const screenRoom = document.getElementById("screen-room");
const transition = document.getElementById("screen-transition");
const runeTrack = document.getElementById("rune-track");
const roundLabel = document.getElementById("battle-round-label");
const hintEl = document.getElementById("battle-hint");
const feedbackEl = document.getElementById("battle-feedback");
const checkBtn = document.querySelector('[data-action="check-order"]');
const resetBtn = document.querySelector('[data-action="reset-runes"]');
const swapHintBtn = document.querySelector('[data-action="swap-hint"]');
const enemySpriteHost = document.getElementById("battle-enemy-sprite");

let round = 1; // 1 = public spill, 2 = sealed check
let values = [];
let originalValues = [];
let selectedIndex = null;
let onWinCallback = null;
let locked = false;

applyPixelArt(enemySpriteHost, SORTING_SLIME.matrix, SORTING_SLIME.palette, 6);

function shuffledSealedSet() {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  let picked = pool.slice(0, 5);
  const isSorted = picked.every((v, i) => i === 0 || picked[i - 1] <= v);
  if (isSorted) {
    [picked[0], picked[picked.length - 1]] = [picked[picked.length - 1], picked[0]];
  }
  return picked;
}

export function startSortingSlimeBattle({ onWin }) {
  onWinCallback = onWin;
  round = 1;
  values = [5, 1, 4, 2, 3];
  locked = false;
  wipeTo(() => {
    screenRoom.classList.remove("active");
    screenBattle.classList.add("active");
    setupRound();
  });
}

function setupRound() {
  originalValues = values.slice();
  selectedIndex = null;
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
  checkBtn.disabled = false;
  roundLabel.textContent = round === 1 ? "Public spill" : "Sealed check";
  hintEl.textContent = round === 1
    ? "Select two runes to swap them into ascending order."
    : "The Archive tried a fresh mess. Prove the repair still holds.";
  renderRunes();
}

function renderRunes() {
  runeTrack.innerHTML = "";
  const maxVal = Math.max(...values);
  values.forEach((value, i) => {
    const rune = document.createElement("div");
    rune.className = "rune" + (i === selectedIndex ? " selected" : "");
    rune.dataset.index = String(i);

    const bar = document.createElement("div");
    bar.className = "rune-bar";
    const heightPx = 14 + Math.round((value / maxVal) * 70);
    bar.style.height = `${heightPx}px`;
    bar.style.background = RUNE_COLORS[i % RUNE_COLORS.length];

    const label = document.createElement("div");
    label.className = "rune-value";
    label.textContent = round === 1 ? String(value) : "?";

    rune.appendChild(bar);
    rune.appendChild(label);
    rune.addEventListener("click", () => onRuneClick(i));
    runeTrack.appendChild(rune);
  });
}

function onRuneClick(i) {
  if (locked) return;
  if (selectedIndex === null) {
    selectedIndex = i;
    renderRunes();
    return;
  }
  if (selectedIndex === i) {
    selectedIndex = null;
    renderRunes();
    return;
  }
  [values[selectedIndex], values[i]] = [values[i], values[selectedIndex]];
  selectedIndex = null;
  renderRunes();
}

function isAscending(list) {
  for (let i = 1; i < list.length; i++) {
    if (list[i - 1] > list[i]) return false;
  }
  return true;
}

checkBtn.addEventListener("click", () => {
  if (locked) return;
  if (!isAscending(values)) {
    feedbackEl.textContent = round === 1
      ? "Not yet. The runes still fight the order."
      : "The visible spill held, but the Archive tried a fresh mess and the repair guessed.";
    feedbackEl.classList.add("error");
    return;
  }

  feedbackEl.classList.remove("error");

  if (round === 1) {
    feedbackEl.textContent = "The slime followed your order exactly. That is the problem.";
    round = 2;
    values = shuffledSealedSet();
    locked = true;
    window.setTimeout(() => {
      locked = false;
      setupRound();
    }, 1400);
    return;
  }

  locked = true;
  feedbackEl.textContent = "The route opens. Repair confirmed.";
  checkBtn.disabled = true;
  window.setTimeout(() => {
    wipeTo(() => {
      screenBattle.classList.remove("active");
      screenRoom.classList.add("active");
      const cb = onWinCallback;
      onWinCallback = null;
      if (cb) cb();
    });
  }, 900);
});

resetBtn.addEventListener("click", () => {
  if (locked) return;
  values = originalValues.slice();
  selectedIndex = null;
  renderRunes();
});

swapHintBtn.addEventListener("click", () => {
  if (locked) return;
  hintEl.textContent = "Click one rune, then another, to swap their places.";
});

function wipeTo(afterFadeIn) {
  transition.classList.add("active");
  window.setTimeout(() => {
    afterFadeIn();
    window.setTimeout(() => transition.classList.remove("active"), 60);
  }, 180);
}
