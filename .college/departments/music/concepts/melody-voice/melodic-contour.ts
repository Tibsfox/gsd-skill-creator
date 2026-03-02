import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const melodicContour: RosettaConcept = {
  id: 'music-melodic-contour',
  name: 'Melodic Contour',
  domain: 'music',
  description:
    'Melodic contour describes the shape of a melody — the pattern of rises and falls in pitch ' +
    'over time. Stepwise motion (conjunct: adjacent scale degrees) is smooth and singable; ' +
    'leaps (disjunct: skips of a third or more) create energy and expressive accent. The balance ' +
    'of steps and leaps characterizes a melody\'s style: folk melodies favor conjunct motion for ' +
    'easy singing; virtuosic music exploits wide leaps. Phrase shape typically climbs toward ' +
    'a structural high point (apex) then descends to a cadence — mirroring the tension-release ' +
    'arc of sentences. Melodic cells (short repeated motives) provide unity; variation and ' +
    'development provide contrast. Melodic arch: many great melodies rise through the first half ' +
    'and descend through the second (Beethoven\'s "Ode to Joy," "Somewhere Over the Rainbow"). ' +
    'Melodic analysis tools: reduction to skeleton notes, identifying climax position and ' +
    'approach, tracing stepwise lines beneath ornamental leaps. For composers: contour is ' +
    'controlled through note choice, register, and phrase length.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-scales-intervals',
      description: 'Melodic contour analysis requires knowledge of scale degrees and interval sizes to identify steps vs. leaps',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.3025 + 0.2025),
    angle: Math.atan2(0.45, 0.55),
  },
};
