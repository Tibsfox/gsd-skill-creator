import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const factChecking: RosettaConcept = {
  id: 'diglit-fact-checking',
  name: 'Fact-Checking & Verification',
  domain: 'digital-literacy',
  description: 'Systematic methods for verifying claims encountered online. ' +
    'Primary source verification: trace a claim to its original source -- ' +
    'newspaper articles often misrepresent research papers. ' +
    'Reverse image search: upload an image to see where it originally appeared -- ' +
    'exposes fake context around real images. ' +
    'Quote verification: search the exact quote in quotation marks -- ' +
    'famous people are often misquoted online. ' +
    'Established fact-checking organizations: Snopes, PolitiFact, FactCheck.org, Reuters Fact Check. ' +
    'The verification mindset: extraordinary claims require extraordinary evidence. ' +
    'Default skepticism: assume you need to verify before sharing, not the reverse.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'diglit-source-credibility',
      description: 'Fact-checking uses credible sources -- you need credibility evaluation to choose what to check against',
    },
    {
      type: 'cross-reference',
      targetId: 'data-responsible-practice',
      description: 'Scientific fact-checking and journalism fact-checking use the same "trace to primary source" principle',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
