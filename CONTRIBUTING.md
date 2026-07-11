# Contributing to Algorithmia

This guide is the shortest path from a fresh clone to a safe gameplay change.

## First Setup

```bash
git clone https://github.com/Henry336/algorithmia.git
cd algorithmia
npm install
npm run build
npm run dev
```

Open `http://localhost:4173` and confirm the title screen appears.

Install Python 3.11 or newer if you are changing the legacy validation engine or running the full suite:

```bash
python -m unittest discover -s tests
```

## Before Editing

Read these files in order:

1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/ALGORITHMIA_CONTINUITY.md`
4. `docs/PHASER_MIGRATION.md` when touching battles
5. `docs/SAFE_EXECUTION.md` when touching player code execution

For narrative work, also read `ALGORITHMIA_STORY_SO_FAR.md` and `ALGORITHMIA_CHRONOLOGICAL_STORY_OVERVIEW.md`.

## Development Commands

```bash
npm run build          # copy the pinned Phaser runtime into web/vendor
npm run dev            # serve web/ at http://localhost:4173
npm run check          # JavaScript syntax checks
npm run smoke:slime    # self-starting browser smoke for campaign/Arcade/Repair
python -m unittest discover -s tests
```

`web/vendor/`, `node_modules/`, and `build/` are generated and ignored. Source changes belong in `web/js`, `web/css`, `web/assets`, `scripts`, `tests`, or documentation.

## Change Workflow

1. Start from current `main` and create a focused branch.
2. Read the owning module before changing behavior.
3. Keep campaign state transitions behind existing win callbacks.
4. Add tests proportional to the behavior changed.
5. Run the relevant checks locally.
6. Update `CHANGELOG.md` for player-visible or developer-workflow changes.
7. Update continuity or architecture docs only when their contracts actually change.

Do not combine a package rename, broad formatting pass, and gameplay feature in one change.

## Browser Architecture Rules

- Phaser owns real-time arena simulation: movement, collision, hazards, timing, and phase state.
- DOM modules own menus, dialogue, editors, semantic buttons, and readable text.
- Encounter controllers coordinate Phaser, DOM, persistent state, and Python results.
- `state.js` is the browser save boundary. Add defaults for every persisted field.
- Player-written code must run outside the main UI thread with a timeout.
- Correct code should change the battlefield; it should not merely display a passing testcase screen.

Only Sorting Slime currently uses the Phaser arena. Do not assume later bosses have migrated because they share battle styling.

## Room and Progression Rules

- Required interactions must be reachable from the room start.
- Opened gates must lead to a reachable exit.
- Optional rooms may be difficult to find; required routes may not be impossible to traverse.
- Use the existing room-map tests when adding obstacles, gates, bosses, or secret entrances.
- Campaign encounters and Arcade encounters must not accidentally share progression rewards.

## Python Repair Rules

- Python is the default player dialect.
- Public cases teach the contract; sealed cases check generalization without exposing hidden values.
- Infinite loops must be terminable.
- Avoid punishing complexity with unexplained HP loss. Reflect runtime quality through visible combat behavior where possible.
- The browser repair runtime is currently a limited Python subset, not CPython. See `docs/PHASER_MIGRATION.md` before designing a problem that needs dictionaries, sets, recursion, imports, or standard-library modules.

## Assets

- Runtime assets live under `web/assets/<type>/`.
- Character exports live under `web/assets/characters/<character>/`.
- Use lowercase descriptive filenames for new audio and utility assets.
- Keep raw export folders outside Git unless the runtime or provenance documentation needs them.
- Pixel art should use `image-rendering: pixelated` and stable display dimensions.

## Definition of Done

A gameplay change is done when:

- the intended player route works from the normal title screen;
- admin testing still works;
- required maps remain reachable;
- desktop and narrow layouts do not clip critical controls;
- syntax and unit tests pass;
- relevant browser smoke passes;
- documentation describes the implemented state, not a proposal.

## Commit and Review

Use concise commit subjects written as commands, for example:

```text
Add Heap Warden Phaser encounter
Fix Graphreach secret-door reachability
Document browser repair runtime limits
```

Keep generated files, local editor settings, and raw asset dumps out of commits.
