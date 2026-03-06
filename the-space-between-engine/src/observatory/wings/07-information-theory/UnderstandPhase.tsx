/**
 * Wing 7: Information Theory — Understand Phase
 * "The Channel"
 *
 * Entropy, channel capacity, Shannon's theorem. Formal math OK.
 */

import React from 'react';
import type { FoundationPhase } from '../../../types/index.js';

export interface UnderstandPhaseProps {
  phase: FoundationPhase;
  onComplete: () => void;
}

export const UnderstandPhase: React.FC<UnderstandPhaseProps> = ({ phase, onComplete }) => {
  return (
    <div className="wing-phase understand-phase information-theory-understand">
      <h2>{phase.title}</h2>

      <div className="understand-narrative">
        <p>{phase.narrativeIntro}</p>
      </div>

      <div className="understand-content">
        <section className="concept-block">
          <h3>Entropy — The Measure of Surprise</h3>
          <p>
            Shannon entropy measures the average amount of surprise in a message
            source. A fair coin has maximum entropy for a binary source — you
            genuinely do not know what comes next. A loaded coin (99% heads) has
            low entropy — the outcome is almost always predictable. Entropy is
            measured in bits: the number of yes/no questions you need to ask to
            learn the outcome.
          </p>
          <div className="math-notation">
            <code>H(X) = -sum over x of P(x) * log2(P(x))</code>
            <br />
            <code>For a fair coin: H = -[0.5 * log2(0.5) + 0.5 * log2(0.5)] = 1 bit</code>
            <br />
            <code>Maximum entropy = log2(n) for n equally likely outcomes</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Channel Capacity — Shannon's Limit</h3>
          <p>
            Every noisy channel has a maximum rate at which information can be
            transmitted with arbitrarily low probability of error. This rate,
            measured in bits per channel use, is the channel capacity. Shannon
            proved that you can transmit at any rate below capacity with
            vanishingly small error, but you cannot transmit above capacity
            without errors. This is a hard, mathematical law — not an engineering
            limitation but a law of nature.
          </p>
          <div className="math-notation">
            <code>C = max over P(x) of I(X; Y)</code>
            <br />
            <code>where I(X; Y) = H(X) - H(X|Y) is the mutual information</code>
            <br />
            <code>For a binary symmetric channel with error probability p:</code>
            <br />
            <code>C = 1 - H(p) = 1 + p*log2(p) + (1-p)*log2(1-p)</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Compression — Lossless vs. Lossy</h3>
          <p>
            Lossless compression preserves every bit of information — ZIP files,
            PNG images, FLAC audio. The minimum possible size for lossless
            compression is the entropy of the source. You cannot compress below
            entropy without losing information. Lossy compression (JPEG, MP3)
            sacrifices information the receiver is unlikely to notice, achieving
            much smaller sizes at the cost of perfect fidelity.
          </p>
          <div className="math-notation">
            <code>{'Lossless: compressed size >= H(source) (Shannon\'s source coding theorem)'}</code>
            <br />
            <code>Lossy: rate-distortion theory determines the tradeoff</code>
            <br />
            <code>R(D) = min over P(x-hat|x) of I(X; X-hat) subject to E[d(X, X-hat)] &lt;= D</code>
          </div>
        </section>

        <section className="concept-block">
          <h3>Error Correction — Fighting Noise</h3>
          <p>
            Error-correcting codes add redundancy to a message so that the
            decoder can detect and fix errors introduced by the channel.
            Hamming codes can correct single-bit errors. Reed-Solomon codes
            protect CDs and QR codes. Turbo codes and LDPC codes approach
            Shannon's limit in practice. The trade: redundancy costs bandwidth,
            but buys reliability.
          </p>
          <div className="math-notation">
            <code>Hamming distance d(x, y) = number of positions where x and y differ</code>
            <br />
            <code>A code with minimum distance d can correct floor((d-1)/2) errors</code>
          </div>
        </section>

        {phase.content.mathNotation && (
          <section className="formal-notation">
            <h3>Formal Notation</h3>
            <pre className="math-display">{phase.content.mathNotation}</pre>
          </section>
        )}

        <div className="understand-text">
          <p>{phase.content.text}</p>
        </div>
      </div>

      <button className="phase-continue" onClick={onComplete}>
        Information has fundamental limits...
      </button>
    </div>
  );
};

export default UnderstandPhase;
