## SHOULD trigger

- "skill-integration flagged that I keep doing FTP pre-flight → sync → verify across the last 4 sessions; induce a skill spec from those traces." — Confirmed ≥3-session recurrence plus captured traces; exactly the induction step that feeds skill-forge.
- "Read the `.planning/patterns/` traces for the refinery-merge conflict-handling pattern and turn them into a structured spec I can hand to skill-forge." — Trace evidence present and the ask is spec-out (workflow + semantics + runtime attachments), not a finished SKILL.md.
- "We have session-retro logs of the NASA ship sequence repeating; decompose them into a candidate skill unit with its verification and rollback attachments." — Segment-then-decompose over captured traces is this skill's core job.

## SHOULD NOT trigger

- "Scaffold and author a new SKILL.md for FTP sync and ship it." — Authoring/shipping is skill-forge's job downstream; no trace segmentation requested.
- "Should I keep or retire the existing publish-pipeline skill?" — Keep/repair/retire on an existing skill is skill-causal-curation, not induction from traces.
- "I did this task once today — make it a skill." — Single session, no repetition; below the ≥3-session recurrence floor, so there is no reusable unit to induce (skip).
