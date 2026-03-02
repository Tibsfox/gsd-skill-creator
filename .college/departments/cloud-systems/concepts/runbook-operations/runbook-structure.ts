import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const runbookStructure: RosettaConcept = {
  id: 'cloud-runbook-structure',
  name: 'Runbook Structure',
  domain: 'cloud-systems',
  description:
    'A runbook is a self-contained executable procedure for cloud operations. ' +
    'Runbook ID pattern: RB-{SERVICE}-{NNN} (e.g., RB-NOVA-001 for Nova-related procedure). ' +
    'Required fields: id, title, sePhaseRef (NPR 7123.1 section), lastVerified (ISO 8601 date), ' +
    'verificationMethod (automated or manual), preconditions (system state required before starting), ' +
    'steps (ordered ProcedureStep array), verification (steps to confirm success), ' +
    'rollback (steps to undo if needed), relatedRunbooks (cross-references). ' +
    'Preconditions must be explicitly checked before execution: "OpenStack environment running", ' +
    '"admin credentials available", "target project exists". ' +
    'Verification section differs from steps: verification confirms the procedure succeeded ' +
    'after all steps complete (e.g., "openstack server list shows instance ACTIVE"). ' +
    'Rollback section enables safe recovery: each destructive step should have a corresponding ' +
    'rollback action. Runbooks should be idempotent when possible -- running twice should not ' +
    'break a correctly deployed system.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-procedure-execution',
      description: 'Runbook structure defines the container; ProcedureStep is the unit of execution within it',
    },
    {
      type: 'cross-reference',
      targetId: 'cloud-taid-verification',
      description: 'Runbook verification steps use TAID Inspection and Demonstration methods',
    },
  ],
  complexPlanePosition: {
    real: 0.70,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.70 ** 2 + 0.35 ** 2),
    angle: Math.atan2(0.35, 0.70),
  },
};
