---
name: context-memory
description: >
  Task shaping and demand paging for agents. Auto-activates when
  spawning agents, creating tasks, or at session start.
user-invocable: false
---

# Context Memory

## Task Shaping

Before spawning agents: resolves in 5-8 turns? Prompt has what/which/expected? History attached (shift register, plan intent)? File paths only, no content? Success criteria concrete?

## Storylines

| Type | Attach |
|------|--------|
| Review | Shift register + FF + patterns + load path |
| Execute | Plan path + STATE.md + commit convention |
| Build | Vision + spec + wave position |
| Fix | Error + file + expected behavior |

## Demand Paging

Read first 20 lines first. Full read only when needed. Write files with summary above `---`.

## GC

At phase boundaries: summary to STATE.md, don't re-read completed files. Task completion IS garbage collection.
