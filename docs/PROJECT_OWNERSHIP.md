# Owning and Changing Algorithmia

This guide is for anyone taking over the project without help from the previous developer. You do not need Codex, Claude, or another AI tool to build, test, deploy, or change the game.

## What You Need

Install these tools:

- Git
- Node.js 20 or newer
- npm, which comes with Node.js
- A modern browser such as Chrome, Edge, or Firefox
- Python 3.11 or newer when changing the legacy Python engine or running every test

You also need these accounts for publishing:

- Write access to `github.com/Henry336/algorithmia`
- Access to the Vercel project named `algorithmia` in Hein Lin Htet's Vercel team

No API keys are required to run the game locally. Do not put passwords, tokens, or private keys in this repository.

## First-Time Setup

```bash
git clone https://github.com/Henry336/algorithmia.git
cd algorithmia
npm install
npm run build
npm run dev
```

Open `http://localhost:4173`. If you use nvm, run `nvm use` first. The `.nvmrc` file selects Node 20.

Install Playwright's test browser once:

```bash
npx playwright install chromium
```

## Start Here Every Time

```bash
git switch main
git pull --ff-only
npm install
npm run dev
```

Use a separate branch for larger changes with `git switch -c your-name/short-change-name`. `main` deploys to production, so do not push unfinished work there.

## Fast Testing Routes

- `http://localhost:4173/?admin=1` unlocks level select and admin win controls.
- `http://localhost:4173/?admin=1&chapter=5` opens the LDtk import test directly.
- `http://localhost:4173/?admin=0` turns admin mode off.
- `http://localhost:4173/?admin=1&encounter=sorting-slime` opens the Phaser boss directly.
- `http://localhost:4173/?workshop=1` opens the Workshop editor directly.

Browser saves live in `localStorage`. To clear a broken test save, open the browser console and run:

```js
localStorage.removeItem("algorithmia-state");
location.reload();
```

Workshop drafts use a separate browser save. Clear only the editor draft with:

```js
localStorage.removeItem("algorithmia.workshop.draft.v1");
location.reload();
```

## Where to Make Common Changes

| Change | File |
| --- | --- |
| Sorting Slime HP, shield, speed, or spawn timing | `web/js/slimeArenaConfig.js` |
| Sorting Slime hazard shapes | `web/js/slimeArenaPatterns.js` |
| Sorting Slime repair prompt, starter, hints, or cases | `web/js/slimeRepairTasks.js` |
| Sorting Slime commands and Repair screen behavior | `web/js/slimeArenaBattle.js` |
| Sorting Slime movement, damage, phases, shields, or knockback | `web/js/slimeArenaEngine.js` |
| Title and Arcade selection | `web/js/title.js` and `web/index.html` |
| Workshop level editor data and validation | `web/js/workshopData.js` and `web/js/workshopValidation.js` |
| Workshop editor UI | `web/js/workshopEditor.js` and `web/css/style.css` |
| Campaign entry room | `web/js/room.js` |
| Later chapter maps and story events | `web/js/chapter1.js` through `chapter4.js` |
| LDtk import test map | `web/data/ldtk/chapter5_layout.ldtk` |
| LDtk import test renderer | `web/js/chapter5.js` |
| Save fields | `web/js/state.js` |
| Shared HP and Focus rules | `web/js/combatState.js` |
| Player-written browser Python support | `web/js/pythonRepairRuntime.js` |
| Visual styling | `web/css/style.css` |
| Runtime images and sounds | `web/assets/` |
| Story canon | `ALGORITHMIA_STORY_SO_FAR.md` |
| Current implementation rules | `docs/ALGORITHMIA_CONTINUITY.md` |

## Sorting Slime File Roles

