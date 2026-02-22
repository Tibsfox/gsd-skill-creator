/**
 * Session intelligence type definitions for the GSD-OS MCP gateway.
 *
 * Defines data models for cross-project intelligence queries and
 * pattern detection results. All types have companion Zod schemas.
 *
 * @module mcp/gateway/tools/session-types
 */

import { z } from 'zod';

// ── Intelligence Match ──────────────────────────────────────────────────────

/** A single cross-project intelligence match. */
export const SessionMatchSchema = z.object({
  /** Unique match identifier. */
  id: z.string(),
  /** Source project name. */
  project: z.string(),
  /** Matched content excerpt. */
  content: z.string(),
  /** Relevance score (0-1). */
  relevance: z.number().min(0).max(1),
  /** When the intelligence was recorded (epoch ms). */
  timestamp: z.number(),
  /** Tags associated with the intelligence. */
  tags: z.array(z.string()),
});

/** Session intelligence match. */
export type SessionMatch = z.infer<typeof SessionMatchSchema>;

// ── Pattern Record ──────────────────────────────────────────────────────────

/** A detected pattern from skill-creator analysis. */
export const PatternRecordSchema = z.object({
  /** Unique pattern identifier. */
  id: z.string(),
  /** Pattern name/title. */
  name: z.string(),
  /** Detailed description. */
  description: z.string(),
  /** Domain classification (e.g., "testing", "debugging", "deployment"). */
  domain: z.string(),
  /** Number of times this pattern has been observed. */
  occurrences: z.number().int().min(1),
  /** Confidence score (0-1). */
  confidence: z.number().min(0).max(1),
  /** Example session IDs where the pattern was observed. */
  exampleSessions: z.array(z.string()),
  /** When the pattern was first detected (epoch ms). */
  firstSeen: z.number(),
  /** When the pattern was last observed (epoch ms). */
  lastSeen: z.number(),
});

/** Detected pattern record. */
export type PatternRecord = z.infer<typeof PatternRecordSchema>;

// ── Intelligence Entry (Internal) ───────────────────────────────────────────

/** Internal storage format for session intelligence. */
export const IntelligenceEntrySchema = z.object({
  /** Unique entry identifier. */
  id: z.string(),
  /** Source project name. */
  project: z.string(),
  /** Full content text (searchable). */
  content: z.string(),
  /** When the entry was recorded (epoch ms). */
  timestamp: z.number(),
  /** Classification tags. */
  tags: z.array(z.string()),
});

/** Internal intelligence entry. */
export type IntelligenceEntry = z.infer<typeof IntelligenceEntrySchema>;
