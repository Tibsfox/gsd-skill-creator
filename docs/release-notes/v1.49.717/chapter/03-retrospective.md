# Retrospective — v1.49.717

## Decisions

**v1.118 rebuilt-this-campaign reference rather than v1.117 historical reference for template.** The brief pointed primarily at v1.118 (rebuilt 30 minutes earlier under the same campaign brief structure) rather than v1.117 (last historical predecessor). Rationale: v1.118 is the closer template for what the campaign produces; v1.117 is the era-predecessor depth aspiration. Sub-agent output came in deeper than v1.118 (~419 KB vs ~280 KB) and approaches v1.117 depth (~600 KB historical) — depth drift toward v1.117 is acceptable and welcome.

**Forest-module functional contribution rather than NOT_APPLICABLE.md.** v1.119 ships a real `forest-module/spacelab3-rodent-microgravity.js` (~7 KB; 150 lines) because Spacelab-3's first-Shuttle-rodent-experiment (24 rodents + 2 squirrel monkeys) provides biological substrate that maps to the Forest Sim biological-substrate layer. v1.118 used NOT_APPLICABLE.md because STS-51-D's Shuttle-payload-deployment mission class has no plausible biological substrate. Per-mission forest-module decision is brief-author judgment based on mission class.

**Two clean campaign-ship observations validate template generalizability.** v1.118 (Shuttle-payload) and v1.119 (Shuttle-Spacelab-science) are substrate-form-distinct mission classes both within the OV-099/OV-103 fleet era. The brief template (mission-essentials block + reference-page paths + 13-file deliverable table + authoring conventions + tone discipline) adapts cleanly across classes via mission-essentials-block parameterization. The template is now validated for v1.120+ continuation.

## Surprises

**Sub-agent completed the rebuild in 28 tool uses with zero content-filter trips.** Lower than v1.118's 36 tool uses despite producing deeper deliverables. Likely cause: the sub-agent had v1.118's rebuilt-template to reference directly rather than synthesizing patterns from two different references (v1.117 schema + v1.56 depth). Future rebuilds will likely converge on similar tool-use counts as the campaign progresses.

**Mission-class detection enabled functional Forest Sim contribution.** v1.118 brief explicitly said "no plausible forest contribution" because Shuttle-payload-deployment missions lack biological substrate. v1.119 brief explicitly noted Spacelab-3's rodent-experiment biological substrate and steered the sub-agent toward functional forest-module rather than NOT_APPLICABLE. Brief-author judgment based on mission class drives the forest-module decision; both NOT_APPLICABLE and functional patterns serve the campaign.

## Lessons Learned

# 04 — Lessons Learned: v1.49.717 Forward Lessons
