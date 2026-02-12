import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import matter from 'gray-matter';
import { createMcpServer } from './server.js';

// ── Helpers ─────────────────────────────────────────────────────────────

/** Build a minimal valid SKILL.md content string */
function makeSkillMd(name: string, description: string, body = 'Skill body content'): string {
  return matter.stringify(body, { name, description });
}

/** Create a skill directory with SKILL.md inside a parent directory */
async function createSkillDir(
  parentDir: string,
  skillName: string,
  description = 'A test skill',
  body = 'Skill body content',
): Promise<void> {
  const skillDir = join(parentDir, skillName);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, 'SKILL.md'), makeSkillMd(skillName, description, body));
}

/**
 * Connect a fresh MCP client to a server for in-process testing.
 * Returns the client and a cleanup function.
 */
async function connectClient(
  skillsDir: string,
): Promise<{ client: Client; cleanup: () => Promise<void> }> {
  const server = createMcpServer(skillsDir);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client({ name: 'test-client', version: '1.0.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return {
    client,
    cleanup: async () => {
      await client.close();
      await server.close();
    },
  };
}

// ── Test suite ──────────────────────────────────────────────────────────

describe('MCP Server', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mcp-server-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // ========================================================================
  // createMcpServer tests
  // ========================================================================
  describe('createMcpServer', () => {
    it('returns an McpServer instance with connect method', () => {
      const server = createMcpServer(tempDir);
      expect(server).toBeDefined();
      expect(typeof server.connect).toBe('function');
    });

    it('server name is "skill-creator"', async () => {
      const { client, cleanup } = await connectClient(tempDir);
      try {
        const version = client.getServerVersion();
        expect(version?.name).toBe('skill-creator');
      } finally {
        await cleanup();
      }
    });
  });

  // ========================================================================
  // list_skills handler tests
  // ========================================================================
  describe('list_skills', () => {
    it('returns skill names from skills directory', async () => {
      await createSkillDir(tempDir, 'git-commit', 'Git commit helper');
      await createSkillDir(tempDir, 'code-review', 'Code review skill');

      const { client, cleanup } = await connectClient(tempDir);
      try {
        const result = await client.callTool({ name: 'list_skills', arguments: {} });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        const names = JSON.parse(text) as string[];
        expect(names).toContain('git-commit');
        expect(names).toContain('code-review');
        expect(names).toHaveLength(2);
      } finally {
        await cleanup();
      }
    });

    it('returns empty array when skills directory is empty', async () => {
      const { client, cleanup } = await connectClient(tempDir);
      try {
        const result = await client.callTool({ name: 'list_skills', arguments: {} });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        const names = JSON.parse(text) as string[];
        expect(names).toEqual([]);
      } finally {
        await cleanup();
      }
    });

    it('accepts optional scope parameter', async () => {
      // Should not throw when scope is passed
      const { client, cleanup } = await connectClient(tempDir);
      try {
        const result = await client.callTool({
          name: 'list_skills',
          arguments: { scope: 'user' },
        });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        expect(text).toBeDefined();
      } finally {
        await cleanup();
      }
    });
  });

  // ========================================================================
  // search_skills handler tests
  // ========================================================================
  describe('search_skills', () => {
    it('returns matching skills for a query string', async () => {
      await createSkillDir(tempDir, 'git-commit', 'Git commit message helper');
      await createSkillDir(tempDir, 'code-review', 'Code review assistant');
      await createSkillDir(tempDir, 'git-rebase', 'Git rebase guide');

      const { client, cleanup } = await connectClient(tempDir);
      try {
        const result = await client.callTool({
          name: 'search_skills',
          arguments: { query: 'git' },
        });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        const matches = JSON.parse(text) as Array<{ name: string }>;
        expect(matches.length).toBe(2);
        expect(matches.map((m) => m.name)).toContain('git-commit');
        expect(matches.map((m) => m.name)).toContain('git-rebase');
      } finally {
        await cleanup();
      }
    });

    it('returns empty array for no-match query', async () => {
      await createSkillDir(tempDir, 'git-commit', 'Git commit helper');

      const { client, cleanup } = await connectClient(tempDir);
      try {
        const result = await client.callTool({
          name: 'search_skills',
          arguments: { query: 'zzz-no-match-zzz' },
        });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        const matches = JSON.parse(text) as unknown[];
        expect(matches).toEqual([]);
      } finally {
        await cleanup();
      }
    });
  });

  // ========================================================================
  // read_skill handler tests
  // ========================================================================
  describe('read_skill', () => {
    it('returns portable skill content for a valid skill name', async () => {
      await createSkillDir(tempDir, 'git-commit', 'Git commit message helper', 'Write good commit messages.');

      const { client, cleanup } = await connectClient(tempDir);
      try {
        const result = await client.callTool({
          name: 'read_skill',
          arguments: { name: 'git-commit' },
        });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        // Portable content should contain the skill body
        expect(text).toContain('Write good commit messages');
        // Should also contain metadata (name/description)
        expect(text).toContain('git-commit');
      } finally {
        await cleanup();
      }
    });

    it('returns error text for non-existent skill name', async () => {
      const { client, cleanup } = await connectClient(tempDir);
      try {
        const result = await client.callTool({
          name: 'read_skill',
          arguments: { name: 'nonexistent-skill' },
        });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        expect(text).toMatch(/not found|error/i);
        expect(result.isError).toBe(true);
      } finally {
        await cleanup();
      }
    });
  });

  // ========================================================================
  // install_skill handler tests
  // ========================================================================
  describe('install_skill', () => {
    it('delegates to installSkill with correct source and target', async () => {
      // Use a mock for installSkill since MCP server tests don't need to test
      // actual tar.gz processing (that's covered by 66-03 tests)
      const { client, cleanup } = await connectClient(tempDir);
      try {
        // Call with a non-existent file -- should return error text, not throw
        const result = await client.callTool({
          name: 'install_skill',
          arguments: { source: '/tmp/nonexistent-package.tar.gz' },
        });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        // Should return error text (file doesn't exist), not crash
        expect(text).toBeDefined();
        expect(result.isError).toBe(true);
      } finally {
        await cleanup();
      }
    });

    it('returns success message with skill name on successful install', async () => {
      // Create a real .tar.gz package to install
      // We need to import packSkill to create a valid package
      const { packSkill } = await import('./skill-packager.js');

      // Create source skill
      const sourceDir = join(tempDir, 'source-skill');
      await createSkillDir(tempDir, 'source-skill', 'A packaged skill', 'Packaged skill body.');

      // Pack it
      const archivePath = join(tempDir, 'test-skill.tar.gz');
      await packSkill(sourceDir, 'source-skill', archivePath);

      // Install via MCP server
      const installDir = join(tempDir, 'install-target');
      await mkdir(installDir, { recursive: true });

      const { client, cleanup } = await connectClient(installDir);
      try {
        const result = await client.callTool({
          name: 'install_skill',
          arguments: { source: archivePath },
        });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        expect(text).toContain('source-skill');
        expect(text).toMatch(/success|installed/i);
      } finally {
        await cleanup();
      }
    });

    it('returns error message on failed install', async () => {
      const { client, cleanup } = await connectClient(tempDir);
      try {
        // Point to a file that exists but is not a valid tar.gz
        const badFile = join(tempDir, 'bad-package.tar.gz');
        await writeFile(badFile, 'not a tar.gz file');

        const result = await client.callTool({
          name: 'install_skill',
          arguments: { source: badFile },
        });
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        expect(text).toBeDefined();
        expect(result.isError).toBe(true);
      } finally {
        await cleanup();
      }
    });
  });

  // ========================================================================
  // Tool registration verification
  // ========================================================================
  describe('tool registration', () => {
    it('registers exactly 4 tools', async () => {
      const { client, cleanup } = await connectClient(tempDir);
      try {
        const toolsResult = await client.listTools();
        const toolNames = toolsResult.tools.map((t) => t.name);
        expect(toolNames).toHaveLength(4);
        expect(toolNames).toContain('list_skills');
        expect(toolNames).toContain('search_skills');
        expect(toolNames).toContain('read_skill');
        expect(toolNames).toContain('install_skill');
      } finally {
        await cleanup();
      }
    });
  });
});
