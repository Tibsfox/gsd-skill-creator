# gsd-debug-session-team

Drive a scientific-method debug session. Debugger owns the hypothesis loop, executor runs experiments, verifier confirms the fix delivers the original phase goal without regressing it. Closes by writing a DebugSession record into grove.

**Roster:** `gsd-capcom`, `gsd-debugger`, `gsd-executor`, `gsd-verifier`.

**Use when:** investigating a bug, regression, or failing verification
