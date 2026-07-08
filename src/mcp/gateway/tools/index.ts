/**
 * Gateway tool barrel -- re-exports the domain-specific tool modules (project,
 * skill, chipset, agent, workflow, session, memory).
 *
 * The production server factory lives in `create-gateway-server.ts`
 * (`createGsdGatewayFactory`); the earlier narrow `createGatewayServerFactory`
 * / `registerAllTools` pair here was superseded and removed (MEM-8).
 */

// ── Re-exports ──────────────────────────────────────────────────────────

export type { ProjectToolsConfig } from './project-tools.js';
export {
  type ProjectSummary,
  type ProjectDetails,
  type CreateProjectResult,
  type ExecutePhaseResult,
  discoverProjects,
  getProjectDetails,
  createProject,
  triggerPhaseExecution,
} from './project-tools.js';

// Skill tools
export type { SkillToolsConfig } from './skill-tools.js';
export {
  type SkillSearchResult,
  type SkillInspectResult,
  type SkillActivateResult,
  searchSkills,
  inspectSkill,
  activateSkill,
  registerSkillReadTools,
  registerSkillWriteTools,
} from './skill-tools.js';

export {
  registerChipsetTools,
  synthesizeChipset,
} from './chipset-tools.js';

export {
  ChipsetStateManager,
  createChipsetStateManager,
  type ChipsetModifyResult,
  type ChipsetUpdate,
} from './chipset-state.js';

// Agent tools
export {
  AgentStateSchema,
  type AgentState,
  AgentRoleSchema,
  type AgentRole,
  TokenUsageSchema,
  type TokenUsage,
  LogLevelSchema,
  type LogLevel,
  AgentLogEntrySchema,
  type AgentLogEntry,
  AgentRecordSchema,
  type AgentRecord,
  DEFAULT_MAX_LOGS,
} from './agent-types.js';

export {
  AgentRegistry,
  type SpawnOptions,
} from './agent-registry.js';

export { registerAgentTools } from './agent-tools.js';

// Workflow tools
export {
  WorkflowStageSchema,
  type WorkflowStage,
  ResearchResultSchema,
  type ResearchResult,
  RequirementsResultSchema,
  type RequirementsResult,
  PlanResultSchema,
  type PlanResult,
  ExecuteResultSchema,
  type ExecuteResult,
  WorkflowInvocationSchema,
  type WorkflowInvocation,
} from './workflow-types.js';

export { WorkflowEngine } from './workflow-engine.js';

export { registerWorkflowTools } from './workflow-tools.js';

// Session tools
export {
  SessionMatchSchema,
  type SessionMatch,
  PatternRecordSchema,
  type PatternRecord,
  IntelligenceEntrySchema,
  type IntelligenceEntry,
} from './session-types.js';

export { SessionStore } from './session-store.js';

export { registerSessionTools } from './session-tools.js';

// Memory tools
export { registerMemoryTools } from './memory-tools.js';
