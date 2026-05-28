# v1.49.849 — Context

## Provenance

Second ship of the operator-directed v848-v856 nine-ship campaign; first of five ProcessContext singleton chip ships (v849-v853). Operator chose 1-singleton-per-ship batch size at v848 session pickup. The v847 codify ship (#10441 + #10442) made the wire-shape patterns first-class numbered lessons; this ship applies them.

`changelog-watch` was chosen as the first chip because:
- Single child-process call site
- Pure-function neighbors (no spawn surface to thread)
- Existing test file with reusable mock infrastructure
- Pattern matches v839 `stalled.ts` forensic-surface template cleanly

## What this ship adds

```
src/retro/changelog-watch.ts                       [MODIFIED: ctx? threaded through detectVersion + runChangelogWatch opts; ensureProcessAllowed hoisted per #10427]
src/security/process-context-audit.test.ts         [MODIFIED: removed from KNOWN_UNWIRED + replaced with v849 wire-shape comment]
tests/retro/changelog-watch.test.ts                [MODIFIED: +3 test cases (deny propagates, allow with audit, defaultProcessContext)]
docs/release-notes/v1.49.849/                      [NEW: README + 4 chapters]
```

## Recon trail

1. **Read predecessor handoff** confirming v848 SHIPPED + v849-v856 campaign scope.
2. **Read `src/security/process-context-audit.test.ts` KNOWN_UNWIRED list** — 16 entries; selected `src/retro/changelog-watch.ts` as the simplest singleton.
3. **Read `src/retro/changelog-watch.ts`** — 234 LOC, single `execSync('claude --version')` at line 71, catch returns `'unknown'`.
4. **Read v839 `stalled.ts` precedent** — forensic-surface hoisted-check template under #10427.
5. **Read `src/security/process-context.ts`** — confirmed `ensureProcessAllowed` signature + `CapturingProcessAuditSink` test helper + `defaultProcessContext(sink)` signature.
6. **Apply wire** — 3 edits to `changelog-watch.ts` (import + param + hoisted call + opts thread).
7. **Update audit-test KNOWN_UNWIRED** — remove entry + add inline comment documenting the v849 wire shape.
8. **Add 3 test cases** to `tests/retro/changelog-watch.test.ts` — deny + allow + defaultProcessContext-with-sink.
9. **Fix `defaultProcessContext` signature trip** — first attempt passed an opts object; fixed to pass `ProcessAuditSink` directly. Below-threshold observation.
10. **Build + targeted test** — `npm run build` clean; 9 changelog-watch tests + 2051 audit tests PASS.
11. **Pre-tag-gate.** All 17 checks PASS.
12. **Author release notes** — 5 files.

## T14 ship sequence

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape (per Lesson #10427 + #10437)

`detectVersion(ctx?: ProcessContext)` is a forensic accessory (returns `'unknown'` on any failure). The wire uses the hoisted-check pattern from v839 `stalled.ts`:

```ts
export function detectVersion(ctx?: ProcessContext): string {
  ensureProcessAllowed(ctx, 'retro/changelog-watch', 'exec', 'claude', ['--version']);
  // ↑ HOISTED — propagates ProcessContextDenied even though the try below
  //   swallows everything else
  try {
    const output = execSync('claude --version', { encoding: 'utf-8', timeout: 5000 });
    const match = output.match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}
```

The wire DOES NOT use #10441's DI-executor + tokenized-argv pattern because:
- `changelog-watch` has only ONE spawn site (not a family)
- The executable is constant (`'claude'`) — no tokenization required
- There is no internal-helper to wrap (single call site)

The hoisted-check pattern is the lighter weight choice per the per-file-LOC-count-band rule in #10433.

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v849 applies the v847-codified #10441 + #10442 shapes (and the v839-codified #10427 hoisted-check pattern); no new shape introduced.

## Test impact

Total full-suite count: 34,786 → ~34,789 (3 new test cases in `changelog-watch.test.ts`). The audit-test stays at 2051 (file moved from KNOWN_UNWIRED skip-path to enforced-wire-path; same case count).

## Cross-references

- v1.49.847 — #10441 + #10442 codification (wire-shape lessons applied this ship)
- v1.49.839 — `stalled.ts` forensic-surface hoisted-check precedent
- v1.49.806 — ProcessContext chokepoint introduction + initial KNOWN_UNWIRED grandfathering
- `docs/security-chokepoints.md` — canonical wire-shape catalog
- `docs/failure-mode-contracts.md` — #10427 load-bearing-fails-loudly rule
- `docs/known-unwired-ledger-discipline.md` — ratchet-ledger discipline
