# Context — v1.49.779

- **Version:** `v1.49.779`
- **Shipped:** 2026-05-26
- **Branch:** `dev`
- **Tag:** `v1.49.779`
- **Type:** counter-cadence cleanup milestone (NOT a NASA degree advance)
- **Engine state:** UNCHANGED (NASA degree sustains at 1.177)
- **Counter-cadence parents:** v1.49.585 (first); v1.49.776 (second); v1.49.777 (third); v1.49.778 (fourth)
- **Trigger:** Wave 3 of the v1.49.777 risk-tier sweep queue — 5 HIGHs across perf + test quality
- **Phases:** 0 (mission-only retrospective; no GSD phase orchestration)
- **Plans:** 0
- **Prev:** [v1.49.778](../v1.49.778/00-summary.md)
- **Next:** v1.49.780 (NASA 1.178 candidate from v1.177 forward list, OR architecture-cadence pass for Tier E HIGHs)

## Source

Authored in main-context. README.md is the source of truth; chapter directory derived/authored alongside.

## Review findings closed this ship

- **Tier C (performance) HIGH #1** — `src/storage/skill-index.ts:224-243` per-call RegExp compilation in findByTrigger hot path. Module-level `Map<string, RegExp | null>` caches (intent + file-glob).
- **Tier C (performance) HIGH #2** — `src-tauri/src/memory_arena/persistence.rs:217-219` Vec::new() before read_to_end on multi-MB checkpoint. Pre-size from `file.metadata().len()`.
- **Tier D (test quality) HIGH #1** — `src/observation/feedback-bridge.test.ts` 12× `setTimeout(50/100)` flake hazard. `FeedbackBridge.flushPending()` Promise-chain drainage method.
- **Tier D (test quality) HIGH #2** — `src/safety/operation-cooldown.test.ts:59` 150ms real sleep vs 100ms cooldown flake hazard. Pre-expired state-file write pattern.
- **Tier D (test quality) HIGH #3** — `.claude/hooks/gsd-{read,prompt,response}-*` 387 lines of advisory logic with zero tests. 28 sterile-env `.test.sh` cases (8+10+10) + `gsd-read-guard.js` promotion from gitignored runtime location to `project-claude/hooks/` source-of-truth.

## Open queue (deferred to future ships)

- **Tier A MEDIUMs (4)** — re-sweep before next counter-cadence to re-itemize.
- **Tier B MEDIUMs/LOWs (4 + 3)** — same.
- **Tier C MEDIUMs (4) + LOW (1)** — template-render regex, MCP per-call store rebuild, release-history sync I/O, dashboard-bridge linear scan, 1 LOW. Defer to next sweep.
- **Tier D MEDIUMs (3) + LOW (1)** — coverage gaps in `src/dogfood/` (66 source, 0 tests) and 19 CLI commands lacking tests.
- **Tier E architecture HIGHs (3)** — cli.ts dispatcher extraction, Store/Registry/Manager dedup pairs, LoaderContext chokepoint. Separate forward-cadence architecture pass.
- **Tier E MEDIUMs/LOWs (3 + 2)** — defer.

Status of every finding tracked at `.planning/REVIEW-2026-05-26-FULL-CODEBASE.md` (gitignored working-tree ledger). Wave 3 update marks the 5 Tier C+D HIGHs CLOSED.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.
