/**
 * Tests for the Skill Hall Framework.
 *
 * Coverage:
 * - Room navigation (getRooms, getRoomsByTradition, getRoom)
 * - Tradition filtering (14 rooms total, correct subsets per tradition)
 * - SessionRunner step execution with safety and cultural warden integration
 * - Safety REDIRECT blocks step progression (canProceed=false)
 * - Cultural Level 4 blocks step progression (canProceed=false)
 * - Nation attribution forwarded from step to StepResult
 * - ProgressTracker: completed sessions, difficulty suggestions
 * - Integration hooks: SafetyWarden and CulturalWarden called per step
 * - SUMO path resolution from step.sumoMapping
 *
 * All warden calls use mock implementations for isolated unit testing.
 *
 * @module heritage-skills-pack/skill-hall/framework.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  SkillHallFramework,
  SessionRunner,
  RoomNumber,
  Tradition,
  SafetyLevel,
  SafetyDomain,
  CulturalSovereigntyLevel,
  type RoomView,
  type StepResult,
  type RoomRunnerContext,
} from './framework.js';

import type { SafetyWarden, SafetyEvaluation } from '../safety/warden.js';
import type {
  CulturalSovereigntyWarden,
  CulturalClassification,
  AttributionCheck,
} from '../safety/cultural-warden.js';

import type { TrySession, SessionStep } from '../shared/types.js';

// ─── Mock Factories ───────────────────────────────────────────────────────────

/**
 * Default safe SafetyEvaluation (no issues, canProceed=true).
 */
function makeSafeEvaluation(domain: SafetyDomain = SafetyDomain.TOOL): SafetyEvaluation {
  return {
    domain,
    level: SafetyLevel.STANDARD,
    annotations: [],
    canProceed: true,
    requiredAcknowledgments: [],
  };
}

/**
 * SafetyEvaluation that blocks progression (REDIRECTED).
 */
function makeRedirectedEvaluation(domain: SafetyDomain = SafetyDomain.FOOD): SafetyEvaluation {
  return {
    domain,
    level: SafetyLevel.REDIRECTED,
    annotations: [
      {
        domain,
        level: SafetyLevel.REDIRECTED,
        message: 'Redirected: consult a professional.',
        isCritical: true,
        canOverride: false,
      },
    ],
    canProceed: false,
    requiredAcknowledgments: [],
    redirectTarget: 'https://nchfp.uga.edu/',
  };
}

/**
 * SafetyEvaluation that gates progression (GATED, canProceed=false).
 */
function makeGatedEvaluation(domain: SafetyDomain = SafetyDomain.TOOL): SafetyEvaluation {
  return {
    domain,
    level: SafetyLevel.GATED,
    annotations: [
      {
        domain,
        level: SafetyLevel.GATED,
        message: 'Safety acknowledgment required.',
        isCritical: false,
        canOverride: false,
      },
    ],
    canProceed: false,
    requiredAcknowledgments: ['Safety acknowledgment required.'],
  };
}

/**
 * Default Level 1 CulturalClassification (publicly shared, include).
 */
function makeLevel1Classification(tradition: Tradition = Tradition.FIRST_NATIONS): CulturalClassification {
  return {
    level: CulturalSovereigntyLevel.PUBLICLY_SHARED,
    tradition,
    action: 'include',
    explanation: 'Publicly shared knowledge. Include with attribution.',
  };
}

/**
 * Level 4 CulturalClassification (sacred/ceremonial, hard block).
 */
function makeLevel4Classification(tradition: Tradition = Tradition.FIRST_NATIONS): CulturalClassification {
  return {
    level: CulturalSovereigntyLevel.SACRED_CEREMONIAL,
    tradition,
    action: 'block',
    explanation: 'HARD BLOCK: Sacred or ceremonial content. No reproduction permitted.',
  };
}

/**
 * Default AttributionCheck (passed, no violations).
 */
function makeAttributionCheck(): AttributionCheck {
  return { passed: true, violations: [] };
}

// ─── Mock SafetyWarden ────────────────────────────────────────────────────────

