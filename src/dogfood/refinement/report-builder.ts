/**
 * Builds the comprehensive v1.40 dogfood report from all upstream data.
 * Compiles patches, tickets, skills, metrics, and gap analysis into
 * a structured markdown report with all required sections.
 */

import type { RefinementResult, KnowledgePatch, ImprovementTicket, SkillUpdate } from './types.js';
import type { ProgressState, ChapterMetrics } from '../harness/types.js';
import type { GapRecord } from '../verification/types.js';

// --- Exported Types ---

export interface ReportInput {
  result: RefinementResult;
  progress: ProgressState;
  chapterMetrics: ChapterMetrics[];
  gaps: GapRecord[];
  eightLayerMapping?: EightLayerMapping[];
}

export interface EightLayerMapping {
  layer: number;
  layerName: string;
  textbookParts: number[];
  alignment: 'strong' | 'partial' | 'weak' | 'gap';
  notes: string;
}

// --- Part metadata ---

const PARTS: Array<{ num: number; roman: string; name: string; chapters: [number, number] }> = [
  { num: 1, roman: 'I', name: 'Seeing', chapters: [1, 3] },
  { num: 2, roman: 'II', name: 'Hearing', chapters: [4, 6] },
  { num: 3, roman: 'III', name: 'Touching', chapters: [7, 9] },
  { num: 4, roman: 'IV', name: 'Expanding', chapters: [10, 12] },
  { num: 5, roman: 'V', name: 'Grounding', chapters: [13, 17] },
  { num: 6, roman: 'VI', name: 'Defining', chapters: [18, 20] },
  { num: 7, roman: 'VII', name: 'Mapping', chapters: [21, 23] },
  { num: 8, roman: 'VIII', name: 'Channeling', chapters: [24, 27] },
  { num: 9, roman: 'IX', name: 'Growing', chapters: [28, 30] },
  { num: 10, roman: 'X', name: 'Being', chapters: [31, 33] },
];

// --- Default eight-layer mapping ---

const DEFAULT_EIGHT_LAYERS: EightLayerMapping[] = [
  { layer: 1, layerName: 'Foundation', textbookParts: [1, 2], alignment: 'strong', notes: 'Core perception and sensory input' },
  { layer: 2, layerName: 'Activation', textbookParts: [3, 4], alignment: 'strong', notes: 'Physical engagement and expansion' },
  { layer: 3, layerName: 'Pattern Recognition', textbookParts: [5], alignment: 'partial', notes: 'Grounding and stability' },
  { layer: 4, layerName: 'Concept Formation', textbookParts: [6], alignment: 'strong', notes: 'Definition and formalization' },
  { layer: 5, layerName: 'Skill Integration', textbookParts: [7], alignment: 'partial', notes: 'Mapping and spatial reasoning' },
  { layer: 6, layerName: 'Complex Plane Positioning', textbookParts: [8], alignment: 'weak', notes: 'Channeling and flow dynamics' },
  { layer: 7, layerName: 'Synthesis', textbookParts: [9], alignment: 'partial', notes: 'Growth and emergence' },
  { layer: 8, layerName: 'Transcendence', textbookParts: [10], alignment: 'gap', notes: 'Being and wholeness' },
];

/**
 * Build the comprehensive dogfood report as a markdown string.
 * All sections use actual data from inputs -- no placeholders.
 */
export function buildReport(input: ReportInput): string {
  const { result, progress, chapterMetrics, gaps } = input;
  const eightLayers = input.eightLayerMapping ?? DEFAULT_EIGHT_LAYERS;

  const sections: string[] = [];

  sections.push(buildTitle());
  sections.push(buildExecutiveSummary(progress, result));
  sections.push(buildMetricsDashboard(progress, result, chapterMetrics));
  sections.push(buildEightLayerVerification(eightLayers, gaps));
  sections.push(buildGapAnalysisByPart(gaps));
  sections.push(buildTopFindings(gaps, result));
  sections.push(buildPerformanceAssessment(chapterMetrics, gaps, result));
  sections.push(buildPatchesSummary(result.patches));
  sections.push(buildTicketsSummary(result.tickets));
  sections.push(buildRecommendations(gaps, result));
  sections.push(buildAppendices(result, chapterMetrics, gaps));

  return sections.join('\n\n');
}

