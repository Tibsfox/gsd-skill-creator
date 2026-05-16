# Forward Lessons — v1.49.658

Lessons codified at v1.49.658 for forward application by successor milestones.

## Lesson #10334 — Catalog index cards are summaries

**Status:** NEW
**Antecedent:** #10268 (gate-not-vigilance)
**Surface:** catalog-index card authoring on any track (MUS, NASA, ELC, SPS, TRS); editing `tools/update-catalog-indexes.mjs`; modifying FTP-synced `www/tibsfox/com/Research/<TRACK>/index.html`

**Rule:** Catalog index cards are summaries; substrate-rich detail lives only on the linked degree page.

**Enforcement:** `tools/update-catalog-indexes.mjs --check` extended with `auditTrackTemplates()` BLOCKER (exit 8). Runs at pre-tag-gate step 8. Hard limits per `tools/catalog-card-template/spec.mjs`:

- Total card bytes ≤ 1,500
- degree-num text ≤ 80 chars
- degree-title text ≤ 150 chars
- per-META field text ≤ 120 chars
- Per-track required META fields (regex-aware for variable field names like `S\d+`)
- No inline `<a>`, `<br>`, `<div>`, `<style>`, `<script>` markup
- No substrate-arc narratives, lesson refs `#1xxxx`, FA-N-N RESOLVED markers, `obs#N first-instance` markers, cross-track substrate-emergent descriptions

**How to apply:** When authoring a new degree-advancing milestone, render the catalog-index card as a summary only. Substrate-rich content (cross-resonance narratives, substrate-arc closures, V-flag emissions, lesson observations) goes on the linked per-degree page. The gate will BLOCK the ship at T14 if cards drift.

## Lesson reinforced — #10268 gate-not-vigilance at obs#2

**Antecedent emission:** Lesson #10268 originally codified at v1.49.585.
**v1.49.658 reaffirmation:** /btw operator request "make sure we follow a template to prevent drift in the future" converted directly to BLOCKER gate, not prose rule. Second-instance demonstration of #10268 in action.

**How to apply:** When the operator flags drift with a forward-looking prevention ask ("make sure we don't drift again", "we keep doing X wrong"), the response should be a gate (deterministic, runs at pre-tag-gate, BLOCKER exit code), not a prose rule (vigilance-dependent, fails open). If the drift can't be expressed as a gate, that's evidence the rule isn't precise enough yet.

## Lesson — sub-agent W1 dispatch surfaces architecture divergences before W2 build

**Pattern:** v1.49.658 W1 dispatched 10 parallel Sonnet sub-agents, one per component. Three returned with material architectural divergences from the initial spec (NASA JS-rendered; SPS no catalog; TRS field-incomplete). These surfaced *before* W2 build started, allowing scope re-shaping at zero rework cost.

**How to apply:** When mission scope spans multiple sibling tracks/subsystems assumed to be parallel, dispatch per-component W1 sub-agents BEFORE committing to W2 build. Each sub-agent should verify its component's source-of-truth file paths and report architectural anomalies. The cost is ~5K tokens per sub-agent; the value is preventing W2 builds against wrong assumptions.

## Lesson — Honest forward-routing beats false-completion

**Pattern:** v1.49.658 ships with MUS + ELC backfill (literal /btw resolution) and forward-routes NASA + SPS + TRS to v1.49.660 via FA-658-1/-2/-3. The architectural-divergence recovery path documented in the milestone spec is invoked, not pretended-away.

**How to apply:** When a wave-3 verify surfaces gaps too large to close in-milestone (architecture divergence, time-box exceeded, sub-agent ceiling hit), the right move is:
1. Ship the achievable subset under the original /btw scope
2. Forward-route via FA-NNN-N entries in retrospective (NOT amended into predecessor)
3. Document the gap in 00-summary as "what did NOT ship"
4. Carry the component-spec work forward unchanged (it's reusable input for the follow-on)

This is structurally identical to v1.49.585's "ship at 16-component scope, forward-route 4 deferred items via FA-585-N" pattern. Counter-cadence missions should NOT chase 100% scope at the expense of ship discipline.
