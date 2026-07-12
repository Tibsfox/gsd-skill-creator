/**
 * Citation-backed claim-support harness.
 *
 * Extracts atomic claims from a research draft (markdown) and, for each,
 * checks whether it is resolvable/supported by a source through the citation
 * ResolverEngine. Each claim gets a per-claim verdict:
 *
 *   - supported   — the claim carries a citation that the resolver resolves
 *                   to a concrete CitedWork.
 *   - unresolved  — the claim carries a citation marker but the resolver
 *                   could not resolve it to a source.
 *   - unsupported — the claim is a factual assertion carrying no citation
 *                   marker at all (nothing to back it).
 *
 * Scoped to citation-backed SUPPORT, not truth-verification: a `supported`
 * verdict means "a real source is attached and resolvable", not "this claim
 * is true". Precision is favoured over recall — the resolver must return a
 * CitedWork for `supported`, otherwise we report `unresolved`.
 */

import type { CitedWork, ExtractionMethod, RawCitation } from '../types/index.js';
import {
  DOI_PATTERN,
  INFORMAL_CITATION,
  INLINE_APA,
  NARRATIVE_APA,
  NUMBERED_REF,
  URL_PATTERN,
} from '../extractor/patterns.js';

// ============================================================================
// Types
// ============================================================================

export type ClaimVerdict = 'supported' | 'unsupported' | 'unresolved';

/** An atomic claim extracted from a draft. */
export interface Claim {
  /** The claim sentence, trimmed. */
  text: string;
  /** 1-based line number in the source document, if known. */
  lineNumber?: number;
  /** The citation marker snippet carried by the claim, if any. */
  marker: string | null;
  /** The extraction method of the detected marker, if any. */
  method: ExtractionMethod | null;
  /** Whether the claim carries a resolvable citation marker. */
  hasCitation: boolean;
}

/** Pluggable claim extractor. */
export interface ClaimExtractor {
  extract(markdown: string, sourceDocument: string): Claim[];
}

/** Per-claim support outcome. */
export interface ClaimSupport {
  claim: Claim;
  verdict: ClaimVerdict;
  /** Resolved source when `supported`, else null. */
  citation: CitedWork | null;
  /** Resolver confidence when `supported`, else null. */
  confidence: number | null;
  reason: string;
}

export interface ClaimSupportStats {
  total: number;
  supported: number;
  unsupported: number;
  unresolved: number;
}

export interface ClaimSupportReport {
  document: string;
  claims: ClaimSupport[];
  stats: ClaimSupportStats;
}

/** Minimal resolver surface this stage depends on (ResolverEngine implements it). */
export interface ClaimResolverPort {
  resolve(citation: RawCitation): Promise<CitedWork | null>;
}

// ============================================================================
// Heuristic claim extractor (first cut)
// ============================================================================

/** Markers that signal a citation is attached to a sentence. */
const CITATION_MARKERS: ReadonlyArray<[RegExp, ExtractionMethod]> = [
  [DOI_PATTERN, 'doi'],
  [URL_PATTERN, 'url'],
  [INLINE_APA, 'inline-apa'],
  [NARRATIVE_APA, 'narrative'],
  [NUMBERED_REF, 'inline-numbered'],
  [INFORMAL_CITATION, 'informal'],
];

/**
 * Assertion cues that mark a sentence as a factual claim even without a
 * citation. Conservative: numbers/percentages, comparatives, and reporting
 * verbs that assert a fact worth backing.
 */
const ASSERTION_CUES: ReadonlyArray<RegExp> = [
  /\b\d+(?:\.\d+)?\s*%/, // percentages
  /\b\d{4}\b/, // years / counts written as 4 digits
  /\b\d+(?:\.\d+)?\s*(?:x|times|percent|million|billion|thousand)\b/i,
  /\b(?:increase[sd]?|decrease[sd]?|reduce[sd]?|improve[sd]?|outperform[sed]*|double[sd]?|triple[sd]?)\b/i,
  /\b(?:show[sn]?|demonstrate[sd]?|prove[sd]?|found\s+that|reveal[sed]*|indicate[sd]?|report[sed]*)\b/i,
  /\b(?:more|less|fewer|greater|higher|lower|faster|slower)\s+than\b/i,
  /\b(?:the\s+first|the\s+largest|the\s+fastest|the\s+only|the\s+most)\b/i,
];

/** Abbreviations whose trailing period must not end a sentence. */
const ABBREVIATIONS = [
  'et al.', 'e.g.', 'i.e.', 'cf.', 'vs.', 'Dr.', 'Prof.', 'Fig.', 'No.',
  'St.', 'Inc.', 'Ltd.', 'Eq.', 'Ref.', 'Refs.', 'approx.', 'ca.',
];

const ABBR_PLACEHOLDER = '';

function maskAbbreviations(text: string): string {
  let out = text;
  for (const abbr of ABBREVIATIONS) {
    out = out.split(abbr).join(abbr.replace(/\./g, ABBR_PLACEHOLDER));
  }
  return out;
}

function unmask(text: string): string {
  return text.split(ABBR_PLACEHOLDER).join('.');
}

/** Test a source-`g` regex without leaking `lastIndex` between calls. */
function markerMatch(re: RegExp, text: string): RegExpMatchArray | null {
  const probe = new RegExp(re.source, re.flags.replace('g', ''));
  return text.match(probe);
}

