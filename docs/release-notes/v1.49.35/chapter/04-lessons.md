# Lessons — v1.49.35

8 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **The isomorphism is real.**
   When two systems designed independently for different purposes converge on the same architecture, the architecture is dictated by the problem, not the implementer. This is what makes the Minecraft/Ceph correspondence a discovery, not a construction.
   _⚙ Status: `investigate` · lesson #446_

2. **Negative results are results.**
   The Wiener filter PoC returned ~1% improvement. Reporting this honestly and downgrading the claim from isomorphism to analogy is more valuable than omitting the experiment.
   _⚙ Status: `investigate` · lesson #447_

3. **Gap closure is its own mission.**
   ECO went from 29/32 to 32/32 with a focused single-session effort. Treating gap closure as a distinct mission with its own verification — rather than folding it into "maintenance" — produces cleaner results and a cleaner commit history.
   _⚙ Status: `investigate` · lesson #448_

4. **Data registries compound.**
   46 datasets with stable IDs and tier ratings is infrastructure that pays forward. Every future research module can cite DS-BIO-02 instead of re-documenting eBird. The registry is the shared memory of the series.
   _⚙ Status: `investigate` · lesson #449_

5. **The pipeline table IS the build plan.**
   Twenty rows mapping datasets to Minecraft world generation layers is not documentation — it is the engineering specification for the next phase of work. When the time comes to generate actual Minecraft terrain, the table tells you exactly which dataset feeds which layer.
   _⚙ Status: `investigate` · lesson #450_

6. **VAV verification matrices split across missions.**
   v1 has a dedicated verification-matrix.md, but v2 and v3 results live only in the final overview. A single consolidated verification document would be easier to audit.
   _⚙ Status: `investigate` · lesson #451_

7. **Release size.**
   50 files and 18,600 lines in one release is substantial. The work was done across multiple sessions and multiple independent tracks (VAV, ECO, data sources), which is appropriate, but the merge is large.
   _⚙ Status: `investigate` · lesson #452_

8. **Data source URLs.**
   The registry documents access URLs based on known endpoints. Some may drift over time. The stable ID system mitigates this — update the URL once, all references stay valid — but periodic verification would be good practice.
   _⚙ Status: `investigate` · lesson #453_
