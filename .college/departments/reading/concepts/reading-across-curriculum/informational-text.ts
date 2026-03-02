import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const informationalText: RosettaConcept = {
  id: 'read-informational-text',
  name: 'Reading Informational Texts',
  domain: 'reading',
  description: 'Informational texts have distinctive features: headings, subheadings, captions, sidebars, graphs, tables, glossaries, and indexes. Previewing these features before reading activates prior knowledge and provides a roadmap. Reading informational text requires different strategies than literary reading -- particularly identifying text structure and connecting visual information to prose.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-text-structure', description: 'Informational texts follow recognizable structures that guide reading strategy' },
  ],
  complexPlanePosition: { real: 0.75, imaginary: 0.25, magnitude: Math.sqrt(0.5625 + 0.0625), angle: Math.atan2(0.25, 0.75) },
};
