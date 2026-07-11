export const WORKSHOP_STORAGE_KEY = "algorithmia.workshop.draft.v1";

export const TILE_TYPES = {
  floor: { label: "Floor", blocks: false, color: "#27333b" },
  wall: { label: "Wall", blocks: true, color: "#11161b" },
  door: { label: "Door", blocks: false, color: "#76562c" },
  hazard: { label: "Hazard", blocks: true, color: "#7b2f38" },
  null_rot: { label: "Null Rot", blocks: true, color: "#241137" },
  grass: { label: "Grass", blocks: false, color: "#2d5f47" },
  marsh: { label: "Marsh", blocks: false, color: "#203d3f" },
  water: { label: "Water", blocks: true, color: "#17384a" },
  bridge: { label: "Bridge", blocks: false, color: "#8a653c" },
  secret_wall: { label: "Secret Wall", blocks: true, color: "#211b22" },
  decoration: { label: "Decor", blocks: false, color: "#39424a" },
};

export const ENTITY_TYPES = {
  spawn: { label: "Player Spawn", blocks: false, sprite: "patchrunner" },
  npc: { label: "NPC", blocks: true, sprite: "mira" },
  enemy: { label: "Enemy", blocks: true, sprite: "sorting-slime" },
  boss: { label: "Boss", blocks: true, sprite: "bogolord" },
  collectible: { label: "Collectible", blocks: false, sprite: "archive-shard" },
  door: { label: "Exit Door", blocks: false, sprite: "door" },
  object: { label: "Lore Object", blocks: true, sprite: "book" },
};

export const SPRITE_LIBRARY = {
  patchrunner: {
    label: "Patchrunner",
    image: "assets/characters/patchrunner/A_young_field_technician_in/rotations/south.png",
  },
  mira: {
    label: "Mira",
    image: "assets/characters/mira/A_woman_in_her_40s/rotations/south.png",
  },
  "sorting-slime": {
    label: "Sorting Slime",
    image: "assets/characters/sorting-slime/A_translucent_lime-green_gelatinous_blob/rotations/south.png",
  },
  bogolord: {
    label: "Bogolord",
    image: "assets/characters/bogolord/Style_16-bit_horror_pixel_art/rotations/south.png",
  },
  "recursive-husk": {
    label: "Recursive Husk",
    image: "assets/characters/recursive-husk/recursive-husk-92.png",
  },
  "archive-shard": { label: "Archive Shard", icon: "D" },
  door: { label: "Door", icon: "[]" },
  book: { label: "Book", icon: "B" },
};

export const BATTLE_PRESETS = {
  none: { label: "None" },
  slime_column_rush: { label: "Slime Column Rush" },
  pop_in_hazard_grid: { label: "Pop-In Hazard Grid" },
  spiral_collapse: { label: "Spiral Collapse" },
  rotating_walls: { label: "Rotating Walls" },
  falling_tiles: { label: "Falling Tiles" },
  corruption_pulse: { label: "Corruption Pulse" },
};

export const REPAIR_CHALLENGES = {
  none: { label: "None" },
  sorting_intro: { label: "Sorting Intro", prerequisite: "loops, swaps" },
  merge_sorted_lists: { label: "Merge Sorted Lists", prerequisite: "Leetcode 88 style" },
  group_anagrams: { label: "Group Anagrams", prerequisite: "Leetcode 49 style" },
  valid_parentheses: { label: "Valid Parentheses", prerequisite: "Leetcode 20 style" },
  binary_search: { label: "Binary Search", prerequisite: "Leetcode 704 style" },
};

export const HINT_STYLES = {
  none: "No hints",
  clue: "Concept hint",
  partial: "Partial starter code",
  fill_blank: "Fill in the blank",
};

export function createDefaultLevel() {
  const width = 14;
  const height = 10;
  const tiles = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => (row === 0 || col === 0 || row === height - 1 || col === width - 1 ? "wall" : "floor"))
  );
  tiles[4][6] = "null_rot";
  tiles[4][7] = "null_rot";
  tiles[1][12] = "secret_wall";
  tiles[8][12] = "door";

  return {
    schemaVersion: 1,
    id: "workshop-draft",
    name: "Workshop Draft",
    chapter: "Custom",
    roomKind: "optional",
    music: "queueworks_low_hum",
    palette: "queueworks",
    width,
    height,
    tiles,
    playerSpawn: { x: 2, y: 7 },
    entities: [
      makeEntity("npc", 4, 5),
      makeEntity("enemy", 9, 4),
      makeEntity("collectible", 11, 2),
      makeEntity("door", 12, 8),
      makeEntity("object", 2, 2),
    ],
    triggers: [
      {
        id: "secret-door-open",
        label: "Open secret wall after all diamonds",
        when: "all_collectibles_collected",
        action: "open_secret_wall",
        target: { x: 12, y: 1 },
      },
    ],
  };
}

export function makeEntity(type, x, y) {
  const base = ENTITY_TYPES[type] || ENTITY_TYPES.object;
  const id = `${type}-${Date.now().toString(36)}-${Math.floor(Math.random() * 999).toString(36)}`;
  return {
    id,
    type,
    name: base.label,
    x,
    y,
    facing: "down",
    sprite: base.sprite,
    behavior: type === "enemy" || type === "boss" ? "touch_battle" : "interact",
    patrol: [],
    dialogue: defaultDialogue(type),
    encounter: defaultEncounter(type),
  };
}

