# Context — v1.49.778

- **Version:** `v1.49.778`
- **Shipped:** 2026-05-26
- **Branch:** `dev`
- **Tag:** `v1.49.778`
- **Type:** counter-cadence cleanup milestone (NOT a NASA degree advance)
- **Engine state:** UNCHANGED (NASA degree sustains at 1.177)
- **Counter-cadence parents:** v1.49.585 (first); v1.49.776 (second); v1.49.777 (third)
- **Trigger:** Wave 2 of the v1.49.777 risk-tier sweep queue — 10 HIGHs across security + correctness
- **Phases:** 0 (mission-only retrospective; no GSD phase orchestration)
- **Plans:** 0
- **Prev:** [v1.49.777](../v1.49.777/00-summary.md)
- **Next:** v1.49.779 (NASA 1.178 candidate selection from v1.177 forward list, OR Wave 3 perf/test counter-cadence)

## Source

Authored in main-context. README.md is the source of truth; chapter directory derived/authored alongside.

## Review findings closed this ship

- **Tier A (security) HIGH #1** — `src-tauri/src/commands/pty.rs::pty_open` accepted arbitrary shell + args from webview (CWE-77). Basename allowlist.
- **Tier A (security) HIGH #2** — `src-tauri/src/commands/dashboard.rs::generate_dashboard` JS injection + path traversal via unquoted `page` interpolation (CWE-94). Slug validation + `serde_json::to_string`.
- **Tier A (security) HIGH #3** — `scripts/serve-dashboard.mjs:2163` + `src/console/helper.ts:90` bound `0.0.0.0` with CORS `*` on state-changing endpoint. 127.0.0.1 bind + same-origin Origin check.
- **Tier A (security) HIGH #4** — `project-claude/hooks/self-mod-guard.js` + `git-add-blocker.js` fail-open on malformed input. Fail-closed default with env-var override respect.
- **Tier B (correctness) HIGH #1** — `src/intelligence/analyzer/walk.ts:164-189` FD leak on read failure.
- **Tier B (correctness) HIGH #2** — `src/branches/commit.ts:157-164` FD + lock-file leak on writeFile failure.
- **Tier B (correctness) HIGH #3** — `src/intelligence/kb/snapshots.ts:116,164-169` + `src/intelligence/kb/meetings.ts:280` unhandled JSON.parse throw on malformed rows. `safeJsonParse<T>` helper + try/catch.
- **Tier B (correctness) HIGH #4** — `src-tauri/src/memory_arena/arena.rs:171,274,352` panic-on-multiply-overflow in functions returning `ArenaResult`. New `ArenaError::ArithmeticOverflow` variant.
- **Tier B (correctness) HIGH #5** — `src/dependency-resolver/manifest-patcher.ts` 9 regex-interpolation sites missing escapeRegExp. Centralized helper.
- **Tier B (correctness) HIGH #6** — `src-tauri/src/mcp_host/commands.rs:51-61` `unsafe { &*ptr }` borrow-checker workaround. Destructure-into-fields.

## Open queue (deferred to future ships)

- **Tier A MEDIUMs (4)** — re-sweep before next counter-cadence to re-itemize.
- **Tier B MEDIUMs/LOWs (4 + 3)** — same.
- **Tier C performance HIGHs (2)** — skill-index regex cache, VRAM read_to_end pre-sizing. Wave 3 candidate.
- **Tier D test-quality HIGHs (3)** — feedback-bridge + operation-cooldown fake-timer fixes, 3 untested `.claude/hooks/` scripts. Wave 3 candidate.
- **Tier E architecture HIGHs (3)** — cli.ts dispatcher extraction, Store/Registry/Manager dedup, LoaderContext chokepoint. Separate forward-cadence pass.

Status of every finding tracked at `.planning/REVIEW-2026-05-26-FULL-CODEBASE.md` (gitignored working-tree ledger).

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.
