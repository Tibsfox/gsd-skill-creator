# v1.49.886 — Lessons

## Lessons emitted this ship (NEW ESTABLISHED)

### #10450 — Static-analysis tool parsers must handle common code-shape variants OR fail loudly

**Codified at:** v1.49.886 (counter-cadence codify ship).

**Two-instance evidence:**
- **v1.49.867** — `tools/security/check-stale-known-unwired.mjs` regex `/]\s*\)/` matched `])` inside a code comment, silently dropping every KNOWN_UNWIRED entry after the comment. **False negative**. Fixed by line-anchor + multi-line flag.
- **v1.49.885** — Same tool's Shape B detector stripped `as <alias>` from named imports and searched the file body for the original name. For `import { promises as fs }` followed by `fs.readFile(...)`, the body uses the alias actively but the detector reported the import as stale. **False positive**. Fixed by extracting the local binding instead of the original name.

**Discipline-level rule:** A static-analysis tool whose purpose is to surface silent failures in other code must not itself fail silently. Tool sanity-fixtures should exercise:
1. Aliased named imports (`import { X as Y } from ...`).
2. Brackets inside comments (`/* matches [] */`, `// here is []`).
3. Namespace imports (`import * as ns from ...`).
4. Dynamic imports (`await import(...)`).
5. Re-exports (`export { X } from ...`).

**Mitigating discipline:** Add inline assertions inside the tool comparing structural-view counts against ground-truth counts. When the counts diverge, the parser is wrong.

**Sibling of #10427** failure-mode contracts; specialized to the static-analysis-tool surface.

**Home doc:** `docs/static-analysis-tool-discipline.md`

---

### #10451 — Calibrate-axis read-side wire recipe (7-step pattern)

**Codified at:** v1.49.886.

**Two-instance evidence:**
- **v1.49.837** — `predictive.low_confidence_threshold` read-side wire (closing the threshold-registered-at-v835 substrate gap).
- **v1.49.884** — `observation.retention_days` read-side wire.

**Both applied the same 7-step pattern:**
1. New `<class>-events.ts` mirroring `predictive-low-confidence-events.ts`.
2. Dispatcher update in `observation-sources.ts` (wired-flag flip + dispatch + new option).
3. Public-API exports in `index.ts` (with alias if name collision).
4. CLI manual recorder dispatch branch + recorder function in `bounded-learning.ts`.
5. Read-side tests in `__tests__/<class>-events.test.ts` (~13 tests).
6. Dispatcher tests update in `__tests__/observation-sources.test.ts` (wired-flag flip + round-trip).
7. CLI tests update for `--summary` count bump (`thresholds.length` + `wiredThresholdCount` each +1).

**Polarity convention:** match the threshold's surface-frequency semantics. When raising the threshold REDUCES surface fires (warn / sweep / cap), `+1` favors LOWER. When raising INCREASES surface fires (predictive fallback), polarity inverts.

**Substrate auto-emit deferred per #10439 staging** — the recipe lands the read-side only; the substrate auto-recorder ships in a follow-on.

**Sibling of #10439** CLI manual + substrate auto-emit duality; #10451 captures the read-side step-by-step procedure that #10439 references abstractly.

**Home doc:** `docs/bounded-learning-calibration-discipline.md`

---

## Promotion-eligible candidates remaining (carry-forward)

See `03-retrospective.md` "Promotion-eligible candidates remaining" section.

## Carry-forward closures

- **From v883 carry-forward #4** ("Tools-detecting-silent-failures must fail loudly") — CLOSED via #10450.
- **From v885 carry-forward #1** ("Calibrate-axis read-side wire recipe") — CLOSED via #10451.

## Codification cadence

| Ship | Lessons | Type |
|---|---|---|
| v1.49.868 | 1 (#10444 + refine #10443) | Doc-only |
| v1.49.883 | 5 (#10445/#10446/#10447/#10448/#10449) | Doc-only |
| v1.49.886 | 2 (#10450/#10451) | Doc-only + counter-cadence |

Cadence holds at ~7-15 ship intervals per #10428.