/**
 * Strip fenced code blocks and truncate at the first bibliography/references
 * header (references are sources, not claims). Returns lines paired with their
 * 1-based line number.
 */
function contentLines(markdown: string): Array<{ text: string; line: number }> {
  const raw = markdown.split(/\r?\n/);
  const out: Array<{ text: string; line: number }> = [];
  let inFence = false;
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i]!;
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^\s*#{1,6}\s+(references|bibliography|works\s+cited|sources|further\s+reading)\s*$/i.test(line)) {
      break;
    }
    // Skip pure heading lines and horizontal rules — not prose claims.
    if (/^\s*#{1,6}\s+/.test(line) || /^\s*[-*_]{3,}\s*$/.test(line)) continue;
    out.push({ text: line, line: i + 1 });
  }
  return out;
}

/** Split a content line into sentence fragments, abbreviation-aware. */
function splitSentences(text: string): string[] {
  const masked = maskAbbreviations(text);
  return masked
    .split(/(?<=[.!?])\s+(?=["'(\[]?[A-Z0-9])/)
    .map((s) => unmask(s).trim())
    .filter((s) => s.length > 0);
}

function classify(sentence: string): { marker: string | null; method: ExtractionMethod | null; assertion: boolean } {
  for (const [re, method] of CITATION_MARKERS) {
    const m = markerMatch(re, sentence);
    if (m) return { marker: m[0], method, assertion: true };
  }
  const assertion = ASSERTION_CUES.some((re) => re.test(sentence));
  return { marker: null, method: null, assertion };
}

/**
 * Conservative heuristic claim extractor.
 *
 * A sentence becomes a claim when it either carries a citation marker (APA,
 * numbered ref, DOI, URL, informal attribution) or matches a factual
 * assertion cue (a statistic, comparative, or reporting verb). Everything
 * else — transitions, questions, list scaffolding — is dropped.
 *
 * TODO(hard-core): this is a structural first cut. A sophisticated extractor
 * would decompose compound sentences into atomic propositions, bind each
 * proposition to the specific citation that supports it (proximity + semantic
 * match rather than "any marker in the sentence"), and resolve coreference so
 * claims spanning sentences are captured. That NLP core is deferred behind the
 * ClaimExtractor interface — swap in a smarter implementation without touching
 * VerificationStage.
 */
export class HeuristicClaimExtractor implements ClaimExtractor {
  extract(markdown: string, _sourceDocument?: string): Claim[] {
    const claims: Claim[] = [];
    for (const { text, line } of contentLines(markdown)) {
      // Strip list/quote scaffolding but keep the prose.
      const prose = text.replace(/^\s*(?:[-*+]\s+|>\s+|\d+[.)]\s+)/, '').trim();
      if (!prose) continue;
      for (const sentence of splitSentences(prose)) {
        const { marker, method, assertion } = classify(sentence);
        if (!marker && !assertion) continue;
        claims.push({
          text: sentence,
          lineNumber: line,
          marker,
          method,
          hasCitation: marker !== null,
        });
      }
    }
    return claims;
  }
}

// ============================================================================
// Verification stage
// ============================================================================

export interface VerificationStageOptions {
  extractor?: ClaimExtractor;
}

/**
 * Extracts claims from a draft and checks each for citation-backed support
 * through the ResolverEngine.
 */
export class VerificationStage {
  private readonly resolver: ClaimResolverPort;
  private readonly extractor: ClaimExtractor;

  constructor(resolver: ClaimResolverPort, options: VerificationStageOptions = {}) {
    this.resolver = resolver;
    this.extractor = options.extractor ?? new HeuristicClaimExtractor();
  }

  async verify(markdown: string, sourceDocument: string): Promise<ClaimSupportReport> {
    const claims = this.extractor.extract(markdown, sourceDocument);
    const results: ClaimSupport[] = [];

    for (const claim of claims) {
      results.push(await this.verifyClaim(claim, sourceDocument));
    }

    const stats: ClaimSupportStats = {
      total: results.length,
      supported: results.filter((r) => r.verdict === 'supported').length,
      unsupported: results.filter((r) => r.verdict === 'unsupported').length,
      unresolved: results.filter((r) => r.verdict === 'unresolved').length,
    };

    return { document: sourceDocument, claims: results, stats };
  }

  private async verifyClaim(claim: Claim, sourceDocument: string): Promise<ClaimSupport> {
    if (!claim.hasCitation) {
      return {
        claim,
        verdict: 'unsupported',
        citation: null,
        confidence: null,
        reason: 'factual assertion with no citation marker',
      };
    }

    const rawCitation: RawCitation = {
      text: claim.text,
      source_document: sourceDocument,
      extraction_method: claim.method ?? 'manual',
      confidence: 0.5,
      ...(claim.lineNumber ? { line_number: claim.lineNumber } : {}),
      timestamp: new Date().toISOString(),
    };

    let resolved: CitedWork | null = null;
    try {
      resolved = await this.resolver.resolve(rawCitation);
    } catch {
      resolved = null;
    }

    if (resolved) {
      return {
        claim,
        verdict: 'supported',
        citation: resolved,
        confidence: resolved.confidence,
        reason: `resolved to "${resolved.title}" via ${resolved.source_api}`,
      };
    }

    return {
      claim,
      verdict: 'unresolved',
      citation: null,
      confidence: null,
      reason: 'citation marker present but no source resolved',
    };
  }
}
