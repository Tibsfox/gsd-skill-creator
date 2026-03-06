/**
 * Wing 1: Unit Circle — Wonder Phase
 *
 * Earth rotation, day/night cycle, sundial shadows.
 * A story about how the earth spins and shadows trace circles.
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
      <h2>The Shadow That Drew a Circle</h2>

      <div className="narrative">
        <p>
          Long before anyone put a name to it, there was the shadow of a stick in the
          ground. A shepherd, maybe, watching the hours pass. The shadow shortened as the
          sun climbed, then lengthened again as it fell toward the horizon. Over a full day,
          the tip of that shadow traced a shape on the earth — not a line, not a square, but
          a circle.
        </p>

        <p>
          This was the first clock. The first calendar. The first geometry lesson. Nobody
          taught it. The earth taught it, just by spinning.
        </p>

        <p>
          Think about that for a moment: the planet you are standing on is rotating at
          roughly a thousand miles per hour. You do not feel it. But the shadow feels it. The
          shadow is the earth's handwriting, and it writes in circles.
        </p>

        <p>
          Every sunrise is the earth turning its face toward the star it orbits. Every sunset
          is the earth turning away. The day is not a thing that happens to you — it is a
          rotation you are riding. And the length of your shadow at noon tells you exactly
          where you are in that rotation.
        </p>

        <p>
          In the desert, people built sundials — stone circles with a vertical rod at the
          center. As the sun moved overhead, the rod's shadow swept across the stone like the
          hand of a clock. They marked the hours. They marked the seasons. They discovered
          that the shadow was shortest at midsummer and longest at midwinter, and that this
          pattern repeated every single year without fail.
        </p>

        <p>
          They had discovered something profound without a single equation: the earth moves
          in circles, and circles encode time.
        </p>

        <p>
          Tonight, if the sky is clear, go outside and watch the stars. Pick one near the
          horizon. Come back an hour later. It has moved — not randomly, but along a perfect
          arc. The North Star barely moves at all, while every other star wheels around it in
          great circles. You are watching the earth spin, written in starlight.
        </p>

        <p>
          A circle of radius one, centered at the origin. That is all it takes to describe
          every rotation, every orbit, every cycle. The simplest circle holds the secret to
          the most complex motions in the universe.
        </p>
      </div>

      <div className="reflection">
        <p>
          <em>
            Sit with this for a moment. The next time you see a shadow, remember: you are
            watching the earth write geometry on the ground.
          </em>
        </p>
      </div>

      <button
        className="phase-advance"
        disabled={!canAdvance}
        onClick={onComplete}
      >
        {canAdvance ? 'Continue' : 'Take a moment to reflect...'}
      </button>
    </div>
  );
};

/**
 * Metadata for testing and validation.
 * Wonder phases must contain ZERO math notation.
 */
export const wonderMeta = {
  containsMath: false,
  interactiveElements: 0,
  requiredTimeMs: 30000,
  keywords: ['shadow', 'earth', 'rotation', 'sundial', 'circle', 'stars'],
};
