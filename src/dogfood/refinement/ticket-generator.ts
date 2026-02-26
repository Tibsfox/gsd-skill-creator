/**
 * Generates improvement tickets from gap records.
 * Maps friction points to actionable tickets with reproduction steps,
 * severity classification, and chapter cross-links.
 */

import type { GapRecord, GapSeverity } from '../verification/types.js';
import type { LearnedConcept } from '../learning/types.js';
import type { ImprovementTicket, TicketSeverity, TicketCategory } from './types.js';

/** Gap types that produce tickets */
const TICKETABLE_TYPES = new Set([
  'inconsistent',
  'missing-in-ecosystem',
  'incomplete',
  'differently-expressed',
]);

/**
 * Generate improvement tickets from gap records.
 * Filters to ticketable gap types and generates tickets with
 * all required fields including reproduction steps and chapter links.
 */
export function generateTickets(
  gaps: GapRecord[],
  concepts?: LearnedConcept[],
): ImprovementTicket[] {
  const tickets: ImprovementTicket[] = [];

  for (const gap of gaps) {
    if (!TICKETABLE_TYPES.has(gap.type)) {
      continue;
    }

    // For 'incomplete' gaps, only ticket if analysis mentions extraction/parsing
    if (gap.type === 'incomplete') {
      const analysisLower = gap.analysis.toLowerCase();
      if (!analysisLower.includes('extract') && !analysisLower.includes('pars')) {
        continue;
      }
    }

    const component = deriveComponent(gap);
    const severity = mapSeverity(gap.severity);
    const category = deriveCategory(gap);
    const title = deriveTitle(gap);
    const affectedChapters = parseChapters(gap.textbookSource);
    const tokenImpact = estimateTokenImpact(gap);

    const ticket: ImprovementTicket = {
      id: `ticket-${gap.id}`,
      title,
      component,
      severity,
      category,
      description: gap.analysis,
      reproductionSteps: generateReproductionSteps(gap),
      expectedBehavior: gap.textbookClaim || 'Concept should be detected and correctly positioned',
      actualBehavior: gap.ecosystemClaim || 'Concept was not detected / incorrectly positioned',
      suggestedFix: gap.suggestedResolution || 'Investigation needed',
      affectedChapters,
      tokenImpact,
    };

    tickets.push(ticket);
  }

  // Sort by severity (critical first), then by first affected chapter
  const severityOrder: Record<TicketSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  tickets.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return (a.affectedChapters[0] ?? 0) - (b.affectedChapters[0] ?? 0);
  });

  return tickets;
}

/** Derive component from gap context */
function deriveComponent(gap: GapRecord): string {
  const text = `${gap.analysis} ${gap.affectsComponents.join(' ')}`.toLowerCase();

  if (text.includes('extract') || text.includes('pars') || text.includes('pdf')) {
    return 'pdf-extraction';
  }
  if (text.includes('position') || text.includes('theta') || text.includes('radius') || text.includes('plane')) {
    return 'position-mapper';
  }
  if (text.includes('cross-ref') || text.includes('mapping') || text.includes('cross ref')) {
    return 'cross-referencer';
  }
  if (text.includes('detect') || text.includes('concept')) {
    return 'concept-detector';
  }

  return 'sc-learn-core';
}

/** Map gap severity to ticket severity */
function mapSeverity(gapSeverity: GapSeverity): TicketSeverity {
  switch (gapSeverity) {
    case 'critical': return 'critical';
    case 'significant': return 'high';
    case 'minor': return 'medium';
    case 'informational': return 'low';
  }
}

/** Derive ticket category from gap type and analysis context */
function deriveCategory(gap: GapRecord): TicketCategory {
  // Extraction/parsing failures are bugs regardless of gap type
  const analysisLower = gap.analysis.toLowerCase();
  if (analysisLower.includes('extract') || analysisLower.includes('pars') || analysisLower.includes('pdf')) {
    return 'bug';
  }

  switch (gap.type) {
    case 'inconsistent': return 'bug';
    case 'missing-in-ecosystem': return 'feature';
    case 'incomplete': return 'documentation';
    case 'differently-expressed': return 'ux';
    default: return 'bug';
  }
}

/** Generate a short, action-oriented title */
function deriveTitle(gap: GapRecord): string {
  switch (gap.type) {
    case 'inconsistent':
      return `Fix inconsistency in ${gap.concept} detection`;
    case 'missing-in-ecosystem':
      return `Add concept detection for ${gap.concept}`;
    case 'incomplete':
      return `Improve extraction coverage for ${gap.concept}`;
    case 'differently-expressed':
      return `Align vocabulary for ${gap.concept}`;
    default:
      return `Address ${gap.type} gap for ${gap.concept}`;
  }
}

/** Parse chapter numbers from textbook source string */
function parseChapters(textbookSource: string): number[] {
  const matches = textbookSource.match(/Chapter\s+(\d+)/gi);
  if (matches && matches.length > 0) {
    const chapters = matches
      .map(m => {
        const num = m.match(/\d+/);
        return num ? parseInt(num[0], 10) : 0;
      })
      .filter(n => n >= 0 && n <= 33);
    return chapters.length > 0 ? chapters : [0];
  }
  return [0];
}

/** Estimate token impact based on gap type */
function estimateTokenImpact(gap: GapRecord): string {
  switch (gap.type) {
    case 'missing-in-ecosystem':
      return '~500 tokens wasted per occurrence';
    case 'inconsistent':
      return '~1000 tokens for repositioning';
    case 'incomplete':
      return 'Minimal - documentation improvement';
    case 'differently-expressed':
      return 'Minimal - vocabulary alignment';
    default:
      return 'Minimal';
  }
}

/** Generate reproduction steps from gap context */
function generateReproductionSteps(gap: GapRecord): string[] {
  const chapters = parseChapters(gap.textbookSource);
  const chapterStr = chapters[0] > 0 ? `Chapter ${chapters[0]}` : gap.textbookSource;

  return [
    `1. Run sc:learn on ${chapterStr}`,
    `2. Check concept database for ${gap.concept}`,
    `3. Observe: ${gap.ecosystemClaim || 'concept not detected / incorrectly positioned'}`,
  ];
}
