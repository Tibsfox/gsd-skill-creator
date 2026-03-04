/**
 * Barrel exports for the hardware infrastructure educational pack.
 */

// Types
export {
  HardwareTierLevelSchema,
  MeshRoleSchema,
  TierCapabilitiesSchema,
  HardwareExampleSchema,
  HardwareTierSchema,
  NodeProfileSchema,
} from './types.js';
export type {
  HardwareTierLevel,
  MeshRole,
  TierCapabilities,
  HardwareExample,
  HardwareTier,
  NodeProfile,
  HardwareInfrastructurePack,
} from './types.js';

// Pack registry
export { hardwareInfrastructurePack } from './hardware-infrastructure-pack.js';

// Tiers
export { edgeTier, desktopTier, workstationTier, serverTier, cloudTier } from './tiers/index.js';

// Profiles
export { nodeProfiles } from './profiles/node-profiles.js';

// College enrichment
export { electronicsEnrichment } from './college/electronics-enrichment.js';
export { engineeringEnrichment } from './college/engineering-enrichment.js';
