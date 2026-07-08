from __future__ import annotations

from .encounters import Encounter


def encounter_trace(encounter: Encounter) -> list[str]:
    preferred_case = (
        next((candidate for candidate in encounter.cases if candidate.name == encounter.trace_case_name), None)
        if encounter.trace_case_name
        else None
    )
    case = preferred_case or next((candidate for candidate in encounter.cases if list(candidate.input_values)), encounter.cases[0])
    if encounter.trace_kind == "comparison":
        return comparison_trace(case.input_values)
    if encounter.trace_kind == "triage":
        return triage_trace(case.input_values, case.expected)
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


def triage_trace(tickets: object, served_order: object = ()) -> list[str]:
    items = [ticket for ticket in list(tickets) if isinstance(ticket, dict)]
    if not items:
        return ["arrived: none"]

    trace: list[str] = []
    ordinary_waiting: list[str] = []
    urgent_waiting: list[str] = []
    for ticket in items:
        ticket_id = ticket.get("id", "?")
        arrival = ticket.get("arrival", "?")
        if ticket.get("urgent"):
            urgent_waiting.append(str(ticket_id))
            label = "urgent"
        else:
            ordinary_waiting.append(str(ticket_id))
            label = "ordinary"
        trace.append(f"arrived {ticket_id}@{arrival} {label}")

    served_ids = [str(ticket_id) for ticket_id in served_order]
    urgent_streak = 0
    for ticket_id in served_ids:
        if ticket_id in urgent_waiting:
            if ordinary_waiting:
                trace.append(f"urgent override: {ticket_id} before {ordinary_waiting[0]}")
            if urgent_streak:
                trace.append(f"stable tie: {ticket_id} keeps urgent arrival order")
            urgent_waiting.remove(ticket_id)
            urgent_streak += 1
        elif ticket_id in ordinary_waiting:
            if urgent_streak >= 2:
                trace.append(f"ordinary guard: {ticket_id} served after two urgent")
            ordinary_waiting.remove(ticket_id)
            urgent_streak = 0
        trace.append(f"served {ticket_id}")
    return trace
