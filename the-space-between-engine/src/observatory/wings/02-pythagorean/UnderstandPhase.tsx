// Wing 2 — Understand Phase: "The Theorem with a Thousand Proofs"
// Formal mathematics via KaTeX. Connects to what was already touched.
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
        <h2>The Theorem with a Thousand Proofs</h2>

        <section className="understand__section">
          <p className="understand__bridge">
            Remember sliding the two sliders and watching the distance change?
            That relationship — the one that never negotiates — has a name. It
            is the oldest named theorem in mathematics.
          </p>
          <div className="understand__equation">
            <Latex math="a^2 + b^2 = c^2" display />
          </div>
          <p>
            The square of the horizontal side plus the square of the vertical
            side equals the square of the straight-line distance. It was true
            for every pair of values you tried. It is true for every pair of
            values anyone has ever tried or will ever try.
          </p>
        </section>

        <section className="understand__section">
          <p className="understand__bridge">
            You also saw the visual proof: the squares growing on each side of
            the triangle, the two smaller areas summing exactly to the larger.
            That is the geometric meaning. The area of the square built on the
            hypotenuse equals the combined areas of the squares built on the
            two legs.
          </p>
          <div className="understand__equation">
            <Latex math="\text{Area}_c = \text{Area}_a + \text{Area}_b" display />
          </div>
        </section>

        <section className="understand__section">
          <h3>Distance in 2D</h3>
          <p>
            The theorem directly gives us a formula for the distance between
            any two points in a flat plane. If one point is at{' '}
            <Latex math="(x_1, y_1)" /> and the other at{' '}
            <Latex math="(x_2, y_2)" />, the distance between them is:
          </p>
          <div className="understand__equation">
            <Latex
              math="d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}"
              display
            />
          </div>
          <p>
            This is the Pythagorean theorem in disguise. The horizontal
            difference is side <Latex math="a" />. The vertical difference is
            side <Latex math="b" />. The distance is side{' '}
            <Latex math="c" />.
          </p>
        </section>

        <section className="understand__section">
          <h3>Distance in 3D and beyond</h3>
          <p className="understand__bridge">
            When you clicked "Extend to 3D," the theorem still worked. It
            generalizes perfectly. In three dimensions:
          </p>
          <div className="understand__equation">
            <Latex math="d = \sqrt{a^2 + b^2 + z^2}" display />
          </div>
          <p>And in <Latex math="n" /> dimensions:</p>
          <div className="understand__equation">
            <Latex
              math="d = \sqrt{x_1^2 + x_2^2 + \cdots + x_n^2} = \sqrt{\sum_{i=1}^{n} x_i^2}"
              display
            />
          </div>
          <p>
            The same stubbornness, the same refusal to negotiate, extended to
            any number of perpendicular directions. The theorem does not care
            how many dimensions you add. It holds in four dimensions, in ten,
            in a thousand. The relationship between perpendicular components and
            the diagonal distance is invariant.
          </p>
        </section>

        <section className="understand__section">
          <h3>The connection to the unit circle</h3>
          <p>
            On the unit circle, the radius is always 1. The height is{' '}
            <Latex math="\sin\theta" /> and the side position is{' '}
            <Latex math="\cos\theta" />. The Pythagorean theorem applied to
            this right triangle gives:
          </p>
          <div className="understand__equation">
            <Latex math="\cos^2\theta + \sin^2\theta = 1^2 = 1" display />
          </div>
          <p>
            The Pythagorean identity you met in Wing 1 is the Pythagorean
            theorem, specialized to a circle of radius one.
          </p>
        </section>

        <section className="understand__section understand__section--code">
          <h3>In code</h3>
          <pre className="understand__code">
{`// Pythagorean distance — works in any number of dimensions
function distance(...components: number[]): number {
  const sumOfSquares = components.reduce(
    (sum, x) => sum + x * x, 0
  );
  return Math.sqrt(sumOfSquares);
}

// 2D: a=3, b=4 → c=5
distance(3, 4); // 5

// 3D: a=1, b=2, z=2 → c=3
distance(1, 2, 2); // 3

// nD: extends naturally
distance(1, 1, 1, 1); // 2`}
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
