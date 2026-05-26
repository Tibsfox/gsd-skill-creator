# 99 — Context: v1.49.787 Adoption Telemetry Dashboard + Automation

## Predecessor

**v1.49.786** — Adoption Telemetry: Module-Usage Scanner.
- Tag: `v1.49.786` at SHA `35858ab2d`
- Post-ship RH refresh: SHA `14ba986c4`
- First ship of T1.2 — built the static-analysis scanner that classifies every `src/<module>/` by TS-import-surface adoption. Headline: 41% of modules have zero real callers; Era D substrate is 20 of 33 test-only.

## This milestone's source

`.planning/AUDIT-2026-05-26-core-functions-retrospective.md` §4 Tier 1 item **T1.2 — Wire intrinsic telemetry as adoption surface** (continuation; ship 2 of 2-3).

The v786 retrospective named three follow-ons for ship 2:
1. Dashboard widget + weekly automation (audit ask: "Make adoption observable in `dashboard/`")
2. Allowlist for known-OK isolated modules (e.g., `dogfood`, content clusters)
3. Investigation of `upstream` vs `upstream-intelligence` dual-isolation

v1.49.787 delivers items 1 + 2. Item 3 is partially addressed: both modules are now allowlisted with the reason "Pending operator triage" — the divergence is documented as a known-open question rather than a silent shelfware finding.

## Successor candidates

1. **NASA 1.178 IBEX (strongly recommended)** — engine-state plateau is now **11 ships overdue** (v777-v787). Strongest recommendation from each of the v785/v786/v787 retrospectives.
2. v1.49.788 — T1.2 ship 3 of 2-3: first shelfware verdict. Pick a striking test-only module (likely from Math Foundations Refresh's 6/6 test-only set: coherent-functors, semantic-channel, koopman-memory, hourglass-persistence, wasserstein-hebbian, tonnetz) and either wire it into a real call site OR formally retire it.
3. v1.49.789 — T1.1 ship 1/4-6: bounded-learning calibration loop first threshold change with evidence.
4. v1.49.790 — Likely codification ship (5 candidate lessons backlog: #10417, #10418, #10419, #10420, #10421).

## Branch state pre-ship

- `dev` = `origin/dev` = `origin/main` = `14ba986c4` (0-commit drift post-v786)
- Working tree: `dashboard/index.html` modified (auto-regen leave-alone), `dashboard/adoption.html` NEW (gitignored), `.learn-staging/` + `graphify-out/` untracked
- `.planning/STATE.md` clean (post-v786 hand-author)
- `.planning/PROJECT.md` clean (post-v786 update)

## Engine state baseline (carried forward)

- NASA degree: **1.177** (unchanged; **11 consecutive ships at this level** v777-v787)
- MUS / ELC / SPS / TRS: SCAFFOLD-PENDING continued
- §6.6 register: unchanged (no §6.6 events this ship)
- Counter-cadence count: 5 (unchanged — v585, v776, v777, v778, v779; v787 is audit-driven, not classical counter-cadence)

## Allowlist summary

10 modules allowlisted with provenance metadata:

| Module | Reason class |
|---|---|
| `dogfood` | Test fixture corpus |
| `holomorphic` | Content cluster (PROJECT.md GAP-3 intentional) |
| `initialization` | CLI-only consumed (shell-spawn, not TS import) |
| `interpreter` | CLI-only consumed (filesystem hand-off) |
| `mathematical-foundations` | Namespace placeholder; implementation siblings tracked individually |
| `retro` | CLI-only consumed |
| `settings` | Dynamic require() pattern |
| `styles` | Build-pipeline consumed |
| `upstream` | Pending operator triage |
| `upstream-intelligence` | Pending operator triage |

## Files committed this ship

| Path | Status | Notes |
|---|---|---|
| `tools/adoption-scan.allowlist.json` | NEW | 10 entries with reasons |
| `tools/adoption-scan.mjs` | MODIFIED | Allowlist loading + drain-on-exit fix |
| `tools/render-adoption-dashboard.mjs` | NEW | 233 lines |
| `tools/adoption-refresh.mjs` | NEW | 215 lines |
| `tools/__tests__/adoption-scan.test.mjs` | MODIFIED | 11 → 16 tests |
| `tools/__tests__/adoption-refresh.test.mjs` | NEW | 8 tests |
| `vitest.tools.config.mjs` | MODIFIED | +1 entry |
| `package.json` | MODIFIED | +2 npm scripts |
| `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` | MODIFIED | version bump |
| `docs/ADOPTION-BASELINE-v1.49.787.md` | NEW | refreshed baseline (180 lines, with allowlist sections) |
| `docs/ADOPTION-BASELINE-v1.49.787.json` | NEW | JSON snapshot for v788+ diff |
| `docs/release-notes/v1.49.787/{README, chapter/00-summary, chapter/03-retrospective, chapter/04-lessons, chapter/99-context}.md` | NEW | 5-file release notes |
| `docs/release-notes/STORY.md` | MODIFIED | v787 entry appended |
| `docs/RELEASE-HISTORY.md` | MODIFIED | v787 row added (post-ship RH refresh) |

Working-tree only (NOT committed):
- `.planning/AUDIT-2026-05-26-core-functions-retrospective.md` (Tier 1 source)
- `.planning/audit-2026-05-26/era-{A,B,C,D,E}-*.md` (per-era notes)
- `.planning/STATE.md` (will be hand-authored to v787 state post-ship)
- `.planning/PROJECT.md` (will be updated to reference v787 as Active milestone)
- `dashboard/adoption.html` (gitignored auto-regen sibling)

## Test count delta

- v786 close: 30,817 passing
- v787 add: 16 adoption-scan tests (5 new) + 8 adoption-refresh tests (8 new) = +13 net
- Expected v787 close: 30,830 passing

## Three-ship Tier 1 audit cluster

This completes a three-ship Tier 1 cluster sourced from a single multi-agent audit:
- **v1.49.785** PROJECT.md normalizer + GAP refresh (T1.4 + S5)
- **v1.49.786** Module-usage scanner (T1.2 ship 1/2-3)
- **v1.49.787** Dashboard + automation + allowlist (T1.2 ship 2/2-3)

Total wall-clock: ~6-7h across 3 ships. Audit deliverable persists at `.planning/AUDIT-2026-05-26-core-functions-retrospective.md`. The Tier 1 roadmap continues at ship 4 (T1.2 ship 3/3 — first shelfware verdict) unless engine-state advance is taken first.
