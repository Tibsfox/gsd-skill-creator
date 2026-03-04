/**
 * Engineering department enrichment — adds Distributed Systems wing.
 */

import type { DepartmentEnrichment } from '../../audio-engineering/college/music-enrichment.js';

export const engineeringEnrichment: DepartmentEnrichment = {
  department: 'engineering',
  wing: 'Distributed Systems Infrastructure',
  description: 'Mesh topology, node roles, failover patterns, load balancing, and infrastructure scaling',
  concepts: ['mesh-topology', 'node-roles', 'failover', 'load-balancing', 'infrastructure-scaling'],
  trySessions: [
    {
      name: 'Design a Mesh',
      description: 'Arrange 3 hardware tiers into a mesh topology with routing rules',
    },
  ],
  crossReferences: [
    { department: 'electronics', topic: 'Hardware Infrastructure & Mesh Nodes' },
    { department: 'coding', topic: 'Network Programming' },
  ],
};
