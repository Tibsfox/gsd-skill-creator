# NASA Mission Authoring Discipline

**Surface:** Authoring or rebuilding NASA degree-campaign mission pages;
choosing direct-author vs sub-agent-dispatch vs hybrid cadence for
same-day degree advances; tracking substrate-axis rotation and
substrate-cohort observations; framing memorial or disaster content for
content-filter safety.

**Codified at:** v1.49.911 (new domain — codified from the v1.49.652–716
NASA mission-authoring campaign UNCODIFIED lesson cluster; counter-cadence
codify-drain ship, counter-cadence #12).

---

## What this domain is

The NASA degree campaign (degrees 1.0–1.178) produced a large body of
operational lessons about *how to author mission pages reliably* — distinct
from the substrate-probe content discipline ([`SUBSTRATE-PROBE-DISCIPLINE.md`](SUBSTRATE-PROBE-DISCIPLINE.md))
and from the generic sub-agent mechanics ([`sub-agent-dispatch-discipline.md`](sub-agent-dispatch-discipline.md)).
These lessons accumulated in release-note retrospectives across v652–v716
but were never wired into the discipline manifest. This doc codifies the
27 campaign-specific lessons; the genuinely cross-cutting members (content-filter
phrasing, dispatch density, protected-path safety, brief accuracy) were
promoted into their natural existing homes and are cross-referenced below.

The campaign **resumed on 2026-06-06** after a deliberate pressure-margin
hold at degree 1.178: autonomous runs 1–4 shipped degrees 1.179–1.217
(v1.49.988–v1.49.1026, 39 ships, full gate every ship, zero content-filter
trips across runs 2–4). The resume runs built a second generation of
operational machinery — DECOMPOSE-build and the 4-auditor adversarial
content review — codified in [section 0](#0-resume-era-machinery-v988v1026--read-this-first-for-new-ships)
below and committed as generic skeletons under `tools/workflows/`
([workflows-library.md](workflows-library.md)). The v652–v716-era lessons in
sections 1–8 remain valid; where the resume-era machinery supersedes one
(#10408), the supersession is marked explicitly.

> ### Generalizable beyond NASA
>
> Several lessons here are NASA-homed for coherence but transfer directly
> to any high-volume, same-day, content-sensitive authoring campaign:
> the authoring-cadence discipline (**#10341**, **#10350**, **#10352**,
> **#10374**), per-page target setting in batch uplifts (**#10270**),
> transient-API retry-first (**#10268**, a campaign re-validation of the
> generic [`#10215`](sub-agent-dispatch-discipline.md) / `#10214`),
> the content-filter meta-statement trap (**#10269**), and
> operator-authorized departure from a lesson default (**#10384**). Read
> these as general dispatch/authoring practice that happens to have been
> first observed in the NASA campaign.

---

## 0. Resume-era machinery (v988–v1026) — READ THIS FIRST for new ships

The v988–v1026 autonomous runs replaced the v652-era W0→W1→W2 pipeline and
the #10408 single-dispatch rebuild with a two-stage committed-skeleton flow.
Both skeletons live in `tools/workflows/` (canonical doc:
[workflows-library.md](workflows-library.md); drift-guard:
`tests/integration/workflows-library-discipline.test.ts`); per-mission
instances are authored as args payloads from the untracked MISSION-BRIEF.md
and are never committed.

### 0.1 DECOMPOSE-build (`tools/workflows/decompose-build.mjs`)

**Why it exists:** single-dispatch builds die at the ~290s sub-agent ceiling
on full-degree page sets. DECOMPOSE-build splits the build into a **page +
artifact-tree decomposition** — the 7 page tasks (index.html / research /
organism / math-sim / papers-curriculum / jsons / pointers-shader), the 4
artifact-tree tasks (artifacts-story-audio / artifacts-circuits /
artifacts-sims / retro-forest), and the conditional readme — each a bounded
sub-5-minute rewrite agent dispatched in parallel: the original 7-page split
ran 8/8 agents ok at ~350s wall-clock, zero ceiling deaths, confirmed 6×
(v1021–v1026).

**W6-debt closure (2026-06-15):** the original 8 tasks rewrote only the track
pages + JSONs + shader, dropping the substrate-era artifact tree (story/
circuits/sims/audio), the retrospective chain, and the forest module — so each
forward degree shipped collapsed and needed a later W6 backfill. The
`artifacts-*`/`retro-forest` tasks rewrite the whole cloned tree in place,
keeping filenames so `index.html` artifact links stay valid, and re-register
the forest module via `tools/nasa-forest-manifest-regen.mjs`. A forward degree
built this way passes `tools/nasa-consistency-audit.mjs` (a ship-gate BLOCKER)
with no separate backfill.

**Leading-edge nav rule (folded in 2026-06-15):** the degree being built is the
newest in the series — its successor does not exist yet — so its `index.html`
nav uses the **leading-edge form**: right cell **Series hub** (`../index.html`),
*never* a "Next mission → successor" link (a dead link the consistency audit
BLOCKs: `NAV_DEAD_TARGET` + `DEAD_INTERNAL_LINKS`). The `retro-forest` task then
**promotes the predecessor**: it flips the predecessor degree's own right cell
Series hub → Next mission → this degree, via the deterministic, idempotent
`tools/nasa-nav-promote-predecessor.mjs --predecessor <P> --new-degree <D>
--new-mission "<name>"` (edits both the top and bottom nav-cards; safe to re-run;
`--check` for a gate). The same task coordinates the **forest-module filename**
(`forestModuleFile` arg) so the index `module source` href and the module rename
cannot desync into a dead link, and the `index.html` task enforces the H1 ≤200 /
breadcrumb ≤160 audit limits. These three were manual post-build fixes on the
v1.221 GRACE ship; the tooling now applies them. Pass `leadingEdge:false` only
to rebuild a *non-newest* degree that already has a shipped successor.

**The SHARED-prompt contract** (every task agent receives it): rewrite
textual content only, preserve HTML/JSON/markdown STRUCTURE exactly; read
the MISSION-BRIEF first (it is authoritative for facts, anchors, engine
state, organism pairing, dedication guidance); the **ANCHORS guard** — use
ONLY the degree's canonical NEW-LOCKED anchors, never carry predecessor
anchors; DISCIPLINE (a)–(e) (positive framing, <=200-word dedications, <=5x
single-word repetition, anchor tag-sentence house style, mode-scoped
predecessor-vocab replacement); and the footer (no commit/tag/push/FTP,
per-HTML-file trip-vocab check with VERDICT PASS, short confirmation
return).

**The rotation-vs-continuation flip (load-bearing):** for an AXIS-ROTATION
build the predecessor vocabulary is NOT shared — essentially every topical
word must be replaced, and ALL predecessor content is a leak except a single
deliberate nav-prev/lineage note. For an INTRA-AXIS CONTINUATION the axis
vocabulary is SHARED and correct — only predecessor-specific items are
leaks. This was previously clone-selection folklore ("clone gp-b-* for a
rotation, wmap-* for a continuation"); it is now the required `mode` arg in
both skeletons.

**Lesson #10408 — SUPERSEDED for catalog-clone rewrites.** The per-mission
single-dispatch rebuild template (~1200-word brief, one general-purpose
sub-agent, 13 deliverables, 28–36 tool uses) is functionally replaced by
DECOMPOSE-build for catalog-clone rewrites: the single dispatch runs into
the ~290s ceiling exactly where DECOMPOSE-build does not, and carries no
ANCHORS guard. #10408 remains valid for constrained harnesses (no Workflow
tool) and for non-clone rebuild work. Marked at the lesson's home in
[Sub-agent dispatch](sub-agent-dispatch-discipline.md).

### 0.2 Adversarial content review (`tools/workflows/content-adversarial-review.mjs`)

Run after the build, before pre-tag-gate, for fresh-topic ships. Four
read-only auditors (2 fact-checkers split by claim cluster + 1
framing/anchor-canonicality + 1 structure/leak) feed a synthesis judge that
independently re-reads every cited file and classifies findings with the
3-way verdict (`real-fix-now` / `real-minor-optional` /
`rejected-false-positive`). Caught-defect ledger — defects no mechanical
gate could catch: v1013 CGRO physics BLOCKER, v1014 Swift terminology
MAJOR, v1023 Dawn 2 MAJOR predecessor-anchor leaks, v1026 GP-B clean
(guard maturity). Cost ~400K tokens/review; accepted per fresh topic.

**The ANCHOR-LEAK guard** (the framing auditor's first duty, always on):
only the degree's canonical anchors may be stamped "NEW LOCKED at v<X>";
predecessor anchors carried over from the cloned source are MAJOR findings;
research.html and research.md must stamp identical anchor sets. Born from
the v1023 Dawn catch; held 3 consecutive clean ships (COBE/WMAP/GP-B);
existed in only 3 of 11 untracked clones before promotion — committing it
ended the silent-regression-by-clone-choice failure mode.

### 0.3 Per-ship flow (resume-era)

Brief (untracked, trip-vocab checked `--mode brief`) → DECOMPOSE-build via
the committed skeleton → adversarial content review → apply fix-now findings
in the main context → mechanical gates (trip-vocab pages, canonical-layout,
sidebar) → pre-tag-gate → the NASA T14 variant
([T14-SHIP-SEQUENCE.md](T14-SHIP-SEQUENCE.md), NASA appendix). Path B
(main-context hand-author) remains the escalation when dispatch trips
(#10402); the substitute-on-trip ladder is unchanged.

## 1. Authoring cadence — direct-author vs dispatch vs hybrid

**Lesson #10341 — DIRECT-AUTHOR-DEGREE-ADVANCE-CADENCE.** The operator can
advance a degree by hand-authoring all release-notes files directly,
skipping the W0→W1→W2 sub-agent dispatch pipeline. This achieves roughly
half the content depth in about a quarter of the wall-clock time, but
removes the W1 correction safety-net. Use only when biographical metadata
has low precision risk and cross-track analysis follows established
patterns; avoid when metadata precision needs deep audit, cross-track
coupling is novel, or operator cognitive load is already high.

**Lesson #10350 — CONSECUTIVE-DIRECT-AUTHOR-CLUSTER-LENGTH-TRACKING.**
Direct-author cadence accumulates metadata-precision drift predictably
across consecutive degrees. Track cluster length explicitly: 1–2
consecutive degrees are low-risk; 3 warrants considering a full W1 dispatch
cycle at the next degree; 4+ demands a dispatch cycle to clear drift before
the correction backlog exceeds absorption capacity.

**Lesson #10352 — DIRECT-AUTHOR-WITH-W2-DISPATCH-HYBRID.** Direct-author
cadence alone cannot meet depth-audit gates (e.g., 538+ lines, 102K+ bytes,
5–7 named canonical sections for staged decks). Resolve by hand-authoring
release-notes and cross-track work while inlining a focused W2 sub-agent
dispatch for the depth-required canonical-deck sections only. This hybrid
runs ~1.5–2h per degree with depth gates met; sustainable for 4–8
consecutive degrees, then trigger a full W0→W1→W2 cycle.

**Lesson #10374 — SINGLE-CC-MILESTONE-FOR-NARROW-THRESHOLD-RESPONSE.** Scale
the counter-cadence response to debt breadth: a narrow, specific recurrence
(e.g., the STATE.md normalizer drift) takes a single-milestone cleanup;
broader operational debt takes a multi-milestone cluster; a comprehensive
sweep takes a larger cleanup. Pair every fix with a deterministic pre-tag
gate to prevent recurrence.

**Lesson #10376 — INTER-FLIGHT-GAP-AS-SUBSTRATE-ROOM.** Long gaps between
major program milestones (the 32-month post-Challenger stand-down 1986-01 →
1988-09; a 52-day STS-29→STS-30 inter-flight gap) are scope-isolated
windows to advance non-immediately-related authoring without preempting the
main-thread mission sequence. Measure the gap duration and use it as a work
window.

## 2. Same-day cluster-length monitoring & counter-cadence triggers

**Lesson #10348 — SUBSTRATE-ANCHOR SHORT-TIME-LAG VALIDATION.** When a
predicted future event (a substrate-anchor) will validate within ~1 month
of emission, flag it at W0 as near-term-verifiable
(HIGH-PROBABILITY-VALIDATION-AT-NEXT-DEGREE) rather than treating it as a
multi-year forward-shadow. This focuses attention on operationally
checkable predictions versus long-horizon anticipation and improves
planning accuracy.

**Lesson #10354 — THREE-CONSECUTIVE-SAME-CALENDAR-DAY-DEGREE-ADVANCE.** When
three or more degree-advances ship on the same calendar day, cognitive load
and metadata-precision drift may approach correction-absorption limits. At
4–5 consecutive same-day degrees, consider breaking cadence with longer
intervals; at 6+, a full W0→W1→W2 dispatch cycle becomes required to clear
accumulated drift.

**Lesson #10356 — FOUR-CONSECUTIVE-SAME-CALENDAR-DAY-DEGREE-ADVANCE.** Four
consecutive same-day ships is a workload threshold: explicitly decide
whether to insert a 1–4 milestone counter-cadence cluster to resolve
structural debt (staged-deck deficit, catalog-card gaps, metadata drift) or
continue direct cadence at the risk of exceeding healthy boundaries.

**Lesson #10371 — SAME-DAY-THRESHOLD-HIT-AS-CC-CLUSTER-TRIGGER.** When the
4-consecutive same-day threshold (#10356) is hit, trigger a counter-cadence
cluster preemptively as a discipline-driven pause, rather than waiting for
debt symptoms to surface. First applied v671; sustained as
operator-authorized departures across extended sessions.

## 3. Dispatch coordination across concurrent mission work

**Lesson #10268 — TRANSIENT-API-RECOVERY-VIA-RETRY (campaign re-validation).**
When a sub-agent dispatch hits a transient API failure (socket timeout,
mid-write disconnect), retry with the identical prompt first; only modify
the prompt if the same request fails twice. A NASA-campaign re-validation of
the generic retry-first discipline (cross-ref [`#10215`](sub-agent-dispatch-discipline.md)).

**Lesson #10271 — COUNTER-CADENCE-TRIO-PATTERN.** The three-milestone
pattern (infrastructure → content-part-1 → content-part-2) is the
established closure strategy for cross-track drift classes affecting 8+
pages with 3+ missing structural elements. At v654–v656 it closed a drift
class in ~24h wall-clock. Transfers to future cross-track drift of
comparable magnitude (cross-ref the [counter-cadence](counter-cadence-discipline.md)
two-milestone scaffold-then-fill pattern, Lesson #10265).

**Lesson #10349 — NUMBERED-OUT-OF-ORDER.** When mission numbering and launch
order diverge (e.g., a Spacelab payload-3 launching before payload-2),
explicitly identify the root cause — payload-availability asymmetry,
joint-program constraints, or internal-program sequencing. International-program
numbering systems differ fundamentally from internal-program numbering in
their planning and procurement integration, and the distinction matters for
substrate-coupling.

## 4. Substrate-axis rotation & stability discipline

**Lesson #10270 — INTER-SIBLING-BYTE-RATIO-CASCADE.** In asymmetric
multi-page uplifts (adding missing content blocks across pages with
variable depth per page), set explicit line/byte targets per page to avoid
aggregate byte-ratio gate failures relative to a predecessor baseline even
when every page individually exceeds baseline. Allow graceful byte-density
variance when structural completeness is healthy.

**Lesson #10345 — EXPANSION-DENSITY-RECURSION.** When a content cohort takes
three consecutive "pivot" entries — each opening a fundamentally new
category rather than deepening an existing one — density saturates. After
3–5 consecutive pivots, return to a previously-opened category to deepen it
and prevent long-term cohort complexity.

**Lesson #10381 — SUBSTRATE-AXIS-ROTATION-DISCIPLINE.** When transitioning
between substrate-distinct program axes (spaceflight-physical →
investigation-policy; Soviet-program-continuity → modular-expansion;
US-Shuttle-RTF → planetary-deployment), declare the axis rotation explicitly
in the mission badge and engine state, frame the new substrate as distinct
from its predecessor, and hard-block predecessor-context leakage while
keeping legitimate cohort links (shared commissioners, decision-makers,
program continuity). Rotation applies at intra-program scope granularity.

**Lesson #10394 — INTRA-PROGRAM-STABILITY-SUSTAINED.** When a program
continues across milestones within the same axis and domain (Spirit →
Opportunity, both MER), record it as sustained stability, NOT a rotation —
the substrate-axis rotation count does not increment. Document
program-continuity explicitly to prevent erroneous rotation-count inflation.

**Lesson #10395 — SUBFORM-WITHIN-AXIS.** A single sustained axis can host
multiple distinct functional forms (surface rover, orbital survey, next-gen
rover, upper-atmosphere orbiter) without an axis rotation. Track each
distinct subform as a cumulative observation within axis-stability tracking;
preserve the rotation count while recording functional distinctions.

## 5. Substrate-cohort & substrate-anchor observation accounting

**Lesson #10389 — COHORT-PAIR-ANCHORED-AT-MILESTONE.** When a program spans
multiple milestones with paired observations (launch and landing;
dual-rover deployment), anchor the substrate-cohort pair at a single
milestone and track its realization/closure through later milestones.
Distinguish anchor-only observations from pair-realization observations to
avoid artificial inflation of discipline counts.

**Lesson #10397 — MULTI-DECADE-OPERATIONAL-LIFETIME-MARS-ORBITER.** Orbital
missions reach operational lifetimes of ~20 years (MRO ~20, MAVEN ~12),
substantially exceeding surface-rover lifetimes. The operational envelope
(power system, orbit stability, radiation environment) differs
fundamentally, so record orbital-class multi-decade lifetimes distinctly
from surface-class ones, as a sustained mission-class attribute.

**Lesson #10398 — COHORT-OPENS-WITH-DEFERRED-REALIZATION.** A mission cohort
(e.g., MARS-ORBITAL-SURVEY-COHORT) can open as a defined class at one
milestone with its full realization deferred across future milestones (MRO
opened the cohort at v698 with MAVEN/ExoMars/Hope/Tianwen-1 to follow).
Record cohort-opens-with-deferred-realization distinctly from
immediate-realization cohort-pairs: the first observation establishes the
template, later missions fill the anticipated slots.

**Lesson #10399 — SUBSTRATE-ANCHOR-REALIZATION-OBSERVATION.** When an anchor
mission acquires a fresh realization at a later milestone (the
MRO-communications-relay anchor realized via MSL's UHF relay; the
orbital-survey cohort's 2nd realization via MAVEN), track each realization
as a cumulative, chronologically-ordered observation. This records how
foundational missions propagate capabilities forward.

## 6. Mission-brief accuracy & forward-reference state tracking

**Lesson #10250 — FORWARD-REFERENCE STATE TRACKING (Hauck-as-RTF-commander).**
For multi-milestone forward references (an astronaut's anticipated future
command role), model intermediate state transitions explicitly as the
reference evolves, rather than treating it as simply open or closed. The
Hauck RTF-commander reference moved from initial shadow state to
"commander-milestone-observed" at his second flight while the final RTF role
remained outstanding. (Sibling of the brief-accuracy promotion **#10366**,
homed in [Mission package framing](MISSION-PACKAGE-DISCIPLINE.md).)

**Lesson #10346 — ENGINEERING-ROOT-CAUSE SUBSTRATE-ANCHOR (tire-burst →
Edwards mandatory-landing).** When one operational event drives a
procedural change (a tire burst on landing → the Edwards mandatory-landing
policy shift), document it as the substrate-anchor at first observation
rather than retroactively, so the change's propagation can be tracked
forward. Applies to brake-procedure, tile-remediation, O-ring-redesign, and
engine-redesign root-causes: name the anchor, flag the forward-shadow, track
validation across milestones.

## 7. Content-filter & memorial-substrate framing (NASA-specific)

**Lesson #10269 — CONTENT-FILTER META-STATEMENT GAP.** When enforcing a
content filter (e.g., a forbidden-substring audit for AI attribution),
forbid meta-statements *about the policy itself*, not just the forbidden
content. A dispatch that literally included "No Claude attribution" to
document the policy tripped the audit on the substring "Claude". Sibling of
the don't-enumerate-forbidden-tokens rule (**#10406**, [Sub-agent dispatch](sub-agent-dispatch-discipline.md)).

**Lesson #10380 — MEMORIAL-SUBSTRATE-RESPECT-DIRECTIVE.** For missions
spanning crew deaths or memorials, include explicit memorial-respect
directives in sub-agent prompts: correct calendar dates, locations, and
circumstances; engineering-professional register; memorial-continuation
links from investigation milestones back to crew honors; avoid
calendar-coincidence confusion that would obscure the human record.
(Operationalized by the content-filter-safe phrasing discipline **#10387**,
[Sub-agent dispatch](sub-agent-dispatch-discipline.md).)

## 8. Operator-directed departures & pivots

**Lesson #10384 — OPERATOR-AUTHORIZED-DEPARTURE-FROM-LESSON-PATTERN.** When
the operator explicitly requests a scope or pattern departure from a prior
lesson's default recommendation, document the departure at the milestone
where it occurs as substrate-distinct; the original lesson remains valid for
default application. Operator authority overrides lesson-default when
scope-expansion is explicitly requested, and the departure may itself
substantiate a complementary lesson-variant.

**Lesson #10390 — OPERATOR-DIRECTED-MID-CADENCE-SUBSTRATE-AXIS-PIVOT.** When
the operator redirects mission-authoring focus mid-cadence to a different
program family (e.g., crewed shuttle → robotic deep-space), record this as
an operator-directed pivot, distinct from a routine substrate-axis rotation.
This tracks operator-initiated strategic direction changes within a single
campaign.

---

## Cross-references — reusable lessons promoted to existing homes

The hybrid drain (v911) promoted the genuinely cross-cutting NASA-campaign
lessons into their natural existing discipline homes. They are listed here
so a mission author finds them from this doc, but their canonical home is
elsewhere:

| Lesson | What it is | Home |
|---|---|---|
| **#10366** | Mark mission-brief historical assertions "(preliminary; verify)" — delegate verification to the first sub-agent step | [Mission package framing](MISSION-PACKAGE-DISCIPLINE.md) |
| **#10367** | Specify unambiguous sub-agent deliverable destinations + commit patterns (docs/ tracked vs www/ published) to avoid protected-path-bypass guesswork | [Self-modification safety](../project-claude/hooks/self-mod-guard.js) |
| **#10369** | Sub-agent dispatch as a clean cadence alternative to direct-author for non-conflicting concurrent work | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |
| **#10378** | Dual-direction substrate-form hard-block (predecessor-leak AND forward-shadow-preemption) in dispatch prompts | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |
| **#10383** | Sub-agent content-filter mitigation: inspect partial completion, decompose the trigger pattern, author the remainder inline | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |
| **#10385** | Shared filename manifest in concurrent dispatch prompts to prevent filename-coordination drift | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |
| **#10387** | Content-filter-safe phrasing (date-pair memorial form, no event-circumstance language, single memorial section, engineering register) | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |
| **#10388** | Foreground-author full-rewrite-at-scale recovery when a dispatch trips mid-stream | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |
| **#10402** | Secondary-trip-vocab density threshold → Path B (main-context hand-author) selection (primary > 0 OR secondary > 5) | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |
| **#10406** | Positive-framing dispatch discipline; don't enumerate forbidden tokens (they self-replicate); planetary-protection-as-planned-final-state framing | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |
| **#10407** | Dispatch-prompt density budget applies to the prompt itself, not just the brief — describe behavioral guidance abstractly | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |
| **#10408** | Per-mission single-dispatch rebuild template (~1200-word brief, general-purpose subagent, 13 deliverables, 28–36 tool uses). **SUPERSEDED for catalog-clone rewrites by DECOMPOSE-build (§0.1, v1.49.1031); remains valid for constrained harnesses / non-clone rebuilds** | [Sub-agent dispatch](sub-agent-dispatch-discipline.md) |

## Cross-references — sibling discipline docs

- [`SUBSTRATE-PROBE-DISCIPLINE.md`](SUBSTRATE-PROBE-DISCIPLINE.md) — substrate-form content discipline (the WHAT; this doc is the HOW-to-author)
- [`MISSION-PACKAGE-DISCIPLINE.md`](MISSION-PACKAGE-DISCIPLINE.md) — W0 brief framing, trip-vocab budget (#10401), closure-verification gate
- [`sub-agent-dispatch-discipline.md`](sub-agent-dispatch-discipline.md) — generic dispatch mechanics + the promoted content-filter / dispatch-cadence lessons
- [`counter-cadence-discipline.md`](counter-cadence-discipline.md) — the cadence framework these same-day-cluster thresholds feed
- [`workflows-library.md`](workflows-library.md) — the committed skeletons behind §0 (DECOMPOSE-build, adversarial content review, audit harness)
- [`T14-SHIP-SEQUENCE.md`](T14-SHIP-SEQUENCE.md) — the NASA T14 appendix (the resume-era ~14-call per-ship sequence)
- Memory: `feedback_nasa-ship-sequence-streamlined`, `feedback_nasa-path-b-substrate-anchor-count`, `feedback_nasa-brief-secondary-trip-vocab-classes`, `feedback_positive-framing-dispatch-discipline`, `feedback_nasa-canonical-sibling-rebuild-pattern`
