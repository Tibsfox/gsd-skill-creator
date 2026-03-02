import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const mainIdeaDetails: RosettaConcept = {
  id: 'read-main-idea-details',
  name: 'Main Idea & Supporting Details',
  domain: 'reading',
  description: 'The main idea is the central message or point of a text; supporting details provide evidence, examples, or elaboration. In expository texts, the main idea is often stated explicitly (topic sentence); in literary texts it must be inferred as theme. Distinguishing main ideas from details requires judgment about what is central versus peripheral.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-reading-fluency', description: 'Comprehension of main idea requires fluent decoding to free cognitive resources' },
    { type: 'dependency', targetId: 'read-summarizing', description: 'Identifying main ideas is the prerequisite for effective summarizing' },
  ],
  complexPlanePosition: { real: 0.75, imaginary: 0.25, magnitude: Math.sqrt(0.5625 + 0.0625), angle: Math.atan2(0.25, 0.75) },
};
