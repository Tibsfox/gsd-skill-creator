> Following v1.49.815 — _T2.3 Wedge Close: PMTiles Refcounted Archive Close (HIGH-01)_, v1.49.816 opens the v816-822 chain (7 items: 5 → 2 → 3 → 4 → 8 → 6a+6b → 9) with the v815-flagged 1-line tool footgun: `tools/state-md-set-shipped.mjs` was interpolating `milestone_name: ${name}` unquoted, breaking the YAML round-trip when name contained a colon. Closure: route the value through js-yaml's `dump` for auto-quoting + parse-back round-trip test + opportunistic close of a pre-existing timestamp-drift flake in the tool's own `--check` path.

# v1.49.816 — Counter-cadence Chip: `state-md-set-shipped` Colon-safe milestone_name + `--check` Time-determinism

**Shipped:** 2026-05-27

First ship of the v816-822 chain. Closes the lightest-weight item surfaced by v815: the atomic-writer's milestone_name field broke YAML when the value contained a colon (worked around in v815 by stripping the colon — `T2.3 Wedge Close: PMTiles ...` → `T2.3 Wedge Close PMTiles ...`). The hand-built template `milestone_name: ${name}` is replaced with `milestone_name: ${yamlScalar(name)}`, where `yamlScalar` is a 3-line helper that delegates to `js-yaml.dump`. Safe strings stay unquoted (existing test fixture unchanged); colon/`#`/leading-`-` strings get single-quoted automatically.

While in the file, the test surfaced a second pre-existing issue: the tool's `--check` flag re-computes `desired` with a fresh `lastUpdated = new Date().toISOString()`, making the comparison racy by wall-clock — the existing E2E test flaked when its two CLI invocations crossed a second boundary. Fix: `--check` now parses `last_updated` from the on-disk file and threads it into the comparison, making `--check` time-deterministic.

Both fixes are counter-cadence-class chip closures (~10-15 min slot).

## What shipped

- **MODIFIED** `tools/state-md-set-shipped.mjs` — imports `js-yaml` via `createRequire`; adds `yamlScalar(value)` helper that returns `jsYaml.dump(value, { lineWidth: -1 }).trimEnd()`; replaces `milestone_name: ${name}` with `milestone_name: ${yamlScalar(name)}`; the `--check` branch now reads `last_updated` from the on-disk file via regex and passes it to `buildShippedStateContent` so the comparison is time-deterministic.
- **MODIFIED** `tools/__tests__/state-md-set-shipped.test.mjs` — adds 2 unit tests in the `buildShippedStateContent` describe block: (1) asserts colon-containing names get single-quoted as `milestone_name: 'T2.3 Wedge Close: ...'`; (2) parses the emitted YAML frontmatter back through `js-yaml.load` and asserts the colon-containing `milestone_name` round-trips byte-for-byte. The existing E2E test (`writes a fresh STATE.md and the normalizer-check passes immediately`) goes from flaky-on-second-boundary to deterministic via the `--check` fix.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh of `Latest shipped release` from v814 to v815 (catches up the line that v815 didn't refresh for its own ship).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| state-md-set-shipped colon-quoting | +2 | 1 string-shape assertion + 1 parse-back round-trip |
| state-md-set-shipped E2E (pre-existing flake) | +0 / now deterministic | was timestamp-racy; now reads `last_updated` from disk |
| **Total added** | **+2** | tools-suite: 514 → 516; full root + space-between: 35,188 → ~35,190 |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 34 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6 (this is a chip-shaped tool fix, not a counter-cadence ship per #10430).

Manifest entries: **22 → 22** (UNCHANGED — chip closure, not a new discipline).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~10-12 → ~10-12 (one observation closed inline — the `state-md-set-shipped` colon-footgun observation from v815 — no new ones to flag this ship).

## v816-822 chain plan

| Ship | Item | Estimated cost | Status |
|---|---|---|---|
| v816 | state-md-set-shipped YAML-fix (this ship) | ~10-15 min | SHIPPED |
| v817 | T2.3 c12-load-kb-context flake fix | ~30-60 min | pending |
| v818 | T2.3 FlagLookup discriminated union extract | ~30-40 min | pending |
| v819 | Batch chip aminet family ProcessContext (5 files; 37 → 32) | ~25-30 min | pending |
| v820 | First git/core ProcessContext chip (37 → 36 standalone) | ~30 min | pending |
| v821 | T2.2 Discipline-coverage gate WARN→BLOCK part 1 | ~30-45 min | pending |
| v822 | T2.2 Discipline-coverage gate WARN→BLOCK part 2 | ~30-45 min | pending |
| v823 | T1.3 Ship 2 — wire ObservationBridge (Option B) | ~55 min | pending |

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip — `tools/` is build-time tooling, not security surface.
- Not a new substrate; refactors the existing atomic-writer.
- Not a behavior change for production T14 ship sequence (T14 step 11.5 invocations don't use `--check`; only the test does).

## Forward path

v817 (next ship in the chain) targets the c12-load-kb-context flake — re-flagged at v802 as approaching the deferral-cost threshold. Then the chain continues with FlagLookup extract, two ProcessContext chips, the discipline-coverage gate flip (2 ships), and finally the T1.3 ObservationBridge wire.
