/**
 * Zod validation schemas for sc-git configuration.
 *
 * Provides runtime validation for ScGitConfig objects,
 * ensuring config files are well-formed before use.
 */

import { z } from 'zod';
import type { ScGitConfig } from './types.js';

/**
 * Zod schema for ScGitConfig validation.
 * Matches the ScGitConfig interface in types.ts exactly.
 */
export const ScGitConfigSchema = z.object({
  repo: z.string().min(1),
  upstream: z.string().url(),
  origin: z.string().url(),
  devBranch: z.string().default('dev'),
  mainBranch: z.string().default('main'),
  gates: z.object({
    mergeToMain: z.boolean(),
    prToUpstream: z.boolean(),
  }),
  worktreeRoot: z.string().min(1),
  installedAt: z.string().datetime(),
  lastSync: z.string().datetime().nullable(),
});

/**
 * Validate an unknown value as a ScGitConfig.
 *
 * @param data - Unknown value to validate
 * @returns Success with typed config, or failure with error messages
 */
export function validateScGitConfig(
  data: unknown,
): { success: true; config: ScGitConfig } | { success: false; errors: string[] } {
  const result = ScGitConfigSchema.safeParse(data);
  if (result.success) {
    return { success: true, config: result.data as ScGitConfig };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}
