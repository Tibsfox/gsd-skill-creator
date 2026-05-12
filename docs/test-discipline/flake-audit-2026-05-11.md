# Pre-Emptive Flake Audit — 2026-05-11

**Origin:** v1.49.638 Cluster #5 C5 W1C
**Spec:** `.planning/missions/v1-49-638-housekeeping-cluster-5/components/05-pre-emptive-flake-audit.md`
**Discipline base:** `.planning/test-discipline/perf-assertion-warmup.md`
**Driver:** Reactive ship-time stabilization pattern (v1.49.636: 2, v1.49.637: 3) — invest preventively to push toward ≤1/ship.

---

## Stage 1 — Enumeration

### Method

1. `git log --since='2026-03-01' --grep='stabilize|hookTimeout|threshold|flake|warmup'` → identify all stabilization commits across the corpus.
2. `git show --name-only` per commit → tally per-file frequency.
3. Cross-reference with current state: which sites are hardened (warmup applied, hookTimeout bumped, rowid tiebreaker added) vs which still have the pattern unaddressed.
4. Scan the v1.49.637 fix companions (snapshot-lifecycle hookTimeout + listMeetings rowid) for sibling sites carrying the same risk.

### Historical stabilization frequency (since 2026-03-01)

```
3  src/intelligence/analyzer/__tests__/performance.test.ts        [hardened: warmup×5 + threshold 200→300ms]
2  tools/nasa-smoke/runner.spec.ts                                [hardened: perf budget widened]
2  tests/integration/v1-49-635-meta-test.test.ts                  [hardened: skip-guard + assertion sync]
2  src/umwelt/__tests__/freeEnergy.test.ts                        [hardened: warmup applied]
2  src/memory/__tests__/m2-short-term.test.ts                     [hardened: warmup applied]
2  src/intelligence/kb/__tests__/snapshot-manager.test.ts         [partial: T4 warmup, but listSnapshots ORDER vulnerable]
2  src/intelligence/kb/__tests__/atlas-event-invalidation.test.ts [hardened: hookTimeout 30000ms]
2  src/intelligence/atlas-indexer/__tests__/runner.test.ts        [hardened: hookTimeout 60s]
2  browser-tab-parity.test.ts                                     [hardened: hookTimeout 60s]
```

Recent ship-time stabilizations (v1.49.636 + v1.49.637):
- `src/plane/activation.integration.test.ts` (perf)
- `src/intelligence/meetings/__tests__/update-outcome.test.ts` (latency)
- `tests/integration/v1-49-635-meta-test.test.ts` (regex)
- `src/intelligence/kb/__tests__/snapshot-lifecycle.test.ts` (hookTimeout 10s → 30s)
- `src/intelligence/kb/store.ts:558` (listMeetings rowid tiebreaker — production fix bridging test flake)

### Companion-site scan (high-signal, the v1.49.637 fix pattern projected)

**Pattern A: KB store ORDER BY without rowid tiebreaker** (mirrors listMeetings flake)

`grep 'ORDER BY' src/intelligence/kb/store.ts` returns these production sites that DO NOT have a deterministic rowid tiebreaker:

| Line | Query | Test exposure | Same-ms risk |
|---|---|---|---|
| 301 | `SELECT * FROM projects ORDER BY ${orderBy}` | projects.test.ts (16 registry calls) | LOW — orderBy is param-controlled |
| 357 | `briefings ORDER BY generated_at DESC LIMIT 1` | auxiliary.test.ts T:getCurrentBriefing-most-recent | **HIGH** — test creates 2+ briefings in tight loop |
| 866 | `b.emitted_at DESC` | listFindings (perf-bench.test.ts hot path) | MED |
| 911 | `meeting_log ... recorded_at ASC` | meeting-store.test.ts | MED |
| 938 | `taken_at DESC` (snapshots) | snapshot-manager.test.ts T2 listSnapshots-DESC-order | **HIGH** — test deletes-and-relists |
| 1136 | `started_at DESC LIMIT 1` | (latest meeting accessor) | LOW — LIMIT 1 is mostly invariant under tie |

**Pattern B: KBStore-backed test with async beforeEach + no hookTimeout protection** (mirrors snapshot-lifecycle hookTimeout flake)

