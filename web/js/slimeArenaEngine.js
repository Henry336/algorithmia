import { phaseForBossHp, SLIME_ARENA } from "./slimeArenaConfig.js";
import { patternForPhase } from "./slimeArenaPatterns.js";

const {
  width: WIDTH,
  height: HEIGHT,
  floorTop: FLOOR_TOP,
  floorBottom: FLOOR_BOTTOM,
  playerStartX: PLAYER_START_X,
  bossX: BOSS_X,
  bossMaxHp: BOSS_MAX_HP,
  nullShieldMax: NULL_SHIELD_MAX,
  guardDurationMs: GUARD_DURATION,
} = SLIME_ARENA;

const PLAYER_IMAGE = "assets/characters/patchrunner/A_young_field_technician_in/rotations/east.png";
const SLIME_IMAGE = "assets/characters/sorting-slime/A_translucent_lime-green_gelatinous_blob/rotations/west.png";

let game = null;
let activeScene = null;
let canvasResizeObserver = null;

function createSceneClass(Phaser, callbacks) {
  return class SortingSlimeScene extends Phaser.Scene {
    constructor() {
      super("sorting-slime-arena");
      this.mode = "intro";
      this.bossHp = BOSS_MAX_HP;
      this.phase = 1;
      this.repaired = false;
      this.repairQuality = "none";
      this.nullShieldHp = NULL_SHIELD_MAX;
      this.guardUntil = 0;
      this.invulnerableUntil = 0;
      this.waveEvents = [];
      this.hazardEffects = [];
      this.stunStars = [];
      this.stunStarAngle = 0;
      this.waveNumber = 0;
      this.patternStep = 0;
    }

    preload() {
      this.load.image("patchrunner", PLAYER_IMAGE);
      this.load.image("sorting-slime", SLIME_IMAGE);
    }

    create() {
      activeScene = this;
      this.drawArena();
      this.minions = this.physics.add.group({ allowGravity: false });

      this.player = this.physics.add.sprite(PLAYER_START_X, HEIGHT / 2, "patchrunner");
      this.player.setDisplaySize(108, 108).setDepth(8).setCollideWorldBounds(false);
      this.player.body.setSize(34, 42).setOffset(29, 30);

      this.boss = this.physics.add.staticSprite(WIDTH + 120, HEIGHT / 2, "sorting-slime");
      this.boss.setDisplaySize(198, 198).setDepth(7);
      this.boss.body.setSize(88, 98).setOffset(34, 28);

      this.bossShield = this.add.circle(BOSS_X, HEIGHT / 2, 100, 0x7b2cff, 0.12)
        .setStrokeStyle(8, 0xc66cff, 0.9)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(6)
        .setVisible(false);
      this.bossShieldInner = this.add.circle(BOSS_X, HEIGHT / 2, 88, 0x17052d, 0.08)
        .setStrokeStyle(3, 0x8f5cff, 0.8)
        .setDepth(6)
        .setVisible(false);
      this.playerShield = this.add.circle(PLAYER_START_X, HEIGHT / 2, 54, 0x5cdcff, 0.09)
        .setStrokeStyle(5, 0x8eeaff, 0.9)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(7)
        .setVisible(false);

      this.physics.add.overlap(this.player, this.minions, (_player, minion) => this.hitPlayer(minion));
      this.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.keyboard.removeCapture([
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.ENTER,
        Phaser.Input.Keyboard.KeyCodes.TAB,
      ]);

      this.tweens.add({
        targets: this.boss,
        scaleY: this.boss.scaleY * 0.92,
        scaleX: this.boss.scaleX * 1.06,
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      this.tweens.add({
        targets: [this.bossShield, this.bossShieldInner],
        alpha: { from: 0.55, to: 1 },
        duration: 560,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      callbacks.onBossHp(this.bossHp, BOSS_MAX_HP, this.phase);
      callbacks.onBossShield(this.nullShieldHp, NULL_SHIELD_MAX, true);
      callbacks.onStatus("Sorting Slime seals the room and gathers itself.");
      this.playEntrance();
    }

    drawArena() {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x07131a, 1);
      graphics.fillRect(0, 0, WIDTH, HEIGHT);
      graphics.fillStyle(0x0c2229, 1);
      graphics.fillRect(22, FLOOR_TOP - 24, WIDTH - 44, FLOOR_BOTTOM - FLOOR_TOP + 48);
      graphics.lineStyle(1, 0x2a555c, 0.55);
      for (let x = 22; x <= WIDTH - 22; x += 64) graphics.lineBetween(x, FLOOR_TOP - 24, x, FLOOR_BOTTOM + 24);
      for (let y = FLOOR_TOP - 24; y <= FLOOR_BOTTOM + 24; y += 58) graphics.lineBetween(22, y, WIDTH - 22, y);
      graphics.lineStyle(4, 0x78cbbb, 0.9);
      graphics.strokeRect(20, FLOOR_TOP - 26, WIDTH - 40, FLOOR_BOTTOM - FLOOR_TOP + 52);
      graphics.lineStyle(2, 0xd7a64a, 0.72);
      graphics.lineBetween(34, FLOOR_TOP - 12, 34, FLOOR_BOTTOM + 12);
      graphics.lineBetween(WIDTH - 34, FLOOR_TOP - 12, WIDTH - 34, FLOOR_BOTTOM + 12);

      for (let i = 0; i < 28; i += 1) {
        const mote = this.add.rectangle(
          Phaser.Math.Between(28, WIDTH - 28),
          Phaser.Math.Between(FLOOR_TOP - 16, FLOOR_BOTTOM + 16),
          Phaser.Math.Between(2, 5),
          Phaser.Math.Between(2, 5),
          i % 3 === 0 ? 0xd7a64a : 0x68c9b6,
          0.2,
        );
        this.tweens.add({ targets: mote, alpha: 0.7, duration: Phaser.Math.Between(900, 2200), yoyo: true, repeat: -1 });
      }
    }

    playEntrance() {
      this.boss.setPosition(BOSS_X, FLOOR_TOP - 180);
      this.tweens.add({
        targets: this.boss,
        y: HEIGHT / 2,
        duration: 760,
        ease: "Bounce.easeOut",
        onComplete: () => {
          this.bossShield.setVisible(true).setAlpha(1).setScale(1);
          this.bossShieldInner.setVisible(true).setAlpha(1).setScale(1);
          this.cameras.main.shake(420, 0.02);
          const impact = this.add.circle(BOSS_X, HEIGHT / 2 + 52, 18, 0xa94dff, 0.65).setDepth(5);
          this.tweens.add({ targets: impact, scaleX: 10, scaleY: 3.2, alpha: 0, duration: 680, ease: "Quad.easeOut", onComplete: () => impact.destroy() });
          for (let index = 0; index < 18; index += 1) {
            const shard = this.add.rectangle(BOSS_X, HEIGHT / 2 + 52, 5, 5, index % 2 ? 0xc66cff : 0x8eea70, 0.9).setDepth(8);
            const angle = Phaser.Math.FloatBetween(Math.PI, Math.PI * 2);
            const distance = Phaser.Math.Between(70, 240);
            this.tweens.add({ targets: shard, x: BOSS_X + Math.cos(angle) * distance, y: HEIGHT / 2 + 52 + Math.sin(angle) * distance * 0.45, alpha: 0, duration: Phaser.Math.Between(430, 760), onComplete: () => shard.destroy() });
          }
          callbacks.onStatus("Sorting Slime crashes into the execution space. NULL SHIELD: 100.");
          this.time.delayedCall(700, () => this.startWave({ resetPlayer: false }));
        },
      });
    }

    update(time) {
      if (!this.player) return;
      this.playerShield.setPosition(this.player.x, this.player.y);
      this.bossShield.setPosition(this.boss.x, this.boss.y);
      this.bossShieldInner.setPosition(this.boss.x, this.boss.y);
      this.updateStunStars(time);
      if (this.guardUntil && time >= this.guardUntil) this.expireGuard();
      if (this.mode !== "dodge") return;
      const speed = SLIME_ARENA.playerSpeed;
      let vx = 0;
      let vy = 0;
      if (this.cursors.left.isDown || this.keys.left.isDown) vx -= speed;
      if (this.cursors.right.isDown || this.keys.right.isDown) vx += speed;
      if (this.cursors.up.isDown || this.keys.up.isDown) vy -= speed;
      if (this.cursors.down.isDown || this.keys.down.isDown) vy += speed;
      if (vx && vy) {
        vx *= 0.707;
        vy *= 0.707;
      }
      this.player.setVelocity(vx, vy);
      this.player.x = Phaser.Math.Clamp(this.player.x, 44, BOSS_X - 24);
      this.player.y = Phaser.Math.Clamp(this.player.y, FLOOR_TOP - 2, FLOOR_BOTTOM + 2);
      if (vx || vy) {
        this.player.setFlipX(vx < 0);
        this.player.setAngle(Math.sin(time / 75) * 1.5);
      } else {
        this.player.setAngle(0);
      }

      this.minions.children.each((minion) => {
        if (!minion || !minion.active) return;
        if (minion.getData("spiral")) {
          const age = time - minion.getData("bornAt");
          const repairedBias = minion.getData("repairedBias");
          const angle = minion.getData("angle") + age * minion.getData("turnRate");
          const radius = 28 + age * minion.getData("radialSpeed");
          minion.setPosition(BOSS_X + Math.cos(angle) * radius, HEIGHT / 2 + Math.sin(angle) * radius * 0.62 + repairedBias);
          minion.setRotation(angle);
        }
        if (minion.x < -60 || minion.x > WIDTH + 60 || minion.y < 0 || minion.y > HEIGHT) minion.destroy();
      });

      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y) < 104) {
        this.openCommandWindow();
      }
    }

    trackHazardEffect(effect) {
      this.hazardEffects.push(effect);
      effect.once("destroy", () => {
        this.hazardEffects = this.hazardEffects.filter((candidate) => candidate !== effect);
      });
      return effect;
    }

    startWave({ resetPlayer = true } = {}) {
      if (this.mode === "finished") return;
      this.clearWave();
      this.mode = "dodge";
      this.waveNumber += 1;
      if (resetPlayer) this.player.setPosition(PLAYER_START_X, HEIGHT / 2);
      this.player.setVelocity(0, 0).clearTint();
      this.phase = phaseForBossHp(this.bossHp);
      callbacks.onBossHp(this.bossHp, BOSS_MAX_HP, this.phase);

      callbacks.onWave({
        phase: this.phase,
        wave: this.waveNumber,
        name: SLIME_ARENA.phaseNames[this.phase],
        repaired: this.repaired,
      });
      const status = this.phase === 1
        ? (this.repaired
          ? "Mira Vale: Quick, the slime's shield is down. Attack it while it's weakened!"
          : this.waveNumber === 1
            ? "Mira Vale: The slime has its shield up. Get close and repair it first if you want real damage. Dodge the columns and reach it."
            : "Insertion March is unstable. The columns keep coming, but there is room to slip through.")
        : this.phase === 2
          ? (this.repaired ? "Mira Vale: The shield is open again. Hit it before the logic recompiles!" : "Merge Flood is scattering one-second allocations across the floor.")
          : (this.repaired ? "Mira Vale: That's the opening. Strike before the overflow stabilizes!" : "Overflow Spiral changes direction without warning.");
      callbacks.onStatus(status);
      const spawnPattern = patternForPhase(this.phase);
      const delay = SLIME_ARENA.phaseSpawnDelayMs[this.phase][this.repaired ? "repaired" : "broken"];
      spawnPattern(this, Phaser);
      this.waveEvents.push(this.time.addEvent({ delay, loop: true, callback: () => spawnPattern(this, Phaser) }));
    }

    openCommandWindow() {
      if (this.mode !== "dodge") return;
      this.mode = "command";
      this.player.setVelocity(0, 0);
      this.clearWaveEvents();
      this.clearHazardEffects();
      this.minions.children.each((minion) => {
        if (!minion?.active) return;
        this.tweens.add({ targets: minion, alpha: 0, duration: 180, onComplete: () => minion.destroy() });
      });
      callbacks.onCommandWindow({ repaired: this.repaired, bossHp: this.bossHp, phase: this.phase });
    }

    attack() {
      if (this.mode !== "command") return;
      const damage = 5;
      if (this.nullShieldHp > 0) {
        this.nullShieldHp = Math.max(0, this.nullShieldHp - damage);
        callbacks.onBossShield(this.nullShieldHp, NULL_SHIELD_MAX, true);
        callbacks.onAttack(damage, false, true);
        this.bumpPlayerAway();
        return;
      }
      const oldPhase = this.phase;
      this.bossHp = Math.max(0, this.bossHp - damage);
      this.cameras.main.shake(180, 0.014);
      this.boss.setTintFill(0xffffff);
      this.time.delayedCall(120, () => this.boss.clearTint());
      const nextPhase = phaseForBossHp(this.bossHp);
      callbacks.onBossHp(this.bossHp, BOSS_MAX_HP, nextPhase);
      callbacks.onAttack(damage, true, false);
      if (this.bossHp <= 0) {
        this.win();
        return;
      }
      if (nextPhase !== oldPhase) this.installPhaseShield(nextPhase);
      this.bumpPlayerAway();
    }

    guard() {
      if (this.mode !== "command") return;
      this.guardUntil = this.time.now + GUARD_DURATION;
      this.playerShield.setVisible(true).setAlpha(1).setScale(0.3);
      this.tweens.killTweensOf(this.playerShield);
      this.tweens.add({ targets: this.playerShield, scaleX: 1, scaleY: 1, duration: 240, ease: "Back.easeOut" });
      this.tweens.add({ targets: this.playerShield, alpha: 0.55, duration: 420, yoyo: true, repeat: 5 });
      callbacks.onGuard(GUARD_DURATION);
      this.mode = "transition";
      this.bumpPlayerAway({ delay: 320 });
    }

    freezeForRepair() {
      if (this.mode !== "command") return;
      this.mode = "repair";
      this.physics.pause();
      this.input.keyboard.enabled = false;
      this.boss.setTint(0x8eeaff);
      this.startStunStars();
      callbacks.onRepairOpened();
    }

    resumeFromRepair({ repaired = false, quality = "none" } = {}) {
      if (this.mode !== "repair") return;
      this.stopStunStars();
      if (repaired) {
        this.repaired = true;
        this.repairQuality = quality;
        this.nullShieldHp = 0;
        callbacks.onBossShield(0, NULL_SHIELD_MAX, false);
        this.popBossShield();
      }
      this.boss.clearTint();
      this.input.keyboard.enabled = true;
      this.physics.resume();
      this.mode = "transition";
      this.time.delayedCall(360, () => this.startWave());
    }

    startStunStars() {
      this.stopStunStars();
      for (let index = 0; index < 5; index += 1) {
        const star = this.add.star(this.boss.x, this.boss.y - 114, 5, 5, 13, 0xffdd55, 0.95)
          .setStrokeStyle(2, 0xffffff, 0.75)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(11);
        star.setData("offset", (index / 5) * Math.PI * 2);
        this.tweens.add({
          targets: star,
          scaleX: 1.25,
          scaleY: 1.25,
          alpha: 0.45,
          duration: 420 + index * 40,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        this.stunStars.push(star);
      }
    }

    updateStunStars(time) {
      if (!this.stunStars.length) return;
      this.stunStarAngle = time * 0.004;
      this.stunStars.forEach((star) => {
        if (!star.active) return;
        const angle = this.stunStarAngle + star.getData("offset");
        star.setPosition(
          this.boss.x + Math.cos(angle) * 58,
          this.boss.y - 116 + Math.sin(angle) * 16,
        );
        star.setRotation(-angle);
      });
    }

    stopStunStars() {
      this.stunStars.forEach((star) => {
        if (!star?.active) return;
        this.tweens.killTweensOf(star);
        star.destroy();
      });
      this.stunStars = [];
    }

    hitPlayer(minion) {
      if (this.mode !== "dodge" || this.time.now < this.invulnerableUntil) return;
      this.invulnerableUntil = this.time.now + 900;
      const baseDamage = this.phase === 3 ? 4 : 3;
      const guarded = this.time.now < this.guardUntil;
      const damage = guarded ? Math.ceil(baseDamage * 0.5) : baseDamage;
      const vitals = callbacks.onDamage(damage, guarded);
      if (guarded) callbacks.onGuardBlocked(damage);
      if (vitals.hp <= 0) {
        this.defeat();
        return;
      }
      this.player.x = Math.max(PLAYER_START_X, this.player.x - 68);
      this.player.setTintFill(0xffffff);
      this.cameras.main.shake(120, 0.009);
      this.time.delayedCall(130, () => this.player.clearTint());
      if (minion && minion.active) minion.destroy();
    }

    expireGuard() {
      if (!this.guardUntil) return;
      this.guardUntil = 0;
      this.tweens.killTweensOf(this.playerShield);
      this.tweens.add({ targets: this.playerShield, scaleX: 1.7, scaleY: 1.7, alpha: 0, duration: 320, ease: "Quad.easeOut", onComplete: () => this.playerShield.setVisible(false).setScale(1) });
      callbacks.onGuardExpired();
    }

    bumpPlayerAway({ delay = 180 } = {}) {
      this.mode = "transition";
      const startX = this.player.x;
      const targetX = Math.max(PLAYER_START_X, startX - Phaser.Math.Between(5, 7) * 64);
      const targetY = Phaser.Math.Clamp(this.player.y + Phaser.Math.Between(-70, 70), FLOOR_TOP, FLOOR_BOTTOM);
      this.tweens.add({
        targets: this.boss,
        x: BOSS_X - 34,
        duration: 110,
        yoyo: true,
        ease: "Quad.easeOut",
      });
      this.time.delayedCall(delay, () => {
        const trail = this.add.line(0, 0, startX, this.player.y, targetX, targetY, 0x8eeaff, 0.55).setOrigin(0).setDepth(6);
        this.cameras.main.shake(150, 0.012);
        this.tweens.add({
          targets: this.player,
          x: targetX,
          y: targetY,
          angle: -18,
          duration: 430,
          ease: "Cubic.easeOut",
          onComplete: () => {
            trail.destroy();
            this.player.setAngle(0);
          },
        });
      });
      this.time.delayedCall(delay + 500, () => {
        if (this.mode !== "transition") return;
        this.player.setAngle(0);
        this.startWave({ resetPlayer: false });
      });
    }

    installPhaseShield(nextPhase) {
      this.phase = nextPhase;
      this.repaired = false;
      this.repairQuality = "none";
      this.nullShieldHp = NULL_SHIELD_MAX;
      this.patternStep = 0;
      this.bossShield.setVisible(true).setAlpha(0).setScale(1.7);
      this.bossShieldInner.setVisible(true).setAlpha(0).setScale(1.5);
      this.tweens.add({ targets: [this.bossShield, this.bossShieldInner], scaleX: 1, scaleY: 1, alpha: 1, duration: 460, ease: "Back.easeOut" });
      callbacks.onBossShield(this.nullShieldHp, NULL_SHIELD_MAX, true);
      callbacks.onStatus(`PHASE ${nextPhase}: Null Rot recompiles a fresh 100 HP shield.`);
    }

    popBossShield() {
      const ring = this.add.circle(this.boss.x, this.boss.y, 96, 0x8f3cff, 0.08).setStrokeStyle(10, 0xe5a4ff, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(10);
      this.tweens.add({ targets: ring, scaleX: 1.9, scaleY: 1.9, alpha: 0, duration: 520, ease: "Quad.easeOut", onComplete: () => ring.destroy() });
      for (let index = 0; index < 20; index += 1) {
        const pixel = this.add.rectangle(this.boss.x, this.boss.y, 6, 6, index % 2 ? 0xc66cff : 0x6eeaff, 1).setDepth(10);
        const angle = (index / 20) * Math.PI * 2;
        this.tweens.add({ targets: pixel, x: this.boss.x + Math.cos(angle) * Phaser.Math.Between(110, 190), y: this.boss.y + Math.sin(angle) * Phaser.Math.Between(80, 150), angle: 180, alpha: 0, duration: Phaser.Math.Between(360, 650), onComplete: () => pixel.destroy() });
      }
      this.bossShield.setVisible(false);
      this.bossShieldInner.setVisible(false);
      this.cameras.main.flash(180, 138, 73, 255, false);
    }

    defeat() {
      this.mode = "defeated";
      this.clearWave();
      this.physics.pause();
      this.player.setTint(0x735c78);
      callbacks.onDefeat();
    }

    retry() {
      if (this.mode !== "defeated") return;
      this.physics.resume();
      this.player.clearTint();
      this.bossHp = 45;
      this.phase = 1;
      this.repaired = false;
      this.repairQuality = "none";
      this.nullShieldHp = NULL_SHIELD_MAX;
      this.guardUntil = 0;
      this.waveNumber = 0;
      this.bossShield.setVisible(true).setAlpha(1).setScale(1);
      this.bossShieldInner.setVisible(true).setAlpha(1).setScale(1);
      this.playerShield.setVisible(false);
      callbacks.onBossHp(this.bossHp, BOSS_MAX_HP, 1);
      callbacks.onBossShield(this.nullShieldHp, NULL_SHIELD_MAX, true);
      this.startWave();
    }

    adminWin() {
      if (this.mode === "finished") return;
      this.bossHp = 0;
      callbacks.onBossHp(0, BOSS_MAX_HP, this.phase);
      this.win();
    }

    adminSetPhase(phase) {
      if (![1, 2, 3].includes(phase) || this.mode === "finished") return;
      this.clearWave();
      this.bossHp = phase === 1 ? 45 : phase === 2 ? 30 : 15;
      this.installPhaseShield(phase);
      callbacks.onBossHp(this.bossHp, BOSS_MAX_HP, phase);
      this.startWave();
    }

    win() {
      this.mode = "finished";
      this.clearWave();
      this.physics.pause();
      callbacks.onStatus("The ordered bars lock into place. The slime can no longer hold the intake shut.");
      this.tweens.add({
        targets: this.boss,
        scaleX: 0.3,
        scaleY: 1.8,
        alpha: 0,
        angle: 8,
        duration: 740,
        ease: "Back.easeIn",
        onComplete: () => callbacks.onWin(),
      });
    }

    clearWaveEvents() {
      this.waveEvents.forEach((event) => event && event.remove(false));
      this.waveEvents = [];
    }

    clearHazardEffects() {
      this.hazardEffects.forEach((effect) => {
        if (!effect?.active) return;
        this.tweens.killTweensOf(effect);
        effect.destroy();
      });
      this.hazardEffects = [];
    }

    clearWave() {
      this.clearWaveEvents();
      this.clearHazardEffects();
      if (this.mode !== "repair") this.stopStunStars();
      if (this.minions) {
        this.minions.children.each((minion) => {
          if (minion?.active) this.tweens.killTweensOf(minion);
        });
        this.minions.clear(true, true);
      }
    }
  };
}

export function startSlimeArena(host, callbacks) {
  stopSlimeArena();
  const Phaser = window.Phaser;
  if (!Phaser) throw new Error("Phaser runtime is not available.");
  const SceneClass = createSceneClass(Phaser, callbacks);
  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: host,
    backgroundColor: "#07131a",
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: SceneClass,
    input: { keyboard: true },
    render: { transparent: false, antialias: false, pixelArt: true, roundPixels: true },
  });
  const fitCanvas = () => {
    if (!game?.canvas || !host.isConnected) return;
    const bounds = host.getBoundingClientRect();
    const scale = Math.min(bounds.width / WIDTH, bounds.height / HEIGHT);
    game.canvas.style.width = `${Math.floor(WIDTH * scale)}px`;
    game.canvas.style.height = `${Math.floor(HEIGHT * scale)}px`;
    game.canvas.style.margin = "auto";
  };
  canvasResizeObserver = new ResizeObserver(fitCanvas);
  canvasResizeObserver.observe(host);
  window.requestAnimationFrame(fitCanvas);
  return game;
}

export function slimeArenaAttack() {
  activeScene?.attack();
}

export function slimeArenaGuard() {
  activeScene?.guard();
}

export function slimeArenaOpenRepair() {
  activeScene?.freezeForRepair();
}

export function slimeArenaResumeRepair(result) {
  activeScene?.resumeFromRepair(result);
}

export function slimeArenaRetry() {
  activeScene?.retry();
}

export function slimeArenaAdminWin() {
  activeScene?.adminWin();
}

export function slimeArenaAdminSetPhase(phase) {
  activeScene?.adminSetPhase(phase);
}

export function slimeArenaAdminOpenCommandWindow() {
  activeScene?.openCommandWindow();
}

export function slimeArenaDebugState() {
  if (!activeScene) return null;
  return {
    mode: activeScene.mode,
    bossHp: activeScene.bossHp,
    phase: activeScene.phase,
    repaired: activeScene.repaired,
    nullShieldHp: activeScene.nullShieldHp,
    guardRemaining: Math.max(0, activeScene.guardUntil - activeScene.time.now),
    patternStep: activeScene.patternStep,
    hazardEffects: activeScene.hazardEffects.length,
    stunStars: activeScene.stunStars.length,
  };
}

export function stopSlimeArena() {
  canvasResizeObserver?.disconnect();
  canvasResizeObserver = null;
  if (game) game.destroy(true);
  game = null;
  activeScene = null;
}
