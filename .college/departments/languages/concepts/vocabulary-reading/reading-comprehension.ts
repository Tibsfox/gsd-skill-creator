import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const readingComprehension: RosettaConcept = {
  id: 'lang-reading-comprehension',
  name: 'Reading Comprehension in a Target Language',
  domain: 'languages',
  description: 'Reading in a second language draws on both linguistic knowledge and general reading skills. ' +
    'The threshold hypothesis: below a critical vocabulary threshold (~95% word coverage), comprehension breaks down even for good L1 readers. ' +
    'Extensive reading (reading large amounts of easy material) vs. intensive reading (studying short, difficult texts in detail). ' +
    'Schema activation: prior knowledge about a topic aids comprehension even with limited vocabulary. ' +
    'Bottom-up processing (decoding words and grammar) and top-down processing (using context and background knowledge) operate simultaneously. ' +
    'Transfer from L1: skilled L1 readers transfer strategies (skimming, scanning, inference) to L2 once vocabulary threshold is reached. ' +
    'Reader-writer contract: written texts assume shared cultural schemas -- what is implicit differs across cultures. ' +
    'Graded readers: specially written texts at controlled vocabulary levels scaffold progression from low to high proficiency.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-lexical-acquisition',
      description: 'Vocabulary coverage is the primary determinant of reading comprehension -- acquisition feeds directly into reading ability',
    },
    {
      type: 'cross-reference',
      targetId: 'writ-close-reading',
      description: 'Close reading skills transfer across languages -- analytical reading strategies apply in L2 once threshold vocabulary is established',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
