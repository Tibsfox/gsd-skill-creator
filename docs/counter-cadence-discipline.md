# Counter-Cadence Discipline

**Surface:** Planning a non-degree-advancing milestone; converting
accumulated social-rule debt into deterministic gates; meta-testing
newly-introduced gates at ship time.

**Codified at:** v1.49.654 (FA-652-11 C08 lesson codification — built
on lesson cluster from v1.49.585 to v1.49.651).

## When counter-cadence applies

A counter-cadence milestone is one that pauses forward-cadence
(NASA/MUS/ELC/SPS/TRS engine-state advance) to invest in operational
infrastructure: gates, hooks, audit tools, discipline codification.

**Trigger criteria** (Lesson #10168, v1.49.585):

- ≥3 categories of social-rule debt surface in a CONCERNS-style audit, OR
- A single category has a documented violation history, OR
- ~30 forward milestones have accumulated since the last counter-cadence

**Cost:** ~5-7 wall-clock hours per counter-cadence sprint when sourced
from a same-day codebase audit.

**Payback:** lower friction on every subsequent forward ship +
meta-tested confidence in the new gates.

## Discipline patterns

### Gate-not-vigilance (Lesson #10169)

When a social rule has been violated even once historically, the cost
of converting it to a deterministic gate is paid back at the first
re-violation. Apply: when reviewing post-incident retrospectives,
default to converting the offending rule into a gate rather than
re-emphasizing the prose-version of the rule.

### Meta-test strategy at ship time (Lesson #10170)

Run the newly-installed gates against the milestone's own
release-notes / push / chapters during the ship pipeline. The system
gating itself is the strongest signal that the gate is real. Apply at
every cleanup-mission's W4 ship: completeness gate against own
release-notes; idempotent-write check against own chapters; pre-push
BLOCK simulation + ALLOW on clean state.

### Discipline-as-code in 3-cluster lifecycle (Lesson #10205)

Operational disciplines cycle: emit → first-application → ESTABLISHED.
A 3-cluster lifecycle from first observation to ESTABLISHED status
signals codification readiness. Until ESTABLISHED, capture in
retrospectives; at ESTABLISHED, codify into discipline docs +
`tools/render-claude-md/disciplines.json`.

### Cluster-close forward-notes are load-bearing (Lesson #10196)

Forward-notes emitted at cluster close — "next cluster should X" — are
operational decisions, not soft suggestions. They direct the next
counter-cadence's scope. Treat as load-bearing input to the W0 brief.

## Tooling lessons (also covered)

- **Lesson #10203** — `npm audit fix` cannot remove phantom dependencies
  not declared in `package.json`. Direct edit + manual audit needed.
- **Lesson #10208** — `npm-audit` probe threshold has gap classes; rely
  on `dependency-audit` skill output for completeness.

## Cross-references

- Ship pipeline discipline (T14 sequence, gates that count)
- Citation debt (one of the gate-codified disciplines)
- STORY drift recurrence (another gate-codified discipline)
- Memory: `feedback_release-pipeline-quality.md` (one release at a time)

## Lesson #10265 — Cross-track scaffold-then-fill is a two-milestone pattern

Counter-cadence content backfills with substantial per-page authoring
(≥500 lines × 16 pages) split cleanly into two milestones:

1. **Infrastructure + scaffold-marker introduction** — produces minimal
   valid stubs carrying the SCAFFOLD-PENDING marker.
2. **Parallel W2 content authoring with marker removal** — replaces stubs
   with full substrate-tracked depth.

The split avoids "scaffold-and-fill in one ship" patterns that would
either rush the content authoring or leave drift in the depth-audit.
Apply at future cross-track drifts of comparable magnitude (≥4 missing
pages requiring substrate-tracked depth).

## Lesson #10266 — Granular bypass token beats blanket bypass when drift is multi-track

The `SC_PRE_TAG_GATE_BYPASS=depth-audit-mus-elc` token narrows
depth-audit's bypass scope to MUS+ELC tracks only, preserving NASA
strictness. This pattern (granular bypass at single-component
resolution) is preferred over blanket bypass when multiple tracks have
independent drift profiles. Apply: when introducing a new
SC_PRE_TAG_GATE_BYPASS token, prefer the most-granular form that still
expresses operator intent.

## Lesson #10430 — Finer-grained counter-cadence alternation (codified v1.49.805)

The historical baseline (Lesson #10168) is "counter-cadence cleanup
mission every ~30 forward milestones." The audit streak v784-v804
showed an alternative cadence shape: **alternate ~5 forward + 1
codification + 1 calibration + 5 forward...** rather than batching
30 milestones of operational debt into a discrete cleanup cluster.

**Why the finer cadence is the gate-not-vigilance analog for cadence
itself:** the 30-milestone cleanup-cluster pattern requires the
operator to *remember* that a cleanup is due. A finer alternation
makes the cleanup contiguous with forward work, so there is no
explicit "is it time to do a cleanup?" decision — the next ship is
either forward or counter, decided by whichever axis is overdue at
the time.

**When the finer cadence applies:**

- Forward-cadence engine has clear unused bandwidth (e.g., 8+ ships
  at a single NASA degree, or a substrate-builder sequence with no
  consume / calibrate ships in between).
- ≥1 ESTABLISHED lesson candidate sitting in the backlog ≥10 ships
  beyond its codification-ready date.
- ≥1 calibratable threshold has accumulated ≥20 observations without
  the loop being run (post-T1.1 baseline).

**When the 30-milestone batching cadence still applies:**

- The audit-streak baseline (≥3 categories of social-rule debt in a
  CONCERNS-style audit) — batched cleanup remains the right move when
  the surfaces are multi-category and benefit from a coherent
  framing.
- New-discipline introduction (≥1 wholly new operational axis being
  codified) — batching gives the new discipline doc enough surrounding
  context to mature its framing.

**The two cadences are complements, not alternatives.** The 30-ship
batched cleanup remains the high-leverage discipline-introduction
ship; the finer ~5-1-1 alternation is the steady-state maintenance
ship pattern. See [meta-cadence-discipline.md](meta-cadence-discipline.md)
for the three-axis (codify / consume / calibrate) framework that
makes the finer cadence's axis-naming load-bearing.
