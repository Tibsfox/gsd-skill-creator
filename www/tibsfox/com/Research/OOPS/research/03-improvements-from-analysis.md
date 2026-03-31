# Concrete Improvements From Architecture Analysis

**Date:** 2026-03-31

## Immediate Actions (This Week)

### 1. Add PostCompact Hook Handler

Claude Code compresses conversation context when approaching limits. The `PostCompact` hook fires after this happens. Currently we lose working state silently.

**Improvement:** Add a PostCompact handler to the session-awareness skill that:
- Saves current task state to `.planning/compact-state.json`
- Records what files were being worked on
- Logs the compaction event with timestamp
- On next tool call, checks if compaction occurred and restores context

**Why this matters:** Our long-running sessions (like tonight's HEL buildout) are exactly where compaction hits. Losing context mid-session is the #1 cause of quality degradation in extended work.

### 2. Add FileChanged Event Handling

The `FileChanged` hook fires when files are modified outside the conversation (linters, formatters, user edits, git operations). Currently our skills don't know about external changes.

**Improvement:** Add a FileChanged handler that:
- Re-reads modified skill files if a SKILL.md changed
- Flags when a file we're working on was externally modified (prevents overwrite)
- Updates the session-awareness state when `.planning/` files change

### 3. Align Effort Levels with GSD Profiles

Claude Code has an internal effort system (`effort-level`). Our GSD profiles (quality/balanced/budget/inherit) should map to these:

| GSD Profile | Effort Level | Reasoning Token Budget |
|------------|-------------|----------------------|
| quality | high | Maximum reasoning, all verification |
| balanced | medium | Standard reasoning, key verification |
| budget | low | Minimal reasoning, skip optional checks |
| inherit | (parent's level) | Match the calling agent |

**Improvement:** Update the `gsd:set-profile` command to set effort alongside model selection.

### 4. Implement Memory Survey Pattern

The `memory_survey` string in the binary suggests Claude Code scores memory relevance before loading. Currently our MEMORY.md loads everything into context regardless of relevance.

**Improvement:** Add a relevance scoring step to memory loading:
- Parse MEMORY.md index entries
- Score each entry against current task context (keywords, file paths, project domain)
- Load only entries above a relevance threshold
- Log which memories were loaded and why

This reduces token waste and keeps context focused.

### 5. Standardize Notification Types

Claude Code has 10+ notification types (`NotificationType0` through `NotificationType9`). Our hook system only uses a few event types (PreToolUse, PostToolUse, SubagentSpawn).

**Improvement:** Audit the full notification type list and add handlers for any we're missing. Each notification type is an opportunity to inject intelligence into the platform's behavior.

## Medium-Term Improvements (Next 2-4 Weeks)

### 6. PermissionDenied Recovery

When a tool call is denied, the `PermissionDenied` hook fires. Currently we just get an error and retry or ask the user. 

**Improvement:** Build a PermissionDenied handler in the gsd-workflow skill that:
- Logs the denied action and reason
- Suggests alternative approaches that don't require the denied permission
- Learns from denials to avoid repeating them (save to memory)

### 7. Agent Type Taxonomy Alignment

The binary shows `agent:builtin` vs `agent:custom` classification. Our 34+ agent types are all "custom" from Claude Code's perspective.

**Improvement:** Tag our agent definitions with compatibility metadata:
- Which built-in agent type they extend
- What additional capabilities they add
- Performance characteristics (typical duration, token usage)

This enables better orchestration decisions — route simple tasks to built-in agents, complex tasks to our specialized ones.

### 8. Worktree State Management

The `worktree-state` string suggests more sophisticated worktree lifecycle management than we currently use.

**Improvement:** Enhance our worktree usage with:
- Pre-worktree state snapshot
- Worktree health monitoring (detect abandoned worktrees)
- Automatic cleanup of merged worktrees
- Cross-worktree communication via our mail-async pattern

### 9. Context-Packet Integration

If the `context-packet` pattern from gsd-build becomes available, it would dramatically improve our inter-agent context passing. Currently agents get full prompts; a DAG-resolved context packet with token budgets would be more efficient.

**Improvement:** Design our agent prompts to be context-packet-compatible — structured sections that can be independently resolved and budget-constrained.

## Architectural Insights for Long-Term

### 10. The Skill Lifecycle

The binary references `skills-2025-10-02`, suggesting skills have versioned activation dates. This implies:
- Skills can be time-gated (activate after a date)
- Skills have a lifecycle (created → active → deprecated → removed)
- The platform may eventually support skill versioning

**Our response:** Add `version` and `created` fields to our skill frontmatter (some already have these from the agentskills.io extensions). Ensure all 34 skills are versioned.

### 11. Team Architecture

The `teams` system with `team_name is required for TeamCreate` suggests teams are first-class entities, not just groupings. Teams may have:
- Shared context
- Collective permissions
- Team-level state

**Our response:** Our sc-dev-team, uc-lab, and mayor-coordinator patterns already implement team-like behavior. Align our implementation with whatever the platform ships, so our teams compose with built-in teams.

### 12. Memory as a First-Class System

The multiple memory-related strings (`memory-command`, `memory-select`, `memory_survey`, `memory_files_completed`, `memory_files_started`, `memory_saved`) reveal memory is a sophisticated subsystem, not just a file.

**Our response:** Our memory system (MEMORY.md + individual files) is well-structured but passive. The platform's memory appears to be active — tracking which memories are accessed, surveying for relevance, and managing lifecycle. We should evolve toward this.

## What This All Means

The architecture analysis reveals that gsd-skill-creator and Claude Code are evolving in the same direction. The platform is building more sophisticated skills, agents, teams, memory, and orchestration — exactly the features we've been extending.

Our strategy should be: **stay one step ahead on the patterns, and align immediately when the platform catches up.** This means:
- Continue innovating (GUPP, DACP, trust, chipsets)
- But build innovations as extensions of platform features, not replacements
- When the platform ships a feature we've built (e.g., teams), adapt our implementation to use theirs as the foundation
- Share our patterns back (Skills-and-Agents project) so the ecosystem benefits

The code release didn't create a threat — it confirmed that our direction is right. Now we execute faster and share more openly.
