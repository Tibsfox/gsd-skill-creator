/**
 * Teams module barrel export.
 *
 * Re-exports all public API from the teams module:
 * - Template generators and tool constant arrays (templates.ts)
 * - TeamStore, scope types, and path helpers (team-store.ts)
 * - Agent file generation (team-agent-generator.ts)
 * - Team creation wizard (team-wizard.ts)
 *
 * Team types (TeamConfig, TeamMember, etc.) are NOT re-exported here --
 * they are already exported from src/types/team.ts via the package root.
 */

// Templates: generators and tool arrays
export {
  generateLeaderWorkerTemplate,
  generatePipelineTemplate,
  generateSwarmTemplate,
  LEADER_TOOLS,
  WORKER_TOOLS,
  PIPELINE_STAGE_TOOLS,
  SWARM_WORKER_TOOLS,
} from './templates.js';
export type { TemplateOptions, TemplateResult } from './templates.js';

// Storage: TeamStore class, scope type, path helpers
export { TeamStore, getTeamsBasePath, getAgentsBasePath } from './team-store.js';
export type { TeamScope } from './team-store.js';

// Agent file generation
export { writeTeamAgentFiles, generateAgentContent } from './team-agent-generator.js';
export type { AgentFileResult, AgentMemberInput } from './team-agent-generator.js';

// Team creation wizard
export { teamCreationWizard, nonInteractiveCreate } from './team-wizard.js';
export type { WizardOptions, CreatePaths } from './team-wizard.js';
