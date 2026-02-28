import { describe, it, expect } from 'vitest';
import {
  renderTrustStateCard,
  renderHashAlert,
  renderBlockedCallLog,
  renderSecurityDashboard,
  renderSecurityDashboardStyles,
  type ServerTrustDisplay,
  type HashChangeAlert,
  type BlockedCallEntry,
} from './security-dashboard.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeServer(overrides: Partial<ServerTrustDisplay> = {}): ServerTrustDisplay {
  return {
    serverId: overrides.serverId ?? 'server-1',
    serverName: overrides.serverName ?? 'TestMCP',
    trustState: overrides.trustState ?? 'trusted',
    lastActivity: overrides.lastActivity ?? Date.now() - 120_000, // 2 min ago
    toolCount: overrides.toolCount ?? 5,
    hashRecord: overrides.hashRecord ?? {
      hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      computedAt: Date.now(),
    },
  };
}

function makeAlert(overrides: Partial<HashChangeAlert> = {}): HashChangeAlert {
  return {
    serverId: overrides.serverId ?? 'server-1',
    serverName: overrides.serverName ?? 'TestMCP',
    previousHash: overrides.previousHash ?? 'aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666',
    currentHash: overrides.currentHash ?? '1111aaaa2222bbbb3333cccc4444dddd5555eeee6666ffff',
    timestamp: overrides.timestamp ?? Date.now(),
    addedTools: overrides.addedTools ?? [],
    removedTools: overrides.removedTools ?? [],
    modifiedTools: overrides.modifiedTools ?? [],
  };
}

function makeBlocked(overrides: Partial<BlockedCallEntry> = {}): BlockedCallEntry {
  return {
    id: overrides.id ?? 'block-1',
    timestamp: overrides.timestamp ?? Date.now(),
    caller: overrides.caller ?? 'agent-exec',
    serverId: overrides.serverId ?? 'server-1',
    toolName: overrides.toolName ?? 'dangerous-tool',
    reason: overrides.reason ?? 'Server in quarantine',
    source: overrides.source ?? 'external',
  };
}

// ---------------------------------------------------------------------------
// renderTrustStateCard (PRES-06)
// ---------------------------------------------------------------------------

describe('renderTrustStateCard', () => {
  it('shows server name in card', () => {
    const html = renderTrustStateCard(makeServer({ serverName: 'MyServer' }));
    expect(html).toContain('MyServer');
  });

  it('shows trust state badge for quarantine (red styling)', () => {
    const html = renderTrustStateCard(makeServer({ trustState: 'quarantine' }));
    expect(html).toContain('sd-trust-quarantine');
    expect(html).toContain('Quarantine');
  });

  it('shows trust state badge for trusted (green styling)', () => {
    const html = renderTrustStateCard(makeServer({ trustState: 'trusted' }));
    expect(html).toContain('sd-trust-trusted');
    expect(html).toContain('Trusted');
  });

  it('shows trust state badge for provisional (yellow styling)', () => {
    const html = renderTrustStateCard(makeServer({ trustState: 'provisional' }));
    expect(html).toContain('sd-trust-provisional');
    expect(html).toContain('Provisional');
  });

  it('shows trust state badge for suspended (gray styling)', () => {
    const html = renderTrustStateCard(makeServer({ trustState: 'suspended' }));
    expect(html).toContain('sd-trust-suspended');
    expect(html).toContain('Suspended');
  });

  it('shows last activity as relative time', () => {
    const html = renderTrustStateCard(makeServer({ lastActivity: Date.now() - 120_000 }));
    expect(html).toContain('2m ago');
  });

  it('shows tool count', () => {
    const html = renderTrustStateCard(makeServer({ toolCount: 7 }));
    expect(html).toContain('7 tools');
  });

  it('shows truncated hash preview', () => {
    const html = renderTrustStateCard(makeServer({
      hashRecord: { hash: 'abcdef1234567890', computedAt: Date.now() },
    }));
    expect(html).toContain('abcdef12');
  });
});

// ---------------------------------------------------------------------------
// renderHashAlert
// ---------------------------------------------------------------------------

