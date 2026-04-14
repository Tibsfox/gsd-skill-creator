/**
 * Wing 4: Vector Calculus — Wonder Phase
 *
 * Wind patterns, starling flocks, magnetic fields,
 * fox sensing Earth's magnetism.
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
      <h2>The Invisible Architecture</h2>

      <div className="narrative">
        <p>
          You cannot see the wind. But scatter a handful of leaves into the air and
          suddenly you can — each leaf traces the invisible currents, revealing a structure
          that was there all along. The wind is not random. At every point in space, it has
          a direction and a strength. It pushes north here, swirls east there, rises in
          thermals over hot pavement, and sinks in downdrafts over cold water. The wind is
          a field — an invisible architecture that fills all of space with instructions:
          "if you are here, move this way."
        </p>

        <p>
          Watch a murmuration of starlings at dusk. Thousands of birds wheeling and flowing
          as a single organism, forming shapes that shift and dissolve and reform in seconds.
          No bird is in charge. Each follows simple rules about its neighbors — stay close,
          but not too close; turn when they turn; speed up when they speed up. From these
          local rules, a global pattern emerges. The flock moves as if guided by an invisible
          hand. That hand is a velocity field — at every point, there is a direction and speed,
          and every bird that passes through that point follows it.
        </p>

        <p>
          Hold two magnets near each other. You can feel the force before they touch — an
          invisible push or pull that reaches through empty space. Iron filings scattered on
          paper over a magnet arrange themselves into beautiful curves, revealing the
          magnetic field lines that permeate the space around every magnet, every wire
          carrying current, every spinning electron in every atom of your body.
        </p>

        <p>
          The red fox hunts in winter. Snow covers the ground, hiding the mice underneath.
          The fox cannot see them. Cannot hear them well enough to pinpoint their location.
          But researchers have discovered something remarkable: foxes align themselves with
          the Earth's magnetic field before they pounce. They orient northeast, leap into the
          air, and dive nose-first into the snow — and they catch the mouse far more often
          when properly aligned. The fox senses the invisible field. It navigates by
          magnetism.
        </p>

        <p>
          Gravity is a field. Electricity is a field. Temperature across a landscape is a
          field. The pressure inside a weather system is a field. The ocean currents that
          carry heat from the equator to the poles are a field. Everywhere you look, there
          are quantities that vary from point to point, directions that change from place to
          place, invisible structures that guide motion and determine outcomes.
        </p>

        <p>
          The mathematics of fields — how they flow, how they spin, how they spread, how
          they concentrate — is vector calculus. It is the language of the invisible
          architecture of the universe.
        </p>
      </div>

      <div className="reflection">
        <p>
          <em>
            Hold your hand up. You are immersed in at least three fields right now:
            gravity pulling you down, the Earth's magnetic field threading through you,
            and the electromagnetic field of the light you are reading by. You cannot see
            any of them. But they are as real as the chair you are sitting in.
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
  keywords: ['wind', 'starlings', 'magnetic', 'fox', 'field', 'invisible'],
};
