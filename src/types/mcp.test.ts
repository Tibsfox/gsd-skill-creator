import { describe, it, expect } from 'vitest';
import {
  TransportConfigSchema,
  ToolSchema,
  ResourceSchema,
  PromptSchema,
  ServerCapabilitySchema,
  McpMessageSchema,
  TraceEventSchema,
  TrustStateSchema,
  HashRecordSchema,
  ValidationResultSchema,
} from './mcp.js';

// ============================================================================
// TransportConfig schema
// ============================================================================

describe('TransportConfigSchema', () => {
  it('should parse a valid stdio config', () => {
    const data = {
      type: 'stdio',
      command: 'node',
      args: ['server.js'],
      env: { NODE_ENV: 'production' },
    };
    const result = TransportConfigSchema.parse(data);
    expect(result.type).toBe('stdio');
    expect(result.command).toBe('node');
  });

  it('should parse a valid streamable-http config', () => {
    const data = {
      type: 'streamable-http',
      url: 'https://mcp.example.com/v1',
      headers: { Authorization: 'Bearer token123' },
    };
    const result = TransportConfigSchema.parse(data);
    expect(result.type).toBe('streamable-http');
    expect(result.url).toBe('https://mcp.example.com/v1');
  });

  it('should reject a config with missing type', () => {
    const data = { command: 'node' };
    expect(() => TransportConfigSchema.parse(data)).toThrow();
  });
});

// ============================================================================
// Tool, Resource, Prompt schemas
// ============================================================================

describe('ToolSchema', () => {
  it('should parse a valid tool with name, description, and inputSchema', () => {
    const data = {
      name: 'read_file',
      description: 'Read a file from disk',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
      },
    };
    const result = ToolSchema.parse(data);
    expect(result.name).toBe('read_file');
    expect(result.description).toBe('Read a file from disk');
  });
});

describe('ResourceSchema', () => {
  it('should parse a valid resource with optional fields omitted', () => {
    const data = { uri: 'file:///tmp/data.json', name: 'data' };
    const result = ResourceSchema.parse(data);
    expect(result.uri).toBe('file:///tmp/data.json');
    expect(result.description).toBeUndefined();
    expect(result.mimeType).toBeUndefined();
  });

  it('should parse a resource with all fields', () => {
    const data = {
      uri: 'file:///tmp/data.json',
      name: 'data',
      description: 'JSON data file',
      mimeType: 'application/json',
    };
    const result = ResourceSchema.parse(data);
    expect(result.mimeType).toBe('application/json');
  });
});

describe('PromptSchema', () => {
  it('should parse a valid prompt with arguments array', () => {
    const data = {
      name: 'summarize',
      description: 'Summarize a document',
      arguments: [
        { name: 'text', description: 'The text to summarize', required: true },
        { name: 'maxLength', required: false },
      ],
    };
    const result = PromptSchema.parse(data);
    expect(result.name).toBe('summarize');
    expect(result.arguments).toHaveLength(2);
  });
});

// ============================================================================
// ServerCapability schema
// ============================================================================

describe('ServerCapabilitySchema', () => {
  it('should parse a full capability object', () => {
    const data = {
      tools: [
        { name: 'read_file', description: 'Read file', inputSchema: {} },
      ],
      resources: [
        { uri: 'file:///data', name: 'data' },
      ],
      prompts: [
        { name: 'help' },
      ],
      serverName: 'test-server',
      serverVersion: '1.0.0',
    };
    const result = ServerCapabilitySchema.parse(data);
    expect(result.tools).toHaveLength(1);
    expect(result.resources).toHaveLength(1);
    expect(result.prompts).toHaveLength(1);
    expect(result.serverName).toBe('test-server');
  });
});

// ============================================================================
// McpMessage schema
// ============================================================================

describe('McpMessageSchema', () => {
  it('should parse a valid JSON-RPC request', () => {
    const data = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: { cursor: null },
    };
    const result = McpMessageSchema.parse(data);
    expect(result.jsonrpc).toBe('2.0');
    expect(result.method).toBe('tools/list');
  });

  it('should parse a valid JSON-RPC response with result', () => {
    const data = {
      jsonrpc: '2.0',
      id: 1,
      result: { tools: [] },
    };
    const result = McpMessageSchema.parse(data);
    expect(result.result).toEqual({ tools: [] });
    expect(result.method).toBeUndefined();
  });

  it('should parse a valid JSON-RPC error response', () => {
    const data = {
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32600, message: 'Invalid Request' },
    };
    const result = McpMessageSchema.parse(data);
    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe(-32600);
    expect(result.error!.message).toBe('Invalid Request');
  });
});

// ============================================================================
// TraceEvent schema
// ============================================================================

describe('TraceEventSchema', () => {
  it('should parse an outgoing trace event without latencyMs', () => {
    const data = {
      id: 'trace-001',
      timestamp: Date.now(),
      serverId: 'server-a',
      method: 'tools/call',
      direction: 'outgoing',
      payload: { tool: 'read_file' },
    };
    const result = TraceEventSchema.parse(data);
    expect(result.direction).toBe('outgoing');
    expect(result.latencyMs).toBeUndefined();
  });

  it('should parse an incoming trace event with latencyMs', () => {
    const data = {
      id: 'trace-002',
      timestamp: Date.now(),
      serverId: 'server-a',
      method: 'tools/call',
      direction: 'incoming',
      latencyMs: 42,
    };
    const result = TraceEventSchema.parse(data);
    expect(result.direction).toBe('incoming');
    expect(result.latencyMs).toBe(42);
  });
});

// ============================================================================
// TrustState schema
// ============================================================================

describe('TrustStateSchema', () => {
  it('should parse each valid enum value and reject invalid ones', () => {
    expect(TrustStateSchema.parse('quarantine')).toBe('quarantine');
    expect(TrustStateSchema.parse('provisional')).toBe('provisional');
    expect(TrustStateSchema.parse('trusted')).toBe('trusted');
    expect(TrustStateSchema.parse('suspended')).toBe('suspended');
    expect(() => TrustStateSchema.parse('unknown')).toThrow();
  });
});

// ============================================================================
// HashRecord schema
// ============================================================================

describe('HashRecordSchema', () => {
  it('should parse a valid hash record', () => {
    const data = {
      serverId: 'server-a',
      hash: 'abc123def456',
      toolCount: 5,
      computedAt: Date.now(),
    };
    const result = HashRecordSchema.parse(data);
    expect(result.serverId).toBe('server-a');
    expect(result.toolCount).toBe(5);
    expect(result.previousHash).toBeUndefined();
  });

  it('should reject a hash record missing required fields', () => {
    const data = { serverId: 'server-a' };
    expect(() => HashRecordSchema.parse(data)).toThrow();
  });
});

// ============================================================================
// ValidationResult schema
// ============================================================================

describe('ValidationResultSchema', () => {
  it('should parse a blocking critical validation result', () => {
    const data = {
      valid: false,
      blocked: true,
      reason: 'Tool definition changed since approval',
      rule: 'hash-drift',
      severity: 'critical',
    };
    const result = ValidationResultSchema.parse(data);
    expect(result.blocked).toBe(true);
    expect(result.severity).toBe('critical');
  });

  it('should parse a non-blocking info validation result', () => {
    const data = {
      valid: true,
      blocked: false,
      severity: 'info',
    };
    const result = ValidationResultSchema.parse(data);
    expect(result.valid).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.reason).toBeUndefined();
    expect(result.rule).toBeUndefined();
  });
});
