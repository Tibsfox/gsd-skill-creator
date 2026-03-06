/**
 * Wing 3: Trigonometry — Understand Phase
 *
 * Sine and cosine as functions of time. Period, amplitude, frequency.
 * Fourier series introduction.
 */

import React, { useState } from 'react';

export interface UnderstandPhaseProps {
  onComplete: () => void;
}

export const UnderstandPhase: React.FC<UnderstandPhaseProps> = ({ onComplete }) => {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="phase understand-phase">
      <h2>Understanding Motion</h2>

      <p className="narrative-intro">
        You have felt the waves respond to frequency and amplitude. You have layered
        oscillations and seen how they combine. Now we give precise names to what you
        experienced.
      </p>

      <div className="formal-definitions" style={{ fontFamily: 'monospace', lineHeight: 2 }}>
        <h3>Sine and Cosine as Functions of Time</h3>

        <p>
          A general sinusoidal function has three parameters:
        </p>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div style={{ fontSize: '1.1em' }}>y(t) = A * sin(2*pi*f*t + phi)</div>
        </div>

        <p>Where:</p>
        <ul style={{ lineHeight: 2.5 }}>
          <li><strong>A</strong> = amplitude (how tall the wave is, the maximum displacement)</li>
          <li><strong>f</strong> = frequency (how many complete cycles per second, in Hz)</li>
          <li><strong>phi</strong> = phase shift (where in the cycle the wave starts)</li>
          <li><strong>T = 1/f</strong> = period (how long one complete cycle takes)</li>
        </ul>

        <h3>Period and Frequency</h3>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>Period: T = 1/f = 2*pi/omega</div>
          <div>Frequency: f = 1/T</div>
          <div>Angular frequency: omega = 2*pi*f</div>
        </div>

        <p>
          The period is the time for one complete oscillation. The frequency is how many
          oscillations happen per second. The angular frequency measures cycles in radians
          per second — the speed of the point traveling around the unit circle.
        </p>

        <h3>Fourier Series</h3>

        <p>
          Joseph Fourier discovered something extraordinary: any periodic signal, no matter
          how complex or jagged, can be decomposed into a sum of simple sine and cosine waves.
        </p>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>f(t) = a0/2 + sum(n=1 to infinity) [an*cos(n*omega*t) + bn*sin(n*omega*t)]</div>
        </div>

        <p>
          This is the Fourier series. It says that the entire world of periodic signals —
          square waves, sawtooth waves, heartbeats, music, speech — can be built from sine
          and cosine. Every wave is a recipe: a list of frequencies, amplitudes, and phases.
        </p>

        <p>
          When you layered waves in the Touch phase, you were building a Fourier series by
          hand. Professional audio engineers, signal processors, and quantum physicists do
          the same thing — just with more layers and more precision.
        </p>

        <h3>Key Identities</h3>

        <div className="math-block" style={{ padding: '16px', background: '#0a0a2a', borderRadius: '8px', margin: '12px 0' }}>
          <div>sin(A + B) = sin(A)*cos(B) + cos(A)*sin(B)</div>
          <div>cos(A + B) = cos(A)*cos(B) - sin(A)*sin(B)</div>
          <div>sin(2*theta) = 2*sin(theta)*cos(theta)</div>
          <div>cos(2*theta) = cos²(theta) - sin²(theta)</div>
        </div>
      </div>

      <div className="completion-check" style={{ margin: '20px 0' }}>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={() => setAcknowledged((v) => !v)}
            style={{ marginRight: 8 }}
          />
          I understand: every periodic signal is a sum of sines and cosines
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
  formalConcepts: ['period', 'frequency', 'amplitude', 'phase', 'fourier-series'],
};
