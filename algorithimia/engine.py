from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .encounters import Encounter, PythonCallRestriction


@dataclass(frozen=True)
class CaseResult:
    case_name: str
    expected: object
    actual: object
    passed: bool
    error: str | None = None


@dataclass(frozen=True)
class AttemptResult:
    passed: bool
    message: str
    case_results: tuple[CaseResult, ...]


class LanguageAdapter(Protocol):
    def run(
        self,
        source: str,
        input_values: object,
        python_call_restrictions: tuple[PythonCallRestriction, ...] = (),
    ) -> object:
        """Run player source against one case and return its JSON-compatible value."""


class GameEngine:
    def __init__(self, adapter: LanguageAdapter) -> None:
        self._adapter = adapter

    def attempt(self, encounter: Encounter, source: str) -> AttemptResult:
        results: list[CaseResult] = []

        for case in encounter.cases + encounter.certification_cases:
            try:
                actual = self._adapter.run(source, case.input_values, encounter.python_call_restrictions)
            except Exception as exc:  # noqa: BLE001 - player errors become gameplay feedback.
                results.append(
                    CaseResult(
                        case_name=case.name,
                        expected=case.expected,
                        actual=None,
                        passed=False,
                        error=str(exc),
                    )
                )
                continue

            normalized = tuple(actual) if isinstance(actual, list) else actual
            validation_error = encounter.output_validator(case, actual) if encounter.output_validator else None
            results.append(
                CaseResult(
                    case_name=case.name,
                    expected=case.expected,
                    actual=normalized,
                    passed=validation_error is None and normalized == case.expected,
                    error=validation_error,
                )
            )

        passed = all(result.passed for result in results)
        message = encounter.success_message if passed else encounter.failure_message
        return AttemptResult(passed=passed, message=message, case_results=tuple(results))