1. `slimeArenaConfig.js` contains numbers and labels. Start here for balance changes.
2. `slimeArenaPatterns.js` creates moving hazards. It does not decide HP or rewards.
3. `slimeRepairTasks.js` contains the Python exercises and testcases.
4. `slimeArenaEngine.js` runs movement, collisions, phases, shields, and Phaser effects.
5. `slimeArenaBattle.js` connects the canvas to buttons, text, audio, saves, and the Repair editor.

Keep these boundaries when adding features. A new hazard belongs in the patterns file; a new hint belongs in the repair-tasks file.

## Workshop File Roles

1. `workshopData.js` defines the level JSON shape, default room, tile library, entity library, battle presets, repair challenge options, and draft storage key.
2. `workshopValidation.js` checks room reachability and common broken-level mistakes.
3. `workshopEditor.js` owns the visible editor UI, local draft save/load, import/export, and the test marker.
4. `style.css` owns the Workshop layout and tile visuals.

The live deployment can create, save, import, and export drafts in the browser. It cannot write official campaign data into GitHub until the project adds a backend with authentication. For now, use Export JSON, review the level pack, then commit it as source data when the campaign loader is ready.

## LDtk Test Import

Chapter 5 is a practical LDtk import test. The game fetches `web/data/ldtk/chapter5_layout.ldtk`, renders the `Collisions` IntGrid, and turns LDtk entities into simple game interactions.

Supported in the test importer:

- collision walls;
- doors between neighboring GridVania rooms;
- items and simple inventory;
- keyed doors;
- buttons that open secret walls in the current room.

Not supported yet:

- external tileset art rendering;
- Player entity placement, because the uploaded test map did not include a Player instance;
- campaign-quality dialogue, enemies, or battles from LDtk fields;
- automatic promotion into official chapter data.

## Before You Commit

Run the complete browser check:

```bash
npm run verify:web
```

Run Python tests too when Python code, chapter maps, or shared contracts changed:

```bash
python -m unittest discover -s tests
```

On Windows, use `py -m unittest discover -s tests` if `python` is not recognized.

Review the change with `git status`, `git diff --check`, and `git diff`. Do not commit `node_modules/`, `web/vendor/`, `build/`, local tool folders, or raw export dumps such as the top-level `bogolord/` folder.

## Publishing

Vercel is connected to GitHub:

1. Push a branch to receive a Vercel Preview deployment.
2. Merge or push the finished commit to `main`.
3. GitHub Actions runs the Python and browser suites.
4. Vercel runs `npm run build` and publishes `web/`.
5. Production is available at `https://algorithmia-eta.vercel.app`.

The required Vercel settings are stored in `vercel.json`. A normal deployment does not require the Vercel CLI.

## Recovering from a Bad Release

Do not rewrite shared history. Create a commit that reverses the bad one:

```bash
git log --oneline -10
git revert <bad-commit-id>
git push origin main
```

Vercel deploys the revert automatically. If the fix is obvious, fixing it in a new commit is also fine.

## Troubleshooting

### Phaser is missing

Run `npm install` and then `npm run build`. `web/vendor/phaser.min.js` is generated and intentionally ignored by Git.

### Port 4173 is busy

Run `npm run dev -- --port 4174`, then open `http://localhost:4174`.

### Browser smoke cannot launch Chromium

Run `npx playwright install chromium`.

### A required room object cannot be reached

Run the Python suite. `tests/test_web_room_maps.py` checks required paths and interactions. Secret routes may be hidden; required routes may not be impossible.

### A repair works in Python but fails in the browser

The browser supports only a small Python subset. Read `docs/PHASER_MIGRATION.md` and `docs/SAFE_EXECUTION.md` before expanding it.

## Keep Documentation Honest

- Update `CHANGELOG.md` for player-visible changes.
- Update `docs/ALGORITHMIA_CONTINUITY.md` when a gameplay rule becomes a lasting direction.
- Update `docs/ARCHITECTURE.md` when file ownership or runtime flow changes.
- Keep proposals out of implemented-state sections.

The goal is simple: a new developer should be able to find the owning file, make one focused change, test it, and publish it without private context.