export function normalizeLevel(input) {
  const fallback = createDefaultLevel();
  const level = typeof input === "object" && input ? input : fallback;
  const width = clampInt(level.width, 6, 40, fallback.width);
  const height = clampInt(level.height, 6, 28, fallback.height);
  const tiles = Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => {
      const tile = level.tiles?.[row]?.[col];
      if (TILE_TYPES[tile]) return tile;
      return row === 0 || col === 0 || row === height - 1 || col === width - 1 ? "wall" : "floor";
    })
  );

  return {
    schemaVersion: 1,
    id: String(level.id || fallback.id),
    name: String(level.name || fallback.name),
    chapter: String(level.chapter || fallback.chapter),
    roomKind: String(level.roomKind || fallback.roomKind),
    music: String(level.music || fallback.music),
    palette: String(level.palette || fallback.palette),
    width,
    height,
    tiles,
    playerSpawn: {
      x: clampInt(level.playerSpawn?.x, 0, width - 1, fallback.playerSpawn.x),
      y: clampInt(level.playerSpawn?.y, 0, height - 1, fallback.playerSpawn.y),
    },
    entities: Array.isArray(level.entities) ? level.entities.map(normalizeEntity).filter(Boolean) : fallback.entities,
    triggers: Array.isArray(level.triggers) ? level.triggers : fallback.triggers,
  };
}

function normalizeEntity(entity) {
  if (!entity || !ENTITY_TYPES[entity.type]) return null;
  return {
    id: String(entity.id || `${entity.type}-${Date.now().toString(36)}`),
    type: entity.type,
    name: String(entity.name || ENTITY_TYPES[entity.type].label),
    x: Number.isFinite(Number(entity.x)) ? Number(entity.x) : 1,
    y: Number.isFinite(Number(entity.y)) ? Number(entity.y) : 1,
    facing: ["up", "down", "left", "right"].includes(entity.facing) ? entity.facing : "down",
    sprite: SPRITE_LIBRARY[entity.sprite] ? entity.sprite : ENTITY_TYPES[entity.type].sprite,
    behavior: String(entity.behavior || "interact"),
    patrol: Array.isArray(entity.patrol) ? entity.patrol.filter((point) => Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y))) : [],
    dialogue: {
      lines: Array.isArray(entity.dialogue?.lines) ? entity.dialogue.lines.map(String) : defaultDialogue(entity.type).lines,
      choices: Array.isArray(entity.dialogue?.choices) ? entity.dialogue.choices.map(String) : [],
      condition: String(entity.dialogue?.condition || "always"),
    },
    encounter: {
      kind: String(entity.encounter?.kind || defaultEncounter(entity.type).kind),
      hp: clampInt(entity.encounter?.hp, 1, 999, defaultEncounter(entity.type).hp),
      shieldHp: clampInt(entity.encounter?.shieldHp, 0, 999, defaultEncounter(entity.type).shieldHp),
      damage: clampInt(entity.encounter?.damage, 1, 99, defaultEncounter(entity.type).damage),
      phaseThresholds: String(entity.encounter?.phaseThresholds || defaultEncounter(entity.type).phaseThresholds),
      phasePatterns: Array.isArray(entity.encounter?.phasePatterns) ? entity.encounter.phasePatterns : defaultEncounter(entity.type).phasePatterns,
      repairChallenge: REPAIR_CHALLENGES[entity.encounter?.repairChallenge] ? entity.encounter.repairChallenge : defaultEncounter(entity.type).repairChallenge,
      hintStyle: HINT_STYLES[entity.encounter?.hintStyle] ? entity.encounter.hintStyle : defaultEncounter(entity.type).hintStyle,
    },
  };
}

function defaultDialogue(type) {
  if (type === "npc") {
    return {
      lines: ["This room is editable. Paint the route, then test if it still makes sense."],
      choices: [],
      condition: "always",
    };
  }
  if (type === "object") {
    return {
      lines: ["The page describes a repair that someone gave up on halfway through."],
      choices: [],
      condition: "always",
    };
  }
  return { lines: [], choices: [], condition: "always" };
}

function defaultEncounter(type) {
  if (type === "boss") {
    return {
      kind: "boss",
      hp: 120,
      shieldHp: 100,
      damage: 8,
      phaseThresholds: "75,40",
      phasePatterns: ["slime_column_rush", "pop_in_hazard_grid", "spiral_collapse"],
      repairChallenge: "merge_sorted_lists",
      hintStyle: "partial",
    };
  }
  if (type === "enemy") {
    return {
      kind: "normal",
      hp: 35,
      shieldHp: 0,
      damage: 4,
      phaseThresholds: "",
      phasePatterns: ["slime_column_rush"],
      repairChallenge: "sorting_intro",
      hintStyle: "fill_blank",
    };
  }
  return {
    kind: "none",
    hp: 1,
    shieldHp: 0,
    damage: 1,
    phaseThresholds: "",
    phasePatterns: ["none"],
    repairChallenge: "none",
    hintStyle: "none",
  };
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}
