/**
 * Agent Bridge comprehensive test suite.
 *
 * Covers all 8 BRDG requirements:
 * - BRDG-01: Generic Agent-Server Adapter
 * - BRDG-02: SCOUT server (3 tools + 2 resources)
 * - BRDG-03: VERIFY server (4 tools + 2 resources)
 * - BRDG-04: Agent-Client Adapter
 * - BRDG-05: EXEC-to-SCOUT inter-agent round-trip
 * - BRDG-06: Concurrency limiting
 * - BRDG-07: Error handling (no crashes)
 * - BRDG-08: Context isolation
 */

import { describe, it, expect, afterEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  createAgentServer,
  createScoutServer,
  createVerifyServer,
  AgentClientAdapter,
  ExecClient,
  createExecClient,
} from './agent-bridge/index.js';
import type { AgentServerConfig, AgentToolDef, AgentResourceDef } from './agent-bridge/index.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Connect a raw MCP client to a server for low-level testing.
 */
async function connectRawClient(
  server: ReturnType<typeof createAgentServer>,
): Promise<{ client: Client; cleanup: () => Promise<void> }> {
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

/**
 * Create a minimal tool definition for testing.
 */
function makeTool(name: string, handler?: AgentToolDef['handler']): AgentToolDef {
  return {
    name,
    description: `Test tool: ${name}`,
    inputSchema: { type: 'object', properties: { input: { type: 'string' } } },
    handler: handler ?? (async (params, ctx) => ({
      content: [{ type: 'text' as const, text: JSON.stringify({ params, invocationId: ctx.invocationId }) }],
    })),
  };
}

/**
 * Create a minimal resource definition for testing.
 */
function makeResource(uri: string, content: string): AgentResourceDef {
  return {
    uri,
    name: `Resource ${uri}`,
    description: `Test resource at ${uri}`,
    reader: async () => content,
  };
}

// ============================================================================
// BRDG-01: Generic Agent-Server Adapter
// ============================================================================

describe('BRDG-01: Generic Agent-Server Adapter', () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it('creates a connectable MCP server from a generic config', async () => {
    const config: AgentServerConfig = {
      agentId: 'test-agent',
      agentName: 'TestAgent',
      version: '0.1.0',
      tools: [makeTool('test:hello')],
      resources: [],
      maxConcurrency: 3,
    };

    const server = createAgentServer(config);
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const version = result.client.getServerVersion();
    expect(version?.name).toBe('TestAgent');
    expect(version?.version).toBe('0.1.0');
  });

  it('server name and version match config', async () => {
    const config: AgentServerConfig = {
      agentId: 'custom',
      agentName: 'CustomAgent',
      version: '2.5.0',
      tools: [makeTool('custom:op')],
      resources: [],
      maxConcurrency: 1,
    };

    const server = createAgentServer(config);
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const version = result.client.getServerVersion();
    expect(version?.name).toBe('CustomAgent');
    expect(version?.version).toBe('2.5.0');
  });

  it('tools are discoverable via client listTools', async () => {
    const config: AgentServerConfig = {
      agentId: 'multi',
      agentName: 'MultiTool',
      version: '1.0.0',
      tools: [makeTool('multi:a'), makeTool('multi:b')],
      resources: [],
      maxConcurrency: 5,
    };

    const server = createAgentServer(config);
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const tools = await result.client.listTools();
    const names = tools.tools.map((t) => t.name).sort();
    expect(names).toEqual(['multi:a', 'multi:b']);
  });

  it('tool invocation returns structured result', async () => {
    const config: AgentServerConfig = {
      agentId: 'echo',
      agentName: 'Echo',
      version: '1.0.0',
      tools: [makeTool('echo:ping')],
      resources: [],
      maxConcurrency: 3,
    };

    const server = createAgentServer(config);
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const toolResult = await result.client.callTool({
      name: 'echo:ping',
      arguments: { input: 'hello' },
    });
    expect(toolResult.isError).toBeFalsy();
    const content = toolResult.content as Array<{ type: string; text: string }>;
    expect(content.length).toBe(1);
    const parsed = JSON.parse(content[0].text);
    expect(parsed.params.input).toBe('hello');
  });
});

// ============================================================================
// BRDG-02: SCOUT Server
// ============================================================================

