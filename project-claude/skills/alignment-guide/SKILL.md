---
name: alignment-guide
description: >
  Token-efficient format patterns. Auto-activates when writing
  STATE.md, MEMORY.md, staging packages, or agent prompts.
user-invocable: false
---

# Alignment Guide

## Format Rules

| Verbose | Aligned | Save |
|---------|---------|------|
| "scored 4.15 out of 5.0" | `4.15/5.0` | ~8 tok |
| "decreased by 0.13" | `Δ -0.13` | ~6 tok |
| "Phase 603 is complete" | `603: COMPLETE` | ~5 tok |
| Paragraph prose | Table/bullets | ~30% |

## Tiered Summaries

```
L1 (15 tok): Chain 31/50, 4.40, avg 4.030
L2 (50 tok): 2 skills, 1 hook, hierarchy. OS trilogy 2/3.
L4 (full): [Read on demand]
```

## Targets

**STATE.md:** Flatten progress. Drop redundant fields. Activity includes score.
**MEMORY.md:** Hot < 50 lines → Warm → Cold (truncated at 200).
**Prompts:** Storyline templates. Summary default, detail on demand.
