import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const agreementSystems: RosettaConcept = {
  id: 'lang-agreement-systems',
  name: 'Grammatical Agreement Systems',
  domain: 'languages',
  description: 'Agreement (concord) is when one word changes form to match grammatical features of another word. ' +
    'Gender agreement: Spanish "el libro rojo" (masc.) vs. "la mesa roja" (fem.) -- adjective agrees with noun. ' +
    'Number agreement: "the cat runs" vs. "the cats run" -- English verb agrees with subject in number. ' +
    'Case agreement: Russian adjectives agree with nouns in gender, number, AND case -- 6 cases × 3 genders × 2 numbers = complex system. ' +
    'Grammatical gender ≠ natural gender: German "das Mädchen" (the girl) is neuter. Gender is a noun class system, not biological sex. ' +
    'Languages vary from 0 genders (English nouns) to 20+ noun classes (Bantu languages). ' +
    'Polypersonal agreement: some languages (Georgian, Basque) mark both subject and object on the verb. ' +
    'Understanding agreement reduces errors in production and aids parsing in comprehension.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-morphology',
      description: 'Agreement is expressed through morphological inflection -- you need to understand morphemes to understand agreement',
    },
    {
      type: 'cross-reference',
      targetId: 'log-formal-proof-systems',
      description: 'Agreement constraints function like formal rules -- violations are ungrammatical in the same way logical contradictions are invalid',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
