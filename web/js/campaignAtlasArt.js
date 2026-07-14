import { CAMPAIGN_WORLD, pointInShape, requirementMet, isCampaignWalkable } from "./campaignAtlasData.js";

const DEPTH = Object.freeze({ floor: 10, detail: 20, scenery: 200, entity: 400, foreground: 5000 });

function colorHex(value) {
  return `#${Number(value).toString(16).padStart(6, "0")}`;
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (const char of seedText) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPolygon(graphics, points, fill, stroke, strokeWidth = 8) {
  const phaserPoints = points.map(([x, y]) => new Phaser.Geom.Point(x, y));
  graphics.fillStyle(fill, 1);
  graphics.fillPoints(phaserPoints, true);
  graphics.lineStyle(strokeWidth, stroke, 1);
  graphics.strokePoints(phaserPoints, true);
}

function drawShape(graphics, shape, fill, stroke, strokeWidth = 8) {
  graphics.fillStyle(fill, 1);
  graphics.lineStyle(strokeWidth, stroke, 1);
  if (shape.kind === "ellipse") {
    graphics.fillEllipse(shape.x, shape.y, shape.rx * 2, shape.ry * 2);
    graphics.strokeEllipse(shape.x, shape.y, shape.rx * 2, shape.ry * 2);
  } else if (shape.kind === "circle") {
    graphics.fillCircle(shape.x, shape.y, shape.radius);
    graphics.strokeCircle(shape.x, shape.y, shape.radius);
  } else if (shape.kind === "rect") {
    graphics.fillRect(shape.x, shape.y, shape.width, shape.height);
    graphics.strokeRect(shape.x, shape.y, shape.width, shape.height);
  } else if (shape.kind === "polygon") {
    drawPolygon(graphics, shape.points, fill, stroke, strokeWidth);
  }
}

function drawRoute(graphics, route, theme) {
  const drawLine = (width, color, alpha) => {
    graphics.lineStyle(width, color, alpha);
    graphics.beginPath();
    route.points.forEach(([x, y], index) => {
      if (index === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    });
    graphics.strokePath();
  };
  drawLine(route.width + 18, theme.edge, 1);
  drawLine(route.width + 8, theme.terrainAlt, 1);
  drawLine(route.width, route.terrain.includes("bridge") ? theme.path : theme.terrain, 1);

  if (route.terrain.includes("bridge") || route.terrain.includes("rail") || route.terrain.includes("conveyor")) {
    drawLine(Math.max(2, route.width - 20), theme.edge, 0.32);
    drawLine(3, theme.accent, 0.44);
  }
}

function terrainColor(chapter, terrain) {
  const theme = chapter.theme;
  if (["archive", "gallery", "chapel"].includes(terrain)) return blendColor(theme.terrain, theme.warm, 0.2);
  if (["metal", "station", "rail", "clockwork", "forge", "lab", "citadel"].includes(terrain)) return blendColor(theme.terrain, theme.stone, 0.24);
  if (["moss", "grass", "root", "marsh", "ash"].includes(terrain)) return blendColor(theme.terrain, theme.foliage, 0.18);
  if (["wet-metal", "basin", "cave"].includes(terrain)) return blendColor(theme.terrain, theme.water, 0.18);
  if (["crystal", "source", "white-stone"].includes(terrain)) return blendColor(theme.terrain, theme.accent, 0.13);
  if (["obsidian", "breach", "scar", "secret"].includes(terrain)) return blendColor(theme.terrain, theme.rot, 0.22);
  if (terrain === "carnival") return blendColor(theme.terrain, theme.warm, 0.15);
  return theme.terrain;
}

function blendColor(a, b, amount) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const mix = (left, right) => Math.round(left + ((right - left) * amount));
  return (mix(ar, br) << 16) | (mix(ag, bg) << 8) | mix(ab, bb);
}

function centerOfShape(shape) {
  if (shape.kind === "polygon") {
    const total = shape.points.reduce((sum, point) => ({ x: sum.x + point[0], y: sum.y + point[1] }), { x: 0, y: 0 });
    return { x: total.x / shape.points.length, y: total.y / shape.points.length };
  }
  if (shape.kind === "rect") return { x: shape.x + (shape.width / 2), y: shape.y + (shape.height / 2) };
  return { x: shape.x, y: shape.y };
}

function shapeBounds(shape) {
  if (shape.kind === "rect") return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  if (shape.kind === "circle") return { x: shape.x - shape.radius, y: shape.y - shape.radius, width: shape.radius * 2, height: shape.radius * 2 };
  if (shape.kind === "ellipse") return { x: shape.x - shape.rx, y: shape.y - shape.ry, width: shape.rx * 2, height: shape.ry * 2 };
  const xs = shape.points.map((point) => point[0]);
  const ys = shape.points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

function paintBackdrop(scene, chapter, random) {
  const graphics = scene.add.graphics().setDepth(0);
  graphics.fillStyle(chapter.theme.void, 1);
  graphics.fillRect(0, 0, CAMPAIGN_WORLD.width, CAMPAIGN_WORLD.height);
  for (let band = 0; band < 8; band += 1) {
    const alpha = 0.09 + (band * 0.008);
    graphics.fillStyle(band % 2 === 0 ? chapter.theme.deep : chapter.theme.void, alpha);
    graphics.fillRect(0, band * 160, CAMPAIGN_WORLD.width, 160);
  }
  for (let index = 0; index < 260; index += 1) {
    const x = Math.floor(random() * CAMPAIGN_WORLD.width / 4) * 4;
    const y = Math.floor(random() * CAMPAIGN_WORLD.height / 4) * 4;
    const size = random() > 0.87 ? 4 : 2;
    const color = random() > 0.72 ? chapter.theme.rot : chapter.theme.accent;
    graphics.fillStyle(color, 0.08 + (random() * 0.16));
    graphics.fillRect(x, y, size, size);
  }
  return graphics;
}

function paintTerrain(scene, chapter, random) {
  const graphics = scene.add.graphics().setDepth(DEPTH.floor);
  for (const route of chapter.corridors) drawRoute(graphics, route, chapter.theme);
  for (const region of chapter.regions) {
    const color = terrainColor(chapter, region.terrain);
    drawShape(graphics, region.shape, color, chapter.theme.edge, 10);
  }

  const detail = scene.add.graphics().setDepth(DEPTH.detail);
  for (let index = 0; index < 920; index += 1) {
    const x = Math.floor((random() * CAMPAIGN_WORLD.width) / 4) * 4;
    const y = Math.floor((random() * CAMPAIGN_WORLD.height) / 4) * 4;
    if (!isCampaignWalkable(chapter, x, y, {}, { ignoreGates: true })) continue;
    const bright = random() > 0.6;
    detail.fillStyle(bright ? chapter.theme.terrainAlt : chapter.theme.edge, bright ? 0.2 : 0.16);
    const width = random() > 0.82 ? 10 : 4;
    detail.fillRect(x, y, width, random() > 0.6 ? 2 : 4);
  }

}

function paintBlockers(scene, chapter) {
  const graphics = scene.add.graphics().setDepth(DEPTH.detail + 4);
  for (const blocker of chapter.blockers) {
    const shape = blocker.shape;
    const bounds = shapeBounds(shape);
    if (blocker.kind === "water") {
      drawShape(graphics, shape, chapter.theme.water, chapter.theme.edge, 7);
      for (let offset = 10; offset < bounds.height; offset += 18) {
        graphics.lineStyle(3, chapter.theme.accent, 0.22);
        graphics.lineBetween(bounds.x + 10, bounds.y + offset, bounds.x + bounds.width - 10, bounds.y + offset);
      }
    } else if (blocker.kind === "lava") {
      drawShape(graphics, shape, blendColor(chapter.theme.warm, 0xff3018, 0.46), chapter.theme.edge, 8);
      graphics.lineStyle(4, 0xffd06a, 0.62);
      graphics.lineBetween(bounds.x + 12, bounds.y + (bounds.height * 0.45), bounds.x + bounds.width - 12, bounds.y + (bounds.height * 0.6));
    } else if (["void", "rot"].includes(blocker.kind)) {
      drawShape(graphics, shape, 0x020207, blocker.kind === "rot" ? chapter.theme.rot : chapter.theme.edge, 8);
      const center = centerOfShape(shape);
      graphics.fillStyle(chapter.theme.rot, blocker.kind === "rot" ? 0.4 : 0.18);
      graphics.fillCircle(center.x, center.y, Math.min(bounds.width, bounds.height) * 0.22);
    } else if (blocker.kind === "machinery") {
      drawShape(graphics, shape, chapter.theme.edge, chapter.theme.warm, 7);
      const center = centerOfShape(shape);
      graphics.lineStyle(5, chapter.theme.stone, 0.9);
      graphics.strokeCircle(center.x, center.y, Math.min(bounds.width, bounds.height) * 0.25);
      graphics.fillStyle(chapter.theme.warm, 0.8);
      graphics.fillRect(center.x - 6, center.y - 6, 12, 12);
    } else {
      drawShape(graphics, shape, chapter.theme.edge, chapter.theme.stone, 7);
    }
  }
}

function makeScenery(scene, chapter, item, x, y, index) {
  const container = scene.add.container(x, y).setDepth(y + DEPTH.scenery);
  const shadow = scene.add.ellipse(0, 2, 36, 13, 0x020407, 0.45);
  const art = scene.add.graphics();
  const theme = chapter.theme;
  container.add([shadow, art]);
  const px = (color, left, top, width, height, alpha = 1) => {
    art.fillStyle(color, alpha);
    art.fillRect(left, top, width, height);
  };

  switch (item.kind) {
    case "tree":
    case "willow":
    case "dead-tree": {
      const dead = item.kind === "dead-tree";
      px(dead ? theme.stone : 0x503d30, -8, -52, 16, 54);
      px(dead ? theme.stone : theme.foliage, -34, -78, 68, 20);
      px(dead ? blendColor(theme.stone, theme.rot, 0.4) : blendColor(theme.foliage, theme.accent, 0.12), -44, -62, 88, 22);
      px(dead ? theme.rot : theme.foliage, -28, -94, 56, 20, dead ? 0.66 : 1);
      if (item.kind === "willow") {
        px(theme.foliage, -44, -52, 7, 34, 0.75);
        px(theme.foliage, 36, -54, 7, 38, 0.75);
      }
      scene.tweens.add({ targets: art, angle: index % 2 ? 1.7 : -1.7, duration: 1600 + (index * 90), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      break;
    }
    case "reed":
    case "grass":
    case "root": {
      for (let blade = 0; blade < 5; blade += 1) px(item.kind === "root" ? theme.stone : theme.foliage, -16 + (blade * 7), -12 - ((blade % 2) * 8), 4, 14 + ((blade % 2) * 8), 0.85);
      scene.tweens.add({ targets: art, angle: index % 2 ? 5 : -5, duration: 900 + ((index % 4) * 130), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      break;
    }
    case "pipe":
    case "rail": {
      px(theme.edge, -28, -42, 56, 42);
      px(theme.stone, -21, -38, 42, 8);
      px(theme.stone, -21, -18, 42, 8);
      px(theme.accent, -4, -34, 8, 20, 0.62);
      break;
    }
    case "lamp":
    case "flame": {
      if (item.kind === "lamp") px(theme.stone, -4, -42, 8, 44);
      px(theme.warm, -9, item.kind === "lamp" ? -54 : -25, 18, 20, 0.9);
      px(0xfff2a0, -4, item.kind === "lamp" ? -50 : -21, 8, 12, 0.9);
      scene.tweens.add({ targets: art, alpha: 0.62, scaleY: 1.12, duration: 240 + ((index % 3) * 70), yoyo: true, repeat: -1, ease: "Stepped" });
      break;
    }
    case "archive":
    case "ticket-post":
    case "grave": {
      px(theme.edge, -22, -40, 44, 40);
      px(item.kind === "ticket-post" ? theme.accent : theme.stone, -16, -34, 32, 26);
      px(theme.warm, -11, -29, 22, 4, 0.8);
      px(theme.warm, -11, -20, 16, 4, 0.62);
      break;
    }
    case "clock":
    case "ring": {
      art.lineStyle(8, theme.stone, 1);
      art.strokeCircle(0, -28, 26);
      art.lineStyle(3, theme.warm, 0.9);
      art.lineBetween(0, -28, 0, -44);
      art.lineBetween(0, -28, 12, -22);
      scene.tweens.add({ targets: art, angle: item.kind === "ring" ? 360 : 2, duration: item.kind === "ring" ? 9000 : 1400, yoyo: item.kind !== "ring", repeat: -1, ease: item.kind === "ring" ? "Linear" : "Sine.easeInOut" });
      break;
    }
    case "furnace": {
      px(theme.edge, -30, -56, 60, 56);
      px(theme.stone, -24, -50, 48, 18);
      px(theme.warm, -17, -26, 34, 22);
      px(0xffd36b, -8, -21, 16, 14, 0.82);
      break;
    }
    case "crystal": {
      art.fillStyle(theme.accent, 0.92);
      art.fillTriangle(0, -50, -18, -2, 18, -2);
      art.fillStyle(theme.warm, 0.45);
      art.fillTriangle(0, -42, -5, -5, 8, -5);
      scene.tweens.add({ targets: art, alpha: 0.58, y: -5, duration: 900 + (index * 45), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      break;
    }
    case "banner": {
      px(theme.stone, -3, -68, 6, 70);
      px(theme.rot, 3, -62, 34, 44);
      px(theme.warm, 9, -54, 18, 6, 0.9);
      scene.tweens.add({ targets: art, scaleX: 0.86, duration: 780 + (index * 60), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      break;
    }
    case "statue": {
      px(theme.stone, -20, -56, 40, 56);
      px(theme.terrainAlt, -12, -74, 24, 20);
      px(theme.edge, -28, -6, 56, 8);
      px(theme.rot, -5, -48, 10, 18, 0.5);
      break;
    }
    default:
      px(theme.stone, -15, -28, 30, 28);
  }
  return container;
}

function paintScenery(scene, chapter) {
  let count = 0;
  for (const item of chapter.scenery) {
    item.positions.forEach(([x, y], index) => {
      makeScenery(scene, chapter, item, x, y, index);
      count += 1;
    });
  }
  return count;
}

function paintAmbient(scene, chapter, random) {
  const counts = { ...chapter.ambience };
  const moving = [];
  const makeFloorMote = (kind, index) => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const x = 50 + (random() * (CAMPAIGN_WORLD.width - 100));
      const y = 50 + (random() * (CAMPAIGN_WORLD.height - 100));
      const onFloor = isCampaignWalkable(chapter, x, y, {}, { ignoreGates: true });
      if ((kind === "grass" || kind === "flames") && !onFloor) continue;
      if (kind === "rot" && onFloor && random() > 0.65) continue;
      const color = kind === "rot" ? chapter.theme.rot : kind === "flames" ? chapter.theme.warm : chapter.theme.foliage;
      const width = kind === "grass" ? 3 : 4 + (index % 3);
      const height = kind === "grass" ? 12 : 4 + (index % 2);
      const mote = scene.add.rectangle(x, y, width, height, color, kind === "rot" ? 0.58 : 0.5).setDepth(kind === "rot" ? y + 260 : y + 80);
      scene.tweens.add({
        targets: mote,
        x: x + (index % 2 ? 8 : -8),
        y: y - (kind === "rot" ? 18 + (index % 4) * 5 : 5),
        alpha: kind === "rot" ? 0.05 : 0.28,
        angle: kind === "grass" ? (index % 2 ? 8 : -8) : 0,
        duration: (kind === "rot" ? 620 : 1100) + ((index % 7) * 95),
        yoyo: true,
        repeat: -1,
        ease: kind === "rot" ? "Stepped" : "Sine.easeInOut",
      });
      moving.push(mote);
      return;
    }
  };
  for (let index = 0; index < counts.grass; index += 1) makeFloorMote("grass", index);
  for (let index = 0; index < counts.flames; index += 1) makeFloorMote("flames", index);
  for (let index = 0; index < counts.rot; index += 1) makeFloorMote("rot", index);

  for (let index = 0; index < counts.motes; index += 1) {
    const x = random() * CAMPAIGN_WORLD.width;
    const y = random() * CAMPAIGN_WORLD.height;
    const mote = scene.add.rectangle(x, y, 2 + (index % 2) * 2, 2 + (index % 3), chapter.theme.accent, 0.25).setDepth(3900);
    scene.tweens.add({ targets: mote, y: y - 24 - (index % 5) * 6, alpha: 0, duration: 1600 + (index % 8) * 170, delay: index * 45, repeat: -1, ease: "Stepped" });
    moving.push(mote);
  }
  return { counts, moving };
}

function paintNullCracks(scene, chapter, random) {
  const graphics = scene.add.graphics().setDepth(DEPTH.detail + 8);
  const crackCount = Math.round(chapter.nullRot * 0.9);
  let drawn = 0;
  for (let attempt = 0; attempt < crackCount * 12 && drawn < crackCount; attempt += 1) {
    const x = 70 + (random() * (CAMPAIGN_WORLD.width - 140));
    const y = 70 + (random() * (CAMPAIGN_WORLD.height - 140));
    if (!isCampaignWalkable(chapter, x, y, {}, { ignoreGates: true })) continue;
    graphics.lineStyle(drawn % 4 === 0 ? 4 : 2, drawn % 5 === 0 ? chapter.theme.rot : 0x080711, 0.35 + ((drawn % 3) * 0.12));
    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(x + (drawn % 2 ? 10 : -9), y + 8);
    graphics.lineTo(x + (drawn % 3 ? 16 : -15), y + 19);
    graphics.strokePath();
    drawn += 1;
  }
  return drawn;
}

function createGateVisual(scene, chapter, gate, state) {
  const bounds = shapeBounds(gate.shape);
  const centerX = bounds.x + (bounds.width / 2);
  const centerY = bounds.y + (bounds.height / 2);
  const container = scene.add.container(centerX, centerY).setDepth(centerY + 320);
  const art = scene.add.graphics();
  const glow = scene.add.rectangle(0, 0, Math.max(36, bounds.width + 10), Math.max(12, bounds.height + 10), chapter.theme.rot, 0.18);
  container.add([glow, art]);
  const refresh = () => {
    const open = requirementMet(gate.requires, state());
    art.clear();
    glow.setFillStyle(open ? chapter.theme.accent : chapter.theme.rot, open ? 0.1 : 0.2);
    if (open) {
      art.lineStyle(3, chapter.theme.accent, 0.5);
      art.strokeRect(-(bounds.width / 2), -(bounds.height / 2), bounds.width, bounds.height);
      container.setAlpha(0.42);
    } else {
      art.fillStyle(chapter.theme.edge, 1);
      art.fillRect(-(bounds.width / 2), -(bounds.height / 2), bounds.width, bounds.height);
      art.lineStyle(5, chapter.theme.warm, 0.72);
      for (let x = -(bounds.width / 2) + 12; x < bounds.width / 2; x += 18) art.lineBetween(x, -(bounds.height / 2), x, bounds.height / 2);
      container.setAlpha(1);
    }
  };
  refresh();
  scene.tweens.add({ targets: glow, alpha: 0.04, duration: 740, yoyo: true, repeat: -1, ease: "Stepped" });
  return { container, refresh };
}

function createConcealedRegion(scene, chapter, region, state) {
  const cover = scene.add.graphics().setDepth(DEPTH.foreground - 10);
  const refresh = () => {
    cover.clear();
    cover.setVisible(!requirementMet(region.concealedUntil, state()));
    if (!cover.visible) return;
    drawShape(cover, region.shape, chapter.theme.void, chapter.theme.edge, 14);
    const bounds = shapeBounds(region.shape);
    cover.fillStyle(chapter.theme.deep, 0.96);
    for (let y = bounds.y + 10; y < bounds.y + bounds.height; y += 18) {
      cover.fillRect(bounds.x, y, bounds.width, 9);
    }
    cover.lineStyle(5, chapter.theme.rot, 0.34);
    cover.lineBetween(bounds.x + 18, bounds.y + 20, bounds.x + bounds.width - 24, bounds.y + bounds.height - 18);
    cover.lineBetween(bounds.x + bounds.width - 35, bounds.y + 12, bounds.x + 32, bounds.y + bounds.height - 12);
  };
  refresh();
  return { cover, refresh };
}

function paintOccluder(scene, chapter, occluder) {
  const base = scene.add.graphics().setDepth(occluder.y + 120);
  const roof = scene.add.graphics().setDepth(DEPTH.foreground);
  const half = occluder.width / 2;
  const postWidth = Math.max(12, Math.round(occluder.width * 0.14));
  base.fillStyle(chapter.theme.edge, 1);
  base.fillRect(occluder.x - half, occluder.y - occluder.height, postWidth, occluder.height);
  base.fillRect(occluder.x + half - postWidth, occluder.y - occluder.height, postWidth, occluder.height);
  base.fillStyle(chapter.theme.stone, 0.8);
  base.fillRect(occluder.x - half + 4, occluder.y - occluder.height + 8, postWidth - 8, occluder.height - 12);
  base.fillRect(occluder.x + half - postWidth + 4, occluder.y - occluder.height + 8, postWidth - 8, occluder.height - 12);

  roof.fillStyle(chapter.theme.edge, 1);
  roof.fillRect(occluder.x - half - 8, occluder.y - occluder.height - 18, occluder.width + 16, 34);
  roof.fillStyle(occluder.kind.includes("root") || occluder.kind.includes("tree") || occluder.kind.includes("willow") ? chapter.theme.foliage : chapter.theme.stone, 1);
  roof.fillRect(occluder.x - half, occluder.y - occluder.height - 12, occluder.width, 21);
  roof.fillStyle(chapter.theme.accent, 0.35);
  roof.fillRect(occluder.x - half + 12, occluder.y - occluder.height - 7, occluder.width - 24, 4);
  return { base, roof };
}

function drawHumanoid(art, theme, kind, tint) {
  const body = tint || theme.stone;
  const dark = theme.edge;
  const glow = kind === "keeper" ? theme.accent : kind === "sentinel" ? theme.warm : theme.rot;
  art.fillStyle(dark, 1);
  art.fillRect(-13, -55, 26, 22);
  art.fillRect(-17, -34, 34, 28);
  art.fillRect(-16, -8, 11, 10);
  art.fillRect(5, -8, 11, 10);
  art.fillStyle(body, 1);
  art.fillRect(-10, -51, 20, 16);
  art.fillRect(-13, -30, 26, 21);
  art.fillStyle(glow, 0.9);
  art.fillRect(-7, -45, 5, 4);
  art.fillRect(3, -45, 5, 4);
  art.fillRect(-5, -25, 10, 9);
  if (["cutter", "sentinel", "custodian", "warden", "forger"].includes(kind)) {
    art.fillStyle(theme.warm, 0.86);
    art.fillTriangle(-17, -32, -34, -18, -15, -14);
    art.fillTriangle(17, -32, 34, -18, 15, -14);
  }
  if (["clerk", "scribe"].includes(kind)) {
    art.fillStyle(theme.warm, 0.92);
    art.fillRect(15, -32, 16, 21);
    art.fillStyle(theme.edge, 0.8);
    art.fillRect(18, -27, 10, 3);
    art.fillRect(18, -20, 7, 3);
  }
}

function drawArchetype(scene, chapter, interaction) {
  const visual = interaction.visual || {};
  const kind = visual.archetype || defaultArchetype(interaction.type);
  const tint = visual.tint || chapter.theme.stone;
  const art = scene.add.graphics();
  const theme = chapter.theme;

  if (["keeper", "cutter", "clerk", "forger", "warden", "hermit", "sentinel", "scribe", "custodian"].includes(kind)) {
    drawHumanoid(art, theme, kind, tint);
  } else if (kind === "rune") {
    art.fillStyle(theme.rot, 0.9);
    art.fillRect(-11, -38, 22, 22);
    art.fillStyle(theme.accent, 1);
    art.fillRect(-5, -32, 10, 10);
    art.lineStyle(4, theme.warm, 0.9);
    art.strokeCircle(0, -27, 20);
  } else if (kind === "terminal") {
    art.fillStyle(theme.edge, 1);
    art.fillRect(-18, -34, 36, 34);
    art.fillStyle(tint, 0.85);
    art.fillRect(-11, -27, 22, 16);
    art.fillStyle(theme.warm, 0.8);
    art.fillRect(-4, -8, 8, 8);
  } else if (kind === "mirror") {
    art.lineStyle(7, theme.stone, 1);
    art.strokeCircle(0, -28, 22);
    art.fillStyle(tint, 0.42);
    art.fillCircle(0, -28, 16);
    art.fillStyle(theme.accent, 0.8);
    art.fillTriangle(-9, -36, 10, -31, -5, -20);
  } else if (kind === "diamond") {
    art.fillStyle(tint, 1);
    art.fillTriangle(0, -48, -18, -28, 0, -8);
    art.fillTriangle(0, -48, 18, -28, 0, -8);
    art.fillStyle(0xffffff, 0.72);
    art.fillTriangle(0, -43, -7, -29, 4, -28);
  } else if (["shade", "ghost", "echo", "wisp"].includes(kind)) {
    const body = kind === "ghost" || kind === "wisp" ? theme.accent : theme.rot;
    art.fillStyle(body, kind === "ghost" ? 0.68 : 0.9);
    art.fillCircle(0, -38, kind === "wisp" ? 16 : 22);
    art.fillTriangle(-22, -38, 22, -38, 0, 0);
    art.fillStyle(0x05060a, 0.95);
    art.fillRect(-10, -43, 7, 6);
    art.fillRect(4, -43, 7, 6);
    art.fillStyle(theme.accent, 0.75);
    art.fillRect(-4, -25, 8, 8);
  } else if (kind === "ember") {
    art.fillStyle(theme.warm, 1);
    art.fillTriangle(0, -62, -24, -10, 24, -10);
    art.fillStyle(0xffd66b, 0.95);
    art.fillTriangle(0, -49, -13, -11, 13, -11);
    art.fillStyle(theme.edge, 1);
    art.fillRect(-9, -35, 6, 5);
    art.fillRect(4, -35, 6, 5);
  } else if (kind === "imp") {
    art.fillStyle(theme.rot, 1);
    art.fillTriangle(-17, -46, -5, -66, -1, -42);
    art.fillTriangle(17, -46, 5, -66, 1, -42);
    art.fillCircle(0, -34, 22);
    art.fillRect(-14, -20, 28, 18);
    art.fillStyle(theme.warm, 1);
    art.fillRect(-9, -39, 6, 6);
    art.fillRect(4, -39, 6, 6);
  } else if (kind === "hound") {
    art.fillStyle(theme.edge, 1);
    art.fillRect(-30, -32, 50, 25);
    art.fillCircle(24, -38, 16);
    art.fillRect(-25, -9, 8, 12);
    art.fillRect(-5, -9, 8, 12);
    art.fillRect(13, -9, 8, 12);
    art.fillStyle(theme.rot, 1);
    art.fillRect(22, -42, 7, 6);
    art.lineStyle(4, theme.rot, 0.8);
    art.strokeCircle(-5, -23, 32);
  } else if (kind === "ferryman") {
    art.fillStyle(theme.edge, 1);
    art.fillTriangle(0, -98, -42, 0, 42, 0);
    art.fillCircle(0, -78, 22);
    art.fillStyle(theme.rot, 0.85);
    art.fillRect(-10, -82, 7, 6);
    art.fillRect(4, -82, 7, 6);
    art.lineStyle(7, theme.stone, 1);
    art.lineBetween(28, -80, 48, -8);
    art.lineBetween(28, -80, 55, -96);
  } else if (kind === "witness") {
    art.fillStyle(theme.rot, 0.88);
    art.fillEllipse(0, -36, 70, 44);
    art.fillStyle(0x020207, 1);
    art.fillEllipse(0, -36, 46, 28);
    art.fillStyle(theme.accent, 1);
    art.fillRect(-7, -43, 14, 14);
    art.lineStyle(3, theme.rot, 0.7);
    art.strokeCircle(0, -36, 45);
  } else {
    drawHumanoid(art, theme, kind, tint);
  }
  return art;
}

function defaultArchetype(type) {
  if (type === "puzzle") return "terminal";
  if (type === "collectible") return "diamond";
  if (type === "lore" || type === "secret") return "archive";
  if (type === "exit" || type === "ending") return "terminal";
  return "shade";
}

function addEntityAura(scene, container, chapter, interaction) {
  if (!interaction.visual?.aura) return;
  const radius = interaction.type === "boss" ? 54 : 38;
  const aura = scene.add.ellipse(0, -36, radius * 2, radius * 1.35, chapter.theme.rot, 0.14);
  container.addAt(aura, 1);
  scene.tweens.add({ targets: aura, alpha: 0.34, scaleX: 1.18, scaleY: 1.28, duration: 680, yoyo: true, repeat: -1, ease: "Stepped" });
  for (let index = 0; index < 9; index += 1) {
    const mote = scene.add.rectangle(-38 + ((index * 17) % 76), -75 + ((index * 23) % 62), 4 + (index % 2) * 3, 4, chapter.theme.rot, 0.75);
    container.add(mote);
    scene.tweens.add({ targets: mote, alpha: 0, x: mote.x + (index % 2 ? 9 : -9), duration: 260 + (index * 45), yoyo: true, repeat: -1, ease: "Stepped" });
  }
}

export function createCampaignEntity(scene, chapter, interaction) {
  const container = scene.add.container(interaction.x, interaction.y).setDepth(interaction.y + DEPTH.entity);
  const shadowWidth = interaction.type === "boss" ? 70 : 42;
  const shadow = scene.add.ellipse(0, 2, shadowWidth, interaction.type === "boss" ? 20 : 13, 0x020307, 0.52);
  container.add(shadow);

  let sprite;
  if (interaction.visual?.asset && scene.textures.exists(interaction.visual.asset)) {
    sprite = scene.add.image(0, 0, interaction.visual.asset).setOrigin(0.5, 1);
  } else {
    sprite = drawArchetype(scene, chapter, interaction);
  }
  const scale = interaction.visual?.scale || (interaction.type === "boss" ? 1.35 : 1);
  sprite.setScale(scale);
  container.add(sprite);
  addEntityAura(scene, container, chapter, interaction);

  if (!interaction.hiddenMarker && !["npc", "enemy", "boss"].includes(interaction.type)) {
    const marker = scene.add.rectangle(0, -70, 8, 8, chapter.theme.warm, 0.8).setAngle(45);
    container.add(marker);
    scene.tweens.add({ targets: marker, y: -78, alpha: 0.35, duration: 720, yoyo: true, repeat: -1, ease: "Stepped" });
  }

  const idle = interaction.visual?.idle || "breathe";
  if (idle === "flicker") {
    scene.tweens.add({ targets: sprite, alpha: 0.5, x: 2, duration: 170, yoyo: true, repeat: -1, repeatDelay: 240, ease: "Stepped" });
  } else if (idle === "skitter") {
    scene.tweens.add({ targets: sprite, x: 3, angle: 2, duration: 180, yoyo: true, repeat: -1, repeatDelay: 280, ease: "Stepped" });
  } else if (idle === "slime") {
    scene.tweens.add({ targets: sprite, scaleX: scale * 1.08, scaleY: scale * 0.93, y: 2, duration: 540, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  } else if (idle === "husk") {
    scene.tweens.add({ targets: sprite, scaleX: scale * 0.98, scaleY: scale * 1.04, y: -3, duration: 880, yoyo: true, repeat: -1, ease: "Stepped" });
  } else if (idle === "boss") {
    scene.tweens.add({ targets: sprite, y: -7, angle: interaction.id === "bogolord" ? 1.5 : 0, duration: 1050, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  } else if (idle === "float") {
    scene.tweens.add({ targets: sprite, y: -9, duration: 820, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  } else {
    scene.tweens.add({ targets: sprite, scaleY: scale * 1.025, y: -2, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }
  return { container, sprite, interaction, patrolIndex: 0, patrolDirection: 1 };
}

export function renderCampaignWorld(scene, chapter, stateGetter) {
  const random = seededRandom(chapter.id);
  paintBackdrop(scene, chapter, random);
  paintTerrain(scene, chapter, random);
  paintBlockers(scene, chapter);
  const crackCount = paintNullCracks(scene, chapter, random);
  const sceneryCount = paintScenery(scene, chapter);
  const ambient = paintAmbient(scene, chapter, random);
  const gates = chapter.gates.map((gate) => createGateVisual(scene, chapter, gate, stateGetter));
  chapter.occluders.forEach((occluder) => paintOccluder(scene, chapter, occluder));
  const concealed = chapter.regions.filter((region) => region.concealedUntil).map((region) => createConcealedRegion(scene, chapter, region, stateGetter));
  return {
    gates,
    concealed,
    refreshGates: () => {
      gates.forEach((gate) => gate.refresh());
      concealed.forEach((region) => region.refresh());
    },
    counts: { ...ambient.counts, scenery: sceneryCount, cracks: crackCount, occluders: chapter.occluders.length, gates: chapter.gates.length, concealed: concealed.length },
  };
}
