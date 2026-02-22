/**
 * GSD-OS MCP Gateway -- HTTP-based MCP server with authentication.
 *
 * Barrel exports for the gateway module.
 */

export {
  GatewayScopeSchema,
  type GatewayScope,
  SCOPE_HIERARCHY,
  TokenInfoSchema,
  type TokenInfo,
  GatewayConfigSchema,
  type GatewayConfig,
  DEFAULT_GATEWAY_PORT,
  DEFAULT_GATEWAY_HOST,
  DEFAULT_TOKEN_PATH,
} from './types.js';

export {
  resolveTokenPath,
  generateToken,
  createTokenInfo,
  readToken,
  writeToken,
  readOrCreateToken,
  validateToken,
} from './token-manager.js';

export {
  type AuthResult,
  extractBearerToken,
  authenticateRequest,
  hasScope,
  getToolScope,
  canInvokeTool,
} from './auth.js';

export {
  GatewayError,
  formatJsonRpcError,
  toJsonRpcError,
  PARSE_ERROR,
  INVALID_REQUEST,
  METHOD_NOT_FOUND,
  INVALID_PARAMS,
  INTERNAL_ERROR,
  PERMISSION_DENIED,
  RATE_LIMITED,
} from './errors.js';

export {
  type GatewayHandle,
  type McpServerFactory,
  startGateway,
} from './server.js';

// Project tools
export {
  type GatewayToolsConfig,
  type ProjectToolsConfig,
  type ProjectSummary,
  type ProjectDetails,
  type CreateProjectResult,
  type ExecutePhaseResult,
  registerAllTools,
  createGatewayServerFactory,
  discoverProjects,
  getProjectDetails,
  createProject,
  triggerPhaseExecution,
} from './tools/index.js';

// Skill tools
export {
  type SkillToolsConfig,
  type SkillSearchResult,
  type SkillInspectResult,
  type SkillActivateResult,
  searchSkills,
  inspectSkill,
  activateSkill,
  registerSkillReadTools,
  registerSkillWriteTools,
} from './tools/index.js';

// Chipset tools and state management
export {
  registerChipsetTools,
  synthesizeChipset,
  ChipsetStateManager,
  createChipsetStateManager,
  type ChipsetModifyResult,
  type ChipsetUpdate,
} from './tools/index.js';

// Resource providers
export {
  registerResourceProviders,
  type ProjectConfigData,
  type SkillRegistryEntry,
  type AgentTelemetryData,
  type ProjectConfigProvider,
  type SkillRegistryProvider,
  type AgentTelemetryProvider,
  type ChipsetStateProvider,
  type ResourceProviders,
} from './resources/index.js';

// Prompt templates
export { registerPromptTemplates } from './prompts/index.js';

// Gateway server factory
export {
  createGsdGatewayFactory,
  type GatewayFactoryOptions,
} from './create-gateway-server.js';
