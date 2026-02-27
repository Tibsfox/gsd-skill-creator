import { describe, it, expect } from 'vitest';
import type {
  ChangeType,
  Severity,
  BriefingTier,
  ImpactType,
  ComponentStatus,
  RawChangeEvent,
  ClassifiedEvent,
  AffectedComponent,
  ImpactManifest,
  PatchDiff,
  PatchValidation,
  UpstreamReference,
  PatchManifest,
  DashboardAlert,
  Briefing,
  ChannelConfig,
  ChannelState,
} from '../../src/upstream/types';

describe('Upstream Intelligence Types', () => {
  it('RawChangeEvent has all required fields', () => {
    const event: RawChangeEvent = {
      id: 'evt-001',
      channel: 'anthropic-changelog',
      timestamp: '2026-02-27T00:00:00Z',
      content_hash_before: 'abc123',
      content_hash_after: 'def456',
      diff_summary: 'Added new model support',
      raw_content: '<html>...</html>',
    };
    expect(event.id).toBe('evt-001');
    expect(event.channel).toBe('anthropic-changelog');
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event.content_hash_before).toBeTruthy();
    expect(event.content_hash_after).toBeTruthy();
    expect(event.diff_summary).toBeTruthy();
    expect(event.raw_content).toBeTruthy();
  });

  it('ClassifiedEvent extends RawChangeEvent with classification fields', () => {
    const event: ClassifiedEvent = {
      id: 'evt-002',
      channel: 'anthropic-docs',
      timestamp: '2026-02-27T00:00:00Z',
      content_hash_before: 'aaa',
      content_hash_after: 'bbb',
      diff_summary: 'Removed deprecated API',
      raw_content: 'content',
      change_type: 'breaking',
      severity: 'P0',
      domains: ['skills', 'agents'],
      auto_patchable: false,
      summary: 'Breaking API removal',
      confidence: 0.95,
    };
    expect(event.change_type).toBe('breaking');
    expect(event.severity).toBe('P0');
    expect(event.domains).toContain('skills');
    expect(event.auto_patchable).toBe(false);
    expect(event.confidence).toBeGreaterThanOrEqual(0);
    expect(event.confidence).toBeLessThanOrEqual(1);
  });

  it('AffectedComponent has impact classification', () => {
    const component: AffectedComponent = {
      component: '.claude/skills/gsd-workflow/SKILL.md',
      impact: 'direct',
      status: 'active',
      blast_radius: 'All GSD phase execution',
      action: 'Update skill description to match new API',
      patchable: true,
      patch_size: '5%',
    };
    expect(component.impact).toBe('direct');
    expect(component.status).toBe('active');
    expect(component.patchable).toBe(true);
  });

  it('ImpactManifest aggregates affected components', () => {
    const manifest: ImpactManifest = {
      change_id: 'evt-002',
      classification: {} as ClassifiedEvent,
      affected_components: [],
      total_blast_radius: 3,
    };
    expect(manifest.change_id).toBe('evt-002');
    expect(Array.isArray(manifest.affected_components)).toBe(true);
    expect(manifest.total_blast_radius).toBe(3);
  });

  it('PatchManifest has all patch metadata', () => {
    const patch: PatchManifest = {
      patch_id: 'patch-001',
      change_id: 'evt-002',
      target_skill: 'gsd-workflow',
      patch_type: 'description-update',
      severity: 'P2',
      auto_approved: true,
      diff: [{ path: 'SKILL.md', before: 'old', after: 'new' }],
      backup_path: '/rollbacks/2026-02-27/gsd-workflow',
      validation: { tests_passed: true, lint_passed: true, size_within_bounds: true },
      upstream_reference: { channel: 'anthropic-docs', change_id: 'evt-002' },
    };
    expect(patch.patch_id).toBe('patch-001');
    expect(patch.auto_approved).toBe(true);
    expect(patch.diff).toHaveLength(1);
    expect(patch.validation.tests_passed).toBe(true);
    expect(patch.upstream_reference.channel).toBe('anthropic-docs');
  });

  it('DashboardAlert has required display fields', () => {
    const alert: DashboardAlert = {
      id: 'alert-001',
      tier: 'flash',
      severity: 'P0',
      title: 'Breaking API Change Detected',
      summary: 'claude-2.0 model removed from API',
      timestamp: '2026-02-27T00:00:00Z',
      action_url: 'https://docs.anthropic.com/changelog',
    };
    expect(alert.tier).toBe('flash');
    expect(alert.severity).toBe('P0');
    expect(alert.title).toBeTruthy();
    expect(alert.summary).toBeTruthy();
  });

  it('Briefing aggregates changes, patches, and decisions', () => {
    const briefing: Briefing = {
      tier: 'session',
      date: '2026-02-27',
      changes: [],
      patches_applied: [],
      pending_decisions: [],
      dashboard_alerts: [],
    };
    expect(briefing.tier).toBe('session');
    expect(Array.isArray(briefing.changes)).toBe(true);
    expect(Array.isArray(briefing.patches_applied)).toBe(true);
    expect(Array.isArray(briefing.pending_decisions)).toBe(true);
    expect(Array.isArray(briefing.dashboard_alerts)).toBe(true);
  });

  it('ChannelConfig defines monitoring endpoint', () => {
    const channel: ChannelConfig = {
      name: 'anthropic-docs',
      url: 'https://docs.anthropic.com',
      type: 'documentation',
      priority: 'P0',
      check_interval_hours: 6,
      domains: ['skills', 'agents', 'hooks'],
    };
    expect(channel.name).toBe('anthropic-docs');
    expect(channel.url).toMatch(/^https:\/\//);
    expect(channel.priority).toBe('P0');
    expect(channel.check_interval_hours).toBeGreaterThan(0);
    expect(channel.domains.length).toBeGreaterThan(0);
  });

  it('ChannelState tracks hash and timestamps', () => {
    const state: ChannelState = {
      channel: 'anthropic-docs',
      last_hash: 'sha256-abc123',
      last_checked: '2026-02-27T00:00:00Z',
      last_changed: '2026-02-26T12:00:00Z',
      etag: '"abc123"',
    };
    expect(state.channel).toBe('anthropic-docs');
    expect(state.last_hash).toBeTruthy();
    expect(state.last_checked).toMatch(/^\d{4}/);
  });

  it('ChangeType union covers all 6 types', () => {
    const types: ChangeType[] = ['breaking', 'deprecation', 'enhancement', 'security', 'optimization', 'informational'];
    expect(types).toHaveLength(6);
  });

  it('Severity union covers P0-P3', () => {
    const severities: Severity[] = ['P0', 'P1', 'P2', 'P3'];
    expect(severities).toHaveLength(4);
  });

  it('BriefingTier union covers all 4 tiers', () => {
    const tiers: BriefingTier[] = ['flash', 'session', 'weekly', 'monthly'];
    expect(tiers).toHaveLength(4);
  });

  it('PatchDiff, PatchValidation, UpstreamReference are well-formed', () => {
    const diff: PatchDiff = { path: 'SKILL.md', before: 'old content', after: 'new content' };
    const validation: PatchValidation = { tests_passed: true, lint_passed: true, size_within_bounds: true };
    const ref: UpstreamReference = { channel: 'anthropic-docs', change_id: 'evt-001', url: 'https://docs.anthropic.com' };
    expect(diff.path).toBe('SKILL.md');
    expect(validation.tests_passed).toBe(true);
    expect(ref.channel).toBe('anthropic-docs');
  });

  it('optional fields on interfaces are genuinely optional', () => {
    const component: AffectedComponent = {
      component: 'test',
      impact: 'transitive',
      status: 'dormant',
      blast_radius: 'none',
      action: 'monitor',
      patchable: false,
    };
    expect(component.patch_size).toBeUndefined();
    expect(component.reason).toBeUndefined();

    const state: ChannelState = {
      channel: 'test',
      last_hash: 'hash',
      last_checked: '2026-01-01T00:00:00Z',
    };
    expect(state.last_changed).toBeUndefined();
    expect(state.etag).toBeUndefined();

    const alert: DashboardAlert = {
      id: 'a1',
      tier: 'weekly',
      severity: 'P3',
      title: 'Minor update',
      summary: 'Details',
      timestamp: '2026-01-01T00:00:00Z',
    };
    expect(alert.action_url).toBeUndefined();
  });
});
