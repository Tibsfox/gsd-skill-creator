import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sePhaseReviews: RosettaConcept = {
  id: 'cloud-se-phase-reviews',
  name: 'NASA SE Phase Reviews',
  domain: 'cloud-systems',
  description:
    'NASA SP-6105 defines 7 lifecycle phases for cloud operations (SEPhaseId types): ' +
    'pre-a (Concept Studies -- Architecture Assessment, ends at MCR), ' +
    'a (Technology Development -- Requirements + SEMP baseline, ends at SRR), ' +
    'b (Preliminary Design -- service design + V&V plan, ends at PDR), ' +
    'c (Final Design -- Kolla-Ansible configs + certificates, ends at CDR), ' +
    'd (Integration & Test -- integration tests + V&V report, ends at SIR), ' +
    'e (Operations & Sustainment -- runbooks + monitoring, ends at ORR), ' +
    'f (Closeout -- migration + lessons learned, ends at DR). ' +
    'Review gates (NASAReviewGate): MCR (Mission Concept), SRR (System Requirements), ' +
    'SDR (System Definition), PDR (Preliminary Design), CDR (Critical Design), ' +
    'SIR (System Integration), ORR (Operational Readiness), FRR (Flight Readiness), ' +
    'PLAR (Post-Launch Assessment), DR (Disposal). ' +
    'Each gate has entrance criteria (what must be ready before the review) and ' +
    'exit criteria (what the review board must approve to proceed to next phase).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-taid-verification',
      description: 'TAID verification methods must be assigned to requirements before CDR gate',
    },
    {
      type: 'dependency',
      targetId: 'cloud-requirements-tracing',
      description: 'Requirements tracing is a mandatory artifact for every phase review gate',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.35 ** 2 + 0.75 ** 2),
    angle: Math.atan2(0.75, 0.35),
  },
};
