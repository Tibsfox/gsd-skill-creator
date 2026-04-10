/**
 * Hybrid Scoring — post-retrieval re-ranking heuristics.
 *
 * Ported from mempalace's hybrid_v4 implementation (longmemeval_bench.py).
 * These pure-function heuristics turn a 96.6% raw embedding recall into
 * 98.4% on LongMemEval — with zero LLM calls.
 *
 * Five scoring signals:
 *   1. Keyword overlap — query terms found in document
 *   2. Temporal proximity — "2 weeks ago" → boost documents near that date
 *   3. Person name boost — capitalized proper nouns in query → boost matches
 *   4. Quoted phrase boost — 'exact phrases' in query → strong boost for matches
 *   5. Preference extraction — user preference/concern patterns from content
 *
 * All signals fuse into a single adjusted distance score:
 *   fused_distance = raw_distance * (1 - weight * signal)
 *
 * Lower fused_distance = more relevant.
 *
 * @module memory/hybrid-scorer
 */

// ─── Stop Words ──────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'what', 'when', 'where', 'who', 'how', 'which', 'did', 'do', 'was', 'were',
  'have', 'has', 'had', 'is', 'are', 'the', 'a', 'an', 'my', 'me', 'i', 'you',
  'your', 'their', 'it', 'its', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'ago', 'last', 'that', 'this', 'there', 'about', 'get', 'got',
  'give', 'gave', 'buy', 'bought', 'made', 'make', 'and', 'but', 'or', 'not',
  'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'been',
]);

/** Words that look capitalized but aren't person names. */
const NOT_NAMES = new Set([
  'What', 'When', 'Where', 'Who', 'How', 'Which', 'Did', 'Do', 'Was', 'Were',
  'Have', 'Has', 'Had', 'Is', 'Are', 'The', 'My', 'Our', 'Their', 'Can',
  'Could', 'Would', 'Should', 'Will', 'Shall', 'May', 'Might', 'Monday',
  'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'June', 'July', 'August',
  'September', 'October', 'November', 'December', 'In', 'On', 'At', 'For',
  'To', 'Of', 'With', 'By', 'From', 'And', 'But', 'I', 'It', 'Its', 'This',
  'That', 'These', 'Those', 'Previously', 'Recently', 'Also', 'Just', 'Very',
  'More', 'Some', 'Any', 'All', 'Each', 'Every', 'No', 'Not', 'So', 'If',
  'Then', 'Now', 'Here', 'There',
]);

// ─── Extraction Functions ────────────────────────────────────────────────────

/**
 * Extract keywords from text (lowercase, 3+ chars, no stop words).
 */
export function extractKeywords(text: string): string[] {
  const matches = text.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? [];
  return matches.filter(w => !STOP_WORDS.has(w));
}

/**
 * Score keyword overlap between query keywords and a document.
 * @returns 0.0 to 1.0 — fraction of query keywords found in document.
 */
export function keywordOverlap(queryKeywords: string[], docText: string): number {
  if (queryKeywords.length === 0) return 0.0;
  const docLower = docText.toLowerCase();
  const hits = queryKeywords.filter(kw => docLower.includes(kw)).length;
  return hits / queryKeywords.length;
}

/**
 * Extract quoted phrases from text (single or double quotes, 3-60 chars).
 */
export function extractQuotedPhrases(text: string): string[] {
  const phrases: string[] = [];
  for (const pattern of [/'([^']{3,60})'/g, /"([^"]{3,60})"/g]) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const phrase = match[1].trim();
      if (phrase.length >= 3) phrases.push(phrase);
    }
  }
  return phrases;
}

/**
 * Score quoted phrase matches in a document.
 * Strong signal — if someone says "you mentioned 'X'", finding X exactly is high confidence.
 * @returns 0.0 to 1.0 — fraction of quoted phrases found in document.
 */
export function quotedPhraseBoost(phrases: string[], docText: string): number {
  if (phrases.length === 0) return 0.0;
  const docLower = docText.toLowerCase();
  const hits = phrases.filter(p => docLower.includes(p.toLowerCase())).length;
  return Math.min(hits / phrases.length, 1.0);
}

