/**
 * Wing 7: Information Theory — Connect Phase
 * "The Channel"
 *
 * Links to Trigonometry, Set Theory, and skill-creator.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface ConnectPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const ConnectPhase: React.FC<ConnectPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase connect-phase information-theory-connect">
      <h2>{phase.title}</h2>

      <div className="connect-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="connect-content">
        <section className="connection-bridge">
          <h3>To Trigonometry: Fourier Analysis</h3>
          <p>
            Every signal — every sound, every image, every message — can be
            decomposed into sine and cosine waves of different frequencies.
            This is the Fourier transform, and it is the bridge between
            information theory and trigonometry. Shannon's sampling theorem
            says you need at least two samples per cycle of the highest
            frequency to perfectly reconstruct a signal. The unit circle,
            through sine and cosine, is the language in which signals speak.
          </p>
          <div className="math-notation">
            <code>f(t) = sum over k of [a_k * cos(2*pi*k*t) + b_k * sin(2*pi*k*t)]</code>
            <br />
            <code>{'Nyquist rate: f_sample >= 2 * f_max (sampling theorem)'}</code>
          </div>
        </section>

        <section className="connection-bridge">
          <h3>To Set Theory: Entropy Lives on Probability Sets</h3>
          <p>
            Entropy is defined on a set of outcomes equipped with a probability
            distribution. The sample space — the set of all possible messages —
            is the foundation on which entropy is built. Change the set (add or
            remove possible messages) and the entropy changes. The membership
            function of a set determines what counts as a valid message, and
            that membership boundary shapes the information content of the
            entire system.
          </p>
          <div className="math-notation">
            <code>Omega = sample space (a set)</code>
            <br />
            <code>{'P: Omega -> [0, 1] with sum P(omega) = 1'}</code>
            <br />
            <code>H = -sum over omega in Omega of P(omega) * log2(P(omega))</code>
          </div>
        </section>

        <section className="connection-bridge skill-creator-bridge">
          <h3>Skill-Creator Bridge: Token Budget IS Channel Capacity</h3>
          <p>
            When an AI model processes your request, it has a finite context
            window — a maximum number of tokens it can read and generate.
            This is a channel with limited capacity. The skill-creator's
            progressive disclosure pattern is compression: show the most
            important information first, defer the details, load context
            only when needed. The token budget is not just a technical
            limitation — it is channel capacity in Shannon's sense. And
            the skill-creator's entire architecture is an error-correcting
            code: structured formats, validation hooks, and retry logic
            ensure that intent survives the noisy channel between human
            thought and machine execution.
          </p>
          <div className="math-notation">
            <code>Context window = C (channel capacity in tokens)</code>
            <br />
            <code>Progressive disclosure = source coding (compression)</code>
            <br />
            <code>Structured formats = error-correcting codes</code>
            <br />
            <code>{'Rate R < C => reliable communication (Shannon\'s theorem)'}</code>
          </div>
        </section>

        {phase.content.mathNotation && (
          <section className="formal-connections">
            <h3>The Web of Channels</h3>
            <pre className="math-display">{phase.content.mathNotation}</pre>
          </section>
        )}

        <div className="connect-text">
          <p>{phase.content.text}</p>
        </div>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        Every communication has a limit and a way through...
      </button>
    </div>
  );
};

export default ConnectPhase;
