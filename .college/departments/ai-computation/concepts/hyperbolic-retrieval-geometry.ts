/**
 * Hyperbolic Retrieval Geometry concept -- match embedding geometry to hierarchical knowledge.
 *
 * Retrieval over tree-structured knowledge suffers hubness and lost granularity
 * because Euclidean volume grows polynomially while hierarchical data grows
 * exponentially; embedding retrieval in hyperbolic space matches the geometry and
 * restores granularity (arXiv 2606.03307, 2026).
 *
 * @module departments/ai-computation/concepts/hyperbolic-retrieval-geometry
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~10*2pi/23, radius ~0.86 (representational geometry, abstract)
const theta = 10 * 2 * Math.PI / 23;
const radius = 0.86;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const hyperbolicRetrievalGeometry: RosettaConcept = {
  id: 'ai-computation-hyperbolic-retrieval-geometry',
  name: 'Hyperbolic Retrieval Geometry',
  domain: 'ai-computation',
  description: 'Retrieval quality depends on whether the embedding geometry matches the data. Over ' +
    'tree-structured external knowledge, Euclidean space grows only polynomially with radius while a ' +
    'hierarchy branches exponentially, so distinct subtrees crowd together — producing hubness (a few ' +
    'points that are everyone\'s nearest neighbour) and lost semantic granularity. Concretely, a tree ' +
    'of branching factor b has about b^h nodes at depth h, but a Euclidean ball of radius r holds ' +
    'volume only ~r^d — so an exponentially branching hierarchy packed into fixed-dimensional ' +
    'Euclidean space forces far-apart branches to collide, whereas hyperbolic volume itself grows ' +
    'exponentially with radius and leaves room for each branch. Embedding retrieval ' +
    'in hyperbolic space thus matches the tree geometry and restores ' +
    'granularity (arXiv 2606.03307, 2026). The concept names a representational cause of retrieval ' +
    'degradation — geometry mismatch — rather than a ranking or grounding failure.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-grounding-faithfulness',
      description: 'A geometry mismatch corrupts which passages are retrievable at all, upstream of whether the answer stays faithful to the retrieved context',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-semantic-channel',
      description: 'Hubness is a semantic-channel pathology: exponential hierarchy crushed into polynomial Euclidean volume collapses distinct meanings onto shared hub embeddings',
    },
    {
      type: 'cross-reference',
      targetId: 'math-fractal-geometry',
      description: 'Hierarchical, self-similar tree data is naturally embedded in hyperbolic (negatively curved) space, the same fractal/branching geometry the mathematics department studies',
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-permutation-invariant-embedding",
      description: "Sibling embedding-geometry defect: where hyperbolic-retrieval-geometry shows a flat Euclidean space fails to encode retrieval hierarchy, permutation-invariant-embedding shows a bag-of-tokens geometry fails to encode order. Both diagnose an embedding whose geometry throws away the structure the task depends on.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-isotropic-embedding",
      description: "Explicit contrast: isotropic-embedding pushes for uniform, anisotropy-free spread, whereas hyperbolic-retrieval-geometry deliberately introduces negative curvature so hierarchy can be encoded. The two prescriptions are orthogonal fixes to distinct geometric pathologies and should be read against each other.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
