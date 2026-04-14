/**
 * Stub distiller tests — DS-01..DS-04.
 */

import { describe, expect, it } from 'vitest';
import { distillSources, type DistillSource } from '../distill.js';
import { CartridgeSchema } from '../types.js';
import { validateCartridge } from '../validator.js';

const sources: DistillSource[] = [
  { id: 'note-a', kind: 'note', content: 'A short note.' },
  { id: 'paper-b', kind: 'paper', content: 'A paper abstract that talks about things.' },
];

describe('distillSources (stub)', () => {
  it('DS-01 produces a valid content cartridge', () => {
    const result = distillSources(sources, { cartridgeId: 'auto', name: 'Auto' });
    expect(result.cartridge.id).toBe('auto');
    expect(result.cartridge.chipsets).toHaveLength(1);
    expect(result.cartridge.chipsets[0]?.kind).toBe('content');
    expect(CartridgeSchema.parse(result.cartridge)).toBeTruthy();
    const v = validateCartridge(result.cartridge);
    expect(v.valid).toBe(true);
  });

  it('DS-02 maps one concept per source', () => {
    const result = distillSources(sources, { cartridgeId: 'auto', name: 'Auto' });
    const chipset = result.cartridge.chipsets[0];
    if (chipset?.kind !== 'content') throw new Error('expected content chipset');
    expect(chipset.deepMap.concepts).toHaveLength(2);
    expect(chipset.deepMap.concepts[0]?.name).toBe('note-a');
    expect(chipset.deepMap.concepts[1]?.name).toBe('paper-b');
  });

  it('DS-03 stamps stub provenance and returns v2 note', () => {
    const result = distillSources(sources, { cartridgeId: 'auto', name: 'Auto' });
    expect(result.cartridge.provenance.origin).toBe('distiller-stub');
    expect(result.notes.join(' ')).toMatch(/v2/);
  });

  it('DS-04 rejects empty input', () => {
    expect(() => distillSources([], { cartridgeId: 'auto', name: 'Auto' })).toThrow(
      /at least one source/,
    );
  });

  it('DS-05 truncates long source content into concept descriptions', () => {
    const long: DistillSource = {
      id: 'long',
      kind: 'transcript',
      content: 'x'.repeat(500),
    };
    const result = distillSources([long], { cartridgeId: 'auto', name: 'Auto' });
    const chipset = result.cartridge.chipsets[0];
    if (chipset?.kind !== 'content') throw new Error('expected content chipset');
    const desc = chipset.deepMap.concepts[0]?.description ?? '';
    expect(desc.length).toBeLessThanOrEqual(120);
  });
});
