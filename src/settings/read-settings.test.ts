/**
 * QUAL-1a — Contract tests for the shared settings reader.
 *
 * These pin the behavior (first-candidate-wins, dotted lookup, safe defaults)
 * before the inline re-implementers across the codebase are migrated onto it
 * (QUAL-1b). Uses tmpdir fixtures with explicit candidate paths.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  loadGsdScope,
  readNested,
  readBooleanFlag,
  readNumber,
  harnessCandidatePaths,
  dedicatedConfigPath,
  HARNESS_SETTINGS_PATH,
  DEDICATED_SETTINGS_PATH,
} from './read-settings.js';

describe('read-settings (QUAL-1a contract)', () => {
  let dir: string;
  let dedicated: string;
  let shared: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'read-settings-'));
    dedicated = join(dir, 'gsd-skill-creator.json');
    shared = join(dir, 'settings.json');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const write = (path: string, obj: unknown) =>
    writeFileSync(path, JSON.stringify(obj));

  it('loads the gsd-skill-creator scope from the first candidate that parses', () => {
    write(dedicated, { 'gsd-skill-creator': { a: 1 } });
    write(shared, { 'gsd-skill-creator': { a: 2 } });
    expect(loadGsdScope([dedicated, shared])).toEqual({ a: 1 });
  });

  it('falls back to the next candidate when the first lacks the scope', () => {
    write(dedicated, { unrelated: true });
    write(shared, { 'gsd-skill-creator': { fromShared: true } });
    expect(loadGsdScope([dedicated, shared])).toEqual({ fromShared: true });
  });

  it('returns null when no candidate yields the scope', () => {
    write(dedicated, { unrelated: true });
    expect(loadGsdScope([dedicated])).toBeNull();
    expect(loadGsdScope([join(dir, 'missing.json')])).toBeNull();
  });

  it('resolves a dotted key path via readNested', () => {
    write(dedicated, {
      'gsd-skill-creator': { sensoria: { lyapunov: { enabled: true } } },
    });
    expect(readNested(['sensoria', 'lyapunov', 'enabled'], [dedicated])).toBe(true);
    expect(readNested(['sensoria', 'missing'], [dedicated])).toBeUndefined();
  });

  it('readBooleanFlag is true only for a literal true value', () => {
    write(dedicated, { 'gsd-skill-creator': { on: true, offish: 'true', num: 1 } });
    expect(readBooleanFlag(['on'], [dedicated])).toBe(true);
    expect(readBooleanFlag(['offish'], [dedicated])).toBe(false);
    expect(readBooleanFlag(['num'], [dedicated])).toBe(false);
    expect(readBooleanFlag(['missing'], [dedicated])).toBe(false);
  });

  it('readNumber returns the value only for a finite number, else the default', () => {
    write(dedicated, { 'gsd-skill-creator': { n: 42, bad: 'x' } });
    expect(readNumber(['n'], 7, [dedicated])).toBe(42);
    expect(readNumber(['bad'], 7, [dedicated])).toBe(7);
    expect(readNumber(['missing'], 7, [dedicated])).toBe(7);
  });

  it('harnessCandidatePaths tries both files for the default path, one for an override', () => {
    // Default harness path → dedicated sibling first, then the harness file.
    expect(harnessCandidatePaths(HARNESS_SETTINGS_PATH)).toEqual([
      DEDICATED_SETTINGS_PATH,
      HARNESS_SETTINGS_PATH,
    ]);
    // No argument defaults to the harness path → same two-file list.
    expect(harnessCandidatePaths()).toEqual([
      DEDICATED_SETTINGS_PATH,
      HARNESS_SETTINGS_PATH,
    ]);
    // An override path is used verbatim and alone (no sibling fallback).
    expect(harnessCandidatePaths('/tmp/custom.json')).toEqual(['/tmp/custom.json']);
  });

  it('dedicatedConfigPath: explicit override wins, else env root, else cwd', () => {
    const savedEnv = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
    try {
      // An explicit override replaces the whole path.
      expect(dedicatedConfigPath('/custom/x.json')).toBe('/custom/x.json');
      // No override + env root set → join(envRoot, .claude, gsd-skill-creator.json).
      process.env.GSD_SKILL_CREATOR_CONFIG_ROOT = '/env/root';
      expect(dedicatedConfigPath()).toBe(join('/env/root', '.claude', 'gsd-skill-creator.json'));
      // Env override wins even when it is set, but explicit override still wins over it.
      expect(dedicatedConfigPath('/override.json')).toBe('/override.json');
      // Empty env root falls back to cwd.
      process.env.GSD_SKILL_CREATOR_CONFIG_ROOT = '';
      expect(dedicatedConfigPath()).toBe(join(process.cwd(), '.claude', 'gsd-skill-creator.json'));
      // Unset env root falls back to cwd.
      delete process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
      expect(dedicatedConfigPath()).toBe(join(process.cwd(), '.claude', 'gsd-skill-creator.json'));
    } finally {
      if (savedEnv === undefined) delete process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
      else process.env.GSD_SKILL_CREATOR_CONFIG_ROOT = savedEnv;
    }
  });

  it('degrades safely (no throw) on malformed JSON', () => {
    writeFileSync(dedicated, '{ this is not json');
    expect(loadGsdScope([dedicated])).toBeNull();
    expect(readBooleanFlag(['x'], [dedicated])).toBe(false);
    expect(readNumber(['x'], 3, [dedicated])).toBe(3);
  });
});
