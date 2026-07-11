import { applyBattleCost, getVitals, MAX_FOCUS, MAX_HP } from "./combatState.js";
import { playMusic, playSound, stopAllAudio } from "./audio.js";
import { isAdminMode } from "./admin.js";
import { runPythonRepair, summarizeRepairMetrics } from "./pythonRepairRuntime.js";
import { setState } from "./state.js";
import { SLIME_REPAIR_TASKS } from "./slimeRepairTasks.js";
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

const screenBattle = document.getElementById("screen-battle");
const screenRoom = document.getElementById("screen-room");
const transition = document.getElementById("screen-transition");
const shell = document.getElementById("slime-arena-shell");
const host = document.getElementById("slime-arena-host");
const bossHpFill = document.getElementById("slime-boss-hp-fill");
const bossHpText = document.getElementById("slime-boss-hp-text");
const shieldRow = document.getElementById("slime-null-shield-row");
const shieldFill = document.getElementById("slime-null-shield-fill");
const shieldText = document.getElementById("slime-null-shield-text");
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
const hintBtn = document.querySelector('[data-action="show-slime-hint"]');
const leaveRepairBtn = document.querySelector('[data-action="leave-slime-repair"]');
const retryBtn = document.querySelector('[data-action="retry-slime-battle"]');
const adminWinBtn = document.querySelector('[data-action="admin-win-slime"]');
const editor = document.getElementById("slime-repair-editor");
const repairTimerEl = document.getElementById("slime-repair-timer");
const repairResultsEl = document.getElementById("slime-repair-results");
const repairFeedbackEl = document.getElementById("slime-repair-feedback");
const repairTitleEl = document.getElementById("slime-repair-title");
const repairRequirementEl = document.getElementById("slime-repair-requirement");
const repairExampleEl = document.getElementById("slime-repair-example");
const repairHintEl = document.getElementById("slime-repair-hint");

let onWinCallback = null;
const savedCodeByPhase = new Map();
let repairTimer = null;
let repairDeadline = 0;
let finishing = false;
let commandIndex = 0;
let activePhase = 1;
let hintIndex = 0;

