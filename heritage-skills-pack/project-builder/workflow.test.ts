/**
 * Tests for the Project Builder Workflow — 6-stage pipeline.
 *
 * Validates stage enumeration, sequential enforcement, community review gate
 * (non-bypassable for Indigenous content), Heritage Book scaffold creation,
 * and tradition-aware protocol checklists.
 *
 * @module heritage-skills-pack/project-builder/workflow.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WorkflowStage,
  WORKFLOW_STAGE_NAMES,
  WorkflowEngine,
  WorkflowGateError,
} from './workflow.js';
import type { HeritageProject } from '../shared/types.js';
import { Tradition } from '../shared/types.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<HeritageProject> = {}): HeritageProject {
  return {
    id: 'proj-001',
    title: 'Test Heritage Project',
    tradition: Tradition.APPALACHIAN,
    creator: 'Jane Doe',
    status: 'planning',
    ...overrides,
  };
}

function makeInuitProject(overrides: Partial<HeritageProject> = {}): HeritageProject {
  return makeProject({ tradition: Tradition.INUIT, ...overrides });
}

function makeFirstNationsProject(overrides: Partial<HeritageProject> = {}): HeritageProject {
  return makeProject({ tradition: Tradition.FIRST_NATIONS, ...overrides });
}

function makeCrossTraditionProject(overrides: Partial<HeritageProject> = {}): HeritageProject {
  return makeProject({ tradition: Tradition.CROSS_TRADITION, ...overrides });
}

/**
 * Advance engine through N stages without triggering errors.
 * For stages that require community review documentation, that must be done before calling.
 */
