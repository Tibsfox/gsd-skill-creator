/**
 * MCP Server template file generators.
 *
 * Each function takes an McpProjectConfig and returns the string content for
 * one file in the generated server project. The generator orchestrator calls
 * these and writes the results to disk.
 *
 * Generated projects use:
 * - @modelcontextprotocol/sdk for MCP protocol
 * - Zod v4 for tool input schemas
 * - Vitest for testing
 * - TypeScript with strict mode and ESM
 *
 * @module mcp/templates/server-template
 */

import type { McpProjectConfig, TemplateFile } from './types.js';

// ============================================================================
// Package.json
// ============================================================================

/** Generate package.json for an MCP server project. */
export function generateServerPackageJson(config: McpProjectConfig): string {
  const pkg = {
    name: config.name,
    version: config.version,
    description: config.description,
    type: 'module',
    main: 'dist/index.js',
    bin: {
      [config.name]: './dist/index.js',
    },
    scripts: {
      build: 'tsc',
      start: 'node dist/index.js',
      dev: 'npx tsx src/index.ts',
      test: 'vitest run',
      'test:watch': 'vitest',
      typecheck: 'tsc --noEmit',
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.26.0',
      zod: '^4.3.6',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      typescript: '^5.3.0',
      vitest: '^4.0.0',
      tsx: '^4.21.0',
    },
    ...(config.author ? { author: config.author } : {}),
  };

  return JSON.stringify(pkg, null, 2) + '\n';
}

// ============================================================================
// tsconfig.json
// ============================================================================

/** Generate tsconfig.json for an MCP server project. */
export function generateServerTsconfig(): string {
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: 'dist',
      rootDir: 'src',
      strict: true,
      esModuleInterop: true,
      declaration: true,
      skipLibCheck: true,
    },
    include: ['src/**/*'],
    exclude: ['src/**/*.test.ts'],
  };

  return JSON.stringify(tsconfig, null, 2) + '\n';
}

// ============================================================================
// src/index.ts (entry point)
// ============================================================================

/** Generate src/index.ts entry point for an MCP server project. */
export function generateServerIndex(config: McpProjectConfig): string {
  return `#!/usr/bin/env node
/**
 * ${config.name} -- MCP server entry point.
 *
 * Starts the MCP server on stdio transport.
 * CRITICAL: Never use console.log in this file (stdout is MCP protocol).
 */

import { createServer } from './server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${config.name} MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
`;
}

// ============================================================================
// src/server.ts (main server logic)
// ============================================================================

/** Generate src/server.ts with McpServer setup and example tool/resource/prompt. */
export function generateServerMain(config: McpProjectConfig): string {
  return `/**
 * ${config.name} MCP server implementation.
 *
 * Registers example tool, resource, and prompt to demonstrate MCP capabilities.
 * Replace these with your own implementations.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * Create and configure the MCP server with example tool, resource, and prompt.
 *
 * @returns Configured McpServer instance
 */
export function createServer(): McpServer {
  const server = new McpServer(
    { name: '${config.name}', version: '${config.version}' },
  );

  // ── Example Tool: hello ──────────────────────────────────────────────
  server.tool(
    'hello',
    'Greet someone by name',
    {
      name: z.string().describe('Name of the person to greet'),
    },
    async (args) => {
      return {
        content: [{ type: 'text' as const, text: \`Hello, \${args.name}!\` }],
      };
    },
  );

  // ── Example Resource: status://info ──────────────────────────────────
  server.resource(
    'status://info',
    'Server status information',
    async () => {
      return {
        contents: [
          {
            uri: 'status://info',
            text: JSON.stringify({
              name: '${config.name}',
              version: '${config.version}',
              status: 'running',
              uptime: process.uptime(),
            }),
            mimeType: 'application/json',
          },
        ],
      };
    },
  );

  // ── Example Prompt: summarize ────────────────────────────────────────
  server.prompt(
    'summarize',
    'Summarize the given text',
    { text: z.string().describe('Text to summarize') },
    async (args) => {
      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: \`Please summarize the following text:\\n\\n\${args.text}\`,
            },
          },
        ],
      };
    },
  );

  return server;
}
`;
}

// ============================================================================
// src/__tests__/server.test.ts
// ============================================================================

