const SAVE_KEY = "algorithimia-save-v1";

const defaults = {
  chapter: 0,
  playerHp: 40,
  playerFocus: 20,
  runeSnarlCleared: false,
  queueworksGateOpen: false,
  lineCutterCleared: false,
  backlogClerkCleared: false,
  dispatcherDefeated: false,
  foundDispatcherSecret: false,
  emberSorterCleared: false,
  priorityForgerCleared: false,
  heapWardenDefeated: false,
  foundHeaplightSecret: false,
  shuffleImpCleared: false,
  pivotShadeCleared: false,
  bogoDefeated: false,
  foundArrayPlainsSecret: false,
  archiveFragmentAwake: false,
  textSpeed: "normal",
};

let state = loadSave() || { ...defaults };

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function getState() {
  return state;
}

export function setState(patch) {
  state = { ...state, ...patch };
  persist();
}

export function resetState() {
  state = { ...defaults };
  localStorage.removeItem(SAVE_KEY);
}

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures (private browsing, quota, etc.)
  }
}
