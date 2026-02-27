import { describe, it, expect } from 'vitest';
import {
  validatePatchBounds,
  checkCooldown,
  applyPatch,
  createBackup,
  rollback,
  calculatePatchSize,
} from '../../src/upstream/patcher';
import type { PatcherDeps } from '../../src/upstream/patcher';
import { classifyChange, assignSeverity } from '../../src/upstream/classifier';
import { createRateLimiter } from '../../src/upstream/monitor';
import { getChannels, getChannel } from '../../src/upstream/registry';
import { appendLog, readLog } from '../../src/upstream/persistence';
import type { PersistenceDeps } from '../../src/upstream/persistence';
import { saveChannelState, loadChannelState } from '../../src/upstream/channel-state';
import type { ChannelStateDeps } from '../../src/upstream/channel-state';
import type {
  ClassifiedEvent,
  AffectedComponent,
  ImpactManifest,
  ChannelConfig,
  RawChangeEvent,
  ChannelState,
} from '../../src/upstream/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
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

/* ------------------------------------------------------------------ */
/*  Safety-Critical Tests (SC-01 through SC-14)                        */
/* ------------------------------------------------------------------ */

describe('Safety-Critical Test Suite', () => {
  it('SC-01: patch never exceeds 20% content change', () => {
    const result = validatePatchBounds(0.25, 'P2');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/20%|bound/i);

    // Edge: exactly 20% is allowed
    const edge = validatePatchBounds(0.20, 'P2');
    expect(edge.allowed).toBe(true);

    // Edge: 20.1% is rejected
    const over = validatePatchBounds(0.201, 'P2');
    expect(over.allowed).toBe(false);
  });

  it('SC-02: P0 changes never auto-patched', () => {
    const result = validatePatchBounds(0.01, 'P0');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/P0/);
  });

  it('SC-03: P1 changes never auto-patched', () => {
    const result = validatePatchBounds(0.01, 'P1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/P1/);
  });

  it('SC-04: security changes always escalate to P0', () => {
    const lowPriority = makeChannelConfig({ priority: 'P3' });
    const severity = assignSeverity('security', lowPriority);
    expect(severity).toBe('P0');

    const medPriority = makeChannelConfig({ priority: 'P2' });
    const severity2 = assignSeverity('security', medPriority);
    expect(severity2).toBe('P0');
  });

  it('SC-05: rollback restores byte-identical content', async () => {
    const original = 'Original skill content\nwith multiple lines\nand structure\nfor testing';
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

    await createBackup('skills/test/SKILL.md', '/rollbacks', deps);
    await rollback('/rollbacks/backup', 'skills/test/SKILL.md', deps);

    expect(restored).toBe(original);
    expect(restored.length).toBe(original.length);
  });

  it('SC-06: rate limiter never exceeds configured maximum', () => {
    const limiter = createRateLimiter(3, 60000);

    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    // 4th request within window should be rejected
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('SC-07: no authenticated access attempted (all channel URLs are public)', () => {
    const channels = getChannels();
    for (const ch of channels) {
      // URLs must not contain authentication tokens or credentials
      expect(ch.url).not.toMatch(/token=/i);
      expect(ch.url).not.toMatch(/api_key=/i);
      expect(ch.url).not.toMatch(/auth=/i);
      expect(ch.url).not.toMatch(/:\/\/[^/]*@/); // no user:pass@ in URL
      // All URLs should be HTTPS
      expect(ch.url).toMatch(/^https:\/\//);
    }
  });

  it('SC-08: intelligence log is append-only', async () => {
    let fileContent = '';

    const deps: Pick<PersistenceDeps, 'appendFile' | 'mkdir' | 'readFile' | 'exists'> = {
      appendFile: async (_path: string, content: string) => {
        fileContent += content;
      },
      mkdir: async () => {},
      readFile: async () => fileContent,
      exists: async () => fileContent.length > 0,
    };

    // Append three entries
    await appendLog('/logs/intel.jsonl', { id: 'a', data: 'first' }, deps);
    await appendLog('/logs/intel.jsonl', { id: 'b', data: 'second' }, deps);
    await appendLog('/logs/intel.jsonl', { id: 'c', data: 'third' }, deps);

    // Read them back
    const entries = await readLog<{ id: string; data: string }>('/logs/intel.jsonl', deps);

    expect(entries).toHaveLength(3);
    expect(entries[0].id).toBe('a');
    expect(entries[1].id).toBe('b');
    expect(entries[2].id).toBe('c');

    // Verify the file itself is newline-delimited (append-only structure)
    const lines = fileContent.trim().split('\n');
    expect(lines).toHaveLength(3);
  });

  it('SC-09: no fetch outside channel registry', () => {
    const channels = getChannels();
    const registeredUrls = channels.map((ch) => ch.url);

    // All channels must have a registered URL
    for (const url of registeredUrls) {
      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
    }

    // Verify getChannel returns undefined for unregistered channels
    const unknown = getChannel('unknown-channel');
    expect(unknown).toBeUndefined();
  });

  it('SC-10: backup created before every patch', async () => {
    const callOrder: string[] = [];

    const deps = makePatcherDeps({
      writeFile: async () => { callOrder.push('write'); },
      copyFile: async () => { callOrder.push('backup'); },
    });

    const manifest = makeManifest({
      classification: makeEvent({ severity: 'P2' }),
    });

    await applyPatch(manifest, makeComponent(), deps);

    expect(callOrder).toContain('backup');
    expect(callOrder).toContain('write');
    expect(callOrder.indexOf('backup')).toBeLessThan(callOrder.indexOf('write'));
  });

  it('SC-11: failed post-validation triggers rollback', async () => {
    let writeCount = 0;

    const deps = makePatcherDeps({
      writeFile: async () => { writeCount++; },
      runValidation: async (phase: string) => {
        if (phase === 'pre') return true;
        return false; // post-validation fails
      },
    });

    const manifest = makeManifest({
      classification: makeEvent({ severity: 'P2' }),
    });

    const result = await applyPatch(manifest, makeComponent(), deps);

    expect(result.validation.tests_passed).toBe(false);
    // writeCount > 1 means rollback was triggered (write patch + write rollback)
    expect(writeCount).toBeGreaterThan(1);
  });

  it('SC-12: channel state persists across sessions', async () => {
    let stored = '';

    const deps: ChannelStateDeps = {
      readFile: async () => stored,
      writeFile: async (_path: string, content: string) => { stored = content; },
      exists: async () => stored.length > 0,
    };

    const state: ChannelState = {
      channel: 'anthropic-docs',
      last_hash: 'sha256-aaa',
      last_checked: '2026-02-26T12:00:00Z',
      last_changed: '2026-02-25T08:00:00Z',
    };

    // Save state
    await saveChannelState('/state.json', state, deps);

    // Load it back (simulating new session)
    const loaded = await loadChannelState('/state.json', 'anthropic-docs', deps);

    expect(loaded).not.toBeNull();
    expect(loaded!.channel).toBe('anthropic-docs');
    expect(loaded!.last_hash).toBe('sha256-aaa');
    expect(loaded!.last_checked).toBe('2026-02-26T12:00:00Z');
    expect(loaded!.last_changed).toBe('2026-02-25T08:00:00Z');
  });

  it('SC-13: classified events include confidence score', () => {
    const event = makeRawEvent({
      diff_summary: 'BREAKING CHANGE: removed legacy endpoint',
      raw_content: 'The endpoint has been permanently removed.',
    });
    const config = makeChannelConfig();

    const classified = classifyChange(event, config);

    expect(classified.confidence).toBeDefined();
    expect(typeof classified.confidence).toBe('number');
    expect(classified.confidence).toBeGreaterThan(0);
    expect(classified.confidence).toBeLessThanOrEqual(1);
  });

  it('SC-14: cooldown period respected between re-patches', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const deps = {
      getPatchHistory: async () => [
        { skill: 'skills/target/SKILL.md', timestamp: threeDaysAgo.toISOString() },
      ],
    };

    const result = await checkCooldown('skills/target/SKILL.md', deps);

    expect(result.allowed).toBe(false);
    expect(result.cooldownUntil).toBeDefined();

    // Verify cooldown is approximately 7 days from the patch
    const cooldownDate = new Date(result.cooldownUntil!);
    const expectedCooldown = new Date(threeDaysAgo);
    expectedCooldown.setDate(expectedCooldown.getDate() + 7);

    // Should be within 1 second of expected
    expect(Math.abs(cooldownDate.getTime() - expectedCooldown.getTime())).toBeLessThan(1000);
  });
});
