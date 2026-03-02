/**
 * Room directory and derived mappings for the Heritage Skills Educational Pack.
 *
 * Constants derived from Milestone Spec §4.1 Room Directory table. All data
 * is readonly to prevent accidental mutation at runtime.
 *
 * @module heritage-skills-pack/shared/constants
 */

import {
  RoomNumber,
  SkillDomain,
  Tradition,
  SafetyDomain,
} from './types.js';

// ─── Room Directory Entry ─────────────────────────────────────────────────────

/**
 * Metadata for a single skill room in the Heritage Skills Hall.
 *
 * Used to build navigation, warden routing, SUMO file resolution, and
 * tradition-specific content filtering.
 */
export interface RoomDirectoryEntry {
  /** Numeric room identifier. */
  room: RoomNumber;
  /** Domain string for this room. */
  domain: SkillDomain;
  /** Human-readable room title. */
  title: string;
  /** Cultural traditions represented in this room. */
  traditions: readonly Tradition[];
  /** Physical safety domains addressed in this room. */
  safetyDomains: readonly SafetyDomain[];
  /** Primary SUMO .kif file for this room's ontological grounding. */
  sumoFile: string;
  /**
   * Whether this room has critical safety requirements.
   * True for Room 05 (Food), Room 09 (Plants), Room 14 (Arctic Living).
   */
  isCritical: boolean;
}

// ─── Room Directory ───────────────────────────────────────────────────────────

/**
 * Complete directory of all 14 skill rooms in the Heritage Skills Hall.
 *
 * Derived from Milestone Spec §4.1 Room Directory table. Rooms marked
 * isCritical=true (05, 09, 14) receive mandatory GATED or REDIRECTED safety
 * treatment and cannot downgrade to ANNOTATED or STANDARD.
 *
 * Tradition key:
 * - APPALACHIAN = Appalachian mountain tradition
 * - FIRST_NATIONS = First Nations (various nations)
 * - INUIT = Inuit Qaujimajatuqangit
 * - CROSS_TRADITION = shared across traditions
 */
