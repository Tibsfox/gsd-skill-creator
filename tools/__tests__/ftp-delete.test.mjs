/**
 * tools/__tests__/ftp-delete.test.mjs — invariants for the ftp-delete tool.
 *
 * Same hermetic pattern as ftp-sync.test.mjs: synthesized inputs into the
 * pure-functional surface (parseRemotePath, classifyTarget, validateDeleteTargets);
 * NO FTP connection is opened in tests. The wire-protocol surface is exercised
 * indirectly via integration verification when the operator runs the tool.
 *
 * Run via: npx vitest run --config vitest.tools.config.mjs
 */
import { describe, it, expect } from 'vitest';

import {
  PROTECTED_PATHS,
  parseRemotePath,
  classifyTarget,
  validateDeleteTargets,
} from '../ftp-delete.mjs';

describe('parseRemotePath — input validation', () => {
  it('accepts a simple subpath', () => {
    expect(parseRemotePath('/SCRIBE/dashboard')).toEqual({ ok: true, path: '/SCRIBE/dashboard' });
  });

  it('accepts deep subpaths', () => {
    expect(parseRemotePath('/SCRIBE/dashboard/data/sample-graph.json'))
      .toEqual({ ok: true, path: '/SCRIBE/dashboard/data/sample-graph.json' });
  });

  it('strips a single trailing slash', () => {
    expect(parseRemotePath('/SCRIBE/dashboard/')).toEqual({ ok: true, path: '/SCRIBE/dashboard' });
  });

  it('preserves the root slash', () => {
    expect(parseRemotePath('/')).toEqual({ ok: true, path: '/' });
  });

  it('rejects empty string', () => {
    const r = parseRemotePath('');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/empty/i);
  });

  it('rejects undefined / non-string', () => {
    expect(parseRemotePath(undefined).ok).toBe(false);
    expect(parseRemotePath(null).ok).toBe(false);
    expect(parseRemotePath(42).ok).toBe(false);
  });

  it('rejects relative paths (no leading slash)', () => {
    const r = parseRemotePath('SCRIBE/dashboard');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/must start with \//);
  });

  it('rejects paths containing .. segment', () => {
    const r = parseRemotePath('/SCRIBE/../etc/passwd');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/may not contain/i);
  });

  it('rejects paths containing . segment', () => {
    const r = parseRemotePath('/SCRIBE/./dashboard');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/may not contain/i);
  });

  it('rejects paths containing null byte', () => {
    const r = parseRemotePath('/SCRIBE/x\0/y');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/null byte/);
  });
});

describe('PROTECTED_PATHS — must include all top-level deploy targets', () => {
  it('includes /, /NASA, /MUS, /ELC, /SCRIBE, /Research', () => {
    for (const p of ['/', '/NASA', '/MUS', '/ELC', '/SCRIBE', '/Research']) {
      expect(PROTECTED_PATHS.has(p)).toBe(true);
    }
  });
});

describe('classifyTarget — protected-path refusal', () => {
  it('blocks /SCRIBE itself by default', () => {
    const r = classifyTarget('/SCRIBE');
    expect(r.protected).toBe(true);
    expect(r.blocked).toBe(true);
    expect(r.reason).toMatch(/refusing/i);
  });

  it('blocks / by default', () => {
    expect(classifyTarget('/').blocked).toBe(true);
  });

  it('blocks /NASA by default', () => {
    expect(classifyTarget('/NASA').blocked).toBe(true);
  });

  it('allows /SCRIBE/dashboard (subpath of protected)', () => {
    const r = classifyTarget('/SCRIBE/dashboard');
    expect(r.protected).toBe(false);
    expect(r.blocked).toBe(false);
  });

  it('allows protected paths when allowProtected is true', () => {
    const r = classifyTarget('/SCRIBE', { allowProtected: true });
    expect(r.protected).toBe(true);
    expect(r.blocked).toBe(false);
    expect(r.reason).toMatch(/overridden/);
  });
});

describe('validateDeleteTargets — full input → allowed/blocked classification', () => {
  it('separates the v1.49.621 SCRIBE cleanup targets correctly', () => {
    const r = validateDeleteTargets([
      '/SCRIBE/dashboard',
      '/SCRIBE/dashboard-lod-rendering',
    ]);
    expect(r.allowed.map((a) => a.path)).toEqual([
      '/SCRIBE/dashboard',
      '/SCRIBE/dashboard-lod-rendering',
    ]);
    expect(r.blocked).toEqual([]);
  });

  it('refuses to delete the SCRIBE root by default', () => {
    const r = validateDeleteTargets(['/SCRIBE']);
    expect(r.allowed).toEqual([]);
    expect(r.blocked).toHaveLength(1);
    expect(r.blocked[0].raw).toBe('/SCRIBE');
  });

  it('mixes safe + unsafe inputs into separate buckets', () => {
    const r = validateDeleteTargets([
      '/SCRIBE/dashboard',  // ok
      '/NASA',              // protected
      'no-leading-slash',   // invalid
      '/MUS/../etc',        // .. segment
    ]);
    expect(r.allowed.map((a) => a.path)).toEqual(['/SCRIBE/dashboard']);
    expect(r.blocked.map((b) => b.raw).sort()).toEqual([
      '/MUS/../etc',
      '/NASA',
      'no-leading-slash',
    ]);
  });

  it('allowProtected pass-through allows /NASA but still rejects bad input', () => {
    const r = validateDeleteTargets(['/NASA', '/SCRIBE/../boom'], { allowProtected: true });
    expect(r.allowed.map((a) => a.path)).toEqual(['/NASA']);
    expect(r.blocked.map((b) => b.raw)).toEqual(['/SCRIBE/../boom']);
  });

  it('preserves trailing-slash-stripping when validating', () => {
    const r = validateDeleteTargets(['/SCRIBE/dashboard/']);
    expect(r.allowed[0].path).toBe('/SCRIBE/dashboard');
  });

  it('marks a protected-but-allow-overridden target with protected=true', () => {
    const r = validateDeleteTargets(['/SCRIBE'], { allowProtected: true });
    expect(r.allowed).toHaveLength(1);
    expect(r.allowed[0].protected).toBe(true);
  });
});
