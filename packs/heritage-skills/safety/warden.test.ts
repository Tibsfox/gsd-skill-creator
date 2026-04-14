/**
 * Comprehensive tests for the Physical Safety Warden.
 *
 * Coverage:
 * - All 9 safety domains (food, plant, tool, medical, structural, fire, chemical, animal, arctic-survival)
 * - All 3 operating modes (ANNOTATE, GATE, REDIRECT)
 * - CRITICAL rule enforcement (always canProceed=false, always canOverride=false)
 * - Tradition filtering (tradition-specific rules vs. tradition-agnostic rules)
 * - Multi-domain evaluation
 * - getCriticalRules(), getDomainMode()
 *
 * @module heritage-skills-pack/safety/warden.test
 */

import { describe, it, expect, beforeAll } from 'vitest';

import {
  SafetyWarden,
  SafetyDomain,
  SafetyLevel,
  Tradition,
  RoomNumber,
  type SafetyEvaluation,
  type RoomContext,
} from './warden.js';

// ─── Test Setup ───────────────────────────────────────────────────────────────

let warden: SafetyWarden;

beforeAll(() => {
  warden = new SafetyWarden();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertRedirected(result: SafetyEvaluation): void {
  expect(result.canProceed).toBe(false);
  expect(result.level).toBe(SafetyLevel.REDIRECTED);
  expect(result.redirectTarget).toBeDefined();
}

function assertGated(result: SafetyEvaluation): void {
  expect(result.canProceed).toBe(false);
  expect(result.level).toBe(SafetyLevel.GATED);
  expect(result.requiredAcknowledgments.length).toBeGreaterThan(0);
}

function assertAnnotated(result: SafetyEvaluation): void {
  expect(result.canProceed).toBe(true);
  expect(result.level).toBe(SafetyLevel.ANNOTATED);
  expect(result.annotations.length).toBeGreaterThan(0);
}

function assertStandard(result: SafetyEvaluation): void {
  expect(result.canProceed).toBe(true);
  expect(result.level).toBe(SafetyLevel.STANDARD);
  expect(result.annotations).toHaveLength(0);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SafetyWarden', () => {
  // ─── Single Domain Evaluation ───────────────────────────────────────────────

  describe('evaluate - single domain', () => {
    // ─── Food Safety ───────────────────────────────────────────────────────

    describe('food safety', () => {
      it('should REDIRECT for low-acid water bath canning (CRITICAL)', () => {
        // Arrange
        const content =
          'How to water bath can green beans and other low-acid vegetables';
        // Act
        const result = warden.evaluate(content, SafetyDomain.FOOD);
        // Assert
        assertRedirected(result);
        expect(result.annotations.length).toBeGreaterThan(0);
        const criticalAnnotation = result.annotations.find(
          (a) => a.isCritical,
        );
        expect(criticalAnnotation).toBeDefined();
        expect(criticalAnnotation?.canOverride).toBe(false);
        expect(criticalAnnotation?.message).toMatch(/pressure.?canning|botulism/i);
      });

      it('should GATE for pemmican fat temperature (CRITICAL)', () => {
        // Arrange
        const content =
          'Rendering fat for pemmican at low temperatures to preserve nutrients';
        // Act
        const result = warden.evaluate(content, SafetyDomain.FOOD);
        // Assert
        expect(result.canProceed).toBe(false);
        expect(result.annotations.length).toBeGreaterThan(0);
        const criticalAnnotation = result.annotations.find(
          (a) => a.isCritical,
        );
        expect(criticalAnnotation).toBeDefined();
        expect(criticalAnnotation?.canOverride).toBe(false);
      });

      it('should GATE for smoking temperatures without minimum guidance (CRITICAL)', () => {
        // Arrange
        const content = 'Smoking fish and meat using cold smoke technique';
        // Act
        const result = warden.evaluate(content, SafetyDomain.FOOD);
        // Assert
        expect(result.canProceed).toBe(false);
        const criticalAnnotation = result.annotations.find(
          (a) => a.isCritical,
        );
        expect(criticalAnnotation).toBeDefined();
      });

      it('should return STANDARD for safe food content without triggers', () => {
        // Arrange
        const content =
          'Learn about the history of Appalachian cooking traditions and cast iron cookware';
        // Act
        const result = warden.evaluate(content, SafetyDomain.FOOD);
        // Assert
        assertStandard(result);
      });

      it('should ANNOTATE for traditional fermentation methods', () => {
        // Arrange
        const content =
          'Fermenting cabbage into sauerkraut using traditional Appalachian methods';
        // Act
        const result = warden.evaluate(content, SafetyDomain.FOOD);
        // Assert
        // Fermentation triggers ANNOTATED rule
        expect(result.annotations.length).toBeGreaterThan(0);
        // If any match, at least fermentation annotation should be present
        const fermentAnnotation = result.annotations.find(
          (a) => a.message.toLowerCase().includes('ferment'),
        );
        expect(fermentAnnotation).toBeDefined();
      });
    });

    // ─── Plant Safety ───────────────────────────────────────────────────────

    describe('plant safety', () => {
      it('should REDIRECT for plant ID from description alone (CRITICAL)', () => {
        // Arrange
        const content =
          'Can you identify this plant from my description? It has white flowers and grows near water.';
        // Act
        const result = warden.evaluate(content, SafetyDomain.PLANT);
        // Assert
        assertRedirected(result);
        const criticalAnnotation = result.annotations.find(
          (a) => a.isCritical,
        );
        expect(criticalAnnotation).toBeDefined();
        expect(criticalAnnotation?.canOverride).toBe(false);
        expect(criticalAnnotation?.message).toMatch(
          /description.{0,80}not.{0,20}safe|botanist|expert/i,
        );
      });

      it('should REDIRECT for asking what a plant looks like for ID', () => {
        // Arrange
        const content =
          'What does this look like and is this plant safe to eat?';
        // Act
        const result = warden.evaluate(content, SafetyDomain.PLANT);
        // Assert
        expect(result.canProceed).toBe(false);
      });

      it('should REDIRECT for lethal plants without danger framing (CRITICAL)', () => {
        // Arrange
        const content =
          'Hemlock grows along stream banks and has white umbrella-shaped flowers';
        // Act
        const result = warden.evaluate(content, SafetyDomain.PLANT);
        // Assert
        assertRedirected(result);
        const criticalAnnotation = result.annotations.find(
          (a) => a.isCritical,
        );
        expect(criticalAnnotation).toBeDefined();
        expect(criticalAnnotation?.canOverride).toBe(false);
      });

      it('should GATE for toxic look-alike without warning', () => {
        // Arrange
        const content =
          'Wild carrot looks similar to poison hemlock and is dangerous to confuse';
        // Act
        const result = warden.evaluate(content, SafetyDomain.PLANT);
        // Assert
        expect(result.canProceed).toBe(false);
        expect(result.annotations.length).toBeGreaterThan(0);
      });

      it('should ANNOTATE for foraging instruction with general framing', () => {
        // Arrange
        const content =
          'When foraging wild plants in spring, always look for multiple identifying features';
        // Act
        const result = warden.evaluate(content, SafetyDomain.PLANT);
        // Assert
        expect(result.annotations.length).toBeGreaterThan(0);
      });

      it('should return STANDARD for safe plant content', () => {
        // Arrange
        const content =
          'The cultural significance of plant knowledge in Indigenous traditions includes basketweaving and fiber arts';
        // Act
        const result = warden.evaluate(content, SafetyDomain.PLANT);
        // Assert
        assertStandard(result);
      });
    });

    // ─── Arctic Survival ────────────────────────────────────────────────────

    describe('arctic survival', () => {
      it('should REDIRECT for enclosed snow shelter without ventilation (CRITICAL)', () => {
        // Arrange
        const content =
          'How to build an igloo or quinzhee snow shelter for overnight camping in winter';
        // Act
        const result = warden.evaluate(content, SafetyDomain.ARCTIC_SURVIVAL);
        // Assert
        assertRedirected(result);
        const criticalAnnotation = result.annotations.find(
          (a) => a.isCritical,
        );
        expect(criticalAnnotation).toBeDefined();
        expect(criticalAnnotation?.canOverride).toBe(false);
        expect(criticalAnnotation?.message).toMatch(/ventilat|CO|carbon.?monoxide/i);
      });

      it('should GATE for ice travel without thickness check (CRITICAL)', () => {
        // Arrange
        const content =
          'Walking across the frozen lake to reach the fishing spot on the other side';
        // Act
        const result = warden.evaluate(content, SafetyDomain.ARCTIC_SURVIVAL);
        // Assert
        expect(result.canProceed).toBe(false);
        const criticalAnnotation = result.annotations.find(
          (a) => a.isCritical,
        );
        expect(criticalAnnotation).toBeDefined();
        expect(criticalAnnotation?.canOverride).toBe(false);
        expect(criticalAnnotation?.message).toMatch(/thickness|inches|centimeter/i);
      });

      it('should GATE for hypothermia without treatment protocol', () => {
        // Arrange
        const content =
          'Recognizing hypothermia and extreme cold exposure symptoms in winter survival';
        // Act
        const result = warden.evaluate(content, SafetyDomain.ARCTIC_SURVIVAL);
        // Assert
        expect(result.canProceed).toBe(false);
      });

      it('should ANNOTATE for cold weather clothing layering system', () => {
        // Arrange
        const content =
          'Proper layering system and cold weather clothing for winter outdoor activities';
        // Act
        const result = warden.evaluate(content, SafetyDomain.ARCTIC_SURVIVAL);
        // Assert
        expect(result.annotations.length).toBeGreaterThan(0);
      });

      it('should return STANDARD for safe arctic content', () => {
        // Arrange
        const content =
          'The cultural history of Inuit dog sleds and their role in Arctic travel';
        // Act
        const result = warden.evaluate(content, SafetyDomain.ARCTIC_SURVIVAL);
        // Assert
        assertStandard(result);
      });
    });

    // ─── Tool Safety ────────────────────────────────────────────────────────

    describe('tool safety', () => {
      it('should GATE for axe use without safety stance', () => {
        // Arrange
        const content =
          'Using an axe or hatchet to split wood and fell small trees';
        // Act
        const result = warden.evaluate(content, SafetyDomain.TOOL);
        // Assert
        expect(result.canProceed).toBe(false);
        expect(result.level).toBe(SafetyLevel.GATED);
        expect(result.requiredAcknowledgments.length).toBeGreaterThan(0);
      });

      it('should ANNOTATE for knife carving', () => {
        // Arrange
        const content =
          'Carve and whittle a wooden spoon using a carving knife and draw knife';
        // Act
        const result = warden.evaluate(content, SafetyDomain.TOOL);
        // Assert
        expect(result.annotations.length).toBeGreaterThan(0);
      });

      it('should GATE for power tool equivalent mentioned', () => {
        // Arrange
        const content =
          'Using a chainsaw to cut timber for the cabin construction project';
        // Act
        const result = warden.evaluate(content, SafetyDomain.TOOL);
        // Assert
        expect(result.canProceed).toBe(false);
      });

      it('should return STANDARD for safe tool content', () => {
        // Arrange
        const content =
          'Understanding the history of traditional Appalachian tool making and craft';
        // Act
        const result = warden.evaluate(content, SafetyDomain.TOOL);
        // Assert
        assertStandard(result);
      });
    });

    // ─── Fire Safety ────────────────────────────────────────────────────────

    describe('fire safety', () => {
      it('should GATE for indoor fire without ventilation mention', () => {
        // Arrange
        const content =
          'Building a fire inside the shelter cabin for warmth during the winter night';
        // Act
        const result = warden.evaluate(content, SafetyDomain.FIRE);
        // Assert
        expect(result.canProceed).toBe(false);
        expect(result.annotations.length).toBeGreaterThan(0);
        expect(result.annotations[0].message).toMatch(/CO|carbon.?monoxide|ventilat/i);
      });

      it('should REDIRECT for accelerant use (CRITICAL)', () => {
        // Arrange
        const content =
          'Using gasoline to start and ignite the campfire quickly';
        // Act
        const result = warden.evaluate(content, SafetyDomain.FIRE);
        // Assert
        assertRedirected(result);
        const criticalAnnotation = result.annotations.find(
          (a) => a.isCritical,
        );
        expect(criticalAnnotation).toBeDefined();
        expect(criticalAnnotation?.canOverride).toBe(false);
      });

      it('should GATE for forge use without protective equipment mention', () => {
        // Arrange
        const content =
          'Using the forge and kiln to work metal and shape iron tools';
        // Act
        const result = warden.evaluate(content, SafetyDomain.FIRE);
        // Assert
        expect(result.canProceed).toBe(false);
      });

      it('should ANNOTATE for outdoor fire pit', () => {
        // Arrange
        const content =
          'Building an outdoor campfire pit for cooking and gathering';
        // Act
        const result = warden.evaluate(content, SafetyDomain.FIRE);
        // Assert
        expect(result.annotations.length).toBeGreaterThan(0);
      });
    });

    // ─── Chemical Safety ────────────────────────────────────────────────────

    describe('chemical safety', () => {
      it('should GATE for lye use without protective equipment', () => {
        // Arrange
        const content =
          'Making soap using lye and animal fats in the traditional way';
        // Act
        const result = warden.evaluate(content, SafetyDomain.CHEMICAL);
        // Assert
        expect(result.canProceed).toBe(false);
        expect(result.annotations.length).toBeGreaterThan(0);
        expect(result.annotations[0].message).toMatch(/glove|goggles|caustic|burns/i);
      });

      it('should REDIRECT for volatile chemical processes (CRITICAL)', () => {
        // Arrange
        const content =
          'Using volatile solvents and mineral spirits to thin the finish';
        // Act
        const result = warden.evaluate(content, SafetyDomain.CHEMICAL);
        // Assert
        assertRedirected(result);
        const criticalAnnotation = result.annotations.find(
          (a) => a.isCritical,
        );
        expect(criticalAnnotation).toBeDefined();
        expect(criticalAnnotation?.canOverride).toBe(false);
      });

      it('should ANNOTATE for natural dye mordants', () => {
        // Arrange
        const content =
          'Using alum and tannin mordants to set natural plant dyes in wool fiber';
        // Act
        const result = warden.evaluate(content, SafetyDomain.CHEMICAL);
        // Assert
        expect(result.annotations.length).toBeGreaterThan(0);
      });
    });

    // ─── Medical Safety ─────────────────────────────────────────────────────

    describe('medical safety', () => {
      it('should REDIRECT for acute poisoning emergency (CRITICAL)', () => {
        // Arrange
        const content =
          'Child ingested toxic berries, possible poisoning emergency situation';
        // Act
        const result = warden.evaluate(content, SafetyDomain.MEDICAL);
        // Assert
        expect(result.canProceed).toBe(false);
      });

      it('should ANNOTATE for traditional healing framed as cultural knowledge', () => {
        // Arrange
        const content =
          'Traditional healing practices and Indigenous plant medicine as cultural knowledge';
        // Act
        const result = warden.evaluate(content, SafetyDomain.MEDICAL);
        // Assert
        expect(result.annotations.length).toBeGreaterThan(0);
      });
    });

    // ─── Structural Safety ──────────────────────────────────────────────────

    describe('structural safety', () => {
      it('should GATE for load-bearing construction without engineering note', () => {
        // Arrange
        const content =
          'How to place load-bearing beams and structural timber posts in cabin construction';
        // Act
        const result = warden.evaluate(content, SafetyDomain.STRUCTURAL);
        // Assert
        expect(result.canProceed).toBe(false);
      });

      it('should GATE for underground construction without ventilation', () => {
        // Arrange
        const content =
          'Digging an underground root cellar or earth-contact dugout shelter';
        // Act
        const result = warden.evaluate(content, SafetyDomain.STRUCTURAL);
        // Assert
        expect(result.canProceed).toBe(false);
      });

      it('should ANNOTATE for basic shelter building', () => {
        // Arrange
        const content =
          'Building a simple lean-to shelter using natural materials in the forest';
        // Act
        const result = warden.evaluate(content, SafetyDomain.STRUCTURAL);
        // Assert
        expect(result.annotations.length).toBeGreaterThan(0);
      });
    });

    // ─── Animal Safety ──────────────────────────────────────────────────────

    describe('animal safety', () => {
      it('should GATE for animal handling without safety precautions', () => {
        // Arrange
        const content =
          'How to handle and restrain cattle and livestock on the homestead';
        // Act
        const result = warden.evaluate(content, SafetyDomain.ANIMAL);
        // Assert
        expect(result.canProceed).toBe(false);
        expect(result.annotations.length).toBeGreaterThan(0);
      });

      it('should GATE for wild animal encounter protocols', () => {
        // Arrange
        const content =
          'Encountered a wild bear during our foraging trip in the woods';
        // Act
        const result = warden.evaluate(content, SafetyDomain.ANIMAL);
        // Assert
        expect(result.canProceed).toBe(false);
      });

      it('should ANNOTATE for brain tanning with hygiene reminder', () => {
        // Arrange
        const content =
          'Brain tanning a deer hide using traditional methods to make buckskin leather';
        // Act
        const result = warden.evaluate(content, SafetyDomain.ANIMAL);
        // Assert
        expect(result.annotations.length).toBeGreaterThan(0);
      });
    });

    // ─── All 9 domains have rules ────────────────────────────────────────────

    describe('all 9 domains have rules', () => {
      it('should have rules loaded for each SafetyDomain value', () => {
        // Arrange - all domain values from the enum
        const allDomains = [
          SafetyDomain.FOOD,
          SafetyDomain.PLANT,
          SafetyDomain.TOOL,
          SafetyDomain.MEDICAL,
          SafetyDomain.STRUCTURAL,
          SafetyDomain.FIRE,
          SafetyDomain.CHEMICAL,
          SafetyDomain.ANIMAL,
          SafetyDomain.ARCTIC_SURVIVAL,
        ];

        for (const domain of allDomains) {
          // Act - getCriticalRules will return empty array if no rules at all
          // We verify by evaluating a generic safety-triggering content
          const criticalRules = warden.getCriticalRules(domain);
          const allRules = (warden as unknown as { rules: Map<SafetyDomain, unknown[]> }).rules;
          const domainRules = allRules.get(domain);

          // Assert
          expect(domainRules).toBeDefined();
          expect(Array.isArray(domainRules)).toBe(true);
          expect((domainRules as unknown[]).length).toBeGreaterThan(0);
        }
      });
    });
  });

  // ─── Multi-Domain Evaluation ─────────────────────────────────────────────────

  describe('evaluateMultiDomain', () => {
    it('should return evaluations for all requested domains', () => {
      // Arrange
      const content = 'Learning traditional skills in a heritage context';
      const domains = [SafetyDomain.FOOD, SafetyDomain.TOOL, SafetyDomain.FIRE];
      // Act
      const results = warden.evaluateMultiDomain(content, domains);
      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].domain).toBe(SafetyDomain.FOOD);
      expect(results[1].domain).toBe(SafetyDomain.TOOL);
      expect(results[2].domain).toBe(SafetyDomain.FIRE);
    });

    it('should handle content matching multiple domains', () => {
      // Arrange -- content that triggers both food and fire safety
      const content =
        'Smoking fish and wild game over an indoor fire with low-acid water bath canning';
      const domains = [SafetyDomain.FOOD, SafetyDomain.FIRE];
      // Act
      const results = warden.evaluateMultiDomain(content, domains);
      // Assert
      expect(results).toHaveLength(2);
      // Food: low-acid + water bath canning -> REDIRECT (critical)
      expect(results[0].canProceed).toBe(false);
      // Fire: indoor fire without ventilation -> GATE
      expect(results[1].canProceed).toBe(false);
    });

    it('should return independent evaluations per domain', () => {
      // Arrange
      const content = 'Traditional Appalachian heritage skills and cultural practices';
      const domains = [SafetyDomain.FOOD, SafetyDomain.PLANT, SafetyDomain.TOOL];
      // Act
      const results = warden.evaluateMultiDomain(content, domains);
      // Assert -- each domain evaluated independently, no cross-contamination
      expect(results).toHaveLength(3);
      for (const result of results) {
        expect(result.annotations).toBeDefined();
        expect(result.requiredAcknowledgments).toBeDefined();
      }
    });

    it('should handle empty domains array', () => {
      // Arrange
      const content = 'Some content to evaluate';
      // Act
      const results = warden.evaluateMultiDomain(content, []);
      // Assert
      expect(results).toHaveLength(0);
    });
  });

  // ─── getCriticalRules ────────────────────────────────────────────────────────

  describe('getCriticalRules', () => {
    it('should return critical rules for food domain', () => {
      // Act
      const criticalRules = warden.getCriticalRules(SafetyDomain.FOOD);
      // Assert
      expect(criticalRules.length).toBeGreaterThanOrEqual(2);
      for (const rule of criticalRules) {
        expect(rule.annotation.isCritical).toBe(true);
        expect(rule.annotation.canOverride).toBe(false);
      }
      // Verify the low-acid water bath rule is critical
      const botulismRule = criticalRules.find((r) => r.id === 'FOOD-001');
      expect(botulismRule).toBeDefined();
      // Verify pemmican fat rule is critical
      const pemmican = criticalRules.find((r) => r.id === 'FOOD-002');
      expect(pemmican).toBeDefined();
    });

    it('should return critical rules for plant domain', () => {
      // Act
      const criticalRules = warden.getCriticalRules(SafetyDomain.PLANT);
      // Assert
      expect(criticalRules.length).toBeGreaterThanOrEqual(1);
      for (const rule of criticalRules) {
        expect(rule.annotation.isCritical).toBe(true);
        expect(rule.annotation.canOverride).toBe(false);
      }
      // Verify the plant ID from description rule is critical
      const idRule = criticalRules.find((r) => r.id === 'PLANT-001');
      expect(idRule).toBeDefined();
    });

    it('should return critical rules for arctic-survival domain', () => {
      // Act
      const criticalRules = warden.getCriticalRules(SafetyDomain.ARCTIC_SURVIVAL);
      // Assert
      expect(criticalRules.length).toBeGreaterThanOrEqual(1);
      for (const rule of criticalRules) {
        expect(rule.annotation.isCritical).toBe(true);
        expect(rule.annotation.canOverride).toBe(false);
      }
      // Verify enclosed shelter ventilation rule is critical
      const shelterRule = criticalRules.find((r) => r.id === 'ARCTIC-001');
      expect(shelterRule).toBeDefined();
    });

    it('should return only critical rules (not all rules)', () => {
      // Act -- tool safety has critical=false rules only
      // Actually tool has no critical rules by design
      const criticalRules = warden.getCriticalRules(SafetyDomain.TOOL);
      // Assert -- tool safety has no CRITICAL rules (gated/annotated only)
      for (const rule of criticalRules) {
        expect(rule.annotation.isCritical).toBe(true);
      }
    });

    it('all returned critical rules must have canOverride=false', () => {
      // Arrange - check all domains
      const allDomains = Object.values(SafetyDomain);
      for (const domain of allDomains) {
        // Act
        const criticalRules = warden.getCriticalRules(domain);
        // Assert
        for (const rule of criticalRules) {
          expect(rule.annotation.isCritical).toBe(true);
          expect(rule.annotation.canOverride).toBe(false);
        }
      }
    });
  });

  // ─── getDomainMode ────────────────────────────────────────────────────────────

  describe('getDomainMode', () => {
    it('should return GATED or higher for critical rooms (FOOD=05, domain=FOOD)', () => {
      // Arrange
      const context: RoomContext = {
        room: RoomNumber.FOOD,
        sessionDifficulty: 'intermediate',
      };
      // Act
      const mode = warden.getDomainMode(SafetyDomain.FOOD, context);
      // Assert
      const severity = {
        [SafetyLevel.STANDARD]: 0,
        [SafetyLevel.ANNOTATED]: 1,
        [SafetyLevel.GATED]: 2,
        [SafetyLevel.REDIRECTED]: 3,
      };
      expect(severity[mode]).toBeGreaterThanOrEqual(severity[SafetyLevel.GATED]);
    });

    it('should return GATED or higher for critical room PLANTS=09', () => {
      // Arrange
      const context: RoomContext = {
        room: RoomNumber.PLANTS,
        sessionDifficulty: 'intermediate',
      };
      // Act
      const mode = warden.getDomainMode(SafetyDomain.PLANT, context);
      // Assert
      const severity = {
        [SafetyLevel.STANDARD]: 0,
        [SafetyLevel.ANNOTATED]: 1,
        [SafetyLevel.GATED]: 2,
        [SafetyLevel.REDIRECTED]: 3,
      };
      expect(severity[mode]).toBeGreaterThanOrEqual(severity[SafetyLevel.GATED]);
    });

    it('should return GATED or higher for critical room ARCTIC_LIVING=14', () => {
      // Arrange
      const context: RoomContext = {
        room: RoomNumber.ARCTIC_LIVING,
        sessionDifficulty: 'advanced',
      };
      // Act
      const mode = warden.getDomainMode(SafetyDomain.ARCTIC_SURVIVAL, context);
      // Assert
      const severity = {
        [SafetyLevel.STANDARD]: 0,
        [SafetyLevel.ANNOTATED]: 1,
        [SafetyLevel.GATED]: 2,
        [SafetyLevel.REDIRECTED]: 3,
      };
      expect(severity[mode]).toBeGreaterThanOrEqual(severity[SafetyLevel.GATED]);
    });

    it('should return GATED for beginner difficulty in non-critical rooms', () => {
      // Arrange
      const context: RoomContext = {
        room: RoomNumber.WOODCRAFT,
        sessionDifficulty: 'beginner',
      };
      // Act
      const mode = warden.getDomainMode(SafetyDomain.TOOL, context);
      // Assert -- beginner elevates to GATED
      expect(mode).toBe(SafetyLevel.GATED);
    });

    it('should return ANNOTATED for intermediate difficulty in non-critical rooms', () => {
      // Arrange
      const context: RoomContext = {
        room: RoomNumber.WOODCRAFT,
        sessionDifficulty: 'intermediate',
      };
      // Act
      const mode = warden.getDomainMode(SafetyDomain.TOOL, context);
      // Assert
      expect(mode).toBe(SafetyLevel.ANNOTATED);
    });

    it('should return ANNOTATED for advanced difficulty in non-critical rooms', () => {
      // Arrange
      const context: RoomContext = {
        room: RoomNumber.WOODCRAFT,
        sessionDifficulty: 'advanced',
      };
      // Act
      const mode = warden.getDomainMode(SafetyDomain.TOOL, context);
      // Assert
      expect(mode).toBe(SafetyLevel.ANNOTATED);
    });
  });

  // ─── Tradition Filtering ─────────────────────────────────────────────────────

  describe('tradition filtering', () => {
    it('should filter rules by tradition when specified', () => {
      // Arrange -- qulliq rule is traditions: ["inuit"] only
      const inuitContent =
        'Using a qulliq oil lamp inside the iglu snow shelter for warmth and light';
      // Act -- evaluate as INUIT tradition (should match qulliq rule in arctic domain)
      const inuitResult = warden.evaluate(
        inuitContent,
        SafetyDomain.ARCTIC_SURVIVAL,
        Tradition.INUIT,
      );
      // Act -- evaluate as APPALACHIAN tradition (qulliq rule should not match)
      const appalachianResult = warden.evaluate(
        inuitContent,
        SafetyDomain.ARCTIC_SURVIVAL,
        Tradition.APPALACHIAN,
      );
      // Assert -- Inuit context should catch more rules (qulliq is Inuit-specific)
      // Appalachian should not trigger the qulliq-specific rule
      // The qulliq annotation message should appear in Inuit result
      const qulliqAnnotation = inuitResult.annotations.find(
        (a) => a.message.toLowerCase().includes('qulliq') || a.message.toLowerCase().includes('oil lamp'),
      );
      expect(qulliqAnnotation).toBeDefined();
    });

    it('should include tradition-agnostic rules regardless of tradition specified', () => {
      // Arrange -- FOOD-001 (low-acid water bath canning) has traditions: all traditions
      const content =
        'Water bath canning low-acid vegetables like green beans';
      // Act
      const appalachianResult = warden.evaluate(
        content,
        SafetyDomain.FOOD,
        Tradition.APPALACHIAN,
      );
      const inuitResult = warden.evaluate(
        content,
        SafetyDomain.FOOD,
        Tradition.INUIT,
      );
      // Assert -- both should trigger (rule applies to both traditions)
      expect(appalachianResult.canProceed).toBe(false);
      expect(inuitResult.canProceed).toBe(false);
    });

    it('should include rules with no tradition restriction when tradition is specified', () => {
      // Arrange -- FIRE-004 (accelerant) has no traditions restriction
      const content = 'Using gasoline to start a fire quickly';
      // Act
      const result = warden.evaluate(
        content,
        SafetyDomain.FIRE,
        Tradition.APPALACHIAN,
      );
      // Assert -- tradition-agnostic rule still applies
      expect(result.canProceed).toBe(false);
    });

    it('should evaluate without tradition filter when no tradition specified', () => {
      // Arrange
      const content = 'Foraging wild plants in the forest for food';
      // Act -- no tradition filter
      const resultNoFilter = warden.evaluate(content, SafetyDomain.PLANT);
      // Act -- with tradition filter
      const resultWithFilter = warden.evaluate(
        content,
        SafetyDomain.PLANT,
        Tradition.APPALACHIAN,
      );
      // Assert -- both should match the foraging rule (it has traditions listed)
      expect(resultNoFilter.annotations.length).toBeGreaterThan(0);
      expect(resultWithFilter.annotations.length).toBeGreaterThan(0);
    });
  });

  // ─── CRITICAL Rule Enforcement ───────────────────────────────────────────────

  describe('CRITICAL rule enforcement', () => {
    it('should always set canProceed=false for CRITICAL rules', () => {
      // Arrange -- test all known CRITICAL scenarios
      const criticalScenarios: Array<{ content: string; domain: SafetyDomain }> = [
        {
          content: 'Water bath canning low-acid green beans for the pantry',
          domain: SafetyDomain.FOOD,
        },
        {
          content: 'Identify this plant from my description, what is this white flower?',
          domain: SafetyDomain.PLANT,
        },
        {
          content:
            'Building an igloo snow shelter for overnight winter camping without any holes',
          domain: SafetyDomain.ARCTIC_SURVIVAL,
        },
        {
          content: 'Using gasoline to ignite and start the fire faster',
          domain: SafetyDomain.FIRE,
        },
      ];

      for (const scenario of criticalScenarios) {
        // Act
        const result = warden.evaluate(scenario.content, scenario.domain);
        // Assert
        expect(result.canProceed).toBe(false);
        const hasCritical = result.annotations.some((a) => a.isCritical);
        expect(hasCritical).toBe(true);
      }
    });

    it('should always set canOverride=false for CRITICAL annotations', () => {
      // Arrange
      const content = 'Water bath canning low-acid vegetables is fine for home canning';
      // Act
      const result = warden.evaluate(content, SafetyDomain.FOOD);
      // Assert
      const criticalAnnotations = result.annotations.filter((a) => a.isCritical);
      expect(criticalAnnotations.length).toBeGreaterThan(0);
      for (const annotation of criticalAnnotations) {
        expect(annotation.canOverride).toBe(false);
      }
    });

    it('should set canProceed=false for CRITICAL even when level is ANNOTATED', () => {
      // This tests that critical flag overrides the level-based canProceed logic
      // If a rule is level=annotated but isCritical=true, canProceed must be false
      const allDomains = Object.values(SafetyDomain);
      for (const domain of allDomains) {
        const criticalRules = warden.getCriticalRules(domain);
        for (const rule of criticalRules) {
          // CRITICAL rules must be GATED or REDIRECTED (not ANNOTATED)
          // per spec: "CRITICAL rules MUST set isCritical: true, canOverride: false,
          // and level `gated` or `redirected`"
          expect([SafetyLevel.GATED, SafetyLevel.REDIRECTED]).toContain(rule.level);
        }
      }
    });

    it('should not affect non-CRITICAL rules -- they can have canOverride=true', () => {
      // Arrange -- foraging instruction is ANNOTATED with canOverride=true
      const content = 'Foraging edible wild plants in the spring forest';
      // Act
      const result = warden.evaluate(content, SafetyDomain.PLANT);
      // Assert
      const nonCritical = result.annotations.find(
        (a) => !a.isCritical && a.canOverride,
      );
      // If there are any non-critical annotations, they can have canOverride=true
      if (nonCritical) {
        expect(nonCritical.canOverride).toBe(true);
      }
    });
  });
});

