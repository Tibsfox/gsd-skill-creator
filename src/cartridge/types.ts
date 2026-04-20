/**
 * Unified Cartridge + Chipset schema (cartridge-forge).
 *
 * A Cartridge is a shippable, forkable, trust-scoped container holding one or
 * more Chipsets. A Chipset is a set of logic bound to a function (Amiga
 * chipset principle). This module replaces the two overloaded meanings of
 * "cartridge" in the codebase with one coherent discriminated union.
 *
 * The legacy content-cartridge schema in `src/bundles/cartridge/types.ts` is
 * preserved and routed through `legacy-adapter.ts`. New code imports from
 * `src/cartridge/`.
 */

import { z } from 'zod';
import {
  DeepMapSchema,
  StoryArcSchema,
} from '../bundles/cartridge/types.js';

// ============================================================================
// Trust + provenance
// ============================================================================

export const CartridgeTrustSchema = z.enum(['system', 'user', 'community']);
export type CartridgeTrust = z.infer<typeof CartridgeTrustSchema>;

export const CartridgeProvenanceSchema = z.object({
  origin: z.string().min(1),
  createdAt: z.string().min(1),
  sourceCommits: z.array(z.string()).optional(),
  researchGrounding: z.array(z.string()).optional(),
  forkOf: z.string().optional(),
  buildSession: z.string().optional(),
}).passthrough();

export type CartridgeProvenance = z.infer<typeof CartridgeProvenanceSchema>;

// ============================================================================
// Supporting schemas (cartridge-local — distinct from ME-1 mission manifest
// SkillEntry/AgentEntry which carry runtime tracking state).
// ============================================================================

export const CartridgeSkillEntrySchema = z.object({
  domain: z.string().min(1).optional(),
  description: z.string().min(1),
  triggers: z.array(z.string()).optional(),
  agent_affinity: z.union([z.string(), z.array(z.string())]).optional(),
}).passthrough();

export type CartridgeSkillEntry = z.infer<typeof CartridgeSkillEntrySchema>;

export const CartridgeAgentEntrySchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  is_capcom: z.boolean().optional(),
}).passthrough();

export type CartridgeAgentEntry = z.infer<typeof CartridgeAgentEntrySchema>;

export const CartridgeAgentsBlockSchema = z.object({
  topology: z.enum(['router', 'peer', 'pipeline']),
  router_agent: z.string().optional(),
  agents: z.array(CartridgeAgentEntrySchema).min(1),
}).passthrough();

export type CartridgeAgentsBlock = z.infer<typeof CartridgeAgentsBlockSchema>;

export const CartridgeTeamEntrySchema = z.object({
  description: z.string().min(1),
  agents: z.array(z.string()).min(1),
  use_when: z.string().optional(),
}).passthrough();

export type CartridgeTeamEntry = z.infer<typeof CartridgeTeamEntrySchema>;

export const CartridgeCustomizationSchema = z.object({
  rename_agents: z.boolean().optional(),
  replace_skills: z.boolean().optional(),
  swap_grove_types: z.boolean().optional(),
  remap_college_department: z.boolean().optional(),
  template_pattern: z.string().optional(),
}).passthrough();

export type CartridgeCustomization = z.infer<typeof CartridgeCustomizationSchema>;

export const GroveRecordTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
}).passthrough();

export type GroveRecordType = z.infer<typeof GroveRecordTypeSchema>;

export const FunctionalChipSchema = z.object({
  name: z.string().min(1),
  function: z.string().min(1),
}).passthrough();

export type FunctionalChip = z.infer<typeof FunctionalChipSchema>;

export const BenchmarkSchema = z.object({
  trigger_accuracy_threshold: z.number().min(0).max(1),
  test_cases_minimum: z.number().int().min(0),
  domains_covered: z.array(z.string()),
}).passthrough();

export type Benchmark = z.infer<typeof BenchmarkSchema>;

// ============================================================================
// Chipset kinds — discriminated union over 8 functional roles
// ============================================================================

// -- content --------------------------------------------------------------

export const ContentChipsetSchema = z.object({
  kind: z.literal('content'),
  deepMap: DeepMapSchema,
  story: StoryArcSchema,
}).passthrough();

