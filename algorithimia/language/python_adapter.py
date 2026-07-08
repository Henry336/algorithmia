from __future__ import annotations

import ast
import json
import subprocess
import sys
import tempfile
from pathlib import Path


class PythonExecutionError(RuntimeError):
    """Raised when player Python cannot be executed cleanly."""


class PythonAdapter:
    def __init__(self, timeout_seconds: float = 2.0) -> None:
        self._timeout_seconds = timeout_seconds

    def run(self, source: str, input_values: tuple[int, ...]) -> object:
        _reject_disallowed_sort_helpers(source)

        with tempfile.TemporaryDirectory(prefix="algorithimia_") as tmp:
            tmp_path = Path(tmp)
            runner = tmp_path / "runner.py"
            runner.write_text(_runner_source(source), encoding="utf-8")

            try:
                process = subprocess.run(
                    [sys.executable, "-I", str(runner)],
                    input=json.dumps({"values": list(input_values)}),
                    text=True,
                    capture_output=True,
                    timeout=self._timeout_seconds,
                    cwd=tmp,
                    env={"PYTHONIOENCODING": "utf-8"},
                    check=False,
                )
            except subprocess.TimeoutExpired as exc:
                raise PythonExecutionError("player code timed out") from exc

        if process.returncode != 0:
            detail = process.stderr.strip() or process.stdout.strip() or "player code failed"
            raise PythonExecutionError(detail)

        try:
            payload = json.loads(process.stdout)
        except json.JSONDecodeError as exc:
            raise PythonExecutionError("player code did not return valid JSON") from exc

        if not payload.get("ok"):
            raise PythonExecutionError(str(payload.get("error", "player code failed")))
        return payload.get("result")


def _reject_disallowed_sort_helpers(source: str) -> None:
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return

    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "sorted":
            raise PythonExecutionError(
                "Sorting Slime requires visible sorting logic; replace sorted(...) with your own loop."
            )
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "sort":
            raise PythonExecutionError(
                "Sorting Slime requires visible sorting logic; replace .sort() with your own loop."
            )


def _runner_source(player_source: str) -> str:
    encoded_source = json.dumps(player_source)
    return f"""
import json

SAFE_BUILTINS = {{
    "all": all,
    "any": any,
    "bool": bool,
    "dict": dict,
    "enumerate": enumerate,
    "len": len,
    "list": list,
    "max": max,
    "min": min,
    "range": range,
    "reversed": reversed,
    "sum": sum,
    "tuple": tuple,
}}

namespace = {{"__builtins__": SAFE_BUILTINS}}
try:
    exec({encoded_source}, namespace, namespace)
    solve = namespace.get("solve")
    if not callable(solve):
        raise TypeError("submission must define solve(values)")
    payload = json.loads(input())
    result = solve(tuple(payload["values"]))
    print(json.dumps({{"ok": True, "result": result}}))
except BaseException as exc:
    print(json.dumps({{"ok": False, "error": f"{{type(exc).__name__}}: {{exc}}"}}))
""".lstrip()
