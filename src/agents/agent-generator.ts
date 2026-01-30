import * as fs from 'fs';
import * as path from 'path';
import { SkillCluster } from './cluster-detector.js';
import { SkillStore } from '../storage/skill-store.js';

export interface GeneratedAgent {
  name: string;
  description: string;
  skills: string[];
  filePath: string;
  content: string;
}

export interface AgentGeneratorConfig {
  agentsDir: string;            // Output directory (default .claude/agents)
  model: 'inherit' | 'sonnet' | 'opus' | 'haiku';  // Model to use
  tools: string[];              // Default tools for generated agents
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
   * Generate agent content from a skill cluster (preview)
   */
  async generateContent(cluster: SkillCluster): Promise<GeneratedAgent> {
    // Load skill descriptions for the body
    const skillDescriptions = await this.loadSkillDescriptions(cluster.skills);

    const name = this.sanitizeName(cluster.suggestedName);
    const description = cluster.suggestedDescription;

    const content = this.formatAgentMarkdown({
      name,
      description,
      skills: cluster.skills,
      skillDescriptions,
    });

    return {
      name,
      description,
      skills: cluster.skills,
      filePath: path.join(this.config.agentsDir, `${name}.md`),
      content,
    };
  }

  /**
   * Create agent file on disk
   */
  async create(cluster: SkillCluster): Promise<GeneratedAgent> {
    const agent = await this.generateContent(cluster);

    // Check for existing agent with same name
    if (fs.existsSync(agent.filePath)) {
      throw new Error(`Agent '${agent.name}' already exists at ${agent.filePath}`);
    }

    // Ensure directory exists
    fs.mkdirSync(path.dirname(agent.filePath), { recursive: true });

    // Write agent file
    fs.writeFileSync(agent.filePath, agent.content, 'utf8');

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
  }): string {
    const { name, description, skills, skillDescriptions } = opts;

    // Build skill list for body
    const skillList = skills
      .map(s => `- **${s}**: ${skillDescriptions.get(s) || ''}`)
      .join('\n');

    return `---
name: ${name}
description: ${description}
tools: ${this.config.tools.join(', ')}
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
   * Check if an agent name is available
   */
  isNameAvailable(name: string): boolean {
    const filePath = path.join(this.config.agentsDir, `${name}.md`);
    return !fs.existsSync(filePath);
  }
}
