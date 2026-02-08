/**
 * GSD team config parser.
 *
 * Parses team config.json files into typed metadata. Handles both
 * GSD-native teams (with agentId members and leadAgentId) and example
 * teams (with role/description/tools/model members).
 *
 * Returns null for malformed files (invalid JSON or missing name)
 * instead of throwing, enabling graceful degradation during discovery.
 */

import type { GsdTeamMetadata } from './types.js';

/**
 * Parse a team config.json file into typed metadata.
 *
 * Supports two config schemas:
 * - GSD-native: members have { agentId, role }, config has leadAgentId
 * - Example: members have { name, role, description, tools, model }
 *
 * @param content - Raw JSON string
 * @param filePath - Absolute path to the config.json file
 * @returns Parsed metadata, or null if content is malformed
 */
export function parseTeamConfig(content: string, filePath: string): GsdTeamMetadata | null {
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }

  // Name is required
  const name = config.name;
  if (!name || typeof name !== 'string') {
    return null;
  }

  // Optional fields
  const description = typeof config.description === 'string' ? config.description : undefined;
  const topology = typeof config.topology === 'string' ? config.topology : undefined;
  const leadAgentId = typeof config.leadAgentId === 'string' ? config.leadAgentId : undefined;

  // Member count -- handles both schemas and missing/empty arrays
  const memberCount = Array.isArray(config.members) ? config.members.length : 0;

  return {
    name,
    description,
    topology,
    memberCount,
    leadAgentId,
    filePath,
  };
}
