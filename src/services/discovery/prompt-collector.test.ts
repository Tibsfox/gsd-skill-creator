/**
 * TDD tests for prompt-collecting session processor wrapper.
 *
 * Tests createPromptCollectingProcessor which wraps the existing pattern
 * session processor to also collect user prompts grouped by project slug,
 * without modifying the original processor.
 *
 * Key constraint: AsyncGenerator can only be consumed once, so the wrapper
 * buffers all entries, routes user-prompts to the collector, then replays
 * entries to the pattern processor via a new generator.
 */

import { describe, it, expect } from 'vitest';
import { createPromptCollectingProcessor } from './prompt-collector.js';
import { PatternAggregator } from './pattern-aggregator.js';
import type { ParsedEntry, SessionInfo, ExtractedPrompt } from './types.js';
import type { CollectedPrompt, PromptCollectorResult } from './prompt-collector.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create an AsyncGenerator from an array of ParsedEntry for testing.
 */
async function* entriesFrom(items: ParsedEntry[]): AsyncGenerator<ParsedEntry> {
  for (const item of items) {
    yield item;
  }
}

/**
 * Create a tool-uses ParsedEntry with the given tool names.
 */
function toolUses(...names: string[]): ParsedEntry {
  return {
    kind: 'tool-uses',
    data: names.map(name => ({ name, input: {} })),
  };
}

/**
 * Create a user-prompt ParsedEntry.
 */
function userPrompt(text: string, sessionId = 'test-session', timestamp = '2026-01-01T00:00:00Z'): ParsedEntry {
  return {
    kind: 'user-prompt',
    data: { text, sessionId, timestamp, cwd: '/tmp' } satisfies ExtractedPrompt,
  };
}

/**
 * Create a skipped ParsedEntry.
 */
function skipped(type: string): ParsedEntry {
  return { kind: 'skipped', type };
}

/**
 * Create a minimal SessionInfo object.
 */