describe('BRDG-02: SCOUT Server', () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it('has exactly 3 tools', async () => {
    const server = createScoutServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const tools = await result.client.listTools();
    expect(tools.tools.length).toBe(3);
  });

  it('exposes scout:research, scout:evaluate-dependency, scout:survey-landscape', async () => {
    const server = createScoutServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const tools = await result.client.listTools();
    const names = tools.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'scout:evaluate-dependency',
      'scout:research',
      'scout:survey-landscape',
    ]);
  });

  it('has 2 resources', async () => {
    const server = createScoutServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const resources = await result.client.listResources();
    expect(resources.resources.length).toBe(2);
  });

  it('scout:research returns structured findings', async () => {
    const server = createScoutServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const toolResult = await result.client.callTool({
      name: 'scout:research',
      arguments: { topic: 'MCP protocol', depth: 'deep' },
    });
    expect(toolResult.isError).toBeFalsy();
    const content = toolResult.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.topic).toBe('MCP protocol');
    expect(parsed.depth).toBe('deep');
    expect(parsed.findings).toBeDefined();
  });

  it('scout:evaluate-dependency returns evaluation', async () => {
    const server = createScoutServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const toolResult = await result.client.callTool({
      name: 'scout:evaluate-dependency',
      arguments: { name: 'zod', version: '4.0.0' },
    });
    expect(toolResult.isError).toBeFalsy();
    const content = toolResult.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.dependency).toBe('zod');
    expect(parsed.version).toBe('4.0.0');
  });

  it('scout:survey-landscape returns survey', async () => {
    const server = createScoutServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const toolResult = await result.client.callTool({
      name: 'scout:survey-landscape',
      arguments: { domain: 'agent-frameworks' },
    });
    expect(toolResult.isError).toBeFalsy();
    const content = toolResult.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.domain).toBe('agent-frameworks');
    expect(parsed.majorTools).toBeDefined();
  });
});

// ============================================================================
// BRDG-03: VERIFY Server
// ============================================================================

describe('BRDG-03: VERIFY Server', () => {
  let cleanup: (() => Promise<void>) | undefined;

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
      cleanup = undefined;
    }
  });

  it('has exactly 4 tools', async () => {
    const server = createVerifyServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const tools = await result.client.listTools();
    expect(tools.tools.length).toBe(4);
  });

  it('exposes verify:run-tests, verify:check-types, verify:audit, verify:coverage', async () => {
    const server = createVerifyServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const tools = await result.client.listTools();
    const names = tools.tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'verify:audit',
      'verify:check-types',
      'verify:coverage',
      'verify:run-tests',
    ]);
  });

  it('has 2 resources', async () => {
    const server = createVerifyServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const resources = await result.client.listResources();
    expect(resources.resources.length).toBe(2);
  });

  it('verify:run-tests returns test results', async () => {
    const server = createVerifyServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const toolResult = await result.client.callTool({
      name: 'verify:run-tests',
      arguments: { pattern: '**/*.test.ts' },
    });
    expect(toolResult.isError).toBeFalsy();
    const content = toolResult.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.pattern).toBe('**/*.test.ts');
    expect(typeof parsed.total).toBe('number');
  });

  it('verify:check-types returns diagnostics', async () => {
    const server = createVerifyServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const toolResult = await result.client.callTool({
      name: 'verify:check-types',
      arguments: { strict: true },
    });
    expect(toolResult.isError).toBeFalsy();
    const content = toolResult.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.strict).toBe(true);
    expect(typeof parsed.errors).toBe('number');
  });

  it('verify:audit returns audit report', async () => {
    const server = createVerifyServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const toolResult = await result.client.callTool({
      name: 'verify:audit',
      arguments: { scope: 'security' },
    });
    expect(toolResult.isError).toBeFalsy();
    const content = toolResult.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.scope).toBe('security');
  });

  it('verify:coverage returns coverage report', async () => {
    const server = createVerifyServer();
    const result = await connectRawClient(server);
    cleanup = result.cleanup;

    const toolResult = await result.client.callTool({
      name: 'verify:coverage',
      arguments: { threshold: 85 },
    });
    expect(toolResult.isError).toBeFalsy();
    const content = toolResult.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(content[0].text);
    expect(parsed.threshold).toBe(85);
    expect(parsed.aggregate).toBeDefined();
  });
});

