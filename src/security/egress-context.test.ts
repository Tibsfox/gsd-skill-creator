import { describe, expect, it } from 'vitest';

import {
  CapturingEgressAuditSink,
  EgressContextDenied,
  NULL_EGRESS_AUDIT_SINK,
  defaultEgressContext,
  ensureEgressAllowed,
  matchesUrlAllowList,
  type EgressAuditRecord,
  type EgressAuditSink,
  type EgressContext,
} from './egress-context.js';

describe('matchesUrlAllowList', () => {
  it('returns false for an empty allow-list', () => {
    expect(matchesUrlAllowList([], 'https://api.osv.dev/v1/querybatch')).toBe(false);
  });

  it('matches exact string entries for endpoint URLs', () => {
    expect(
      matchesUrlAllowList(
        ['https://api.osv.dev/v1/querybatch'],
        'https://api.osv.dev/v1/querybatch',
      ),
    ).toBe(true);
    expect(
      matchesUrlAllowList(
        ['https://api.osv.dev/v1/querybatch'],
        'https://api.osv.dev/v1/querybatch?x=1',
      ),
    ).toBe(false);
  });

  it('matches host/path prefixes when the pattern ends with /', () => {
    expect(
      matchesUrlAllowList(['https://api.osv.dev/'], 'https://api.osv.dev/v1/querybatch'),
    ).toBe(true);
    expect(
      matchesUrlAllowList(['https://api.osv.dev/'], 'https://api.osv.dev/v2/anything'),
    ).toBe(true);
    expect(matchesUrlAllowList(['https://api.osv.dev/'], 'https://api.osv.dev')).toBe(true);
    expect(
      matchesUrlAllowList(['https://api.osv.dev/'], 'https://malicious.example.com/v1/x'),
    ).toBe(false);
  });

  it('matches RegExp entries', () => {
    expect(
      matchesUrlAllowList([/^https:\/\/.*\.osv\.dev\//], 'https://api.osv.dev/v1/x'),
    ).toBe(true);
    expect(matchesUrlAllowList([/^https:\/\/.*\.osv\.dev\//], 'http://api.osv.dev/v1/x')).toBe(
      false,
    );
  });

  it('matches predicate entries', () => {
    const httpsOnly = (u: string): boolean => u.startsWith('https://');
    expect(matchesUrlAllowList([httpsOnly], 'https://api.example.com/x')).toBe(true);
    expect(matchesUrlAllowList([httpsOnly], 'http://api.example.com/x')).toBe(false);
  });

  it('admits a URL that matches any of several patterns', () => {
    const patterns = [
      'https://api.osv.dev/v1/querybatch',
      /^https:\/\/registry\.npmjs\.org\//,
      (u: string) => u.includes('/safe/'),
    ];
    expect(matchesUrlAllowList(patterns, 'https://api.osv.dev/v1/querybatch')).toBe(true);
    expect(matchesUrlAllowList(patterns, 'https://registry.npmjs.org/lodash')).toBe(true);
    expect(matchesUrlAllowList(patterns, 'https://internal/safe/data')).toBe(true);
    expect(matchesUrlAllowList(patterns, 'https://evil.example.com/exfil')).toBe(false);
  });
});

describe('NULL_EGRESS_AUDIT_SINK', () => {
  it('accepts records without error', () => {
    expect(() =>
      NULL_EGRESS_AUDIT_SINK.record({
        source: 'test',
        op: 'fetch',
        target: 'https://x.example/',
        allowed: true,
        timestamp: 0,
      }),
    ).not.toThrow();
  });
});

describe('CapturingEgressAuditSink', () => {
  it('accumulates records in insertion order', () => {
    const sink = new CapturingEgressAuditSink();
    sink.record({
      source: 'a',
      op: 'fetch',
      target: 'https://a.example/',
      allowed: true,
      timestamp: 1,
    });
    sink.record({
      source: 'b',
      op: 'websocket-open',
      target: 'wss://b.example/',
      allowed: false,
      timestamp: 2,
    });
    expect(sink.records).toHaveLength(2);
    expect(sink.records[0]!.source).toBe('a');
    expect(sink.records[1]!.allowed).toBe(false);
  });

  it('clear() empties the buffer in place', () => {
    const sink = new CapturingEgressAuditSink();
    const ref = sink.records;
    sink.record({
      source: 'a',
      op: 'fetch',
      target: 'https://a.example/',
      allowed: true,
      timestamp: 1,
    });
    sink.clear();
    expect(sink.records).toHaveLength(0);
    expect(sink.records).toBe(ref);
  });
});

describe('defaultEgressContext', () => {
  it('admits any URL', () => {
    const ctx = defaultEgressContext();
    expect(matchesUrlAllowList(ctx.allowList, 'https://anywhere.example/')).toBe(true);
    expect(matchesUrlAllowList(ctx.allowList, 'http://evil.example/exfil')).toBe(true);
    expect(matchesUrlAllowList(ctx.allowList, '')).toBe(true);
  });

  it('uses NULL_EGRESS_AUDIT_SINK when no sink is provided', () => {
    const ctx = defaultEgressContext();
    expect(ctx.audit).toBe(NULL_EGRESS_AUDIT_SINK);
  });

  it('wires a custom audit sink through', () => {
    const sink = new CapturingEgressAuditSink();
    const ctx = defaultEgressContext(sink);
    expect(ctx.audit).toBe(sink);
  });
});

describe('ensureEgressAllowed', () => {
  it('is a no-op when ctx is undefined (legacy permissive mode)', () => {
    expect(() =>
      ensureEgressAllowed(undefined, 'mod', 'fetch', 'http://evil.example/exfil'),
    ).not.toThrow();
  });

  it('emits an audit record on allowed operations', () => {
    const sink = new CapturingEgressAuditSink();
    const ctx: EgressContext = { allowList: [/.*/], audit: sink };
    ensureEgressAllowed(ctx, 'osv-client', 'fetch', 'https://api.osv.dev/v1/x', 'POST');

    expect(sink.records).toHaveLength(1);
    const rec = sink.records[0]!;
    expect(rec.source).toBe('osv-client');
    expect(rec.op).toBe('fetch');
    expect(rec.target).toBe('https://api.osv.dev/v1/x');
    expect(rec.allowed).toBe(true);
    expect(rec.note).toBe('POST');
    expect(typeof rec.timestamp).toBe('number');
  });

  it('omits the note field when not provided', () => {
    const sink = new CapturingEgressAuditSink();
    const ctx: EgressContext = { allowList: [/.*/], audit: sink };
    ensureEgressAllowed(ctx, 'mod', 'fetch', 'https://x.example/');
    expect(sink.records[0]).not.toHaveProperty('note');
  });

  it('emits an audit record and throws EgressContextDenied on rejection', () => {
    const sink = new CapturingEgressAuditSink();
    const ctx: EgressContext = {
      allowList: ['https://api.osv.dev/'],
      audit: sink,
    };

    expect(() =>
      ensureEgressAllowed(ctx, 'mod', 'fetch', 'https://evil.example/exfil'),
    ).toThrow(EgressContextDenied);

    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]!.allowed).toBe(false);
  });

  it('attaches source/op/target metadata to the thrown error', () => {
    const ctx: EgressContext = {
      allowList: ['https://api.osv.dev/'],
      audit: NULL_EGRESS_AUDIT_SINK,
    };
    try {
      ensureEgressAllowed(ctx, 'dependency-auditor/osv-client', 'fetch', 'https://evil/');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EgressContextDenied);
      const denied = err as EgressContextDenied;
      expect(denied.source).toBe('dependency-auditor/osv-client');
      expect(denied.op).toBe('fetch');
      expect(denied.target).toBe('https://evil/');
    }
  });

  it('treats an empty allow-list as deny-all', () => {
    const sink = new CapturingEgressAuditSink();
    const ctx: EgressContext = { allowList: [], audit: sink };
    expect(() => ensureEgressAllowed(ctx, 'mod', 'fetch', 'https://anywhere/')).toThrow(
      EgressContextDenied,
    );
    expect(sink.records[0]!.allowed).toBe(false);
  });

  it('admits the operation when at least one pattern matches', () => {
    const sink = new CapturingEgressAuditSink();
    const ctx: EgressContext = {
      allowList: [
        'https://api.osv.dev/v1/querybatch',
        /^https:\/\/registry\.npmjs\.org\//,
        (u) => u === 'https://exact-allow',
      ],
      audit: sink,
    };

    expect(() =>
      ensureEgressAllowed(ctx, 'mod', 'fetch', 'https://registry.npmjs.org/lodash'),
    ).not.toThrow();
    expect(() =>
      ensureEgressAllowed(ctx, 'mod', 'fetch', 'https://exact-allow'),
    ).not.toThrow();
    expect(() =>
      ensureEgressAllowed(ctx, 'mod', 'fetch', 'https://api.osv.dev/v1/querybatch'),
    ).not.toThrow();
    expect(() => ensureEgressAllowed(ctx, 'mod', 'fetch', 'https://evil/x')).toThrow();

    const allowedRecs = sink.records.filter((r) => r.allowed);
    const deniedRecs = sink.records.filter((r) => !r.allowed);
    expect(allowedRecs).toHaveLength(3);
    expect(deniedRecs).toHaveLength(1);
  });
});

describe('EgressAuditSink — custom implementation', () => {
  it('accepts a plain object that implements the interface', () => {
    let count = 0;
    const sink: EgressAuditSink = {
      record(_entry: EgressAuditRecord): void {
        count += 1;
      },
    };
    const ctx: EgressContext = { allowList: [/.*/], audit: sink };
    ensureEgressAllowed(ctx, 'mod', 'fetch', 'https://a/');
    ensureEgressAllowed(ctx, 'mod', 'fetch', 'https://b/');
    expect(count).toBe(2);
  });
});
