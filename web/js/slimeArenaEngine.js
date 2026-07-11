const WIDTH = 960;
const HEIGHT = 540;
const FLOOR_TOP = 68;
const FLOOR_BOTTOM = HEIGHT - 52;
const PLAYER_START_X = 70;
const BOSS_X = WIDTH - 92;
const ROWS = 7;

const PLAYER_IMAGE = "assets/characters/patchrunner/A_young_field_technician_in/rotations/east.png";
const SLIME_IMAGE = "assets/characters/sorting-slime/A_translucent_lime-green_gelatinous_blob/rotations/west.png";

let game = null;
let activeScene = null;
let canvasResizeObserver = null;

function phaseForHp(hp) {
  if (hp > 30) return 1;
  if (hp > 15) return 2;
  return 3;
}

function rowY(index) {
  const span = FLOOR_BOTTOM - FLOOR_TOP;
  return FLOOR_TOP + (span * index) / (ROWS - 1);
}

function createSceneClass(Phaser, callbacks) {
  return class SortingSlimeScene extends Phaser.Scene {
    constructor() {
      super("sorting-slime-arena");
      this.mode = "intro";
      this.bossHp = 45;
      this.phase = 1;
      this.repaired = false;
      this.repairQuality = "none";
      this.guardCharge = 0;
      this.lastGap = 3;
      this.invulnerableUntil = 0;
      this.waveEvents = [];
      this.waveNumber = 0;
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

      this.shield = this.add.rectangle(BOSS_X - 70, HEIGHT / 2, 8, FLOOR_BOTTOM - FLOOR_TOP + 18, 0x9df4df, 0.35)
        .setStrokeStyle(2, 0xd8fff7, 0.85)
        .setDepth(6);
      this.shield.visible = false;

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

      callbacks.onBossHp(this.bossHp, 45, this.phase);
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
      this.tweens.add({
        targets: this.boss,
        x: BOSS_X,
        duration: 650,
        ease: "Back.easeOut",
        onComplete: () => {
          this.cameras.main.shake(260, 0.012);
          const impact = this.add.circle(BOSS_X, HEIGHT / 2 + 48, 16, 0x8eea70, 0.5).setDepth(5);
          this.tweens.add({ targets: impact, scaleX: 7, scaleY: 2.4, alpha: 0, duration: 520, onComplete: () => impact.destroy() });
          this.time.delayedCall(650, () => this.startWave());
        },
      });
    }

    update(time) {
      if (!this.player || !["dodge", "access"].includes(this.mode)) return;
      const speed = 245;
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
      this.player.x = Phaser.Math.Clamp(this.player.x, 44, this.mode === "dodge" ? BOSS_X - 112 : BOSS_X - 24);
      this.player.y = Phaser.Math.Clamp(this.player.y, FLOOR_TOP - 2, FLOOR_BOTTOM + 2);

      if (vx || vy) {
        this.player.setFlipX(vx < 0);
        this.player.setAngle(Math.sin(time / 75) * 1.5);
      } else {
        this.player.setAngle(0);
      }

      this.minions.children.each((minion) => {
        if (!minion || !minion.active) return;
        if (minion.x < -60 || minion.x > WIDTH + 60 || minion.y < 0 || minion.y > HEIGHT) minion.destroy();
      });

      if (this.mode === "access" && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y) < 104) {
        this.openCommandWindow();
      }
    }

    startWave() {
      if (this.mode === "finished") return;
      this.clearWave();
      this.mode = "dodge";
      this.waveNumber += 1;
      this.player.setPosition(PLAYER_START_X, HEIGHT / 2).setVelocity(0, 0).clearTint();
      this.shield.visible = true;
      this.phase = phaseForHp(this.bossHp);
      callbacks.onBossHp(this.bossHp, 45, this.phase);

      const names = ["Insertion March", "Merge Flood", "Overflow Spiral"];
      callbacks.onWave({
        phase: this.phase,
        wave: this.waveNumber,
        name: names[this.phase - 1],
        repaired: this.repaired,
      });
      callbacks.onStatus(this.repaired
        ? "Your repair holds. The columns now advertise a stable route."
        : "The columns are unsorted. Read each opening before it reaches you.");

      const interval = this.phase === 1 ? 1250 : this.phase === 2 ? 1080 : 930;
      this.spawnColumn();
      this.waveEvents.push(this.time.addEvent({ delay: interval, loop: true, callback: () => this.spawnColumn() }));
      if (this.phase >= 2) {
        this.waveEvents.push(this.time.addEvent({ delay: this.phase === 2 ? 2450 : 1800, loop: true, callback: () => this.spawnCrossStream() }));
      }
      const duration = this.phase === 1 ? 10500 : this.phase === 2 ? 11200 : 11800;
      this.waveEvents.push(this.time.delayedCall(duration, () => this.openAccess()));
    }

    chooseGap() {
      if (this.repaired) {
        const movement = Phaser.Math.Between(-1, 1);
        this.lastGap = Phaser.Math.Clamp(this.lastGap + movement, 1, ROWS - 2);
      } else {
        this.lastGap = Phaser.Math.Between(1, ROWS - 2);
      }
      return this.lastGap;
    }

    spawnColumn() {
      if (this.mode !== "dodge") return;
      const gap = this.chooseGap();
      const gapRadius = this.repaired || this.phase === 1 ? 1 : 0;
      const speed = this.phase === 1 ? 172 : this.phase === 2 ? 194 : 218;
      const warning = this.add.rectangle(WIDTH - 46, rowY(gap), 12, gapRadius ? 110 : 58, 0xf6d77a, 0.2).setDepth(2);
      this.tweens.add({ targets: warning, alpha: 0.75, duration: 180, yoyo: true, repeat: 2, onComplete: () => warning.destroy() });

      for (let row = 0; row < ROWS; row += 1) {
        if (Math.abs(row - gap) <= gapRadius) continue;
        const minion = this.minions.create(WIDTH + 44, rowY(row), "sorting-slime");
        minion.setDisplaySize(56, 56).setDepth(5).setVelocityX(-speed);
        minion.body.setSize(34, 34).setOffset(23, 23);
        minion.setAlpha(this.repaired ? 0.82 : 0.94);
        this.tweens.add({ targets: minion, scaleY: minion.scaleY * 0.82, duration: 340, yoyo: true, repeat: -1 });
      }
    }

    spawnCrossStream() {
      if (this.mode !== "dodge") return;
      const fromTop = this.waveNumber % 2 === 0;
      const laneX = Phaser.Math.Between(280, 690);
      const minion = this.minions.create(laneX, fromTop ? FLOOR_TOP - 70 : FLOOR_BOTTOM + 70, "sorting-slime");
      minion.setDisplaySize(this.phase === 3 ? 66 : 54, this.phase === 3 ? 66 : 54).setDepth(5);
      minion.body.setSize(34, 34).setOffset(23, 23);
      minion.setVelocityY((fromTop ? 1 : -1) * (this.phase === 3 ? 185 : 150));
      minion.setTint(this.phase === 3 ? 0xc67bff : 0x9eeaff);
    }

    openAccess() {
      if (this.mode !== "dodge") return;
      this.clearWaveEvents();
      this.mode = "access";
      this.shield.visible = false;
      this.minions.children.each((minion) => {
        if (!minion || !minion.active) return;
        this.tweens.add({ targets: minion, alpha: 0, duration: 420, onComplete: () => minion.destroy() });
      });
      callbacks.onStatus("ACCESS OPEN: reach Sorting Slime before it reforms.");
      callbacks.onAccessOpen();
      this.waveEvents.push(this.time.delayedCall(6000, () => {
        if (this.mode === "access") {
          callbacks.onStatus("The opening closes. Sorting Slime resumes the march.");
          this.startWave();
        }
      }));
    }

    openCommandWindow() {
      if (this.mode !== "access") return;
      this.mode = "command";
      this.player.setVelocity(0, 0);
      this.clearWaveEvents();
      callbacks.onCommandWindow({ repaired: this.repaired, bossHp: this.bossHp, phase: this.phase });
    }

    attack() {
      if (this.mode !== "command") return;
      const damage = this.repaired ? 15 : 5;
      this.bossHp = Math.max(0, this.bossHp - damage);
      this.cameras.main.shake(180, this.repaired ? 0.014 : 0.007);
      this.boss.setTintFill(0xffffff);
      this.time.delayedCall(120, () => this.boss.clearTint());
      callbacks.onBossHp(this.bossHp, 45, phaseForHp(this.bossHp));
      callbacks.onAttack(damage, this.repaired);
      if (this.bossHp <= 0) {
        this.win();
        return;
      }
      this.mode = "transition";
      this.time.delayedCall(650, () => this.startWave());
    }

    guard() {
      if (this.mode !== "command") return;
      this.guardCharge = 1;
      callbacks.onGuard();
      this.mode = "transition";
      this.time.delayedCall(450, () => this.startWave());
    }

    freezeForRepair() {
      if (this.mode !== "command") return;
      this.mode = "repair";
      this.physics.pause();
      this.input.keyboard.enabled = false;
      this.boss.setTint(0x8eeaff);
      callbacks.onRepairOpened();
    }

    resumeFromRepair({ repaired = false, quality = "none" } = {}) {
      if (this.mode !== "repair") return;
      this.repaired = this.repaired || repaired;
      if (repaired) this.repairQuality = quality;
      this.boss.clearTint();
      this.input.keyboard.enabled = true;
      this.physics.resume();
      this.mode = "transition";
      this.time.delayedCall(360, () => this.startWave());
    }

    hitPlayer(minion) {
      if (this.mode !== "dodge" || this.time.now < this.invulnerableUntil) return;
      this.invulnerableUntil = this.time.now + 900;
      if (this.guardCharge > 0) {
        this.guardCharge = 0;
        callbacks.onGuardBlocked();
      } else {
        const vitals = callbacks.onDamage(this.phase === 3 ? 4 : 3);
        if (vitals.hp <= 0) {
          this.defeat();
          return;
        }
      }
      this.player.x = Math.max(PLAYER_START_X, this.player.x - 68);
      this.player.setTintFill(0xffffff);
      this.cameras.main.shake(120, 0.009);
      this.time.delayedCall(130, () => this.player.clearTint());
      if (minion && minion.active) minion.destroy();
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
      this.waveNumber = 0;
      callbacks.onBossHp(this.bossHp, 45, 1);
      this.startWave();
    }

    adminWin() {
      if (this.mode === "finished") return;
      this.bossHp = 0;
      callbacks.onBossHp(0, 45, this.phase);
      this.win();
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

    clearWave() {
      this.clearWaveEvents();
      if (this.minions) this.minions.clear(true, true);
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

export function stopSlimeArena() {
  canvasResizeObserver?.disconnect();
  canvasResizeObserver = null;
  if (game) game.destroy(true);
  game = null;
  activeScene = null;
}
