# session-handoff

Produce clean session handoffs via `/gsd session-report`, `/gsd note`, `/gsd pause-work`, `/gsd resume-work`, and `/gsd thread`. Each handoff writes a SessionReport record into grove so the next session — human or agent — can resume without re-reading the conversation history.

**Triggers:** `session report`, `pause work`, `resume work`, `thread`, `gsd note`, `handoff`, `session boundary`

**Affinity:** `gsd-capcom`
