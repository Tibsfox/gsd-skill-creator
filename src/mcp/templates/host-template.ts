/**
 * MCP Host template file generators.
 *
 * Each function takes an McpProjectConfig and returns the string content for
 * one file in the generated host project. The host manages multiple MCP server
 * connections with a client pool, lifecycle management, transport abstraction,
 * and approval gates.
 *
 * @module mcp/templates/host-template
 */

import type { McpProjectConfig, TemplateFile } from './types.js';

// ============================================================================
// Package.json
// ============================================================================

/** Generate package.json for an MCP host project. */
export function generateHostPackageJson(config: McpProjectConfig): string {
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

/** Generate tsconfig.json for an MCP host project. */
export function generateHostTsconfig(): string {
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

/** Generate src/index.ts entry point for an MCP host project. */
export function generateHostIndex(config: McpProjectConfig): string {
  return `#!/usr/bin/env node
/**
 * ${config.name} -- MCP host entry point.
 *
 * Demonstrates connecting to MCP servers, managing their lifecycle,
 * and routing tool calls through approval gates.
 */

import { ServerPool } from './host.js';

async function main(): Promise<void> {
  const pool = new ServerPool('${config.name}');

  console.log('${config.name} host ready');
  console.log('Use pool.connectServer() to add MCP server connections');

  // Example: Connect to a server (uncomment and configure)
  // const id = await pool.connectServer({
  //   type: 'stdio',
  //   command: 'node',
  //   args: ['path/to/server/dist/index.js'],
  // });
  // console.log('Connected server:', id);

  // Keep the process alive
  process.on('SIGINT', async () => {
    await pool.disconnectAll();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
`;
}

// ============================================================================
// src/host.ts (main host logic)
// ============================================================================

/** Generate src/host.ts with ServerPool, lifecycle management, and approval gates. */
export function generateHostMain(config: McpProjectConfig): string {
  return `/**
 * ${config.name} MCP host implementation.
 *
 * Manages a pool of MCP server connections with:
 * - Client pool for concurrent server management
 * - Lifecycle management (connect, disconnect, reconnect)
 * - Transport abstraction (stdio and streamable-http)
 * - Approval gates for tool invocations
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

/** Approval gate interface for controlling tool invocations. */
export interface ApprovalGate {
  /**
   * Request approval before executing a tool invocation.
   *
   * @param serverId - ID of the server providing the tool
   * @param toolName - Name of the tool being invoked
   * @param params - Tool invocation parameters
   * @returns true if approved, false if denied
   */
  requestApproval(
    serverId: string,
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<boolean>;
}

/** Information about a connected server. */
export interface ServerInfo {
  id: string;
  name: string;
  version: string;
  transport: TransportConfig;
  tools: string[];
  resources: string[];
  prompts: string[];
  connectedAt: number;
}

/** Result from a tool invocation. */
export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

// ── Default Approval Gate ──────────────────────────────────────────────

/** Default approval gate that approves all invocations. */
export class AutoApproveGate implements ApprovalGate {
  async requestApproval(
    _serverId: string,
    _toolName: string,
    _params: Record<string, unknown>,
  ): Promise<boolean> {
    return true;
  }
}

// ── Server Pool ────────────────────────────────────────────────────────

/**
 * Manages a pool of MCP server connections.
 *
 * Provides lifecycle management, tool routing, and approval gates
 * for multiple concurrent MCP server connections.
 */
export class ServerPool {
  private readonly name: string;
  private readonly clients = new Map<string, Client>();
  private readonly serverInfo = new Map<string, ServerInfo>();
  private readonly transports = new Map<string, StdioClientTransport>();
  private approvalGate: ApprovalGate;
  private nextId = 1;

  constructor(name: string, approvalGate?: ApprovalGate) {
    this.name = name;
    this.approvalGate = approvalGate ?? new AutoApproveGate();
  }

  /** Set a custom approval gate for tool invocations. */
  setApprovalGate(gate: ApprovalGate): void {
    this.approvalGate = gate;
  }

  /** Get the pool name. */
  getName(): string {
    return this.name;
  }

  /**
   * Connect to an MCP server using the provided transport configuration.
   *
   * @param transport - Transport configuration (stdio or streamable-http)
   * @returns Server ID for future reference
   */
  async connectServer(transport: TransportConfig): Promise<string> {
    const id = \`server-\${this.nextId++}\`;

    if (transport.type !== 'stdio') {
      throw new Error(\`Transport type "\${transport.type}" not yet implemented\`);
    }

    const clientTransport = new StdioClientTransport({
      command: transport.command,
      args: transport.args,
      env: transport.env,
    });

    const client = new Client(
      { name: \`\${this.name}/\${id}\`, version: '1.0.0' },
    );

    await client.connect(clientTransport);

    // Discover capabilities
    const version = client.getServerVersion();
    const toolsResult = await client.listTools();
    const resourcesResult = await client.listResources();
    const promptsResult = await client.listPrompts();

    const info: ServerInfo = {
      id,
      name: version?.name ?? 'unknown',
      version: version?.version ?? '0.0.0',
      transport,
      tools: toolsResult.tools.map((t) => t.name),
      resources: resourcesResult.resources.map((r) => r.uri),
      prompts: promptsResult.prompts.map((p) => p.name),
      connectedAt: Date.now(),
    };

    this.clients.set(id, client);
    this.serverInfo.set(id, info);
    this.transports.set(id, clientTransport);

    return id;
  }

  /**
   * Disconnect a server by ID.
   *
   * @param serverId - Server ID to disconnect
   */
  async disconnectServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(\`Server not found: \${serverId}\`);
    }

    await client.close();
    this.clients.delete(serverId);
    this.serverInfo.delete(serverId);
    this.transports.delete(serverId);
  }

  /** Disconnect all servers. */
  async disconnectAll(): Promise<void> {
    const ids = Array.from(this.clients.keys());
    await Promise.all(ids.map((id) => this.disconnectServer(id)));
  }

  /**
   * Invoke a tool on a specific server, subject to approval gate.
   *
   * @param serverId - Server providing the tool
   * @param toolName - Tool to invoke
   * @param params - Tool parameters
   * @returns Tool result
   */
  async invokeTool(
    serverId: string,
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<ToolResult> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(\`Server not found: \${serverId}\`);
    }

    // Check approval gate
    const approved = await this.approvalGate.requestApproval(serverId, toolName, params);
    if (!approved) {
      return {
        content: [{ type: 'text', text: \`Tool invocation denied by approval gate: \${toolName}\` }],
        isError: true,
      };
    }

    const result = await client.callTool({ name: toolName, arguments: params });
    return result as ToolResult;
  }

  /** List all connected servers. */
  listServers(): ServerInfo[] {
    return Array.from(this.serverInfo.values());
  }

  /** Get info about a specific server. */
  getServer(serverId: string): ServerInfo | undefined {
    return this.serverInfo.get(serverId);
  }

  /** Get the number of connected servers. */
  get size(): number {
    return this.clients.size;
  }
}
`;
}

// ============================================================================
// src/__tests__/host.test.ts
// ============================================================================

/** Generate src/__tests__/host.test.ts with host tests. */
export function generateHostTest(config: McpProjectConfig): string {
  return `import { describe, it, expect } from 'vitest';
import { ServerPool, AutoApproveGate } from '../host.js';
import type { ApprovalGate } from '../host.js';

describe('${config.name} MCP Host', () => {
  // ── ServerPool construction ──────────────────────────────────────────
  describe('ServerPool', () => {
    it('creates pool with given name', () => {
      const pool = new ServerPool('test-host');
      expect(pool.getName()).toBe('test-host');
    });

    it('starts with zero connected servers', () => {
      const pool = new ServerPool('test-host');
      expect(pool.size).toBe(0);
    });

    it('listServers returns empty array initially', () => {
      const pool = new ServerPool('test-host');
      expect(pool.listServers()).toEqual([]);
    });

    it('getServer returns undefined for unknown ID', () => {
      const pool = new ServerPool('test-host');
      expect(pool.getServer('nonexistent')).toBeUndefined();
    });

    it('disconnectServer throws for unknown ID', async () => {
      const pool = new ServerPool('test-host');
      await expect(pool.disconnectServer('nonexistent')).rejects.toThrow('Server not found');
    });

    it('invokeTool throws for unknown server', async () => {
      const pool = new ServerPool('test-host');
      await expect(pool.invokeTool('nonexistent', 'tool', {})).rejects.toThrow('Server not found');
    });

    it('rejects non-stdio transport', async () => {
      const pool = new ServerPool('test-host');
      await expect(
        pool.connectServer({ type: 'streamable-http', url: 'http://localhost:3000' }),
      ).rejects.toThrow('not yet implemented');
    });
  });

  // ── AutoApproveGate ──────────────────────────────────────────────────
  describe('AutoApproveGate', () => {
    it('approves all requests', async () => {
      const gate = new AutoApproveGate();
      const result = await gate.requestApproval('server-1', 'some-tool', { key: 'value' });
      expect(result).toBe(true);
    });
  });

  // ── ApprovalGate integration ─────────────────────────────────────────
  describe('ApprovalGate', () => {
    it('accepts custom approval gate', () => {
      const customGate: ApprovalGate = {
        async requestApproval() { return false; },
      };
      const pool = new ServerPool('test-host', customGate);
      expect(pool.getName()).toBe('test-host');
    });

    it('setApprovalGate replaces the gate', () => {
      const pool = new ServerPool('test-host');
      const customGate: ApprovalGate = {
        async requestApproval() { return false; },
      };
      pool.setApprovalGate(customGate);
      // No throw means it was accepted
      expect(pool.getName()).toBe('test-host');
    });
  });

  // ── disconnectAll ────────────────────────────────────────────────────
  describe('disconnectAll', () => {
    it('succeeds with no servers', async () => {
      const pool = new ServerPool('test-host');
      await pool.disconnectAll();
      expect(pool.size).toBe(0);
    });
  });
});
`;
}

// ============================================================================
// CLAUDE.md
// ============================================================================

/** Generate CLAUDE.md for an MCP host project. */
export function generateHostClaudeMd(config: McpProjectConfig): string {
  return `# ${config.name}

MCP host project generated by gsd-skill-creator.

## Project Structure

- \`src/index.ts\` -- Entry point, demonstrates server connection management
- \`src/host.ts\` -- ServerPool with client pool, lifecycle, and approval gates
- \`src/__tests__/host.test.ts\` -- Tests for pool and approval logic

## Development

\`\`\`bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Run in development mode
npm test             # Run tests
npm run typecheck    # Type-check without emitting
\`\`\`

## Architecture

### ServerPool
Manages multiple MCP server connections:
- \`connectServer(transport)\` -- Connect to an MCP server
- \`disconnectServer(id)\` -- Disconnect a specific server
- \`disconnectAll()\` -- Disconnect all servers
- \`invokeTool(serverId, toolName, params)\` -- Call a tool through approval gate
- \`listServers()\` -- List all connected servers

### ApprovalGate
Interface for controlling tool invocations:
- \`requestApproval(serverId, toolName, params)\` -- Returns true/false
- Default: \`AutoApproveGate\` approves all requests
- Custom gates can implement deny logic, logging, rate limiting

### Transport Abstraction
Supports stdio and streamable-http transport configurations.
Stdio spawns a child process; HTTP connects to a remote server.

## Conventions

- ESM modules with NodeNext resolution
- Strict TypeScript
- Tests use vitest
`;
}

// ============================================================================
// chipset.yaml
// ============================================================================

/** Generate chipset.yaml for an MCP host project. */
export function generateHostChipsetYaml(config: McpProjectConfig): string {
  return `# Chipset configuration for ${config.name}
# Generated by gsd-skill-creator MCP template system

name: ${config.name}
type: mcp-host
version: ${config.version}
description: ${config.description}

capabilities:
  client-pool: true
  lifecycle-management: true
  approval-gates: true

transports:
  - stdio
  - streamable-http

skills: []
`;
}

// ============================================================================
// Aggregate generator
// ============================================================================

/** Generate all files for an MCP host project. */
export function generateHostFiles(config: McpProjectConfig): TemplateFile[] {
  return [
    { relativePath: 'package.json', content: generateHostPackageJson(config) },
    { relativePath: 'tsconfig.json', content: generateHostTsconfig() },
    { relativePath: 'src/index.ts', content: generateHostIndex(config) },
    { relativePath: 'src/host.ts', content: generateHostMain(config) },
    { relativePath: 'src/__tests__/host.test.ts', content: generateHostTest(config) },
    { relativePath: 'CLAUDE.md', content: generateHostClaudeMd(config) },
    { relativePath: 'chipset.yaml', content: generateHostChipsetYaml(config) },
  ];
}
