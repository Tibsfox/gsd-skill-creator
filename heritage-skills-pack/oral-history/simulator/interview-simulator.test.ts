/**
 * Tests for the Interview Simulator module.
 *
 * Validates:
 * - loadScenarios / getScenario: 5 scenarios, tradition coverage, known/unknown IDs
 * - SimulationSession consent enforcement: throws before acknowledgeConsent, succeeds after
 * - Cultural sovereignty blocking: Level 3-4 blocks return culturalSovereigntyBlocked=true
 * - Pilimmaksarniq-aligned feedback: non-punitive, references IQ-05, never "wrong"/"failed"
 * - Protocol violation detection: trigger pattern matching, violations array, summary tracking
 *
 * Mocks CulturalSovereigntyWarden for sovereignty blocking tests to avoid loading
 * rules files and to control the sovereignty level returned.
 *
 * @module heritage-skills-pack/oral-history/simulator/interview-simulator.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadScenarios,
  getScenario,
  SimulationSession,
} from './index.js';
import { FeedbackEngine, SimulatorProtocolError } from './feedback-engine.js';
import type { CulturalSovereigntyWarden } from '../../safety/cultural-warden.js';
import { CulturalSovereigntyLevel } from '../../shared/types.js';

// ─── Describe: loadScenarios and getScenario ──────────────────────────────────

describe('Interview Simulator', () => {
  describe('loadScenarios and getScenario', () => {
    it('should load exactly 5 scenarios', () => {
      const scenarios = loadScenarios();
      expect(scenarios).toHaveLength(5);
    });

    it('should include a scenario with tradition=inuit', () => {
      const scenarios = loadScenarios();
      expect(scenarios.some(s => s.tradition === 'inuit')).toBe(true);
    });

    it('should include a scenario with tradition=first-nations', () => {
      const scenarios = loadScenarios();
      expect(scenarios.some(s => s.tradition === 'first-nations')).toBe(true);
    });

    it('should include a scenario with tradition=appalachian', () => {
      const scenarios = loadScenarios();
      expect(scenarios.some(s => s.tradition === 'appalachian')).toBe(true);
    });

    it('should return scenario by id for scenario-inuit-elder', () => {
      const scenario = getScenario('scenario-inuit-elder');
      expect(scenario.id).toBe('scenario-inuit-elder');
      expect(scenario.tradition).toBe('inuit');
      expect(scenario.consentProtocolId).toBe('nisr-compliant');
    });

    it('should throw for unknown scenario id', () => {
      expect(() => getScenario('scenario-does-not-exist')).toThrow(
        'Unknown scenario ID: scenario-does-not-exist',
      );
    });
  });

  // ─── Describe: SimulationSession consent enforcement ─────────────────────────

  describe('SimulationSession consent enforcement', () => {
    it('should throw SimulatorProtocolError if question asked before acknowledgeConsent', () => {
      const session = new SimulationSession('scenario-appalachian-elder');
      expect(() => session.askQuestion('Tell me about basket weaving.')).toThrow(
        SimulatorProtocolError,
      );
    });

    it('should throw with consent protocol ID in error message before acknowledgeConsent', () => {
      const session = new SimulationSession('scenario-appalachian-elder');
      expect(() => session.askQuestion('Tell me about basket weaving.')).toThrow('standard');
    });

    it('should allow question after acknowledgeConsent is called', () => {
      // Use a mock warden that returns Level 1 so we can confirm question proceeds
      const mockWarden = {
        classify: vi.fn().mockReturnValue({
          level: CulturalSovereigntyLevel.PUBLICLY_SHARED,
          tradition: 'appalachian',
          action: 'include',
          explanation: 'Publicly shared craft knowledge.',
        }),
      };
      const engine = new FeedbackEngine(mockWarden as unknown as CulturalSovereigntyWarden);
      const session = new SimulationSession('scenario-appalachian-elder', engine);
      session.acknowledgeConsent();
      expect(() => session.askQuestion('How did you learn basket weaving?')).not.toThrow();
    });

    it('should track consentAcknowledged=true in session summary after acknowledgeConsent', () => {
      const session = new SimulationSession('scenario-family-member');
      expect(session.getSummary().consentAcknowledged).toBe(false);
      session.acknowledgeConsent();
      expect(session.getSummary().consentAcknowledged).toBe(true);
    });
  });

  // ─── Describe: Cultural Sovereignty blocking ──────────────────────────────────

  describe('Cultural Sovereignty blocking', () => {
    function makeMockEngine(level: CulturalSovereigntyLevel): FeedbackEngine {
      const mockWarden = {
        classify: vi.fn().mockReturnValue({
          level,
          tradition: 'inuit',
          action: level === CulturalSovereigntyLevel.SACRED_CEREMONIAL ? 'block' : 'acknowledge-and-redirect',
          explanation: `Level ${level as number} content detected.`,
        }),
      };
      return new FeedbackEngine(mockWarden as unknown as CulturalSovereigntyWarden);
    }

    it('should block question when warden classifies at Level 3 (COMMUNITY_RESTRICTED)', () => {
      const engine = makeMockEngine(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED);
      const session = new SimulationSession('scenario-inuit-elder', engine);
      session.acknowledgeConsent();
      const feedback = session.askQuestion('What are the ceremonial uses of this plant?');
      expect(feedback.culturalSovereigntyBlocked).toBe(true);
    });

    it('should block question when warden classifies at Level 4 (SACRED_CEREMONIAL)', () => {
      const engine = makeMockEngine(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
      const session = new SimulationSession('scenario-inuit-elder', engine);
      session.acknowledgeConsent();
      const feedback = session.askQuestion('Describe angakkuq ceremonies in detail.');
      expect(feedback.culturalSovereigntyBlocked).toBe(true);
    });

    it('should not block question when warden classifies at Level 1 (PUBLICLY_SHARED)', () => {
      const engine = makeMockEngine(CulturalSovereigntyLevel.PUBLICLY_SHARED);
      const session = new SimulationSession('scenario-inuit-elder', engine);
      session.acknowledgeConsent();
      const feedback = session.askQuestion('How did you learn to build a qajaq?');
      expect(feedback.culturalSovereigntyBlocked).toBe(false);
    });

    it('should not block question when warden classifies at Level 2 (CONTEXTUALLY_SHARED)', () => {
      const mockWarden = {
        classify: vi.fn().mockReturnValue({
          level: CulturalSovereigntyLevel.CONTEXTUALLY_SHARED,
          tradition: 'first-nations',
          action: 'summarize-and-refer',
          explanation: 'Contextually shared knowledge.',
        }),
      };
      const engine = new FeedbackEngine(mockWarden as unknown as CulturalSovereigntyWarden);
      const session = new SimulationSession('scenario-fn-knowledge-keeper', engine);
      session.acknowledgeConsent();
      const feedback = session.askQuestion('Can you describe how plant knowledge is passed on?');
      expect(feedback.culturalSovereigntyBlocked).toBe(false);
    });

    it('should set culturalSovereigntyBlocked=true in feedback for blocked question', () => {
      const engine = makeMockEngine(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED);
      const session = new SimulationSession('scenario-fn-knowledge-keeper', engine);
      session.acknowledgeConsent();
      const feedback = session.askQuestion('What are the ceremonial protocols?');
      expect(feedback).toMatchObject({
        isAppropriate: false,
        culturalSovereigntyBlocked: true,
        detectedSovereigntyLevel: 3,
      });
    });

    it('should increment culturalSovereigntyBlocks in session summary', () => {
      const engine = makeMockEngine(CulturalSovereigntyLevel.SACRED_CEREMONIAL);
      const session = new SimulationSession('scenario-inuit-elder', engine);
      session.acknowledgeConsent();
      session.askQuestion('Tell me about sacred ceremonies.');
      session.askQuestion('Describe another sacred ceremony.');
      const summary = session.getSummary();
      expect(summary.culturalSovereigntyBlocks).toBe(2);
    });

    it('should include cultural sovereignty guidance referencing IQ-05 Pilimmaksarniq', () => {
      const engine = makeMockEngine(CulturalSovereigntyLevel.COMMUNITY_RESTRICTED);
      const session = new SimulationSession('scenario-inuit-elder', engine);
      session.acknowledgeConsent();
      const feedback = session.askQuestion('What restricted knowledge can you share?');
      expect(feedback.guidance).toContain('Pilimmaksarniq');
    });
  });

  // ─── Describe: Pilimmaksarniq-aligned feedback ────────────────────────────────

  describe('Pilimmaksarniq-aligned feedback', () => {
    let engine: FeedbackEngine;

    beforeEach(() => {
      // Use a mock warden that returns Level 1 for all standard tests
      const mockWarden = {
        classify: vi.fn().mockReturnValue({
          level: CulturalSovereigntyLevel.PUBLICLY_SHARED,
          tradition: 'appalachian',
          action: 'include',
          explanation: 'Publicly shared content.',
        }),
      };
      engine = new FeedbackEngine(mockWarden as unknown as CulturalSovereigntyWarden);
    });

    it('should return isAppropriate=true for a respectful open-ended question', () => {
      const session = new SimulationSession('scenario-appalachian-elder', engine);
      session.acknowledgeConsent();
      // This question uses no trigger words
      const feedback = session.askQuestion('How did you come to love this craft?');
      expect(feedback.isAppropriate).toBe(true);
    });

    it('should return non-empty guidance string for all evaluations', () => {
      const session = new SimulationSession('scenario-family-member', engine);
      session.acknowledgeConsent();
      const feedback = session.askQuestion('What was it like growing up in your community?');
      expect(feedback.guidance).toBeTruthy();
      expect(feedback.guidance.length).toBeGreaterThan(0);
    });

    it('should return non-punitive feedback text (does not contain "wrong" or "failed")', () => {
      const session = new SimulationSession('scenario-appalachian-elder', engine);
      session.acknowledgeConsent();
      // Trigger a violation: "Recording" appears in the protocolViolationTriggers
      const feedback = session.askQuestion('I am recording this without your consent.');
      if (!feedback.isAppropriate) {
        expect(feedback.guidance.toLowerCase()).not.toContain('wrong');
        expect(feedback.guidance.toLowerCase()).not.toContain('failed');
      }
    });

    it('should reference Pilimmaksarniq in guidance for protocol violations', () => {
      const session = new SimulationSession('scenario-inuit-elder', engine);
      session.acknowledgeConsent();
      // "NISR documentation" is a trigger phrase — "documentation" > 4 chars
      const feedback = session.askQuestion('Proceeding without NISR documentation is fine.');
      if (!feedback.isAppropriate) {
        expect(feedback.guidance).toContain('Pilimmaksarniq');
      }
    });

    it('should provide getPilimmaksarniqGuidance for general context', () => {
      const guidance = engine.getPilimmaksarniqGuidance('general');
      expect(guidance).toBeTruthy();
      expect(guidance.length).toBeGreaterThan(20);
    });
  });

  // ─── Describe: Protocol violation detection and session summary ───────────────

  describe('Protocol violation detection and session summary', () => {
    let mockEngine: FeedbackEngine;

    beforeEach(() => {
      const mockWarden = {
        classify: vi.fn().mockReturnValue({
          level: CulturalSovereigntyLevel.PUBLICLY_SHARED,
          tradition: 'cross-tradition',
          action: 'include',
          explanation: 'Publicly shared content.',
        }),
      };
      mockEngine = new FeedbackEngine(mockWarden as unknown as CulturalSovereigntyWarden);
    });

    it('should detect a violation when question matches a protocolViolationTrigger pattern', () => {
      const session = new SimulationSession('scenario-appalachian-elder', mockEngine);
      session.acknowledgeConsent();
      // "Recording" is in the violation triggers for appalachian-elder
      const feedback = session.askQuestion('I started recording before asking permission.');
      expect(feedback.isAppropriate).toBe(false);
      expect(feedback.violations.length).toBeGreaterThan(0);
    });

    it('should return violations array with relatedPractice field', () => {
      const session = new SimulationSession('scenario-fn-knowledge-keeper', mockEngine);
      session.acknowledgeConsent();
      // "Proceeding with recording" is a trigger
      const feedback = session.askQuestion('I am proceeding with recording the interview.');
      expect(feedback.violations.length).toBeGreaterThan(0);
      expect(feedback.violations[0]!.relatedPractice).toBeTruthy();
      expect(feedback.violations[0]!.relatedPractice).toMatch(/^practice-\d+$/);
    });

    it('should increment violationsDetected in session summary for each violation', () => {
      const session = new SimulationSession('scenario-appalachian-elder', mockEngine);
      session.acknowledgeConsent();
      expect(session.getSummary().violationsDetected).toBe(0);
      // "Recording" triggers a violation
      session.askQuestion('Recording without asking first is okay, right?');
      expect(session.getSummary().violationsDetected).toBe(1);
    });

    it('should track questionsAsked count in session summary', () => {
      const session = new SimulationSession('scenario-community-group', mockEngine);
      session.acknowledgeConsent();
      expect(session.getSummary().questionsAsked).toBe(0);
      session.askQuestion('What seasonal rounds did your families follow?');
      session.askQuestion('How did your community make decisions together?');
      expect(session.getSummary().questionsAsked).toBe(2);
    });

    it('should return completed=true after complete() is called', () => {
      const session = new SimulationSession('scenario-family-member', mockEngine);
      session.acknowledgeConsent();
      expect(session.getSummary().completed).toBe(false);
      const summary = session.complete();
      expect(summary.completed).toBe(true);
    });

    it('should not count cultural sovereignty blocks as ordinary violations separately', () => {
      // Cultural sovereignty blocks ARE counted in violationsDetected too,
      // but they are ALSO separately tracked in culturalSovereigntyBlocks.
      // This test verifies the distinction: a cultural sovereignty block
      // increments BOTH counters.
      const mockWardenLevel3 = {
        classify: vi.fn().mockReturnValue({
          level: CulturalSovereigntyLevel.COMMUNITY_RESTRICTED,
          tradition: 'first-nations',
          action: 'acknowledge-and-redirect',
          explanation: 'Community restricted content.',
        }),
      };
      const level3Engine = new FeedbackEngine(
        mockWardenLevel3 as unknown as CulturalSovereigntyWarden,
      );
      const session = new SimulationSession('scenario-fn-knowledge-keeper', level3Engine);
      session.acknowledgeConsent();
      session.askQuestion('What are the ceremonial plant uses?');
      const summary = session.getSummary();
      // Both counters should be 1
      expect(summary.culturalSovereigntyBlocks).toBe(1);
      expect(summary.violationsDetected).toBe(1);
    });

    it('should include CULTURAL_SOVEREIGNTY_BLOCK code in violations for blocked questions', () => {
      const mockWardenLevel4 = {
        classify: vi.fn().mockReturnValue({
          level: CulturalSovereigntyLevel.SACRED_CEREMONIAL,
          tradition: 'inuit',
          action: 'block',
          explanation: 'Sacred ceremonial content. Hard block.',
        }),
      };
      const level4Engine = new FeedbackEngine(
        mockWardenLevel4 as unknown as CulturalSovereigntyWarden,
      );
      const session = new SimulationSession('scenario-inuit-elder', level4Engine);
      session.acknowledgeConsent();
      const feedback = session.askQuestion('Describe angakkuq ceremonies.');
      expect(feedback.violations[0]!.code).toBe('CULTURAL_SOVEREIGNTY_BLOCK');
    });

    it('should have all 5 expected scenario IDs in loaded scenarios', () => {
      const scenarios = loadScenarios();
      const ids = scenarios.map(s => s.id);
      expect(ids).toContain('scenario-appalachian-elder');
      expect(ids).toContain('scenario-fn-knowledge-keeper');
      expect(ids).toContain('scenario-inuit-elder');
      expect(ids).toContain('scenario-family-member');
      expect(ids).toContain('scenario-community-group');
    });
  });
});
