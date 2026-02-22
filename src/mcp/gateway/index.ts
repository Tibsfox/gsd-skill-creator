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
