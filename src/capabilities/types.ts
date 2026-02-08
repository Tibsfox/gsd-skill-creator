/**
 * Type definitions for the capability manifest system.
 *
 * Defines types for discovered skills, agents, and teams along with
 * the aggregate CapabilityManifest. Each entry includes a content hash
 * (SHA-256 truncated to 16 hex chars) for fine-grained staleness detection.
 * The manifest includes a whole-manifest contentHash for quick "anything changed?" checks.
 */

import { createHash } from 'crypto';

// ============================================================================
// Capability Entry Types
// ============================================================================

/**
 * A discovered skill entry with scope and content hash.
 */
export interface SkillCapability {
  name: string;
  description: string;
  scope: 'user' | 'project';
  contentHash: string;
}

/**
 * A discovered agent entry with scope, optional tool/model hints, and content hash.
 */
export interface AgentCapability {
  name: string;
  description: string;
  scope: 'user' | 'project';
  tools?: string;
  model?: string;
  contentHash: string;
}

/**
 * A discovered team entry with scope, topology, member count, and content hash.
 */
export interface TeamCapability {
  name: string;
  description?: string;
  scope: 'user' | 'project';
  topology?: string;
  memberCount: number;
  contentHash: string;
}

// ============================================================================
// Manifest Type
// ============================================================================

/**
 * The aggregate discovery result containing all capabilities.
 *
 * - version: Schema version (always 1 for now)
 * - generatedAt: ISO 8601 timestamp of when the manifest was generated
 * - contentHash: SHA-256 of all sorted entry data (excludes generatedAt)
 * - skills/agents/teams: Sorted arrays of discovered capabilities
 */
export interface CapabilityManifest {
  version: 1;
  generatedAt: string;
  contentHash: string;
  skills: SkillCapability[];
  agents: AgentCapability[];
  teams: TeamCapability[];
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Compute SHA-256 hash of content, truncated to 16 hex characters.
 *
 * Matches the existing pattern in src/embeddings/embedding-cache.ts.
 *
 * @param content - String content to hash
 * @returns 16-character hex hash string
 */
export function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}
