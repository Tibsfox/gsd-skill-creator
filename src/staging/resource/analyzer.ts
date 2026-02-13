/**
 * Vision document analyzer for the resource analysis pipeline.
 *
 * Extracts domain requirements, complexity signals, ambiguity markers,
 * and external dependencies from raw vision document text. Pure function
 * with no I/O -- deterministic output from input text.
 *
 * @module staging/resource/analyzer
 */

import type {
  VisionAnalysis,
  DomainRequirement,
  ComplexitySignal,
  ComplexityLevel,
  AmbiguityMarker,
  ExternalDependency,
  ExternalDepType,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Heading regex: lines starting with 1-6 # characters. */
const HEADING_RE = /^(#{1,6})\s+(.+)$/;

/** Patterns for complexity signal detection. */
const COMPLEXITY_PATTERNS: Array<{
  signal: string;
  patterns: RegExp[];
  level: ComplexityLevel;
}> = [
  {
    signal: 'multi-phase',
    patterns: [
      /phase\s*\d/i,
      /stage\s*\d/i,
      /step\s*\d/i,
      /multiple\s+(?:phases|stages|steps)/i,
      /sequential\s+(?:work|phases|stages)/i,
    ],
    level: 'medium',
  },
  {
    signal: 'external-integration',
    patterns: [
      /\bapi\b/i,
      /\bsdk\b/i,
      /third[- ]party/i,
      /webhook/i,
      /integrate\b/i,
      /integration\b/i,
      /external\s+service/i,
    ],
    level: 'medium',
  },
  {
    signal: 'novel-domain',
    patterns: [
      /no\s+established\s+pattern/i,
      /novel\s+approach/i,
      /first\s+time/i,
      /research\s+(phase|needed|required)/i,
      /explore\s+(?:new|and\s+research)/i,
      /uncharted/i,
      /no\s+(?:existing|known)\s+(?:patterns?|solutions?)/i,
    ],
    level: 'high',
  },
  {
    signal: 'cross-cutting',
    patterns: [
      /cross[- ]cutting/i,
      /(?:auth|logging|monitoring).*(?:span|across)/i,
      /(?:span|across).*(?:features|modules|services)/i,
    ],
    level: 'medium',
  },
  {
    signal: 'data-migration',
    patterns: [
      /data\s*migration/i,
      /schema\s*change/i,
      /data\s*transformation/i,
      /migrate\s+(?:data|database|schema)/i,
    ],
    level: 'high',
  },
  {
    signal: 'concurrent-access',
    patterns: [
      /concurren(?:t|cy)/i,
      /race\s+condition/i,
      /locking/i,
      /parallel\s+write/i,
      /mutex/i,
      /semaphore/i,
    ],
    level: 'high',
  },
];

/** Vague language tokens that indicate ambiguity. */
const VAGUE_TOKENS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bsomehow\b/i, reason: 'Vague language: "somehow" lacks specificity' },
  { pattern: /\bmaybe\b/i, reason: 'Uncertain language: "maybe" indicates unresolved decision' },
  { pattern: /\bTBD\b/, reason: 'Placeholder: "TBD" indicates missing detail' },
  { pattern: /\betc\.\b/i, reason: 'Open-ended: "etc." hides unspecified items' },
  { pattern: /\bvarious\b/i, reason: 'Vague quantifier: "various" is unspecific' },
  { pattern: /\bpossibly\b/i, reason: 'Uncertain language: "possibly" indicates unresolved decision' },
  { pattern: /\bmight\b/i, reason: 'Uncertain language: "might" indicates unresolved decision' },
  { pattern: /\bcould potentially\b/i, reason: 'Uncertain language: "could potentially" lacks commitment' },
];

/**
 * Known external dependencies mapped to their type.
 * Keys are lowercase for case-insensitive matching.
 */
