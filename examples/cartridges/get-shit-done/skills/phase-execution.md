# phase-execution

Execute a phase plan end-to-end via `/gsd execute-phase`, `/gsd do`, `/gsd quick`, `/gsd fast`, `/gsd next`, and `/gsd autonomous`. Runs atomic wave commits, handles deviation escalation, writes checkpoint state into grove, and honors the files-modified contract from the plan. This is the hands-on-keyboard surface for GSD work.

**Triggers:** `execute phase`, `gsd do`, `gsd next`, `gsd quick`, `gsd fast`, `run phase`, `wave commit`, `autonomous execution`

**Affinity:** `gsd-capcom`, `gsd-executor`
