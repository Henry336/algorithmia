import { getState, setState } from "./state.js";

export const MAX_HP = 40;
export const MAX_FOCUS = 20;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getVitals() {
  const state = getState();
  return {
    hp: clamp(Number(state.playerHp ?? MAX_HP), 0, MAX_HP),
    focus: clamp(Number(state.playerFocus ?? MAX_FOCUS), 0, MAX_FOCUS),
  };
}

export function applyBattleCost({ hp = 0, focus = 0 } = {}) {
  const vitals = getVitals();
  const next = {
    playerHp: clamp(vitals.hp - hp, 0, MAX_HP),
    playerFocus: clamp(vitals.focus - focus, 0, MAX_FOCUS),
  };
  setState(next);
  return {
    hp: next.playerHp,
    focus: next.playerFocus,
    hpLost: Math.max(0, hp),
    focusLost: Math.max(0, focus),
  };
}

export function restoreFocus(amount = 1) {
  const vitals = getVitals();
  const nextFocus = clamp(vitals.focus + amount, 0, MAX_FOCUS);
  setState({ playerFocus: nextFocus });
  return { hp: vitals.hp, focus: nextFocus };
}
