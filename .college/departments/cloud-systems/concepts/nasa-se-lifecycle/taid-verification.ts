import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const taidVerification: RosettaConcept = {
  id: 'cloud-taid-verification',
  name: 'TAID Verification Methods',
  domain: 'cloud-systems',
  description:
    'NASA SP-6105 section 5.3 defines four verification methods (VerificationMethod type): ' +
    'Test (execute and observe outputs against acceptance criteria -- run the system and check results), ' +
    'Analysis (use models or simulations when testing is impractical -- calculate expected performance), ' +
    'Inspection (examine artifact against checklist without operating it -- code review, document audit), ' +
    'Demonstration (show correct performance without measurement -- show-and-witness to a reviewer). ' +
    'TAID is the acronym: Test, Analysis, Inspection, Demonstration. ' +
    'Each requirement must be assigned exactly one VerificationMethod before CDR review gate. ' +
    'Method selection criteria: Test when pass/fail is observable by running; Analysis when ' +
    'physical testing is destructive or impractical; Inspection when the artifact IS the evidence; ' +
    'Demonstration when live operation is the most convincing evidence. ' +
    'Verification matrix: rows are requirements (CLOUD-{DOMAIN}-{NNN}), columns are methods, ' +
    'cells show planned/completed status (RequirementStatus: pending/pass/fail).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-se-phase-reviews',
      description: 'Verification methods are assigned to requirements before CDR review gate',
    },
    {
      type: 'cross-reference',
      targetId: 'cloud-runbook-structure',
      description: 'Runbook procedure steps use Inspection and Demonstration verification in practice',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.35 ** 2 + 0.75 ** 2),
    angle: Math.atan2(0.75, 0.35),
  },
};
