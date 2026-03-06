/**
 * Wing 1: Unit Circle — Understand Phase
 *
 * sin(theta), cos(theta), tan(theta) formally defined.
 * Pythagorean identity sin^2(theta) + cos^2(theta) = 1.
 * LaTeX as text, not rendered.
 */

import React, { useState } from 'react';

export interface UnderstandPhaseProps {
  onComplete: () => void;
}

export const UnderstandPhase: React.FC<UnderstandPhaseProps> = ({ onComplete }) => {
  const [identityAcknowledged, setIdentityAcknowledged] = useState(false);

  return (
    <div className="phase understand-phase">
      <h2>Understanding the Circle</h2>

      <p className="narrative-intro">
        You have watched the circle move. You have dragged the point yourself and felt
        the sine and cosine respond. Now we name what you already know.
      </p>

      <div className="formal-definitions" style={{ fontFamily: 'monospace', lineHeight: 2 }}>
        <h3>The Trigonometric Functions</h3>

        <p>
          For a point P on the unit circle at angle theta from the positive x-axis:
        </p>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>cos(theta) = x-coordinate of P</div>
          <div>sin(theta) = y-coordinate of P</div>
          <div>tan(theta) = sin(theta) / cos(theta), when cos(theta) != 0</div>
        </div>

        <h3>The Pythagorean Identity</h3>

        <p>
          Because P lies on a circle of radius 1 centered at the origin, the distance
          formula gives us a constraint that never breaks, no matter what angle you choose:
        </p>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div style={{ fontSize: '1.3em', textAlign: 'center' }}>
            sin²(theta) + cos²(theta) = 1
          </div>
        </div>

        <p>
          This is the Pythagorean identity. It says that sine and cosine are not independent —
          they are bound together by the geometry of the circle. If you know one, you can
          always find the other (up to a sign determined by the quadrant).
        </p>

        <h3>Special Angles</h3>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>theta = 0:       cos(0) = 1,   sin(0) = 0</div>
          <div>theta = pi/6:    cos(pi/6) = sqrt(3)/2,   sin(pi/6) = 1/2</div>
          <div>theta = pi/4:    cos(pi/4) = sqrt(2)/2,   sin(pi/4) = sqrt(2)/2</div>
          <div>theta = pi/3:    cos(pi/3) = 1/2,   sin(pi/3) = sqrt(3)/2</div>
          <div>theta = pi/2:    cos(pi/2) = 0,   sin(pi/2) = 1</div>
        </div>

        <p>
          Notice the symmetry: as the angle increases from 0 to pi/2, cosine falls from
          1 to 0 while sine rises from 0 to 1. At pi/4, they are equal. This is the
          diagonal — the 45-degree line — where sine and cosine meet.
        </p>

        <h3>Periodicity</h3>

        <p>
          Both sine and cosine repeat every 2*pi radians (360 degrees). This is because
          going around the circle once brings you back to where you started:
        </p>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>sin(theta + 2*pi) = sin(theta)</div>
          <div>cos(theta + 2*pi) = cos(theta)</div>
        </div>
      </div>

      <div className="completion-check" style={{ margin: '20px 0' }}>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={identityAcknowledged}
            onChange={() => setIdentityAcknowledged((v) => !v)}
            style={{ marginRight: 8 }}
          />
          I understand: sin²(theta) + cos²(theta) = 1 is the circle&apos;s equation in disguise
        </label>
      </div>

      <button
        className="phase-advance"
        disabled={!identityAcknowledged}
        onClick={onComplete}
      >
        Continue
      </button>
    </div>
  );
};

export const understandMeta = {
  containsMath: true,
  interactiveElements: 0,
  formalConcepts: ['sin', 'cos', 'tan', 'pythagorean-identity', 'periodicity'],
};
