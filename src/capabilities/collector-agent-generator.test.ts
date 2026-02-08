import { describe, it, expect } from 'vitest';
import {
  CollectorAgentGenerator,
  COLLECTOR_TOOLS,
  type CollectorAgentConfig,
} from './collector-agent-generator.js';
import { validateAgentFrontmatter } from '../validation/agent-validation.js';

// ============================================================================
// Helpers
// ============================================================================

function makeConfig(overrides?: Partial<CollectorAgentConfig>): CollectorAgentConfig {
  return {
    name: 'codebase-scanner',
    description: 'Scan codebase for patterns and report findings',
    purpose: 'Analyzes the codebase structure, identifies patterns, and reports on code organization.',
    gatherInstructions: [
      'Use Glob to find all TypeScript files',
      'Use Grep to identify export patterns',
      'Use Read to examine key configuration files',
    ],
    outputFormat: '## Findings\n- Pattern: [name]\n- Files: [count]\n- Details: [summary]',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('CollectorAgentGenerator', () => {
  const generator = new CollectorAgentGenerator();

  describe('COLLECTOR_TOOLS constant', () => {
    it('contains only read-only tools', () => {
      expect(COLLECTOR_TOOLS).toEqual(['Read', 'Glob', 'Grep', 'WebFetch']);
    });
  });

  describe('generate()', () => {
    it('generates valid agent markdown with YAML frontmatter', () => {
      const result = generator.generate(makeConfig());

      // Must start with frontmatter delimiters
      expect(result.content).toMatch(/^---\n/);
      expect(result.content).toMatch(/\n---\n/);

      // Must contain name and description in frontmatter
      expect(result.content).toContain('name: codebase-scanner');
      expect(result.content).toContain('description:');
    });

    it('tools field contains only read-only tools', () => {
      const result = generator.generate(makeConfig());

      // Extract tools line from frontmatter
      const toolsMatch = result.content.match(/^tools:\s*(.+)$/m);
      expect(toolsMatch).not.toBeNull();
      const toolsStr = toolsMatch![1];

      // Must contain exactly the collector tools
      const tools = toolsStr.split(',').map(t => t.trim());
      expect(tools).toEqual(['Read', 'Glob', 'Grep', 'WebFetch']);
    });

    it('body includes compressed output format section', () => {
      const result = generator.generate(makeConfig());

      expect(result.content).toContain('## Output Format');
      expect(result.content).toContain('structured markdown summary');
      expect(result.content).toContain('bullet points');
      expect(result.content).toContain('500 lines');
      expect(result.content).toContain('code blocks');
    });

    it('body includes gathering instructions as numbered steps', () => {
      const config = makeConfig({
        gatherInstructions: [
          'Step A: find files',
          'Step B: analyze patterns',
          'Step C: summarize',
        ],
      });
      const result = generator.generate(config);

      expect(result.content).toContain('## Gathering Steps');
      expect(result.content).toContain('1. Step A: find files');
      expect(result.content).toContain('2. Step B: analyze patterns');
      expect(result.content).toContain('3. Step C: summarize');
    });

    it('sanitizes name: spaces and special chars to kebab-case', () => {
      const config = makeConfig({ name: 'My Cool  Agent!!!' });
      const result = generator.generate(config);

      expect(result.name).toBe('my-cool-agent');
      expect(result.content).toContain('name: my-cool-agent');
    });

    it('generated content passes validateAgentFrontmatter', () => {
      const result = generator.generate(makeConfig());

      expect(result.valid).toBe(true);
      expect(result.validationErrors).toEqual([]);

      // Also validate independently by parsing frontmatter
      const fmMatch = result.content.match(/^---\n([\s\S]*?)\n---/);
      expect(fmMatch).not.toBeNull();

      // Parse YAML manually for validation
      const lines = fmMatch![1].split('\n');
      const data: Record<string, string> = {};
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          let value = line.slice(colonIdx + 1).trim();
          // Strip surrounding quotes
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          data[key] = value;
        }
      }

      const validation = validateAgentFrontmatter(data);
      expect(validation.valid).toBe(true);
    });

    it('computes filePath as "{outputDir}/{name}.md"', () => {
      const gen = new CollectorAgentGenerator('/custom/agents');
      const result = gen.generate(makeConfig());

      expect(result.filePath).toBe('/custom/agents/codebase-scanner.md');
    });

    it('uses default outputDir ".claude/agents" when not specified', () => {
      const result = generator.generate(makeConfig());

      expect(result.filePath).toBe('.claude/agents/codebase-scanner.md');
    });

    it('includes purpose in agent body', () => {
      const config = makeConfig({
        purpose: 'Identifies all exported functions across the TypeScript codebase.',
      });
      const result = generator.generate(config);

      expect(result.content).toContain(
        'Identifies all exported functions across the TypeScript codebase.'
      );
    });

    it('output format section instructs compressed markdown', () => {
      const result = generator.generate(makeConfig());

      expect(result.content).toContain('headers');
      expect(result.content).toContain('bullet points');
      expect(result.content).toContain('no prose');
    });

    it('no write/execute tools present in generated output', () => {
      const result = generator.generate(makeConfig());

      const writableTools = ['Write', 'Edit', 'Bash', 'Task'];
      for (const tool of writableTools) {
        // Check the tools line in frontmatter specifically
        const toolsMatch = result.content.match(/^tools:\s*(.+)$/m);
        expect(toolsMatch).not.toBeNull();
        const toolsLine = toolsMatch![1];
        const toolsList = toolsLine.split(',').map(t => t.trim());
        expect(toolsList).not.toContain(tool);
      }
    });

    it('appends config outputFormat to the output format section', () => {
      const config = makeConfig({
        outputFormat: '## Report\n- metric: [value]\n- status: [ok/fail]',
      });
      const result = generator.generate(config);

      expect(result.content).toContain('## Report');
      expect(result.content).toContain('- metric: [value]');
    });

    it('truncates sanitized name to 64 chars max', () => {
      const longName = 'a'.repeat(100);
      const config = makeConfig({ name: longName });
      const result = generator.generate(config);

      expect(result.name.length).toBeLessThanOrEqual(64);
    });
  });
});
