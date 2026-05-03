# Intelligence Dashboard Test Plan

**Phase 826 / C13 / D-26-51, D-26-52, D-26-53**

This document describes the test suites for the GSD Intelligence Dashboard
(`src/intelligence/`), including how to run them locally, CI gate policy,
expected flakiness, and coverage targets.

---

## Test Suite Structure

Tests live under `src/intelligence/__tests__/`:

```
src/intelligence/__tests__/
├── safety/                        # G2 BLOCK — ALL must pass for release
│   ├── no-anthropic-import.test.ts        S1, S13
│   ├── no-subprocess-spawn.test.ts        S2
│   ├── atomic-emissions.test.ts           S3, S6
│   ├── format-compliance.test.ts          S4, S5
│   ├── kb-migration.test.ts               S7, S8
│   ├── module-boundary.test.ts            S9, S10
│   ├── existing-dashboard-preserved.test.ts  S11, S12
│   └── secret-redaction.test.ts          S14
├── integration/                   # G2 BLOCK — ALL must pass for release
│   ├── kb-project-lifecycle.test.ts       I1
│   ├── briefing-generation.test.ts        I2
│   ├── bundle-emission.test.ts            I3, I4
│   ├── finding-dismissal.test.ts          I5, I11
│   ├── meeting-record-lifecycle.test.ts   I6, I7, I15
│   ├── snapshot-diff-loop.test.ts         I8
│   ├── format-compliance-downstream.test.ts  I9, I10
│   ├── dual-writer-kb.test.ts             I12
│   ├── cross-meeting-persistence.test.ts  I13, I14, I17
│   ├── bundle-hint-propagation.test.ts    I16
│   └── dashboard-migration-non-breaking.test.ts  I18
├── edge/                          # Advisory — warn, not BLOCK
│   ├── kb-edge-cases.test.ts              E1-E8
│   └── emitter-edge-cases.test.ts        E9-E14
├── performance/                   # Advisory — warn, not BLOCK
│   ├── c02-language-analyzer.perf.test.ts  P1
│   ├── p02-kb-write-throughput.perf.test.ts  P2
│   ├── p03-kb-read-latency.perf.test.ts   P3
│   ├── p04-bundle-emit.perf.test.ts       P4
│   ├── p05-snapshot-diff.perf.test.ts     P5
│   ├── p06-migration-speed.perf.test.ts   P6
│   └── p07-meeting-commit.perf.test.ts    P7
└── _harness/
    ├── kb-factory.ts              createTestKB() + createKBStore() helper
    ├── gsd-skill-creator-simulator.ts  staging/inbox watcher
    ├── ui-launcher.ts             Playwright headless wrapper
    └── fixtures/                  small test fixture repos
```

---

## Running Tests Locally

### Safety + Integration (G2 gate — required for release)

```bash
# Safety tests (S1-S14 G2 BLOCK)
npx vitest run --project root src/intelligence/__tests__/safety/

# Integration tests (I1-I18 G2 BLOCK)
npx vitest run --project root src/intelligence/__tests__/integration/

# Both together (recommended pre-release run)
npx vitest run --project root src/intelligence/__tests__/safety/ src/intelligence/__tests__/integration/
```

Expected: all tests pass in **< 5 minutes** on commodity hardware (D-26-51).

### Edge case tests (advisory)

```bash
npx vitest run --project root src/intelligence/__tests__/edge/
```

### Performance tests (advisory — warn only)

Performance tests use the `intelligence-perf` vitest project (excluded from the root project to avoid cluttering normal CI runs):

```bash
npx vitest run --project intelligence-perf
```

Performance tests emit `console.warn` when they exceed soft targets but only fail at hard limits (5-10× the soft target). Do not block release on performance test flakiness.

### Full intelligence suite (safety + integration + edge + perf)

```bash
npx vitest run --project root src/intelligence/__tests__/safety/ \
  src/intelligence/__tests__/integration/ \
  src/intelligence/__tests__/edge/ \
  && npx vitest run --project intelligence-perf
```

---

## CI Gate Policy

### BLOCKING (G2)

These suites MUST pass. Any failure blocks the release:

| Suite | Vitest project | Pattern |
|---|---|---|
| Safety (S1-S14) | `root` | `src/intelligence/__tests__/safety/` |
| Integration (I1-I18) | `root` | `src/intelligence/__tests__/integration/` |

