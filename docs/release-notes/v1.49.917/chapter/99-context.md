# v1.49.917 — Context

## Milestone metadata

- **Version:** v1.49.917
- **Type:** Counter-cadence (codification + audit-step semantics cleanup)
- **Predecessor:** v1.49.916
- **NASA degree:** 1.178 (unchanged)
- **Counter-cadence count:** 18

## Files changed

- `tools/release-history/refresh.mjs` — removed inert dead branch + false comment; documented `audit` as a fatal load-bearing gate; added a STEPS invariant comment (audit stays last)
- `project-claude/skills/security-hygiene/SKILL.md` (+ installed `.claude/` copy) — #10462 authoring-rule section
- `docs/failure-mode-contracts.md` — cross-ref to #10462
- `tools/render-claude-md/disciplines.json` — #10462 manifest entry (Self-modification safety domain)
- `CLAUDE.md` — regenerated disciplines section (lessons 148 → 149)

## Test posture

- Tools suite: 691 (unchanged — existing tests cover both changes: `refresh-advisory-exit` already asserts audit-is-fatal; `render-claude-md` tests cover the manifest)
- Main suite: 35,562 (unchanged — no `src/` change)

## Engine state at close

- NASA degree 1.178 (135 consecutive ships)
- Counter-cadence count 18
- Manifest: 24 domains, 149 lessons
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0