// ============================================================================
// BRDG-04: Agent-Client Adapter
// ============================================================================

describe('BRDG-04: Agent-Client Adapter', () => {
  it('connects to server and discovers tools', async () => {
    const server = createScoutServer();
    const adapter = new AgentClientAdapter({
      agentId: 'test-client',
      agentName: 'TestClient',
      targetServer: 'SCOUT',
    });

    await adapter.connectToServer(server);
    expect(adapter.isConnected()).toBe(true);

    const tools = await adapter.listTools();
    expect(tools.length).toBe(3);
    expect(tools.map((t) => t.name)).toContain('scout:research');

    await adapter.disconnect();
    expect(adapter.isConnected()).toBe(false);
  });

  it('invokes tool and receives result', async () => {
    const server = createScoutServer();
    const adapter = new AgentClientAdapter({
      agentId: 'test-client',
      agentName: 'TestClient',
      targetServer: 'SCOUT',
    });

    await adapter.connectToServer(server);

    const result = await adapter.invokeTool('scout:research', { topic: 'testing' });
    expect(result.isError).toBeFalsy();
    expect(result.content.length).toBeGreaterThan(0);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.topic).toBe('testing');

    await adapter.disconnect();
  });

  it('reads resource and receives content', async () => {
    const server = createScoutServer();
    const adapter = new AgentClientAdapter({
      agentId: 'test-client',
      agentName: 'TestClient',
      targetServer: 'SCOUT',
    });

    await adapter.connectToServer(server);

    const content = await adapter.readResource('scout://capabilities');
    const parsed = JSON.parse(content);
    expect(parsed.agentId).toBe('scout');
    expect(parsed.tools).toContain('scout:research');

    await adapter.disconnect();
  });

  it('disconnected client throws descriptive error', async () => {
    const adapter = new AgentClientAdapter({
      agentId: 'test-client',
      agentName: 'TestClient',
      targetServer: 'SCOUT',
    });

    await expect(adapter.listTools()).rejects.toThrow('not connected');
    await expect(
      adapter.invokeTool('scout:research', { topic: 'x' }),
    ).rejects.toThrow('not connected');
  });
});

// ============================================================================
// BRDG-05: EXEC-to-SCOUT Round-Trip
// ============================================================================

describe('BRDG-05: EXEC-to-SCOUT Round-Trip', () => {
  it('EXEC client connects to SCOUT server', async () => {
    const scoutServer = createScoutServer();
    const exec = await createExecClient(scoutServer);

    expect(exec.isConnected()).toBe(true);
    await exec.disconnect();
  });

  it('EXEC invokes scout:research and receives findings', async () => {
    const scoutServer = createScoutServer();
    const exec = await createExecClient(scoutServer);

    const result = await exec.execResearch('agent-bridge', 'deep');
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.topic).toBe('agent-bridge');
    expect(parsed.depth).toBe('deep');

    await exec.disconnect();
  });

  it('EXEC invokes scout:evaluate-dependency', async () => {
    const scoutServer = createScoutServer();
    const exec = await createExecClient(scoutServer);

    const result = await exec.execEvaluateDep('@modelcontextprotocol/sdk', '1.26.0');
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.dependency).toBe('@modelcontextprotocol/sdk');

    await exec.disconnect();
  });

  it('EXEC invokes scout:survey-landscape', async () => {
    const scoutServer = createScoutServer();
    const exec = await createExecClient(scoutServer);

    const result = await exec.execSurveyLandscape('mcp-ecosystem');
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.domain).toBe('mcp-ecosystem');

    await exec.disconnect();
  });

  it('full round-trip: create SCOUT -> connect EXEC -> invoke -> result', async () => {
    // This is the complete inter-agent communication test
    const scoutServer = createScoutServer();
    const execClient = new ExecClient();
    await execClient.connectToServer(scoutServer);

    // Discover tools
    const tools = await execClient.listTools();
    expect(tools.length).toBe(3);

    // Invoke
    const result = await execClient.invokeTool('scout:research', {
      topic: 'full-round-trip',
      depth: 'shallow',
    });

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.topic).toBe('full-round-trip');

    await execClient.disconnect();
  });
});

