from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .encounters import get_encounter
from .engine import GameEngine
from .language.python_adapter import PythonAdapter
from .visualizers import comparison_trace

DEMO_SOLUTION = """\
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
"""


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Play the Algorithimia prototype.")
    parser.add_argument(
        "--solution",
        type=Path,
        help="Path to a Python file defining solve(values). If omitted, a built-in demo solution is used.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    encounter = get_encounter("sorting_slime")
    engine = GameEngine(adapter=PythonAdapter())

    if args.solution:
        if not args.solution.is_file():
            print(f"Could not read solution file: {args.solution}", file=sys.stderr)
            return 2
        source = args.solution.read_text(encoding="utf-8")
    else:
        source = DEMO_SOLUTION

    print("Algorithimia")
    print("Encounter:", encounter.title)
    print(encounter.prompt)
    print()
    print("Trace:", " -> ".join(comparison_trace(encounter.cases[0].input_values)))
    print()

    result = engine.attempt(encounter, source)
    print(result.message)
    for case_result in result.case_results:
        marker = "PASS" if case_result.passed else "FAIL"
        detail = f" error={case_result.error!r}" if case_result.error else ""
        print(
            f"{marker}: {case_result.case_name} "
            f"expected={case_result.expected!r} actual={case_result.actual!r}{detail}"
        )

    return 0 if result.passed else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
