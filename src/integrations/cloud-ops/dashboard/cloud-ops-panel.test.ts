import { describe, it, expect } from 'vitest';
import {
  renderCloudOpsPanel,
  renderServiceHealth,
  renderAlertSummary,
  renderMissionTelemetry,
} from './cloud-ops-panel.js';
import type {
  CloudOpsPanelData,
  ServiceHealthEntry,
  AlertEntry,
  MissionTelemetry,
  CrewStatus,
  BudgetStatus,
  LoopHealth,
} from './types.js';

// ---------------------------------------------------------------------------
// Helpers / fixtures
// ---------------------------------------------------------------------------

function makeService(overrides: Partial<ServiceHealthEntry> = {}): ServiceHealthEntry {
  return {
    name: overrides.name ?? 'keystone',
    status: overrides.status ?? 'active',
    lastCheck: overrides.lastCheck ?? new Date().toISOString(),
    message: overrides.message,
  };
}

function makeAlert(overrides: Partial<AlertEntry> = {}): AlertEntry {
  return {
    severity: overrides.severity ?? 'info',
    source: overrides.source ?? 'health',
    message: overrides.message ?? 'Test alert',
    timestamp: overrides.timestamp ?? new Date().toISOString(),
  };
}

function makeCrew(overrides: Partial<CrewStatus> = {}): CrewStatus {
  return {
    name: overrides.name ?? 'Alpha',
    profile: overrides.profile ?? 'patrol',
    activeRoles: overrides.activeRoles ?? 3,
    totalRoles: overrides.totalRoles ?? 5,
  };
}

function makeBudget(overrides: Partial<BudgetStatus> = {}): BudgetStatus {
  return {
    used: overrides.used ?? 5000,
    ceiling: overrides.ceiling ?? 10000,
    warning: overrides.warning ?? false,
    blocked: overrides.blocked ?? false,
  };
}

function makeLoop(overrides: Partial<LoopHealth> = {}): LoopHealth {
  return {
    name: overrides.name ?? 'health',
    operational: overrides.operational ?? true,
    lastMessage: overrides.lastMessage,
  };
}

function makeTelemetry(overrides: Partial<MissionTelemetry> = {}): MissionTelemetry {
  return {
    crews: overrides.crews ?? [makeCrew()],
    budget: overrides.budget ?? makeBudget(),
    loops: overrides.loops ?? [makeLoop()],
  };
}

function makeData(overrides: Partial<CloudOpsPanelData> = {}): CloudOpsPanelData {
  return {
    enabled: 'enabled' in overrides ? overrides.enabled! : true,
    services: overrides.services ?? makeAllServices(),
    alerts: overrides.alerts ?? [],
    telemetry: overrides.telemetry ?? makeTelemetry(),
  };
}

/** Return one ServiceHealthEntry per OpenStack service. */
function makeAllServices(): ServiceHealthEntry[] {
  const names = ['keystone', 'nova', 'neutron', 'cinder', 'glance', 'swift', 'heat', 'horizon'] as const;
  return names.map((name) => makeService({ name }));
}

// ---------------------------------------------------------------------------
// renderCloudOpsPanel -- progressive enhancement
// ---------------------------------------------------------------------------

describe('renderCloudOpsPanel', () => {
  describe('progressive enhancement: null (no config)', () => {
    it('returns empty string when enabled is null', () => {
      const html = renderCloudOpsPanel(makeData({ enabled: null }));
      expect(html).toBe('');
    });

    it('renders no cop-panel when enabled is null', () => {
      const html = renderCloudOpsPanel(makeData({ enabled: null }));
      expect(html).not.toContain('cop-panel');
    });
  });

  describe('progressive enhancement: false (disabled)', () => {
    it('renders cop-panel when disabled', () => {
      const html = renderCloudOpsPanel(makeData({ enabled: false }));
      expect(html).toContain('cop-panel');
    });

    it('renders cop-disabled-msg with informational text', () => {
      const html = renderCloudOpsPanel(makeData({ enabled: false }));
      expect(html).toContain('cop-disabled-msg');
      expect(html).toContain('not configured');
    });

    it('does not render service grid when disabled', () => {
      const html = renderCloudOpsPanel(makeData({ enabled: false }));
      expect(html).not.toContain('cop-service-grid');
    });

    it('does not render alert list when disabled', () => {
      const html = renderCloudOpsPanel(makeData({ enabled: false }));
      expect(html).not.toContain('cop-alert-list');
    });

    it('does not render telemetry when disabled', () => {
      const html = renderCloudOpsPanel(makeData({ enabled: false }));
      expect(html).not.toContain('cop-telemetry');
    });
  });

  describe('progressive enhancement: true (enabled)', () => {
    it('renders data-panel-type="cloud-ops" attribute', () => {
      const html = renderCloudOpsPanel(makeData());
      expect(html).toContain('data-panel-type="cloud-ops"');
    });

    it('renders all three sections', () => {
      const html = renderCloudOpsPanel(makeData());
      expect(html).toContain('cop-section-services');
      expect(html).toContain('cop-section-alerts');
      expect(html).toContain('cop-section-telemetry');
    });

    it('contains all 8 OpenStack service names', () => {
      const html = renderCloudOpsPanel(makeData());
      for (const name of ['keystone', 'nova', 'neutron', 'cinder', 'glance', 'swift', 'heat', 'horizon']) {
        expect(html).toContain(name);
      }
    });

    it('contains cop-telemetry section', () => {
      const html = renderCloudOpsPanel(makeData());
      expect(html).toContain('cop-telemetry');
    });
  });
});

