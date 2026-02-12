import * as fs from 'fs';
import * as path from 'path';
import { SkillCluster } from './cluster-detector.js';
import { SkillStore } from '../storage/skill-store.js';
import {
  validateAgentFrontmatter,
  validateToolsField,
} from '../validation/agent-validation.js';
import type { AgentFrontmatter } from '../types/agent.js';
import {
  validateSafeName,
  assertSafePath,
  PathTraversalError,
} from '../validation/path-safety.js';

/**
 * Warning message for user-level agent creation.
 *
 * GitHub issue #11205: User-level agents in ~/.claude/agents/ may not be
 * discovered by Claude Code at session startup.
 */
export const USER_AGENT_BUG_WARNING = `
Note: There is a known bug (GitHub issue #11205) where user-level agents
in ~/.claude/agents/ may not be discovered by Claude Code at session startup.

Workarounds:
1. Use project-level agents (.claude/agents/) instead
2. Use the /agents UI command to create agents interactively
3. Pass agents via --agents CLI flag for session-only agents

The agent was created successfully, but you may need to use a workaround.
`.trim();

export interface GeneratedAgent {
  name: string;
  description: string;
  skills: string[];
  filePath: string;
  content: string;
  /** Warning message for user-level agents (bug #11205) */
  warning?: string;
}

export interface AgentGeneratorConfig {
  agentsDir: string;            // Output directory (default .claude/agents)
  model: 'inherit' | 'sonnet' | 'opus' | 'haiku';  // Model to use
  tools: string[];              // Default tools for generated agents
  scope?: 'user' | 'project';   // Scope for detecting when warning is needed
}

export const DEFAULT_AGENT_GENERATOR_CONFIG: AgentGeneratorConfig = {
  agentsDir: '.claude/agents',
  model: 'inherit',
  tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
};

export class AgentGenerator {
  private config: AgentGeneratorConfig;
  private skillStore: SkillStore;

  constructor(skillStore: SkillStore, config?: Partial<AgentGeneratorConfig>) {
    this.config = { ...DEFAULT_AGENT_GENERATOR_CONFIG, ...config };
    this.skillStore = skillStore;
  }

  /**
   * Validate that a name is safe for filesystem use (no traversal).
   * @throws PathTraversalError if name contains traversal sequences
   */
  private assertSafeName(name: string): void {
    const result = validateSafeName(name);
    if (!result.valid) {
      throw new PathTraversalError(result.error!);
    }
  }

  /**
   * Verify a resolved path stays within the agents directory.
   * @throws PathTraversalError if path escapes the base directory
   */
  private assertSafeAgentPath(resolvedPath: string): void {
    assertSafePath(
      path.resolve(resolvedPath),
      path.resolve(this.config.agentsDir),
    );
  }

  /**
   * Generate agent content from a skill cluster (preview)
   */
  async generateContent(cluster: SkillCluster): Promise<GeneratedAgent> {
    // Load skill descriptions for the body
    const skillDescriptions = await this.loadSkillDescriptions(cluster.skills);

    const name = this.sanitizeName(cluster.suggestedName);
    const description = cluster.suggestedDescription;

    // Validate and correct tools before generating content
    const correctedTools = this.validateAndCorrectTools();

    const content = this.formatAgentMarkdown({
      name,
      description,
      skills: cluster.skills,
      skillDescriptions,
      tools: correctedTools,
    });

    // Validate the generated frontmatter
    const frontmatterData: AgentFrontmatter = {
      name,
      description,
      tools: correctedTools.join(', '),
      model: this.config.model,
      skills: cluster.skills,
    };

    const validation = validateAgentFrontmatter(frontmatterData);

    if (!validation.valid) {
      const errorList = validation.errors.join('; ');
      throw new Error(`Agent validation failed: ${errorList}`);
    }

    // Log warnings but don't fail
    if (validation.warnings.length > 0) {
      console.warn(`Agent validation warnings: ${validation.warnings.join('; ')}`);
    }

    const filePath = path.join(this.config.agentsDir, `${name}.md`);

    // Defense-in-depth: verify resolved path stays within agents directory
    this.assertSafeAgentPath(filePath);

    return {
      name,
      description,
      skills: cluster.skills,
      filePath,
      content,
    };
  }

  /**
   * Create agent file on disk
   */
  async create(cluster: SkillCluster): Promise<GeneratedAgent> {
    const agent = await this.generateContent(cluster);

    // Defense-in-depth: verify resolved path stays within agents directory
    this.assertSafeAgentPath(agent.filePath);

    // Check for existing agent with same name
    if (fs.existsSync(agent.filePath)) {
      throw new Error(`Agent '${agent.name}' already exists at ${agent.filePath}`);
    }

    // Ensure directory exists
    fs.mkdirSync(path.dirname(agent.filePath), { recursive: true });

    // Write agent file
    fs.writeFileSync(agent.filePath, agent.content, 'utf8');

    // Add warning for user-level agents (bug #11205)
    if (this.config.scope === 'user') {
      return {
        ...agent,
        warning: USER_AGENT_BUG_WARNING,
      };
    }

    return agent;
  }

  private async loadSkillDescriptions(skillNames: string[]): Promise<Map<string, string>> {
    const descriptions = new Map<string, string>();

    for (const name of skillNames) {
      try {
        const skill = await this.skillStore.read(name);
        if (skill) {
          descriptions.set(name, skill.metadata.description);
        }
      } catch {
        descriptions.set(name, '(description not available)');
      }
    }

    return descriptions;
  }

  private formatAgentMarkdown(opts: {
    name: string;
    description: string;
    skills: string[];
    skillDescriptions: Map<string, string>;
    tools: string[];
  }): string {
    const { name, description, skills, skillDescriptions, tools } = opts;

    // Build skill list for body
    const skillList = skills
      .map(s => `- **${s}**: ${skillDescriptions.get(s) || ''}`)
      .join('\n');

    return `---
name: ${name}
description: ${description}
tools: ${tools.join(', ')}
model: ${this.config.model}
skills:
${skills.map(s => `  - ${s}`).join('\n')}
---

You are a specialized agent combining expertise from the following skills:
${skillList}

When invoked, apply the combined knowledge from these skills to complete
the task effectively.

## How to Use

This agent was auto-generated from a skill cluster. The skills listed above
will be preloaded into your context, giving you specialized knowledge for
tasks that commonly require these capabilities together.

## Skills Included

${skills.map(s => {
  const desc = skillDescriptions.get(s) || '';
  return `### ${s}\n${desc}`;
}).join('\n\n')}
`;
  }

  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);
  }

  /**
   * Validate and correct tools from config.
   *
   * Runs tools through validation to:
   * - Fix case mismatches (e.g., "read" -> "Read")
   * - Apply fuzzy match corrections for typos
   *
   * @returns Corrected tools array
   */
  private validateAndCorrectTools(): string[] {
    const toolsString = this.config.tools.join(', ');
    const result = validateToolsField(toolsString);

    if (result.corrected) {
      // Parse the corrected string back to array
      const correctedTools = result.corrected
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Log corrections made
      console.log(`Tool names corrected: "${toolsString}" -> "${result.corrected}"`);

      return correctedTools;
    }

    return this.config.tools;
  }

  /**
   * Check if an agent name is available
   * @throws PathTraversalError if name contains traversal sequences
   */
  isNameAvailable(name: string): boolean {
    this.assertSafeName(name);
    const filePath = path.join(this.config.agentsDir, `${name}.md`);
    this.assertSafeAgentPath(filePath);
    return !fs.existsSync(filePath);
  }
}
