/**
 * Vision document markdown parser and dependency extractor.
 *
 * Provides pure functions for parsing vision document markdown into typed
 * VisionDocument objects and extracting dependency lists. Uses regex-based
 * section extraction (not a full markdown AST parser) for simplicity.
 *
 * @module vtm/vision-parser
 */

import yaml from 'js-yaml';
import {
  VisionDocumentSchema,
  ChipsetConfigSchema,
  type VisionDocument,
  type VisionModule,
  type ChipsetConfig,
} from './types.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Structured parse error with section context. */
export interface ParseError {
  section: string;
  message: string;
}

/** Result type for parse operations: either typed data or structured errors. */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ParseError[] };

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, VisionDocument['status']> = {
  'initial vision': 'initial-vision',
  'pre-research': 'pre-research',
  'research complete': 'research-complete',
  'mission ready': 'mission-ready',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract metadata field from **Field:** Value lines in the header block.
 */
function extractMetaField(header: string, field: string): string | undefined {
  const re = new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`, 'i');
  const m = header.match(re);
  return m?.[1]?.trim();
}

/** A parsed section with its original header name and body content. */
interface Section {
  rawName: string;
  content: string;
}

/**
 * Split document into named sections by ## headers.
 * Returns a Map from section name (lowercase) to Section with original name preserved.
 */
function splitSections(markdown: string): Map<string, Section> {
  const sections = new Map<string, Section>();
  const parts = markdown.split(/^## /gm);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const newlineIdx = part.indexOf('\n');
    if (newlineIdx === -1) continue;

    const rawName = part.substring(0, newlineIdx).trim();
    let content = part.substring(newlineIdx + 1);

    // Strip trailing --- separator
    content = content.replace(/\n---\s*$/m, '').trim();

    // Normalize the section key for lookup, preserve raw name
    const key = rawName.toLowerCase();
    sections.set(key, { rawName, content });
  }

  return sections;
}

/**
 * Extract content of a YAML code block from a section.
 */
function extractYamlBlock(content: string): string | undefined {
  const m = content.match(/```ya?ml\n([\s\S]*?)```/);
  return m?.[1];
}

/**
 * Extract content of any code block from a section.
 */
function extractCodeBlock(content: string): string | undefined {
  const m = content.match(/```(?:\w*)\n([\s\S]*?)```/);
  return m?.[1]?.trim();
}

/**
 * Parse problem statement items from numbered list with **Name.** pattern.
 */
function parseProblemStatements(content: string): Array<{ name: string; description: string }> {
  const results: Array<{ name: string; description: string }> = [];
  const re = /\d+\.\s+\*\*(.+?)\.\*\*\s+(.+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    results.push({ name: m[1].trim(), description: m[2].trim() });
  }
  return results;
}

/**
 * Parse core concept section into interaction model, description, and diagram.
 */
function parseCoreConcept(content: string): {
  interactionModel: string;
  description: string;
  diagram?: string;
} {
  // First bold line is the interaction model
  const boldMatch = content.match(/\*\*(.+?)\*\*/);
  const interactionModel = boldMatch?.[1]?.trim() ?? '';

  // Extract diagram from code block
  const diagram = extractCodeBlock(content);

  // Description is the text after the bold line, excluding code blocks and sub-headers
  let description = content;
  // Remove the bold interaction model line
  description = description.replace(/\*\*(.+?)\*\*/, '').trim();
  // Remove code blocks
  description = description.replace(/```(?:\w*)\n[\s\S]*?```/g, '').trim();
  // Remove sub-headers (### ...)
  description = description.replace(/^###.+$/gm, '').trim();
  // Remove explanation text after code blocks (keep just body paragraphs)
  // Clean up multiple newlines
  description = description.replace(/\n{3,}/g, '\n\n').trim();

  return { interactionModel, description, diagram };
}

/**
 * Parse architecture section for module map and connections.
 */
function parseArchitecture(content: string): {
  moduleMap?: string;
  connections: Array<{ from: string; to: string; relationship: string }>;
} {
  const moduleMap = extractCodeBlock(content);
  const connections: Array<{ from: string; to: string; relationship: string }> = [];

  // Match "- [A] -> [B] -- [desc]" or "- A -> B -- desc" patterns
  const re = /^-\s+(.+?)\s+->(?:\s+|)(.+?)\s+--\s+(.+)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    connections.push({
      from: m[1].trim(),
      to: m[2].trim(),
      relationship: m[3].trim(),
    });
  }

  return { moduleMap, connections };
}

/**
 * Parse module sections from the document.
 * Finds all ## Module N: Name or similar headers.
 */
function parseModules(sections: Map<string, Section>): VisionModule[] {
  const modules: VisionModule[] = [];

  for (const [key, section] of sections) {
    // Match "module N: name" pattern (case insensitive via key being lowercase)
    const moduleMatch = key.match(/^module\s+\d+:\s*(.+)$/i);
    if (!moduleMatch) continue;

    // Use original rawName to preserve casing of the module name
    const rawModuleMatch = section.rawName.match(/^Module\s+\d+:\s*(.+)$/i);
    const name = rawModuleMatch?.[1]?.trim() ?? moduleMatch[1].trim();
    const content = section.content;

    // Extract concepts from bullet list items after "What the user learns/gets:"
    const concepts: string[] = [];
    const conceptSection = content.match(/\*\*What the user learns\/gets:\*\*\n((?:\s*-\s+.+\n?)+)/);
    if (conceptSection) {
      const bullets = conceptSection[1].matchAll(/^\s*-\s+(.+)$/gm);
      for (const b of bullets) {
        concepts.push(b[1].trim());
      }
    }

    // Extract try session from **Try Session:** "Name" -- Description
    let trySession: { name: string; description: string } | undefined;
    const tryMatch = content.match(/\*\*Try Session:\*\*\s+"([^"]+)"\s*(?:--|—)\s*(.+)/);
    if (tryMatch) {
      trySession = { name: tryMatch[1].trim(), description: tryMatch[2].trim() };
    }

    // Extract safety concerns
    let safetyConcerns: string | undefined;
    const safetyMatch = content.match(/\*\*Safety considerations:\*\*\s*(.+)/);
    if (safetyMatch) {
      safetyConcerns = safetyMatch[1].trim();
    }

    modules.push({ name, concepts, trySession, safetyConcerns });
  }

  return modules;
}

/**
 * Parse success criteria from numbered list.
 */
function parseSuccessCriteria(content: string): string[] {
  const results: string[] = [];
  const re = /^\d+\.\s+(.+)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

/**
 * Parse relationship table rows.
 */
function parseRelationships(content: string): Array<{ document: string; relationship: string }> {
  const results: Array<{ document: string; relationship: string }> = [];
  const rows = content.split('\n');

  for (const row of rows) {
    // Skip header row and separator row
    if (row.includes('Document') && row.includes('Relationship')) continue;
    if (/^\s*\|[\s-|]+\|\s*$/.test(row)) continue;

    const m = row.match(/\|\s*(.+?)\s*\|\s*(.+?)\s*\|/);
    if (m && m[1].trim() && m[2].trim()) {
      results.push({
        document: m[1].trim(),
        relationship: m[2].trim(),
      });
    }
  }

  return results;
}

/**
 * Find a section by searching for keys that contain the given substring.
 * Returns the section content string.
 */
function findSection(sections: Map<string, Section>, ...candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    for (const [key, section] of sections) {
      if (key.includes(candidate.toLowerCase())) {
        return section.content;
      }
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a vision document markdown string into a typed VisionDocument object.
 *
 * Uses regex-based section extraction to pull structured data from the
 * markdown format defined by vision-template.md. Validates the assembled
 * object against VisionDocumentSchema.
 *
 * @param markdown - Raw vision document markdown string
 * @returns ParseResult with typed VisionDocument on success, or ParseError[] on failure
 */
export function parseVisionDocument(markdown: string): ParseResult<VisionDocument> {
  const errors: ParseError[] = [];

  // ---- Extract header block (before first ---) ----
  const headerSplit = markdown.split(/\n---/);
  const headerBlock = headerSplit[0] ?? '';

  // ---- Extract H1 title ----
  const h1Match = headerBlock.match(/^#\s+(.+?)\s*(?:--|—)\s*Vision Guide/m);
  if (!h1Match) {
    errors.push({ section: 'header', message: 'Missing H1 header with "-- Vision Guide" format' });
  }
  const name = h1Match?.[1]?.trim() ?? '';

  // ---- Extract metadata fields ----
  const dateStr = extractMetaField(headerBlock, 'Date') ?? '';
  const statusStr = extractMetaField(headerBlock, 'Status') ?? '';
  const dependsOnStr = extractMetaField(headerBlock, 'Depends on') ?? '';
  const context = extractMetaField(headerBlock, 'Context') ?? '';

  // Map status
  const status = STATUS_MAP[statusStr.toLowerCase()] ?? 'initial-vision';

  // Parse dependsOn
  const dependsOn = dependsOnStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.toLowerCase() !== 'none');

  // ---- Split into sections ----
  const sections = splitSections(markdown);

  // ---- Extract vision ----
  const visionContent = findSection(sections, 'vision') ?? '';

  // ---- Extract problem statement ----
  const problemContent = findSection(sections, 'problem statement') ?? '';
  const problemStatement = parseProblemStatements(problemContent);

  // ---- Extract core concept ----
  const coreConceptContent = findSection(sections, 'core concept') ?? '';
  const coreConcept = parseCoreConcept(coreConceptContent);

  // ---- Extract architecture ----
  const architectureContent = findSection(sections, 'architecture') ?? '';
  const architecture = parseArchitecture(architectureContent);

  // ---- Extract modules ----
  const modules = parseModules(sections);

  // ---- Extract chipset config ----
  const chipsetContent = findSection(sections, 'skill-creator integration') ?? '';
  let chipsetConfig: ChipsetConfig | undefined;

  const yamlStr = extractYamlBlock(chipsetContent);
  if (yamlStr) {
    try {
      const parsed = yaml.load(yamlStr) as Record<string, unknown>;

      // Normalize pre_deploy -> preDeploy for Zod schema compatibility
      if (parsed?.evaluation && typeof parsed.evaluation === 'object') {
        const evalObj = parsed.evaluation as Record<string, unknown>;
        if (evalObj.gates && typeof evalObj.gates === 'object') {
          const gates = evalObj.gates as Record<string, unknown>;
          if (gates.pre_deploy && !gates.preDeploy) {
            gates.preDeploy = gates.pre_deploy;
            delete gates.pre_deploy;
          }
        }
      }

      // Normalize agents.topology from quoted string
      if (parsed?.agents && typeof parsed.agents === 'object') {
        const agentsObj = parsed.agents as Record<string, unknown>;
        if (typeof agentsObj.topology === 'string') {
          agentsObj.topology = agentsObj.topology.replace(/['"]/g, '');
        }
      }

      const chipsetResult = ChipsetConfigSchema.safeParse(parsed);
      if (chipsetResult.success) {
        chipsetConfig = chipsetResult.data;
      } else {
        for (const issue of chipsetResult.error.issues) {
          errors.push({
            section: 'chipsetConfig',
            message: `${issue.path.join('.')}: ${issue.message}`,
          });
        }
      }
    } catch (e) {
      errors.push({
        section: 'chipsetConfig',
        message: `YAML parse error: ${(e as Error).message}`,
      });
    }
  }

  // ---- Extract success criteria ----
  const successContent = findSection(sections, 'success criteria') ?? '';
  const successCriteria = parseSuccessCriteria(successContent);

  // ---- Extract relationships ----
  const relContent = findSection(sections, 'relationship to other vision documents');
  const relationships = relContent ? parseRelationships(relContent) : undefined;

  // ---- Extract through-line ----
  const throughLineContent = findSection(sections, 'the through-line') ?? '';

  // ---- Assemble the document object ----
  const doc = {
    name,
    date: dateStr,
    status,
    dependsOn,
    context,
    vision: visionContent,
    problemStatement,
    coreConcept,
    architecture,
    modules,
    chipsetConfig: chipsetConfig as ChipsetConfig,
    successCriteria,
    relationships,
    throughLine: throughLineContent,
  };

  // ---- Validate against schema ----
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const result = VisionDocumentSchema.safeParse(doc);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(issue => ({
        section: issue.path[0]?.toString() ?? 'unknown',
        message: `${issue.path.join('.')}: ${issue.message}`,
      })),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Extract dependency list from a vision document markdown string.
 *
 * Combines dependencies from two sources:
 * 1. **Depends on:** header field (comma-separated)
 * 2. Relationship table document column values
 *
 * Returns a deduplicated, sorted array of dependency names.
 *
 * @param markdown - Raw vision document markdown string
 * @returns Sorted, deduplicated array of dependency names
 */
export function extractDependencies(markdown: string): string[] {
  const deps = new Set<string>();

  // Source 1: **Depends on:** header field
  const headerSplit = markdown.split(/\n---/);
  const headerBlock = headerSplit[0] ?? '';
  const dependsOnStr = extractMetaField(headerBlock, 'Depends on') ?? '';

  for (const dep of dependsOnStr.split(',')) {
    const trimmed = dep.trim();
    if (trimmed.length > 0 && trimmed.toLowerCase() !== 'none') {
      deps.add(trimmed);
    }
  }

  // Source 2: Relationship table
  const sections = splitSections(markdown);
  const relContent = findSection(sections, 'relationship to other vision documents');
  if (relContent) {
    const relationships = parseRelationships(relContent);
    for (const rel of relationships) {
      if (rel.document.trim().length > 0) {
        deps.add(rel.document.trim());
      }
    }
  }

  return [...deps].sort();
}