/**
 * Extract likely person names from text.
 * Capitalized words (3-15 chars) that aren't common title-case words.
 */
export function extractPersonNames(text: string): string[] {
  const matches = text.match(/\b[A-Z][a-z]{2,15}\b/g) ?? [];
  const unique = new Set(matches.filter(w => !NOT_NAMES.has(w)));
  return Array.from(unique);
}

/**
 * Score person name matches in a document.
 * @returns 0.0 to 1.0 — fraction of names found in document.
 */
export function personNameBoost(names: string[], docText: string): number {
  if (names.length === 0) return 0.0;
  const docLower = docText.toLowerCase();
  const hits = names.filter(n => docLower.includes(n.toLowerCase())).length;
  return Math.min(hits / names.length, 1.0);
}

// ─── Temporal Parsing ────────────────────────────────────────────────────────

/** Parsed time offset from a query: days back + tolerance in days. */
export interface TimeOffset {
  daysBack: number;
  toleranceDays: number;
}

/**
 * Parse temporal references from a query.
 * "3 days ago" → { daysBack: 3, toleranceDays: 2 }
 * "last month" → { daysBack: 30, toleranceDays: 7 }
 */
export function parseTimeOffset(query: string): TimeOffset | null {
  const q = query.toLowerCase();

  const patterns: Array<[RegExp, (m: RegExpMatchArray) => TimeOffset]> = [
    [/(\d+)\s+days?\s+ago/, m => ({ daysBack: parseInt(m[1]), toleranceDays: 2 })],
    [/a\s+couple\s+(?:of\s+)?days?\s+ago/, () => ({ daysBack: 2, toleranceDays: 2 })],
    [/yesterday/, () => ({ daysBack: 1, toleranceDays: 1 })],
    [/a\s+week\s+ago/, () => ({ daysBack: 7, toleranceDays: 3 })],
    [/(\d+)\s+weeks?\s+ago/, m => ({ daysBack: parseInt(m[1]) * 7, toleranceDays: 5 })],
    [/last\s+week/, () => ({ daysBack: 7, toleranceDays: 3 })],
    [/a\s+month\s+ago/, () => ({ daysBack: 30, toleranceDays: 7 })],
    [/(\d+)\s+months?\s+ago/, m => ({ daysBack: parseInt(m[1]) * 30, toleranceDays: 10 })],
    [/last\s+month/, () => ({ daysBack: 30, toleranceDays: 7 })],
    [/last\s+year/, () => ({ daysBack: 365, toleranceDays: 30 })],
    [/a\s+year\s+ago/, () => ({ daysBack: 365, toleranceDays: 30 })],
    [/recently/, () => ({ daysBack: 14, toleranceDays: 14 })],
  ];

  for (const [pattern, extract] of patterns) {
    const match = q.match(pattern);
    if (match) return extract(match);
  }
  return null;
}

/**
 * Calculate temporal proximity boost.
 * Documents closer to the target date get a stronger boost.
 *
 * @param docDate — the document's date
 * @param targetDate — the date the query is asking about
 * @param toleranceDays — how many days of tolerance around the target
 * @returns 0.0 to 0.40 — temporal boost factor
 */
