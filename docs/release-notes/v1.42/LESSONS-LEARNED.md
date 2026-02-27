# v1.42 Lessons Learned — SC Git Support

## LLIS-42-01: Git as Observation Source

**Category:** Pattern Detection
**Impact:** High

Git commit history is a rich, structured observation source. Commit patterns (type frequency, scope distribution, timing) reveal workflow habits more reliably than tool-use logs.

**Recommendation:** Prioritize git-based observations for skill suggestion — they have natural timestamps and are already persisted.

## LLIS-42-02: Coverage Tooling

**Category:** Quality
**Impact:** Medium

Adding @vitest/coverage-v8 at this stage (milestone 42) provides baseline coverage data for all future milestones. Earlier is better for coverage tooling.

**Recommendation:** Integrate coverage reporting as early as possible in project lifecycle.
