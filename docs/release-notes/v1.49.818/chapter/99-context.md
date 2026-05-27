# v1.49.818 — Context

## Provenance

- **Source:** v815 handoff recon-surfaced 2 T2.3 candidates beyond the v784 audit list; FlagLookup extract is the 2nd of those (HIGH-01 was the 1st, closed v815; c12 flake closed v817). Original deferral at v796 (~30+ ships ago).
- **Trigger:** Operator selected the v816-822 chain at session-start; this ship is item #3.
- **Predecessor ship:** v1.49.817 (T2.3 Wedge Close: c12-load-kb-context Flake); shipped 2026-05-27 ~10:11 UTC.
- **Session boundary:** Chain-mode (same session-retro mission).

## The wedge's history

- **v796 or earlier:** Each of the 4 CLI command modules independently declared the FlagLookup discriminated union + `getFlagValue` parser inline. The 4 sites: koopman-check, coherent-check, hourglass-check, bounded-learning.
- **v796 (or thereabouts):** First recon-mention as "deferred at v796" per v815 handoff naming. Specifically: the FlagLookup pattern was noticed and deferred per #10416 lightest-wire (until then, only 2-3 instances; #10426 hadn't been promoted yet).
- **v784 audit:** Did not specifically name FlagLookup extract; the audit named other T2 items, this one was recon-surfaced from handoffs.
- **v810 #10432 promotion:** #10426 was promoted with the 2nd-instance threshold formalized; FlagLookup was already at 3-4 instances by then but not flagged in the codify ship's case studies.
- **v815 handoff:** Recon for the v816-822 chain explicitly named FlagLookup extract as a T2.3 candidate, sized ~30-40 min.
- **v818 (this ship):** Closed at minimum credible threshold.

## The 4 inline instances

All 4 files had byte-identical 9-LOC blocks:

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

Sites:
- `src/cli/commands/koopman-check.ts` lines 69-78 (pre-migration)
- `src/cli/commands/coherent-check.ts` lines 72-81 (pre-migration)
- `src/cli/commands/hourglass-check.ts` lines 69-78 (pre-migration)
- `src/cli/commands/bounded-learning.ts` lines 160-169 (pre-migration)

Call-site count per file:
- koopman-check: 2 calls
- coherent-check: 1 call
- hourglass-check: 2 calls
- bounded-learning: ~17 calls (heaviest user)

Total getFlagValue references across `src/cli/`: 48.

## Why this is a #10426 case and not a #10416 case

#10416 (lightest-wire / tolerant-generator): "resist extraction at 1 instance; the helper sits inline as a single-use utility."

#10426 (cross-class registry extraction): "extract at 2nd-3rd instance; the contrast between two real instances determines the registry shape."

At 4 instances, this is firmly past #10426's threshold. The contrast across the 4 instances confirms the shape: all use the SAME 3-line type + 6-line function, no variation, no edge-case parameters. The extraction is byte-identical.

## The migration was mechanical

Each file's diff:

```diff
+import { getFlagValue } from '../lib/flag-lookup.js';

-type FlagLookup =
-  | { present: false }
-  | { present: true; value: string | null };
-
-function getFlagValue(args: string[], flag: string): FlagLookup {
-  const idx = args.indexOf(flag);
-  if (idx < 0) return { present: false };
-  if (idx === args.length - 1) return { present: true, value: null };
-  return { present: true, value: args[idx + 1] ?? null };
-}
```

Net delta per file: +1/-9 = -8 LOC. Across 4 files: -32 LOC inline + 14 LOC new module + 41 LOC test = **+23 net LOC** (mostly test).

## Test design

Pre-extraction, `getFlagValue` was tested implicitly through CLI integration tests for each of the 4 commands. Each test passed args arrays through the command's entrypoint, and the discriminated-union return was consumed by the command's local arg-parsing logic — never directly asserted.

Post-extraction, `src/cli/lib/flag-lookup.test.ts` has 7 focused unit tests covering each return-shape branch:
1. Flag absent → `{ present: false }`
2. Flag with value → `{ present: true, value: 'bar' }`
3. Trailing flag → `{ present: true, value: null }`
4. Empty-string value → `{ present: true, value: '' }`
5. Multiple occurrences → first wins
6. Flag-after-flag → correctly identifies inner flag's value
7. Empty args list → `{ present: false }`

Each test uses `satisfies FlagLookup` to assert that the expected return matches the discriminated-union type, catching any future drift in the type's shape.

## Engine state crossover

NASA degree sustains at **1.178** for the 36th consecutive ship. Counter-cadence count UNCHANGED at 6.

The codify ⟂ consume ⟂ calibrate ⟂ observe quadrant:
- **Consume:** this ship is consume-axis (close a 30+-ship deferral).
- **Codify:** N/A this ship.
- **Calibrate:** N/A this ship.
- **Observe:** the new unit tests are explicit observability for each branch of `getFlagValue`'s discriminated-union return.

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.815-t2.3-high-01-pmtiles-refcount-shipped.md` for the v816-822 chain plan.

## Forward path post-v818

T2.3 recon-surfaced backlog: **EMPTY**.

v819 (next in chain) = aminet family ProcessContext batch chip (5 files; brings process `KNOWN_UNWIRED` 37 → 32). Then v820-823 continue:
- v820: git/core ProcessContext chip (37 → 36 standalone OR 32 → 31 if after v819)
- v821-822: discipline-coverage gate flip (2 ships)
- v823: ObservationBridge wire (T1.3 Ship 2)

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + Lesson #10184 + Lesson #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- v818 used the v816-fixed `state-md-set-shipped` tool for STATE.md reset.
- Third consecutive post-v816 ship with clean colon-handling.
