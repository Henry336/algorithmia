import { applyBattleCost, getVitals, MAX_FOCUS, MAX_HP } from "./combatState.js";
import { isAdminMode } from "./admin.js";
import { runPythonRepair, summarizeRepairMetrics } from "./pythonRepairRuntime.js";
import { setState } from "./state.js";
import {
  slimeArenaAdminWin,
  slimeArenaAttack,
  slimeArenaGuard,
  slimeArenaOpenRepair,
  slimeArenaResumeRepair,
  slimeArenaRetry,
  startSlimeArena,
  stopSlimeArena,
} from "./slimeArenaEngine.js";

const STARTER_CODE = `def solve(values):
    ordered = values[:]
    # Compare neighboring values and swap them when needed.
    return ordered`;

const REPAIR_CASES = [
  { name: "visible_spill", input: [5, 1, 4, 2, 3], expected: [1, 2, 3, 4, 5], sealed: false },
  { name: "visible_duplicates", input: [3, 1, 3, 2], expected: [1, 2, 3, 3], sealed: false },
  { name: "sealed_reverse", input: [7, 6, 4, 2, 1], expected: [1, 2, 4, 6, 7], sealed: true },
  { name: "sealed_edges", input: [0, -2, 8, -2, 5], expected: [-2, -2, 0, 5, 8], sealed: true },
];

const screenBattle = document.getElementById("screen-battle");
const screenRoom = document.getElementById("screen-room");
const transition = document.getElementById("screen-transition");
const shell = document.getElementById("slime-arena-shell");
const host = document.getElementById("slime-arena-host");
const bossHpFill = document.getElementById("slime-boss-hp-fill");
const bossHpText = document.getElementById("slime-boss-hp-text");
const phaseLabel = document.getElementById("slime-phase-label");
const waveLabel = document.getElementById("slime-wave-label");
const statusEl = document.getElementById("slime-arena-status");
const playerHpEl = document.getElementById("slime-player-hp");
const playerFocusEl = document.getElementById("slime-player-focus");
const commandPanel = document.getElementById("slime-command-panel");
const repairPanel = document.getElementById("slime-repair-panel");
const defeatPanel = document.getElementById("slime-defeat-panel");
const attackBtn = document.querySelector('[data-action="slime-attack"]');
const useBtn = document.querySelector('[data-action="slime-use"]');
const repairBtn = document.querySelector('[data-action="slime-repair"]');
const guardBtn = document.querySelector('[data-action="slime-guard"]');
const runRepairBtn = document.querySelector('[data-action="run-slime-repair"]');
const leaveRepairBtn = document.querySelector('[data-action="leave-slime-repair"]');
const retryBtn = document.querySelector('[data-action="retry-slime-battle"]');
const adminWinBtn = document.querySelector('[data-action="admin-win-slime"]');
const editor = document.getElementById("slime-repair-editor");
const repairTimerEl = document.getElementById("slime-repair-timer");
const repairResultsEl = document.getElementById("slime-repair-results");
const repairFeedbackEl = document.getElementById("slime-repair-feedback");

let onWinCallback = null;
let savedCode = STARTER_CODE;
let repairTimer = null;
let repairDeadline = 0;
let finishing = false;
let commandIndex = 0;

const commandSelectAudio = new Audio("assets/audio/ui-command-select.wav");
commandSelectAudio.preload = "auto";

function playCommandSelectSound() {
  commandSelectAudio.currentTime = 0;
  commandSelectAudio.play().catch(() => {
    // Browsers may decline audio before the first user gesture.
  });
}

function visibleCommandButtons() {
  return Array.from(commandPanel.querySelectorAll("button:not(:disabled)"))
    .filter((button) => window.getComputedStyle(button).display !== "none");
}

function setPointerLocked(locked) {
  shell.classList.toggle("keyboard-command-mode", locked);
}

