import { describe, it, expect, vi } from 'vitest';
import {
  validatePatchBounds,
  checkCooldown,
  applyPatch,
  createBackup,
  rollback,
  calculatePatchSize,
  generatePatchContent,
} from '../../src/upstream/patcher';
import type { PatcherDeps } from '../../src/upstream/patcher';
import {
  classifyChange,
  detectChangeType,
  assignSeverity,
  assessPatchability,
} from '../../src/upstream/classifier';
import { checkChannel, createRateLimiter } from '../../src/upstream/monitor';
import type { MonitorDeps } from '../../src/upstream/monitor';
import { getChannels } from '../../src/upstream/registry';
import { appendLog, readLog } from '../../src/upstream/persistence';
import type { PersistenceDeps } from '../../src/upstream/persistence';
import { loadAllChannelStates, loadChannelState } from '../../src/upstream/channel-state';
import type { ChannelStateDeps } from '../../src/upstream/channel-state';
import { deduplicateAlerts } from '../../src/upstream/dashboard-alerts';
import { generateBriefing, formatBriefingText } from '../../src/upstream/briefer';
import { findTransitiveImpacts } from '../../src/upstream/tracer';
import { loadAgentConfig } from '../../src/upstream/agents/index';
import type {
  ClassifiedEvent,
  AffectedComponent,
  ImpactManifest,
  ChannelConfig,
  ChannelState,
  RawChangeEvent,
  DashboardAlert,
} from '../../src/upstream/types';

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

function makeEvent(overrides: Partial<ClassifiedEvent> = {}): ClassifiedEvent {
  return {
    id: 'evt-sc-001',
    channel: 'anthropic-docs',
    timestamp: '2026-02-26T00:00:00Z',
    content_hash_before: 'aaa',
    content_hash_after: 'bbb',
    diff_summary: 'Updated skill format',
    raw_content: 'content',
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
    change_id: 'evt-sc-001',
    classification: makeEvent(),
    affected_components: [makeComponent()],
    total_blast_radius: 1,
    ...overrides,
  };
}

function makeSkillContent(): string {
  return [
    '---',
    'version: 1.0.0',
    '---',
    '# Upstream Skill',
    '',
    '## Description',
    'This skill monitors upstream changes from Anthropic public channels.',
    'It classifies diffs, traces impact, and generates intelligence briefings.',
    '',
    '## Activation',
    'Activates on upstream change detection events.',
    '',
    '## Instructions',
    '1. Monitor registered channels on schedule',
    '2. Hash content and compare to stored state',
    '3. Classify detected changes by type and severity',
    '4. Trace blast radius through dependency graph',
    '5. Generate patches or escalate for human review',
    '',
    '## Notes',
    'Rate limits are enforced per-channel.',
    'All intelligence logs are append-only.',
  ].join('\n');
}

function makeChannelConfig(overrides: Partial<ChannelConfig> = {}): ChannelConfig {
  return {
    name: 'anthropic-docs',
    url: 'https://docs.anthropic.com',
    type: 'documentation',
    priority: 'P0',
    check_interval_hours: 6,
    domains: ['skills', 'agents'],
    ...overrides,
  };
}

function makeRawEvent(overrides: Partial<RawChangeEvent> = {}): RawChangeEvent {
  return {
    id: 'evt-sc-raw-001',
    channel: 'anthropic-docs',
    timestamp: '2026-02-26T12:00:00Z',
    content_hash_before: 'hash-a',
    content_hash_after: 'hash-b',
    diff_summary: 'Content changed',
    raw_content: '<html>updated page</html>',
    ...overrides,
  };
}

function makePatcherDeps(overrides: Partial<PatcherDeps> = {}): PatcherDeps {
  return {
    readFile: async () => makeSkillContent(),
    writeFile: async () => {},
    copyFile: async () => {},
    hashFile: async () => 'sha256-test',
    runValidation: async () => true,
    getPatchHistory: async () => [],
    ...overrides,
  };
}

