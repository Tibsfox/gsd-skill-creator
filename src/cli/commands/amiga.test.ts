/**
 * Tests for the `amiga` CLI command + its extracted pipeline/reader libs.
 *
 * Deterministic, CI-safe (all 3 OS legs): builds in-memory sessions and tmpdir
 * transcript fixtures — never reads the real ~/.claude projects dir, never
 * writes to the real .planning/patterns. Mirrors the tmpdir SuggestionStore
 * round-trip from src/amiga/spike/__tests__/candidate-mapper.test.ts.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, basename } from 'node:path';

import { amigaCommand } from './amiga.js';
import {
  readTranscript,
  listTranscripts,
  largestTranscript,
  defaultProjectsDir,
} from '../../amiga/spike/transcript-reader.js';
import {
  analyzeSession,
  selectEmitCandidates,
  mappedCandidatesFor,
  aggregateCorpus,
} from '../../amiga/spike/revive-pipeline.js';
import type { TranscriptSession } from '../../amiga/spike/session-event-bridge.js';
import { SuggestionStore } from '../../detection/suggestion-store.js';
import {
  defaultLoaderContext,
  CapturingAuditSink,
  LoaderContextDenied,
} from '../../security/loader-context.js';

const T0 = Date.parse('2026-05-28T10:00:00.000Z');

/** A repeating cross-tool session that yields structural + workflow candidates. */
function sampleSession(sessionId: string, reps = 5): TranscriptSession {
  const order = ['Bash', 'Edit', 'Read'];
  const tools = Array.from({ length: reps * order.length }, (_unused, i) => ({
    tool: order[i % order.length]!,
  }));
  return { sessionId, startMs: T0, endMs: T0 + tools.length, tools };
}

/** Write a Claude Code transcript JSONL (one tool_use per line). */
function writeTranscript(dir: string, name: string, sessionId: string, toolNames: string[]): string {
  const path = join(dir, name);
  const lines = toolNames.map((tool, i) =>
    JSON.stringify({
      sessionId,
      timestamp: new Date(T0 + i * 1000).toISOString(),
      message: { content: [{ type: 'tool_use', name: tool }] },
    }),
  );
  writeFileSync(path, lines.join('\n') + '\n', 'utf8');
  return path;
}

const tmpdirs: string[] = [];
function mkTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpdirs.push(d);
  return d;
}

afterEach(() => {
  vi.restoreAllMocks();
  while (tmpdirs.length) {
    rmSync(tmpdirs.pop()!, { recursive: true, force: true });
  }
});

describe('transcript-reader', () => {
  it('defaultProjectsDir slugs the cwd under ~/.claude/projects', () => {
    // Build the expected via join() so the assertion is separator-agnostic
    // (the windows CI leg is load-bearing; path.win32.join normalizes slashes).
    const dir = defaultProjectsDir('/media/foxy/ai/proj', '/home/u');
    expect(basename(dir)).toBe('-media-foxy-ai-proj');
    expect(dir).toBe(join('/home/u', '.claude', 'projects', '-media-foxy-ai-proj'));
  });

  it('defaultProjectsDir defaults to the real homedir root', () => {
    expect(defaultProjectsDir()).toContain(join(homedir(), '.claude', 'projects'));
  });

  it('listTranscripts returns [] for a missing dir and largest-first otherwise', () => {
    expect(listTranscripts(join(tmpdir(), 'amiga-does-not-exist-xyz'))).toEqual([]);
    const dir = mkTmp('amiga-list-');
    writeTranscript(dir, 'small.jsonl', 's1', ['Bash', 'Edit']);
    writeTranscript(dir, 'big.jsonl', 's2', Array(20).fill('Bash'));
    const files = listTranscripts(dir);
    expect(files).toHaveLength(2);
    expect(files[0]!.endsWith('big.jsonl')).toBe(true); // largest first
    expect(largestTranscript(dir)!.endsWith('big.jsonl')).toBe(true);
  });

  it('readTranscript distills the ordered tool-use stream + session id', () => {
    const dir = mkTmp('amiga-read-');
    const path = writeTranscript(dir, 't.jsonl', 'sess-abc', ['Bash', 'Edit', 'Read', 'Bash']);
    const session = readTranscript(path);
    expect(session.sessionId).toBe('sess-abc');
    expect(session.tools.map((t) => t.tool)).toEqual(['Bash', 'Edit', 'Read', 'Bash']);
    expect(session.startMs).toBe(T0);
    expect(session.endMs).toBeGreaterThanOrEqual(session.startMs);
  });

  it('routes fs reads through the LoaderContext chokepoint (audits + denies)', () => {
    const dir = mkTmp('amiga-loaderctx-');
    const path = writeTranscript(dir, 't.jsonl', 'sess-ctx', ['Bash', 'Edit']);

    // Permissive-but-audited context records one read per op.
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    readTranscript(path, ctx);
    listTranscripts(dir, ctx);
    expect(sink.records.some((r) => r.op === 'read-file' && r.target === path)).toBe(true);
    expect(sink.records.some((r) => r.op === 'read-dir' && r.target === dir)).toBe(true);
    expect(sink.records.every((r) => r.allowed)).toBe(true);

    // A context whose allow-list excludes the path denies before touching disk.
    const denying = { allowList: ['/some/other/place/'], audit: new CapturingAuditSink() };
    expect(() => readTranscript(path, denying)).toThrow(LoaderContextDenied);
  });
});

