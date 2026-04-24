/**
 * Rate-Distortion for Deductive Sources concept — R-D theory when content is provable.
 *
 * Information Theory wing.
 * Classical rate-distortion theory characterises the minimum bit-rate
 * needed to reconstruct a stochastic source within a distortion budget.
 * The April 2026 cluster paper (arXiv:2604.15698) adapts the theory to
 * deductive sources — sequences of provable statements — and shows that
 * their R-D curve is qualitatively different from generic data: distortion
 * has a discontinuity at the soundness boundary (a mildly-lossy
 * reconstruction of a proof may be no longer a proof at all). For
 * gsd-skill-creator, this governs the executable-code leg of the DACP
 * three-part bundle and motivates a distinct compression strategy for that
 * leg. Phase 747 implements the distinction in src/semantic-channel/.
 *
 * Milestone: v1.49.572 math-foundations-apr2026.
 *
 * @module departments/ai-computation/concepts/rate-distortion-deductive-source
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~12*2pi/29, radius ~0.88 (information-theoretic ring)
const theta = 12 * 2 * Math.PI / 29;
const radius = 0.88;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const rateDistortionDeductiveSource: RosettaConcept = {
  id: 'ai-computation-rate-distortion-deductive-source',
  name: 'Rate-Distortion for Deductive Sources',
  domain: 'ai-computation',
  description: 'Rate-distortion theory characterises the minimum bit-rate at which ' +
    'a source can be encoded and still reconstructed within a specified distortion ' +
    'budget. The April 2026 cluster paper (arXiv:2604.15698) adapts the theory to ' +
    'deductive sources — sources whose content consists of provable statements, ' +
    'derivations, or other machine-checkable sequences. The central finding is that ' +
    'the R-D curve of a deductive source has a discontinuity at the soundness ' +
    'boundary: a mildly-lossy reconstruction of a proof may be no longer a proof at ' +
    'all (a single missing hypothesis or a single renamed variable is sufficient to ' +
    'break the chain). This qualitative difference from generic data motivates a ' +
    'distinct compression strategy for deductive content. For gsd-skill-creator, ' +
    'this governs the executable-code leg of the DACP three-part bundle, and ' +
    'Phase 747 (src/semantic-channel/) implements the distinction: the code leg is ' +
    'allocated a capacity budget that respects the soundness discontinuity.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'A reference implementation distinguishes two regimes: for the "soundness-preserving" regime, compression uses a lossless structural-sharing encoder (tree-sharing on AST form); for the "best-effort" regime beyond the soundness boundary, compression falls back to generic LZMA. The cluster paper supplies the exact threshold. See arXiv:2604.15698.',
    }],
    ['typescript', {
      panelId: 'typescript',
      explanation: 'The Phase 747 primitive exports a RateDistortionCurve type and a classify(source: DeductiveSource): "sound" | "best-effort" predicate. The executable-code leg of a DACP bundle is routed through the appropriate encoder based on the classification. See arXiv:2604.15698.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-semantic-channel',
      description: 'Rate-distortion for deductive sources supplies the R-D curve for the executable-code leg of the semantic-channel three-part bundle; the two concepts co-locate at the Phase 747 implementation boundary',
    },
    {
      type: 'cross-reference',
      targetId: 'mathematics-coherent-functor',
      description: 'Coherent-functor presentations of deductive sources give them the algebraic structure that makes the soundness-preserving compression regime well-defined',
    },
    {
      type: 'dependency',
      targetId: 'mathematics-logarithmic-scales',
      description: 'Rate-distortion analysis uses log-scale information measures; the Algebra wing\'s logarithmic-scales concept is a prerequisite',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
