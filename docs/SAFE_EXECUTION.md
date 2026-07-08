# Safe Execution Notes

The first Python adapter is a baseline local guard, not a complete hostile-code sandbox.

Current controls:

- child process execution
- isolated Python mode (`-I`)
- per-case timeout
- temporary working directory
- minimal environment
- restricted builtins for player code
- preflight rejection of disallowed sorting helpers for the current DSA encounter
- JSON-only input/output

Known gaps:

- no OS-level syscall, CPU, or memory isolation
- no container or job-object limit
- no durable audit log for submissions
- no multi-language runner contract yet

Before accepting public arbitrary code, replace this adapter boundary with OS-level isolation and resource limits.
