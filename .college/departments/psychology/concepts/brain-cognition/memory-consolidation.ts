import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const memoryConsolidation: RosettaConcept = {
  id: 'psych-memory-consolidation',
  name: 'Memory and Memory Consolidation',
  domain: 'psychology',
  description: 'Memory is not a recording but an active reconstruction -- understanding how memory works changes how you learn. ' +
    'Encoding: converting experience into a memory trace. Elaborative encoding (connecting to existing knowledge) produces stronger memories than rote repetition. ' +
    'Storage: short-term memory (7±2 items, seconds to minutes) vs. long-term memory (potentially unlimited, indefinite). ' +
    'Working memory: actively held information plus mental operations -- the workspace of thought. Capacity is ~4 chunks. ' +
    'Consolidation: the process of stabilizing a memory trace over hours and days. Sleep is critical -- hippocampus replays memories during slow-wave sleep. ' +
    'Retrieval: memories are reconstructed, not replayed. Each retrieval slightly modifies the memory (reconsolidation). ' +
    'Forgetting: Ebbinghaus forgetting curve -- ~50% forgotten within an hour without review. Spacing combats this. ' +
    'Long-term potentiation (LTP): repeated activation of synapses strengthens them ("neurons that fire together, wire together"). ' +
    'False memories: suggestion, imagination, and social pressure can create vivid but false memories -- memory is not reliable testimony.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-neurons-brain-structure',
      description: 'Memory consolidation is a physical process in the brain -- understanding neurons and brain regions grounds the memory system',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-lexical-acquisition',
      description: 'Vocabulary acquisition relies on memory consolidation -- spaced repetition works because it times reviews to counter the forgetting curve',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
