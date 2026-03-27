/**
 * Hardware Infrastructure Educational Pack — content registry.
 *
 * Provides 5 hardware tiers, node profiles, and lookup/matching capabilities.
 */

import type { HardwareTier, HardwareTierLevel, MeshRole, TierCapabilities, NodeProfile, HardwareInfrastructurePack } from './types.js';
import { edgeTier, desktopTier, workstationTier, serverTier, cloudTier } from './tiers/index.js';
import { nodeProfiles } from './profiles/node-profiles.js';

const allTiers: HardwareTier[] = [edgeTier, desktopTier, workstationTier, serverTier, cloudTier];

function getTier(level: HardwareTierLevel): HardwareTier {
  const tier = allTiers.find((t) => t.level === level);
  if (!tier) throw new Error(`Unknown tier level: ${level}`);
  return tier;
}

function getProfile(tierId: string): NodeProfile | undefined {
  return nodeProfiles.find((p) => p.tierId === tierId);
}

function getByMeshRole(role: MeshRole): HardwareTier[] {
  return allTiers.filter((t) => t.meshRole === role);
}

function matchHardware(specs: Partial<TierCapabilities>): HardwareTier | undefined {
  if (specs.gpuAccelerated === false && specs.alwaysOn === true) return edgeTier;
  if (specs.gpuAccelerated === true && specs.vramRange) {
    const vram = specs.vramRange;
    if (vram.includes('0-2') || vram.includes('0-4')) return edgeTier;
    if (vram.includes('8') || vram.includes('12') || vram.includes('16')) return desktopTier;
    if (vram.includes('24') || vram.includes('48') || vram.includes('96')) return workstationTier;
  }
  if (specs.maxModelParams === 'Unlimited') return cloudTier;
  if (specs.maxModelParams === 'N/A') return serverTier;
  return undefined;
}

export const hardwareInfrastructurePack: HardwareInfrastructurePack = {
  name: 'hardware-infrastructure',
  version: '1.0.0',
  tiers: allTiers,
  profiles: nodeProfiles,
  getTier,
  getProfile,
  getByMeshRole,
  matchHardware,
};
