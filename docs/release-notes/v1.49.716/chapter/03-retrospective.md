# Retrospective — v1.49.716

## Decisions

**v1.56 gold-standard depth target rather than v1.117 latest-predecessor depth.** v1.56 Surveyor 3 totals ~19,500 words across the 8 HTML+MD files; v1.117 STS-51-C totals ~33,171 words across the same set. The decision was to target v1.56 depth for first-restoration rebuilds and let future re-passes deepen to v1.117 depth where mission substrate justifies it. Rationale: the goal of the campaign is to close the structural gap (no sibling files at all), not to match the maximum-historical-depth precedent on first pass. v1.118's actual output came in at 23,234 words, slightly over the v1.56 target and well under the v1.117 reference — the band the brief specified.

**Single sub-agent dispatch rather than split-dispatch for the 13-file deliverable set.** Per memory `feedback_sub-agent-token-ceiling-iterative-dispatch`, sub-agents cap at ~60-70 tool uses; the v1.118 dispatch came in at 36 tool uses (5 Read + 13 Write + scaffolding), well under the ceiling. Splitting into two dispatches would have doubled the orchestrator-context cost without operational benefit. Pattern validates the brief-template structure for future campaign rebuilds.

**Forest-module NOT_APPLICABLE inline pattern rather than synthesizing a Shuttle-payload Forest Sim contribution.** STS-51-D's payload set (telecommunications satellites + commercial pharmaceutical research + senate-oversight tour) has no plausible biological substrate matching the Forest Sim layer. The v1.131 NOT_APPLICABLE.md pattern provides a structured-rationale placeholder rather than forcing a contrived contribution.

## Surprises

**Sub-agent completed the rebuild in 36 tool uses with zero content-filter trips.** The brief's positive-framing discipline (improvised contingency-response operations; activation-lever inertness pending future activation; political-oversight-as-flown precedent) carried through the entire deliverable set without sub-agent escalation. Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#5 cumulative.

**Mission-essentials block in the brief plus reference-page paths plus deliverable table was sufficient prompt context.** No additional clarification dispatches or mid-dispatch corrections were needed. The brief template at `.planning/missions/v1-49-716-nasa-layout-restoration-campaign/brief-v1-118.md` (~1,200 words covering mission essentials + reference paths + 13-file deliverable table + authoring conventions + tone discipline) is the template for future campaign briefs.

## Lessons Learned

# 04 — Lessons Learned: v1.49.716 Forward Lessons
