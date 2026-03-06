/**
 * Wing 5: Set Theory — See Phase
 * "Being"
 *
 * Boundaries emerging. Elements flowing in and out of sets.
 * No math notation — just seeing.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface SeePhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const SeePhase: React.FC<SeePhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase see-phase set-theory-see">
      <h2>{phase.title}</h2>

      <div className="see-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="see-visualization-description">
        <div className="see-scene">
          <h3>Watch the Boundary</h3>
          <p>
            Imagine a circle drawn on a table covered with scattered coins. Some
            coins are inside the circle. Some are outside. The circle does not
            change the coins — it only decides which ones belong. Now imagine the
            circle breathing, expanding and contracting. Coins drift in and out.
            The membership changes, but the rule stays the same: inside or outside.
          </p>
        </div>

        <div className="see-scene">
          <h3>Two Circles Overlapping</h3>
          <p>
            Now a second circle appears, overlapping the first. Some coins sit
            inside both circles — the overlap, the shared space. Some sit in only
            one circle or the other. And some sit outside both entirely. Without
            counting, without measuring, you can see four distinct regions. Four
            kinds of belonging.
          </p>
        </div>

        <div className="see-scene">
          <h3>The Complement</h3>
          <p>
            Focus on everything outside the circles. The table is vast. The
            coins outside are not nothing — they are the complement. Defined
            not by what they are, but by what they are not. Exclusion is its
            own kind of identity.
          </p>
        </div>
      </div>

      <div className="see-content">
        <p>{phase.content.text}</p>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        I can see the regions...
      </button>
    </div>
  );
};

export default SeePhase;
