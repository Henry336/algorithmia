export const GRAPHREACH_WORLD = Object.freeze({ width: 1254, height: 1254 });

export const GRAPHREACH_SPAWN = Object.freeze({ x: 82, y: 1098, facing: "right" });

// Corridors model paths, bridges, and stairs. The radius is the walkable width
// around each center line, measured at the character's feet.
export const GRAPHREACH_CORRIDORS = Object.freeze([
  {
    id: "west-cliff-path",
    radius: 58,
    points: [
      [52, 1120], [140, 1065], [214, 985], [265, 900], [310, 820],
      [348, 742], [315, 674], [268, 604], [226, 522], [202, 430],
      [210, 348], [250, 288], [330, 246],
    ],
  },
  { id: "memorial-path", radius: 52, points: [[210, 348], [165, 258], [142, 174]] },
  { id: "west-nexus-bridge", radius: 38, points: [[318, 247], [420, 247], [505, 250]] },
  { id: "east-nexus-bridge", radius: 38, points: [[712, 258], [790, 234], [872, 196], [950, 160]] },
  { id: "east-cliff-route", radius: 54, points: [[950, 160], [1040, 132], [1092, 102]] },
  { id: "west-crossing-approach", radius: 48, points: [[315, 674], [384, 636], [447, 606]] },
  { id: "lower-suspension-bridge", radius: 34, points: [[447, 606], [540, 594], [641, 604], [735, 604], [814, 578]] },
  { id: "chapel-crossing-approach", radius: 52, points: [[814, 578], [865, 548], [925, 526]] },
  { id: "chapel-to-basin-stairs", radius: 43, points: [[958, 625], [908, 704], [850, 792], [804, 884], [790, 974]] },
  { id: "basin-rim-west", radius: 42, points: [[790, 974], [803, 1050], [861, 1110], [944, 1140]] },
  { id: "basin-rim-east", radius: 44, points: [[944, 1140], [1034, 1114], [1092, 1048], [1110, 972]] },
  { id: "ferryman-dock", radius: 30, points: [[861, 1110], [911, 1070], [960, 1052]] },
  { id: "recursive-breach", radius: 38, points: [[310, 820], [366, 822], [420, 806]] },
]);

// Larger spaces use polygons so movement is not restricted to narrow rails.
export const GRAPHREACH_AREAS = Object.freeze([
  {
    id: "memorial-overlook",
    points: [[48, 96], [250, 58], [350, 124], [365, 230], [290, 310], [120, 296], [54, 238]],
  },
  { id: "boss-nexus", circle: [608, 255, 126] },
  {
    id: "upper-east-overlook",
    points: [[862, 80], [1176, 34], [1210, 208], [1118, 310], [930, 278], [848, 192]],
  },
  {
    id: "chapel-grounds",
    points: [[776, 372], [1118, 328], [1186, 510], [1132, 684], [948, 720], [770, 626], [724, 490]],
  },
  {
    id: "roofless-chapel",
    points: [[904, 314], [1128, 300], [1150, 560], [1038, 632], [900, 568], [866, 420]],
  },
]);

