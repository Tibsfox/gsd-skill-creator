# Bounded Learning

Skill refinement has strict guardrails to prevent runaway changes:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| **Min corrections** | 3 | Require consistent feedback before suggesting changes |
| **Max change** | 20% | Prevent drastic alterations in a single refinement |
| **Cooldown** | 7 days | Allow observation of changes before next refinement |
| **User confirm** | Always | Human in the loop for every change |
| **Max cumulative drift** | 60% | Halt auto-refinements when skill has drifted too far from original (v1.10) |
| **Contradiction detection** | Auto | Flag contradictory feedback corrections before applying (v1.10) |

## Refinement Workflow

```bash
# 1. Check eligibility
skill-creator refine my-skill
# Output: "Eligible for refinement (5 corrections)"

# 2. Review suggested changes
# Shows: section, original text, suggested text, reason

# 3. Confirm or cancel
# "Apply these refinements? [y/N]"

# 4. Rollback if needed
skill-creator rollback my-skill
```

## What Gets Refined

- **Trigger patterns** - Based on when skill activated vs. when it should have
- **Content accuracy** - Based on corrections you made to skill output
- **Missing sections** - Based on information you frequently added