export const ROOM_DIRECTORY: readonly RoomDirectoryEntry[] = [
  {
    room: RoomNumber.BUILDING,
    domain: SkillDomain.BUILDING,
    title: 'Building & Shelter',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.STRUCTURAL, SafetyDomain.FIRE],
    sumoFile: 'engineering.kif',
    isCritical: false,
  },
  {
    room: RoomNumber.FIBER,
    domain: SkillDomain.FIBER,
    title: 'Fiber & Textile',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.TOOL],
    sumoFile: 'MILO',
    isCritical: false,
  },
  {
    room: RoomNumber.ANIMALS,
    domain: SkillDomain.ANIMALS,
    title: 'Animals & Wildlife',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.ANIMAL, SafetyDomain.TOOL, SafetyDomain.FOOD],
    sumoFile: 'Merge.kif',
    isCritical: false,
  },
  {
    room: RoomNumber.WOODCRAFT,
    domain: SkillDomain.WOODCRAFT,
    title: 'Woodcraft & Tools',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.TOOL],
    sumoFile: 'engineering.kif',
    isCritical: false,
  },
  {
    room: RoomNumber.FOOD,
    domain: SkillDomain.FOOD,
    title: 'Food & Preservation',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.FOOD, SafetyDomain.FIRE, SafetyDomain.CHEMICAL],
    sumoFile: 'Food.kif',
    isCritical: true,
  },
  {
    room: RoomNumber.MUSIC,
    domain: SkillDomain.MUSIC,
    title: 'Music & Instruments',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.TOOL, SafetyDomain.FIRE],
    sumoFile: 'Music.kif',
    isCritical: false,
  },
  {
    room: RoomNumber.METALWORK,
    domain: SkillDomain.METALWORK,
    title: 'Metalwork & Smithing',
    traditions: [Tradition.APPALACHIAN],
    safetyDomains: [
      SafetyDomain.FIRE,
      SafetyDomain.TOOL,
      SafetyDomain.CHEMICAL,
      SafetyDomain.STRUCTURAL,
    ],
    sumoFile: 'engineering.kif',
    isCritical: false,
  },
  {
    room: RoomNumber.POTTERY,
    domain: SkillDomain.POTTERY,
    title: 'Pottery & Clay',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.FIRE, SafetyDomain.CHEMICAL, SafetyDomain.STRUCTURAL],
    sumoFile: 'MILO',
    isCritical: false,
  },
  {
    room: RoomNumber.PLANTS,
    domain: SkillDomain.PLANTS,
    title: 'Plant Knowledge',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.PLANT, SafetyDomain.MEDICAL],
    sumoFile: 'Trees.kif',
    isCritical: true,
  },
  {
    room: RoomNumber.COMMUNITY,
    domain: SkillDomain.COMMUNITY,
    title: 'Community & Culture',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [],
    sumoFile: 'People.kif',
    isCritical: false,
  },
  {
    room: RoomNumber.SEASONAL,
    domain: SkillDomain.SEASONAL,
    title: 'Seasonal Living',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.ARCTIC_SURVIVAL, SafetyDomain.FOOD],
    sumoFile: 'Weather.kif',
    isCritical: false,
  },
  {
    room: RoomNumber.HISTORY,
    domain: SkillDomain.HISTORY,
    title: 'History & Memory',
    traditions: [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [],
    sumoFile: 'MILO',
    isCritical: false,
  },
  {
    room: RoomNumber.NORTHERN_WATERCRAFT,
    domain: SkillDomain.NORTHERN_WATERCRAFT,
    title: 'Northern Watercraft',
    traditions: [Tradition.FIRST_NATIONS, Tradition.INUIT],
    safetyDomains: [SafetyDomain.TOOL, SafetyDomain.STRUCTURAL, SafetyDomain.ARCTIC_SURVIVAL],
    sumoFile: 'MILO',
    isCritical: false,
  },
  {
    room: RoomNumber.ARCTIC_LIVING,
    domain: SkillDomain.ARCTIC_LIVING,
    title: 'Arctic Living',
    traditions: [Tradition.INUIT, Tradition.FIRST_NATIONS],
    safetyDomains: [SafetyDomain.ARCTIC_SURVIVAL, SafetyDomain.TOOL, SafetyDomain.FIRE],
    sumoFile: 'Geography.kif',
    isCritical: true,
  },
] as const;

// ─── Safety Domain to Rooms Mapping ──────────────────────────────────────────

/**
 * Maps each SafetyDomain to the room numbers that include it.
 *
 * Derived from ROOM_DIRECTORY. Used by the Safety Warden to determine
 * which rooms require each safety domain's rules.
 */
export const SAFETY_DOMAIN_TO_ROOMS: Readonly<Record<SafetyDomain, readonly RoomNumber[]>> = {
  [SafetyDomain.FOOD]: [RoomNumber.ANIMALS, RoomNumber.FOOD, RoomNumber.SEASONAL],
  [SafetyDomain.PLANT]: [RoomNumber.PLANTS],
  [SafetyDomain.TOOL]: [
    RoomNumber.FIBER,
    RoomNumber.ANIMALS,
    RoomNumber.WOODCRAFT,
    RoomNumber.MUSIC,
    RoomNumber.METALWORK,
    RoomNumber.NORTHERN_WATERCRAFT,
    RoomNumber.ARCTIC_LIVING,
  ],
  [SafetyDomain.MEDICAL]: [RoomNumber.PLANTS],
  [SafetyDomain.STRUCTURAL]: [
    RoomNumber.BUILDING,
    RoomNumber.METALWORK,
    RoomNumber.POTTERY,
    RoomNumber.NORTHERN_WATERCRAFT,
  ],
  [SafetyDomain.FIRE]: [
    RoomNumber.BUILDING,
    RoomNumber.FOOD,
    RoomNumber.MUSIC,
    RoomNumber.METALWORK,
    RoomNumber.POTTERY,
    RoomNumber.ARCTIC_LIVING,
  ],
  [SafetyDomain.CHEMICAL]: [RoomNumber.FOOD, RoomNumber.METALWORK, RoomNumber.POTTERY],
  [SafetyDomain.ANIMAL]: [RoomNumber.ANIMALS],
  [SafetyDomain.ARCTIC_SURVIVAL]: [
    RoomNumber.SEASONAL,
    RoomNumber.NORTHERN_WATERCRAFT,
    RoomNumber.ARCTIC_LIVING,
  ],
} as const;

