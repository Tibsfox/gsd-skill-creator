// Phase 46: Alternative Discoverer — Public API
export type {
  AlternativeReport,
  RelationshipType,
  MigrationEffort,
  ApiCompatibility,
} from './types.js';
export { SuccessorDetector, detectSuccessors } from './successor-detector.js';
export { ForkFinder, findForks } from './fork-finder.js';
export { EquivalentSearcher, searchEquivalents } from './equivalent-searcher.js';
export { InternalizationFlagger, flagInternalizationCandidates } from './internalization-flagger.js';
export type { UsageAnalysisInput } from './internalization-flagger.js';
export { DiscoveryOrchestrator, discoverAlternatives } from './discovery-orchestrator.js';
export type { DiscoveryReport } from './discovery-orchestrator.js';
