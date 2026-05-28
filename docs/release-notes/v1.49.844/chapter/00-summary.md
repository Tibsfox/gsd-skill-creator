
# v1.49.844 — Meta-cadence Verify Axis (Canonical-doc Home for v829+v832)

**Released:** 2026-05-27

## Why this ship

4th ship of the new operational-debt cluster. Closes the v840 deferred candidate "Verification/integration-only ships axis" by establishing a canonical-doc home. Chose extension over new sub-doc — `docs/meta-cadence-discipline.md` already enumerates the project's operational axes (codify / consume / calibrate); adding "verify" as the 4th axis aligns with the established structure.

The numbered-lesson promotion is NOT made on this ship — it's still deferred to the next codify ship per #10426. v844 makes the canonical-doc decision; v847+ codify ship will (or won't) promote to a numbered lesson when a 3rd instance arrives OR when the operator decides to promote at 2nd instance.

## The verify axis

Added to `docs/meta-cadence-discipline.md` as axis #4 alongside codify, consume, and calibrate. Definition:

> **Verify** — small src/ delta + substantial test infrastructure ship. Proves an existing substrate wire works end-to-end without adding new substrate, new callers, or new thresholds. Examples: cross-rootdir integration tests, application-boundary tests, end-to-end-pipeline harness work. Cadence target: ~1 verify ship per ~10 ships when substrate-with-test-coverage-gaps exists.

Evidence base: v1.49.829 + v1.49.832 (both cross-rootdir integration tests for substrate-with-callers).

Verify-overdue trigger: any substrate module with non-test callers AND no integration test under `tests/integration/` or `src/**/__tests__/integration/` AND ≥10 ships since the first non-test caller landed.

## Surface delta

- 1 discipline doc extended (`docs/meta-cadence-discipline.md` — 3 axes → 4 axes; new section + check trigger + forward-shadow CLI mention)
- 1 manifest entry extended (`tools/render-claude-md/disciplines.json` Meta-cadence — trigger + summary + codified_at_milestone updates)
- 1 auto-generated doc (`CLAUDE.md` — regenerated)
- 0 source-code changes
- 0 new tests
- 5 release-notes files (this + README + 3 chapters)

## Why extend, not new sub-doc

Three options were considered (per v840 forward-flag):

1. **Extend `docs/meta-cadence-discipline.md`** — adds a 4th axis to the existing 3-axis enumeration. Smallest semantic surgery.
2. **New sub-doc** `docs/verification-integration-axis.md` — separate concept, separate doc.
3. **Defer until 3rd instance** — keep tracked as a tentative observation.

Picked option 1. Rationale:
- Meta-cadence IS the canonical doc for "balance of operational axes" — verify is an operational axis.
- The existing doc structure (axes → overdue check → forward-shadow CLI) generalizes cleanly to N axes.
- A separate sub-doc would create two places to look for the same conceptual content.
- Option 3 was already chosen at v840; v844 advances past it.

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 78 | 78 |
| Open lesson candidate backlog | 0 | 0 |
| Tentative observations carried forward | ~12-14 | ~12-14 (verify axis observation moves from "deferred no-home" to "tracked under verify axis canonical doc"; net count unchanged) |

## Engine state

NASA degree at **1.178** (UNCHANGED — **62 consecutive ships at 1.178**; was 61 entering this ship). New widest-pressure-margin record.
Counter-cadence count UNCHANGED at 6.
KNOWN_UNWIRED Process UNCHANGED at 16.
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).
Operational axes (meta-cadence): 3 → **4** (added verify).
