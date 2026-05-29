# v1.49.891 — Substrate Auto-Emit: `observation.retention_days` Retention-Sweep Consumer

**Released:** 2026-05-28

Closes the v884 deferred half. New `src/observation/retention-substrate.ts` is the first production caller of `observation.retention_days` — reads the threshold from config, runs `RetentionManager.prune()`, auto-emits an observation-retention event per #10437. Default kind `too_aggressive` (conservative bias toward keeping more data). Mirrors v837 → v846 + v884 → this ship staging cadence. Fifth and closing ship of the v887-v891 multi-ship session.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
