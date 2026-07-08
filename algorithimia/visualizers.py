from __future__ import annotations

from .encounters import Encounter


def encounter_trace(encounter: Encounter) -> list[str]:
    case = next((candidate for candidate in encounter.cases if list(candidate.input_values)), encounter.cases[0])
    if encounter.trace_kind == "comparison":
        return comparison_trace(case.input_values)
    if encounter.trace_kind == "triage":
        return triage_trace(case.input_values)
    return ["no trace"]


def comparison_trace(values: object) -> list[str]:
    trace: list[str] = []
    items = list(values)
    for index in range(len(items) - 1):
        left = items[index]
        right = items[index + 1]
        relation = "<=" if left <= right else ">"
        trace.append(f"{left} {relation} {right}")
    return trace or ["no comparisons"]


def triage_trace(tickets: object) -> list[str]:
    items = list(tickets)
    if not items:
        return ["arrived: none"]

    trace: list[str] = []
    urgent_seen = 0
    ordinary_seen = 0
    for ticket in items:
        if not isinstance(ticket, dict):
            continue
        ticket_id = ticket.get("id", "?")
        arrival = ticket.get("arrival", "?")
        if ticket.get("urgent"):
            urgent_seen += 1
            label = "urgent"
        else:
            ordinary_seen += 1
            label = "ordinary"
        trace.append(f"arrived {ticket_id}@{arrival} {label} waiting ordinary={ordinary_seen}")

    if urgent_seen >= 2 and ordinary_seen:
        trace.append("ordinary guard after two urgent")
    return trace