`grep -L hookTimeout src/intelligence/kb/__tests__/*.test.ts` with `beforeEach(async`:

| File | KBStore | registry-calls | Risk |
|---|---|---|---|
| auxiliary.test.ts | 1 | 3 | MED |
| findings.test.ts | 1 | 3 | MED |
| meeting-store.test.ts | 2 | 4 | MED |
| phase-827-extensions.test.ts | 1 | 3 | MED |
| projects.test.ts | 1 | 16 | **HIGH** — heaviest registry load |
| snapshot-manager.test.ts | 1 | 4 | MED |
| state-machine.test.ts | 1 | 3 | MED |

7 KBStore tests carry the same shape as snapshot-lifecycle did before v1.49.637 fix. Under full-suite I/O contention any of them could timeout at the default 10s vitest hook ceiling.

### Top-N enumeration (priority ranking)

1. **`kb/store.ts:357` `getCurrentBriefing` ORDER BY without rowid tiebreaker** — Test `auxiliary.test.ts:94` creates 2 briefings then asserts the second-inserted is current; same-millisecond tie → flake. Production fix mirrors listMeetings.
2. **`kb/store.ts:938` snapshots `taken_at DESC` without rowid tiebreaker** — `snapshot-manager.test.ts:114` T2 inserts N snapshots then asserts DESC order; same-millisecond tie → flake. Production fix mirrors listMeetings.
3. **`projects.test.ts` hookTimeout** — heaviest registry pattern (16 calls) without timeout protection; full-suite I/O contention risk highest in this set.
4. **`meeting-store.test.ts` hookTimeout** — 4 registry calls, mirrors snapshot-lifecycle pattern directly (meeting-domain heavy migrations).
5. **`snapshot-manager.test.ts` hookTimeout** — already partial (T4 warmup landed in `dc2303dbd`); apply the matching `vi.setConfig({ hookTimeout: 30000 })` to close the symmetry with snapshot-lifecycle.

**Stage-1 result: N = 5 critical sites. Operator-decision NOT triggered (N ≤ 5).** Proceeding through Stage 2/3.

---

## Stage 2 — Classification

| # | Site | profile | failure-mode | recommended-fix | priority |
|---|---|---|---|---|---|
| 1 | `kb/store.ts:357 getCurrentBriefing ORDER BY` | native-module-backed (sqlite) | ordering (same-ms tie) | production rowid tiebreaker | top-N |
| 2 | `kb/store.ts:938 snapshots ORDER BY taken_at` | native-module-backed (sqlite) | ordering (same-ms tie) | production rowid tiebreaker | top-N |
| 3 | `kb/__tests__/projects.test.ts` beforeEach | native-module-backed (sqlite) | hookTimeout | `vi.setConfig({ hookTimeout: 30000 })` | top-N |
| 4 | `kb/__tests__/meeting-store.test.ts` beforeEach | native-module-backed (sqlite) | hookTimeout | `vi.setConfig({ hookTimeout: 30000 })` | top-N |
| 5 | `kb/__tests__/snapshot-manager.test.ts` beforeEach | native-module-backed (sqlite) | hookTimeout | `vi.setConfig({ hookTimeout: 30000 })` | top-N |

Deferred to Cluster #6 (informational, not critical):
- `kb/store.ts:301 projects ORDER BY ${orderBy}` — param-controlled, not tied to a flaky test today
- `kb/store.ts:866 listFindings b.emitted_at` — MED risk; perf-bench already warms cache
- `kb/store.ts:911 meeting_log recorded_at ASC` — MED risk; no current flake history
- `auxiliary.test.ts / findings.test.ts / phase-827-extensions.test.ts / state-machine.test.ts` hookTimeout — MED risk; defer until full-suite jitter surfaces them

**Common pattern across all 5:** native-module-backed (better-sqlite3) tests under v1.49.637+ full-suite I/O contention. The two production rowid fixes both improve human-visible determinism *and* eliminate test flake source. The three hookTimeout fixes preserve test invariants while absorbing jitter under load.

### Stage 2 acceptance check

