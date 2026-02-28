// === General Extractor ===
//
// Stage 4 (EXTRACT) of the sc:learn pipeline. Takes a DocumentAnalysis and
// produces candidate primitives conforming to the MathematicalPrimitive schema.
// Routes extraction strategy by content type.

import type {
  MathematicalPrimitive,
  PrimitiveType,
  DomainId,
  PlanePosition,
  DependencyEdge,
  CompositionRule,
} from '../../core/types/mfe-types.js';
import type { DocumentAnalysis, DocumentSection, ContentType } from './analyzer.js';

// === Public types ===

export interface CandidatePrimitive extends MathematicalPrimitive {
  sourceSection: string;   // Section title where this was extracted
  sourceOffset: number;    // Character offset in original document
  extractionConfidence: number; // 0.0-1.0 how confident the extraction is
}

export interface ExtractionResult {
  candidates: CandidatePrimitive[];
  contentType: ContentType;
  domain: string;
  totalSectionsProcessed: number;
  extractionMethod: string;  // Which heuristic was used
}

// === Extraction pattern interface ===

interface ExtractionMatch {
  name: string;
  type: PrimitiveType;
  formalStatement: string;
  section: string | null;
  confidence: number;
  offset: number;
}

// === Content-type-specific patterns ===

function extractTextbookMatches(content: string): ExtractionMatch[] {
  const matches: ExtractionMatch[] = [];

  // Definition pattern
  const defRegex = /(?:Definition|Def\.)\s*(?:(\d+(?:\.\d+)*))?[.:\s]+(.+?)(?=\n\n|\n(?:Definition|Def\.|Theorem|Thm\.|Proof|Lemma|Corollary|Algorithm|Identity)|$)/gis;
  let m: RegExpExecArray | null;
  while ((m = defRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[2]),
      type: 'definition',
      formalStatement: cleanStatement(m[2]),
      section: m[1] || null,
      confidence: 0.9,
      offset: m.index,
    });
  }

  // Theorem pattern
  const thmRegex = /(?:Theorem|Thm\.)\s*(?:(\d+(?:\.\d+)*))?(?:\s*\(([^)]+)\))?[.:\s]+(.+?)(?=\n\n|\n(?:Definition|Def\.|Theorem|Thm\.|Proof|Lemma)|$)/gis;
  while ((m = thmRegex.exec(content)) !== null) {
    const name = m[2] || extractConceptName(m[3]);
    matches.push({
      name,
      type: 'theorem',
      formalStatement: cleanStatement(m[3]),
      section: m[1] || null,
      confidence: 0.9,
      offset: m.index,
    });
  }

  // Algorithm pattern
  const algoRegex = /(?:Algorithm)\s*(?:(\d+(?:\.\d+)*))?[.:\s]+(.+?)(?=\n\n|\n(?:Algorithm|Definition|Theorem)|$)/gis;
  while ((m = algoRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[2]),
      type: 'algorithm',
      formalStatement: cleanStatement(m[2]),
      section: m[1] || null,
      confidence: 0.9,
      offset: m.index,
    });
  }

  // Identity pattern
  const idRegex = /(?:Identity)[.:\s]+(.+?)(?=\n\n|$)/gis;
  while ((m = idRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[1]),
      type: 'identity',
      formalStatement: cleanStatement(m[1]),
      section: null,
      confidence: 0.9,
      offset: m.index,
    });
  }

  return matches;
}

