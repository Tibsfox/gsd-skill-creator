import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  generateHostPackageJson,
  generateHostTsconfig,
  generateHostIndex,
  generateHostMain,
  generateHostTest,
  generateHostClaudeMd,
  generateHostChipsetYaml,
  generateHostFiles,
} from './host-template.js';
import { generateMcpProject } from './generator.js';
import type { McpProjectConfig } from './types.js';

const DEFAULT_CONFIG: McpProjectConfig = {
  name: 'my-mcp-host',
  description: 'A test MCP host',
  version: '1.0.0',
  template: 'host',
  transport: 'stdio',
};

describe('Host Template', () => {
  // ========================================================================
  // Package.json
  // ========================================================================
  describe('generateHostPackageJson', () => {
    it('produces valid JSON', () => {
      const content = generateHostPackageJson(DEFAULT_CONFIG);
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('sets project name from config', () => {
      const pkg = JSON.parse(generateHostPackageJson(DEFAULT_CONFIG));
      expect(pkg.name).toBe('my-mcp-host');
    });

    it('includes bin entry with project name', () => {
      const pkg = JSON.parse(generateHostPackageJson(DEFAULT_CONFIG));
      expect(pkg.bin['my-mcp-host']).toBe('./dist/index.js');
    });

    it('includes MCP SDK dependency', () => {
      const pkg = JSON.parse(generateHostPackageJson(DEFAULT_CONFIG));
      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
    });
  });

  // ========================================================================
  // tsconfig.json
  // ========================================================================
  describe('generateHostTsconfig', () => {
    it('produces valid JSON with strict mode', () => {
      const tsconfig = JSON.parse(generateHostTsconfig());
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
  });

  // ========================================================================
  // src/index.ts
  // ========================================================================
  describe('generateHostIndex', () => {
    it('imports ServerPool', () => {
      const content = generateHostIndex(DEFAULT_CONFIG);
      expect(content).toContain("import { ServerPool } from './host.js'");
    });

    it('contains project name', () => {
      const content = generateHostIndex(DEFAULT_CONFIG);
      expect(content).toContain('my-mcp-host');
    });
  });

  // ========================================================================
  // src/host.ts
  // ========================================================================
  describe('generateHostMain', () => {
    it('contains ServerPool class', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('class ServerPool');
    });

    it('contains connectServer method', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('connectServer');
    });

    it('contains disconnectServer method', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('disconnectServer');
    });

    it('contains disconnectAll method', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('disconnectAll');
    });

    it('contains ApprovalGate interface', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('interface ApprovalGate');
    });

    it('contains requestApproval method', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('requestApproval');
    });

    it('contains invokeTool method', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('invokeTool');
    });

    it('contains transport abstraction types', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('StdioTransportConfig');
      expect(content).toContain('HttpTransportConfig');
      expect(content).toContain('TransportConfig');
    });

    it('contains AutoApproveGate', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('class AutoApproveGate');
    });

    it('contains listServers method', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain('listServers');
    });

    it('imports Client from SDK', () => {
      const content = generateHostMain(DEFAULT_CONFIG);
      expect(content).toContain("import { Client } from '@modelcontextprotocol/sdk/client/index.js'");
    });
  });

  // ========================================================================
  // src/__tests__/host.test.ts
  // ========================================================================
  describe('generateHostTest', () => {
    it('imports from vitest', () => {
      const content = generateHostTest(DEFAULT_CONFIG);
      expect(content).toContain("from 'vitest'");
    });

    it('tests ServerPool', () => {
      const content = generateHostTest(DEFAULT_CONFIG);
      expect(content).toContain('ServerPool');
    });

    it('tests AutoApproveGate', () => {
      const content = generateHostTest(DEFAULT_CONFIG);
      expect(content).toContain('AutoApproveGate');
    });

    it('tests approval gate integration', () => {
      const content = generateHostTest(DEFAULT_CONFIG);
      expect(content).toContain('ApprovalGate');
    });
  });

  // ========================================================================
  // CLAUDE.md
  // ========================================================================
  describe('generateHostClaudeMd', () => {
    it('contains project name as heading', () => {
      const content = generateHostClaudeMd(DEFAULT_CONFIG);
      expect(content).toContain('# my-mcp-host');
    });
  });

  // ========================================================================
  // chipset.yaml
  // ========================================================================
  describe('generateHostChipsetYaml', () => {
    it('contains project name', () => {
      const content = generateHostChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('name: my-mcp-host');
    });

    it('sets type to mcp-host', () => {
      const content = generateHostChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('type: mcp-host');
    });
  });

  // ========================================================================
  // generateHostFiles (aggregate)
  // ========================================================================
  describe('generateHostFiles', () => {
    it('returns 7 files', () => {
      const files = generateHostFiles(DEFAULT_CONFIG);
      expect(files).toHaveLength(7);
    });

    it('includes all expected file paths', () => {
      const files = generateHostFiles(DEFAULT_CONFIG);
      const paths = files.map((f) => f.relativePath);
      expect(paths).toContain('package.json');
      expect(paths).toContain('tsconfig.json');
      expect(paths).toContain('src/index.ts');
      expect(paths).toContain('src/host.ts');
      expect(paths).toContain('src/__tests__/host.test.ts');
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
      tempDir = await mkdtemp(join(tmpdir(), 'mcp-host-gen-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('generates host project with all 7 files', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      expect(result.files).toHaveLength(7);
      expect(result.errors).toHaveLength(0);
    });

    it('writes host.ts with ServerPool', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const content = await readFile(join(result.projectDir, 'src/host.ts'), 'utf-8');
      expect(content).toContain('class ServerPool');
    });

    it('writes package.json with correct name', async () => {
      const result = await generateMcpProject(DEFAULT_CONFIG, tempDir);
      const content = await readFile(join(result.projectDir, 'package.json'), 'utf-8');
      expect(JSON.parse(content).name).toBe('my-mcp-host');
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
      name: 'custom-host',
      description: 'Custom host project',
      version: '2.0.0',
      template: 'host',
      transport: 'stdio',
    };

    it('propagates name to package.json', () => {
      const pkg = JSON.parse(generateHostPackageJson(config));
      expect(pkg.name).toBe('custom-host');
      expect(pkg.bin['custom-host']).toBeDefined();
    });

    it('propagates name to host.ts (via pool name)', () => {
      const content = generateHostIndex(config);
      expect(content).toContain("'custom-host'");
    });

    it('propagates name to CLAUDE.md', () => {
      const content = generateHostClaudeMd(config);
      expect(content).toContain('# custom-host');
    });

    it('propagates name to chipset.yaml', () => {
      const content = generateHostChipsetYaml(config);
      expect(content).toContain('name: custom-host');
    });
  });
});
