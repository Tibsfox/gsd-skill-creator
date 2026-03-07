/**
 * Image-to-Mission (ITM) type system.
 *
 * Zod schemas for the image-to-mission pipeline that transforms visual input
 * into structured build specifications. Companion to the VTM pipeline —
 * where VTM starts from abstract vision, ITM starts from concrete pixels.
 *
 * Pipeline: Observe → Listen → Connect → Extract → Translate → Build → Document
 *
 * All schemas use Zod for runtime validation with inferred TypeScript types.
 */

import { z } from 'zod';

// ============================================================================
// Input Types
// ============================================================================

/** Valid image source types. */
export const IMAGE_SOURCES = ['upload', 'url', 'base64'] as const;

/**
 * Validates image input objects.
 *
 * Each image has a unique ID, source type, data payload, and optional
 * dimension/format metadata.
 */
export const ImageInputSchema = z.object({
  id: z.string().min(1),
  source: z.enum(IMAGE_SOURCES),
  data: z.string().min(1),
  metadata: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    format: z.string().min(1),
  }).optional(),
});

export type ImageInput = z.infer<typeof ImageInputSchema>;

/**
 * Validates creator-provided context objects.
 *
 * Structures the invisible layers that photographs can't capture:
 * - process: how the work was made
 * - intent: what the goal was
 * - constraints: what couldn't be controlled
 * - accidents: what emerged unexpectedly
 * - multipurpose: elements serving multiple functions
 * - freeform: anything else the creator wants to share
 */
export const CreatorContextSchema = z.object({
  process: z.string().optional(),
  intent: z.string().optional(),
  constraints: z.string().optional(),
  accidents: z.string().optional(),
  multipurpose: z.string().optional(),
  freeform: z.string().optional(),
});

export type CreatorContext = z.infer<typeof CreatorContextSchema>;

// ============================================================================
// Observation Types
// ============================================================================

/** Valid observation layer names, ordered by abstraction level. */
export const OBSERVATION_LAYERS = ['literal', 'spatial', 'relational', 'mood'] as const;

/**
 * Validates a single observation layer.
 *
 * Each layer captures observations at one level of abstraction with a
 * confidence score. Confidence should decrease from literal (highest)
 * to mood (lowest) — higher abstraction means more subjectivity.
 */
export const ObservationLayerSchema = z.object({
  layer: z.enum(OBSERVATION_LAYERS),
  observations: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
});

export type ObservationLayer = z.infer<typeof ObservationLayerSchema>;

/**
 * Validates a complete four-layer observation for one image.
 *
 * Contains all observation layers plus a raw narrative description
 * combining all layers into prose.
 */
export const ImageObservationSchema = z.object({
  imageId: z.string().min(1),
  layers: z.array(ObservationLayerSchema).min(1).max(4),
  rawDescription: z.string().min(1),
});

export type ImageObservation = z.infer<typeof ImageObservationSchema>;

// ============================================================================
// Parameter Types
// ============================================================================

/**
 * Validates color parameter objects.
 *
 * Not just hex codes — color relationships, temperature, contrast,
 * saturation, and how colors relate to each other.
 */
export const ColorParameterSchema = z.object({
  palette: z.array(z.object({
    name: z.string().min(1),
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    role: z.string().min(1),
  })).min(1),
  temperature: z.enum(['warm', 'cool', 'mixed']),
  contrast: z.number().min(0).max(1),
  saturation: z.number().min(0).max(1),
  relationships: z.string().min(1),
});

export type ColorParameter = z.infer<typeof ColorParameterSchema>;

/** Valid spatial arrangement patterns. */
export const ARRANGEMENT_PATTERNS = ['grid', 'spiral', 'radial', 'organic', 'linear'] as const;

/**
 * Validates geometry parameter objects.
 *
 * Captures shape, arrangement pattern, symmetry, proportions, and
 * mathematical constants (e.g., golden angle for organic spirals).
 */
export const GeometryParameterSchema = z.object({
  primaryShape: z.string().min(1),
  arrangement: z.enum(ARRANGEMENT_PATTERNS),
  symmetry: z.enum(['symmetric', 'asymmetric', 'approximate']),
  proportions: z.record(z.string(), z.number()),
  constants: z.record(z.string(), z.number()),
});

export type GeometryParameter = z.infer<typeof GeometryParameterSchema>;

/**
 * Validates material parameter objects.
 *
 * How surfaces interact with light — reflectivity, roughness,
 * transmission behavior, and applicable blend modes.
 */
export const MaterialParameterSchema = z.object({
  surfaces: z.array(z.object({
    name: z.string().min(1),
    reflectivity: z.number().min(0).max(1),
    roughness: z.number().min(0).max(1),
  })).min(1),
  lightInteraction: z.enum(['absorb', 'reflect', 'transmit', 'scatter']),
  blendModes: z.array(z.string()),
});

export type MaterialParameter = z.infer<typeof MaterialParameterSchema>;

