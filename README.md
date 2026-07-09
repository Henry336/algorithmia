# Algorithimia

Algorithimia is a browser-based programming RPG. Data structures and algorithms are the physical rules of the world: the player is a junior Patchrunner repairing broken civic systems by writing and reasoning about code.

The player-facing game lives in `web/` — a plain static site (no build step, no backend) with a title screen and three tile-based explorable chapters so far, each with dialogue, hidden secrets, and Pokémon-style battle-screen transitions into encounters:

- **Chapter 0 — Queueworks Intake**: the Sorting Slime (rune ordering, public + sealed rounds).
- **Chapter 1 — The Dispatcher's Line**: a Line Cutter minor fight and The Dispatcher boss, both ticket-service-order puzzles mirroring the CLI's urgent/stable-tie/starvation-guard policy.
- **Chapter 2 — Heaplight Foundry**: an Ember Sorter minor fight and The Heap Warden boss, both max-priority-first battles (a real priority-queue/heap-extraction rule, ties broken by arrival order) reusing the same battle-screen UI with a different policy plugged in.

Art is currently hand-authored placeholder pixel art rendered to `<canvas>`, meant to be swapped for real exported sprites later without touching game logic.

The Python package in `algorithimia/` is the original CLI prototype and encounter/validation engine. It is no longer the player-facing surface; it stays useful as an internal sandbox for deterministic encounter logic and for a future in-browser code-execution engine.

## Play the browser game

No install or build step. From the repo root:

```bash
python3 -m http.server 8000 --directory web
```

Then open `http://localhost:8000` in a browser. Or just open `web/index.html` directly as a file.

Controls: Arrow keys / WASD to move, Space / Enter to interact, or the on-screen buttons on touch devices. Walk into Mira to talk, walk into the Sorting Slime to trigger the battle screen. Sort the visible rune spill into ascending order, pass the public round, then pass a second sealed round with a freshly shuffled set to prove the repair generalizes. A correct repair opens the Queueworks gate and the room stays updated across a reload (progress is saved to `localStorage`).

### Deploying

The site is static, so any static host works. `vercel.json` at the repo root points Vercel at `web/` as the output directory with no build command — connect the repo and deploy as-is.

### Structure

```
web/
  index.html          title screen, chapter select, options, room, battle, dialogue markup
  css/style.css        all screen styling, responsive room scaling, mobile d-pad
  js/
    main.js             screen state machine entry point
    state.js             localStorage save/load
    title.js             title/menu/chapter-select/options wiring
    room.js               tile-grid overworld engine + Chapter 0 map
    chapter1.js            tile-grid overworld engine + Chapter 1 map (Dispatcher's Line)
    chapter2.js             tile-grid overworld engine + Chapter 2 map (Heaplight Foundry)
    battle.js              Sorting Slime battle screen (public + sealed rounds)
    ticketBattle.js          generic pick-the-order battle screen (public + sealed rounds),
                              driven by a pluggable `solve(items)` policy + display config
    triagePolicy.js           urgent/stable-tie/starvation-guard policy, ported from encounters.py
    priorityPolicy.js          max-priority-first policy (stable ties by arrival), for Chapter 2
    dialogue.js             typewriter dialogue box
    sprites.js               placeholder pixel-art matrices + palettes
    pixelart.js               matrix -> <canvas> renderer
```

Replacing placeholder art: once real sprite sheets exist, swap the relevant `applyPixelArt(...)` call for an `<img>`/sprite-sheet draw — the matrices in `sprites.js` are meant to be thrown away, not maintained long-term.

## Python CLI / encounter engine

The original CLI prototype still runs standalone and its test suite still passes; it is kept as the deterministic reference implementation for encounter validation logic (e.g. the Sorting Slime insertion-sort contract) and as a candidate engine for real in-browser code execution later.

```powershell
python -m algorithimia
python -m algorithimia --encounter triage_line
python -m algorithimia --trace-html build/sorting-trace.html
```

On Windows installations that use the Python launcher, substitute `py` for `python`.

### Test

```powershell
python -m unittest
```

GitHub Actions runs the same unit-test suite on pushes to `main` and on pull requests.

## Encounter Contracts

### Sorting Slime

The reference Python solution:

```python
def solve(values):
    ordered = list(values)
    for i in range(1, len(ordered)):
        current = ordered[i]
        j = i - 1
        while j >= 0 and ordered[j] > current:
            ordered[j + 1] = ordered[j]
            j -= 1
        ordered[j + 1] = current
    return ordered
```

The engine runs several deterministic public cases plus sealed certification cases and reports whether the encounter is cleared. It rejects `sorted(...)`, indirect built-in `sorted` bindings, and `.sort()` so the player demonstrates visible sorting logic. Certification cases are shown as sealed pass/fail checks so hidden inputs stay hidden while memorized public-fixture answers still fail. The browser battle screen mirrors this same public-round-then-sealed-round pedagogy with a manual rune-swap puzzle instead of submitted Python.

### Triage Line Dispatcher Trial

The player submits Python that defines:

```python
def solve(tickets):
    # Return ticket ids in service order.
    return []
```

Each ticket is a JSON-compatible object with `id`, `arrival`, and `urgent`. Urgent tickets may advance, ties keep arrival order, and after two urgent services the oldest waiting ordinary ticket must be served if one exists. Not yet wired into the browser game.

## Security Note

Player Python (CLI path only, not yet exposed in the browser) runs in a child process with timeout, isolated mode, a minimal environment, restricted builtins, JSON-only I/O, source/result size caps, and a syntax preflight that rejects imports, dunder introspection, and dynamic evaluation/introspection helpers. This is a baseline local safety model, not a complete sandbox for hostile untrusted code — real in-browser or public code execution will need a stronger sandbox before it ships.