const KNOWN_DEPS: Array<{ pattern: RegExp; name: string; type: ExternalDepType }> = [
  // Databases
  { pattern: /\bpostgresql\b/i, name: 'PostgreSQL', type: 'database' },
  { pattern: /\bpostgres\b/i, name: 'PostgreSQL', type: 'database' },
  { pattern: /\bmongodb\b/i, name: 'MongoDB', type: 'database' },
  { pattern: /\bredis\b/i, name: 'Redis', type: 'database' },
  { pattern: /\bmysql\b/i, name: 'MySQL', type: 'database' },
  { pattern: /\bsqlite\b/i, name: 'SQLite', type: 'database' },
  { pattern: /\bdynamodb\b/i, name: 'DynamoDB', type: 'database' },
  { pattern: /\bsupabase\b/i, name: 'Supabase', type: 'database' },

  // Services
  { pattern: /\baws\b/i, name: 'AWS', type: 'service' },
  { pattern: /\bgcp\b/i, name: 'GCP', type: 'service' },
  { pattern: /\bazure\b/i, name: 'Azure', type: 'service' },
  { pattern: /\bvercel\b/i, name: 'Vercel', type: 'service' },
  { pattern: /\bnetlify\b/i, name: 'Netlify', type: 'service' },
  { pattern: /\bheroku\b/i, name: 'Heroku', type: 'service' },
  { pattern: /\bdocker\b/i, name: 'Docker', type: 'tool' },
  { pattern: /\bkubernetes\b/i, name: 'Kubernetes', type: 'tool' },

  // APIs / Payment / Messaging
  { pattern: /\bstripe\b/i, name: 'Stripe', type: 'api' },
  { pattern: /\btwilio\b/i, name: 'Twilio', type: 'api' },
  { pattern: /\bsendgrid\b/i, name: 'SendGrid', type: 'api' },
  { pattern: /\bgithub\b(?:\s+api)?/i, name: 'GitHub', type: 'api' },
  { pattern: /\bgitlab\b/i, name: 'GitLab', type: 'api' },
  { pattern: /\bs3\b/i, name: 'AWS S3', type: 'service' },

  // Libraries / Frameworks
  { pattern: /\breact\b/i, name: 'React', type: 'library' },
  { pattern: /\bvue\b/i, name: 'Vue', type: 'library' },
  { pattern: /\bangular\b/i, name: 'Angular', type: 'library' },
  { pattern: /\bnext\.?js\b/i, name: 'Next.js', type: 'library' },
  { pattern: /\bexpress\b/i, name: 'Express', type: 'library' },
  { pattern: /\bfastify\b/i, name: 'Fastify', type: 'library' },
  { pattern: /\btailwind\b/i, name: 'Tailwind', type: 'library' },
  { pattern: /\bprisma\b/i, name: 'Prisma', type: 'library' },
];

/** Complexity level ordering for max calculation. */
const LEVEL_ORDER: Record<ComplexityLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/** Reverse mapping from numeric order to ComplexityLevel. */
const ORDER_TO_LEVEL: ComplexityLevel[] = ['low', 'medium', 'high', 'critical'];

// ============================================================================
// Section Parsing
// ============================================================================

interface Section {
  heading: string;
  content: string;
  lineOffset: number;
}

/**
 * Parse document into sections based on headings.
 * If no headings found, returns a single section with empty heading.
 */
function parseSections(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let currentHeading = '';
  let currentLines: string[] = [];
  let currentOffset = 1;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(HEADING_RE);
    if (match) {
      if (currentLines.length > 0 || currentHeading) {
        sections.push({
          heading: currentHeading,
          content: currentLines.join('\n').trim(),
          lineOffset: currentOffset,
        });
      }
      currentHeading = match[2].trim();
      currentLines = [];
      currentOffset = i + 2; // next line after heading (1-based)
    } else {
      currentLines.push(lines[i]);
    }
  }

  // Push final section
  if (currentLines.length > 0 || currentHeading) {
    sections.push({
      heading: currentHeading,
      content: currentLines.join('\n').trim(),
      lineOffset: currentOffset,
    });
  }

  // No headings at all: single section with full content
  if (sections.length === 0 && content.trim()) {
    sections.push({
      heading: '',
      content: content.trim(),
      lineOffset: 1,
    });
  }

  return sections;
}

// ============================================================================
// Requirement Extraction
// ============================================================================

/** Bullet point regex: lines starting with - or * or numbered list. */
const BULLET_RE = /^\s*(?:[-*]|\d+[.)]\s)/;

/**
 * Extract domain requirements from parsed sections.
 * Each bullet point under a heading becomes a requirement.
 */
