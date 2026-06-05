# Tracked debt: make the retention substrate outcome-driven (audit F4 re-disposition)

**Status:** OPEN — tracked, not yet fixed. **Opened:** 2026-06-05 (Ship 5.1 / D4 design pass).
**Owner gate:** any future bounded-learning calibration-tick milestone (Ship 5.2 / T1.1).

## The defect

The v944 retention auto-emit signal is **degenerate by construction**. On every
session-end sweep the substrate emits a retention event whose `kind` is a
hardcoded constant:

- `src/observation/retention-substrate.ts:108` — `const kind = options.defaultKind ?? 'too_aggressive'` (every sweep, unconditionally).
- `src/bounded-learning/observation-retention-events.ts` — `eventToObservation` reads only `.kind` and **ignores `droppedCount`**, so no automatic path can ever emit `too_lax`.

Verified live during the Ship 5.1 design pass: the **24 real production events on
disk are 100% `too_aggressive`** — one even at `droppedCount: 0`. The signal is
one-way.

## Why this is debt, not a curiosity

The bounded-learning calibration machinery (`src/bounded-learning/calibration-loop.ts`,
`threshold-writer.ts`, `audit-log.ts`) is fully wired, live, and tested, but
`lastTick: null` everywhere — **no threshold has ever moved on real data.**

If a calibration tick were run on the current corpus, the e-process would
mechanically compute an e-value far above the rejection threshold (design pass
reproduced eValue ≈ 8103 ≫ 40) and raise `observation.retention_days` as if it
were *learned evidence*. It would also flip `lastTick` from `null` to non-null —
a **false vindication that is worse than null**, because it silently retires the
audit's own shelfware alarm (the audit F4 "genuine WIRED win" scoring for v944 is
therefore mis-scored).

## The rule (until this is fixed)

1. **Never** run `--apply` on the calibration tick against the current signal.
2. **Never** schedule a recurring/automatic tick on the current signal.
3. Do **not** treat a non-null `lastTick` produced on this corpus as evidence of
   a working learning loop.

## The fix (deferred to Ship 5.2 / T1.1)

Make the retention substrate **outcome-driven** before any tick is meaningful:

1. In `retention-substrate.ts`, derive `kind` from a real outcome — compare the
   sweep's actual `droppedCount` / retained-count against a **target band**
   (e.g. a fraction of `max_entries` utilization, or an age-pressure ratio)
   instead of the hardcoded constant.
2. Thread `droppedCount` (and the retained/target counts) through
   `observation-retention-events.ts` `eventToObservation` so it can emit **both**
   `too_lax` and `too_aggressive`.
3. Only once the on-disk signal is verifiably **bidirectional**, run a single
   **dry-run** tick that produces a non-degenerate audit-log entry; promote to
   operator-gated `--apply` separately.

### Open operator decision (blocks the fix, not this debt entry)

What *is* the correct retention outcome that defines `too_lax` vs `too_aggressive`?
(fraction of `max_entries` utilization, an age-pressure ratio, or something else.)
A seeded dogfood corpus can be gamed, so the band must reflect a defensible target.
This is an operator design decision — settle it before implementing the fix.

## Provenance

- `.planning/IMPLEMENTATION-PLAN-2026-06-03.md` — D4 resolution, 🐛 BUG FOUND note.
- Ship 5.1 / D4 design pass (2026-06-05): calibration was the runner-up; the
  retention fix is its hard pre-req and was tracked here by operator decision so
  it is not silently dropped or "closed" by ticking the degenerate signal.
- Related: `docs/learning-substrate-parked.md` (the D3 control-theory island park).
