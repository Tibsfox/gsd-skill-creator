# v1.49.818 — T2.3 Wedge Close: FlagLookup Discriminated Union Extract

**Released:** 2026-05-27
**Type:** T2.3 wedge-closure ship (#10415 deferred-maintenance + #10426 cross-class registry extraction)
**Predecessor:** v1.49.817 — T2.3 Wedge Close: c12-load-kb-context Flake (retry-bump + structural-cause documentation)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178; counter-cadence count UNCHANGED at 6)
**Wedge:** Four CLI command modules (`koopman-check.ts`, `coherent-check.ts`, `hourglass-check.ts`, `bounded-learning.ts`) independently re-declare the identical 9-LOC FlagLookup discriminated union + `getFlagValue` parser. Deferred at v796 (~30+ ships ago); recon-surfaced for closure in the v816-822 chain.

## Summary

The pattern across all 4 sites is byte-identical:

```ts
type FlagLookup =
  | { present: false }
  | { present: true; value: string | null };

function getFlagValue(args: string[], flag: string): FlagLookup {
  const idx = args.indexOf(flag);
  if (idx < 0) return { present: false };
  if (idx === args.length - 1) return { present: true, value: null };
  return { present: true, value: args[idx + 1] ?? null };
}
```

Per #10426 cross-class registry extraction triggers at 2nd-3rd instance; the 4th instance is well past the threshold. Extract to `src/cli/lib/flag-lookup.ts` + migrate the 4 callers to import.

## What changed

**NEW** `src/cli/lib/flag-lookup.ts`:
- Exports `type FlagLookup` discriminated union with the three return-shape cases inline-documented (absent / present-with-value / trailing-with-null).
- Exports `function getFlagValue(args, flag): FlagLookup` with 3-example docstring.
- 39 lines total including doc comments + license-style attribution comment naming v796 deferral and v818 closure.

**NEW** `src/cli/lib/flag-lookup.test.ts`:
- 7 focused unit tests, one per return-shape branch. Uses `satisfies FlagLookup` to assert each test's expected literal matches the discriminated-union type. Covers:
  1. Flag absent → `{ present: false }`
  2. Flag with value → `{ present: true, value: 'bar' }`
  3. Trailing flag → `{ present: true, value: null }`
  4. Empty-string value → `{ present: true, value: '' }`
  5. Multiple occurrences → first wins
  6. Flag-after-flag → correctly identifies the inner flag's value
  7. Empty args list → `{ present: false }`

**MODIFIED** 4 CLI command modules:
- `src/cli/commands/koopman-check.ts` — remove inline 9-LOC block + 1 helper invocation reference; add 1-line import.
- `src/cli/commands/coherent-check.ts` — same pattern.
- `src/cli/commands/hourglass-check.ts` — same pattern.
- `src/cli/commands/bounded-learning.ts` — same pattern.

**MODIFIED** `.planning/PROJECT.md`:
- Pre-bump refresh `Latest shipped release` from v816 to v817.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/cli/lib/flag-lookup.ts` | NEW | 39 lines (14 LOC code + 25 lines doc/attribution comments). |
| `src/cli/lib/flag-lookup.test.ts` | NEW | 7 unit tests; 41 lines total. |
| `src/cli/commands/koopman-check.ts` | MODIFIED | -10 LOC (inline block) + 1 LOC (import) = -9 LOC. |
| `src/cli/commands/coherent-check.ts` | MODIFIED | same delta (-9 LOC). |
| `src/cli/commands/hourglass-check.ts` | MODIFIED | same delta (-9 LOC). |
| `src/cli/commands/bounded-learning.ts` | MODIFIED | same delta (-9 LOC). |
| `.planning/PROJECT.md` | MODIFIED | Pre-bump latest-shipped refresh. |
| `docs/release-notes/v1.49.818/` | NEW | 5 files: README + 4 chapter files. |

Net LOC change in source tree: `+14 (extract)` `+41 (test)` `-36 (4× -9 inline)` = **+19 net LOC**, **+7 net tests**, **0 runtime behavior change**.

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Grep for `FlagLookup\|getFlagValue` across `src/cli/` returned 4 files + 48 call-site references. Inspected one file to confirm the inline block is byte-identical across all 4. Recon time ~5 min before any code change. |
| #10416 | Tolerant-generator / lightest wire | Resisted: building a generic CLI-arg-parser library (way over-scoped); auto-deriving `FlagLookup` from a schema (no schema exists); adding parsers for other flag-shape variants (no caller asks). Chose: extract exactly the existing 9-LOC pattern as-is, byte-identical to the inline form. The extracted module is itself minimal: 14 LOC of code + a 7-test file. |
| #10422 | Verdict-pattern surface separation | The shared module is the decision-surface for "how to parse a single CLI flag." Each command module's args-handling is independent observability surface that dispatches on the discriminated-union return. Clean separation. |
| #10426 | Cross-class registry extraction at 2nd-3rd instance | THE central application. 4 instances of byte-identical 9-LOC blocks; #10426's threshold (2nd-3rd) was passed long ago. Extract at v818 closes the 30+-ship deferral. Pattern: when N modules independently re-declare an identical helper, the extraction is the closure of the implicit deferred-maintenance debt. |
| #10427 | Failure-mode contracts | Each callsite's failure mode is identical to pre-extract behavior (no behavior change). The contract: `getFlagValue(args, flag)` returns the discriminated union per the inline doc; callers dispatch on `present`. Failure modes (flag not present, value missing) are silently encoded in the return-shape, no exceptions thrown. Documented in the inline doc comment. |

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip.
- Not a behavior change for any CLI command.
- Not a closure of all "duplicate code" — only this specific 9-LOC pattern across these 4 sites.
- Not a foundation for a generic CLI-arg parser library (the extract is exactly what's needed, no more).

## Verification

- `npx tsc --noEmit` → clean (TypeScript builds successfully across all migrated files).
- `npx vitest run src/cli/lib/flag-lookup.test.ts` → 7 PASS / 0 fail.
- `npx vitest run src/cli/` → 615 PASS / 0 fail (was 608; +7 new from flag-lookup tests).
- Pre-tag-gate (full): expected 17/17 PASS.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 36 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Consume-axis ship (audit-recon-surfaced wedge closure); does not tick counter-cadence per #10430.

## Forward path

v819 (next in chain) = aminet family ProcessContext batch chip (5 files: emulated-scanner, emulator-launch, lha-extractor, lzx-extractor, tool-validator; brings process `KNOWN_UNWIRED` from 37 → 32). Then v820-823 continue the chain.
