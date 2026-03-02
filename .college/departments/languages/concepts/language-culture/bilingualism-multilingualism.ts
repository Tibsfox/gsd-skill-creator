import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const bilingualismMultilingualism: RosettaConcept = {
  id: 'lang-bilingualism-multilingualism',
  name: 'Bilingualism and Multilingualism',
  domain: 'languages',
  description: 'More than half the world\'s population speaks more than one language -- bilingualism is the human norm, not the exception. ' +
    'Simultaneous bilingualism: acquiring two languages from birth. Sequential: acquiring L2 after L1 is established. ' +
    'Code-switching: fluent bilinguals switch languages within conversations or even sentences -- it is a skilled behavior, not a failure. ' +
    'The bilingual advantage hypothesis (contested): bilinguals show enhanced executive function from managing two language systems. ' +
    'Language attrition: a language can diminish if not used -- even L1 can attrite in immersive L2 environments. ' +
    'Heritage speakers: grew up hearing a language but did not develop full proficiency -- different profile than L2 learners. ' +
    'Multilinguals: each additional language becomes easier to learn -- positive transfer from existing linguistic knowledge. ' +
    'Metalinguistic awareness: explicit knowledge about how language works, enhanced by studying multiple languages.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'psych-cognitive-development',
      description: 'Bilingual children show different patterns of cognitive development -- managing two language systems affects executive function development',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-linguistic-relativity',
      description: 'Bilinguals who switch languages may shift thought patterns -- relativity effects multiply with each language known',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
