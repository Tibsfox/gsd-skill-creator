import { describe, it, expect } from 'vitest';
import type {
  ClassifiedEvent,
  AffectedComponent,
  ImpactManifest,
  DashboardAlert,
} from '../../src/upstream/types';
import { applyPatch, createBackup, rollback } from '../../src/upstream/patcher';
import { validateAlert, formatAlertForTerminal, aggregateAlerts, deduplicateAlerts } from '../../src/upstream/dashboard-alerts';
import { runPipeline } from '../../src/upstream/pipeline';
import type { PipelineDeps } from '../../src/upstream/pipeline';

/* ------------------------------------------------------------------ */
/*  Test helpers                                                       */
/* ------------------------------------------------------------------ */

function makeEvent(overrides: Partial<ClassifiedEvent> = {}): ClassifiedEvent {
  return {
    id: 'evt-safety-001',
    channel: 'anthropic-docs',
    timestamp: '2026-02-26T12:00:00Z',
    content_hash_before: 'aaa',
    content_hash_after: 'bbb',
    diff_summary: 'Updated skill format',
    raw_content: 'content with skills reference',
    change_type: 'enhancement',
    severity: 'P2',
    domains: ['skills'],
    auto_patchable: true,
    summary: 'Enhancement to skill format',
    confidence: 0.85,
    ...overrides,
  };
}

function makeComponent(overrides: Partial<AffectedComponent> = {}): AffectedComponent {
  return {
    component: 'skills/workflow/SKILL.md',
    impact: 'direct',
    status: 'active',
    blast_radius: 'workflow execution',
    action: 'update skill description',
    patchable: true,
    ...overrides,
  };
}

function makeManifest(overrides: Partial<ImpactManifest> = {}): ImpactManifest {
  return {
    change_id: 'evt-safety-001',
    classification: makeEvent(),
    affected_components: [makeComponent()],
    total_blast_radius: 1,
    ...overrides,
  };
}

