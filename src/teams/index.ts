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
  generateRouterTemplate,
  generateMapReduceTemplate,
  LEADER_TOOLS,
  WORKER_TOOLS,
  PIPELINE_STAGE_TOOLS,
  SWARM_WORKER_TOOLS,
  ROUTER_TOOLS,
  REDUCER_TOOLS,
} from './templates.js';
export type { TemplateOptions, TemplateResult } from './templates.js';

// GSD-specific templates: parallel research and adversarial debugging
export {
  generateGsdResearchTeam,
  generateGsdDebuggingTeam,
  GSD_RESEARCH_AGENT_IDS,
  GSD_DEBUG_AGENT_IDS,
  RESEARCH_DIMENSIONS,
} from './gsd-templates.js';
export type { GsdTemplateOptions } from './gsd-templates.js';

// Storage: TeamStore class, scope type, path helpers
export { TeamStore, getTeamsBasePath, getAgentsBasePath } from './team-store.js';
export type { TeamScope } from './team-store.js';

// Agent file generation
export { writeTeamAgentFiles, generateAgentContent } from './team-agent-generator.js';
export type { AgentFileResult, AgentMemberInput } from './team-agent-generator.js';

// Team creation wizard
export { teamCreationWizard, nonInteractiveCreate } from './team-wizard.js';
export type { WizardOptions, CreatePaths } from './team-wizard.js';

// Team validation
export {
  validateTeamFull,
  validateMemberAgents,
  detectTaskCycles,
  detectToolOverlap,
  detectSkillConflicts,
  detectRoleCoherence,
} from './team-validator.js';
export type {
  TeamFullValidationResult,
  TeamFullValidationOptions,
  MemberResolutionResult,
  CycleDetectionResult,
  ToolOverlapResult,
  SkillConflictResult,
  SkillConflictEntry,
  RoleCoherenceResult,
  RoleCoherenceWarning,
} from './team-validator.js';

// Inter-team communication
export { validateInterTeamLinks, detectInterTeamCycles } from './inter-team-bridge.js';
export type { InterTeamCycleResult, InterTeamValidationResult } from './inter-team-bridge.js';

// Message safety
export { sanitizeInboxMessage } from '../validation/message-safety.js';

// Cost estimation
export { CostEstimator, MODEL_PRICING, TOPOLOGY_TOKEN_ESTIMATES, PRICING_LAST_UPDATED } from './cost-estimator.js';
export type { MemberEstimate, CostEstimate } from './cost-estimator.js';
