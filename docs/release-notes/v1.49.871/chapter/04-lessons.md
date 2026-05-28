# v1.49.871 — Lessons

## Promoted to ESTABLISHED in this ship (0)

Chip ship. Applies existing #10433 internal-helper pattern (closure-capture variant) + #10427 swallow-catch re-throw + #10444 size-ascending chip-pick. No new lesson promotions.

## Sustained observations (no change this ship)

### #10433 — Internal-helper for ctx? threading (closure-capture variant)

**Status:** SUSTAINED. v871 applies the pattern through a closure rather than a class method. Both variants share the same fundamental shape: single ensureProcessAllowed at a helper site protects N callers via a single entry point. The closure-capture variant adds the wrinkle that the helper itself is created at function-invocation time and captures the optional ctx? from the outer scope.

### #10444 — Size-ascending chip-pick reveals wire-shape diversity

**Status:** SUSTAINED. v871 at 183 LOC exercises the closure-capture shape; matches the catalog prediction for the small-to-mid LOC band. v870 surfaced the pre-existing-helper-bias refinement (carry-forward); v871 strengthens the band-prediction case.

### #10427 — Failure-mode contracts (re-throw security denials)

**Status:** SUSTAINED. v871 applies the re-throw discipline at 4 swallow-everything catches in `contribute()`. Same pattern as v870 (4-method re-throw). The re-throw is now muscle memory.

### #10428 — Counter-cadence/meta-cadence

**Status:** SUSTAINED. v871 is the 4th codify-axis ship since v868 (codify + gate + chip + chip). The 7-10 ship cadence is well-distributed across the v868-v882 campaign window.

## Forward observations (below promotion threshold, 1 instance each)

### Closure-capture vs internal-helper-method are the same pattern variant

**Surface ship:** v1.49.871 (recon during wire authoring).

The #10444 catalog enumerates internal-helper, closure-capture, and hoist-outside-Promise as separate wire shapes. From a security-discipline perspective they're functionally identical: "one check at a helper site protects N call sites." The lexical location of the helper (class method vs function-local closure vs module-level function) doesn't change the security boundary.

The catalog distinction is useful for *operator* recognition (where do I look in the file to find the wire?) but not for *discipline* enforcement (is the wire correct?). Below-threshold observation; a 2nd chip surfacing this same cross-pattern observation would promote it to a refinement of #10444 — possibly suggesting the catalog could collapse to "shared-helper hoist" with a sub-classification by helper-location.

### #10870 pattern reuse: 4-method re-throw repeated

**Surface ship:** v1.49.871 (chip authoring).

v870 had 4 swallow-everything catches needing re-throw (getHistory, getVersionContent, rollback, compareVersions, getCurrentHash). v871 also has 4 swallow-everything catches needing re-throw (sync recovery, merge wrap, push wrap, gh-availability wrap). Two chips in a row hit the N=4 multi-re-throw editorial overhead.

This strengthens the v870 carry-forward observation (multi-method swallow-catch re-throw editorial overhead). Now at 2 instances. Promotion-eligible at next codify ship as a refinement of #10427 — possibly suggesting a small helper like `rethrowSecurityIf(err, ProcessContextDenied)` or a `wrapResult(asyncFn, denialClass)` pattern.

**PROMOTION-ELIGIBLE NOW (2 instances).** Will surface at next codify ship.
