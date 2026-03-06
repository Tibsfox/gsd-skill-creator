/**
 * Wing 6: Category Theory — Wonder Phase
 * "Arrows"
 *
 * Translation between worlds. Maps, not territories. Zero math.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface WonderPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const WonderPhase: React.FC<WonderPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase wonder-phase category-theory-wonder">
      <h2>{phase.title}</h2>

      <div className="wonder-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="wonder-stories">
        <div className="wonder-story">
          <h3>The Translator</h3>
          <p>
            You walk into a room where two people are speaking different languages.
            Neither understands the other. But a third person sits between them,
            listening to one and speaking to the other, carrying meaning across the
            gap. The words change completely. The grammar changes. The sounds are
            unrecognizable. And yet — the meaning arrives intact. Something is
            preserved in the translation. Not the words. Not the sounds. The
            <em> structure</em>. The relationships between ideas survive the
            crossing.
          </p>
        </div>

        <div className="wonder-story">
          <h3>Sheet Music to Sound</h3>
          <p>
            A musician reads a page of sheet music. Black dots on lines. Their
            fingers move across keys or strings, and sound fills the room. The
            page and the sound are nothing alike — one is visual, static, silent;
            the other is invisible, temporal, vibrating. Yet there is a faithful
            correspondence. Every relationship on the page (this note is higher
            than that one, these three notes form a chord, this passage repeats)
            is preserved in the sound. The map between them does not just
            translate elements. It translates relationships.
          </p>
        </div>

        <div className="wonder-story">
          <h3>Your Pet's Language</h3>
          <p>
            Your dog does not speak your language. And yet you understand each
            other. A wagging tail means joy. Ears pinned back means fear. A slow
            approach with head lowered means "I am sorry" or "I need comfort."
            You have built, over years of shared life, a translator between two
            entirely different kinds of minds. You do not translate word by word.
            You translate patterns. The relationship between the tail position
            and the ear position tells you more than either alone — just as in
            a category, the morphisms (arrows) tell you more than the objects.
          </p>
        </div>

        <div className="wonder-story">
          <h3>Maps, Not Territories</h3>
          <p>
            A subway map does not look like the tunnels it represents. Distances
            are wrong. Angles are wrong. The geography is distorted beyond
            recognition. And yet the map is perfectly useful, because it preserves
            the one thing that matters: connections. Which station connects to
            which. The transfer points. The order of stops on a line. The map
            is not the territory. But the map carries the structure of the
            territory — and structure is all you need to navigate.
          </p>
        </div>
      </div>

      <div className="wonder-reflection">
        <p>
          {phase.content.text}
        </p>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        I see translations everywhere...
      </button>
    </div>
  );
};

export default WonderPhase;