- All 5 sites have an assigned profile / failure-mode / recommended-fix.
- Each recommended-fix matches a pattern documented at `.planning/test-discipline/perf-assertion-warmup.md` or precedent commits (`fcaacf057` listMeetings rowid tiebreaker, `8cac9eff7` snapshot-lifecycle hookTimeout 30000ms).
- No new substrate findings surfaced during classification.
- Pre-Stage-3 invariant: baseline test posture inherited from v1.49.637 ship-tip (green at `5e270a905`).

---

## Stage 3 — Apply targeted fixes

Each fix verified by running its target test file in isolation; full-suite verification noted at end.

### Fixes applied

| Site | Commit | Verification |
|---|---|---|
| `kb/store.ts:357` `getCurrentBriefing` ORDER BY rowid tiebreaker | `97a5ce3cf` | `auxiliary.test.ts` PASS |
| `kb/store.ts:938` snapshots `taken_at` ORDER BY rowid tiebreaker | `deff7f9cd` | `snapshot-manager.test.ts` PASS |
| `projects.test.ts` beforeEach hookTimeout 30000ms | `6d1282c64` | 6/6 PASS |
| `findings.test.ts` beforeEach hookTimeout 30000ms (escalated from MED) | `6d1282c64` | 7/7 PASS |

**Total: 4 fixes applied across 4 commits.**

### Stage 2 corrections (discovered during Stage 3 execution)

Two top-N sites turned out to be **already protected** — Stage 2 claims were wrong:

- **`snapshot-manager.test.ts` hookTimeout** — claim at line 77 said "apply the matching `vi.setConfig({ hookTimeout: 30000 })`". On Stage 3 inspection: file's beforeEach already carries `}, 30000);` at the equivalent position. No-op.
- **`meeting-store.test.ts` hookTimeout** — Stage 2 table row claimed unprotected. Verified at line 55: `}, 30000);` already present. No-op.

Stage 2 enumeration method (grep `-L hookTimeout` on test files) generated false positives for these two: the hookTimeout is applied as a 2nd-arg to `beforeEach`, NOT via `vi.setConfig`, so `grep -L hookTimeout` returned files that DID have hookTimeout via the inline pattern. Method correction for future audits: also grep for `}, \d{4,6}\);` patterns adjacent to `beforeEach`/`beforeAll`.

### Stage 3 escalation (discovered during fix attempt)

- **`findings.test.ts` beforeEach hookTimeout** — Stage 1 ranked this MED-risk (line 62 table); was not in Stage 2 top-N. During Stage 3 verification of the `projects.test.ts` pattern, inspection revealed `findings.test.ts` had the identical unprotected pattern. Fix applied in same commit as `projects.test.ts` (`6d1282c64`).

### Net Stage 3 vs Stage 2 reconciliation

| Stage 2 top-N | Actual outcome |
|---|---|
| 1. `getCurrentBriefing` ORDER BY | FIXED `97a5ce3cf` |
| 2. snapshots `taken_at` ORDER BY | FIXED `deff7f9cd` |
| 3. `projects.test.ts` hookTimeout | FIXED `6d1282c64` |
| 4. `meeting-store.test.ts` hookTimeout | NO-OP (already protected) |
| 5. `snapshot-manager.test.ts` hookTimeout | NO-OP (already protected) |
| (escalation) `findings.test.ts` hookTimeout | FIXED `6d1282c64` |

3 of 5 top-N sites had real fixes (60% hit rate). 2 false positives from Stage 2 grep method. 1 escalation from MED tier.

### Forward observations

- **Substrate-probe discipline lesson:** Stage 2 should have invoked `read` + `grep '}, [0-9]\{4,\}'` cross-check on each candidate before classifying as needing the fix. The `grep -L hookTimeout` method matched only the `vi.setConfig` form, not the inline 2nd-arg form. Recommend audit method update at next iteration (carry-forward to Cluster #6 or absorbed into `docs/SUBSTRATE-PROBE-DISCIPLINE.md` v2).
- **Pre-existing flake risk reduced:** 2 production-code ORDER BY tiebreakers + 2 test-side hookTimeout protections now in place. v1.49.638 ship-tip should not surface the listMeetings / snapshot-lifecycle-class flakes that hit v1.49.637 ship-time.
