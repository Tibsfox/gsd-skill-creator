/**
 * Citation management module barrel export.
 *
 * Single entry point for the citation management system. Groups exports
 * by layer: types, extractor, resolver, store, generator, learn
 * integration, discovery, and dashboard.
 */

// Types
export * from './types/index.js';

// Extractor
export { extractCitations } from './extractor/index.js';

// Resolver
export { ResolverEngine } from './resolver/index.js';
export type { ResolverAdapter, SearchOptions } from './resolver/index.js';
export type { CitationStorePort } from './resolver/index.js';

// Store
export { CitationStore } from './store/index.js';
export { ProvenanceTracker } from './store/index.js';

// Generator
export { BibliographyFormatter } from './generator/index.js';
export { AttributionReport } from './generator/index.js';
export { IntegrityAuditor } from './generator/index.js';

// Learn Integration
export { CitationLearnHook } from './learn-integration/index.js';

// Discovery
export { DiscoverySearchEngine, CitationGraph } from './discovery/index.js';

// Dashboard
export { renderCitationPanel, renderProvenanceViewer, renderIntegrityBadge } from './dashboard/index.js';
