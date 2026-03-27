import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  AgentGenerator,
  GeneratedAgent,
  DEFAULT_AGENT_GENERATOR_CONFIG,
  USER_AGENT_BUG_WARNING,
} from './agent-generator.js';
import { SkillCluster } from './cluster-detector.js';
import { SkillStore } from '../storage/skill-store.js';
import { PathTraversalError } from '../validation/path-safety.js';

describe('AgentGenerator', () => {
  let tempDir: string;
  let skillStore: SkillStore;

  function createCluster(opts?: Partial<SkillCluster>): SkillCluster {
    return {
      id: opts?.id ?? 'cluster-test',
      skills: opts?.skills ?? ['skill-a', 'skill-b'],
      coActivationScore: opts?.coActivationScore ?? 0.8,
      stabilityDays: opts?.stabilityDays ?? 14,
      suggestedName: opts?.suggestedName ?? 'test-agent',
      suggestedDescription: opts?.suggestedDescription ?? 'A test agent description',
    };
  }

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-generator-test-'));
    const skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    skillStore = new SkillStore(skillsDir);

    // Create test skills
    await skillStore.create('skill-a', {
      name: 'skill-a',
      description: 'First test skill',
      triggers: { intents: [], files: [], contexts: [], threshold: 0.5 },
      enabled: true,
    }, 'Skill A body content');

    await skillStore.create('skill-b', {
      name: 'skill-b',
      description: 'Second test skill',
      triggers: { intents: [], files: [], contexts: [], threshold: 0.5 },
      enabled: true,
    }, 'Skill B body content');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('generateContent', () => {
    it('returns valid markdown with frontmatter', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster();

      const result = await generator.generateContent(cluster);

      expect(result.content).toContain('---');
      expect(result.content).toContain('name: test-agent');
      expect(result.content).toContain('description:');
    });

    it('includes skills in frontmatter and body', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ skills: ['skill-a', 'skill-b'] });

      const result = await generator.generateContent(cluster);

      // Frontmatter
      expect(result.content).toContain('skills:');
      expect(result.content).toContain('  - skill-a');
      expect(result.content).toContain('  - skill-b');

      // Body
      expect(result.content).toContain('### skill-a');
      expect(result.content).toContain('### skill-b');
    });

    it('loads skill descriptions from store', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster();

      const result = await generator.generateContent(cluster);

      expect(result.content).toContain('First test skill');
      expect(result.content).toContain('Second test skill');
    });

    it('includes model and tools in frontmatter', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, {
        agentsDir,
        model: 'sonnet',
        tools: ['Read', 'Bash'],
      });
      const cluster = createCluster();

      const result = await generator.generateContent(cluster);

      expect(result.content).toContain('model: sonnet');
      expect(result.content).toContain('tools: Read, Bash');
    });

    it('sets correct filePath', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedName: 'my-agent' });

      const result = await generator.generateContent(cluster);

      expect(result.filePath).toBe(path.join(agentsDir, 'my-agent.md'));
    });
  });

  describe('create', () => {
    it('writes agent file to disk', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster();

      const result = await generator.create(cluster);

      expect(fs.existsSync(result.filePath)).toBe(true);
      const content = fs.readFileSync(result.filePath, 'utf8');
      expect(content).toContain('name: test-agent');
    });

    it('creates agents directory if it does not exist', async () => {
      const agentsDir = path.join(tempDir, 'nested', 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster();

      await generator.create(cluster);

      expect(fs.existsSync(agentsDir)).toBe(true);
    });

    it('throws error if agent already exists', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      fs.mkdirSync(agentsDir, { recursive: true });
      fs.writeFileSync(path.join(agentsDir, 'test-agent.md'), 'existing');

      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedName: 'test-agent' });

      await expect(generator.create(cluster)).rejects.toThrow(
        "Agent 'test-agent' already exists"
      );
    });
  });

  describe('sanitizeName', () => {
    it('converts to lowercase', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedName: 'Test-Agent' });

      const result = await generator.generateContent(cluster);

      expect(result.name).toBe('test-agent');
    });

    it('replaces invalid characters with hyphens', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedName: 'test_agent@v1' });

      const result = await generator.generateContent(cluster);

      expect(result.name).toBe('test-agent-v1');
    });

    it('collapses multiple hyphens', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedName: 'test---agent' });

      const result = await generator.generateContent(cluster);

      expect(result.name).toBe('test-agent');
    });

    it('removes leading and trailing hyphens', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedName: '-test-agent-' });

      const result = await generator.generateContent(cluster);

      expect(result.name).toBe('test-agent');
    });

    it('truncates long names', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const longName = 'a'.repeat(100);
      const cluster = createCluster({ suggestedName: longName });

      const result = await generator.generateContent(cluster);

      expect(result.name.length).toBeLessThanOrEqual(64);
    });
  });

  describe('isNameAvailable', () => {
    it('returns true for available name', () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });

      expect(generator.isNameAvailable('new-agent')).toBe(true);
    });

    it('returns false for existing agent', () => {
      const agentsDir = path.join(tempDir, 'agents');
      fs.mkdirSync(agentsDir, { recursive: true });
      fs.writeFileSync(path.join(agentsDir, 'existing.md'), 'content');

      const generator = new AgentGenerator(skillStore, { agentsDir });

      expect(generator.isNameAvailable('existing')).toBe(false);
    });
  });

  describe('config defaults', () => {
    it('uses DEFAULT_AGENT_GENERATOR_CONFIG values', () => {
      expect(DEFAULT_AGENT_GENERATOR_CONFIG.agentsDir).toBe('.claude/agents');
      expect(DEFAULT_AGENT_GENERATOR_CONFIG.model).toBe('inherit');
      expect(DEFAULT_AGENT_GENERATOR_CONFIG.tools).toContain('Read');
      expect(DEFAULT_AGENT_GENERATOR_CONFIG.tools).toContain('Write');
    });
  });

  describe('missing skills', () => {
    it('handles missing skill descriptions gracefully', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ skills: ['skill-a', 'nonexistent-skill'] });

      const result = await generator.generateContent(cluster);

      expect(result.content).toContain('skill-a');
      expect(result.content).toContain('nonexistent-skill');
      expect(result.content).toContain('(description not available)');
    });
  });

  describe('validation', () => {
    it('generated agent passes schema validation', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster();

      // Should not throw - validates internally
      const result = await generator.generateContent(cluster);

      expect(result.name).toBe('test-agent');
      expect(result.description).toBeTruthy();
    });

    it('tools field uses comma-separated format (not array)', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, {
        agentsDir,
        tools: ['Read', 'Write', 'Bash'],
      });
      const cluster = createCluster();

      const result = await generator.generateContent(cluster);

      // Should be comma-separated string, not YAML array
      expect(result.content).toContain('tools: Read, Write, Bash');
      expect(result.content).not.toMatch(/tools:\n\s+-\s+Read/);
    });

    it('invalid tool names are corrected automatically', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      // Use lowercase 'read' instead of 'Read'
      const generator = new AgentGenerator(skillStore, {
        agentsDir,
        tools: ['read', 'write', 'bash'],
      });
      const cluster = createCluster();

      const result = await generator.generateContent(cluster);

      // Should be corrected to proper PascalCase
      expect(result.content).toContain('tools: Read, Write, Bash');
    });

    it('unknown tools generate warning but do not fail', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      // Include an unknown tool
      const generator = new AgentGenerator(skillStore, {
        agentsDir,
        tools: ['Read', 'UnknownCustomTool'],
      });
      const cluster = createCluster();

      // Should not throw - unknown tools are accepted with warning
      const result = await generator.generateContent(cluster);

      expect(result.content).toContain('Read');
      expect(result.content).toContain('UnknownCustomTool');
    });

    it('MCP tools are preserved in output', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, {
        agentsDir,
        tools: ['Read', 'mcp__context7__query-docs'],
      });
      const cluster = createCluster();

      const result = await generator.generateContent(cluster);

      expect(result.content).toContain('mcp__context7__query-docs');
    });
  });

  describe('bug warning', () => {
    it('user-level scope includes warning in result', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, {
        agentsDir,
        scope: 'user',
      });
      const cluster = createCluster();

      const result = await generator.create(cluster);

      expect(result.warning).toBe(USER_AGENT_BUG_WARNING);
    });

    it('project-level scope has no warning', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, {
        agentsDir,
        scope: 'project',
      });
      const cluster = createCluster();

      const result = await generator.create(cluster);

      expect(result.warning).toBeUndefined();
    });

    it('warning message mentions bug #11205', () => {
      expect(USER_AGENT_BUG_WARNING).toContain('#11205');
      expect(USER_AGENT_BUG_WARNING).toContain('GitHub issue');
    });

    it('no scope specified has no warning (default)', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster();

      const result = await generator.create(cluster);

      expect(result.warning).toBeUndefined();
    });
  });

  describe('validation errors', () => {
    it('creating agent with empty name throws', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedName: '' });

      await expect(generator.generateContent(cluster)).rejects.toThrow(
        /validation failed/i
      );
    });

    it('creating agent with empty description throws', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedDescription: '' });

      await expect(generator.generateContent(cluster)).rejects.toThrow(
        /validation failed/i
      );
    });
  });

  // --------------------------------------------------------------------------
  // Path traversal protection
  // --------------------------------------------------------------------------

  describe('path traversal protection', () => {
    it('isNameAvailable rejects parent traversal name', () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });

      expect(() => generator.isNameAvailable('../../../etc')).toThrow(
        PathTraversalError,
      );
    });

    it('isNameAvailable rejects name with forward slash', () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });

      expect(() => generator.isNameAvailable('foo/bar')).toThrow(
        PathTraversalError,
      );
    });

    it('isNameAvailable rejects name with null byte', () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });

      expect(() => generator.isNameAvailable('foo\x00bar')).toThrow(
        PathTraversalError,
      );
    });

    it('isNameAvailable works for valid name (no regression)', () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });

      expect(generator.isNameAvailable('valid-agent')).toBe(true);
    });

    it('create with sanitized cluster name still works (no regression)', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedName: 'safe-agent' });

      const result = await generator.create(cluster);

      expect(fs.existsSync(result.filePath)).toBe(true);
    });

    it('generateContent asserts safe path on output', async () => {
      const agentsDir = path.join(tempDir, 'agents');
      const generator = new AgentGenerator(skillStore, { agentsDir });
      const cluster = createCluster({ suggestedName: 'valid-content-agent' });

      const result = await generator.generateContent(cluster);

      // Path should be within agents directory
      expect(result.filePath).toContain(agentsDir);
    });
  });
});
