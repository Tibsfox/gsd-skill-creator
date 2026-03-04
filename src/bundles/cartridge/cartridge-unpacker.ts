/**
 * Unpacks and validates a CartridgeBundle back into a Cartridge.
 */

import { CartridgeBundleSchema } from './types.js';
import type { Cartridge, CartridgeBundle, CartridgeValidation } from './types.js';
import { validateCartridge } from './cartridge-validator.js';

export class CartridgeUnpacker {
  verify(bundle: CartridgeBundle): CartridgeValidation {
    const parseResult = CartridgeBundleSchema.safeParse(bundle);
    if (!parseResult.success) {
      return {
        valid: false,
        errors: parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
        warnings: [],
      };
    }
    return validateCartridge(bundle.cartridge);
  }

  unpack(bundle: CartridgeBundle): Cartridge {
    const parseResult = CartridgeBundleSchema.safeParse(bundle);
    if (!parseResult.success) {
      throw new Error(`Corrupted cartridge bundle: ${parseResult.error.issues.map((e) => e.message).join('; ')}`);
    }
    const validation = validateCartridge(bundle.cartridge);
    if (!validation.valid) {
      throw new Error(`Invalid cartridge in bundle: ${validation.errors.join('; ')}`);
    }
    return bundle.cartridge;
  }
}
