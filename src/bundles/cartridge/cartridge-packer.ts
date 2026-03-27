/**
 * Packs a Cartridge into a CartridgeBundle for storage/transport.
 */

import type { Cartridge, CartridgeBundle, CartridgeValidation } from './types.js';
import { validateCartridge } from './cartridge-validator.js';

export class CartridgePacker {
  validate(cartridge: Cartridge): CartridgeValidation {
    return validateCartridge(cartridge);
  }

  pack(cartridge: Cartridge): CartridgeBundle {
    const validation = this.validate(cartridge);
    if (!validation.valid) {
      throw new Error(`Cannot pack invalid cartridge: ${validation.errors.join('; ')}`);
    }
    return {
      format: 'cartridge-v1',
      cartridge,
      packedAt: new Date().toISOString(),
    };
  }
}
