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
    return sorted(values)
```

The engine runs several deterministic cases and reports whether the encounter is cleared.

## Security Note

Player Python runs in a child process with timeout, isolated mode, a minimal environment, and restricted builtins. This is a baseline local safety model, not a complete sandbox for hostile untrusted code.
