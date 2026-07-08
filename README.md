# Algorithimia

Algorithimia is a DSA programming RPG. The current build is a terminal-first prototype with one Python encounter.

## Run

```powershell
python -m algorithimia
```

On Windows installations that use the Python launcher:

```powershell
py -m algorithimia
```

## Test

```powershell
python -m unittest
```

Or:

```powershell
py -m unittest
```

## First Encounter Contract

The player submits Python that defines:

```python
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
```

The engine runs several deterministic cases and reports whether the encounter is cleared.
The Sorting Slime encounter rejects `sorted(...)` and `.sort()` so the player demonstrates visible sorting logic.

## Security Note

Player Python runs in a child process with timeout, isolated mode, a minimal environment, and restricted builtins. This is a baseline local safety model, not a complete sandbox for hostile untrusted code.
