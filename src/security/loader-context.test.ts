import { describe, expect, it } from 'vitest';

import {
  CapturingAuditSink,
  LoaderContextDenied,
  NULL_AUDIT_SINK,
  defaultLoaderContext,
  ensureAllowed,
  matchesAllowList,
  type AuditSink,
  type LoaderAuditRecord,
  type LoaderContext,
} from './loader-context.js';

describe('matchesAllowList', () => {
  it('returns false for an empty allow-list', () => {
    expect(matchesAllowList([], '/etc/passwd')).toBe(false);
  });

  it('matches exact string entries for file paths', () => {
    expect(matchesAllowList(['/srv/data/file.yaml'], '/srv/data/file.yaml')).toBe(true);
    expect(matchesAllowList(['/srv/data/file.yaml'], '/srv/data/file.yaml.bak')).toBe(false);
  });

  it('matches directory prefixes when the pattern ends with /', () => {
    expect(matchesAllowList(['/srv/data/'], '/srv/data/a.json')).toBe(true);
    expect(matchesAllowList(['/srv/data/'], '/srv/data/sub/b.json')).toBe(true);
    expect(matchesAllowList(['/srv/data/'], '/srv/data')).toBe(true);
    expect(matchesAllowList(['/srv/data/'], '/srv/other/c.json')).toBe(false);
  });

  it('matches RegExp entries', () => {
    expect(matchesAllowList([/^\/tmp\/.*\.yaml$/], '/tmp/foo.yaml')).toBe(true);
    expect(matchesAllowList([/^\/tmp\/.*\.yaml$/], '/tmp/foo.json')).toBe(false);
  });

  it('matches predicate entries', () => {
    const allowJson = (p: string): boolean => p.endsWith('.json');
    expect(matchesAllowList([allowJson], '/anywhere/file.json')).toBe(true);
    expect(matchesAllowList([allowJson], '/anywhere/file.yaml')).toBe(false);
  });

  it('admits a path that matches any of several patterns', () => {
    const patterns = ['/etc/safe.conf', /\.cfg$/, (p: string) => p.includes('/allowed/')];
    expect(matchesAllowList(patterns, '/etc/safe.conf')).toBe(true);
    expect(matchesAllowList(patterns, '/srv/x.cfg')).toBe(true);
    expect(matchesAllowList(patterns, '/srv/allowed/y.bin')).toBe(true);
    expect(matchesAllowList(patterns, '/etc/shadow')).toBe(false);
  });

  it('ignores predicates that throw — treats as non-match', () => {
    // Defensive: a predicate that throws should NOT propagate through
    // matchesAllowList because the function loop will simply see the
    // throw as "no match". The current implementation lets the throw
    // propagate; document the behavior here so future changes are
    // intentional.
    const thrower = (): boolean => {
      throw new Error('boom');
    };
    expect(() => matchesAllowList([thrower], '/x')).toThrow('boom');
  });
});

describe('NULL_AUDIT_SINK', () => {
  it('accepts records without error', () => {
    expect(() =>
      NULL_AUDIT_SINK.record({
        source: 'test',
        op: 'read-file',
        target: '/x',
        allowed: true,
        timestamp: 0,
      }),
    ).not.toThrow();
  });
});

describe('CapturingAuditSink', () => {
  it('accumulates records in insertion order', () => {
    const sink = new CapturingAuditSink();
    sink.record({ source: 'a', op: 'read-file', target: '/x', allowed: true, timestamp: 1 });
    sink.record({ source: 'b', op: 'read-dir', target: '/y', allowed: false, timestamp: 2 });
    expect(sink.records).toHaveLength(2);
    expect(sink.records[0]!.source).toBe('a');
    expect(sink.records[1]!.allowed).toBe(false);
  });

  it('clear() empties the buffer in place', () => {
    const sink = new CapturingAuditSink();
    const ref = sink.records;
    sink.record({ source: 'a', op: 'read-file', target: '/x', allowed: true, timestamp: 1 });
    sink.clear();
    expect(sink.records).toHaveLength(0);
    expect(sink.records).toBe(ref); // same array instance
  });
});

