import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const monitoringComprehension: RosettaConcept = {
  id: 'read-monitoring-comprehension',
  name: 'Monitoring Comprehension',
  domain: 'reading',
  description: 'Metacognitive readers continuously monitor their own understanding and apply fix-up strategies when meaning breaks down. Strategies include rereading, reading more slowly, looking up unknown words, creating mental images, and asking questions. This self-regulation is what distinguishes strategic readers from those who decode without understanding.',
  panels: new Map(),
  relationships: [
    { type: 'analogy', targetId: 'crit-metacognitive-monitoring', description: 'Reading metacognition parallels the broader metacognitive monitoring practiced in critical thinking' },
  ],
  complexPlanePosition: { real: 0.5, imaginary: 0.6, magnitude: Math.sqrt(0.25 + 0.36), angle: Math.atan2(0.6, 0.5) },
};
