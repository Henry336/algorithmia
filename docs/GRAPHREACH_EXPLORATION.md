# Graphreach Exploration

Graphreach was the first experiment that moved Algorithmia from rectangular DOM tile rooms into continuous Phaser exploration. Its standalone implementation is now historical.

The production Chapter 4 is the **Graphreach** entry in `web/js/campaignAtlasData.js`. It shares the campaign atlas renderer, collision rules, encounter bridge, save handling, and browser verification used by every other chapter.

## What Moved Into The Atlas

- Irregular root islands, bridges, marshes, caves, ruins, and the recursive breach now use shared region/corridor/blocker geometry.
- Patchrunner uses four-point foot collision instead of one point at the bottom of the sprite.
- Arches, cave mouths, and canopies use foreground occluders so Patchrunner passes underneath them instead of floating over them.
- Three Archive diamonds persist in save data and reveal the concealed Null Witness route near the chapter entrance.
- Recursive Husk, The Inner Copy, patrol enemies, optional lore, disturbing hidden dialogue, and the Null Ferryman all use normal atlas interactions.
- Grass, water, roots, motes, and Null corruption animate through the shared art renderer.

The old `graphreachExploration.js`, `graphreachSpaceData.js`, map PNG, and smoke remain as useful migration history. They are no longer launched by `main.js` or included in the complete production browser verification command.

For current editing and debugging instructions, use [Campaign Atlas](CAMPAIGN_ATLAS.md).
