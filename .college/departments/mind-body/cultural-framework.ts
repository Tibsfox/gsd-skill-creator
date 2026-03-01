/**
 * Cultural Sensitivity Framework for the Mind-Body Department.
 *
 * Provides cultural attribution, terminology rendering, and content
 * balance checking for all mind-body content modules. Ensures that
 * traditions are properly credited, original terminology is preserved
 * with translations, and content neither mystifies nor trivializes
 * cultural practices.
 *
 * @module departments/mind-body/cultural-framework
 */

import type { CulturalContext, Tradition } from './types.js';

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Format a tradition credit string for attribution.
 *
 * Returns: "From [name] ([region], [period]): [description]"
 */
export function creditTradition(tradition: Tradition): string {
  return `From ${tradition.name} (${tradition.region}, ${tradition.period}): ${tradition.description}`;
}

/**
 * Render an original term with its translation.
 *
 * Returns: "[originalTerm] ([translation])" with optional context appended.
 */
export function renderTerminology(
  originalTerm: string,
  translation: string,
  context?: string,
): string {
  const base = `${originalTerm} (${translation})`;
  if (context) {
    return `${base} -- ${context}`;
  }
  return base;
}

// ─── Content Balance Checking ───────────────────────────────────────────────

/** Patterns that indicate mystification of cultural practices */
const MYSTIFICATION_PATTERNS: Array<{ pattern: RegExp; issue: string }> = [
  {
    pattern: /\benergy flow\b/i,
    issue: 'Uses "energy flow" without scientific or traditional context',
  },
  {
    pattern: /\bchakra\b(?!.*\b(?:tradition|yoga|Hindu|Sanskrit|concept)\b)/i,
    issue: 'References "chakra" without cultural context or tradition attribution',
  },
  {
    pattern: /\bspiritual power\b(?!.*\b(?:tradition|belief|practice|philosophy)\b)/i,
    issue: 'Makes unattributed spiritual claims',
  },
  {
    pattern: /\bmystical\b(?!.*\b(?:tradition|historical|described as)\b)/i,
    issue: 'Uses "mystical" framing without grounding',
  },
  {
    pattern: /\bancient secret\b/i,
    issue: 'Uses "ancient secret" framing which mystifies and misrepresents traditions',
  },
];

/** Patterns that indicate trivialization of cultural practices */
const TRIVIALIZATION_PATTERNS: Array<{ pattern: RegExp; issue: string }> = [
  {
    pattern: /\bjust exercise\b/i,
    issue: 'Reduces practice to "just exercise", ignoring cultural and philosophical dimensions',
  },
  {
    pattern: /\bjust stretching\b/i,
    issue: 'Reduces practice to "just stretching", ignoring deeper practice elements',
  },
  {
    pattern: /\bexotic\b/i,
    issue: 'Uses "exotic" framing which others cultural practices',
  },
  {
    pattern: /\boriental\b/i,
    issue: 'Uses outdated "oriental" terminology',
  },
];

/**
 * Check whether text maintains cultural balance.
 *
 * Scans for mystification patterns (excessive spiritualization without
 * context) and trivialization patterns (reducing practices to mere
 * physical exercise). Returns balanced: true if no issues found.
 */
export function checkCulturalBalance(text: string): {
  balanced: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  for (const { pattern, issue } of MYSTIFICATION_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(issue);
    }
  }

  for (const { pattern, issue } of TRIVIALIZATION_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(issue);
    }
  }

  return {
    balanced: issues.length === 0,
    issues,
  };
}

// ─── CulturalFramework Class ────────────────────────────────────────────────

/**
 * Registry of cultural traditions used across the Mind-Body department.
 *
 * Provides lookup by ID and iteration over all registered traditions.
 * Pre-populated with the core traditions referenced by department content.
 */
export class CulturalFramework {
  private traditions: Map<string, Tradition> = new Map();

  /** Register a tradition for lookup */
  register(tradition: Tradition): void {
    this.traditions.set(tradition.id, tradition);
  }

  /** Look up a tradition by ID */
  get(id: string): Tradition | undefined {
    return this.traditions.get(id);
  }

  /** Get all registered traditions */
  getAll(): Tradition[] {
    return Array.from(this.traditions.values());
  }

  /** Check if a tradition is registered */
  has(id: string): boolean {
    return this.traditions.has(id);
  }

  /** Get the count of registered traditions */
  get size(): number {
    return this.traditions.size;
  }
}

// ─── Core Traditions ────────────────────────────────────────────────────────

