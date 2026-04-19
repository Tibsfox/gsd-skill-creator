/**
 * MD-1 Shallow Learned Embeddings — feature flag.
 *
 * Exposes the `gsd-skill-creator.embeddings.enabled` flag. Default **OFF**:
 * no consumer reads the learned store, runtime cost is zero, and the
 * pre-MD-1 world is byte-identical (SC-MD1-01).
 *
 * The flag is resolved from:
 *   1. Explicit argument to `readEmbeddingsFlag` (test hook).
 *   2. Environment variable `GSD_SKILL_CREATOR_EMBEDDINGS_ENABLED`.
 *   3. Default `false`.
 *
 * @module embeddings/settings
 */

export const EMBEDDINGS_FLAG_KEY =
  'gsd-skill-creator.embeddings.enabled' as const;

export const EMBEDDINGS_FLAG_ENV =
  'GSD_SKILL_CREATOR_EMBEDDINGS_ENABLED' as const;

/**
 * Resolve the embeddings feature flag. Default `false`.
 *
 * @param override optional explicit value (takes precedence; test hook)
 * @param env optional environment object (defaults to `process.env`)
 */
export function readEmbeddingsFlag(
  override?: boolean,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  if (typeof override === 'boolean') return override;
  const raw = env[EMBEDDINGS_FLAG_ENV];
  if (typeof raw !== 'string') return false;
  const normalized = raw.trim().toLowerCase();
  return (
    normalized === '1' ||
    normalized === 'true' ||
    normalized === 'yes' ||
    normalized === 'on'
  );
}

/**
 * Immutable settings snapshot. Held by clients that want to freeze the
 * flag at construction time (so flag flips mid-run don't trigger partial
 * enablement).
 */
export interface EmbeddingsSettings {
  readonly enabled: boolean;
  readonly flagKey: typeof EMBEDDINGS_FLAG_KEY;
}

export function makeEmbeddingsSettings(
  override?: boolean,
): EmbeddingsSettings {
  return {
    enabled: readEmbeddingsFlag(override),
    flagKey: EMBEDDINGS_FLAG_KEY,
  };
}
