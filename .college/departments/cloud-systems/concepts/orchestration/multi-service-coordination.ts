import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const multiServiceCoordination: RosettaConcept = {
  id: 'cloud-multi-service-coordination',
  name: 'Multi-Service Coordination',
  domain: 'cloud-systems',
  description:
    'Launching a Nova instance triggers a cascade of cross-service coordination: ' +
    '(1) Nova validates the request and calls Keystone to verify the token; ' +
    '(2) Nova scheduler selects a hypervisor host; ' +
    '(3) Nova calls Glance to download the boot image; ' +
    '(4) Nova calls Neutron to allocate a port and assign an IP; ' +
    '(5) Nova calls Cinder if a boot volume is requested; ' +
    '(6) Nova instructs the hypervisor driver to boot the VM. ' +
    'Eventual consistency: Neutron port creation and Nova instance record may briefly be out of sync. ' +
    'The instance state machine (BUILD -> ACTIVE) reflects completion of all coordination steps. ' +
    'Dependency ordering in Heat templates reflects this graph -- nova.Server depends on neutron.Port ' +
    'which depends on neutron.Subnet which depends on neutron.Network. ' +
    'Cross-service error handling: if Neutron port allocation fails, Nova rolls back and marks instance ERROR. ' +
    'Idempotency: Heat stack updates re-apply only changed resources, re-using existing ones.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-heat-stack-templates',
      description: 'Heat automates multi-service coordination by expressing dependencies declaratively in HOT templates',
    },
    {
      type: 'cross-reference',
      targetId: 'cloud-runbook-structure',
      description: 'Manual deployments use runbooks to explicitly sequence cross-service coordination steps',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.52,
    magnitude: Math.sqrt(0.55 ** 2 + 0.52 ** 2),
    angle: Math.atan2(0.52, 0.55),
  },
};
