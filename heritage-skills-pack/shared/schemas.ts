/**
 * Zod validation schemas for Heritage Skills pack JSON data files.
 *
 * These schemas provide runtime validation for JSON files read from disk
 * (room-spec.json, safety-config.json, cultural-config.json,
 * sumo-mappings.json, try-session.json).
 *
 * Each schema uses z.enum() with the exact allowed values from the TypeScript
 * enums in types.ts, giving runtime validation parity with compile-time safety.
 *
 * @module heritage-skills-pack/shared/schemas
 */

import { z } from 'zod';

// ─── Enum Value Arrays (for Zod runtime validation) ──────────────────────────

// These mirror the TypeScript enums in types.ts. They must be kept in sync
// when enums are extended (e.g., adding SALISH_SEA to Tradition in Phase 2).

const ROOM_NUMBER_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

const SKILL_DOMAIN_VALUES = [
  'building',
  'fiber',
  'animals',
  'woodcraft',
  'food',
  'music',
  'metalwork',
  'pottery',
  'plants',
  'community',
  'seasonal',
  'history',
  'northern-watercraft',
  'arctic-living',
] as const;

const TRADITION_VALUES = [
  'appalachian',
  'first-nations',
  'inuit',
  'cross-tradition',
] as const;

const SAFETY_LEVEL_VALUES = [
  'standard',
  'annotated',
  'gated',
  'redirected',
] as const;

const SAFETY_DOMAIN_VALUES = [
  'food',
  'plant',
  'tool',
  'medical',
  'structural',
  'fire',
  'chemical',
  'animal',
  'arctic-survival',
] as const;

const CULTURAL_SOVEREIGNTY_LEVEL_VALUES = [1, 2, 3, 4] as const;

// ─── Reusable Sub-Schemas ─────────────────────────────────────────────────────

const RoomNumberSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
  z.literal(11),
  z.literal(12),
  z.literal(13),
  z.literal(14),
]);

const SkillDomainSchema = z.enum(SKILL_DOMAIN_VALUES);

const TraditionSchema = z.enum(TRADITION_VALUES);

const SafetyLevelSchema = z.enum(SAFETY_LEVEL_VALUES);

const SafetyDomainSchema = z.enum(SAFETY_DOMAIN_VALUES);

const CulturalSovereigntyLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

// ─── Room Spec Schema ─────────────────────────────────────────────────────────

/**
 * Validates a room-spec.json file.
 *
 * Each skill room directory contains a room-spec.json that declares
 * the room's metadata, traditions, safety domains, and SUMO classes.
 */
export const RoomSpecSchema = z.object({
  /** Numeric room identifier (1-14). */
  room: RoomNumberSchema,
  /** Domain string for this room. */
  domain: SkillDomainSchema,
  /** Human-readable room title. */
  title: z.string().min(1),
  /** Cultural traditions represented in this room. */
  traditions: z.array(TraditionSchema).min(1),
  /** Physical safety domains addressed in this room. */
  safetyDomains: z.array(SafetyDomainSchema),
  /** SUMO class identifiers used in this room's ontology. */
  sumoClasses: z.array(z.string()),
  /** Primary SUMO .kif file for this room. */
  sumoFile: z.string().min(1),
  /** Whether this room has critical safety requirements. */
  isCritical: z.boolean(),
});

export type RoomSpecData = z.infer<typeof RoomSpecSchema>;

// ─── Safety Config Schema ─────────────────────────────────────────────────────

/**
 * Validates a safety-config.json file.
 *
 * Safety config files define the rules for a specific safety domain.
 * Each rule specifies a pattern to match and the annotation to display.
 */
export const SafetyConfigSchema = z.object({
  /** Safety domain this config file covers. */
  domain: SafetyDomainSchema,
  /** Array of safety rules for this domain. */
  rules: z.array(
    z.object({
      /** Unique rule identifier. */
      id: z.string().min(1),
      /** Pattern (keyword or regex) that triggers this rule. */
      pattern: z.string().min(1),
      /** Safety level to apply when triggered. */
      level: SafetyLevelSchema,
      /** Safety message to display to the user. */
      message: z.string().min(1),
      /** Whether this is a critical safety concern. */
      isCritical: z.boolean(),
      /** Whether the user can override this annotation. */
      canOverride: z.boolean(),
      /** Optional: source or authority behind this guidance. */
      source: z.string().optional(),
      /** Optional: traditions this rule specifically applies to. */
      traditions: z.array(TraditionSchema).optional(),
    }),
  ),
});

export type SafetyConfigData = z.infer<typeof SafetyConfigSchema>;

// ─── Cultural Config Schema ───────────────────────────────────────────────────