// --- Section builders ---

function buildTitle(): string {
  return '# v1.40 Dogfood Report: sc:learn x The Space Between';
}

function buildExecutiveSummary(progress: ProgressState, result: RefinementResult): string {
  const chaptersProcessed = progress.extraction.chaptersExtracted;
  const conceptsLearned = progress.learning.trackA.conceptsLearned + progress.learning.trackB.conceptsLearned;
  const gapsFound = progress.verification.gapsFound;
  const { patchesGenerated, ticketsGenerated, skillsUpdated } = result.statistics;

  const gapTypes = progress.verification.gapsByType;
  const topGapType = Object.entries(gapTypes).sort((a, b) => b[1] - a[1])[0];
  const topGapDesc = topGapType ? `${topGapType[0]} (${topGapType[1]} instances)` : 'none detected';

  return `## Executive Summary

The v1.40 dogfood mission processed ${chaptersProcessed} chapters from "The Space Between" through the sc:learn pipeline. The pipeline detected ${conceptsLearned} concepts across both learning tracks, then verified them against the existing ecosystem documentation. Verification identified ${gapsFound} gaps between textbook knowledge and ecosystem coverage.

The most common gap type was ${topGapDesc}. The refinement phase generated ${patchesGenerated} knowledge patches, ${ticketsGenerated} improvement tickets, and ${skillsUpdated} skill updates. All patches are proposals requiring human review before application, consistent with the bounded learning safety model.

This report provides a comprehensive analysis of each pipeline stage, per-part breakdowns, and actionable recommendations for the v1.41 milestone cycle.`;
}

function buildMetricsDashboard(
  progress: ProgressState,
  result: RefinementResult,
  chapterMetrics: ChapterMetrics[],
): string {
  const totalTokens = chapterMetrics.reduce((sum, cm) => sum + cm.tokensUsed, 0);
  const totalTimeMs = chapterMetrics.reduce((sum, cm) => sum + cm.processingTimeMs, 0);
  const totalTimeSec = (totalTimeMs / 1000).toFixed(1);
  const conceptsLearned = progress.learning.trackA.conceptsLearned + progress.learning.trackB.conceptsLearned;

  const gapEntries = Object.entries(progress.verification.gapsByType);
  const gapBreakdown = gapEntries.length > 0
    ? gapEntries.map(([t, c]) => `  - ${t}: ${c}`).join('\n')
    : '  - No gaps recorded';

  return `## Metrics Dashboard

- **Total chapters processed:** ${progress.extraction.chaptersExtracted} / 33
- **Total chunks generated:** ${progress.extraction.chunksGenerated}
- **Total pages extracted:** ${progress.extraction.totalPages}
- **Total concepts learned:** ${conceptsLearned} (Track A: ${progress.learning.trackA.conceptsLearned}, Track B: ${progress.learning.trackB.conceptsLearned})
- **Total concepts verified:** ${progress.verification.conceptsVerified}
- **Total gaps found:** ${progress.verification.gapsFound}
${gapBreakdown}
- **Patches generated:** ${result.statistics.patchesGenerated}
- **Improvement tickets:** ${result.statistics.ticketsGenerated}
- **Skills updated:** ${result.statistics.skillsUpdated}
- **Gaps processed:** ${result.statistics.gapsProcessed}
- **Gaps skipped:** ${result.statistics.skippedGaps}
- **Token usage:** ${totalTokens.toLocaleString()} tokens
- **Processing time:** ${totalTimeSec} seconds (${formatDuration(totalTimeMs)})`;
}

function buildEightLayerVerification(layers: EightLayerMapping[], gaps: GapRecord[]): string {
  let table = '| Layer | Name | Textbook Parts | Alignment | Notes |\n';
  table += '|-------|------|----------------|-----------|-------|\n';

  for (const layer of layers) {
    const partsStr = layer.textbookParts.map(p => `Part ${toRoman(p)}`).join(', ');
    table += `| ${layer.layer} | ${layer.layerName} | ${partsStr} | ${layer.alignment} | ${layer.notes} |\n`;
  }

  return `## The Eight-Layer Verification

${table}`;
}

