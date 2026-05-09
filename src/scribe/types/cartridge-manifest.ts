/**
 * Cartridge manifest types for the foundational SCRIBE chipset.
 *
 * Substrate source-of-truth:
 *   - examples/cartridges/code-svg-hdl-bridge/manifest.json (example shape)
 *   - examples/cartridges/markup-lineage/cartridge.yaml (sibling shape)
 *   - src/coherent-functors/ (composition algebra these types compile against)
 *
 * Component 01 (foundational-cartridge) authors `cartridges/foundational/scribe/manifest.json`
 * conforming to `CartridgeManifest`. The composition graph in `composition-graph.json`
 * conforms to `CompositionGraph`.
 *
 * @module scribe/types/cartridge-manifest
 */

/**
 * Top-level cartridge manifest. Matches the shape T3's `manifest.json` ships,
 * with foundational-chipset extensions for `composes`.
 */
export interface CartridgeManifest {
  /** Cartridge name (kebab-case slug). */
  readonly name: string;
  /** Semver. The foundational chipset uses the milestone version, e.g. '1.49.621'. */
  readonly version: string;
  /** Discriminator: 'cartridge' for member cartridges, 'chipset' for composites. */
  readonly kind: 'cartridge' | 'chipset';
  /** OPTIONAL track marker (T1, T2, T3, T4, T5) for member cartridges. Absent for chipsets. */
  readonly track?: string;
  /** Mission slug (e.g., 'scribe'). */
  readonly mission: string;
  /** Milestone tag (e.g., 'v1.49.621'). */
  readonly milestone: string;
  /** OPTIONAL wave number within the mission. */
  readonly wave?: number;
  /** Free-form summary, ≤300 chars recommended. */
  readonly summary: string;
  /** SPDX license identifier (e.g., 'Apache-2.0'). */
  readonly license: string;
  /** OPTIONAL. SCRIBE namespace URI (when this cartridge produces metadata). */
  readonly scribe_namespace?: string;
  /** OPTIONAL. Other cartridges this one composes with (member-cartridge declaration). */
  readonly composes_with?: ReadonlyArray<string>;
  /** OPTIONAL (foundational chipset only). Member cartridges this chipset composes. */
  readonly composes?: ReadonlyArray<string>;
  /** OPTIONAL. Foundational role marker. Component 01 sets `role: 'foundational'`. */
  readonly role?: 'foundational' | 'application' | 'utility';
  /** OPTIONAL self-demo result and evidence. */
  readonly self_demo_status?: 'PASS' | 'FAIL' | 'N/A';
  readonly self_demo_evidence?: string;
  /** OPTIONAL deliverables summary. */
  readonly deliverables?: Record<string, unknown>;
  /** OPTIONAL substrate decisions documented at manifest level. */
  readonly substrate_decisions?: Record<string, unknown>;
  /** OPTIONAL list of explicitly-deferred capabilities. */
  readonly deferred?: ReadonlyArray<string>;
  /** OPTIONAL runtime dependencies (e.g., persistence-enabled mode for Component 05). */
  readonly runtime_dependencies?: ReadonlyArray<string>;
}

/**
 * `composes_with` declaration narrowed to a single edge (consumer reads
 * a member cartridge's manifest and produces a list of these).
 */
export interface ComposesWith {
  readonly source: string;
  readonly target: string;
}

/**
 * Composition algebra hint — names which categorical operation joins two
 * cartridges. Substrate decision: thin foundational chipset = categorical sum
 * (per `src/coherent-functors/composition.ts`).
 *
 * `directSum` is the operation `compose()` uses when both inputs declare
 * `directSum` witnesses. Other operations are reserved for future expansion.
 */
export type ComposesAlgebra =
  | 'sum' // categorical sum (default for the foundational chipset)
  | 'product' // reserved
  | 'composition' // morphism composition g ∘ f
  | 'directSum'; // direct-sum decomposition

/**
 * Machine-readable composition DAG output by Component 01 to
 * `cartridges/foundational/scribe/composition-graph.json`.
 *
 * The DAG is acyclic — substrate-conformance test
 * (`cartridge-composes-with-graph.test.ts`, Component 09) asserts this.
 */
export interface CompositionGraph {
  readonly version: '1.0.0';
  readonly chipset: string;
  readonly milestone: string;
  /** All cartridges (nodes) participating in the composition. */
  readonly nodes: ReadonlyArray<CompositionNode>;
  /** All composes-with edges between cartridges. */
  readonly edges: ReadonlyArray<CompositionEdge>;
  /** OPTIONAL. The categorical operation that joins the chipset (default 'sum'). */
  readonly algebra?: ComposesAlgebra;
}

export interface CompositionNode {
  /** Cartridge name. */
  readonly name: string;
  /** Member-cartridge track (T1..T5). */
  readonly track: string;
  /** Cartridge version when included in the chipset. */
  readonly version: string;
}

export interface CompositionEdge {
  /** Source cartridge name. */
  readonly from: string;
  /** Target cartridge name. */
  readonly to: string;
  /** OPTIONAL operation kind for this specific edge. */
  readonly via?: ComposesAlgebra;
}

/**
 * The unified citation index shape (Component 01 output to
 * `.planning/missions/v1-49-621-scribe/CITATIONS.json`).
 *
 * Schema-versioned per substrate decision: T1's `citations.json` schema is
 * canonical (`https://schemas.gsd.tools/cartridge/citations/v1.json`).
 * The unified index extends that schema with `citedByTracks` + `loadBearingFor`.
 */
export interface UnifiedCitationIndex {
  readonly version: '1.0.0';
  readonly milestone: string;
  /** Total unique sources after cross-track dedup. */
  readonly totalUniqueSources: number;
  readonly sources: ReadonlyArray<UnifiedCitation>;
}

export type CitationType =
  | 'spec'
  | 'paper'
  | 'book'
  | 'repo'
  | 'web'
  | 'standard'
  | 'thesis'
  | 'report';

/** Primary keys used for dedup (in priority order). */
export type CitationPrimaryKey =
  /** `arxiv:<id>` */
  | `arxiv:${string}`
  /** `doi:<id>` */
  | `doi:${string}`
  /** `w3c:<shortname>:<version>` */
  | `w3c:${string}:${string}`
  /** Author + year + title-hash fallback. */
  | `fallback:${string}:${number}:${string}`;

export interface UnifiedCitation {
  /** Stable identifier (kebab-case). */
  readonly id: string;
  readonly type: CitationType;
  readonly primaryKey: CitationPrimaryKey;
  readonly authors?: ReadonlyArray<string>;
  readonly title: string;
  readonly year?: number;
  readonly venue?: string;
  readonly url?: string;
  /** Tracks (T1..T5) that cite this source. */
  readonly citedByTracks: ReadonlyArray<string>;
  /** OPTIONAL CAP-IDs from VISION.md whose substrate decisions this source informs. */
  readonly loadBearingFor?: ReadonlyArray<string>;
  /** OPTIONAL extra fields preserved from the per-track citation source. */
  readonly extras?: Record<string, unknown>;
}
