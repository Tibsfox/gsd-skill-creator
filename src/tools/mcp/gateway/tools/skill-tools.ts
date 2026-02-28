/**
 * Gateway skill.* tool implementations.
 *
 * Provides MCP tools for searching, inspecting, and activating skills
 * in the GSD skill ecosystem. Tools use SkillStore and SkillIndex for
 * disk access and are registered on an McpServer instance via the
 * registration functions.
 *
 * GATE-08: skill.search returns relevance-scored results
 * GATE-09: skill.inspect returns full SKILL.md content and metadata
 * GATE-10: skill.activate loads a skill and reports token budget impact
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SkillStore } from '../../../../core/storage/skill-store.js';
import { SkillIndex } from '../../../../core/storage/skill-index.js';

// ── Types ───────────────────────────────────────────────────────────────

export interface SkillToolsConfig {
  /** Path to the project-level skills directory. */
  skillsDir: string;
}

export interface SkillSearchResult {
  /** Skill name. */
  name: string;
  /** Skill description. */
  description: string;
  /** Whether the skill is enabled. */
  enabled: boolean;
  /** Relevance score (0-1). */
  score: number;
}

export interface SkillInspectResult {
  /** Whether the skill was found. */
  found: boolean;
  /** Skill name. */
  name?: string;
  /** Skill description. */
  description?: string;
  /** Skill body content (markdown). */
  body?: string;
  /** Skill metadata object. */
  metadata?: Record<string, unknown>;
  /** Skill file path. */
  path?: string;
  /** Error message if not found. */
  error?: string;
}

export interface SkillActivateResult {
  /** Whether activation succeeded. */
  activated: boolean;
  /** Skill name. */
  name: string;
  /** Estimated token count for the skill body. */
  estimatedTokens: number;
  /** Budget impact information. */
  budgetImpact?: {
    /** Tokens added by this activation. */
    tokensAdded: number;
  };
  /** Error message if activation failed. */
  error?: string;
}

// ── Core Functions ──────────────────────────────────────────────────────

/**
 * Compute a simple relevance score for a skill match against a query.
 */
function computeScore(name: string, description: string, query: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();

  let score = 0;
  // Exact name match is highest
  if (lowerName === lowerQuery) score += 1.0;
  // Name contains query
  else if (lowerName.includes(lowerQuery)) score += 0.7;
  // Description contains query
  if (lowerDesc.includes(lowerQuery)) score += 0.3;

  return score;
}

/**
 * Search for skills matching a query string.
 *
 * Uses SkillIndex for disk access and substring matching,
 * then computes relevance scores and sorts descending.
 */
export async function searchSkills(
  skillsDir: string,
  query: string,
): Promise<SkillSearchResult[]> {
  try {
    const store = new SkillStore(skillsDir);
    const index = new SkillIndex(store, skillsDir);
    const matches = await index.search(query);

    return matches
      .map((entry) => ({
        name: entry.name,
        description: entry.description,
        enabled: entry.enabled,
        score: computeScore(entry.name, entry.description, query),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

/**
 * Inspect a skill by name, returning its full content and metadata.
 */
export async function inspectSkill(
  skillsDir: string,
  name: string,
): Promise<SkillInspectResult> {
  try {
    const store = new SkillStore(skillsDir);
    const skill = await store.read(name);

    return {
      found: true,
      name: skill.metadata.name,
      description: skill.metadata.description,
      body: skill.body,
      metadata: skill.metadata as unknown as Record<string, unknown>,
      path: skill.path,
    };
  } catch {
    return {
      found: false,
      error: `Skill "${name}" not found in ${skillsDir}`,
    };
  }
}

/**
 * Activate a skill by name, computing its token budget impact.
 *
 * Token estimation uses the same heuristic as SkillInjector:
 * estimated_tokens = ceil(body.length / 4)
 */
export async function activateSkill(
  skillsDir: string,
  name: string,
): Promise<SkillActivateResult> {
  try {
    const store = new SkillStore(skillsDir);
    const skill = await store.read(name);
    const estimatedTokens = Math.ceil(skill.body.length / 4);

    return {
      activated: true,
      name: skill.metadata.name,
      estimatedTokens,
      budgetImpact: {
        tokensAdded: estimatedTokens,
      },
    };
  } catch {
    return {
      activated: false,
      name,
      estimatedTokens: 0,
      error: `Skill "${name}" not found in ${skillsDir}`,
    };
  }
}

// ── Tool Registration ───────────────────────────────────────────────────

/**
 * Register skill.search and skill.inspect tools (read scope) on an McpServer.
 */
export function registerSkillReadTools(server: McpServer, config: SkillToolsConfig): void {
  server.tool(
    'skill.search',
    'Search for skills matching a query and return relevance-scored results',
    {
      query: z.string().min(1).describe('Search query (name or description substring)'),
    },
    async (args) => {
      const results = await searchSkills(config.skillsDir, args.query);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(results, null, 2),
        }],
      };
    },
  );

  server.tool(
    'skill.inspect',
    'Get full SKILL.md content and metadata for a named skill',
    {
      name: z.string().min(1).describe('Skill name to inspect'),
    },
    async (args) => {
      const result = await inspectSkill(config.skillsDir, args.name);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
        isError: !result.found,
      };
    },
  );
}

/**
 * Register skill.activate tool (write scope) on an McpServer.
 */
export function registerSkillWriteTools(server: McpServer, config: SkillToolsConfig): void {
  server.tool(
    'skill.activate',
    'Load a skill into the chipset and report the token budget impact',
    {
      name: z.string().min(1).describe('Skill name to activate'),
    },
    async (args) => {
      const result = await activateSkill(config.skillsDir, args.name);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
        isError: !result.activated,
      };
    },
  );
}
