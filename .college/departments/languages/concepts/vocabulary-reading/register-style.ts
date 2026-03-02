import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const registerStyle: RosettaConcept = {
  id: 'lang-register-style',
  name: 'Register and Stylistic Variation',
  domain: 'languages',
  description: 'Register is a variety of language used in a particular social situation -- formal, informal, technical, intimate. ' +
    'Every speaker code-switches between registers: you speak differently to a job interviewer vs. a close friend. ' +
    'Dimensions of register variation: field (topic domain), tenor (relationship between participants), mode (spoken/written). ' +
    'Formal vs. informal vocabulary: "purchase" vs. "buy", "commence" vs. "start", "terminate" vs. "end". ' +
    'Honorific systems: Japanese has 5+ levels of politeness encoded grammatically -- verb endings change with social status. ' +
    'Technical register: every field has jargon that enables precise, efficient communication among experts. ' +
    'Register mismatch is socially jarring -- using formal language with friends sounds robotic; using slang in formal contexts sounds unprofessional. ' +
    'L2 learners often plateau in a single register (usually formal textbook language) -- widening register is a key advanced goal.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-collocations-chunks',
      description: 'Different registers have different collocational patterns -- mastering register requires knowing which chunks belong where',
    },
    {
      type: 'cross-reference',
      targetId: 'writ-dialogue-pacing',
      description: 'Dialogue authenticity depends on register -- characters must speak in register-appropriate language for their social context',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.25 + 0.3025),
    angle: Math.atan2(0.55, 0.5),
  },
};