describe('renderHashAlert', () => {
  it('renders warning-styled alert banner', () => {
    const html = renderHashAlert(makeAlert());
    expect(html).toContain('sd-hash-alert');
    expect(html).toContain('\u26A0'); // warning icon
  });

  it('shows previous and current hash (truncated)', () => {
    const html = renderHashAlert(makeAlert({
      previousHash: 'abcdef1234567890abcdef1234567890',
      currentHash: '1234567890abcdef1234567890abcdef',
    }));
    expect(html).toContain('abcdef12');
    expect(html).toContain('12345678');
  });

  it('lists added tools', () => {
    const html = renderHashAlert(makeAlert({ addedTools: ['new-tool', 'another-tool'] }));
    expect(html).toContain('Added:');
    expect(html).toContain('new-tool');
    expect(html).toContain('another-tool');
    expect(html).toContain('sd-alert-added');
  });

  it('lists removed tools', () => {
    const html = renderHashAlert(makeAlert({ removedTools: ['old-tool'] }));
    expect(html).toContain('Removed:');
    expect(html).toContain('old-tool');
    expect(html).toContain('sd-alert-removed');
  });

  it('lists modified tools', () => {
    const html = renderHashAlert(makeAlert({ modifiedTools: ['changed-tool'] }));
    expect(html).toContain('Modified:');
    expect(html).toContain('changed-tool');
    expect(html).toContain('sd-alert-modified');
  });

  it('shows timestamp', () => {
    const html = renderHashAlert(makeAlert({ timestamp: new Date('2026-02-22T14:30:00Z').getTime() }));
    // Should contain time in HH:MM:SS format
    expect(html).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// renderBlockedCallLog
// ---------------------------------------------------------------------------

describe('renderBlockedCallLog', () => {
  it('renders table with correct columns', () => {
    const html = renderBlockedCallLog([makeBlocked()]);
    expect(html).toContain('<th>Time</th>');
    expect(html).toContain('<th>Caller</th>');
    expect(html).toContain('<th>Server</th>');
    expect(html).toContain('<th>Tool</th>');
    expect(html).toContain('<th>Reason</th>');
    expect(html).toContain('<th>Source</th>');
  });

  it('shows blocked call entries with reasons', () => {
    const html = renderBlockedCallLog([
      makeBlocked({ toolName: 'rm-rf', reason: 'Path traversal detected' }),
    ]);
    expect(html).toContain('rm-rf');
    expect(html).toContain('Path traversal detected');
  });

  it('shows source (external vs agent-to-agent)', () => {
    const html = renderBlockedCallLog([
      makeBlocked({ source: 'agent-to-agent' }),
    ]);
    expect(html).toContain('agent-to-agent');
  });

  it('renders empty state for no blocked calls', () => {
    const html = renderBlockedCallLog([]);
    expect(html).toContain('No blocked calls');
  });

  it('includes data-entry-id attributes', () => {
    const html = renderBlockedCallLog([makeBlocked({ id: 'entry-42' })]);
    expect(html).toContain('data-entry-id="entry-42"');
  });
});

// ---------------------------------------------------------------------------
// renderSecurityDashboard
// ---------------------------------------------------------------------------

describe('renderSecurityDashboard', () => {
  it('renders trust state overview section', () => {
    const html = renderSecurityDashboard({
      servers: [makeServer()],
      alerts: [],
      blockedCalls: [],
    });
    expect(html).toContain('Trust State Overview');
    expect(html).toContain('sd-trust-card');
  });

  it('renders hash change alerts section', () => {
    const html = renderSecurityDashboard({
      servers: [],
      alerts: [makeAlert()],
      blockedCalls: [],
    });
    expect(html).toContain('Hash Change Alerts');
    expect(html).toContain('sd-hash-alert');
  });

  it('renders blocked call log section', () => {
    const html = renderSecurityDashboard({
      servers: [],
      alerts: [],
      blockedCalls: [makeBlocked()],
    });
    expect(html).toContain('Blocked Call Log');
    expect(html).toContain('sd-blocked-table');
  });

  it('shows summary stats (server count, quarantined count)', () => {
    const html = renderSecurityDashboard({
      servers: [
        makeServer({ trustState: 'quarantine' }),
        makeServer({ serverId: 's2', trustState: 'trusted' }),
        makeServer({ serverId: 's3', trustState: 'quarantine' }),
      ],
      alerts: [],
      blockedCalls: [makeBlocked()],
    });
    expect(html).toContain('3 servers');
    expect(html).toContain('2 quarantined');
    expect(html).toContain('1 blocked calls');
  });

  it('handles empty data gracefully', () => {
    const html = renderSecurityDashboard({
      servers: [],
      alerts: [],
      blockedCalls: [],
    });
    expect(html).toContain('Security Dashboard');
    expect(html).toContain('0 servers');
    expect(html).toContain('No blocked calls');
  });
});

// ---------------------------------------------------------------------------
// renderSecurityDashboardStyles
// ---------------------------------------------------------------------------

describe('renderSecurityDashboardStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderSecurityDashboardStyles();
    expect(css.length).toBeGreaterThan(100);
    expect(css).toContain('.sd-dashboard');
  });

  it('contains trust state color classes', () => {
    const css = renderSecurityDashboardStyles();
    expect(css).toContain('.sd-trust-quarantine');
    expect(css).toContain('.sd-trust-trusted');
    expect(css).toContain('.sd-trust-provisional');
    expect(css).toContain('.sd-trust-suspended');
  });
});
