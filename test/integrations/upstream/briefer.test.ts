import { describe, it, expect } from 'vitest';
import type {
  ClassifiedEvent,
  PatchManifest,
  ImpactManifest,
  Severity,
} from '../../../src/upstream/types';
import {
  generateBriefing,
  generateFlashAlert,
  generateSessionBriefing,
  generateWeeklyDigest,
  generateMonthlyReport,
  routeSeverity,
  formatBriefingText,
} from '../../../src/upstream/briefer';

/** Helper: build a classified event with sensible defaults */
function makeEvent(overrides: Partial<ClassifiedEvent> = {}): ClassifiedEvent {
  return {
    id: 'evt-001',
    channel: 'anthropic-docs',
    timestamp: '2026-02-27T00:00:00Z',
    content_hash_before: 'aaa',
    content_hash_after: 'bbb',
    diff_summary: 'Updated API endpoint',
    raw_content: 'content',
    change_type: 'enhancement',
    severity: 'P2',
    domains: ['api'],
    auto_patchable: true,
    summary: 'API endpoint update',
    confidence: 0.9,
    ...overrides,
  };
}

/** Helper: build a patch manifest with sensible defaults */
function makePatch(overrides: Partial<PatchManifest> = {}): PatchManifest {
  return {
    patch_id: 'patch-001',
    change_id: 'evt-001',
    target_skill: 'gsd-workflow',
    patch_type: 'description-update',
    severity: 'P2',
    auto_approved: true,
    diff: [{ path: 'SKILL.md', before: 'old', after: 'new' }],
    backup_path: '/rollbacks/2026-02-27/gsd-workflow',
    validation: { tests_passed: true, lint_passed: true, size_within_bounds: true },
    upstream_reference: { channel: 'anthropic-docs', change_id: 'evt-001' },
    ...overrides,
  };
}

/** Helper: build an impact manifest for pending decisions */
function makeImpact(overrides: Partial<ImpactManifest> = {}): ImpactManifest {
  return {
    change_id: 'evt-003',
    classification: makeEvent({ id: 'evt-003', auto_patchable: false }),
    affected_components: [
      {
        component: 'skill.md',
        impact: 'direct',
        status: 'active',
        blast_radius: 'high',
        action: 'manual review needed',
        patchable: false,
        reason: 'structural change',
      },
    ],
    total_blast_radius: 5,
    ...overrides,
  };
}

describe('Intelligence Briefer', () => {
  describe('Flash alert format', () => {
    it('produces immediate alert with required fields for P0/P1 changes', () => {
      const event = makeEvent({ id: 'evt-p0', severity: 'P0', change_type: 'breaking', summary: 'Breaking API removal' });
      const alert = generateFlashAlert(event);

      expect(alert.id).toContain('evt-p0');
      expect(alert.tier).toBe('flash');
      expect(alert.severity).toBe('P0');
      expect(alert.title).toBeTruthy();
      expect(alert.summary).toBeTruthy();
      expect(alert.timestamp).toBeTruthy();
    });
  });

  describe('Session briefing format', () => {
    it('produces structured summary roughly under 1500 words', () => {
      const changes = [
        makeEvent({ id: 'evt-1', severity: 'P1', summary: 'SDK type change' }),
        makeEvent({ id: 'evt-2', severity: 'P2', summary: 'Docs update' }),
      ];
      const patches = [makePatch({ change_id: 'evt-1' })];

      const briefing = generateSessionBriefing(changes, patches);

      expect(briefing.tier).toBe('session');
      expect(briefing.changes).toHaveLength(2);
      expect(briefing.patches_applied).toHaveLength(1);

      const text = formatBriefingText(briefing);
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBeLessThanOrEqual(1500);
    });
  });

  describe('Weekly digest format', () => {
    it('aggregates changes by type and severity', () => {
      const changes = [
        makeEvent({ id: 'evt-a', change_type: 'breaking', severity: 'P0' }),
        makeEvent({ id: 'evt-b', change_type: 'enhancement', severity: 'P2' }),
        makeEvent({ id: 'evt-c', change_type: 'breaking', severity: 'P1' }),
      ];
      const patches = [makePatch({ change_id: 'evt-a' })];

      const briefing = generateWeeklyDigest(changes, patches);

      expect(briefing.tier).toBe('weekly');
      expect(briefing.changes).toHaveLength(3);

      const text = formatBriefingText(briefing);
      expect(text).toContain('breaking');
      expect(text).toContain('enhancement');
    });
  });

  describe('Monthly report format', () => {
    it('includes trend analysis', () => {
      const changes = [
        makeEvent({ id: 'evt-m1', severity: 'P0', change_type: 'security' }),
        makeEvent({ id: 'evt-m2', severity: 'P2', change_type: 'enhancement' }),
        makeEvent({ id: 'evt-m3', severity: 'P3', change_type: 'informational' }),
      ];
      const patches = [makePatch({ change_id: 'evt-m1' })];

      const briefing = generateMonthlyReport(changes, patches);

      expect(briefing.tier).toBe('monthly');

      const text = formatBriefingText(briefing);
      // Monthly report should include trend/summary keywords
      expect(text.toLowerCase()).toMatch(/trend|overview|summary/);
    });
  });

  describe('Severity routing', () => {
    it('routes P0 to flash', () => {
      const tiers = routeSeverity('P0');
      expect(tiers).toContain('flash');
    });

    it('routes P1 to flash and session', () => {
      const tiers = routeSeverity('P1');
      expect(tiers).toContain('flash');
      expect(tiers).toContain('session');
    });

    it('routes P2 to session', () => {
      const tiers = routeSeverity('P2');
      expect(tiers).toContain('session');
      expect(tiers).not.toContain('flash');
    });

    it('routes P3 to weekly', () => {
      const tiers = routeSeverity('P3');
      expect(tiers).toContain('weekly');
      expect(tiers).not.toContain('flash');
      expect(tiers).not.toContain('session');
    });
  });

  describe('Includes patches applied', () => {
    it('includes patches in briefing output', () => {
      const changes = [makeEvent()];
      const patches = [makePatch(), makePatch({ patch_id: 'patch-002', change_id: 'evt-002' })];

      const briefing = generateBriefing('session', changes, patches, []);

      expect(briefing.patches_applied).toHaveLength(2);
      expect(briefing.patches_applied[0].patch_id).toBe('patch-001');
      expect(briefing.patches_applied[1].patch_id).toBe('patch-002');
    });
  });

  describe('Includes pending decisions', () => {
    it('includes non-patchable impacts as pending decisions', () => {
      const changes = [makeEvent({ auto_patchable: false })];
      const pendingDecisions = [makeImpact()];

      const briefing = generateBriefing('session', changes, [], pendingDecisions);

      expect(briefing.pending_decisions).toHaveLength(1);
      expect(briefing.pending_decisions[0].change_id).toBe('evt-003');
    });
  });

  describe('Empty changes', () => {
    it('produces valid empty briefing without crashing', () => {
      const briefing = generateBriefing('session', [], [], []);

      expect(briefing.tier).toBe('session');
      expect(briefing.changes).toHaveLength(0);
      expect(briefing.patches_applied).toHaveLength(0);
      expect(briefing.pending_decisions).toHaveLength(0);
      expect(briefing.dashboard_alerts).toHaveLength(0);
      expect(briefing.date).toBeTruthy();

      const text = formatBriefingText(briefing);
      expect(text).toBeTruthy();
    });
  });
});
