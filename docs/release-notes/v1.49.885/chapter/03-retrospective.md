# v1.49.885 — Retrospective

## What worked

**Pattern-extend scope was right-sized.** Going from `*loader*` glob to `(?:loader|reader|scanner|walker|store)` brought 15 files into scope — large enough to be a meaningful ratchet-ledger, small enough that each chip ship's scope decision (wire vs Role-marker) stays tractable. The Process+Egress openers (v806) started at 38+16 = 54 entries combined and have been chipped to 0 across ~80 ships; LoaderContext at 15 should chip down faster.

**Cross-audit tool gained a 3rd chokepoint cleanly.** `tools/security/check-stale-known-unwired.mjs` AUDITS array extension was a single object addition. The shape was clearly built to be extensible.

**Bug surfaced through real use.** The Shape B alias-stripping bug had been latent in the cross-audit tool since v857. It only surfaced when a chokepoint surface used named imports with aliasing — `import { promises as fs } from 'node:fs'` is a common idiom that the Process+Egress allowlists never exercised because `child_process` / `fetch` aren't typically aliased that way. The 2nd-instance pattern (per v883 carry-forward) is now confirmed.

## What didn't work

**Initial KNOWN_UNWIRED survey produced one immediate false-positive.** Running the cross-audit tool against the v885 LoaderContext entry surfaced `src/eval/calibration-adjustment-store.ts` as Shape B stale (import-without-use). Reading the file showed `promises` IS used — via the alias `fs`. The tool's bug, not the file's bug. Required a tool-fix mid-ship instead of a clean opener. Mitigated by inline tool-fix as part of v885; no scope expansion needed.

**Sanity-check assertion gap.** The fixture-based tests in `tests/security/check-stale-known-unwired.test.ts` did not exercise aliased named imports. The Shape B alias-stripping bug went undetected for 28 ships (v857 → v885) because no audit-test fixture stressed the aliased-import code path. Forward-observation: when adding a new chokepoint to AUDITS, sanity-test fixtures should include aliased-import cases.

## Verdict on scope

LoaderContext chip-down ledger initialization per #10443's ratchet-ledger discipline. v885 spent one ship on the audit infrastructure + initial allowlist; v887+ may chip individual files using the v868-v882 wire-shape catalog.

The 2nd-instance "tool itself fails silently" observation crosses the promotion threshold per the established 2-instance bar. v886 (counter-cadence) is the natural place to land the codification — see "Promotion-eligible candidates" below.

## Promotion-eligible candidates accumulated this ship

1. **Tools-detecting-silent-failures must themselves fail loudly (2nd instance).** v867: regex-hardening for `]\s*\)` terminator inside comments. v885: alias-stripping in Shape B detector. Both were latent bugs in the SAME tool (`tools/security/check-stale-known-unwired.mjs`) that produced INCORRECT findings (false positive vs false negative). v883 had this as a 1-instance carry-forward; v885 promotes it to the 2-instance bar. Codification target: extend `docs/known-unwired-ledger-discipline.md` with a "tool-bug catalog" section, or promote to a discipline-level lesson under failure-mode contracts.

2. **Cross-audit tool sanity-fixture coverage.** Adding a new chokepoint to a cross-cutting tool should include sanity-test fixtures for ALL common import shapes the chokepoint might encounter (default named imports + aliased named imports + namespace imports + dynamic imports). If the existing tests don't cover the shape, add one. Below 2-instance bar (1 instance v885); promotion-eligible if a future chokepoint addition surfaces the same gap.

## Forward path

- **v886: Counter-cadence cleanup-mission (NEXT)** — opportunity to codify the 2nd-instance candidate above + bundle other accumulated below-threshold observations.
- **v887+: First LoaderContext chip** — pick smallest-LOC file from KNOWN_UNWIRED (likely `src/console/reader.ts` at 109 LOC) per #10444/#10445 wire-shape catalog.
