from __future__ import annotations

import contextlib
import io
import unittest
from pathlib import Path

from algorithimia.cli import main


class CliEdgeCaseTests(unittest.TestCase):
    def test_missing_solution_file_returns_clean_failure(self) -> None:
        missing = Path("missing-player-solution.py")

        stdout = io.StringIO()
        stderr = io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            exit_code = main(["--solution", str(missing)])

        self.assertNotEqual(exit_code, 0)
        self.assertIn("solution", stderr.getvalue().lower())


if __name__ == "__main__":
    unittest.main()