function playCommandSelectSound() {
  playSound("commandSelect");
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

function updateBossShield(hp, maxHp, active) {
  const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  shieldFill.style.width = `${percent}%`;
  shieldText.textContent = active ? `${hp}/${maxHp}` : "BREACHED";
  shieldRow.classList.toggle("active", active);
  shieldRow.classList.toggle("breached", !active);
}

function hideOverlays() {
  setHidden(commandPanel, true);
  setHidden(repairPanel, true);
  setHidden(defeatPanel, true);
}

function showCommandWindow({ repaired, phase }) {
  activePhase = phase;
  setHidden(commandPanel, false);
  setHidden(repairPanel, true);
  attackBtn.textContent = "Attack 5";
  statusEl.textContent = repaired
    ? "The Null shield is breached. A direct strike will damage the core."
    : "The 100 HP Null shield is still compiled. Repair is the clean breach.";
  setPointerLocked(true);
  selectCommand(0);
}

function clearRepairTimer() {
  if (repairTimer) window.clearInterval(repairTimer);
  repairTimer = null;
}

function closeRepair(repaired = false, quality = "none") {
  clearRepairTimer();
  savedCodeByPhase.set(activePhase, editor.value);
  setHidden(repairPanel, true);
  setPointerLocked(true);
  slimeArenaResumeRepair({ repaired, quality });
}

function openRepair() {
  const repair = SLIME_REPAIR_TASKS[activePhase];
  setHidden(commandPanel, true);
  setHidden(repairPanel, false);
  setPointerLocked(false);
  editor.value = savedCodeByPhase.get(activePhase) || repair.starter;
  repairTitleEl.textContent = repair.title;
  repairRequirementEl.textContent = repair.requirement;
  repairExampleEl.textContent = repair.example;
  hintIndex = 0;
  hintBtn.textContent = "Show Hint";
  hintBtn.disabled = false;
  setHidden(repairHintEl, true);
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
  const repair = SLIME_REPAIR_TASKS[activePhase];
  const savedCode = editor.value;
  savedCodeByPhase.set(activePhase, savedCode);
  if (/\.sort\s*\(|\bsorted\s*\(|\.reverse\s*\(/.test(savedCode)) {
    repairFeedbackEl.textContent = "Sorting Slime swallowed the shortcut. Show the ordering logic itself.";
    repairFeedbackEl.classList.add("error");
    return;
  }

  runRepairBtn.disabled = true;
  repairFeedbackEl.classList.remove("error", "success");
  repairFeedbackEl.textContent = "Running Python repair...";
  const outcome = await runPythonRepair(savedCode, repair.cases);
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
    ? `Repair stable: ${metrics.steps} loop steps. ${repair.success}`
    : `Repair holds, but ${metrics.steps} loop steps make it strain under pressure.`;
  repairFeedbackEl.classList.add("success");
  runRepairBtn.disabled = true;
  window.setTimeout(() => {
    runRepairBtn.disabled = false;
    closeRepair(true, quality);
  }, 950);
}

function showNextHint() {
  const repair = SLIME_REPAIR_TASKS[activePhase];
  const hint = repair.hints[hintIndex];
  if (!hint) return;
  repairHintEl.textContent = `Hint ${hintIndex + 1}/${repair.hints.length}: ${hint}`;
  setHidden(repairHintEl, false);
  hintIndex += 1;
  if (hintIndex >= repair.hints.length) {
    hintBtn.textContent = "All Hints Shown";
    hintBtn.disabled = true;
  } else {
    hintBtn.textContent = "Next Hint";
  }
}

function handleDefeat() {
  clearRepairTimer();
  stopAllAudio();
  setHidden(commandPanel, true);
  setHidden(repairPanel, true);
  setHidden(defeatPanel, false);
  setPointerLocked(false);
  statusEl.textContent = "Patchrunner was pushed out of the execution path.";
  retryBtn.focus({ preventScroll: true });
}

function retryBattle() {
  playMusic("slimeBossPhase12", { restart: true });
  setState({ playerHp: MAX_HP, playerFocus: MAX_FOCUS });
  updateVitals();
  hideOverlays();
  statusEl.textContent = "The encounter rewinds. Your repair code remains in memory.";
  slimeArenaRetry();
}

function finishBattle() {
  if (finishing) return;
  finishing = true;
  stopAllAudio();
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
  onBossShield: updateBossShield,
  onStatus(message) {
    statusEl.textContent = message;
  },
  onWave({ phase, wave, name, repaired }) {
    playMusic(phase >= 3 ? "slimeBossPhase3" : "slimeBossPhase12");
    activePhase = phase;
    hideOverlays();
    setPointerLocked(true);
    phaseLabel.textContent = `Phase ${phase}`;
    waveLabel.textContent = `${name} / Wave ${wave}${repaired ? " / REPAIRED" : ""}`;
  },
  onCommandWindow: showCommandWindow,
  onDamage(amount, guarded) {
    playSound("hitHurt");
    const cost = applyBattleCost({ hp: amount });
    statusEl.textContent = guarded
      ? `Guard halves the collision: -${cost.hpLost} HP.`
      : `Minion collision: -${cost.hpLost} HP. Knockback applied.`;
    return updateVitals();
  },
  onAttack(amount, repaired, shielded) {
    playSound("hitHurt");
    setHidden(commandPanel, true);
    statusEl.textContent = shielded
      ? `The strike removes ${amount} shield HP. Repair can breach all 100 at once.`
      : `Direct strike: ${amount} core damage. Sorting Slime launches Patchrunner away.`;
  },
  onGuard(duration) {
    setHidden(commandPanel, true);
    statusEl.textContent = `Guard compiled for ${duration / 1000} seconds: incoming damage halved.`;
  },
  onGuardBlocked(amount) {
    statusEl.textContent = `Guard holds: collision reduced to ${amount} HP.`;
  },
  onGuardExpired() {
    statusEl.textContent = "Guard shield expired.";
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
hintBtn.addEventListener("click", showNextHint);
leaveRepairBtn.addEventListener("click", () => closeRepair(false, "none"));
retryBtn.addEventListener("click", retryBattle);
adminWinBtn.addEventListener("click", () => {
  if (isAdminMode()) slimeArenaAdminWin();
});
document.addEventListener("keydown", onCommandKeyDown);
editor.addEventListener("keydown", onEditorKeyDown);

export function startSortingSlimeArenaBattle({ onWin }) {
  stopAllAudio();
  onWinCallback = onWin;
  finishing = false;
  clearRepairTimer();
  hideOverlays();
  updateVitals();
  updateBossHp(45, 45, 1);
  updateBossShield(100, 100, true);
  activePhase = 1;
  phaseLabel.textContent = "Phase 1";
  waveLabel.textContent = "Room sealed";
  statusEl.textContent = "Sorting Slime is entering the execution space.";
  adminWinBtn.classList.toggle("visible", isAdminMode());
  shell.classList.remove("hidden");
  setPointerLocked(true);
  screenBattle.classList.add("phaser-slime-active");
  playMusic("slimeBossPhase12", { restart: true });

  transition.classList.add("active");
  window.setTimeout(() => {
    screenRoom.classList.remove("active");
    screenBattle.classList.add("active");
    host.innerHTML = "";
    startSlimeArena(host, callbacks);
    window.setTimeout(() => transition.classList.remove("active"), 60);
  }, 180);
}
