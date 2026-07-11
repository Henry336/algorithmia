# Algorithmia Continuity Tracker

This file records live direction that should survive context refreshes. Keep it short, implementation-facing, and update it when gameplay or canon decisions change.

## Current Gameplay Direction

- Python-first remains the default player-code language.
- Arcade mode is the encounter laboratory: bosses can be selected directly while their campaign routes remain connected to the same encounter implementations.
- Sorting Slime is the first Phaser encounter. Its movement arena, hazards, command phase, and repair editor establish the runtime pattern for future real-time bosses.
- Sorting Slime's current boss contract is phase-local: each phase starts with a 100 HP Null shield, Repair removes that shield and makes the phase pattern deterministic, and crossing a core-health threshold recompiles a new shield with a new Python problem.
- As the first boss, Sorting Slime teaches repairs through code completion: prewritten loops, a concrete input/output example, one small missing expression or swap, and optional progressive hints. Later bosses may demand more independent code.
- Guard is a visible five-second defensive state that halves damage. Attack does fixed core damage only after a shield breach and physically returns Patchrunner to the hazard route.
- Boss hazards continue until the player reaches the boss; there are no passive timed access windows. Repairs should visibly alter battlefield behavior, not only testcase text or damage numbers.
- "Chapters" should mean multi-room routes with multiple enemies before a boss, not one square room and one fight.
- "Rooms" are connected spaces in a route graph, not stacked floors. They can branch left/right/up/down, allow backtracking, and may be outdoor fields, caves, archives, vents, courts, or other story-specific spaces.
- Levels 0-1 are still prototype/tutorial-scale. Chapter 2 and beyond should increasingly feel like fuller chapter routes.
- Room boards should use most of the available browser viewport; avoid fixed 1x rendering that leaves large empty space on desktop.
- Battles should evaluate correctness and observed work cost, then affect HP/Focus through readable combat feedback.
- Starting with Bogolord, major bosses should have their own HP, multiple phases, timed attacks, and battle-specific pressure mechanics. Later bosses should not feel like one generic code check.
- Admin testing mode is enabled with `?admin=1` and can be disabled with `?admin=0`. It unlocks level select and shows Admin Win buttons that complete active encounters through the same win callbacks as normal play.
- Required room routes should be protected by reachability tests. If a gate opens, the tile path to it must be reachable; if a puzzle requires objects, every required object must be interactable from the room start.

## Asset Direction

- Real PixelLab exports live under `web/assets/characters/<character>/`.
- Patchrunner, Mira, and Sorting Slime use exported directional PNGs with CSS crop/scale wrappers because the source PNGs have transparent padding.
- Placeholder matrix art is acceptable for enemies and environmental objects until replacement assets arrive, but new real character assets should replace placeholders promptly.
- Recursive Husk currently uses an AI-generated concept plus a 92x92 project-local crop under `web/assets/characters/recursive-husk/`. Treat it as a high-quality temporary concept sprite, not a finished directional PixelLab sheet.

## Null Rot

- Null Rot is the creeping corruption that makes values, labels, and boundaries stop behaving like reliable data.
- It should become more visible as the player progresses: faint trace in Heaplight Foundry, obvious hazard in Array Plains, major threat in later regions.
- Visual language: black/violet seams, missing-value gaps, pulsing dark tiles, outlines that look like enemies but feel hollow.
- Gameplay language: distinguish `0` as a value from `null` as absence/corruption. Do not let the player conflate them.

## Lord Bogo

- Bogo should feel crazy, mysterious, and oddly theatrical.
- His lines may sound like nonsense, but they should foreshadow real lore: unbounded loops, final-boss scale, Null Rot learning to erase rules rather than just data.
- Bogo should not be merely evil. He is a warped warning signal: comic on the surface, ominous in hindsight.
- Bogolord battle presentation uses the real PixelLab sprite with Null Rot glow, flickering pixels, boss HP, timed attacks, editor tilt, and hidden editor corruption. Power-up slots are visible placeholders for future ally abilities.

## Current Implemented Route Notes

- Chapter 2: Heaplight Foundry is a connected route graph: intake floor branches east to the ash archive, west to a hidden cold vent, north to the furnace core, and east from the core into the Heap Warden crucible. Ember Sorter and Priority Forger gate the core; Heat Sifter plus three reachable valves gate the boss; Ash Auditor is optional archive combat/lore.
- Chapter 3: Array Plains is a connected route graph: corrupted rowgrass approach branches east to the index library, west to a hidden null-marsh, north to Bogo's court, and east from the court into Lord Bogo's amphitheatre. Shuffle Imp and Pivot Shade gate the court; Null Echo plus three array mirrors gate the boss; Index Ghost is optional library combat/lore.
- Chapter 3 minions should not all be identical sorting prompts. Null Echo currently uses a script-fixing variant: the starter Python is corrupted by a `None`/zero confusion and the player repairs it.
- Chapter 4: Graphreach is a connected bridge/cave route graph: bridgehead branches east to the component chapel, west to a diamond-locked hidden cave, north to the anchor crossing, and east from the crossing into the Null Ferryman dock. Bridge Wisp and Cycle Hound gate the crossing; Recursive Husk mini-boss blocks the anchor crossing with a harder Python max-profit challenge; three bridge anchors gate the main boss; Component Hermit is optional chapel combat/lore.
- Chapter 4 hidden route: collect three witness diamonds across Graphreach, then backtrack to the bridgehead west wall to reveal the secret room. The secret room contains The Inner Copy secret boss, a Python reachability/jump-game challenge with fourth-wall-leaning dialogue.
- Mini-bosses should use harder interview-style problems beyond sorting/order clicking. Current examples: Recursive Husk uses best-time-to-buy-sell-stock style max profit; The Inner Copy uses jump-game reachability.
- Optional rooms may hold lore, optional enemies, hidden secrets, creepy darkness dialogue, or quiet deco space. They should make chapters feel like places, not just combat queues.
- Sorting Slime has a real exported asset and should idle on the map while acting more aggressive in battle.
