import { describe, expect, it } from 'vitest';

import {
  CapturingProcessAuditSink,
  ProcessContextDenied,
  NULL_PROCESS_AUDIT_SINK,
  defaultProcessContext,
  ensureProcessAllowed,
  matchesCommandAllowList,
  type ProcessAuditRecord,
  type ProcessAuditSink,
  type ProcessContext,
} from './process-context.js';

describe('matchesCommandAllowList', () => {
  it('returns false for an empty allow-list', () => {
    expect(matchesCommandAllowList([], 'git')).toBe(false);
  });

  it('matches exact string entries for executables on PATH', () => {
    expect(matchesCommandAllowList(['git'], 'git')).toBe(true);
    expect(matchesCommandAllowList(['git'], 'git-lfs')).toBe(false);
  });

  it('matches directory prefixes when the pattern ends with /', () => {
    expect(matchesCommandAllowList(['/usr/local/bin/'], '/usr/local/bin/yosys')).toBe(true);
    expect(matchesCommandAllowList(['/usr/local/bin/'], '/usr/local/bin')).toBe(true);
    expect(matchesCommandAllowList(['/usr/local/bin/'], '/usr/bin/yosys')).toBe(false);
  });

  it('matches RegExp entries', () => {
    expect(matchesCommandAllowList([/^(git|tmux|npm)$/], 'tmux')).toBe(true);
    expect(matchesCommandAllowList([/^(git|tmux|npm)$/], 'sudo')).toBe(false);
  });

  it('matches predicate entries', () => {
    const knownTools = (c: string): boolean => ['git', 'tmux', 'wetty'].includes(c);
    expect(matchesCommandAllowList([knownTools], 'wetty')).toBe(true);
    expect(matchesCommandAllowList([knownTools], 'curl')).toBe(false);
  });

  it('admits a command that matches any of several patterns', () => {
    const patterns = ['git', /^npm$/, (c: string) => c.startsWith('/sandbox/')];
    expect(matchesCommandAllowList(patterns, 'git')).toBe(true);
    expect(matchesCommandAllowList(patterns, 'npm')).toBe(true);
    expect(matchesCommandAllowList(patterns, '/sandbox/exec')).toBe(true);
    expect(matchesCommandAllowList(patterns, 'rm')).toBe(false);
  });
});

describe('NULL_PROCESS_AUDIT_SINK', () => {
  it('accepts records without error', () => {
    expect(() =>
      NULL_PROCESS_AUDIT_SINK.record({
        source: 'test',
        op: 'exec',
        target: 'git',
        argv: ['status'],
        allowed: true,
        timestamp: 0,
      }),
    ).not.toThrow();
  });
});

describe('CapturingProcessAuditSink', () => {
  it('accumulates records in insertion order', () => {
    const sink = new CapturingProcessAuditSink();
    sink.record({
      source: 'a',
      op: 'exec',
      target: 'git',
      argv: ['status'],
      allowed: true,
      timestamp: 1,
    });
    sink.record({
      source: 'b',
      op: 'spawn',
      target: 'rm',
      argv: ['-rf', '/'],
      allowed: false,
      timestamp: 2,
    });
    expect(sink.records).toHaveLength(2);
    expect(sink.records[0]!.source).toBe('a');
    expect(sink.records[1]!.allowed).toBe(false);
    expect(sink.records[1]!.argv).toEqual(['-rf', '/']);
  });

  it('clear() empties the buffer in place', () => {
    const sink = new CapturingProcessAuditSink();
    const ref = sink.records;
    sink.record({
      source: 'a',
      op: 'exec',
      target: 'git',
      argv: [],
      allowed: true,
      timestamp: 1,
    });
    sink.clear();
    expect(sink.records).toHaveLength(0);
    expect(sink.records).toBe(ref);
  });
});

describe('defaultProcessContext', () => {
  it('admits any command', () => {
    const ctx = defaultProcessContext();
    expect(matchesCommandAllowList(ctx.allowList, 'git')).toBe(true);
    expect(matchesCommandAllowList(ctx.allowList, '/bin/rm')).toBe(true);
    expect(matchesCommandAllowList(ctx.allowList, '')).toBe(true);
  });

  it('uses NULL_PROCESS_AUDIT_SINK when no sink is provided', () => {
    const ctx = defaultProcessContext();
    expect(ctx.audit).toBe(NULL_PROCESS_AUDIT_SINK);
  });

  it('wires a custom audit sink through', () => {
    const sink = new CapturingProcessAuditSink();
    const ctx = defaultProcessContext(sink);
    expect(ctx.audit).toBe(sink);
  });
});

