import { describe, it, expect } from 'vitest';
import { detectChangeType, classifyChange } from '../../../src/integrations/upstream/classifier';
import { appendLog, readLog } from '../../../src/integrations/upstream/persistence';
import type { PersistenceDeps } from '../../../src/integrations/upstream/persistence';
import { createRateLimiter } from '../../../src/integrations/upstream/monitor';
import { loadAllChannelStates } from '../../../src/integrations/upstream/channel-state';
import { getChannels } from '../../../src/integrations/upstream/registry';
import type { RawChangeEvent, ChannelConfig } from '../../../src/integrations/upstream/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeRawEvent(overrides: Partial<RawChangeEvent> = {}): RawChangeEvent {
  return {
    id: 'evt-edge-001',
    channel: 'anthropic-docs',
    timestamp: '2026-02-26T12:00:00Z',
    content_hash_before: 'hash-a',
    content_hash_after: 'hash-b',
    diff_summary: 'Content changed',
    raw_content: '<html>updated page</html>',
    ...overrides,
  };
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

/* ------------------------------------------------------------------ */
/*  Edge Case Tests                                                    */
/* ------------------------------------------------------------------ */

describe('Edge Cases', () => {
  it('empty diff summary classification returns informational', () => {
    const result = detectChangeType('', '');
    expect(result.type).toBe('informational');
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('multiple sequential log appends do not corrupt each other', async () => {
    let fileContent = '';

    const deps: Pick<PersistenceDeps, 'appendFile' | 'mkdir' | 'readFile' | 'exists'> = {
      appendFile: async (_path: string, content: string) => {
        fileContent += content;
      },
      mkdir: async () => {},
      readFile: async () => fileContent,
      exists: async () => fileContent.length > 0,
    };

    // Rapidly append 20 entries
    for (let i = 0; i < 20; i++) {
      await appendLog('/logs/test.jsonl', { seq: i, value: `entry-${i}` }, deps);
    }

    const entries = await readLog<{ seq: number; value: string }>('/logs/test.jsonl', deps);

    expect(entries).toHaveLength(20);
    for (let i = 0; i < 20; i++) {
      expect(entries[i].seq).toBe(i);
      expect(entries[i].value).toBe(`entry-${i}`);
    }

    // Verify each line is valid JSON
    const lines = fileContent.trim().split('\n');
    expect(lines).toHaveLength(20);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it('very large diff (10000 chars) handled by classifier', () => {
    const largeDiff = 'A'.repeat(10000);
    const largeContent = 'B'.repeat(10000);

    // Should not throw and should return a valid result
    const result = detectChangeType(largeDiff, largeContent);

    expect(result.type).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('unicode content in change events', () => {
    const event = makeRawEvent({
      diff_summary: 'Added support for 日本語 characters and emoji 🎉',
      raw_content: 'Introducing new internationalization: 中文, العربية, हिन्दी — now supports unicode fully.',
    });
    const config = makeChannelConfig();

    const classified = classifyChange(event, config);

    expect(classified).toBeDefined();
    expect(classified.change_type).toBeDefined();
    expect(classified.summary).toBeTruthy();
    // The unicode content should survive classification
    expect(classified.diff_summary).toContain('日本語');
  });

  it('classifier handles empty raw_content', () => {
    const result = detectChangeType('BREAKING CHANGE: removed API', '');
    expect(result.type).toBe('breaking');
    expect(result.confidence).toBeGreaterThan(0);

    // Also test with both empty
    const emptyResult = detectChangeType('', '');
    expect(emptyResult.type).toBe('informational');
  });

  it('rate limiter resets after window expires', async () => {
    // Use a very short window (1ms) so it expires immediately
    const limiter = createRateLimiter(1, 1);

    expect(limiter.tryAcquire()).toBe(true);
    // Immediately should be rejected
    expect(limiter.tryAcquire()).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 5));

    // Should be allowed again after window expires
    expect(limiter.tryAcquire()).toBe(true);
  });

  it('channel state with missing fields still loads gracefully', async () => {
    // Simulate a state file with partial/malformed data
    const deps = {
      readFile: async () => JSON.stringify([
        { channel: 'anthropic-docs', last_hash: 'abc', last_checked: '2026-01-01T00:00:00Z' },
        { channel: 'minimal' },
      ]),
      exists: async () => true,
    };

    const states = await loadAllChannelStates('/state.json', deps);

    expect(states).toHaveLength(2);
    expect(states[0].channel).toBe('anthropic-docs');
    // Missing optional fields should not crash
    expect(states[1].channel).toBe('minimal');
  });

  it('duplicate channel names in registry detected', () => {
    const channels = getChannels();
    const names = channels.map((ch) => ch.name);
    const uniqueNames = new Set(names);

    // Every channel name in the registry should be unique
    expect(names.length).toBe(uniqueNames.size);
  });
});
