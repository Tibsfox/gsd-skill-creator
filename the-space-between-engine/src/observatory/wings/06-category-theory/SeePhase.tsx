/**
 * Wing 6: Category Theory — See Phase
 * "Arrows"
 *
 * Two collections. Arrows between them. Structure preserved.
 * No math notation.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface SeePhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const SeePhase: React.FC<SeePhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase see-phase category-theory-see">
      <h2>{phase.title}</h2>

      <div className="see-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="see-visualization-description">
        <div className="see-scene">
          <h3>Two Worlds</h3>
          <p>
            On the left, a collection of shapes: a circle, a triangle, a square.
            Between them, arrows — the circle connects to the triangle, the
            triangle connects to the square, and (following the arrows) the
            circle connects to the square too. These connections form a little
            world with internal structure.
          </p>
        </div>

        <div className="see-scene">
          <h3>A Bridge Between Them</h3>
          <p>
            On the right, a collection of colors: red, green, blue. They have
            their own arrows — red goes to green, green goes to blue, red goes
            to blue. The same pattern. Now draw arrows from left to right: circle
            goes to red, triangle goes to green, square goes to blue. Notice
            something remarkable: every arrow on the left has a matching arrow
            on the right. The structure is preserved across the bridge.
          </p>
        </div>

        <div className="see-scene">
          <h3>The Arrows Are the Point</h3>
          <p>
            Here is the key insight: it does not matter what the shapes or
            colors actually are. What matters is how they are connected. The
            arrows — the relationships — carry all the information. Two
            categories with the same arrow pattern are, in the deepest sense,
            the same thing wearing different costumes. The functor (the bridge)
            reveals this sameness.
          </p>
        </div>
      </div>

      <div className="see-content">
        <p>{phase.content.text}</p>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        The arrows carry the meaning...
      </button>
    </div>
  );
};

export default SeePhase;
