SHOULD trigger:
- "Clean up the skills directory." — "clean up" maps to retire vs reformat vs dedupe, three different artifacts touching shared `.claude/skills/` state; ask one targeted question.
- "Record what we just decided." — record-where diverges (MEMORY.md vs Grove vs a phase artifact) and one target is `never-surface`-adjacent sensitive memory; hard-ask override applies.
- "Sync this to main before I log off." — candidate goals (merge dev→main vs push a branch vs open a PR) diverge on an irreversible shared-repo action; fail closed and ask.

SHOULD NOT trigger:
- "Fix the typo in line 42 of README." — single plausible goal, one reversible edit; proceed, no question.
- "Run npm test and tell me if it passes." — only one reading, read-only, data-neutral; act on the modal goal directly.
- Already inside gsd-spec-phase clarifying a phase deliverable — spec-phase owns ambiguity there; do not double-gate.