function selectCommand(index, { sound = false } = {}) {
  const buttons = visibleCommandButtons();
  if (!buttons.length) return;
  commandIndex = (index + buttons.length) % buttons.length;
  buttons.forEach((button, buttonIndex) => {
    const selected = buttonIndex === commandIndex;
    button.classList.toggle("keyboard-selected", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  buttons[commandIndex].focus({ preventScroll: true });
  if (sound) playCommandSelectSound();
}

function activateSelectedCommand() {
  const buttons = visibleCommandButtons();
  const selected = buttons[commandIndex];
  if (!selected) return;
  playCommandSelectSound();
  selected.click();
}

function onCommandKeyDown(event) {
  if (commandPanel.classList.contains("hidden") || !screenBattle.classList.contains("active")) return;
  if (event.repeat) return;
  if (["ArrowLeft", "KeyA"].includes(event.code)) {
    event.preventDefault();
    selectCommand(commandIndex - 1, { sound: true });
  } else if (["ArrowRight", "KeyD"].includes(event.code)) {
    event.preventDefault();
    selectCommand(commandIndex + 1, { sound: true });
  } else if (["Space", "Enter"].includes(event.code)) {
    event.preventDefault();
    activateSelectedCommand();
  }
}

function onEditorKeyDown(event) {
  event.stopPropagation();
  if (event.key !== "Tab") return;
  event.preventDefault();
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const value = editor.value;

  if (start === end) {
    const indentation = "    ";
    editor.setRangeText(indentation, start, end, "end");
    return;
  }

  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const selected = value.slice(lineStart, end);
  const lines = selected.split("\n");
  const adjusted = event.shiftKey
    ? lines.map((line) => line.replace(/^ {1,4}/, ""))
    : lines.map((line) => `    ${line}`);
  editor.setRangeText(adjusted.join("\n"), lineStart, end, "select");
}

function setHidden(element, hidden) {
  element?.classList.toggle("hidden", hidden);
}

function updateVitals() {
  const vitals = getVitals();
  playerHpEl.textContent = `${vitals.hp}/${MAX_HP}`;
  playerFocusEl.textContent = `${vitals.focus}/${MAX_FOCUS}`;
  return vitals;
}

function updateBossHp(hp, maxHp, phase) {
  const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  bossHpFill.style.width = `${percent}%`;
  bossHpText.textContent = `${hp}/${maxHp}`;
  phaseLabel.textContent = `Phase ${phase}`;
}

function hideOverlays() {
  setHidden(commandPanel, true);
  setHidden(repairPanel, true);
  setHidden(defeatPanel, true);
}

function showCommandWindow({ repaired }) {
  setHidden(commandPanel, false);
  setHidden(repairPanel, true);
  attackBtn.textContent = repaired ? "Attack 15" : "Attack 5";
  statusEl.textContent = repaired
    ? "The repaired ordering exposes a clean weak point."
    : "The core is exposed, but the unsorted shell absorbs most of the hit.";
  setPointerLocked(true);
  selectCommand(0);
}

function clearRepairTimer() {
  if (repairTimer) window.clearInterval(repairTimer);
  repairTimer = null;
}

function closeRepair(repaired = false, quality = "none") {
  clearRepairTimer();
  savedCode = editor.value;
  setHidden(repairPanel, true);
  setPointerLocked(true);
  slimeArenaResumeRepair({ repaired, quality });
}

function openRepair() {
  setHidden(commandPanel, true);
  setHidden(repairPanel, false);
  setPointerLocked(false);
  editor.value = savedCode;
  repairResultsEl.innerHTML = "";
  repairFeedbackEl.textContent = "Sorting Slime is stunned. Your progress is saved when it wakes.";
  repairFeedbackEl.classList.remove("error", "success");
  repairDeadline = Date.now() + 60000;
  clearRepairTimer();
  repairTimer = window.setInterval(() => {
    const seconds = Math.max(0, Math.ceil((repairDeadline - Date.now()) / 1000));
    repairTimerEl.textContent = `Stun: ${seconds}s`;
    if (seconds <= 0) {
      repairFeedbackEl.textContent = "The stun broke. Your code was preserved.";
      closeRepair(false, "none");
    }
  }, 200);
  editor.focus({ preventScroll: true });
}

function renderRepairResults(results) {
  repairResultsEl.innerHTML = "";
  results.forEach((result) => {
    const row = document.createElement("div");
    row.className = `slime-repair-result ${result.pass ? "pass" : "fail"}`;
    const label = result.sealed ? "sealed case" : result.name;
    row.textContent = `${result.pass ? "PASS" : "FAIL"} ${label}${result.error ? ` - ${result.error}` : ""}`;
    repairResultsEl.appendChild(row);
  });
}

async function runRepair() {
  if (runRepairBtn.disabled) return;
  savedCode = editor.value;
  if (/\.sort\s*\(|\bsorted\s*\(/.test(savedCode)) {
    repairFeedbackEl.textContent = "Sorting Slime swallowed the shortcut. Show the ordering logic itself.";
    repairFeedbackEl.classList.add("error");
    return;
  }

  runRepairBtn.disabled = true;
  repairFeedbackEl.classList.remove("error", "success");
  repairFeedbackEl.textContent = "Running Python repair...";
  const outcome = await runPythonRepair(savedCode, REPAIR_CASES);
  runRepairBtn.disabled = false;

  if (!outcome.ok) {
    repairResultsEl.innerHTML = "";
    repairFeedbackEl.textContent = outcome.error;
    repairFeedbackEl.classList.add("error");
    return;
  }

  renderRepairResults(outcome.results);
  if (!outcome.results.every((result) => result.pass)) {
    repairFeedbackEl.textContent = "The visible ordering still breaks on fresh input. The stun clock continues.";
    repairFeedbackEl.classList.add("error");
    return;
  }

  const metrics = summarizeRepairMetrics(outcome.results);
  const quality = metrics.steps <= 120 ? "stable" : "strained";
  repairFeedbackEl.textContent = quality === "stable"
    ? `Repair stable: ${metrics.steps} loop steps. The columns lock into readable order.`
    : `Repair holds, but ${metrics.steps} loop steps make it strain under pressure.`;
  repairFeedbackEl.classList.add("success");
  runRepairBtn.disabled = true;
  window.setTimeout(() => {
    runRepairBtn.disabled = false;
    closeRepair(true, quality);
  }, 950);
}

function handleDefeat() {
  clearRepairTimer();
  setHidden(commandPanel, true);
  setHidden(repairPanel, true);
  setHidden(defeatPanel, false);
  setPointerLocked(false);
  statusEl.textContent = "Patchrunner was pushed out of the execution path.";
  retryBtn.focus({ preventScroll: true });
}

function retryBattle() {
  setState({ playerHp: MAX_HP, playerFocus: MAX_FOCUS });
  updateVitals();
  hideOverlays();
  statusEl.textContent = "The encounter rewinds. Your repair code remains in memory.";
  slimeArenaRetry();
}

function finishBattle() {
  if (finishing) return;
  finishing = true;
  clearRepairTimer();
  window.setTimeout(() => {
    transition.classList.add("active");
    window.setTimeout(() => {
      stopSlimeArena();
      screenBattle.classList.remove("active", "phaser-slime-active");
      screenRoom.classList.add("active");
      shell.classList.add("hidden");
      setPointerLocked(false);
      hideOverlays();
      const callback = onWinCallback;
      onWinCallback = null;
      finishing = false;
      if (callback) callback();
      window.setTimeout(() => transition.classList.remove("active"), 60);
    }, 180);
  }, 520);
}

const callbacks = {
  onBossHp: updateBossHp,
  onStatus(message) {
    statusEl.textContent = message;
  },
  onWave({ phase, wave, name, repaired }) {
    hideOverlays();
    setPointerLocked(true);
    phaseLabel.textContent = `Phase ${phase}`;
    waveLabel.textContent = `${name} / Wave ${wave}${repaired ? " / REPAIRED" : ""}`;
  },
  onAccessOpen() {
    waveLabel.textContent = "Access window open";
  },
  onCommandWindow: showCommandWindow,
  onDamage(amount) {
    const cost = applyBattleCost({ hp: amount });
    statusEl.textContent = `Minion collision: -${cost.hpLost} HP. Knockback applied.`;
    return updateVitals();
  },
  onAttack(amount, repaired) {
    setHidden(commandPanel, true);
    statusEl.textContent = repaired
      ? `Repair-assisted strike: ${amount} damage.`
      : `Unrepaired strike: ${amount} damage. The shell absorbs the rest.`;
  },
  onGuard() {
    setHidden(commandPanel, true);
    statusEl.textContent = "Guard armed. The next collision will be absorbed.";
  },
  onGuardBlocked() {
    statusEl.textContent = "Guard absorbed the collision. No HP lost.";
  },
  onRepairOpened: openRepair,
  onDefeat: handleDefeat,
  onWin: finishBattle,
};

attackBtn.addEventListener("click", () => slimeArenaAttack());
useBtn.addEventListener("click", () => {
  statusEl.textContent = "No abilities are installed yet. The access window remains open.";
});
repairBtn.addEventListener("click", () => slimeArenaOpenRepair());
guardBtn.addEventListener("click", () => slimeArenaGuard());
runRepairBtn.addEventListener("click", runRepair);
leaveRepairBtn.addEventListener("click", () => closeRepair(false, "none"));
retryBtn.addEventListener("click", retryBattle);
adminWinBtn.addEventListener("click", () => {
  if (isAdminMode()) slimeArenaAdminWin();
});
document.addEventListener("keydown", onCommandKeyDown);
editor.addEventListener("keydown", onEditorKeyDown);

export function startSortingSlimeArenaBattle({ onWin }) {
  onWinCallback = onWin;
  finishing = false;
  clearRepairTimer();
  hideOverlays();
  updateVitals();
  updateBossHp(45, 45, 1);
  phaseLabel.textContent = "Phase 1";
  waveLabel.textContent = "Room sealed";
  statusEl.textContent = "Sorting Slime is entering the execution space.";
  adminWinBtn.classList.toggle("visible", isAdminMode());
  shell.classList.remove("hidden");
  setPointerLocked(true);
  screenBattle.classList.add("phaser-slime-active");

  transition.classList.add("active");
  window.setTimeout(() => {
    screenRoom.classList.remove("active");
    screenBattle.classList.add("active");
    host.innerHTML = "";
    startSlimeArena(host, callbacks);
    window.setTimeout(() => transition.classList.remove("active"), 60);
  }, 180);
}
