import { describe, it, expect } from 'vitest';
import {
  generateServerPackageJson,
  generateServerTsconfig,
  generateServerIndex,
  generateServerMain,
  generateServerTest,
  generateServerClaudeMd,
  generateServerChipsetYaml,
  generateServerFiles,
} from './server-template.js';
import type { McpProjectConfig } from './types.js';

const DEFAULT_CONFIG: McpProjectConfig = {
  name: 'my-mcp-server',
  description: 'A test MCP server',
  version: '1.0.0',
  template: 'server',
  transport: 'stdio',
};

describe('Server Template', () => {
  // ========================================================================
  // Package.json
  // ========================================================================
  describe('generateServerPackageJson', () => {
    it('produces valid JSON', () => {
      const content = generateServerPackageJson(DEFAULT_CONFIG);
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('sets project name from config', () => {
      const pkg = JSON.parse(generateServerPackageJson(DEFAULT_CONFIG));
      expect(pkg.name).toBe('my-mcp-server');
    });

    it('sets version from config', () => {
      const pkg = JSON.parse(generateServerPackageJson(DEFAULT_CONFIG));
      expect(pkg.version).toBe('1.0.0');
    });

    it('includes bin entry with project name', () => {
      const pkg = JSON.parse(generateServerPackageJson(DEFAULT_CONFIG));
      expect(pkg.bin['my-mcp-server']).toBe('./dist/index.js');
    });

    it('includes MCP SDK dependency', () => {
      const pkg = JSON.parse(generateServerPackageJson(DEFAULT_CONFIG));
      expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
    });

    it('includes Zod dependency', () => {
      const pkg = JSON.parse(generateServerPackageJson(DEFAULT_CONFIG));
      expect(pkg.dependencies['zod']).toBeDefined();
    });

    it('includes vitest dev dependency', () => {
      const pkg = JSON.parse(generateServerPackageJson(DEFAULT_CONFIG));
      expect(pkg.devDependencies['vitest']).toBeDefined();
    });

    it('sets type to module', () => {
      const pkg = JSON.parse(generateServerPackageJson(DEFAULT_CONFIG));
      expect(pkg.type).toBe('module');
    });

    it('includes author when provided', () => {
      const config = { ...DEFAULT_CONFIG, author: 'Test Author' };
      const pkg = JSON.parse(generateServerPackageJson(config));
      expect(pkg.author).toBe('Test Author');
    });

    it('omits author when not provided', () => {
      const pkg = JSON.parse(generateServerPackageJson(DEFAULT_CONFIG));
      expect(pkg.author).toBeUndefined();
    });

    it('includes build, test, and typecheck scripts', () => {
      const pkg = JSON.parse(generateServerPackageJson(DEFAULT_CONFIG));
      expect(pkg.scripts.build).toBe('tsc');
      expect(pkg.scripts.test).toBe('vitest run');
      expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    });
  });

  // ========================================================================
  // tsconfig.json
  // ========================================================================
  describe('generateServerTsconfig', () => {
    it('produces valid JSON', () => {
      const content = generateServerTsconfig();
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('targets ES2022 with NodeNext modules', () => {
      const tsconfig = JSON.parse(generateServerTsconfig());
      expect(tsconfig.compilerOptions.target).toBe('ES2022');
      expect(tsconfig.compilerOptions.module).toBe('NodeNext');
    });

    it('enables strict mode', () => {
      const tsconfig = JSON.parse(generateServerTsconfig());
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('excludes test files from compilation', () => {
      const tsconfig = JSON.parse(generateServerTsconfig());
      expect(tsconfig.exclude).toContain('src/**/*.test.ts');
    });
  });

  // ========================================================================
  // src/index.ts
  // ========================================================================
  describe('generateServerIndex', () => {
    it('contains shebang line', () => {
      const content = generateServerIndex(DEFAULT_CONFIG);
      expect(content).toMatch(/^#!\/usr\/bin\/env node/);
    });

    it('imports createServer', () => {
      const content = generateServerIndex(DEFAULT_CONFIG);
      expect(content).toContain("import { createServer } from './server.js'");
    });

    it('imports StdioServerTransport', () => {
      const content = generateServerIndex(DEFAULT_CONFIG);
      expect(content).toContain('StdioServerTransport');
    });

    it('contains project name in log message', () => {
      const content = generateServerIndex(DEFAULT_CONFIG);
      expect(content).toContain('my-mcp-server');
    });
  });

  // ========================================================================
  // src/server.ts
  // ========================================================================
  describe('generateServerMain', () => {
    it('creates McpServer with project name', () => {
      const content = generateServerMain(DEFAULT_CONFIG);
      expect(content).toContain("name: 'my-mcp-server'");
    });

    it('creates McpServer with project version', () => {
      const content = generateServerMain(DEFAULT_CONFIG);
      expect(content).toContain("version: '1.0.0'");
    });

    it('registers hello tool', () => {
      const content = generateServerMain(DEFAULT_CONFIG);
      expect(content).toContain("'hello'");
      expect(content).toContain('Greet someone by name');
    });

    it('registers status resource', () => {
      const content = generateServerMain(DEFAULT_CONFIG);
      expect(content).toContain("'status://info'");
    });

    it('registers summarize prompt', () => {
      const content = generateServerMain(DEFAULT_CONFIG);
      expect(content).toContain("'summarize'");
    });

    it('exports createServer function', () => {
      const content = generateServerMain(DEFAULT_CONFIG);
      expect(content).toContain('export function createServer()');
    });
  });

  // ========================================================================
  // src/__tests__/server.test.ts
  // ========================================================================
  describe('generateServerTest', () => {
    it('imports from vitest', () => {
      const content = generateServerTest(DEFAULT_CONFIG);
      expect(content).toContain("from 'vitest'");
    });

    it('imports InMemoryTransport', () => {
      const content = generateServerTest(DEFAULT_CONFIG);
      expect(content).toContain('InMemoryTransport');
    });

    it('tests hello tool', () => {
      const content = generateServerTest(DEFAULT_CONFIG);
      expect(content).toContain("name: 'hello'");
    });

    it('tests status resource', () => {
      const content = generateServerTest(DEFAULT_CONFIG);
      expect(content).toContain("uri: 'status://info'");
    });

    it('tests summarize prompt', () => {
      const content = generateServerTest(DEFAULT_CONFIG);
      expect(content).toContain("name: 'summarize'");
    });

    it('contains project name in test description', () => {
      const content = generateServerTest(DEFAULT_CONFIG);
      expect(content).toContain('my-mcp-server MCP Server');
    });
  });

  // ========================================================================
  // CLAUDE.md
  // ========================================================================
  describe('generateServerClaudeMd', () => {
    it('contains project name as heading', () => {
      const content = generateServerClaudeMd(DEFAULT_CONFIG);
      expect(content).toContain('# my-mcp-server');
    });

    it('documents development commands', () => {
      const content = generateServerClaudeMd(DEFAULT_CONFIG);
      expect(content).toContain('npm install');
      expect(content).toContain('npm run build');
      expect(content).toContain('npm test');
    });
  });

  // ========================================================================
  // chipset.yaml
  // ========================================================================
  describe('generateServerChipsetYaml', () => {
    it('contains project name', () => {
      const content = generateServerChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('name: my-mcp-server');
    });

    it('sets type to mcp-server', () => {
      const content = generateServerChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('type: mcp-server');
    });

    it('includes version', () => {
      const content = generateServerChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('version: 1.0.0');
    });

    it('includes transport setting', () => {
      const content = generateServerChipsetYaml(DEFAULT_CONFIG);
      expect(content).toContain('transport: stdio');
    });
  });

  // ========================================================================
  // generateServerFiles (aggregate)
  // ========================================================================
  describe('generateServerFiles', () => {
    it('returns 7 files', () => {
      const files = generateServerFiles(DEFAULT_CONFIG);
      expect(files).toHaveLength(7);
    });

    it('includes all expected file paths', () => {
      const files = generateServerFiles(DEFAULT_CONFIG);
      const paths = files.map((f) => f.relativePath);
      expect(paths).toContain('package.json');
      expect(paths).toContain('tsconfig.json');
      expect(paths).toContain('src/index.ts');
      expect(paths).toContain('src/server.ts');
      expect(paths).toContain('src/__tests__/server.test.ts');
      expect(paths).toContain('CLAUDE.md');
      expect(paths).toContain('chipset.yaml');
    });

    it('all files have non-empty content', () => {
      const files = generateServerFiles(DEFAULT_CONFIG);
      for (const file of files) {
        expect(file.content.length).toBeGreaterThan(0);
      }
    });
  });

  // ========================================================================
  // Name propagation (TMPL-06)
  // ========================================================================
  describe('name propagation', () => {
    const config: McpProjectConfig = {
      name: 'custom-project-name',
      description: 'Custom project',
      version: '2.0.0',
      template: 'server',
      transport: 'stdio',
    };

    it('propagates name to package.json name field', () => {
      const pkg = JSON.parse(generateServerPackageJson(config));
      expect(pkg.name).toBe('custom-project-name');
    });

    it('propagates name to package.json bin key', () => {
      const pkg = JSON.parse(generateServerPackageJson(config));
      expect(pkg.bin['custom-project-name']).toBeDefined();
    });

    it('propagates name to McpServer constructor', () => {
      const content = generateServerMain(config);
      expect(content).toContain("name: 'custom-project-name'");
    });

    it('propagates name to CLAUDE.md heading', () => {
      const content = generateServerClaudeMd(config);
      expect(content).toContain('# custom-project-name');
    });

    it('propagates name to chipset.yaml', () => {
      const content = generateServerChipsetYaml(config);
      expect(content).toContain('name: custom-project-name');
    });
  });
});
