# v1.49.816 — Context

## Provenance

- **Source:** v1.49.815 retrospective and handoff (`.planning/HANDOFF-2026-05-27-v1.49.815-t2.3-high-01-pmtiles-refcount-shipped.md`) flagged the `state-md-set-shipped.mjs` milestone_name colon-quote footgun as a 1-line tool fix worth a future ship. Operator selected the v816-822 7-item chain at session-start; ordered logically with this fix at position #1 (lightest item, removes a footgun the rest of the chain might re-hit).
- **Trigger:** Operator-driven; first ship of the chain.
- **Predecessor ship:** v1.49.815 (T2.3 Wedge Close: PMTiles Refcounted Archive Close (HIGH-01)); shipped 2026-05-27 ~09:21 UTC.
- **Session boundary:** Chain-mode (single session-retro mission `v816-822-chain-5-2-3-4-8-6-9-mixed-consume-codify` spans all 7 ships).

## Why this ordering for the chain

Operator picked the "logical" ordering over "as listed in v815 handoff" or "fastest-first":

1. **v816** state-md-set-shipped YAML-fix (this ship) — front-loaded so subsequent chain ships don't hit the colon-workaround.
2. **v817** c12-load-kb-context flake fix — diagnostic-heavy, best done with fresh context.
3. **v818** FlagLookup discriminated union extract — straightforward registry refactor.
4. **v819** aminet batch chip ProcessContext (5 files) — batch chip pattern.
5. **v820** First git/core ProcessContext chip (1 of 4 siblings) — pairs naturally with v819 as ProcessContext family work.
6. **v821-822** Discipline-coverage gate WARN→BLOCK (audit-sized 2 ships).
7. **v823** T1.3 Ship 2 — ObservationBridge wire (last because it's the largest single item at ~55 min).

The pairing (#4 + #5) and the front-loaded chip (#1) are the load-bearing ordering decisions. The rest is sequence-independent.

## What `yamlScalar` does

```js
function yamlScalar(value) {
  return jsYaml.dump(value, { lineWidth: -1 }).trimEnd();
}
```

For `'Post-T14-reset STATE.md drift closure'` (safe), returns `'Post-T14-reset STATE.md drift closure'` (unquoted). For `'T2.3 Wedge Close: PMTiles Refcounted Archive Close (HIGH-01)'` (colon-containing), returns `"'T2.3 Wedge Close: PMTiles Refcounted Archive Close (HIGH-01)'"` (single-quoted). The `lineWidth: -1` option suppresses line-wrapping so long values stay on one line.

The helper is intentionally inline. Per #10416 lightest-wire: 3 LOC + 1 instance. Per #10426: extract at 2nd instance.

## Why `--check` reads on-disk lastUpdated

The `--check` flag exists to answer: "is the file at canonical shape for this milestone?" The canonical shape includes a `last_updated` timestamp recorded at write-time. Re-computing the timestamp at `--check` time would compare against the wall-clock NOW, not the recorded write-time. The fix:

```js
const lastUpdatedMatch = current.match(/^last_updated:\s*"([^"]+)"/m);
const desiredCheck = buildShippedStateContent({
  ...a,
  lastUpdated: lastUpdatedMatch ? lastUpdatedMatch[1] : undefined,
});
```

If the on-disk file is missing `last_updated` (legacy STATE.md), `lastUpdatedMatch` is null and `buildShippedStateContent` falls back to the default (current wall-clock). In that case `--check` will report drift, which is the correct outcome: the file isn't at canonical shape (missing `last_updated`).

## Test design

Two new unit tests + one structural-flake-fix on the existing E2E test.

**Test 1: `YAML-quotes milestone_name when it contains a colon`** — calls `buildShippedStateContent({ name: 'T2.3 Wedge Close: PMTiles ...' })` and asserts the output string contains the quoted form `milestone_name: 'T2.3 Wedge Close: ...'`. Direct string-shape assertion; fastest to read and write.

**Test 2: `round-trips colon-containing milestone_name through js-yaml parser`** — extracts the frontmatter block via regex, runs `jsYaml.load` on it, asserts `parsed.milestone_name` equals the original string byte-for-byte. This catches parser-disagreement risks: even if the output LOOKS correct, the proof of correctness is that a YAML parser reads it back unchanged.

**Existing E2E test fix** — no test code change; the tool's `--check` fix removes the timestamp-drift flake.

## Engine state crossover

NASA degree sustains at **1.178** for the 34th consecutive ship. Counter-cadence count UNCHANGED at 6 (chip-shaped tool fix is not counter-cadence per #10430; counter-cadence count is reserved for milestone-shaped non-degree-advancing work).

The codify ⟂ consume ⟂ calibrate ⟂ observe quadrant:
- **Codify:** N/A this ship (no lesson promotions; 2 candidates remain eligible for next codify ship).
- **Consume:** partial — closes 1 footgun from the v815 carry-forward list.
- **Calibrate:** N/A this ship.
- **Observe:** the new unit tests are explicit observability for the colon-safe + round-trip properties.

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.815-t2.3-high-01-pmtiles-refcount-shipped.md` for:
- The v815 wall-clock breakdown (~38 min) and the in-flight discovery of the colon-quote footgun.
- The "Highest-ROI next ship candidates" list that included this fix as item #5 (~10-15 min).
- The pre-existing untracked working-tree noise carried forward: `dashboard/index.html` (M), `.learn-staging/`, `dashboard/adoption.html`, `graphify-out/`.

## Forward path post-v816

The chain continues to v817 (c12-load-kb-context flake fix) next. Estimated chain wall-clock remaining: ~3-4 hours across 7 more ships (v817-823).

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- v816 used the v813-shipped atomic-writer (`tools/state-md-set-shipped.mjs`) for STATE.md reset, after the THIS-SHIP fix to the colon-quote footgun was applied. Recursive application: the tool's first use post-fix is its own ship.
