import { describe, it, expect } from 'vitest';
import {
  mcpConnect,
  mcpDisconnect,
  mcpListServers,
  mcpInvokeTool,
  mcpGetTrace,
  mcpGetTrustState,
  type ServerInfo,
  type ToolCallResult,
} from './tauri-ipc-bridge.js';

// ---------------------------------------------------------------------------
// IPC function contracts (PRES-08)
// ---------------------------------------------------------------------------

describe('IPC function contracts', () => {
  it('mcpConnect is an async function that takes serverId and config', () => {
    expect(typeof mcpConnect).toBe('function');
    // Function has 2 parameters
    expect(mcpConnect.length).toBe(2);
  });

  it('mcpDisconnect is an async function that takes serverId', () => {
    expect(typeof mcpDisconnect).toBe('function');
    expect(mcpDisconnect.length).toBe(1);
  });

  it('mcpListServers is an async function with no required args', () => {
    expect(typeof mcpListServers).toBe('function');
    expect(mcpListServers.length).toBe(0);
  });

  it('mcpInvokeTool is an async function that takes toolName and params', () => {
    expect(typeof mcpInvokeTool).toBe('function');
    expect(mcpInvokeTool.length).toBe(2);
  });

  it('mcpGetTrace is an async function with optional count and serverId', () => {
    expect(typeof mcpGetTrace).toBe('function');
    // Parameters are optional so length may be 0
    expect(mcpGetTrace.length).toBeLessThanOrEqual(2);
  });

  it('mcpGetTrustState is an async function that takes serverId', () => {
    expect(typeof mcpGetTrustState).toBe('function');
    expect(mcpGetTrustState.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Non-Tauri environment behavior
// ---------------------------------------------------------------------------

describe('non-Tauri environment behavior', () => {
  it('mcpConnect throws "Tauri IPC not available" when not in Tauri context', async () => {
    await expect(
      mcpConnect('test', { type: 'stdio', command: 'node' }),
    ).rejects.toThrow('Tauri IPC not available');
  });

  it('mcpDisconnect throws "Tauri IPC not available"', async () => {
    await expect(mcpDisconnect('test')).rejects.toThrow('Tauri IPC not available');
  });

  it('mcpListServers throws "Tauri IPC not available"', async () => {
    await expect(mcpListServers()).rejects.toThrow('Tauri IPC not available');
  });

  it('mcpInvokeTool throws "Tauri IPC not available"', async () => {
    await expect(mcpInvokeTool('tool', {})).rejects.toThrow('Tauri IPC not available');
  });

  it('mcpGetTrace throws "Tauri IPC not available"', async () => {
    await expect(mcpGetTrace()).rejects.toThrow('Tauri IPC not available');
  });

  it('mcpGetTrustState throws "Tauri IPC not available"', async () => {
    await expect(mcpGetTrustState('test')).rejects.toThrow('Tauri IPC not available');
  });
});

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

describe('type exports', () => {
  it('ServerInfo type is exported (compile check via type annotation)', () => {
    const info: ServerInfo = {
      id: 'test',
      status: 'Connected',
      serverName: 'TestMCP',
      toolCount: 3,
      resourceCount: 1,
      promptCount: 0,
    };
    expect(info.id).toBe('test');
    expect(info.status).toBe('Connected');
  });

  it('ToolCallResult type is exported (compile check via type annotation)', () => {
    const result: ToolCallResult = {
      toolName: 'read-file',
      serverId: 'server-1',
      success: true,
      result: { content: 'hello' },
      error: null,
      latencyMs: 42,
    };
    expect(result.success).toBe(true);
    expect(result.latencyMs).toBe(42);
  });
});
