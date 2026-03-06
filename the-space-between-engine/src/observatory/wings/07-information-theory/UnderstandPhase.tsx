// Wing 7 — Understand Phase: "Shannon's Fundamental Theorem"
// NOW formal mathematics via KaTeX.
// Each equation maps to something the learner already touched.
// "Remember the cliff? That cliff has a name. It is the channel capacity."
// Completion: scroll all content OR >= 2min.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';
import katex from 'katex';

interface UnderstandPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

function renderLatex(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false });
}

interface MathBlock {
  memory: string;
  name: string;
  latex: string;
  explanation: string;
}

const MATH_BLOCKS: MathBlock[] = [
  {
    memory: 'Remember how the rare symbol appeared with a bigger circle? Its size was its surprise. That surprise has a precise measure.',
    name: 'Self-information (surprise)',
    latex: 'I(x) = -\\log_2 p(x)',
    explanation: 'The surprise of an event is the negative logarithm of its probability. A fair coin flip (probability 0.5) carries 1 bit of surprise. An event with probability 0.01 carries about 6.6 bits. The less likely the event, the more information it carries.',
  },
  {
    memory: 'Remember the "average surprise" number that changed when you switched distributions? That is entropy.',
    name: 'Shannon entropy',
    latex: 'H(X) = -\\sum_{x \\in \\mathcal{X}} p(x) \\log_2 p(x)',
    explanation: 'Entropy is the average surprise across all possible symbols, weighted by how often each appears. Uniform distributions have maximum entropy — you cannot predict what comes next. Extreme distributions have low entropy — the source is predictable.',
  },
  {
    memory: 'Remember the cliff — the noise level where the message stopped surviving? That cliff is real. It has a number.',
    name: 'Channel capacity',
    latex: 'C = \\max_{p(x)} I(X; Y)',
    explanation: 'Channel capacity is the maximum rate at which information can be reliably transmitted. It depends on the channel, not on what you are trying to say. No amount of clever encoding can exceed it.',
  },
  {
    memory: 'Remember the golden dashed line on the accuracy bar? That was the Shannon limit.',
    name: 'Shannon\'s noisy channel coding theorem',
    latex: 'R < C \\implies \\exists \\text{ encoding with } P_e \\to 0',
    explanation: 'Shannon proved: if your transmission rate R is below the channel capacity C, there exists an encoding that makes errors as rare as you want. If R exceeds C, errors are inevitable. The cliff is sharp. Below it: perfect transmission is possible. Above it: it is not.',
  },
  {
    memory: 'Remember how adding redundancy (error correction) pushed the cliff further out? That is what good coding does.',
    name: 'Shannon-Hartley theorem',
    latex: 'C = B \\log_2\\left(1 + \\frac{S}{N}\\right)',
    explanation: 'For a continuous channel with bandwidth B, signal power S, and noise power N, the capacity is this precise formula. More bandwidth or more signal power means more capacity. But the relationship is logarithmic — doubling the signal does not double the capacity.',
  },
];

export function UnderstandPhase({
  onComplete,
}: UnderstandPhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [completed, setCompleted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (completed) return;
    if (timeSpent >= 120 || hasScrolledToEnd) {
      setCompleted(true);
    }
  }, [timeSpent, hasScrolledToEnd, completed]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setHasScrolledToEnd(true);
    }
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('understand');
  }, [onComplete]);

  return (
    <div className="phase phase--understand">
      <div className="understand__content" ref={contentRef} onScroll={handleScroll}>
        <h2 className="understand__title">Shannon&rsquo;s Fundamental Theorem</h2>

        <p className="understand__intro">
          You felt the cliff. You watched messages die when the noise crossed a
          threshold. Now we give that threshold a name and a number. Claude Shannon
          proved in 1948 that every channel has an absolute limit — and that this
          limit can be approached but never exceeded.
        </p>

        {MATH_BLOCKS.map((block, index) => (
          <div key={index} className="understand__block">
            <p className="understand__memory">{block.memory}</p>
            <h3 className="understand__concept-name">{block.name}</h3>
            <div
              className="understand__latex"
              dangerouslySetInnerHTML={{ __html: renderLatex(block.latex) }}
            />
            <p className="understand__explanation">{block.explanation}</p>
          </div>
        ))}

        <div className="understand__coda">
          <p>
            This is not a practical limitation that better technology can overcome.
            It is a law of mathematics, as absolute as the Pythagorean theorem.
            The channel does not care who is sending the message or how important
            it is. It has a capacity, and that capacity is finite.
          </p>
          <p>
            Every text message you send, every photo you share, every word you speak
            across a noisy room — all of it is constrained by these laws. The bird
            singing outside your window obeys them. The DNA copying in your cells
            obeys them. The universe is an information-theoretic system, and these
            are its rules.
          </p>
        </div>

        <div className="understand__code-example">
          <h3>In code</h3>
          <pre className="understand__code">
{`// Compute entropy of a probability distribution
function entropy(probs: number[]): number {
  return -probs
    .filter(p => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);
}

// Fair coin: maximum entropy for 2 symbols
entropy([0.5, 0.5]);  // 1.0 bit

// Biased coin: less surprise, less entropy
entropy([0.9, 0.1]);  // 0.469 bits

// The more predictable, the less information per symbol`}
          </pre>
        </div>
      </div>

      {completed && (
        <div className="understand__continue">
          <button className="phase__continue-btn" onClick={handleContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