/**
 * Validates feel parameter objects.
 *
 * Five quantified dimensions mapping atmosphere to 0-1 values.
 * Explicitly subjective — these are interpretive approximations,
 * not ground truth.
 */
export const FeelParameterSchema = z.object({
  energy: z.number().min(0).max(1),
  intimacy: z.number().min(0).max(1),
  order: z.number().min(0).max(1),
  handmade: z.number().min(0).max(1),
  ceremony: z.number().min(0).max(1),
});

export type FeelParameter = z.infer<typeof FeelParameterSchema>;

/**
 * Validates the complete extracted parameter set.
 *
 * Container for all four parameter categories plus a custom
 * record for domain-specific extras.
 */
export const ExtractedParametersSchema = z.object({
  color: ColorParameterSchema,
  geometry: GeometryParameterSchema,
  material: MaterialParameterSchema,
  feel: FeelParameterSchema,
  custom: z.record(z.string(), z.unknown()).default({}),
});

export type ExtractedParameters = z.infer<typeof ExtractedParametersSchema>;

// ============================================================================
// Connection Types
// ============================================================================

/** Valid connection types between observations. */
export const CONNECTION_TYPES = ['cross-image', 'visual-context', 'process-pattern'] as const;

/**
 * Validates a connection between observations and/or context.
 *
 * Connections are the synthesis output — patterns found across images,
 * between visual and contextual information, or in the creative process.
 */
export const ConnectionSchema = z.object({
  type: z.enum(CONNECTION_TYPES),
  description: z.string().min(1),
  elements: z.array(z.string()).min(1),
  significance: z.string().min(1),
});

export type Connection = z.infer<typeof ConnectionSchema>;

/**
 * Validates the unified understanding — the master synthesis object.
 *
 * Combines observations, context, connections, parameters, and the
 * process insight into a single typed object that downstream components
 * consume.
 */
export const UnifiedUnderstandingSchema = z.object({
  observations: z.array(ImageObservationSchema),
  context: CreatorContextSchema,
  connections: z.array(ConnectionSchema),
  parameters: ExtractedParametersSchema.optional(),
  processInsight: z.string().optional(),
});

export type UnifiedUnderstanding = z.infer<typeof UnifiedUnderstandingSchema>;

// ============================================================================
// Output Types
// ============================================================================

/** Valid target media for translation. */
export const TARGET_MEDIA = [
  'canvas', 'react', 'threejs', 'svg', 'css', 'design-spec', 'build-plan',
] as const;

export const TargetMediumSchema = z.enum(TARGET_MEDIA);

export type TargetMedium = z.infer<typeof TargetMediumSchema>;

/**
 * Validates a single build step.
 *
 * Each step has a number, instruction, clear done-state, and an
 * optional philosophy note explaining WHY this choice was made.
 */
export const BuildStepSchema = z.object({
  step: z.number().int().positive(),
  instruction: z.string().min(1),
  doneState: z.string().min(1),
  philosophyNote: z.string().optional(),
});

export type BuildStep = z.infer<typeof BuildStepSchema>;

/**
 * Validates a complete build specification for one target medium.
 *
 * Contains the target, parameters used, ordered build steps,
 * optional generated code, and the philosophy document.
 */
export const BuildSpecSchema = z.object({
  target: TargetMediumSchema,
  parameters: ExtractedParametersSchema,
  steps: z.array(BuildStepSchema).min(1),
  code: z.string().optional(),
  philosophyDocument: z.string().min(1),
});

export type BuildSpec = z.infer<typeof BuildSpecSchema>;

/**
 * Validates a complete transmission package.
 *
 * Self-contained handoff bundle: everything another mind needs to
 * continue the work without access to original images.
 */
export const TransmissionPackageSchema = z.object({
  version: z.string().min(1),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  sourceImages: z.array(z.string()),
  analysis: UnifiedUnderstandingSchema,
  buildSpec: BuildSpecSchema,
  reproducibility: z.object({
    canExecuteWithoutImages: z.boolean(),
    requiredContext: z.array(z.string()),
  }),
});

export type TransmissionPackage = z.infer<typeof TransmissionPackageSchema>;

// ============================================================================
// ITM_SCHEMAS convenience object
// ============================================================================

/**
 * Maps type name strings to their Zod schemas for programmatic
 * iteration and validation.
 */
export const ITM_SCHEMAS = {
  ImageInput: ImageInputSchema,
  CreatorContext: CreatorContextSchema,
  ObservationLayer: ObservationLayerSchema,
  ImageObservation: ImageObservationSchema,
  ColorParameter: ColorParameterSchema,
  GeometryParameter: GeometryParameterSchema,
  MaterialParameter: MaterialParameterSchema,
  FeelParameter: FeelParameterSchema,
  ExtractedParameters: ExtractedParametersSchema,
  Connection: ConnectionSchema,
  UnifiedUnderstanding: UnifiedUnderstandingSchema,
  BuildStep: BuildStepSchema,
  BuildSpec: BuildSpecSchema,
  TransmissionPackage: TransmissionPackageSchema,
} as const;
