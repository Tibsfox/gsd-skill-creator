import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sourceCredibility: RosettaConcept = {
  id: 'diglit-source-credibility',
  name: 'Source Credibility Evaluation',
  domain: 'digital-literacy',
  description: 'The SIFT method for evaluating online information: ' +
    'Stop -- before sharing, pause and check your emotional reaction (outrage is a red flag). ' +
    'Investigate the source -- look up the publication, author, funding, and track record. ' +
    'Find better coverage -- seek authoritative sources reporting on the same claim. ' +
    'Trace claims -- follow links to their origin; does the source actually say what is claimed? ' +
    'Lateral reading: professional fact-checkers do not read an unfamiliar site deeply -- ' +
    'they open new tabs to see what other sources say about it. ' +
    'Red flags: no author named, extreme emotional language, implausible claims, ' +
    'no date, unfamiliar domain (.net instead of established news org). ' +
    'Authority is domain-specific: a celebrity\'s health advice is not authoritative just because they are famous.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'diglit-fact-checking',
      description: 'Credibility evaluation determines which sources to fact-check against',
    },
    {
      type: 'cross-reference',
      targetId: 'log-argument-evaluation',
      description: 'Evaluating source credibility uses the same structured criteria as evaluating argument quality',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