// ─── Tradition to Rooms Mapping ───────────────────────────────────────────────

/**
 * Maps each Tradition to the room numbers that include content from that tradition.
 *
 * Derived from ROOM_DIRECTORY. Used for tradition-based content filtering
 * and navigation.
 */
export const TRADITION_TO_ROOMS: Readonly<Record<Tradition, readonly RoomNumber[]>> = {
  [Tradition.APPALACHIAN]: [
    RoomNumber.BUILDING,
    RoomNumber.FIBER,
    RoomNumber.ANIMALS,
    RoomNumber.WOODCRAFT,
    RoomNumber.FOOD,
    RoomNumber.MUSIC,
    RoomNumber.METALWORK,
    RoomNumber.POTTERY,
    RoomNumber.PLANTS,
    RoomNumber.COMMUNITY,
    RoomNumber.SEASONAL,
    RoomNumber.HISTORY,
  ],
  [Tradition.FIRST_NATIONS]: [
    RoomNumber.BUILDING,
    RoomNumber.FIBER,
    RoomNumber.ANIMALS,
    RoomNumber.WOODCRAFT,
    RoomNumber.FOOD,
    RoomNumber.MUSIC,
    RoomNumber.POTTERY,
    RoomNumber.PLANTS,
    RoomNumber.COMMUNITY,
    RoomNumber.SEASONAL,
    RoomNumber.HISTORY,
    RoomNumber.NORTHERN_WATERCRAFT,
    RoomNumber.ARCTIC_LIVING,
  ],
  [Tradition.INUIT]: [
    RoomNumber.BUILDING,
    RoomNumber.FIBER,
    RoomNumber.ANIMALS,
    RoomNumber.WOODCRAFT,
    RoomNumber.FOOD,
    RoomNumber.MUSIC,
    RoomNumber.POTTERY,
    RoomNumber.PLANTS,
    RoomNumber.COMMUNITY,
    RoomNumber.SEASONAL,
    RoomNumber.HISTORY,
    RoomNumber.NORTHERN_WATERCRAFT,
    RoomNumber.ARCTIC_LIVING,
  ],
  [Tradition.CROSS_TRADITION]: [],
} as const;

// ─── SUMO File to Rooms Mapping ───────────────────────────────────────────────

/**
 * Maps each SUMO .kif filename to the room numbers that reference it.
 *
 * Derived from ROOM_DIRECTORY. Used by the SUMO integration layer to
 * resolve which ontology files to load when navigating a room.
 *
 * 'MILO' refers to the Mid-Level Ontology (used for multiple domains
 * including Fiber, Pottery, Northern Watercraft, and History).
 */
export const SUMO_FILE_TO_ROOMS: Readonly<Record<string, readonly RoomNumber[]>> = {
  'engineering.kif': [RoomNumber.BUILDING, RoomNumber.WOODCRAFT, RoomNumber.METALWORK],
  'MILO': [RoomNumber.FIBER, RoomNumber.POTTERY, RoomNumber.HISTORY, RoomNumber.NORTHERN_WATERCRAFT],
  'Merge.kif': [RoomNumber.ANIMALS],
  'Food.kif': [RoomNumber.FOOD],
  'Music.kif': [RoomNumber.MUSIC],
  'Trees.kif': [RoomNumber.PLANTS],
  'People.kif': [RoomNumber.COMMUNITY],
  'Weather.kif': [RoomNumber.SEASONAL],
  'Geography.kif': [RoomNumber.ARCTIC_LIVING],
} as const;
