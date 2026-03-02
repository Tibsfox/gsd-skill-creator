import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const textStructure: RosettaConcept = {
  id: 'read-text-structure',
  name: 'Text Structure',
  domain: 'reading',
  description: 'Authors organize informational texts in predictable patterns: cause-effect, compare-contrast, sequence/chronological, problem-solution, and descriptive. Recognizing these structures helps readers anticipate organization and locate information. Signal words (therefore, however, first, as a result) indicate which structure is being used.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-main-idea-details', description: 'Text structure organizes how main ideas and details are arranged' },
    { type: 'dependency', targetId: 'read-summarizing', description: 'Understanding text structure guides how to create an accurate summary' },
  ],
  complexPlanePosition: { real: 0.65, imaginary: 0.4, magnitude: Math.sqrt(0.4225 + 0.16), angle: Math.atan2(0.4, 0.65) },
};
