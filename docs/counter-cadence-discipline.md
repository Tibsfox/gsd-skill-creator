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
