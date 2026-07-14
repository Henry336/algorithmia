const SAVE_KEY = "algorithimia-save-v1";

const defaults = {
  chapter: 0,
  playerHp: 40,
  playerFocus: 20,
  runeSnarlCleared: false,
  queueworksValvesAligned: false,
  queueworksGateOpen: false,
  lineCutterCleared: false,
  backlogClerkCleared: false,
  dispatchRoutesAligned: false,
  dispatcherDefeated: false,
  foundDispatcherSecret: false,
  emberSorterCleared: false,
  priorityForgerCleared: false,
  ashAuditorCleared: false,
  heatSifterCleared: false,
  foundryCoreAligned: false,
  heapWardenDefeated: false,
  foundHeaplightSecret: false,
  foundHeaplightArchiveSecret: false,
  foundHeaplightDarkSecret: false,
  shuffleImpCleared: false,
  pivotShadeCleared: false,
  indexGhostCleared: false,
  nullEchoCleared: false,
  arrayMirrorsAligned: false,
  bogoDefeated: false,
  foundArrayPlainsSecret: false,
  foundArrayLibrarySecret: false,
  foundArrayDarkSecret: false,
  bridgeWispCleared: false,
  cycleHoundCleared: false,
  recursiveHuskCleared: false,
  componentHermitCleared: false,
  bridgeAnchorsAligned: false,
  nullFerrymanDefeated: false,
  nullWitnessDefeated: false,
  foundGraphreachSecret: false,
  foundGraphreachChapelSecret: false,
  foundGraphreachDarkSecret: false,
  graphDiamonds: [],
  ldtkChapter5Level: null,
  ldtkChapter5Player: null,
  ldtkChapter5Items: [],
  ldtkChapter5Inventory: [],
  ldtkChapter5Secrets: [],
  citadelSentinelCleared: false,
  memoryScribeCleared: false,
  boundaryRingsAligned: false,
  sourceCustodianDefeated: false,
  foundCitadelSecret: false,
  campaignPuzzleProgress: {},
  campaignVisitedRegions: {},
  campaignCollectibles: {},
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