function extractTutorialMatches(content: string): ExtractionMatch[] {
  const matches: ExtractionMatch[] = [];
  let m: RegExpExecArray | null;

  // Step pattern
  const stepRegex = /(?:Step\s+(\d+))[.:\s]+(.+?)(?=\n\n|Step\s+\d+|$)/gis;
  while ((m = stepRegex.exec(content)) !== null) {
    matches.push({
      name: `Step ${m[1]}: ${extractConceptName(m[2])}`,
      type: 'technique',
      formalStatement: cleanStatement(m[2]),
      section: m[1],
      confidence: 0.9,
      offset: m.index,
    });
  }

  // Key Concept pattern
  const conceptRegex = /(?:Key Concept|Important|Note)[.:\s]+(.+?)(?=\n\n|$)/gis;
  while ((m = conceptRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[1]),
      type: 'definition',
      formalStatement: cleanStatement(m[1]),
      section: null,
      confidence: 0.8,
      offset: m.index,
    });
  }

  // Exercise pattern
  const exRegex = /(?:Exercise|Practice|Try|Challenge)[.:\s]+(.+?)(?=\n\n|$)/gis;
  while ((m = exRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[1]),
      type: 'technique',
      formalStatement: cleanStatement(m[1]),
      section: null,
      confidence: 0.7,
      offset: m.index,
    });
  }

  return matches;
}

function extractSpecMatches(content: string): ExtractionMatch[] {
  const matches: ExtractionMatch[] = [];
  let m: RegExpExecArray | null;

  // MUST/SHALL requirements -> axiom
  const reqRegex = /(?:MUST|SHALL)\s+(?:NOT\s+)?(.+?)(?:\.|$)/gim;
  while ((m = reqRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[1]),
      type: 'axiom',
      formalStatement: cleanStatement(m[0]),
      section: null,
      confidence: 0.9,
      offset: m.index,
    });
  }

  // Interface/Service definition
  const ifaceRegex = /(?:Interface|Service|Component)[.:\s]+(.+?)(?:\n|$)/gi;
  while ((m = ifaceRegex.exec(content)) !== null) {
    matches.push({
      name: m[1].trim(),
      type: 'definition',
      formalStatement: cleanStatement(m[0]),
      section: null,
      confidence: 0.8,
      offset: m.index,
    });
  }

  // Invariant/Constraint
  const invRegex = /(?:Invariant|Constraint|Precondition|Postcondition)[.:\s]+(.+?)(?=\n|$)/gi;
  while ((m = invRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[1]),
      type: 'axiom',
      formalStatement: cleanStatement(m[1]),
      section: null,
      confidence: 0.85,
      offset: m.index,
    });
  }

  return matches;
}

function extractPaperMatches(content: string): ExtractionMatch[] {
  const matches: ExtractionMatch[] = [];
  let m: RegExpExecArray | null;

  // Algorithm pattern
  const algoRegex = /(?:Algorithm\s+(\d+))[.:\s]+(.+?)(?=\n\n|Algorithm\s+\d+|$)/gis;
  while ((m = algoRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[2]),
      type: 'algorithm',
      formalStatement: cleanStatement(m[2]),
      section: m[1] || null,
      confidence: 0.9,
      offset: m.index,
    });
  }

  // Finding/Result -> theorem (empirical theorem)
  const findRegex = /(?:Finding|Result|Observation)[.:\s]*(?:(\d+))?[.:\s]+(.+?)(?=\n\n|$)/gis;
  while ((m = findRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[2]),
      type: 'theorem',
      formalStatement: cleanStatement(m[2]),
      section: m[1] || null,
      confidence: 0.8,
      offset: m.index,
    });
  }

  // Method/Technique
  const methRegex = /(?:Method|Approach|Technique)[.:\s]+(.+?)(?=\n\n|$)/gis;
  while ((m = methRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[1]),
      type: 'technique',
      formalStatement: cleanStatement(m[1]),
      section: null,
      confidence: 0.8,
      offset: m.index,
    });
  }

  // Hypothesis/Conjecture -> theorem
  const hypRegex = /(?:Hypothesis|Conjecture)[.:\s]*(?:(\d+))?[.:\s]+(.+?)(?=\n\n|$)/gis;
  while ((m = hypRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[2]),
      type: 'theorem',
      formalStatement: cleanStatement(m[2]),
      section: m[1] || null,
      confidence: 0.7,
      offset: m.index,
    });
  }

  return matches;
}

