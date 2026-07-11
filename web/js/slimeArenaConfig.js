// These are the main balancing knobs for the Sorting Slime fight.
// Keeping them together makes difficulty changes easy to review.
export const SLIME_ARENA = Object.freeze({
  width: 960,
  height: 540,
  floorTop: 68,
  floorBottom: 488,
  playerStartX: 70,
  bossX: 868,
  rows: 7,
  bossMaxHp: 45,
  nullShieldMax: 100,
  guardDurationMs: 5000,
  playerSpeed: 245,
  phaseSpawnDelayMs: Object.freeze({
    1: Object.freeze({ broken: 620, repaired: 760 }),
    2: Object.freeze({ broken: 720, repaired: 980 }),
    3: Object.freeze({ broken: 760, repaired: 1120 }),
  }),
  phaseNames: Object.freeze({
    1: "Insertion March",
    2: "Merge Flood",
    3: "Overflow Spiral",
  }),
});

export function phaseForBossHp(hp) {
  if (hp > 30) return 1;
  if (hp > 15) return 2;
  return 3;
}

export function arenaRowY(index) {
  const span = SLIME_ARENA.floorBottom - SLIME_ARENA.floorTop;
  return SLIME_ARENA.floorTop + (span * index) / (SLIME_ARENA.rows - 1);
}
