/**
 * Coherent Functors — factory constructors.
 *
 * M3 §13 signatures (1) and (2):
 *   - identityFunctor<O>(cat): a trivial identity coherent functor on a category.
 *   - presentNetwork(arch): a coherent functor derived from an architecture.
 *
 * Both are pure constructors — given the same input, they produce the same
 * functor object. No side effects, no CAPCOM interaction.
 *
 * @module coherent-functors/factory
 */

import type {
  Architecture,
  Category,
  CoherentFunctor,
  Morphism,
  TypeSignature,
  ValidationResult,
} from './types.js';

/** Identity coherent functor on a category. All four predicates trivially hold. */
export function identityFunctor<O>(cat: Category<O>): CoherentFunctor<O, O> {
  return {
    name: `id_${cat.name}`,
    source: cat,
    target: cat,
    onObjects: (o: O) => o,
    onMorphisms: <A, B>(f: Morphism<A, B>): Morphism<O, O> => ({
      // The identity functor sends a morphism to a morphism with the same
      // name and shape; casting through the unknown brand is safe because
      // the user provides Morphism<A, B> within the same category.
      source: (f.source as unknown) as O,
      target: (f.target as unknown) as O,
      name: f.name,
    }),
    coherenceData: {
      naturality: `identity:${cat.name}`,
      identity: `identity:${cat.name}`,
      composition: '',
      directSum: cat.directSum ? `identity-directSum:${cat.name}` : '',
    },
  };
}

/**
 * Validate an architecture spec. Non-empty name, non-empty layers, valid
 * input/output type signatures.
 */
export function validateArchitecture(arch: Architecture): ValidationResult {
  const violations: string[] = [];
  if (!arch.name || arch.name.length === 0) violations.push('name: empty');
  if (!Array.isArray(arch.layers) || arch.layers.length === 0) {
    violations.push('layers: must be non-empty array');
  }
  const io: Array<[string, TypeSignature | undefined]> = [
    ['inputType', arch.inputType],
    ['outputType', arch.outputType],
  ];
  for (const [field, sig] of io) {
    if (!sig) {
      violations.push(`${field}: missing`);
      continue;
    }
    if (!Array.isArray(sig.shape) || sig.shape.length === 0) {
      violations.push(`${field}.shape: must be non-empty array`);
    }
    if (typeof sig.dtype !== 'string' || sig.dtype.length === 0) {
      violations.push(`${field}.dtype: missing`);
    }
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Opaque category keyed by a type-signature description — used to construct
 * input/output categories for `presentNetwork`. Objects are stringifications
 * of shape + dtype; morphisms are labels.
 */
function typeSignatureCategory(name: string): Category<string> {
  return {
    name,
    identity: (o: string): Morphism<string, string> => ({ source: o, target: o, name: `id_${o}` }),
    compose: <A, B, C>(g: Morphism<B, C>, f: Morphism<A, B>): Morphism<A, C> => ({
      source: f.source,
      target: g.target,
      name: `(${g.name}∘${f.name})`,
    }),
    equalObjects: (x: string, y: string): boolean => x === y,
    directSum: (a: string, b: string): string => `${a}⊕${b}`,
  };
}

function signatureKey(sig: TypeSignature): string {
  return `${sig.dtype}[${sig.shape.join('x')}]`;
}

/**
 * M3 §13 signature (2). Given an architecture, produce a coherent functor
 * whose source and target categories are derived from the architecture's I/O
 * type signatures.
 *
 * Throws on invalid architecture shape; callers who want soft-fail should call
 * `validateArchitecture` first.
 */
export function presentNetwork(
  arch: Architecture,
): CoherentFunctor<string, string> {
  const v = validateArchitecture(arch);
  if (!v.ok) {
    throw new Error(
      `presentNetwork: invalid architecture — ${v.violations.join('; ')}`,
    );
  }
  const source = typeSignatureCategory(`in:${arch.name}`);
  const target = typeSignatureCategory(`out:${arch.name}`);
  const inKey = signatureKey(arch.inputType);
  const outKey = signatureKey(arch.outputType);
  return {
    name: `Present(${arch.name})`,
    source,
    target,
    onObjects: (_c: string) => outKey,
    onMorphisms: <A, B>(f: Morphism<A, B>): Morphism<string, string> => ({
      source: inKey,
      target: outKey,
      name: `Present(${arch.name})(${f.name})`,
    }),
    coherenceData: {
      naturality: `presentNetwork:${arch.name}`,
      identity: `presentNetwork:${arch.name}`,
      composition: '',
      directSum: `presentNetwork-directSum:${arch.name}`,
    },
  };
}
