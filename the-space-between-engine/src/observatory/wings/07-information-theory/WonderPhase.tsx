/**
 * Wing 7: Information Theory — Wonder Phase
 * "The Channel"
 *
 * The joy that crosses the wire. DNA as ancestral message. Zero math.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface WonderPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const WonderPhase: React.FC<WonderPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase wonder-phase information-theory-wonder">
      <h2>{phase.title}</h2>

      <div className="wonder-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="wonder-stories">
        <div className="wonder-story">
          <h3>A Photo of Your Pet</h3>
          <p>
            You take a photo of your cat asleep in a sunbeam. You send it to a
            friend across the country. They smile. They feel a little of the
            warmth you felt standing in your living room, watching the light fall
            on fur. Consider what just happened: a moment of peace in your home
            was converted to numbers, shot through fiber optic cables as pulses
            of light, reassembled as pixels on a screen, and decoded by a human
            brain back into an emotion. The joy crossed the wire. Not perfectly —
            your friend did not feel the warmth on their skin, did not hear the
            purring — but enough. Enough to smile.
          </p>
        </div>

        <div className="wonder-story">
          <h3>Birdsong at Dawn</h3>
          <p>
            A robin sits on a branch and sings. Its song carries across the
            neighborhood, through walls and windows, to another robin three
            gardens away. The message: "This territory is mine." The channel:
            vibrations in air. The noise: wind, traffic, a barking dog. And yet
            the message arrives. The second robin hears it and stays away. A
            few ounces of bird, with a brain the size of a walnut, has solved
            the fundamental problem of communication — encoding a message so
            that it survives a noisy channel.
          </p>
        </div>

        <div className="wonder-story">
          <h3>The Oldest Message</h3>
          <p>
            Your DNA is a message written four billion years ago and copied,
            with errors and corrections, through every generation since. The
            alphabet has only four letters. The channel is biology itself — cell
            division, reproduction, survival. The noise is mutation, radiation,
            chance. And yet here you are, reading this, because the message
            arrived. Not perfectly — you are not identical to your ancestors —
            but with enough fidelity to carry the instructions for building a
            human being across an unbroken chain of four billion years.
          </p>
        </div>

        <div className="wonder-story">
          <h3>These Words, Right Now</h3>
          <p>
            You are reading these words. I wrote them. Between us: a screen,
            a rendering engine, a network, a server, a file, a compiler, a
            keyboard, and my fingers. So many points of failure. So many
            opportunities for noise. And yet — if this sentence makes sense
            to you — the message arrived. The meaning crossed the channel.
            This is the miracle of information: it is not physical. It is the
            pattern, not the medium. The same message survives paper, radio,
            fiber optics, and human memory. It is substrate-independent. It
            is, in a profound sense, immortal.
          </p>
        </div>
      </div>

      <div className="wonder-reflection">
        <p>
          {phase.content.text}
        </p>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        Meaning crosses every channel...
      </button>
    </div>
  );
};

export default WonderPhase;
