# Gastown Origin: Hook Persistence

## Where This Comes From

The hook-persistence skill adapts Gastown's hook file system and GUPP (Get Up and Push Protocol). In the original Gastown Go codebase, a "hook" is the binding between a worker agent (polecat) and a work item (bead). The hook file is the single source of truth for what an agent is currently assigned to do.

GUPP is Gastown's enforcement mechanism: when an agent has a hooked work item, it is obligated to execute it. There is no negotiation, no deferral, no cherry-picking. The hook is a contract.

## Key Mapping: Gastown to Skill-Creator

| Gastown Concept | Hook-Persistence Equivalent | Adaptation Notes |
|----------------|---------------------------|------------------|
| Hook file | `.chipset/state/hooks/{agent-id}.json` | Same per-agent file pattern |
| GUPP enforcement | `status: "pending"` triggers mandatory execution | Same obligation semantics |
| Hook status (empty/active) | Four-state lifecycle (empty/pending/active/completed) | Added pending and completed for finer tracking |
| Work item reference | `work_item` object with bead_id, title, assigned_at | Formalized as structured object |
| Hook clearing | Write empty hook (not delete) | Preserves file presence for monitoring |
| Sling dispatch | Mayor/sling sets hook via `setHook()` | Same dispatch pattern |
| Done retirement | `clearHook()` after verification | Formalized verification step |

## Design Decisions

### Why Single-File Per Agent

Gastown's hook system uses one file per agent because an agent can only work on one thing at a time. This constraint is fundamental to GUPP -- it prevents work fragmentation and ensures clear accountability. If an agent has a hook, that hook tells you exactly what the agent should be doing right now.

### Why Four-State Lifecycle

Gastown's original hook system had two implicit states: empty (no file or empty file) and active (file with work item). This skill adds `pending` and `completed` for better observability:

- **pending:** Work assigned but agent hasn't started yet -- allows detecting "assigned but not started" gaps
- **completed:** Work finished but hook not yet cleared -- allows the mayor to verify before clearing

### Why Pull-Based

Push-based assignment requires the sender to know the recipient is ready. In a multi-agent filesystem system, "ready" is hard to determine -- the agent might be between poll cycles, restarting, or processing a previous nudge. Pull-based assignment is naturally resilient: the mayor writes the hook, and the agent picks it up whenever it next polls.

### Why GUPP Is Non-Negotiable

GUPP prevents a common multi-agent failure mode: agents ignoring or deferring work they don't "want" to do. In Gastown, the mayor has full visibility into the workload and makes dispatch decisions based on agent availability and work priority. An agent that rejects work undermines the dispatch system.

The agent's only valid responses to a hooked work item are:
1. Execute it (normal flow)
2. Crash (witness detects and escalates)

There is no "reject" or "defer" transition.

### Why Cleared Not Deleted

Deleting the hook file makes the agent invisible to monitoring. A missing file could mean "no hook" or "agent was never created." By always writing an empty hook file on clear, the filesystem reflects the full set of known agents with their current states -- `ls .chipset/state/hooks/` always shows all agents.

## What Changed From Gastown

1. **Language:** Go to TypeScript -- async/await replaces goroutines
2. **Status lifecycle:** Expanded from 2 to 4 states (added pending, completed)
3. **Activity tracking:** Explicit `last_activity` timestamp (was implicit in Gastown via file mtime)
4. **Work item structure:** Typed object with `bead_id`, `title`, `assigned_at` (was a raw string reference in Gastown)
5. **Clear semantics:** Write empty file instead of delete (Gastown deleted the file)
6. **Serialization:** Sorted-key JSON for git-friendly diffs (consistent with all chipset skills)
7. **Error handling:** Explicit rejection of double-assignment (Gastown silently overwrote)
