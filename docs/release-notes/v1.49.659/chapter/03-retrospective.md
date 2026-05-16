# Retrospective — v1.49.659

## What worked

### Parallel research synthesis at the start

The 60-paper May 2026 arxiv synthesis (executed in the v1.49.658 timeframe via 4 parallel research sub-agents, ~12 min wall) gave this milestone a concrete deliverable matrix in section 2.4. Without that synthesis the build-out would have been ad-hoc; with it, the milestone closes by shipping 4/8 enumerated items and explicitly forward-routing the rest. Lesson confirmed: research-mission-first pattern produces actionable, scoped build-outs.

### Skip-rule discipline pays off measurably

This milestone authored 3 skip-path probes (IR-01, EGS-03, EGS-04, STP-03) before running them. Result: 4/4 skip rules fired correctly in the v2 broader-bank audit. The single most valuable signal from this session is the empirical proof that calibrated skip rules eliminate ceremony — the v1 audit had flagged intent-router for `refine` precisely because of unfired skip rules; the v1.0.2 edit + v2 audit shows the fix works. This is the kind of measurable skill-quality delta that pass-rate alone cannot produce.

### Counterfactual-trace audit as live methodology

The CTA methodology was previously a skill (`skill-counterfactual-audit`) with no operational machinery. This milestone closed the loop: probe banks → audit reports → skill version bumps → re-audit. The recursive cycle worked end-to-end on its first run. Specifically: v1 audit surfaced `intent-router` ceremony → v1.0.2 edit → v2 audit verified the skip rule fires → bank extended with PASS probes + out-of-scope probes for the next cycle.

### Parallel sub-agent dispatch at scale

24 sub-agents in one message worked cleanly with ~5 min wall-clock and ~1.3M token cost. The previous high-water mark was 7 parallel; 24 is a new ceiling demonstration. No coordination failures, no retries needed. Note: per CLAUDE.md sub-agent-dispatch-discipline, sub-agents are spawn-and-return without inter-peer SendMessage, so this is wide-fan-out star pattern, not true mesh.

## What didn't work

### Single-probe v1 audit was honestly bounded

The v1 audit (1 probe per skill, 6 sub-agents) gave the wrong verdict for intent-router (`refine`) even though the underlying skill was mostly fine. The bounded-claim caveats were correct; the fix was to widen the bank (12 probes → 17 after extensions). Lesson: probe count matters more than total dispatch count. Future audits should not run with fewer than 3 probes per skill.

### Spectral-topology-preflight missed the SendMessage constraint

The v2 STP-01 and STP-04 baselines (without-skill agents) caught a platform constraint the skill itself was unaware of: Claude Code subagents are spawn-only, so ring/mesh/critique-route topologies cannot be wired directly between workers. The spectral menu collapses to star in this runtime. The v1.0.1 supplement adds a "platform-constraint check" paragraph, but the original skill missed this in v1.0.0 despite being authored in a session where the constraint was already in MEMORY.md. Lesson: skills authored in the abstract need a "runtime feasibility" check before they ship.

### STP-02 verdict divergence revealed a scope mismatch

The v2 STP-02 PASS probe (K₅ on consensus) produced opposite verdicts: with-skill correctly emitted PASS (K₅ is spectrally optimal for consensus); without-skill recommended DON'T RUN (echo-chamber, anchoring, coverage concerns). Both are defensible — they optimize different failure modes. The audit surfaced that the skill's diagnostic is sound on its terms but ignores practical concerns a human dispatcher would weigh. The cleanest resolution is the new `STP-07` out-of-scope humility-check probe added this milestone, not further skill edits.

### Two back-to-back counter-cadence milestones

v1.49.658 was counter-cadence; v1.49.659 is also counter-cadence. The counter-cadence-discipline doc predicted productive cadence every ~30 milestones; we're at every-other. STS-51-D Discovery (the originally-scoped v659 work) was deferred to v1.49.660. This is a real schedule slip on the NASA-degree-advancing cadence, even though the substitute work is high-value infrastructure.

## Surprises

### Audit cost was tractable

24 paired sub-agents at ~50K tokens each = ~1.3M tokens. At Sonnet rates this is on the order of $5-10 — small enough to run audits regularly, not so small that it's invisible. The cost is dominated by sub-agent tokens, not LLM API calls (the probes use execution + reasoning, not external services).

### Apply-to-self false positives were fast to fix

The 2 blockers (`bridge.test.ts`, `fetcher.live.test.ts`) were a 2-line fix in each file (rename a fixture string, label a warmup comment). The temptation was to add allowlist entries; the cleaner path was in-place fixes. The allowlist exists for true bypasses (the meta-test fixture case in `tests/integration/v1-49-637-meta-test.test.ts`), not for pattern-detector false positives. This is now Lesson #10339.

### Sub-agents independently surfaced the SendMessage constraint twice

In STP-01 and STP-04 (different probes, different sub-agents, no shared context), without-skill agents both independently surfaced the Claude Code spawn-only constraint. The MEMORY.md citation was the same in both cases. This is a positive signal that MEMORY.md is being read by sub-agents — but also a negative signal that the skill itself wasn't consulting MEMORY.md before recommending topologies.

## Forward decisions

- **Resume NASA cadence at v1.49.660** with FA-659-1 STS-51-D Discovery as the lead deliverable. The catalog-card gate (v658) is still load-bearing; the STS-51-D card MUST conform.
- **Run a 5-week pattern review at v1.49.690** on whether back-to-back counter-cadence is sustainable. If yes, codify the alternation as the new norm; if no, force NASA cadence and queue research-driven counter-cadence less aggressively.
- **Author 2-3 more PASS probes per FAIL-class skill** in the next audit cycle (FA-660-X candidate). The STP false-warn rate is measured at 0% with 1 PASS probe; need 2-3 for a reliable rate.
- **Build skill-audit runner v0.2 (`collect` subcommand)** so audit cycles become one-command. Currently the dispatch is one command (`run.mjs plan`) but the collection + report-writing is still manual.
