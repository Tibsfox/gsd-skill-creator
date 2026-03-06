/**
 * Wing 4: Vector Calculus — Understand Phase
 *
 * Gradient, divergence, curl. Nabla operator. Field equations.
 */

import React, { useState } from 'react';

export interface UnderstandPhaseProps {
  onComplete: () => void;
}

export const UnderstandPhase: React.FC<UnderstandPhaseProps> = ({ onComplete }) => {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="phase understand-phase">
      <h2>Understanding Fields</h2>

      <p className="narrative-intro">
        You have painted fields and watched particles follow them. You have seen divergence
        and curl revealed as color overlays. Now we name the operators that describe what
        fields do.
      </p>

      <div className="formal-definitions" style={{ fontFamily: 'monospace', lineHeight: 2 }}>
        <h3>The Nabla Operator</h3>

        <p>
          All three fundamental operations on fields are expressed using a single symbol:
          the nabla (del) operator.
        </p>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div style={{ fontSize: '1.1em' }}>
            nabla = (d/dx, d/dy, d/dz)
          </div>
        </div>

        <p>
          Nabla is a vector of partial derivatives. What it does depends on how you
          apply it — to a scalar field, as a dot product, or as a cross product.
        </p>

        <h3>Gradient (nabla f)</h3>

        <p>
          Applied to a scalar field (like temperature or pressure), the gradient gives
          a vector field pointing in the direction of steepest increase:
        </p>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>grad(f) = nabla f = (df/dx, df/dy, df/dz)</div>
        </div>

        <p>
          The gradient at any point tells you: "if you want the value to increase as
          fast as possible, go this direction." Heat flows opposite to the temperature
          gradient — from hot to cold.
        </p>

        <h3>Divergence (nabla . F)</h3>

        <p>
          The dot product of nabla with a vector field measures how much the field
          spreads out or converges at each point:
        </p>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>div(F) = nabla . F = dFx/dx + dFy/dy + dFz/dz</div>
        </div>

        <p>
          Positive divergence means the field is a source (things spread out). Negative
          means it is a sink (things converge). Zero divergence means the field is
          incompressible — nothing is created or destroyed.
        </p>

        <h3>Curl (nabla x F)</h3>

        <p>
          The cross product of nabla with a vector field measures how much the field
          rotates at each point:
        </p>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>curl(F) = nabla x F = (dFz/dy - dFy/dz, dFx/dz - dFz/dx, dFy/dx - dFx/dy)</div>
        </div>

        <p>
          Non-zero curl means the field has rotation — like a whirlpool in water or the
          magnetic field around a wire. Zero curl means the field is irrotational — it
          might converge or diverge, but it does not spin.
        </p>

        <h3>Fundamental Theorems</h3>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>curl(grad(f)) = 0 (gradients never curl)</div>
          <div>div(curl(F)) = 0 (curls never diverge)</div>
        </div>

        <p>
          These two identities are not coincidences — they are structural facts about
          the geometry of space. A gradient field can spread out but never rotates. A
          curl field can rotate but never spreads out. They are complementary descriptions
          of how fields behave.
        </p>
      </div>

      <div className="completion-check" style={{ margin: '20px 0' }}>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={() => setAcknowledged((v) => !v)}
            style={{ marginRight: 8 }}
          />
          I understand: gradient, divergence, and curl are the three ways to ask what a field does
        </label>
      </div>

      <button className="phase-advance" disabled={!acknowledged} onClick={onComplete}>
        Continue
      </button>
    </div>
  );
};

export const understandMeta = {
  containsMath: true,
  interactiveElements: 0,
  formalConcepts: ['nabla', 'gradient', 'divergence', 'curl', 'fundamental-theorems'],
};
