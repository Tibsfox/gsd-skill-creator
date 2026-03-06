// Wing 4 — Understand Phase: "The Language of Fields"
// Formal mathematics via KaTeX: gradient, divergence, curl.
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
        <h2>The Language of Fields</h2>

        <section className="understand__section">
          <p className="understand__bridge">
            Remember the vector field you explored — arrows at every point in
            space, particles following invisible instructions? That field has a
            precise mathematical definition.
          </p>
          <p>
            A <strong>vector field</strong> is a function that assigns a vector
            (a direction and a magnitude) to every point in space:
          </p>
          <div className="understand__equation">
            <Latex
              math="\mathbf{F}(x, y) = \begin{pmatrix} F_x(x,y) \\ F_y(x,y) \end{pmatrix}"
              display
            />
          </div>
          <p>
            At every point <Latex math="(x, y)" />, the field tells you: go
            this way, this strongly. The particles obeyed this instruction.
          </p>
        </section>

        <section className="understand__section">
          <h3>Gradient: the steepest climb</h3>
          <p className="understand__bridge">
            When you toggled the "gradient" overlay, you saw how field strength
            varies across space — brighter where the field is stronger. The
            gradient of a scalar field (like temperature or pressure) points in
            the direction of steepest increase:
          </p>
          <div className="understand__equation">
            <Latex
              math="\nabla f = \begin{pmatrix} \frac{\partial f}{\partial x} \\ \frac{\partial f}{\partial y} \end{pmatrix}"
              display
            />
          </div>
          <p>
            Wind blows from high pressure to low pressure. Heat flows from hot
            to cold. Water runs downhill. All of these follow the negative
            gradient — the direction of steepest descent.
          </p>
        </section>

        <section className="understand__section">
          <h3>Divergence: sources and sinks</h3>
          <p className="understand__bridge">
            When you toggled "divergence," you saw regions where the field
            spreads outward (positive divergence, shown in blue) and regions
            where it converges (negative divergence). Divergence measures
            whether a point is a source or a sink:
          </p>
          <div className="understand__equation">
            <Latex
              math="\nabla \cdot \mathbf{F} = \frac{\partial F_x}{\partial x} + \frac{\partial F_y}{\partial y}"
              display
            />
          </div>
          <p>
            Positive divergence: more is flowing out than in — a source. The
            radial field you explored has positive divergence everywhere.
            Negative divergence: more flows in than out — a sink. The sink
            field converges at the origin.
          </p>
        </section>

        <section className="understand__section">
          <h3>Curl: rotation</h3>
          <p className="understand__bridge">
            When you toggled "curl," you saw the rotational component of the
            field. The vortex field has strong curl everywhere — it makes things
            spin. Curl measures the tendency of the field to induce rotation:
          </p>
          <div className="understand__equation">
            <Latex
              math="\nabla \times \mathbf{F} = \frac{\partial F_y}{\partial x} - \frac{\partial F_x}{\partial y}"
              display
            />
          </div>
          <p>
            In 2D, curl is a scalar (positive = counter-clockwise, negative =
            clockwise). In 3D, curl is a vector pointing along the axis of
            rotation. The vortex field has constant positive curl. The radial
            field has zero curl — it spreads without spinning.
          </p>
        </section>

        <section className="understand__section">
          <h3>The fox and the field</h3>
          <p>
            The fox in the Wonder phase was navigating a magnetic dipole field.
            The magnetic field of a dipole in 2D:
          </p>
          <div className="understand__equation">
            <Latex
              math="B_x = \frac{3mxy}{r^5}, \quad B_y = \frac{m(3y^2 - r^2)}{r^5}"
              display
            />
          </div>
          <p>
            where <Latex math="m" /> is the dipole moment, and{' '}
            <Latex math="r = \sqrt{x^2 + y^2}" />. The field has zero
            divergence everywhere (no magnetic monopoles) and the fox follows
            the field lines — curves tangent to the field at every point.
          </p>
        </section>

        <section className="understand__section understand__section--code">
          <h3>In code</h3>
          <pre className="understand__code">
{`// A vector field: function from (x,y) to [Fx, Fy]
type VectorField = (x: number, y: number) => [number, number];

// Vortex field
const vortex: VectorField = (x, y) => {
  const r = Math.sqrt(x * x + y * y) || 0.01;
  return [-y / r, x / r];
};

// Numerical divergence
function divergence(F: VectorField, x: number, y: number, eps = 0.01): number {
  const [dxp] = F(x + eps, y);
  const [dxm] = F(x - eps, y);
  const [, dyp] = F(x, y + eps);
  const [, dym] = F(x, y - eps);
  return (dxp - dxm) / (2 * eps) + (dyp - dym) / (2 * eps);
}

// Numerical curl (2D → scalar)
function curl(F: VectorField, x: number, y: number, eps = 0.01): number {
  const [, fyp] = F(x + eps, y);
  const [, fym] = F(x - eps, y);
  const [fxp] = F(x, y + eps);
  const [fxm] = F(x, y - eps);
  return (fyp - fym) / (2 * eps) - (fxp - fxm) / (2 * eps);
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