// ---------------------------------------------------------------------------
// renderServiceHealth
// ---------------------------------------------------------------------------

describe('renderServiceHealth', () => {
  describe('empty state', () => {
    it('renders empty message when no services', () => {
      const html = renderServiceHealth([]);
      expect(html).toContain('cop-service-empty');
    });

    it('shows "No services configured" when empty', () => {
      const html = renderServiceHealth([]);
      expect(html).toContain('No services configured');
    });
  });

  describe('status color mapping', () => {
    it('renders active status with cop-status-active class', () => {
      const html = renderServiceHealth([makeService({ status: 'active' })]);
      expect(html).toContain('cop-status-active');
      expect(html).toContain('var(--green)');
    });

    it('renders inactive status with cop-status-inactive class', () => {
      const html = renderServiceHealth([makeService({ status: 'inactive' })]);
      expect(html).toContain('cop-status-inactive');
      expect(html).toContain('var(--text-dim)');
    });

    it('renders error status with cop-status-error class', () => {
      const html = renderServiceHealth([makeService({ status: 'error' })]);
      expect(html).toContain('cop-status-error');
      expect(html).toContain('var(--red)');
    });

    it('renders maintenance status with cop-status-maintenance class', () => {
      const html = renderServiceHealth([makeService({ status: 'maintenance' })]);
      expect(html).toContain('cop-status-maintenance');
      expect(html).toContain('var(--yellow)');
    });

    it('renders unknown status with cop-status-unknown class', () => {
      const html = renderServiceHealth([makeService({ status: 'unknown' })]);
      expect(html).toContain('cop-status-unknown');
      expect(html).toContain('var(--text-dim)');
    });
  });

  describe('service rendering', () => {
    it('renders diamond character for each service', () => {
      const html = renderServiceHealth([makeService()]);
      expect(html).toContain('\u25C6');
    });

    it('renders service name in cop-service-name', () => {
      const html = renderServiceHealth([makeService({ name: 'nova' })]);
      expect(html).toContain('cop-service-name');
      expect(html).toContain('nova');
    });

    it('renders data-service attribute with service name', () => {
      const html = renderServiceHealth([makeService({ name: 'cinder' })]);
      expect(html).toContain('data-service="cinder"');
    });

    it('renders optional message as title attribute', () => {
      const html = renderServiceHealth([makeService({ message: 'All endpoints healthy' })]);
      expect(html).toContain('title="All endpoints healthy"');
    });

    it('renders all 8 services', () => {
      const html = renderServiceHealth(makeAllServices());
      const count = (html.match(/cop-service-item/g) ?? []).length;
      expect(count).toBe(8);
    });
  });
});

// ---------------------------------------------------------------------------
// renderAlertSummary
// ---------------------------------------------------------------------------

