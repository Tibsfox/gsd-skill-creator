import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const securityGroupsPolicies: RosettaConcept = {
  id: 'cloud-security-groups-policies',
  name: 'Security Groups & Policies',
  domain: 'cloud-systems',
  description:
    'Security groups are virtual firewalls applied at the instance port level in Neutron. ' +
    'Default posture: all inbound traffic is denied; all outbound traffic is permitted. ' +
    'Rules define permitted traffic: direction (ingress/egress), protocol (TCP/UDP/ICMP), ' +
    'port range, and source CIDR or another security group. ' +
    'Example rule: TCP ingress port 22, source 0.0.0.0/0 permits SSH from anywhere. ' +
    'Security group chaining: specify another security group as source instead of a CIDR -- ' +
    'allows instances in group A to talk to instances in group B without knowing their IPs. ' +
    'Port security: enabled by default, prevents IP/MAC spoofing on instance ports. ' +
    'To add a security group: `openstack security group create web-sg` then ' +
    '`openstack security group rule create --protocol tcp --dst-port 22 web-sg`. ' +
    'Multiple security groups can be applied to one port (rules union). ' +
    'Stateful tracking: established connections are tracked -- return traffic is permitted automatically.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-neutron-networking',
      description: 'Security groups attach to Neutron port objects on instance network interfaces',
    },
    {
      type: 'cross-reference',
      targetId: 'cloud-runbook-structure',
      description: 'Security group configuration changes should be documented as runbook procedure steps',
    },
  ],
  complexPlanePosition: {
    real: 0.78,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.78 ** 2 + 0.25 ** 2),
    angle: Math.atan2(0.25, 0.78),
  },
};
