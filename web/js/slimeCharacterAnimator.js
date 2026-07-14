const BAR_COLORS = [0xff6b62, 0x59c7ff, 0xffdd55, 0xc678ff, 0xffa04d];

/**
 * Owns Sorting Slime's body language. The encounter tells this controller what
 * happened; this file decides how the slime should move and react.
 */
export class SlimeCharacterAnimator {
  constructor(scene, Phaser, sprite, { homeX, homeY }) {
    this.scene = scene;
    this.Phaser = Phaser;
    this.sprite = sprite;
    this.homeX = homeX;
    this.homeY = homeY;
    this.baseScaleX = sprite.scaleX;
    this.baseScaleY = sprite.scaleY;
    this.state = "setup";
    this.token = 0;
    this.effects = new Set();
    this.counts = {
      entrance: 0,
      idle: 0,
      attack: 0,
      shieldHit: 0,
      hurt: 0,
      recompile: 0,
      stunned: 0,
      defeat: 0,
    };
  }

  setState(state) {
    this.state = state;
    this.sprite.setData("animationState", state);
  }

  begin(state) {
    this.token += 1;
    this.scene.tweens.killTweensOf(this.sprite);
    this.setState(state);
    if (Object.hasOwn(this.counts, state)) this.counts[state] += 1;
    return this.token;
  }

  isCurrent(token) {
    return token === this.token && this.sprite?.active;
  }

  restoreBody() {
    this.sprite
      .setPosition(this.homeX, this.homeY)
      .setScale(this.baseScaleX, this.baseScaleY)
      .setAngle(0)
      .setAlpha(1)
      .clearTint();
  }

  track(effect) {
    this.effects.add(effect);
    effect.once("destroy", () => this.effects.delete(effect));
    return effect;
  }

  burst({ x = this.sprite.x, y = this.sprite.y, colors = BAR_COLORS, count = 14, radius = 120 } = {}) {
    for (let index = 0; index < count; index += 1) {
      const color = colors[index % colors.length];
      const size = index % 3 === 0 ? 7 : 4;
      const pixel = this.track(this.scene.add.rectangle(x, y, size, size, color, 0.95).setDepth(12));
      const angle = (index / count) * Math.PI * 2 + this.Phaser.Math.FloatBetween(-0.16, 0.16);
      const distance = this.Phaser.Math.Between(Math.round(radius * 0.55), radius);
      this.scene.tweens.add({
        targets: pixel,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance * 0.68,
        angle: this.Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: this.Phaser.Math.Between(360, 660),
        ease: "Quad.easeOut",
        onComplete: () => pixel.destroy(),
      });
    }
  }

