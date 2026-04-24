/**
 * Semantic Channel concept — three-part bundle channel capacity from DACP.
 *
 * Communication / Channel-Capacity wing.
 * A semantic channel transmits structured triples: (human-intent,
 * structured-data, executable-code). The April 2026 cluster paper
 * (arXiv:2604.16471) formalises the channel and shows that its capacity is
 * bounded by the weakest leg of the three — optimising a single leg only
 * moves the bottleneck. For gsd-skill-creator, this is the formal backing
 * for the DACP grammar's non-negotiable three-part structure, and the
 * substrate for Phase 747 (src/semantic-channel/).
 *
 * Milestone: v1.49.572 math-foundations-apr2026.
 *
 * @module departments/ai-computation/concepts/semantic-channel
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~11*2pi/29, radius ~0.89 (communication-theoretic ring)
const theta = 11 * 2 * Math.PI / 29;
const radius = 0.89;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const semanticChannel: RosettaConcept = {
  id: 'ai-computation-semantic-channel',
  name: 'Semantic Channel',
  domain: 'ai-computation',
  description: 'A semantic channel transmits structured triples of the form ' +
    '(human-intent, structured-data, executable-code). The April 2026 cluster ' +
    'paper on Semantic Channel Theory (arXiv:2604.16471) formalises the ' +
    'capacity structure: the channel\'s overall capacity is bounded by the ' +
    'weakest leg of the three. This means any optimisation of a single leg ' +
    'merely relocates the bottleneck rather than raising the ceiling, which is ' +
    'the formal backing for DACP\'s longstanding architectural rule that the ' +
    'three-part structure is non-negotiable. For gsd-skill-creator, the ' +
    'semantic-channel concept is the M5 substrate for Phase 747 ' +
    '(src/semantic-channel/): a typed three-part bundle + capacity-bound ' +
    'computation + optional runtime drift-checker. The drift-checker is ' +
    'advisory-only; it does not mutate the DACP wire format and does not ' +
    'bypass the CAPCOM handoff. The companion paper on rate-distortion for ' +
    'deductive sources (arXiv:2604.15698) supplies the distortion-budget ' +
    'structure for the executable-code leg specifically.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'A semantic-channel bundle is a pydantic BaseModel with three fields: intent (str), data (dict), code (str). Capacity is computed as min(H(intent), H(data), H(code)) where H is the empirical Shannon entropy estimated from a sliding window. See arXiv:2604.16471.',
    }],
    ['typescript', {
      panelId: 'typescript',
      explanation: 'The Phase 747 primitive exports a Bundle = { intent: string; data: Record<string, unknown>; code: string } type and a capacity(bundle: Bundle): number function computing the weakest-leg bound. The drift-checker is a streaming predicate drifted(stream: Observable<Bundle>): Observable<DriftFinding>. See arXiv:2604.16471.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-rate-distortion-deductive-source',
      description: 'The rate-distortion-deductive-source concept supplies the R-D curve for the executable-code leg of the three-part bundle; the two concepts compose at the Phase 747 semantic-channel boundary',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-response-semantic-drift',
      description: 'Semantic-drift measurements on the intent leg extend the Drift-in-LLM-Systems vocabulary; the semantic-channel concept gives drift a formal capacity-theoretic meaning',
    },
    {
      type: 'dependency',
      targetId: 'mathematics-logarithmic-scales',
      description: 'Shannon entropy estimates on each leg of the bundle use log-scale mathematics; the Algebra wing\'s logarithmic-scales concept is a prerequisite',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
