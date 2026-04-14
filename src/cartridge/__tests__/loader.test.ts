/**
 * Loader tests — LD-01..LD-08 from 02-test-plan.md.
 *
 * Uses tmpdir fixtures so each test builds its own little file tree of
 * cartridge.yaml + external chipset files and tears them down after.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadCartridge, parseCartridge } from '../loader.js';

function writeYaml(path: string, obj: unknown): void {
  // A minimal YAML emitter: JSON is a strict subset of YAML, so round-tripping
  // via JSON.stringify is sufficient for these fixture shapes.
  writeFileSync(path, JSON.stringify(obj, null, 2));
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const identityFields = {
  id: 'loader-fixture',
  name: 'Loader Fixture',
  version: '1.0.0',
  author: 'tester',
  description: 'a loader fixture',
  trust: 'system',
  provenance: { origin: 'tester', createdAt: '2026-04-14T00:00:00Z' },
};

const groveInline = {
  kind: 'grove',
  namespace: 'loader-fixture',
  record_types: [{ name: 'R1', description: 'record one' }],
};

const evalInline = {
  kind: 'evaluation',
  pre_deploy: ['schema_valid'],
  benchmark: {
    trigger_accuracy_threshold: 0.85,
    test_cases_minimum: 25,
    domains_covered: ['x'],
  },
};

// ---------------------------------------------------------------------------

describe('loader — LD-01..LD-08', () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'cartridge-loader-'));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('LD-01 inline chipsets load correctly', () => {
    const cartPath = join(workDir, 'cartridge.yaml');
    writeYaml(cartPath, {
      ...identityFields,
      chipsets: [groveInline, evalInline],
    });
    const loaded = loadCartridge(cartPath);
    expect(loaded.chipsets).toHaveLength(2);
    const grove = loaded.chipsets.find((c) => c.kind === 'grove');
    if (grove?.kind !== 'grove') throw new Error('unreachable');
    expect(grove.namespace).toBe('loader-fixture');
  });

  it('LD-02 external src: references resolve', () => {
    mkdirSync(join(workDir, 'chipsets'), { recursive: true });
    writeYaml(join(workDir, 'chipsets', 'grove.yaml'), {
      namespace: 'external-ns',
      record_types: [{ name: 'E1', description: 'external record' }],
    });

    const cartPath = join(workDir, 'cartridge.yaml');
    writeYaml(cartPath, {
      ...identityFields,
      chipsets: [
        { kind: 'grove', src: './chipsets/grove.yaml' },
        evalInline,
      ],
    });

    const loaded = loadCartridge(cartPath);
    const grove = loaded.chipsets.find((c) => c.kind === 'grove');
    if (grove?.kind !== 'grove') throw new Error('unreachable');
    expect(grove.namespace).toBe('external-ns');
    expect(grove.record_types[0]?.name).toBe('E1');
  });

  it('LD-03 fragment #/section resolves against a multi-section YAML', () => {
    writeYaml(join(workDir, 'chipset.yaml'), {
      department: {
        skills: { s1: { description: 'd' } },
        agents: {
          topology: 'router',
          router_agent: 'a',
          agents: [{ name: 'a', role: 'r' }],
        },
        teams: { t1: { description: 'd', agents: ['a'] } },
      },
      grove: {
        namespace: 'from-fragment',
        record_types: [{ name: 'F1', description: 'fragment record' }],
      },
    });

    const cartPath = join(workDir, 'cartridge.yaml');
    writeYaml(cartPath, {
      ...identityFields,
      chipsets: [{ kind: 'grove', src: './chipset.yaml#/grove' }, evalInline],
    });

    const loaded = loadCartridge(cartPath);
    const grove = loaded.chipsets.find((c) => c.kind === 'grove');
    if (grove?.kind !== 'grove') throw new Error('unreachable');
    expect(grove.namespace).toBe('from-fragment');
    expect(grove.record_types[0]?.name).toBe('F1');
  });

  it('LD-04 mixed inline + external + fragment references coexist', () => {
    mkdirSync(join(workDir, 'chipsets'), { recursive: true });
    writeYaml(join(workDir, 'chipsets', 'eval.yaml'), {
      pre_deploy: ['from_external'],
      benchmark: {
        trigger_accuracy_threshold: 0.9,
        test_cases_minimum: 30,
        domains_covered: ['ext'],
      },
    });
    writeYaml(join(workDir, 'multi.yaml'), {
      grove: {
        namespace: 'mixed-fragment',
        record_types: [{ name: 'M1', description: 'mixed' }],
      },
    });
    const cartPath = join(workDir, 'cartridge.yaml');
    writeYaml(cartPath, {
      ...identityFields,
      chipsets: [
        groveInline,
        { kind: 'grove', src: './multi.yaml#/grove' },
        { kind: 'evaluation', src: './chipsets/eval.yaml' },
      ],
    });

    const loaded = loadCartridge(cartPath);
    expect(loaded.chipsets).toHaveLength(3);
    const groveCount = loaded.chipsets.filter((c) => c.kind === 'grove').length;
    expect(groveCount).toBe(2);
    const ev = loaded.chipsets.find((c) => c.kind === 'evaluation');
    if (ev?.kind !== 'evaluation') throw new Error('unreachable');
    expect(ev.pre_deploy).toEqual(['from_external']);
    expect(ev.benchmark.trigger_accuracy_threshold).toBe(0.9);
  });

  it('LD-05 missing external file errors clearly', () => {
    const cartPath = join(workDir, 'cartridge.yaml');
    writeYaml(cartPath, {
      ...identityFields,
      chipsets: [
        { kind: 'grove', src: './does-not-exist.yaml' },
        evalInline,
      ],
    });
    expect(() => loadCartridge(cartPath)).toThrow(/does-not-exist\.yaml/);
  });

  it('LD-06 missing fragment section errors clearly', () => {
    writeYaml(join(workDir, 'chipset.yaml'), { grove: groveInline });
    const cartPath = join(workDir, 'cartridge.yaml');
    writeYaml(cartPath, {
      ...identityFields,
      chipsets: [
        { kind: 'grove', src: './chipset.yaml#/nonexistent' },
        evalInline,
      ],
    });
    expect(() => loadCartridge(cartPath)).toThrow(/nonexistent/);
  });

  it('LD-07 circular external references are detected', () => {
    // a.yaml has a grove section whose src: points at b.yaml#/grove; b.yaml
    // has a grove section that refs back at a.yaml#/grove. Loading the
    // cartridge which points at a should trip the circular guard.
    writeYaml(join(workDir, 'a.yaml'), {
      grove: { src: './b.yaml#/grove' },
    });
    writeYaml(join(workDir, 'b.yaml'), {
      grove: { src: './a.yaml#/grove' },
    });
    const cartPath = join(workDir, 'cartridge.yaml');
    writeYaml(cartPath, {
      ...identityFields,
      chipsets: [{ kind: 'grove', src: './a.yaml#/grove' }, evalInline],
    });
    expect(() => loadCartridge(cartPath)).toThrow(/circular/);
  });

  it('LD-08 relative paths resolve from the cartridge.yaml location', () => {
    mkdirSync(join(workDir, 'nested'), { recursive: true });
    mkdirSync(join(workDir, 'sibling'), { recursive: true });
    writeYaml(join(workDir, 'sibling', 'g.yaml'), {
      namespace: 'sibling-ns',
      record_types: [{ name: 'S1', description: 'sibling record' }],
    });

    const cartPath = join(workDir, 'nested', 'cartridge.yaml');
    writeYaml(cartPath, {
      ...identityFields,
      chipsets: [
        { kind: 'grove', src: '../sibling/g.yaml' },
        evalInline,
      ],
    });

    const loaded = loadCartridge(cartPath);
    const grove = loaded.chipsets.find((c) => c.kind === 'grove');
    if (grove?.kind !== 'grove') throw new Error('unreachable');
    expect(grove.namespace).toBe('sibling-ns');
  });
});

describe('parseCartridge — in-memory docs', () => {
  it('parses an already-loaded object against a base directory', () => {
    const doc = {
      ...identityFields,
      chipsets: [groveInline, evalInline],
    };
    const parsed = parseCartridge(doc, '/tmp/nonexistent-basedir');
    expect(parsed.id).toBe('loader-fixture');
    expect(parsed.chipsets).toHaveLength(2);
  });

  it('rejects non-mapping input', () => {
    expect(() => parseCartridge(['an', 'array'], '/tmp')).toThrow(/mapping/);
    expect(() => parseCartridge('a string', '/tmp')).toThrow(/mapping/);
  });
});
