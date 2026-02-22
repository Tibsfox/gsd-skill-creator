import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  generateClientPackageJson,
  generateClientTsconfig,
  generateClientIndex,
  generateClientMain,
  generateClientTest,
  generateClientClaudeMd,
  generateClientChipsetYaml,
  generateClientFiles,
} from './client-template.js';
import { generateMcpProject } from './generator.js';
import type { McpProjectConfig } from './types.js';

const DEFAULT_CONFIG: McpProjectConfig = {
  name: 'my-mcp-client',
  description: 'A test MCP client',
  version: '1.0.0',
  template: 'client',
  transport: 'stdio',
};

describe('Client Template', () => {
  // ========================================================================
  // Package.json
  // ========================================================================
  describe('generateClientPackageJson', () => {
    it('produces valid JSON', () => {
      const content = generateClientPackageJson(DEFAULT_CONFIG);
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('sets project name from config', () => {
      const pkg = JSON.parse(generateClientPackageJson(DEFAULT_CONFIG));
      expect(pkg.name).toBe('my-mcp-client');
    });

    it('includes bin entry with project name', () => {
      const pkg = JSON.parse(generateClientPackageJson(DEFAULT_CONFIG));
      expect(pkg.bin['my-mcp-client']).toBe('./dist/index.js');
    });

    it('includes MCP SDK dependency', () => {
      const pkg = JSON.parse(generateClientPackageJson(DEFAULT_CONFIG));
      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
    });
  });

  // ========================================================================
  // tsconfig.json
  // ========================================================================
  describe('generateClientTsconfig', () => {
    it('produces valid JSON with strict mode', () => {
      const tsconfig = JSON.parse(generateClientTsconfig());
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
  });

  // ========================================================================
  // src/index.ts
  // ========================================================================
  describe('generateClientIndex', () => {
    it('imports McpClientWrapper', () => {
      const content = generateClientIndex(DEFAULT_CONFIG);
      expect(content).toContain("import { McpClientWrapper } from './client.js'");
    });

    it('contains project name', () => {
      const content = generateClientIndex(DEFAULT_CONFIG);
      expect(content).toContain('my-mcp-client');
    });
  });

  // ========================================================================
  // src/client.ts
  // ========================================================================
  describe('generateClientMain', () => {
    it('contains McpClientWrapper class', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('class McpClientWrapper');
    });

    it('contains connect method', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('async connect(');
    });

    it('contains disconnect method', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('async disconnect(');
    });

    it('contains discoverTools method', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('discoverTools');
    });

    it('contains callTool with generic type parameter', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('callTool<T');
    });

    it('contains subscribeToResource method', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('subscribeToResource');
    });

    it('contains listResources method', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('listResources');
    });

    it('contains listPrompts method', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('listPrompts');
    });

    it('contains ToolCallResult type with typed response', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('ToolCallResult');
      expect(content).toContain('parsed');
    });

    it('contains transport abstraction types', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('StdioTransportConfig');
      expect(content).toContain('HttpTransportConfig');
    });

    it('imports Client from SDK', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain("import { Client } from '@modelcontextprotocol/sdk/client/index.js'");
    });

    it('contains ResourceCallback type', () => {
      const content = generateClientMain(DEFAULT_CONFIG);
      expect(content).toContain('ResourceCallback');
    });
  });

  // ========================================================================
  // src/__tests__/client.test.ts
  // ========================================================================
  describe('generateClientTest', () => {
    it('imports from vitest', () => {
      const content = generateClientTest(DEFAULT_CONFIG);
      expect(content).toContain("from 'vitest'");
    });

    it('tests McpClientWrapper', () => {
      const content = generateClientTest(DEFAULT_CONFIG);
      expect(content).toContain('McpClientWrapper');
    });

    it('tests connection guards', () => {
      const content = generateClientTest(DEFAULT_CONFIG);
      expect(content).toContain('discoverTools throws when not connected');
    });

    it('tests resource subscriptions', () => {
      const content = generateClientTest(DEFAULT_CONFIG);
      expect(content).toContain('subscribeToResource');
    });
  });

  // ========================================================================
  // CLAUDE.md
  // ========================================================================
  describe('generateClientClaudeMd', () => {
    it('contains project name as heading', () => {
      const content = generateClientClaudeMd(DEFAULT_CONFIG);
      expect(content).toContain('# my-mcp-client');
    });
  });

  // ========================================================================
  // chipset.yaml
  // ========================================================================
  describe('generateClientChipsetYaml', () => {
    it('contains project name', () => {
      const content = generateClientChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('name: my-mcp-client');
    });

    it('sets type to mcp-client', () => {
      const content = generateClientChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('type: mcp-client');
    });

    it('includes tool-discovery capability', () => {
      const content = generateClientChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('tool-discovery: true');
    });

    it('includes resource-subscription capability', () => {
      const content = generateClientChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('resource-subscription: true');
    });

    it('includes typed-responses capability', () => {
      const content = generateClientChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('typed-responses: true');
    });
  });

  // ========================================================================
  // generateClientFiles (aggregate)
  // ========================================================================
  describe('generateClientFiles', () => {
    it('returns 7 files', () => {
      const files = generateClientFiles(DEFAULT_CONFIG);
      expect(files).toHaveLength(7);
    });

    it('includes all expected file paths', () => {
      const files = generateClientFiles(DEFAULT_CONFIG);
      const paths = files.map((f) => f.relativePath);
      expect(paths).toContain('package.json');
      expect(paths).toContain('tsconfig.json');
      expect(paths).toContain('src/index.ts');
      expect(paths).toContain('src/client.ts');
      expect(paths).toContain('src/__tests__/client.test.ts');
      expect(paths).toContain('CLAUDE.md');
      expect(paths).toContain('chipset.yaml');
    });
  });

  // ========================================================================
  // Generator integration
  // ========================================================================
  describe('generator integration', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'mcp-client-gen-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('generates client project with all 7 files', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      expect(result.files).toHaveLength(7);
      expect(result.errors).toHaveLength(0);
    });

    it('writes client.ts with McpClientWrapper', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const content = await readFile(join(result.projectDir, 'src/client.ts'), 'utf-8');
      expect(content).toContain('class McpClientWrapper');
    });

    it('writes package.json with correct name', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const content = await readFile(join(result.projectDir, 'package.json'), 'utf-8');
      expect(JSON.parse(content).name).toBe('my-mcp-client');
    });

    it('creates src/__tests__/ directory', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const testDir = await stat(join(result.projectDir, 'src/__tests__'));
      expect(testDir.isDirectory()).toBe(true);
    });
  });

  // ========================================================================
  // Name propagation
  // ========================================================================
  describe('name propagation', () => {
    const config: McpProjectConfig = {
      name: 'custom-client',
      description: 'Custom client project',
      version: '2.0.0',
      template: 'client',
      transport: 'stdio',
    };

    it('propagates name to package.json', () => {
      const pkg = JSON.parse(generateClientPackageJson(config));
      expect(pkg.name).toBe('custom-client');
      expect(pkg.bin['custom-client']).toBeDefined();
    });

    it('propagates name to client.ts (via wrapper name)', () => {
      const content = generateClientIndex(config);
      expect(content).toContain("'custom-client'");
    });

    it('propagates name to CLAUDE.md', () => {
      const content = generateClientClaudeMd(config);
      expect(content).toContain('# custom-client');
    });

    it('propagates name to chipset.yaml', () => {
      const content = generateClientChipsetYaml(config);
      expect(content).toContain('name: custom-client');
    });
  });
});
