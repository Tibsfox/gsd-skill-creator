# Session Observation Patterns -- Full Reference

## Observation Taxonomy

What to watch for during sessions, ranked by signal strength:

| Signal | Strength | Example |
|--------|----------|---------|
| User corrects output | HIGHEST | User says "no, use X instead of Y" -- direct refinement signal |
| Repeated tool sequence | HIGH | Same 4-step tool chain used 3+ times across sessions |
| File touch patterns | MEDIUM | Same 5 files modified every time a specific phase type runs |
| Post-failure commands | MEDIUM | Same recovery steps after test failures |
| Phase outcomes | LOW | Success/failure rates (useful in aggregate, noisy individually) |

## JSONL Schema

Records written to `.planning/patterns/sessions.jsonl`:

```json
{
  "timestamp": "ISO-8601",
  "session_id": "string",
  "type": "correction|tool_sequence|file_pattern|post_failure|phase_outcome",
  "signal_strength": "highest|high|medium|low",
  "context": {
    "phase": "optional phase number",
    "task": "optional task description",
    "gsd_command": "optional /gsd: command"
  },
  "observation": "string -- what was observed",
  "correction_from": "optional -- what Claude did wrong",
  "correction_to": "optional -- what user wanted instead"
}
```

## Pattern vs Noise

Guidelines for distinguishing actionable patterns from noise:

- 1 occurrence = noise (note but do not flag)
- 2 occurrences = possible pattern (note with context)
- 3+ occurrences = actionable pattern (suggest skill creation)
- Cross-session repetition is stronger signal than within-session
- User corrections are always signal, never noise

## Recording Protocol

- Check if `.planning/patterns/` exists before writing
- Append-only to `sessions.jsonl` (never overwrite)
- Validate entries on read (data poisoning defense)
- One JSON object per line, no trailing commas
- Privacy: this file should be in `.gitignore` for shared repos
