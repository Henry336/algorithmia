from __future__ import annotations

import unittest

from algorithimia.encounters import get_encounter
from algorithimia.engine import GameEngine
from algorithimia.language.python_adapter import PythonAdapter, PythonExecutionError


class EngineTests(unittest.TestCase):
    def test_sorting_slime_accepts_correct_solution(self) -> None:
        engine = GameEngine(PythonAdapter())
        result = engine.attempt(get_encounter("sorting_slime"), "def solve(values):\n    return sorted(values)\n")

        self.assertTrue(result.passed)
        self.assertTrue(all(case.passed for case in result.case_results))

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