  playIdle() {
    const token = this.begin("idle");
    this.restoreBody();
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.homeY - 6,
      scaleX: this.baseScaleX * 1.055,
      scaleY: this.baseScaleY * 0.94,
      angle: 1.2,
      duration: 680,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onYoyo: () => {
        if (!this.isCurrent(token)) return;
        const glint = this.track(this.scene.add.rectangle(
          this.sprite.x + this.Phaser.Math.Between(-42, 38),
          this.sprite.y + this.Phaser.Math.Between(-36, 24),
          4,
          4,
          BAR_COLORS[this.Phaser.Math.Between(0, BAR_COLORS.length - 1)],
          0.8,
        ).setDepth(9));
        this.scene.tweens.add({
          targets: glint,
          y: glint.y - 18,
          alpha: 0,
          duration: 480,
          onComplete: () => glint.destroy(),
        });
      },
    });
  }

  playEntrance({ onImpact } = {}) {
    const token = this.begin("entrance");
    this.restoreBody();
    this.sprite
      .setPosition(this.homeX, this.homeY - 250)
      .setScale(this.baseScaleX * 0.78, this.baseScaleY * 1.25)
      .setAngle(-5);

    this.scene.tweens.add({
      targets: this.sprite,
      y: this.homeY - 72,
      scaleX: this.baseScaleX * 0.9,
      scaleY: this.baseScaleY * 1.12,
      angle: 3,
      duration: 430,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (!this.isCurrent(token)) return;
        this.scene.tweens.add({
          targets: this.sprite,
          y: this.homeY,
          scaleX: this.baseScaleX * 1.28,
          scaleY: this.baseScaleY * 0.7,
          angle: 0,
          duration: 150,
          ease: "Quad.easeIn",
          onComplete: () => {
            if (!this.isCurrent(token)) return;
            const impact = this.track(this.scene.add.ellipse(this.homeX, this.homeY + 58, 42, 16, 0xa94dff, 0.65).setDepth(5));
            this.scene.tweens.add({
              targets: impact,
              scaleX: 8,
              scaleY: 3,
              alpha: 0,
              duration: 620,
              ease: "Quad.easeOut",
              onComplete: () => impact.destroy(),
            });
            this.burst({ y: this.homeY + 42, colors: [0xc66cff, 0x8eea70], count: 20, radius: 220 });
            onImpact?.();
            this.scene.tweens.add({
              targets: this.sprite,
              scaleX: this.baseScaleX,
              scaleY: this.baseScaleY,
              duration: 360,
              ease: "Elastic.easeOut",
              onComplete: () => this.isCurrent(token) && this.playIdle(),
            });
          },
        });
      },
    });
  }

  playAttack() {
    if (["entrance", "recompile", "stunned", "defeat"].includes(this.state)) return;
    const token = this.begin("attack");
    this.restoreBody();
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.homeY + 13,
      scaleX: this.baseScaleX * 1.18,
      scaleY: this.baseScaleY * 0.76,
      duration: 120,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (!this.isCurrent(token)) return;
        this.scene.tweens.add({
          targets: this.sprite,
          y: this.homeY - 18,
          x: this.homeX - 12,
          scaleX: this.baseScaleX * 0.86,
          scaleY: this.baseScaleY * 1.22,
          duration: 130,
          yoyo: true,
          hold: 35,
          ease: "Back.easeOut",
          onYoyo: () => this.burst({ x: this.homeX - 54, count: 7, radius: 72 }),
          onComplete: () => this.isCurrent(token) && this.playIdle(),
        });
      },
    });
  }

  playBump() {
    const token = this.begin("attack");
    this.restoreBody();
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.homeX - 42,
      scaleX: this.baseScaleX * 1.2,
      scaleY: this.baseScaleY * 0.82,
      duration: 105,
      ease: "Quad.easeOut",
      yoyo: true,
      hold: 45,
      onComplete: () => this.isCurrent(token) && this.playIdle(),
    });
  }

  playShieldHit() {
    const token = this.begin("shieldHit");
    this.restoreBody();
    this.sprite.setTint(0xc678ff);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScaleX * 0.92,
      scaleY: this.baseScaleY * 1.08,
      duration: 75,
      yoyo: true,
      repeat: 1,
      onComplete: () => this.isCurrent(token) && this.playIdle(),
    });
  }

  playHurt() {
    const token = this.begin("hurt");
    this.restoreBody();
    this.sprite.setTintFill(0xffffff);
    this.burst({ count: 9, radius: 86 });
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.homeX + 26,
      angle: 7,
      scaleX: this.baseScaleX * 0.76,
      scaleY: this.baseScaleY * 1.16,
      duration: 95,
      yoyo: true,
      repeat: 1,
      ease: "Quad.easeOut",
      onComplete: () => this.isCurrent(token) && this.playIdle(),
    });
  }

  playRecompile(phase) {
    const token = this.begin("recompile");
    this.restoreBody();
    this.sprite.setTint(phase === 2 ? 0xd28cff : 0xff75df);
    const orbiters = BAR_COLORS.map((color, index) => {
      const angle = (index / BAR_COLORS.length) * Math.PI * 2;
      return this.track(this.scene.add.rectangle(
        this.homeX + Math.cos(angle) * 105,
        this.homeY + Math.sin(angle) * 76,
        12,
        20,
        color,
        1,
      ).setDepth(12).setRotation(angle));
    });

    orbiters.forEach((orbiter, index) => {
      this.scene.tweens.add({
        targets: orbiter,
        x: this.homeX,
        y: this.homeY,
        angle: 280 + index * 28,
        duration: 440,
        ease: "Cubic.easeIn",
        onComplete: () => orbiter.destroy(),
      });
    });
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScaleX * 0.42,
      scaleY: this.baseScaleY * 1.34,
      angle: -8,
      duration: 420,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (!this.isCurrent(token)) return;
        this.burst({ count: 24, radius: 150, colors: [0xc678ff, 0xff75df, 0x65e7ff] });
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: this.baseScaleX * 1.18,
          scaleY: this.baseScaleY * 0.84,
          angle: 0,
          duration: 250,
          ease: "Back.easeOut",
          onComplete: () => this.isCurrent(token) && this.playIdle(),
        });
      },
    });
  }

  setStunned(stunned) {
    if (!stunned) {
      if (this.state === "stunned") this.playIdle();
      return;
    }
    this.begin("stunned");
    this.restoreBody();
    this.sprite.setTint(0x8eeaff).setAngle(-3);
    this.scene.tweens.add({
      targets: this.sprite,
      angle: 3,
      y: this.homeY + 7,
      scaleX: this.baseScaleX * 1.08,
      scaleY: this.baseScaleY * 0.9,
      duration: 240,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  playDefeat({ onComplete } = {}) {
    const token = this.begin("defeat");
    this.restoreBody();
    this.burst({ count: 30, radius: 190, colors: [0x8eea70, 0x65e7ff, 0xc678ff] });
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.homeX + 8,
      angle: 5,
      duration: 55,
      yoyo: true,
      repeat: 7,
      onComplete: () => {
        if (!this.isCurrent(token)) return;
        this.scene.tweens.add({
          targets: this.sprite,
          y: this.homeY + 64,
          scaleX: this.baseScaleX * 1.72,
          scaleY: this.baseScaleY * 0.12,
          alpha: 0,
          angle: 0,
          duration: 620,
          ease: "Cubic.easeIn",
          onComplete,
        });
      },
    });
  }

  reset() {
    this.begin("setup");
    this.effects.forEach((effect) => effect?.active && effect.destroy());
    this.effects.clear();
    this.restoreBody();
    this.playIdle();
  }

  debugState() {
    return { state: this.state, counts: { ...this.counts } };
  }

  destroy() {
    this.token += 1;
    this.scene.tweens.killTweensOf(this.sprite);
    this.effects.forEach((effect) => effect?.active && effect.destroy());
    this.effects.clear();
  }
}
