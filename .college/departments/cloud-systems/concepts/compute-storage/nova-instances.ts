import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const novaInstances: RosettaConcept = {
  id: 'cloud-nova-instances',
  name: 'Nova Instance Lifecycle',
  domain: 'cloud-systems',
  description:
    'Nova is the OpenStack compute service managing virtual machine instance lifecycle. ' +
    'Instance states: BUILD (provisioning), ACTIVE (running), SHUTOFF (powered off), ' +
    'SUSPENDED (memory saved), PAUSED (hypervisor paused), ERROR (failed). ' +
    'Flavors define resource allocations: m1.small = 1 vCPU, 2GB RAM, 20GB disk. ' +
    'Instance launch: nova selects hypervisor via scheduler (filter + weigh), copies Glance image, ' +
    'provisions Neutron port, then boots the instance. ' +
    'Live migration moves running instances between hypervisors without downtime (shared storage required). ' +
    'Cold migration: shut off instance, migrate, restart (works without shared storage). ' +
    'Console access: `openstack console url show instance` provides VNC/SPICE access without SSH. ' +
    'Instance metadata: cloud-init reads user-data and metadata from the Nova metadata API at ' +
    '169.254.169.254 to configure hostname, SSH keys, and run-scripts at first boot. ' +
    'Ephemeral disk is lost on deletion; use Cinder volumes for persistent data.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-keystone-auth',
      description: 'Nova API calls authenticate via Keystone; Nova uses the catalog to find Neutron and Glance',
    },
    {
      type: 'dependency',
      targetId: 'cloud-cinder-block-storage',
      description: 'Persistent instance data lives on Cinder volumes attached to Nova instances',
    },
  ],
  complexPlanePosition: {
    real: 0.82,
    imaginary: 0.20,
    magnitude: Math.sqrt(0.82 ** 2 + 0.20 ** 2),
    angle: Math.atan2(0.20, 0.82),
  },
};