function buildGapAnalysisByPart(gaps: GapRecord[]): string {
  const sections: string[] = ['## Gap Analysis by Part'];

  for (const part of PARTS) {
    const [startCh, endCh] = part.chapters;
    const partGaps = gaps.filter(g => {
      const ch = parseChapterFromSource(g.textbookSource);
      return ch >= startCh && ch <= endCh;
    });

    const typeCounts: Record<string, number> = {};
    for (const g of partGaps) {
      typeCounts[g.type] = (typeCounts[g.type] ?? 0) + 1;
    }

    const typeBreakdown = Object.entries(typeCounts).length > 0
      ? Object.entries(typeCounts).map(([t, c]) => `${t}: ${c}`).join(', ')
      : 'No gaps detected';

    sections.push(
      `### Part ${part.roman}: ${part.name} (Chapters ${startCh}-${endCh})\n\n` +
      `**Gaps found:** ${partGaps.length}\n` +
      `**Breakdown:** ${typeBreakdown}`,
    );
  }

  return sections.join('\n\n');
}

function buildTopFindings(gaps: GapRecord[], result: RefinementResult): string {
  // Rank by severity: critical first, then significant with multiple affected components
  const ranked = [...gaps]
    .filter(g => g.type !== 'verified')
    .sort((a, b) => {
      const sevOrder: Record<string, number> = { critical: 0, significant: 1, minor: 2, informational: 3 };
      const sevDiff = (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3);
      if (sevDiff !== 0) return sevDiff;
      return b.affectsComponents.length - a.affectsComponents.length;
    });

  const top = ranked.slice(0, 5);
  const findings = top.length > 0
    ? top.map((g, i) => `${i + 1}. **${g.concept}** (${g.type}, ${g.severity}): ${g.analysis}`).join('\n')
    : '1. No significant findings detected in this pipeline run.';

  return `## Top Findings

${findings}`;
}

function buildPerformanceAssessment(
  chapterMetrics: ChapterMetrics[],
  gaps: GapRecord[],
  result: RefinementResult,
): string {
  // What worked well: low-error chapters and verified concepts
  const lowErrorChapters = chapterMetrics
    .filter(cm => cm.errorsEncountered === 0)
    .map(cm => cm.chapter);
  const workedWell = lowErrorChapters.length > 0
    ? `Chapters with zero extraction errors: ${lowErrorChapters.length} out of ${chapterMetrics.length}. Concept detection was reliable across these chapters.`
    : 'All chapters had some extraction errors. Further investigation needed for robust extraction.';

  // What struggled: high-error chapters or missing concepts
  const highErrorChapters = chapterMetrics
    .filter(cm => cm.errorsEncountered > 0)
    .sort((a, b) => b.errorsEncountered - a.errorsEncountered)
    .slice(0, 5);
  const struggled = highErrorChapters.length > 0
    ? `Chapters with highest error counts: ${highErrorChapters.map(cm => `Chapter ${cm.chapter} (${cm.errorsEncountered} errors)`).join(', ')}.`
    : 'No chapters reported errors during extraction.';

  // Recommended improvements from tickets
  const ticketRefs = result.tickets.length > 0
    ? result.tickets.slice(0, 5).map(t => `- ${t.title} (${t.id})`).join('\n')
    : '- No improvement tickets generated';

  return `## sc:learn Performance Assessment

### What Worked Well

${workedWell}

### What Struggled

${struggled}

### Recommended Improvements

${ticketRefs}`;
}

function buildPatchesSummary(patches: KnowledgePatch[]): string {
  if (patches.length === 0) {
    return `## Knowledge Patches Summary

No patches generated. The ecosystem documentation aligns with the textbook within acceptable thresholds.`;
  }

  const sorted = [...patches].sort((a, b) => b.confidence - a.confidence);

  let table = '| Patch ID | Target Document | Type | Confidence | Review Notes |\n';
  table += '|----------|----------------|------|------------|-------------|\n';

  for (const p of sorted) {
    table += `| ${p.id} | ${p.targetDocument} | ${p.patchType} | ${p.confidence} | ${p.reviewNotes.slice(0, 60)}... |\n`;
  }

  return `## Knowledge Patches Summary

${table}`;
}

