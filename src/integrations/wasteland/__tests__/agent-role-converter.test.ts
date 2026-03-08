/**
 * Agent Role Converter — Test Suite
 */

import { describe, it, expect } from 'vitest';
import {
  convertToWastelandRole,
  convertFromWastelandRole,
  validateWastelandRole,
  serializeWastelandRole,
  type WastelandRoleFrontmatter
} from '../agent-role-converter.js';
import type { GeneratedAgent } from '../../../services/agents/agent-generator.js';

describe('Agent Role Converter', () => {
  const sampleSkillCreatorAgent: GeneratedAgent = {
    name: 'test-specialist',
    description: 'A test agent for validation',
    skills: ['typescript-patterns', 'test-generator', 'code-review'],
    filePath: '/path/to/agent.md',
    content: '---\nname: test-specialist\ntools: Read, Write, Bash, Edit\nmodel: sonnet\n---\n\nA test agent for validation'
  };

  describe('convertToWastelandRole', () => {
    it('converts skill-creator agent to wasteland role format', () => {
      const result = convertToWastelandRole(sampleSkillCreatorAgent);

      expect(result.frontmatter.name).toBe('test-specialist');
      expect(result.frontmatter.description).toBe('A test agent for validation');
      expect(result.frontmatter.tools).toEqual(['Read', 'Write', 'Bash', 'Edit']);
      expect(result.frontmatter.model).toBe('sonnet');
    });

    it('generates proper markdown structure with required sections', () => {
      const result = convertToWastelandRole(sampleSkillCreatorAgent);

      expect(result.content).toContain('# Test Specialist');
      expect(result.content).toContain('## Position');
      expect(result.content).toContain('## Voice');
      expect(result.content).toContain('## Vocabulary');
      expect(result.content).toContain('## Responsibilities');
      expect(result.content).toContain('## Protocol');
      expect(result.content).toContain('## Composable With');
      expect(result.content).toContain('## Skills Background');
    });

    it('uses specialist voice for 3 or fewer skills', () => {
      const agent = { ...sampleSkillCreatorAgent, skills: ['skill1', 'skill2'] };
      const result = convertToWastelandRole(agent);

      expect(result.content).toContain('focused-analytical');
      expect(result.content).toContain('applying specialized knowledge');
    });

    it('uses generalist voice for more than 3 skills', () => {
      const agent = {
        ...sampleSkillCreatorAgent,
        skills: ['skill1', 'skill2', 'skill3', 'skill4', 'skill5']
      };
      const result = convertToWastelandRole(agent);

      expect(result.content).toContain('adaptable-helpful');
      expect(result.content).toContain('bridging domains');
    });

    it('generates vocabulary from skill names', () => {
      const agent = {
        ...sampleSkillCreatorAgent,
        skills: ['typescript-patterns', 'test-generator']
      };
      const result = convertToWastelandRole(agent);

      expect(result.content).toContain('typescript, patterns, test, generator');
    });

    it('lists skills in background section', () => {
      const result = convertToWastelandRole(sampleSkillCreatorAgent);

      expect(result.content).toContain('- **typescript-patterns**');
      expect(result.content).toContain('- **test-generator**');
      expect(result.content).toContain('- **code-review**');
    });

    it('falls back to default tools when content has no YAML frontmatter', () => {
      const agent = { ...sampleSkillCreatorAgent, content: 'plain content without frontmatter' };
      const result = convertToWastelandRole(agent);

      expect(result.frontmatter.tools).toEqual(['Read', 'Bash', 'Glob', 'Grep']);
    });

    it('parses tools from content YAML frontmatter', () => {
      const agent = {
        ...sampleSkillCreatorAgent,
        content: '---\nname: custom-agent\ntools: Glob, Grep, Read\nmodel: sonnet\n---\n\nAgent body'
      };
      const result = convertToWastelandRole(agent);

      expect(result.frontmatter.tools).toEqual(['Glob', 'Grep', 'Read']);
    });
  });

  describe('convertFromWastelandRole', () => {
    it('converts wasteland role back to skill-creator format', () => {
      const frontmatter: WastelandRoleFrontmatter = {
        name: 'test-agent',
        description: 'Test agent description',
        tools: ['Read', 'Write', 'Bash'],
        model: 'sonnet'
      };

      const bodyText = `
# Test Agent

## Skills Background

- **typescript-patterns**
- **code-review**
      `;

      const result = convertFromWastelandRole(frontmatter, bodyText);

      expect(result.name).toBe('test-agent');
      expect(result.description).toBe('Test agent description');
      expect(result.tools).toBe('Read, Write, Bash');
      expect(result.model).toBe('sonnet');
      expect(result.skills).toEqual(['typescript-patterns', 'code-review']);
    });

    it('handles missing skills section gracefully', () => {
      const frontmatter: WastelandRoleFrontmatter = {
        name: 'test-agent',
        description: 'Test agent description',
        tools: ['Read'],
        model: 'sonnet'
      };

      const bodyText = '# Test Agent\n\nNo skills section here.';
      const result = convertFromWastelandRole(frontmatter, bodyText);

      expect(result.skills).toEqual([]);
    });
  });

  describe('validateWastelandRole', () => {
    it('validates correct wasteland role format', () => {
      const role = convertToWastelandRole(sampleSkillCreatorAgent);
      const result = validateWastelandRole(role);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects missing required fields', () => {
      const invalidRole = {
        frontmatter: {
          name: '',  // missing name
          description: 'desc',
          tools: ['Read'],
          model: 'sonnet'
        } as WastelandRoleFrontmatter,
        content: '# Test'
      };

      const result = validateWastelandRole(invalidRole);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: name');
    });

    it('detects invalid tools format', () => {
      const invalidRole = {
        frontmatter: {
          name: 'test',
          description: 'desc',
          tools: 'Read, Write' as any,  // should be array, not string
          model: 'sonnet'
        } as WastelandRoleFrontmatter,
        content: '# Test'
      };

      const result = validateWastelandRole(invalidRole);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('tools must be an array');
    });

    it('warns about missing recommended sections', () => {
      const roleWithoutSections = {
        frontmatter: {
          name: 'test',
          description: 'desc',
          tools: ['Read'],
          model: 'sonnet'
        } as WastelandRoleFrontmatter,
        content: '# Test\n\nBasic content without sections.'
      };

      const result = validateWastelandRole(roleWithoutSections);

      expect(result.valid).toBe(true);  // still valid, just warnings
      expect(result.warnings).toContain('Missing Voice section (recommended)');
      expect(result.warnings).toContain('Missing Responsibilities section (recommended)');
      expect(result.warnings).toContain('Missing Protocol section (recommended)');
    });
  });

  describe('serializeWastelandRole', () => {
    it('serializes role to markdown content', () => {
      const role = convertToWastelandRole(sampleSkillCreatorAgent);
      const serialized = serializeWastelandRole(role);

      expect(serialized).toBe(role.content);
      expect(serialized).toContain('---\nname: test-specialist');
      expect(serialized).toContain('# Test Specialist');
    });
  });
});
