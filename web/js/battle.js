import { applyPixelArt } from "./pixelart.js";
import { applyBattleCost } from "./combatState.js";
import { describeCost, initBattleHud, logBattle, updateBattleVitals } from "./battleHud.js";
import { renderSortingSlimeBattleSprite } from "./playerSprite.js";
import { isAdminMode } from "./admin.js";

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
const adminWinBtn = document.querySelector('[data-action="admin-win-rune"]');
const enemySpriteHost = document.getElementById("battle-enemy-sprite");
const titleEl = document.getElementById("battle-title");

let round = 1; // 1 = public spill, 2 = sealed check
let values = [];
let originalValues = [];
let selectedIndex = null;
let onWinCallback = null;
let locked = false;
let swapCount = 0;
let wrongChecks = 0;
let cleanSwapTarget = 0;

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

export function startSortingSlimeBattle({ onWin, title = "Sorting Slime", enemySprite = null, publicValues = [5, 1, 4, 2, 3] }) {
  onWinCallback = onWin;
  round = 1;
  values = publicValues.slice();
  locked = false;
  titleEl.textContent = title;
  if (enemySprite) {
    applyPixelArt(enemySpriteHost, enemySprite.matrix, enemySprite.palette, 6);
  } else {
    renderSortingSlimeBattleSprite(enemySpriteHost, "south");
  }
  initBattleHud(screenBattle, {
    objective: "Sort the spill without wasting motion. Extra swaps drain Focus; wrong checks break HP.",
    enemyStatus: round === 1 ? "Public spill exposed" : "Sealed spill hidden",
  });
  wipeTo(() => {
    screenRoom.classList.remove("active");
    screenBattle.classList.add("active");
    setupRound();
  });
}

function setupRound() {
  originalValues = values.slice();
  selectedIndex = null;
  swapCount = 0;
  wrongChecks = 0;
  cleanSwapTarget = minimumSwapCountToSort(values);
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("error");
  checkBtn.disabled = false;
  roundLabel.textContent = round === 1 ? "Public spill" : "Sealed check";
  initBattleHud(screenBattle, {
    objective: round === 1
      ? "Sort the visible runes, then prove the same repair on fresh input."
      : "The values are hidden. Your swap pattern still has to make the order true.",
    enemyStatus: round === 1 ? "Watching public order" : "Testing generalization",
  });
  logBattle(screenBattle, `Target work: ${cleanSwapTarget} clean swaps for this spill.`, "warning");
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
  swapCount += 1;
  logBattle(screenBattle, `Swap ${swapCount}: positions ${selectedIndex + 1} and ${i + 1}.`);
  selectedIndex = null;
  renderRunes();
}

function isAscending(list) {
  for (let i = 1; i < list.length; i++) {
    if (list[i - 1] > list[i]) return false;
  }
  return true;
}

function minimumSwapCountToSort(list) {
  const indexed = list.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const visited = Array(list.length).fill(false);
  let swaps = 0;
  for (let i = 0; i < list.length; i++) {
    if (visited[i] || indexed[i].index === i) continue;
    let cycleSize = 0;
    let j = i;
    while (!visited[j]) {
      visited[j] = true;
      j = indexed[j].index;
      cycleSize += 1;
    }
    if (cycleSize > 1) {
      swaps += cycleSize - 1;
    }
  }
  return swaps;
}

function applyRuneMistake(message, hp, focus) {
  wrongChecks += 1;
  const cost = applyBattleCost({ hp, focus });
  updateBattleVitals(screenBattle);
  logBattle(screenBattle, `${message} ${describeCost(cost)}.`, "danger");
}

function scoreRuneRound() {
  const extraSwaps = Math.max(0, swapCount - cleanSwapTarget);
  if (!extraSwaps) {
    logBattle(screenBattle, `Work cost: ${swapCount} swaps. Clean repair.`, "good");
    return;
  }
  const cost = applyBattleCost({
    hp: round === 2 ? Math.floor(extraSwaps / 2) : 0,
    focus: Math.min(6, extraSwaps),
  });
  updateBattleVitals(screenBattle);
  logBattle(screenBattle, `Work cost: ${swapCount} swaps, ${extraSwaps} over target. ${describeCost(cost)}.`, "warning");
}

checkBtn.addEventListener("click", () => {
  if (locked) return;
  if (!isAscending(values)) {
    feedbackEl.textContent = round === 1
      ? "Not yet. The runes still fight the order."
      : "The visible spill held, but the Archive tried a fresh mess and the repair guessed.";
    feedbackEl.classList.add("error");
    applyRuneMistake(`Bad check ${wrongChecks + 1}: order failed.`, round === 1 ? 2 : 4, 1);
    return;
  }

  feedbackEl.classList.remove("error");
  scoreRuneRound();

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
  logBattle(screenBattle, "Sealed repair held. Enemy route opened.", "good");
  checkBtn.disabled = true;
  window.setTimeout(() => {
    finishBattle();
  }, 900);
});

resetBtn.addEventListener("click", () => {
  if (locked) return;
  values = originalValues.slice();
  selectedIndex = null;
  swapCount = 0;
  logBattle(screenBattle, "Reset current spill. Work counter cleared.");
  renderRunes();
});

swapHintBtn.addEventListener("click", () => {
  if (locked) return;
  hintEl.textContent = "Click one rune, then another, to swap their places.";
});

adminWinBtn.addEventListener("click", () => {
  if (!isAdminMode() || !onWinCallback) return;
  locked = true;
  checkBtn.disabled = true;
  feedbackEl.classList.remove("error");
  feedbackEl.textContent = "Admin repair accepted.";
  logBattle(screenBattle, "Admin mode completed this rune encounter.", "good");
  finishBattle();
});

function finishBattle() {
  wipeTo(() => {
    screenBattle.classList.remove("active");
    screenRoom.classList.add("active");
    const cb = onWinCallback;
    onWinCallback = null;
    if (cb) cb();
  });
}

function wipeTo(afterFadeIn) {
  transition.classList.add("active");
  window.setTimeout(() => {
    afterFadeIn();
    window.setTimeout(() => transition.classList.remove("active"), 60);
  }, 180);
}
