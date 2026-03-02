/**
 * Project Builder Workflow — 6-stage pipeline for Heritage Book projects.
 *
 * Stages: Planning → Research → Fieldwork → Documentation → Review → Publication
 *
 * Critical constraint: the community review gate (Stage 5: Review) CANNOT be
 * bypassed for First Nations and Inuit content. This is enforced algorithmically.
 * The review gate is advisory for Appalachian content, but mandatory for all
 * Indigenous content.
 *
 * @module heritage-skills-pack/project-builder/workflow
 */

import { CulturalSovereigntyWarden } from '../safety/cultural-warden.js';
import { createHeritageBook } from './heritage-book-template/index.js';
import type { HeritageProject, HeritageBook, Tradition } from '../shared/types.js';

export { createHeritageBook, addChapter } from './heritage-book-template/index.js';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum WorkflowStage {
  PLANNING = 1,
  RESEARCH = 2,
  FIELDWORK = 3,
  DOCUMENTATION = 4,
  REVIEW = 5,
  PUBLICATION = 6,
}

export const WORKFLOW_STAGE_NAMES: Record<WorkflowStage, string> = {
  [WorkflowStage.PLANNING]: 'Planning',
  [WorkflowStage.RESEARCH]: 'Research',
  [WorkflowStage.FIELDWORK]: 'Fieldwork',
  [WorkflowStage.DOCUMENTATION]: 'Documentation',
  [WorkflowStage.REVIEW]: 'Community Review',
  [WorkflowStage.PUBLICATION]: 'Publication',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkflowGateResult {
  /** Whether the workflow can advance to the target stage. */
  canAdvance: boolean;
  /** Stage being evaluated. */
  targetStage: WorkflowStage;
  /** Blockers preventing advancement (empty if canAdvance=true). */
  blockers: WorkflowBlocker[];
}

export interface WorkflowBlocker {
  /** Short blocker code. */
  code: string;
  /** Human-readable description of what must be resolved. */
  message: string;
  /** Whether this blocker can be waived (false = non-negotiable). */
  canBeWaived: boolean;
}

export interface CommunityReviewGateStatus {
  /** Whether community review is required for this project's tradition. */
  isRequired: boolean;
  /** Whether community review has been documented. */
  isDocumented: boolean;
  /** The reviewer's name (if documented). */
  reviewerName?: string;
  /** The review date (if documented). */
  reviewDate?: string;
}

export interface StageProtocolChecklist {
  stage: WorkflowStage;
  stageName: string;
  items: ProtocolChecklistItem[];
}

export interface ProtocolChecklistItem {
  id: string;
  description: string;
  required: boolean;
  indigenousOnly: boolean;
}

export class WorkflowGateError extends Error {
  readonly blockers: WorkflowBlocker[];

  constructor(stage: WorkflowStage, blockers: WorkflowBlocker[]) {
    const stageName = WORKFLOW_STAGE_NAMES[stage] ?? `Stage ${stage}`;
    const summary = blockers.map(b => b.message).join('; ');
    super(`Cannot advance to ${stageName}: ${summary}`);
    this.name = 'WorkflowGateError';
    this.blockers = blockers;
  }
}

// ─── Protocol Checklists per Stage ────────────────────────────────────────────

const STAGE_CHECKLISTS: Record<WorkflowStage, ProtocolChecklistItem[]> = {
  [WorkflowStage.PLANNING]: [
    { id: 'plan-scope', description: 'Define the scope of traditions and skills to document', required: true, indigenousOnly: false },
    { id: 'plan-territory', description: 'Identify the traditional territories where fieldwork will occur', required: true, indigenousOnly: false },
    { id: 'plan-governance', description: 'Identify the governance bodies for any Indigenous content (band council, Inuit organization)', required: true, indigenousOnly: true },
    { id: 'plan-consent-protocol', description: 'Select appropriate consent protocol (standard, OCAP-compliant, NISR-compliant)', required: true, indigenousOnly: false },
  ],
  [WorkflowStage.RESEARCH]: [
    { id: 'research-canonical', description: 'Review canonical works in the Skill Hall library for relevant traditions', required: true, indigenousOnly: false },
    { id: 'research-ocap', description: 'Review OCAP\u00ae framework documentation before researching First Nations content', required: true, indigenousOnly: true },
    { id: 'research-nisr', description: 'Review NISR framework documentation before researching Inuit content', required: true, indigenousOnly: true },
    { id: 'research-sovereignty', description: 'Identify Cultural Sovereignty Level of all content to be documented (Levels 1-4)', required: true, indigenousOnly: true },
  ],
  [WorkflowStage.FIELDWORK]: [
    { id: 'field-consent', description: 'Obtain documented consent from all knowledge holders before recording', required: true, indigenousOnly: false },
    { id: 'field-community-consent', description: 'Obtain community-level consent for First Nations and Inuit content', required: true, indigenousOnly: true },
    { id: 'field-equipment', description: 'Test and prepare recording equipment before each interview session', required: true, indigenousOnly: false },
    { id: 'field-protocols', description: 'Follow nation-specific interview protocols (Haudenosaunee, Anishinaabe, Inuit protocols differ)', required: true, indigenousOnly: true },
  ],
  [WorkflowStage.DOCUMENTATION]: [
    { id: 'doc-transcription', description: 'Transcribe all recordings with nation-specific attribution preserved', required: true, indigenousOnly: false },
    { id: 'doc-syllabics', description: 'Verify Inuktitut syllabics (\u1403\u1546\u1483\u1466\u1583\u1466) render correctly in all documents', required: true, indigenousOnly: true },
    { id: 'doc-sovereignty-tags', description: 'Apply Cultural Sovereignty Level tags to all Indigenous content', required: true, indigenousOnly: true },
    { id: 'doc-bibliography', description: 'Generate bibliography with Fair Use notices using the Bibliography Engine', required: true, indigenousOnly: false },
  ],
  [WorkflowStage.REVIEW]: [
    { id: 'review-knowledge-holder', description: 'Return transcripts to all knowledge holders for review and correction', required: true, indigenousOnly: false },
    { id: 'review-community', description: 'Submit to community governance body for review before publication', required: true, indigenousOnly: true },
    { id: 'review-sovereignty', description: 'Verify no Level 3-4 content has been included without appropriate restriction', required: true, indigenousOnly: true },
    { id: 'review-attribution', description: 'Confirm all attribution templates are complete with nation-specific names', required: true, indigenousOnly: false },
  ],
  [WorkflowStage.PUBLICATION]: [
    { id: 'pub-territorial', description: 'Finalize territorial acknowledgment with specific nation names', required: true, indigenousOnly: false },
    { id: 'pub-cultural-sovereignty', description: 'Verify cultural sovereignty statement is present in front matter', required: true, indigenousOnly: false },
    { id: 'pub-creator-links', description: 'Confirm all bibliography creator-first links are current and working', required: true, indigenousOnly: false },
    { id: 'pub-community-review', description: 'Confirm community review documentation is on file before publishing Indigenous content', required: true, indigenousOnly: true },
  ],
};

// ─── WorkflowEngine ───────────────────────────────────────────────────────────

export class WorkflowEngine {
  private readonly project: HeritageProject;
  private _currentStage: WorkflowStage = WorkflowStage.PLANNING;
  private _book: HeritageBook | null = null;
  private _communityReview: CommunityReviewGateStatus;
  private readonly _warden: CulturalSovereigntyWarden;

  constructor(project: HeritageProject, warden?: CulturalSovereigntyWarden) {
    this.project = project;
    this._warden = warden ?? new CulturalSovereigntyWarden();
    this._communityReview = {
      isRequired: this.isIndigenousTradition(project.tradition),
      isDocumented: false,
    };
  }

  get currentStage(): WorkflowStage {
    return this._currentStage;
  }

  get book(): HeritageBook | null {
    return this._book;
  }

  /**
   * Returns whether the community review gate is required and documented.
   * Non-negotiable for First Nations, Inuit, and cross-tradition content.
   */
  getCommunityReviewGateStatus(): CommunityReviewGateStatus {
    return { ...this._communityReview };
  }

  /**
   * Document that community review has been completed.
   * Must be called before advancing from REVIEW to PUBLICATION for Indigenous content.
   */
  markCommunityReviewDocumented(reviewerName: string, reviewDate: string): void {
    this._communityReview = {
      ...this._communityReview,
      isDocumented: true,
      reviewerName,
      reviewDate,
    };
  }

  /**
   * Evaluate whether the workflow can advance to the target stage.
   * Returns blockers explaining why advancement is blocked.
   */
  canAdvanceToStage(targetStage: WorkflowStage): WorkflowGateResult {
    const blockers: WorkflowBlocker[] = [];

    // Sequential stage enforcement: cannot skip stages
    if (targetStage !== this._currentStage + 1) {
      blockers.push({
        code: 'STAGE_SEQUENCE',
        message: `Must complete ${WORKFLOW_STAGE_NAMES[this._currentStage]} before advancing to ${WORKFLOW_STAGE_NAMES[targetStage] ?? `Stage ${targetStage}`}. Cannot skip stages.`,
        canBeWaived: false,
      });
      return { canAdvance: false, targetStage, blockers };
    }

    // Community review gate — non-bypassable for Indigenous content at PUBLICATION
    if (targetStage === WorkflowStage.PUBLICATION && this._communityReview.isRequired && !this._communityReview.isDocumented) {
      blockers.push({
        code: 'COMMUNITY_REVIEW_GATE',
        message: `Community review is required for ${this.project.tradition} content and has not been documented. Call markCommunityReviewDocumented() before advancing to Publication. This gate cannot be bypassed.`,
        canBeWaived: false,
      });
    }

    return {
      canAdvance: blockers.length === 0,
      targetStage,
      blockers,
    };
  }

  /**
   * Advance to the next workflow stage.
   * Throws WorkflowGateError if the advancement is blocked.
   */
  advance(): WorkflowStage {
    const targetStage = (this._currentStage + 1) as WorkflowStage;

    if (targetStage > WorkflowStage.PUBLICATION) {
      throw new WorkflowGateError(WorkflowStage.PUBLICATION, [{
        code: 'ALREADY_PUBLISHED',
        message: 'Project is already at Publication stage.',
        canBeWaived: false,
      }]);
    }

    const gateResult = this.canAdvanceToStage(targetStage);

    if (!gateResult.canAdvance) {
      throw new WorkflowGateError(targetStage, gateResult.blockers);
    }

    // Initialize Heritage Book scaffold when entering Documentation stage
    if (targetStage === WorkflowStage.DOCUMENTATION && this._book === null) {
      this._book = createHeritageBook({
        id: this.project.id,
        title: this.project.title,
        authorName: this.project.creator,
        traditions: [this.project.tradition],
      });
    }

    this._currentStage = targetStage;
    return this._currentStage;
  }

  /**
   * Get the protocol checklist for a given stage (defaults to current stage).
   * Filters to tradition-relevant items based on the project's tradition.
   */
  getProtocolChecklist(stage?: WorkflowStage): StageProtocolChecklist {
    const targetStage = stage ?? this._currentStage;
    const allItems = STAGE_CHECKLISTS[targetStage];
    const isIndigenous = this.isIndigenousTradition(this.project.tradition);

    // Always include non-indigenous items; include indigenous-only items for Indigenous projects
    const items = allItems.filter(item => !item.indigenousOnly || isIndigenous);

    return {
      stage: targetStage,
      stageName: WORKFLOW_STAGE_NAMES[targetStage],
      items,
    };
  }

  private isIndigenousTradition(tradition: Tradition | string): boolean {
    return tradition === 'first-nations' || tradition === 'inuit' || tradition === 'cross-tradition';
  }
}
