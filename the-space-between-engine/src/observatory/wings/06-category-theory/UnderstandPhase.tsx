/**
 * Wing 6: Category Theory — Understand Phase
 * "Arrows"
 *
 * Objects, morphisms, functors, natural transformations.
 * Formal math OK here.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface UnderstandPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const UnderstandPhase: React.FC<UnderstandPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase understand-phase category-theory-understand">
      <h2>{phase.title}</h2>

      <div className="understand-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="understand-content">
        <section className="concept-block">
          <h3>Categories</h3>
          <p>
            A category consists of objects and morphisms (arrows) between them.
            Every object has an identity morphism (an arrow pointing to itself),
            and morphisms compose: if there is an arrow from A to B and an arrow
            from B to C, there must be an arrow from A to C. That is all.
          </p>
          <div className="math-notation">
            <code>A category C consists of:</code>
            <br />
            <code>  - A collection of objects: Ob(C)</code>
            <br />
            <code>  - For each pair (A, B), a set of morphisms: Hom(A, B)</code>
            <br />
            <code>{'  - Composition: f: A -> B, g: B -> C implies g . f: A -> C'}</code>
            <br />
            <code>{'  - Identity: id_A: A -> A for every object A'}</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Morphisms — The Arrows</h3>
          <p>
            In category theory, the arrows matter more than the objects. An object
            is entirely determined by its relationships — what arrows go in and
            what arrows go out. Two objects with identical incoming and outgoing
            arrows are, categorically speaking, the same. Identity is not
            intrinsic; it is relational.
          </p>
          <div className="math-notation">
            <code>{'f: A -> B (f is a morphism from A to B)'}</code>
            <br />
            <code>{'g . f: A -> C (composition: first f, then g)'}</code>
            <br />
            <code>id_A . f = f = f . id_B (identity law)</code>
            <br />
            <code>(h . g) . f = h . (g . f) (associativity)</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Functors — Structure-Preserving Maps</h3>
          <p>
            A functor is a map between categories that preserves the arrow
            structure. It sends objects to objects, morphisms to morphisms, and
            respects composition and identity. A functor is the mathematical
            formalization of "translation that preserves meaning."
          </p>
          <div className="math-notation">
            <code>{'F: C -> D is a functor if:'}</code>
            <br />
            <code>{'  - F maps objects of C to objects of D'}</code>
            <br />
            <code>{'  - F maps morphisms: f: A -> B becomes F(f): F(A) -> F(B)'}</code>
            <br />
            <code>  - F(g . f) = F(g) . F(f) (preserves composition)</code>
            <br />
            <code>  - F(id_A) = id_F(A) (preserves identity)</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Natural Transformations — Maps Between Maps</h3>
          <p>
            If a functor is a translation between worlds, a natural transformation
            is a systematic way to compare two translations. Given two functors
            F and G from category C to category D, a natural transformation
            assigns to each object A in C a morphism from F(A) to G(A) in D,
            in a way that is compatible with all the arrows.
          </p>
          <div className="math-notation">
            <code>{'eta: F => G is a natural transformation if:'}</code>
            <br />
            <code>{'  For every morphism f: A -> B in C,'}</code>
            <br />
            <code>  G(f) . eta_A = eta_B . F(f)</code>
            <br />
            <code>  (the "naturality square" commutes)</code>
          </div>
        </section>

        {phase.content.mathNotation && (
          <section className="formal-notation">
            <h3>Formal Notation</h3>
            <pre className="math-display">{phase.content.mathNotation}</pre>
          </section>
        )}

        <div className="understand-text">
          <p>{phase.content.text}</p>
        </div>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        Structure-preserving maps...
      </button>
    </div>
  );
};

export default UnderstandPhase;
