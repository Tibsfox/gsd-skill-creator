// Wing 3 — Understand Phase: "Waves Have Names"
// Formal mathematics via KaTeX. Fourier decomposition, wave equations.
// Completion: scroll all content OR >= 2min.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import katex from 'katex';
import type { FoundationId, PhaseType, LearnerState } from '@/types/index';

interface UnderstandPhaseProps {
  foundationId: FoundationId;
  learnerState: LearnerState;
  onComplete: (phase: PhaseType) => void;
  onNavigateFoundation: (id: FoundationId) => void;
}

function Latex({ math, display = false }: { math: string; display?: boolean }): React.JSX.Element {
  const html = katex.renderToString(math, {
    throwOnError: false,
    displayMode: display,
  });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function UnderstandPhase({
  onComplete,
}: UnderstandPhaseProps): React.JSX.Element {
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasScrolledAll, setHasScrolledAll] = useState(false);
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
    if (timeSpent >= 120 || hasScrolledAll) {
      setCompleted(true);
    }
  }, [timeSpent, hasScrolledAll, completed]);

  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setHasScrolledAll(true);
    }
  }, []);

  const handleContinue = useCallback(() => {
    onComplete('understand');
  }, [onComplete]);

  return (
    <div className="phase phase--understand">
      <div
        className="understand__content"
        ref={contentRef}
        onScroll={handleScroll}
      >
        <h2>Waves Have Names</h2>

        <section className="understand__section">
          <p className="understand__bridge">
            Remember the wave you watched unroll from the circle? And how you
            changed its speed, height, and shift? Each of those properties has
            a precise mathematical name.
          </p>
          <p>
            A sine wave is fully described by three numbers:
          </p>
          <div className="understand__equation">
            <Latex math="y(t) = A \sin(2\pi f t + \varphi)" display />
          </div>
          <p>
            where <Latex math="A" /> is the <strong>amplitude</strong> (the
            height you adjusted), <Latex math="f" /> is the{' '}
            <strong>frequency</strong> (the speed of oscillation), and{' '}
            <Latex math="\varphi" /> is the <strong>phase</strong> (the shift
            that slides the wave forward or backward).
          </p>
        </section>

        <section className="understand__section">
          <h3>The wave as a shadow of rotation</h3>
          <p className="understand__bridge">
            You saw this in the See phase: the sine wave IS a circle viewed
            from the side. As the angle <Latex math="\theta" /> increases
            steadily with time, the height traces a wave.
          </p>
          <div className="understand__equation">
            <Latex math="\theta(t) = 2\pi f t + \varphi" display />
          </div>
          <p>
            The angle grows linearly with time. The sine of a linearly
            increasing angle produces an oscillation. This is why trigonometry
            and the unit circle are the same mathematics: the wave is the
            circle in motion.
          </p>
        </section>

        <section className="understand__section">
          <h3>Combining waves: superposition</h3>
          <p className="understand__bridge">
            When you layered a second wave, you saw interference — the two
            waves adding together, sometimes reinforcing, sometimes cancelling.
            This is called <strong>superposition</strong>:
          </p>
          <div className="understand__equation">
            <Latex
              math="y(t) = A_1 \sin(2\pi f_1 t) + A_2 \sin(2\pi f_2 t)"
              display
            />
          </div>
          <p>
            The combined wave is simply the sum of the individual waves at every
            point in time. This principle governs everything from ocean waves to
            radio signals to the chords in music.
          </p>
        </section>

        <section className="understand__section">
          <h3>Fourier's revelation</h3>
          <p>
            Joseph Fourier discovered that <em>any</em> periodic signal — any
            shape that repeats — can be decomposed into a sum of sine waves
            of different frequencies:
          </p>
          <div className="understand__equation">
            <Latex
              math="f(t) = \frac{a_0}{2} + \sum_{n=1}^{\infty} \left[ a_n \cos(2\pi n t) + b_n \sin(2\pi n t) \right]"
              display
            />
          </div>
          <p>
            A square wave is an infinite sum of sine waves. A sawtooth wave is
            an infinite sum of sine waves. Your voice, as you speak, is a
            sum of sine waves. The decomposition is unique — there is exactly
            one set of frequencies and amplitudes that produces any given shape.
          </p>
        </section>

        <section className="understand__section">
          <h3>The tidal model</h3>
          <p className="understand__bridge">
            Remember the tide in the Wonder phase? The M2 tidal constituent —
            the primary lunar tide — follows this exact form:
          </p>
          <div className="understand__equation">
            <Latex
              math="h(t) = A \cos\left(\frac{2\pi}{12.42}\, t + \varphi\right)"
              display
            />
          </div>
          <p>
            The period is 12.42 hours — half a lunar day. The amplitude{' '}
            <Latex math="A" /> depends on geography. The phase{' '}
            <Latex math="\varphi" /> depends on the moon's position. Add the
            solar constituent at 12.00 hours and you get spring tides and neap
            tides — two frequencies beating against each other.
          </p>
        </section>

        <section className="understand__section understand__section--code">
          <h3>In code</h3>
          <pre className="understand__code">
{`// A single sine wave: amplitude, frequency, phase
function sineWave(t: number, A: number, f: number, phi: number): number {
  return A * Math.sin(2 * Math.PI * f * t + phi);
}

// Superposition: combine any number of waves
function combined(t: number, waves: Array<{ A: number; f: number; phi: number }>): number {
  return waves.reduce((sum, w) => sum + sineWave(t, w.A, w.f, w.phi), 0);
}

// M2 tidal constituent
function tide(t: number, amplitude: number, moonPhase: number): number {
  return amplitude * Math.cos(2 * Math.PI / 12.42 * t + moonPhase);
}`}
          </pre>
        </section>
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