describe('renderAlertSummary', () => {
  describe('empty state', () => {
    it('renders cop-alert-empty when no alerts', () => {
      const html = renderAlertSummary([]);
      expect(html).toContain('cop-alert-empty');
    });

    it('shows "No active alerts" when empty', () => {
      const html = renderAlertSummary([]);
      expect(html).toContain('No active alerts');
    });
  });

  describe('severity sorting', () => {
    it('renders critical alerts before warning and info', () => {
      const alerts: AlertEntry[] = [
        makeAlert({ severity: 'info', message: 'Info alert' }),
        makeAlert({ severity: 'critical', message: 'Critical alert' }),
        makeAlert({ severity: 'warning', message: 'Warning alert' }),
      ];
      const html = renderAlertSummary(alerts);
      const critIdx = html.indexOf('Critical alert');
      const warnIdx = html.indexOf('Warning alert');
      const infoIdx = html.indexOf('Info alert');
      expect(critIdx).toBeLessThan(warnIdx);
      expect(warnIdx).toBeLessThan(infoIdx);
    });

    it('renders critical badge on critical alert', () => {
      const html = renderAlertSummary([makeAlert({ severity: 'critical' })]);
      expect(html).toContain('cop-alert-critical');
      expect(html).toContain('cop-badge-critical');
    });

    it('renders warning badge on warning alert', () => {
      const html = renderAlertSummary([makeAlert({ severity: 'warning' })]);
      expect(html).toContain('cop-alert-warning');
      expect(html).toContain('cop-badge-warning');
    });

    it('renders info badge on info alert', () => {
      const html = renderAlertSummary([makeAlert({ severity: 'info' })]);
      expect(html).toContain('cop-alert-info');
      expect(html).toContain('cop-badge-info');
    });
  });

  describe('alert content', () => {
    it('renders source loop name', () => {
      const html = renderAlertSummary([makeAlert({ source: 'cloud-ops' })]);
      expect(html).toContain('cloud-ops');
    });

    it('renders alert message', () => {
      const html = renderAlertSummary([makeAlert({ message: 'Keystone API unreachable' })]);
      expect(html).toContain('Keystone API unreachable');
    });

    it('escapes HTML in alert message', () => {
      const html = renderAlertSummary([makeAlert({ message: '<script>alert(1)</script>' })]);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});

// ---------------------------------------------------------------------------
// renderMissionTelemetry
// ---------------------------------------------------------------------------

describe('renderMissionTelemetry', () => {
  describe('crew activation bars', () => {
    it('renders crew item for each crew', () => {
      const telemetry = makeTelemetry({
        crews: [makeCrew({ name: 'Alpha' }), makeCrew({ name: 'Beta' })],
      });
      const html = renderMissionTelemetry(telemetry);
      expect(html).toContain('Alpha');
      expect(html).toContain('Beta');
      const count = (html.match(/cop-crew-item/g) ?? []).length;
      expect(count).toBe(2);
    });

    it('renders crew bar with correct width percentage', () => {
      const telemetry = makeTelemetry({
        crews: [makeCrew({ activeRoles: 3, totalRoles: 5 })],
      });
      const html = renderMissionTelemetry(telemetry);
      expect(html).toContain('width:60%');
    });

    it('renders role ratio as activeRoles/totalRoles', () => {
      const telemetry = makeTelemetry({
        crews: [makeCrew({ activeRoles: 2, totalRoles: 4 })],
      });
      const html = renderMissionTelemetry(telemetry);
      expect(html).toContain('2/4');
    });

    it('renders crew bar with role="meter" for accessibility', () => {
      const telemetry = makeTelemetry({ crews: [makeCrew()] });
      const html = renderMissionTelemetry(telemetry);
      expect(html).toContain('role="meter"');
    });

    it('renders "No crews active" when crews array is empty', () => {
      const telemetry = makeTelemetry({ crews: [] });
      const html = renderMissionTelemetry(telemetry);
      expect(html).toContain('No crews active');
    });

    it('renders 0% width when totalRoles is 0', () => {
      const telemetry = makeTelemetry({
        crews: [makeCrew({ activeRoles: 0, totalRoles: 0 })],
      });
      const html = renderMissionTelemetry(telemetry);
      expect(html).toContain('width:0%');
    });

    it('renders crew profile badge', () => {
      const telemetry = makeTelemetry({
        crews: [makeCrew({ profile: 'squadron' })],
      });
      const html = renderMissionTelemetry(telemetry);
      expect(html).toContain('squadron');
    });
  });

  describe('budget gauge', () => {
    it('renders cop-budget-gauge container', () => {
      const html = renderMissionTelemetry(makeTelemetry());
      expect(html).toContain('cop-budget-gauge');
    });

    it('renders cop-budget-ok class when within limits', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ budget: makeBudget({ used: 3000, ceiling: 10000, warning: false, blocked: false }) }),
      );
      expect(html).toContain('cop-budget-ok');
    });

    it('renders cop-budget-warning class when warning is true', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ budget: makeBudget({ used: 8000, ceiling: 10000, warning: true, blocked: false }) }),
      );
      expect(html).toContain('cop-budget-warning');
    });

    it('renders cop-budget-blocked class when blocked is true', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ budget: makeBudget({ used: 9800, ceiling: 10000, warning: true, blocked: true }) }),
      );
      expect(html).toContain('cop-budget-blocked');
    });

    it('renders budget fill at 95% when used is 9500 of 10000', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ budget: makeBudget({ used: 9500, ceiling: 10000 }) }),
      );
      expect(html).toContain('width:95%');
    });

    it('caps budget fill at 100% when over ceiling', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ budget: makeBudget({ used: 12000, ceiling: 10000 }) }),
      );
      expect(html).toContain('width:100%');
    });

    it('renders budget numbers showing used/ceiling', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ budget: makeBudget({ used: 5000, ceiling: 10000 }) }),
      );
      // Numbers may be formatted with locale separators
      expect(html).toContain('cop-budget-numbers');
    });
  });

  describe('loop health indicators', () => {
    it('renders cop-loop-dots container', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ loops: [makeLoop()] }),
      );
      expect(html).toContain('cop-loop-dots');
    });

    it('renders green dot for operational loop', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ loops: [makeLoop({ operational: true })] }),
      );
      expect(html).toContain('cop-loop-dot-up');
      expect(html).toContain('var(--green)');
    });

    it('renders red dot for down loop', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ loops: [makeLoop({ operational: false })] }),
      );
      expect(html).toContain('cop-loop-dot-down');
      expect(html).toContain('var(--red)');
    });

    it('renders 9 loop dots for 9 loops', () => {
      const loops: LoopHealth[] = [
        { name: 'command',    operational: true },
        { name: 'execution',  operational: true },
        { name: 'specialist', operational: false },
        { name: 'user',       operational: true },
        { name: 'observation', operational: true },
        { name: 'health',     operational: false },
        { name: 'budget',     operational: true },
        { name: 'cloud-ops',  operational: true },
        { name: 'doc-sync',   operational: false },
      ];
      const html = renderMissionTelemetry(makeTelemetry({ loops }));
      // Count by data-loop attributes, one per loop dot
      const dotCount = (html.match(/data-loop="/g) ?? []).length;
      expect(dotCount).toBe(9);
    });

    it('renders dot character U+25CF for each loop', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ loops: [makeLoop()] }),
      );
      expect(html).toContain('\u25CF');
    });

    it('renders data-loop attribute with loop name', () => {
      const html = renderMissionTelemetry(
        makeTelemetry({ loops: [makeLoop({ name: 'cloud-ops' })] }),
      );
      expect(html).toContain('data-loop="cloud-ops"');
    });

    it('renders "No loop data" when loops array is empty', () => {
      const html = renderMissionTelemetry(makeTelemetry({ loops: [] }));
      expect(html).toContain('No loop data');
    });

    it('renders all loops down when all operational=false', () => {
      const loops: LoopHealth[] = [
        { name: 'command', operational: false },
        { name: 'execution', operational: false },
        { name: 'health', operational: false },
      ];
      const html = renderMissionTelemetry(makeTelemetry({ loops }));
      const downCount = (html.match(/cop-loop-dot-down/g) ?? []).length;
      expect(downCount).toBe(3);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('renders panel with 0 services', () => {
    const html = renderCloudOpsPanel(makeData({ services: [] }));
    expect(html).toContain('cop-panel');
    expect(html).toContain('No services configured');
  });

  it('renders panel with 0 alerts', () => {
    const html = renderCloudOpsPanel(makeData({ alerts: [] }));
    expect(html).toContain('No active alerts');
  });

  it('renders panel with budget at 95% (warning state)', () => {
    const html = renderCloudOpsPanel(
      makeData({
        telemetry: makeTelemetry({
          budget: makeBudget({ used: 9500, ceiling: 10000, warning: true, blocked: false }),
        }),
      }),
    );
    expect(html).toContain('cop-budget-warning');
    expect(html).toContain('width:95%');
  });

  it('renders panel with all loops down', () => {
    const loops: LoopHealth[] = [
      { name: 'command', operational: false },
      { name: 'health', operational: false },
    ];
    const html = renderCloudOpsPanel(makeData({ telemetry: makeTelemetry({ loops }) }));
    const downCount = (html.match(/cop-loop-dot-down/g) ?? []).length;
    expect(downCount).toBe(2);
  });
});