function extractRequirements(sections: Section[]): DomainRequirement[] {
  const requirements: DomainRequirement[] = [];
  let reqCounter = 0;

  for (const section of sections) {
    if (!section.content) continue;

    const category = section.heading || 'general';
    const lines = section.content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Only extract bullet points or substantive statements
      const isBullet = BULLET_RE.test(trimmed);
      const isSubstantive = trimmed.length > 20;

      if (isBullet || (isSubstantive && !section.heading)) {
        const description = trimmed.replace(/^\s*(?:[-*]|\d+[.)]\s)\s*/, '');
        if (description.length < 10) continue;

        reqCounter++;
        const confidence = computeRequirementConfidence(description);
        requirements.push({
          id: `req-${String(reqCounter).padStart(3, '0')}`,
          description,
          category,
          confidence,
        });
      }
    }
  }

  return requirements;
}

/**
 * Compute confidence for a requirement based on specificity.
 * Detailed descriptions with measurable criteria score higher.
 */
function computeRequirementConfidence(description: string): number {
  let score = 0.5;

  // Longer descriptions tend to be more specific
  if (description.length > 50) score += 0.1;
  if (description.length > 100) score += 0.1;

  // Contains specific technical terms
  if (/\b(?:must|shall|will)\b/i.test(description)) score += 0.1;

  // Contains measurable criteria
  if (/\b\d+\b/.test(description)) score += 0.05;
  if (/\b(?:within|less than|at least|maximum|minimum)\b/i.test(description)) score += 0.1;

  // Vague terms reduce confidence
  if (/\b(?:somehow|maybe|TBD|various|possibly|might)\b/i.test(description)) score -= 0.2;

  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}

// ============================================================================
// Complexity Detection
// ============================================================================

/**
 * Detect complexity signals from document content.
 */
function detectComplexity(content: string): ComplexitySignal[] {
  const signals: ComplexitySignal[] = [];
  const contentLower = content.toLowerCase();

  for (const def of COMPLEXITY_PATTERNS) {
    for (const pattern of def.patterns) {
      const match = content.match(pattern);
      if (match) {
        // Find the line containing the match for evidence
        const matchIndex = content.indexOf(match[0]);
        const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
        const lineEnd = content.indexOf('\n', matchIndex);
        const evidenceLine = content.slice(
          lineStart,
          lineEnd === -1 ? undefined : lineEnd,
        ).trim();

        signals.push({
          signal: def.signal,
          level: def.level,
          evidence: evidenceLine,
        });
        break; // Only one match per signal type
      }
    }
  }

  // Escalate level if many signals
  if (signals.length >= 4) {
    for (const signal of signals) {
      if (LEVEL_ORDER[signal.level] < LEVEL_ORDER.high) {
        signal.level = 'high';
      }
    }
  }

  return signals;
}

// ============================================================================
// Ambiguity Detection
// ============================================================================

/**
 * Detect ambiguity markers in document content.
 */
function detectAmbiguities(sections: Section[]): AmbiguityMarker[] {
  const markers: AmbiguityMarker[] = [];

  for (const section of sections) {
    if (!section.content) continue;

    const location = section.heading
      ? `${section.heading} section`
      : `paragraph ${section.lineOffset}`;

    const lines = section.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check vague language tokens
      for (const token of VAGUE_TOKENS) {
        if (token.pattern.test(line)) {
          markers.push({
            text: line,
            reason: token.reason,
            location,
          });
          break; // One marker per line for vague tokens
        }
      }

      // Check for question marks in requirement-like statements
      if (BULLET_RE.test(line) && line.includes('?')) {
        markers.push({
          text: line,
          reason: 'Question in requirement: indicates unresolved decision',
          location,
        });
      }
    }

    // Check for vague requirements without measurable criteria
    const bullets = lines.filter((l) => BULLET_RE.test(l.trim()));
    for (const bullet of bullets) {
      const cleaned = bullet.trim().replace(/^\s*(?:[-*]|\d+[.)]\s)\s*/, '');
      if (
        cleaned.length > 0 &&
        cleaned.length < 40 &&
        !/\b\d+\b/.test(cleaned) &&
        !/\b(?:must|shall|will|should)\b/i.test(cleaned) &&
        !VAGUE_TOKENS.some((t) => t.pattern.test(cleaned))
      ) {
        // Short, non-specific bullet with no measurable criteria
        const isVague =
          /^(?:improve|better|enhance|good|fast|nice|clean|simple)\b/i.test(cleaned) ||
          /\b(?:improvement|enhancement|optimization)\b/i.test(cleaned);
        if (isVague) {
          markers.push({
            text: cleaned,
            reason: 'Requirement without measurable acceptance criteria',
            location,
          });
        }
      }
    }
  }

  return markers;
}

