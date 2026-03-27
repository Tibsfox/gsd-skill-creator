/**
 * Phase 2 type extensions for the Heritage Skills Educational Pack.
 *
 * Extends Phase 1 shared types (types.ts) without modifying them.
 * All Phase 1 imports remain unbroken by this file.
 *
 * New types defined here:
 * - TraditionV2: Phase 1 Tradition union with SALISH_SEA
 * - RoomNumberV2: Phase 1 RoomNumber union with rooms 15-18
 * - BadgePath, BadgeTier: Trail Badge system enums (9 paths, 4 tiers)
 * - HeritageBadge, BadgeComponent: Badge system interfaces
 * - PracticeJournal, JournalEntry: Learner journal interfaces
 * - WatershedType, ReconnectingProfile: Reconnecting Descendant types
 * - MarineSafetyDomain: Marine safety extension
 *
 * @module heritage-skills-pack/shared/phase2-types
 */

import {
  RoomNumber,
  Tradition,
  CulturalSovereigntyLevel,
  SafetyRule,
} from './types.js';

// ─── Tradition Extension ──────────────────────────────────────────────────────

/**
 * Phase 2 extension: adds SALISH_SEA to the Tradition value set.
 *
 * Use TraditionV2 anywhere Phase 2 code needs to accept SALISH_SEA.
 * Phase 1 APIs that accept Tradition remain unchanged.
 */
export const SALISH_SEA_TRADITION = 'salish-sea' as const;
export type SalishSeaTradition = typeof SALISH_SEA_TRADITION;

/**
 * Union of all Phase 1 Tradition values plus the Phase 2 SALISH_SEA extension.
 * Use this type in Phase 2 interfaces that accept any tradition.
 */
export type TraditionV2 = Tradition | SalishSeaTradition;

// ─── RoomNumber Extension ─────────────────────────────────────────────────────

/**
 * Phase 2 room number extensions (15-18) for PNW Coast rooms.
 *
 * These values extend the Phase 1 RoomNumber enum.
 * Use RoomNumberV2 in Phase 2 interfaces that accept rooms 1-18.
 */
export const Phase2RoomNumber = {
  CEDAR_CULTURE: 15,
  SALMON_WORLD: 16,
  SALISH_WEAVING: 17,
  VILLAGE_WORLD: 18,
} as const;

export type Phase2RoomNumberValue = (typeof Phase2RoomNumber)[keyof typeof Phase2RoomNumber];

/**
 * Union type accepting any valid room number in Phase 1 (1-14) or Phase 2 (15-18).
 */
export type RoomNumberV2 = RoomNumber | Phase2RoomNumberValue;

// ─── Badge Path and Tier Enums ────────────────────────────────────────────────

/**
 * The 9 learning paths through the Trail Badge system.
 *
 * Each path corresponds to a domain of heritage skill practice.
 * NEIGHBORS corresponds to Village World (Room 18 — emotional intelligence).
 * HERITAGE corresponds to Heritage Book authoring and community documentation.
 */
export enum BadgePath {
  SHELTER    = 'shelter',
  FOOD       = 'food',
  FIBER      = 'fiber',
  WATERCRAFT = 'watercraft',
  PLANT      = 'plant',
  TOOL       = 'tool',
  MUSIC      = 'music',
  NEIGHBORS  = 'neighbors',
  HERITAGE   = 'heritage',
}

/**
 * Mastery tier for a Trail Badge.
 *
 * - EXPLORER:    Can describe the skill.
 * - APPRENTICE:  Can demonstrate it.
 * - JOURNEYMAN:  Can explain relationships between skills and traditions.
 * - KEEPER:      Can teach it and has completed a service component.
 */
export enum BadgeTier {
  EXPLORER   = 'explorer',
  APPRENTICE = 'apprentice',
  JOURNEYMAN = 'journeyman',
  KEEPER     = 'keeper',
}

// ─── Badge Interfaces ─────────────────────────────────────────────────────────

/**
 * A single Trail Badge in the Heritage Skills system.
 *
 * Badges are awarded upon completion of all required BadgeComponents at the
 * specified tier. Prerequisites are badge IDs that must be earned first.
 */
export interface HeritageBadge {
  /** Unique badge identifier. */
  id: string;
  /** Which learning path this badge belongs to. */
  path: BadgePath;
  /** Human-readable badge title. */
  title: string;
  /** Icon identifier or filename for display. */
  icon: string;
  /** Cultural traditions covered by this badge. */
  traditions: TraditionV2[];
  /** Mastery tier this badge represents. */
  tier: BadgeTier;
  /** Badge IDs that must be earned before this badge can be started. */
  prerequisites: string[];
  /** The skill room where this badge is primarily earned. */
  roomId: RoomNumberV2;
  /** Ordered components the learner must complete to earn this badge. */
  components: BadgeComponent[];
  /** Optional: narrative thread connecting this badge to the Neighbors Path. */
  neighborsThread?: string;
}

