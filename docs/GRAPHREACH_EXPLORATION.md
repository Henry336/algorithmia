# Graphreach Exploration

Graphreach is the first campaign space that uses Phaser for exploration instead of rendering a rectangular DOM tile grid.

## Files

- `web/assets/maps/graphreach/graphreach-space.png` is the rendered environment.
- `web/js/graphreachExploration.js` owns Phaser, movement, camera behavior, interaction input, and ambient effects.
- `web/js/graphreachSpaceData.js` owns walkable geometry, landmarks, dialogue, spawn position, and effect positions.
- `tests/graphreach_browser_smoke.cjs` checks movement, required-route connectivity, interactions, ambience, and desktop/mobile rendering.

The old `web/js/chapter4.js` prototype remains in the repository as a reference for its earlier encounters and story state. `web/js/main.js` now launches the Phaser scene for Chapter 4.

## Editing Walkable Space

Movement tests the point at Patchrunner's feet. There are two kinds of walkable geometry:

- **Corridors** are center lines with a radius. Use them for paths, bridges, stairs, and narrow cave passages.
- **Areas** are polygons or circles. Use them for courtyards, overlooks, interiors, and boss platforms.

Edit `GRAPHREACH_CORRIDORS` and `GRAPHREACH_AREAS` in `graphreachSpaceData.js`. Keep adjacent shapes overlapping so the player can move between them.

Open this route while developing:

```text
http://localhost:4173/?admin=1&chapter=4&graphdebug=1
```

The translucent overlay shows every walkable corridor and area. The browser smoke also flood-fills the authored geometry and fails when a required destination becomes disconnected.

## Editing Interactions

Each entry in `GRAPHREACH_INTERACTIONS` contains:

- an `id` used by tests
- a short nearby prompt
- a world position and activation radius
- dialogue lines
- an optional `kind: "exit"` that continues to Chapter 5

Place the interaction point on walkable ground. Add its location to `GRAPHREACH_ROUTE_PROBES` when it is required for progression.

## Ambient Motion

`GRAPHREACH_AMBIENCE` lists grass tufts, route lights, and Null motes. Water motion is created in `createAmbientMotion()` because the basin and waterfall use larger layered effects.

These effects deliberately stay light. The map art remains the visual source of truth, while Phaser adds movement without repainting the terrain.

## Debug API

Admin builds expose `window.__graphreachDebug` for browser tests and quick inspection. It can:

- report scene state and ambience counts
- test whether a point is walkable
- teleport to valid coordinates or named interactions
- list and validate required route probes

This API is for development and smoke coverage. Normal gameplay does not display it.