function extractReferenceMatches(content: string): ExtractionMatch[] {
  const matches: ExtractionMatch[] = [];
  let m: RegExpExecArray | null;

  // Function/method signature
  const fnRegex = /(?:function|method|def)\s+(\w+)\s*\(([^)]*)\)/gi;
  while ((m = fnRegex.exec(content)) !== null) {
    matches.push({
      name: m[1],
      type: 'definition',
      formalStatement: cleanStatement(m[0]),
      section: null,
      confidence: 0.85,
      offset: m.index,
    });
  }

  // Class/interface/type
  const classRegex = /(?:class|interface|type|struct)\s+(\w+)/gi;
  while ((m = classRegex.exec(content)) !== null) {
    matches.push({
      name: m[1],
      type: 'definition',
      formalStatement: `Defines ${m[1]}`,
      section: null,
      confidence: 0.8,
      offset: m.index,
    });
  }

  // Pattern/Design Pattern
  const patternRegex = /(?:Pattern|Design Pattern)[.:\s]+(\w[\w\s]*?)(?:\n|$)/gi;
  while ((m = patternRegex.exec(content)) !== null) {
    matches.push({
      name: m[1].trim(),
      type: 'technique',
      formalStatement: cleanStatement(m[0]),
      section: null,
      confidence: 0.8,
      offset: m.index,
    });
  }

  // Constraint/Rule
  const constRegex = /(?:Constraint|Rule)[.:\s]+(.+?)(?:\n|$)/gi;
  while ((m = constRegex.exec(content)) !== null) {
    matches.push({
      name: extractConceptName(m[1]),
      type: 'axiom',
      formalStatement: cleanStatement(m[1]),
      section: null,
      confidence: 0.8,
      offset: m.index,
    });
  }

  return matches;
}

// === Utility functions ===

