import { describe, it, expect } from 'vitest';
import type { DashboardAlert } from '../../../src/integrations/upstream/types';
import {
  validateAlert,
  formatAlertForTerminal,
  aggregateAlerts,
  deduplicateAlerts,
} from '../../../src/integrations/upstream/dashboard-alerts';

/** Helper: build a valid dashboard alert */
function makeAlert(overrides: Partial<DashboardAlert> = {}): DashboardAlert {
  return {
    id: 'alert-001',
    tier: 'flash',
    severity: 'P0',
    title: 'Breaking API Change',
    summary: 'The v2 endpoint has been removed',
    timestamp: '2026-02-27T00:00:00Z',
    action_url: 'https://docs.anthropic.com/changelog',
    ...overrides,
  };
}

describe('Dashboard Alerts', () => {
  describe('validateAlert', () => {
    it('validates correctly with all required fields', () => {
      const alert = makeAlert();
      const result = validateAlert(alert);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects alert missing required fields', () => {
      const alert = { id: 'a1', tier: 'flash' } as unknown as DashboardAlert;
      const result = validateAlert(alert);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('flash alerts', () => {
    it('have action_url set', () => {
      const alert = makeAlert({ tier: 'flash', severity: 'P0' });
      const result = validateAlert(alert);

      expect(result.valid).toBe(true);
      expect(alert.action_url).toBeTruthy();
    });
  });

  describe('formatAlertForTerminal', () => {
    it('includes severity prefix and color markers', () => {
      const alert = makeAlert({ severity: 'P0', title: 'Critical issue' });
      const formatted = formatAlertForTerminal(alert);

      // Should contain ANSI color codes or severity prefix
      expect(formatted).toContain('P0');
      expect(formatted).toContain('Critical issue');
      // Should include some form of color/formatting marker
      expect(formatted).toMatch(/\[P0\]|\x1b\[/);
    });
  });

  describe('aggregateAlerts', () => {
    it('groups alerts by severity', () => {
      const alerts = [
        makeAlert({ id: 'a1', severity: 'P0' }),
        makeAlert({ id: 'a2', severity: 'P1' }),
        makeAlert({ id: 'a3', severity: 'P0' }),
        makeAlert({ id: 'a4', severity: 'P2' }),
        makeAlert({ id: 'a5', severity: 'P3' }),
      ];

      const grouped = aggregateAlerts(alerts);

      expect(grouped.p0).toHaveLength(2);
      expect(grouped.p1).toHaveLength(1);
      expect(grouped.p2).toHaveLength(1);
      expect(grouped.p3).toHaveLength(1);
    });
  });

  describe('deduplicateAlerts', () => {
    it('deduplicates by change_id via alert id', () => {
      const alerts = [
        makeAlert({ id: 'flash-evt-001' }),
        makeAlert({ id: 'session-evt-001' }),
        makeAlert({ id: 'flash-evt-002' }),
      ];

      const deduped = deduplicateAlerts(alerts);

      // evt-001 appears twice (flash- and session- prefix), should keep first occurrence
      expect(deduped).toHaveLength(2);
      const ids = deduped.map((a) => a.id);
      expect(ids).toContain('flash-evt-001');
      expect(ids).toContain('flash-evt-002');
    });
  });
});
