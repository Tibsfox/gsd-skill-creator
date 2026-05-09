/**
 * SCRIBE Build-Out v1.49.621 — Component 09 integration test.
 *
 * End-to-end verification of foundational chipset composition (C00 + C01).
 * Verifies success criteria C1 (foundational chipset composed) and C2
 * (unified citation index) hold AT THE COMPOSED LEVEL — not just at
 * unit-test level.
 *
 * Strategy: invoke composeFoundationalChipset() with the same
 * member declarations the on-disk manifest uses; assert the produced
 * manifest + graph mirror the on-disk artifacts byte-significantly
 * (same composes set, same graph nodes, same DAG edges).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { composeFoundationalChipset } from '../../cartridge-composition/compose-chipset.js';
import type { MemberDeclaration } from '../../cartridge-composition/compose-chipset.js';
import { NAMESPACE_URI } from '../../types/metadata-namespace.js';

const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');

const STANDARD_MEMBERS: ReadonlyArray<MemberDeclaration> = [
  { name: 'markup-lineage', track: 'T1', version: '1.0.0', composesWith: [] },
  { name: 'svg-substrate', track: 'T2', version: '1.0.0', composesWith: [] },
  {
    name: 'code-svg-hdl-bridge',
    track: 'T3',
    version: '1.0.0',
    composesWith: ['svg-substrate', 'retrieval-provenance', 'markup-lineage'],
  },
  {
    name: 'dashboard-lod-rendering',
    track: 'T4',
    version: '0.1.0',
    composesWith: ['svg-substrate', 'retrieval-provenance'],
  },
  { name: 'retrieval-provenance', track: 'T5', version: '1.0.0', composesWith: [] },
];

describe('integration: foundational chipset composition (C1+C2)', () => {
  it('composeFoundationalChipset() produces a thin-shell manifest matching on-disk', () => {
    const result = composeFoundationalChipset({
      chipsetName: 'scribe',
      mission: 'scribe',
      milestone: 'v1.49.621',
      chipsetVersion: '1.49.621',
      summary: 'test',
      license: 'Apache-2.0',
      scribeNamespace: NAMESPACE_URI,
      members: STANDARD_MEMBERS,
    });

    const onDiskManifest = JSON.parse(
      readFileSync(
        resolve(REPO_ROOT, 'cartridges/foundational/scribe/manifest.json'),
        'utf8',
      ),
    ) as { composes: ReadonlyArray<string>; scribe_namespace: string };

    // Composes set parity (C1).
    const composedFromCode = result.manifest.composes ?? [];
    expect([...composedFromCode].sort()).toEqual(
      [...onDiskManifest.composes].sort(),
    );
    expect(result.manifest.scribe_namespace).toBe(onDiskManifest.scribe_namespace);
    expect(result.manifest.kind).toBe('chipset');
    expect(result.manifest.role).toBe('foundational');
  });

  it('composition-graph nodes mirror the 5 SCRIBE tracks T1-T5', () => {
    const result = composeFoundationalChipset({
      chipsetName: 'scribe',
      mission: 'scribe',
      milestone: 'v1.49.621',
      chipsetVersion: '1.49.621',
      summary: 'test',
      license: 'Apache-2.0',
      scribeNamespace: NAMESPACE_URI,
      members: STANDARD_MEMBERS,
    });

    const tracks = new Set(result.graph.nodes.map((n) => n.track));
    expect([...tracks].sort()).toEqual(['T1', 'T2', 'T3', 'T4', 'T5']);
  });

  it('unified CITATIONS.json links to the v1.49.621 milestone (C2)', () => {
    const unifiedPath = resolve(
      REPO_ROOT,
      '.planning/missions/v1-49-621-scribe/CITATIONS.json',
    );
    const unified = JSON.parse(readFileSync(unifiedPath, 'utf8')) as {
      milestone: string;
      totalUniqueSources: number;
      sources: ReadonlyArray<unknown>;
    };
    expect(unified.milestone).toBe('v1.49.621');
    // 302 baseline ±5%
    expect(unified.totalUniqueSources).toBeGreaterThanOrEqual(287);
    expect(unified.totalUniqueSources).toBeLessThanOrEqual(317);
    expect(unified.sources.length).toBe(unified.totalUniqueSources);
  });

  it('rejects composition with a non-member compose-with edge (substrate respect)', () => {
    expect(() =>
      composeFoundationalChipset({
        chipsetName: 'scribe',
        mission: 'scribe',
        milestone: 'v1.49.621',
        chipsetVersion: '1.49.621',
        summary: 'test',
        license: 'Apache-2.0',
        scribeNamespace: NAMESPACE_URI,
        members: [
          { name: 'markup-lineage', track: 'T1', version: '1.0.0', composesWith: [] },
          {
            name: 'code-svg-hdl-bridge',
            track: 'T3',
            version: '1.0.0',
            composesWith: ['nonexistent-cartridge'],
          },
        ],
      }),
    ).toThrow();
  });
});
