/**
 * Bridge Integration Test — End-to-End Workflow
 *
 * Tests the complete skill-creator → wasteland bridge functionality
 * without complex mocking, focusing on core logic.
 */

import { describe, it, expect } from 'vitest';
import { convertToWastelandRole, validateWastelandRole } from '../agent-role-converter.js';
import type { GeneratedAgent } from '../../../services/agents/agent-generator.js';

describe('Skill-Creator → Wasteland Bridge Integration', () => {
  const sampleAgent: GeneratedAgent = {
    name: 'typescript-tester',
    description: 'Specialized agent for TypeScript testing and code review',
    skills: ['typescript-patterns', 'test-generator', 'code-review'],
    filePath: '/test/agent.md',
    content: '---\nname: typescript-tester\ntools: Read, Write, Bash, Grep\nmodel: sonnet\n---\n\nSpecialized agent for TypeScript testing and code review'
  };

  it('completes full conversion workflow', () => {
    // Step 1: Convert skill-creator agent to wasteland role
    const wastelandRole = convertToWastelandRole(sampleAgent);

    // Step 2: Validate the conversion
    const validation = validateWastelandRole(wastelandRole);

    // Assertions
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Check frontmatter format
    expect(wastelandRole.frontmatter.name).toBe('typescript-tester');
    expect(wastelandRole.frontmatter.tools).toEqual([
      'Read',
      'Write',
      'Bash',
      'Grep'
    ]);
    expect(wastelandRole.frontmatter.model).toBe('sonnet');

    // Check required wasteland sections exist
    expect(wastelandRole.content).toContain('## Position');
    expect(wastelandRole.content).toContain('## Voice');
    expect(wastelandRole.content).toContain('## Responsibilities');
    expect(wastelandRole.content).toContain('## Protocol');
    expect(wastelandRole.content).toContain('## Skills Background');

    // Check skill mapping
    expect(wastelandRole.content).toContain('- **typescript-patterns**');
    expect(wastelandRole.content).toContain('- **test-generator**');
    expect(wastelandRole.content).toContain('- **code-review**');

    // Check voice profile (specialist for 3 skills)
    expect(wastelandRole.content).toContain('focused-analytical');
    expect(wastelandRole.content).toContain('applying specialized knowledge');
  });

  it('handles different skill counts appropriately', () => {
    // Test generalist profile for many skills
    const generalistAgent: GeneratedAgent = {
      name: 'multi-domain-agent',
      description: 'Multi-domain specialist',
      skills: ['typescript-patterns', 'python-patterns', 'sql-patterns', 'api-design', 'monitoring'],
      filePath: '/test/agent.md',
      content: 'test content'
    };

    const role = convertToWastelandRole(generalistAgent);

    expect(role.content).toContain('adaptable-helpful');
    expect(role.content).toContain('bridging domains');
  });

  it('generates valid vocabulary from skills', () => {
    const role = convertToWastelandRole(sampleAgent);

    // Should extract words from hyphenated skill names
    expect(role.content).toContain('typescript, patterns, test, generator, code, review');
  });

  it('maintains format compatibility with campfire specification', () => {
    const role = convertToWastelandRole(sampleAgent);

    // Should match the format from campfire documentation
    expect(role.content).toMatch(/^---\n/);  // YAML frontmatter
    expect(role.content).toContain('tools:\n  -');  // Array format
    expect(role.content).toContain('## Composable With');  // Required section

    // Should have proper title formatting
    expect(role.content).toContain('# Typescript Tester');
  });

  it('validates against wasteland standards', () => {
    const role = convertToWastelandRole(sampleAgent);
    const validation = validateWastelandRole(role);

    // Core validation
    expect(validation.valid).toBe(true);

    // Should have minimal warnings for a well-formed conversion
    expect(validation.warnings.length).toBeLessThanOrEqual(1); // Allow some flexibility

    // Should not have any blocking errors
    expect(validation.errors).toHaveLength(0);
  });
});
