/**
 * Research compiler and source quality checker.
 *
 * Transforms a parsed VisionDocument into a structured ResearchReference
 * with per-module research topics, and validates source credibility.
 *
 * - compileResearch(): VisionDocument -> ResearchReference
 * - checkSourceQuality(): ResearchReference -> SourceDiagnostic[]
 *
 * Uses classifyArchetype from vision-validator to determine domain-specific
 * source organizations. All output validates against ResearchReferenceSchema.
 *
 * @module vtm/research-compiler
 */

import type { VisionDocument, ResearchReference, ResearchTopic } from './types.js';
import { classifyArchetype, type Archetype } from './vision-validator.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Structured diagnostic for source quality issues. */
export interface SourceDiagnostic {
  severity: 'error' | 'warning';
  section: string;
  message: string;
  code: string;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Entertainment/media keywords to flag in source organizations. */
const ENTERTAINMENT_KEYWORDS = [
  'youtube',
  'reddit',
  'wikipedia',
  'tiktok',
  'blog',
];

/** Safety severity keywords that trigger 'gate' boundary type. */
const GATE_KEYWORDS = ['danger', 'hazard', 'lethal', 'fatal'];

/** Safety severity keywords that trigger 'annotate' boundary type. */
const ANNOTATE_KEYWORDS = ['caution', 'warning', 'risk'];

/** Source organizations by archetype. */
const ARCHETYPE_SOURCES: Record<Archetype, Array<{ name: string; description: string }>> = {
  'educational-pack': [
    { name: 'IEEE Education Society', description: 'Professional engineering education standards and research' },
    { name: 'ACM SIGCSE', description: 'Computing education research and curriculum development' },
    { name: 'National Science Foundation', description: 'Foundational research funding and educational standards' },
  ],
  'infrastructure-component': [
    { name: 'IEEE Computer Society', description: 'Computing standards and professional development' },
    { name: 'IETF', description: 'Internet engineering standards and protocol specifications' },
    { name: 'W3C', description: 'Web standards and interoperability specifications' },
  ],
  'organizational-system': [
    { name: 'PMI', description: 'Project management standards and organizational practices' },
    { name: 'ISO', description: 'International standards for quality management and processes' },
    { name: 'NIST', description: 'Standards and technology frameworks for organizational systems' },
  ],
  'creative-tool': [
    { name: 'ACM SIGGRAPH', description: 'Computer graphics and interactive techniques research' },
    { name: 'Interaction Design Foundation', description: 'User experience and interaction design research' },
    { name: 'W3C WAI', description: 'Web accessibility and inclusive design standards' },
  ],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Classify safety boundary type from safety concern text.
 *
 * - 'gate' for danger/hazard/lethal/fatal keywords
 * - 'annotate' for caution/warning/risk keywords
 * - 'annotate' as default when no severity keywords found
 */
function classifySafetyBoundary(text: string): 'gate' | 'annotate' | 'redirect' {
  const lower = text.toLowerCase();

  for (const keyword of GATE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'gate';
    }
  }

  for (const keyword of ANNOTATE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'annotate';
    }
  }

  return 'annotate';
}

/**
 * Build a research topic from a vision module.
 *
 * @param mod - The vision module to convert
 * @param allModuleNames - All module names in the document (for cross-references)
 */