/**
 * A single learning activity component within a HeritageBadge.
 *
 * Components are typed as story, skill, relationship, or reflection.
 * culturalLevel reuses the Phase 1 CulturalSovereigntyLevel enum.
 */
export interface BadgeComponent {
  /** Component type determining how it is presented to the learner. */
  type: 'story' | 'skill' | 'relationship' | 'reflection';
  /** Human-readable component title. */
  title: string;
  /** Educational content or prompt for this component. */
  content: string;
  /** Optional: identifier of an interactive exercise element. */
  interactiveElement?: string;
  /** Optional: ID of a CanonicalWork this component references. */
  canonicalWorkRef?: string;
  /** Cultural sovereignty level governing this component's content. */
  culturalLevel: CulturalSovereigntyLevel;
}

// ─── Practice Journal Interfaces ──────────────────────────────────────────────

/**
 * A learner's personal Practice Journal tracking badge progress.
 *
 * Designed as a no-guilt UX: entries are observations and practice notes,
 * not performance metrics. The reconnectingPathway field is populated only
 * for learners using the Reconnecting Descendant pathway (Phase 38).
 */
export interface PracticeJournal {
  /** Unique identifier for the learner. */
  userId: string;
  /** Chronologically ordered journal entries. */
  entries: JournalEntry[];
  /** IDs of badges the learner has fully earned. */
  badgesEarned: string[];
  /** Badge paths the learner is currently working on. */
  currentPaths: BadgePath[];
  /** Optional: Reconnecting Descendant profile (Phase 38). */
  reconnectingPathway?: ReconnectingProfile;
}

/**
 * A single entry in a PracticeJournal.
 *
 * All entry types are first-class: observation, practice, reflection,
 * sketch, and teaching. No type is privileged for badge advancement.
 */
export interface JournalEntry {
  /** ISO 8601 date string for when the entry was made. */
  date: string;
  /** Optional: badge this entry relates to. */
  badgeId?: string;
  /** Optional: skill room this entry relates to. */
  roomId?: RoomNumberV2;
  /** Entry type determining how the content is interpreted. */
  type: 'observation' | 'practice' | 'reflection' | 'sketch' | 'teaching';
  /** Learner-authored content of this entry. */
  content: string;
  /** Optional: badge tier this entry demonstrates progress toward. */
  tier?: BadgeTier;
}

// ─── Reconnecting Descendant Types ───────────────────────────────────────────

/**
 * Watershed region classification for the Reconnecting Descendant pathway.
 *
 * SALTWATER covers Vancouver Island and Puget Sound peoples.
 * RIVER_MOUNTAIN covers Cascade slope and interior river peoples.
 * UNKNOWN is the default when ancestry investigation is not yet complete.
 */
export enum WatershedType {
  SALTWATER      = 'saltwater',
  RIVER_MOUNTAIN = 'river-mountain',
  UNKNOWN        = 'unknown',
}

/**
 * Profile for a learner using the Reconnecting Descendant pathway.
 *
 * Used exclusively within PracticeJournal.reconnectingPathway.
 * Full implementation is deferred to Phase 38.
 */
export interface ReconnectingProfile {
  /** Watershed region under investigation. */
  watershedInvestigation: WatershedType;
  /** Statement of known or researched ancestry. */
  knownAncestry: string;
  /** Protocol phrase used when approaching communities (see Salish Sea Ways). */
  approachProtocol: string;
  /** Community resources and contacts the learner has accessed. */
  resourcesAccessed: string[];
  /** Names of community connections the learner has made. */
  communityConnections: string[];
}

// ─── Marine Safety Extension ──────────────────────────────────────────────────

/**
 * Marine safety domain for PNW Coast watercraft content.
 *
 * Each property holds an array of SafetyRule instances from Phase 1.
 * Rules are populated by the Marine Safety module (Phase 36).
 *
 * - coldWater: hypothermia, cold shock, 1-10-1 rule
 * - tidal:     rip currents, tidal bores, tidal window planning
 * - vessel:    canoe stability, loading limits, weather window
 * - navigation: channel markers, fog procedures, current reading
 */
export interface MarineSafetyDomain {
  coldWater:  SafetyRule[];
  tidal:      SafetyRule[];
  vessel:     SafetyRule[];
  navigation: SafetyRule[];
}
