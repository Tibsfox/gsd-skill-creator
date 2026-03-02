import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const copyrightAttribution: RosettaConcept = {
  id: 'diglit-copyright-attribution',
  name: 'Copyright & Attribution',
  domain: 'digital-literacy',
  description: 'Copyright protects creators\' rights to their work by default -- ' +
    'you do not need to register copyright or put a notice on work to have copyright. ' +
    'Duration: life of creator + 70 years (US). ' +
    'Fair use: education, commentary, criticism, parody can use copyrighted material in limited ways. ' +
    'Creative Commons licenses allow creators to share with specific permissions: ' +
    'CC-BY (credit required), CC-SA (share alike), CC-NC (non-commercial), CC-ND (no derivatives). ' +
    'Public domain: works whose copyright has expired, government works (US), CC0 releases. ' +
    'When using others\' work: attribute clearly (who, where, license), ' +
    'check the license, use CC or public domain images for public projects. ' +
    'AI-generated content copyright is currently unsettled law.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'code-open-source',
      description: 'Open source software licenses (MIT, GPL) are a specialized form of copyright management',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-market-failures',
      description: 'Intellectual property is a government-created monopoly to address the public goods problem of creative work',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
