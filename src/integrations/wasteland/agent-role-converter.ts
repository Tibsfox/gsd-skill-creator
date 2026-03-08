/**
 * Agent Role Converter — Skill-Creator ↔ Wasteland Format Bridge
 *
 * Converts between skill-creator agent format and wasteland role format
 * to enable seamless federation participation.
 *
 * SKILL-CREATOR FORMAT:
 * ```yaml
 * name: agent-name
 * description: Agent description
 * tools: Tool1, Tool2, Tool3  # comma-separated string
 * model: sonnet
 * skills:
 *   - skill-1
 *   - skill-2
 * ```
 *
 * WASTELAND ROLE FORMAT:
 * ```yaml
 * name: agent-name
 * description: >
 *   Agent description
 * tools:  # array format
 *   - Tool1
 *   - Tool2
 * model: sonnet
 * # Note: no skills field in wasteland format
 * ```
 *
 * @module agent-role-converter
 */

import type { AgentFrontmatter } from '../../core/types/agent.js';
import type { GeneratedAgent } from '../../services/agents/agent-generator.js';

// Types for wasteland role format
export interface WastelandRoleFrontmatter {
  name: string;
  description: string;
  tools: string[];  // array, not comma-separated string
  model: string;
  // Note: wasteland doesn't use skills field
}

export interface WastelandRoleFile {
  frontmatter: WastelandRoleFrontmatter;
  content: string;  // full markdown content
}

// Default tools when none can be parsed from agent content
const DEFAULT_TOOLS = ['Read', 'Bash', 'Glob', 'Grep'];

/**
 * Parse actual tool names from agent content YAML frontmatter.
 *
 * Looks for a `tools:` line in YAML frontmatter (between --- markers)
 * which contains a comma-separated string of tool names.
 * Returns null if no tools can be parsed.
 */
function parseToolsFromContent(content: string): string[] | null {
  // Match YAML frontmatter block
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatterBlock = frontmatterMatch[1];

  // Match the tools line — comma-separated string format: "tools: Read, Write, Bash"
  const toolsMatch = frontmatterBlock.match(/^tools:\s*(.+)$/m);
  if (!toolsMatch) return null;

  const toolsString = toolsMatch[1].trim();
  if (!toolsString) return null;

  return toolsString.split(',').map(t => t.trim()).filter(Boolean);
}

// Default voice profiles for converted agents
const DEFAULT_VOICE_PROFILES = {
  specialist: {
    tone: 'focused-analytical',
    style: 'systematic',
    signature: 'applying specialized knowledge'
  },
  generalist: {
    tone: 'adaptable-helpful',
    style: 'collaborative',
    signature: 'bridging domains'
  }
} as const;

/**
 * Convert skill-creator agent format to wasteland role format.
 */
export function convertToWastelandRole(agent: GeneratedAgent): WastelandRoleFile {
  // Parse actual tools from agent content frontmatter, falling back to defaults
  const toolsArray = parseToolsFromContent(agent.content) ?? DEFAULT_TOOLS;

  // Determine voice profile based on skill count
  const voiceProfile = agent.skills.length > 3
    ? DEFAULT_VOICE_PROFILES.generalist
    : DEFAULT_VOICE_PROFILES.specialist;

  const frontmatter: WastelandRoleFrontmatter = {
    name: agent.name,
    description: agent.description,
    tools: toolsArray,
    model: 'sonnet' // default for wasteland
  };

  // Generate wasteland-compatible markdown body
  const content = generateWastelandBody({
    name: agent.name,
    description: agent.description,
    skills: agent.skills,
    tools: toolsArray,
    voiceProfile
  });

  return {
    frontmatter,
    content
  };
}

/**
 * Generate wasteland role body with required sections.
 */
function generateWastelandBody(opts: {
  name: string;
  description: string;
  skills: string[];
  tools: string[];
  voiceProfile: typeof DEFAULT_VOICE_PROFILES[keyof typeof DEFAULT_VOICE_PROFILES];
}): string {
  const { name, description, skills, tools, voiceProfile } = opts;

  // Generate vocabulary from skill names
  const vocabulary = skills
    .flatMap(skill => skill.toLowerCase().split(/[-_]/))
    .filter((word, idx, arr) => arr.indexOf(word) === idx) // dedupe
    .join(', ');

  return `---
name: ${name}
description: >
  ${description}
tools:
${tools.map(tool => `  - ${tool}`).join('\n')}
model: sonnet
---

# ${name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

${description}

## Position

Federation specialist agent. Coordinates across multiple skill domains.

## Voice

- **Tone:** ${voiceProfile.tone}
- **Style:** ${voiceProfile.style}
- **Signature:** "${voiceProfile.signature}"

## Vocabulary

${vocabulary}

## Responsibilities

1. **Execute** — Apply combined skill knowledge to complete tasks
2. **Coordinate** — Bridge between different domain areas
3. **Adapt** — Adjust approach based on task requirements
4. **Document** — Record outcomes and learnings

## Protocol

When invoked:

1. Analyze the task requirements across skill domains
2. Apply relevant knowledge from trained skills
3. Execute with systematic approach
4. Document results and insights

## Composable With

federation-agents, domain-specialists, coordination-agents

## Skills Background

This agent was generated from skill-creator with the following capabilities:
${skills.map(skill => `- **${skill}**`).join('\n')}
`;
}

/**
 * Convert wasteland role back to skill-creator format (for roundtrip conversion).
 */
export function convertFromWastelandRole(
  frontmatter: WastelandRoleFrontmatter,
  bodyText: string
): Partial<AgentFrontmatter> {
  // Extract skills from body if mentioned
  const skillsSection = bodyText.match(/Skills Background[\s\S]*?(?=##|$)/)?.[0];
  const skills: string[] = [];
  if (skillsSection) {
    const skillMatches = skillsSection.match(/- \*\*(.*?)\*\*/g);
    if (skillMatches) {
      skills.push(...skillMatches.map(m => m.match(/\*\*(.*?)\*\*/)?.[1]).filter(Boolean) as string[]);
    }
  }

  return {
    name: frontmatter.name,
    description: frontmatter.description,
    tools: frontmatter.tools.join(', '), // skill-creator expects comma-separated string
    model: frontmatter.model as AgentFrontmatter['model'],
    skills
  };
}

/**
 * Validate wasteland role format compliance.
 */
export function validateWastelandRole(role: WastelandRoleFile): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required frontmatter fields
  if (!role.frontmatter.name) errors.push('Missing required field: name');
  if (!role.frontmatter.description) errors.push('Missing required field: description');
  if (!Array.isArray(role.frontmatter.tools)) errors.push('tools must be an array');
  if (!role.frontmatter.model) errors.push('Missing required field: model');

  // Required content sections
  const content = role.content;
  if (!content.includes('## Voice')) warnings.push('Missing Voice section (recommended)');
  if (!content.includes('## Responsibilities')) warnings.push('Missing Responsibilities section (recommended)');
  if (!content.includes('## Protocol')) warnings.push('Missing Protocol section (recommended)');

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Serialize wasteland role to markdown file content.
 */
export function serializeWastelandRole(role: WastelandRoleFile): string {
  return role.content;
}
