/**
 * Data-Free MIA Attack concept — federated learning threat model (Lee et al. trio).
 *
 * Sources:
 *   - Data-Free Membership Inference Attack (arXiv:2604.19891, Lee et al.)
 *   - DECIFR: Targeted FL Exfiltration (arXiv:2604.19915, Lee et al.)
 *   - FL Hardware Assurance Survey (arXiv:2604.20020, Lee et al.)
 *
 * The three papers together constitute the canonical pre-rollout threat model for
 * any federated training path in gsd-skill-creator. 2604.19891 shows that gradient
 * interception alone is sufficient for training-data reconstruction, using
 * domain-specific priors, without auxiliary data. 2604.19915 (DECIFR) sharpens
 * this to targeted exfiltration of high-IP content at lower attack cost. 2604.20020
 * catalogues the full threat landscape and enumerates four mandatory mitigations:
 * differential privacy with sufficient noise budget, gradient clipping, secure
 * aggregation, and per-client training-data caps.
 *
 * The DoltHub federated-skill-economy BLOCK is enforced by this threat model:
 * no gradient exchange path may be opened until Phase 768 T1d (FL Pre-Rollout
 * Threat-Model Gate) has passed. Static skill sharing (publish/install via DoltHub)
 * and federated inference (ensemble, no gradient exchange) carry no FL risk.
 *
 * Milestone: v1.49.573 upstream-intelligence-pack-v1.44.
 *
 * @module departments/ai-computation/concepts/data-free-mia-attack
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~7*2pi/29, radius ~0.87 (security ring)
const theta = 7 * 2 * Math.PI / 29;
const radius = 0.87;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const dataFreeMiaAttack: RosettaConcept = {
  id: 'ai-computation-data-free-mia-attack',
  name: 'Data-Free MIA Attack',
  domain: 'ai-computation',
  description: 'The Lee et al. trio (arXiv:2604.19891, 2604.19915, 2604.20020) ' +
    'constitutes the canonical federated-learning threat model for gsd-skill-creator. ' +
    '2604.19891 (Data-Free MIA) demonstrates that gradient interception alone is ' +
    'sufficient for training-data reconstruction: domain-specific priors replace the ' +
    'auxiliary dataset requirement, making the attack practical in the real-world ' +
    'federated-skill-economy setting. 2604.19915 (DECIFR) sharpens the attack to ' +
    'targeted exfiltration of high-value content — skill logic, proprietary training ' +
    'data — at lower cost than full reconstruction. 2604.20020 (FL Hardware Assurance ' +
    'Survey) enumerates four mandatory mitigations before any gradient-exchange path ' +
    'may be opened: (1) differential privacy with sufficient noise budget, (2) ' +
    'gradient clipping at clip_norm < 1.0, (3) secure aggregation via cryptographic ' +
    'masking, (4) per-client training-data cap < 10% of global corpus. The BLOCK on ' +
    'DoltHub federated training is enforced by Phase 768 T1d, which validates design-' +
    'doc YAML frontmatter for all four mitigations before authorizing any FL path.',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'Phase 768 T1d exports a FlThreatModelGate with ' +
        'validate(designDoc: DesignDocYaml): GateResult. The gate checks for ' +
        'four required fields: dpNoiseBudget (number), gradientClipNorm (number < 1.0), ' +
        'secureAggregation (boolean, must be true), and perClientDataCapFraction ' +
        '(number < 0.1). Any missing or non-compliant field BLOCKS the FL path. ' +
        'See arXiv:2604.19891 + 2604.19915 + 2604.20020.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-four-tier-trust',
      description: 'The data-free MIA threat model is the blocking condition on the ' +
        'four-tier-trust T2 skill-intake stage: any community skill that originates ' +
        'from a federated training pipeline must have the MIA threat model addressed ' +
        'before T3 review can proceed.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-harness-as-object',
      description: 'The four mandatory MIA mitigations are harness-as-object ' +
        'instances: each mitigation is a testable, parameterized gate that the ' +
        'FL design doc must declare before the pre-rollout gate passes.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