/** Pre-built framework with the core traditions used across the department */
export function createCoreTraditions(): CulturalFramework {
  const framework = new CulturalFramework();

  framework.register({
    id: 'vedic-yoga',
    name: 'Vedic/Yoga Tradition',
    region: 'Indian subcontinent',
    period: 'c. 1500 BCE -- present',
    description:
      'A comprehensive system of physical, mental, and spiritual practices originating ' +
      'in the Vedic tradition, codified in texts like the Yoga Sutras of Patanjali.',
    keyTexts: ['Yoga Sutras of Patanjali', 'Bhagavad Gita', 'Hatha Yoga Pradipika'],
    modernContext:
      'Modern yoga emphasizes asana (postures) and pranayama (breath control), ' +
      'though the tradition encompasses eight limbs of practice.',
  });

  framework.register({
    id: 'chan-zen',
    name: 'Chan/Zen Buddhism',
    region: 'China, Japan, Korea',
    period: 'c. 6th century CE -- present',
    description:
      'A school of Mahayana Buddhism emphasizing meditation (dhyana/chan/zen) and ' +
      'direct insight into one\'s true nature through practice rather than scripture study.',
    keyTexts: ['Heart Sutra', 'Platform Sutra', 'Shobogenzo'],
    modernContext:
      'Zen practice centers worldwide offer zazen (seated meditation) and ' +
      'mindfulness training adapted for contemporary life.',
  });

  framework.register({
    id: 'taoism',
    name: 'Taoism',
    region: 'China',
    period: 'c. 4th century BCE -- present',
    description:
      'A philosophical and spiritual tradition emphasizing harmony with the Tao (the Way), ' +
      'naturalness (wu wei), and the cultivation of vital energy (qi) through practices ' +
      'including tai chi and qigong.',
    keyTexts: ['Tao Te Ching', 'Zhuangzi', 'I Ching'],
    modernContext:
      'Taoist principles inform tai chi, qigong, traditional Chinese medicine, ' +
      'and mindfulness approaches emphasizing flow and non-resistance.',
  });

  framework.register({
    id: 'shaolin',
    name: 'Shaolin Tradition',
    region: 'China',
    period: 'c. 495 CE -- present',
    description:
      'A Buddhist monastic tradition combining Chan meditation with martial arts practice, ' +
      'originating at the Shaolin Monastery in Henan province.',
    keyTexts: ['Yijin Jing (Muscle/Tendon Change Classic)', 'Shaolin Wushu manuals'],
    modernContext:
      'Shaolin kung fu and qigong are practiced worldwide, combining physical ' +
      'conditioning with meditation and philosophical study.',
  });

  framework.register({
    id: 'bushido',
    name: 'Bushido',
    region: 'Japan',
    period: 'c. 12th century CE -- present',
    description:
      'The way of the warrior -- a code of conduct emphasizing honor, discipline, ' +
      'loyalty, and self-cultivation through martial practice.',
    keyTexts: ['Hagakure', 'The Book of Five Rings', 'Bushido: The Soul of Japan'],
    modernContext:
      'Bushido principles inform modern martial arts practice, emphasizing ' +
      'character development alongside technical skill.',
  });

  framework.register({
    id: 'pilates-method',
    name: 'Pilates Method',
    region: 'Germany, United States',
    period: 'Early 20th century -- present',
    description:
      'A system of physical conditioning developed by Joseph Pilates, emphasizing ' +
      'core strength (the "powerhouse"), controlled movement, breath coordination, ' +
      'and mind-body awareness.',
    keyTexts: ['Return to Life Through Contrology', 'Your Health'],
    modernContext:
      'Pilates is widely used in fitness, rehabilitation, and dance training, ' +
      'with both mat and apparatus-based methods.',
  });

  framework.register({
    id: 'modern-mindfulness',
    name: 'Modern Mindfulness',
    region: 'Global',
    period: 'Late 20th century -- present',
    description:
      'A secular adaptation of Buddhist mindfulness practices, developed primarily ' +
      'through the work of Jon Kabat-Zinn and the MBSR (Mindfulness-Based Stress ' +
      'Reduction) program, grounded in clinical research.',
    keyTexts: [
      'Full Catastrophe Living',
      'Wherever You Go, There You Are',
      'The Miracle of Mindfulness',
    ],
    modernContext:
      'Evidence-based mindfulness programs are integrated into healthcare, ' +
      'education, workplace wellness, and therapeutic settings.',
  });

  return framework;
}