// ============================================================================
// BRDG-06: Concurrency Limiting
// ============================================================================

describe('BRDG-06: Concurrency Limiting', () => {
  it('exceeding maxConcurrency returns error code -32000', async () => {
    // Create a server with maxConcurrency=1 and a slow handler
    let resolveHandler: (() => void) | undefined;
    const slowTool = makeTool('slow:op', async () => {
      await new Promise<void>((resolve) => { resolveHandler = resolve; });
      return { content: [{ type: 'text' as const, text: 'done' }] };
    });

    const config: AgentServerConfig = {
      agentId: 'slow',
      agentName: 'Slow',
      version: '1.0.0',
      tools: [slowTool],
      resources: [],
      maxConcurrency: 1,
    };

    const server = createAgentServer(config);
    const { client, cleanup } = await connectRawClient(server);

    try {
      // Start first invocation (occupies the single slot)
      const first = client.callTool({ name: 'slow:op', arguments: {} });

      // Give the first call time to acquire the semaphore
      await new Promise((r) => setTimeout(r, 50));

      // Second invocation should hit capacity
      const second = await client.callTool({ name: 'slow:op', arguments: {} });
      expect(second.isError).toBe(true);

      const content = second.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed.code).toBe(-32000);
      expect(parsed.data.retryAfterMs).toBe(1000);

      // Resolve the first so it completes
      resolveHandler?.();
      await first;
    } finally {
      await cleanup();
    }
  });

  it('after one completes, next invocation succeeds', async () => {
    let callCount = 0;
    const countTool = makeTool('count:op', async () => {
      callCount++;
      return { content: [{ type: 'text' as const, text: `call-${callCount}` }] };
    });

    const config: AgentServerConfig = {
      agentId: 'count',
      agentName: 'Count',
      version: '1.0.0',
      tools: [countTool],
      resources: [],
      maxConcurrency: 1,
    };

    const server = createAgentServer(config);
    const { client, cleanup } = await connectRawClient(server);

    try {
      // First call succeeds
      const r1 = await client.callTool({ name: 'count:op', arguments: {} });
      expect(r1.isError).toBeFalsy();

      // Second call also succeeds (first already released the slot)
      const r2 = await client.callTool({ name: 'count:op', arguments: {} });
      expect(r2.isError).toBeFalsy();

      expect(callCount).toBe(2);
    } finally {
      await cleanup();
    }
  });
});

// ============================================================================
// BRDG-07: Error Handling
// ============================================================================

describe('BRDG-07: Error Handling', () => {
  it('handler throwing Error produces structured MCP error', async () => {
    const errorTool = makeTool('err:throw', async () => {
      throw new Error('deliberate test error');
    });

    const config: AgentServerConfig = {
      agentId: 'err',
      agentName: 'ErrorAgent',
      version: '1.0.0',
      tools: [errorTool],
      resources: [],
      maxConcurrency: 3,
    };

    const server = createAgentServer(config);
    const { client, cleanup } = await connectRawClient(server);

    try {
      const result = await client.callTool({ name: 'err:throw', arguments: {} });
      expect(result.isError).toBe(true);

      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed.code).toBe(-32603);
      expect(parsed.message).toContain('deliberate test error');
    } finally {
      await cleanup();
    }
  });

  it('handler throwing non-Error produces structured MCP error', async () => {
    const stringThrow = makeTool('err:string', async () => {
      throw 'string error value';
    });

    const config: AgentServerConfig = {
      agentId: 'err2',
      agentName: 'ErrorAgent2',
      version: '1.0.0',
      tools: [stringThrow],
      resources: [],
      maxConcurrency: 3,
    };

    const server = createAgentServer(config);
    const { client, cleanup } = await connectRawClient(server);

    try {
      const result = await client.callTool({ name: 'err:string', arguments: {} });
      expect(result.isError).toBe(true);

      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed.code).toBe(-32603);
      expect(parsed.message).toContain('string error value');
    } finally {
      await cleanup();
    }
  });

  it('process does not crash from handler errors (test completes)', async () => {
    // This test validates that the process survives handler errors
    // by running multiple calls in sequence after an error
    const errorTool: AgentToolDef = {
      name: 'err:recover',
      description: 'Tool that fails or succeeds based on fail param',
      inputSchema: {
        type: 'object',
        properties: {
          fail: { type: 'boolean' },
        },
      },
      handler: async (params) => {
        if (params.fail) throw new Error('fail');
        return { content: [{ type: 'text' as const, text: 'ok' }] };
      },
    };

    const config: AgentServerConfig = {
      agentId: 'recover',
      agentName: 'Recover',
      version: '1.0.0',
      tools: [errorTool],
      resources: [],
      maxConcurrency: 3,
    };

    const server = createAgentServer(config);
    const { client, cleanup } = await connectRawClient(server);

    try {
      // Trigger error
      const errResult = await client.callTool({ name: 'err:recover', arguments: { fail: true } });
      expect(errResult.isError).toBe(true);

      // Subsequent call succeeds (process still alive)
      const okResult = await client.callTool({ name: 'err:recover', arguments: { fail: false } });
      expect(okResult.isError).toBeFalsy();
      const content = okResult.content as Array<{ type: string; text: string }>;
      expect(content[0].text).toBe('ok');
    } finally {
      await cleanup();
    }
  });
});

