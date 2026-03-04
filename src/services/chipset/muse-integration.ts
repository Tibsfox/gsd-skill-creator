/**
 * Muse architecture integration — end-to-end pipeline wiring.
 *
 * Connects: Schema → Loader → PlaneEngine → Visibility → Forker → Willow
 * With: Cedar (integrity), Cartridge (distribution), Sandbox (isolation)
 *
 * This is the top-level entry point for the muse system.
 */

import { MuseLoader } from './muse-loader.js';
import { MusePlaneEngine } from './muse-plane-engine.js';
import { VisibilityEngine } from './muse-visibility-engine.js';
import { EphemeralForker } from './ephemeral-forker.js';
import { CedarEngine } from './cedar-engine.js';
import { WillowEngine } from './willow-engine.js';
import { CartridgePackager } from './cartridge-packager.js';
import { SandboxManager } from './sandbox-manager.js';
import type { MuseRegistry } from './muse-loader.js';
import type { MuseId } from './muse-schema-validator.js';
import type { ForkRequest } from './muse-forking.js';
import type { WillowContext, WillowRendering } from './willow-types.js';

export interface MuseSystem {
  loader: MuseLoader;
  plane: MusePlaneEngine;
  visibility: VisibilityEngine;
  forker: EphemeralForker;
  cedar: CedarEngine;
  willow: WillowEngine;
  cartridge: CartridgePackager;
  sandbox: SandboxManager;
  registry: MuseRegistry;
}

export function createMuseSystem(configs: Record<string, unknown>[]): MuseSystem {
  const loader = new MuseLoader();
  const muses = loader.loadAll(configs);
  const registry = loader.createRegistry(muses);

  const plane = new MusePlaneEngine();
  const visibility = new VisibilityEngine();
  const forker = new EphemeralForker(registry);
  const cedar = new CedarEngine();
  const willow = new WillowEngine();
  const cartridge = new CartridgePackager();
  const sandbox = new SandboxManager();

  return { loader, plane, visibility, forker, cedar, willow, cartridge, sandbox, registry };
}

export function consultWithDisclosure(
  system: MuseSystem,
  request: ForkRequest,
  context: WillowContext,
): WillowRendering {
  const level = system.willow.inferDepth(context);
  const merged = system.forker.consult(request);

  // Record the consultation in Cedar's timeline
  system.cedar.record({
    timestamp: new Date().toISOString(),
    source: 'muse-system',
    category: 'observation',
    content: `Consulted ${merged.contributingMuses.join(', ')} via ${merged.strategy}`,
    references: [],
  });

  return system.willow.wrapMergedResult(merged, level);
}
