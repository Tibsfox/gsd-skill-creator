import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cyberbullyingResponse: RosettaConcept = {
  id: 'diglit-cyberbullying-response',
  name: 'Cyberbullying & Online Harassment',
  domain: 'digital-literacy',
  description: 'Cyberbullying is repeated harmful behavior through digital technology. ' +
    'Forms: harassment, impersonation, public humiliation, exclusion, cyberstalking. ' +
    'Digital amplification: online bullying reaches more people, persists longer, ' +
    'and can occur at any hour -- no escape at home. ' +
    'If targeted: do not respond (often escalates), document (screenshots with timestamps), ' +
    'report to platform and school/employer, block the harasser, seek support. ' +
    'Bystander role: witnessing without intervening is the most common response -- ' +
    'and the least helpful. Active bystanders report, support the target, and refuse to amplify. ' +
    'Upstander vs. bystander: the choice that matters most in online harassment situations.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'psych-prosocial-behavior',
      description: 'Bystander effect in cyberbullying mirrors the social psychology of bystander non-intervention',
    },
    {
      type: 'dependency',
      targetId: 'diglit-digital-footprint',
      description: 'Evidence of cyberbullying requires documentation -- understanding digital permanence helps preserve evidence',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
