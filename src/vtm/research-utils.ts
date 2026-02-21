/**
 * Research utilities: knowledge chunker, safety extractor, and necessity detector.
 *
 * Provides three pure functions for research reference processing:
 * - chunkKnowledge(): splits research into tiered chunks (summary/active/reference)
 * - extractSafety(): consolidates safety concerns from all topics
 * - detectResearchNecessity(): recommends pipeline speed from domain analysis
 *
 * These utilities complete the research reference compilation phase, enabling
 * downstream agents to load only the tier they need (saving tokens), get a
 * consolidated safety view for mission planning, and skip research for
 * well-understood domains.
 *
 * @module vtm/research-utils
 */

import type { ResearchReference, VisionDocument } from './types.js';
import { classifyArchetype, type Archetype } from './vision-validator.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Pipeline speed recommendation for research necessity. */
export type PipelineSpeed = 'full' | 'skip-research' | 'mission-only';

/** Tiered knowledge chunks with token estimates per tier. */
export interface KnowledgeTiers {
  summary: { content: string; estimatedTokens: number };
  active: { content: string; estimatedTokens: number };
  reference: { content: string; estimatedTokens: number };
}

/** Consolidated safety section extracted from all research topics. */
export interface SafetySection {
  concerns: Array<{
    condition: string;
    recommendation: string;
    boundaryType: 'annotate' | 'gate' | 'redirect';
    sourceModule: string;
  }>;
  sharedFramework: string;
  hasSafetyCritical: boolean;
}