/** Generate src/__tests__/server.test.ts with MCP server tests. */
export function generateServerTest(config: McpProjectConfig): string {
  return `import { describe, it, expect, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../server.js';

/**
 * Connect a fresh MCP client to the server for in-process testing.
 */
async function connectClient(): Promise<{ client: Client; cleanup: () => Promise<void> }> {
  const server = createServer();
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

describe('${config.name} MCP Server', () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it('has correct server name and version', async () => {
    const conn = await connectClient();
    cleanup = conn.cleanup;
    const version = conn.client.getServerVersion();
    expect(version?.name).toBe('${config.name}');
    expect(version?.version).toBe('${config.version}');
  });

  it('registers expected tools', async () => {
    const conn = await connectClient();
    cleanup = conn.cleanup;
    const tools = await conn.client.listTools();
    const names = tools.tools.map((t) => t.name);
    expect(names).toContain('hello');
  });

  it('hello tool returns greeting', async () => {
    const conn = await connectClient();
    cleanup = conn.cleanup;
    const result = await conn.client.callTool({
      name: 'hello',
      arguments: { name: 'World' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
    expect(text).toBe('Hello, World!');
  });

  it('registers expected resources', async () => {
    const conn = await connectClient();
    cleanup = conn.cleanup;
    const resources = await conn.client.listResources();
    const uris = resources.resources.map((r) => r.uri);
    expect(uris).toContain('status://info');
  });

  it('status resource returns server info', async () => {
    const conn = await connectClient();
    cleanup = conn.cleanup;
    const result = await conn.client.readResource({ uri: 'status://info' });
    const text = (result.contents[0] as { text: string }).text;
    const info = JSON.parse(text);
    expect(info.name).toBe('${config.name}');
    expect(info.status).toBe('running');
  });

  it('registers expected prompts', async () => {
    const conn = await connectClient();
    cleanup = conn.cleanup;
    const prompts = await conn.client.listPrompts();
    const names = prompts.prompts.map((p) => p.name);
    expect(names).toContain('summarize');
  });

  it('summarize prompt returns user message', async () => {
    const conn = await connectClient();
    cleanup = conn.cleanup;
    const result = await conn.client.getPrompt({
      name: 'summarize',
      arguments: { text: 'Some text to summarize' },
    });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
  });
});
`;
}

// ============================================================================
// CLAUDE.md
// ============================================================================

/** Generate CLAUDE.md for an MCP server project. */
export function generateServerClaudeMd(config: McpProjectConfig): string {
  return `# ${config.name}

MCP server project generated by gsd-skill-creator.

## Project Structure

- \`src/index.ts\` -- Entry point, starts MCP server on stdio transport
- \`src/server.ts\` -- Server implementation with tool, resource, and prompt registrations
- \`src/__tests__/server.test.ts\` -- Tests using InMemoryTransport

## Development

\`\`\`bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Run in development mode
npm test             # Run tests
npm run typecheck    # Type-check without emitting
\`\`\`

## MCP Transport

This server uses stdio transport. To test with MCP Inspector:

\`\`\`bash
npx @modelcontextprotocol/inspector node dist/index.js
\`\`\`

## Adding Tools

Register new tools in \`src/server.ts\` using \`server.tool()\`:

\`\`\`typescript
server.tool('my_tool', 'Description', { param: z.string() }, async (args) => {
  return { content: [{ type: 'text', text: 'Result' }] };
});
\`\`\`

## Conventions

- NEVER use console.log (stdout is MCP protocol) -- use console.error for logging
- All tool inputs validated with Zod schemas
- Tests use InMemoryTransport for fast in-process testing
- ESM modules with NodeNext resolution
`;
}

// ============================================================================
// chipset.yaml
// ============================================================================

/** Generate chipset.yaml for an MCP server project. */
export function generateServerChipsetYaml(config: McpProjectConfig): string {
  return `# Chipset configuration for ${config.name}
# Generated by gsd-skill-creator MCP template system

name: ${config.name}
type: mcp-server
version: ${config.version}
description: ${config.description}

transport: ${config.transport}

capabilities:
  tools: true
  resources: true
  prompts: true

skills: []
`;
}

// ============================================================================
// Aggregate generator
// ============================================================================

/** Generate all files for an MCP server project. */
export function generateServerFiles(config: McpProjectConfig): TemplateFile[] {
  return [
    { relativePath: 'package.json', content: generateServerPackageJson(config) },
    { relativePath: 'tsconfig.json', content: generateServerTsconfig() },
    { relativePath: 'src/index.ts', content: generateServerIndex(config) },
    { relativePath: 'src/server.ts', content: generateServerMain(config) },
    { relativePath: 'src/__tests__/server.test.ts', content: generateServerTest(config) },
    { relativePath: 'CLAUDE.md', content: generateServerClaudeMd(config) },
    { relativePath: 'chipset.yaml', content: generateServerChipsetYaml(config) },
  ];
}
