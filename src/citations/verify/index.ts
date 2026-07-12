/**
 * Claim-support verification barrel export.
 */

import {
  ResolverEngine,
  CrossRefAdapter,
  OpenAlexAdapter,
  SemanticScholarAdapter,
  DblpAdapter,
  PubMedAdapter,
  NasaNtrsAdapter,
  GitHubAdapter,
  ArchiveOrgAdapter,
  GenericWebAdapter,
} from '../resolver/index.js';

export {
  HeuristicClaimExtractor,
  VerificationStage,
  type Claim,
  type ClaimExtractor,
  type ClaimResolverPort,
  type ClaimSupport,
  type ClaimSupportReport,
  type ClaimSupportStats,
  type ClaimVerdict,
  type VerificationStageOptions,
} from './claim-support.js';

/**
 * Build a ResolverEngine with the default adapter cascade (scholarly APIs
 * first, then structural fallbacks). Adapters resolve over the network; with
 * no connectivity they return null and the harness reports `unresolved`.
 */
export function createDefaultResolver(): ResolverEngine {
  return new ResolverEngine([
    new CrossRefAdapter(),
    new OpenAlexAdapter(),
    new SemanticScholarAdapter(),
    new DblpAdapter(),
    new PubMedAdapter(),
    new NasaNtrsAdapter(),
    new GitHubAdapter(),
    new ArchiveOrgAdapter(),
    new GenericWebAdapter(),
  ]);
}
