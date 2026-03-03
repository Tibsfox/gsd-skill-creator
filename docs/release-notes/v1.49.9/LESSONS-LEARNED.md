# v1.49.9 Lessons Learned — Learn Kung Fu

## LLIS Format Entries

### LL-499-01: College Structure Scales to Any Domain
**Category:** What Worked Well
**Observation:** The mind-body department is the second non-technical domain (after culinary-arts) using identical College Structure patterns. The same department/wing/concept hierarchy, progressive disclosure, try-sessions, and calibration integration worked without modification.
**Recommendation:** When the second instance of an architecture confirms it scales, stop questioning the architecture and start investing in tooling to make instantiation faster.

### LL-499-02: Parallel Content Modules
**Category:** What Worked Well
**Observation:** Four content module pairs (Breath/Meditation, Yoga/Pilates, Martial Arts/Tai Chi, Relaxation/Philosophy) ran in parallel with zero coordination overhead. Content modules are independent by design — they share types and warden infrastructure but not content.
**Recommendation:** Design content modules to be structurally independent so they can be authored in parallel. Share infrastructure (types, wardens, calibration) but never share mutable content state.

### LL-499-03: Solo Practice Boundary as Absolute
**Category:** What Worked Well
**Observation:** The absolute boundary on partner/sparring/self-defense techniques (redirect to in-person instruction) prevented a class of content that could cause physical harm if practiced incorrectly without supervision. The Safety Warden enforces this automatically.
**Recommendation:** For physical activity domains, identify technique categories that require supervision and implement them as absolute boundaries (like food safety temperatures). The redirect-to-instruction pattern is the physical equivalent of the food safety floor.

### LL-499-04: No-Guilt UX Reduces Abandonment
**Category:** What Worked Well
**Observation:** The Practice Journal uses streak tracking without shame mechanics — missed days don't trigger guilt-inducing messages or break streaks permanently. This pattern from v1.49.8 transferred directly and was validated by user testing.
**Recommendation:** Journal and tracking UX should celebrate consistency without punishing absence. "You practiced 3 times this week" is motivating; "You broke your 5-day streak" is demotivating. Never use the latter.

### LL-499-05: Text-Based Movement Instruction
**Category:** What Worked Well
**Observation:** Describing physical movements in text forces precision that video can obscure. When you can't show a pose, you must describe the alignment, weight distribution, and common errors explicitly — producing higher-quality instructional content.
**Recommendation:** For movement-based education, consider text-first instruction as a design constraint, not a limitation. If the text description isn't precise enough to follow, the instruction needs improvement regardless of medium.

### LL-499-06: Cultural Sensitivity Is Not Optional Overhead
**Category:** What Could Be Improved
**Observation:** Cultural attribution research for 8 wings spanning multiple traditions was time-intensive but produced visibly higher quality content. Each wing required identifying the originating tradition, crediting original terminology, and avoiding both mystification and trivialization.
**Recommendation:** Budget cultural sensitivity work as core content authoring, not as a compliance checkbox. The research time directly improves content quality and accuracy — it's not overhead, it's the work.

### LL-499-07: Try Session Design for Physical Practices
**Category:** What Could Be Improved
**Observation:** Finding the right balance between "immediately useful" and "not dangerous for beginners" required multiple iterations for physical practices. The first draft of the martial arts Try Session included techniques that could cause injury without proper warm-up.
**Recommendation:** All physical Try Sessions should be reviewed against the Safety Warden before publication. The review should verify: no equipment needed, no partner needed, no warm-up beyond what's included, and no techniques with injury risk for complete beginners.

## Recommendations Summary

| # | Recommendation | Priority |
|---|---------------|----------|
| 1 | Invest in architecture instantiation tooling after second domain confirms scaling | High |
| 2 | Design content modules for structural independence and parallel authoring | High |
| 3 | Implement partner-technique redirect boundary for all physical domains | High |
| 4 | Use no-guilt UX patterns in all tracking/journaling features | Medium |
| 5 | Budget cultural sensitivity as core content work, not compliance | Medium |
| 6 | Review physical Try Sessions against Safety Warden before publication | Medium |
| 7 | Consider text-first movement instruction as quality constraint | Low |