/**
 * Mock SafetyWarden that returns configurable results.
 *
 * Default behavior: safe evaluation (STANDARD, canProceed=true).
 * Override evaluateResult to change the evaluation returned.
 */
class MockSafetyWarden {
  evaluateResult: SafetyEvaluation = makeSafeEvaluation();
  evaluateSpy = vi.fn();

  evaluate(_content: string, domain: SafetyDomain, _tradition?: Tradition): SafetyEvaluation {
    this.evaluateSpy(_content, domain, _tradition);
    return { ...this.evaluateResult, domain };
  }

  evaluateMultiDomain(
    content: string,
    domains: SafetyDomain[],
    tradition?: Tradition,
  ): SafetyEvaluation[] {
    return domains.map((domain) => this.evaluate(content, domain, tradition));
  }

  getCriticalRules(_domain: SafetyDomain) {
    return [];
  }
}

// ─── Mock CulturalWarden ──────────────────────────────────────────────────────

/**
 * Mock CulturalSovereigntyWarden that returns configurable results.
 *
 * Default behavior: Level 1 classification (include).
 * Override classifyResult to change the classification returned.
 */
class MockCulturalWarden {
  classifyResult: CulturalClassification = makeLevel1Classification();
  classifySpy = vi.fn();

  classify(
    content: string,
    tradition: Tradition,
    domain: string,
  ): CulturalClassification {
    this.classifySpy(content, tradition, domain);
    return { ...this.classifyResult, tradition };
  }

  enforceNationAttribution(_content: string): AttributionCheck {
    return makeAttributionCheck();
  }

  checkOCAPCompliance(_content: string): boolean {
    return true;
  }

  checkIQAlignment(_content: string): boolean {
    return true;
  }

  getRedirectionTarget(_tradition: Tradition, _domain: string): string | undefined {
    return undefined;
  }
}

// ─── Test Session/Step Builders ───────────────────────────────────────────────

function makeStep(
  overrides: Partial<SessionStep> & { order: number },
): SessionStep {
  return {
    order: overrides.order,
    instruction: overrides.instruction ?? `Step ${overrides.order} instruction`,
    safetyNote: overrides.safetyNote,
    culturalContext: overrides.culturalContext,
    nationAttribution: overrides.nationAttribution,
    sumoMapping: overrides.sumoMapping,
  };
}

function makeSession(
  overrides: Partial<TrySession> & { id: string },
): TrySession {
  return {
    id: overrides.id,
    title: overrides.title ?? 'Test Session',
    tradition: overrides.tradition ?? Tradition.APPALACHIAN,
    difficulty: overrides.difficulty ?? 'beginner',
    estimatedMinutes: overrides.estimatedMinutes ?? 30,
    description: overrides.description ?? 'A test session.',
    prerequisites: overrides.prerequisites ?? [],
    safetyLevel: overrides.safetyLevel ?? SafetyLevel.STANDARD,
    culturalLevel: overrides.culturalLevel ?? CulturalSovereigntyLevel.PUBLICLY_SHARED,
    steps: overrides.steps ?? [makeStep({ order: 1 })],
    sumoProcessClass: overrides.sumoProcessClass ?? 'Making',
  };
}

// ─── Test Context Builder ─────────────────────────────────────────────────────

