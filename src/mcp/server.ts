/**
 * MCP server -- exposes skill-creator functionality via the Model Context Protocol.
 *
 * Registers 4 tools: list_skills, search_skills, read_skill, install_skill.
 * All business logic is delegated to existing modules (SkillStore, SkillIndex,
 * exportPortableContent, installSkill). This file is a thin adapter.
 *
 * Uses stdio transport via the official MCP TypeScript SDK.
 * CRITICAL: Never use console.log in this file (stdout is MCP protocol).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Create an MCP server with 4 registered tools for skill management.
 *
 * @param skillsDir - Base directory where skills are stored
 * @returns Configured McpServer instance
 */
export function createMcpServer(_skillsDir?: string): McpServer {
  throw new Error('Not implemented');
}

/**
 * Start the MCP server on stdio transport.
 *
 * @param skillsDir - Optional override for skills directory (defaults to user scope)
 */
export async function startMcpServer(_skillsDir?: string): Promise<void> {
  throw new Error('Not implemented');
}