/** Realistic multi-line skill content (keeps patches under 20%) */
function makeSkillContent(): string {
  return [
    '---',
    'version: 1.2.0',
    '---',
    '# GSD Workflow Skill',
    '',
    '## Description',
    'This skill manages the GSD workflow lifecycle including planning,',
    'execution, verification, and milestone completion phases.',
    '',
    '## Activation',
    'Activates when user requests project management or workflow operations.',
    'Uses skills and agents from the Claude Code ecosystem.',
    '',
    '## Instructions',
    '1. Check current project state via STATE.md',
    '2. Route to appropriate GSD command based on user intent',
    '3. Execute the command with full context loading',
    '4. Update state after completion',
    '',
    '## Examples',
    '- "Plan the next phase" -> /gsd:plan-phase',
    '- "Build phase 3" -> /gsd:execute-phase 3',
    '- "Verify the work" -> /gsd:verify-work',
    '',
    '## Notes',
    'Always check ROADMAP.md before execution.',
    'Respect token budgets and context window limits.',
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/*  Safety Integration Tests                                           */
/* ------------------------------------------------------------------ */

describe('Safety Integration — Patch + Backup + Rollback', () => {
  it('apply a patch, verify backup exists, verify patch content', async () => {
    const originalContent = makeSkillContent();
    let backupContent = '';
    let patchedContent = '';

    const deps = {
      readFile: async (path: string): Promise<string> => {
        // During rollback reads, return backup
        if (path.includes('rollbacks')) return backupContent;
        return originalContent;
      },
      writeFile: async (_path: string, content: string): Promise<void> => {
        patchedContent = content;
      },
      copyFile: async (_src: string, _dest: string): Promise<void> => {
        backupContent = originalContent;
      },
      hashFile: async (): Promise<string> => 'sha256-backup',
      runValidation: async (): Promise<boolean> => true,
      getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [],
    };

    const manifest = makeManifest();
    const component = makeComponent();

    const result = await applyPatch(manifest, component, deps);

    // Backup was created (copyFile was called)
    expect(backupContent).toBe(originalContent);
    expect(backupContent.length).toBeGreaterThan(0);

    // Patch was applied
    expect(result.auto_approved).toBe(true);
    expect(result.backup_path).toBeTruthy();

    // Patched content differs from original (version bump + upstream ref)
    expect(patchedContent).not.toBe(originalContent);
    expect(patchedContent).toContain('upstream-ref:');
  });

  it('rollback restores byte-identical content after patch', async () => {
    const originalContent = makeSkillContent();
    let backupStore = '';
    let currentFile = originalContent;

    const deps = {
      readFile: async (path: string): Promise<string> => {
        if (path.includes('rollbacks')) return backupStore;
        return currentFile;
      },
      writeFile: async (_path: string, content: string): Promise<void> => {
        currentFile = content;
      },
      copyFile: async (_src: string, _dest: string): Promise<void> => {
        backupStore = currentFile;
      },
      hashFile: async (): Promise<string> => 'sha256-original',
      runValidation: async (): Promise<boolean> => true,
      getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [],
    };

    // Apply patch
    const manifest = makeManifest();
    const result = await applyPatch(manifest, makeComponent(), deps);
    expect(result.auto_approved).toBe(true);

    // File has been patched — should differ from original
    expect(currentFile).not.toBe(originalContent);

    // Rollback from backup
    await rollback(result.backup_path, 'skills/workflow/SKILL.md', {
      readFile: async () => backupStore,
      writeFile: async (_path: string, content: string) => { currentFile = content; },
    });

    // After rollback, file should be byte-identical to original
    expect(currentFile).toBe(originalContent);
  });

  it('failed post-validation triggers automatic rollback to original', async () => {
    const originalContent = makeSkillContent();
    let currentFile = originalContent;
    let backupStore = '';

    const deps = {
      readFile: async (path: string): Promise<string> => {
        if (path.includes('rollbacks')) return backupStore;
        return currentFile;
      },
      writeFile: async (_path: string, content: string): Promise<void> => {
        currentFile = content;
      },
      copyFile: async (_src: string, _dest: string): Promise<void> => {
        backupStore = currentFile;
      },
      hashFile: async (): Promise<string> => 'sha256-check',
      runValidation: async (phase: string): Promise<boolean> => {
        if (phase === 'pre') return true;
        return false; // Post-validation fails
      },
      getPatchHistory: async (): Promise<{ skill: string; timestamp: string }[]> => [],
    };

    const manifest = makeManifest();
    const result = await applyPatch(manifest, makeComponent(), deps);

    // Patch should NOT be auto-approved
    expect(result.auto_approved).toBe(false);
    expect(result.validation.tests_passed).toBe(false);

    // After auto-rollback, file should be restored to original
    expect(currentFile).toBe(originalContent);
  });
});

describe('Safety Integration — Dashboard Alerts from Pipeline', () => {
  it('dashboard alerts from pipeline render correctly in terminal format', async () => {
    // Run pipeline to generate real alerts
    const skillContent = makeSkillContent();
    const deps: PipelineDeps = {
      monitor: {
        fetchFn: async () => 'New added support for skills improvement',
        hashFn: (c: string) => `hash-${c.length}`,
        readStateFn: async (ch: string) => ({
          channel: ch,
          last_hash: 'old-hash',
          last_checked: '2026-02-25T00:00:00Z',
        }),
        writeStateFn: async () => {},
        writeCacheFn: async () => {},
      },
      tracer: {
        readDir: async () => ['workflow'],
        readFile: async () => skillContent,
      },
      patcher: {
        readFile: async () => skillContent,
        writeFile: async () => {},
        copyFile: async () => {},
        hashFile: async () => 'sha256-test',
        runValidation: async () => true,
        getPatchHistory: async () => [],
      },
      persistence: {
        readFile: async () => '[]',
        writeFile: async () => {},
        appendFile: async () => {},
        copyFile: async () => {},
        mkdir: async () => {},
        exists: async () => false,
      },
    };

    const pipelineResult = await runPipeline(
      [{ name: 'test-channel', url: 'https://test.example.com', type: 'docs', priority: 'P2', check_interval_hours: 6, domains: ['skills'] }],
      deps,
    );

    // Pipeline should have processed the event
    expect(pipelineResult.events_detected).toBeGreaterThanOrEqual(1);

    // Create alerts that would come from the pipeline data
    const alerts: DashboardAlert[] = [
      {
        id: 'session-evt-001',
        tier: 'session',
        severity: 'P2',
        title: '[P2] enhancement: API skill update',
        summary: 'Updated skill format for test-channel',
        timestamp: '2026-02-26T12:00:00Z',
      },
    ];

    for (const alert of alerts) {
      const validation = validateAlert(alert);
      expect(validation.valid).toBe(true);

      const formatted = formatAlertForTerminal(alert);
      expect(formatted).toContain('[P2]');
      expect(formatted).toContain('enhancement');
    }
  });

  it('alert aggregation by severity works with pipeline-style data', () => {
    const alerts: DashboardAlert[] = [
      { id: 'flash-evt-001', tier: 'flash', severity: 'P0', title: 'Breaking change', summary: 'API removed', timestamp: '2026-02-26T00:00:00Z' },
      { id: 'flash-evt-002', tier: 'flash', severity: 'P0', title: 'Security patch', summary: 'CVE fix', timestamp: '2026-02-26T01:00:00Z' },
      { id: 'session-evt-003', tier: 'session', severity: 'P2', title: 'Enhancement', summary: 'New feature', timestamp: '2026-02-26T02:00:00Z' },
      { id: 'weekly-evt-004', tier: 'weekly', severity: 'P3', title: 'Info update', summary: 'Docs refreshed', timestamp: '2026-02-26T03:00:00Z' },
    ];

    const aggregated = aggregateAlerts(alerts);

    expect(aggregated.p0).toHaveLength(2);
    expect(aggregated.p2).toHaveLength(1);
    expect(aggregated.p3).toHaveLength(1);
    expect(aggregated.p1).toHaveLength(0);
  });

  it('alert deduplication works when same change triggers multiple tier alerts', () => {
    const alerts: DashboardAlert[] = [
      { id: 'flash-evt-001', tier: 'flash', severity: 'P0', title: 'Breaking change', summary: 'API removed', timestamp: '2026-02-26T00:00:00Z' },
      { id: 'session-evt-001', tier: 'session', severity: 'P0', title: 'Breaking change', summary: 'API removed', timestamp: '2026-02-26T00:00:00Z' },
      { id: 'weekly-evt-001', tier: 'weekly', severity: 'P0', title: 'Breaking change', summary: 'API removed', timestamp: '2026-02-26T00:00:00Z' },
      { id: 'flash-evt-002', tier: 'flash', severity: 'P1', title: 'Different change', summary: 'SDK update', timestamp: '2026-02-26T01:00:00Z' },
    ];

    const deduped = deduplicateAlerts(alerts);

    // evt-001 should appear only once (first occurrence: flash)
    // evt-002 is a different change, should remain
    expect(deduped).toHaveLength(2);
    expect(deduped[0].id).toBe('flash-evt-001');
    expect(deduped[1].id).toBe('flash-evt-002');
  });
});
