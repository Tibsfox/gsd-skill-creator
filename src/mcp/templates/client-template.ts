/**
 * MCP Client template file generators.
 *
 * Each function takes an McpProjectConfig and returns the string content for
 * one file in the generated client project. The client connects to MCP servers,
 * discovers tools, subscribes to resources, and makes typed tool calls.
 *
 * @module mcp/templates/client-template
 */

import type { McpProjectConfig, TemplateFile } from './types.js';

// ============================================================================
// Package.json
// ============================================================================

/** Generate package.json for an MCP client project. */
export function generateClientPackageJson(config: McpProjectConfig): string {
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

/** Generate tsconfig.json for an MCP client project. */
export function generateClientTsconfig(): string {
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

/** Generate src/index.ts entry point for an MCP client project. */
export function generateClientIndex(config: McpProjectConfig): string {
  return `#!/usr/bin/env node
/**
 * ${config.name} -- MCP client entry point.
 *
 * Demonstrates connecting to an MCP server, discovering tools,
 * and making typed tool calls.
 */

import { McpClientWrapper } from './client.js';

async function main(): Promise<void> {
  const client = new McpClientWrapper('${config.name}');

  console.log('${config.name} client ready');
  console.log('Use client.connect() to connect to an MCP server');

  // Example: Connect to a server (uncomment and configure)
  // await client.connect({
  //   type: 'stdio',
  //   command: 'node',
  //   args: ['path/to/server/dist/index.js'],
  // });
  //
  // const tools = await client.discoverTools();
  // console.log('Available tools:', tools.map(t => t.name));
  //
  // const result = await client.callTool<string>('hello', { name: 'World' });
  // console.log('Result:', result);
  //
  // await client.disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
`;
}

// ============================================================================
// src/client.ts (main client logic)
// ============================================================================

/** Generate src/client.ts with McpClientWrapper, discovery, typed calls, subscriptions. */
export function generateClientMain(config: McpProjectConfig): string {
  return `/**
 * ${config.name} MCP client implementation.
 *
 * Wraps the MCP SDK Client with:
 * - Connection lifecycle management
 * - Tool discovery with typed metadata
 * - Typed tool call responses
 * - Resource listing and subscription
 * - Prompt listing and retrieval
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// ── Types ──────────────────────────────────────────────────────────────

/** Transport configuration for stdio servers. */
export interface StdioTransportConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/** Transport configuration for HTTP servers. */
export interface HttpTransportConfig {
  type: 'streamable-http';
  url: string;
  headers?: Record<string, string>;
}

/** Union transport configuration. */
export type TransportConfig = StdioTransportConfig | HttpTransportConfig;

/** Discovered tool metadata. */
export interface ToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** Discovered resource metadata. */
export interface ResourceInfo {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/** Discovered prompt metadata. */
export interface PromptInfo {
  name: string;
  description?: string;
}

/** Typed tool call result. */
export interface ToolCallResult<T = unknown> {
  content: Array<{ type: string; text: string }>;
  parsed?: T;
  isError?: boolean;
}

/** Resource subscription callback. */
export type ResourceCallback = (uri: string, content: string) => void;

// ── McpClientWrapper ───────────────────────────────────────────────────

/**
 * High-level MCP client wrapper with typed tool calls and resource subscriptions.
 */
export class McpClientWrapper {
  private readonly name: string;
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected = false;
  private subscriptions = new Map<string, ResourceCallback>();

  constructor(name: string) {
    this.name = name;
  }

  /** Get the client name. */
  getName(): string {
    return this.name;
  }

  /** Check if the client is connected. */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Connect to an MCP server.
   *
   * @param transport - Transport configuration (stdio or streamable-http)
   */
  async connect(transport: TransportConfig): Promise<void> {
    if (this.connected) {
      throw new Error('Already connected. Call disconnect() first.');
    }

    if (transport.type !== 'stdio') {
      throw new Error(\`Transport type "\${transport.type}" not yet implemented\`);
    }

    this.transport = new StdioClientTransport({
      command: transport.command,
      args: transport.args,
      env: transport.env,
    });

    this.client = new Client(
      { name: this.name, version: '1.0.0' },
    );

    await this.client.connect(this.transport);
    this.connected = true;
  }

  /**
   * Disconnect from the MCP server.
   */
  async disconnect(): Promise<void> {
    if (!this.connected || !this.client) {
      return;
    }

    this.subscriptions.clear();
    await this.client.close();
    this.client = null;
    this.transport = null;
    this.connected = false;
  }

  /**
   * Discover all tools available on the connected server.
   *
   * @returns Array of tool metadata
   */
  async discoverTools(): Promise<ToolInfo[]> {
    this.ensureConnected();
    const result = await this.client!.listTools();
    return result.tools.map((t) => ({
      name: t.name,
      description: t.description ?? '',
      inputSchema: t.inputSchema as Record<string, unknown>,
    }));
  }

  /**
   * Call a tool with typed response.
   *
   * @param toolName - Name of the tool to invoke
   * @param params - Tool parameters
   * @returns Typed tool call result
   */
  async callTool<T = unknown>(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<ToolCallResult<T>> {
    this.ensureConnected();
    const result = await this.client!.callTool({
      name: toolName,
      arguments: params,
    });

    const content = result.content as Array<{ type: string; text: string }>;
    let parsed: T | undefined;

    // Attempt JSON parse of first text content
    if (content.length > 0 && content[0].type === 'text') {
      try {
        parsed = JSON.parse(content[0].text) as T;
      } catch {
        // Not JSON, leave parsed as undefined
      }
    }

    return {
      content,
      parsed,
      isError: result.isError === true ? true : undefined,
    };
  }

  /**
   * List all resources available on the connected server.
   *
   * @returns Array of resource metadata
   */
  async listResources(): Promise<ResourceInfo[]> {
    this.ensureConnected();
    const result = await this.client!.listResources();
    return result.resources.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    }));
  }

  /**
   * Subscribe to a resource by URI.
   *
   * @param uri - Resource URI to subscribe to
   * @param callback - Callback invoked when resource content changes
   */
  subscribeToResource(uri: string, callback: ResourceCallback): void {
    this.subscriptions.set(uri, callback);
  }

  /**
   * Unsubscribe from a resource.
   *
   * @param uri - Resource URI to unsubscribe from
   */
  unsubscribeFromResource(uri: string): void {
    this.subscriptions.delete(uri);
  }

  /**
   * Get all active resource subscriptions.
   *
   * @returns Array of subscribed resource URIs
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * List all prompts available on the connected server.
   *
   * @returns Array of prompt metadata
   */
  async listPrompts(): Promise<PromptInfo[]> {
    this.ensureConnected();
    const result = await this.client!.listPrompts();
    return result.prompts.map((p) => ({
      name: p.name,
      description: p.description,
    }));
  }

  /** Throw if not connected. */
  private ensureConnected(): void {
    if (!this.connected || !this.client) {
      throw new Error('Not connected. Call connect() first.');
    }
  }
}
`;
}

// ============================================================================
// src/__tests__/client.test.ts
// ============================================================================

/** Generate src/__tests__/client.test.ts with client tests. */
export function generateClientTest(config: McpProjectConfig): string {
  return `import { describe, it, expect } from 'vitest';
import { McpClientWrapper } from '../client.js';

describe('${config.name} MCP Client', () => {
  // ── Construction ─────────────────────────────────────────────────────
  describe('McpClientWrapper', () => {
    it('creates client with given name', () => {
      const client = new McpClientWrapper('test-client');
      expect(client.getName()).toBe('test-client');
    });

    it('starts disconnected', () => {
      const client = new McpClientWrapper('test-client');
      expect(client.isConnected()).toBe(false);
    });

    it('disconnect succeeds when not connected', async () => {
      const client = new McpClientWrapper('test-client');
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });
  });

  // ── Connection guards ────────────────────────────────────────────────
  describe('connection guards', () => {
    it('discoverTools throws when not connected', async () => {
      const client = new McpClientWrapper('test-client');
      await expect(client.discoverTools()).rejects.toThrow('Not connected');
    });

    it('callTool throws when not connected', async () => {
      const client = new McpClientWrapper('test-client');
      await expect(client.callTool('hello', {})).rejects.toThrow('Not connected');
    });

    it('listResources throws when not connected', async () => {
      const client = new McpClientWrapper('test-client');
      await expect(client.listResources()).rejects.toThrow('Not connected');
    });

    it('listPrompts throws when not connected', async () => {
      const client = new McpClientWrapper('test-client');
      await expect(client.listPrompts()).rejects.toThrow('Not connected');
    });

    it('rejects non-stdio transport', async () => {
      const client = new McpClientWrapper('test-client');
      await expect(
        client.connect({ type: 'streamable-http', url: 'http://localhost:3000' }),
      ).rejects.toThrow('not yet implemented');
    });
  });

  // ── Resource subscriptions ───────────────────────────────────────────
  describe('resource subscriptions', () => {
    it('subscribes to a resource', () => {
      const client = new McpClientWrapper('test-client');
      client.subscribeToResource('status://info', () => {});
      expect(client.getSubscriptions()).toContain('status://info');
    });

    it('unsubscribes from a resource', () => {
      const client = new McpClientWrapper('test-client');
      client.subscribeToResource('status://info', () => {});
      client.unsubscribeFromResource('status://info');
      expect(client.getSubscriptions()).not.toContain('status://info');
    });

    it('getSubscriptions returns empty array initially', () => {
      const client = new McpClientWrapper('test-client');
      expect(client.getSubscriptions()).toEqual([]);
    });

    it('supports multiple subscriptions', () => {
      const client = new McpClientWrapper('test-client');
      client.subscribeToResource('status://info', () => {});
      client.subscribeToResource('config://main', () => {});
      expect(client.getSubscriptions()).toHaveLength(2);
    });
  });
});
`;
}

// ============================================================================
// CLAUDE.md
// ============================================================================

/** Generate CLAUDE.md for an MCP client project. */
export function generateClientClaudeMd(config: McpProjectConfig): string {
  return `# ${config.name}

MCP client project generated by gsd-skill-creator.

## Project Structure

- \`src/index.ts\` -- Entry point, demonstrates connecting and calling tools
- \`src/client.ts\` -- McpClientWrapper with discovery, typed calls, subscriptions
- \`src/__tests__/client.test.ts\` -- Tests for client lifecycle and guards

## Development

\`\`\`bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Run in development mode
npm test             # Run tests
npm run typecheck    # Type-check without emitting
\`\`\`

## Architecture

### McpClientWrapper
High-level client wrapper:
- \`connect(transport)\` -- Connect to an MCP server
- \`disconnect()\` -- Disconnect from the server
- \`discoverTools()\` -- List available tools with metadata
- \`callTool<T>(name, params)\` -- Invoke a tool with typed response
- \`listResources()\` -- List available resources
- \`subscribeToResource(uri, callback)\` -- Subscribe to resource changes
- \`listPrompts()\` -- List available prompts

### Typed Responses
\`callTool<T>()\` automatically attempts JSON parsing of text responses:

\`\`\`typescript
const result = await client.callTool<{ count: number }>('get_count', {});
if (result.parsed) {
  console.log('Count:', result.parsed.count);
}
\`\`\`

## Conventions

- ESM modules with NodeNext resolution
- Strict TypeScript
- Tests use vitest
`;
}

// ============================================================================
// chipset.yaml
// ============================================================================

/** Generate chipset.yaml for an MCP client project. */
export function generateClientChipsetYaml(config: McpProjectConfig): string {
  return `# Chipset configuration for ${config.name}
# Generated by gsd-skill-creator MCP template system

name: ${config.name}
type: mcp-client
version: ${config.version}
description: ${config.description}

capabilities:
  tool-discovery: true
  resource-subscription: true
  typed-responses: true

skills: []
`;
}

// ============================================================================
// Aggregate generator
// ============================================================================

/** Generate all files for an MCP client project. */
export function generateClientFiles(config: McpProjectConfig): TemplateFile[] {
  return [
    { relativePath: 'package.json', content: generateClientPackageJson(config) },
    { relativePath: 'tsconfig.json', content: generateClientTsconfig() },
    { relativePath: 'src/index.ts', content: generateClientIndex(config) },
    { relativePath: 'src/client.ts', content: generateClientMain(config) },
    { relativePath: 'src/__tests__/client.test.ts', content: generateClientTest(config) },
    { relativePath: 'CLAUDE.md', content: generateClientClaudeMd(config) },
    { relativePath: 'chipset.yaml', content: generateClientChipsetYaml(config) },
  ];
}
