import { describe, it, expect } from 'vitest';
import {
  AgentFrontmatterSchema,
  validateToolName,
  parseToolsString,
  validateToolsField,
  validateAgentFrontmatter,
  suggestToolCorrection,
} from './agent-validation.js';
import { KNOWN_TOOLS } from '../types/agent.js';

// ============================================================================
// AgentFrontmatterSchema Tests
// ============================================================================

describe('AgentFrontmatterSchema', () => {
  describe('valid agents', () => {
    it('should accept minimal agent with name and description only', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'code-reviewer',
        description: 'Reviews code for quality and best practices',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('code-reviewer');
        expect(result.data.description).toBe('Reviews code for quality and best practices');
      }
    });

    it('should accept full agent with all fields', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'full-agent',
        description: 'Expert code reviewer for TypeScript projects',
        tools: 'Read, Write, Bash, Glob, Grep',
        disallowedTools: 'WebFetch',
        model: 'sonnet',
        permissionMode: 'default',
        skills: ['typescript-linting', 'code-style'],
        color: 'blue',
        hooks: { onStart: { command: 'echo hello' } },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('full-agent');
        expect(result.data.tools).toBe('Read, Write, Bash, Glob, Grep');
        expect(result.data.model).toBe('sonnet');
        expect(result.data.permissionMode).toBe('default');
        expect(result.data.skills).toEqual(['typescript-linting', 'code-style']);
      }
    });

    it('should preserve unknown fields for forward compatibility', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'future-agent',
        description: 'Agent with future fields',
        futureField: 'some-value',
        anotherNew: 123,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).futureField).toBe('some-value');
        expect((result.data as Record<string, unknown>).anotherNew).toBe(123);
      }
    });
  });

  describe('required field validation', () => {
    it('should reject missing name', () => {
      const result = AgentFrontmatterSchema.safeParse({
        description: 'A description without a name',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true);
      }
    });

    it('should reject missing description', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'nameless-agent',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('description'))).toBe(true);
      }
    });

    it('should reject empty name', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: '',
        description: 'A description',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty description', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'my-agent',
        description: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('name format validation', () => {
    it('should reject uppercase letters in name', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'MyAgent',
        description: 'Agent with uppercase',
      });
      expect(result.success).toBe(false);
    });

    it('should reject special characters in name', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'my_agent',
        description: 'Agent with underscore',
      });
      expect(result.success).toBe(false);
    });

    it('should reject spaces in name', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'my agent',
        description: 'Agent with space',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid name patterns', () => {
      const validNames = ['a', 'agent', 'my-agent', 'agent-v2', 'code-reviewer-123'];
      for (const name of validNames) {
        const result = AgentFrontmatterSchema.safeParse({
          name,
          description: 'Valid agent',
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('optional field validation', () => {
    it('should reject invalid model value', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'test-agent',
        description: 'Test agent',
        model: 'gpt-4', // Invalid - not in MODEL_ALIASES
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid model values', () => {
      const validModels = ['sonnet', 'opus', 'haiku', 'inherit'];
      for (const model of validModels) {
        const result = AgentFrontmatterSchema.safeParse({
          name: 'test-agent',
          description: 'Test agent',
          model,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid permissionMode value', () => {
      const result = AgentFrontmatterSchema.safeParse({
        name: 'test-agent',
        description: 'Test agent',
        permissionMode: 'sudoMode',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid permissionMode values', () => {
      const validModes = ['default', 'acceptEdits', 'dontAsk', 'bypassPermissions', 'plan'];
      for (const mode of validModes) {
        const result = AgentFrontmatterSchema.safeParse({
          name: 'test-agent',
          description: 'Test agent',
          permissionMode: mode,
        });
        expect(result.success).toBe(true);
      }
    });
  });
});

// ============================================================================
// validateToolName Tests
// ============================================================================

describe('validateToolName', () => {
  describe('known tools', () => {
    it('should return valid for exact match', () => {
      const result = validateToolName('Read');
      expect(result.valid).toBe(true);
      expect(result.corrected).toBeUndefined();
    });

    it('should return corrected casing for wrong case', () => {
      const result = validateToolName('read');
      expect(result.valid).toBe(true);
      expect(result.corrected).toBe('Read');
    });

    it('should return corrected casing for "BASH"', () => {
      const result = validateToolName('BASH');
      expect(result.valid).toBe(true);
      expect(result.corrected).toBe('Bash');
    });

    it('should return corrected casing for "webfetch"', () => {
      const result = validateToolName('webfetch');
      expect(result.valid).toBe(true);
      expect(result.corrected).toBe('WebFetch');
    });

    it('should handle all known tools', () => {
      for (const tool of KNOWN_TOOLS) {
        const result = validateToolName(tool);
        expect(result.valid).toBe(true);
        expect(result.corrected).toBeUndefined();
      }
    });
  });

  describe('MCP tools', () => {
    it('should accept MCP tool pattern', () => {
      const result = validateToolName('mcp__context7__query-docs');
      expect(result.valid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should accept MCP wildcard pattern', () => {
      const result = validateToolName('mcp__context7__*');
      expect(result.valid).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('should accept MCP tool with underscores', () => {
      const result = validateToolName('mcp__my_server__my_tool');
      expect(result.valid).toBe(true);
    });

    it('should accept MCP tool with hyphens', () => {
      const result = validateToolName('mcp__my-server__my-tool');
      expect(result.valid).toBe(true);
    });
  });

  describe('typo suggestions', () => {
    it('should suggest "Bash" for "Bsh"', () => {
      const result = validateToolName('Bsh');
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBe('Bash');
      expect(result.warning).toContain('Did you mean "Bash"');
    });

    it('should suggest "Read" for "Raed"', () => {
      const result = validateToolName('Raed');
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBe('Read');
    });

    it('should suggest "Write" for "Wrtie"', () => {
      const result = validateToolName('Wrtie');
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBe('Write');
    });

    it('should suggest "Grep" for "Gerp"', () => {
      const result = validateToolName('Gerp');
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBe('Grep');
    });
  });

  describe('unknown tools', () => {
    it('should return warning for unknown tool', () => {
      const result = validateToolName('CustomTool');
      expect(result.valid).toBe(false);
      expect(result.warning).toContain('Unknown tool');
      expect(result.warning).toContain('CustomTool');
    });

    it('should not suggest for very different names', () => {
      const result = validateToolName('CompletelyUnknown');
      expect(result.valid).toBe(false);
      expect(result.suggestion).toBeUndefined();
    });
  });
});

// ============================================================================
// parseToolsString Tests
// ============================================================================

describe('parseToolsString', () => {
  it('should parse comma-separated tools', () => {
    const result = parseToolsString('Read, Write, Bash');
    expect(result).toEqual(['Read', 'Write', 'Bash']);
  });

  it('should handle extra whitespace', () => {
    const result = parseToolsString('  Read  ,   Write  ,  Bash  ');
    expect(result).toEqual(['Read', 'Write', 'Bash']);
  });

  it('should handle no whitespace', () => {
    const result = parseToolsString('Read,Write,Bash');
    expect(result).toEqual(['Read', 'Write', 'Bash']);
  });

  it('should filter empty strings', () => {
    const result = parseToolsString('Read, , Write, , Bash');
    expect(result).toEqual(['Read', 'Write', 'Bash']);
  });

  it('should handle single tool', () => {
    const result = parseToolsString('Read');
    expect(result).toEqual(['Read']);
  });

  it('should handle empty string', () => {
    const result = parseToolsString('');
    expect(result).toEqual([]);
  });

  it('should handle whitespace-only string', () => {
    const result = parseToolsString('   ');
    expect(result).toEqual([]);
  });
});

// ============================================================================
// validateToolsField Tests
// ============================================================================

describe('validateToolsField', () => {
  it('should validate correct tools string', () => {
    const result = validateToolsField('Read, Write, Bash');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.corrected).toBeUndefined();
  });

  it('should correct wrong casing', () => {
    const result = validateToolsField('read, write, bash');
    expect(result.valid).toBe(true);
    expect(result.corrected).toBe('Read, Write, Bash');
  });

  it('should collect warnings for unknown tools', () => {
    const result = validateToolsField('Read, CustomTool, Write');
    expect(result.valid).toBe(true); // Unknown tools don't block
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Unknown tool');
  });

  it('should preserve MCP tools', () => {
    const result = validateToolsField('Read, Write, mcp__context7__query-docs');
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('should handle mixed valid/invalid tools', () => {
    const result = validateToolsField('Read, Bsh, Write, CustomTool');
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBe(2); // Bsh suggestion + CustomTool unknown
    // Should suggest corrections for typos
    expect(result.corrected).toBe('Read, Bash, Write, CustomTool');
  });
});

// ============================================================================
// validateAgentFrontmatter Tests
// ============================================================================

describe('validateAgentFrontmatter', () => {
  describe('valid agents', () => {
    it('should return success for valid minimal agent', () => {
      const result = validateAgentFrontmatter({
        name: 'code-reviewer',
        description: 'Reviews code for quality',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('code-reviewer');
    });

    it('should return success for valid agent with tools', () => {
      const result = validateAgentFrontmatter({
        name: 'code-reviewer',
        description: 'Reviews code for quality',
        tools: 'Read, Grep, Glob',
      });
      expect(result.valid).toBe(true);
      expect(result.data?.tools).toBe('Read, Grep, Glob');
    });
  });

  describe('schema errors', () => {
    it('should report missing name', () => {
      const result = validateAgentFrontmatter({
        description: 'No name agent',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('should report invalid name format', () => {
      const result = validateAgentFrontmatter({
        name: 'Invalid Name',
        description: 'Agent with invalid name',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('should report invalid model', () => {
      const result = validateAgentFrontmatter({
        name: 'test-agent',
        description: 'Test agent',
        model: 'invalid-model',
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('tools validation', () => {
    it('should include warnings for unknown tools', () => {
      const result = validateAgentFrontmatter({
        name: 'test-agent',
        description: 'Test agent',
        tools: 'Read, UnknownTool, Write',
      });
      expect(result.valid).toBe(true); // Valid schema
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('Unknown tool'))).toBe(true);
    });

    it('should suggest corrections for typos', () => {
      const result = validateAgentFrontmatter({
        name: 'test-agent',
        description: 'Test agent',
        tools: 'read, write, bsh',
      });
      expect(result.valid).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toContain('Read, Write, Bash');
    });

    it('should validate disallowedTools field', () => {
      const result = validateAgentFrontmatter({
        name: 'test-agent',
        description: 'Test agent',
        disallowedTools: 'webfetch, websearch',
      });
      expect(result.valid).toBe(true);
      expect(result.suggestions.some((s) => s.includes('WebFetch, WebSearch'))).toBe(true);
    });
  });

  describe('integration', () => {
    it('should handle complete agent with all validations', () => {
      const result = validateAgentFrontmatter({
        name: 'full-test-agent',
        description: 'Full test agent for integration',
        tools: 'Read, Write, Bash, Glob, Grep, mcp__context7__*',
        model: 'sonnet',
        permissionMode: 'default',
        skills: ['typescript', 'testing'],
        color: 'green',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.data).toBeDefined();
    });
  });
});

// ============================================================================
// suggestToolCorrection Tests
// ============================================================================

describe('suggestToolCorrection', () => {
  it('should return corrected casing for case mismatch', () => {
    expect(suggestToolCorrection('read')).toBe('Read');
    expect(suggestToolCorrection('WRITE')).toBe('Write');
    expect(suggestToolCorrection('bash')).toBe('Bash');
  });

  it('should return null for exact match', () => {
    expect(suggestToolCorrection('Read')).toBeNull();
    expect(suggestToolCorrection('Write')).toBeNull();
    expect(suggestToolCorrection('Bash')).toBeNull();
  });

  it('should return null for MCP tools', () => {
    expect(suggestToolCorrection('mcp__server__tool')).toBeNull();
    expect(suggestToolCorrection('mcp__context7__*')).toBeNull();
  });

  it('should suggest for typos', () => {
    expect(suggestToolCorrection('Bsh')).toBe('Bash');
    expect(suggestToolCorrection('Raed')).toBe('Read');
    expect(suggestToolCorrection('Gerp')).toBe('Grep');
  });

  it('should return null for unknown tools without close match', () => {
    expect(suggestToolCorrection('CompletelyUnknownTool')).toBeNull();
    expect(suggestToolCorrection('xyz')).toBeNull();
  });
});
