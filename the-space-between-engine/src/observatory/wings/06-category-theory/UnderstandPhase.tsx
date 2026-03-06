// Wing 6 — Understand Phase: "Functors — Maps Between Worlds"
// NOW formal mathematics via KaTeX.
// Each equation maps to something the learner already touched.
// "Remember dragging cooking to chemistry? That mapping has a name. It is called a functor."
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
    memory: 'Remember the dots and arrows? Each dot was an object. Each arrow was a transformation. Together they formed a pattern.',
    name: 'Category',
    latex: '\\mathcal{C} = (\\text{Ob}(\\mathcal{C}),\\; \\text{Hom}(\\mathcal{C}),\\; \\circ)',
    explanation: 'A category is a collection of objects, a collection of morphisms (arrows) between them, and a composition rule. If you can go from A to B and from B to C, you can go from A to C. That is composition.',
  },
  {
    memory: 'Remember how every dot had a tiny loop arrow back to itself? That is the identity.',
    name: 'Identity morphism',
    latex: '\\text{id}_A : A \\to A \\quad\\text{for every object } A',
    explanation: 'Every object has an identity arrow: the "do nothing" transformation. It is the arrow that says "A stays A." Composing any arrow with the identity leaves it unchanged.',
  },
  {
    memory: 'Remember dragging arrows from Cooking to Chemistry and the system checking if your mapping preserved the structure? That check is the functor law.',
    name: 'Functor',
    latex: 'F: \\mathcal{C} \\to \\mathcal{D} \\qquad F(g \\circ f) = F(g) \\circ F(f)',
    explanation: 'A functor maps one category to another while preserving composition. If "mix then heat" composes to "cook" in the kitchen, then the functor must map "combine then react" to "synthesize" in chemistry. The structure survives the translation.',
  },
  {
    memory: 'Remember when your mapping turned green? It meant the relationships were preserved. That is the functor condition.',
    name: 'Preservation of identity',
    latex: 'F(\\text{id}_A) = \\text{id}_{F(A)}',
    explanation: 'A functor must also map the identity of each object to the identity of its image. "Doing nothing" in the source must map to "doing nothing" in the target.',
  },
  {
    memory: 'The caterpillar dissolved into soup and became a butterfly. The DNA was the same. That transformation between developmental programs is a natural transformation.',
    name: 'Natural transformation',
    latex: '\\eta: F \\Rightarrow G \\qquad \\eta_B \\circ F(f) = G(f) \\circ \\eta_A',
    explanation: 'A natural transformation connects two functors. Both functors map the same source to the same target, but they do it differently. The natural transformation says: the two translations are coherently related. The caterpillar program and the butterfly program are two functors from genes to body, connected by metamorphosis.',
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
        <h2 className="understand__title">Functors — Maps Between Worlds</h2>

        <p className="understand__intro">
          You built mappings between domains and felt when the structure was preserved.
          Now we name the pieces. A category is dots and arrows with a composition rule.
          A functor is a mapping between categories that preserves the arrows.
          None of this is new to you. You already did it. Now it gets a name.
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
            Category theory does not care what things are made of. It cares about
            how they relate. This is the deepest kind of mathematics: the study of
            structure itself, stripped of all content. When you noticed that the arrow
            pattern was the same in shapes and colors and notes — that recognition
            was category theory.
          </p>
        </div>

        <div className="understand__code-example">
          <h3>In code</h3>
          <pre className="understand__code">
{`// Array.map IS a functor
// It maps types to types: number[] -> string[]
// It maps functions to functions: (n => n.toString()) -> array.map(n => n.toString())
// And it preserves composition:
const double = (n: number) => n * 2;
const toString = (n: number) => n.toString();

// These are equivalent (composition preserved):
[1, 2, 3].map(double).map(toString);
[1, 2, 3].map(n => toString(double(n)));
// Both give: ["2", "4", "6"]`}
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
