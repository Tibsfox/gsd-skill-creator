/**
 * Evidence citation system for the Physical Safety Warden.
 *
 * All health claims in the Mind-Body department must carry citations
 * matching peer-reviewed evidence scope. This module provides the
 * evidence database, citation validation, and overclaim detection.
 *
 * Sources are drawn from the teaching reference document:
 * - VA Whole Health Library
 * - Cleveland Clinic
 * - Harvard Medical School / Osher Center
 * - UMass Center for Mindfulness
 * - European Respiratory Society
 * - Pilates Method Alliance
 * - iRest Institute
 * - PubMed / PMC clinical trials
 *
 * @module departments/mind-body/safety/evidence-citations
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** A single evidence citation grounding a health claim. */
export interface EvidenceCitation {
  /** Source organization, journal, or researcher */
  source: string;

  /** Year of publication or most recent review */
  year: number;

  /** What the evidence actually found */
  finding: string;

  /** Precise scope of what the evidence supports */
  scope: string;

  /** Limitations, caveats, or conditions on the finding */
  caveat: string;
}

/** Claim categories mapping to the 8 wings of the Mind-Body department. */
export type ClaimCategory =
  | 'meditation-brain'
  | 'meditation-stress'
  | 'tai-chi-balance'
  | 'tai-chi-fall-prevention'
  | 'yoga-flexibility'
  | 'pilates-core'
  | 'pmr-relaxation'
  | 'breathwork-anxiety';

/** Result of validating a claim against the evidence database. */
export interface ClaimValidation {
  /** Whether the claim is supported by the evidence */
  supported: boolean;

  /** The matching citation, if found */
  citation?: EvidenceCitation;

  /** Whether the claim goes beyond what the cited evidence supports */
  overclaimed: boolean;
}

// ─── Evidence Database ──────────────────────────────────────────────────────

