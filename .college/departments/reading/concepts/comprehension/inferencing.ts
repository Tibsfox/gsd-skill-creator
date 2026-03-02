import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const inferencing: RosettaConcept = {
  id: 'read-inferencing',
  name: 'Inferencing',
  domain: 'reading',
  description: 'Inferencing is reading between the lines: combining text evidence with prior knowledge to understand what is implied but not stated. Types include drawing conclusions, predicting what happens next, identifying character motives, and understanding implied themes. Strong inferencing ability is strongly correlated with reading comprehension.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-main-idea-details', description: 'Identifying stated information provides the textual anchor for inferences' },
  ],
  complexPlanePosition: { real: 0.55, imaginary: 0.5, magnitude: Math.sqrt(0.3025 + 0.25), angle: Math.atan2(0.5, 0.55) },
};
