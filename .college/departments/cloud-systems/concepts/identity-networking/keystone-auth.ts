import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const keystoneAuth: RosettaConcept = {
  id: 'cloud-keystone-auth',
  name: 'Keystone Authentication',
  domain: 'cloud-systems',
  description:
    'Keystone is the OpenStack identity service: it issues scoped tokens that grant access to other services. ' +
    'Token issuance: POST /v3/auth/tokens with project scope returns a token in the X-Subject-Token header. ' +
    'Scoped tokens include a service catalog listing endpoints for nova, neutron, cinder, glance, swift, ' +
    'heat, and horizon. Endpoint types: public (external clients), internal (service-to-service), ' +
    'admin (administrative operations). Project isolation: each token is scoped to one project -- ' +
    'resources in one project are not visible to another by default. ' +
    'Token lifetime defaults to 1 hour; catalog shows expiry timestamp. ' +
    'Service authentication: every nova/neutron/cinder API call validates the token with keystone. ' +
    'The service catalog eliminates hardcoded endpoint URLs -- services discover their peers via catalog. ' +
    'Application credentials allow long-lived tokens without user password exposure.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-neutron-networking',
      description: 'Neutron network operations require a valid scoped token from Keystone',
    },
    {
      type: 'dependency',
      targetId: 'cloud-nova-instances',
      description: 'Nova instance lifecycle operations authenticate against Keystone for every API call',
    },
  ],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.85 ** 2 + 0.15 ** 2),
    angle: Math.atan2(0.15, 0.85),
  },
};
