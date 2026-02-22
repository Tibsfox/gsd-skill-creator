import { describe, it, expect } from 'vitest';
import {
  renderBootPeripheral,
  renderBootPeripherals,
  renderBootPeripheralStyles,
  type BootPeripheralData,
} from './boot-peripherals.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePeripheral(overrides: Partial<BootPeripheralData> = {}): BootPeripheralData {
  return {
    serverId: overrides.serverId ?? 'server-1',
    serverName: overrides.serverName ?? 'TestMCP',
    transportType: overrides.transportType ?? 'stdio',
    status: overrides.status ?? 'connected',
    trustState: overrides.trustState ?? 'trusted',
    toolCount: overrides.toolCount ?? 3,
    resourceCount: overrides.resourceCount ?? 1,
    promptCount: overrides.promptCount ?? 0,
    latencyMs: overrides.latencyMs,
  };
}

// ---------------------------------------------------------------------------
// renderBootPeripheral (PRES-07)
// ---------------------------------------------------------------------------

describe('renderBootPeripheral', () => {
  it('renders server name', () => {
    const html = renderBootPeripheral(makePeripheral({ serverName: 'MyMCPServer' }));
    expect(html).toContain('MyMCPServer');
  });

  it('shows transport type (stdio)', () => {
    const html = renderBootPeripheral(makePeripheral({ transportType: 'stdio' }));
    expect(html).toContain('(stdio)');
  });

  it('shows transport type (streamable-http)', () => {
    const html = renderBootPeripheral(makePeripheral({ transportType: 'streamable-http' }));
    expect(html).toContain('(http)');
  });

  it('shows connected status as "OK" with green styling', () => {
    const html = renderBootPeripheral(makePeripheral({ status: 'connected' }));
    expect(html).toContain('OK');
    expect(html).toContain('boot-status-ok');
  });

  it('shows disconnected status as "OFFLINE"', () => {
    const html = renderBootPeripheral(makePeripheral({ status: 'disconnected' }));
    expect(html).toContain('OFFLINE');
    expect(html).toContain('boot-status-offline');
  });

  it('shows failed status as "FAIL" with red styling', () => {
    const html = renderBootPeripheral(makePeripheral({ status: 'failed' }));
    expect(html).toContain('FAIL');
    expect(html).toContain('boot-status-fail');
  });

  it('shows connecting status with yellow styling', () => {
    const html = renderBootPeripheral(makePeripheral({ status: 'connecting' }));
    expect(html).toContain('...');
    expect(html).toContain('boot-status-connecting');
  });

  it('shows trust state abbreviation [Q], [P], [T], [S]', () => {
    expect(renderBootPeripheral(makePeripheral({ trustState: 'quarantine' }))).toContain('[Q]');
    expect(renderBootPeripheral(makePeripheral({ trustState: 'provisional' }))).toContain('[P]');
    expect(renderBootPeripheral(makePeripheral({ trustState: 'trusted' }))).toContain('[T]');
    expect(renderBootPeripheral(makePeripheral({ trustState: 'suspended' }))).toContain('[S]');
  });

  it('shows tool and resource counts', () => {
    const html = renderBootPeripheral(makePeripheral({ toolCount: 7, resourceCount: 3 }));
    expect(html).toContain('7 tools');
    expect(html).toContain('3 res');
  });

  it('shows latency when provided', () => {
    const html = renderBootPeripheral(makePeripheral({ latencyMs: 42 }));
    expect(html).toContain('42ms');
    expect(html).toContain('boot-latency');
  });
});

// ---------------------------------------------------------------------------
// renderBootPeripherals
// ---------------------------------------------------------------------------

describe('renderBootPeripherals', () => {
  it('renders header "Checking MCP peripherals..."', () => {
    const html = renderBootPeripherals([makePeripheral()]);
    expect(html).toContain('Checking MCP peripherals...');
  });

  it('renders all peripherals in order', () => {
    const peripherals = [
      makePeripheral({ serverId: 'first', serverName: 'First' }),
      makePeripheral({ serverId: 'second', serverName: 'Second' }),
    ];
    const html = renderBootPeripherals(peripherals);
    const firstIdx = html.indexOf('First');
    const secondIdx = html.indexOf('Second');
    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it('shows summary line with server count and tool count', () => {
    const peripherals = [
      makePeripheral({ toolCount: 3 }),
      makePeripheral({ serverId: 's2', toolCount: 5 }),
    ];
    const html = renderBootPeripherals(peripherals);
    expect(html).toContain('2 MCP server(s) detected');
    expect(html).toContain('8 tools available');
  });

  it('shows "No MCP servers configured" for empty array', () => {
    const html = renderBootPeripherals([]);
    expect(html).toContain('No MCP servers configured');
  });

  it('includes data-boot-stage attribute', () => {
    const html = renderBootPeripherals([makePeripheral()]);
    expect(html).toContain('data-boot-stage="mcp-peripherals"');
  });
});

// ---------------------------------------------------------------------------
// renderBootPeripheralStyles
// ---------------------------------------------------------------------------

describe('renderBootPeripheralStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderBootPeripheralStyles();
    expect(css.length).toBeGreaterThan(100);
  });

  it('contains monospace font declaration', () => {
    const css = renderBootPeripheralStyles();
    expect(css).toContain('monospace');
  });

  it('contains blinking cursor animation', () => {
    const css = renderBootPeripheralStyles();
    expect(css).toContain('boot-blink');
    expect(css).toContain('@keyframes');
  });
});
