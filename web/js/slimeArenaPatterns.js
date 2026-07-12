import { arenaRowY, SLIME_ARENA } from "./slimeArenaConfig.js";

// Pattern functions receive the Phaser scene so they can create hazards.
// They only decide where hazards appear. HP, commands, and phase changes stay in the engine.

export function spawnInsertionMarch(scene, Phaser) {
  if (scene.mode !== "dodge") return;

  if (scene.repaired) {
    const heights = [1, 2, 3, 4, 5, 4, 3, 2];
    const height = heights[scene.patternStep % heights.length];
    const fromTop = Math.floor(scene.patternStep / heights.length) % 2 === 0;
    scene.patternStep += 1;
    const warningY = fromTop
      ? arenaRowY((height - 1) / 2)
      : arenaRowY(SLIME_ARENA.rows - 1 - (height - 1) / 2);
    const warning = scene.trackHazardEffect(scene.add.rectangle(SLIME_ARENA.width - 46, warningY, 12, Math.max(42, height * 58), 0x8eeaff, 0.22).setDepth(2));
    scene.tweens.add({ targets: warning, alpha: 0.72, duration: 150, yoyo: true, repeat: 2, onComplete: () => warning.destroy() });

    for (let index = 0; index < height; index += 1) {
      const row = fromTop ? index : SLIME_ARENA.rows - 1 - index;
      const minion = scene.minions.create(SLIME_ARENA.width + 44, arenaRowY(row), "sorting-slime");
      minion.setDisplaySize(56, 56).setDepth(5).setVelocityX(-154).setAlpha(0.8);
      minion.body.setSize(34, 34).setOffset(23, 23);
      scene.tweens.add({ targets: minion, scaleY: minion.scaleY * 0.82, duration: 340, yoyo: true, repeat: -1 });
    }
    return;
  }

  const gap = Phaser.Math.Between(1, SLIME_ARENA.rows - 2);
  scene.patternStep += 1;
  const warning = scene.trackHazardEffect(scene.add.rectangle(SLIME_ARENA.width - 46, arenaRowY(gap), 12, 58, 0xc66cff, 0.24).setDepth(2));
  scene.tweens.add({ targets: warning, alpha: 0.75, duration: 180, yoyo: true, repeat: 2, onComplete: () => warning.destroy() });

  for (let row = 0; row < SLIME_ARENA.rows; row += 1) {
    if (row === gap) continue;
    const minion = scene.minions.create(SLIME_ARENA.width + 44, arenaRowY(row), "sorting-slime");
    minion.setDisplaySize(56, 56).setDepth(5).setVelocityX(-176).setAlpha(0.96);
    minion.body.setSize(34, 34).setOffset(23, 23);
    scene.tweens.add({ targets: minion, scaleY: minion.scaleY * 0.82, duration: 340, yoyo: true, repeat: -1 });
  }
}

export function spawnMergeFlood(scene, Phaser) {
  if (scene.mode !== "dodge") return;
  const count = scene.repaired ? 3 : Phaser.Math.Between(5, 7);
  const anchorX = Phaser.Math.Between(250, 690);
  const anchorY = arenaRowY(Phaser.Math.Between(1, SLIME_ARENA.rows - 2));

  for (let index = 0; index < count; index += 1) {
    const x = scene.repaired ? anchorX + (index - 1) * 44 : Phaser.Math.Between(170, 730);
    const y = scene.repaired ? anchorY : Phaser.Math.Between(SLIME_ARENA.floorTop, SLIME_ARENA.floorBottom);
    const warning = scene.trackHazardEffect(scene.add.circle(x, y, 24, 0xc66cff, 0.2).setStrokeStyle(2, 0xf0b2ff, 0.8).setDepth(3));
    scene.tweens.add({ targets: warning, scaleX: 1.35, scaleY: 1.35, alpha: 0.8, duration: 240, yoyo: true, repeat: 1 });
    scene.waveEvents.push(scene.time.delayedCall(420, () => {
      warning.destroy();
      if (scene.mode !== "dodge") return;
      const minion = scene.minions.create(x, y, "sorting-slime");
      minion.setDisplaySize(62, 62).setDepth(5).setTint(scene.repaired ? 0x9eeaff : 0xd174ff).setAlpha(0);
      minion.body.setSize(36, 36).setOffset(22, 22);
      scene.tweens.add({ targets: minion, alpha: 0.96, scaleX: minion.scaleX * 1.12, scaleY: minion.scaleY * 0.88, duration: 100, yoyo: true, repeat: 1 });
      scene.waveEvents.push(scene.time.delayedCall(1000, () => {
        if (!minion.active) return;
        scene.tweens.add({ targets: minion, alpha: 0, duration: 130, onComplete: () => minion.destroy() });
      }));
    }));
  }
}

export function spawnOverflowSpiral(scene, Phaser) {
  if (scene.mode !== "dodge") return;
  const count = scene.repaired ? 6 : 9;
  const base = scene.repaired ? (scene.patternStep % 8) * (Math.PI / 4) : Phaser.Math.FloatBetween(0, Math.PI * 2);
  const direction = scene.repaired ? 1 : Phaser.Math.RND.pick([-1, 1]);
  scene.patternStep += 1;

  for (let index = 0; index < count; index += 1) {
    if (scene.repaired && index === 3) continue;
    const angle = base + (index / count) * Math.PI * 2;
    const minion = scene.minions.create(SLIME_ARENA.bossX, SLIME_ARENA.height / 2, "sorting-slime");
    minion.setDisplaySize(scene.repaired ? 50 : 58, scene.repaired ? 50 : 58).setDepth(5).setTint(0xc66cff);
    minion.body.setSize(32, 32).setOffset(24, 24);
    minion.setData({
      spiral: true,
      bornAt: scene.time.now,
      angle,
      turnRate: direction * (scene.repaired ? 0.0014 : Phaser.Math.FloatBetween(0.0018, 0.0032)),
      radialSpeed: scene.repaired ? 0.115 : Phaser.Math.FloatBetween(0.13, 0.18),
      repairedBias: scene.repaired ? Math.sin(base) * 18 : Phaser.Math.Between(-36, 36),
    });
  }
}

export function patternForPhase(phase) {
  return {
    1: spawnInsertionMarch,
    2: spawnMergeFlood,
    3: spawnOverflowSpiral,
  }[phase];
}
