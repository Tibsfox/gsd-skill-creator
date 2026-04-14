/**
 * Distiller — v2 seam, stub implementation.
 *
 * Distillation is the process of turning raw research artifacts (notes,
 * papers, transcripts, chat logs) into a cartridge skeleton. The full
 * implementation is scheduled as a separate milestone; this module ships
 * only the interface and a pass-through stub that echoes the input as a
 * minimal content cartridge so downstream code (CLI, tests) can wire it up.
 *
 * When the v2 distiller lands it will replace `distillSources` with the
 * research-coprocessor-backed pipeline. The signature is the contract.
 */

import type { Cartridge } from './types.js';

export interface DistillSource {
  id: string;
  kind: 'note' | 'paper' | 'transcript' | 'chat' | 'url';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface DistillOptions {
  cartridgeId: string;
  name: string;
  trust?: 'system' | 'user' | 'community';
}

export interface DistillResult {
  cartridge: Cartridge;
  notes: string[];
}

/**
 * Stub distiller. Produces a minimal content cartridge whose deepMap has one
 * concept per input source. This is intentionally a pass-through so that
 * upstream pipelines can be built and tested before the real distiller lands.
 */
export function distillSources(
  sources: DistillSource[],
  options: DistillOptions,
): DistillResult {
  if (sources.length === 0) {
    throw new Error('distillSources: at least one source is required');
  }

  const concepts = sources.map((s, i) => ({
    id: `src-${i}`,
    name: s.id,
    description: truncate(s.content, 120),
    depth: 'read' as const,
    tags: [s.kind],
  }));

  const cartridge: Cartridge = {
    id: options.cartridgeId,
    name: options.name,
    version: '0.0.1',
    author: 'distiller-stub',
    description: `Stub distillation of ${sources.length} source(s).`,
    trust: options.trust ?? 'user',
    provenance: {
      origin: 'distiller-stub',
      createdAt: new Date().toISOString(),
    },
    chipsets: [
      {
        kind: 'content',
        deepMap: {
          concepts,
          connections: [],
          entryPoints: concepts.length > 0 ? [concepts[0]!.id] : [],
          progressionPaths: [
            {
              id: 'intro',
              name: 'Introduction',
              description: 'Start here.',
              steps: concepts.map((c) => c.id),
            },
          ],
        },
        story: {
          title: options.name,
          narrative: `Auto-distilled from ${sources.length} source(s).`,
          chapters: [
            {
              id: 'ch1',
              title: 'Sources',
              summary: 'The raw material.',
              conceptRefs: concepts.map((c) => c.id),
            },
          ],
          throughLine: 'From raw sources to structured knowledge.',
        },
      },
    ],
  };

  return {
    cartridge,
    notes: [
      'Stub distiller: this is the v1 pass-through. v2 will replace this with the research coprocessor.',
    ],
  };
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1) + '…';
}
