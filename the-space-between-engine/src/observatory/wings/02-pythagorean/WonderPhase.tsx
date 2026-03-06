/**
 * Wing 2: Pythagorean Theorem — Wonder Phase
 *
 * Spider web tension, GPS triangulation, the diagonal of a room.
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
      <h2>The Invisible Diagonal</h2>

      <div className="narrative">
        <p>
          A spider sits at the corner of a door frame. She needs to get to the opposite
          corner. She could walk along the top edge, then down the side — two separate
          journeys. Or she could spin a single thread, straight across the diagonal. That
          thread is shorter than the two edges combined, but longer than either one alone. The
          spider knows this without measuring. She feels the tension in the silk.
        </p>

        <p>
          This is the oldest relationship in geometry: two lengths, meeting at a right angle,
          give birth to a third. Not by addition. Not by multiplication. By something deeper —
          a relationship that has held true for every right triangle ever drawn, measured, or
          imagined, for as long as space has had shape.
        </p>

        <p>
          Your phone uses this relationship hundreds of times per second. When GPS satellites
          tell your phone how far away they are, your phone draws imaginary circles around
          each satellite. Where those circles intersect is where you are standing. But
          distance, in every direction, is computed the same way the spider's thread is: two
          perpendicular measurements combining into one diagonal truth.
        </p>

        <p>
          Stand in the corner of a room. Look at the opposite corner — the one farthest from
          you, across the floor and up to the ceiling. You cannot walk there in a straight line
          without passing through the air. But the distance is real. It exists. And it is
          determined entirely by three numbers: the length of the room, the width, and the
          height. Three edges. One diagonal. The relationship between them is the same one the
          spider discovered.
        </p>

        <p>
          Carpenters check if a wall is square by measuring the diagonal. If the diagonal
          comes out right, the corners are true. If it does not, something is crooked. The
          diagonal is an integrity check built into the geometry of space itself.
        </p>

        <p>
          Before anyone wrote it down, people used knotted ropes to build right angles. Twelve
          equally spaced knots, pulled into a triangle of three, four, and five segments,
          always gave a perfect right angle. No protractor needed. The relationship was
          already there, woven into the numbers.
        </p>

        <p>
          Three, four, five. Five, twelve, thirteen. Eight, fifteen, seventeen. Families of
          numbers that fit together like puzzle pieces. Each set describes a right triangle
          where everything lines up perfectly — no fractions, no remainders, no
          approximations. The ancients catalogued hundreds of these families. They were
          mapping the hidden structure of space.
        </p>
      </div>

      <div className="reflection">
        <p>
          <em>
            Next time you walk diagonally across a parking lot to save time, you are using
            this relationship. You feel it in your legs — the diagonal is shorter than the
            two sides.
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
  keywords: ['spider', 'diagonal', 'GPS', 'room', 'rope', 'triangle'],
};
