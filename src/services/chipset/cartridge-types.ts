/**
 * Cartridge types — distributable muse knowledge bundles.
 *
 * A cartridge bundles: deep map (knowledge graph), story (narrative),
 * and chipset (muse configuration) into one distributable unit.
 */

import type { MuseId } from './muse-schema-validator.js';

export type TrustState = 'quarantine' | 'provisional' | 'trusted' | 'suspended';

export interface CartridgeManifest {
  name: string;
  version: string;
  author: string;
  description: string;
  trust: TrustState;
  muses: MuseId[];
  deepMap: string;
  story: string;
  chipset: string;
  dependencies: string[];
  tags: string[];
}

export interface DeepMap {
  nodes: DeepMapNode[];
  edges: DeepMapEdge[];
  entryPoints: string[];
}

export interface DeepMapNode {
  id: string;
  label: string;
  domain: string;
  depth: number;
  content: string;
}

export interface DeepMapEdge {
  source: string;
  target: string;
  relationship: 'requires' | 'extends' | 'relates' | 'contrasts';
}

export interface CartridgeBundle {
  manifest: CartridgeManifest;
  deepMap: DeepMap;
  story: string;
  chipset: object;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