/**
 * Validates a cultural-config.json file.
 *
 * Cultural config files define sovereignty rules for a tradition.
 * Level 4 (SACRED_CEREMONIAL) rules must always use action 'block'.
 */
export const CulturalConfigSchema = z.object({
  /** The tradition these rules apply to. */
  tradition: TraditionSchema,
  /** Array of cultural sovereignty rules. */
  rules: z.array(
    z.object({
      /** Unique rule identifier. */
      id: z.string().min(1),
      /** Cultural sovereignty classification level (1-4). */
      level: CulturalSovereigntyLevelSchema,
      /** Knowledge domain this rule applies to. */
      domain: z.string().min(1),
      /** Action to take when this rule matches. */
      action: z.enum([
        'include',
        'summarize-and-refer',
        'acknowledge-and-redirect',
        'block',
      ]),
      /** Optional: referral target resource or community contact. */
      referralTarget: z.string().optional(),
      /** Explanation of this rule's cultural reasoning. */
      explanation: z.string().min(1),
    }),
  ),
});

export type CulturalConfigData = z.infer<typeof CulturalConfigSchema>;

// ─── SUMO Mappings Schema ─────────────────────────────────────────────────────

/**
 * Validates a sumo-mappings.json file.
 *
 * SUMO mapping files define the ontological grounding for heritage concepts
 * in each skill room, linking heritage concept IDs to SUMO terms with
 * formal KIF statements.
 */
export const SumoMappingsSchema = z.object({
  /** Skill room number this mapping file belongs to. */
  room: RoomNumberSchema,
  /** Primary SUMO .kif file for this room. */
  sumoFile: z.string().min(1),
  /** Array of heritage concept to SUMO term mappings. */
  mappings: z.array(
    z.object({
      /** Identifier of the heritage concept being mapped. */
      heritageConceptId: z.string().min(1),
      /** The SUMO term this concept maps to. */
      sumoTerm: z.string().min(1),
      /** The SUMO .kif file that defines this term. */
      sumoFile: z.string().min(1),
      /** Type of ontological relationship. */
      mappingType: z.enum(['instance', 'subclass', 'equivalent', 'related']),
      /** Formal KIF statement in SUO-KIF syntax. */
      kifStatement: z.string().min(1),
      /** Natural language paraphrase of the KIF statement. */
      naturalLanguage: z.string().min(1),
      /** Optional: ID of an OntologicalBridge for this mapping. */
      ontologicalBridge: z.string().optional(),
    }),
  ),
});

export type SumoMappingsData = z.infer<typeof SumoMappingsSchema>;

// ─── Try Session Schema ───────────────────────────────────────────────────────

/**
 * Validates a try-session.json file.
 *
 * Try-session files define guided hands-on learning experiences for
 * a specific heritage skill, with step-by-step instructions and safety
 * annotations.
 */
export const TrySessionSchema = z.object({
  /** Unique session identifier. */
  id: z.string().min(1),
  /** Human-readable session title. */
  title: z.string().min(1),
  /** Cultural tradition this session represents. */
  tradition: TraditionSchema,
  /** Skill difficulty level. */
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  /** Estimated completion time in minutes. */
  estimatedMinutes: z.number().int().positive(),
  /** Description of what the session teaches. */
  description: z.string().min(1),
  /** Prerequisite session IDs or skill descriptions. */
  prerequisites: z.array(z.string()),
  /** Safety handling level for this session. */
  safetyLevel: SafetyLevelSchema,
  /** Cultural sovereignty level for this session's content. */
  culturalLevel: CulturalSovereigntyLevelSchema,
  /** Primary SUMO process class for this session's activity. */
  sumoProcessClass: z.string().min(1),
  /** Ordered steps in this session. */
  steps: z.array(
    z.object({
      /** Ordinal position (1-indexed). */
      order: z.number().int().positive(),
      /** Primary instruction text. */
      instruction: z.string().min(1),
      /** Optional safety warning for this step. */
      safetyNote: z.string().optional(),
      /** Optional cultural framing for this step. */
      culturalContext: z.string().optional(),
      /** Optional nation-specific attribution. */
      nationAttribution: z.string().optional(),
      /** Optional SUMO class or instance term. */
      sumoMapping: z.string().optional(),
    }),
  ).min(1),
});

export type TrySessionData = z.infer<typeof TrySessionSchema>;

// ─── Re-exported Sub-Schemas ──────────────────────────────────────────────────
// These are exported for use in test suites and derived validators.

export {
  RoomNumberSchema,
  SkillDomainSchema,
  TraditionSchema,
  SafetyLevelSchema,
  SafetyDomainSchema,
  CulturalSovereigntyLevelSchema,
};

export { ROOM_NUMBER_VALUES, SKILL_DOMAIN_VALUES, TRADITION_VALUES, SAFETY_DOMAIN_VALUES };
