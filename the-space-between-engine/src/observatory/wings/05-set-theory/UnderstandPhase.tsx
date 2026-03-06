// Wing 5 — Understand Phase: "The Algebra of Sets"
// NOW formal mathematics arrives via KaTeX.
// Each equation maps to something the learner already touched.
// Tone: "Remember dragging 'breath' into both circles? That overlap has a name."
// Formalism arrives like naming a friend.
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
    memory: 'Remember how you dragged words into the "body" circle? Everything inside that circle is a set.',
    name: 'Set',
    latex: 'A = \\{x : x \\text{ belongs to body}\\}',
    explanation: 'A set is a collection of things defined by a rule. Your body circle was a set. The rule was: "Does this belong to the body?"',
  },
  {
    memory: 'Remember dragging "breath" into the overlap? It belonged to both circles at once.',
    name: 'Intersection',
    latex: 'A \\cap B = \\{x : x \\in A \\text{ and } x \\in B\\}',
    explanation: 'The intersection is the overlap. Things that belong to both sets. "Breath" is in the body set AND the mind set. It lives in the intersection.',
  },
  {
    memory: 'Remember pressing "Everything in either"? The whole colored region lit up.',
    name: 'Union',
    latex: 'A \\cup B = \\{x : x \\in A \\text{ or } x \\in B\\}',
    explanation: 'The union is everything in either set, including the overlap. If it is in body OR mind (or both), it is in the union.',
  },
  {
    memory: 'Remember pressing "Body only"? Only the left crescent stayed bright.',
    name: 'Difference',
    latex: 'A \\setminus B = \\{x : x \\in A \\text{ and } x \\notin B\\}',
    explanation: 'The difference is everything in one set that is NOT in the other. The part of body that does not overlap with mind.',
  },
  {
    memory: 'Remember the elements outside both circles? They belonged to nothing you named.',
    name: 'Complement',
    latex: '\\overline{A} = \\{x : x \\notin A\\}',
    explanation: 'The complement is everything NOT in the set. Every unclaimed word sat in the complement of both circles.',
  },
  {
    memory: 'There is a law hiding in what you built. When you took the complement of the union, it was the same as the intersection of the complements.',
    name: 'De Morgan\'s Law',
    latex: '\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}',
    explanation: 'Not-in-either is the same as not-in-A AND not-in-B. This is De Morgan\'s law. It connects set operations to logic. You already felt it when the unclaimed words were outside both circles.',
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
        <h2 className="understand__title">The Algebra of Sets</h2>

        <p className="understand__intro">
          You have felt all of this. You dragged words into circles and watched
          boundaries form. Now we give names to what you already know. Formalism
          is not a new thing to learn. It is a language for what you have already touched.
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
            Set theory sits beneath all of mathematics. Numbers are sets. Functions
            are sets of ordered pairs. The unit circle is a set of points satisfying
          </p>
          <div
            className="understand__latex"
            dangerouslySetInnerHTML={{ __html: renderLatex('\\{(x, y) : x^2 + y^2 = 1\\}') }}
          />
          <p>
            Every boundary you drew in the touch phase was an act of set theory.
            Every time you sorted the world — this is food, that is not; this person
            is a friend, that person is a stranger — you were doing set theory.
            You have been doing this your whole life. Now it has a name.
          </p>
        </div>

        <div className="understand__code-example">
          <h3>In code</h3>
          <pre className="understand__code">
{`// Set operations in TypeScript
function union<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a, ...b]);
}
function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter(x => b.has(x)));
}
function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter(x => !b.has(x)));
}`}
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
