/**
 * Blueprint block and wiring type definitions for MCP presentation.
 *
 * Defines the block types (Server, Tool, Resource), port types for wiring,
 * and validation structures for the Blueprint Editor. These types drive
 * the visual representation of MCP infrastructure in the GSD-OS desktop.
 *
 * @module mcp/presentation/types
 */

import type { TrustState } from '../../core/types/mcp.js';

// ============================================================================
// Block Types
// ============================================================================

/** The three block types in the MCP Blueprint Editor. */
export type BlockType = 'server' | 'tool' | 'resource';

/** Direction of a port on a block. */
export type PortDirection = 'input' | 'output';

/** Semantic type of a port, controlling wiring compatibility. */
export type PortType =
  | 'tool-call'
  | 'tool-result'
  | 'resource-data'
  | 'agent-input'
  | 'agent-output'
  | 'context';

// ============================================================================
// Port & Block Definitions
// ============================================================================

/** A single port on a blueprint block. */
export interface BlockPort {
  /** Unique port identifier (block-scoped). */
  id: string;
  /** Display name for the port. */
  name: string;
  /** Whether this port accepts or produces data. */
  direction: PortDirection;
  /** Semantic type controlling wiring rules. */
  portType: PortType;
  /** Whether this port currently has a wire connected. */
  connected: boolean;
}

/** A block in the Blueprint Editor. */
export interface BlockDefinition {
  /** Unique block identifier. */
  id: string;
  /** Block category. */
  type: BlockType;
  /** Display label for the block header. */
  label: string;
  /** Ports available on this block. */
  ports: BlockPort[];
  /** Canvas position. */
  position: { x: number; y: number };
}

// ============================================================================
// Block Data (rendering context)
// ============================================================================

/** Data needed to render an MCP Server block. */
export interface ServerBlockData {
  /** Server identifier used for IPC targeting. */
  serverId: string;
  /** Human-readable server name. */
  serverName: string;
  /** Current connection status. */
  status: 'connected' | 'disconnected' | 'failed' | 'connecting';
  /** Security trust state from the staging pipeline. */
  trustState: TrustState;
  /** Number of tools discovered on this server. */
  toolCount: number;
  /** Number of resources discovered on this server. */
  resourceCount: number;
  /** Number of prompts discovered on this server. */
  promptCount: number;
  /** Tool names and descriptions for port rendering. */
  tools: Array<{ name: string; description: string }>;
  /** Resource names and URIs for port rendering. */
  resources: Array<{ name: string; uri: string }>;
}

/** Data needed to render an MCP Tool block. */
export interface ToolBlockData {
  /** Tool name as registered with the server. */
  toolName: string;
  /** Tool description. */
  description: string;
  /** Server that owns this tool. */
  serverId: string;
  /** Tool input parameters for preview display. */
  parameters: Array<{ name: string; type: string; required: boolean }>;
}

/** Data needed to render an MCP Resource block. */
export interface ResourceBlockData {
  /** Resource display name. */
  resourceName: string;
  /** Resource URI. */
  uri: string;
  /** MIME type of the resource content. */
  mimeType?: string;
  /** Resource description. */
  description?: string;
  /** Server that owns this resource. */
  serverId: string;
  /** Whether the resource is currently subscribed. */
  subscribed: boolean;
}

// ============================================================================
// Wiring Types
// ============================================================================

/** A rule defining whether two port types can be wired together. */
export interface WiringRule {
  /** Port type of the source (wire start). */
  fromPortType: PortType;
  /** Port type of the target (wire end). */
  toPortType: PortType;
  /** Whether this connection is allowed. */
  allowed: boolean;
  /** Human-readable reason (used for error messages when not allowed). */
  reason?: string;
}

/** Result of validating a wiring attempt between two ports. */
export interface WiringValidation {
  /** Whether the wiring is valid. */
  valid: boolean;
  /** Error message if invalid. */
  error?: string;
  /** The source port. */
  fromPort: BlockPort;
  /** The target port. */
  toPort: BlockPort;
}
