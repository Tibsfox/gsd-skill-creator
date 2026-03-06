/**
 * Wing 3: Trigonometry — Wonder Phase
 *
 * Ocean tides, child on a swing, guitar string vibration, seasons.
 * ZERO mathematical notation.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface WonderPhaseProps {
  onComplete: () => void;
}

export const WonderPhase: React.FC<WonderPhaseProps> = ({ onComplete }) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - startRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const canAdvance = timeSpent >= 30000;

  return (
    <div className="phase wonder-phase">
      <h2>Everything Oscillates</h2>

      <div className="narrative">
        <p>
          Push a child on a swing. Watch them rise, pause at the top of the arc, fall
          back, swing through the bottom, rise on the other side, pause again, and return.
          Back and forth. Back and forth. The motion never invents a new path. It repeats,
          endlessly, tracing the same curve through the air.
        </p>

        <p>
          Stand at the edge of the ocean. The tide comes in. The tide goes out. Not
          randomly — on a schedule older than civilization. The water rises for about six
          hours, then falls for six hours, then rises again. Fishermen have known this
          rhythm for ten thousand years. The moon pulls, the earth spins, and the water
          follows a pattern that repeats twice a day.
        </p>

        <p>
          Pluck a guitar string. It vibrates — not chaotically, but in a precise pattern.
          The string moves up, then down, then up again, hundreds of times per second.
          The pitch you hear is determined by how fast the string repeats its motion. A
          high note is a fast oscillation. A low note is a slow one. Music is vibration,
          and vibration is repetition.
        </p>

        <p>
          The seasons themselves are an oscillation. Spring warms into summer, cools into
          autumn, chills into winter, then warms again. One full cycle per year. The
          temperature at any given place follows a wave — warmer in July, colder in
          January, repeating without end. If you plotted the average temperature of your
          city over ten years, you would see a wave as regular as a heartbeat.
        </p>

        <p>
          Your heartbeat. Your breathing. The blinking of your eyes. The alternation of
          sleeping and waking. Your body is a collection of oscillations, each running at
          its own frequency, each repeating its own pattern. You are a symphony of waves.
        </p>

        <p>
          All of these motions — the swing, the tide, the string, the seasons, the
          heartbeat — share something in common. They go somewhere, come back, and go
          again. They repeat. They are periodic. And every single one of them, no matter
          how complex, can be described as a combination of the simplest possible
          oscillation: a point moving around a circle.
        </p>

        <p>
          The study of this connection — between circles and waves, between rotation and
          oscillation — is what we call trigonometry. It is the mathematics of everything
          that repeats.
        </p>
      </div>

      <div className="reflection">
        <p>
          <em>
            Close your eyes for a moment. Feel your breathing — in, out, in, out. You
            are already doing trigonometry.
          </em>
        </p>
      </div>

      <button className="phase-advance" disabled={!canAdvance} onClick={onComplete}>
        {canAdvance ? 'Continue' : 'Take a moment to reflect...'}
      </button>
    </div>
  );
};

export const wonderMeta = {
  containsMath: false,
  interactiveElements: 0,
  requiredTimeMs: 30000,
  keywords: ['swing', 'tide', 'guitar', 'seasons', 'heartbeat', 'oscillation'],
};
