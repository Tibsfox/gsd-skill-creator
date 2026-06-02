# v1.49.950 — Retrospective

## What went right

- **Honesty preserved while closing the gap.** The v1.49.947 ship's central stance was that faking the second conjunct would be worse than the prose check. This ship machine-tracks it without abandoning that stance: an axis with no `cadence_advances` marker, or fewer than 10 ships since its anchor, stays `candidate` — never a false `overdue`. The gate gains power only where the evidence is real. `shipsSinceUpgrade` only ever upgrades a `candidate`; `not-overdue` and `manual` can never become `overdue`, so the first conjunct remains a hard precondition.

- **The reader ships with a real producer (#10461).** A common failure is shipping a consumer surface with no producer — "active but finds nothing" — which reads as wired but is actually dormant. The two genuine recent consume ships (v1.49.944, v1.49.946) are tagged `[consume]`, so `readAxisAdvances` runs on real data from the first invocation (consume anchored at v1.49.946, ships-since computed). The convention is established by real example, not just documented.

- **The self-tagging temptation was resisted.** It was tempting to tag this ship `cadence_advances: [codify]` to make the feature look immediately live. But the codify axis is defined by manifest-lesson promotion, and this ship promotes none — so tagging it would be a false marker, the exact dishonesty the design forbids. v950 self-tags nothing. The discipline (a marker means the axis genuinely advanced) was applied to the ship that built it.

- **A pure-function spine kept the new logic testable.** `shipsSinceUpgrade`, `readAxisAdvances`, and `cadenceCheckExitCode` are all pure/dir-scoped and unit-tested with synthetic release-notes fixtures — including the end-to-end path where a live `candidate` (verify) flips to `overdue` against a synthetic dir tagging it 10 ships back. The `>=10` boundary is mutation-proven (`>10` strands the boundary case at candidate). The verify axis's live candidacy is the natural fixture for the end-to-end upgrade.

## What went well in process

- **The exit-semantics shift was made deliberately and documented.** v1.49.947's `--check` fired on any `candidate`; a "true gate" should fire only on a definitive `overdue`. The shift (candidate -> advisory exit 0; overdue -> gate exit 1) was checked against existing tests (none asserted candidate -> exit 1) and the docstring/output text were updated in lockstep so the three surfaces agree.

## What to watch

- **The convention must be populated forward to have teeth.** The gate fires only on tagged axes. Going forward, every ship that genuinely advances an axis (a consume wire, a calibration tick, a verify end-to-end test, a codify promotion) must tag its README `cadence_advances: [axis]`. Untagged advances leave the axis's ships-since unknown -> it stays `candidate` and the gate never fires for it. The honest default is safe (no false overdue) but the gate's usefulness scales with marker discipline.

- **Ancient anchors stay unknown by design.** The verify axis's true anchor ("ships since the first non-test caller of the `suggestions.*` substrate") predates the convention and is not retroactively recoverable, so verify stays `candidate` rather than guessing. Retroactively tagging ancient substrate was deliberately out of scope — only defensible, recent, unambiguous advances (the two consume ships) were seeded.

- **`cadence_advances` is operator-authored frontmatter, not derived.** The marker records operator/ship intent ("this ship advanced axis X"); the tool trusts it. A mis-tagged ship would mis-anchor an axis. This is the same trust model as the rest of the release-notes frontmatter, and the marker's meaning is narrow and checkable against the ship's own content.
