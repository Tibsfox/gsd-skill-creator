/**
 * Compilation and validation tests for heritage-skills-pack shared types.
 *
 * Tests:
 * 1. Enum completeness -- exact value counts for all 7 enums
 * 2. Constants correctness -- ROOM_DIRECTORY structure and derived mappings
 * 3. Schema validation -- Zod schemas accept valid data and reject invalid data
 *
 * @module heritage-skills-pack/shared/types.test
 */

import { describe, it, expect } from 'vitest';

import {
  RoomNumber,
  SkillDomain,
  Tradition,
  SafetyLevel,
  SafetyDomain,
  CulturalSovereigntyLevel,
  KnowledgeSource,
} from './types.js';

import {
  ROOM_DIRECTORY,
  SAFETY_DOMAIN_TO_ROOMS,
  TRADITION_TO_ROOMS,
  SUMO_FILE_TO_ROOMS,
} from './constants.js';

import {
  RoomSpecSchema,
  SafetyConfigSchema,
  CulturalConfigSchema,
  SumoMappingsSchema,
  TrySessionSchema,
} from './schemas.js';

// ─── Enum Completeness Tests ──────────────────────────────────────────────────

describe('Enum completeness', () => {
  it('RoomNumber has exactly 14 numeric values', () => {
    // TypeScript numeric enums generate reverse mappings, so Object.values()
    // returns both string names and numeric values. Filter to numbers only.
    const numericValues = Object.values(RoomNumber).filter(
      (v) => typeof v === 'number',
    );
    expect(numericValues).toHaveLength(14);
    expect(numericValues).toContain(1);  // BUILDING
    expect(numericValues).toContain(14); // ARCTIC_LIVING
  });

  it('RoomNumber values are sequential 1-14', () => {
    const numericValues = Object.values(RoomNumber)
      .filter((v) => typeof v === 'number')
      .sort((a, b) => (a as number) - (b as number)) as number[];
    expect(numericValues).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('SkillDomain has exactly 14 string values', () => {
    const stringValues = Object.values(SkillDomain).filter(
      (v) => typeof v === 'string',
    );
    expect(stringValues).toHaveLength(14);
  });

  it('SkillDomain contains expected domain strings', () => {
    expect(SkillDomain.BUILDING).toBe('building');
    expect(SkillDomain.NORTHERN_WATERCRAFT).toBe('northern-watercraft');
    expect(SkillDomain.ARCTIC_LIVING).toBe('arctic-living');
  });

  it('Tradition has exactly 4 values', () => {
    const values = Object.values(Tradition).filter((v) => typeof v === 'string');
    expect(values).toHaveLength(4);
    expect(values).toContain('appalachian');
    expect(values).toContain('first-nations');
    expect(values).toContain('inuit');
    expect(values).toContain('cross-tradition');
  });

  it('SafetyLevel has exactly 4 values', () => {
    const values = Object.values(SafetyLevel).filter((v) => typeof v === 'string');
    expect(values).toHaveLength(4);
    expect(values).toContain('standard');
    expect(values).toContain('annotated');
    expect(values).toContain('gated');
    expect(values).toContain('redirected');
  });

  it('SafetyDomain has exactly 10 values', () => {
    const values = Object.values(SafetyDomain).filter((v) => typeof v === 'string');
    expect(values).toHaveLength(10);
    expect(values).toContain('food');
    expect(values).toContain('plant');
    expect(values).toContain('tool');
    expect(values).toContain('medical');
    expect(values).toContain('structural');
    expect(values).toContain('fire');
    expect(values).toContain('chemical');
    expect(values).toContain('animal');
    expect(values).toContain('arctic-survival');
    expect(values).toContain('marine');
  });

  it('CulturalSovereigntyLevel has 4 numeric levels', () => {
    const numericValues = Object.values(CulturalSovereigntyLevel).filter(
      (v) => typeof v === 'number',
    ) as number[];
    expect(numericValues).toHaveLength(4);
    expect(numericValues).toContain(1);
    expect(numericValues).toContain(2);
    expect(numericValues).toContain(3);
    expect(numericValues).toContain(4);
  });

  it('CulturalSovereigntyLevel is ordered 1 < 2 < 3 < 4', () => {
    expect(CulturalSovereigntyLevel.PUBLICLY_SHARED).toBe(1);
    expect(CulturalSovereigntyLevel.CONTEXTUALLY_SHARED).toBe(2);
    expect(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED).toBe(3);
    expect(CulturalSovereigntyLevel.SACRED_CEREMONIAL).toBe(4);
    expect(CulturalSovereigntyLevel.PUBLICLY_SHARED).toBeLessThan(
      CulturalSovereigntyLevel.CONTEXTUALLY_SHARED,
    );
    expect(CulturalSovereigntyLevel.CONTEXTUALLY_SHARED).toBeLessThan(
      CulturalSovereigntyLevel.COMMUNITY_RESTRICTED,
    );
    expect(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED).toBeLessThan(
      CulturalSovereigntyLevel.SACRED_CEREMONIAL,
    );
  });

  it('KnowledgeSource has exactly 6 values', () => {
    const values = Object.values(KnowledgeSource).filter((v) => typeof v === 'string');
    expect(values).toHaveLength(6);
    expect(values).toContain('published-book');
    expect(values).toContain('museum-exhibition');
    expect(values).toContain('community-program');
    expect(values).toContain('academic-research');
    expect(values).toContain('documentary');
    expect(values).toContain('community-authorized');
  });
});

// ─── Constants Tests ──────────────────────────────────────────────────────────

describe('ROOM_DIRECTORY', () => {
  it('has exactly 14 entries', () => {
    expect(ROOM_DIRECTORY).toHaveLength(14);
  });

  it('every entry has a valid RoomNumber', () => {
    const validRoomNumbers = Object.values(RoomNumber).filter(
      (v) => typeof v === 'number',
    ) as number[];
    for (const entry of ROOM_DIRECTORY) {
      expect(validRoomNumbers).toContain(entry.room);
    }
  });

  it('every entry has a valid SkillDomain', () => {
    const validDomains = Object.values(SkillDomain).filter(
      (v) => typeof v === 'string',
    ) as string[];
    for (const entry of ROOM_DIRECTORY) {
      expect(validDomains).toContain(entry.domain);
    }
  });

  it('every entry has at least 1 tradition', () => {
    for (const entry of ROOM_DIRECTORY) {
      expect(entry.traditions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('rooms 05, 09, 14 are marked isCritical = true', () => {
    const criticalRooms = ROOM_DIRECTORY.filter((e) => e.isCritical);
    const criticalNumbers = criticalRooms.map((e) => e.room);
    expect(criticalNumbers).toContain(RoomNumber.FOOD);       // Room 05
    expect(criticalNumbers).toContain(RoomNumber.PLANTS);     // Room 09
    expect(criticalNumbers).toContain(RoomNumber.ARCTIC_LIVING); // Room 14
    expect(criticalRooms).toHaveLength(3);
  });

  it('room 07 (Metalwork) only has APPALACHIAN tradition', () => {
    const metalwork = ROOM_DIRECTORY.find((e) => e.room === RoomNumber.METALWORK);
    expect(metalwork).toBeDefined();
    expect(metalwork!.traditions).toHaveLength(1);
    expect(metalwork!.traditions).toContain(Tradition.APPALACHIAN);
    expect(metalwork!.traditions).not.toContain(Tradition.FIRST_NATIONS);
    expect(metalwork!.traditions).not.toContain(Tradition.INUIT);
  });

  it('room 13 (Northern Watercraft) has FIRST_NATIONS and INUIT but not APPALACHIAN', () => {
    const watercraft = ROOM_DIRECTORY.find((e) => e.room === RoomNumber.NORTHERN_WATERCRAFT);
    expect(watercraft).toBeDefined();
    expect(watercraft!.traditions).toContain(Tradition.FIRST_NATIONS);
    expect(watercraft!.traditions).toContain(Tradition.INUIT);
    expect(watercraft!.traditions).not.toContain(Tradition.APPALACHIAN);
  });

  it('room 10 (Community/Culture) has empty safetyDomains', () => {
    const community = ROOM_DIRECTORY.find((e) => e.room === RoomNumber.COMMUNITY);
    expect(community).toBeDefined();
    expect(community!.safetyDomains).toHaveLength(0);
  });

  it('room 12 (History/Memory) has empty safetyDomains', () => {
    const history = ROOM_DIRECTORY.find((e) => e.room === RoomNumber.HISTORY);
    expect(history).toBeDefined();
    expect(history!.safetyDomains).toHaveLength(0);
  });

  it('all 14 room numbers are present (no duplicates, no gaps)', () => {
    const rooms = ROOM_DIRECTORY.map((e) => e.room).sort((a, b) => a - b);
    expect(rooms).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });
});

describe('SAFETY_DOMAIN_TO_ROOMS', () => {
  it('covers all 10 safety domains', () => {
    const domains = Object.keys(SAFETY_DOMAIN_TO_ROOMS);
    const expectedDomains = Object.values(SafetyDomain).filter(
      (v) => typeof v === 'string',
    ) as string[];
    for (const domain of expectedDomains) {
      expect(domains).toContain(domain);
    }
    expect(domains).toHaveLength(10);
  });

  it('FOOD domain includes rooms 03, 05, 11', () => {
    const rooms = SAFETY_DOMAIN_TO_ROOMS[SafetyDomain.FOOD];
    expect(rooms).toContain(RoomNumber.ANIMALS);   // Room 03
    expect(rooms).toContain(RoomNumber.FOOD);      // Room 05
    expect(rooms).toContain(RoomNumber.SEASONAL);  // Room 11
  });

  it('ARCTIC_SURVIVAL domain includes rooms 11, 13, 14', () => {
    const rooms = SAFETY_DOMAIN_TO_ROOMS[SafetyDomain.ARCTIC_SURVIVAL];
    expect(rooms).toContain(RoomNumber.SEASONAL);             // Room 11
    expect(rooms).toContain(RoomNumber.NORTHERN_WATERCRAFT);  // Room 13
    expect(rooms).toContain(RoomNumber.ARCTIC_LIVING);        // Room 14
  });
});

describe('TRADITION_TO_ROOMS', () => {
  it('covers all 4 traditions', () => {
    const traditions = Object.keys(TRADITION_TO_ROOMS);
    expect(traditions).toHaveLength(4);
    expect(traditions).toContain(Tradition.APPALACHIAN);
    expect(traditions).toContain(Tradition.FIRST_NATIONS);
    expect(traditions).toContain(Tradition.INUIT);
    expect(traditions).toContain(Tradition.CROSS_TRADITION);
  });

  it('APPALACHIAN does not include rooms 13 and 14', () => {
    const rooms = TRADITION_TO_ROOMS[Tradition.APPALACHIAN];
    expect(rooms).not.toContain(RoomNumber.NORTHERN_WATERCRAFT);
    expect(rooms).not.toContain(RoomNumber.ARCTIC_LIVING);
  });

  it('FIRST_NATIONS and INUIT both include rooms 13 and 14', () => {
    expect(TRADITION_TO_ROOMS[Tradition.FIRST_NATIONS]).toContain(
      RoomNumber.NORTHERN_WATERCRAFT,
    );
    expect(TRADITION_TO_ROOMS[Tradition.FIRST_NATIONS]).toContain(
      RoomNumber.ARCTIC_LIVING,
    );
    expect(TRADITION_TO_ROOMS[Tradition.INUIT]).toContain(
      RoomNumber.NORTHERN_WATERCRAFT,
    );
    expect(TRADITION_TO_ROOMS[Tradition.INUIT]).toContain(
      RoomNumber.ARCTIC_LIVING,
    );
  });

  it('APPALACHIAN does not include room 07 via tradition mapping cross-check', () => {
    // Room 07 has only APPALACHIAN -- verify the tradition mapping is consistent
    expect(TRADITION_TO_ROOMS[Tradition.APPALACHIAN]).toContain(RoomNumber.METALWORK);
    expect(TRADITION_TO_ROOMS[Tradition.FIRST_NATIONS]).not.toContain(RoomNumber.METALWORK);
    expect(TRADITION_TO_ROOMS[Tradition.INUIT]).not.toContain(RoomNumber.METALWORK);
  });
});

describe('SUMO_FILE_TO_ROOMS', () => {
  it('MILO maps to multiple rooms', () => {
    const rooms = SUMO_FILE_TO_ROOMS['MILO'];
    expect(rooms.length).toBeGreaterThan(1);
    expect(rooms).toContain(RoomNumber.FIBER);
    expect(rooms).toContain(RoomNumber.POTTERY);
    expect(rooms).toContain(RoomNumber.HISTORY);
    expect(rooms).toContain(RoomNumber.NORTHERN_WATERCRAFT);
  });

  it('engineering.kif maps to building, woodcraft, metalwork', () => {
    const rooms = SUMO_FILE_TO_ROOMS['engineering.kif'];
    expect(rooms).toContain(RoomNumber.BUILDING);
    expect(rooms).toContain(RoomNumber.WOODCRAFT);
    expect(rooms).toContain(RoomNumber.METALWORK);
  });

  it('all SUMO files produce non-empty room arrays', () => {
    for (const [file, rooms] of Object.entries(SUMO_FILE_TO_ROOMS)) {
      expect(rooms.length).toBeGreaterThan(0, `SUMO file ${file} has no rooms`);
    }
  });
});

// ─── Schema Validation Tests ──────────────────────────────────────────────────

describe('RoomSpecSchema', () => {
  it('accepts valid room-spec data', () => {
    const validData = {
      room: 5,
      domain: 'food',
      title: 'Food & Preservation',
      traditions: ['appalachian', 'first-nations', 'inuit'],
      safetyDomains: ['food', 'fire', 'chemical'],
      sumoClasses: ['Cooking', 'FoodPreservation'],
      sumoFile: 'Food.kif',
      isCritical: true,
    };
    const result = RoomSpecSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid room number (0 out of range)', () => {
    const invalidData = {
      room: 0,
      domain: 'food',
      title: 'Invalid Room',
      traditions: ['appalachian'],
      safetyDomains: [],
      sumoClasses: [],
      sumoFile: 'Food.kif',
      isCritical: false,
    };
    const result = RoomSpecSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid room number (15 out of range)', () => {
    const invalidData = {
      room: 15,
      domain: 'food',
      title: 'Out of Range Room',
      traditions: ['appalachian'],
      safetyDomains: [],
      sumoClasses: [],
      sumoFile: 'Food.kif',
      isCritical: false,
    };
    const result = RoomSpecSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects missing required title field', () => {
    const invalidData = {
      room: 1,
      domain: 'building',
      traditions: ['appalachian'],
      safetyDomains: [],
      sumoClasses: [],
      sumoFile: 'engineering.kif',
      isCritical: false,
    };
    const result = RoomSpecSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid domain string', () => {
    const invalidData = {
      room: 1,
      domain: 'nonexistent-domain',
      title: 'Building',
      traditions: ['appalachian'],
      safetyDomains: [],
      sumoClasses: [],
      sumoFile: 'engineering.kif',
      isCritical: false,
    };
    const result = RoomSpecSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid tradition string', () => {
    const invalidData = {
      room: 1,
      domain: 'building',
      title: 'Building',
      traditions: ['invalid-tradition'],
      safetyDomains: [],
      sumoClasses: [],
      sumoFile: 'engineering.kif',
      isCritical: false,
    };
    const result = RoomSpecSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects empty traditions array', () => {
    const invalidData = {
      room: 1,
      domain: 'building',
      title: 'Building',
      traditions: [],
      safetyDomains: [],
      sumoClasses: [],
      sumoFile: 'engineering.kif',
      isCritical: false,
    };
    const result = RoomSpecSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('SafetyConfigSchema', () => {
  it('accepts valid safety-config data', () => {
    const validData = {
      domain: 'food',
      rules: [
        {
          id: 'food-001',
          pattern: 'canning',
          level: 'gated',
          message: 'Home canning requires verified safe procedures to prevent botulism.',
          isCritical: true,
          canOverride: false,
          source: 'USDA Complete Guide to Home Canning',
        },
      ],
    };
    const result = SafetyConfigSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid domain string', () => {
    const invalidData = {
      domain: 'not-a-domain',
      rules: [],
    };
    const result = SafetyConfigSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects rule with invalid safety level', () => {
    const invalidData = {
      domain: 'food',
      rules: [
        {
          id: 'food-001',
          pattern: 'canning',
          level: 'extreme',
          message: 'Bad level.',
          isCritical: true,
          canOverride: false,
        },
      ],
    };
    const result = SafetyConfigSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts safety-config with optional fields absent', () => {
    const validData = {
      domain: 'plant',
      rules: [
        {
          id: 'plant-001',
          pattern: 'elderberry',
          level: 'annotated',
          message: 'Raw elderberries are toxic. Always cook before consuming.',
          isCritical: true,
          canOverride: false,
        },
      ],
    };
    const result = SafetyConfigSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe('CulturalConfigSchema', () => {
  it('accepts valid cultural-config data', () => {
    const validData = {
      tradition: 'inuit',
      rules: [
        {
          id: 'iq-001',
          level: 4,
          domain: 'ceremonial-knowledge',
          action: 'block',
          explanation:
            'Ceremonial knowledge is sacred and may not be shared outside the community.',
        },
      ],
    };
    const result = CulturalConfigSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid action value', () => {
    const invalidData = {
      tradition: 'inuit',
      rules: [
        {
          id: 'iq-001',
          level: 2,
          domain: 'general',
          action: 'allow-all',
          explanation: 'Not a valid action.',
        },
      ],
    };
    const result = CulturalConfigSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects cultural sovereignty level 5 (out of range)', () => {
    const invalidData = {
      tradition: 'first-nations',
      rules: [
        {
          id: 'fn-001',
          level: 5,
          domain: 'general',
          action: 'include',
          explanation: 'Level 5 does not exist.',
        },
      ],
    };
    const result = CulturalConfigSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('SumoMappingsSchema', () => {
  it('accepts valid sumo-mappings data', () => {
    const validData = {
      room: 5,
      sumoFile: 'Food.kif',
      mappings: [
        {
          heritageConceptId: 'food-preservation-smoking',
          sumoTerm: 'Cooking',
          sumoFile: 'Food.kif',
          mappingType: 'subclass',
          kifStatement: '(subclass SmokingFood Cooking)',
          naturalLanguage: 'Smoking food is a kind of Cooking process.',
        },
      ],
    };
    const result = SumoMappingsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid mappingType', () => {
    const invalidData = {
      room: 5,
      sumoFile: 'Food.kif',
      mappings: [
        {
          heritageConceptId: 'food-smoking',
          sumoTerm: 'Cooking',
          sumoFile: 'Food.kif',
          mappingType: 'analogy',
          kifStatement: '(subclass SmokingFood Cooking)',
          naturalLanguage: 'Smoking food is a kind of Cooking.',
        },
      ],
    };
    const result = SumoMappingsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('TrySessionSchema', () => {
  it('accepts valid try-session data', () => {
    const validData = {
      id: 'session-food-01-smoking',
      title: 'Cold Smoking Fish the Appalachian Way',
      tradition: 'appalachian',
      difficulty: 'intermediate',
      estimatedMinutes: 180,
      description:
        'Learn the traditional Appalachian technique for cold-smoking fish for long-term preservation.',
      prerequisites: ['session-food-00-fire-building'],
      safetyLevel: 'gated',
      culturalLevel: 1,
      sumoProcessClass: 'Cooking',
      steps: [
        {
          order: 1,
          instruction: 'Prepare the brine: combine 1 cup non-iodized salt per gallon of water.',
          safetyNote: 'Use non-iodized salt only. Iodized salt inhibits beneficial bacteria.',
        },
        {
          order: 2,
          instruction: 'Submerge fish in brine for 8-12 hours in the refrigerator.',
        },
      ],
    };
    const result = TrySessionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid difficulty level', () => {
    const invalidData = {
      id: 'session-01',
      title: 'Some Session',
      tradition: 'appalachian',
      difficulty: 'expert',
      estimatedMinutes: 60,
      description: 'A session.',
      prerequisites: [],
      safetyLevel: 'standard',
      culturalLevel: 1,
      sumoProcessClass: 'Process',
      steps: [{ order: 1, instruction: 'Do something.' }],
    };
    const result = TrySessionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects empty steps array', () => {
    const invalidData = {
      id: 'session-01',
      title: 'Empty Steps Session',
      tradition: 'appalachian',
      difficulty: 'beginner',
      estimatedMinutes: 30,
      description: 'No steps.',
      prerequisites: [],
      safetyLevel: 'standard',
      culturalLevel: 1,
      sumoProcessClass: 'Process',
      steps: [],
    };
    const result = TrySessionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects negative estimatedMinutes', () => {
    const invalidData = {
      id: 'session-01',
      title: 'Negative Time Session',
      tradition: 'inuit',
      difficulty: 'beginner',
      estimatedMinutes: -5,
      description: 'Time paradox.',
      prerequisites: [],
      safetyLevel: 'standard',
      culturalLevel: 1,
      sumoProcessClass: 'Process',
      steps: [{ order: 1, instruction: 'Do something.' }],
    };
    const result = TrySessionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid tradition', () => {
    const invalidData = {
      id: 'session-01',
      title: 'Invalid Tradition Session',
      tradition: 'norse',
      difficulty: 'beginner',
      estimatedMinutes: 30,
      description: 'Norse tradition not in scope.',
      prerequisites: [],
      safetyLevel: 'standard',
      culturalLevel: 1,
      sumoProcessClass: 'Process',
      steps: [{ order: 1, instruction: 'Do something.' }],
    };
    const result = TrySessionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('accepts session with all optional step fields present', () => {
    const validData = {
      id: 'session-plant-01',
      title: 'Identifying Medicinal Plants',
      tradition: 'first-nations',
      difficulty: 'advanced',
      estimatedMinutes: 120,
      description: 'Learn to identify and respectfully harvest medicinal plants.',
      prerequisites: [],
      safetyLevel: 'gated',
      culturalLevel: 2,
      sumoProcessClass: 'OrganismProcess',
      steps: [
        {
          order: 1,
          instruction: 'Observe the plant in its natural habitat before harvesting.',
          safetyNote: 'Never harvest more than 10% of any plant population.',
          culturalContext:
            'Many nations follow protocols of offering tobacco or other gifts before harvesting.',
          nationAttribution: 'Anishinaabe harvesting protocols',
          sumoMapping: 'Perceiving',
        },
      ],
    };
    const result = TrySessionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
