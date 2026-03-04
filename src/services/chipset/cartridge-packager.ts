/**
 * Cartridge packager — bundle, validate, navigate, compose.
 *
 * Pure in-memory operations (no filesystem I/O in this layer).
 * Composition: nodes merge by ID (A wins conflicts), edges union,
 * stories concatenate, trust takes lower level.
 */

import type { CartridgeManifest, CartridgeBundle, DeepMap, DeepMapNode, ValidationResult, TrustState } from './cartridge-types.js';

const TRUST_RANK: Record<TrustState, number> = {
  suspended: 0,
  quarantine: 1,
  provisional: 2,
  trusted: 3,
};

const TRUST_FROM_RANK: TrustState[] = ['suspended', 'quarantine', 'provisional', 'trusted'];

export class CartridgePackager {
  validateManifest(manifest: CartridgeManifest): ValidationResult {
    const errors: string[] = [];
    if (!manifest.name) errors.push('manifest.name is required');
    if (!manifest.version) errors.push('manifest.version is required');
    if (!manifest.author) errors.push('manifest.author is required');
    if (!manifest.description) errors.push('manifest.description is required');
    return { valid: errors.length === 0, errors };
  }

  validateDeepMap(map: DeepMap): ValidationResult {
    if (map.nodes.length === 0) return { valid: true, errors: [] };

    const errors: string[] = [];
    const connected = new Set<string>();
    for (const edge of map.edges) {
      connected.add(edge.source);
      connected.add(edge.target);
    }

    for (const node of map.nodes) {
      if (!connected.has(node.id)) {
        errors.push(`orphan node: ${node.id} has no edges`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  getEntryPoints(bundle: CartridgeBundle): DeepMapNode[] {
    const entryIds = new Set(bundle.deepMap.entryPoints);
    return bundle.deepMap.nodes.filter(n => entryIds.has(n.id));
  }

  getNeighbors(map: DeepMap, nodeId: string): DeepMapNode[] {
    const neighborIds = new Set<string>();
    for (const edge of map.edges) {
      if (edge.source === nodeId) neighborIds.add(edge.target);
      if (edge.target === nodeId) neighborIds.add(edge.source);
    }
    return map.nodes.filter(n => neighborIds.has(n.id));
  }

  compose(a: CartridgeBundle, b: CartridgeBundle): CartridgeBundle {
    // Merge nodes: A wins on ID conflict
    const nodeMap = new Map<string, DeepMapNode>();
    for (const node of a.deepMap.nodes) nodeMap.set(node.id, node);
    for (const node of b.deepMap.nodes) {
      if (!nodeMap.has(node.id)) nodeMap.set(node.id, node);
    }

    // Edges: union
    const edges = [...a.deepMap.edges, ...b.deepMap.edges];

    // Entry points: union
    const entryPoints = [...new Set([...a.deepMap.entryPoints, ...b.deepMap.entryPoints])];

    // Stories: concatenate
    const story = `${a.story}\n\n---\n\n${b.story}`;

    // Trust: lower level
    const trustA = TRUST_RANK[a.manifest.trust];
    const trustB = TRUST_RANK[b.manifest.trust];
    const trust = TRUST_FROM_RANK[Math.min(trustA, trustB)];

    // Muses: union
    const muses = [...new Set([...a.manifest.muses, ...b.manifest.muses])];

    return {
      manifest: {
        ...a.manifest,
        name: `${a.manifest.name}+${b.manifest.name}`,
        trust,
        muses,
        dependencies: [...new Set([...a.manifest.dependencies, ...b.manifest.dependencies])],
        tags: [...new Set([...a.manifest.tags, ...b.manifest.tags])],
      },
      deepMap: {
        nodes: Array.from(nodeMap.values()),
        edges,
        entryPoints,
      },
      story,
      chipset: { ...a.chipset as Record<string, unknown>, ...b.chipset as Record<string, unknown> },
    };
  }
}
