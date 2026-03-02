import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const memoryScience: RosettaConcept = {
  id: 'learn-memory-science',
  name: 'Memory Science',
  domain: 'learning',
  description:
    'Memory is not a recording -- it is a reconstructive process. Three stages: ' +
    'Encoding: converting experience into a neural representation (affected by attention, ' +
    'prior knowledge, and emotional state). Storage: maintaining the representation over time ' +
    '(stabilized during sleep through hippocampal-cortical transfer). Retrieval: reconstructing ' +
    'the memory from partial cues (subject to distortion and updating). ' +
    'Working memory (Baddeley\'s model): limited capacity (~4 chunks, ~20 seconds duration); ' +
    'the phonological loop handles verbal information; the visuospatial sketchpad handles spatial; ' +
    'the central executive coordinates. Chunking (Miller\'s law) increases effective capacity: ' +
    'grouping items into meaningful units (R-A-C-E vs. race). ' +
    'Long-term potentiation (LTP): repeated synaptic activation strengthens connections -- ' +
    'the physical mechanism of memory formation. ' +
    'Brain myths: learning styles (visual/auditory/kinesthetic) have no empirical support; ' +
    'people use only 10% of their brain is false (all regions are active); ' +
    'left-brain/right-brain dominance for individuals is not supported by neuroscience.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-retrieval-practice',
      description: 'Retrieval practice works by reconsolidating memory at the neural level',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.25 + 0.16),
    angle: Math.atan2(0.4, 0.5),
  },
};
