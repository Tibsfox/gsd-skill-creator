// Wing 8 — Understand Phase: "Formal Grammars"
// NOW formal mathematics via KaTeX.
// Each equation maps to something the learner already touched.
// "Remember the rules you wrote? They have a name. They are production rules in a formal grammar."
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
    memory: 'Remember the seed you typed into the axiom box? That starting string is the mathematical axiom of the grammar.',
    name: 'L-System definition',
    latex: 'G = (V,\\; \\omega,\\; P)',
    explanation: 'An L-System is defined by three things: V is the alphabet (all the symbols you can use), omega is the axiom (the seed string you start with), and P is the set of production rules (how each symbol gets replaced).',
  },
  {
    memory: 'Remember writing "F=FF+[+F-F-F]-[-F+F+F]"? That is a production rule. It says: wherever you see F, replace it with this longer string.',
    name: 'Production rule',
    latex: 'P: V \\to V^* \\qquad F \\to FF+[+F\\text{-}F\\text{-}F]\\text{-}[\\text{-}F+F+F]',
    explanation: 'A production rule maps a single symbol to a string of symbols. The asterisk on V means "zero or more symbols from V." Each rule is a replacement instruction. When you iterate, every matching symbol is replaced simultaneously.',
  },
  {
    memory: 'Remember how the string grew explosively with each iteration? That is parallel rewriting — every symbol is replaced at once.',
    name: 'Parallel rewriting',
    latex: '\\omega \\xrightarrow{P} s_1 \\xrightarrow{P} s_2 \\xrightarrow{P} \\cdots \\xrightarrow{P} s_n',
    explanation: 'Unlike sequential grammars (like programming languages), L-Systems apply ALL rules simultaneously at each step. Every F becomes the replacement at the same time. This models biology: every cell in a growing organism divides simultaneously, not one at a time.',
  },
  {
    memory: 'Remember the turtle that interpreted the string? F meant "draw forward," + and - meant "turn," and brackets meant "save and restore position."',
    name: 'Turtle interpretation',
    latex: 'F \\Rightarrow \\text{draw}(\\ell) \\qquad + \\Rightarrow \\text{turn}(+\\delta) \\qquad [ \\Rightarrow \\text{push} \\qquad ] \\Rightarrow \\text{pop}',
    explanation: 'The generated string is interpreted by a turtle that walks and draws. F draws a line of length l. Plus turns right by angle delta. Minus turns left. Square brackets save and restore position. This interpretation maps an abstract string to a visible shape.',
  },
  {
    memory: 'Remember how the branching angle came from the slider? That angle lives on the unit circle. L-Systems and the unit circle connect here.',
    name: 'The angle connection',
    latex: '\\text{heading} = \\theta + n \\cdot \\delta \\quad \\text{where } \\delta \\in [0, 2\\pi)',
    explanation: 'Every turn in an L-System is an angle added to the turtle\'s heading. That heading is an angle on the unit circle. The branching patterns of every tree, fern, and snowflake you grew are shapes traced by a point moving on the unit circle. Growth loops back to the beginning.',
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
        <h2 className="understand__title">Formal Grammars</h2>

        <p className="understand__intro">
          You wrote rules and watched complexity emerge. Now we name the mathematics.
          L-Systems are formal grammars — the same mathematics that describes
          programming languages, natural language, and biological development. What
          you built in the touch phase was not a toy. It was a formal grammar, and
          formal grammars are one of the deepest ideas in computer science.
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
            Aristid Lindenmayer invented L-Systems in 1968 to model the growth of
            algae. He discovered that the same formalism that produces branching
            plants also produces space-filling curves, fractal coastlines, and
            the patterns of cell division. Simple rules, applied in parallel,
            produce structures far more complex than the rules themselves.
          </p>
          <p>
            You started this observatory with a circle. You end it with a seed.
            Both are small. Both are complete. Both generate more than they
            seem to contain. The circle and the seed are the same idea.
          </p>
        </div>

        <div className="understand__code-example">
          <h3>In code</h3>
          <pre className="understand__code">
{`// L-System engine — parallel rewriting
function iterate(
  axiom: string,
  rules: Record<string, string>,
  n: number
): string {
  let current = axiom;
  for (let i = 0; i < n; i++) {
    current = [...current]
      .map(ch => rules[ch] ?? ch)
      .join('');
  }
  return current;
}

// Koch snowflake
iterate('F--F--F', { F: 'F+F--F+F' }, 3);
// A string that, when drawn by a turtle, produces a snowflake`}
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
