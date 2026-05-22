# 04 — Lessons Learned: v1.49.721 — Lesson #10408 PROMOTION TO ESTABLISHED

## 1 lesson promoted; 0 new lessons emitted

### Lesson #10408 — Per-mission sub-agent rebuild pattern for substrate-era canonical sibling files

**Status:** PROMOTED candidate → ESTABLISHED at v1.49.721 obs#6 sustainment.

**Severity:** MEDIUM.

**Description:** Single Agent tool dispatch with `general-purpose` subagent_type produces a clean 13-file canonical mission rebuild within budget for substrate-era NASA missions v1.118-v1.168. Process: orchestrator authors per-mission brief (~1200 words covering mission essentials + reference paths + 13-file deliverable table + tone discipline); sub-agent reads brief + 4-6 reference pages + degree-sync.json (5-6 Read); writes 13 deliverables (13 Write); reports completion.

**Observation band:** 28-36 tool uses per rebuild, mean ~31, sigma ~3. Across 6 observations:
- v1.118 STS-51-D Discovery: 36 (Shuttle-payload-deployment class)
- v1.119 STS-51-B Spacelab-3: 28 (Shuttle-Spacelab-microgravity-science class)
- v1.120 STS-51-G Discovery: 32 (Shuttle-international-PS-multi-deploy class)
- v1.121 STS-51-F Spacelab-2: 28 (Shuttle-Spacelab-pallet-solar-science class)
- v1.122 STS-51-I LEASAT-3 Rescue: 30 (Shuttle-multi-deploy-plus-satellite-rescue class)
- v1.123 STS-51-J Atlantis Maiden DoD: 34 (Shuttle-maiden-flight-DoD-classified class)

**Output:** ~20-30K words total HTML+MD per rebuild at v1.56 gold-standard or v1.118-v1.121-v1.122-v1.123 campaign-validated depth band.

**Brief-discipline patterns observed (composable):**
1. **Positive-framing high-trip-vocab discipline** (first observation v1.121; sustained at v1.122/v1.123 by implicit application)
2. **SCAFFOLD-PENDING engine-state suppression** (first observation v1.122; sustained obs#2 at v1.123)

**Apply:** future campaign-mission rebuilds follow the same template. Mission-essentials block adapts per substrate-form-distinct mission class via degree-sync.json read. Reference-page paths block parameterizes per immediate-predecessor + gold-standard reference. Forest-module decision per mission class (functional JS if biological substrate; NOT_APPLICABLE.md otherwise). Engine-state SCAFFOLD-PENDING suppression as needed per original-ship state.

**Why this matters:** the campaign has ~45 more substrate-era missions to rebuild (v1.124-v1.168). The ESTABLISHED pattern is the load-bearing discipline for the campaign forward. Per-mission overhead is ~30 min wall-clock orchestrator + ~30 tool uses sub-agent; total ~1-1.5 hours per ship including release-notes + ship-pipeline.

## Sustained cumulative (post-promotion)

| Lesson | Cumulative obs |
|---|---|
| #10168 counter-cadence cleanup cadence | obs#6 (v585 + v716-v721 family) |
| #10406 candidate positive-framing dispatch | obs#10 (v712-v721) |
| #10407 candidate dispatch-prompt-density | obs#9 (v713-v721) |
| **#10408 per-mission sub-agent rebuild** | **obs#6 ESTABLISHED** (v716-v721) |
| W3.5 chapter-gen bake-in | obs#13 (v709-v721) |

## Promotion event significance

Lesson #10408 is the third NASA-mission-cadence ESTABLISHED-promoted lesson in recent history (alongside #10401 MISSION-PACKAGE-DISCIPLINE-§3 and prior #10168). It is the first lesson promoted in a counter-cadence campaign context — establishes the precedent that counter-cadence campaigns can produce ESTABLISHED lessons of equal load-bearing weight to forward-cadence engine-state lessons.
