/**
 * Security Dashboard Tests (SD-01..SD-04)
 *
 * Tests shield indicator rendering, magic bypass, event timeline,
 * and agent count display. Uses the render functions from SecurityPanel.ts.
 *
 * @module tests/security/dashboard
 */

import { describe, it, expect } from 'vitest';

import {
  renderShieldIndicator,
  renderSecurityDetail,
  shouldBypassMagicFilter,
  type ShieldState,
  type SecurityEvent,
  type SecurityTimeline,
} from '../../src/components/SecurityPanel.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function makeEvent(
  severity: SecurityEvent['severity'],
  message = 'Test event',
): SecurityEvent {
  return {
    id: `evt-${severity}-001`,
    timestamp: '2026-02-26T10:00:00Z',
    severity,
    source: 'sandbox',
    message,
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

// ---------------------------------------------------------------------------
// SD-01: Shield indicator visible at magic level 1 with correct CSS class
// ---------------------------------------------------------------------------

describe('SD-01: Shield visible at Level 1', () => {
  it('SD-01: shield-indicator element present at magic level 1', () => {
    const state = makeState('secure');
    const html = renderShieldIndicator(state, 1);
    expect(html).toContain('shield-indicator');
    expect(html).toContain('shield-secure');
  });

  it('SD-01b: shield-indicator present for all 4 states at level 1', () => {
    for (const status of ['secure', 'attention', 'breach-blocked', 'inactive'] as const) {
      const html = renderShieldIndicator(makeState(status), 1);
      expect(html).toContain('shield-indicator');
      expect(html).toContain(`shield-${status}`);
    }
  });
});

// ---------------------------------------------------------------------------
// SD-02: Critical events bypass magic filter
// ---------------------------------------------------------------------------

describe('SD-02: Critical events bypass magic filter', () => {
  it('SD-02: breach-blocked event bypasses magic at any level', () => {
    const breachEvent = makeEvent('blocked', 'Credential exfiltration blocked');
    expect(shouldBypassMagicFilter(breachEvent)).toBe(true);

    // At magic level 1, shield should still update on breach
    const state = makeState('breach-blocked');
    const html = renderShieldIndicator(state, 1);
    expect(html).toContain('shield-breach-blocked');
  });

  it('SD-02b: critical severity bypasses magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('critical'))).toBe(true);
  });

  it('SD-02c: info severity does NOT bypass magic filter', () => {
    expect(shouldBypassMagicFilter(makeEvent('info'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SD-03: Event timeline with mixed severity
// ---------------------------------------------------------------------------

describe('SD-03: Event timeline rendering', () => {
  it('SD-03: 10 mixed events render 10 timeline entries at level 3', () => {
    const events: SecurityEvent[] = [];
    const severities: SecurityEvent['severity'][] = [
      'blocked', 'critical', 'warning', 'info', 'audit',
      'blocked', 'critical', 'warning', 'info', 'audit',
    ];
    for (let i = 0; i < 10; i++) {
      events.push({
        id: `evt-${i}`,
        timestamp: `2026-02-26T10:${String(i).padStart(2, '0')}:00Z`,
        severity: severities[i],
        source: 'sandbox',
        message: `Event ${i}`,
      });
    }
    const timeline = makeTimeline(events);
    const html = renderSecurityDetail(makeState('secure'), timeline, 3);
    // Each event should generate a timeline entry
    expect(html).toContain('security-timeline');
    for (let i = 0; i < 10; i++) {
      expect(html).toContain(`Event ${i}`);
    }
  });
});

// ---------------------------------------------------------------------------
// SD-04: Agent count display
// ---------------------------------------------------------------------------

describe('SD-04: Agent count in security panel', () => {
  it('SD-04: Panel shows "3 agents isolated" when 3 active agents', () => {
    const state = makeState('secure', { agents_isolated: 3 });
    const timeline = makeTimeline([]);
    const html = renderSecurityDetail(state, timeline, 1);
    expect(html).toContain('3');
    expect(html).toContain('Agents isolated');
  });
});
