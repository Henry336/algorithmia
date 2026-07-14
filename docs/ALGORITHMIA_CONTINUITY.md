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
- "Chapters" are now continuous, multi-region spaces with enemies, optional branches, spatial puzzles, lore, secrets, and a final boss. Do not collapse them back into one square room and one fight.
- "Rooms" are connected places in a world graph, not stacked floors. They can branch in any direction, allow backtracking, and may be outdoor fields, caves, archives, vents, courts, wetlands, suspended platforms, volcanoes, or other story-specific spaces.
- Chapters 0-5 use the shared campaign atlas and should all feel like authored places, even when the first two teach simpler rules.
- Campaign worlds should use the full browser viewport with camera-led movement; avoid fixed 1x boards that leave large empty space on desktop.
- Battles should evaluate correctness and observed work cost, then affect HP/Focus through readable combat feedback.
- Starting with Bogolord, major bosses should have their own HP, multiple phases, timed attacks, and battle-specific pressure mechanics. Later bosses should not feel like one generic code check.
- Admin testing mode is enabled with `?admin=1` and can be disabled with `?admin=0`. It unlocks level select and shows Admin Win buttons that complete active encounters through the same win callbacks as normal play.
- Required routes are protected by browser flood-fill tests. If a gate opens, the path through it must be reachable; if a puzzle requires objects, every required object and patrol point must sit on valid terrain.

## Asset Direction

- Real PixelLab exports live under `web/assets/characters/<character>/`.
- Patchrunner, Mira, and Sorting Slime use exported directional PNGs with CSS crop/scale wrappers because the source PNGs have transparent padding.
- The campaign atlas may build minor enemies and scenery from reusable procedural pixel pieces, but named characters and bosses should use approved high-detail art whenever it exists. Procedural art is a readable production scaffold, not an excuse for low-detail hero assets.
- Recursive Husk currently uses an AI-generated concept plus a 92x92 project-local crop under `web/assets/characters/recursive-husk/`. Treat it as a high-quality temporary concept sprite, not a finished directional PixelLab sheet.
- Every visible field character needs an idle motion. Patrol, flicker, breathing, squash, aura, or hover animation should fit the character rather than being added as generic movement.

## Null Rot

- Null Rot is the creeping corruption that makes values, labels, and boundaries stop behaving like reliable data.
- It becomes visibly stronger across the atlas: a faint Queueworks trace, growing Dispatch and Heaplight contamination, obvious Array Plains damage, major Graphreach wounds, and near-structural failure inside the Citadel.
- Visual language: black/violet seams, missing-value gaps, pulsing dark tiles, outlines that look like enemies but feel hollow.
- Gameplay language: distinguish `0` as a value from `null` as absence/corruption. Do not let the player conflate them.

## Lord Bogo

- Bogo should feel crazy, mysterious, and oddly theatrical.
- His lines may sound like nonsense, but they should foreshadow real lore: unbounded loops, final-boss scale, Null Rot learning to erase rules rather than just data.
- Bogo should not be merely evil. He is a warped warning signal: comic on the surface, ominous in hindsight.
- Bogolord battle presentation uses the real PixelLab sprite with Null Rot glow, flickering pixels, boss HP, timed attacks, editor tilt, and hidden editor corruption. Power-up slots are visible placeholders for future ally abilities.

## Current Implemented Route Notes

- Chapter 0, Queueworks Verge: marshy intake islands connect to the reservoir, drowned archive, empty weir, three pressure relays, Rune Snarl, and the real-time Sorting Slime boss.
- Chapter 1, Dispatch Meridian: suspended rail platforms connect the abandoned archive, Platform Thirteen, three policy junctions, moving queue enemies, and the Dispatcher Spire.
- Chapter 2, Heaplight Caldera: volcanic exterior paths pass through the cooling crypt and forge, with four distinct enemies, a three-control furnace puzzle, optional cold records, and the two-repair Heap Warden.
- Chapter 3, Array Plains: floating meadows, orchard paths, mirror ravine, index library, Null marsh, and Permutation Fair hold four different minions, a mirror puzzle, optional warnings, and the supplied Bogolord encounter.
- Chapter 4, Graphreach: root islands, a broken crossing, drowned chapel, recursive breach, hollow basin, and Ferryman route hold patrol enemies, Recursive Husk, a bridge puzzle, and the Null Ferryman. Three Archive diamonds reveal a concealed Observer chamber near the starting landing when the player backtracks.
- Chapter 5, Citadel of Boundaries: the outer constraint, memory gallery, frozen lab, Source rings, negative-time scar, and inner threshold reveal Patchrunner's authority and memory in controlled fragments without spending the full Unbounded reveal too early.
- Minor encounters deliberately vary across queue policy, sorting, extrema, index tracking, totals, reversal, palindrome checks, zero compaction, prefix sums, and pair finding. Multi-stage bosses combine several rules.
- Optional branches may hold lore, enemies, hidden secrets, creepy fourth-wall dialogue, or quiet decoration. They exist to make chapters feel like places rather than combat queues.
- Sorting Slime, Dispatcher, Bogolord, Recursive Husk, Patchrunner, and Mira use their real supplied or approved assets in the atlas. Their field presentation should remain consistent with their battle scale and character identity.
