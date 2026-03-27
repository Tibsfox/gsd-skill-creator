/**
 * Electronics department enrichment — adds Hardware Infrastructure wing.
 */

import type { DepartmentEnrichment } from '../../audio-engineering/college/music-enrichment.js';

export const electronicsEnrichment: DepartmentEnrichment = {
  department: 'electronics',
  wing: 'Hardware Infrastructure & Mesh Nodes',
  description: 'GPU architecture, VRAM management, power delivery, thermal design, and mesh node classification',
  concepts: ['gpu-architecture', 'vram-management', 'power-delivery', 'thermal-design', 'mesh-node-classification'],
  trySessions: [
    {
      name: 'Map Your Hardware',
      description: 'Classify your own hardware into one of the 5 mesh tiers and discover its role',
    },
  ],
  crossReferences: [
    { department: 'engineering', topic: 'Distributed Systems Infrastructure' },
    { department: 'coding', topic: 'ML Model Deployment' },
  ],
};
