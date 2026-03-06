/**
 * Wing 5: Set Theory — Understand Phase
 * "Being"
 *
 * Set notation, membership functions, Russell's paradox.
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
    <div className="wing-phase understand-phase set-theory-understand">
      <h2>{phase.title}</h2>

      <div className="understand-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="understand-content">
        <section className="concept-block">
          <h3>Set Notation</h3>
          <p>
            A set is a collection of distinct objects, considered as a whole.
            We write sets with curly braces, and membership with the "element of"
            symbol.
          </p>
          <div className="math-notation">
            <code>A = {'{'} x | x satisfies some property {'}'}</code>
            <br />
            <code>x in A means "x is a member of A"</code>
            <br />
            <code>x not in A means "x is not a member of A"</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Membership Functions</h3>
          <p>
            A membership function is the rule that decides belonging. Given any
            object in the universe, it returns true or false. This binary judgment
            is what creates structure from chaos. It draws the line between inside
            and outside.
          </p>
          <div className="math-notation">
            <code>chi_A(x) = 1 if x in A, 0 if x not in A</code>
            <br />
            <code>This is the characteristic function of set A</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Operations</h3>
          <p>Sets combine through operations that mirror logic itself.</p>
          <div className="math-notation">
            <code>A union B = {'{'} x | x in A OR x in B {'}'}</code>
            <br />
            <code>A intersect B = {'{'} x | x in A AND x in B {'}'}</code>
            <br />
            <code>A \ B = {'{'} x | x in A AND x not in B {'}'}</code>
            <br />
            <code>A^c = {'{'} x | x not in A {'}'} (complement)</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Russell's Paradox — The Set That Cannot Exist</h3>
          <p>
            Can a set contain itself? Consider the set of all sets that do not
            contain themselves. Call it R. Is R a member of itself?
          </p>
          <p>
            If R is in R, then by its own definition, R must NOT be in R.
            But if R is NOT in R, then by its own definition, R MUST be in R.
          </p>
          <p>
            This contradiction shook the foundations of mathematics in 1901.
            It showed that naive set theory — "any definable collection is a set" —
            leads to impossibility. The resolution required axioms: careful rules
            about what collections are allowed to exist. Identity requires boundaries,
            and some boundaries are impossible.
          </p>
          <div className="math-notation">
            <code>R = {'{'} x | x not in x {'}'}</code>
            <br />
            <code>R in R iff R not in R — contradiction</code>
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
        The mathematics of identity...
      </button>
    </div>
  );
};

export default UnderstandPhase;
