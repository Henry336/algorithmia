from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class EncounterCase:
    name: str
    input_values: tuple[int, ...]
    expected: tuple[int, ...]


@dataclass(frozen=True)
class Encounter:
    slug: str
    title: str
    prompt: str
    cases: tuple[EncounterCase, ...]


SORTING_SLIME = Encounter(
    slug="sorting_slime",
    title="Sorting Slime",
    prompt=(
        "A slime blocks the archive stairs. Define solve(values) so the runes are returned "
        "from smallest to largest."
    ),
    cases=(
        EncounterCase("mixed_runes", (5, 1, 4, 2), (1, 2, 4, 5)),
        EncounterCase("already_ordered", (1, 2, 3), (1, 2, 3)),
        EncounterCase("duplicates", (3, 1, 3, 2), (1, 2, 3, 3)),
        EncounterCase("empty", (), ()),
    ),
)

ENCOUNTERS = {SORTING_SLIME.slug: SORTING_SLIME}


def get_encounter(slug: str) -> Encounter:
    try:
        return ENCOUNTERS[slug]
    except KeyError as exc:
        raise ValueError(f"Unknown encounter: {slug}") from exc

