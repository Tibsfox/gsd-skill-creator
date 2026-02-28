/**
 * Type definitions for the dogfood refinement phase.
 * Covers knowledge patches, improvement tickets, skill updates,
 * configuration, and the combined refinement result.
 */

// --- Patch Types ---

export type PatchType = 'update' | 'add' | 'replace' | 'annotate';

export interface KnowledgePatch {
  id: string;
  targetDocument: string;
  targetSection: string;
  gapId: string;
  patchType: PatchType;
  currentContent: string;
  proposedContent: string;
  rationale: string;
  confidence: number;
  requiresReview: boolean;
  reviewNotes: string;
}

// --- Ticket Types ---

export type TicketSeverity = 'critical' | 'high' | 'medium' | 'low';
export type TicketCategory = 'bug' | 'performance' | 'feature' | 'ux' | 'documentation';

export interface ImprovementTicket {
  id: string;
  title: string;
  component: string;
  severity: TicketSeverity;
  category: TicketCategory;
  description: string;
  reproductionSteps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  suggestedFix: string;
  affectedChapters: number[];
  tokenImpact: string;
}

// --- Skill Update Types ---

export interface SkillUpdate {
  id: string;
  skillName: string;
  action: 'create' | 'refine' | 'merge' | 'annotate';
  currentDefinition?: string;
  proposedDefinition: string;
  triggerPatterns: string[];
  complexPlanePosition: {
    theta: number;
    radius: number;
  };
  evidenceFromTextbook: string;
  evidenceFromEcosystem: string;
}

// --- Configuration ---

export interface RefinementConfig {
  gapReportPath: string;
  conceptDbPath: string;
  metricsPath: string;
  outputDir: string;
  minPatchConfidence: number;
  maxPatchesPerGap: number;
}

// --- Result ---

export interface RefinementResult {
  patches: KnowledgePatch[];
  tickets: ImprovementTicket[];
  skillUpdates: SkillUpdate[];
  statistics: {
    gapsProcessed: number;
    patchesGenerated: number;
    ticketsGenerated: number;
    skillsUpdated: number;
    skippedGaps: number;
  };
}
