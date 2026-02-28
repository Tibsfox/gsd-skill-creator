/**
 * Familiarity tier classification for content sources.
 *
 * Maps content source metadata to one of four familiarity tiers:
 * Home (most trusted) > Neighborhood > Town > Stranger (least trusted).
 *
 * Classification is deterministic: the same input always produces
 * the same tier. Unknown or missing metadata defaults to Stranger.
 *
 * @module staging/hygiene/familiarity
 */

import type { ContentSourceInfo, TrustClassification } from './trust-types.js';

/**
 * Classify a content source into a familiarity tier.
 *
 * Priority order (first match wins):
 * 1. Home -- origin 'local-project' or isProjectLocal: true
 * 2. Neighborhood -- origin 'local-user', isUserLocal: true, or repoId in trustedRepos
 * 3. Town -- origin 'known-repo' (not in trustedRepos)
 * 4. Stranger -- everything else (default)
 *
 * @param source - Content source metadata
 * @returns Classification with tier and human-readable reason
 */
export function classifyFamiliarity(source: ContentSourceInfo): TrustClassification {
  // 1. Home: current project content
  if (source.origin === 'local-project' || source.isProjectLocal === true) {
    return {
      tier: 'home',
      reason: source.isProjectLocal
        ? 'Content is from the current project (isProjectLocal)'
        : 'Content origin is local-project',
    };
  }

  // 2. Neighborhood: user's machine or trusted repos
  if (source.origin === 'local-user' || source.isUserLocal === true) {
    return {
      tier: 'neighborhood',
      reason: source.isUserLocal
        ? 'Content is from the user\'s local machine (isUserLocal)'
        : 'Content origin is local-user',
    };
  }

  if (
    source.repoId &&
    source.trustedRepos &&
    source.trustedRepos.length > 0 &&
    source.trustedRepos.includes(source.repoId)
  ) {
    return {
      tier: 'neighborhood',
      reason: `Repository "${source.repoId}" is in the trusted repos list`,
    };
  }

  // 3. Town: known but untrusted repos
  if (source.origin === 'known-repo') {
    return {
      tier: 'town',
      reason: source.repoId
        ? `Known repository "${source.repoId}" is not in the trusted repos list`
        : 'Content origin is known-repo but no repoId provided',
    };
  }

  // 4. Stranger: everything else (default)
  return {
    tier: 'stranger',
    reason: source.origin
      ? `Unrecognized or untrusted origin: "${source.origin}"`
      : 'No origin specified, defaulting to stranger',
  };
}