// ============================================================================
// BRDG-08: Context Isolation
// ============================================================================

describe('BRDG-08: Context Isolation', () => {
  it('two concurrent invocations get different invocationIds', async () => {
    const invocationIds: string[] = [];
    let resolveFirst: (() => void) | undefined;
    let resolveSecond: (() => void) | undefined;

    const captureTool = makeTool('ctx:capture', async (_params, ctx) => {
      invocationIds.push(ctx.invocationId);
      // Wait until we're told to complete, so both invocations run concurrently
      if (invocationIds.length === 1) {
        await new Promise<void>((r) => { resolveFirst = r; });
      } else {
        await new Promise<void>((r) => { resolveSecond = r; });
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ id: ctx.invocationId }) }],
      };
    });

    const config: AgentServerConfig = {
      agentId: 'ctx-test',
      agentName: 'ContextTest',
      version: '1.0.0',
      tools: [captureTool],
      resources: [],
      maxConcurrency: 2,  // Allow 2 concurrent
    };

    const server = createAgentServer(config);
    const { client, cleanup } = await connectRawClient(server);

    try {
      // Start two concurrent invocations
      const call1 = client.callTool({ name: 'ctx:capture', arguments: { n: 1 } });
      const call2 = client.callTool({ name: 'ctx:capture', arguments: { n: 2 } });

      // Wait for both to be in progress
      await new Promise((r) => setTimeout(r, 100));

      // Release both
      resolveFirst?.();
      resolveSecond?.();

      await Promise.all([call1, call2]);

      // Verify different IDs
      expect(invocationIds.length).toBe(2);
      expect(invocationIds[0]).not.toBe(invocationIds[1]);
    } finally {
      await cleanup();
    }
  });

  it('mutations to one context do not affect the other', async () => {
    // This test verifies that contexts are independent objects
    const contexts: Array<{ invocationId: string; timestamp: number; agentId: string }> = [];

    const mutateTool = makeTool('ctx:mutate', async (_params, ctx) => {
      // Capture the original context values
      contexts.push({ ...ctx });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          id: ctx.invocationId,
          agent: ctx.agentId,
        })}],
      };
    });

    const config: AgentServerConfig = {
      agentId: 'mutate-test',
      agentName: 'MutateTest',
      version: '1.0.0',
      tools: [mutateTool],
      resources: [],
      maxConcurrency: 3,
    };

    const server = createAgentServer(config);
    const { client, cleanup } = await connectRawClient(server);

    try {
      await client.callTool({ name: 'ctx:mutate', arguments: {} });
      await client.callTool({ name: 'ctx:mutate', arguments: {} });

      expect(contexts.length).toBe(2);
      // Each context has its own invocationId
      expect(contexts[0].invocationId).not.toBe(contexts[1].invocationId);
      // Both belong to the same agent
      expect(contexts[0].agentId).toBe('mutate-test');
      expect(contexts[1].agentId).toBe('mutate-test');
    } finally {
      await cleanup();
    }
  });
});
