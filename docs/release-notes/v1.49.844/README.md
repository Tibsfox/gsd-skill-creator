> Following v1.49.843 — _ProcessContext mesh family batch chip (2 files)_, v1.49.844 is the **verification/integration-only canonical-doc decision** — the v840-deferred candidate gets its canonical-doc home by extending `docs/meta-cadence-discipline.md` with a 4th `verify` axis. Numbered-lesson promotion still deferred until next codify ship per #10426. Discipline doc + disciplines.json updated; CLAUDE.md regenerated.

# v1.49.844 — Meta-cadence Verify Axis (Canonical-doc Home for v829+v832)

**Shipped:** 2026-05-27

4th ship of the new operational-debt cluster. Closes the v840 deferred candidate "Verification/integration-only ships axis" by giving it a canonical-doc home. Chose extension over new sub-doc — the existing `docs/meta-cadence-discipline.md` already enumerates the project's operational axes (codify / consume / calibrate); adding "verify" as the 4th aligns with the established structure.

This ship is the canonical-doc decision, NOT the lesson promotion. The 2-instance evidence (v829 ObservationBridge cross-rootdir integration test + v832 ConceptFallbackProvider selector wire integration test) is documented in the new axis section but not yet promoted to a numbered lesson. Promotion path: next codify ship (~v847-850) can promote with a 3rd instance OR with explicit operator decision-to-promote-at-2nd-instance.

## What shipped

- **MODIFIED** `docs/meta-cadence-discipline.md`:
  - Header note adds "Verify-axis added at: v1.49.844" provenance line.
  - Section "The three axes" → "The four axes". Adds axis #4 verify with definition, examples, cadence target, and evidence base (v829 + v832).
  - Section "Cadence-overdue check" gains a verify-overdue trigger ("any substrate module with non-test callers AND no integration test under tests/integration/ or src/**/__tests__/integration/ AND ≥10 ships since first non-test caller").
  - Section "Forward-shadow: programmatic cadence-overdue check" updated to include `--axis verify` in the future CLI subcommand enumeration.
  - The "when one axis lags" paragraph extended to describe the verify-lagging mode ("shipped substrate without proof-of-wire").
- **MODIFIED** `tools/render-claude-md/disciplines.json` — Meta-cadence entry:
  - `trigger` extended from "three axes (codify / consume / calibrate)" to "four axes (codify / consume / calibrate / verify)".
  - `summary` extended with the verify axis definition + v829/v832 evidence note + lesson-promotion-deferred note.
  - `codified_at_milestone` appended v1.49.844 record.
- **MODIFIED** `CLAUDE.md` — regenerated via `npm run render:claude-md`. Meta-cadence operative-discipline entry now reflects the 4-axis structure.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **62 consecutive ships at 1.178**; was 61 entering this ship — new record).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — extension of existing entry, not new domain).
Lessons in manifest (unique): **78 → 78** (UNCHANGED — no numbered lesson promoted this ship).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
KNOWN_UNWIRED Process: **16** (UNCHANGED). Egress: **11** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).

## Why this ship

The v840 codify-ship retrospective deferred this observation because no canonical-doc home existed:

> Verification/integration-only ships axis (2 instances v829 + v832) — DEFERRED v840 — no existing canonical-doc home; would need extension to `docs/meta-cadence-discipline.md` OR a new sub-doc. Next codify ship can pick this up if a 3rd instance lands.

Three possible homes:
1. **Extend `docs/meta-cadence-discipline.md`** — already enumerates operational axes; adding a 4th is the smallest semantic surgery.
2. **New sub-doc** `docs/verification-integration-axis.md` — separate doc for a separate concept.
3. **Defer until 3rd instance** — keep observation tracked; revisit at next codify ship.

This ship picks option 1. Rationale:
- Meta-cadence is the canonical doc for "balance of operational axes" — verify IS an operational axis.
- The existing doc structure (axes → overdue check → forward-shadow) generalizes cleanly to N axes.
- A separate sub-doc would create two places to look for the same conceptual content.
- Option 3 (defer) was already chosen at v840; this ship advances past defer.

The numbered-lesson promotion is still deferred. Per #10426, codification = (canonical-doc + numbered lesson + manifest entry + CLAUDE.md render). v844 does the canonical-doc step; the manifest already exists (Meta-cadence entry, lesson #10428); the numbered lesson stays pending until the codify ship explicitly promotes verify-as-discipline.

## The verify axis definition

**Trigger:** A substrate module with non-test callers (per the consume axis) but no integration test under `tests/integration/` or `src/**/__tests__/integration/` exercising the substrate-to-caller wire end-to-end.

**Cadence target:** ~1 verify ship per ~10 ships when substrate-with-test-coverage-gaps exists.

**Evidence base:** v1.49.829 (cross-rootdir integration test for ObservationBridge ↔ translateSessionEvent) + v1.49.832 (cross-rootdir integration test for ConceptFallbackProvider selector wire).

**Tells:** substrate has unit tests against mocks but no integration test against real callers; recent integration-test failures revealed a wire gap that a hardened test would have caught.

**Counter-example (NOT a verify ship):** integration test that exercises a NEW substrate's first caller — that's a consume ship (the integration test is incidental to the wire-up). Verify ships are pure infrastructure — the substrate already has callers; the test fills a coverage gap.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| (no new tests) | 0 | Documentation + manifest + regenerated section only |

Full suite at ship time: 35,261 PASS / 45 skipped / 7 todo / 0 fail (unchanged from v843).

## Tentative observations carried forward

NEW this ship: none codifiable-eligible (canonical-doc decisions consolidate existing observations).

Inherited from v840 + v841 + v842 + v843 (unchanged):
- DI-executor + tokenized-argv wire shape (v825 + v843×2; 3 instances; eligible for codification at next codify ship as #10433 refinement).
- Re-throw ProcessContextDenied from CLI swallow-catch (v820 + v842; 2 instances; eligible).
- Recent-vs-baseline-recent comparison pattern (v841; 1 instance).
- Drift-check noise as scoring-system feedback loop (v841; 1 instance).
- All other single-instance observations.

DEFERRED no longer applicable (this ship moves it to "tracked under verify axis"):
- **Verification/integration-only ships axis** — canonical-doc home set at `docs/meta-cadence-discipline.md` § "The four axes" / "Verify". Numbered-lesson promotion still deferred to next codify ship.

Still DEFERRED (unchanged):
- Bidirectional enforcement completeness (1-2 instances v838 + v836).

## Pickup

v1.49.844 SHIPPED. Next: production caller of predict path (v845; activates v837's auto-emit wire; substantive feature work).

| Engine pulse | Value |
|---|---|
| NASA degree | 1.178 (62 consecutive ships — new record) |
| Counter-cadence | 6 |
| Manifest entries | 23 |
| Unique lessons in manifest | 78 |
| UNCODIFIED | 39 ≤ 41 |
| KNOWN_UNWIRED Process | 16 |
| KNOWN_UNWIRED Egress | 11 |
| Wired calib thresholds | 5 / 7 |
| Operational axes (meta-cadence) | 3 → **4** (added verify) |
| Drift-check alerts | 0 major, 1 informational warning |
