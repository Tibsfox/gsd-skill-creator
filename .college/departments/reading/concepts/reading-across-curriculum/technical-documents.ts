import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const technicalDocuments: RosettaConcept = {
  id: 'read-technical-documents',
  name: 'Reading Technical Documents',
  domain: 'reading',
  description: 'Technical documents (manuals, procedures, specifications, scientific reports) require precise reading strategies: following sequences exactly, attending to qualifications ("if... then"), reading all warnings and caveats, using reference features (tables of contents, indexes), and identifying when expertise is needed. Misreading technical documents can have serious practical consequences.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-informational-text', description: 'Technical documents are a specialized form of informational text with high precision requirements' },
  ],
  complexPlanePosition: { real: 0.7, imaginary: 0.3, magnitude: Math.sqrt(0.49 + 0.09), angle: Math.atan2(0.3, 0.7) },
};
