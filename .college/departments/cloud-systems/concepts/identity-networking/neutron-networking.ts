import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const neutronNetworking: RosettaConcept = {
  id: 'cloud-neutron-networking',
  name: 'Neutron Networking',
  domain: 'cloud-systems',
  description:
    'Neutron is the OpenStack networking service providing networks, subnets, routers, and security groups. ' +
    'Provider networks connect to external infrastructure (data center fabric, external internet). ' +
    'Tenant (project) networks are private: isolated VLAN or VXLAN segments per project. ' +
    'Subnets define IP address ranges (CIDR notation) within a network -- e.g., 192.168.100.0/24. ' +
    'Routers connect subnets to each other and to external networks via gateway ports. ' +
    'Floating IPs are external IPs associated with instance private IPs via NAT on the router. ' +
    'VLAN segmentation: each project network can have a dedicated VLAN ID (e.g., 100-4094). ' +
    'VXLAN overlay tunnels: allow more than 4096 tenant networks by using 24-bit VNI identifiers. ' +
    'Network topology: admin creates external network, tenant creates private network + router + ' +
    'subnet, router connects tenant to external, floating IP enables inbound access.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-keystone-auth',
      description: 'Neutron API calls require Keystone authentication tokens and use the catalog endpoint',
    },
    {
      type: 'dependency',
      targetId: 'cloud-security-groups-policies',
      description: 'Networks alone are not sufficient -- security groups control which traffic is permitted',
    },
  ],
  complexPlanePosition: {
    real: 0.82,
    imaginary: 0.20,
    magnitude: Math.sqrt(0.82 ** 2 + 0.20 ** 2),
    angle: Math.atan2(0.20, 0.82),
  },
};
