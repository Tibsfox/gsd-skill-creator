import { describe, it, expect } from 'vitest';
import {
  SkillCreatorMcpServer,
  SKILL_CREATOR_TOOLS,
  createSkillCreatorMcpServer,
} from './skill-creator-mcp.js';

// ============================================================================
// SKILL_CREATOR_TOOLS
// ============================================================================

describe('SKILL_CREATOR_TOOLS', () => {
  it('returns 8 tools', () => {
    expect(SKILL_CREATOR_TOOLS).toHaveLength(8);
  });

  it('each tool has name, description, and inputSchema', () => {
    for (const tool of SKILL_CREATOR_TOOLS) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
    }
  });

  it('contains all expected tool names', () => {
    const names = SKILL_CREATOR_TOOLS.map((t) => t.name);
    expect(names).toContain('skill.create');
    expect(names).toContain('skill.eval');
    expect(names).toContain('skill.grade');
    expect(names).toContain('skill.compare');
    expect(names).toContain('skill.analyze');
    expect(names).toContain('skill.optimize');
    expect(names).toContain('skill.package');
    expect(names).toContain('skill.benchmark');
  });
});

// ============================================================================
// SkillCreatorMcpServer
// ============================================================================

describe('SkillCreatorMcpServer', () => {
  describe('listTools', () => {
    it('returns SKILL_CREATOR_TOOLS', () => {
      const server = new SkillCreatorMcpServer();
      expect(server.listTools()).toBe(SKILL_CREATOR_TOOLS);
    });
  });

  describe('handleToolCall', () => {
    it('dispatches skill.create correctly', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.create', {
        skillName: 'test-skill',
        description: 'A test skill',
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test-skill');
    });

    it('dispatches skill.eval correctly', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.eval', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
      });
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test-skill');
      expect(result.content[0].text).toContain('gpt-4');
    });

    it('dispatches skill.grade correctly', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.grade', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
      });
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test-skill');
    });

    it('dispatches skill.compare correctly', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.compare', {
        skillName: 'test-skill',
        chips: ['gpt-4', 'llama-7b'],
      });
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test-skill');
    });

    it('dispatches skill.analyze correctly', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.analyze', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
      });
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test-skill');
    });

    it('dispatches skill.optimize correctly', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.optimize', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
      });
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test-skill');
    });

    it('dispatches skill.package correctly', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.package', {
        skillName: 'test-skill',
        version: '1.0.0',
      });
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test-skill');
    });

    it('dispatches skill.benchmark correctly', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.benchmark', {
        skillName: 'test-skill',
        chips: ['gpt-4', 'llama-7b'],
      });
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test-skill');
    });

    it('returns error content for unknown tool', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.nonexistent', {});
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Unknown tool');
      expect(result.content[0].text).toContain('skill.nonexistent');
    });

    it('validates args against inputSchema and returns error for invalid args', async () => {
      const server = new SkillCreatorMcpServer();
      // skill.create requires skillName and description (both strings)
      const result = await server.handleToolCall('skill.create', {
        skillName: 123, // should be string
      });
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text.toLowerCase()).toContain('validation');
    });

    it('response format matches MCP { content: [{ type, text }] }', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.create', {
        skillName: 'test',
        description: 'test desc',
      });
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type');
      expect(result.content[0]).toHaveProperty('text');
      expect(typeof result.content[0].text).toBe('string');
    });

    it('skill.create accepts optional template parameter', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.create', {
        skillName: 'test-skill',
        description: 'A test skill',
        template: 'basic',
      });
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test-skill');
    });

    it('skill.eval accepts optional testCases parameter', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.eval', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
        testCases: 10,
      });
      expect(result.content[0].type).toBe('text');
    });

    it('skill.grade accepts optional graderChip parameter', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.grade', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
        graderChip: 'claude-3-opus',
      });
      expect(result.content[0].type).toBe('text');
    });

    it('skill.optimize accepts optional targetPassRate parameter', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.optimize', {
        skillName: 'test-skill',
        chipName: 'gpt-4',
        targetPassRate: 0.9,
      });
      expect(result.content[0].type).toBe('text');
    });

    it('skill.package accepts optional description parameter', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.package', {
        skillName: 'test-skill',
        version: '2.0.0',
        description: 'Updated skill',
      });
      expect(result.content[0].type).toBe('text');
    });

    it('skill.benchmark accepts optional iterations parameter', async () => {
      const server = new SkillCreatorMcpServer();
      const result = await server.handleToolCall('skill.benchmark', {
        skillName: 'test-skill',
        chips: ['gpt-4'],
        iterations: 5,
      });
      expect(result.content[0].type).toBe('text');
    });
  });
});

// ============================================================================
// createSkillCreatorMcpServer
// ============================================================================

describe('createSkillCreatorMcpServer', () => {
  it('returns a SkillCreatorMcpServer instance', () => {
    const server = createSkillCreatorMcpServer();
    expect(server).toBeInstanceOf(SkillCreatorMcpServer);
  });

  it('returned server has working listTools', () => {
    const server = createSkillCreatorMcpServer();
    expect(server.listTools()).toHaveLength(8);
  });

  it('returned server has working handleToolCall', async () => {
    const server = createSkillCreatorMcpServer();
    const result = await server.handleToolCall('skill.create', {
      skillName: 'factory-test',
      description: 'From factory',
    });
    expect(result.content[0].text).toContain('factory-test');
  });
});
