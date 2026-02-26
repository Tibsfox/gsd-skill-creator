/**
 * Security Dashboard Panel tests.
 *
 * TDD test suite for ShieldIndicator, magic bypass, event timeline,
 * and shield pulse CSS class logic.
 *
 * @module components/SecurityPanel.test
 */

import { describe, it, expect } from 'vitest';
import {
  type ShieldState,
  type SecurityEvent,
  type SecurityTimeline,
  renderShieldIndicator,
  renderSecurityDetail,
  shouldBypassMagicFilter,
  getShieldPulseClass,
} from './SecurityPanel.js';

// ============================================================================
// Mock data helpers
// ============================================================================

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

function makeEvent(severity: SecurityEvent['severity']): SecurityEvent {
  return {
    id: `evt-${severity}-001`,
    timestamp: '2026-02-26T10:00:00Z',
    severity,
    source: 'sandbox',
    message: `Test ${severity} event`,
  };
}

function makeTimeline(events: SecurityEvent[]): SecurityTimeline {
  return {
    events,
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

// ============================================================================
// Test Group 1: Shield renders at all 5 magic levels (DSH-01)
// ============================================================================

describe('Group 1: Shield renders at all 5 magic levels', () => {
  const state = makeState('secure');

  it('renders non-empty output at magic level 1', () => {
    const result = renderShieldIndicator(state, 1);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('renders non-empty output at magic level 2', () => {
    const result = renderShieldIndicator(state, 2);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('renders non-empty output at magic level 3', () => {
    const result = renderShieldIndicator(state, 3);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('renders non-empty output at magic level 4', () => {
    const result = renderShieldIndicator(state, 4);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it('renders non-empty output at magic level 5', () => {
    const result = renderShieldIndicator(state, 5);
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test Group 2: 4 shield state colors (DSH-02)
// ============================================================================

describe('Group 2: 4 shield state colors', () => {
  it('secure state contains shield-secure class', () => {
    const result = renderShieldIndicator(makeState('secure'), 3);
    expect(result).toContain('shield-secure');
  });

  it('attention state contains shield-attention class', () => {
    const result = renderShieldIndicator(makeState('attention'), 3);
    expect(result).toContain('shield-attention');
  });

  it('breach-blocked state contains shield-breach-blocked class', () => {
    const result = renderShieldIndicator(makeState('breach-blocked'), 3);
    expect(result).toContain('shield-breach-blocked');
  });

  it('inactive state contains shield-inactive class', () => {
    const result = renderShieldIndicator(makeState('inactive'), 3);
    expect(result).toContain('shield-inactive');
  });
});

// ============================================================================
// Test Group 3: Magic bypass for critical events (DSH-03)
// ============================================================================

describe('Group 3: Magic bypass for critical events', () => {
  it('blocked severity bypasses magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('blocked'))).toBe(true);
  });

  it('critical severity bypasses magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('critical'))).toBe(true);
  });

  it('warning severity does NOT bypass magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('warning'))).toBe(false);
  });

  it('info severity does NOT bypass magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('info'))).toBe(false);
  });

  it('audit severity does NOT bypass magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('audit'))).toBe(false);
  });
});

// ============================================================================
// Test Group 4: Event timeline shown at magic level 3+ (DSH-04)
// ============================================================================

describe('Group 4: Event timeline at magic level 3+', () => {
  const state = makeState('secure');
  const timeline = makeTimeline([
    makeEvent('blocked'),
    makeEvent('warning'),
    makeEvent('info'),
  ]);

  it('timeline NOT present at magic level 2', () => {
    const result = renderSecurityDetail(state, timeline, 2);
    expect(result).not.toContain('security-timeline');
  });

  it('timeline present at magic level 3', () => {
    const result = renderSecurityDetail(state, timeline, 3);
    expect(result).toContain('security-timeline');
  });

  it('timeline present at magic level 4', () => {
    const result = renderSecurityDetail(state, timeline, 4);
    expect(result).toContain('security-timeline');
  });

  it('timeline present at magic level 5', () => {
    const result = renderSecurityDetail(state, timeline, 5);
    expect(result).toContain('security-timeline');
  });
});

// ============================================================================
// Test Group 5: Shield pulse on state change
// ============================================================================

describe('Group 5: Shield pulse on state change', () => {
  it('returns shield-pulse when status changes', () => {
    const prev = makeState('secure');
    const next = makeState('breach-blocked');
    expect(getShieldPulseClass(prev, next)).toBe('shield-pulse');
  });

  it('returns empty string when status unchanged', () => {
    const prev = makeState('secure');
    const same = makeState('secure');
    expect(getShieldPulseClass(prev, same)).toBe('');
  });
});