// ============================================================================
// Dependency Extraction
// ============================================================================

/**
 * Extract external dependencies from document content.
 */
function extractDependencies(content: string): ExternalDependency[] {
  const deps: ExternalDependency[] = [];
  const seen = new Set<string>();

  for (const known of KNOWN_DEPS) {
    if (known.pattern.test(content)) {
      // Deduplicate by normalized name
      const key = known.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      deps.push({
        name: known.name,
        type: known.type,
        confidence: 0.8,
      });
    }
  }

  // Generic "use X" / "integrate X" pattern for unknowns
  const usePatterns = [
    /\buse\s+([A-Z][a-zA-Z0-9.]+)\b/g,
    /\bintegrate\s+(?:with\s+)?([A-Z][a-zA-Z0-9.]+)\b/g,
    /([A-Z][a-zA-Z0-9.]+)\s+API\b/g,
    /([A-Z][a-zA-Z0-9.]+)\s+SDK\b/g,
  ];

  for (const pattern of usePatterns) {
    let match: RegExpExecArray | null;
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1];
      const key = name.toLowerCase();

      // Skip if already captured by known deps
      if (seen.has(key)) continue;

      // Skip common false positives
      if (/^(?:The|This|That|These|Those|It|We|Our|My|A|An)$/i.test(name)) continue;

      seen.add(key);
      deps.push({
        name,
        type: inferDepType(name, match[0]),
        confidence: 0.6,
      });
    }
  }

  return deps;
}

/**
 * Infer dependency type from name and context.
 */
function inferDepType(name: string, context: string): ExternalDepType {
  if (/API/i.test(context)) return 'api';
  if (/SDK/i.test(context)) return 'library';
  if (/\b(?:db|database|sql|store)\b/i.test(name)) return 'database';
  return 'library';
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate a 1-2 sentence summary of the vision scope.
 */
function generateSummary(
  sections: Section[],
  requirements: DomainRequirement[],
  complexity: ComplexitySignal[],
  content: string,
): string {
  if (!content.trim()) {
    return 'Empty vision document with no extractable requirements.';
  }

  const headings = sections
    .map((s) => s.heading)
    .filter(Boolean);

  const reqCount = requirements.length;
  const signalCount = complexity.length;

  if (headings.length > 0) {
    const topicList = headings.slice(0, 3).join(', ');
    const suffix = headings.length > 3 ? ` and ${headings.length - 3} more areas` : '';
    return `Vision covering ${topicList}${suffix} with ${reqCount} extracted requirement${reqCount !== 1 ? 's' : ''} and ${signalCount} complexity signal${signalCount !== 1 ? 's' : ''}.`;
  }

  if (reqCount > 0) {
    return `Vision document with ${reqCount} extracted requirement${reqCount !== 1 ? 's' : ''} and ${signalCount} complexity signal${signalCount !== 1 ? 's' : ''}.`;
  }

  // Minimal content
  const wordCount = content.trim().split(/\s+/).length;
  return `Brief vision document (${wordCount} word${wordCount !== 1 ? 's' : ''}) with minimal extractable structure.`;
}

// ============================================================================
// Main Analyzer
// ============================================================================

/**
 * Analyze a vision document to extract structured information.
 *
 * Takes raw document text and produces a VisionAnalysis result with:
 * - Domain requirements extracted from headings and bullet points
 * - Complexity signals detected via keyword/pattern matching
 * - Ambiguity markers for vague language and missing criteria
 * - External dependencies from known patterns and generic extraction
 * - Overall complexity level (max across all signals)
 * - Summary string describing the vision scope
 *
 * @param content - Raw vision document text
 * @returns Complete VisionAnalysis result
 */
export function analyzeVision(content: string): VisionAnalysis {
  const sections = parseSections(content);
  const requirements = extractRequirements(sections);
  const complexity = detectComplexity(content);
  const ambiguities = detectAmbiguities(sections);
  const dependencies = extractDependencies(content);

  // Overall complexity: max level across all signals
  let maxLevel = 0;
  for (const signal of complexity) {
    const level = LEVEL_ORDER[signal.level];
    if (level > maxLevel) maxLevel = level;
  }
  const overallComplexity = ORDER_TO_LEVEL[maxLevel];

  const summary = generateSummary(sections, requirements, complexity, content);

  return {
    requirements,
    complexity,
    ambiguities,
    dependencies,
    overallComplexity,
    summary,
  };
}
