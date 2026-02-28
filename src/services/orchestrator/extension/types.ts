/**
 * Type definitions for GSD extension detection module.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - Extension capabilities (feature flags and detection info)
 * - Detection overrides (DI parameters for testing)
 *
 * All schemas use .passthrough() for forward compatibility with
 * new fields added in future versions.
 */

import { z } from 'zod';

// ============================================================================
// Extension Capabilities
// ============================================================================

/**
 * Zod schema for extension capability flags.
 *
 * Represents the detected capabilities of gsd-skill-creator:
 * - detected: Whether gsd-skill-creator is installed
 * - detectionMethod: Which strategy succeeded ('cli-binary', 'dist-directory', 'none')
 * - version: Version string if detected (null otherwise)
 * - features: Individual feature flags gated by detection
 */
export const ExtensionCapabilitiesSchema = z.object({
  detected: z.boolean(),
  detectionMethod: z.enum(['cli-binary', 'dist-directory', 'none']),
  version: z.string().nullable(),
  features: z.object({
    semanticClassification: z.boolean(),
    enhancedDiscovery: z.boolean(),
    enhancedLifecycle: z.boolean(),
    customSkillCreation: z.boolean(),
  }),
}).passthrough();

export type ExtensionCapabilities = z.infer<typeof ExtensionCapabilitiesSchema>;

// ============================================================================
// Detection Overrides
// ============================================================================

/**
 * Zod schema for detection override parameters.
 *
 * Used for dependency injection in tests, allowing callers to
 * bypass real filesystem/CLI probing:
 * - cliAvailable: Override CLI binary check result
 * - distPath: Override path for dist/ directory check
 * - cliVersion: Override version string from CLI
 */
export const DetectionOverridesSchema = z.object({
  cliAvailable: z.boolean().optional(),
  distPath: z.string().optional(),
  cliVersion: z.string().optional(),
});

export type DetectionOverrides = z.infer<typeof DetectionOverridesSchema>;
