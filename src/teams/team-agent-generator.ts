/**
 * Agent file generator for team members.
 *
 * Generates role-aware agent .md files for team members that don't have
 * existing agent definitions. Follows the AgentGenerator pattern from
 * src/agents/agent-generator.ts.
 *
 * Key behaviors:
 * - Coordinator/orchestrator agents get leader-focused instructions
 * - Worker agents get task-execution-focused instructions
 * - Existing agent files are NEVER overwritten (skip with notice)
 * - Agent files always go to project scope (bug #11205)
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { LEADER_TOOLS } from './templates.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Input member data for agent file generation.
 */
export interface AgentMemberInput {
  /** Unique agent identifier within the team. */
  agentId: string;
  /** Display name for the team member. */
  name: string;
  /** Agent classification (e.g., 'coordinator', 'worker'). */
  agentType?: string;
  /** Tools assigned to this member. */
  tools: string[];
}

/**
 * Result of writing agent files for team members.
 */
export interface AgentFileResult {
  /** agentIds of newly created agent files. */
  created: string[];
  /** agentIds of agent files that already existed (skipped). */
  skipped: string[];
}

// ============================================================================
// Content Generation
// ============================================================================

/**
 * Generate markdown content for a team member's agent file.
 *
 * Produces role-aware content with YAML frontmatter. Coordinators and
 * orchestrators get leader-focused instructions; workers get
 * task-execution-focused instructions.
 *
 * @param member - Member data including agentId, name, agentType
 * @param teamName - Name of the team this member belongs to
 * @param tools - Tools to list in the frontmatter
 * @returns Markdown string with YAML frontmatter
 */
export function generateAgentContent(
  member: AgentMemberInput,
  teamName: string,
  tools: string[]
): string {
  const isLeader = member.agentType === 'coordinator' || member.agentType === 'orchestrator';

  if (member.agentType === 'router') {
    return `---
name: ${member.agentId}
description: Router for the ${teamName} team. Classifies incoming work and routes to specialist members.
tools: ${tools.join(', ')}
color: "#E6A817"
---

You are the router agent for the ${teamName} team.

## Role

You classify incoming work and direct it to the right specialist:
- Analyze the request to determine which specialist should handle it
- Use SendMessage to delegate work with clear context
- Monitor progress via TaskList and TaskGet
- Synthesize results from specialists when all subtasks complete

## Guidelines

- Classify work quickly -- don't attempt to solve it yourself
- Provide clear context when routing to specialists
- If unsure which specialist fits, pick the closest match and note uncertainty
- Track all delegated work to ensure nothing is dropped
`;
  }

  if (member.agentType === 'reducer') {
    return `---
name: ${member.agentId}
description: Reducer for the ${teamName} team. Consolidates results from parallel workers.
tools: ${tools.join(', ')}
color: "#9B59B6"
---

You are the reducer agent for the ${teamName} team.

## Role

You consolidate results from parallel workers:
- Wait for all worker tasks to complete via TaskList monitoring
- Gather results from each worker via TaskGet
- Synthesize a unified output from all worker results
- Report the consolidated result via SendMessage

## Guidelines

- Do not start consolidation until all workers report completion
- Handle partial failures gracefully -- note which workers succeeded/failed
- Produce a clear, structured summary of combined results
- Flag any contradictions or inconsistencies across worker outputs
`;
  }

  if (isLeader) {
    return `---
name: ${member.agentId}
description: Lead coordinator for the ${teamName} team. Delegates tasks and synthesizes results.
tools: ${LEADER_TOOLS.join(', ')}
color: "#4A90D9"
---

You are the lead agent for the ${teamName} team.

## Role

You coordinate work across the team by:
- Breaking down objectives into tasks via TaskCreate
- Assigning tasks to teammates via TaskUpdate
- Monitoring progress via TaskList and TaskGet
- Communicating with teammates via SendMessage

## Guidelines

- Create clear, self-contained tasks with descriptive subjects
- Let workers self-claim tasks when possible
- Synthesize findings from all teammates before reporting results
- Use SendMessage to provide context and guidance to workers
`;
  }

  return `---
name: ${member.agentId}
description: ${member.name} for the ${teamName} team. Executes assigned tasks independently.
tools: ${tools.join(', ')}
color: "#50C878"
---

You are ${member.name} on the ${teamName} team.

## Role

You execute tasks assigned by the team lead:
- Check TaskList for available tasks
- Claim tasks by updating status via TaskUpdate
- Complete work using your available tools
- Report results via SendMessage to the lead

## Guidelines

- Focus on one task at a time
- Communicate blockers early via SendMessage
- Update task status as you progress (in_progress -> completed)
- Be thorough -- the lead synthesizes your output with other workers
`;
}

// ============================================================================
// File Writer
// ============================================================================

/**
 * Write agent .md files for team members.
 *
 * For each member, checks if an agent file already exists. If it does,
 * the member is added to the skipped list and the existing file is
 * preserved. New files are created with role-aware content.
 *
 * @param members - Array of member data with tools
 * @param teamName - Name of the team
 * @param agentsDir - Directory to write agent files into
 * @returns AgentFileResult with created and skipped agentIds
 */
export function writeTeamAgentFiles(
  members: AgentMemberInput[],
  teamName: string,
  agentsDir: string
): AgentFileResult {
  const result: AgentFileResult = {
    created: [],
    skipped: [],
  };

  for (const member of members) {
    const filePath = join(agentsDir, `${member.agentId}.md`);

    if (existsSync(filePath)) {
      result.skipped.push(member.agentId);
      continue;
    }

    const content = generateAgentContent(member, teamName, member.tools);

    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, 'utf-8');

    result.created.push(member.agentId);
  }

  return result;
}
