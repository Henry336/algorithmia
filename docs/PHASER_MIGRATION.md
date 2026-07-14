# Algorithmia Phaser Migration

## Current Status

Phaser now powers all six campaign exploration spaces and the real-time Sorting Slime boss encounter. The DOM remains responsible for menus, dialogue, Python editing, readable battle panels, save controls, Arcade, and Workshop.

Implemented in the first migration slice:

- Locally bundled Phaser 3.90 runtime with a Vercel build step.
- Fixed-timestep 960x540 combat arena with responsive canvas fitting.
- Keyboard movement, collision damage, knockback, invulnerability frames, and guarding.
- Three escalating Sorting Slime phases: Insertion March, Merge Flood, and Overflow Spiral.
- Continuous hazards that stop only when Patchrunner reaches the boss.
- `Attack / Repair / Use / Guard` command presentation after contact.
- Keyboard-first command selection with `A / D` or left/right, Space/Enter confirmation, and pointer lock until Repair opens.
- Project-local `ui-command-select.wav` feedback for command navigation and confirmation.
- Boss HP, a phase-local 100 HP Null shield, defeat, retry, victory, and admin completion.
- A sixty-second Python Repair window with persistent source text, visible and sealed cases, worker timeout protection, and runtime metrics.
- Code-editor Tab indentation, Shift+Tab unindentation, and normal Space input while Phaser keyboard capture is suspended.
- Successful phase-specific repairs remove the Null shield and reorganize the live attack patterns.
- Beginner code-completion starters, examples, and progressive hints for the first boss.
- Separate config, pattern, repair-content, engine, and DOM-controller modules for maintainable encounter changes.
- Direct admin launch through `?admin=1&encounter=sorting-slime`.
- Player-facing Arcade Mode entry and Sorting Slime encounter selection from the title menu.
- Immediate campaign collision handoff from the Queueworks slime into the Phaser encounter.
- Desktop and mobile browser smoke coverage.

Implemented in the campaign-atlas slice:

- Six full-screen 1920x1280 connected worlds with distinct terrain, palettes, routes, and escalating Null Rot.
- Shared region, corridor, blocker, gate, and foreground-occluder geometry.
- Four-point foot collision, camera tracking, backtracking, patrol movement, and touch controls.
- Animated water, grass, trees, fire, route motes, machinery, and Null corruption.
- Data-authored NPCs, lore, secret dialogue, collectibles, spatial puzzles, enemies, mini-bosses, bosses, and exits.
- Campaign encounter handoff that returns Patchrunner to the exact world and only saves progress after victory.
- Browser flood-fill coverage for every required destination plus blocker, gate, puzzle, secret-room, desktop, and mobile audits.

## Migration Boundary

Campaign exploration and Sorting Slime use Phaser. Bogolord keeps its dedicated timed battle, while smaller enemies and the remaining bosses use the existing queue and limited-Python battle surfaces. `campaignAtlasEncounters.js` is the boundary, so an encounter can gain a real-time arena later without rewriting its world placement or progression reward.

## Python Runtime

The current Repair window uses the existing prototype's intentionally limited Python subset. It supports the sorting lesson's loops, comparisons, list copies, indexing, swaps, assignments, and returns. It runs in a disposable Web Worker so infinite loops can be terminated.

This is not yet full Python. Pyodide remains the intended upgrade before encounters require dictionaries, sets, recursion, heaps, graph structures, imports, or broader LeetCode-style solutions.

## Next Encounter Work

1. Playtest the six atlas worlds for pacing, environmental readability, and route discovery.
2. Upgrade the limited browser Python runtime before authoring dictionary, set, recursion, heap, or graph-heavy repairs.
3. Build the second real-time movement boss, then extract only the arena helpers that encounter proves reusable.
4. Migrate Heap Warden before Bogolord so the shared phase, interruption, and repair contracts grow from two concrete encounters.
5. Import reviewed Workshop or LDtk drafts through a deliberate atlas-data conversion step instead of creating a second campaign renderer.
