# v1.49.850 — Context

## Provenance

Third ship of the operator-directed v848-v856 nine-ship campaign; second of five ProcessContext singleton chip ships. Continues the chip cadence established at v849.

`extension-detector` chosen as the second chip because:
- Smallest singleton (120 LOC) in remaining KNOWN_UNWIRED list
- Single child-process call site
- DI-overrides test pattern already in place (no module mocking needed)

## What this ship adds

```
src/orchestrator/extension/extension-detector.ts         [MODIFIED: ctx? threaded through detectExtension; hoisted ensureProcessAllowed inside no-override branch per #10427]
src/orchestrator/extension/extension-detector.test.ts    [MODIFIED: +2 test cases (deny propagates, override-skip silent)]
src/security/process-context-audit.test.ts               [MODIFIED: removed from KNOWN_UNWIRED + replaced with v850 wire-shape comment]
docs/release-notes/v1.49.850/                            [NEW: README + 4 chapters]
```

## Recon trail

1. **Pick next chip** from remaining KNOWN_UNWIRED list. Inspected 6 candidates; selected `extension-detector.ts` as smallest (120 LOC, 1 call site).
2. **Read source + tests.** DI-overrides pattern; no module mocking; async function returning Promise<ExtensionCapabilities>.
3. **Apply wire** — import + ctx? param + hoisted ensureProcessAllowed inside no-override branch.
4. **Update audit-test KNOWN_UNWIRED** — remove entry + add v850 wire-shape comment.
5. **Add 2 test cases** — deny propagates (async `await expect(...).rejects.toThrow`), override-skip silent (sink stays empty).
6. **Build + targeted test.** Pass — 2064 cases (extension-detector 13 + audit 2051).
7. **Pre-tag-gate.** Will run + report.
8. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape variant (per Lesson #10427)

```ts
} else {
  // No override -- try real CLI binary
  ensureProcessAllowed(
    ctx,
    'orchestrator/extension/extension-detector',
    'exec',
    'skill-creator',
    ['--version'],
  );
  try {
    const output = execSync('skill-creator --version 2>/dev/null', ...);
    // ...
  } catch {
    // CLI not available -- continue to Strategy 2
  }
}
```

Differs from v849 in PLACEMENT only: hoisted INSIDE the no-override branch, not at function top. This preserves the early-return semantics for override callers (no spurious audit records when `overrides.cliAvailable !== undefined`). The pattern is still hoisted-check-per-#10427; the placement adapts to the function's control flow.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v850 applies the v847-codified #10441 / #10442 shapes and the v839-codified #10427 hoisted-check pattern with a placement variant; no new shape introduced.

## Test impact

Total full-suite count: ~34,789 → ~34,791 (+2 test cases). The audit-test stays at 2051 (file moved from KNOWN_UNWIRED skip-path to enforced-wire-path).

## Cross-references

- v1.49.849 — first chip ship of the campaign (template established)
- v1.49.847 — #10441 + #10442 codification
- v1.49.839 — `stalled.ts` forensic-surface hoisted-check precedent
- v1.49.806 — ProcessContext chokepoint introduction
- `docs/security-chokepoints.md` — canonical wire-shape catalog
- `docs/failure-mode-contracts.md` — #10427 load-bearing-fails-loudly rule