function makeSessionInfo(overrides: Partial<SessionInfo> & { fullPath: string; sessionId: string; projectSlug: string }): SessionInfo {
  return {
    fileMtime: Date.now(),
    messageCount: 10,
    created: '2026-01-01T00:00:00Z',
    modified: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create a fresh PromptCollectorResult.
 */
function makeResult(): PromptCollectorResult {
  return { prompts: new Map() };
}

// ============================================================================
// createPromptCollectingProcessor
// ============================================================================

describe('createPromptCollectingProcessor', () => {
  it('returns a function compatible with SessionProcessor type', () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    expect(typeof processor).toBe('function');
  });

  it('collects user-prompt entries into the result store', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'proj-a',
    });

    const entries = entriesFrom([
      userPrompt('This is a long enough prompt to be collected by the filter'),
      toolUses('Read'),
      userPrompt('Another prompt that passes the minimum length requirement'),
      toolUses('Edit'),
      userPrompt('Third prompt also long enough for collection purposes here'),
    ]);

    await processor(session, entries);

    const prompts = result.prompts.get('proj-a');
    expect(prompts).toBeDefined();
    expect(prompts).toHaveLength(3);
  });

  it('delegates all entries to the pattern processor (tool-uses still processed)', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'proj-a',
    });

    const entries = entriesFrom([
      userPrompt('Prompt text that is long enough to pass the filter easily'),
      toolUses('Read'),
      toolUses('Edit'),
      toolUses('Bash'),
    ]);

    await processor(session, entries);

    // Pattern processor should have received and processed tool-uses
    const results = aggregator.getResults();
    expect(results.get('tool:bigram:Read->Edit')).toBeDefined();
    expect(results.get('tool:bigram:Edit->Bash')).toBeDefined();
  });

  it('session with only tool-uses entries collects 0 prompts', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'proj-a',
    });

    const entries = entriesFrom([
      toolUses('Read'),
      toolUses('Edit'),
    ]);

    await processor(session, entries);

    // No prompts collected
    const prompts = result.prompts.get('proj-a');
    expect(prompts ?? []).toHaveLength(0);

    // But patterns still processed
    const results = aggregator.getResults();
    expect(results.get('tool:bigram:Read->Edit')).toBeDefined();
  });

  it('session with only user-prompt entries collects prompts and pattern processor receives entries', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'proj-a',
    });

    const entries = entriesFrom([
      userPrompt('A long prompt with enough characters to pass the minimum length filter'),
      userPrompt('Another sufficiently long prompt for collection purposes in testing'),
    ]);

    await processor(session, entries);

    // Prompts collected
    const prompts = result.prompts.get('proj-a')!;
    expect(prompts).toHaveLength(2);

    // Pattern processor produces empty patterns (no tool-uses)
    const results = aggregator.getResults();
    expect(results.size).toBe(0);
  });

  it('skips prompts shorter than 20 chars after trim', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'proj-a',
    });

    const entries = entriesFrom([
      userPrompt('short'),              // 5 chars - skipped
      userPrompt('   also short   '),   // 10 chars after trim - skipped
      userPrompt('exactly nineteen!!'), // 19 chars - skipped
      userPrompt('this is twenty chars'), // 20 chars - collected
      userPrompt('This prompt is definitely long enough to pass the minimum length requirement'),
    ]);

    await processor(session, entries);

    const prompts = result.prompts.get('proj-a')!;
    expect(prompts).toHaveLength(2);
    expect(prompts[0].text).toBe('this is twenty chars');
    expect(prompts[1].text).toContain('definitely long enough');
  });

  it('groups prompts by projectSlug in the result map', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    // Session for project A
    const sessionA = makeSessionInfo({
      fullPath: '/nonexistent/a.jsonl',
      sessionId: 'sess-a',
      projectSlug: 'project-alpha',
    });
    await processor(sessionA, entriesFrom([
      userPrompt('Prompt from project alpha session which is long enough'),
    ]));

    // Session for project B
    const sessionB = makeSessionInfo({
      fullPath: '/nonexistent/b.jsonl',
      sessionId: 'sess-b',
      projectSlug: 'project-beta',
    });
    await processor(sessionB, entriesFrom([
      userPrompt('Prompt from project beta session which is also long enough'),
    ]));

    expect(result.prompts.has('project-alpha')).toBe(true);
    expect(result.prompts.has('project-beta')).toBe(true);
    expect(result.prompts.get('project-alpha')!).toHaveLength(1);
    expect(result.prompts.get('project-beta')!).toHaveLength(1);
  });

  it('multiple sessions in same project accumulate prompts in same map entry', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session1 = makeSessionInfo({
      fullPath: '/nonexistent/s1.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'same-project',
    });
    await processor(session1, entriesFrom([
      userPrompt('First session prompt that is long enough to be collected'),
    ]));

    const session2 = makeSessionInfo({
      fullPath: '/nonexistent/s2.jsonl',
      sessionId: 'sess-2',
      projectSlug: 'same-project',
    });
    await processor(session2, entriesFrom([
      userPrompt('Second session prompt that is also long enough to collect'),
      userPrompt('Third prompt from second session also collected by filter'),
    ]));

    const prompts = result.prompts.get('same-project')!;
    expect(prompts).toHaveLength(3);
  });

  it('collected prompts have correct projectSlug field', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'my-project',
    });

    await processor(session, entriesFrom([
      userPrompt('A prompt long enough to be collected by the minimum length filter'),
    ]));

    const prompts = result.prompts.get('my-project')!;
    expect(prompts[0].projectSlug).toBe('my-project');
    expect(prompts[0].text).toContain('long enough');
    expect(prompts[0].sessionId).toBeDefined();
    expect(prompts[0].timestamp).toBeDefined();
  });

  it('handles empty generator gracefully', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'proj-a',
    });

    await processor(session, entriesFrom([]));

    // No prompts collected, no patterns
    expect(result.prompts.size).toBe(0);
    expect(aggregator.getResults().size).toBe(0);
  });

  it('preserves skipped entries when replaying to pattern processor', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'proj-a',
    });

    // Mix of all entry types
    const entries = entriesFrom([
      skipped('progress'),
      userPrompt('User prompt long enough for collection by the minimum length filter'),
      toolUses('Read'),
      skipped('system'),
      toolUses('Edit'),
    ]);

    await processor(session, entries);

    // Pattern processor should still see tool-uses through the replay
    const results = aggregator.getResults();
    expect(results.get('tool:bigram:Read->Edit')).toBeDefined();

    // Prompt collected
    expect(result.prompts.get('proj-a')!).toHaveLength(1);
  });

  it('handles session with 3 user-prompt and 5 tool-uses entries', async () => {
    const aggregator = new PatternAggregator();
    const result = makeResult();
    const processor = createPromptCollectingProcessor(aggregator, result);

    const session = makeSessionInfo({
      fullPath: '/nonexistent/session.jsonl',
      sessionId: 'sess-1',
      projectSlug: 'proj-a',
    });

    const entries = entriesFrom([
      userPrompt('First prompt that is definitely long enough to pass the filter'),
      toolUses('Read'),
      toolUses('Edit'),
      userPrompt('Second prompt also meeting the minimum length requirement here'),
      toolUses('Bash'),
      toolUses('Grep'),
      userPrompt('Third prompt that is sufficiently long for the collector filter'),
      toolUses('Write'),
    ]);

    await processor(session, entries);

    // 3 prompts collected
    expect(result.prompts.get('proj-a')!).toHaveLength(3);

    // 5 tool-uses entries produce tool sequence bigrams
    const results = aggregator.getResults();
    expect(results.get('tool:bigram:Read->Edit')).toBeDefined();
    expect(results.get('tool:bigram:Edit->Bash')).toBeDefined();
    expect(results.get('tool:bigram:Bash->Grep')).toBeDefined();
    expect(results.get('tool:bigram:Grep->Write')).toBeDefined();
  });
});