The pre-tag-gate (`npm run pre-tag-gate`) runs `npx vitest run` which includes the root project. Safety and integration tests are included in the root project and gate the full release pipeline.

### ADVISORY (warn only, not blocking)

| Suite | Vitest project | Action on fail |
|---|---|---|
| Edge cases (E1-E14) | `root` | Document, open issue, do not block release |
| Performance (P1-P7) | `intelligence-perf` | Log `PERF WARN`, do not block release |

---

## Expected Flakiness

### Known flaky tests

None identified as of Phase 826. All tests use:
- Isolated tmp directories per test (no shared state)
- WAL-mode SQLite (I12: dual-writer test)
- No external network calls
- No Playwright (UI tests deferred to Phase 824 track)

### Performance test timing sensitivity

P-series tests run on CI hardware which may be slower than developer machines. Expected behavior:

| Test | Soft target | Hard limit | Typical CI time |
|---|---|---|---|
| P2: writeFindings × 1000 | <2000ms | <5000ms | ~1000ms |
| P3: listOpenFindings × 500 | <200ms | <2000ms | ~200ms |
| P4: emitBundle × 20 seeds | <500ms | <3000ms | ~50ms |
| P5: snapshotDiffCache × 100 pairs | <500ms | <5000ms | ~900ms |
| P6: migration speed | <500ms | <5000ms | ~100ms |
| P7: meeting commit × 10 decisions | <1000ms | <10000ms | ~900ms |

All tests emit `PERF WARN` to stderr when exceeding soft targets. CI logs should be reviewed for accumulating warnings as a signal for optimization work.

---

## Coverage Target

**Target: ≥75% line coverage on `src/intelligence/`** (D-26-52).

Run coverage locally:

```bash
npx vitest run --coverage --project root src/intelligence/__tests__/safety/ src/intelligence/__tests__/integration/
```

Combined with component-level tests from Phases 821-825 (which live in peer `__tests__/` directories alongside each source module), the 75% target should be met. If coverage drops below 75% after a PR:
1. Identify the uncovered files via the coverage report
2. Author additional unit tests in the appropriate `__tests__/` peer directory
3. Re-run coverage to confirm target restored

---

## Test Harness

### `_harness/kb-factory.ts`

`createTestKB(projectId?)` returns a `TestKBHandle` with:

- `db` — direct access to the registry SQLite DB (for test setup)
- `projectDir` — isolated tmp directory for the project DB
- `createKBStore()` — async factory that creates a properly initialized `KBStore` instance (calls `ensureRegistry()` automatically)
- `cleanup()` — removes all tmp directories after test

```typescript
const kbHandle = createTestKB('my-project');
try {
  const kb = await kbHandle.createKBStore();
  // ... test with kb
} finally {
  kbHandle.cleanup();
}
```

**Important:** Always use `kbHandle.createKBStore()` rather than `new KBStore(...)` directly — the factory ensures the registry is initialized and the correct `registryPath` is used.

### `_harness/gsd-skill-creator-simulator.ts`

Watches `staging/inbox/` and `console/inbox/pending/`, simulates expansion + status events. Used by integration tests that need a "downstream skill" without invoking the real one.

### `_harness/ui-launcher.ts`

Playwright wrapper for end-to-end UI tests (deferred to Phase 824 track — stub only in Phase 826).

---

## Dashboard Migration Tests (C14)

The `dashboard-migration-non-breaking.test.ts` (I18) and `existing-dashboard-preserved.test.ts` (S11/S12) verify the C14 additive migration invariants:

- All original nav links present
- `intelligence.html` entry page present
- Exactly ONE nav-shim script tag added to `index.html`
- `intelligence/nav-shim.js` and `intelligence/intelligence.css` assets present

These tests resolve `dashboard/` (tracked source) when `dist/dashboard/` (gitignored build output) is not present.

---

## G2 Gate Summary

All 38 safety tests (S1-S14) and 60 integration tests (I1-I18) must pass before any milestone tag. Run the composite gate:

```bash
npm run pre-tag-gate
```

The pre-tag gate runs `npx vitest run` which includes all root-project tests (safety + integration). Exit code 2 means vitest failed — investigate safety or integration failures before proceeding.
