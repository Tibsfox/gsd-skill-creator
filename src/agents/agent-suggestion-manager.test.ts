import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { AgentSuggestionManager } from './agent-suggestion-manager.js';
import { createChecksummedEntry } from '../validation/jsonl-safety.js';
import type { SessionObservation } from '../types/observation.js';

// ---------------------------------------------------------------------------
// 5.1a regression guard: loadSessions must unwrap the PatternStore checksummed
// envelope `{ timestamp, category, data, _checksum }`. Before this fix it did a
// bare `JSON.parse(line) as SessionObservation`, so `startTime`/`activeSkills`
// were undefined, every record failed the CoActivationTracker recency filter,
// and `agents suggest` was silently dead. These tests would FAIL against the
// old code (0 suggestions from enveloped data) — the negative test fixture.
// ---------------------------------------------------------------------------

describe('AgentSuggestionManager.loadSessions (envelope unwrap)', () => {
  const testDir = join(tmpdir(), `agent-suggestion-manager-test-${Date.now()}`);
  const sessionsPath = join(testDir, 'sessions.jsonl');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  /** Build a recent SessionObservation co-activating the given skills. */
  function obs(sessionId: string, skills: string[]): SessionObservation {
    const now = Date.now();
    return {
      sessionId,
      startTime: now - 60_000, // 1 min ago — well within the 14-day recency window
      endTime: now,
      durationMinutes: 1,
      source: 'startup',
      reason: 'clear',
      metrics: {
        userMessages: 1,
        assistantMessages: 1,
        toolCalls: 0,
        uniqueFilesRead: 0,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 0,
      },
      topCommands: [],
      topFiles: [],
      topTools: [],
      activeSkills: skills,
    };
  }

  /** Serialize an observation as PatternStore would: a checksummed envelope. */
  function envelopeLine(o: SessionObservation): string {
    const checksummed = createChecksummedEntry({
      timestamp: Date.now(),
      category: 'sessions',
      data: o as unknown as Record<string, unknown>,
    });
    return JSON.stringify(checksummed);
  }

  it('loads checksummed-envelope records past the recency filter (the real PatternStore format)', async () => {
    // 6 enveloped sessions all co-activating the same pair → cluster (detector
    // edge threshold is 5). The OLD bare-parse code yields 0 suggestions here.
    const lines: string[] = [];
    for (let i = 0; i < 6; i++) {
      lines.push(envelopeLine(obs(`enveloped-${i}`, ['skill-alpha', 'skill-beta'])));
    }
    await writeFile(sessionsPath, lines.join('\n') + '\n');

    const manager = new AgentSuggestionManager(testDir);
    const result = await manager.analyze(sessionsPath);

    expect(result.newSuggestions).toBeGreaterThanOrEqual(1);
    expect(result.suggestions[0].cluster.skills).toEqual(['skill-alpha', 'skill-beta']);
  });

  it('still reads legacy bare (un-enveloped) records', async () => {
    const lines: string[] = [];
    for (let i = 0; i < 6; i++) {
      lines.push(JSON.stringify(obs(`bare-${i}`, ['skill-alpha', 'skill-beta'])));
    }
    await writeFile(sessionsPath, lines.join('\n') + '\n');

    const manager = new AgentSuggestionManager(testDir);
    const result = await manager.analyze(sessionsPath);

    expect(result.newSuggestions).toBeGreaterThanOrEqual(1);
  });

  it('skips a tampered-checksum envelope without throwing', async () => {
    const lines: string[] = [];
    for (let i = 0; i < 6; i++) {
      lines.push(envelopeLine(obs(`good-${i}`, ['skill-alpha', 'skill-beta'])));
    }
    // A structurally-valid envelope whose _checksum does NOT match its data.
    const tampered = createChecksummedEntry({
      timestamp: Date.now(),
      category: 'sessions',
      data: obs('tampered', ['skill-alpha', 'skill-beta']) as unknown as Record<string, unknown>,
    });
    tampered._checksum = 'deadbeef'.repeat(8); // 64 hex chars, wrong digest
    lines.push(JSON.stringify(tampered));

    await writeFile(sessionsPath, lines.join('\n') + '\n');

    const manager = new AgentSuggestionManager(testDir);
    const result = await manager.analyze(sessionsPath);
    // The 6 valid envelopes still produce the cluster; the tampered one is dropped
    // (skipped, never thrown).
    expect(result.newSuggestions).toBeGreaterThanOrEqual(1);
    expect(result.suggestions.some(s => s.cluster.skills.includes('skill-alpha'))).toBe(true);
  });

  it('skips malformed lines and tolerates a missing file', async () => {
    const valid = Array.from({ length: 6 }, (_, i) =>
      envelopeLine(obs(`mixed-${i}`, ['skill-alpha', 'skill-beta'])),
    );
    const lines = [valid[0], 'THIS IS NOT JSON {{{', '', ...valid.slice(1)];
    await writeFile(sessionsPath, lines.join('\n') + '\n');

    const manager = new AgentSuggestionManager(testDir);
    const result = await manager.analyze(sessionsPath);
    expect(result.newSuggestions).toBeGreaterThanOrEqual(1);

    // Missing file → no crash, no suggestions.
    const empty = await new AgentSuggestionManager(testDir).analyze(
      join(testDir, 'does-not-exist.jsonl'),
    );
    expect(empty.newSuggestions).toBe(0);
  });
});
