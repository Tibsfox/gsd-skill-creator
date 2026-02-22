/**
 * MCP and staging gate TypeScript types with Zod v4 runtime validation schemas.
 *
 * Single source of truth for all downstream MCP components: host manager, gateway,
 * templates, agent bridge, and security gates. Rust FFI types (Plan 02) mirror these.
 */

import { z } from 'zod';

// ============================================================================
// MCP Core Types
// ============================================================================

// ── TransportConfig ─────────────────────────────────────────────────────────

/** stdio transport: launches a child process with the given command. */
const StdioTransportSchema = z.object({
  type: z.literal('stdio'),
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

/** Streamable HTTP transport: connects to a remote MCP server over HTTP. */
const StreamableHttpTransportSchema = z.object({
  type: z.literal('streamable-http'),
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
});

/** Transport configuration -- discriminated union of stdio and streamable-http. */
export const TransportConfigSchema = z.discriminatedUnion('type', [
  StdioTransportSchema,
  StreamableHttpTransportSchema,
]);

/** Transport configuration for connecting to an MCP server. */
export type TransportConfig = z.infer<typeof TransportConfigSchema>;

// ── Tool ────────────────────────────────────────────────────────────────────

/** MCP tool definition exposed by a server. */
export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.string(), z.unknown()),
});

/** An MCP tool definition with name, description, and JSON Schema input. */
export type Tool = z.infer<typeof ToolSchema>;

// ── Resource ────────────────────────────────────────────────────────────────

/** MCP resource definition exposed by a server. */
export const ResourceSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
});

/** An MCP resource identified by URI with optional description and MIME type. */
export type Resource = z.infer<typeof ResourceSchema>;

// ── Prompt ──────────────────────────────────────────────────────────────────

/** MCP prompt argument definition. */
const PromptArgumentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().optional(),
});

/** MCP prompt template definition exposed by a server. */
export const PromptSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  arguments: z.array(PromptArgumentSchema).optional(),
});

/** An MCP prompt template with optional typed arguments. */
export type Prompt = z.infer<typeof PromptSchema>;

// ── ServerCapability ────────────────────────────────────────────────────────

/** Discovered capabilities from an MCP server after initialization. */
export const ServerCapabilitySchema = z.object({
  tools: z.array(ToolSchema),
  resources: z.array(ResourceSchema),
  prompts: z.array(PromptSchema),
  serverName: z.string(),
  serverVersion: z.string(),
});

/** Full capability manifest discovered from an MCP server. */
export type ServerCapability = z.infer<typeof ServerCapabilitySchema>;

// ── McpMessage ──────────────────────────────────────────────────────────────

/** JSON-RPC 2.0 error object. */
const JsonRpcErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
});

/** JSON-RPC 2.0 message wrapper for MCP protocol communication. */
export const McpMessageSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string().optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  result: z.unknown().optional(),
  error: JsonRpcErrorSchema.optional(),
});

/** A JSON-RPC 2.0 message used in MCP protocol communication. */
export type McpMessage = z.infer<typeof McpMessageSchema>;

// ── TraceEvent ──────────────────────────────────────────────────────────────

/** Structured trace record for MCP message observability. */
export const TraceEventSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  serverId: z.string(),
  method: z.string(),
  direction: z.enum(['outgoing', 'incoming']),
  latencyMs: z.number().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
});

/** A structured trace event recording an MCP message exchange. */
export type TraceEvent = z.infer<typeof TraceEventSchema>;

// ============================================================================
// Staging Gate Types
// ============================================================================

// ── TrustState ──────────────────────────────────────────────────────────────

/** Trust lifecycle state for an MCP server in the staging pipeline. */
export const TrustStateSchema = z.enum([
  'quarantine',
  'provisional',
  'trusted',
  'suspended',
]);

/** Trust state controlling what operations a server is allowed to perform. */
export type TrustState = z.infer<typeof TrustStateSchema>;

// ── HashRecord ──────────────────────────────────────────────────────────────

/** Tool definition hash for detecting capability drift. */
export const HashRecordSchema = z.object({
  serverId: z.string(),
  hash: z.string(),
  toolCount: z.number(),
  computedAt: z.number(),
  previousHash: z.string().optional(),
});

/** A SHA-256 hash of a server's tool definitions for drift detection. */
export type HashRecord = z.infer<typeof HashRecordSchema>;

// ── ValidationResult ────────────────────────────────────────────────────────

/** Invocation validation outcome from the security gate pipeline. */
export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  blocked: z.boolean(),
  reason: z.string().optional(),
  rule: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']),
});

/** Result of validating a tool invocation against security rules. */
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// ── SecurityGate ────────────────────────────────────────────────────────────

/** Security gate contract for MCP server trust management and invocation validation. */
export interface SecurityGate {
  computeHash(tools: Tool[]): Promise<HashRecord>;
  validateInvocation(
    serverId: string,
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<ValidationResult>;
  getTrustState(serverId: string): Promise<TrustState>;
  setTrustState(
    serverId: string,
    state: TrustState,
    reason: string,
  ): Promise<void>;
}
