/**
 * Registry for loaded cartridges — discovery and search.
 */

import type { Cartridge } from './types.js';

export class CartridgeRegistry {
  private cartridges = new Map<string, Cartridge>();

  register(cartridge: Cartridge): void {
    this.cartridges.set(cartridge.id, cartridge);
  }

  get(id: string): Cartridge | undefined {
    return this.cartridges.get(id);
  }

  list(): Cartridge[] {
    return Array.from(this.cartridges.values());
  }

  search(query: string): Cartridge[] {
    if (!query) return [];
    const q = query.toLowerCase();
    return this.list().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.chipset.vocabulary.some((v) => v.toLowerCase().includes(q)) ||
        c.deepMap.concepts.some((n) => n.name.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q)))
    );
  }
}