export function temporalBoost(
  docDate: Date,
  targetDate: Date,
  toleranceDays: number,
): number {
  const deltaDays = Math.abs(
    (docDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (deltaDays <= toleranceDays) {
    return 0.40;
  }
  if (deltaDays <= toleranceDays * 3) {
    return 0.40 * (1.0 - (deltaDays - toleranceDays) / (toleranceDays * 2));
  }
  return 0.0;
}

// ─── Preference Extraction ───────────────────────────────────────────────────

/** 21 patterns for extracting user preferences and concerns from conversation text. */
const PREF_PATTERNS: RegExp[] = [
  /i(?:'ve been| have been) having (?:trouble|issues?|problems?) with ([^,\.!?]{5,80})/gi,
  /i(?:'ve been| have been) feeling ([^,\.!?]{5,60})/gi,
  /i(?:'ve been| have been) (?:struggling|dealing) with ([^,\.!?]{5,80})/gi,
  /i(?:'ve been| have been) (?:worried|concerned) about ([^,\.!?]{5,80})/gi,
  /i(?:'m| am) (?:worried|concerned) about ([^,\.!?]{5,80})/gi,
  /i prefer ([^,\.!?]{5,60})/gi,
  /i usually ([^,\.!?]{5,60})/gi,
  /i(?:'ve been| have been) (?:trying|attempting) to ([^,\.!?]{5,80})/gi,
  /i(?:'ve been| have been) (?:considering|thinking about) ([^,\.!?]{5,80})/gi,
  /lately[,\s]+(?:i've been|i have been|i'm|i am) ([^,\.!?]{5,80})/gi,
  /recently[,\s]+(?:i've been|i have been|i'm|i am) ([^,\.!?]{5,80})/gi,
  /i(?:'ve been| have been) (?:working on|focused on|interested in) ([^,\.!?]{5,80})/gi,
  /i want to ([^,\.!?]{5,60})/gi,
  /i(?:'m| am) looking (?:to|for) ([^,\.!?]{5,60})/gi,
  /i(?:'m| am) thinking (?:about|of) ([^,\.!?]{5,60})/gi,
  /i(?:'ve been| have been) (?:noticing|experiencing) ([^,\.!?]{5,80})/gi,
  // Memory/nostalgia patterns (v4 addition)
  /i (?:still )?remember (?:the |my )?([^,\.!?]{5,80})/gi,
  /i used to ([^,\.!?]{5,60})/gi,
  /when i was (?:in high school|in college|young|a kid|growing up)[,\s]+([^,\.!?]{5,80})/gi,
  /growing up[,\s]+([^,\.!?]{5,80})/gi,
  /(?:happy|fond|good|positive) (?:high school|college|childhood|school) (?:experience|memory|memories|time)[^,\.!?]{0,60}/gi,
];

/**
 * Extract user preferences, concerns, and memories from text.
 * Returns up to 12 unique preference mentions.
 */
export function extractPreferences(text: string): string[] {
  const mentions: string[] = [];

  for (const pattern of PREF_PATTERNS) {
    // Reset lastIndex for global regexps
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const captured = match[1] ?? match[0];
      const clean = captured.trim().replace(/[.,;!?\s]+$/, '');
      if (clean.length >= 5 && clean.length <= 80) {
        mentions.push(clean.toLowerCase());
      }
    }
  }

  // Deduplicate preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const m of mentions) {
    if (!seen.has(m)) {
      seen.add(m);
      unique.push(m);
    }
  }
  return unique.slice(0, 12);
}

// ─── Assistant Reference Detection ───────────────────────────────────────────

const ASSISTANT_TRIGGERS = [
  'you suggested', 'you told me', 'you mentioned', 'you said',
  'you recommended', 'remind me what you', 'you provided', 'you listed',
  'you gave me', 'you described', 'what did you', 'you came up with',
  'you helped me', 'you explained', 'can you remind me', 'you identified',
];

/**
 * Detect if a query is asking about something the assistant previously said.
 * These queries need assistant turns indexed (not just user turns).
 */
export function isAssistantReference(query: string): boolean {
  const q = query.toLowerCase();
  return ASSISTANT_TRIGGERS.some(t => q.includes(t));
}

// ─── Fused Scoring ───────────────────────────────────────────────────────────

/** Configuration for the hybrid scorer. */
export interface HybridScorerConfig {
  /** Weight for keyword overlap signal (default: 0.30). */
  keywordWeight: number;

  /** Weight for quoted phrase boost (default: 0.60). */
  quotedPhraseWeight: number;

  /** Weight for person name boost (default: 0.40). */
  personNameWeight: number;

  /** Maximum temporal boost (default: 0.40). */
  maxTemporalBoost: number;
}

export const DEFAULT_HYBRID_CONFIG: HybridScorerConfig = {
  keywordWeight: 0.30,
  quotedPhraseWeight: 0.60,
  personNameWeight: 0.40,
  maxTemporalBoost: 0.40,
};

/** A document with its raw distance score from embedding search. */
export interface ScoredDocument {
  /** Original index or ID. */
  id: string;

  /** The document text. */
  text: string;

  /** Raw distance from embedding search (lower = more similar). */
  rawDistance: number;

  /** Document date (for temporal scoring). */
  date?: Date;
}

/** A re-ranked document with its fused score. */
export interface RerankedDocument {
  /** Original document. */
  doc: ScoredDocument;

  /** Fused distance (lower = more relevant). */
  fusedDistance: number;

  /** Breakdown of which signals contributed. */
  signals: {
    keywordOverlap: number;
    temporalBoost: number;
    personNameBoost: number;
    quotedPhraseBoost: number;
  };
}

/**
 * Re-rank a set of embedding search results using hybrid heuristics.
 *
 * This is the core function — the equivalent of mempalace's hybrid_v4 scoring.
 * Takes raw distance-sorted results and re-ranks using 4 additional signals.
 *
 * @param query — the original search query
 * @param documents — embedding search results with raw distances
 * @param queryDate — when the query was asked (for temporal scoring)
 * @param config — scoring weights
 * @returns re-ranked documents, sorted by fusedDistance ascending
 */
export function hybridRerank(
  query: string,
  documents: ScoredDocument[],
  queryDate?: Date,
  config: HybridScorerConfig = DEFAULT_HYBRID_CONFIG,
): RerankedDocument[] {
  // Pre-extract query signals once
  const queryKeywords = extractKeywords(query);
  const quotedPhrases = extractQuotedPhrases(query);
  const personNames = extractPersonNames(query);
  const timeOffset = parseTimeOffset(query);

  // Calculate target date from time offset
  let targetDate: Date | null = null;
  if (timeOffset && queryDate) {
    targetDate = new Date(queryDate.getTime() - timeOffset.daysBack * 24 * 60 * 60 * 1000);
  }

  // Score each document
  const reranked: RerankedDocument[] = documents.map(doc => {
    let fusedDist = doc.rawDistance;

    // Signal 1: Keyword overlap
    const kwOverlap = keywordOverlap(queryKeywords, doc.text);
    fusedDist = fusedDist * (1.0 - config.keywordWeight * kwOverlap);

    // Signal 2: Temporal proximity
    let tempBoost = 0;
    if (targetDate && doc.date) {
      tempBoost = temporalBoost(doc.date, targetDate, timeOffset!.toleranceDays);
      fusedDist = fusedDist * (1.0 - tempBoost);
    }

    // Signal 3: Person name boost
    let nameBoost = 0;
    if (personNames.length > 0) {
      nameBoost = personNameBoost(personNames, doc.text);
      if (nameBoost > 0) {
        fusedDist = fusedDist * (1.0 - config.personNameWeight * nameBoost);
      }
    }

    // Signal 4: Quoted phrase boost
    let phraseBoost = 0;
    if (quotedPhrases.length > 0) {
      phraseBoost = quotedPhraseBoost(quotedPhrases, doc.text);
      if (phraseBoost > 0) {
        fusedDist = fusedDist * (1.0 - config.quotedPhraseWeight * phraseBoost);
      }
    }

    return {
      doc,
      fusedDistance: fusedDist,
      signals: {
        keywordOverlap: kwOverlap,
        temporalBoost: tempBoost,
        personNameBoost: nameBoost,
        quotedPhraseBoost: phraseBoost,
      },
    };
  });

  // Sort by fused distance ascending (lower = more relevant)
  reranked.sort((a, b) => a.fusedDistance - b.fusedDistance);

  return reranked;
}

/**
 * Convert a relevance score (0-1, higher = better) to a distance (lower = better).
 * Useful when our MemoryService returns scores but we need distances for hybrid scoring.
 */
export function scoreToDistance(score: number): number {
  return Math.max(0, 1.0 - score);
}

/**
 * Convert a fused distance back to a relevance score (0-1, higher = better).
 */
export function distanceToScore(fusedDistance: number): number {
  return Math.max(0, Math.min(1.0, 1.0 - fusedDistance));
}
