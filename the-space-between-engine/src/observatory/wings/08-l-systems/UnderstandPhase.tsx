/**
 * Wing 8: L-Systems — Understand Phase
 * "Growth"
 *
 * L-system formal grammars, rewriting rules, parametric and stochastic.
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
    <div className="wing-phase understand-phase l-systems-understand">
      <h2>{phase.title}</h2>

      <div className="understand-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="understand-content">
        <section className="concept-block">
          <h3>Formal Grammars</h3>
          <p>
            An L-system (Lindenmayer system) is a parallel rewriting system.
            Unlike sequential grammars where one symbol is rewritten at a time,
            in an L-system ALL symbols are rewritten simultaneously in each
            generation. This parallel rewriting models biological growth, where
            every cell divides at the same time, not one after another.
          </p>
          <div className="math-notation">
            <code>An L-system G = (V, omega, P) where:</code>
            <br />
            <code>  V = alphabet (set of symbols)</code>
            <br />
            <code>  omega = axiom (initial string, omega in V+)</code>
            <br />
            <code>{'  P = production rules (V -> V*)'}</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Rewriting Rules</h3>
          <p>
            A production rule specifies how each symbol transforms in each
            generation. The classic example: the Algae system by Lindenmayer
            himself. Start with A. Each generation, A becomes AB and B becomes A.
            Watch the sequence grow: A, AB, ABA, ABAAB, ABAABABA... The lengths
            follow the Fibonacci sequence. Growth and Fibonacci, connected through
            the simplest possible rule.
          </p>
          <div className="math-notation">
            <code>Algae system:</code>
            <br />
            <code>  V = {'{'} A, B {'}'}</code>
            <br />
            <code>  omega = A</code>
            <br />
            <code>{'  P: A -> AB, B -> A'}</code>
            <br />
            <code>  n=0: A  (length 1)</code>
            <br />
            <code>  n=1: AB  (length 2)</code>
            <br />
            <code>  n=2: ABA  (length 3)</code>
            <br />
            <code>  n=3: ABAAB  (length 5)</code>
            <br />
            <code>  Lengths: 1, 2, 3, 5, 8, 13... (Fibonacci!)</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Parametric L-Systems</h3>
          <p>
            Real plants do not branch at identical angles or grow identical
            segments. Parametric L-systems extend the basic model by attaching
            numerical parameters to symbols. A symbol F(length, width) can carry
            information about segment size. Rules can include conditions:
            "if length is greater than a threshold, branch; otherwise, become a leaf."
            This allows age-dependent behavior — young branches are flexible and
            thin; old ones are rigid and thick.
          </p>
          <div className="math-notation">
            <code>{'Parametric rule: F(l, w) : l > 1 -> F(l*0.7, w*0.9) [+F(l*0.5, w*0.7)] [-F(l*0.5, w*0.7)]'}</code>
            <br />
            <code>{'Condition: l > 1 (only branch if long enough)'}</code>
            <br />
            <code>Parameters decay: simulates natural thinning with distance from trunk</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Stochastic L-Systems</h3>
          <p>
            No two trees of the same species are identical, even though they
            follow the same genetic rules. Stochastic L-systems introduce
            randomness: a symbol might be rewritten by rule A with probability
            0.6, or by rule B with probability 0.4. The underlying structure
            is the same, but each instance grows differently. Order and
            randomness, dancing together, producing the infinite variety of
            a forest from a handful of rules.
          </p>
          <div className="math-notation">
            <code>Stochastic rule:</code>
            <br />
            <code>{'  F -> F[+F]F[-F]F  with probability 0.33'}</code>
            <br />
            <code>{'  F -> F[+F]F       with probability 0.33'}</code>
            <br />
            <code>{'  F -> F[-F]F       with probability 0.34'}</code>
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
        Simple rules, infinite variety...
      </button>
    </div>
  );
};

export default UnderstandPhase;
