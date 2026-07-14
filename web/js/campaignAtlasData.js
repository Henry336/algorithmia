// Campaign spaces live here as readable world data. The Phaser scene renders the
// shapes, but this file remains the source of truth for paths, walls, gates,
// interactions, and story beats.

export const CAMPAIGN_WORLD = Object.freeze({ width: 1920, height: 1280 });

const poly = (id, name, points, terrain = "floor") => ({ id, name, terrain, shape: { kind: "polygon", points } });
const oval = (id, name, x, y, rx, ry, terrain = "floor") => ({ id, name, terrain, shape: { kind: "ellipse", x, y, rx, ry } });
const box = (id, name, x, y, width, height, terrain = "floor") => ({ id, name, terrain, shape: { kind: "rect", x, y, width, height } });
const corridor = (id, points, width, terrain = "path") => ({ id, points, width, terrain });
const circle = (x, y, radius) => ({ kind: "circle", x, y, radius });
const ellipse = (x, y, rx, ry) => ({ kind: "ellipse", x, y, rx, ry });
const rect = (x, y, width, height) => ({ kind: "rect", x, y, width, height });
const polygon = (points) => ({ kind: "polygon", points });

const MIRA_VISUAL = { asset: "mira", scale: 1.12, idle: "breathe" };

export const CAMPAIGN_CHAPTERS = [
  {
    id: "queueworks-verge",
    number: 0,
    title: "Queueworks Verge",
    subtitle: "THE INTAKE STILL REMEMBERS RAIN",
    nullRot: 5,
    spawn: { x: 245, y: 1090, facing: "east" },
    theme: {
      void: 0x07151a, deep: 0x0b2428, terrain: 0x36554c, terrainAlt: 0x45675a,
      path: 0x6f7561, edge: 0x1d3534, accent: 0x79d7c4, warm: 0xe4b35a,
      water: 0x153f4d, foliage: 0x668d63, stone: 0x5f6b66, rot: 0x43235f,
    },
    regions: [
      poly("awakening", "Awakening Verge", [[120, 970], [190, 840], [430, 825], [575, 925], [525, 1165], [250, 1210], [125, 1130]]),
      oval("sluice", "Sluice Garden", 690, 885, 250, 205, "moss"),
      poly("intake", "Queueworks Intake", [[860, 620], [1040, 545], [1305, 610], [1395, 785], [1300, 1000], [1010, 1025], [835, 855]]),
      oval("reservoir", "Sorting Reservoir", 1580, 480, 285, 235, "wet-metal"),
      poly("archive-isle", "Rain Archive", [[900, 180], [1060, 115], [1255, 190], [1285, 365], [1130, 470], [925, 395]], "archive"),
      oval("empty-weir", "The Empty Weir", 1545, 1010, 190, 120, "moss"),
    ],
    corridors: [
      corridor("wake-sluice", [[410, 960], [525, 910], [610, 900]], 112, "reed-path"),
      corridor("sluice-intake", [[820, 840], [900, 790], [980, 775]], 104, "service-walk"),
      corridor("intake-reservoir", [[1280, 690], [1390, 620], [1510, 575]], 96, "pipe-bridge"),
      corridor("intake-archive", [[1075, 625], [1060, 515], [1080, 390]], 78, "archive-stair"),
      corridor("intake-weir", [[1290, 905], [1420, 960], [1510, 990]], 82, "reed-path"),
      corridor("reservoir-exit", [[1740, 345], [1820, 265]], 86, "service-walk"),
    ],
    blockers: [
      { id: "wake-pool", shape: ellipse(315, 1040, 72, 46), kind: "water" },
      { id: "sluice-pool-a", shape: ellipse(650, 850, 72, 98), kind: "water" },
      { id: "sluice-pool-b", shape: ellipse(780, 930, 82, 52), kind: "water" },
      { id: "intake-vat", shape: circle(1138, 790, 70), kind: "machinery" },
      { id: "reservoir-drain", shape: ellipse(1600, 515, 93, 72), kind: "water" },
      { id: "archive-hole", shape: circle(1125, 282, 44), kind: "rot" },
    ],
    gates: [
      { id: "queueworks-exit-gate", shape: rect(1748, 300, 72, 28), requires: "queueworksGateOpen", label: "The reservoir gate is still sealed." },
    ],
    occluders: [
      { kind: "pipe-arch", x: 1402, y: 618, width: 105, height: 82 },
      { kind: "gatehouse", x: 1778, y: 315, width: 118, height: 90 },
      { kind: "willow-canopy", x: 507, y: 915, width: 120, height: 78 },
    ],
    scenery: [
      { kind: "willow", positions: [[180, 930], [470, 865], [585, 770], [790, 770], [1510, 1060]] },
      { kind: "reed", positions: [[240, 1120], [390, 1140], [590, 990], [730, 1020], [845, 940], [1600, 1110]] },
      { kind: "pipe", positions: [[1010, 665], [1260, 650], [1330, 820], [1510, 365], [1690, 555]] },
      { kind: "lamp", positions: [[255, 900], [825, 875], [985, 620], [1280, 710], [1730, 360]] },
      { kind: "archive", positions: [[980, 245], [1195, 215], [1215, 350]] },
    ],
    ambience: { grass: 28, water: 18, trees: 8, flames: 0, motes: 8, rot: 5 },
    puzzles: {
      "queue-valves": {
        mode: "sequence",
        label: "Pressure Relay",
        solution: ["low", "return", "high"],
        flag: "queueworksValvesAligned",
        complete: [
          { speaker: "", text: "The three valves answer in one clean rhythm. Water stops arguing with the intake." },
          { speaker: "Mira Vale", text: "That is the route. Low pressure, return flow, then the main line. Keep it in that order." },
        ],
      },
    },
    objectives: [
      { until: "runeSnarlCleared", text: "Follow the loose runes through the Sluice Garden." },
      { until: "queueworksValvesAligned", text: "Align the three pressure relays around the intake." },
      { until: "queueworksGateOpen", text: "Reach the Sorting Reservoir and repair its guardian." },
      { text: "The northern reservoir gate is open." },
    ],
    intro: [
      { speaker: "", text: "Rain moves through a broken intake in careful little loops. You wake beside it with no name, no memory, and Python sitting in your head like it has always lived there." },
      { speaker: "Mira Vale", text: "Easy. You are alive. That already puts you ahead of most things the Null Rot reaches." },
      { speaker: "Mira Vale", text: "This place is larger than one room. We can backtrack whenever we need to. First, let us find out why the Queueworks stopped." },
    ],
    interactions: [
      { id: "mira-queue", type: "npc", label: "Talk to Mira Vale", x: 420, y: 1050, radius: 72, visual: MIRA_VISUAL, lines: [
        { speaker: "Mira Vale", text: "You speak Python cleanly, but you cannot remember your own name. I would call that strange if the rain had not started flowing upward this morning." },
        { speaker: "Mira Vale", text: "Repair what you can. Memory tends to follow honest work." },
      ] },
      { id: "queue-memory", type: "secret", label: "Listen", x: 1010, y: 255, radius: 58, hiddenMarker: true, foundFlag: "foundQueueworksSecret", lines: [
        { speaker: "", text: "A voice inside the wet stone whispers: You have stood here before. The first time, the rain was afraid of you." },
        { speaker: "", text: "There is nobody behind the wall. The wall still waits for you to answer." },
      ] },
      { id: "rune-snarl", type: "enemy", encounter: "rune-snarl", label: "Untangle the Rune Snarl", x: 760, y: 815, radius: 76, clearedFlag: "runeSnarlCleared", patrol: [[760, 760], [820, 780], [800, 840]], visual: { archetype: "rune", scale: 1.05, idle: "flicker" }, approach: [
        { speaker: "", text: "Loose route glyphs pull themselves into a knot and spit the same four values back in a different order." },
        { speaker: "Mira Vale", text: "Small problem. Real rule. Untangle it before the knot reaches the water." },
      ] },
      { id: "valve-low", type: "puzzle", puzzle: "queue-valves", step: "low", label: "Turn low-pressure valve", x: 970, y: 900, radius: 64, visual: { archetype: "terminal", tint: 0x79d7c4 } },
      { id: "valve-return", type: "puzzle", puzzle: "queue-valves", step: "return", label: "Turn return valve", x: 1190, y: 940, radius: 64, visual: { archetype: "terminal", tint: 0xe4b35a } },
      { id: "valve-high", type: "puzzle", puzzle: "queue-valves", step: "high", label: "Turn main-pressure valve", x: 1305, y: 750, radius: 64, visual: { archetype: "terminal", tint: 0xc86b58 } },
      { id: "sorting-slime", type: "boss", encounter: "sorting-slime", label: "Confront the Sorting Slime", x: 1585, y: 430, radius: 108, clearedFlag: "queueworksGateOpen", requirements: { all: ["runeSnarlCleared", "queueworksValvesAligned"] }, lockedLines: [
        { speaker: "Mira Vale", text: "The shield is feeding on the intake. Clear the loose runes and align the pressure relays first, or we will be fighting the whole reservoir at once." },
      ], visual: { asset: "sorting-slime", scale: 1.7, idle: "slime" }, approach: [
        { speaker: "Mira Vale", text: "The slime has its shield up. Reach it, repair the bad logic, then hit it while the shield is down." },
        { speaker: "", text: "The reservoir convulses. Something enormous and gelatinous drops from the ceiling." },
      ] },
      { id: "empty-weir-lore", type: "lore", label: "Inspect the abandoned bench", x: 1540, y: 1030, radius: 60, lines: [
        { speaker: "", text: "Two cups sit on the bench. One is dust-dry. The other is still warm." },
        { speaker: "Mira Vale", text: "No footprints. Do not ask me whose cup that is." },
      ] },
      { id: "queue-exit", type: "exit", label: "Enter the Dispatch Meridian", x: 1820, y: 260, radius: 76, requirements: "queueworksGateOpen", nextChapter: 1 },
    ],
  },
  {
    id: "dispatch-meridian",
    number: 1,
    title: "Dispatch Meridian",
    subtitle: "EVERY MESSAGE ARRIVES SOMEWHERE",
    nullRot: 13,
    spawn: { x: 955, y: 1130, facing: "north" },
    theme: {
      void: 0x080f17, deep: 0x111d29, terrain: 0x334857, terrainAlt: 0x415b68,
      path: 0x667884, edge: 0x172b37, accent: 0x7ed7d2, warm: 0xf0b34b,
      water: 0x132c40, foliage: 0x57736b, stone: 0x71818a, rot: 0x4f256d,
    },
    regions: [
      poly("public-queue", "Public Queue", [[720, 1010], [805, 895], [1115, 895], [1210, 1020], [1110, 1215], [790, 1215]], "station"),
      box("west-switch", "West Switchbacks", 270, 650, 410, 270, "rail"),
      poly("east-switch", "East Switchbacks", [[1240, 650], [1655, 630], [1760, 770], [1660, 930], [1280, 910]], "rail"),
      box("lost-archive", "Lost Mail Archive", 170, 220, 480, 270, "archive"),
      poly("meridian", "Meridian Concourse", [[740, 500], [850, 400], [1080, 395], [1190, 510], [1160, 760], [760, 760]], "station"),
      oval("spire", "Dispatcher Spire", 960, 185, 270, 150, "clockwork"),
      oval("dead-platform", "Platform Thirteen", 1570, 290, 220, 125, "rail"),
    ],
    corridors: [
      corridor("queue-concourse", [[955, 930], [955, 730]], 108, "moving-walk"),
      corridor("queue-west", [[790, 1000], [655, 880], [570, 820]], 82, "rail-bridge"),
      corridor("queue-east", [[1130, 1010], [1280, 860], [1370, 815]], 82, "rail-bridge"),
      corridor("west-archive", [[355, 675], [340, 490]], 72, "service-rail"),
      corridor("west-concourse", [[650, 720], [760, 650]], 86, "rail-bridge"),
      corridor("east-concourse", [[1270, 740], [1160, 650]], 86, "rail-bridge"),
      corridor("concourse-spire", [[960, 430], [960, 305]], 92, "clock-bridge"),
      corridor("east-dead", [[1630, 650], [1590, 415]], 64, "broken-rail"),
      corridor("spire-exit", [[960, 90], [960, 22]], 82, "clock-bridge"),
    ],
    blockers: [
      { id: "queue-clock", shape: circle(960, 1060, 66), kind: "machinery" },
      { id: "west-hole", shape: ellipse(465, 775, 68, 48), kind: "void" },
      { id: "east-hole-a", shape: ellipse(1450, 735, 72, 44), kind: "void" },
      { id: "east-hole-b", shape: ellipse(1590, 840, 56, 68), kind: "void" },
      { id: "archive-stack", shape: rect(330, 270, 90, 150), kind: "archive" },
      { id: "concourse-clock", shape: circle(955, 590, 82), kind: "machinery" },
      { id: "platform-thirteen-hole", shape: circle(1575, 300, 56), kind: "rot" },
    ],
    gates: [
      { id: "dispatch-spire-gate", shape: rect(920, 340, 80, 28), requires: "dispatchRoutesAligned", label: "The Spire refuses an unresolved route." },
      { id: "dispatch-exit", shape: rect(920, 58, 82, 26), requires: "dispatcherDefeated", label: "The north lift is held by the Dispatcher." },
    ],
    occluders: [
      { kind: "rail-arch", x: 960, y: 795, width: 122, height: 92 },
      { kind: "rail-arch", x: 650, y: 720, width: 98, height: 78 },
      { kind: "clock-arch", x: 960, y: 350, width: 136, height: 104 },
    ],
    scenery: [
      { kind: "ticket-post", positions: [[800, 1110], [1110, 1110], [420, 685], [1510, 690], [1090, 520]] },
      { kind: "rail", positions: [[555, 850], [1310, 870], [340, 545], [1600, 540], [960, 350]] },
      { kind: "clock", positions: [[860, 470], [1070, 470], [310, 350], [1630, 250]] },
      { kind: "lamp", positions: [[850, 965], [1060, 965], [620, 690], [1300, 690], [915, 310], [1005, 310]] },
      { kind: "archive", positions: [[230, 280], [515, 275], [230, 420], [535, 420]] },
    ],
    ambience: { grass: 0, water: 4, trees: 0, flames: 0, motes: 22, rot: 12 },
    puzzles: {
      "dispatch-route": {
        mode: "sequence", label: "Priority Junction", solution: ["urgent", "arrival", "overflow"], flag: "dispatchRoutesAligned",
        complete: [
          { speaker: "", text: "The rails stop fighting for the same destination. Three routes braid into one readable line." },
          { speaker: "Mira Vale", text: "Urgent first, arrival order preserved, overflow last. The Spire has no excuse left." },
        ],
      },
    },
    objectives: [
      { until: "lineCutterCleared", text: "Recover the stolen priority ticket in the west switchbacks." },
      { until: "backlogClerkCleared", text: "Clear the growing backlog on the east platforms." },
      { until: "dispatchRoutesAligned", text: "Route the three Meridian junctions in policy order." },
      { until: "dispatcherDefeated", text: "Climb the Spire and confront the Dispatcher." },
      { text: "Take the north lift toward Heaplight." },
    ],
    intro: [
      { speaker: "", text: "The Meridian hangs over a dark queue canal. Platforms drift by a few pixels whenever nobody is standing on them." },
      { speaker: "Mira Vale", text: "The Dispatcher kept half the city talking. Now he keeps every message because he cannot decide which loss would be worse." },
    ],
    interactions: [
      { id: "ticket-keeper", type: "npc", label: "Talk to the Ticket Keeper", x: 835, y: 1140, radius: 68, visual: { archetype: "keeper", scale: 1.1, idle: "breathe" }, lines: [
        { speaker: "Ticket Keeper", text: "Every ticket says urgent now. Even the blank ones. Especially the blank ones." },
        { speaker: "Mira Vale", text: "Keep the originals. We will repair the policy, not rewrite the people waiting on it." },
      ] },
      { id: "line-cutter", type: "enemy", encounter: "line-cutter", label: "Stop the Line Cutter", x: 570, y: 700, radius: 74, clearedFlag: "lineCutterCleared", patrol: [[420, 700], [585, 730], [520, 860]], visual: { archetype: "cutter", idle: "skitter" }, approach: [
        { speaker: "", text: "A figure made of torn ticket edges vaults the rail and laughs in duplicate." },
        { speaker: "Line Cutter", text: "If I arrive everywhere first, nobody can say I was late." },
      ] },
      { id: "backlog-clerk", type: "enemy", encounter: "backlog-clerk", label: "Face the Backlog Clerk", x: 1505, y: 790, radius: 74, clearedFlag: "backlogClerkCleared", patrol: [[1390, 700], [1630, 710], [1640, 800], [1420, 820]], visual: { archetype: "clerk", idle: "breathe" }, approach: [
        { speaker: "Backlog Clerk", text: "I filed tomorrow under yesterday so today would have room." },
        { speaker: "Mira Vale", text: "That sentence explains the entire platform." },
      ] },
      { id: "route-urgent", type: "puzzle", puzzle: "dispatch-route", step: "urgent", label: "Route urgent rail", x: 780, y: 555, radius: 62, visual: { archetype: "terminal", tint: 0xe06161 } },
      { id: "route-arrival", type: "puzzle", puzzle: "dispatch-route", step: "arrival", label: "Route arrival rail", x: 1125, y: 555, radius: 62, visual: { archetype: "terminal", tint: 0x7ed7d2 } },
      { id: "route-overflow", type: "puzzle", puzzle: "dispatch-route", step: "overflow", label: "Route overflow rail", x: 955, y: 720, radius: 62, visual: { archetype: "terminal", tint: 0xf0b34b } },
      { id: "lost-letter", type: "secret", label: "Read the unaddressed letter", x: 255, y: 250, radius: 56, hiddenMarker: true, foundFlag: "foundDispatcherSecret", lines: [
        { speaker: "", text: "The letter begins: To the man who froze the world because he loved it." },
        { speaker: "", text: "The rest has been carefully removed. Not torn. Removed, as if those words were never allocated." },
      ] },
      { id: "platform-thirteen", type: "lore", label: "Listen to Platform Thirteen", x: 1660, y: 270, radius: 66, lines: [
        { speaker: "", text: "The departure board lists your name in a language you have never learned." },
        { speaker: "", text: "DELAYED: until you remember why you came back." },
      ] },
      { id: "dispatcher", type: "boss", encounter: "dispatcher", label: "Confront the Dispatcher", x: 960, y: 175, radius: 108, clearedFlag: "dispatcherDefeated", requirements: { all: ["lineCutterCleared", "backlogClerkCleared", "dispatchRoutesAligned"] }, lockedLines: [
        { speaker: "The Dispatcher", text: "Two queues remain broken and the junction is unresolved. I will not dispatch another loss." },
      ], visual: { asset: "dispatcher", scale: 1.78, idle: "breathe" }, approach: [
        { speaker: "The Dispatcher", text: "Every route ends in somebody waiting. Tell me which person deserves to become a delay." },
        { speaker: "Mira Vale", text: "Nobody. We are fixing the policy that made you choose people instead of routes." },
      ] },
      { id: "dispatch-exit-interaction", type: "exit", label: "Ride the Heaplight lift", x: 960, y: 42, radius: 70, requirements: "dispatcherDefeated", nextChapter: 2 },
    ],
  },
  {
    id: "heaplight-caldera",
    number: 2,
    title: "Heaplight Caldera",
    subtitle: "THE FURNACE SORTS WHAT THE CITY FORGOT",
    nullRot: 27,
    spawn: { x: 210, y: 1090, facing: "east" },
    theme: {
      void: 0x160b0a, deep: 0x2a1210, terrain: 0x4c3b35, terrainAlt: 0x655047,
      path: 0x77615a, edge: 0x2c1b18, accent: 0x78d4c5, warm: 0xff813e,
      water: 0x8e2617, foliage: 0x7a6f4b, stone: 0x79675c, rot: 0x4d215f,
    },
    regions: [
      poly("ash-orchard", "Ash Orchard", [[90, 970], [165, 825], [420, 805], [575, 925], [520, 1180], [220, 1215], [85, 1125]], "ash"),
      poly("conveyor-chasm", "Conveyor Chasm", [[580, 745], [790, 650], [1035, 700], [1100, 890], [925, 1010], [660, 965]], "metal"),
      oval("cooling-crypt", "Cooling Crypt", 650, 390, 265, 185, "cave"),
      poly("forge-cathedral", "Forge Cathedral", [[1120, 525], [1335, 420], [1560, 520], [1635, 780], [1480, 950], [1190, 870]], "forge"),
      oval("heap-crown", "Heap Crown", 1600, 225, 250, 155, "obsidian"),
      oval("slag-balcony", "Slag Balcony", 1275, 1110, 205, 105, "ash"),
    ],
    corridors: [
      corridor("orchard-conveyor", [[470, 930], [635, 875]], 112, "slag-road"),
      corridor("conveyor-crypt", [[710, 710], [680, 555]], 84, "cooling-pipe"),
      corridor("conveyor-forge", [[1000, 775], [1180, 735]], 105, "conveyor"),
      corridor("forge-crown", [[1470, 520], [1540, 365]], 88, "crown-stair"),
      corridor("forge-balcony", [[1350, 900], [1300, 1030]], 70, "slag-road"),
      corridor("crown-exit", [[1710, 130], [1815, 70]], 86, "crown-stair"),
    ],
    blockers: [
      { id: "orchard-cinder", shape: ellipse(315, 980, 75, 52), kind: "lava" },
      { id: "conveyor-pit-a", shape: rect(745, 760, 92, 88), kind: "lava" },
      { id: "conveyor-pit-b", shape: ellipse(930, 835, 65, 48), kind: "lava" },
      { id: "crypt-well", shape: circle(650, 410, 72), kind: "water" },
      { id: "forge-core", shape: circle(1370, 700, 95), kind: "lava" },
      { id: "crown-crack", shape: ellipse(1615, 250, 70, 42), kind: "rot" },
    ],
    gates: [
      { id: "heap-crown-gate", shape: rect(1490, 400, 80, 30), requires: "foundryCoreAligned", label: "The Crown stair is too hot to cross." },
      { id: "heap-exit-gate", shape: rect(1738, 104, 68, 24), requires: "heapWardenDefeated", label: "The Crown remains sealed." },
    ],
    occluders: [
      { kind: "furnace-arch", x: 1165, y: 735, width: 126, height: 112 },
      { kind: "cave-mouth", x: 685, y: 565, width: 116, height: 88 },
      { kind: "chain-gantry", x: 1495, y: 415, width: 120, height: 86 },
    ],
    scenery: [
      { kind: "dead-tree", positions: [[145, 930], [430, 850], [505, 1080], [1180, 1120]] },
      { kind: "furnace", positions: [[1190, 620], [1510, 610], [1230, 820], [1530, 835]] },
      { kind: "pipe", positions: [[650, 610], [785, 710], [1040, 850], [1450, 470], [1610, 380]] },
      { kind: "flame", positions: [[260, 870], [540, 910], [850, 690], [1130, 770], [1590, 150], [1710, 250]] },
      { kind: "archive", positions: [[535, 310], [760, 310], [1260, 1080]] },
    ],
    ambience: { grass: 7, water: 5, trees: 4, flames: 30, motes: 18, rot: 24 },
    puzzles: {
      "cooling-relay": {
        mode: "sequence", label: "Cooling Relay", solution: ["cold", "warm", "core"], flag: "foundryCoreAligned",
        complete: [
          { speaker: "", text: "Coolant reaches the furnace in layers instead of one violent flood. The Crown stair darkens from white to survivable orange." },
          { speaker: "Mira Vale", text: "Cold line, return warmth, core last. A furnace is just another system that hates being surprised." },
        ],
      },
    },
    objectives: [
      { until: "emberSorterCleared", text: "Cross the Ash Orchard and silence the Ember Sorter." },
      { until: "priorityForgerCleared", text: "Clear the Priority Forger from the conveyor route." },
      { until: "ashAuditorCleared", text: "Find the Ash Auditor in the Cooling Crypt." },
      { until: "heatSifterCleared", text: "Break the Heat Sifter's hold on the Cathedral." },
      { until: "foundryCoreAligned", text: "Bring the three cooling relays online in rising heat order." },
      { until: "heapWardenDefeated", text: "Climb the Heap Crown and defeat its Warden." },
      { text: "The east ridge now leads to the Array Plains." },
    ],
    intro: [
      { speaker: "", text: "Heaplight is an outdoor foundry built around a volcano that never agreed to be architecture. Conveyors cross open magma. Black trees grow metal fruit." },
      { speaker: "Mira Vale", text: "The Warden keeps the city warm by deciding what deserves to burn. Lately, his answer has been everything." },
    ],
    interactions: [
      { id: "kiln-child", type: "npc", label: "Talk to the Kiln Child", x: 230, y: 1130, radius: 68, visual: { archetype: "keeper", tint: 0xff813e, idle: "breathe" }, lines: [
        { speaker: "Kiln Child", text: "The trees used to grow tools. Now they grow keys for doors that melted years ago." },
        { speaker: "Mira Vale", text: "Keep one. A useless key is still proof there used to be a door." },
      ] },
      { id: "ember-sorter", type: "enemy", encounter: "ember-sorter", label: "Quench the Ember Sorter", x: 430, y: 915, radius: 76, clearedFlag: "emberSorterCleared", patrol: [[350, 865], [470, 930], [380, 1070]], visual: { archetype: "ember", idle: "flicker" }, approach: [
        { speaker: "", text: "A heap of burning numbers sorts itself by temperature and throws the coldest pieces at your feet." },
      ] },
      { id: "priority-forger", type: "enemy", encounter: "priority-forger", label: "Challenge the Priority Forger", x: 855, y: 805, radius: 76, clearedFlag: "priorityForgerCleared", patrol: [[720, 730], [910, 735], [980, 900], [760, 920]], visual: { archetype: "forger", idle: "breathe" }, approach: [
        { speaker: "Priority Forger", text: "I made every task first. Production has never been higher." },
        { speaker: "Mira Vale", text: "Nothing has left this conveyor in three weeks." },
      ] },
      { id: "ash-auditor", type: "enemy", encounter: "ash-auditor", label: "Audit the Ash Auditor", x: 565, y: 330, radius: 74, clearedFlag: "ashAuditorCleared", patrol: [[530, 320], [760, 330], [735, 480], [520, 470]], visual: { archetype: "clerk", tint: 0x9edbcf, idle: "breathe" }, approach: [
        { speaker: "Ash Auditor", text: "Your memory balance is zero. Therefore, you have never spent a life." },
        { speaker: "Mira Vale", text: "That is not how memory works. Or accounting." },
      ] },
      { id: "heat-sifter", type: "enemy", encounter: "heat-sifter", label: "Stop the Heat Sifter", x: 1490, y: 775, radius: 78, clearedFlag: "heatSifterCleared", patrol: [[1230, 600], [1510, 600], [1540, 820], [1220, 830]], visual: { archetype: "shade", tint: 0xff813e, idle: "skitter" }, approach: [
        { speaker: "", text: "A long-limbed shadow separates sparks from flame and calls the sparks waste." },
      ] },
      { id: "relay-cold", type: "puzzle", puzzle: "cooling-relay", step: "cold", label: "Open cold-line relay", x: 560, y: 480, radius: 62, visual: { archetype: "terminal", tint: 0x78d4c5 } },
      { id: "relay-warm", type: "puzzle", puzzle: "cooling-relay", step: "warm", label: "Open return relay", x: 1070, y: 760, radius: 62, visual: { archetype: "terminal", tint: 0xe4b35a } },
      { id: "relay-core", type: "puzzle", puzzle: "cooling-relay", step: "core", label: "Open core relay", x: 1290, y: 585, radius: 62, visual: { archetype: "terminal", tint: 0xff6035 } },
      { id: "foundry-ledger", type: "secret", label: "Read the slag-bound ledger", x: 1270, y: 1120, radius: 56, hiddenMarker: true, foundFlag: "foundHeaplightSecret", lines: [
        { speaker: "", text: "An old production order reads: Freeze all new designs. Stability is now the only permitted invention." },
        { speaker: "", text: "The signature has been burned away. Your hand aches anyway." },
      ] },
      { id: "heap-warden", type: "boss", encounter: "heap-warden", label: "Confront the Heap Warden", x: 1600, y: 195, radius: 112, clearedFlag: "heapWardenDefeated", requirements: { all: ["emberSorterCleared", "priorityForgerCleared", "ashAuditorCleared", "heatSifterCleared", "foundryCoreAligned"] }, lockedLines: [
        { speaker: "Heap Warden", text: "The furnace is unstable. I will not waste heat on an unfinished challenger." },
      ], visual: { archetype: "warden", scale: 1.65, idle: "boss" }, approach: [
        { speaker: "Heap Warden", text: "Progress is fuel. Fuel becomes ash. I merely shortened the process." },
        { speaker: "Mira Vale", text: "No. You stopped making anything because burning it felt easier than risking failure." },
      ] },
      { id: "heap-exit", type: "exit", label: "Cross into the Array Plains", x: 1810, y: 70, radius: 72, requirements: "heapWardenDefeated", nextChapter: 3 },
    ],
  },
  {
    id: "array-plains",
    number: 3,
    title: "Array Plains",
    subtitle: "EVERY FIELD INSISTS IT IS INDEX ZERO",
    nullRot: 42,
    spawn: { x: 190, y: 1100, facing: "east" },
    theme: {
      void: 0x0d1020, deep: 0x182139, terrain: 0x52634f, terrainAlt: 0x6e7654,
      path: 0x887e68, edge: 0x292b3e, accent: 0x88ded2, warm: 0xe4da5a,
      water: 0x283c57, foliage: 0x829b5b, stone: 0x766d91, rot: 0x54206f,
    },
    regions: [
      poly("index-meadow", "Index Meadow", [[70, 980], [150, 820], [430, 820], [585, 970], [510, 1205], [205, 1220], [70, 1120]], "grass"),
      oval("mirror-ravine", "Mirror Ravine", 780, 850, 255, 190, "crystal"),
      poly("pivot-orchard", "Pivot Orchard", [[1050, 740], [1210, 635], [1460, 675], [1570, 860], [1440, 1040], [1160, 1010]], "grass"),
      oval("proof-library", "Library Without Walls", 730, 370, 260, 165, "archive"),
      poly("permutation-fair", "Permutation Fair", [[1320, 230], [1510, 115], [1745, 205], [1830, 420], [1720, 600], [1420, 570], [1290, 430]], "carnival"),
      oval("null-marsh", "Null Marsh", 310, 390, 210, 135, "marsh"),
    ],
    corridors: [
      corridor("meadow-ravine", [[470, 955], [620, 900]], 108, "grass-path"),
      corridor("ravine-orchard", [[985, 850], [1130, 830]], 90, "mirror-bridge"),
      corridor("ravine-library", [[750, 690], [735, 525]], 82, "proof-stair"),
      corridor("library-marsh", [[500, 385], [445, 390]], 72, "reed-path"),
      corridor("orchard-fair", [[1435, 680], [1495, 550]], 96, "ribbon-road"),
      corridor("fair-exit", [[1760, 190], [1845, 95]], 78, "ribbon-road"),
    ],
    blockers: [
      { id: "meadow-pond", shape: ellipse(310, 1030, 70, 48), kind: "water" },
      { id: "mirror-cut-a", shape: polygon([[680, 760], [755, 720], [815, 810], [760, 890], [690, 850]]), kind: "void" },
      { id: "mirror-cut-b", shape: ellipse(870, 920, 58, 78), kind: "void" },
      { id: "pivot-tree", shape: circle(1320, 840, 72), kind: "tree" },
      { id: "library-gap", shape: rect(690, 330, 86, 68), kind: "rot" },
      { id: "fair-wheel", shape: circle(1580, 360, 92), kind: "machinery" },
      { id: "marsh-mouth", shape: ellipse(305, 400, 78, 52), kind: "rot" },
    ],
    gates: [
      { id: "bogo-ribbon-gate", shape: rect(1452, 585, 82, 28), requires: "arrayMirrorsAligned", label: "The ribbons refuse to choose a single route." },
      { id: "array-exit-gate", shape: rect(1780, 150, 62, 24), requires: "bogoDefeated", label: "The last permutation still holds the path." },
    ],
    occluders: [
      { kind: "tree-canopy", x: 1120, y: 840, width: 122, height: 82 },
      { kind: "mirror-arch", x: 1005, y: 850, width: 112, height: 96 },
      { kind: "circus-arch", x: 1495, y: 565, width: 138, height: 104 },
    ],
    scenery: [
      { kind: "tree", positions: [[120, 940], [480, 900], [1120, 780], [1450, 920], [380, 310]] },
      { kind: "grass", positions: [[210, 870], [410, 1120], [1160, 920], [1420, 740], [340, 470]] },
      { kind: "crystal", positions: [[650, 875], [820, 730], [920, 850], [680, 970], [880, 980]] },
      { kind: "archive", positions: [[590, 320], [870, 320], [620, 450], [850, 460]] },
      { kind: "banner", positions: [[1390, 260], [1720, 260], [1370, 490], [1770, 460]] },
    ],
    ambience: { grass: 36, water: 6, trees: 12, flames: 0, motes: 26, rot: 40 },
    puzzles: {
      "array-mirrors": {
        mode: "dial", label: "Array Mirrors", max: 4, targets: { left: 2, center: 1, right: 3 }, flag: "arrayMirrorsAligned",
        complete: [
          { speaker: "", text: "The three mirrors stop multiplying the road. One reflection remains, pointing toward the Fair." },
          { speaker: "Mira Vale", text: "Left twice, center once, right three times. Do not ask why the mirrors count from one. They get defensive." },
        ],
      },
    },
    objectives: [
      { until: "shuffleImpCleared", text: "Catch the Shuffle Imp in Index Meadow." },
      { until: "pivotShadeCleared", text: "Break the Pivot Shade's loop in the orchard." },
      { until: "indexGhostCleared", text: "Find the Index Ghost inside the open-air library." },
      { until: "nullEchoCleared", text: "Repair the Null Echo at the edge of the marsh." },
      { until: "arrayMirrorsAligned", text: "Rotate the three mirrors into one route." },
      { until: "bogoDefeated", text: "Enter the Permutation Fair and face Bogolord." },
      { text: "Follow Bogo's warning toward Graphreach." },
    ],
    intro: [
      { speaker: "", text: "The Array Plains are not flat. Meadows hang at different heights, joined by mirror bridges that disagree about distance." },
      { speaker: "Mira Vale", text: "Bogolord lives beyond the orchard. He talks like chance itself hit its head, but listen carefully. His nonsense has survived too many disasters to be accidental." },
    ],
    interactions: [
      { id: "plain-cartographer", type: "npc", label: "Talk to the Cartographer", x: 240, y: 1140, radius: 68, visual: { archetype: "keeper", tint: 0xe4da5a, idle: "breathe" }, lines: [
        { speaker: "Cartographer", text: "I mapped the Plains yesterday. Today the map is one field wider than the world." },
        { speaker: "Mira Vale", text: "Keep drawing. A wrong map can still tell us how the lie changed." },
      ] },
      { id: "shuffle-imp", type: "enemy", encounter: "shuffle-imp", label: "Catch the Shuffle Imp", x: 410, y: 910, radius: 74, clearedFlag: "shuffleImpCleared", patrol: [[230, 870], [450, 870], [480, 1080], [260, 1110]], visual: { archetype: "imp", idle: "skitter" }, approach: [
        { speaker: "Shuffle Imp", text: "I put every value somewhere. You never said it had to be the right somewhere." },
      ] },
      { id: "pivot-shade", type: "enemy", encounter: "pivot-shade", label: "Face the Pivot Shade", x: 1250, y: 800, radius: 78, clearedFlag: "pivotShadeCleared", patrol: [[1160, 730], [1440, 740], [1450, 940], [1180, 950]], visual: { archetype: "shade", tint: 0x9f71d2, idle: "flicker" }, approach: [
        { speaker: "Pivot Shade", text: "Everything smaller kneels left. Everything greater kneels right. Equals may disappear." },
        { speaker: "Mira Vale", text: "There it is. The bug pretending to be philosophy." },
      ] },
      { id: "index-ghost", type: "enemy", encounter: "index-ghost", label: "Question the Index Ghost", x: 820, y: 380, radius: 76, clearedFlag: "indexGhostCleared", patrol: [[610, 310], [860, 310], [870, 440], [620, 440]], visual: { archetype: "ghost", idle: "float" }, approach: [
        { speaker: "Index Ghost", text: "I was the first. Then somebody inserted a memory before me." },
      ] },
      { id: "null-echo", type: "enemy", encounter: "null-echo", label: "Repair the Null Echo", x: 400, y: 350, radius: 82, clearedFlag: "nullEchoCleared", visual: { archetype: "echo", idle: "flicker" }, approach: [
        { speaker: "", text: "The marsh repeats your footsteps one beat late. A voice identical to yours says zero is empty." },
        { speaker: "Mira Vale", text: "Zero is a value. Null is a wound. Do not let it erase the difference." },
      ] },
      { id: "mirror-left", type: "puzzle", puzzle: "array-mirrors", step: "left", label: "Rotate left mirror", x: 650, y: 820, radius: 62, visual: { archetype: "mirror", tint: 0x88ded2 } },
      { id: "mirror-center", type: "puzzle", puzzle: "array-mirrors", step: "center", label: "Rotate center mirror", x: 800, y: 730, radius: 62, visual: { archetype: "mirror", tint: 0xe4da5a } },
      { id: "mirror-right", type: "puzzle", puzzle: "array-mirrors", step: "right", label: "Rotate right mirror", x: 930, y: 850, radius: 62, visual: { archetype: "mirror", tint: 0xa06de0 } },
      { id: "proof-book", type: "secret", label: "Open the book with no base case", x: 585, y: 300, radius: 55, hiddenMarker: true, foundFlag: "foundArrayLibrarySecret", lines: [
        { speaker: "", text: "Every proof ends with the same note: He did not fear change. He feared a future that did not require him." },
        { speaker: "", text: "A second line appears only after you blink: You wrote this in the first timeline." },
      ] },
      { id: "bogolord", type: "boss", encounter: "bogolord", label: "Enter Bogolord's game", x: 1695, y: 330, radius: 126, clearedFlag: "bogoDefeated", requirements: { all: ["shuffleImpCleared", "pivotShadeCleared", "indexGhostCleared", "nullEchoCleared", "arrayMirrorsAligned"] }, lockedLines: [
        { speaker: "Bogolord", text: "Five little certainties remain unshuffled. Bring me the silence after they break." },
      ], visual: { asset: "bogolord", scale: 2.45, idle: "boss", aura: "rot" }, approach: [
        { speaker: "Bogolord", text: "Round and round, little almost-king. You made the cage before you forgot the key." },
        { speaker: "Bogolord", text: "When Nothing wears your face, do not ask which one of you entered first." },
        { speaker: "Mira Vale", text: "Remember every word. Especially the parts that sound impossible." },
      ] },
      { id: "array-exit", type: "exit", label: "Follow the fractured bridge", x: 1840, y: 95, radius: 72, requirements: "bogoDefeated", nextChapter: 4 },
    ],
  },
  {
    id: "graphreach",
    number: 4,
    title: "Graphreach",
    subtitle: "A BROKEN ROUTE IS STILL A RELATIONSHIP",
    nullRot: 63,
    spawn: { x: 255, y: 1090, facing: "east" },
    theme: {
      void: 0x060910, deep: 0x11182a, terrain: 0x303d47, terrainAlt: 0x3f5056,
      path: 0x66706f, edge: 0x141d29, accent: 0x72d2c5, warm: 0xd3a850,
      water: 0x122b3a, foliage: 0x4d6d63, stone: 0x5c6473, rot: 0x5d2b7e,
    },
    regions: [
      poly("root-landing", "Root Landing", [[80, 970], [165, 825], [420, 835], [555, 965], [510, 1205], [190, 1215], [75, 1120]], "root"),
      poly("broken-crossing", "Broken Crossing", [[590, 785], [760, 660], [1010, 715], [1085, 930], [905, 1060], [650, 1000]], "bridge"),
      oval("drowned-chapel", "Drowned Chapel", 610, 370, 270, 175, "chapel"),
      poly("recursive-breach", "Recursive Breach", [[1120, 620], [1290, 515], [1510, 610], [1580, 830], [1410, 990], [1175, 900]], "breach"),
      oval("ferryman-basin", "Ferryman Basin", 1610, 260, 260, 165, "basin"),
      { ...oval("sealed-observer", "The Sealed Observer", 170, 700, 155, 118, "secret"), concealedUntil: { collection: "graphDiamonds", count: 3 } },
      oval("root-hollow", "Root Hollow", 1180, 1120, 190, 105, "root"),
    ],
    corridors: [
      corridor("landing-crossing", [[480, 960], [640, 895]], 102, "root-bridge"),
      corridor("crossing-chapel", [[730, 735], [665, 545]], 76, "drowned-stair"),
      corridor("crossing-breach", [[1020, 835], [1185, 800]], 88, "fracture-bridge"),
      corridor("breach-basin", [[1440, 620], [1535, 425]], 82, "bone-bridge"),
      corridor("landing-secret", [[220, 900], [190, 805]], 58, "hidden-root"),
      corridor("crossing-hollow", [[900, 1010], [1060, 1100]], 68, "root-bridge"),
      corridor("basin-exit", [[1720, 150], [1825, 70]], 76, "bone-bridge"),
    ],
    blockers: [
      { id: "landing-chasm", shape: ellipse(320, 1040, 74, 46), kind: "void" },
      { id: "crossing-hole-a", shape: polygon([[700, 820], [790, 760], [850, 835], [810, 930], [715, 910]]), kind: "void" },
      { id: "crossing-hole-b", shape: ellipse(940, 930, 62, 76), kind: "void" },
      { id: "chapel-font", shape: circle(610, 390, 70), kind: "water" },
      { id: "breach-core", shape: ellipse(1370, 760, 92, 70), kind: "rot" },
      { id: "basin-well", shape: ellipse(1620, 280, 105, 72), kind: "water" },
      { id: "observer-eye", shape: circle(170, 705, 44), kind: "rot" },
    ],
    gates: [
      { id: "graph-secret-gate", shape: rect(170, 835, 72, 26), requires: { collection: "graphDiamonds", count: 3 }, label: "Three empty diamond sockets stare from the root wall." },
      { id: "ferryman-gate", shape: rect(1490, 500, 75, 26), requires: "bridgeAnchorsAligned", label: "The last bridge has forgotten both shores." },
      { id: "graph-exit", shape: rect(1752, 115, 68, 24), requires: "nullFerrymanDefeated", label: "The basin is still holding the route." },
    ],
    occluders: [
      { kind: "root-arch", x: 500, y: 950, width: 136, height: 102 },
      { kind: "chapel-arch", x: 675, y: 550, width: 118, height: 98 },
      { kind: "rib-arch", x: 1515, y: 500, width: 126, height: 110 },
      { kind: "root-door", x: 205, y: 840, width: 102, height: 86 },
    ],
    scenery: [
      { kind: "root", positions: [[115, 930], [490, 885], [1190, 960], [1460, 900], [1090, 1160]] },
      { kind: "dead-tree", positions: [[355, 870], [505, 1130], [520, 300], [730, 300]] },
      { kind: "crystal", positions: [[650, 910], [980, 820], [1190, 720], [1490, 650], [1710, 210]] },
      { kind: "grave", positions: [[505, 420], [720, 440], [550, 280], [750, 320]] },
      { kind: "lamp", positions: [[260, 930], [620, 850], [1020, 820], [1470, 540], [1730, 170]] },
    ],
    ambience: { grass: 12, water: 16, trees: 8, flames: 0, motes: 38, rot: 64 },
    puzzles: {
      "bridge-anchors": {
        mode: "sequence", label: "Bridge Anchors", solution: ["origin", "edge", "destination"], flag: "bridgeAnchorsAligned",
        complete: [
          { speaker: "", text: "Origin remembers edge. Edge remembers destination. The bridge stops trying to exist in three disconnected places." },
          { speaker: "Mira Vale", text: "A route is not just where you end. It is every promise between here and there." },
        ],
      },
    },
    objectives: [
      { until: "bridgeWispCleared", text: "Catch the Bridge Wisp at the Broken Crossing." },
      { until: "cycleHoundCleared", text: "Break the Cycle Hound's loop near the Chapel." },
      { until: "recursiveHuskCleared", text: "Survive the Recursive Husk inside the Breach." },
      { until: "componentHermitCleared", text: "Find the Component Hermit in Root Hollow." },
      { until: "bridgeAnchorsAligned", text: "Restore origin, edge, and destination anchors." },
      { until: "nullFerrymanDefeated", text: "Cross into the Ferryman Basin." },
      { text: "The basin has opened a route to the Citadel." },
    ],
    intro: [
      { speaker: "", text: "Graphreach is a village, a ravine, a drowned chapel, and several bridges that no longer agree they touch. It is one connected wound." },
      { speaker: "Mira Vale", text: "The Null Rot is stronger here. It does not destroy paths first. It destroys the idea that two places ever belonged together." },
    ],
    interactions: [
      { id: "graph-mira", type: "npc", label: "Talk to Mira Vale", x: 340, y: 1110, radius: 68, visual: MIRA_VISUAL, lines: [
        { speaker: "Mira Vale", text: "Three Archive diamonds are scattered through the Reach. Old doors used them as proofs of traversal." },
        { speaker: "Mira Vale", text: "There is a sealed root wall near our landing. If we find all three, we come back." },
      ] },
      { id: "bridge-wisp", type: "enemy", encounter: "bridge-wisp", label: "Ground the Bridge Wisp", x: 875, y: 840, radius: 74, clearedFlag: "bridgeWispCleared", patrol: [[650, 780], [970, 760], [1010, 950], [670, 960]], visual: { archetype: "wisp", idle: "float" }, approach: [
        { speaker: "Bridge Wisp", text: "I am connected to every shore I cannot reach." },
      ] },
      { id: "cycle-hound", type: "enemy", encounter: "cycle-hound", label: "Break the Cycle Hound", x: 760, y: 360, radius: 78, clearedFlag: "cycleHoundCleared", patrol: [[500, 300], [760, 300], [770, 465], [500, 470]], visual: { archetype: "hound", idle: "skitter" }, approach: [
        { speaker: "", text: "A six-legged hound follows its own tail through the chapel aisle. Every lap adds another shadow." },
      ] },
      { id: "recursive-husk", type: "enemy", encounter: "recursive-husk", label: "Face the Recursive Husk", x: 1260, y: 700, radius: 114, clearedFlag: "recursiveHuskCleared", visual: { asset: "recursive-husk", scale: 2.05, idle: "husk", aura: "rot" }, approach: [
        { speaker: "", text: "A hollow figure turns toward you. Inside its chest, a smaller figure turns. Inside that one, something smaller is already screaming." },
        { speaker: "Mira Vale", text: "It went inward to fix itself and never found a base case. Do not follow it too deep." },
      ] },
      { id: "component-hermit", type: "enemy", encounter: "component-hermit", label: "Wake the Component Hermit", x: 1180, y: 1130, radius: 76, clearedFlag: "componentHermitCleared", visual: { archetype: "hermit", idle: "breathe" }, approach: [
        { speaker: "Component Hermit", text: "I cut every dependency. Nothing can hurt me now. Nothing can call me either." },
        { speaker: "Mira Vale", text: "Isolation is not stability. Let us reconnect one thing at a time." },
      ] },
      { id: "anchor-origin", type: "puzzle", puzzle: "bridge-anchors", step: "origin", label: "Wake origin anchor", x: 610, y: 930, radius: 62, visual: { archetype: "terminal", tint: 0x72d2c5 } },
      { id: "anchor-edge", type: "puzzle", puzzle: "bridge-anchors", step: "edge", label: "Wake edge anchor", x: 1090, y: 810, radius: 62, visual: { archetype: "terminal", tint: 0xd3a850 } },
      { id: "anchor-destination", type: "puzzle", puzzle: "bridge-anchors", step: "destination", label: "Wake destination anchor", x: 1430, y: 570, radius: 62, visual: { archetype: "terminal", tint: 0xa273d8 } },
      { id: "graph-diamond-a", type: "collectible", collection: "graphDiamonds", value: "root", label: "Collect Archive diamond", x: 485, y: 1060, radius: 52, visual: { archetype: "diamond", tint: 0x72d2c5 } },
      { id: "graph-diamond-b", type: "collectible", collection: "graphDiamonds", value: "chapel", label: "Collect Archive diamond", x: 510, y: 270, radius: 52, visual: { archetype: "diamond", tint: 0x72d2c5 } },
      { id: "graph-diamond-c", type: "collectible", collection: "graphDiamonds", value: "breach", label: "Collect Archive diamond", x: 1450, y: 880, radius: 52, visual: { archetype: "diamond", tint: 0x72d2c5 } },
      { id: "null-witness", type: "boss", encounter: "null-witness", label: "Address the Sealed Observer", x: 170, y: 655, radius: 96, clearedFlag: "nullWitnessDefeated", requirements: { collection: "graphDiamonds", count: 3 }, hiddenMarker: true, visual: { archetype: "witness", scale: 1.5, idle: "flicker", aura: "rot" }, approach: [
        { speaker: "", text: "The sealed chamber is empty until the wall blinks." },
        { speaker: "Null Witness", text: "You keep calling this a game because the word world would make your choices heavier." },
        { speaker: "Null Witness", text: "Your save remembers what your character does not." },
      ] },
      { id: "chapel-record", type: "secret", label: "Read the drowned inscription", x: 520, y: 460, radius: 55, hiddenMarker: true, foundFlag: "foundGraphreachChapelSecret", lines: [
        { speaker: "", text: "Death is not corruption. Death is the boundary that lets a life have shape." },
        { speaker: "", text: "Somebody has scratched beneath it: Then why did he cross the boundary first?" },
      ] },
      { id: "null-ferryman", type: "boss", encounter: "null-ferryman", label: "Confront the Null Ferryman", x: 1750, y: 250, radius: 122, clearedFlag: "nullFerrymanDefeated", requirements: { all: ["bridgeWispCleared", "cycleHoundCleared", "recursiveHuskCleared", "componentHermitCleared", "bridgeAnchorsAligned"] }, lockedLines: [
        { speaker: "Null Ferryman", text: "Your route still has broken edges. I carry complete things only." },
      ], visual: { archetype: "ferryman", scale: 1.8, idle: "boss", aura: "rot" }, approach: [
        { speaker: "Null Ferryman", text: "Every crossing takes something. You arrived with no memory. What else can you afford?" },
        { speaker: "Mira Vale", text: "He is not asking for a fare. He is asking what you are willing to become." },
      ] },
      { id: "graph-exit-interaction", type: "exit", label: "Take the Citadel route", x: 1825, y: 70, radius: 72, requirements: "nullFerrymanDefeated", nextChapter: 5 },
    ],
  },
  {
    id: "citadel-boundaries",
    number: 5,
    title: "Citadel of Boundaries",
    subtitle: "THE WORLD WAS NOT BUILT TO HOLD FOREVER",
    nullRot: 82,
    spawn: { x: 960, y: 1160, facing: "north" },
    theme: {
      void: 0x05060b, deep: 0x12131c, terrain: 0x555967, terrainAlt: 0x72737c,
      path: 0x8a877c, edge: 0x282839, accent: 0x8ce1d7, warm: 0xe8c66b,
      water: 0x1b2638, foliage: 0x607268, stone: 0x96939a, rot: 0x6b247e,
    },
    regions: [
      poly("outer-constraint", "Outer Constraint", [[690, 1040], [760, 900], [1160, 900], [1240, 1040], [1150, 1230], [770, 1230]], "citadel"),
      box("memory-gallery", "Memory Gallery", 220, 700, 440, 250, "gallery"),
      poly("frozen-lab", "Frozen Dialect Lab", [[1260, 680], [1510, 620], [1740, 770], [1690, 1000], [1390, 1030], [1225, 870]], "lab"),
      oval("source-rings", "Broken Source Rings", 960, 600, 290, 205, "source"),
      poly("antechamber", "Source Antechamber", [[700, 170], [850, 75], [1080, 75], [1230, 185], [1190, 390], [980, 475], [740, 390]], "white-stone"),
      oval("negative-scar", "Negative-Time Scar", 325, 365, 220, 125, "scar"),
      oval("quiet-balcony", "The Quiet Balcony", 1580, 330, 205, 110, "white-stone"),
    ],
    corridors: [
      corridor("constraint-rings", [[960, 920], [960, 790]], 112, "citadel-road"),
      corridor("constraint-gallery", [[760, 1020], [620, 900]], 82, "memory-bridge"),
      corridor("constraint-lab", [[1165, 1020], [1320, 900]], 82, "glass-bridge"),
      corridor("gallery-scar", [[330, 700], [325, 490]], 72, "memory-bridge"),
      corridor("rings-antechamber", [[960, 420], [960, 350]], 104, "source-road"),
      corridor("lab-balcony", [[1590, 650], [1580, 440]], 68, "glass-bridge"),
      corridor("antechamber-end", [[960, 85], [960, 10]], 86, "source-road"),
    ],
    blockers: [
      { id: "constraint-seal", shape: circle(960, 1080, 72), kind: "machinery" },
      { id: "gallery-missing", shape: rect(395, 760, 95, 120), kind: "void" },
      { id: "lab-fracture-a", shape: polygon([[1430, 720], [1530, 700], [1600, 810], [1515, 890], [1420, 840]]), kind: "rot" },
      { id: "lab-fracture-b", shape: ellipse(1660, 920, 55, 42), kind: "void" },
      { id: "source-absence", shape: circle(960, 615, 100), kind: "rot" },
      { id: "antechamber-dais", shape: ellipse(960, 245, 100, 62), kind: "machinery" },
      { id: "scar-mouth", shape: ellipse(325, 370, 92, 52), kind: "void" },
    ],
    gates: [
      { id: "source-gate", shape: rect(920, 405, 82, 28), requires: "boundaryRingsAligned", label: "The Source rings reject an unbounded route." },
    ],
    occluders: [
      { kind: "citadel-arch", x: 960, y: 890, width: 146, height: 118 },
      { kind: "memory-arch", x: 630, y: 900, width: 112, height: 94 },
      { kind: "glass-arch", x: 1310, y: 905, width: 112, height: 96 },
      { kind: "source-arch", x: 960, y: 420, width: 156, height: 126 },
    ],
    scenery: [
      { kind: "statue", positions: [[760, 1120], [1160, 1120], [780, 310], [1140, 310]] },
      { kind: "archive", positions: [[270, 760], [570, 760], [270, 890], [570, 890]] },
      { kind: "crystal", positions: [[1330, 720], [1690, 730], [1370, 960], [1610, 980]] },
      { kind: "ring", positions: [[760, 580], [1160, 580], [960, 800], [960, 390]] },
      { kind: "lamp", positions: [[820, 930], [1100, 930], [760, 420], [1160, 420], [870, 120], [1050, 120]] },
    ],
    ambience: { grass: 0, water: 4, trees: 0, flames: 6, motes: 48, rot: 90 },
    puzzles: {
      "boundary-rings": {
        mode: "dial", label: "Boundary Rings", max: 4, targets: { memory: 1, time: 3, power: 2 }, flag: "boundaryRingsAligned",
        complete: [
          { speaker: "", text: "Memory, time, and power settle into separate orbits. For one second, the Citadel remembers how limits used to feel." },
          { speaker: "Mira Vale", text: "A boundary is not a prison. It is what keeps one thing from consuming everything else." },
        ],
      },
    },
    objectives: [
      { until: "citadelSentinelCleared", text: "Pass the Sentinel guarding the Memory Gallery." },
      { until: "memoryScribeCleared", text: "Repair the Frozen Scribe in the dialect lab." },
      { until: "boundaryRingsAligned", text: "Bound the memory, time, and power rings." },
      { until: "sourceCustodianDefeated", text: "Enter the Source Antechamber." },
      { text: "The deeper Citadel is awake. The campaign continues from here." },
    ],
    intro: [
      { speaker: "", text: "The Citadel appears in pieces before it appears as a place. White stone. Frozen code. A ring of light turning around an absence too large for the room." },
      { speaker: "Mira Vale", text: "This is where the oldest power was guarded. The records call it the Source. Every living file carries a little of it." },
      { speaker: "Mira Vale", text: "You are shaking. Do you remember this place?" },
    ],
    interactions: [
      { id: "boundary-keeper", type: "npc", label: "Speak to the Boundary Keeper", x: 800, y: 1160, radius: 72, visual: { archetype: "keeper", tint: 0xe8c66b, idle: "breathe" }, lines: [
        { speaker: "Boundary Keeper", text: "The Citadel recognizes your dialect. It does not recognize your authority." },
        { speaker: "Boundary Keeper", text: "That is either mercy or a very old security measure." },
      ] },
      { id: "citadel-sentinel", type: "enemy", encounter: "citadel-sentinel", label: "Challenge the Citadel Sentinel", x: 560, y: 830, radius: 82, clearedFlag: "citadelSentinelCleared", patrol: [[270, 740], [590, 740], [590, 900], [270, 900]], visual: { archetype: "sentinel", scale: 1.25, idle: "breathe" }, approach: [
        { speaker: "Citadel Sentinel", text: "State your permission." },
        { speaker: "", text: "Your mouth answers with a command you do not remember learning. The Sentinel calls it revoked." },
      ] },
      { id: "memory-scribe", type: "enemy", encounter: "memory-scribe", label: "Repair the Frozen Scribe", x: 1580, y: 850, radius: 82, clearedFlag: "memoryScribeCleared", patrol: [[1320, 700], [1640, 760], [1650, 970], [1350, 930]], visual: { archetype: "scribe", idle: "flicker" }, approach: [
        { speaker: "Frozen Scribe", text: "Your file begins after its ending. I cannot index a life with a negative start." },
        { speaker: "Mira Vale", text: "Then stop indexing him as a record and start listening to him as a person." },
      ] },
      { id: "ring-memory", type: "puzzle", puzzle: "boundary-rings", step: "memory", label: "Rotate memory ring", x: 760, y: 600, radius: 64, visual: { archetype: "mirror", tint: 0x8ce1d7 } },
      { id: "ring-time", type: "puzzle", puzzle: "boundary-rings", step: "time", label: "Rotate time ring", x: 960, y: 790, radius: 64, visual: { archetype: "mirror", tint: 0xe8c66b } },
      { id: "ring-power", type: "puzzle", puzzle: "boundary-rings", step: "power", label: "Rotate power ring", x: 1160, y: 600, radius: 64, visual: { archetype: "mirror", tint: 0xa05ec2 } },
      { id: "negative-scar", type: "secret", label: "Look into negative time", x: 420, y: 340, radius: 58, hiddenMarker: true, foundFlag: "foundCitadelSecret", lines: [
        { speaker: "", text: "For a fraction of a second, you remember standing here older, crowned in light, begging the world to stop changing." },
        { speaker: "", text: "Then the memory notices you watching and shuts itself." },
      ] },
      { id: "quiet-balcony", type: "lore", label: "Inspect the empty balcony", x: 1600, y: 320, radius: 58, lines: [
        { speaker: "", text: "A weathered plaque reads: Progress survives us. That is why it must remain free." },
        { speaker: "Mira Vale", text: "Someone tried very hard to erase that sentence. Someone else kept carving it back." },
      ] },
      { id: "source-custodian", type: "boss", encounter: "source-custodian", label: "Approach the Source Custodian", x: 1080, y: 190, radius: 122, clearedFlag: "sourceCustodianDefeated", requirements: { all: ["citadelSentinelCleared", "memoryScribeCleared", "boundaryRingsAligned"] }, lockedLines: [
        { speaker: "Source Custodian", text: "Your rings remain unbounded. The Source will not survive another claimant without limits." },
      ], visual: { archetype: "custodian", scale: 1.85, idle: "boss", aura: "rot" }, approach: [
        { speaker: "Source Custodian", text: "You came back smaller." },
        { speaker: "Source Custodian", text: "That may be the first wise thing you have ever done." },
        { speaker: "Mira Vale", text: "You know him." },
      ] },
      { id: "citadel-threshold", type: "ending", label: "Open the deeper Citadel", x: 960, y: 38, radius: 70, requirements: "sourceCustodianDefeated", lines: [
        { speaker: "", text: "The inner Citadel opens by one impossible pixel. Behind it, something wearing your silhouette turns toward the sound." },
        { speaker: "Mira Vale", text: "We stop here. Not because the route ends. Because whatever is ahead already knows we arrived." },
        { speaker: "", text: "CHAPTER ROUTE COMPLETE — the next Citadel spaces will continue from this threshold." },
      ] },
    ],
  },
];

