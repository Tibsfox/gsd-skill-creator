# Retrospective — v1.49.35

## What Worked

- **VAV five-mission arc.** The three-pass structure (structural→sovereignty→signal fidelity) was discovered organically but proved to be the natural decomposition. Each pass found what the previous pass could not see. The frequency-domain metaphor unifies all three.
- **Honest PoC results.** Two PoCs confirmed predictions, one returned a weak/negative result. Reporting all three honestly — and downgrading the audio-to-chunk parallel from isomorphism to analogy — strengthens the entire atlas. A research document that only reports confirmations is suspect.
- **ECO gap closure precision.** 38 species added across three modules with zero regressions. All 6 safety-critical tests maintained. Cross-module updates propagated cleanly. The verification matrix is now 32/32 PASS with no asterisks.
- **Data source registry as infrastructure.** Moving from 13 coastal datasets to 46 across 14 categories means any future PNW research module can reference authoritative data without duplicating source documentation. The stable ID system (DS-BIO-01, DS-VEG-02, etc.) makes cross-referencing reliable.
- **Pipeline table as design document.** The expanded 20-layer pipeline table is not just a reference — it is the engineering specification for how datasets combine to generate a Minecraft world. Each row is a future build task.

## What Could Be Better

- **VAV verification matrices split across missions.** v1 has a dedicated verification-matrix.md, but v2 and v3 results live only in the final overview. A single consolidated verification document would be easier to audit.
- **Release size.** 50 files and 18,600 lines in one release is substantial. The work was done across multiple sessions and multiple independent tracks (VAV, ECO, data sources), which is appropriate, but the merge is large.
- **Data source URLs.** The registry documents access URLs based on known endpoints. Some may drift over time. The stable ID system mitigates this — update the URL once, all references stay valid — but periodic verification would be good practice.

## Lessons Learned

1. **The isomorphism is real.** When two systems designed independently for different purposes converge on the same architecture, the architecture is dictated by the problem, not the implementer. This is what makes the Minecraft/Ceph correspondence a discovery, not a construction.
2. **Negative results are results.** The Wiener filter PoC returned ~1% improvement. Reporting this honestly and downgrading the claim from isomorphism to analogy is more valuable than omitting the experiment.
3. **Gap closure is its own mission.** ECO went from 29/32 to 32/32 with a focused single-session effort. Treating gap closure as a distinct mission with its own verification — rather than folding it into "maintenance" — produces cleaner results and a cleaner commit history.
4. **Data registries compound.** 46 datasets with stable IDs and tier ratings is infrastructure that pays forward. Every future research module can cite DS-BIO-02 instead of re-documenting eBird. The registry is the shared memory of the series.
5. **The pipeline table IS the build plan.** Twenty rows mapping datasets to Minecraft world generation layers is not documentation — it is the engineering specification for the next phase of work. When the time comes to generate actual Minecraft terrain, the table tells you exactly which dataset feeds which layer.
