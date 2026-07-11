# Algorithmia Phaser Migration

## Current Status

Phaser now powers the real-time Sorting Slime boss encounter while the existing DOM remains responsible for menus, dialogue, Python editing, save data, and campaign transitions.

Implemented in the first migration slice:

- Locally bundled Phaser 3.90 runtime with a Vercel build step.
- Fixed-timestep 960x540 combat arena with responsive canvas fitting.
- Keyboard movement, collision damage, knockback, invulnerability frames, and guarding.
- Three escalating Sorting Slime phases: Insertion March, Merge Flood, and Overflow Spiral.
- Guaranteed openings in every generated slime column.
- Timed boss access windows and `Attack / Repair / Use / Guard` command presentation.
- Keyboard-first command selection with `A / D` or left/right, Space/Enter confirmation, and pointer lock until Repair opens.
- Project-local `ui-command-select.wav` feedback for command navigation and confirmation.
- Boss HP, repaired and unrepaired damage values, defeat, retry, victory, and admin completion.
- A sixty-second Python Repair window with persistent source text, visible and sealed cases, worker timeout protection, and runtime metrics.
- Code-editor Tab indentation, Shift+Tab unindentation, and normal Space input while Phaser keyboard capture is suspended.
- Successful repairs reorganize the live attack patterns and increase weak-point damage.
- Direct admin launch through `?admin=1&encounter=sorting-slime`.
- Desktop and mobile browser smoke coverage.

## Migration Boundary

Only the main Sorting Slime encounter uses Phaser right now. Rune Snarl and the later encounters continue using their existing battle implementations. This lets encounters migrate one at a time without blocking the playable campaign.

## Python Runtime

The current Repair window uses the existing prototype's intentionally limited Python subset. It supports the sorting lesson's loops, comparisons, list copies, indexing, swaps, assignments, and returns. It runs in a disposable Web Worker so infinite loops can be terminated.

This is not yet full Python. Pyodide remains the intended upgrade before encounters require dictionaries, sets, recursion, heaps, graph structures, imports, or broader LeetCode-style solutions.

## Next Encounter Work

1. Playtest and tune Sorting Slime movement speed, wave length, damage, and access-window duration.
2. Add touch controls if portrait/mobile play becomes part of the immediate target.
3. Extract reusable boss-pattern helpers from the proven Sorting Slime implementation.
4. Migrate Heap Warden as the first non-sorting Phaser boss.
5. Move Bogolord only after the shared arena, phase, repair, and interruption contracts are stable.
