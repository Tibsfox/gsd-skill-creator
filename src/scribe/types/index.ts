/**
 * SCRIBE Build-Out shared types — barrel export.
 *
 * Component 00 (Wave 0). Components 01-09 import from here.
 *
 * Substrate boundaries are FROZEN once this file lands. The 8 success criteria
 * that touch types (closed `NodeType`/`ProvRelation`, exact `NAMESPACE_URI`,
 * cartridge manifest shape, round-trip metadata shape) are guarded by the
 * substrate-conformance tests in Component 09.
 *
 * @module scribe/types
 */

export type {
  // PROV-O graph
  NodeType,
  ProvRelation,
  SubType,
  ProvPayload,
  ProvNode,
  ProvEdge,
  ProvNodeByType,
  EdgeIdRecipe,
} from './prov.js';

export {
  NODE_TYPES,
  PROV_RELATIONS,
  KNOWN_SUB_TYPES,
  isActivity,
  isEntity,
  isAgent,
  hasSubType,
  edgeIdRecipe,
} from './prov.js';

export type {
  // Metadata namespace
  NamespaceUri,
  NamespaceVersion,
  GraphKind,
  SourceLanguage,
  ScribeEdgeRel,
  SourceProvenance,
  ScribeNode,
  ScribeEdge,
  LayoutAlgorithm,
  LayoutHint,
  ReverseDirection,
  RoundTripStamp,
  ScribeGraph,
  ScribeMetadata,
  RoundTripMetadata,
} from './metadata-namespace.js';

export {
  NAMESPACE_URI,
  NAMESPACE_VERSION,
  GRAPH_KINDS,
  SOURCE_LANGUAGES,
  SCRIBE_EDGE_RELS,
  NAMESPACE_PREFIX,
  NAMESPACE_DECLARATION_ATTR,
  namespaceDeclaration,
} from './metadata-namespace.js';

export type {
  // Cartridge manifest + composition
  CartridgeManifest,
  ComposesWith,
  ComposesAlgebra,
  CompositionGraph,
  CompositionNode,
  CompositionEdge,
  UnifiedCitationIndex,
  UnifiedCitation,
  CitationType,
  CitationPrimaryKey,
} from './cartridge-manifest.js';

// Errors (export class symbols + the ScribeError base)
export {
  ScribeError,
  NamespaceConformanceError,
  CartridgeCompositionError,
  CitationIndexError,
  PgRuntimeError,
  SvgValidationError,
  NetlistRenderError,
  isScribeError,
} from './errors.js';

export type {
  // Test fixtures
  SampleProvenanceCorpus,
  SampleCorpusOrigin,
  NodeTypeHistogram,
  RelationHistogram,
  CommitsSample,
  CommitsSampleEntry,
  CommitsSessionEntry,
  CorpusHistogram,
} from './test-fixtures.js';

export { computeCorpusHistogram } from './test-fixtures.js';