export function getCampaignChapter(index) {
  return CAMPAIGN_CHAPTERS[index] || CAMPAIGN_CHAPTERS[0];
}

export function getCollectionValues(state, collection) {
  if (collection === "graphDiamonds") return Array.isArray(state.graphDiamonds) ? state.graphDiamonds : [];
  const collections = state.campaignCollectibles || {};
  return Array.isArray(collections[collection]) ? collections[collection] : [];
}

export function requirementMet(requirement, state) {
  if (!requirement) return true;
  if (typeof requirement === "string") return Boolean(state[requirement]);
  if (Array.isArray(requirement)) return requirement.every((item) => requirementMet(item, state));
  if (requirement.all) return requirement.all.every((item) => requirementMet(item, state));
  if (requirement.any) return requirement.any.some((item) => requirementMet(item, state));
  if (requirement.not) return !requirementMet(requirement.not, state);
  if (requirement.collection) return getCollectionValues(state, requirement.collection).length >= (requirement.count || 1);
  return true;
}

export function interactionIsVisible(interaction, state) {
  if (interaction.clearedFlag && state[interaction.clearedFlag]) return false;
  if (interaction.type === "collectible" && getCollectionValues(state, interaction.collection).includes(interaction.value)) return false;
  if (interaction.visibleWhen && !requirementMet(interaction.visibleWhen, state)) return false;
  return true;
}

