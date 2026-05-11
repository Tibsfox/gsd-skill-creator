# 04 — Lessons: v1.49.637 Housekeeping Cluster #4

Forward lessons emitted by this milestone. Numbering continues from
the v1.49.636 set (last forward-emitted: #10191 — Ship-time
directives are atomic).

---

### Lesson #10192 — Substrate-probe before component-spec finalization

**Type:** Mission-package authoring discipline
**Surfaced at:** C1 W0a (3-site gating shape vs spec's 1-site assumption); C3 W0a (`@zxcvbn-ts/language-en` does NOT export `adjacencyGraphs`); C3 fixture audit (8 `hunter2` sites vs audit's 2-3)
**Closes at:** v1.49.637 W1A
**Generalizes:** v1.49.635 Meta-Lesson #10180 (audit underestimates fixture scope)

#### Pattern

Mission-package specs that name a substrate (cargo feature gate site,
package export shape, fixture-replacement scope) MUST include a
Stage-1 substrate enumeration in the authoring loop. The
enumeration is mechanical: grep the actual file shape, read the
actual package export surface, count the actual fixture sites.

The cost is real (5-15 min per substrate per component) but the
cost-of-NOT-doing-it is shipped substrate misreadings that surface
as W0a delta findings or, worse, as W1 mid-execution corrections.

#### Three concrete instances at v1.49.637

1. **C1 cargo feature gating**: spec assumed `#[cfg(feature = "...")]`
   single-site gate; actual was 3 gated modules + a re-export. W0a
   probe surfaced this before W1A start.
2. **C3 @zxcvbn-ts package shape**: spec assumed
   `@zxcvbn-ts/language-en` exports `adjacencyGraphs`; actual export
   surface is `dictionary` + `translations` only. W0a probe
   surfaced this; spec adjusted.
3. **C3 fixture replacement scope**: spec/audit estimated 2-3
   `hunter2` sites in `passphrase-flow.test.ts`; actual was 8. W1A
   uncovered the additional 5+ during the singleton-init refactor.

#### How to apply

In future mission-package authoring:
- Each component spec that names a substrate must include a
  "substrate snapshot" sub-section enumerating the actual sites
  (paths + line numbers + literal shapes).
- The snapshot is mechanical (not interpretive) — `grep -rn` output
  copy-pasted into the spec section.
- W0a probe stage continues to exist as a fallback (substrate may
  drift between spec authoring and W1 start) but the FIRST line of
  defense is the spec author doing the probe themselves.

---

### Lesson #10193 — Sub-agent toolkit lacks SendMessage; iterative dispatch is the architecture

**Type:** Sub-agent harness architecture finding
**Surfaced at:** W1 dispatch chain (flight-ops sub-agents have no live message-relay to team-lead during execution)
**Closes at:** v1.49.637 W1 retrospective (architectural finding; no code fix — this is the harness shape)

#### Pattern

In this sub-agent harness, the dispatch model is iterative: team-
lead dispatches a sub-agent with a complete brief, sub-agent
executes, sub-agent returns results at completion. There is no
SendMessage / live-relay tool that lets the sub-agent surface a
question or pause mid-execution.

This is a feature, not a bug — the harness rewards comprehensive
briefs and self-correcting sub-agent execution. But it means
mission-package design must anticipate the cases where mid-execution
surfacing would have helped.

#### Mitigation strategies

- **Comprehensive briefs**: dispatch packets should include every
  ground-truth path, expected file shape, and decision-tree branch
  the sub-agent might encounter
- **Self-correction authority**: sub-agent must have authority to
  make local decisions (substrate-probe-driven spec adjustments,
  fixture-scope expansion) without round-tripping to team-lead
- **Atomic deliverable boundaries**: break long sub-agent runs into
  multiple shorter dispatches (per Lesson #10194 token-ceiling
  pattern) so the team-lead can route between deliverables instead
  of within them

#### How to apply

When designing mission packages for this harness:
- Component specs should be self-contained (no inter-component
  dependencies that require live coordination)
- Wave boundaries are the natural coordination points; intra-wave
  parallelism assumes sub-agents don't need to talk to each other
- If a mission needs live coordination (e.g., multi-component
  cross-edit on the same file), break it into smaller per-component
  dispatches

---

### Lesson #10194 — Token-ceiling pattern: ~60-70 tool uses; commit-between-deliverables preserves work

**Type:** Sub-agent execution discipline
**Surfaced at:** W1 (earlier sub-agent dispatches hit token ceiling mid-second-deliverable); W3 (commit-between-deliverables sequence prevents work loss)
**Closes at:** v1.49.637 W3 pre-ship

#### Pattern

Sub-agents in this harness hit a soft token ceiling around 60-70
tool uses (highly dependent on context size + tool output verbosity).
When a sub-agent is asked to deliver N artifacts in sequence
(meta-test + release-notes + handoff doc, for example), hitting the
ceiling between artifacts means partial work is lost.

The mitigation is **commit-between-deliverables discipline**: each
artifact lands as an atomic commit before the sub-agent moves to the
next. If the ceiling hits mid-deliverable, the prior commits are
preserved and the team-lead can redispatch for the remaining work
with a fresh context.

#### Concrete instance at v1.49.637

W3 pre-ship dispatch explicitly sequenced:
1. C8 meta-test → COMMIT (`2ce35f954`)
2. Release-notes (6 files) → COMMIT (this commit)
3. HANDOFF doc → working-tree (gitignored, no commit)

