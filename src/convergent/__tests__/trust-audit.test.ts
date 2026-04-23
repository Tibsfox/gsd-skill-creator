// @ts-nocheck -- imports a .mjs script as runtime JS
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, '../../../scripts/convergent/trust-audit.mjs');
const mod = await import(scriptPath);
const { loadCartridges, formatMarkdown } = mod;

describe('convergent trust-audit: loadCartridges', () => {
  it('returns [] when input path is null', () => {
    expect(loadCartridges(null)).toEqual([]);
  });

  it('returns [] when input file does not exist', () => {
    expect(loadCartridges('/tmp/this-file-does-not-exist.json')).toEqual([]);
  });

  it('returns parsed cartridges array for well-formed input', () => {
    const tmp = path.join(os.tmpdir(), `trust-audit-test-${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify({
      cartridges: [
        { cartridgeId: 'a', tier: 'T1', signals: {} },
        { cartridgeId: 'b', tier: 'T4', signals: {} },
      ],
    }));
    const result = loadCartridges(tmp);
    expect(result).toHaveLength(2);
    expect(result[0].cartridgeId).toBe('a');
    fs.unlinkSync(tmp);
  });

  it('returns null for malformed JSON', () => {
    const tmp = path.join(os.tmpdir(), `trust-audit-bad-${Date.now()}.json`);
    fs.writeFileSync(tmp, 'not valid json {{');
    const result = loadCartridges(tmp);
    expect(result).toBeNull();
    fs.unlinkSync(tmp);
  });

  it('returns [] when root object lacks cartridges array', () => {
    const tmp = path.join(os.tmpdir(), `trust-audit-shape-${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify({ items: ['a', 'b'] }));
    const result = loadCartridges(tmp);
    expect(result).toEqual([]);
    fs.unlinkSync(tmp);
  });
});

describe('convergent trust-audit: formatMarkdown', () => {
  const baseReport = {
    totalCartridges: 3,
    byTier: { T1: 1, T2: 1, T3: 0, T4: 1 },
    t4Cartridges: ['bad-skill'],
    vulnerabilityBaseline: 26.1,
    healthScore: 0.7,
    warnings: ['third-party fraction high'],
  };

  it('produces a well-formed markdown report', () => {
    const md = formatMarkdown(baseReport);
    expect(md).toContain('# Trust-Tier Audit');
    expect(md).toContain('Total cartridges: **3**');
    expect(md).toContain('Health score: **0.700**');
    expect(md).toContain('| T1 | 1 |');
    expect(md).toContain('| T4 | 1 |');
    expect(md).toContain('bad-skill');
    expect(md).toContain('third-party fraction high');
    expect(md).toContain('26.1');
  });

  it('omits T4 section when no T4 cartridges present', () => {
    const md = formatMarkdown({ ...baseReport, t4Cartridges: [], byTier: { T1: 3, T2: 0, T3: 0, T4: 0 } });
    expect(md).not.toContain('T4 (sandbox-only) cartridges');
  });

  it('omits Warnings section when no warnings present', () => {
    const md = formatMarkdown({ ...baseReport, warnings: [], t4Cartridges: [] });
    expect(md).not.toContain('## Warnings');
  });
});
