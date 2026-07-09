# Algorithimia Continuity Tracker

This file records live direction that should survive context refreshes. Keep it short, implementation-facing, and update it when gameplay or canon decisions change.

## Current Gameplay Direction

- Python-first remains the default player-code language.
- "Chapters" should mean multi-room routes with multiple enemies before a boss, not one square room and one fight.
- Levels 0-1 are still prototype/tutorial-scale. Chapter 2 and beyond should increasingly feel like fuller chapter routes.
- Battles should evaluate correctness and observed work cost, then affect HP/Focus through readable combat feedback.

## Asset Direction

- Real PixelLab exports live under `web/assets/characters/<character>/`.
- Patchrunner, Mira, and Sorting Slime use exported directional PNGs with CSS crop/scale wrappers because the source PNGs have transparent padding.
- Placeholder matrix art is acceptable for enemies and environmental objects until replacement assets arrive, but new real character assets should replace placeholders promptly.

## Null Rot

- Null Rot is the creeping corruption that makes values, labels, and boundaries stop behaving like reliable data.
- It should become more visible as the player progresses: faint trace in Heaplight Foundry, obvious hazard in Array Plains, major threat in later regions.
- Visual language: black/violet seams, missing-value gaps, pulsing dark tiles, outlines that look like enemies but feel hollow.
- Gameplay language: distinguish `0` as a value from `null` as absence/corruption. Do not let the player conflate them.

## Lord Bogo

- Bogo should feel crazy, mysterious, and oddly theatrical.
- His lines may sound like nonsense, but they should foreshadow real lore: unbounded loops, final-boss scale, Null Rot learning to erase rules rather than just data.
- Bogo should not be merely evil. He is a warped warning signal: comic on the surface, ominous in hindsight.

## Current Implemented Route Notes

- Chapter 2: Heaplight Foundry is a four-room route: intake floor, optional ash archive, furnace core, and Heap Warden boss chamber. Ember Sorter and Priority Forger gate the core; Heat Sifter plus three valves gate the boss; Ash Auditor is optional archive combat/lore.
- Chapter 3: Array Plains is a four-room route: approach field, optional index library, Bogo's court, and Lord Bogo boss chamber. Shuffle Imp and Pivot Shade gate the court; Null Echo plus three array mirrors gate the boss; Index Ghost is optional library combat/lore.
- Optional rooms may hold lore, optional enemies, hidden secrets, or quiet deco space. They should make chapters feel like places, not just combat queues.
- Sorting Slime has a real exported asset and should idle on the map while acting more aggressive in battle.
