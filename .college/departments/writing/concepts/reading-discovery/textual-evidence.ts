import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const textualEvidence: RosettaConcept = {
  id: 'writ-textual-evidence',
  name: 'Textual Evidence',
  domain: 'writing',
  description: 'Supporting literary interpretations with specific passages from the text. ' +
    'The claim-evidence-analysis structure: make an interpretive claim, quote the relevant passage, ' +
    'then analyze how that passage supports the claim. ' +
    'Weak evidence use: long block quotes with no analysis ("This shows the theme"). ' +
    'Strong evidence use: selected phrases embedded in your own sentences with close analysis. ' +
    '"Show, don\'t tell" applies to evidence too -- do not just assert that a theme exists; ' +
    'show exactly where and how the text creates it. ' +
    'Counter-evidence: the best interpretations acknowledge passages that seem to contradict them ' +
    'and explain how to reconcile those passages.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-close-reading',
      description: 'Close reading is how you find evidence; textual evidence is how you use it',
    },
    {
      type: 'cross-reference',
      targetId: 'log-deductive-reasoning',
      description: 'Textual argument is deductive: interpretation is the conclusion, evidence is the premises',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.3025 + 0.25),
    angle: Math.atan2(0.5, 0.55),
  },
};
