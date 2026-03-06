/**
 * Wing 7: Information Theory — See Phase
 * "The Channel"
 *
 * A message traveling through a channel. Encoding, noise, decoding.
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
    <div className="wing-phase see-phase information-theory-see">
      <h2>{phase.title}</h2>

      <div className="see-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="see-visualization-description">
        <div className="see-scene">
          <h3>The Source</h3>
          <p>
            On the left, a message. A sentence, an image, a song — any
            information at all. It has a certain amount of surprise in it.
            A message that says "the sun rose this morning" carries less
            surprise than one that says "it snowed in July." The more
            surprising the message, the more information it carries. Information
            is not about meaning — it is about surprise.
          </p>
        </div>

        <div className="see-scene">
          <h3>The Encoder</h3>
          <p>
            The message must be converted into a form that can travel. Letters
            become binary numbers. Sound waves become samples. Images become
            pixels. The encoder compresses: it finds the patterns, the
            redundancies, the predictable parts, and represents them efficiently.
            Common letters get short codes. Rare letters get long ones. The
            encoding adapts to the statistics of the message.
          </p>
        </div>

        <div className="see-scene">
          <h3>The Channel</h3>
          <p>
            The encoded message enters the channel. The channel is anything
            that carries information: a wire, the air, a fiber optic cable,
            a page. And the channel has noise — random disturbances that
            corrupt the signal. A bit might flip. A pixel might smear. A word
            might be misheard. The noise is the enemy of communication, and
            it is everywhere.
          </p>
        </div>

        <div className="see-scene">
          <h3>The Decoder</h3>
          <p>
            On the other end, the decoder receives the corrupted signal and
            reconstructs the original message. Error correction codes — extra
            information added by the encoder — allow the decoder to detect
            and fix errors. Not all errors. Not always. But up to a limit that
            is mathematically precise. That limit exists, and finding it was
            one of the great intellectual achievements of the twentieth century.
          </p>
        </div>
      </div>

      <div className="see-content">
        <p>{phase.content.text}</p>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        I can see the channel...
      </button>
    </div>
  );
};

export default SeePhase;
