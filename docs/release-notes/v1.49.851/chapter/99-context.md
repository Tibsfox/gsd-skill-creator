# v1.49.851 — Context

## Provenance

Fourth ship of the operator-directed v848-v856 nine-ship campaign; third of five ProcessContext singleton chip ships. Continues the chip cadence established at v849.

`version-backfill` chosen as the third chip because:
- Same shape as v849 (single-call-site, hoist-at-top, forensic accessory)
- Only one in-file caller (`backfillSkillContent`)
- 254 LOC file; touched surface is one function
- No existing test file → opportunity to create a narrow wire-only test

## What this ship adds

```
src/skill/version-backfill.ts                  [MODIFIED: ctx? threaded through gitLastModifiedDate; hoisted ensureProcessAllowed per #10427]
src/security/process-context-audit.test.ts     [MODIFIED: removed from KNOWN_UNWIRED + v851 wire-shape comment]
tests/skill/version-backfill.test.ts           [NEW: 3 cases — deny, allow, backward-compat]
docs/release-notes/v1.49.851/                  [NEW: README + 4 chapters]
```

## Recon trail

1. **First-pick was learning/version-manager.ts** (5 swallow-catch callers; would balloon scope with #10442 re-throws). Switched to `version-backfill.ts` (single-callsite forensic accessory).
2. **Read `src/skill/version-backfill.ts`** — `gitLastModifiedDate` at line 84, single execSync, swallow-catch returns null.
3. **Find caller via grep** — only `backfillSkillContent` at line 149 in same file; no cross-file callers.
4. **Apply wire** — import + param + hoisted ensureProcessAllowed.
5. **Update audit-test KNOWN_UNWIRED.**
6. **Create new test file** — 3 cases (deny, allow, backward-compat). No existing tests for this module's surface; narrow wire-only file.
7. **Build + targeted test.** 2054 PASS.
8. **Pre-tag-gate.**
9. **Author release notes.**

## T14 ship sequence

Per `docs/T14-SHIP-SEQUENCE.md`.

## Wire shape (per Lesson #10427)

Matches v849 hoist-at-top single-call-site variant. The argv vector passed to `ensureProcessAllowed` (`['log', '-1', '--format=%ai', '--', path]`) is the audit-telemetry representation; the actual `execSync` uses a shell command string with `JSON.stringify(path)`. The two representations are semantically equivalent but operate at different layers (audit log vs shell execution).

## Discipline-extension vs new-domain choice

**EXTENSION of zero existing disciplines** (no discipline doc changes this ship). v851 applies the v847-codified #10441 / #10442 shapes and the v839-codified #10427 hoisted-check pattern; no new shape introduced.

## Test impact

Total full-suite count: ~34,791 → ~34,794 (+3 test cases). The audit-test stays at 2051.

## Cross-references

- v1.49.850 / v1.49.849 — prior chip ships of the campaign
- v1.49.847 — #10441 + #10442 codification
- v1.49.839 — `stalled.ts` forensic-surface hoisted-check precedent
- v1.49.806 — ProcessContext chokepoint introduction
- `docs/security-chokepoints.md` — canonical wire-shape catalog
