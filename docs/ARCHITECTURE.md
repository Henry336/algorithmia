# Architecture

Algorithimia currently uses a small Python package organized around a deterministic encounter loop.

## Modules

- `algorithimia.cli`: terminal entry point.
- `algorithimia.encounters`: encounter data and test cases.
- `algorithimia.engine`: gameplay validation flow.
- `algorithimia.language.python_adapter`: Python-first player-code execution.
- `algorithimia.visualizers`: deterministic text traces for algorithm feedback.

## Gameplay Flow

1. The CLI loads an encounter.
2. The engine sends each case to the language adapter.
3. The adapter executes `solve(values)` in a child Python process.
4. The engine compares JSON-compatible output against expected case results.
5. The CLI prints RPG-flavored feedback and per-case results.

## Near-Term Extension Points

- Move encounter definitions into data files when content volume grows.
- Add trace-producing visualizers for sorting, graph traversal, and dynamic programming.
- Add a UI client after the terminal loop proves the core interaction.