function buildTopic(
  mod: { name: string; concepts: string[]; safetyConcerns?: string },
  allModuleNames: string[],
): ResearchTopic {
  const conceptList = mod.concepts.join(', ');

  const foundation = `Evidence-based foundation for ${mod.name}: covers ${conceptList}. ` +
    `This research area provides the theoretical and empirical grounding needed ` +
    `for implementing ${mod.name} content and interactions.`;

  const techniques = `Implementable techniques for ${mod.name}: derived from professional standards ` +
    `covering ${conceptList}. These techniques translate research foundations into ` +
    `concrete implementation patterns for mission agents.`;

  // Build safety concerns with boundary classification
  let safetyConcerns: ResearchTopic['safetyConcerns'];
  if (mod.safetyConcerns) {
    const boundaryType = classifySafetyBoundary(mod.safetyConcerns);
    safetyConcerns = [
      {
        condition: mod.safetyConcerns,
        recommendation: `Apply ${boundaryType} boundary for ${mod.name} safety concerns`,
        boundaryType,
      },
    ];
  }

  // Cross-references: all other module names
  const crossReferences = allModuleNames.filter(n => n !== mod.name);

  return {
    name: mod.name,
    foundation,
    techniques,
    ...(safetyConcerns ? { safetyConcerns } : {}),
    ...(crossReferences.length > 0 ? { crossReferences } : {}),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compile a VisionDocument into a structured ResearchReference.
 *
 * Transforms each vision module into a research topic with foundation,
 * techniques, safety concerns, and cross-references. Populates source
 * organizations based on archetype classification.
 *
 * @param visionDoc - Parsed VisionDocument object
 * @returns Fully valid ResearchReference object
 */
export function compileResearch(visionDoc: VisionDocument): ResearchReference {
  const archetype = classifyArchetype(visionDoc);
  const allModuleNames = visionDoc.modules.map(m => m.name);

  // Build topics: one per module, or a single general topic if no modules
  let topics: ResearchTopic[];
  if (visionDoc.modules.length === 0) {
    topics = [
      {
        name: visionDoc.name,
        foundation: `General research foundation for ${visionDoc.name}: ` +
          `${visionDoc.coreConcept.description}. This provides the theoretical ` +
          `grounding for the overall vision.`,
        techniques: `General implementation techniques for ${visionDoc.name}: ` +
          `derived from the core concept of ${visionDoc.coreConcept.interactionModel}. ` +
          `These techniques guide mission agent implementation.`,
      },
    ];
  } else {
    topics = visionDoc.modules.map(mod => buildTopic(mod, allModuleNames));
  }

  // Consolidate safety framework from modules that have safety concerns
  const modulesWithSafety = visionDoc.modules.filter(m => m.safetyConcerns);
  let sharedSafetyFramework: string | undefined;
  if (modulesWithSafety.length > 0) {
    const safetyItems = modulesWithSafety
      .map(m => `${m.name}: ${m.safetyConcerns}`)
      .join('; ');
    sharedSafetyFramework = `Consolidated safety framework across ${modulesWithSafety.length} ` +
      `module(s): ${safetyItems}. All safety-sensitive modules must apply appropriate ` +
      `boundary types (gate, annotate, or redirect) during mission execution.`;
  }

  // Generate purpose from vision and core concept
  const purpose = `Research reference compiled from "${visionDoc.name}" vision document. ` +
    `Provides evidence-based foundations and implementable techniques for ` +
    `${visionDoc.coreConcept.description}. ` +
    `Covers ${topics.length} research topic(s) derived from the vision modules.`;

  const howToUse = `Use this research reference as context during mission package assembly. ` +
    `Each topic provides foundation (theoretical basis) and techniques (implementation guidance) ` +
    `that mission agents should incorporate into their component specs. ` +
    `Source organizations listed are authoritative references for domain validation.`;

  return {
    name: `${visionDoc.name} -- Research Reference`,
    date: visionDoc.date,
    status: 'research-compilation',
    sourceDocument: visionDoc.name,
    purpose,
    howToUse,
    sourceOrganizations: ARCHETYPE_SOURCES[archetype],
    topics,
    integrationNotes: {
      ...(sharedSafetyFramework ? { sharedSafetyFramework } : {}),
      bibliography: {
        professional: [],
        clinical: [],
        technical: [],
        historical: [],
      },
    },
  };
}

/**
 * Check source quality of a ResearchReference.
 *
 * Validates that source organizations are professional/organizational
 * (not entertainment/media), that sources are not empty, and that
 * topics have non-empty foundation and techniques content.
 *
 * @param research - ResearchReference object to check
 * @returns Array of SourceDiagnostic for quality issues (empty = clean)
 */
export function checkSourceQuality(research: ResearchReference): SourceDiagnostic[] {
  const diagnostics: SourceDiagnostic[] = [];

  // Check for empty sources
  if (research.sourceOrganizations.length === 0) {
    diagnostics.push({
      severity: 'error',
      section: 'sourceOrganizations',
      message: 'Source organizations array is empty',
      code: 'EMPTY_SOURCES',
    });
  }

  // Check for entertainment/media sources
  for (const org of research.sourceOrganizations) {
    const nameLower = org.name.toLowerCase();
    const descLower = org.description.toLowerCase();
    for (const keyword of ENTERTAINMENT_KEYWORDS) {
      if (nameLower.includes(keyword) || descLower.includes(keyword)) {
        diagnostics.push({
          severity: 'warning',
          section: 'sourceOrganizations',
          message: `Source "${org.name}" appears to be entertainment/media (matched: ${keyword})`,
          code: 'SOURCE_ENTERTAINMENT',
        });
        break; // One diagnostic per organization
      }
    }
  }

  // Check topics for empty foundation and techniques
  for (const topic of research.topics) {
    if (!topic.foundation || topic.foundation.trim().length === 0) {
      diagnostics.push({
        severity: 'error',
        section: `topics.${topic.name}`,
        message: `Topic "${topic.name}" has empty foundation`,
        code: 'EMPTY_FOUNDATION',
      });
    }

    if (!topic.techniques || topic.techniques.trim().length === 0) {
      diagnostics.push({
        severity: 'error',
        section: `topics.${topic.name}`,
        message: `Topic "${topic.name}" has empty techniques`,
        code: 'EMPTY_TECHNIQUES',
      });
    }
  }

  return diagnostics;
}