export type ContentChipset = z.infer<typeof ContentChipsetSchema>;

// -- voice ----------------------------------------------------------------

export const VoiceChipsetSchema = z.object({
  kind: z.literal('voice'),
  vocabulary: z.array(z.string()).min(1),
  orientation: z.object({
    angle: z.number().min(0).max(2 * Math.PI),
    magnitude: z.number().min(0).max(1),
  }),
  voice: z.object({
    tone: z.string().min(1),
    style: z.enum(['narrative', 'technical', 'conversational', 'observational', 'welcoming']),
  }),
  museAffinity: z.array(z.string()).optional(),
}).passthrough();

export type VoiceChipset = z.infer<typeof VoiceChipsetSchema>;

// -- department -----------------------------------------------------------

export const DepartmentChipsetSchema = z.object({
  kind: z.literal('department'),
  skills: z.record(z.string(), CartridgeSkillEntrySchema),
  agents: CartridgeAgentsBlockSchema,
  teams: z.record(z.string(), CartridgeTeamEntrySchema),
  customization: CartridgeCustomizationSchema.optional(),
}).passthrough();

export type DepartmentChipset = z.infer<typeof DepartmentChipsetSchema>;

// -- grove ----------------------------------------------------------------

export const GroveChipsetSchema = z.object({
  kind: z.literal('grove'),
  namespace: z.string().min(1),
  record_types: z.array(GroveRecordTypeSchema).min(1),
}).passthrough();

export type GroveChipset = z.infer<typeof GroveChipsetSchema>;

// -- college --------------------------------------------------------------

export const CollegeChipsetSchema = z.object({
  kind: z.literal('college'),
  department: z.string().nullable(),
  concept_graph: z.object({
    read: z.boolean(),
    write: z.boolean(),
  }),
  try_session_generation: z.boolean(),
  learning_pathway_updates: z.boolean(),
  wings: z.array(z.string()),
}).passthrough();

export type CollegeChipset = z.infer<typeof CollegeChipsetSchema>;

// -- coprocessor ----------------------------------------------------------

export const CoprocessorChipsetSchema = z.object({
  kind: z.literal('coprocessor'),
  package: z.object({
    name: z.string().min(1),
    language: z.string().min(1),
  }),
  mcp: z.object({
    config: z.string().min(1),
  }).optional(),
  runtime: z.object({
    vram_budget_mb: z.number().int().positive().optional(),
    cuda_streams: z.number().int().positive().optional(),
  }).optional(),
  chips: z.array(FunctionalChipSchema).optional(),
}).passthrough();

export type CoprocessorChipset = z.infer<typeof CoprocessorChipsetSchema>;

// -- graphics -------------------------------------------------------------

/**
 * Graphics runtime chipset — GLSL / OpenGL / WebGL / Vulkan pipelines.
 *
 * Grounded in the GFX mission research at `/Research/GFX/` (2026-04-20):
 *   - M1 OpenGL, M2 GLSL (six-stage pipeline, CF-03), M3 WebGL,
 *     M4 Vulkan (validation layers, CF-13), M5 Pipeline (SPIR-V, CF-06;
 *     ANGLE/MoltenVK, CF-14/16).
 *
 * Analogous to `kind: coprocessor` but specialised for rendering: declares
 * an API + shader language pair, the pipeline stages in use, and the
 * shader source files that populate those stages. Optional `runtime` /
 * `toolchain` / `host` blocks mirror the quantitative knobs used by the
 * coprocessor chipset (e.g. `vram_budget_mb`).
 */
export const GraphicsShaderStageSchema = z.enum([
  'vertex',
  'tessellation-control',
  'tessellation-evaluation',
  'geometry',
  'fragment',
  'compute',
]);

export type GraphicsShaderStage = z.infer<typeof GraphicsShaderStageSchema>;

