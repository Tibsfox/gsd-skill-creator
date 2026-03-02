import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cinderBlockStorage: RosettaConcept = {
  id: 'cloud-cinder-block-storage',
  name: 'Cinder Block Storage',
  domain: 'cloud-systems',
  description:
    'Cinder is the OpenStack block storage service providing persistent volumes to Nova instances. ' +
    'Volume lifecycle: create (empty or from snapshot/image), attach (appears as /dev/vdb, /dev/vdc...), ' +
    'format (mkfs.ext4), mount (/mnt/data), use, detach, delete. ' +
    'Volumes persist independently of instances -- detach from one instance and reattach to another. ' +
    'Volume types map to storage backends (Ceph, NFS, iSCSI, local LVM). ' +
    'Snapshots capture a point-in-time state: `openstack volume snapshot create my-snap --volume my-vol`. ' +
    'Snapshot chains: a snapshot references its parent volume; creating a volume from snapshot ' +
    'gives an independent copy. Volume transfer: `openstack volume transfer request create my-vol` ' +
    'generates a transfer ID and key for another project to claim the volume. ' +
    'Volume backups differ from snapshots: backups are stored in Swift (object storage), ' +
    'snapshots remain in Cinder. Quota management: each project has limits on total volume GB and count.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cloud-nova-instances',
      description: 'Cinder volumes attach to Nova instances as block devices for persistent storage',
    },
    {
      type: 'cross-reference',
      targetId: 'cloud-swift-glance-object-image',
      description: 'Cinder backups are stored in Swift; Glance images can be created from Cinder volume snapshots',
    },
  ],
  complexPlanePosition: {
    real: 0.80,
    imaginary: 0.22,
    magnitude: Math.sqrt(0.80 ** 2 + 0.22 ** 2),
    angle: Math.atan2(0.22, 0.80),
  },
};
