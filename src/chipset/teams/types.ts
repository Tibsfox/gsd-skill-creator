/**
 * Chip definition type system for the team-as-chip framework.
 *
 * Defines Zod schemas and TypeScript types for chip domains, DMA channel
 * token budget allocation, message port declarations, 32-bit signal masks,
 * and complete chip definitions. These types model specialized coprocessors
 * (Agnus, Denise, Paula, Gary) with domain ownership boundaries.
 *
 * The signal mask partitions a 32-bit space:
 * - Bits 0-15: system-reserved (chipset kernel)
 * - Bits 16-31: user-allocatable (chip-specific signals)
 */

import { z } from 'zod';

// ============================================================================
// Chip Domains
// ============================================================================

/**
 * The four chip domains, each representing a specialized area of responsibility.
 *
 * - `context`: Context management and scheduling (Agnus)
 * - `output`: Output rendering and formatting (Denise)
 * - `io`: I/O and event handling (Paula)
 * - `glue`: Glue logic and integration (Gary)
 */
export const CHIP_DOMAINS = ['context', 'output', 'io', 'glue'] as const;

/** Type for a chip domain name. */
export type ChipDomain = (typeof CHIP_DOMAINS)[number];

// ============================================================================
// Signal Bit Constants
// ============================================================================

/** System-reserved signal bits (0-15). Used by the chipset kernel. */
export const SYSTEM_SIGNAL_BITS = 0x0000ffff;

/** User-allocatable signal bits (16-31). Available for chip-specific signals. */
export const USER_SIGNAL_BITS = 0xffff0000;

// ============================================================================
// DmaAllocationSchema
// ============================================================================

/**
 * Schema for DMA channel token budget allocation.
 *
 * Each chip receives a percentage of the total token budget for its
 * operations. The sum across all chips should equal 100%.
 */
export const DmaAllocationSchema = z.object({
  /** Percentage of total token budget (0-100). */
  percentage: z.number().int().min(0).max(100),

  /** Human-readable description of what this budget covers. */
  description: z.string().optional(),
});

/** DMA channel token budget allocation. */
export type DmaAllocation = z.infer<typeof DmaAllocationSchema>;

// ============================================================================
// PortDeclarationSchema
// ============================================================================

/**
 * Schema for a message port declaration.
 *
 * Ports are named endpoints for inter-chip communication. Each port
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
 * Signals provide lightweight wake/sleep notification between chips.
 * The `allocated` bitmask indicates which bits this chip uses, and
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
// ChipDefinitionSchema
// ============================================================================

/**
 * Schema for a complete chip definition.
 *
 * A chip definition declares a specialized coprocessor with:
 * - Identity: name and domain ownership
 * - Description: human-readable purpose
 * - DMA allocation: token budget percentage
 * - Ports: message port declarations for inter-chip communication
 * - Signal mask: 32-bit signal allocation for lightweight coordination
 */
export const ChipDefinitionSchema = z.object({
  /** Chip identifier (e.g., 'agnus', 'denise', 'paula', 'gary'). */
  name: z.string().min(1),

  /** Domain ownership. */
  domain: z.enum(CHIP_DOMAINS),

  /** Human-readable description of this chip's purpose. */
  description: z.string().min(1),

  /** DMA channel token budget allocation. */
  dma: DmaAllocationSchema,

  /** Message port declarations for inter-chip communication. */
  ports: z.array(PortDeclarationSchema).default([]),

  /** 32-bit signal mask for lightweight coordination. */
  signalMask: SignalMaskSchema.default({ allocated: 0 }),
});

/** A complete chip definition. */
export type ChipDefinition = z.infer<typeof ChipDefinitionSchema>;