export const GraphicsChipsetSchema = z.object({
  kind: z.literal('graphics'),
  api: z.enum(['opengl', 'opengl-es', 'webgl', 'webgl2', 'vulkan']),
  api_version: z.string().regex(/^\d+\.\d+(\.\d+)?$/),
  shader_language: z.enum(['glsl', 'glsl-es', 'spirv', 'wgsl']),
  shader_language_version: z.string().regex(/^\d+\.\d+\d?$/),
  shader_stages: z.array(GraphicsShaderStageSchema).min(1),
  sources: z
    .array(
      z.object({
        stage: GraphicsShaderStageSchema,
        path: z.string().min(1),
        entry_point: z.string().default('main'),
      }),
    )
    .optional(),
  runtime: z
    .object({
      vram_budget_mb: z.number().int().positive().optional(),
      validation_layers: z.boolean().optional(),
      msaa_samples: z.number().int().positive().optional(),
      target_fps: z.number().int().positive().optional(),
    })
    .optional(),
  toolchain: z
    .object({
      glslang: z.boolean().optional(),
      spirv_cross: z.boolean().optional(),
      angle: z.boolean().optional(),
      moltenvk: z.boolean().optional(),
    })
    .optional(),
  host: z
    .object({
      kind: z.enum(['vite', 'native-c', 'native-rust', 'mcp']).optional(),
      entry: z.string().optional(),
      mcp_config: z.string().optional(),
    })
    .optional(),
}).passthrough();

export type GraphicsChipset = z.infer<typeof GraphicsChipsetSchema>;

// -- metrics --------------------------------------------------------------

export const MetricsChipsetSchema = z.object({
  kind: z.literal('metrics'),
  activation_tracking: z.object({
    triggers: z.boolean(),
    skill_loads: z.boolean(),
    agent_routes: z.boolean(),
    team_uses: z.boolean(),
  }),
  benchmarks: z.array(BenchmarkSchema),
  telemetry_sinks: z.array(z.enum(['grove', 'jsonl', 'stdout'])),
}).passthrough();

export type MetricsChipset = z.infer<typeof MetricsChipsetSchema>;

// -- evaluation -----------------------------------------------------------

export const EvaluationChipsetSchema = z.object({
  kind: z.literal('evaluation'),
  pre_deploy: z.array(z.string()),
  benchmark: BenchmarkSchema,
}).passthrough();

export type EvaluationChipset = z.infer<typeof EvaluationChipsetSchema>;

// ============================================================================
// Chipset discriminated union
// ============================================================================

export const ChipsetSchema = z.discriminatedUnion('kind', [
  ContentChipsetSchema,
  VoiceChipsetSchema,
  DepartmentChipsetSchema,
  GroveChipsetSchema,
  CollegeChipsetSchema,
  CoprocessorChipsetSchema,
  GraphicsChipsetSchema,
  MetricsChipsetSchema,
  EvaluationChipsetSchema,
]);

export type Chipset = z.infer<typeof ChipsetSchema>;

/** All chipset kinds in the initial taxonomy. Order used for lexicographic
 *  default sorting in CARTRIDGE-SPEC.md determinism rule. */
export const CHIPSET_KINDS = [
  'college',
  'content',
  'coprocessor',
  'department',
  'evaluation',
  'graphics',
  'grove',
  'metrics',
  'voice',
] as const;

export type ChipsetKind = (typeof CHIPSET_KINDS)[number];

// ============================================================================
// Top-level Cartridge
// ============================================================================

export const CartridgeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  author: z.string().min(1),
  description: z.string().min(1),
  trust: CartridgeTrustSchema,
  provenance: CartridgeProvenanceSchema,
  chipsets: z.array(ChipsetSchema).min(1),
  dependencies: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export type Cartridge = z.infer<typeof CartridgeSchema>;

// ============================================================================
// Helpers
// ============================================================================

/** Return the first chipset of a given kind, or undefined. */
export function findChipset<K extends ChipsetKind>(
  cartridge: Cartridge,
  kind: K,
): Extract<Chipset, { kind: K }> | undefined {
  return cartridge.chipsets.find((c) => c.kind === kind) as
    | Extract<Chipset, { kind: K }>
    | undefined;
}

/** Return every chipset of a given kind. */
export function findChipsets<K extends ChipsetKind>(
  cartridge: Cartridge,
  kind: K,
): Array<Extract<Chipset, { kind: K }>> {
  return cartridge.chipsets.filter((c) => c.kind === kind) as Array<
    Extract<Chipset, { kind: K }>
  >;
}
