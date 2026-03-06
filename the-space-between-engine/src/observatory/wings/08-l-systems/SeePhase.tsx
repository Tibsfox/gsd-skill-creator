/**
 * Wing 8: L-Systems — See Phase
 * "Growth"
 *
 * Simple rules producing complex, beautiful patterns.
 * One rule, iterated. No math notation.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface SeePhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const SeePhase: React.FC<SeePhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase see-phase l-systems-see">
      <h2>{phase.title}</h2>

      <div className="see-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="see-visualization-description">
        <div className="see-scene">
          <h3>The Seed</h3>
          <p>
            It starts with a single symbol. A letter. Just one. Call it F.
            F means: draw a line forward. That is all. One line. One step.
            Nothing complex, nothing beautiful. Just a mark on a page.
          </p>
        </div>

        <div className="see-scene">
          <h3>The Rule</h3>
          <p>
            Now introduce a rule: wherever you see F, replace it with
            "F, turn left, F, turn right, F." One generation passes.
            The single line becomes a zigzag. Still simple, but no longer
            a straight line. Something has emerged that was not in the
            original — shape has appeared from shapelessness.
          </p>
        </div>

        <div className="see-scene">
          <h3>Iteration</h3>
          <p>
            Apply the rule again. Every F in the zigzag is replaced by
            a new zigzag. The shape doubles in complexity. Apply it once
            more. And again. By the fourth or fifth generation, the pattern
            has become intricate, organic, alive-looking. A shape that
            resembles a plant, a coastline, a snowflake. All from one
            rule and one starting symbol.
          </p>
        </div>

        <div className="see-scene">
          <h3>The Infinite in the Finite</h3>
          <p>
            Here is what is remarkable: the rule is finite. The starting
            symbol is finite. But the patterns they produce can grow
            without bound, and they never repeat exactly. Finite rules,
            infinite possibility. This is the secret of growth — not
            complexity of instruction, but repetition of simplicity.
            Nature does not need a blueprint for every leaf. It needs
            one rule and the patience to apply it.
          </p>
        </div>
      </div>

      <div className="see-content">
        <p>{phase.content.text}</p>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        Simplicity grows into beauty...
      </button>
    </div>
  );
};

export default SeePhase;