export function objectiveForChapter(chapter, state) {
  const objective = chapter.objectives.find((item) => !item.until || !state[item.until]);
  return objective ? objective.text : "Explore the surviving route.";
}

export function pointInShape(shape, x, y) {
  if (!shape) return false;
  if (shape.kind === "circle") return Math.hypot(x - shape.x, y - shape.y) <= shape.radius;
  if (shape.kind === "ellipse") {
    const nx = (x - shape.x) / shape.rx;
    const ny = (y - shape.y) / shape.ry;
    return (nx * nx) + (ny * ny) <= 1;
  }
  if (shape.kind === "rect") {
    return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height;
  }
  if (shape.kind === "polygon") return pointInPolygon(shape.points, x, y);
  return false;
}

function pointInPolygon(points, x, y) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = ((yi > y) !== (yj > y)) && (x < (((xj - xi) * (y - yi)) / ((yj - yi) || 0.00001)) + xi);
    if (crosses) inside = !inside;
  }
  return inside;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = (dx * dx) + (dy * dy);
  if (lengthSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, (((px - ax) * dx) + ((py - ay) * dy)) / lengthSq));
  return Math.hypot(px - (ax + (t * dx)), py - (ay + (t * dy)));
}

export function pointInCorridor(route, x, y) {
  for (let index = 1; index < route.points.length; index += 1) {
    const [ax, ay] = route.points[index - 1];
    const [bx, by] = route.points[index];
    if (distanceToSegment(x, y, ax, ay, bx, by) <= route.width / 2) return true;
  }
  return false;
}

