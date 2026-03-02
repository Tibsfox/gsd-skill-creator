import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const swiftGlanceObjectImage: RosettaConcept = {
  id: 'cloud-swift-glance-object-image',
  name: 'Swift Object Storage & Glance Image Registry',
  domain: 'cloud-systems',
  description:
    'Swift is the OpenStack object storage service: stores arbitrary data as objects in containers. ' +
    'Object store hierarchy: Account > Container > Object. Container is like a bucket; object is a file. ' +
    'Swift REST API: PUT /v1/AUTH_project/container/object uploads data; GET retrieves. ' +
    'Objects have arbitrary metadata, user-defined content-type, and auto-generated ETag (MD5 hash). ' +
    'Eventually consistent: writes propagate across replicas (typically 3x replication). ' +
    'Glance is the image registry service: stores and catalogs VM images for Nova to boot. ' +
    'Image formats: QCOW2 (thin-provisioned, supports snapshots), raw (fastest, no overhead), ' +
    'VMDK (VMware), OVA (multi-disk). ' +
    'Image upload: `openstack image create --file cirros.img --disk-format qcow2 --container-format bare cirros`. ' +
    'Image properties: min-disk, min-ram, architecture, os-type enforce boot requirements. ' +
    'Public images (visibility=public) are shared across all projects; private images are project-scoped.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cloud-nova-instances',
      description: 'Nova boots instances from images registered in Glance; image ID is required at launch',
    },
    {
      type: 'cross-reference',
      targetId: 'cloud-cinder-block-storage',
      description: 'Cinder volume backups are stored as Swift objects; Glance can use Swift as its backend',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.28,
    magnitude: Math.sqrt(0.75 ** 2 + 0.28 ** 2),
    angle: Math.atan2(0.28, 0.75),
  },
};
