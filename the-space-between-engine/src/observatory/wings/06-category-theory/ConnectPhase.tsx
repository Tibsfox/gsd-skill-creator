/**
 * Wing 6: Category Theory — Connect Phase
 * "Arrows"
 *
 * Links to Set Theory, Information Theory, and Rosetta Core.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface ConnectPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const ConnectPhase: React.FC<ConnectPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase connect-phase category-theory-connect">
      <h2>{phase.title}</h2>

      <div className="connect-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="connect-content">
        <section className="connection-bridge">
          <h3>From Set Theory: Categories Extend Sets</h3>
          <p>
            Set theory gives us collections and membership. Category theory asks:
            what are the relationships BETWEEN collections? The category <em>Set</em> has
            sets as objects and functions as morphisms. Every function between sets
            is a morphism. Set theory is not left behind — it becomes one category
            among many. The concrete becomes a special case of the abstract.
          </p>
          <div className="math-notation">
            <code>Set is a category:</code>
            <br />
            <code>  Objects: sets (A, B, C, ...)</code>
            <br />
            <code>{'  Morphisms: functions (f: A -> B)'}</code>
            <br />
            <code>  Composition: (g . f)(x) = g(f(x))</code>
          </div>
        </section>

        <section className="connection-bridge">
          <h3>To Information Theory: Functors Preserve Channel Structure</h3>
          <p>
            An information channel maps inputs to outputs with some probability.
            A functor between categories of channels preserves the encoding-decoding
            structure. When you change the representation of a message (from text
            to binary, from binary to signal), you are applying a functor: the
            relationships between messages are preserved even as the format changes.
            Lossless compression is a faithful functor. Lossy compression is a
            functor that forgets some arrows.
          </p>
          <div className="math-notation">
            <code>{'Encoding functor E: Messages -> Signals'}</code>
            <br />
            <code>{'E preserves: "A is a prefix of B" => "E(A) is decodable before E(B)"'}</code>
          </div>
        </section>

        <section className="connection-bridge skill-creator-bridge">
          <h3>Skill-Creator Bridge: Rosetta Core IS Category Theory</h3>
          <p>
            The Rosetta Core in the skill-creator is the most direct application of
            category theory in the entire system. It translates between domains:
            mathematical concepts become code patterns, code patterns become
            documentation, documentation becomes teaching material. Each translation
            is a functor. The Rosetta Core does not just convert — it preserves
            structure. A hierarchical relationship in the math domain maps to a
            hierarchical relationship in the code domain. The same pattern, wearing
            different clothes. Multi-domain translation IS category theory, applied.
          </p>
          <div className="math-notation">
            <code>{'RosettaCore: MathDomain -> CodeDomain'}</code>
            <br />
            <code>RosettaCore(group_theory) = type_system</code>
            <br />
            <code>RosettaCore(homomorphism) = interface_adapter</code>
            <br />
            <code>Structure preserved: composition, identity, hierarchy</code>
          </div>
        </section>

        {phase.content.mathNotation && (
          <section className="formal-connections">
            <h3>The Web of Arrows</h3>
            <pre className="math-display">{phase.content.mathNotation}</pre>
          </section>
        )}

        <div className="connect-text">
          <p>{phase.content.text}</p>
        </div>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        Translation preserves meaning...
      </button>
    </div>
  );
};

export default ConnectPhase;