function cleanStatement(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function extractConceptName(text: string): string {
  // Take first meaningful phrase (up to 60 chars, first sentence or clause)
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  return firstSentence.slice(0, 60);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function extractSectionKeywords(content: string): string[] {
  const tokens = content
    .toLowerCase()
    .split(/[\s,;:!?()\[\]{}"']+/)
    .filter(t => t.length >= 3);
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

function extractUniqueKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .split(/[\s,;:!?()\[\]{}"']+/)
    .filter(t => t.length >= 3);
  return [...new Set(tokens)];
}

// === Main extractor ===

/**
 * Extract candidate primitives from a document analysis.
 *
 * @param analysis - The document analysis from the analyzer
 * @param options - Optional: domain override, source ID prefix
 */
export function extractPrimitives(
  analysis: DocumentAnalysis,
  options?: { domain?: string; sourceId?: string },
): ExtractionResult {
  const domain = options?.domain || analysis.detectedDomain || 'learn';
  const sourceId = options?.sourceId || domain;
  const contentType = analysis.contentType;

  if (analysis.sections.length === 0) {
    return {
      candidates: [],
      contentType,
      domain,
      totalSectionsProcessed: 0,
      extractionMethod: 'none',
    };
  }

  const candidates: CandidatePrimitive[] = [];
  let totalSectionsProcessed = 0;
  const usedIds = new Set<string>();

  // Process all sections recursively
  function processSection(section: DocumentSection, chapterIndex: number, extractionIndex: { value: number }): void {
    totalSectionsProcessed++;

    // Get matches based on content type
    let matches: ExtractionMatch[];
    switch (contentType) {
      case 'textbook':
        matches = extractTextbookMatches(section.content);
        break;
      case 'tutorial':
        matches = extractTutorialMatches(section.content);
        break;
      case 'spec':
        matches = extractSpecMatches(section.content);
        break;
      case 'paper':
        matches = extractPaperMatches(section.content);
        break;
      case 'reference':
        matches = extractReferenceMatches(section.content);
        break;
      case 'unknown':
      default: {
        // Apply all strategies, take highest-confidence matches
        const all = [
          ...extractTextbookMatches(section.content),
          ...extractTutorialMatches(section.content),
          ...extractSpecMatches(section.content),
          ...extractPaperMatches(section.content),
          ...extractReferenceMatches(section.content),
        ];
        // Deduplicate by offset proximity (within 10 chars), keep highest confidence
        matches = deduplicateMatches(all);
        // Lower confidence for unknown type
        matches = matches.map(m => ({ ...m, confidence: Math.min(m.confidence, 0.4) }));
        break;
      }
    }

    // Convert matches to CandidatePrimitive
    for (const match of matches) {
      extractionIndex.value++;
      const sectionNum = match.section || `${chapterIndex}.${extractionIndex.value}`;

      let id = `${sourceId}-${slugify(match.name)}`;
      // Ensure uniqueness
      let suffix = 0;
      while (usedIds.has(id)) {
        suffix++;
        id = `${sourceId}-${slugify(match.name)}-${suffix}`;
      }
      usedIds.add(id);

      const applicabilityPatterns = extractSectionKeywords(section.content);
      const keywords = extractUniqueKeywords(match.formalStatement);

      const candidate: CandidatePrimitive = {
        id,
        name: toTitleCase(match.name),
        type: match.type,
        domain: domain as DomainId,
        chapter: chapterIndex,
        section: sectionNum,
        planePosition: { ...analysis.planePosition },
        formalStatement: match.formalStatement,
        computationalForm: deriveComputationalForm(match.formalStatement, match.type),
        prerequisites: [],
        dependencies: [] as DependencyEdge[],
        enables: [],
        compositionRules: [] as CompositionRule[],
        applicabilityPatterns,
        keywords,
        tags: [contentType, domain],
        buildLabs: [],
        sourceSection: section.title,
        sourceOffset: section.startIndex + match.offset,
        extractionConfidence: match.confidence,
      };

      candidates.push(candidate);
    }

    // Process children
    for (const child of section.children) {
      processSection(child, chapterIndex, extractionIndex);
    }
  }

  const extractionIndex = { value: 0 };
  for (let i = 0; i < analysis.sections.length; i++) {
    processSection(analysis.sections[i], i + 1, extractionIndex);
  }

  return {
    candidates,
    contentType,
    domain,
    totalSectionsProcessed,
    extractionMethod: contentType === 'unknown' ? 'all-strategies' : `${contentType}-heuristic`,
  };
}

// === Helpers ===

function deduplicateMatches(matches: ExtractionMatch[]): ExtractionMatch[] {
  const sorted = [...matches].sort((a, b) => b.confidence - a.confidence);
  const kept: ExtractionMatch[] = [];

  for (const match of sorted) {
    const isDuplicate = kept.some(k => Math.abs(k.offset - match.offset) < 10);
    if (!isDuplicate) {
      kept.push(match);
    }
  }

  return kept;
}

function toTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function deriveComputationalForm(formalStatement: string, type: PrimitiveType): string {
  switch (type) {
    case 'definition':
      return `Defines: ${formalStatement.split(/[.!?]/)[0].trim().slice(0, 100)}`;
    case 'theorem':
      return `Given preconditions, then: ${formalStatement.split(/[.!?]/)[0].trim().slice(0, 100)}`;
    case 'algorithm':
      return `Procedure: ${formalStatement.split(/[.!?]/)[0].trim().slice(0, 100)}`;
    case 'technique':
      return `Apply: ${formalStatement.split(/[.!?]/)[0].trim().slice(0, 100)}`;
    case 'axiom':
      return `Assert: ${formalStatement.split(/[.!?]/)[0].trim().slice(0, 100)}`;
    case 'identity':
      return formalStatement.trim().slice(0, 200);
    default:
      return '';
  }
}