function makeRoomContext(overrides?: Partial<RoomRunnerContext>): RoomRunnerContext {
  return {
    room: overrides?.room ?? RoomNumber.WOODCRAFT,
    safetyDomains: overrides?.safetyDomains ?? [SafetyDomain.TOOL],
    isCritical: overrides?.isCritical ?? false,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SkillHallFramework', () => {
  let safetyWarden: MockSafetyWarden;
  let culturalWarden: MockCulturalWarden;
  let framework: SkillHallFramework;

  beforeEach(() => {
    safetyWarden = new MockSafetyWarden();
    culturalWarden = new MockCulturalWarden();
    framework = new SkillHallFramework(
      safetyWarden as unknown as SafetyWarden,
      culturalWarden as unknown as CulturalSovereigntyWarden,
    );
  });

  // ─── Room Navigation ─────────────────────────────────────────────────────────

  describe('Room Navigation', () => {
    it('should return all 14 rooms from getRooms()', () => {
      // Act
      const rooms = framework.getRooms();
      // Assert
      expect(rooms).toHaveLength(14);
    });

    it('should return rooms with correct structure', () => {
      // Act
      const rooms = framework.getRooms();
      // Assert
      for (const room of rooms) {
        expect(room).toHaveProperty('room');
        expect(room).toHaveProperty('domain');
        expect(room).toHaveProperty('title');
        expect(room).toHaveProperty('description');
        expect(room).toHaveProperty('traditions');
        expect(room).toHaveProperty('safetyDomains');
        expect(room).toHaveProperty('availableSessions');
        expect(room).toHaveProperty('isCritical');
      }
    });

    it('should return room by number from getRoom()', () => {
      // Act
      const room = framework.getRoom(RoomNumber.BUILDING);
      // Assert
      expect(room).toBeDefined();
      expect(room?.room).toBe(RoomNumber.BUILDING);
      expect(room?.title).toBe('Building & Shelter');
    });

    it('should return undefined for invalid room number', () => {
      // Act
      const room = framework.getRoom(999 as RoomNumber);
      // Assert
      expect(room).toBeUndefined();
    });

    it('should include isCritical=true for Room 05 (Food)', () => {
      // Act
      const foodRoom = framework.getRoom(RoomNumber.FOOD);
      // Assert
      expect(foodRoom?.isCritical).toBe(true);
    });

    it('should include isCritical=true for Room 09 (Plants)', () => {
      // Act
      const plantsRoom = framework.getRoom(RoomNumber.PLANTS);
      // Assert
      expect(plantsRoom?.isCritical).toBe(true);
    });

    it('should include isCritical=true for Room 14 (Arctic Living)', () => {
      // Act
      const arcticRoom = framework.getRoom(RoomNumber.ARCTIC_LIVING);
      // Assert
      expect(arcticRoom?.isCritical).toBe(true);
    });

    it('should include isCritical=false for Room 01 (Building)', () => {
      // Act
      const buildingRoom = framework.getRoom(RoomNumber.BUILDING);
      // Assert
      expect(buildingRoom?.isCritical).toBe(false);
    });

    it('should show registered sessions in room view', () => {
      // Arrange
      const session = makeSession({ id: 'test-session-1' });
      framework.registerSessions(RoomNumber.WOODCRAFT, [session]);
      // Act
      const room = framework.getRoom(RoomNumber.WOODCRAFT);
      // Assert
      expect(room?.availableSessions).toHaveLength(1);
      expect(room?.availableSessions[0].id).toBe('test-session-1');
    });

    it('should show empty availableSessions for rooms with no registered sessions', () => {
      // Act (no sessions registered)
      const room = framework.getRoom(RoomNumber.MUSIC);
      // Assert
      expect(room?.availableSessions).toHaveLength(0);
    });
  });

  // ─── Tradition Filtering ──────────────────────────────────────────────────────

  describe('Tradition Filtering', () => {
    it('should return rooms matching tradition from getRoomsByTradition()', () => {
      // Act
      const appalachianRooms = framework.getRoomsByTradition(Tradition.APPALACHIAN);
      // Assert -- all returned rooms must include APPALACHIAN in their traditions
      for (const room of appalachianRooms) {
        expect(room.traditions).toContain(Tradition.APPALACHIAN);
      }
    });

    it('should return 12 rooms for Appalachian tradition', () => {
      // Act -- APPALACHIAN has 12 rooms (Building through History, excludes Northern Watercraft=13 and Arctic Living=14)
      const rooms = framework.getRoomsByTradition(Tradition.APPALACHIAN);
      // Assert
      expect(rooms).toHaveLength(12);
    });

    it('should return 13 rooms for FIRST_NATIONS tradition', () => {
      // Act -- FIRST_NATIONS has 13 rooms (all except METALWORK=7)
      const rooms = framework.getRoomsByTradition(Tradition.FIRST_NATIONS);
      // Assert
      expect(rooms).toHaveLength(13);
    });

    it('should return 13 rooms for INUIT tradition', () => {
      // Act -- INUIT has 13 rooms (all except METALWORK=7)
      const rooms = framework.getRoomsByTradition(Tradition.INUIT);
      // Assert
      expect(rooms).toHaveLength(13);
    });

    it('should not include Room 13 (Northern Watercraft) in Appalachian rooms', () => {
      // Act
      const rooms = framework.getRoomsByTradition(Tradition.APPALACHIAN);
      const roomNumbers = rooms.map((r) => r.room);
      // Assert
      expect(roomNumbers).not.toContain(RoomNumber.NORTHERN_WATERCRAFT);
    });

    it('should not include Room 14 (Arctic Living) in Appalachian rooms', () => {
      // Act
      const rooms = framework.getRoomsByTradition(Tradition.APPALACHIAN);
      const roomNumbers = rooms.map((r) => r.room);
      // Assert
      expect(roomNumbers).not.toContain(RoomNumber.ARCTIC_LIVING);
    });

    it('should not include Room 7 (Metalwork) in FIRST_NATIONS rooms', () => {
      // Act
      const rooms = framework.getRoomsByTradition(Tradition.FIRST_NATIONS);
      const roomNumbers = rooms.map((r) => r.room);
      // Assert
      expect(roomNumbers).not.toContain(RoomNumber.METALWORK);
    });

    it('should not include Room 7 (Metalwork) in INUIT rooms', () => {
      // Act
      const rooms = framework.getRoomsByTradition(Tradition.INUIT);
      const roomNumbers = rooms.map((r) => r.room);
      // Assert
      expect(roomNumbers).not.toContain(RoomNumber.METALWORK);
    });

    it('should include Room 7 (Metalwork) in APPALACHIAN rooms', () => {
      // Act
      const rooms = framework.getRoomsByTradition(Tradition.APPALACHIAN);
      const roomNumbers = rooms.map((r) => r.room);
      // Assert
      expect(roomNumbers).toContain(RoomNumber.METALWORK);
    });

    it('should return empty array for CROSS_TRADITION', () => {
      // Act
      const rooms = framework.getRoomsByTradition(Tradition.CROSS_TRADITION);
      // Assert
      expect(rooms).toHaveLength(0);
    });

    it('should include cross-tradition rooms (Building=1) in all major traditions', () => {
      // Building has APPALACHIAN, FIRST_NATIONS, INUIT -- it is cross-tradition in practice
      // Act
      const appalachian = framework.getRoomsByTradition(Tradition.APPALACHIAN);
      const firstNations = framework.getRoomsByTradition(Tradition.FIRST_NATIONS);
      const inuit = framework.getRoomsByTradition(Tradition.INUIT);
      // Assert
      const appNumbers = appalachian.map((r) => r.room);
      const fnNumbers = firstNations.map((r) => r.room);
      const inuitNumbers = inuit.map((r) => r.room);
      expect(appNumbers).toContain(RoomNumber.BUILDING);
      expect(fnNumbers).toContain(RoomNumber.BUILDING);
      expect(inuitNumbers).toContain(RoomNumber.BUILDING);
    });
  });

  // ─── SessionRunner ────────────────────────────────────────────────────────────

  describe('SessionRunner', () => {
    it('should return StepResult from nextStep()', () => {
      // Arrange
      const session = makeSession({ id: 'run-1' });
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result).not.toBeNull();
      expect(result?.step).toBeDefined();
      expect(result?.canProceed).toBeDefined();
      expect(Array.isArray(result?.warnings)).toBe(true);
    });

    it('should include safety evaluation in StepResult when room has safety domains', () => {
      // Arrange
      const session = makeSession({
        id: 'safety-1',
        steps: [makeStep({ order: 1, instruction: 'Use an axe to split wood.' })],
      });
      framework.registerSessions(RoomNumber.WOODCRAFT, [session]);
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert -- Woodcraft has TOOL safety domain; should produce evaluation
      expect(result?.safetyEvaluation).toBeDefined();
    });

    it('should inject cultural classification for non-Appalachian sessions', () => {
      // Arrange
      const session = makeSession({
        id: 'cultural-1',
        tradition: Tradition.FIRST_NATIONS,
        steps: [makeStep({ order: 1 })],
      });
      framework.registerSessions(RoomNumber.BUILDING, [session]);
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.culturalClassification).toBeDefined();
      expect(culturalWarden.classifySpy).toHaveBeenCalledOnce();
    });

    it('should inject cultural classification for INUIT sessions', () => {
      // Arrange
      const session = makeSession({
        id: 'inuit-session-1',
        tradition: Tradition.INUIT,
        steps: [makeStep({ order: 1 })],
      });
      framework.registerSessions(RoomNumber.NORTHERN_WATERCRAFT, [session]);
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.culturalClassification).toBeDefined();
      expect(culturalWarden.classifySpy).toHaveBeenCalledOnce();
    });

    it('should not inject cultural classification for Appalachian sessions', () => {
      // Arrange
      const session = makeSession({
        id: 'app-session-1',
        tradition: Tradition.APPALACHIAN,
        steps: [makeStep({ order: 1 })],
      });
      framework.registerSessions(RoomNumber.WOODCRAFT, [session]);
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.culturalClassification).toBeUndefined();
      expect(culturalWarden.classifySpy).not.toHaveBeenCalled();
    });

    it('should set canProceed=false when safety redirects', () => {
      // Arrange -- configure mock to return REDIRECTED
      safetyWarden.evaluateResult = makeRedirectedEvaluation(SafetyDomain.TOOL);

      const session = makeSession({
        id: 'redirect-1',
        steps: [makeStep({ order: 1, instruction: 'Use gasoline to start the forge.' })],
      });
      framework.registerSessions(RoomNumber.WOODCRAFT, [session]);
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.canProceed).toBe(false);
      expect(result?.safetyEvaluation?.level).toBe(SafetyLevel.REDIRECTED);
    });

    it('should set canProceed=false when cultural level 4 blocks', () => {
      // Arrange -- configure mock to return Level 4
      culturalWarden.classifyResult = makeLevel4Classification(Tradition.FIRST_NATIONS);

      const session = makeSession({
        id: 'cultural-block-1',
        tradition: Tradition.FIRST_NATIONS,
        steps: [makeStep({ order: 1 })],
      });
      framework.registerSessions(RoomNumber.COMMUNITY, [session]);
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.canProceed).toBe(false);
      expect(result?.culturalClassification?.level).toBe(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
    });

    it('should set canProceed=false when cultural action is block', () => {
      // Arrange
      culturalWarden.classifyResult = {
        level: CulturalSovereigntyLevel.SACRED_CEREMONIAL,
        tradition: Tradition.INUIT,
        action: 'block',
        explanation: 'Hard block applied.',
      };

      const session = makeSession({
        id: 'action-block-1',
        tradition: Tradition.INUIT,
        steps: [makeStep({ order: 1 })],
      });
      framework.registerSessions(RoomNumber.ARCTIC_LIVING, [session]);
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.canProceed).toBe(false);
    });

    it('should include nationAttribution when step has it', () => {
      // Arrange
      const session = makeSession({
        id: 'nation-attr-1',
        tradition: Tradition.FIRST_NATIONS,
        steps: [
          makeStep({
            order: 1,
            instruction: 'Bend the birch bark over the canoe frame.',
            nationAttribution: 'Maliseet (Wolastoqiyik) tradition',
          }),
        ],
      });
      framework.registerSessions(RoomNumber.NORTHERN_WATERCRAFT, [session]);
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.nationAttribution).toBe('Maliseet (Wolastoqiyik) tradition');
    });

    it('should not include nationAttribution when step does not have it', () => {
      // Arrange
      const session = makeSession({
        id: 'no-nation-1',
        steps: [makeStep({ order: 1 })],
      });
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.nationAttribution).toBeUndefined();
    });

    it('should return null when all steps complete', () => {
      // Arrange -- one step session
      const session = makeSession({
        id: 'null-1',
        steps: [makeStep({ order: 1 })],
      });
      const runner = framework.startSession(session);
      // Act
      const first = runner.nextStep();
      const second = runner.nextStep(); // should be null
      // Assert
      expect(first).not.toBeNull();
      expect(second).toBeNull();
    });

    it('should track current step number correctly', () => {
      // Arrange -- two step session
      const session = makeSession({
        id: 'step-count-1',
        steps: [makeStep({ order: 1 }), makeStep({ order: 2 })],
      });
      const runner = framework.startSession(session);
      // Assert initial
      expect(runner.getCurrentStepNumber()).toBe(0);
      // Act
      runner.nextStep();
      expect(runner.getCurrentStepNumber()).toBe(1);
      runner.nextStep();
      expect(runner.getCurrentStepNumber()).toBe(2);
    });

    it('should report isComplete() correctly', () => {
      // Arrange -- one step session
      const session = makeSession({
        id: 'complete-1',
        steps: [makeStep({ order: 1 })],
      });
      const runner = framework.startSession(session);
      // Assert before
      expect(runner.isComplete()).toBe(false);
      // Act
      runner.nextStep();
      // Assert after
      expect(runner.isComplete()).toBe(true);
    });

    it('should report getTotalSteps() correctly', () => {
      // Arrange
      const session = makeSession({
        id: 'total-steps-1',
        steps: [makeStep({ order: 1 }), makeStep({ order: 2 }), makeStep({ order: 3 })],
      });
      const runner = framework.startSession(session);
      // Assert
      expect(runner.getTotalSteps()).toBe(3);
    });

    it('should execute steps in order regardless of step.order values', () => {
      // Arrange -- steps provided out of order in array
      const session = makeSession({
        id: 'order-1',
        steps: [
          makeStep({ order: 3, instruction: 'Step three' }),
          makeStep({ order: 1, instruction: 'Step one' }),
          makeStep({ order: 2, instruction: 'Step two' }),
        ],
      });
      const runner = framework.startSession(session);
      // Act
      const results: StepResult[] = [];
      let r: StepResult | null;
      while ((r = runner.nextStep()) !== null) {
        results.push(r);
      }
      // Assert -- steps should be in order 1, 2, 3
      expect(results[0].step.instruction).toBe('Step one');
      expect(results[1].step.instruction).toBe('Step two');
      expect(results[2].step.instruction).toBe('Step three');
    });

    it('should include SUMO path in StepResult when step has sumoMapping', () => {
      // Arrange
      const session = makeSession({
        id: 'sumo-1',
        steps: [makeStep({ order: 1, sumoMapping: 'Cooking' })],
      });
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.sumoPath).toBeDefined();
      expect(Array.isArray(result?.sumoPath)).toBe(true);
      expect(result?.sumoPath?.[0]).toBe('Cooking');
    });

    it('should not include SUMO path when step has no sumoMapping', () => {
      // Arrange
      const session = makeSession({
        id: 'no-sumo-1',
        steps: [makeStep({ order: 1 })],
      });
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert
      expect(result?.sumoPath).toBeUndefined();
    });

    it('should aggregate warnings from both wardens', () => {
      // Arrange -- safety warden returns GATED (adds a warning)
      //            cultural warden returns Level 2 (adds an informational warning)
      safetyWarden.evaluateResult = makeGatedEvaluation(SafetyDomain.TOOL);
      culturalWarden.classifyResult = {
        level: CulturalSovereigntyLevel.CONTEXTUALLY_SHARED,
        tradition: Tradition.FIRST_NATIONS,
        action: 'summarize-and-refer',
        explanation: 'Level 2: Summarize and refer to community educational resources.',
      };

      const session = makeSession({
        id: 'aggregate-warnings-1',
        tradition: Tradition.FIRST_NATIONS,
        steps: [makeStep({ order: 1 })],
      });
      framework.registerSessions(RoomNumber.WOODCRAFT, [session]);
      const runner = framework.startSession(session);
      // Act
      const result = runner.nextStep();
      // Assert -- warnings from both wardens
      expect(result?.warnings.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Integration Hooks ────────────────────────────────────────────────────────

  describe('Integration Hooks', () => {
    it('should call SafetyWarden.evaluate before each step', () => {
      // Arrange
      const session = makeSession({
        id: 'hook-safety-1',
        steps: [makeStep({ order: 1 }), makeStep({ order: 2 })],
      });
      framework.registerSessions(RoomNumber.WOODCRAFT, [session]);
      const runner = framework.startSession(session);
      // Act
      runner.nextStep();
      runner.nextStep();
      // Assert -- evaluate called once per step
      expect(safetyWarden.evaluateSpy).toHaveBeenCalledTimes(2);
    });

    it('should call CulturalSovereigntyWarden.classify for Indigenous content', () => {
      // Arrange
      const session = makeSession({
        id: 'hook-cultural-1',
        tradition: Tradition.FIRST_NATIONS,
        steps: [makeStep({ order: 1 }), makeStep({ order: 2 })],
      });
      framework.registerSessions(RoomNumber.BUILDING, [session]);
      const runner = framework.startSession(session);
      // Act
      runner.nextStep();
      runner.nextStep();
      // Assert -- classify called once per step
      expect(culturalWarden.classifySpy).toHaveBeenCalledTimes(2);
    });

    it('should NOT call CulturalSovereigntyWarden.classify for Appalachian content', () => {
      // Arrange
      const session = makeSession({
        id: 'hook-no-cultural-1',
        tradition: Tradition.APPALACHIAN,
        steps: [makeStep({ order: 1 }), makeStep({ order: 2 })],
      });
      framework.registerSessions(RoomNumber.WOODCRAFT, [session]);
      const runner = framework.startSession(session);
      // Act
      runner.nextStep();
      runner.nextStep();
      // Assert -- classify not called for Appalachian content
      expect(culturalWarden.classifySpy).not.toHaveBeenCalled();
    });
  });

  // ─── ProgressTracker ─────────────────────────────────────────────────────────

  describe('ProgressTracker', () => {
    it('should start with no completed sessions', () => {
      // Act
      const progress = framework.getProgress();
      // Assert
      expect(progress.getCompletedSessions()).toHaveLength(0);
    });

    it('should track completed sessions after markCompleted()', () => {
      // Act
      const progress = framework.getProgress();
      progress.markCompleted('session-abc');
      progress.markCompleted('session-xyz');
      // Assert
      const completed = progress.getCompletedSessions();
      expect(completed).toContain('session-abc');
      expect(completed).toContain('session-xyz');
      expect(completed).toHaveLength(2);
    });

    it('should not duplicate completed sessions', () => {
      // Act
      const progress = framework.getProgress();
      progress.markCompleted('session-abc');
      progress.markCompleted('session-abc'); // duplicate
      // Assert
      expect(progress.getCompletedSessions()).toHaveLength(1);
    });

    it('should suggest beginner for rooms with no completions', () => {
      // Arrange -- register sessions but mark none complete
      const beginnerSession = makeSession({
        id: 'beg-1',
        difficulty: 'beginner',
      });
      const intermediateSession = makeSession({
        id: 'int-1',
        difficulty: 'intermediate',
      });
      framework.registerSessions(RoomNumber.WOODCRAFT, [beginnerSession, intermediateSession]);
      // Act
      const progress = framework.getProgress();
      const suggestion = progress.suggestNextDifficulty(RoomNumber.WOODCRAFT);
      // Assert
      expect(suggestion).toBe('beginner');
    });

    it('should suggest intermediate after beginner completions', () => {
      // Arrange
      const beginnerSession = makeSession({
        id: 'beg-2',
        difficulty: 'beginner',
      });
      const intermediateSession = makeSession({
        id: 'int-2',
        difficulty: 'intermediate',
      });
      framework.registerSessions(RoomNumber.WOODCRAFT, [beginnerSession, intermediateSession]);
      const progress = framework.getProgress();
      progress.markCompleted('beg-2');
      // Act
      const suggestion = progress.suggestNextDifficulty(RoomNumber.WOODCRAFT);
      // Assert
      expect(suggestion).toBe('intermediate');
    });

    it('should suggest advanced after intermediate completions', () => {
      // Arrange
      const beginnerSession = makeSession({
        id: 'beg-3',
        difficulty: 'beginner',
      });
      const intermediateSession = makeSession({
        id: 'int-3',
        difficulty: 'intermediate',
      });
      framework.registerSessions(RoomNumber.WOODCRAFT, [beginnerSession, intermediateSession]);
      const progress = framework.getProgress();
      progress.markCompleted('beg-3');
      progress.markCompleted('int-3');
      // Act
      const suggestion = progress.suggestNextDifficulty(RoomNumber.WOODCRAFT);
      // Assert
      expect(suggestion).toBe('advanced');
    });

    it('should suggest beginner for rooms with no registered sessions', () => {
      // Act (no sessions registered for MUSIC)
      const progress = framework.getProgress();
      const suggestion = progress.suggestNextDifficulty(RoomNumber.MUSIC);
      // Assert -- default to beginner when no sessions registered
      expect(suggestion).toBe('beginner');
    });
  });

  // ─── SUMO Browser Overlay ─────────────────────────────────────────────────────

  describe('SUMO Browser Overlay', () => {
    it('should return hierarchy path for known SUMO term via getSUMOPath()', () => {
      // Arrange
      const session = makeSession({
        id: 'sumo-overlay-1',
        steps: [makeStep({ order: 1, sumoMapping: 'Making' })],
      });
      const runner = framework.startSession(session);
      const step = session.steps[0];
      // Act
      const path = runner.getSUMOPath(step);
      // Assert
      expect(path).toBeDefined();
      expect(path).toContain('Making');
      expect(path).toContain('Entity'); // SUMO root
    });

    it('should return path with term only for unknown SUMO term', () => {
      // Arrange
      const session = makeSession({
        id: 'sumo-overlay-2',
        steps: [makeStep({ order: 1, sumoMapping: 'UnknownSUMOTerm' })],
      });
      const runner = framework.startSession(session);
      const step = session.steps[0];
      // Act
      const path = runner.getSUMOPath(step);
      // Assert
      expect(path).toEqual(['UnknownSUMOTerm']);
    });

    it('should return undefined from getSUMOPath() when step has no sumoMapping', () => {
      // Arrange
      const session = makeSession({
        id: 'sumo-overlay-3',
        steps: [makeStep({ order: 1 })],
      });
      const runner = framework.startSession(session);
      const step = session.steps[0];
      // Act
      const path = runner.getSUMOPath(step);
      // Assert
      expect(path).toBeUndefined();
    });

    it('should include "Entity" as root in hierarchy path for Cooking', () => {
      // Arrange
      const session = makeSession({
        id: 'sumo-cooking-1',
        steps: [makeStep({ order: 1, sumoMapping: 'Cooking' })],
      });
      const runner = framework.startSession(session);
      const step = session.steps[0];
      // Act
      const path = runner.getSUMOPath(step);
      // Assert -- path should go from Cooking up to Entity
      expect(path?.at(-1)).toBe('Entity');
    });
  });

  // ─── Direct SessionRunner Construction ───────────────────────────────────────

  describe('SessionRunner direct construction', () => {
    it('should work with directly constructed SessionRunner', () => {
      // Arrange
      const session = makeSession({
        id: 'direct-1',
        tradition: Tradition.APPALACHIAN,
        steps: [makeStep({ order: 1 }), makeStep({ order: 2 })],
      });
      const context = makeRoomContext();
      const runner = new SessionRunner(
        session,
        safetyWarden as unknown as SafetyWarden,
        culturalWarden as unknown as CulturalSovereigntyWarden,
        context,
      );
      // Act & Assert
      expect(runner.getTotalSteps()).toBe(2);
      expect(runner.isComplete()).toBe(false);
      const result = runner.nextStep();
      expect(result).not.toBeNull();
      expect(runner.getCurrentStepNumber()).toBe(1);
    });
  });
});
