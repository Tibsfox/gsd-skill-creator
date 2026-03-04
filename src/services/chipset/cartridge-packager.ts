/**
 * Cartridge packager — bundle, validate, navigate, compose.
 *
 * Pure in-memory operations (no filesystem I/O in this layer).
 */

import type { CartridgeManifest, CartridgeBundle, DeepMap, DeepMapNode, ValidationResult } from './cartridge-types.js';

export class CartridgePackager {
  validateManifest(_manifest: CartridgeManifest): ValidationResult {
    throw new Error('Not implemented');
  }

  validateDeepMap(_map: DeepMap): ValidationResult {
    throw new Error('Not implemented');
  }

  getEntryPoints(_bundle: CartridgeBundle): DeepMapNode[] {
    throw new Error('Not implemented');
  }

  getNeighbors(_map: DeepMap, _nodeId: string): DeepMapNode[] {
    throw new Error('Not implemented');
  }

  compose(_a: CartridgeBundle, _b: CartridgeBundle): CartridgeBundle {
    throw new Error('Not implemented');
  }
}
