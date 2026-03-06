/**
 * Wing 5: Set Theory — Connect Phase
 * "Being"
 *
 * Links to Category Theory, Information Theory, and skill-creator.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface ConnectPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const ConnectPhase: React.FC<ConnectPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase connect-phase set-theory-connect">
      <h2>{phase.title}</h2>

      <div className="connect-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="connect-content">
        <section className="connection-bridge">
          <h3>To Category Theory: Sets Grow Up</h3>
          <p>
            A set is a collection with a membership rule. But what happens when
            you zoom out and look at the relationships BETWEEN sets? Functions
            that map one set to another, preserving structure? That is category
            theory. Categories generalize sets the way sets generalize individual
            objects. Every set is a category with one object. Every function between
            sets is a morphism. Set theory is where category theory begins.
          </p>
          <div className="math-notation">
            <code>Set is a category where objects are sets and morphisms are functions</code>
          </div>
        </section>

        <section className="connection-bridge">
          <h3>To Information Theory: Entropy Lives on Sets</h3>
          <p>
            Shannon entropy is defined on probability distributions, and a
            probability distribution is a function on a set of outcomes. The set
            of possible messages, the set of symbols in an alphabet, the set of
            states a system can occupy — these are the foundations on which
            information theory builds. Without sets to define the sample space,
            there is no probability. Without probability, there is no entropy.
          </p>
          <div className="math-notation">
            <code>H(X) = -sum_x P(x) log P(x), where x ranges over a set of outcomes</code>
          </div>
        </section>

        <section className="connection-bridge skill-creator-bridge">
          <h3>Skill-Creator Bridge: Membership as File Detection</h3>
          <p>
            In the skill-creator, every file that arrives needs to be classified.
            Is this TypeScript? Is it a test file? Is it a configuration? The
            detection logic is a membership function — it takes a file and returns
            true or false for each category. Glob patterns like <code>*.test.ts</code> are
            set definitions. File format detection IS set theory. The boundary
            between "this belongs" and "this does not" is the same boundary that
            defines a mathematical set.
          </p>
          <div className="math-notation">
            <code>isTestFile(f) = chi_TestFiles(f) -- characteristic function</code>
            <br />
            <code>TestFiles = {'{'} f | f matches *.test.ts OR *.spec.ts {'}'}</code>
          </div>
        </section>

        {phase.content.mathNotation && (
          <section className="formal-connections">
            <h3>The Web of Connections</h3>
            <pre className="math-display">{phase.content.mathNotation}</pre>
          </section>
        )}

        <div className="connect-text">
          <p>{phase.content.text}</p>
        </div>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        Everything connects through belonging...
      </button>
    </div>
  );
};

export default ConnectPhase;
