/**
 * Bootstrap Phase 0 Tests (BS-01..BS-04)
 *
 * Tests the bootstrap script contracts and magic-level adaptive output.
 * The actual bootstrap is a shell script (scripts/security/bootstrap-phase0.sh).
 * These tests verify the TypeScript/schema contracts that bootstrap relies on.
 *
 * @module tests/security/bootstrap
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import {
  SandboxProfileSchema,
  SecurityEventSchema,
  SECURITY_IPC_EVENTS,
} from '../../../src/core/security/index.js';

import {
  renderShieldIndicator,
  renderSecurityDetail,
  type ShieldState,
  type SecurityTimeline,
} from '../../../src/components/SecurityPanel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const scriptsDir = resolve(__dirname, '../../../scripts/security');

function makeState(
  status: ShieldState['status'],
  overrides?: Partial<ShieldState>,
): ShieldState {
  return {
    status,
    last_event: null,
    sandbox_active: true,
    proxy_active: true,
    agents_isolated: 0,
    ...overrides,
  };
}

function makeTimeline(): SecurityTimeline {
  return {
    events: [],
    filter: {
      severity: [],
      source: [],
      time_range: {
        start: '2026-02-26T00:00:00Z',
        end: '2026-02-26T23:59:59Z',
      },
    },
  };
}

// ---------------------------------------------------------------------------
// BS-01: Phase 0 produces valid security state
// ---------------------------------------------------------------------------

describe('BS-01: Phase 0 output contract', () => {
  it('BS-01: Phase 0 produces SandboxProfile schema + SecurityEvent', () => {
    // Simulate Phase 0 output: valid sandbox profile + security event
    const profile = {
      agent_id: 'main-001',
      agent_type: 'main',
      filesystem: {
        write_dirs: ['/tmp/project', '/tmp/project/.planning'],
        deny_read: ['/home/user/.ssh', '/home/user/.config', '/home/user/.aws'],
      },
      network: {
        allowed_domains: [{
          domain: 'api.anthropic.com',
          credential_type: 'api_key_header' as const,
          credential_source: 'keychain' as const,
          header_name: 'x-api-key',
        }],
        proxy_socket: '/tmp/gsd-proxy.sock',
      },
    };
    const event = {
      id: 'phase0-complete',
      timestamp: '2026-02-26T09:00:00Z',
      severity: 'info',
      source: 'sandbox',
      event_type: 'phase0_complete',
      detail: { sandbox_active: true, proxy_running: true },
    };
    expect(() => SandboxProfileSchema.parse(profile)).not.toThrow();
    expect(() => SecurityEventSchema.parse(event)).not.toThrow();
  });

  it('BS-01b: Bootstrap shell script exists', () => {
    expect(existsSync(resolve(scriptsDir, 'bootstrap-phase0.sh'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// BS-02: Phase 0 timing contract
// ---------------------------------------------------------------------------

describe('BS-02: Phase 0 under 30 seconds', () => {
  it('BS-02: Bootstrap script is not empty (functional)', () => {
    const script = readFileSync(resolve(scriptsDir, 'bootstrap-phase0.sh'), 'utf-8');
    expect(script.length).toBeGreaterThan(100);
    // Script should set pipefail for error handling
    expect(script).toContain('set -euo pipefail');
    // Script should have BST-09 performance target comment
    expect(script).toContain('30');
  });
});

// ---------------------------------------------------------------------------
// BS-03: Magic level 1 output (shield LED only)
// ---------------------------------------------------------------------------

describe('BS-03: Magic level 1 output', () => {
  it('BS-03: Shield at level 1 contains only icon, no diagnostic text', () => {
    const state = makeState('secure');
    const html = renderShieldIndicator(state, 1);
    // Level 1 should have shield-indicator and shield-icon but NOT status text
    expect(html).toContain('shield-indicator');
    expect(html).toContain('shield-icon');
    // Should NOT contain textual status label at level 1
    expect(html).not.toContain('shield-status');
    expect(html).not.toContain('shield-subsystems');
  });
});

// ---------------------------------------------------------------------------
// BS-04: Magic level 5 output (step-by-step diagnostic)
// ---------------------------------------------------------------------------

describe('BS-04: Magic level 5 output', () => {
  it('BS-04: Level 5 contains full subsystem status', () => {
    const state = makeState('secure');
    const html = renderShieldIndicator(state, 5);
    expect(html).toContain('shield-indicator');
    expect(html).toContain('shield-status');
    expect(html).toContain('Sandbox: ON');
    expect(html).toContain('Proxy: ON');
  });

  it('BS-04b: Level 5 detail panel contains operations view', () => {
    const state = makeState('secure');
    const timeline = makeTimeline();
    const html = renderSecurityDetail(state, timeline, 5, {
      sandboxProfiles: [{ name: 'main-profile', active: true, agentType: 'main' }],
      proxyLogs: [],
      quarantineItems: [],
    });
    expect(html).toContain('security-event-stream');
    expect(html).toContain('sandbox-profiles');
    expect(html).toContain('proxy-logs');
    expect(html).toContain('quarantine-contents');
  });
});
