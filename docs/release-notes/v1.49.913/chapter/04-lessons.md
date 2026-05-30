# Lessons Codified — v1.49.913

No manifest codification this ship (it is a gate-hardening ship, not a codify ship). One new candidate lesson is recorded below; it is NOT added to `tools/render-claude-md/disciplines.json` (1 instance, below the 3-instance promotion bar) and is intentionally NOT placed in any cited canonical doc, so the live discipline-coverage state stays at UNCODIFIED 0 / PARTIAL 0.

## NEW candidate — #10461

**A test suite that runs nowhere enforced silently rots; gate-enforce every suite, and pair the gate with a drift-guard so the enforced set cannot silently shrink.**

Three sibling sub-rules, all surfaced by this ship:

1. **An unenforced test suite is not "passing" — it is unobserved.** The `vitest.tools.config.mjs` suite ran nowhere in the gate or CI. Over ~2 weeks it absorbed red from at least three unrelated upstream changes — a scorer-rubric recalibration that moved its corpus baseline, a catalog template-gate addition that out-evolved test fixtures, and an FTP-dependency removal — and every one of them went unseen. The cost of non-enforcement is not "the tests don't run"; it is that the suite silently accumulates other people's drift. Wire every test suite into a gate, or delete it.

2. **An explicit allowlist that a gate depends on needs its own drift-guard (two-layer closure, #10431/#10436).** The tools suite uses an EXPLICIT include list (a glob would sweep up `node:test` files vitest can't execute). An explicit list silently drifts: 5 vitest files existed on disk but were never registered, so they ran nowhere even after the gate step landed. Layer 1 (the gate step running the suite) is incomplete without Layer 2 (a guard asserting the list covers every vitest file). The guard lives inside the suite, so Layer 1 enforces Layer 2.

3. **A unit test coupled to living, editable content is fragile; freeze the fixture instead of reverting the content.** The scorer tests scored the live release-notes corpus by version number; a documentation-quality pass legitimately edited that corpus and broke the tests. The wrong fix is to un-edit the docs to satisfy the test. The right fix is to freeze the relevant content (here, at the rubric-calibration commit) into a committed fixture, decoupling the test from the living source. Sibling of the hermetic-test discipline.

**Promotion path:** this generalizes the deferred-maintenance (#10415) + two-layer-closure (#10431/#10436) + KNOWN_UNWIRED-ledger (#10443 inverse-audit) disciplines into a single "enforce-or-it-rots" rule with a drift-guard companion. When a second and third instance of "a test/observability surface ran nowhere enforced and silently rotted" or "an explicit allowlist drifted out of sync with disk" appear, promote #10461 into the manifest. Its natural home is alongside the KNOWN_UNWIRED-ledger discipline (`docs/known-unwired-ledger-discipline.md`), which already treats explicit allowlists as drift-bearing migration debt.

## Disciplines applied (existing — no new codification)

| Lesson | How it was applied this ship |
|---|---|
| #10415 | Deferred-maintenance — the silently-red suite was closed within the ship that discovered it, not ledgered for later |
| #10431 / #10436 | Two-layer closure — a gate step (enforcement) paired with a drift-guard (detection); neither alone is complete |
| #10450 | Static-analysis tool must handle common code shapes OR fail loudly — the runner classifier survived two adversarial shapes (multi-line imports, runner-name-as-string-data) |
| #10417 / #10421 / #10427 | spawnSync harness + no-silent-caps + fail-loudly — the drift-guard tool reports node:test files (not silently dropped) and exits non-zero on real drift |
| #10430 | Finer-grained ~5-ship maintenance cadence — the rationale for taking this counter-cadence (#14) ship |

## Cross-references

- #10415 (deferred-maintenance — close red tests promptly; the alarm this ship answered)
- #10431 / #10436 (two-layer closure — the gate-step + drift-guard structure)
- #10443 (KNOWN_UNWIRED ledger / inverse-audit — explicit allowlists as drift-bearing debt; #10461's promotion home)
- #10450 (static-analysis tool robustness — the classifier's two adversarial findings)
- #10430 (counter-cadence — finer-grained ~5-ship maintenance cadence; this is counter-cadence #14)
- v1.49.912 (added the gate-critical `check-discipline-coverage` test into the very suite that ran nowhere enforced)