export const evidenceDatabase: Map<ClaimCategory, EvidenceCitation[]> = new Map([
  [
    'meditation-brain',
    [
      {
        source: 'Harvard Medical School / Massachusetts General Hospital',
        year: 2011,
        finding:
          'Eight weeks of MBSR produced measurable increases in gray matter density in brain regions associated with learning, memory, and emotional regulation',
        scope:
          'Structural brain changes observed via MRI after 8-week MBSR program in healthy adults',
        caveat:
          'Study involved committed practitioners completing the full MBSR program; casual or brief meditation may not produce the same structural changes',
      },
      {
        source: 'Neuroscientist Amishi Jha / U.S. Marine Corps study',
        year: 2015,
        finding:
          'MBSR training before deployment improved memory, task performance, decision-making under stress, and reduced PTSD incidence',
        scope:
          'Military personnel completing structured MBSR before combat deployment',
        caveat:
          'Results specific to intensive pre-deployment training in a military context; civilian generalizability requires further study',
      },
    ],
  ],
  [
    'meditation-stress',
    [
      {
        source: 'UMass Center for Mindfulness / MBSR clinical data',
        year: 2021,
        finding:
          'Regular mindfulness meditation practice reduces cortisol levels and improves sustained attention after 8 weeks of practice',
        scope:
          'Cortisol reduction and attention improvements in structured 8-week MBSR programs',
        caveat:
          'Benefits correlate with consistent daily practice (45-60 minutes, 6 days/week); intermittent practice shows smaller effects',
      },
      {
        source: 'Brown University Mindfulness Center',
        year: 2020,
        finding:
          'MBSR is classified as an educational intervention with strong evidence for stress reduction in clinical and non-clinical populations',
        scope:
          'Stress reduction in adults completing the standardized 8-week MBSR curriculum',
        caveat:
          'MBSR is an educational intervention, not psychotherapy; it is not a substitute for clinical treatment of mental health conditions',
      },
    ],
  ],
  [
    'tai-chi-balance',
    [
      {
        source: 'Harvard Medical School / Dr. Peter Wayne, Osher Center',
        year: 2023,
        finding:
          'Tai chi improves balance through synergistic "eight active ingredients": awareness, intention, structural integration, active relaxation, strengthening, natural breathing, social support, and meditative component',
        scope:
          'Balance improvement in adults practicing tai chi regularly, across multiple clinical trials',
        caveat:
          'Benefits emerge from the combination of all ingredients, not from any single component; simplified forms may not engage all eight ingredients equally',
      },
    ],
  ],
  [
    'tai-chi-fall-prevention',
    [
      {
        source: 'Canadian Family Physician / comprehensive review (PMC 9844554)',
        year: 2023,
        finding:
          'Excellent evidence that tai chi prevents falls in older adults, based on 500+ trials and 120+ systematic reviews over 45 years',
        scope:
          'Fall prevention in community-dwelling older adults practicing tai chi regularly',
        caveat:
          'Most evidence involves group-based programs with qualified instructors; self-directed practice from written instructions alone has less evidence',
      },
      {
        source: 'Harvard Science of Tai Chi & Qigong Conference white paper',
        year: 2023,
        finding:
          'Fall prevention results from improved muscular strength, better proprioception, improved posture, and enhanced confidence simultaneously',
        scope:
          'Multi-mechanism fall prevention in older adults through regular tai chi practice',
        caveat:
          'Conference findings are summary-level; individual mechanisms vary in strength of evidence',
      },
    ],
  ],
  [
    'yoga-flexibility',
    [
      {
        source: 'Yoga Alliance / systematic reviews',
        year: 2022,
        finding:
          'Regular yoga practice improves flexibility, particularly in hamstrings, hips, and spine, across diverse adult populations',
        scope:
          'Flexibility improvements with consistent practice (2-3 sessions per week) over 8+ weeks',
        caveat:
          'Flexibility gains are gradual and vary significantly by individual; overstretching without proper warm-up increases injury risk',
      },
    ],
  ],
  [
    'pilates-core',
    [
      {
        source: 'Pilates Method Alliance / National Pilates Certification Program',
        year: 2022,
        finding:
          'Pilates strengthens the deep stabilizing muscles of the core (transversus abdominis, pelvic floor, multifidus) through precise, controlled movement',
        scope:
          'Core stabilization and strength in adults practicing mat-based Pilates 2-3 times per week',
        caveat:
          'Proper form is essential; incorrect technique can reinforce poor movement patterns. Instructor guidance recommended for beginners',
      },
    ],
  ],
  [
    'pmr-relaxation',
    [
      {
        source: 'VA Whole Health Library / American Academy of Sleep Medicine',
        year: 2021,
        finding:
          'Progressive Muscle Relaxation effectively reduces physiological tension, improves sleep quality, and reduces anxiety symptoms',
        scope:
          'Relaxation response in adults practicing the standardized Bernstein & Borkovec PMR protocol',
        caveat:
          'Some individuals with chronic pain conditions may find the tension phase uncomfortable; for these individuals, body scan without active tensing may be preferable',
      },
    ],
  ],
  [
    'breathwork-anxiety',
    [
      {
        source: 'European Respiratory Society clinical practice guideline',
        year: 2024,
        finding:
          'Breathing techniques (diaphragmatic, pursed-lip, yoga breathing) improve quality of life with very low likelihood of adverse effects',
        scope:
          'Quality of life improvement in COPD and asthma patients; anxiety reduction in general populations through diaphragmatic breathing',
        caveat:
          'Primary evidence base is respiratory conditions; anxiety applications draw on mechanistic extrapolation (vagal tone, HRV) with growing but less extensive trial data',
      },
      {
        source: 'Clinical research (Indonesia/Malaysia)',
        year: 2023,
        finding:
          'Twice-daily box breathing for one month produced statistically significant sleep improvements in elderly participants',
        scope:
          'Sleep quality improvement in elderly participants with a structured box breathing protocol',
        caveat:
          'Small study population; larger replications needed; specific to elderly participants and may not generalize to all age groups',
      },
    ],
  ],
]);

