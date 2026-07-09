import { MAX_FOCUS, MAX_HP, getVitals } from "./combatState.js";
import { renderPatchrunnerPortrait } from "./playerSprite.js";

function setText(el, value) {
  if (el) el.textContent = value;
}

export function initBattleHud(screen, { objective = "", enemyStatus = "Corruption active" } = {}) {
  const portraitHost = screen.querySelector("[data-battle-player-sprite]");
  if (portraitHost) {
    portraitHost.innerHTML = "";
    renderPatchrunnerPortrait(portraitHost, "south");
  }
  setText(screen.querySelector("[data-battle-objective]"), objective);
  setText(screen.querySelector("[data-battle-enemy-status]"), enemyStatus);
  clearBattleLog(screen);
  updateBattleVitals(screen);
}

export function updateBattleVitals(screen) {
  const vitals = getVitals();
  setText(screen.querySelector("[data-battle-hp]"), `${vitals.hp}/${MAX_HP}`);
  setText(screen.querySelector("[data-battle-focus]"), `${vitals.focus}/${MAX_FOCUS}`);
}

export function clearBattleLog(screen) {
  const log = screen.querySelector("[data-battle-log]");
  if (log) log.innerHTML = "";
}

export function logBattle(screen, message, tone = "") {
  const log = screen.querySelector("[data-battle-log]");
  if (!log) return;
  const row = document.createElement("div");
  row.className = "battle-log-row" + (tone ? ` ${tone}` : "");
  row.textContent = message;
  log.prepend(row);
}

export function describeCost(cost) {
  const parts = [];
  if (cost.hpLost) parts.push(`-${cost.hpLost} HP`);
  if (cost.focusLost) parts.push(`-${cost.focusLost} Focus`);
  return parts.length ? parts.join(", ") : "no damage";
}
