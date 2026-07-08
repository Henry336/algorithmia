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
4. The engine optionally applies encounter-specific output validation.
5. The engine compares JSON-compatible output against expected case results.
6. The CLI prints RPG-flavored feedback and per-case results.

## Encounter Validation Policy

`Sorting Slime` is a DSA teaching encounter, so its encounter metadata defines Python call restrictions that reject `sorted(...)`, simple aliases of `sorted`, and `.sort()` before executing player code. The engine passes those restrictions to the Python adapter per attempt, keeping helper bans encounter-scoped for future challenges.

`Triage Line Dispatcher Trial` uses the same engine path with JSON ticket objects instead of integer rune values. Its output validator checks that returned ids were issued by the fixture and that every issued ticket is served exactly once before the expected policy order is compared.

Encounter metadata can name a `trace_case_name` when the most useful preview is not the first non-empty fixture. Triage Line uses this to show the ordinary-guard fixture in the CLI trace, including arrival, urgent override, stable tie, ordinary guard, and served labels.

## Near-Term Extension Points

- Move encounter definitions into data files when content volume grows.
- Expand trace-producing visualizers into renderer-ready metadata for sorting, queue scheduling, graph traversal, and dynamic programming.
- Add a UI client after the terminal loop proves the core interaction.
