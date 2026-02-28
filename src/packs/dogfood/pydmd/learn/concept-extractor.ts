/**
 * Concept extractor: identifies mathematical foundations, algorithm variants,
 * and domain knowledge from Python source code and docstrings.
 *
 * Reads Python source files and produces structured Concept[] and
 * AlgorithmVariant[] records for the knowledge graph.
 */

import type { RepoManifest, AlgorithmVariant, Parameter } from '../types.js';

/** Extended Concept with fields beyond the base types.ts Concept. */
export interface ExtractedConcept {
  name: string;
  abbreviation: string;
  category: 'mathematical' | 'algorithmic' | 'domain';
  description: string;
  mathematicalFormulation: string | null;
  codeLocation: string[];
  relatedConcepts: string[];
  complexPlaneConnection: string | null;
}

interface SourceFile {
  path: string;
  content: string;
}

// --- Concept detection patterns ---

interface ConceptPattern {
  name: string;
  abbreviation: string;
  category: 'mathematical' | 'algorithmic' | 'domain';
  description: string;
  codePatterns: RegExp[];
  docPatterns: RegExp[];
  complexPlaneConnection: string | null;
  defaultRelated: string[];
}

const CONCEPT_PATTERNS: ConceptPattern[] = [
  {
    name: 'Singular Value Decomposition',
    abbreviation: 'SVD',
    category: 'mathematical',
    description:
      'Decomposes a data matrix X into orthogonal modes U, singular values Sigma, and time dynamics V*. Core factorization underlying all DMD variants.',
    codePatterns: [
      /np\.linalg\.svd/,
      /numpy\.linalg\.svd/,
      /scipy\.linalg\.svd/,
      /from\s+scipy\.linalg\s+import\s+svd/,
      /svd\s*\(/,
    ],
    docPatterns: [/singular\s+value\s+decomposition/i],
    complexPlaneConnection:
      'SVD provides the basis for computing DMD eigenvalues which lie on or near the unit circle in the complex plane, encoding stability (magnitude) and frequency (angle)',
    defaultRelated: ['Eigendecomposition', 'Rank Truncation'],
  },
  {
    name: 'Eigendecomposition',
    abbreviation: 'EIG',
    category: 'mathematical',
    description:
      'Decomposes a matrix into eigenvalues and eigenvectors, revealing the fundamental dynamic modes and their growth/decay/oscillation characteristics.',
    codePatterns: [
      /np\.linalg\.eig\b/,
      /numpy\.linalg\.eig\b/,
      /scipy\.linalg\.eig\b/,
    ],
    docPatterns: [/eigenvalue/i, /eigenvector/i, /eigendecomposition/i],
    complexPlaneConnection:
      'Eigenvalues from DMD analysis lie on or near the unit circle in the complex plane, encoding stability (magnitude) and frequency (angle)',
    defaultRelated: ['Singular Value Decomposition'],
  },
  {
    name: 'Koopman Operator Theory',
    abbreviation: 'KOT',
    category: 'mathematical',
    description:
      'Infinite-dimensional linear operator acting on observable functions of a nonlinear dynamical system, enabling linear analysis of nonlinear dynamics.',
    codePatterns: [],
    docPatterns: [/koopman\s+operator/i, /koopman/i, /observable\s+function/i, /lifting\s+function/i],
    complexPlaneConnection: null,
    defaultRelated: [],
  },
  {
    name: 'Rank Truncation',
    abbreviation: 'RT',
    category: 'algorithmic',
    description:
      'Reduces dimensionality by retaining only the most significant singular values, filtering noise and focusing on dominant dynamic modes.',
    codePatterns: [/svd_rank/, /truncat/i],
    docPatterns: [/rank\s+truncat/i, /truncat/i],
    complexPlaneConnection: null,
    defaultRelated: ['Singular Value Decomposition'],
  },
  {
    name: 'Time-Delay Embedding',
    abbreviation: 'TDE',
    category: 'algorithmic',
    description:
      'Augments the state space with time-delayed copies of the data via Hankel matrix construction, capturing temporal dependencies that standard DMD misses.',
    codePatterns: [/[Hh]ankel/, /time.delay/i],
    docPatterns: [/[Hh]ankel/, /time.delay\s+embed/i],
    complexPlaneConnection: null,
    defaultRelated: [],
  },
];

// --- Class/variant name mapping ---

const VARIANT_NAME_MAP: Record<string, string> = {
  DMDBase: 'DMD Base',
  DMD: 'Standard DMD',
  BOPDMD: 'BOP-DMD',
  MrDMD: 'Multi-Resolution DMD',
  DMDc: 'DMD with Control',
  EDMD: 'Extended DMD',
  CDMD: 'Compressed DMD',
  OptDMD: 'Optimized DMD',
  SpDMD: 'Sparsity-Promoting DMD',
  FbDMD: 'Forward-Backward DMD',
  HankelDMD: 'Hankel DMD',
  LANDO: 'LANDO',
  SubspaceDMD: 'Subspace DMD',
  HAVOK: 'HAVOK',
  RDMD: 'Randomized DMD',
  ParametricDMD: 'Parametric DMD',
  SPDMD: 'Streaming/Parallel DMD',
  PiDMD: 'Physics-Informed DMD',
};

// --- Helpers ---

function extractClassDocstring(content: string, className: string): string {
  // Match class definition then triple-quoted docstring
  const classPattern = new RegExp(
    `class\\s+${escapeRegExp(className)}\\b[^:]*:[\\s\\S]*?"""([\\s\\S]*?)"""`,
  );
  const match = content.match(classPattern);
  return match ? match[1].trim() : '';
}

function extractModuleDocstring(content: string): string {
  // Module-level docstring at the beginning
  const match = content.match(/^[\s]*"""([\s\S]*?)"""/);
  return match ? match[1].trim() : '';
}

function extractLatex(content: string): string | null {
  // Look for $...$ patterns (LaTeX inline math)
  const match = content.match(/\$[^$]+\$/);
  return match ? match[0] : null;
}

function extractTutorialNumber(docstring: string): number | null {
  // Match "Tutorial N", "tutorial_N", "tutorials/tutorial_N"
  const patterns = [
    /[Tt]utorial\s+(\d+)/,
    /tutorial_(\d+)/,
    /tutorials\/tutorial_?(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = docstring.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function extractDistinguishing(docstring: string): string[] {
  const features: string[] = [];

  // Work with sentences rather than lines to capture multi-line phrases
  const normalized = docstring.replace(/\n(?!\n)/g, ' ');
  const sentences = normalized.split(/(?<=\.)\s+/);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase().trim();
    // Look for phrases that distinguish this variant
    if (
      lower.includes('unlike') ||
      lower.includes('additionally') ||
      lower.includes('specifically') ||
      lower.includes('designed for')
    ) {
      features.push(sentence.trim().replace(/\.$/, ''));
    }
  }

  // If no distinguishing phrases found, extract key characteristics from first paragraph
  if (features.length === 0) {
    const firstParagraph = docstring.split('\n\n')[0].trim().replace(/\n/g, ' ');
    if (firstParagraph.length > 0) {
      features.push(firstParagraph.split('.')[0].trim());
    }
  }

  return features;
}

function extractMathBasis(docstring: string): string {
  // Look for "Mathematical basis:" or "math basis:" line
  const basisMatch = docstring.match(/[Mm]athematical\s+basis\s*:\s*(.+)/);
  if (basisMatch) return basisMatch[1].trim();

  // Normalize line breaks within paragraphs for sentence splitting
  const normalized = docstring.replace(/\n(?!\n)/g, ' ');
  const sentences = normalized.split(/(?<=\.)\s+/);

  // Priority 1: sentences with high-specificity math terms
  const highPriority = ['koopman', 'svd', 'eigenvalue', 'optimization', 'bagging'];
  for (const s of sentences) {
    const lower = s.toLowerCase();
    if (highPriority.some(term => lower.includes(term))) {
      return s.trim().replace(/\.$/, '');
    }
  }

  // Priority 2: sentences with lower-specificity math terms
  for (const s of sentences) {
    const lower = s.toLowerCase();
    if (lower.includes('decomposition') || lower.includes('matrix') || lower.includes('linear')) {
      return s.trim().replace(/\.$/, '');
    }
  }

  return 'DMD-based decomposition';
}

function extractConstructorParams(content: string, className: string): Parameter[] {
  // Find __init__ method and extract parameters
  const classBlock = extractClassBlock(content, className);
  if (!classBlock) return [];

  const initMatch = classBlock.match(
    /def\s+__init__\s*\(\s*self\s*,?\s*([^)]*)\)/,
  );
  if (!initMatch) return [];

  const paramStr = initMatch[1].trim();
  if (!paramStr) return [];

  const params: Parameter[] = [];
  // Split by comma, handling nested structures simply
  const parts = paramStr.split(',').map(p => p.trim()).filter(p => p.length > 0);

  for (const part of parts) {
    // Skip self, svd_rank (base class), **kwargs, *args
    if (part === 'self' || part.startsWith('*') || part.startsWith('svd_rank')) continue;

    const [nameDefault] = [part];
    const eqIdx = nameDefault.indexOf('=');
    const name = eqIdx >= 0 ? nameDefault.slice(0, eqIdx).trim() : nameDefault.trim();
    const defaultVal = eqIdx >= 0 ? nameDefault.slice(eqIdx + 1).trim() : null;

    // Infer type from default value
    let type = 'Any';
    if (defaultVal !== null) {
      if (defaultVal === 'None') type = 'Optional';
      else if (defaultVal === 'True' || defaultVal === 'False') type = 'bool';
      else if (/^-?\d+$/.test(defaultVal)) type = 'int';
      else if (/^-?\d+\.\d+$/.test(defaultVal)) type = 'float';
      else if (defaultVal.startsWith("'") || defaultVal.startsWith('"')) type = 'str';
    }

    params.push({
      name,
      type,
      default: defaultVal,
      description: `Parameter ${name}`,
    });
  }

  return params;
}

function extractClassBlock(content: string, className: string): string | null {
  const pattern = new RegExp(`^class\\s+${escapeRegExp(className)}\\b`, 'm');
  const match = content.match(pattern);
  if (!match || match.index === undefined) return null;

  const start = match.index;
  const lines = content.slice(start).split('\n');

  // Collect lines until we hit another top-level class or end of file
  const block: string[] = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    if (/^class\s+\w+/.test(lines[i])) break;
    block.push(lines[i]);
  }

  return block.join('\n');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractPurpose(docstring: string): string {
  // First paragraph of the docstring
  const paragraphs = docstring.split('\n\n');
  return paragraphs[0].trim().replace(/\n/g, ' ');
}

function extractClasses(content: string): string[] {
  const classNames: string[] = [];
  const matches = content.matchAll(/^class\s+(\w+)\s*\(/gm);
  for (const m of matches) {
    classNames.push(m[1]);
  }
  return classNames;
}

function isBaseClass(className: string): boolean {
  return className === 'DMDBase' || className.endsWith('Base');
}

// --- Main extraction ---

export function extractConcepts(
  sources: SourceFile[],
  _manifest: RepoManifest,
): { concepts: ExtractedConcept[]; variants: AlgorithmVariant[] } {
  // Phase 1: Detect concepts across all sources
  const conceptMap = new Map<string, ExtractedConcept>();

  for (const source of sources) {
    const fullText = source.content;
    const moduleDoc = extractModuleDocstring(fullText);
    const combinedText = fullText + ' ' + moduleDoc;

    for (const pattern of CONCEPT_PATTERNS) {
      const codeMatch = pattern.codePatterns.some(re => re.test(fullText));
      const docMatch = pattern.docPatterns.some(re => re.test(combinedText));

      if (codeMatch || docMatch) {
        const existing = conceptMap.get(pattern.name);
        if (existing) {
          // Merge: add to codeLocation
          if (!existing.codeLocation.includes(source.path)) {
            existing.codeLocation.push(source.path);
          }
          // Try to extract LaTeX from this source if not already present
          if (existing.mathematicalFormulation === null) {
            existing.mathematicalFormulation = extractLatex(combinedText);
          }
        } else {
          conceptMap.set(pattern.name, {
            name: pattern.name,
            abbreviation: pattern.abbreviation,
            category: pattern.category,
            description: pattern.description,
            mathematicalFormulation: extractLatex(combinedText),
            codeLocation: [source.path],
            relatedConcepts: [...pattern.defaultRelated],
            complexPlaneConnection: pattern.complexPlaneConnection,
          });
        }
      }
    }
  }

  // Phase 2: Extract algorithm variants from classes
  const variants: AlgorithmVariant[] = [];

  for (const source of sources) {
    const classNames = extractClasses(source.content);

    for (const className of classNames) {
      if (isBaseClass(className)) continue;

      const docstring = extractClassDocstring(source.content, className);
      if (!docstring) continue;

      const humanName = VARIANT_NAME_MAP[className] ?? className;
      const purpose = extractPurpose(docstring);
      const distinguishing = extractDistinguishing(docstring);
      const mathBasis = extractMathBasis(docstring);
      const tutorial = extractTutorialNumber(docstring);
      const parameters = extractConstructorParams(source.content, className);

      variants.push({
        name: humanName,
        class: className,
        purpose,
        distinguishing,
        parameters,
        mathBasis,
        tutorial,
      });
    }
  }

  // Phase 3: Cross-link concepts and variants
  for (const variant of variants) {
    const variantDocAndBasis = (variant.purpose + ' ' + variant.mathBasis).toLowerCase();

    // Also look at the full class docstring from the source for richer matching
    let variantFullDoc = variantDocAndBasis;
    for (const source of sources) {
      const classDoc = extractClassDocstring(source.content, variant.class);
      if (classDoc) {
        variantFullDoc += ' ' + classDoc.toLowerCase();
      }
    }

    for (const [conceptName, concept] of conceptMap) {
      // Check if the variant references this concept by full name, abbreviation, or key words
      const conceptLower = conceptName.toLowerCase();
      const abbrevLower = concept.abbreviation.toLowerCase();
      // Extract individual significant words from concept name (>= 4 chars)
      const conceptKeywords = conceptName
        .split(/\s+/)
        .filter(w => w.length >= 4)
        .map(w => w.toLowerCase());

      if (
        variantFullDoc.includes(conceptLower) ||
        variantFullDoc.includes(abbrevLower) ||
        conceptKeywords.some(kw => variantFullDoc.includes(kw))
      ) {
        if (!concept.relatedConcepts.includes(variant.class)) {
          concept.relatedConcepts.push(variant.class);
        }
      }
    }
  }

  // Add bidirectional links between concepts that co-occur in the same file
  const conceptsByFile = new Map<string, string[]>();
  for (const [name, concept] of conceptMap) {
    for (const loc of concept.codeLocation) {
      const existing = conceptsByFile.get(loc) ?? [];
      existing.push(name);
      conceptsByFile.set(loc, existing);
    }
  }

  for (const [_file, conceptNames] of conceptsByFile) {
    for (const a of conceptNames) {
      for (const b of conceptNames) {
        if (a === b) continue;
        const conceptA = conceptMap.get(a)!;
        if (!conceptA.relatedConcepts.includes(b)) {
          conceptA.relatedConcepts.push(b);
        }
      }
    }
  }

  const concepts = Array.from(conceptMap.values());

  return { concepts, variants };
}
