import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const digitalFootprint: RosettaConcept = {
  id: 'diglit-digital-footprint',
  name: 'Digital Footprint & Permanence',
  domain: 'digital-literacy',
  description: 'Everything you do online leaves traces that persist longer than you might expect. ' +
    'Active footprint: content you deliberately create (posts, profiles, comments). ' +
    'Passive footprint: data collected about your behavior (tracking, metadata, location history). ' +
    'Permanence: once something is online, you cannot guarantee it will be deleted -- ' +
    'screenshots, archives (Wayback Machine), reposts all persist after deletion. ' +
    'Google yourself: know what is findable about you -- future employers and university admissions offices will. ' +
    'Metadata: photos contain EXIF data including GPS coordinates and device model -- ' +
    'sharing a photo can reveal your location. ' +
    'The "newspaper test": would you be comfortable seeing this on a newspaper\'s front page in 20 years?',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'diglit-privacy-management',
      description: 'Understanding permanence motivates proactive privacy management',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-adolescent-development',
      description: 'Adolescents\' risk-taking tendencies make digital footprint education especially important for teens',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