export const GRAPHREACH_INTERACTIONS = Object.freeze([
  {
    id: "mira",
    label: "Talk to Mira",
    x: 132,
    y: 1068,
    radius: 78,
    lines: [
      { speaker: "Mira Vale", text: "Graphreach is one place pretending to be several. Every bridge, root, stair, and tunnel belongs to the same route." },
      { speaker: "Mira Vale", text: "Do not trust the empty parts. Null Rot does not only damage stone. It deletes what the stone used to connect." },
    ],
  },
  {
    id: "witness-memorial",
    label: "Read the memorial",
    x: 150,
    y: 162,
    radius: 72,
    lines: [
      { speaker: "", text: "The names have been removed with impossible care. The spaces between them remain." },
      { speaker: "", text: "A final line survived: WE WERE NOT LOST. THE ROUTE WAS." },
    ],
  },
  {
    id: "boss-nexus",
    label: "Inspect the nexus",
    x: 608,
    y: 255,
    radius: 112,
    lines: [
      { speaker: "", text: "Every intact route points here. None of them agree on what should be waiting." },
      { speaker: "Mira Vale", text: "The nexus is dormant for now. That does not mean it is empty." },
    ],
  },
  {
    id: "recursive-breach",
    label: "Examine the root wall",
    x: 407,
    y: 806,
    radius: 68,
    lines: [
      { speaker: "", text: "Behind the roots is an arch. Inside that arch is a smaller arch. Something breathes several layers inward." },
      { speaker: "???", text: "You have stood here before. You were taller then. Or the world was smaller." },
    ],
  },
  {
    id: "chapel-ledger",
    label: "Read the route ledger",
    x: 850,
    y: 580,
    radius: 82,
    lines: [
      { speaker: "", text: "The chapel ledger records paths as promises between places, not lines on a map." },
      { speaker: "", text: "The newest entry has no destination. It only says: WHEN HE RETURNS, DO NOT COMPLETE THE CYCLE." },
    ],
  },
  {
    id: "ferryman-dock",
    label: "Listen at the dock",
    x: 950,
    y: 1060,
    radius: 82,
    lines: [
      { speaker: "", text: "The dock knocks gently against water that has no visible current." },
      { speaker: "Null Ferryman", text: "A route can end without being broken, Patchrunner. Your kind once understood that." },
    ],
  },
  {
    id: "waterfall",
    label: "Watch the erased water",
    x: 1090,
    y: 1000,
    radius: 72,
    lines: [
      { speaker: "", text: "The waterfall moves. Its reflection does not." },
    ],
  },
  {
    id: "chapter-exit",
    label: "Enter the northern route",
    x: 1090,
    y: 104,
    radius: 76,
    kind: "exit",
    lines: [
      { speaker: "Mira Vale", text: "That passage continues beyond Graphreach. Once we cross it, the routes behind us may rearrange again." },
    ],
  },
]);

export const GRAPHREACH_AMBIENCE = Object.freeze({
  grass: [
    [110, 220], [238, 132], [294, 272], [190, 468], [278, 560],
    [332, 720], [888, 184], [1040, 180], [856, 438], [1100, 620],
    [808, 1010], [1042, 1120],
  ],
  routeLights: [[354, 72], [894, 104], [790, 486], [1068, 528]],
  nullMotes: [[64, 436], [86, 520], [328, 478], [612, 570], [1162, 418], [388, 916]],
});

export const GRAPHREACH_ROUTE_PROBES = Object.freeze([
  GRAPHREACH_SPAWN,
  { x: 310, y: 820 },
  { x: 315, y: 674 },
  { x: 150, y: 162 },
  { x: 420, y: 247 },
  { x: 608, y: 255 },
  { x: 872, y: 196 },
  { x: 1090, y: 104 },
  { x: 814, y: 578 },
  { x: 958, y: 625 },
  { x: 790, y: 974 },
  { x: 950, y: 1060 },
]);

export function isGraphreachWalkable(x, y) {
  if (x < 0 || y < 0 || x > GRAPHREACH_WORLD.width || y > GRAPHREACH_WORLD.height) return false;

  if (GRAPHREACH_AREAS.some((area) => isInsideArea(x, y, area))) return true;
  return GRAPHREACH_CORRIDORS.some((corridor) => isInsideCorridor(x, y, corridor));
}

export function nearestGraphreachInteraction(x, y) {
  let nearest = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const interaction of GRAPHREACH_INTERACTIONS) {
    const distance = Math.hypot(interaction.x - x, interaction.y - y);
    if (distance <= interaction.radius && distance < nearestDistance) {
      nearest = interaction;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function isInsideArea(x, y, area) {
  if (area.circle) {
    const [cx, cy, radius] = area.circle;
    return Math.hypot(x - cx, y - cy) <= radius;
  }
  return pointInPolygon(x, y, area.points);
}

function isInsideCorridor(x, y, corridor) {
  for (let index = 1; index < corridor.points.length; index += 1) {
    const [x1, y1] = corridor.points[index - 1];
    const [x2, y2] = corridor.points[index];
    if (distanceToSegment(x, y, x1, y1, x2, y2) <= corridor.radius) return true;
  }
  return false;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = (dx * dx) + (dy * dy);
  if (lengthSquared === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, (((px - x1) * dx) + ((py - y1) * dy)) / lengthSquared));
  return Math.hypot(px - (x1 + (t * dx)), py - (y1 + (t * dy)));
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let current = 0, previous = points.length - 1; current < points.length; previous = current, current += 1) {
    const [xi, yi] = points[current];
    const [xj, yj] = points[previous];
    const crosses = ((yi > y) !== (yj > y))
      && (x < (((xj - xi) * (y - yi)) / (yj - yi)) + xi);
    if (crosses) inside = !inside;
  }
  return inside;
}
