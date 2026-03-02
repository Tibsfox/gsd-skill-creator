import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const requirementsTracing: RosettaConcept = {
  id: 'cloud-requirements-tracing',
  name: 'Requirements Tracing',
  domain: 'cloud-systems',
  description:
    'Requirements tracing links each requirement from its origin (stakeholder need) through design ' +
    'decisions to verification. Requirement format: CLOUD-{DOMAIN}-{NNN} (e.g., CLOUD-COMPUTE-001). ' +
    'Each Requirement has: id (unique identifier), text ("shall" statement), source (stakeholder need), ' +
    'verificationMethod (TAID type), status (RequirementStatus: pending/pass/fail), ' +
    'verifiedDate and verifiedBy (populated after verification). ' +
    'Trace matrix structure: rows are requirements, columns are design artifacts and test cases. ' +
    'Bidirectional tracing: forward traces from requirements to tests; backward traces from tests ' +
    'to requirements (coverage analysis). ' +
    'Requirements completeness: all Phase A requirements must be traced by PDR; ' +
    'all CDR requirements must have assigned verification methods and planned test cases. ' +
    'Derived requirements: lower-level "shall" statements derived from higher-level requirements, ' +
    'e.g., CLOUD-NETWORK-015 (latency) derives from CLOUD-PERF-001 (overall performance). ' +
    'Requirement status tracking: automated test suites update RequirementStatus to pass/fail.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-taid-verification',
      description: 'Each requirement in the trace matrix must have a TAID verification method assigned',
    },
    {
      type: 'dependency',
      targetId: 'cloud-se-phase-reviews',
      description: 'Requirements tracing is the primary artifact reviewed at each NASA SE phase gate',
    },
  ],
  complexPlanePosition: {
    real: 0.30,
    imaginary: 0.80,
    magnitude: Math.sqrt(0.30 ** 2 + 0.80 ** 2),
    angle: Math.atan2(0.80, 0.30),
  },
};
