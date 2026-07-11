import { ENTITY_TYPES, TILE_TYPES } from "./workshopData.js";

const DIRECTIONS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

export function validateWorkshopLevel(level) {
  const warnings = [];
  const errors = [];
  const reachable = collectReachable(level);

  if (!inBounds(level, level.playerSpawn.x, level.playerSpawn.y)) {
    errors.push("Player spawn is outside the room.");
  } else if (isTileBlocked(level.tiles[level.playerSpawn.y][level.playerSpawn.x])) {
    errors.push("Player spawn is on a blocking tile.");
  }

  for (const entity of level.entities) {
    if (!inBounds(level, entity.x, entity.y)) {
      errors.push(`${entity.name} is outside the room.`);
      continue;
    }
    if (isTileBlocked(level.tiles[entity.y][entity.x])) {
      errors.push(`${entity.name} is placed on a blocking tile.`);
    }
    if (!isEntityReachable(level, entity, reachable)) {
      warnings.push(`${entity.name} is not reachable from the spawn.`);
    }
    if ((entity.type === "enemy" || entity.type === "boss") && entity.encounter.kind === "none") {
      warnings.push(`${entity.name} has no encounter assigned.`);
    }
    if ((entity.type === "npc" || entity.type === "object") && entity.dialogue.lines.length === 0) {
      warnings.push(`${entity.name} has no dialogue.`);
    }
    for (const point of entity.patrol) {
      if (!inBounds(level, point.x, point.y) || isTileBlocked(level.tiles[point.y][point.x])) {
        warnings.push(`${entity.name} has a patrol point inside a blocked or missing tile.`);
      }
    }
  }

  const exits = level.entities.filter((entity) => entity.type === "door");
  if (exits.length === 0) warnings.push("No exit door has been placed.");
  for (const exit of exits) {
    if (!isEntityReachable(level, exit, reachable)) {
      warnings.push(`${exit.name} is not reachable from the spawn.`);
    }
  }

  const bosses = level.entities.filter((entity) => entity.type === "boss");
  if (level.roomKind === "boss" && bosses.length === 0) {
    errors.push("Boss rooms need one boss entity.");
  }

  const collectibles = level.entities.filter((entity) => entity.type === "collectible");
  const needsCollectibles = level.triggers.some((trigger) => trigger.when === "all_collectibles_collected");
  if (needsCollectibles && collectibles.length === 0) {
    warnings.push("A trigger waits for all collectibles, but the room has no collectibles.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    reachable,
  };
}

export function collectReachable(level) {
  const reachable = new Set();
  const start = level.playerSpawn;
  if (!inBounds(level, start.x, start.y) || isTileBlocked(level.tiles[start.y][start.x])) return reachable;

  const queue = [start];
  reachable.add(pointKey(start.x, start.y));

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const direction of DIRECTIONS) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      if (!inBounds(level, next.x, next.y)) continue;
      if (isBlockedForReachability(level, next.x, next.y)) continue;
      const key = pointKey(next.x, next.y);
      if (reachable.has(key)) continue;
      reachable.add(key);
      queue.push(next);
    }
  }

  return reachable;
}

export function inBounds(level, x, y) {
  return y >= 0 && y < level.height && x >= 0 && x < level.width;
}

export function isTileBlocked(tile) {
  return Boolean(TILE_TYPES[tile]?.blocks);
}

export function entityBlocks(entity) {
  return Boolean(ENTITY_TYPES[entity.type]?.blocks);
}

export function pointKey(x, y) {
  return `${x},${y}`;
}

function isBlockedForReachability(level, x, y) {
  if (isTileBlocked(level.tiles[y][x])) return true;
  return level.entities.some((entity) => entityBlocks(entity) && entity.x === x && entity.y === y);
}

function isEntityReachable(level, entity, reachable) {
  if (!entityBlocks(entity)) return reachable.has(pointKey(entity.x, entity.y));
  return DIRECTIONS.some((direction) => {
    const x = entity.x + direction.x;
    const y = entity.y + direction.y;
    return inBounds(level, x, y) && reachable.has(pointKey(x, y));
  });
}