/** Research necessity recommendation with confidence and domain analysis. */
export interface ResearchRecommendation {
  speed: PipelineSpeed;
  reason: string;
  confidence: number;
  domainAnalysis: {
    archetype: Archetype;
    moduleCount: number;
    hasSafetyDomain: boolean;
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Estimate token count from string content using char/4 heuristic.
 */
function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

/**
 * Extract the first sentence from a text string.
 */
function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text.slice(0, 100);
}

// ---------------------------------------------------------------------------
// chunkKnowledge
// ---------------------------------------------------------------------------

/**
 * Split a ResearchReference into three knowledge tiers with token estimates.
 *
 * - Summary tier (~2K tokens): purpose + topic names + one-sentence per topic
 * - Active tier (~10K tokens): purpose + howToUse + foundations + techniques
 * - Reference tier (full): complete serialized research content
 *
 * Token estimation uses Math.ceil(content.length / 4) -- standard char-to-token
 * approximation. Tiers are truncated with "..." if they exceed their targets.
 *
 * @param research - ResearchReference to chunk
 * @returns KnowledgeTiers with content and estimatedTokens per tier
 */
export function chunkKnowledge(research: ResearchReference): KnowledgeTiers {
  const SUMMARY_TARGET = 2000; // ~2K tokens
  const ACTIVE_TARGET = 10000; // ~10K tokens

  // --- Summary tier ---
  const topicLines = research.topics.map(
    t => `- ${t.name}: ${firstSentence(t.foundation)}`,
  );
  let summaryContent = [
    research.purpose,
    '',
    'Topics:',
    ...topicLines,
  ].join('\n');

  // Truncate if over budget
  const summaryTokens = estimateTokens(summaryContent);
  if (summaryTokens > SUMMARY_TARGET) {
    const maxChars = SUMMARY_TARGET * 4;
    summaryContent = summaryContent.slice(0, maxChars - 3) + '...';
  }

  // --- Active tier ---
  const activeParts = [
    research.purpose,
    '',
    research.howToUse,
    '',
  ];

  for (const topic of research.topics) {
    activeParts.push(`## ${topic.name}`);
    activeParts.push('');
    activeParts.push('### Foundation');
    activeParts.push(topic.foundation);
    activeParts.push('');
    activeParts.push('### Techniques');
    activeParts.push(topic.techniques);
    activeParts.push('');
  }

  let activeContent = activeParts.join('\n');

  // Truncate if over budget
  const activeTokens = estimateTokens(activeContent);
  if (activeTokens > ACTIVE_TARGET) {
    const maxChars = ACTIVE_TARGET * 4;
    activeContent = activeContent.slice(0, maxChars - 3) + '...';
  }

  // --- Reference tier (full content) ---
  const referenceParts = [
    `# ${research.name}`,
    '',
    `**Date:** ${research.date}`,
    `**Status:** ${research.status}`,
    `**Source:** ${research.sourceDocument}`,
    '',
    '## Purpose',
    research.purpose,
    '',
    '## How to Use',
    research.howToUse,
    '',
    '## Source Organizations',
    ...research.sourceOrganizations.map(o => `- ${o.name}: ${o.description}`),
    '',
  ];

  for (const topic of research.topics) {
    referenceParts.push(`## ${topic.name}`);
    referenceParts.push('');
    referenceParts.push('### Foundation');
    referenceParts.push(topic.foundation);
    referenceParts.push('');
    referenceParts.push('### Techniques');
    referenceParts.push(topic.techniques);
    referenceParts.push('');

    if (topic.safetyConcerns && topic.safetyConcerns.length > 0) {
      referenceParts.push('### Safety Concerns');
      for (const sc of topic.safetyConcerns) {
        referenceParts.push(`- [${sc.boundaryType}] ${sc.condition}: ${sc.recommendation}`);
      }
      referenceParts.push('');
    }

    if (topic.crossReferences && topic.crossReferences.length > 0) {
      referenceParts.push('### Cross-References');
      referenceParts.push(topic.crossReferences.join(', '));
      referenceParts.push('');
    }
  }

  if (research.integrationNotes) {
    referenceParts.push('## Integration Notes');
    if (research.integrationNotes.sharedSafetyFramework) {
      referenceParts.push(`**Safety Framework:** ${research.integrationNotes.sharedSafetyFramework}`);
    }
    referenceParts.push('');
  }

  const referenceContent = referenceParts.join('\n');

  return {
    summary: {
      content: summaryContent,
      estimatedTokens: estimateTokens(summaryContent),
    },
    active: {
      content: activeContent,
      estimatedTokens: estimateTokens(activeContent),
    },
    reference: {
      content: referenceContent,
      estimatedTokens: estimateTokens(referenceContent),
    },
  };
}

// ---------------------------------------------------------------------------
// extractSafety
// ---------------------------------------------------------------------------

/**
 * Extract and consolidate safety concerns from all research topics.
 *
 * Iterates all topics, collects safetyConcerns arrays, tags each with
 * sourceModule = topic.name. Returns sharedFramework from integrationNotes
 * or generates a summary. hasSafetyCritical = true if any concern has
 * boundaryType 'gate'.
 *
 * @param research - ResearchReference to extract safety from
 * @returns SafetySection with concerns, sharedFramework, hasSafetyCritical
 */
export function extractSafety(research: ResearchReference): SafetySection {
  const concerns: SafetySection['concerns'] = [];

  for (const topic of research.topics) {
    if (topic.safetyConcerns) {
      for (const sc of topic.safetyConcerns) {
        concerns.push({
          condition: sc.condition,
          recommendation: sc.recommendation,
          boundaryType: sc.boundaryType,
          sourceModule: topic.name,
        });
      }
    }
  }

  const hasSafetyCritical = concerns.some(c => c.boundaryType === 'gate');

  // Shared framework: from integrationNotes or generated
  let sharedFramework: string;
  if (research.integrationNotes?.sharedSafetyFramework) {
    sharedFramework = research.integrationNotes.sharedSafetyFramework;
  } else if (concerns.length > 0) {
    const sourceModules = [...new Set(concerns.map(c => c.sourceModule))];
    sharedFramework = `Safety framework for ${research.name}: ` +
      `${concerns.length} concern(s) across ${sourceModules.length} module(s). ` +
      `Apply appropriate boundary types during mission execution.`;
  } else {
    sharedFramework = `No safety concerns identified for ${research.name}. ` +
      `Standard implementation practices apply.`;
  }

  return {
    concerns,
    sharedFramework,
    hasSafetyCritical,
  };
}

// ---------------------------------------------------------------------------
// detectResearchNecessity
// ---------------------------------------------------------------------------

/**
 * Recommend pipeline speed based on domain analysis of a VisionDocument.
 *
 * Heuristics:
 * - 'full': safety concerns present, educational-pack archetype, or 5+ modules
 * - 'skip-research': infrastructure-component or organizational-system with
 *   no safety and fewer than 5 modules
 * - 'mission-only': creative-tool with no safety and 3 or fewer modules
 *
 * Confidence: 0.9 for clear signals, 0.7 for moderate, 0.5 for ambiguous.
 *
 * @param visionDoc - VisionDocument to analyze
 * @returns ResearchRecommendation with speed, reason, confidence, domainAnalysis
 */
export function detectResearchNecessity(visionDoc: VisionDocument): ResearchRecommendation {
  const archetype = classifyArchetype(visionDoc);
  const moduleCount = visionDoc.modules.length;
  const hasSafetyDomain = visionDoc.modules.some(
    m => m.safetyConcerns !== undefined && m.safetyConcerns !== '',
  );

  const domainAnalysis = { archetype, moduleCount, hasSafetyDomain };

  // --- Safety always forces full research ---
  if (hasSafetyDomain) {
    return {
      speed: 'full',
      reason: `Safety concerns detected in modules — full research required to ensure ` +
        `safe implementation boundaries for ${archetype} archetype.`,
      confidence: 0.9,
      domainAnalysis,
    };
  }

  // --- Educational-pack always needs full research ---
  if (archetype === 'educational-pack') {
    return {
      speed: 'full',
      reason: `Educational pack archetype requires full research for content accuracy ` +
        `across ${moduleCount} module(s).`,
      confidence: 0.9,
      domainAnalysis,
    };
  }

  // --- 5+ modules needs full research regardless of archetype ---
  if (moduleCount >= 5) {
    return {
      speed: 'full',
      reason: `Large scope (${moduleCount} modules) requires full research for ` +
        `comprehensive coverage as ${archetype}.`,
      confidence: 0.7,
      domainAnalysis,
    };
  }

  // --- Infrastructure/organizational with few modules can skip ---
  if (archetype === 'infrastructure-component' || archetype === 'organizational-system') {
    return {
      speed: 'skip-research',
      reason: `${archetype} with ${moduleCount} module(s) and no safety concerns — ` +
        `well-understood domain, skip research phase.`,
      confidence: 0.7,
      domainAnalysis,
    };
  }

  // --- Creative-tool with 3 or fewer modules ---
  if (archetype === 'creative-tool' && moduleCount <= 3) {
    return {
      speed: 'mission-only',
      reason: `Creative tool with ${moduleCount} module(s) and no safety concerns — ` +
        `proceed directly to mission planning.`,
      confidence: 0.7,
      domainAnalysis,
    };
  }

  // --- Fallback: moderate confidence skip-research ---
  return {
    speed: 'skip-research',
    reason: `${archetype} archetype with ${moduleCount} module(s) and no safety concerns — ` +
      `domain analysis suggests research can be skipped.`,
    confidence: 0.5,
    domainAnalysis,
  };
}
