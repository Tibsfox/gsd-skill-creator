/**
 * JP-027 (MEDIUM, Phase 837) — discrete-bundle-application smoke test.
 *
 * Anchor: arXiv:2104.10277 (Discrete Vector Bundles with Connection,
 * Crane & Wardetzky 2021). Depends on JP-013 (shipped at 23809d534).
 *
 * Tests:
 *   1. canonicalSection returns the correct fiber value at each vertex.
 *   2. applyBundleTransport returns a morphism and has identity witness present.
 *   3. bundleHolonomyWitness is non-empty on a composed functor.
 *   4. isFlatBundle returns flat=true on a composed identity functor pair.
 *   5. composeAsBundle produces a functor with holonomyWitness set and bundleFlat=true.
 */

import { describe, expect, it } from 'vitest';
import type { Category, Morphism } from '../index.js';
import { identityFunctor } from '../index.js';
import {
  applyBundleTransport,
  bundleHolonomyWitness,
  canonicalSection,
  composeAsBundle,
  isFlatBundle,
} from '../discrete-bundle-application.js';

// ---------------------------------------------------------------------------
// Minimal category for tests: 2-vertex category (objects: 0, 1)
// ---------------------------------------------------------------------------

function twoVertexCategory(): Category<number> {
  return {
    name: 'TwoVertex',
    identity: (v: number): Morphism<number, number> => ({
      source: v,
      target: v,
      name: `id_${v}`,
    }),
    compose: <A, B, C>(g: Morphism<B, C>, f: Morphism<A, B>): Morphism<A, C> => ({
      source: f.source,
      target: g.target,
      name: `(${g.name}∘${f.name})`,
    }),
    equalObjects: (x: number, y: number): boolean => x === y,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JP-027 discrete-bundle-application: canonicalSection', () => {
  it('canonical section at vertex v returns the functor image F(v)', () => {
    const cat = twoVertexCategory();
    const F = identityFunctor(cat);
    const section = canonicalSection(F);
    expect(section.at(0)).toBe(0);
    expect(section.at(1)).toBe(1);
  });

  it('canonical section name encodes the functor name', () => {
    const cat = twoVertexCategory();
    const F = identityFunctor(cat);
    const section = canonicalSection(F);
    expect(section.name).toContain(F.name);
  });
});

describe('JP-027 discrete-bundle-application: applyBundleTransport', () => {
  it('transport along identity morphism returns a morphism and confirms identity witness', () => {
    const cat = twoVertexCategory();
    const F = identityFunctor(cat);
    const edge = cat.identity(0); // id morphism at vertex 0
    const fiberValue = F.onObjects(0);
    const result = applyBundleTransport(F, edge, fiberValue);
    // The transported morphism must exist (non-null).
    expect(result.transported).toBeDefined();
    // The identity witness must be present on the identity functor (flat connection).
    expect(result.identityWitnessPresent).toBe(true);
  });
});

describe('JP-027 discrete-bundle-application: bundleHolonomyWitness', () => {
  it('holonomy witness is non-empty on a composed functor (flat-connection stamped)', () => {
    const cat = twoVertexCategory();
    const f = identityFunctor(cat);
    const g = identityFunctor(cat);
    const composed = composeAsBundle(g, f, cat);
    const witness = bundleHolonomyWitness(composed);
    expect(witness.length).toBeGreaterThan(0);
  });

  it('holonomy witness is empty on a fresh factory functor (composition not yet stamped)', () => {
    const cat = twoVertexCategory();
    const F = identityFunctor(cat);
    // A freshly-built identity functor has no composition witness yet.
    expect(bundleHolonomyWitness(F)).toBe('');
  });
});

describe('JP-027 discrete-bundle-application: isFlatBundle', () => {
  it('composed identity functors form a flat bundle', () => {
    const cat = twoVertexCategory();
    const f = identityFunctor(cat);
    const g = identityFunctor(cat);
    const composed = composeAsBundle(g, f, cat);
    const result = isFlatBundle(composed);
    expect(result.flat).toBe(true);
    expect(result.reason).toContain('flat');
  });

  it('fresh identity functor is NOT considered flat (composition witness absent)', () => {
    const cat = twoVertexCategory();
    const F = identityFunctor(cat);
    // isFlatBundle requires a stamped composition witness — the identity
    // functor has none until it participates in a compose() call.
    const result = isFlatBundle(F);
    expect(result.flat).toBe(false);
    expect(result.reason).toContain('composition-witness-absent');
  });
});

describe('JP-027 discrete-bundle-application: composeAsBundle', () => {
  it('produces a functor with holonomyWitness set and bundleFlat=true', () => {
    const cat = twoVertexCategory();
    const f = identityFunctor(cat);
    const g = identityFunctor(cat);
    const bundle = composeAsBundle(g, f, cat);
    expect(bundle.holonomyWitness.length).toBeGreaterThan(0);
    expect(bundle.bundleFlat).toBe(true);
  });

  it('composeAsBundle preserves the identity-functor object mapping', () => {
    const cat = twoVertexCategory();
    const f = identityFunctor(cat);
    const g = identityFunctor(cat);
    const bundle = composeAsBundle(g, f, cat);
    // F = id, G = id => G∘F = id => onObjects unchanged
    expect(bundle.onObjects(0)).toBe(0);
    expect(bundle.onObjects(1)).toBe(1);
  });

  it('holonomyWitness encodes both functor names (transport-composition record)', () => {
    const cat = twoVertexCategory();
    const f = identityFunctor(cat);
    const g = identityFunctor(cat);
    const bundle = composeAsBundle(g, f, cat);
    // The composition witness from compose() encodes g.name∘f.name
    expect(bundle.holonomyWitness).toContain(f.name);
    expect(bundle.holonomyWitness).toContain(g.name);
  });
});
