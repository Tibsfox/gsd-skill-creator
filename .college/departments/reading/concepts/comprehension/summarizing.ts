import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const summarizing: RosettaConcept = {
  id: 'read-summarizing',
  name: 'Summarizing',
  domain: 'reading',
  description: 'A summary condenses a text to its most essential ideas in the reader\'s own words. Effective summarizing requires identifying what is important versus interesting, eliminating redundancy, and synthesizing ideas. In one\'s own words prevents plagiarism and demonstrates genuine understanding. Summarizing is a high-leverage comprehension and study skill.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-main-idea-details', description: 'Summarizing begins with identifying the main idea and key supporting details' },
    { type: 'dependency', targetId: 'read-monitoring-comprehension', description: 'If a reader cannot summarize, it signals a comprehension breakdown requiring intervention' },
  ],
  complexPlanePosition: { real: 0.6, imaginary: 0.45, magnitude: Math.sqrt(0.36 + 0.2025), angle: Math.atan2(0.45, 0.6) },
};
