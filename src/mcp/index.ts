export { createMcpServer, startMcpServer } from './server.js';

// MCP Templates (project scaffold generators)
export {
  generateMcpProject,
  generateServerFiles,
  generateHostFiles,
  generateClientFiles,
  McpProjectConfigSchema,
  McpTemplateTypeSchema,
  type McpProjectConfig,
  type McpTemplateType,
  type TemplateFile,
  type GeneratorResult,
} from './templates/index.js';
export { packSkill, type SkillPackageManifest } from './skill-packager.js';
export { installSkill, type InstallResult, type InstallOptions } from './skill-installer.js';
export { validateContentSafety, type ContentSafetyResult, type ContentSafetyOptions } from './content-validator.js';

// Gateway server (Streamable HTTP transport with authentication)
export {
  type GatewayScope,
  type TokenInfo,
  type GatewayConfig,
  type AuthResult,
  type GatewayHandle,
  type McpServerFactory,
  startGateway,
  extractBearerToken,
  authenticateRequest,
  hasScope,
  getToolScope,
  canInvokeTool,
  resolveTokenPath,
  generateToken,
  readOrCreateToken,
  validateToken,
} from './gateway/index.js';

// Agent Bridge (Agent-Server and Agent-Client MCP adapters)
export {
  type AgentServerConfig,
  type AgentClientConfig,
  type AgentToolDef,
  type AgentResourceDef,
  type AgentToolHandler,
  type AgentToolResult,
  type InvocationContext,
  createAgentServer,
  createScoutServer,
  SCOUT_SERVER_CONFIG,
  createVerifyServer,
  VERIFY_SERVER_CONFIG,
  AgentClientAdapter,
  ExecClient,
  createExecClient,
} from './agent-bridge/index.js';