// ─── Claim Patterns ─────────────────────────────────────────────────────────

/**
 * Overclaim patterns that indicate a statement goes beyond evidence scope.
 * These trigger overclaimed: true in validation results.
 */
const OVERCLAIM_PATTERNS: RegExp[] = [
  /\bcures?\b/i,
  /\beliminate[sd]?\b/i,
  /\bguarantee[sd]?\b/i,
  /\balways\b.*\b(?:work|help|cure|fix|solve)\b/i,
  /\breplaces?\s+(?:medication|therapy|treatment|medicine)\b/i,
  /\bno\s+need\s+for\s+(?:medication|therapy|treatment|doctor)\b/i,
  /\bscientifically\s+proven\s+to\s+cure\b/i,
  /\b100\s*%\s*effective\b/i,
];

/**
 * Keyword mappings from claim text to evidence categories.
 * Used to find the relevant category for a given claim.
 */
const CATEGORY_KEYWORDS: Map<ClaimCategory, string[]> = new Map([
  ['meditation-brain', ['meditation', 'brain', 'gray matter', 'neuroplasticity', 'mbsr brain']],
  ['meditation-stress', ['meditation', 'cortisol', 'stress', 'mindfulness stress', 'attention']],
  ['tai-chi-balance', ['tai chi', 'balance', 'tai chi balance', 'equilibrium']],
  ['tai-chi-fall-prevention', ['tai chi', 'fall', 'falls', 'fall prevention', 'older adults']],
  ['yoga-flexibility', ['yoga', 'flexibility', 'flexible', 'stretch', 'range of motion']],
  ['pilates-core', ['pilates', 'core', 'core strength', 'stabilization']],
  ['pmr-relaxation', ['progressive muscle', 'pmr', 'muscle relaxation', 'tension release']],
  ['breathwork-anxiety', ['breathing', 'breathwork', 'breath', 'anxiety', 'diaphragmatic']],
]);

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Validate a health claim against the evidence database.
 *
 * @param claim - The health claim text to validate
 * @param category - The evidence category to check against
 * @returns Validation result with support status, citation, and overclaim flag
 */
export function validateClaim(
  claim: string,
  category: string,
): ClaimValidation {
  // Check for overclaiming first
  const isOverclaimed = OVERCLAIM_PATTERNS.some((pattern) => pattern.test(claim));

  // Look up citations for the category
  const citations = evidenceDatabase.get(category as ClaimCategory);

  if (!citations || citations.length === 0) {
    return { supported: false, overclaimed: isOverclaimed };
  }

  // If overclaimed, it is by definition not properly supported
  if (isOverclaimed) {
    return { supported: false, citation: citations[0], overclaimed: true };
  }

  // Check if the claim aligns with any citation's scope
  const lowerClaim = claim.toLowerCase();
  const matchingCitation = citations.find((cit) => {
    const scopeWords = cit.scope.toLowerCase().split(/\s+/);
    const findingWords = cit.finding.toLowerCase().split(/\s+/);
    const allWords = [...scopeWords, ...findingWords];

    // Simple keyword overlap: claim must share meaningful terms with the evidence
    const claimWords = lowerClaim.split(/\s+/).filter((w) => w.length > 3);
    const overlap = claimWords.filter((w) => allWords.some((aw) => aw.includes(w) || w.includes(aw)));
    return overlap.length >= 2;
  });

  if (matchingCitation) {
    return { supported: true, citation: matchingCitation, overclaimed: false };
  }

  // No matching citation found
  return { supported: false, overclaimed: false };
}

/**
 * Find the most likely evidence category for a claim based on keywords.
 *
 * @param claim - The claim text to categorize
 * @returns The best-matching category, or undefined if no match
 */
export function findClaimCategory(claim: string): ClaimCategory | undefined {
  const lowerClaim = claim.toLowerCase();

  let bestCategory: ClaimCategory | undefined;
  let bestScore = 0;

  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    const score = keywords.filter((kw) => lowerClaim.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore > 0 ? bestCategory : undefined;
}