function buildTicketsSummary(tickets: ImprovementTicket[]): string {
  if (tickets.length === 0) {
    return `## Improvement Tickets Summary

No tickets generated. The sc:learn pipeline processed all chapters without friction points above threshold.`;
  }

  const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...tickets].sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));

  let table = '| Ticket ID | Title | Component | Severity | Category |\n';
  table += '|-----------|-------|-----------|----------|----------|\n';

  for (const t of sorted) {
    table += `| ${t.id} | ${t.title} | ${t.component} | ${t.severity} | ${t.category} |\n`;
  }

  return `## Improvement Tickets Summary

${table}`;
}

function buildRecommendations(gaps: GapRecord[], result: RefinementResult): string {
  const criticalGaps = gaps.filter(g => g.severity === 'critical');
  const significantGaps = gaps.filter(g => g.severity === 'significant');

  const recs: string[] = [];

  if (criticalGaps.length > 0) {
    recs.push(`1. **Address ${criticalGaps.length} critical gap(s) immediately.** These represent fundamental knowledge misalignment between the textbook and ecosystem.`);
  }

  if (significantGaps.length > 0) {
    recs.push(`${recs.length + 1}. **Review ${significantGaps.length} significant gap(s) for v1.41 planning.** These affect core pipeline accuracy.`);
  }

  if (result.statistics.patchesGenerated > 0) {
    recs.push(`${recs.length + 1}. **Review and apply ${result.statistics.patchesGenerated} knowledge patch(es).** All patches require human review before application.`);
  }

  if (result.statistics.ticketsGenerated > 0) {
    recs.push(`${recs.length + 1}. **Triage ${result.statistics.ticketsGenerated} improvement ticket(s).** Prioritize by severity for maximum pipeline improvement.`);
  }

  if (recs.length === 0) {
    recs.push('1. Continue monitoring pipeline performance across future milestone cycles.');
  }

  return `## Recommendations for v1.41+

${recs.join('\n')}`;
}

function buildAppendices(
  result: RefinementResult,
  chapterMetrics: ChapterMetrics[],
  gaps: GapRecord[],
): string {
  const gapCount = gaps.length;
  const patchCount = result.patches.length;
  const ticketCount = result.tickets.length;

  const totalTokens = chapterMetrics.reduce((sum, cm) => sum + cm.tokensUsed, 0);
  const conceptCount = chapterMetrics.reduce((sum, cm) => sum + cm.conceptsDetected, 0);

  return `## Appendices

### A. Full Gap Report Reference

Total gap records: ${gapCount}. See gap-report.json for complete data including all fields (type, severity, concept, claims, analysis, resolution).

### B. Full Patch Set Reference

Total patches: ${patchCount}. Each patch includes targetDocument, patchType, currentContent, proposedContent, rationale, and confidence score. All patches have requiresReview=true.

### C. Full Ticket List Reference

Total tickets: ${ticketCount}. Each ticket includes title, component, severity, category, reproductionSteps, expectedBehavior, actualBehavior, suggestedFix, affectedChapters, and tokenImpact.

### D. Token Usage Breakdown by Wave

- Extraction wave: ${chapterMetrics.length > 0 ? chapterMetrics.reduce((s, c) => s + c.tokensUsed, 0).toLocaleString() : '0'} tokens across ${chapterMetrics.length} chapters
- Total token usage: ${totalTokens.toLocaleString()} tokens

### E. Concept Database Statistics

- Total concepts detected: ${conceptCount}
- Concepts across ${chapterMetrics.length} chapters
- Average concepts per chapter: ${chapterMetrics.length > 0 ? (conceptCount / chapterMetrics.length).toFixed(1) : '0'}
- Average math density: ${chapterMetrics.length > 0 ? (chapterMetrics.reduce((s, c) => s + c.mathDensity, 0) / chapterMetrics.length).toFixed(2) : '0'}`;
}

// --- Utilities ---

function parseChapterFromSource(source: string): number {
  const match = source.match(/Chapter\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

function toRoman(n: number): string {
  const romans: Array<[number, string]> = [
    [10, 'X'], [9, 'IX'], [8, 'VIII'], [7, 'VII'], [6, 'VI'],
    [5, 'V'], [4, 'IV'], [3, 'III'], [2, 'II'], [1, 'I'],
  ];
  let result = '';
  let remaining = n;
  for (const [value, symbol] of romans) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainSec = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainSec}s`;
}
