# Algorithmia

Algorithmia is a browser-based programming RPG where algorithms are physical rules of the world. The player is Patchrunner, a technician who survives corrupted systems, reaches vulnerable enemies, and writes Python repairs that change the battlefield itself.

The browser game under `web/` is the primary product. The older `algorithimia/` Python package remains as a deterministic validation and trace reference; its misspelled module name is preserved for compatibility.

## Current State

- Campaign levels 0-4 are playable as connected room routes.
- Chapter 5 is an LDtk import test that renders a sample LDtk GridVania map as an explorable room route.
- Arcade Mode is available from the title screen.
- Workshop Mode is available from the title screen for visual room, entity, dialogue, and encounter drafting.
- Sorting Slime is the first Phaser-powered real-time boss encounter.
- Later encounters currently use the earlier DOM battle systems and will migrate to Phaser incrementally.
- Python is the default repair dialect.
- Saves use browser `localStorage`.
- Vercel builds and deploys the static `web/` output.

## Quick Start

Requirements:

- Node.js 20 or newer
- npm
- Python 3.11 or newer for the legacy engine and unit tests

From the repository root:

```bash
npm install
npm run build
npm run dev
```

Open [http://localhost:4173](http://localhost:4173).

Useful routes:

- `/` - title screen, campaign, Arcade Mode
- `/?workshop=1` - open the Workshop editor directly
- `/?admin=1` - unlock every level and show encounter skip controls
- `/?admin=1&chapter=5` - launch the LDtk Chapter 5 import test directly
- `/?admin=0` - disable persisted admin mode
- `/?admin=1&encounter=sorting-slime` - launch the Phaser Sorting Slime battle directly

The Phaser runtime is installed through npm and copied to the generated `web/vendor/` directory by `npm run build`. Do not edit or commit `web/vendor/phaser.min.js`.

## Controls

Overworld:

- Move: WASD or arrow keys
- Interact/advance dialogue: Space or Enter

Sorting Slime battle:

- Move: WASD or arrow keys
- Choose commands: A/D or left/right
- Confirm a command: Space or Enter
- Repair editor: Tab indents, Shift+Tab unindents, and Space behaves normally

## Verification

JavaScript syntax and build scripts:

```bash
npm run check
```

Browser encounter smoke, including campaign and Arcade launch paths:

```bash
npm run smoke:slime
```

Workshop editor smoke:

```bash
npm run smoke:workshop
```

The smoke command starts a temporary local server when one is not already running. Install a Playwright browser once if prompted:

```bash
npx playwright install chromium
```

Python reference-engine tests:

```bash
python -m unittest discover -s tests
```

On Windows, `py -m unittest discover -s tests` is also valid.

## Repository Map

```text
web/                         Player-facing browser game
  index.html                 Screens and shared battle/editor markup
  css/style.css              Current visual system and responsive layouts
  js/main.js                 Screen and route entry point
  js/room.js                 Queueworks campaign room
  js/chapter1.js ...         Later campaign routes
  js/audio.js                Shared browser-safe sound effects and music helper
  js/slimeArenaEngine.js     Phaser movement, hazards, collisions, and phases
  js/slimeArenaBattle.js     Sorting Slime DOM/Phaser/Python coordination
  js/slimeArenaConfig.js     Sorting Slime balance numbers and labels
  js/slimeArenaPatterns.js   Sorting Slime hazard formations
  js/slimeRepairTasks.js     Sorting Slime prompts, hints, starters, and cases
  js/workshopData.js         Workshop level format, defaults, and editor libraries
  js/workshopValidation.js   Reachability and level-pack validation
  js/workshopEditor.js       Visual level editor UI and local draft persistence
  js/chapter5.js             LDtk import test renderer and room interaction bridge
  js/pythonRepairRuntime.js  Current limited browser Python subset
  assets/                    Character and audio assets

algorithimia/                Legacy Python validation and trace package
tests/                       Python contracts and browser smoke coverage
scripts/                     Build and development helpers
docs/                        Architecture, continuity, migration, and safety notes
```

## Documentation

- [Contributing](CONTRIBUTING.md) - setup, workflow, conventions, and change checklist
- [Project ownership](docs/PROJECT_OWNERSHIP.md) - accounts, common edits, publishing, recovery, and troubleshooting
- [Architecture](docs/ARCHITECTURE.md) - runtime boundaries and module ownership
- [Project continuity](docs/ALGORITHMIA_CONTINUITY.md) - active gameplay and canon constraints
- [Phaser migration](docs/PHASER_MIGRATION.md) - what has migrated and what has not
- [Safe execution](docs/SAFE_EXECUTION.md) - code-execution limits and security boundaries
- [Changelog](CHANGELOG.md) - release-level history
- [Story so far](ALGORITHMIA_STORY_SO_FAR.md) - working canon and narrative decisions
- [Chronological story overview](ALGORITHMIA_CHRONOLOGICAL_STORY_OVERVIEW.md) - story events in timeline order
- [Henry's vision](HENRY_VISION.md) - original product intent; some implementation details are historical

## Adding an Encounter

1. Define the enemy's battlefield rule and what Repair changes physically.
2. Add deterministic public and sealed cases.
3. Keep campaign progress behind the normal win callback.
4. Add an admin completion path.
5. Add reachability coverage for required room interactions.
6. Add or extend a browser smoke path before considering the encounter complete.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full workflow.

## Deployment

Vercel installs npm dependencies, runs `npm run build`, and publishes `web/` according to `vercel.json`. Pull-request and branch pushes receive Preview deployments; `main` is the production source.

Before pushing to `main`, run the build, syntax checks, Python suite, and relevant browser smoke.

Workshop drafts created on the production site are stored in that browser's `localStorage`. Use Export JSON to turn a draft into a level pack that can be reviewed, committed, and deployed as official content.

## Naming Note

The project is **Algorithmia**. Older code and historical files may use `algorithimia`; do not introduce that spelling in new player-facing text or documentation. Renaming the Python import package is a separate compatibility migration and should not be mixed into gameplay changes.
