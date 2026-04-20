/**
 * Unit tests for the coprocessor applicator hook — covers the flag reader,
 * frontmatter extractor, and stage lifecycle. No Python subprocess required;
 * all live-server calls are mocked via a stubbed activateCoprocessor.
 */
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createCoprocessorStage,
  extractCoprocessorRaw,
  readCoprocessorEnabledFlag,
  type CoprocessorHookResult,
} from '../applicator-hook.js';
import { createEmptyContext } from '../../application/skill-pipeline.js';

describe('readCoprocessorEnabledFlag', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'coproc-flag-'));
  });
  afterEach(() => {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  });

  it('returns false when settings.json is missing', () => {
    expect(readCoprocessorEnabledFlag(join(dir, 'settings.json'))).toBe(false);
  });

  it('returns false for malformed JSON', () => {
    const path = join(dir, 'settings.json');
    writeFileSync(path, '{ not json');
    expect(readCoprocessorEnabledFlag(path)).toBe(false);
  });

  it('returns false when gsd-skill-creator scope is absent', () => {
    const path = join(dir, 'settings.json');
    writeFileSync(path, '{}');
    expect(readCoprocessorEnabledFlag(path)).toBe(false);
  });

  it('returns false when coprocessor block has enabled: false', () => {
    const path = join(dir, 'settings.json');
    writeFileSync(path, JSON.stringify({ 'gsd-skill-creator': { coprocessor: { enabled: false } } }));
    expect(readCoprocessorEnabledFlag(path)).toBe(false);
  });

  it('returns true only when enabled: true', () => {
    const path = join(dir, 'settings.json');
    writeFileSync(path, JSON.stringify({ 'gsd-skill-creator': { coprocessor: { enabled: true } } }));
    expect(readCoprocessorEnabledFlag(path)).toBe(true);
  });
});

describe('extractCoprocessorRaw', () => {
  it('returns undefined when no frontmatter present', () => {
    expect(extractCoprocessorRaw('just a body, no fm')).toBeUndefined();
  });

  it('returns undefined when frontmatter has no coprocessor key', () => {
    const content = '---\nname: foo\ndescription: bar\n---\nbody\n';
    expect(extractCoprocessorRaw(content)).toBeUndefined();
  });

  it('parses inline-array shorthand', () => {
    const content = '---\nname: foo\ncoprocessor: [algebrus, statos]\n---\nbody\n';
    expect(extractCoprocessorRaw(content)).toEqual(['algebrus', 'statos']);
  });

  it('parses quoted inline-array entries', () => {
    const content = '---\ncoprocessor: ["algebrus", "fourier"]\n---\nbody\n';
    expect(extractCoprocessorRaw(content)).toEqual(['algebrus', 'fourier']);
  });

  it('parses block-style object with required + precision', () => {
    const content = '---\ncoprocessor:\n  required: [vectora]\n  precision: fp32\n---\nbody\n';
    const parsed = extractCoprocessorRaw(content);
    expect(parsed).toEqual({ required: ['vectora'], precision: 'fp32' });
  });

  it('parses cpu_fallback boolean in block form', () => {
    const content = '---\ncoprocessor:\n  required: [algebrus]\n  cpu_fallback: false\n---\nbody';
    expect(extractCoprocessorRaw(content)).toEqual({ required: ['algebrus'], cpu_fallback: false });
  });
});

describe('createCoprocessorStage', () => {
  it('short-circuits when earlyExit is true', async () => {
    const results: CoprocessorHookResult[] = [];
    const stage = createCoprocessorStage({
      readSkillContent: () => '---\ncoprocessor: [algebrus]\n---\n',
      onResult: (r) => results.push(r),
    });
    const context = createEmptyContext({
      loaded: ['skill-a'],
      earlyExit: true,
    });
    await stage.process(context);
    expect(results).toEqual([]);
  });

  it('skips skills without a coprocessor declaration', async () => {
    const results: CoprocessorHookResult[] = [];
    const stage = createCoprocessorStage({
      readSkillContent: () => '---\nname: foo\n---\n',
      onResult: (r) => results.push(r),
    });
    const context = createEmptyContext({ loaded: ['skill-a'] });
    await stage.process(context);
    expect(results).toEqual([]);
  });

  it('has the expected stage name', () => {
    const stage = createCoprocessorStage({ readSkillContent: () => undefined });
    expect(stage.name).toBe('coprocessor');
  });
});
