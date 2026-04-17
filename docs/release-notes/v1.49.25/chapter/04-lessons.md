# Lessons — v1.49.25

8 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **4 parallel agents is the sweet spot for synthesis work.**
   Fewer agents leave capacity unused; more agents create coordination overhead that exceeds the parallelism benefit. This confirms the pattern established in the Muse Ecosystem mission and refines the earlier "3 agents optimal" guidance, which applies to simpler doc runs.
   _⚙ Status: `investigate` · lesson #380_

2. **Self-claiming task queues outperform explicit assignment.**
   Agents that pick their next task from a shared queue adapt naturally to variable task completion times. No coordinator bottleneck, no idle agents waiting for instructions.
   _⚙ Status: `investigate` · lesson #381_

3. **The PNW series has reached biological survey completeness.**
   With ECO (full taxonomy), AVI (birds), and MAM (mammals), the living systems of the Pacific Northwest are documented at species-level detail. The remaining vertebrate classes (reptiles, amphibians, fish) could extend the survey but are not required for the ecological network models to function.
   _⚙ Status: `investigate` · lesson #382_

4. **Cultural knowledge sections are the highest-risk content.**
   Indigenous knowledge attribution requires careful OCAP/CARE/UNDRIP compliance review. These sections took longer to verify than purely scientific content and should always be allocated extra review time in future missions.
   _⚙ Status: `investigate` · lesson #383_

5. **Cross-reference matrices grow combinatorially.**
   At 8 projects, the PNW index cross-reference matrix has significant density. As noted in v1.49.24, grouping or filtering may be needed at 10+ projects.
   _⚙ Status: `investigate` · lesson #384_

6. **AVI is nearly 2x the size of MAM.**
   Bird taxonomy at the PNW scale (250+ species vs 169+ mammals) produces significantly more content. Future missions should account for this asymmetry in task sizing and agent allocation.
   _⚙ Status: `investigate` · lesson #385_

7. **Marine mammals required special ecoregion handling.**
   The MAM ecoregion definitions extend beyond the standard 7 terrestrial zones to include a Marine zone. This divergence from the AVI ecoregion schema should be documented as a pattern for future marine-inclusive research.
   _⚙ Status: `investigate` · lesson #386_

8. **Message queue lag caused duplicate agent responses.**
   When agents finished tasks quickly, stale messages in the queue triggered redundant acknowledgments. Solution: acknowledge completion exactly once and don't re-broadcast to idle agents.
   _🤖 Status: `investigate` · lesson #387 · needs review_
   > LLM reasoning: Heartbeat snippet is too vague to confirm it specifically addresses duplicate acknowledgments from queue lag.
