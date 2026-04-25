# v1.49.575 — Regression Report

**Closed:** 2026-04-25 (on `dev`)
**Milestone:** CS25–26 Sweep → GSD Integration

## Test count summary

| Stage | Passing | Notes |
|---|---|---|
| Baseline (v1.49.574 close) | 27,556 | inherited from `b8b93891f` |
| Final (v1.49.575 close) | **27,887** | excludes 13 skipped, 7 todo, 2 pre-existing failures |
| Net delta | **+331** | Half A research tests + Half B HB-01..HB-07 + Phase 813 integration |
| Floor target | ≥+80 | met **4.1×** over |
| Stretch target | ≥+100 | met **3.3×** over |

## Per-HB-module breakdown (Half B implementation tests)

| Module | Path | Tests | Source |
|---|---|---|---|
| HB-01 Tool Attention | `src/orchestration/tool-attention/__tests__/` | 49 | arXiv:2604.21816 |
| HB-02 AgentDoG | `src/safety/agentdog/__tests__/` | 48 | arXiv:2601.18491 |
| HB-03 STD Calibration | `src/safety/std-calibration/__tests__/` | 44 | arXiv:2604.20911 |
| HB-04 W/E/E Roles | `src/skill-creator/roles/__tests__/` | 47 | arXiv:2604.21003 |
| HB-05 Five-Principle Linter | `src/cartridge/linter/__tests__/` (struct.) | 47 | arXiv:2604.21090 |
| HB-06 Ambiguity Linter | `src/cartridge/linter/__tests__/` (amb.) | 25 | arXiv:2604.21505 |
| HB-07 AEL Bandit | `src/skill-creator/auto-load/__tests__/` | 47 | arXiv:2604.21725 |
| Phase 813 integration | `src/__tests__/cs25-26-sweep-integration/` | 24 (+1 todo) | this report |
| **Sum (HB-01..HB-07 + integration)** | | **331** | |

The Half A research-corpus + ADR work is validated by the ADR coverage gate
(`adr-coverage.test.ts` — 11 tests pin the 55-ADR / 6-module / arXiv-ID-match
invariants). Half A produced no implementation tests beyond the ADR static
gate; the published deliverable is the 129-page mission PDF + `cs25-26-sweep.bib`
+ 12 integration specs + cross-module matrix + convergent-discovery report
+ GSD architectural impact analysis.

## Pre-existing failures

Two failures persist in
`src/mathematical-foundations/__tests__/integration.test.ts`:

- `live-config — flag-off byte-identical (live-config baseline)` — at line ~301.
- `live-config — flag-on byte-identical (live-config baseline)` — at line ~339.

Both are inherited from v1.49.572 (mathematical-foundations milestone), per
prior STATE memory ("deferred to follow-up"). They are **not introduced by
v1.49.575** and **not in scope for v1.49.575 to fix**. The failures touch a
live-config check that asserts every mathematical-foundations sub-block is
flag-off when the milestone-level block is off; the failure is in the
sub-block enumeration, not in any cs25-26-sweep code path.

Forward-citation: a v1.49.576+ ticket should triage these two failures
against the math-foundations live-config schema; a fix is likely a 1-line
update to the sub-block iterator that skips `_comment` metadata
(currently checked but the test expects the full enumeration to all be
`enabled === false`).

## Build status

- `npm run build` → clean exit; 16 templates copied to `dist/`.
- `tsc --noEmit` → clean (no new TS errors).
- No new lint warnings (no lint script configured for this repo).

## Flag-off aggregate byte-identical verification

The Phase 813 integration suite includes
`flag-off-aggregate-byte-identical.test.ts`, a load-bearing fixture that:

1. Builds two synthetic configs — one with all 7 `cs25-26-sweep` flags
   explicitly false, one with no `cs25-26-sweep` block at all.
2. Runs a synthetic input through all four subsystems (orchestration / safety /
   skill-creator / cartridge linter).
3. JSON-serializes the aggregate output and asserts `JSON.stringify(off) ===
   JSON.stringify(noBlock)` — byte-identical.
4. Pins the exact JSON-canonical shape of every disabled-result sentinel
   (HB-01 ISO score / gate / load / budget; HB-02 emit; HB-03
   re-injection decision; HB-04 worker / evaluator / evolution disabled
   states; HB-07 no proposal; HB-05 promotion-gate non-blocking; HB-06
   linter pure regardless of flag).
5. Asserts referential equality where promised (`AGENTDOG_DISABLED_RESULT`,
   `RE_INJECTION_DISABLED_DECISION`, the three role disabled-state
   sentinels).

Result: **PASS**. The aggregate flag-off behavior is byte-identical to the
no-cs25-26-sweep-block baseline. The default-off invariant required by the
milestone holds.

## CAPCOM HARD GATE summary

Three CAPCOM HARD GATES landed in v1.49.575 Half B; each enforces the
trigger-vs-auth separation pattern matured through HB-03 → HB-04 → HB-07:

| ID | Module | Trigger marker | Auth marker | Status |
|---|---|---|---|---|
| HB-03 | `src/safety/std-calibration/` | `.planning/safety/std-calibration.trigger` | `.planning/safety/std-calibration.capcom` | **PASS** |
| HB-04 | `src/skill-creator/roles/` | `.planning/skill-creator/weler-roles.trigger` | `.planning/skill-creator/weler-roles.capcom` | **PASS** |
| HB-07 | `src/skill-creator/auto-load/` | `.planning/skill-creator/ael-bandit.trigger` | `.planning/skill-creator/ael-bandit.capcom` | **PASS** |

For each gate the test suite verifies:

- Flag off → gate fully disabled, no record emitted, no authorization
  checked.
- Flag on + no auth marker → record emitted with `authorized: false`;
  caller refuses to engage.
- Flag on + auth marker present (non-empty) → `authorized: true`; caller
  engages.
- Trigger marker presence does NOT authorize; only the CAPCOM marker does.

## HB-04 × HB-07 keystone integration

`compose-hb04-hb07.test.ts` exercises the full extension-point lifecycle
across the four authorization quadrants (roles auth × bandit auth ∈
{T,F}²). Only the (T,T) quadrant produces an accepted bandit-source
proposal. The other three quadrants demonstrate distinct refusal
shapes:

- `(F, *)` → HB-04 short-circuits before invoking the extension; bandit
  is never called.
- `(T, F)` → HB-04 invokes the extension; bandit's own engagement gate
  refuses; bandit returns null.
- `(F, T)` → HB-04 short-circuits; bandit auth is irrelevant.

This is the load-bearing Half B composition (per HB-07 concern §f and
the convergent-discovery report §5).

## Acceptance summary

- [x] Build clean (typecheck + assets)
- [x] Integration tests pass (24 + 1 todo across 4 files)
- [x] Flag-off aggregate byte-identical fixture pass
- [x] CAPCOM HARD GATE summary: 3 passed (HB-03, HB-04, HB-07)
- [x] Pre-existing 2 failures unchanged (NOT introduced; NOT fixed in scope)
- [x] No new test failures introduced
- [x] Test delta exceeds both ≥80 floor and ≥100 stretch by >3×
