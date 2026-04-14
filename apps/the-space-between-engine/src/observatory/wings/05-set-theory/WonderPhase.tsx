/**
 * Wing 5: Set Theory — Wonder Phase
 * "Being"
 *
 * What makes you YOU? Zero math. Pure wonder.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface WonderPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const WonderPhase: React.FC<WonderPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase wonder-phase set-theory-wonder">
      <h2>{phase.title}</h2>

      <div className="wonder-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="wonder-stories">
        <div className="wonder-story">
          <h3>The Ship of Theseus</h3>
          <p>
            What makes you YOU? Every seven years, nearly every atom in your body
            has been replaced. The carbon, the oxygen, the hydrogen — all different
            molecules than the ones you started with. Yet you persist. Something
            about the pattern, the arrangement, the <em>membership</em> of
            what-makes-you-you endures even as the physical pieces cycle through.
          </p>
        </div>

        <div className="wonder-story">
          <h3>The Forest Fire's Edge</h3>
          <p>
            A wildfire sweeps through a forest. Behind it: ash and new soil. Ahead:
            untouched trees. And at the boundary — the fire line — a razor-thin edge
            separates what is burning from what is not. Every tree at that edge is
            either inside the fire or outside. There is no in-between. The boundary
            defines the fire as surely as the flames do.
          </p>
        </div>

        <div className="wonder-story">
          <h3>A River That Is Never the Same</h3>
          <p>
            Heraclitus said you cannot step into the same river twice. The water
            that flows past your ankles right now will be in the ocean by tomorrow.
            Yet the river persists — its banks, its bed, its name. The river is not
            its water. It is the rule that decides what counts as the river: water
            flowing between these banks, from this source to that mouth. The rule is
            the river. The water just visits.
          </p>
        </div>

        <div className="wonder-story">
          <h3>You and Your Companion</h3>
          <p>
            You and your pet — a cat curled on a windowsill, a dog pressed against
            your leg, a bird tilting its head at the sound of your voice. Two
            separate beings. Two separate sets of experiences, memories, needs. And
            yet, in the overlap — in the shared mornings, the mutual recognition,
            the quiet understanding — something new exists. Not you. Not them.
            Something that belongs to both and neither. The space between.
          </p>
        </div>
      </div>

      <div className="wonder-reflection">
        <p>
          {phase.content.text}
        </p>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        I see boundaries everywhere now...
      </button>
    </div>
  );
};

export default WonderPhase;
