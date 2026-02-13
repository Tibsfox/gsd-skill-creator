/**
 * Engine definition type system for the team-as-engine framework.
 *
 * Defines Zod schemas and TypeScript types for engine domains, budget
 * allocation, message port declarations, 32-bit signal masks, and
 * complete engine definitions. These types model specialized coprocessor
 * engines (context, render, io, router) with domain ownership boundaries.
 *
 * The signal mask partitions a 32-bit space:
 * - Bits 0-15: system-reserved (coprocessor kernel)
 * - Bits 16-31: user-allocatable (engine-specific signals)
 */

import { z } from 'zod';

// ============================================================================
// Engine Domains
// ============================================================================

/**
 * The four engine domains, each representing a specialized area of responsibility.
 *
 * - `context`: Context management and scheduling
 * - `output`: Output rendering and formatting
 * - `io`: I/O and event handling
 * - `glue`: Glue logic and integration
 */
export const ENGINE_DOMAINS = ['context', 'output', 'io', 'glue'] as const;

/** Type for an engine domain name. */
export type EngineDomain = (typeof ENGINE_DOMAINS)[number];

// ============================================================================
// Signal Bit Constants
// ============================================================================

/** System-reserved signal bits (0-15). Used by the coprocessor kernel. */
export const SYSTEM_SIGNAL_BITS = 0x0000ffff;

/** User-allocatable signal bits (16-31). Available for engine-specific signals. */
export const USER_SIGNAL_BITS = 0xffff0000;

// ============================================================================
// BudgetAllocationSchema
// ============================================================================

/**
 * Schema for token budget allocation.
 *
 * Each engine receives a percentage of the total token budget for its
 * operations. The sum across all engines should equal 100%.
 */
export const BudgetAllocationSchema = z.object({
  /** Percentage of total token budget (0-100). */
  percentage: z.number().int().min(0).max(100),

  /** Human-readable description of what this budget covers. */
  description: z.string().optional(),
});

/** Token budget allocation. */
export type BudgetAllocation = z.infer<typeof BudgetAllocationSchema>;

// ============================================================================
// PortDeclarationSchema
// ============================================================================

/**
 * Schema for a message port declaration.
 *
 * Ports are named endpoints for inter-engine communication. Each port
 * declares a direction (in, out, or bidirectional) and optionally
 * lists the message types it accepts or sends.
 */
export const PortDeclarationSchema = z.object({
  /** Port name (e.g., 'context-request', 'output-ready'). */
  name: z.string().min(1),

  /** Message flow direction. */
  direction: z.enum(['in', 'out', 'bidirectional']),

  /** Types of messages accepted or sent through this port. */
  messageTypes: z.array(z.string()).optional(),
});

/** A message port declaration. */
export type PortDeclaration = z.infer<typeof PortDeclarationSchema>;

// ============================================================================
// SignalMaskSchema
// ============================================================================

/**
 * Schema for a 32-bit signal mask.
 *
 * Signals provide lightweight wake/sleep notification between engines.
 * The `allocated` bitmask indicates which bits this engine uses, and
 * the optional `labels` map provides human-readable names for each bit.
 */
export const SignalMaskSchema = z.object({
  /** Bitmask of allocated signal bits (0 to 0xFFFFFFFF). */
  allocated: z.number().int().min(0).max(0xffffffff),

  /** Maps signal names to bit positions (0-31). */
  labels: z.record(z.string(), z.number().int().min(0).max(31)).optional(),
});

/** A 32-bit signal mask with optional labels. */
export type SignalMask = z.infer<typeof SignalMaskSchema>;

// ============================================================================
// EngineDefinitionSchema
// ============================================================================

/**
 * Schema for a complete engine definition.
 *
 * An engine definition declares a specialized coprocessor with:
 * - Identity: name and domain ownership
 * - Description: human-readable purpose
 * - Budget allocation: token budget percentage
 * - Ports: message port declarations for inter-engine communication
 * - Signal mask: 32-bit signal allocation for lightweight coordination
 */
export const EngineDefinitionSchema = z.object({
  /** Engine identifier (e.g., 'context-engine', 'render-engine'). */
  name: z.string().min(1),

  /** Domain ownership. */
  domain: z.enum(ENGINE_DOMAINS),

  /** Human-readable description of this engine's purpose. */
  description: z.string().min(1),

  /** Token budget allocation. */
  dma: BudgetAllocationSchema,

  /** Message port declarations for inter-engine communication. */
  ports: z.array(PortDeclarationSchema).default([]),

  /** 32-bit signal mask for lightweight coordination. */
  signalMask: SignalMaskSchema.default({ allocated: 0 }),
});

/** A complete engine definition. */
export type EngineDefinition = z.infer<typeof EngineDefinitionSchema>;
