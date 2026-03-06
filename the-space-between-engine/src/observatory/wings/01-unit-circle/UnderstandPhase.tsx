// Wing 1 — Understand Phase: "The Language of the Circle"
// NOW formal mathematics via KaTeX. Each equation maps to something already touched.
// Tone: "Remember how moving that point changed the height? That height has a name."
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
        <h2>The Language of the Circle</h2>

        <section className="understand__section">
          <p className="understand__bridge">
            Remember how dragging the point changed the height? That height has
            a name. It is called <strong>sine</strong>.
          </p>
          <p>
            At any angle <Latex math="\theta" />, the height of the point on
            the unit circle is:
          </p>
          <div className="understand__equation">
            <Latex math="\text{height} = \sin(\theta)" display />
          </div>
        </section>

        <section className="understand__section">
          <p className="understand__bridge">
            And the side position — the horizontal shadow you watched slide
            left and right — that is <strong>cosine</strong>.
          </p>
          <div className="understand__equation">
            <Latex math="\text{side position} = \cos(\theta)" display />
          </div>
        </section>

        <section className="understand__section">
          <p className="understand__bridge">
            You noticed that when the height was at its peak, the side position
            was zero. When the side was at its extreme, the height was zero.
            They are always out of step — yet they come from the same point on
            the same circle. This leads to something remarkable:
          </p>
          <div className="understand__equation">
            <Latex math="\sin^2(\theta) + \cos^2(\theta) = 1" display />
          </div>
          <p>
            This is the <strong>Pythagorean identity</strong>. It holds because
            the point never leaves the circle. The radius is always 1. The
            square of the height plus the square of the side position is always
            the square of the radius. Always.
          </p>
        </section>

        <section className="understand__section">
          <p className="understand__bridge">
            Remember the slope you toggled on — the line that shot upward or
            downward as the point approached the top or bottom? That is{' '}
            <strong>tangent</strong>. It measures the steepness of the radius
            line.
          </p>
          <div className="understand__equation">
            <Latex math="\tan(\theta) = \frac{\sin(\theta)}{\cos(\theta)}" display />
          </div>
          <p>
            When cosine is zero — when the point is directly above or below the
            center — tangent is undefined. The slope goes vertical. You may have
            seen the value flicker or read "undefined" when you dragged the
            point to those positions. Now you know why.
          </p>
        </section>

        <section className="understand__section">
          <h3>The unit circle as a coordinate system</h3>
          <p>
            Every point on the unit circle can be written as a pair of
            coordinates:
          </p>
          <div className="understand__equation">
            <Latex math="(\cos\theta,\;\sin\theta)" display />
          </div>
          <p>
            One angle in, two coordinates out. The entire circle — every
            possible angle from <Latex math="0" /> to{' '}
            <Latex math="2\pi" /> — maps to every point on the edge of a
            circle of radius 1. This is why it is called the <em>unit</em>{' '}
            circle: the radius is one unit. No more, no less.
          </p>
        </section>

        <section className="understand__section">
          <h3>Euler's formula: the deepest connection</h3>
          <p>
            There is a way to write the unit circle point using a single
            expression, one of the most beautiful in all of mathematics:
          </p>
          <div className="understand__equation">
            <Latex math="e^{i\theta} = \cos\theta + i\sin\theta" display />
          </div>
          <p>
            This says that the exponential function, when given an imaginary
            angle, traces the unit circle. The real part is cosine. The
            imaginary part is sine. It is the algebraic way of saying what you
            already felt: separate things that are actually one thing, seen from
            different positions.
          </p>
        </section>

        <section className="understand__section understand__section--code">
          <h3>In code</h3>
          <pre className="understand__code">
{`// The unit circle: one angle, two coordinates
function unitCirclePoint(theta: number) {
  return {
    x: Math.cos(theta),  // side position
    y: Math.sin(theta),  // height
  };
}

// The Pythagorean identity — always true
const theta = Math.PI / 3; // any angle
const x = Math.cos(theta);
const y = Math.sin(theta);
console.log(x * x + y * y); // 1.0000000000000002`}
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
