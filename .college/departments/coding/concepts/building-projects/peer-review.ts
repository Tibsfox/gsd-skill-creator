import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const peerReview: RosettaConcept = {
  id: 'code-peer-review',
  name: 'Peer Code Review',
  domain: 'coding',
  description: 'The practice of having another developer read, evaluate, and suggest improvements ' +
    'to your code before it is merged into the main codebase. Pull requests (PRs) on GitHub are ' +
    'the standard mechanism: open a PR, assign reviewers, respond to comments, revise, merge. ' +
    'What reviewers look for: correctness (does it do what it claims?), security (any vulnerabilities?), ' +
    'readability (can others understand it?), test coverage (are edge cases tested?), ' +
    'and design (could this be simpler?). Code review is where professional norms are transmitted -- ' +
    'juniors learn style, architecture patterns, and domain knowledge from senior reviewers.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'writ-peer-feedback',
      description: 'Code review and writing workshop critique are the same collaborative improvement process',
    },
    {
      type: 'dependency',
      targetId: 'code-code-organization',
      description: 'Poorly organized code is much harder to review effectively',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.36 + 0.2025),
    angle: Math.atan2(0.45, 0.6),
  },
};
