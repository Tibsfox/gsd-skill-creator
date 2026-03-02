import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const conflictTypes: RosettaConcept = {
  id: 'writ-conflict-types',
  name: 'Conflict Types',
  domain: 'writing',
  description: 'Conflict is the engine of narrative -- without it, nothing happens. ' +
    'External conflicts: person vs. person (war, rivalry, love), ' +
    'person vs. nature (survival, disaster), person vs. society (oppression, rebellion). ' +
    'Internal conflict: person vs. self -- the most psychologically rich source of story. ' +
    'Conflict serves two functions: plot (what happens) and character revelation (who people are under pressure). ' +
    'Conflict escalation: good narrative increases stakes and tension. ' +
    'The try-fail cycle: characters attempt to resolve conflict, fail, try again differently. ' +
    'Conflict resolution: not all conflicts resolve -- some of the greatest endings are ambiguous or tragic. ' +
    'The inciting incident: the specific event that launches the central conflict.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'psych-stress-response',
      description: 'Narrative conflict mirrors real psychological stress -- both reveal character under pressure',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.4225 + 0.16),
    angle: Math.atan2(0.4, 0.65),
  },
};
