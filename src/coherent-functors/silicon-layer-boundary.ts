/**
 * Coherent Functors — typed Silicon-Layer boundary.
 *
 * The bridge object M3 delivers to the Silicon Layer: symbolic and
 * neural-network panels co-inhabit the coherent-functor category F, and this
 * module is the serializable boundary between them.
 *
 * Layout follows the M5 DACP grammar (three-part bundle generalized to the
 * F-category case):
 *
 *   - humanIntent: the named role the functor plays (opaque string)
 *   - structuredData: the coherence-witness data (transferable across processes)
 *   - executableCode: NOT serialized — the live onObjects/onMorphisms closures
 *     are process-local and cannot cross the boundary; we carry only their
 *     names/labels for the receiving process to re-bind.
 *
 * `fromSiliconLayer` returns a functor with placeholder functions — the
 * receiving process is expected to re-bind onObjects/onMorphisms locally.
 * Round-trip preserves coherence-witness data and categorical names; it does
 * NOT preserve the executable closures (by construction).
 *
 * @module coherent-functors/silicon-layer-boundary
 */

import type {
  CoherenceWitness,
  CoherentFunctor,
  Morphism,
} from './types.js';

/**
 * Serializable representation of a coherent functor — the three-part bundle
 * generalization of the M5 DACP grammar to category-theoretic data.
 */
export interface SiliconRepr {
  readonly schemaVersion: 1;
  readonly humanIntent: {
    readonly functorName: string;
    readonly panelId?: string;
  };
  readonly structuredData: {
    readonly sourceCategoryName: string;
    readonly targetCategoryName: string;
    readonly coherenceWitness: CoherenceWitness<unknown, unknown>;
    readonly hasDirectSum: boolean;
  };
  readonly executableCode: {
    /** Labels only; the live closures are process-local. */
    readonly onObjectsLabel: string;
    readonly onMorphismsLabel: string;
  };
}

/**
 * Convert a coherent functor to its Silicon-Layer serializable representation.
 * M3 §13 signature (5) when composed with `translate`.
 */
export function toSiliconLayer<C, D>(
  F: CoherentFunctor<C, D>,
  options: { panelId?: string } = {},
): SiliconRepr {
  return {
    schemaVersion: 1,
    humanIntent: {
      functorName: F.name,
      panelId: options.panelId,
    },
    structuredData: {
      sourceCategoryName: F.source.name,
      targetCategoryName: F.target.name,
      coherenceWitness: F.coherenceData as unknown as CoherenceWitness<unknown, unknown>,
      hasDirectSum: typeof F.target.directSum === 'function',
    },
    executableCode: {
      onObjectsLabel: `${F.name}.onObjects`,
      onMorphismsLabel: `${F.name}.onMorphisms`,
    },
  };
}

/** Runtime check: is `r` a well-shaped SiliconRepr? */
export function isSiliconRepr(r: unknown): r is SiliconRepr {
  if (!r || typeof r !== 'object') return false;
  const obj = r as Record<string, unknown>;
  if (obj.schemaVersion !== 1) return false;
  const hi = obj.humanIntent as Record<string, unknown> | undefined;
  if (!hi || typeof hi.functorName !== 'string') return false;
  const sd = obj.structuredData as Record<string, unknown> | undefined;
  if (!sd) return false;
  if (typeof sd.sourceCategoryName !== 'string') return false;
  if (typeof sd.targetCategoryName !== 'string') return false;
  if (typeof sd.hasDirectSum !== 'boolean') return false;
  const cw = sd.coherenceWitness as Record<string, unknown> | undefined;
  if (!cw) return false;
  if (typeof cw.naturality !== 'string') return false;
  if (typeof cw.identity !== 'string') return false;
  if (typeof cw.composition !== 'string') return false;
  if (typeof cw.directSum !== 'string') return false;
  const ec = obj.executableCode as Record<string, unknown> | undefined;
  if (!ec) return false;
  if (typeof ec.onObjectsLabel !== 'string') return false;
  if (typeof ec.onMorphismsLabel !== 'string') return false;
  return true;
}

/**
 * Re-construct a coherent functor from its Silicon-Layer representation.
 *
 * The re-constructed functor carries placeholder onObjects/onMorphisms
 * functions that throw if called — the receiving process is expected to
 * re-bind them locally. All non-executable structure (names, categories,
 * coherence witness) is restored faithfully.
 *
 * Throws on shape mismatch; callers who want soft-fail should call
 * `isSiliconRepr` first.
 */
export function fromSiliconLayer(
  r: SiliconRepr,
): CoherentFunctor<unknown, unknown> {
  if (!isSiliconRepr(r)) {
    throw new Error('fromSiliconLayer: invalid SiliconRepr shape');
  }
  const sourceName = r.structuredData.sourceCategoryName;
  const targetName = r.structuredData.targetCategoryName;
  const hasDirectSum = r.structuredData.hasDirectSum;

  const placeholderCat = (name: string, withDirectSum: boolean) => ({
    name,
    identity: (o: unknown): Morphism<unknown, unknown> => ({
      source: o,
      target: o,
      name: `id_${String(o)}`,
    }),
    compose: <A, B, C>(g: Morphism<B, C>, f: Morphism<A, B>): Morphism<A, C> => ({
      source: f.source,
      target: g.target,
      name: `(${g.name}∘${f.name})`,
    }),
    equalObjects: (x: unknown, y: unknown): boolean => x === y,
    ...(withDirectSum
      ? {
          directSum: (a: unknown, b: unknown): unknown => `${String(a)}⊕${String(b)}`,
        }
      : {}),
  });

  const source = placeholderCat(sourceName, false);
  const target = placeholderCat(targetName, hasDirectSum);

  return {
    name: r.humanIntent.functorName,
    source,
    target,
    onObjects: () => {
      throw new Error(
        `fromSiliconLayer: onObjects is a placeholder — rebind locally via ${r.executableCode.onObjectsLabel}`,
      );
    },
    onMorphisms: () => {
      throw new Error(
        `fromSiliconLayer: onMorphisms is a placeholder — rebind locally via ${r.executableCode.onMorphismsLabel}`,
      );
    },
    coherenceData: {
      naturality: r.structuredData.coherenceWitness.naturality,
      identity: r.structuredData.coherenceWitness.identity,
      composition: r.structuredData.coherenceWitness.composition,
      directSum: r.structuredData.coherenceWitness.directSum,
    },
  };
}

/**
 * M3 §13 signature (5). Panel-tagged translation of a coherent functor into
 * a Silicon-Layer representation — closes the loop between F and the live
 * Rosetta-Core panel-router.
 *
 * Returns a SiliconRepr with panelId stamped; the receiving panel is free to
 * call `fromSiliconLayer` to re-bind into its local category machinery.
 */
export function translate<C, D>(
  F: CoherentFunctor<C, D>,
  panelId: string,
): SiliconRepr {
  return toSiliconLayer(F, { panelId });
}
