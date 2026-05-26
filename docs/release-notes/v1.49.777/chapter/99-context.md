# Context — v1.49.777

- **Version:** `v1.49.777`
- **Shipped:** 2026-05-26
- **Branch:** `dev`
- **Tag:** `v1.49.777`
- **Type:** counter-cadence cleanup milestone (NOT a NASA degree advance)
- **Engine state:** UNCHANGED (NASA degree sustains at 1.177)
- **Counter-cadence parent:** v1.49.585 (first); v1.49.776 (second)
- **Trigger:** full-codebase risk-tier sweep surfacing 4 BLOCKERs (2 security + 2 correctness)
- **Phases:** 0 (mission-only retrospective; no GSD phase orchestration)
- **Plans:** 0
- **Prev:** [v1.49.776](../v1.49.776/00-summary.md)
- **Next:** v1.49.778 (NASA 1.178 candidate selection from v1.177 forward list, OR Wave 2 review-HIGH counter-cadence)

## Source

Authored in main-context. README.md is the source of truth; chapter directory derived/authored alongside.

## Review findings closed this ship

- **Tier A (security) BLOCKER #1** — `src/learn/acquirer.ts` shell injection × 8 (CWE-78)
- **Tier A (security) BLOCKER #2** — `src/chipset/blitter/executor.ts` RCE-by-design via 'custom' scriptType
- **Tier B (correctness) BLOCKER #1** — write-queue self-poisoning in 10 sibling JSONL stores (14 sites)
- **Tier B (correctness) BLOCKER #2** — VRAM `PinnedBuffer::drop` UB on Drop-strategy ambiguity

## Wave 2 candidates (queued for future counter-cadence)

- 4 Tier A HIGH: Tauri command validation (pty_open, generate_dashboard), dashboard 0.0.0.0 + CORS *, self-mod-guard fail-open
- 6 Tier B HIGH: FD leaks (walk.ts, branches/commit.ts), JSON.parse defense (intelligence/kb), arena overflow expect→ArenaError, manifest-patcher escapeRegExp, mcp_host unsafe ptr
- 2 Tier C HIGH: skill-index regex cache, VRAM read_to_end pre-sizing
- 3 Tier D HIGH: fake-timer fixes for feedback-bridge + operation-cooldown, untested .claude/hooks/ scripts (3 files)
- 3 Tier E HIGH: cli.ts dispatcher extraction, Store/Registry dedup pairs, LoaderContext chokepoint

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.
