# Campaign Atlas

The campaign atlas is the shared exploration system for Chapters 0-5. A chapter is a connected **space**, not necessarily an indoor room. It can be wetlands, suspended platforms, a volcano, fields, caves, ruins, or a Citadel.

## Files

- `web/js/campaignAtlasData.js` contains chapter layouts, collision geometry, gates, puzzles, patrols, dialogue, and progression requirements.
- `web/js/campaignAtlasArt.js` draws the pixel terrain, scenery, field characters, Null Rot, and ambient animation.
- `web/js/campaignAtlas.js` owns Phaser, movement, camera behavior, interactions, save updates, and the browser debug hook.
- `web/js/campaignAtlasEncounters.js` sends enemies and bosses to the appropriate battle and applies rewards after a real win.
- `tests/campaign_atlas_browser_smoke.cjs` verifies every chapter in a real browser.

The old `room.js`, `chapter*.js`, `graphreachExploration.js`, and LDtk test remain as historical references. Normal campaign routing no longer launches them.

## World Geometry

Each chapter has a 1920x1280 world made from a few explicit geometry types:

- `regions` are large polygons, ellipses, or rectangles. They define named places such as an orchard, station, cave, or boss platform.
- `corridors` are thick lines joining regions. They define bridges, paths, stairs, rails, and tunnels.
- `blockers` cut holes out of walkable ground. They are water, lava, machinery, chasms, or Null wounds.
- `gates` temporarily cut out a narrow piece of a route until a save-state requirement is satisfied.
- `occluders` draw posts behind Patchrunner and a roof in front of him. This is how a gate, arch, cave mouth, or tree canopy correctly hides the character while he walks underneath it.

Movement checks four small points around Patchrunner's feet. It does not use the transparent rectangle around the whole PNG. This keeps corners accurate without making his hair or tool bag collide with walls.

Keep connected shapes overlapping by at least 30 pixels. The narrowest current corridor is 58 pixels, which leaves room for Patchrunner's footprint.

## Chapter Data

The main chapter fields are:

```js
{
  id: "queueworks-verge",
  number: 0,
  title: "Queueworks Verge",
  nullRot: 5,
  spawn: { x: 245, y: 1090, facing: "east" },
  theme: { /* chapter palette */ },
  regions: [],
  corridors: [],
  blockers: [],
  gates: [],
  occluders: [],
  scenery: [],
  ambience: {},
  puzzles: {},
  objectives: [],
  intro: [],
  interactions: [],
}
```

The art renderer uses the geometry itself as the visual source of truth. A changed shoreline and its collision boundary cannot silently drift apart because they come from the same shape.

## Interactions

Supported interaction types are:

- `npc`: dialogue and an idle field character.
- `lore`: optional world details.
- `secret`: unmarked dialogue or lore, optionally recording a save flag.
- `puzzle`: one control in a sequence or dial puzzle.
- `collectible`: a persistent item such as a Graphreach Archive diamond.
- `enemy`: a moving or stationary encounter that disappears after its clear flag is saved.
- `boss`: a larger encounter with requirements and a progression reward.
- `exit`: moves to the next chapter after its requirement is met.
- `ending`: concludes the currently authored route without inventing another chapter.

An encounter position and every patrol waypoint must be on walkable terrain. The atlas smoke checks both.

## Puzzles

Two reusable spatial puzzle modes exist:

- `sequence`: controls must be activated in a specific order. A wrong input resets the route.
- `dial`: each control cycles through positions until every control matches its target.

Progress lives in `campaignPuzzleProgress` in `state.js`. Completion also writes a normal named flag such as `arrayMirrorsAligned`, so gates and objectives stay easy to read.

## Art And Animation

Major supplied characters use their exact PNG art:

- Patchrunner
- Mira Vale
- Sorting Slime
- Dispatcher
- Bogolord
- Recursive Husk

Minor field enemies use procedural pixel silhouettes defined by archetype. Every character receives an idle motion. Patrol enemies move between authored waypoints. Bosses can add a Null aura and flickering motes.

Scenery is assembled from reusable pixel objects such as trees, roots, lamps, furnaces, rails, archives, crystals, statues, and Source rings. Water, grass, fire, trees, route motes, and Null pixels animate when they make sense for the chapter.

Keep source PNGs crisp. Phaser is configured with `pixelArt`, disabled antialiasing, and rounded pixels.

## Adding Or Changing A Space

1. Edit one chapter in `campaignAtlasData.js`.
2. Change the geometry first: regions, corridors, blockers, and gates.
3. Place scenery and occluders after the route is stable.
4. Add interactions only on confirmed walkable points.
5. Add patrol points only inside the same connected area.
6. Run `npm run smoke:atlas`.
7. Open `/?admin=1&chapter=N` and walk the route at desktop and mobile sizes.

Do not disable a reachability failure to make a test pass. Move the point or repair the connection.

## Debug Hook

Admin chapter routes expose `window.__campaignAtlasDebug`. It can:

- report the current player, region, objective, entities, and animation counts
- test collision at any point
- teleport to a valid point
- invoke a named interaction
- list route probes and unreachable probes
- audit blockers and progression gates
- report whether a concealed secret region is still covered

This hook is for browser tests and local investigation. It is not player-facing UI.

## Verification

```bash
npm run smoke:atlas
```

The smoke opens all six chapters at 1440x900, captures each Phaser canvas, checks that it is nonblank and full-screen, verifies every authored destination through a collision flood-fill, audits blockers and gates, completes a relay puzzle, reveals the Graphreach diamond room, and checks the mobile layout at 390x844.

Run the complete browser suite before pushing:

```bash
npm run verify:web
```