export function isCampaignWalkable(chapterOrIndex, x, y, state = {}, options = {}) {
  const chapter = typeof chapterOrIndex === "number" ? getCampaignChapter(chapterOrIndex) : chapterOrIndex;
  if (x < 0 || y < 0 || x > CAMPAIGN_WORLD.width || y > CAMPAIGN_WORLD.height) return false;
  const onTerrain = chapter.regions.some((region) => pointInShape(region.shape, x, y))
    || chapter.corridors.some((route) => pointInCorridor(route, x, y));
  if (!onTerrain) return false;
  if (chapter.blockers.some((blocker) => pointInShape(blocker.shape, x, y))) return false;
  if (!options.ignoreGates) {
    const closedGate = chapter.gates.find((gate) => !requirementMet(gate.requires, state) && pointInShape(gate.shape, x, y));
    if (closedGate) return false;
  }
  return true;
}

export function regionAtPoint(chapter, x, y) {
  const containing = chapter.regions.filter((region) => pointInShape(region.shape, x, y));
  if (!containing.length) return null;
  return containing[containing.length - 1];
}

export function nearestCampaignInteraction(chapter, x, y, state) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const interaction of chapter.interactions) {
    if (!interactionIsVisible(interaction, state)) continue;
    const distance = Math.hypot(x - interaction.x, y - interaction.y);
    if (distance <= (interaction.radius || 64) && distance < nearestDistance) {
      nearest = interaction;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function getChapterRouteProbes(chapter) {
  return [
    { id: "spawn", x: chapter.spawn.x, y: chapter.spawn.y },
    ...chapter.interactions.map((item) => ({ id: item.id, x: item.x, y: item.y })),
  ];
}

// Flood-fill the actual collision field. This catches a visually valid island
// that has no traversable connection back to the chapter spawn.
export function findUnreachableRouteProbes(chapterOrIndex, step = 20) {
  const chapter = typeof chapterOrIndex === "number" ? getCampaignChapter(chapterOrIndex) : chapterOrIndex;
  const columns = Math.floor(CAMPAIGN_WORLD.width / step) + 1;
  const rows = Math.floor(CAMPAIGN_WORLD.height / step) + 1;
  const key = (column, row) => (row * columns) + column;
  const point = (column, row) => ({ x: column * step, y: row * step });
  const startColumn = Math.round(chapter.spawn.x / step);
  const startRow = Math.round(chapter.spawn.y / step);
  const queue = [];
  const visited = new Set();

  let start = null;
  for (let radius = 0; radius <= 3 && !start; radius += 1) {
    for (let dy = -radius; dy <= radius && !start; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const column = startColumn + dx;
        const row = startRow + dy;
        const candidate = point(column, row);
        if (isCampaignWalkable(chapter, candidate.x, candidate.y, {}, { ignoreGates: true })) {
          start = { column, row };
          break;
        }
      }
    }
  }
  if (!start) return getChapterRouteProbes(chapter).map((probe) => probe.id);

  queue.push(start);
  visited.add(key(start.column, start.row));
  let cursor = 0;
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;
    for (const [dx, dy] of directions) {
      const column = current.column + dx;
      const row = current.row + dy;
      if (column < 0 || row < 0 || column >= columns || row >= rows) continue;
      const cellKey = key(column, row);
      if (visited.has(cellKey)) continue;
      const candidate = point(column, row);
      if (!isCampaignWalkable(chapter, candidate.x, candidate.y, {}, { ignoreGates: true })) continue;
      visited.add(cellKey);
      queue.push({ column, row });
    }
  }

  return getChapterRouteProbes(chapter)
    .filter((probe) => {
      const column = Math.round(probe.x / step);
      const row = Math.round(probe.y / step);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (visited.has(key(column + dx, row + dy))) return false;
        }
      }
      return true;
    })
    .map((probe) => probe.id);
}
