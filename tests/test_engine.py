from __future__ import annotations

import unittest

from algorithimia.encounters import Encounter, EncounterCase, get_encounter
from algorithimia.engine import GameEngine
from algorithimia.language.python_adapter import PythonAdapter, PythonExecutionError

MANUAL_SORT = """
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


class EngineTests(unittest.TestCase):
    def test_sorting_slime_accepts_correct_solution(self) -> None:
        engine = GameEngine(PythonAdapter())
        result = engine.attempt(get_encounter("sorting_slime"), MANUAL_SORT)

        self.assertTrue(result.passed)
        self.assertTrue(all(case.passed for case in result.case_results))

    def test_sorting_slime_rejects_built_in_sorted(self) -> None:
        engine = GameEngine(PythonAdapter())
        result = engine.attempt(get_encounter("sorting_slime"), "def solve(values):\n    return sorted(values)\n")

        self.assertFalse(result.passed)
        self.assertIn("visible sorting logic", result.case_results[0].error or "")

    def test_sorting_slime_rejects_list_sort(self) -> None:
        engine = GameEngine(PythonAdapter())
        source = "def solve(values):\n    ordered = list(values)\n    ordered.sort()\n    return ordered\n"
        result = engine.attempt(get_encounter("sorting_slime"), source)

        self.assertFalse(result.passed)
        self.assertIn("visible sorting logic", result.case_results[0].error or "")

    def test_python_call_restrictions_are_encounter_scoped(self) -> None:
        encounter = Encounter(
            slug="debug_sort",
            title="Debug Sort",
            prompt="Sort with any helper.",
            cases=(EncounterCase("mixed", (2, 1), (1, 2)),),
        )
        engine = GameEngine(PythonAdapter())
        result = engine.attempt(encounter, "def solve(values):\n    return sorted(values)\n")

        self.assertTrue(result.passed)

    def test_sorting_slime_rejects_wrong_solution(self) -> None:
        engine = GameEngine(PythonAdapter())
        result = engine.attempt(get_encounter("sorting_slime"), "def solve(values):\n    return list(values)\n")

        self.assertFalse(result.passed)
        self.assertTrue(any(not case.passed for case in result.case_results))

    def test_adapter_requires_solve_function(self) -> None:
        adapter = PythonAdapter()

        with self.assertRaises(PythonExecutionError):
            adapter.run("answer = 42", (1, 2, 3))

    def test_adapter_times_out_infinite_loop(self) -> None:
        adapter = PythonAdapter(timeout_seconds=0.25)

        with self.assertRaises(PythonExecutionError):
            adapter.run("def solve(values):\n    while True:\n        pass\n", (1, 2, 3))


if __name__ == "__main__":
    unittest.main()