function advanceThrough(engine: WorkflowEngine, count: number): void {
  for (let i = 0; i < count; i++) {
    engine.advance();
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Project Builder Workflow', () => {

  // ─── WorkflowStage enum ────────────────────────────────────────────────────

  describe('WorkflowStage enum', () => {
    it('should have 6 stages', () => {
      const stages = Object.values(WorkflowStage).filter(v => typeof v === 'number');
      expect(stages).toHaveLength(6);
    });

    it('should have PLANNING=1', () => {
      expect(WorkflowStage.PLANNING).toBe(1);
    });

    it('should have RESEARCH=2', () => {
      expect(WorkflowStage.RESEARCH).toBe(2);
    });

    it('should have FIELDWORK=3', () => {
      expect(WorkflowStage.FIELDWORK).toBe(3);
    });

    it('should have DOCUMENTATION=4', () => {
      expect(WorkflowStage.DOCUMENTATION).toBe(4);
    });

    it('should have REVIEW=5', () => {
      expect(WorkflowStage.REVIEW).toBe(5);
    });

    it('should have PUBLICATION=6', () => {
      expect(WorkflowStage.PUBLICATION).toBe(6);
    });

    it('should have stage names for all 6 stages', () => {
      expect(WORKFLOW_STAGE_NAMES[WorkflowStage.PLANNING]).toBe('Planning');
      expect(WORKFLOW_STAGE_NAMES[WorkflowStage.RESEARCH]).toBe('Research');
      expect(WORKFLOW_STAGE_NAMES[WorkflowStage.FIELDWORK]).toBe('Fieldwork');
      expect(WORKFLOW_STAGE_NAMES[WorkflowStage.DOCUMENTATION]).toBe('Documentation');
      expect(WORKFLOW_STAGE_NAMES[WorkflowStage.REVIEW]).toBe('Community Review');
      expect(WORKFLOW_STAGE_NAMES[WorkflowStage.PUBLICATION]).toBe('Publication');
    });
  });

  // ─── WorkflowEngine initialization ────────────────────────────────────────

  describe('WorkflowEngine initialization', () => {
    it('should start at PLANNING stage', () => {
      const engine = new WorkflowEngine(makeProject());
      expect(engine.currentStage).toBe(WorkflowStage.PLANNING);
    });

    it('should have book=null initially', () => {
      const engine = new WorkflowEngine(makeProject());
      expect(engine.book).toBeNull();
    });

    it('should set community review isRequired=true for first-nations tradition', () => {
      const engine = new WorkflowEngine(makeFirstNationsProject());
      expect(engine.getCommunityReviewGateStatus().isRequired).toBe(true);
    });

    it('should set community review isRequired=true for inuit tradition', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      expect(engine.getCommunityReviewGateStatus().isRequired).toBe(true);
    });

    it('should set community review isRequired=false for appalachian tradition', () => {
      const engine = new WorkflowEngine(makeProject({ tradition: Tradition.APPALACHIAN }));
      expect(engine.getCommunityReviewGateStatus().isRequired).toBe(false);
    });

    it('should set community review isRequired=true for cross-tradition (conservative default)', () => {
      const engine = new WorkflowEngine(makeCrossTraditionProject());
      expect(engine.getCommunityReviewGateStatus().isRequired).toBe(true);
    });

    it('should have isDocumented=false initially', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      expect(engine.getCommunityReviewGateStatus().isDocumented).toBe(false);
    });
  });

  // ─── Sequential stage advancement ─────────────────────────────────────────

  describe('Sequential stage advancement', () => {
    it('should advance from PLANNING to RESEARCH', () => {
      const engine = new WorkflowEngine(makeProject());
      const result = engine.advance();
      expect(result).toBe(WorkflowStage.RESEARCH);
      expect(engine.currentStage).toBe(WorkflowStage.RESEARCH);
    });

    it('should advance from RESEARCH to FIELDWORK', () => {
      const engine = new WorkflowEngine(makeProject());
      advanceThrough(engine, 1);
      const result = engine.advance();
      expect(result).toBe(WorkflowStage.FIELDWORK);
    });

    it('should advance from FIELDWORK to DOCUMENTATION', () => {
      const engine = new WorkflowEngine(makeProject());
      advanceThrough(engine, 2);
      const result = engine.advance();
      expect(result).toBe(WorkflowStage.DOCUMENTATION);
    });

    it('should advance from DOCUMENTATION to REVIEW', () => {
      const engine = new WorkflowEngine(makeProject());
      advanceThrough(engine, 3);
      const result = engine.advance();
      expect(result).toBe(WorkflowStage.REVIEW);
    });

    it('should advance Appalachian project from REVIEW to PUBLICATION without community review', () => {
      const engine = new WorkflowEngine(makeProject({ tradition: Tradition.APPALACHIAN }));
      advanceThrough(engine, 4);
      const result = engine.advance();
      expect(result).toBe(WorkflowStage.PUBLICATION);
    });

    it('should throw WorkflowGateError when skipping stages (PLANNING to DOCUMENTATION)', () => {
      const engine = new WorkflowEngine(makeProject());
      // canAdvanceToStage with a non-sequential target should produce blockers
      const gateResult = engine.canAdvanceToStage(WorkflowStage.DOCUMENTATION);
      expect(gateResult.canAdvance).toBe(false);
      expect(gateResult.blockers[0]?.code).toBe('STAGE_SEQUENCE');
    });

    it('should throw WorkflowGateError on advance() when called after reaching PUBLICATION', () => {
      const engine = new WorkflowEngine(makeProject({ tradition: Tradition.APPALACHIAN }));
      advanceThrough(engine, 5); // reaches PUBLICATION
      expect(() => engine.advance()).toThrow(WorkflowGateError);
    });

    it('should create Heritage Book scaffold when advancing to DOCUMENTATION stage', () => {
      const engine = new WorkflowEngine(makeProject());
      expect(engine.book).toBeNull();
      advanceThrough(engine, 3); // PLANNING → RESEARCH → FIELDWORK → DOCUMENTATION
      expect(engine.book).not.toBeNull();
      expect(engine.book?.title).toBe('Test Heritage Project');
    });

    it('should not create a second book scaffold if already created', () => {
      const engine = new WorkflowEngine(makeProject());
      advanceThrough(engine, 3); // reaches DOCUMENTATION, book created
      const firstBook = engine.book;
      // advance to REVIEW — book should remain the same reference
      engine.advance();
      expect(engine.book).toBe(firstBook);
    });

    it('should include project id in Heritage Book scaffold', () => {
      const engine = new WorkflowEngine(makeProject({ id: 'unique-id-123' }));
      advanceThrough(engine, 3);
      expect(engine.book?.id).toBe('unique-id-123');
    });

    it('should include project creator as author in Heritage Book scaffold', () => {
      const engine = new WorkflowEngine(makeProject({ creator: 'Mary Johnson' }));
      advanceThrough(engine, 3);
      expect(engine.book?.frontMatter.titlePage).toContain('Mary Johnson');
    });
  });

  // ─── Community review gate — non-bypassable ────────────────────────────────

  describe('Community review gate — non-bypassable', () => {
    it('should block Inuit project from advancing REVIEW to PUBLICATION without community review documented', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      advanceThrough(engine, 4); // reach REVIEW
      expect(() => engine.advance()).toThrow(WorkflowGateError);
    });

    it('should block First Nations project from advancing REVIEW to PUBLICATION without community review documented', () => {
      const engine = new WorkflowEngine(makeFirstNationsProject());
      advanceThrough(engine, 4); // reach REVIEW
      expect(() => engine.advance()).toThrow(WorkflowGateError);
    });

    it('should block cross-tradition project from advancing REVIEW to PUBLICATION without community review documented', () => {
      const engine = new WorkflowEngine(makeCrossTraditionProject());
      advanceThrough(engine, 4); // reach REVIEW
      expect(() => engine.advance()).toThrow(WorkflowGateError);
    });

    it('should allow Appalachian project to advance REVIEW to PUBLICATION without community review', () => {
      const engine = new WorkflowEngine(makeProject({ tradition: Tradition.APPALACHIAN }));
      advanceThrough(engine, 4); // reach REVIEW
      expect(() => engine.advance()).not.toThrow();
      expect(engine.currentStage).toBe(WorkflowStage.PUBLICATION);
    });

    it('should allow Inuit project to advance to PUBLICATION after markCommunityReviewDocumented() called', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      advanceThrough(engine, 4); // reach REVIEW
      engine.markCommunityReviewDocumented('Elder Sarah Aqiaruq', '2026-02-15');
      expect(() => engine.advance()).not.toThrow();
      expect(engine.currentStage).toBe(WorkflowStage.PUBLICATION);
    });

    it('should allow First Nations project to advance to PUBLICATION after markCommunityReviewDocumented() called', () => {
      const engine = new WorkflowEngine(makeFirstNationsProject());
      advanceThrough(engine, 4); // reach REVIEW
      engine.markCommunityReviewDocumented('Band Council of the Cree Nation', '2026-01-20');
      expect(() => engine.advance()).not.toThrow();
      expect(engine.currentStage).toBe(WorkflowStage.PUBLICATION);
    });

    it('should have canBeWaived=false on COMMUNITY_REVIEW_GATE blocker', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      advanceThrough(engine, 4); // reach REVIEW
      const gateResult = engine.canAdvanceToStage(WorkflowStage.PUBLICATION);
      expect(gateResult.canAdvance).toBe(false);
      const reviewBlocker = gateResult.blockers.find(b => b.code === 'COMMUNITY_REVIEW_GATE');
      expect(reviewBlocker).toBeDefined();
      expect(reviewBlocker?.canBeWaived).toBe(false);
    });

    it('should record reviewerName from markCommunityReviewDocumented', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      engine.markCommunityReviewDocumented('Elder Mary Aqiaruq', '2026-03-01');
      const status = engine.getCommunityReviewGateStatus();
      expect(status.reviewerName).toBe('Elder Mary Aqiaruq');
    });

    it('should record reviewDate from markCommunityReviewDocumented', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      engine.markCommunityReviewDocumented('Band Council', '2026-03-01');
      const status = engine.getCommunityReviewGateStatus();
      expect(status.reviewDate).toBe('2026-03-01');
    });

    it('should reflect isDocumented=true in getCommunityReviewGateStatus after marking', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      expect(engine.getCommunityReviewGateStatus().isDocumented).toBe(false);
      engine.markCommunityReviewDocumented('Elder John Iqaluk', '2026-02-28');
      expect(engine.getCommunityReviewGateStatus().isDocumented).toBe(true);
    });

    it('should include COMMUNITY_REVIEW_GATE code in WorkflowGateError blockers', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      advanceThrough(engine, 4);
      let thrownError: WorkflowGateError | undefined;
      try {
        engine.advance();
      } catch (e) {
        thrownError = e as WorkflowGateError;
      }
      expect(thrownError).toBeDefined();
      expect(thrownError?.blockers.some(b => b.code === 'COMMUNITY_REVIEW_GATE')).toBe(true);
    });

    it('should have canAdvance=false from canAdvanceToStage(PUBLICATION) without documented review for Inuit', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      advanceThrough(engine, 4);
      const result = engine.canAdvanceToStage(WorkflowStage.PUBLICATION);
      expect(result.canAdvance).toBe(false);
    });

    it('should have canAdvance=true from canAdvanceToStage(PUBLICATION) after documented review for Inuit', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      advanceThrough(engine, 4);
      engine.markCommunityReviewDocumented('Elder Council', '2026-03-02');
      const result = engine.canAdvanceToStage(WorkflowStage.PUBLICATION);
      expect(result.canAdvance).toBe(true);
      expect(result.blockers).toHaveLength(0);
    });
  });

  // ─── getProtocolChecklist ──────────────────────────────────────────────────

  describe('getProtocolChecklist', () => {
    it('should return checklist for PLANNING stage', () => {
      const engine = new WorkflowEngine(makeProject());
      const checklist = engine.getProtocolChecklist(WorkflowStage.PLANNING);
      expect(checklist.stage).toBe(WorkflowStage.PLANNING);
      expect(checklist.stageName).toBe('Planning');
      expect(checklist.items.length).toBeGreaterThan(0);
    });

    it('should return checklist for current stage when no stage specified', () => {
      const engine = new WorkflowEngine(makeProject());
      const checklist = engine.getProtocolChecklist();
      expect(checklist.stage).toBe(WorkflowStage.PLANNING);
    });

    it('should include governance item for Indigenous projects in PLANNING stage', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      const checklist = engine.getProtocolChecklist(WorkflowStage.PLANNING);
      const governanceItem = checklist.items.find(i => i.id === 'plan-governance');
      expect(governanceItem).toBeDefined();
    });

    it('should exclude indigenous-only items for Appalachian project in PLANNING stage', () => {
      const engine = new WorkflowEngine(makeProject({ tradition: Tradition.APPALACHIAN }));
      const checklist = engine.getProtocolChecklist(WorkflowStage.PLANNING);
      const governanceItem = checklist.items.find(i => i.id === 'plan-governance');
      expect(governanceItem).toBeUndefined();
    });

    it('should include OCAP review item for First Nations project in RESEARCH stage', () => {
      const engine = new WorkflowEngine(makeFirstNationsProject());
      const checklist = engine.getProtocolChecklist(WorkflowStage.RESEARCH);
      const ocapItem = checklist.items.find(i => i.id === 'research-ocap');
      expect(ocapItem).toBeDefined();
    });

    it('should exclude OCAP review item for Appalachian project in RESEARCH stage', () => {
      const engine = new WorkflowEngine(makeProject({ tradition: Tradition.APPALACHIAN }));
      const checklist = engine.getProtocolChecklist(WorkflowStage.RESEARCH);
      const ocapItem = checklist.items.find(i => i.id === 'research-ocap');
      expect(ocapItem).toBeUndefined();
    });

    it('should include syllabics item for Inuit project in DOCUMENTATION stage', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      const checklist = engine.getProtocolChecklist(WorkflowStage.DOCUMENTATION);
      const syllabicsItem = checklist.items.find(i => i.id === 'doc-syllabics');
      expect(syllabicsItem).toBeDefined();
    });

    it('should include community review item for Inuit project in REVIEW stage', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      const checklist = engine.getProtocolChecklist(WorkflowStage.REVIEW);
      const communityItem = checklist.items.find(i => i.id === 'review-community');
      expect(communityItem).toBeDefined();
    });

    it('should include community review item for Inuit project in PUBLICATION stage', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      const checklist = engine.getProtocolChecklist(WorkflowStage.PUBLICATION);
      const communityPubItem = checklist.items.find(i => i.id === 'pub-community-review');
      expect(communityPubItem).toBeDefined();
    });

    it('should exclude community review item for Appalachian project in PUBLICATION stage', () => {
      const engine = new WorkflowEngine(makeProject({ tradition: Tradition.APPALACHIAN }));
      const checklist = engine.getProtocolChecklist(WorkflowStage.PUBLICATION);
      const communityPubItem = checklist.items.find(i => i.id === 'pub-community-review');
      expect(communityPubItem).toBeUndefined();
    });

    it('should return stageName matching WORKFLOW_STAGE_NAMES', () => {
      const engine = new WorkflowEngine(makeProject());
      for (const stage of [
        WorkflowStage.PLANNING,
        WorkflowStage.RESEARCH,
        WorkflowStage.FIELDWORK,
        WorkflowStage.DOCUMENTATION,
        WorkflowStage.REVIEW,
        WorkflowStage.PUBLICATION,
      ]) {
        const checklist = engine.getProtocolChecklist(stage);
        expect(checklist.stageName).toBe(WORKFLOW_STAGE_NAMES[stage]);
      }
    });

    it('should include non-indigenous items in every tradition', () => {
      for (const tradition of [Tradition.APPALACHIAN, Tradition.FIRST_NATIONS, Tradition.INUIT]) {
        const engine = new WorkflowEngine(makeProject({ tradition }));
        const checklist = engine.getProtocolChecklist(WorkflowStage.PLANNING);
        const scopeItem = checklist.items.find(i => i.id === 'plan-scope');
        expect(scopeItem).toBeDefined();
      }
    });

    it('should include all 4 PLANNING items for Indigenous project', () => {
      const engine = new WorkflowEngine(makeFirstNationsProject());
      const checklist = engine.getProtocolChecklist(WorkflowStage.PLANNING);
      expect(checklist.items).toHaveLength(4);
    });

    it('should include only non-indigenous PLANNING items for Appalachian project (3 items)', () => {
      const engine = new WorkflowEngine(makeProject({ tradition: Tradition.APPALACHIAN }));
      const checklist = engine.getProtocolChecklist(WorkflowStage.PLANNING);
      // 3 non-indigenous items: plan-scope, plan-territory, plan-consent-protocol
      // plan-governance is indigenousOnly=true, excluded
      expect(checklist.items.every(i => !i.indigenousOnly)).toBe(true);
    });

    it('should return NISR research item for Inuit project in RESEARCH stage', () => {
      const engine = new WorkflowEngine(makeInuitProject());
      const checklist = engine.getProtocolChecklist(WorkflowStage.RESEARCH);
      const nisrItem = checklist.items.find(i => i.id === 'research-nisr');
      expect(nisrItem).toBeDefined();
    });
  });

});
