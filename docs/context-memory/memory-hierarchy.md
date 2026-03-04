# Dynamic Context Memory — 6-Tier Hierarchy

OS-inspired context window management. The model is userspace — it just does work. The tooling is the kernel — it manages what's loaded.

---

## Memory Hierarchy

| Tier | Analogy | What Lives Here | Managed By | Est. Tokens | Eviction |
|------|---------|----------------|------------|-------------|----------|
| **L0** | Registers | System prompt, CLAUDE.md | Claude Code runtime | ~970 (fixed) | Never |
| **L1** | L1 Cache | STATE.md frontmatter + shift register | GSD state hooks | ~85 (frontmatter) | Never during session |
| **L2** | L2 Cache | MEMORY.md hot section + active skills | Memory system + skill engine | ~400-4300 | Skills unload on trigger mismatch |
| **L3** | Main Memory | File reads, tool outputs, conversation | Conversation + compaction | Variable | Compaction (automatic, lossy) |
| **L4** | Swap | .planning files, docs/, git history | Agent Read calls (demand paging) | ~200-1000/read | Immediate after use |
| **L5** | Cold Storage | Archives, old chain links, npm packages | Subagents only | ~500-2000/access | Never in main context |

### L0: Registers (System Prompt + CLAUDE.md)
- **Our lever:** Keep CLAUDE.md concise. Every line costs tokens on every turn.
- **Current cost:** CLAUDE.md = 3,878 bytes (~969 tokens)

### L1: L1 Cache (STATE.md Frontmatter)
- **Design rule:** Must answer: Where am I? What did I just do? What's next?
- **Our lever:** Byte-align aggressively. Read every session — savings compound.
- **Current cost:** Frontmatter = 343 bytes (~85 tokens)

### L2: L2 Cache (MEMORY.md + Skills)
- **Our lever:** Structure MEMORY.md hot-first (< 50 lines). Skills < 200 tokens each.
- **Current cost:** MEMORY.md (200 lines) = 17,381 bytes (~4,345 tokens)
- Skills vary: gsd-workflow ~1,874, checkpoint-assertions ~1,051, quick-scan ~1,562

### L3: Main Memory (Active Conversation)
- **Our lever:** Keep tasks SHORT. 5-8 turns never fills L3. 30+ turns hits compaction.
- The cure is task decomposition, not memory management.

### L4: Swap (.planning Files + Docs)
- **Our lever:** Write files with summary headers. Agent reads first 20 lines first.
- This is demand paging with prefetch summaries.

### L5: Cold Storage (Archives + External)
- **Our lever:** Use subagents. They pay context cost in their own window, return summaries.

## Task Shaping

The most powerful memory management tool isn't eviction — it's **task shaping**. If each task is:

1. **Short-lived** — 5-8 turns, resolves one specific thing
2. **Self-contained** — everything it needs is in the spawn prompt
3. **Storyline-attached** — the right narrative context pre-attached

Then the model never hits context limits. Compaction never fires. Task completion IS garbage collection.

### Storyline Templates

| Task Type | Minimum Storyline |
|-----------|------------------|
| Chain review | Shift register + FF items + pattern list + load summary path |
| Phase execution | Plan path + STATE.md position + commit convention |
| Milestone setup | Previous chain link path + staging package template |
| Bug fix | Error message + file path + expected behavior |
| Feature build | Vision doc path + component spec path + wave position |

## Demand Paging Convention

Files should be structured for progressive reading:

```markdown
# Title — one-line summary (L1: always available)

**Quick context:** 2-3 lines of what this file contains (L2: session start)

---

## Detailed content below this line (L4: read on demand)
```

**Pattern:** Agent reads first 20 lines. If sufficient, stop. Only read full file when detail is actually needed. The summary is the page table entry; the full content is the page.

### The Storyboard Principle

Disney didn't render every Lion King frame to check the story. Rough storyboards validated the arc. Only frames that survived review went to expensive full animation.

Context management works the same way:
- **Story reel** (STATE.md shift register, 85 tokens) = evaluate the entire arc cheaply
- **Clean-up** (agent file reads) = demand-paged detail where earned
- **Full render** (full context window) = reserved for genuinely unmapped work

~90% of work is **mapped** — known problem, known context, short task resolves it. Only ~10% is **unmapped** — genuinely novel, needs full window.

## Baseline Measurements (v1.50.44)

| File | Bytes | Est. Tokens | Tier | Loaded When |
|------|-------|-------------|------|-------------|
| CLAUDE.md | 3,878 | ~969 | L0 | Every turn |
| STATE.md (full) | 2,287 | ~571 | L1 | Session start |
| STATE.md (frontmatter) | 343 | ~85 | L1 | Session start |
| MEMORY.md (200 lines) | 17,381 | ~4,345 | L2 | Session start |
| gsd-workflow skill | 7,498 | ~1,874 | L2 | On trigger |
| checkpoint-assertions | 4,205 | ~1,051 | L2 | On trigger |
| quick-scan skill | 6,251 | ~1,562 | L2 | On trigger |

**Total L0+L1+L2 baseline:** ~8,887 tokens (CLAUDE.md + STATE.md + MEMORY.md + 3 skills)

---
*Created: 2026-03-04 — v1.50.44 Dynamic Context Memory*
