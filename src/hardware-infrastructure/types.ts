/**
 * Type definitions for the hardware infrastructure educational pack.
 *
 * Defines the 5-tier hardware model with mesh role mappings,
 * node profiles, and capability classifications. Zod schemas
 * with .passthrough() for forward compatibility.
 */

import { z } from 'zod';

// ============================================================================
// Hardware tiers and mesh roles
// ============================================================================

export const HardwareTierLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export type HardwareTierLevel = z.infer<typeof HardwareTierLevelSchema>;

export const MeshRoleSchema = z.enum([
  'edge-inference',
  'local-inference',
  'heavy-inference',
  'storage-serving',
  'cloud-reasoning',
]);

export type MeshRole = z.infer<typeof MeshRoleSchema>;

// ============================================================================
// Tier capabilities
// ============================================================================

export const TierCapabilitiesSchema = z.object({
  maxModelParams: z.string().min(1),
  vramRange: z.string().optional(),
  inferenceLatency: z.enum(['high', 'medium', 'low']),
  alwaysOn: z.boolean(),
  gpuAccelerated: z.boolean(),
}).passthrough();

export type TierCapabilities = z.infer<typeof TierCapabilitiesSchema>;

// ============================================================================
// Hardware examples
// ============================================================================

export const HardwareExampleSchema = z.object({
  name: z.string().min(1),
  specs: z.string().min(1),
  bestFor: z.string().min(1),
}).passthrough();

export type HardwareExample = z.infer<typeof HardwareExampleSchema>;

// ============================================================================
// Hardware tier
// ============================================================================

export const HardwareTierSchema = z.object({
  id: z.string().min(1),
  level: HardwareTierLevelSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  meshRole: MeshRoleSchema,
  capabilities: TierCapabilitiesSchema,
  examples: z.array(HardwareExampleSchema).min(2),
  safetyNotes: z.array(z.string().min(1)).min(1),
}).passthrough();

export type HardwareTier = z.infer<typeof HardwareTierSchema>;

// ============================================================================
// Node profiles
// ============================================================================

export const NodeProfileSchema = z.object({
  tierId: z.string().min(1),
  meshRole: MeshRoleSchema,
  recommendedModels: z.array(z.string()),
  passRateExpectation: z.number().min(0).max(1),
  costPerToken: z.number().optional(),
}).passthrough();

export type NodeProfile = z.infer<typeof NodeProfileSchema>;

// ============================================================================
// Hardware infrastructure pack interface
// ============================================================================

export interface HardwareInfrastructurePack {
  name: 'hardware-infrastructure';
  version: string;
  tiers: HardwareTier[];
  profiles: NodeProfile[];
  getTier(level: HardwareTierLevel): HardwareTier;
  getProfile(tierId: string): NodeProfile | undefined;
  getByMeshRole(role: MeshRole): HardwareTier[];
  matchHardware(specs: Partial<TierCapabilities>): HardwareTier | undefined;
}
