/**
 * AGC pack type definitions.
 *
 * Defines the type system for the AGC educational pack's integration
 * with GSD-OS. Block definitions describe each AGC subsystem as a
 * composable block with typed inputs, outputs, and configuration.
 * Widget definitions describe dashboard visualization components.
 * The pack manifest declares the module boundary for install/remove.
 *
 * @module agc/pack/types
 */

// ============================================================================
// Block types
// ============================================================================

/** Valid AGC block type identifiers. */
export type AgcBlockType =
  | 'agc-cpu'
  | 'agc-dsky'
  | 'agc-peripheral-bus'
  | 'agc-executive-monitor'
  | 'agc-assembly-editor';

/** A typed input port on an AGC block. */
export interface BlockInput {
  readonly name: string;
  readonly type: string;
  readonly description: string;
}

/** A typed output port on an AGC block. */
export interface BlockOutput {
  readonly name: string;
  readonly type: string;
  readonly description: string;
}

/** Flexible configuration record for a block (varies per block type). */
export type BlockConfig = Record<string, unknown>;

/** A complete AGC block definition for the GSD-OS blueprint editor. */
export interface BlockDefinition {
  readonly block_type: AgcBlockType;
  readonly display_name: string;
  readonly category: string;
  readonly description: string;
  readonly inputs: readonly BlockInput[];
  readonly outputs: readonly BlockOutput[];
  readonly config: BlockConfig;
  readonly concept_refs: readonly string[];
  readonly doc_refs: readonly string[];
}

// ============================================================================
// Widget types
// ============================================================================

/** A dashboard widget definition for AGC telemetry visualization. */
export interface WidgetDefinition {
  readonly widget_id: string;
  readonly display_name: string;
  readonly data_source: string;
  readonly update_frequency_ms: number;
  readonly layout: {
    readonly width: number;
    readonly height: number;
    readonly default_position: string;
  };
  readonly rendering: Record<string, unknown>;
  readonly concept_refs: readonly string[];
  readonly description: string;
}

// ============================================================================
// Pack manifest types
// ============================================================================

/** The complete AGC educational pack manifest. */
export interface PackManifest {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly blocks: readonly BlockDefinition[];
  readonly widgets: readonly WidgetDefinition[];
  readonly skills: readonly string[];
  readonly standalone: boolean;
}

// ============================================================================
// Validation types
// ============================================================================

/** Result of validating a block definition. */
export type ValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly errors: string[] };
