# Retrospective — v1.49.25

## What Worked

- **sc-dev-team pattern at scale.** Four parallel Opus agents (avi-d, avi-e, mam-d, mam-e) produced 12 synthesis documents in a single session. Self-claiming task queues reduced coordination overhead — agents that finished early grabbed the next available task without waiting for assignment.
- **Wave-based execution enforces dependencies naturally.** Foundation (Wave 0) → Species compendiums (Wave 1) → Synthesis/analysis (Wave 2) → Cross-references (Wave 3) → Verification (Wave 4) → Browser pages (Post-wave). Each wave builds on the previous without circular dependencies.
- **Multi-part write strategy handles large files.** Species compendiums (150-230KB) exceeded the 32K output limit, requiring 2-4 sequential write calls with careful section boundaries. The strategy is now proven and repeatable.
- **Atomic commit preserves integrity.** All 49 files committed as a single unit. The PNW index, series.js, and browser pages all reference each other — partial commits would leave broken cross-references.
- **Research browser architecture scales to 8 projects.** Zero engineering changes needed. Same static HTML + client-side markdown pattern as COL through SHE. The series.js navigation and index.html card layout accommodate new projects without modification to the rendering engine.

## What Could Be Better

- **AVI is nearly 2x the size of MAM.** Bird taxonomy at the PNW scale (250+ species vs 169+ mammals) produces significantly more content. Future missions should account for this asymmetry in task sizing and agent allocation.
- **Marine mammals required special ecoregion handling.** The MAM ecoregion definitions extend beyond the standard 7 terrestrial zones to include a Marine zone. This divergence from the AVI ecoregion schema should be documented as a pattern for future marine-inclusive research.
- **Message queue lag caused duplicate agent responses.** When agents finished tasks quickly, stale messages in the queue triggered redundant acknowledgments. Solution: acknowledge completion exactly once and don't re-broadcast to idle agents.

## Lessons Learned

1. **4 parallel agents is the sweet spot for synthesis work.** Fewer agents leave capacity unused; more agents create coordination overhead that exceeds the parallelism benefit. This confirms the pattern established in the Muse Ecosystem mission and refines the earlier "3 agents optimal" guidance, which applies to simpler doc runs.
2. **Self-claiming task queues outperform explicit assignment.** Agents that pick their next task from a shared queue adapt naturally to variable task completion times. No coordinator bottleneck, no idle agents waiting for instructions.
3. **The PNW series has reached biological survey completeness.** With ECO (full taxonomy), AVI (birds), and MAM (mammals), the living systems of the Pacific Northwest are documented at species-level detail. The remaining vertebrate classes (reptiles, amphibians, fish) could extend the survey but are not required for the ecological network models to function.
4. **Cultural knowledge sections are the highest-risk content.** Indigenous knowledge attribution requires careful OCAP/CARE/UNDRIP compliance review. These sections took longer to verify than purely scientific content and should always be allocated extra review time in future missions.
5. **Cross-reference matrices grow combinatorially.** At 8 projects, the PNW index cross-reference matrix has significant density. As noted in v1.49.24, grouping or filtering may be needed at 10+ projects.
