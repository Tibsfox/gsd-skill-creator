## SHOULD trigger

- "Before shipping the new refinery-merge skill, check which of its rules the last three sessions actually exercised." — skill review + captured trajectories + adequacy question = exact fit.
- "This skill loaded during yesterday's convoy run but did it ever follow its own escalate-on-conflict rule?" — asks exercised-vs-violated for a specific loaded trajectory = compliance check.
- "Regression-test skill-injection-guardian against its captured traces before I bump the version." — ship/regression gating against trajectories = core trigger.

## SHOULD NOT trigger

- "Is this skill actually helping or should I retire it?" — that is EFFECT/CONTRIBUTION → route to skill-counterfactual-audit / skill-causal-curation, not single-trajectory adequacy.
- "Fix the truncated triggers and out-of-bound description in this SKILL.md." — frontmatter-only, no trajectory → skill-frontmatter-doctor.
- "Author a brand-new skill from this repeated tool sequence." — creation, no loaded trajectory to measure against yet → skill-forge / skill-integration.
