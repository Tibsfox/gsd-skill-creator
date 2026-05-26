> Following v1.49.778 — _Wave 2 Review HIGHs / Security + Correctness Counter-Cadence_, v1.49.779 ships as Wave 3 Review HIGHs / Performance + Test-Quality Counter-Cadence.

# v1.49.779 — Wave 3 Review HIGHs / Performance + Test-Quality Counter-Cadence

**Shipped:** 2026-05-26
_Parse confidence: 0.50 — source `docs/release-notes/v1.49.779/README.md`_

## Summary

Counter-cadence ship #5 — closes the 5 remaining performance + test-quality HIGHs from the v1.49.777 risk-tier sweep. Two performance (skill-index findByTrigger regex cache; arena checkpoint Vec pre-sizing) and three test-quality (feedback-bridge flushPending() refactor + setTimeout removal; operation-cooldown pre-expired-state pattern; 28 sterile-env .test.sh cases for 3 previously-untested advisory hooks + read-guard promotion to project-claude source-of-truth). Engine state UNCHANGED (NASA degree sustains at 1.177). Three back-to-back counter-cadence ships at 1-milestone intervals (v777 + v778 + v779). Fifth counter-cadence in the engine.

It also produced retrospective content (decisions, lessons_learned, surprises, what_could_be_better, what_worked); see `03-retrospective.md`.

5 lesson candidates extracted; see `04-lessons.md`.

---
**Prev:** [v1.49.778](../v1.49.778/00-summary.md) · _(current tip)_
