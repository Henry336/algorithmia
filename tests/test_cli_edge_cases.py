from __future__ import annotations

import contextlib
import io
import tempfile
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

    def test_trace_html_writes_static_viewer_without_running_solution(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "trace.html"
            stdout = io.StringIO()

            with contextlib.redirect_stdout(stdout):
                exit_code = main(["--encounter", "triage_line", "--trace-html", str(output_path)])

            html = output_path.read_text(encoding="utf-8")

        self.assertEqual(0, exit_code)
        self.assertIn("Wrote trace viewer", stdout.getvalue())
        self.assertIn("Triage Line Dispatcher Trial", html)
        self.assertIn("data:image/svg+xml;base64", html)
        self.assertIn("ordinary guard: A served after two urgent", html)


if __name__ == "__main__":
    unittest.main()