describe('revive-pipeline', () => {
  it('analyzeSession drives the dormant detector + CE-1 over a real session', () => {
    const a = analyzeSession(sampleSession('sess-1'));
    expect(a.missionDetection.has_candidates).toBe(true);
    // one ledger entry per tool-use, no errors.
    expect(a.attribution.captured).toBe(a.toolCount);
    expect(a.attribution.errors).toBe(0);
    expect(a.attribution.weights.length).toBeGreaterThan(0);
    expect(a.attribution.weightSum).toBeCloseTo(1, 5);
  });

  it('analyzeSession throws on a too-short session', () => {
    expect(() => analyzeSession({ sessionId: 'x', startMs: T0, endMs: T0, tools: [{ tool: 'Bash' }] })).toThrow();
  });

  it('selectEmitCandidates keeps structural + cross-tool workflows, drops self-loops', () => {
    const a = analyzeSession(sampleSession('sess-2'));
    const picked = selectEmitCandidates(a);
    expect(picked.length).toBeGreaterThan(0);
    for (const c of picked) {
      const [from, to] = c.trigger_pattern.split('->');
      if (c.detection_method === 'sequence_repetition') {
        expect(from).not.toBe(to); // no self-loops
        expect(c.evidence.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('mappedCandidatesFor produces SC candidates with stable amiga-* ids', () => {
    const mapped = mappedCandidatesFor(analyzeSession(sampleSession('sess-3')));
    expect(mapped.length).toBeGreaterThan(0);
    for (const c of mapped) {
      expect(c.id.startsWith('amiga-')).toBe(true);
      expect(c.type).toBe('workflow');
    }
  });

  it('aggregateCorpus dedupes by id and sums occurrences across sessions', () => {
    const a1 = analyzeSession(sampleSession('sess-a'));
    const a2 = analyzeSession(sampleSession('sess-b'));
    const single = aggregateCorpus([a1]);
    const both = aggregateCorpus([a1, a2]);

    expect(both.sessionsAnalyzed).toBe(2);
    expect(both.totalToolUses).toBe(a1.toolCount + a2.toolCount);
    expect(both.totalCaptured).toBe(a1.attribution.captured + a2.attribution.captured);

    // ids are unique within the aggregate (deduped).
    const ids = both.candidates.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);

    // a shared candidate accrues more occurrences across the two sessions.
    const sharedId = single.candidates[0]!.id;
    const inSingle = single.candidates.find((c) => c.id === sharedId)!;
    const inBoth = both.candidates.find((c) => c.id === sharedId)!;
    expect(inBoth.occurrences).toBeGreaterThan(inSingle.occurrences);
    expect(inBoth.evidence.sessionIds).toEqual(expect.arrayContaining(['sess-a', 'sess-b']));
  });
});

describe('amigaCommand', () => {
  it('--help returns 0 without touching disk', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    expect(await amigaCommand(['--help'])).toBe(0);
  });

  it('reports an error (exit 1) when the projects dir has no transcripts', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void logs.push(String(m)));
    const empty = mkTmp('amiga-empty-');
    const code = await amigaCommand(['--corpus', '--json', '--projects-dir', empty]);
    expect(code).toBe(1);
    expect(JSON.parse(logs.join('\n'))).toMatchObject({ error: expect.stringContaining('no transcripts') });
  });

  it('--corpus --emit lands candidates in the SuggestionStore and is idempotent', async () => {
    const projects = mkTmp('amiga-corpus-');
    const patterns = mkTmp('amiga-patterns-');
    const seq = ['Bash', 'Edit', 'Read', 'Bash', 'Edit', 'Read', 'Bash', 'Edit', 'Read'];
    writeTranscript(projects, 's1.jsonl', 'sess-1', seq);
    writeTranscript(projects, 's2.jsonl', 'sess-2', seq);

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void logs.push(String(m)));

    const code = await amigaCommand([
      '--corpus', '--emit', '--json',
      '--projects-dir', projects,
      '--patterns-dir', patterns,
    ]);
    expect(code).toBe(0);

    const out = JSON.parse(logs.join('\n'));
    expect(out.mode).toBe('corpus');
    expect(out.sessionsAnalyzed).toBe(2);
    expect(out.seamProven).toBe(true);
    expect(out.emit.added).toBeGreaterThan(0);

    // The candidates really landed in the store.
    const store = new SuggestionStore(patterns);
    const pending = await store.getPending();
    expect(pending.length).toBe(out.emit.added);
    expect(pending.every((s) => s.candidate.id.startsWith('amiga-'))).toBe(true);

    // Second emit is a full dedupe (idempotent ids → 0 new).
    logs.length = 0;
    expect(await amigaCommand([
      '--corpus', '--emit', '--json',
      '--projects-dir', projects,
      '--patterns-dir', patterns,
    ])).toBe(0);
    expect(JSON.parse(logs.join('\n')).emit.added).toBe(0);
  });

  it('single mode (explicit transcript) proves the seam in --json', async () => {
    const projects = mkTmp('amiga-single-');
    const path = writeTranscript(projects, 'one.jsonl', 'sess-solo',
      ['Bash', 'Edit', 'Read', 'Bash', 'Edit', 'Read', 'Bash', 'Edit', 'Read']);

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void logs.push(String(m)));

    const code = await amigaCommand([path, '--json']);
    expect(code).toBe(0);
    const out = JSON.parse(logs.join('\n'));
    expect(out.mode).toBe('single');
    expect(out.sessionId).toBe('sess-solo');
    expect(out.seamProven).toBe(true);
    expect(out.emit).toBeUndefined(); // dry-run by default
  });
});
