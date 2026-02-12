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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createRequire } from 'node:module';
import { SkillStore } from '../storage/skill-store.js';
import { SkillIndex } from '../storage/skill-index.js';
import { exportPortableContent } from '../portability/index.js';
import { installSkill } from './skill-installer.js';
import { getSkillsBasePath } from '../types/scope.js';

// Read version from package.json using createRequire (safe in ESM)
const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string };

/**
 * Resolve the skills directory from an optional scope string.
 * Falls back to the provided default skillsDir.
 */
function resolveSkillsDir(defaultDir: string, scope?: string): string {
  if (scope === 'user') return getSkillsBasePath('user');
  if (scope === 'project') return getSkillsBasePath('project');
  return defaultDir;
}

/**
 * Create an MCP server with 4 registered tools for skill management.
 *
 * @param skillsDir - Base directory where skills are stored
 * @returns Configured McpServer instance
 */
export function createMcpServer(skillsDir?: string): McpServer {
  const defaultDir = skillsDir ?? getSkillsBasePath('user');

  const server = new McpServer(
    { name: 'skill-creator', version: pkg.version },
  );

  // ── list_skills ───────────────────────────────────────────────────────
  server.tool(
    'list_skills',
    'List all skill names in the skills directory',
    {
      scope: z.enum(['user', 'project']).optional().describe('Skill scope'),
    },
    async (args) => {
      try {
        const targetDir = resolveSkillsDir(defaultDir, args.scope);
        const store = new SkillStore(targetDir);
        const names = await store.list();
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(names) }],
        };
      } catch (err) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error listing skills: ${err instanceof Error ? err.message : String(err)}`,
          }],
          isError: true,
        };
      }
    },
  );

  // ── search_skills ─────────────────────────────────────────────────────
  server.tool(
    'search_skills',
    'Search skills by name or description',
    {
      query: z.string().min(1).describe('Search query'),
      scope: z.enum(['user', 'project']).optional().describe('Skill scope'),
    },
    async (args) => {
      try {
        const targetDir = resolveSkillsDir(defaultDir, args.scope);
        const store = new SkillStore(targetDir);
        const index = new SkillIndex(store, targetDir);
        const results = await index.search(args.query);
        const simplified = results.map((entry) => ({
          name: entry.name,
          description: entry.description,
          enabled: entry.enabled,
        }));
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(simplified) }],
        };
      } catch (err) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error searching skills: ${err instanceof Error ? err.message : String(err)}`,
          }],
          isError: true,
        };
      }
    },
  );

  // ── read_skill ────────────────────────────────────────────────────────
  server.tool(
    'read_skill',
    'Read a skill in portable format',
    {
      name: z.string().min(1).describe('Skill name'),
      scope: z.enum(['user', 'project']).optional().describe('Skill scope'),
    },
    async (args) => {
      try {
        const targetDir = resolveSkillsDir(defaultDir, args.scope);
        const store = new SkillStore(targetDir);
        const skill = await store.read(args.name);
        const portable = exportPortableContent(skill);
        return {
          content: [{ type: 'text' as const, text: portable }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{
            type: 'text' as const,
            text: `Skill not found: ${args.name} (${message})`,
          }],
          isError: true,
        };
      }
    },
  );

  // ── install_skill ─────────────────────────────────────────────────────
  server.tool(
    'install_skill',
    'Install a skill from a local .tar.gz file or remote URL',
    {
      source: z.string().describe('Local file path or URL to .tar.gz package'),
      scope: z.enum(['user', 'project']).optional().describe('Skill scope'),
    },
    async (args) => {
      try {
        const targetDir = resolveSkillsDir(defaultDir, args.scope);
        const result = await installSkill(args.source, targetDir);

        if (result.success) {
          let text = `Successfully installed skill "${result.skillName}"`;
          if (result.installedPath) {
            text += ` to ${result.installedPath}`;
          }
          if (result.warnings.length > 0) {
            text += `\nWarnings:\n${result.warnings.map((w) => `  - ${w}`).join('\n')}`;
          }
          return {
            content: [{ type: 'text' as const, text }],
          };
        }

        let errorText = `Failed to install skill: ${result.error}`;
        if (result.warnings.length > 0) {
          errorText += `\nWarnings:\n${result.warnings.map((w) => `  - ${w}`).join('\n')}`;
        }
        return {
          content: [{ type: 'text' as const, text: errorText }],
          isError: true,
        };
      } catch (err) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error installing skill: ${err instanceof Error ? err.message : String(err)}`,
          }],
          isError: true,
        };
      }
    },
  );

  return server;
}

/**
 * Start the MCP server on stdio transport.
 *
 * @param skillsDir - Optional override for skills directory (defaults to user scope)
 */
export async function startMcpServer(skillsDir?: string): Promise<void> {
  const server = createMcpServer(skillsDir ?? getSkillsBasePath('user'));
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // CRITICAL: Use console.error, NEVER console.log (stdout is MCP protocol)
  console.error('skill-creator MCP server running on stdio');
}
