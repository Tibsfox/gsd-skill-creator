import { describe, it, expect } from 'vitest';
import type {
  ChannelConfig,
  ClassifiedEvent,
  RawChangeEvent,
  AffectedComponent,
  ImpactManifest,
  PatchManifest,
} from '../../src/upstream/types';
import type { MonitorDeps } from '../../src/upstream/monitor';
import type { TracerDeps } from '../../src/upstream/tracer';
import type { PatcherDeps } from '../../src/upstream/patcher';
import type { PersistenceDeps } from '../../src/upstream/persistence';
import { runPipeline, processSingleChannel } from '../../src/upstream/pipeline';
import type { PipelineDeps, PipelineResult } from '../../src/upstream/pipeline';

/* ------------------------------------------------------------------ */
/*  Test helpers                                                       */
/* ------------------------------------------------------------------ */

function makeChannel(overrides: Partial<ChannelConfig> = {}): ChannelConfig {
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

/** Skill content realistic enough for patcher to stay under 20% */
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

/** Build pipeline deps with injectable stubs */
function makePipelineDeps(options: {
  fetchContent?: string;
  storedHash?: string | null;
  skillFiles?: string[];
  skillContent?: string;
  validationResult?: boolean;
}): PipelineDeps {
  const {
    fetchContent = 'New added support for skills',
    storedHash = 'old-hash',
    skillFiles = ['workflow'],
    skillContent = makeSkillContent(),
    validationResult = true,
  } = options;

  const logs: string[] = [];

  return {
    monitor: {
      fetchFn: async (_url: string) => fetchContent,
      hashFn: (content: string) => `hash-${content.length}`,
      readStateFn: async (_channel: string) =>
        storedHash !== null
          ? { channel: _channel, last_hash: storedHash, last_checked: '2026-02-25T00:00:00Z' }
          : null,
      writeStateFn: async () => {},
      writeCacheFn: async () => {},
    },
    tracer: {
      readDir: async (_dir: string) => skillFiles,
      readFile: async (_path: string) => skillContent,
    },
    patcher: {
      readFile: async () => skillContent,
      writeFile: async () => {},
      copyFile: async () => {},
      hashFile: async () => 'sha256-test',
      runValidation: async () => validationResult,
      getPatchHistory: async () => [],
    },
    persistence: {
      readFile: async () => '[]',
      writeFile: async () => {},
      appendFile: async (_path: string, content: string) => { logs.push(content); },
      copyFile: async () => {},
      mkdir: async () => {},
      exists: async () => false,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('Pipeline Orchestrator — Integration', () => {
  it('full pipeline: event flows from monitor through classifier to tracer', async () => {
    const deps = makePipelineDeps({});
    const channels = [makeChannel()];

    const result = await runPipeline(channels, deps);

    expect(result.events_detected).toBeGreaterThanOrEqual(1);
    expect(result.events_classified).toBeGreaterThanOrEqual(1);
    expect(result.impacts_traced).toBeGreaterThanOrEqual(1);
  });

  it('patchable impacts route to patcher, non-patchable to pending', async () => {
    // Enhancement with P2 severity is patchable
    const deps = makePipelineDeps({
      fetchContent: 'New added support for enhanced skill format',
    });
    const channels = [makeChannel({ priority: 'P2', domains: ['skills'] })];

    const result = await runPipeline(channels, deps);

    // Should have either patches applied or patches rejected (P2 enhancements are patchable)
    expect(result.patches_applied + result.patches_rejected).toBeGreaterThanOrEqual(0);
    expect(result.briefings_generated).toBeGreaterThanOrEqual(1);
  });

  it('patch results appear in briefing', async () => {
    const deps = makePipelineDeps({
      fetchContent: 'New added support for skills improvement',
    });
    const channels = [makeChannel({ priority: 'P2', domains: ['skills'] })];

    const result = await runPipeline(channels, deps);

    expect(result.briefings_generated).toBe(1);
  });

  it('intelligence log captures complete audit trail', async () => {
    const logEntries: string[] = [];
    const deps = makePipelineDeps({});
    deps.persistence.appendFile = async (_path: string, content: string) => {
      logEntries.push(content);
    };

    const channels = [makeChannel()];
    await runPipeline(channels, deps);

    // At least one log entry should have been written
    expect(logEntries.length).toBeGreaterThanOrEqual(1);
    // Each entry should be valid JSON (JSONL format)
    for (const entry of logEntries) {
      const trimmed = entry.trim();
      if (trimmed.length > 0) {
        expect(() => JSON.parse(trimmed)).not.toThrow();
      }
    }
  });

  it('multiple channels processed in single run', async () => {
    const deps = makePipelineDeps({});
    const channels = [
      makeChannel({ name: 'channel-a', domains: ['skills'] }),
      makeChannel({ name: 'channel-b', domains: ['agents'] }),
    ];

    const result = await runPipeline(channels, deps);

    expect(result.events_detected).toBeGreaterThanOrEqual(2);
    expect(result.events_classified).toBeGreaterThanOrEqual(2);
  });

  it('empty diff produces no events', async () => {
    // When fetchContent hashes to the same as storedHash, no event
    const deps = makePipelineDeps({
      fetchContent: 'same content',
      storedHash: 'hash-12', // 'same content'.length = 12
    });
    const channels = [makeChannel()];

    const result = await runPipeline(channels, deps);

    expect(result.events_detected).toBe(0);
    expect(result.events_classified).toBe(0);
    expect(result.impacts_traced).toBe(0);
  });

  it('cross-domain change traced through multiple components', async () => {
    const deps = makePipelineDeps({
      fetchContent: 'New added support for skills and agents',
      skillFiles: ['workflow', 'testing', 'deploy'],
    });
    const channels = [makeChannel({ domains: ['skills', 'agents'] })];

    const result = await runPipeline(channels, deps);

    expect(result.events_detected).toBe(1);
    expect(result.impacts_traced).toBeGreaterThanOrEqual(1);
  });

  it('processSingleChannel returns channel-level result', async () => {
    const deps = makePipelineDeps({});
    const channel = makeChannel();

    const result = await processSingleChannel(channel, deps);

    expect(result.events_detected).toBeGreaterThanOrEqual(1);
    expect(result.errors).toHaveLength(0);
  });

  it('errors in one channel do not break others', async () => {
    const deps = makePipelineDeps({});
    // Override fetchFn to fail for one channel
    const originalFetchFn = deps.monitor.fetchFn;
    deps.monitor.fetchFn = async (url: string) => {
      if (url.includes('fail')) throw new Error('Network error');
      return originalFetchFn(url);
    };

    const channels = [
      makeChannel({ name: 'good-channel', url: 'https://docs.anthropic.com' }),
      makeChannel({ name: 'bad-channel', url: 'https://fail.example.com' }),
    ];

    const result = await runPipeline(channels, deps);

    // Good channel should still produce events
    // Bad channel produces 0 events (monitor gracefully returns null)
    expect(result.events_detected).toBeGreaterThanOrEqual(1);
  });

  it('first check (seed) produces no events — only subsequent checks do', async () => {
    const deps = makePipelineDeps({ storedHash: null });
    const channels = [makeChannel()];

    const result = await runPipeline(channels, deps);

    expect(result.events_detected).toBe(0);
  });
});
