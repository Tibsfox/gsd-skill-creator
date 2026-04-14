/**
 * Cartridge fork — clone a cartridge with a new id and forkOf provenance.
 *
 * Forking is how users take an existing cartridge (e.g. a system-trust
 * department from examples/) and make a user-trust copy they can edit. The
 * original's provenance is preserved via `provenance.forkOf`.
 */

import { CartridgeSchema, type Cartridge, type CartridgeTrust } from './types.js';

export interface ForkOptions {
  newId: string;
  newName?: string;
  newTrust?: CartridgeTrust;
  author?: string;
  buildSession?: string;
}

export function forkCartridge(source: Cartridge, options: ForkOptions): Cartridge {
  if (!options.newId || options.newId === source.id) {
    throw new Error('forkCartridge: newId is required and must differ from source.id');
  }

  const cloned: Cartridge = JSON.parse(JSON.stringify(source)) as Cartridge;
  cloned.id = options.newId;
  if (options.newName) cloned.name = options.newName;
  if (options.newTrust) cloned.trust = options.newTrust;
  if (options.author) cloned.author = options.author;

  cloned.provenance = {
    ...cloned.provenance,
    origin: 'fork',
    createdAt: new Date().toISOString(),
    forkOf: source.id,
    ...(options.buildSession ? { buildSession: options.buildSession } : {}),
  };

  return CartridgeSchema.parse(cloned);
}
