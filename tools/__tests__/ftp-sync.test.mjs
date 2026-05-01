/**
 * T2.1 (v1.49.590) — ftp-sync invariant tests
 *
 * Closes Lesson #10195 candidate from v1.49.589 §4: every milestone ship
 * pipeline pushed 49+ files via an ad-hoc Python ftplib script that was
 * deleted post-use. The script encoded the FTP_PASS leading-quote rule
 * + the FTP root → /Research mapping per memory note. Promoting to a
 * tested in-repo tool eliminates the recurring ad-hoc rebuild + adds
 * regression coverage for the credentials/env-loading subtleties.
 *
 * Tests use temp dir for synthesized www/ trees + in-process .env mock;
 * NO FTP connection is opened (we test the manifest-build + env-parse
 * + arg-validation surfaces directly).
 *
 * Run via: npx vitest run --config vitest.tools.config.mjs
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  parseEnv,
  validateVersion,
  validateEnv,
  walkDir,
  buildManifest,
  pickVerificationSample,
  remotePathToUrl,
} from '../ftp-sync.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

let tmpRoot;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'ftp-sync-test-'));
});

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

describe('parseEnv — FTP_PASS leading-quote preservation (memory rule)', () => {
  it('preserves a leading single-quote in FTP_PASS verbatim (NOT stripped)', () => {
    // Per memory: FTP_PASS char 1 is a literal `'`; total length 32 chars
    const txt = "FTP_PASS='abcdefghijklmnopqrstuvwxyz12345\nFTP_USER=alice\n";
    const env = parseEnv(txt);
    expect(env.FTP_PASS).toBe("'abcdefghijklmnopqrstuvwxyz12345");
    expect(env.FTP_PASS.length).toBe(32);
    expect(env.FTP_PASS[0]).toBe("'");
  });

  it('strips matched surrounding double-quotes (common .env convention)', () => {
    const txt = 'FTP_HOST="ftp.example.com"\n';
    const env = parseEnv(txt);
    expect(env.FTP_HOST).toBe('ftp.example.com');
  });

  it('preserves single-quote-only-prefixed values (no stripping)', () => {
    // A value starting with single-quote but not double-quoted should NOT
    // be stripped. This is the FTP_PASS case.
    const txt = "KEY='just-a-leading-quote\n";
    const env = parseEnv(txt);
    expect(env.KEY).toBe("'just-a-leading-quote");
  });

  it('skips comment lines and blank lines', () => {
    const txt = '# comment\nKEY=value\n\n  \nOTHER=other\n';
    const env = parseEnv(txt);
    expect(env.KEY).toBe('value');
    expect(env.OTHER).toBe('other');
  });

  it('handles values containing equals signs', () => {
    const txt = 'RH_POSTGRES_URL=postgresql://user:pass=word@host:5432/db\n';
    const env = parseEnv(txt);
    expect(env.RH_POSTGRES_URL).toBe('postgresql://user:pass=word@host:5432/db');
  });
});

describe('validateVersion', () => {
  it('accepts canonical X.YY format', () => {
    expect(validateVersion('1.71')).toBe(true);
    expect(validateVersion('1.70')).toBe(true);
    expect(validateVersion('2.5')).toBe(true);
    expect(validateVersion('10.100')).toBe(true);
  });

  it('rejects v-prefix, paths, missing parts', () => {
    expect(validateVersion('v1.71')).toBe(false);
    expect(validateVersion('1')).toBe(false);
    expect(validateVersion('')).toBe(false);
    expect(validateVersion(undefined)).toBe(false);
    expect(validateVersion('../etc/passwd')).toBe(false);
    expect(validateVersion('1.71/extra')).toBe(false);
  });
});

describe('validateEnv', () => {
  it('passes when FTP_HOST + FTP_USER + FTP_PASS all set', () => {
    const env = { FTP_HOST: 'h', FTP_USER: 'u', FTP_PASS: 'p' };
    expect(validateEnv(env)).toEqual({ ok: true });
  });

  it('fails listing all missing keys', () => {
    const r = validateEnv({ FTP_USER: 'u' });
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(['FTP_HOST', 'FTP_PASS']);
  });

  it('fails when value is empty string', () => {
    const r = validateEnv({ FTP_HOST: '', FTP_USER: 'u', FTP_PASS: 'p' });
    expect(r.ok).toBe(false);
    expect(r.missing).toContain('FTP_HOST');
  });
});

describe('walkDir', () => {
  it('returns files relative to root, recursively', () => {
    mkdirSync(join(tmpRoot, 'a', 'b'), { recursive: true });
    writeFileSync(join(tmpRoot, 'a', 'top.txt'), 'one');
    writeFileSync(join(tmpRoot, 'a', 'b', 'nested.txt'), 'two');
    const files = walkDir(join(tmpRoot, 'a'));
    const rels = files.map((f) => f.rel).sort();
    expect(rels).toEqual(['b/nested.txt', 'top.txt']);
  });

  it('skips hidden files and dotted dirs', () => {
    mkdirSync(join(tmpRoot, 'x'), { recursive: true });
    writeFileSync(join(tmpRoot, 'x', 'visible.txt'), 'v');
    writeFileSync(join(tmpRoot, 'x', '.hidden'), 'h');
    mkdirSync(join(tmpRoot, 'x', '.cache'), { recursive: true });
    writeFileSync(join(tmpRoot, 'x', '.cache', 'inner'), 'i');
    const rels = walkDir(join(tmpRoot, 'x')).map((f) => f.rel);
    expect(rels).toEqual(['visible.txt']);
  });

  it('returns empty array for missing dir (no throw)', () => {
    expect(walkDir(join(tmpRoot, 'does-not-exist'))).toEqual([]);
  });

  it('records correct file size in bytes', () => {
    mkdirSync(join(tmpRoot, 'sz'), { recursive: true });
    writeFileSync(join(tmpRoot, 'sz', 'a.txt'), 'hello');
    const files = walkDir(join(tmpRoot, 'sz'));
    expect(files[0].size).toBe(5);
  });
});

describe('buildManifest', () => {
  it('builds correct manifest for v<version> across all 3 tracks', () => {
    const version = '1.71';
    for (const track of ['NASA', 'MUS', 'ELC']) {
      const dir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', track, version);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'index.html'), 'page');
      writeFileSync(join(dir, 'README.md'), 'readme');
    }
    const m = buildManifest(tmpRoot, version);
    expect(m.totalFiles).toBe(6);
    expect(m.totalBytes).toBe(4 * 3 + 6 * 3);  // 'page'(4)*3 + 'readme'(6)*3
    expect(m.missingTracks).toEqual([]);
    expect(m.tracks.NASA).toHaveLength(2);
  });

  it('records missing tracks without throwing', () => {
    const version = '1.71';
    const dir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', 'NASA', version);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), 'page');
    const m = buildManifest(tmpRoot, version);
    expect(m.missingTracks).toEqual(['MUS', 'ELC']);
    expect(m.tracks.NASA).toHaveLength(1);
    expect(m.totalFiles).toBe(1);
  });

  it('produces correct remoteAbs paths matching FTP root → /Research mapping', () => {
    const version = '1.71';
    const dir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', 'NASA', version);
    mkdirSync(join(dir, 'sub'), { recursive: true });
    writeFileSync(join(dir, 'index.html'), 'i');
    writeFileSync(join(dir, 'sub', 'nested.html'), 'n');
    const m = buildManifest(tmpRoot, version);
    const remotes = m.tracks.NASA.map((f) => f.remoteAbs).sort();
    // Per memory: FTP root / maps to /Research/, so we omit /Research/ prefix
    expect(remotes).toEqual([
      '/NASA/1.71/index.html',
      '/NASA/1.71/sub/nested.html',
    ]);
  });

  it('localAbs is a real absolute path, joinable from any cwd', () => {
    const version = '1.71';
    const dir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', 'NASA', version);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), 'page');
    const m = buildManifest(tmpRoot, version);
    expect(m.tracks.NASA[0].localAbs).toContain(tmpRoot);
    expect(m.tracks.NASA[0].localAbs).toContain('NASA/1.71/index.html');
  });
});

describe('pickVerificationSample (Lesson #10203 verification probe)', () => {
  function buildSyntheticManifest() {
    const version = '1.71';
    for (const track of ['NASA', 'MUS', 'ELC']) {
      const dir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', track, version);
      mkdirSync(join(dir, 'sub'), { recursive: true });
      writeFileSync(join(dir, 'index.html'), 'i');
      writeFileSync(join(dir, 'data.json'), '{}');
      writeFileSync(join(dir, 'sub', 'nested.html'), 'n');
    }
    return buildManifest(tmpRoot, version);
  }

  it('always includes index.html for each present track', () => {
    const m = buildSyntheticManifest();
    const sample = pickVerificationSample(m);
    const indexes = sample.filter((s) => s.rel === 'index.html');
    expect(indexes.length).toBe(3);
    const tracks = new Set(indexes.map((s) => s.remoteAbs.split('/')[1]));
    expect(tracks.has('NASA')).toBe(true);
    expect(tracks.has('MUS')).toBe(true);
    expect(tracks.has('ELC')).toBe(true);
  });

  it('caps sample size at sampleSize parameter', () => {
    const m = buildSyntheticManifest();
    const sample = pickVerificationSample(m, 5);
    expect(sample.length).toBeLessThanOrEqual(5);
  });

  it('produces unique entries (no duplicate remoteAbs)', () => {
    const m = buildSyntheticManifest();
    const sample = pickVerificationSample(m, 5);
    const remotes = sample.map((s) => s.remoteAbs);
    expect(remotes.length).toBe(new Set(remotes).size);
  });

  it('returns empty when manifest has zero tracks', () => {
    const empty = { tracks: {}, totalFiles: 0, totalBytes: 0, missingTracks: [] };
    expect(pickVerificationSample(empty)).toEqual([]);
  });
});

describe('remotePathToUrl', () => {
  it('builds canonical tibsfox URL from remoteAbs', () => {
    expect(remotePathToUrl('/NASA/1.71/index.html'))
      .toBe('https://tibsfox.com/Research/NASA/1.71/index.html');
  });

  it('respects custom baseUrl', () => {
    expect(remotePathToUrl('/NASA/1.71/index.html', 'https://example.com/path'))
      .toBe('https://example.com/path/NASA/1.71/index.html');
  });

  it('strips trailing slash from baseUrl to avoid double-slash', () => {
    expect(remotePathToUrl('/MUS/1.71/x.html', 'https://example.com/Research/'))
      .toBe('https://example.com/Research/MUS/1.71/x.html');
  });
});