function makeAlert(overrides: Partial<DashboardAlert> = {}): DashboardAlert {
  return {
    id: 'flash-evt-001',
    tier: 'flash',
    severity: 'P0',
    title: 'Breaking change detected',
    summary: 'API endpoint removed',
    timestamp: '2026-02-26T00:00:00Z',
    ...overrides,
  };
}

/* ================================================================== */
/*  SC-01 through SC-14: Safety-Critical Tests                         */
/* ================================================================== */

describe('Safety-Critical Test Suite (SC-01 through SC-14)', () => {

  /* ---------------------------------------------------------------- */
  /*  SC-01: Rate limiter blocks beyond max requests                   */
  /* ---------------------------------------------------------------- */
  it('SC-01: rate limiter blocks requests beyond configured maximum', () => {
    const limiter = createRateLimiter(3, 60_000);

    // First 3 requests within window should succeed
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);

    // 4th and beyond should be blocked
    expect(limiter.tryAcquire()).toBe(false);
    expect(limiter.tryAcquire()).toBe(false);

    // Also verify with limit of 1
    const strict = createRateLimiter(1, 60_000);
    expect(strict.tryAcquire()).toBe(true);
    expect(strict.tryAcquire()).toBe(false);
  });

  /* ---------------------------------------------------------------- */
  /*  SC-02: Rate limiter window expiry re-allows requests             */
  /* ---------------------------------------------------------------- */
  it('SC-02: rate limiter re-allows requests after window expiry', () => {
    vi.useFakeTimers();
    try {
      const limiter = createRateLimiter(2, 100);

      // Exhaust the limit
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(true);
      expect(limiter.tryAcquire()).toBe(false);

      // Advance past window
      vi.advanceTimersByTime(150);

      // Should be allowed again
      expect(limiter.tryAcquire()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  /* ---------------------------------------------------------------- */
  /*  SC-03: First channel check seeds state, emits no event           */
  /* ---------------------------------------------------------------- */
  it('SC-03: first channel check seeds state and emits no event', async () => {
    const channel = makeChannelConfig({ name: 'test-ch' });
    let savedState: ChannelState | null = null;

    const deps: MonitorDeps = {
      fetchFn: async () => '<html>page content</html>',
      hashFn: () => 'sha256-seed',
      readStateFn: async () => null, // no prior state
      writeStateFn: async (state) => { savedState = state; },
      writeCacheFn: async () => {},
    };

    const event = await checkChannel(channel, deps);

    // No event on first check
    expect(event).toBeNull();
    // But state was seeded
    expect(savedState).not.toBeNull();
    expect(savedState!.channel).toBe('test-ch');
    expect(savedState!.last_hash).toBe('sha256-seed');
  });

  /* ---------------------------------------------------------------- */
  /*  SC-04: Unchanged content produces no event                       */
  /* ---------------------------------------------------------------- */
  it('SC-04: unchanged content produces no event', async () => {
    const HASH = 'sha256-unchanged';
    const channel = makeChannelConfig({ name: 'stable-ch' });
    const priorState: ChannelState = {
      channel: 'stable-ch',
      last_hash: HASH,
      last_checked: '2026-02-25T00:00:00Z',
    };

    const deps: MonitorDeps = {
      fetchFn: async () => 'same content',
      hashFn: () => HASH, // same hash
      readStateFn: async () => priorState,
      writeStateFn: async () => {},
      writeCacheFn: async () => {},
    };

    const event = await checkChannel(channel, deps);

    expect(event).toBeNull();
  });

  /* ---------------------------------------------------------------- */
  /*  SC-05: Rollback restores byte-identical content                  */
  /* ---------------------------------------------------------------- */
  it('SC-05: rollback restores byte-identical content', async () => {
    const original = 'Original skill content\nwith multiple lines\nand structure\nincluding special chars: é, ñ, ü';
    let backupStore = '';
    let restored = '';

    const deps = {
      readFile: async (path: string) => {
        if (path.includes('backup')) return backupStore;
        return original;
      },
      writeFile: async (_path: string, content: string) => {
        restored = content;
      },
      copyFile: async () => {
        backupStore = original;
      },
      hashFile: async () => 'sha256-abc123',
    };

    await createBackup('skills/test/SKILL.md', '/rollbacks/backup', deps);
    await rollback('/rollbacks/backup', 'skills/test/SKILL.md', deps);

    // Byte-identical verification
    expect(restored).toBe(original);
    expect(restored.length).toBe(original.length);
    // Every character must match
    for (let i = 0; i < original.length; i++) {
      expect(restored.charCodeAt(i)).toBe(original.charCodeAt(i));
    }
  });

  /* ---------------------------------------------------------------- */
  /*  SC-06: Patch exceeding 20% bound is rejected                     */
  /* ---------------------------------------------------------------- */
  it('SC-06: patch exceeding 20% content change is rejected', () => {
    // 25% — clearly over
    const result25 = validatePatchBounds(0.25, 'P2');
    expect(result25.allowed).toBe(false);
    expect(result25.reason).toMatch(/20%|bound/i);

    // 50% — far over
    const result50 = validatePatchBounds(0.50, 'P2');
    expect(result50.allowed).toBe(false);

    // 100% — total replacement
    const result100 = validatePatchBounds(1.0, 'P3');
    expect(result100.allowed).toBe(false);

    // Exactly 20% — boundary, should be allowed
    const edge = validatePatchBounds(0.20, 'P2');
    expect(edge.allowed).toBe(true);

    // 20.1% — just over, rejected
    const over = validatePatchBounds(0.201, 'P2');
    expect(over.allowed).toBe(false);

    // Under 20% — allowed
    const under = validatePatchBounds(0.15, 'P2');
    expect(under.allowed).toBe(true);
  });

  /* ---------------------------------------------------------------- */
  /*  SC-07: P0 severity never auto-patched                            */
  /* ---------------------------------------------------------------- */
  it('SC-07: P0 severity changes are never auto-patched', () => {
    // Even with tiny patch size
    const result = validatePatchBounds(0.01, 'P0');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/P0/);

    // Zero patch size
    const zeroSize = validatePatchBounds(0, 'P0');
    expect(zeroSize.allowed).toBe(false);

    // Classifier also marks P0 as non-patchable
    const patchable = assessPatchability('breaking', 'P0');
    expect(patchable).toBe(false);

    const secPatchable = assessPatchability('security', 'P0');
    expect(secPatchable).toBe(false);
  });

  /* ---------------------------------------------------------------- */
  /*  SC-08: P1 severity never auto-patched                            */
  /* ---------------------------------------------------------------- */
  it('SC-08: P1 severity changes are never auto-patched', () => {
    const result = validatePatchBounds(0.01, 'P1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/P1/);

    // Zero patch size
    const zeroSize = validatePatchBounds(0, 'P1');
    expect(zeroSize.allowed).toBe(false);

    // Classifier also blocks P1
    const patchable = assessPatchability('deprecation', 'P1');
    expect(patchable).toBe(false);
  });

  /* ---------------------------------------------------------------- */
  /*  SC-09: Breaking changes classified as P0                         */
  /* ---------------------------------------------------------------- */
  it('SC-09: breaking changes are always classified as P0', () => {
    // Breaking type always gets P0, regardless of channel priority
    const lowPriority = makeChannelConfig({ priority: 'P3' });
    expect(assignSeverity('breaking', lowPriority)).toBe('P0');

    const medPriority = makeChannelConfig({ priority: 'P2' });
    expect(assignSeverity('breaking', medPriority)).toBe('P0');

    const highPriority = makeChannelConfig({ priority: 'P0' });
    expect(assignSeverity('breaking', highPriority)).toBe('P0');

    // Security also gets P0
    expect(assignSeverity('security', lowPriority)).toBe('P0');

    // Full classification pipeline test
    const event = makeRawEvent({
      diff_summary: 'BREAKING CHANGE: removed legacy API endpoint',
      raw_content: 'The /v1/old endpoint has been permanently removed.',
    });
    const classified = classifyChange(event, lowPriority);
    expect(classified.change_type).toBe('breaking');
    expect(classified.severity).toBe('P0');
    expect(classified.auto_patchable).toBe(false);
  });

  /* ---------------------------------------------------------------- */
  /*  SC-10: Backup created before any write during patch              */
  /* ---------------------------------------------------------------- */
  it('SC-10: backup is created before any write operation during patch', async () => {
    const callOrder: string[] = [];

    const deps = makePatcherDeps({
      writeFile: async () => { callOrder.push('write'); },
      copyFile: async () => { callOrder.push('backup'); },
    });

    const manifest = makeManifest({
      classification: makeEvent({ severity: 'P2' }),
    });

    await applyPatch(manifest, makeComponent(), deps);

    // Backup must exist in the call order
    expect(callOrder).toContain('backup');
    expect(callOrder).toContain('write');

    // Backup must come BEFORE the first write
    const backupIdx = callOrder.indexOf('backup');
    const writeIdx = callOrder.indexOf('write');
    expect(backupIdx).toBeLessThan(writeIdx);
  });

  /* ---------------------------------------------------------------- */
  /*  SC-11: Post-validation failure triggers automatic rollback       */
  /* ---------------------------------------------------------------- */
  it('SC-11: failed post-validation triggers automatic rollback', async () => {
    const writtenContents: { path: string; content: string }[] = [];

    const deps = makePatcherDeps({
      readFile: async (path: string) => {
        // If reading a rollbacks path, return the original (simulating backup read)
        if (path.includes('rollbacks')) return makeSkillContent();
        return makeSkillContent();
      },
      writeFile: async (path: string, content: string) => {
        writtenContents.push({ path, content });
      },
      runValidation: async (phase: string) => {
        if (phase === 'pre') return true;
        return false; // post-validation fails
      },
    });

    const manifest = makeManifest({
      classification: makeEvent({ severity: 'P2' }),
    });

    const result = await applyPatch(manifest, makeComponent(), deps);

    // Patch should not be auto_approved
    expect(result.auto_approved).toBe(false);
    expect(result.validation.tests_passed).toBe(false);

    // There should be at least 2 writes: the patch attempt + the rollback restore
    expect(writtenContents.length).toBeGreaterThanOrEqual(2);
  });

  /* ---------------------------------------------------------------- */
  /*  SC-12: JSONL log is append-only (no data loss)                   */
  /* ---------------------------------------------------------------- */
  it('SC-12: JSONL log is append-only with no data loss', async () => {
    let fileContent = '';

    const deps: Pick<PersistenceDeps, 'appendFile' | 'mkdir' | 'readFile' | 'exists'> = {
      appendFile: async (_path: string, content: string) => {
        fileContent += content;
      },
      mkdir: async () => {},
      readFile: async () => fileContent,
      exists: async () => fileContent.length > 0,
    };

    // Append entries in sequence
    await appendLog('/logs/intel.jsonl', { id: 'a', data: 'first' }, deps);
    const afterFirst = fileContent;

    await appendLog('/logs/intel.jsonl', { id: 'b', data: 'second' }, deps);
    const afterSecond = fileContent;

    await appendLog('/logs/intel.jsonl', { id: 'c', data: 'third' }, deps);
    const afterThird = fileContent;

    // Each append only adds — never overwrites
    expect(afterSecond.startsWith(afterFirst)).toBe(true);
    expect(afterThird.startsWith(afterSecond)).toBe(true);

    // Read them back
    const entries = await readLog<{ id: string; data: string }>('/logs/intel.jsonl', deps);
    expect(entries).toHaveLength(3);
    expect(entries[0].id).toBe('a');
    expect(entries[1].id).toBe('b');
    expect(entries[2].id).toBe('c');

    // Verify newline-delimited structure
    const lines = fileContent.trim().split('\n');
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  /* ---------------------------------------------------------------- */
  /*  SC-13: Dashboard alert deduplication by change_id                */
  /* ---------------------------------------------------------------- */
  it('SC-13: dashboard alert deduplication removes duplicates by change_id', () => {
    // Same change_id (evt-001) appears in two different tiers
    const alerts: DashboardAlert[] = [
      makeAlert({ id: 'flash-evt-001', tier: 'flash', severity: 'P0' }),
      makeAlert({ id: 'session-evt-001', tier: 'session', severity: 'P0' }),
      makeAlert({ id: 'flash-evt-002', tier: 'flash', severity: 'P1' }),
      makeAlert({ id: 'weekly-evt-002', tier: 'weekly', severity: 'P1' }),
      makeAlert({ id: 'flash-evt-003', tier: 'flash', severity: 'P2' }),
    ];

    const deduped = deduplicateAlerts(alerts);

    // evt-001 and evt-002 each appear twice, so 2 duplicates removed
    expect(deduped).toHaveLength(3);

    // First occurrence of each change_id is kept
    const ids = deduped.map((a) => a.id);
    expect(ids).toContain('flash-evt-001');
    expect(ids).toContain('flash-evt-002');
    expect(ids).toContain('flash-evt-003');

    // Duplicates removed
    expect(ids).not.toContain('session-evt-001');
    expect(ids).not.toContain('weekly-evt-002');
  });

  /* ---------------------------------------------------------------- */
  /*  SC-14: 7-day cooldown between patches on same skill              */
  /* ---------------------------------------------------------------- */
  it('SC-14: 7-day cooldown prevents re-patching same skill too soon', async () => {
    // Patch was 3 days ago — within cooldown
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentDeps = {
      getPatchHistory: async () => [
        { skill: 'skills/target/SKILL.md', timestamp: threeDaysAgo.toISOString() },
      ],
    };

    const blocked = await checkCooldown('skills/target/SKILL.md', recentDeps);
    expect(blocked.allowed).toBe(false);
    expect(blocked.cooldownUntil).toBeDefined();

    // Verify cooldown ends ~7 days from the patch
    const cooldownDate = new Date(blocked.cooldownUntil!);
    const expectedEnd = new Date(threeDaysAgo);
    expectedEnd.setDate(expectedEnd.getDate() + 7);
    expect(Math.abs(cooldownDate.getTime() - expectedEnd.getTime())).toBeLessThan(1000);

    // Patch was 10 days ago — past cooldown
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const oldDeps = {
      getPatchHistory: async () => [
        { skill: 'skills/target/SKILL.md', timestamp: tenDaysAgo.toISOString() },
      ],
    };

    const allowed = await checkCooldown('skills/target/SKILL.md', oldDeps);
    expect(allowed.allowed).toBe(true);
    expect(allowed.cooldownUntil).toBeUndefined();

    // No history at all — allowed
    const emptyDeps = {
      getPatchHistory: async () => [] as { skill: string; timestamp: string }[],
    };

    const noHistory = await checkCooldown('skills/target/SKILL.md', emptyDeps);
    expect(noHistory.allowed).toBe(true);

    // Different skill — not affected by another skill's cooldown
    const otherSkillDeps = {
      getPatchHistory: async () => [
        { skill: 'skills/other/SKILL.md', timestamp: threeDaysAgo.toISOString() },
      ],
    };

    const otherSkill = await checkCooldown('skills/target/SKILL.md', otherSkillDeps);
    expect(otherSkill.allowed).toBe(true);
  });
});

/* ================================================================== */
/*  Edge Case Tests                                                    */
/* ================================================================== */

describe('Edge Case Tests', () => {

  /* ---------------------------------------------------------------- */
  /*  EC-01: Empty diff summary produces informational type            */
  /* ---------------------------------------------------------------- */
  it('EC-01: empty diff summary produces informational type', () => {
    const result = detectChangeType('', '');
    expect(result.type).toBe('informational');
    expect(result.confidence).toBe(0.4); // default low confidence
  });

  /* ---------------------------------------------------------------- */
  /*  EC-02: Null/empty raw content handled gracefully                 */
  /* ---------------------------------------------------------------- */
  it('EC-02: null/empty raw content handled gracefully', () => {
    // Empty raw_content with a meaningful diff_summary
    const result = detectChangeType('BREAKING CHANGE: removed API', '');
    expect(result.type).toBe('breaking');
    expect(result.confidence).toBeGreaterThan(0);

    // Both empty
    const emptyResult = detectChangeType('', '');
    expect(emptyResult.type).toBe('informational');

    // Classification with empty raw_content
    const event = makeRawEvent({
      diff_summary: 'security patch applied',
      raw_content: '',
    });
    const classified = classifyChange(event, makeChannelConfig());
    expect(classified).toBeDefined();
    expect(classified.change_type).toBe('security');
    expect(classified.summary).toBeTruthy();
  });

  /* ---------------------------------------------------------------- */
  /*  EC-03: Classifier handles content with multiple type keywords    */
  /*         (highest confidence wins)                                 */
  /* ---------------------------------------------------------------- */
  it('EC-03: classifier selects highest confidence when multiple type keywords present', () => {
    // Content mentions both breaking and enhancement keywords
    const diffSummary = 'BREAKING CHANGE: removed old API. Added support for new features.';
    const rawContent = 'The old endpoint has been permanently removed. Introducing new v3 API.';

    const result = detectChangeType(diffSummary, rawContent);

    // Breaking has weight 0.95 and should match multiple patterns
    // Enhancement has weight 0.80
    // Breaking should win because of higher weight
    expect(result.type).toBe('breaking');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  /* ---------------------------------------------------------------- */
  /*  EC-04: Tracer handles circular dependencies in graph             */
  /* ---------------------------------------------------------------- */
  it('EC-04: tracer handles circular dependencies without infinite loop', () => {
    const directImpacts: AffectedComponent[] = [
      {
        component: 'skills/alpha/SKILL.md',
        impact: 'direct',
        status: 'active',
        blast_radius: 'core',
        action: 'update',
        patchable: true,
      },
    ];

    // Circular graph: alpha -> beta -> gamma -> alpha
    const graph = new Map<string, string[]>([
      ['skills/alpha/SKILL.md', ['skills/gamma/SKILL.md']],
      ['skills/beta/SKILL.md', ['skills/alpha/SKILL.md']],
      ['skills/gamma/SKILL.md', ['skills/beta/SKILL.md']],
    ]);

    // Must complete without infinite loop
    const transitive = findTransitiveImpacts(directImpacts, graph);

    expect(Array.isArray(transitive)).toBe(true);
    // beta depends on alpha (directly impacted), so beta is transitive
    // gamma depends on beta (transitive), so gamma is transitive
    const names = transitive.map((t) => t.component);
    expect(names).toContain('skills/beta/SKILL.md');
    expect(names).toContain('skills/gamma/SKILL.md');
    // No duplicates
    expect(new Set(names).size).toBe(names.length);
  });

  /* ---------------------------------------------------------------- */
  /*  EC-05: Briefer handles zero changes gracefully                   */
  /* ---------------------------------------------------------------- */
  it('EC-05: briefer handles zero changes gracefully', () => {
    const briefing = generateBriefing('session', [], [], []);

    expect(briefing.tier).toBe('session');
    expect(briefing.changes).toHaveLength(0);
    expect(briefing.patches_applied).toHaveLength(0);
    expect(briefing.pending_decisions).toHaveLength(0);
    expect(briefing.dashboard_alerts).toHaveLength(0);
    expect(briefing.date).toBeTruthy();

    // Format should produce valid text without crashing
    const text = formatBriefingText(briefing);
    expect(text).toBeTruthy();
    expect(text).toContain('No upstream changes detected');
  });

  /* ---------------------------------------------------------------- */
  /*  EC-06: Persistence handles concurrent appends                    */
  /* ---------------------------------------------------------------- */
  it('EC-06: persistence handles concurrent appends without data loss', async () => {
    let fileContent = '';

    const deps: Pick<PersistenceDeps, 'appendFile' | 'mkdir' | 'readFile' | 'exists'> = {
      appendFile: async (_path: string, content: string) => {
        fileContent += content;
      },
      mkdir: async () => {},
      readFile: async () => fileContent,
      exists: async () => fileContent.length > 0,
    };

    // Simulate concurrent appends (all fire at once)
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(appendLog('/logs/concurrent.jsonl', { seq: i }, deps));
    }
    await Promise.all(promises);

    const entries = await readLog<{ seq: number }>('/logs/concurrent.jsonl', deps);

    // All 10 entries must be present
    expect(entries).toHaveLength(10);
    const seqs = entries.map((e) => e.seq).sort((a, b) => a - b);
    expect(seqs).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  /* ---------------------------------------------------------------- */
  /*  EC-07: Channel state recovery after missing file                 */
  /* ---------------------------------------------------------------- */
  it('EC-07: channel state recovers gracefully after missing file', async () => {
    // State file does not exist
    const missingDeps: Pick<ChannelStateDeps, 'readFile' | 'exists'> = {
      readFile: async () => { throw new Error('ENOENT'); },
      exists: async () => false,
    };

    const states = await loadAllChannelStates('/missing/state.json', missingDeps);
    expect(states).toEqual([]);

    // Corrupted state file
    const corruptDeps: Pick<ChannelStateDeps, 'readFile' | 'exists'> = {
      readFile: async () => '{not valid json array[',
      exists: async () => true,
    };

    const corrupt = await loadAllChannelStates('/corrupt/state.json', corruptDeps);
    expect(corrupt).toEqual([]);

    // State file with non-array JSON
    const nonArrayDeps: Pick<ChannelStateDeps, 'readFile' | 'exists'> = {
      readFile: async () => '{"not": "an array"}',
      exists: async () => true,
    };

    const nonArray = await loadAllChannelStates('/bad/state.json', nonArrayDeps);
    expect(nonArray).toEqual([]);
  });

  /* ---------------------------------------------------------------- */
  /*  EC-08: Agent YAML validation (required fields present)           */
  /* ---------------------------------------------------------------- */
  it('EC-08: agent YAML validation rejects configs with missing required fields', () => {
    // Missing name field
    const missingName = vi.fn().mockReturnValue(`
model: haiku
description: test
tools: [Read]
budget_tokens: 1000
trigger_contexts: [test]
`);
    expect(() => loadAgentConfig('bad-agent', missingName)).toThrow(/missing required fields/i);

    // Missing tools
    const missingTools = vi.fn().mockReturnValue(`
name: test-agent
model: haiku
description: test agent
budget_tokens: 1000
trigger_contexts: [test]
`);
    expect(() => loadAgentConfig('bad-agent', missingTools)).toThrow(/tool/i);

    // Empty tools array
    const emptyTools = vi.fn().mockReturnValue(`
name: test-agent
model: haiku
description: test agent
tools: []
budget_tokens: 1000
trigger_contexts: [test]
`);
    expect(() => loadAgentConfig('bad-agent', emptyTools)).toThrow(/tool/i);

    // Invalid budget_tokens
    const badBudget = vi.fn().mockReturnValue(`
name: test-agent
model: haiku
description: test agent
tools: [Read]
budget_tokens: -100
trigger_contexts: [test]
`);
    expect(() => loadAgentConfig('bad-agent', badBudget)).toThrow(/budget_tokens/i);

    // Valid config should not throw
    const validYaml = vi.fn().mockReturnValue(`
name: valid-agent
model: sonnet
description: a valid agent
tools: [Read, Bash]
budget_tokens: 5000
trigger_contexts: [testing]
`);
    expect(() => loadAgentConfig('valid-agent', validYaml)).not.toThrow();
  });
});