The dispatch packet included explicit "if you hit ceiling between
deliverables, work-so-far is preserved; team-lead redispatches for
remaining". This is the right shape for any multi-deliverable W3 or
multi-component W1 sub-agent dispatch.

#### How to apply

For sub-agent dispatch templates:
- Estimate tool-use budget per deliverable (read for context + write
  for artifact + read for validation + commit ≈ 4-8 tool uses per
  small deliverable, 15-30 for large)
- If estimated total > 50, sequence with explicit commit boundaries
- Document the "ceiling-hit recovery" pattern in the dispatch packet
  so the sub-agent knows it can stop cleanly between deliverables

---

### Lesson #10195 — Dual-disposition: one component can have multiple test outcomes

**Type:** Component disposition discipline
**Surfaced at:** C4 W1B (per_project_clear fix-inline + lru-promote cluster-5-defer)
**Closes at:** v1.49.637 C4

#### Pattern

A component that owns multiple test failures of similar surface
shape (e.g., both `#[ignore]`'d atlas tests at v1.49.636 close) may
have **heterogeneous root causes**. Treating the multi-test failure
as a single disposition (either all-fix or all-defer) forces a
worst-case decision that either commits architectural work into a
housekeeping budget OR leaves a 5-min fix on the table.

The **dual-disposition pattern** is: investigate each test
independently, route each by its own root-cause analysis. One test
may be a 5-min test-contract fix; another may be a 2-4h
architectural rework. Each gets its own disposition.

#### Concrete instance at v1.49.637

C4 component had two `#[ignore]`'d atlas tests:
- `per_project_clear_with_unknown_project_id_falls_back_to_full_clear`
  — root cause: test contract mismatch (`evicted == 0` vs honest
  count). Fix: flip expectation to `evicted == 1` with rationale
  comment. Time: ~5 min. Disposition: **fixed-inline**.
- `lru_access_promotes_keeps_entry_alive_under_eviction` — root
  cause: test design mismatch with batch-load semantics in
  `get_all_project_conns()`. Fix: requires architectural rework
  (batch-load semantics change). Time: 2-4h. Disposition:
  **cluster-5-defer with deeper diagnostic**.

The disposition invariant test
(`tests/__tests__/atlas-test-disposition.test.ts`) asserts each
test's `#[ignore]` annotation state matches the disposition record
— mechanical enforcement of the dual-disposition.

#### How to apply

When a component owns multiple test failures:
- DO NOT default to "treat them all the same"
- DO investigate each independently with explicit root-cause
  analysis
- DO record per-test disposition in a disposition record file (e.g.,
  `.planning/<component>-test-disposition.md`)
- DO write a disposition-invariant test that asserts the record
  matches the source-tree annotations

---

### Lesson #10196 — Cluster close forward-notes are load-bearing decisions

**Type:** Cluster handoff discipline
**Surfaced at:** C7 Sub-2 (v1.49.636 close pre-recommended Option (b) retirement; v1.49.637 W1B operator honored it)
**Closes at:** v1.49.637 W1B

#### Pattern

When a cluster closes with a deferred carry-forward, the close-time
forward-note isn't just informational — it pre-scripts the next
cluster's path-of-least-resistance. The decision is **load-bearing**
in the sense that the next cluster's operator/team-lead reads the
forward-note as a recommendation, not a neutral status report.

The v1.49.636 close forward-note on C7 Sub-2 read: "cumulative
deferral across 3 clusters; recommend Option (b) retirement to
tracking-only if upstream still at v1.41.2 at next cluster open".
The v1.49.637 W1B operator-decision honored the recommendation
without re-litigating the decision tree.

#### Concrete instance at v1.49.637

C7 Sub-2 had been deferred at v1.49.634 + v1.49.635 + v1.49.636 —
four consecutive clusters (counting v1.49.637 entry). Each prior
deferral followed the same decision-tree: upstream `gsd-review` tag
unchanged at `v1.41.2`; GitHub contents probe at
`.claude/commands/gsd` returns 404. Both decision-tree conditions
failed each time.

The v1.49.636 close forward-note recommended Option (b):
tracking-only retirement, re-evaluation criterion = upstream tag
advance past `v1.41.2`. The v1.49.637 W1B operator honored this
without re-running the decision tree. Net result: 4-cluster forward-
note chain closes cleanly.

#### How to apply

When authoring close-time forward-notes:
- BE EXPLICIT about whether the note is informational vs
  recommendatory (e.g., prefix with "RECOMMENDATION:" vs "STATUS:")
- INCLUDE the re-evaluation criterion (when should this be reopened?)
- INCLUDE the decision-tree cumulative state (how many times has
  this been deferred under what conditions?)

When opening a new cluster:
- READ the predecessor's close forward-notes BEFORE drafting the
  mission package
- HONOR recommendations unless conditions have changed (in which
  case document the change explicitly)
- AVOID re-litigating decisions the prior cluster pre-scripted

---

## Forward-tracker entries (for `.planning/RETROSPECTIVE-TRACKER.md`)

| Lesson | Status | Next-Action-When |
|---|---|---|
| #10192 — Substrate-probe before spec finalization | OPEN | v1.49.638 mission spec template update |
| #10193 — Sub-agent harness iterative-dispatch | INFORMATIONAL | architectural finding; no code action |
| #10194 — Token-ceiling commit discipline | OPEN | sub-agent dispatch template update |
| #10195 — Dual-disposition pattern | OPEN | document in `.planning/component-disposition-conventions.md` |
| #10196 — Cluster close forward-notes are load-bearing | OPEN | v1.49.638 mission package authoring guide |
