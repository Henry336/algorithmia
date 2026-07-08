from __future__ import annotations


def comparison_trace(values: tuple[int, ...]) -> list[str]:
    trace: list[str] = []
    items = list(values)
    for index in range(len(items) - 1):
        left = items[index]
        right = items[index + 1]
        relation = "<=" if left <= right else ">"
        trace.append(f"{left} {relation} {right}")
    return trace or ["no comparisons"]