describe('ensureProcessAllowed', () => {
  it('is a no-op when ctx is undefined (legacy permissive mode)', () => {
    expect(() => ensureProcessAllowed(undefined, 'mod', 'exec', 'rm', ['-rf', '/'])).not.toThrow();
  });

  it('emits an audit record on allowed operations including argv', () => {
    const sink = new CapturingProcessAuditSink();
    const ctx: ProcessContext = { allowList: [/.*/], audit: sink };
    ensureProcessAllowed(ctx, 'git-collector', 'exec-file', 'git', ['status', '--porcelain'], 'cwd=/tmp');

    expect(sink.records).toHaveLength(1);
    const rec = sink.records[0]!;
    expect(rec.source).toBe('git-collector');
    expect(rec.op).toBe('exec-file');
    expect(rec.target).toBe('git');
    expect(rec.argv).toEqual(['status', '--porcelain']);
    expect(rec.allowed).toBe(true);
    expect(rec.note).toBe('cwd=/tmp');
    expect(typeof rec.timestamp).toBe('number');
  });

  it('defaults argv to an empty array when omitted', () => {
    const sink = new CapturingProcessAuditSink();
    const ctx: ProcessContext = { allowList: [/.*/], audit: sink };
    ensureProcessAllowed(ctx, 'mod', 'exec', 'pwd');
    expect(sink.records[0]!.argv).toEqual([]);
  });

  it('omits the note field when not provided', () => {
    const sink = new CapturingProcessAuditSink();
    const ctx: ProcessContext = { allowList: [/.*/], audit: sink };
    ensureProcessAllowed(ctx, 'mod', 'exec', 'pwd');
    expect(sink.records[0]).not.toHaveProperty('note');
  });

  it('emits an audit record and throws ProcessContextDenied on rejection', () => {
    const sink = new CapturingProcessAuditSink();
    const ctx: ProcessContext = { allowList: ['git'], audit: sink };

    expect(() =>
      ensureProcessAllowed(ctx, 'mod', 'spawn', 'rm', ['-rf', '/']),
    ).toThrow(ProcessContextDenied);

    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]!.allowed).toBe(false);
    expect(sink.records[0]!.argv).toEqual(['-rf', '/']);
  });

  it('attaches source/op/target/argv metadata to the thrown error', () => {
    const ctx: ProcessContext = { allowList: ['git'], audit: NULL_PROCESS_AUDIT_SINK };
    try {
      ensureProcessAllowed(ctx, 'dry-run-gate', 'exec', 'rm', ['-rf', '/']);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProcessContextDenied);
      const denied = err as ProcessContextDenied;
      expect(denied.source).toBe('dry-run-gate');
      expect(denied.op).toBe('exec');
      expect(denied.target).toBe('rm');
      expect(denied.argv).toEqual(['-rf', '/']);
    }
  });

  it('treats an empty allow-list as deny-all', () => {
    const sink = new CapturingProcessAuditSink();
    const ctx: ProcessContext = { allowList: [], audit: sink };
    expect(() => ensureProcessAllowed(ctx, 'mod', 'exec', 'pwd')).toThrow(ProcessContextDenied);
    expect(sink.records[0]!.allowed).toBe(false);
  });

  it('admits the operation when at least one pattern matches', () => {
    const sink = new CapturingProcessAuditSink();
    const ctx: ProcessContext = {
      allowList: ['git', /^(npm|yarn)$/, (c) => c === 'tmux'],
      audit: sink,
    };

    expect(() => ensureProcessAllowed(ctx, 'mod', 'exec', 'git', ['status'])).not.toThrow();
    expect(() => ensureProcessAllowed(ctx, 'mod', 'exec', 'npm', ['install'])).not.toThrow();
    expect(() => ensureProcessAllowed(ctx, 'mod', 'spawn', 'tmux', ['ls'])).not.toThrow();
    expect(() => ensureProcessAllowed(ctx, 'mod', 'exec', 'rm', ['-rf'])).toThrow();

    const allowedRecs = sink.records.filter((r) => r.allowed);
    const deniedRecs = sink.records.filter((r) => !r.allowed);
    expect(allowedRecs).toHaveLength(3);
    expect(deniedRecs).toHaveLength(1);
  });
});

describe('ProcessAuditSink — custom implementation', () => {
  it('accepts a plain object that implements the interface', () => {
    let count = 0;
    const sink: ProcessAuditSink = {
      record(_entry: ProcessAuditRecord): void {
        count += 1;
      },
    };
    const ctx: ProcessContext = { allowList: [/.*/], audit: sink };
    ensureProcessAllowed(ctx, 'mod', 'exec', 'git', ['status']);
    ensureProcessAllowed(ctx, 'mod', 'exec', 'git', ['log']);
    expect(count).toBe(2);
  });
});
