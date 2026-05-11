# 03 — Retrospective: v1.49.637 Housekeeping Cluster #4

## What worked

### Substrate-probe before component-spec finalization

C1 W0a substrate-probe surfaced a 3-site gating shape vs the spec's
assumed 1-site shape; C3 W0a probe surfaced that
`@zxcvbn-ts/language-en` doesn't export `adjacencyGraphs` (the
keyboard graph is provided by `@zxcvbn-ts/core` itself); C3 fixture
audit underestimated the actual replacement scope (8 sites in
`passphrase-flow.test.ts` used `hunter2` as canonical strong-fixture,
not the 2-3 the original audit caught). All three findings would
have shipped as silent W1A bugs if the substrate-probe stage had
been skipped. **Forward Lesson #10192** captures this pattern as a
mission-package authoring requirement, not a W0 stage discovery.

### W1B C4 dual-disposition pattern

One component can have multiple test outcomes when investigation
reveals heterogeneous root causes. The C4 component had two
`#[ignore]`'d tests at v1.49.636 close. Treating them as a single
disposition (either both `temporary-skip` continuing OR both
`fixed-inline`) would have either left a 5-min fix on the table or
committed a 2-4h architectural rework into a housekeeping cluster.
The dual disposition (fix-inline per_project_clear, defer
lru-promote to Cluster #5 with deeper diagnostic) lets the component
honor both findings without scope creep. **Forward Lesson #10195**
captures the pattern.

### Commit-between-deliverables discipline (W3)

W3 pre-ship deliverables (meta-test + release-notes + handoff doc)
were sequenced with explicit commit boundaries between each. Earlier
sub-agent dispatches in W1 had been hitting token ceiling mid-second-
deliverable; the W3 sequencing prevents work loss. The meta-test
commit (`2ce35f954`) was atomic before release-notes authoring
started; release-notes commit was atomic before handoff doc; handoff
doc remains uncommitted (gitignored per `.planning/` rule). **Forward
Lesson #10194** captures the pattern.

### Lesson #10191 (ship-time directive atomicity) honored

The team-lead → operator → flight-ops dispatch chain at W3 explicitly
referenced Lesson #10191 in the dispatch: "ship sequence executes
against the directive state at G3 authorization time; revisions go
forward to next milestone, not retro". W3 pre-ship deliverables were
prepared against the W1 ship state at W1C verdict PASS; no mid-W3
revisions raced the deliverable boundaries.

### Three consecutive G-gate PASSes with zero new nits

W1A G-gate: PASS-WITH-NITS (3 minor nits, 2 of which folded into
W1B). W1B G-gate: PASS 5.0/5.0 (zero new nits). W1C G-gate: PASS
(zero new nits). Three consecutive clean G-gates is strong evidence
that the spec + briefing surfaces produced for this milestone are
well-calibrated. The 8 W0b nits all folded; only 1 Cluster #5
carry-forward is an unusually clean trajectory.

### Test-overshoot pattern is the right kind of over-investment

W1A C3 (13 tests vs spec's 6-8), W1B C7 Sub-1 (29 vs ~8), W1C C5
(15 vs 5-7), W1C C6 (13 vs 4-6) — across all 4 overshoot cases, the
rationale is the same: the implementation surface is genuinely more
complex than the per-component test estimate captured. This is the
right kind of over-investment. **Forward note for v1.49.638 mission
spec template**: "test count is a lower-bound target, not a budget
cap".

## What could be better

### Substrate-probe should be in spec, not W0

C1 + C3 both surfaced substrate misreadings at W0a — too late.
The mission spec author should be doing substrate-probe as part of
the authoring loop, not relying on flight-ops to discover the
delta at W0. The v1.49.638 mission spec template should include a
Stage-1 substrate enumeration requirement before component-spec
finalization. (Captured as Lesson #10192 forward.)

### Sub-agent toolkit lacks SendMessage in this harness

The W1 dispatch chain had no live message-relay between flight-ops
sub-agent and team-lead during execution — the model is iterative-
dispatch (one sub-agent per W1 wave, results returned at completion).
When flight-ops surfaces a substrate-probe finding mid-execution,
the team-lead doesn't see it until the wave returns. For this
milestone the rhythm worked (substrate-probe findings were the kind
that flight-ops can self-correct), but if a probe had surfaced a
spec-level question the dispatch chain would have stalled. **Lesson
#10193** captures this architecture finding.

### Token-ceiling pattern at ~60-70 tool uses

Sub-agents in this harness hit a soft token ceiling around 60-70
tool uses. The W3 commit-between-deliverables discipline is the
mitigation: small, atomic deliverable boundaries with commits between
each so partial work is preserved across ceiling hits. The pattern
should be a sub-agent dispatch template, not a per-mission learning.
(Captured as Lesson #10194 forward.)

## Surprises

### `hunter2` is everywhere

The C3 W0a substrate-probe found 2-3 sites in
`passphrase-flow.test.ts` using `hunter2` as a fixture. The actual
W1A.T3 fold uncovered 8 sites the audit missed. The pattern of
"canonical strong-fixture" being copy-pasted across test files is
load-bearing: each site is correct in isolation but the aggregate
makes a single-fixture replacement a high-coverage operation. The
W1A G-gate carry-forward CF-Nit 2 was specifically the 2 most
visible un-remediated sites; the actual count was higher.

### The audit-tool catalog is the right enforcement boundary

C7 Sub-1's extension to both `tools/perf-assertion-audit.mjs` AND
`scripts/apply-to-self.mjs` KNOWN_PATTERNS means the gates are
mechanically self-checking against the milestone diff. The
apply-to-self self-check (C8 meta-test #10) asserts the milestone's
own new test files comply with the discipline doc — this is the
strongest possible "gates that gate themselves" property. The
v1.49.636 Meta-Lesson (#10180) was about gitignored-artifact
skip-guards; the v1.49.637 self-enforcement pattern is a stronger
form of the same idea.

### C7 Sub-2 closes a 4-cluster forward-note chain

The upstream rename absorb has been deferred at v1.49.634 +
v1.49.635 + v1.49.636 + v1.49.637 (four consecutive clusters). Each
deferral followed the same decision-tree (upstream tag unchanged +
GitHub probe 404). The v1.49.636 close pre-recommended Option (b)
retirement to tracking-only; the v1.49.637 W1B operator honored it.
**Lesson #10196 forward**: cluster close forward-notes are
load-bearing decisions — they pre-script the next cluster's path-
of-least-resistance.

## Process observations forwarded

### Recommend for v1.49.638 mission spec template

1. **Stage-1 substrate enumeration** as a mission-package authoring
   loop step (per Lesson #10192)
2. **"Test count is a lower-bound, not a budget cap"** explicit note
   so flight-ops doesn't second-guess the overshoot pattern
3. **Commit-between-deliverables discipline** as a sub-agent
   dispatch template (per Lesson #10194)
4. **C8 meta-test scaffold** including the apply-to-self self-check
   pattern (gates that gate themselves)
5. **C7 Sub-X retirement criteria** documented (when does a multi-
   cluster carry-forward retire to tracking-only?)

### Recommend for next G-gate

- T13 build-quality verdict should explicitly flag the live
  `STATE.md` `### Decisions` prose-WARN as "expected per C6 design"
  so the T14 operator doesn't interpret it as a regression.
- T13 dry-run of `pre-tag-gate.sh` step 10 against actual repo state
  (synthetic-tag tests cover the script logic; dry-run catches
  integration issues with gitignored ground-truth at T14 time).
- Ground-truth STORY.md authoring window between T13 PASS and T14
  ship execution should be an explicit hand-off step in the W3
  closing summary.
- Confirm `SC_SKIP_CI_GATE_TESTS` is empty/unset at T13 (no
  v1.49.637-specific CI reds were surfaced during W1).
