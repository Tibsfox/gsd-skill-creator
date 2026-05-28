# v1.49.873 — Lessons

## Promoted to ESTABLISHED in this ship (0)

Chip ship. Applies existing #10433 + #10427 + #10444. No new lesson promotions this ship.

## Sustained observations

### #10433 — Internal-helper / module-internal-helper variant

**Status:** SUSTAINED. v873 applies a third variant of the shared-helper pattern: module-internal-helper (helper stays at module scope; takes ctx? as parameter). Distinct from v870's class-private-method variant and v871's closure-capture variant.

### #10427 — Failure-mode contracts (re-throw security denials)

**Status:** SUSTAINED + ESCALATING. v873 applies the discipline at 11 catches — the largest single-ship application yet. Promotion-eligible at next codify (see Forward observations below).

### #10444 — Size-ascending chip-pick reveals wire-shape diversity

**Status:** SUSTAINED. v873 at 363 LOC continues the mid-LOC band (200-400 LOC); chose module-internal-helper variant because TWO exported functions share the helper.

## Forward observations (promotion candidates)

### #10427 multi-catch helper (PROMOTION-ELIGIBLE — 3 instances)

**Surface ships:** v1.49.870 (5 catches) + v1.49.871 (4 catches) + v1.49.873 (11 catches).

The pattern `if (err instanceof ProcessContextDenied) throw err;` has now appeared 20 times across 3 chips. Each insertion is mechanical and structurally identical. Codification candidate: a helper function or higher-order pattern that reduces the per-catch overhead.

**Proposed shapes:**
- Inline helper: `function rethrowIfDenied(err: unknown): void { if (err instanceof ProcessContextDenied) throw err; }`. Call sites: `} catch (err) { rethrowIfDenied(err); /* recovery */ }`.
- Higher-order wrapper: `await callOrRethrowDenial(asyncFn)`. ~50% fewer LOC per wired function but breaks the existing try/catch structure.

**PROMOTION-ELIGIBLE at next codify ship.** 3-instance evidence meets the codification bar. Will surface at v882 or post-Track-5 codify.

### Module-internal-helper as third "shared-helper hoist" variant

**Surface ship:** v1.49.873 (2nd instance of cross-variant recognition).

The #10444 catalog enumerates internal-helper-method (v870), closure-capture (v871), and now module-internal-helper (v873) as separate wire shapes. All three share the same fundamental structure (one hoist protects N callers via a shared helper); they differ only in *where* the helper lives lexically.

Promotion-eligible at next codify — could refine #10444 by collapsing the three variants to "shared-helper hoist with helper-location sub-classifications" OR by adding module-internal-helper as a new catalog entry alongside the existing two.

## Carry-forward candidates from prior ships (no progress this ship)

- Audit-fidelity inline-literal extraction (#10444 refinement candidate from v872) — still 1 instance.
- Wire-shape selection by spawn-site count (#10444 refinement candidate from v872) — still 1 instance.
- Fake-PNG fixture pattern (test-authoring candidate from v872) — still 1 instance.
