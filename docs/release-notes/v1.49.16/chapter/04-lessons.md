# Lessons — v1.49.16

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Stubs should be replaced with real implementations within one milestone.**
   The MCP tool handlers went from stubs (v1.49.15) to real handlers (v1.49.16) in a single release. Stubs that persist across multiple milestones risk becoming permanent technical debt.
   _⚙ Status: `investigate` · lesson #336_

2. **SkillLifecycleResolver deriving state from artifacts is more reliable than manual status tracking.**
   If the grading output exists, the skill is graded. If the test results exist, the skill is tested. Deriving state from evidence eliminates status desynchronization.
   _⚙ Status: `investigate` · lesson #337_

3. **CI guards for gitignored directories catch the commits that `.gitignore` cannot.**
   `.gitignore` prevents `git add .` from staging `.planning/` files, but explicit `git add .planning/` bypasses it. The CI guard is the second layer of defense.
   _⚙ Status: `investigate` · lesson #338_

4. **98 new tests for ~9,300 LOC is a lower test density than recent milestones.**
   v1.49.15 had 594 tests for 17,400 LOC (3.4%); this release is at 1.05%. The convergence detector and variant generator in particular handle complex optimization logic that would benefit from more edge case coverage.
   _⚙ Status: `investigate` · lesson #339_

5. **Muse schema with 6 system definitions is a foundation, not a feature.**
   The Zod validator and chipset wiring are correct infrastructure, but the muse system itself is only sketched at this point. The value will come from what's built on top.
   _🤖 Status: `investigate` · lesson #340 · needs review_
   > LLM reasoning: Bio-Physics Sensing Systems snippet doesn't clearly show muse system being built upon.