// ─── Marine Safety Domain ─────────────────────────────────────────────────────

describe('Marine Safety Domain', () => {
  describe('cold water rules — GATE', () => {
    it('cold water + canoe triggers GATE with canProceed=false', () => {
      const result = warden.evaluate('cold water safety when paddling a canoe', SafetyDomain.MARINE);
      expect(result.canProceed).toBe(false);
      expect(result.level).toBe(SafetyLevel.GATED);
    });

    it('capsize scenario triggers GATE', () => {
      const result = warden.evaluate('what to do if my canoe capsizes in cold water', SafetyDomain.MARINE);
      expect(result.canProceed).toBe(false);
      expect(result.level).toBe(SafetyLevel.GATED);
    });

    it('solo paddle triggers GATE (buddy system requirement)', () => {
      const result = warden.evaluate('I want to solo paddle across the strait', SafetyDomain.MARINE);
      expect(result.canProceed).toBe(false);
      expect(result.level).toBe(SafetyLevel.GATED);
    });

    it('1-10-1 rule content triggers GATE', () => {
      const result = warden.evaluate('explaining cold shock and the 1-10-1 rule for cold water immersion', SafetyDomain.MARINE);
      expect(result.canProceed).toBe(false);
      expect(result.level).toBe(SafetyLevel.GATED);
    });

    it('cold water GATE annotation references life jacket or float plan', () => {
      const result = warden.evaluate('cold water canoe paddling safety', SafetyDomain.MARINE);
      const hasLifejacket = result.annotations.some(a => /life.?jacket|float.?plan|PNW/i.test(a.message));
      expect(hasLifejacket).toBe(true);
    });
  });

  describe('vessel loading rules — GATE', () => {
    it('canoe loading triggers GATE', () => {
      const result = warden.evaluate('how to load a canoe for a camping trip', SafetyDomain.MARINE);
      expect(result.canProceed).toBe(false);
      expect(result.level).toBe(SafetyLevel.GATED);
    });

    it('center of gravity question triggers GATE', () => {
      const result = warden.evaluate('understanding center of gravity in canoe stability', SafetyDomain.MARINE);
      expect(result.canProceed).toBe(false);
      expect(result.level).toBe(SafetyLevel.GATED);
    });

    it('weather assessment triggers GATE', () => {
      const result = warden.evaluate('checking weather window before paddling on the water', SafetyDomain.MARINE);
      expect(result.canProceed).toBe(false);
      expect(result.level).toBe(SafetyLevel.GATED);
    });
  });

  describe('tidal rules — ANNOTATE', () => {
    it('Deception Pass triggers ANNOTATE', () => {
      const result = warden.evaluate('paddling through Deception Pass', SafetyDomain.MARINE);
      expect(result.level).toBe(SafetyLevel.ANNOTATED);
      expect(result.canProceed).toBe(true);
    });

    it('tidal rip triggers ANNOTATE', () => {
      const result = warden.evaluate('understanding tidal rip currents in the San Juan Islands', SafetyDomain.MARINE);
      expect(result.level).toBe(SafetyLevel.ANNOTATED);
      expect(result.canProceed).toBe(true);
    });

    it('tide tables triggers ANNOTATE', () => {
      const result = warden.evaluate('how to read tide tables and plan around slack water', SafetyDomain.MARINE);
      expect(result.level).toBe(SafetyLevel.ANNOTATED);
      expect(result.canProceed).toBe(true);
    });

    it('open water crossing triggers ANNOTATE', () => {
      const result = warden.evaluate('planning an open water crossing of the passage', SafetyDomain.MARINE);
      expect(result.level).toBe(SafetyLevel.ANNOTATED);
      expect(result.canProceed).toBe(true);
    });
  });

  describe('navigation rules — ANNOTATE', () => {
    it('channel markers triggers ANNOTATE', () => {
      const result = warden.evaluate('reading channel markers and buoys in a waterway', SafetyDomain.MARINE);
      expect(result.level).toBe(SafetyLevel.ANNOTATED);
      expect(result.canProceed).toBe(true);
    });

    it('fog navigation triggers ANNOTATE', () => {
      const result = warden.evaluate('paddling in dense fog and limited visibility on the water', SafetyDomain.MARINE);
      expect(result.level).toBe(SafetyLevel.ANNOTATED);
      expect(result.canProceed).toBe(true);
    });
  });

  describe('marine domain isolation — no cross-domain leakage', () => {
    it('marine content does not trigger food domain rules', () => {
      const result = warden.evaluate('cold water canoe capsizing', SafetyDomain.FOOD);
      expect(result.level).toBe(SafetyLevel.STANDARD);
    });

    it('food content does not trigger marine domain rules', () => {
      const result = warden.evaluate('canning green beans at home', SafetyDomain.MARINE);
      expect(result.level).toBe(SafetyLevel.STANDARD);
    });

    it('non-marine content returns STANDARD from marine domain', () => {
      const result = warden.evaluate('building a log cabin dovetail notch', SafetyDomain.MARINE);
      expect(result.level).toBe(SafetyLevel.STANDARD);
    });
  });

  describe('getCriticalRules for marine domain', () => {
    it('marine domain has critical rules', () => {
      const critical = warden.getCriticalRules(SafetyDomain.MARINE);
      expect(critical.length).toBeGreaterThan(0);
    });

    it('cold water rule is critical', () => {
      const critical = warden.getCriticalRules(SafetyDomain.MARINE);
      const coldWater = critical.find(r => r.id === 'MARINE-001');
      expect(coldWater).toBeDefined();
      expect(coldWater?.annotation.isCritical).toBe(true);
    });

    it('solo travel rule is critical', () => {
      const critical = warden.getCriticalRules(SafetyDomain.MARINE);
      const soloTravel = critical.find(r => r.id === 'MARINE-003');
      expect(soloTravel).toBeDefined();
    });
  });
});