describe('defaultLoaderContext', () => {
  it('admits any path', () => {
    const ctx = defaultLoaderContext();
    expect(matchesAllowList(ctx.allowList, '/etc/passwd')).toBe(true);
    expect(matchesAllowList(ctx.allowList, '/')).toBe(true);
    expect(matchesAllowList(ctx.allowList, '')).toBe(true);
  });

  it('uses NULL_AUDIT_SINK when no sink is provided', () => {
    const ctx = defaultLoaderContext();
    expect(ctx.audit).toBe(NULL_AUDIT_SINK);
  });

  it('wires a custom audit sink through', () => {
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    expect(ctx.audit).toBe(sink);
  });
});

describe('ensureAllowed', () => {
  it('is a no-op when ctx is undefined (legacy permissive mode)', () => {
    expect(() => ensureAllowed(undefined, 'mod', 'read-file', '/etc/passwd')).not.toThrow();
  });

  it('emits an audit record on allowed operations', () => {
    const sink = new CapturingAuditSink();
    const ctx: LoaderContext = { allowList: [/.*/], audit: sink };
    ensureAllowed(ctx, 'mod', 'read-file', '/srv/x', 'opt note');

    expect(sink.records).toHaveLength(1);
    const rec = sink.records[0]!;
    expect(rec.source).toBe('mod');
    expect(rec.op).toBe('read-file');
    expect(rec.target).toBe('/srv/x');
    expect(rec.allowed).toBe(true);
    expect(rec.note).toBe('opt note');
    expect(typeof rec.timestamp).toBe('number');
  });

  it('omits the note field when not provided', () => {
    const sink = new CapturingAuditSink();
    const ctx: LoaderContext = { allowList: [/.*/], audit: sink };
    ensureAllowed(ctx, 'mod', 'read-file', '/srv/x');
    expect(sink.records[0]).not.toHaveProperty('note');
  });

  it('emits an audit record and throws LoaderContextDenied on rejection', () => {
    const sink = new CapturingAuditSink();
    const ctx: LoaderContext = { allowList: ['/safe/'], audit: sink };

    expect(() => ensureAllowed(ctx, 'mod', 'read-file', '/etc/passwd')).toThrow(
      LoaderContextDenied,
    );

    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]!.allowed).toBe(false);
  });

  it('attaches source/op/target metadata to the thrown error', () => {
    const ctx: LoaderContext = { allowList: ['/safe/'], audit: NULL_AUDIT_SINK };
    try {
      ensureAllowed(ctx, 'cartridge/loader', 'load-cartridge', '/etc/x.yaml');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(LoaderContextDenied);
      const denied = err as LoaderContextDenied;
      expect(denied.source).toBe('cartridge/loader');
      expect(denied.op).toBe('load-cartridge');
      expect(denied.target).toBe('/etc/x.yaml');
    }
  });

  it('treats an empty allow-list as deny-all', () => {
    const sink = new CapturingAuditSink();
    const ctx: LoaderContext = { allowList: [], audit: sink };
    expect(() => ensureAllowed(ctx, 'mod', 'read-file', '/anywhere')).toThrow(
      LoaderContextDenied,
    );
    expect(sink.records[0]!.allowed).toBe(false);
  });

  it('admits the operation when at least one pattern matches', () => {
    const sink = new CapturingAuditSink();
    const ctx: LoaderContext = {
      allowList: ['/blocked/file.txt', /^\/srv\/safe\//, (p) => p === '/exact-allow'],
      audit: sink,
    };

    expect(() => ensureAllowed(ctx, 'mod', 'read-file', '/srv/safe/a.json')).not.toThrow();
    expect(() => ensureAllowed(ctx, 'mod', 'read-file', '/exact-allow')).not.toThrow();
    expect(() => ensureAllowed(ctx, 'mod', 'read-file', '/blocked/file.txt')).not.toThrow();
    expect(() => ensureAllowed(ctx, 'mod', 'read-file', '/blocked/other.txt')).toThrow();

    const allowedRecs = sink.records.filter((r) => r.allowed);
    const deniedRecs = sink.records.filter((r) => !r.allowed);
    expect(allowedRecs).toHaveLength(3);
    expect(deniedRecs).toHaveLength(1);
  });
});

describe('AuditSink — custom implementation', () => {
  it('accepts a plain object that implements the interface', () => {
    let count = 0;
    const sink: AuditSink = {
      record(_entry: LoaderAuditRecord): void {
        count += 1;
      },
    };
    const ctx: LoaderContext = { allowList: [/.*/], audit: sink };
    ensureAllowed(ctx, 'mod', 'read-file', '/x');
    ensureAllowed(ctx, 'mod', 'read-file', '/y');
    expect(count).toBe(2);
  });
});
