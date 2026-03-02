import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const horizonDashboard: RosettaConcept = {
  id: 'cloud-horizon-dashboard',
  name: 'Horizon Dashboard',
  domain: 'cloud-systems',
  description:
    'Horizon is the OpenStack web dashboard service: a Django web application providing graphical ' +
    'access to all other OpenStack services. ' +
    'Project scope: regular users see resources in their project only. ' +
    'Admin scope: admin users see resources across all projects via the Admin menu. ' +
    'Key panels: Compute (instances, images, keypairs), Network (networks, routers, security groups, ' +
    'floating IPs), Volumes (Cinder volumes and snapshots), Object Store (Swift containers), ' +
    'Orchestration (Heat stacks). ' +
    'Quota display: Project > Compute > Overview shows current usage vs limits for instances, ' +
    'vCPUs, RAM, floating IPs, and volumes. ' +
    'Network Topology visualizer: graphically shows networks, subnets, routers, and connected instances. ' +
    'Horizon authenticates through Keystone using the same token mechanism as the CLI. ' +
    'Customization: Horizon supports theme overrides and can display additional dashboards via plugins. ' +
    'API access: Horizon provides an "API Access" tab listing all service endpoints in the catalog.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-keystone-auth',
      description: 'Horizon authenticates users through Keystone and scopes sessions to the selected project',
    },
    {
      type: 'cross-reference',
      targetId: 'cloud-multi-service-coordination',
      description: 'Horizon aggregates data from all services (nova, neutron, cinder, glance, heat) in one interface',
    },
  ],
  complexPlanePosition: {
    real: 0.62,
    imaginary: 0.42,
    magnitude: Math.sqrt(0.62 ** 2 + 0.42 ** 2),
    angle: Math.atan2(0.42, 0.62),
  },
};
