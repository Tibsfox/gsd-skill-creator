# Flake Audit — 2026-05-30

**Origin:** v1.49.914 ship verification surfaced `atlas-deps-audit: FAIL — 1 violation(s)` in the tools-suite console; the v914 handoff (forward-path option 3) flagged it as an intermittent flake in `atlas-index-cli.test.mjs`.
**Driver:** Reactive single-flake investigation. Closed in v1.49.915 (counter-cadence). Unlike the proactive 2026-05-11 sweep (N=5 sites), this audit has **N=1 reported candidate** — and that candidate turned out to be a **false positive** (benign expected stderr), while the investigation surfaced **one genuine latent defect** (a stale policy allowlist) that no test was gate-running.
**Predecessor:** `docs/test-discipline/flake-audit-2026-05-11.md` (v1.49.638 Cluster #5).

---

## Stage 1 — Enumeration

### Method

1. Locate the test the handoff blamed (`tools/__tests__/atlas-index-cli.test.mjs`) and grep it for the `atlas-deps-audit` string that appeared in the FAIL line.
2. Locate the code that emits `atlas-deps-audit: FAIL — N violation(s)` (`tools/atlas-deps-audit.mjs`) and every test that drives it.
3. Reproduce: run the full tools vitest suite repeatedly and the atlas test in isolation; observe where the FAIL line originates and whether any test actually fails.
4. Run the audit against the **real** atlas tree (`node tools/atlas-deps-audit.mjs --json`) to check the live state independently of the hermetic tests.

### Findings

| # | Site | Observation |
|---|---|---|
| — | `tools/__tests__/atlas-index-cli.test.mjs` | **No reference to `atlas-deps-audit`** (only `REPO_ROOT` at line 28). It cannot emit the FAIL line. The handoff mis-attributed it. |
| A | `tools/__tests__/atlas-deps-audit.test.mjs:94-104` (Case 2) + `:133-144` (Case 5) | These negative-path cases **deliberately** introduce a bad import (`some-unknown-package-xyz`, `lodash`), run `--strict`, assert exit 1, and assert the `FAIL` message on stderr. They **pass**. The FAIL line is *expected output* of passing tests. |
| B | `src/atlas/spatial/pmtiles-reader.ts:45` | The live audit reports **1 genuine `CROSS_TREE_VIOLATION`**: `import '../../security/loader-context.js'`. This is a legitimate, committed (v1.49.905) LoaderContext security-chokepoint wire — the audit's `CROSS_TREE_ALLOW_PATTERNS` allowlist (authored v1.49.607, ADR-0003) predates the v1.49.782+ chokepoint campaign and never permitted it. |

### Reproduction result

- 4 full-suite runs (`npx vitest run --config vitest.tools.config.mjs`): **all green** (663/663). Zero genuine failures.
- The deps-audit test file alone: 5/5 pass while printing `atlas-deps-audit: FAIL — 1 violation(s)` to the vitest console **3×** (Case 2 once + Case 5 twice — Case 5 runs `--strict` and default). Deterministic, not intermittent.
- `execSync` stderr probe: the test's `runAudit` helper used `execSync` with no `stdio` option → child stderr is captured into `err.stderr` (assertions work) **and** echoed to the parent terminal (the leak). Explicit `stdio: ['ignore','pipe','pipe']` keeps the capture and removes the echo.

**Stage-1 result: the reported flake is NOT a genuine intermittent failure.** It is a benign expected-stderr leak (finding A) mis-read as a failure during a tool-channel-degraded ship session. The investigation independently surfaced one real latent defect (finding B). Operator-decision threshold not triggered (N=1). Proceeding through Stage 2/3.

---

## Stage 2 — Classification

| # | Finding | profile | failure-mode | recommended-fix | priority |
|---|---|---|---|---|---|
| A | Expected-FAIL stderr from passing negative-path cases leaks to the vitest console | hermetic node-CLI test (`execSync`) | observability noise → human mis-read at ship time | pipe child stderr (`stdio:['ignore','pipe','pipe']`) so it's captured for assertions but not echoed | top |
| B | Live `CROSS_TREE_ALLOW_PATTERNS` allowlist stale vs the v905 LoaderContext chokepoint wire | static-analysis policy tool (`atlas-deps-audit.mjs`), **not gate/CI-wired** | false-positive violation on a legitimate, ADR-permitted in-tree import | add `loader-context.js` to the allowlist (ADR-0003 cat. b); add a live-tree regression test so the policy is actually enforced | top |

**Common thread:** a passing test should not emit `FAIL` to the console, and a policy tool that nothing gate-runs accretes silent staleness. Finding A is the "flake" (a forensic-surface noise problem — cf. failure-mode-contracts: observability surfaces should be quiet on success). Finding B is the latent defect the noise was masking.

### Why finding B never broke a test

The hermetic tests always pass `--atlas-root <tmpDir>`, so they scan only synthetic fixtures, never the real tree. The audit is also **not** invoked by `tools/pre-tag-gate.sh` or any T14 step — it is a standalone manual tool. So the live violation was invisible to every gate. That gap is the real lesson here.

---

## Stage 3 — Apply targeted fixes

All fixes verified against the v1.49.914 ship-tip (`17f6db91d`, tools suite green at 663).

### Fixes applied (v1.49.915)

| # | Site | Fix | Verification |
|---|---|---|---|
| A | `tools/__tests__/atlas-deps-audit.test.mjs` `runAudit` | `execSync` opts gain `stdio: ['ignore','pipe','pipe']` | FAIL line no longer appears in the vitest console (3 → 0 occurrences); Cases 2/5 stderr assertions still pass |
| B | `tools/atlas-deps-audit.mjs` `CROSS_TREE_ALLOW_PATTERNS` | add `/\/security\/loader-context\.js$/` (+ docstring) | `node tools/atlas-deps-audit.mjs` → PASS, 112 files, 0 violations, exit 0 |
| B-lock | `tools/__tests__/atlas-deps-audit.test.mjs` Case 6 | NEW live-tree regression test: scans the real atlas surface, asserts `pass === true` with a message pointing to the allowlist + ADR | tools suite 663 → 664; Case 6 green |

**Total: 3 changes (2 code + 1 new test) — no production-`src/` change.** The pmtiles-reader chokepoint wire itself was correct; only the audit allowlist and the test harness needed work.

### Reconciliation

| Stage 2 finding | Outcome |
|---|---|
| A — stderr leak | FIXED (de-noised) |
| B — stale allowlist | FIXED (allowlisted) + LOCKED (live-tree Case 6) |

The originally-reported subject (an intermittent failure in `atlas-index-cli.test.mjs`) was a **mis-attribution** — no fix was needed or made there.

### Forward observations

- **Audit was never gate-wired.** ADR-0003 §Verification names `node tools/atlas-deps-audit.mjs --strict` as the acceptance test, but nothing ran it after v607. The new Case 6 wires the ADR acceptance test into the **gate+CI-enforced tools vitest suite** (v913/v914 made that suite a hard gate) — the lightest enforcement that avoids touching `pre-tag-gate.sh`. A future ship could additionally add a `pre-tag-gate.sh` step if a non-test gate is wanted, but Case 6 already closes the enforcement gap.
- **Allowlist will need extension when egress/process chokepoints reach atlas.** Today only `loader-context.js` is imported by an atlas surface (`pmtiles-reader.ts`). If `egress-context.js` / `process-context.js` are ever wired into atlas, Case 6 fails loudly with a clear message — that is the intended friction, not a flake.
- **Audit-method note for future flake triage:** when a `FAIL`/error string appears in vitest console output, confirm which test *emits* it (grep the suite for the literal string) before attributing it to the adjacent test in the reporter summary — reporter proximity is not provenance. Tool-channel-degraded sessions (heavy output buffering) raise this mis-attribution risk.
