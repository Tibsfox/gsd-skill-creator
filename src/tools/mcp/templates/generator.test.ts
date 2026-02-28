import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateMcpProject } from './generator.js';
import type { McpProjectConfig } from './types.js';

const DEFAULT_CONFIG: McpProjectConfig = {
  name: 'test-mcp-server',
  description: 'A test MCP server project',
  version: '1.0.0',
  template: 'server',
  transport: 'stdio',
};

describe('Generator Orchestrator', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mcp-gen-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // ========================================================================
  // Successful generation
  // ========================================================================
  describe('successful server generation', () => {
    it('creates project directory', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const projectStat = await stat(result.projectDir);
      expect(projectStat.isDirectory()).toBe(true);
    });

    it('writes all 7 expected files', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      expect(result.files).toHaveLength(7);
      expect(result.errors).toHaveLength(0);
    });

    it('writes package.json with correct name', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const pkgPath = join(result.projectDir, 'package.json');
      const content = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      expect(pkg.name).toBe('test-mcp-server');
    });

    it('writes tsconfig.json', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const tsconfigPath = join(result.projectDir, 'tsconfig.json');
      const content = await readFile(tsconfigPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('writes src/index.ts', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const indexPath = join(result.projectDir, 'src/index.ts');
      const content = await readFile(indexPath, 'utf-8');
      expect(content).toContain('createServer');
    });

    it('writes src/server.ts with McpServer setup', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const serverPath = join(result.projectDir, 'src/server.ts');
      const content = await readFile(serverPath, 'utf-8');
      expect(content).toContain('McpServer');
      expect(content).toContain("'hello'");
    });

    it('writes src/__tests__/server.test.ts', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const testPath = join(result.projectDir, 'src/__tests__/server.test.ts');
      const content = await readFile(testPath, 'utf-8');
      expect(content).toContain('InMemoryTransport');
    });

    it('writes CLAUDE.md with project name', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const claudePath = join(result.projectDir, 'CLAUDE.md');
      const content = await readFile(claudePath, 'utf-8');
      expect(content).toContain('# test-mcp-server');
    });

    it('writes chipset.yaml', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const chipsetPath = join(result.projectDir, 'chipset.yaml');
      const content = await readFile(chipsetPath, 'utf-8');
      expect(content).toContain('name: test-mcp-server');
    });
  });

  // ========================================================================
  // Timing (TMPL-05)
  // ========================================================================
  describe('generation timing', () => {
    it('completes in under 120 seconds', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      expect(result.generationTimeMs).toBeLessThan(120_000);
    });

    it('completes in under 1 second for file generation', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      // Pure file generation should be nearly instant
      expect(result.generationTimeMs).toBeLessThan(1_000);
    });
  });

  // ========================================================================
  // Config validation
  // ========================================================================
  describe('config validation', () => {
    it('rejects empty project name', async () => {
      const config = { ...DEFAULT_CONFIG, name: '' };
      const result = await generateMcpProject(config, tempDir);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.files).toHaveLength(0);
    });

    it('rejects name with spaces', async () => {
      const config = { ...DEFAULT_CONFIG, name: 'bad name' };
      const result = await generateMcpProject(config, tempDir);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects name with uppercase', async () => {
      const config = { ...DEFAULT_CONFIG, name: 'BadName' };
      const result = await generateMcpProject(config, tempDir);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('accepts valid kebab-case name', async () => {
      const config = { ...DEFAULT_CONFIG, name: 'my-valid-name' };
      const result = await generateMcpProject(config, tempDir);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts name with dots', async () => {
      const config = { ...DEFAULT_CONFIG, name: 'my.server' };
      const result = await generateMcpProject(config, tempDir);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ========================================================================
  // Name propagation (TMPL-06)
  // ========================================================================
  describe('name propagation across generated files', () => {
    const config: McpProjectConfig = {
      name: 'custom-server',
      description: 'Custom description',
      version: '3.0.0',
      template: 'server',
      transport: 'stdio',
    };

    it('propagates name to package.json name field', async () => {
      const result = await generateMcpProject(config, tempDir);
      const content = await readFile(join(result.projectDir, 'package.json'), 'utf-8');
      expect(JSON.parse(content).name).toBe('custom-server');
    });

    it('propagates name to package.json bin key', async () => {
      const result = await generateMcpProject(config, tempDir);
      const content = await readFile(join(result.projectDir, 'package.json'), 'utf-8');
      expect(JSON.parse(content).bin['custom-server']).toBeDefined();
    });

    it('propagates name to server McpServer constructor', async () => {
      const result = await generateMcpProject(config, tempDir);
      const content = await readFile(join(result.projectDir, 'src/server.ts'), 'utf-8');
      expect(content).toContain("name: 'custom-server'");
    });

    it('propagates name to CLAUDE.md heading', async () => {
      const result = await generateMcpProject(config, tempDir);
      const content = await readFile(join(result.projectDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toContain('# custom-server');
    });

    it('propagates name to chipset.yaml', async () => {
      const result = await generateMcpProject(config, tempDir);
      const content = await readFile(join(result.projectDir, 'chipset.yaml'), 'utf-8');
      expect(content).toContain('name: custom-server');
    });
  });

  // ========================================================================
  // Project directory structure
  // ========================================================================
  describe('directory structure', () => {
    it('creates src/ directory', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const srcStat = await stat(join(result.projectDir, 'src'));
      expect(srcStat.isDirectory()).toBe(true);
    });

    it('creates src/__tests__/ directory', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const testStat = await stat(join(result.projectDir, 'src/__tests__'));
      expect(testStat.isDirectory()).toBe(true);
    });
  });
});
