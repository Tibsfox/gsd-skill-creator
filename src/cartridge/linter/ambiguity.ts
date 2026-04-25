/**
 * HB-06 Four-Type Ambiguity Linter.
 *
 * Implements Orchid's four-type ambiguity taxonomy (arXiv:2604.21505)
 * over SKILL.md content. Detects:
 *   - lexical: bare polysemes used without disambiguating qualifiers
 *   - syntactic: long multi-clause sentences with ambiguous parses
 *   - semantic: unscoped universal quantifiers
 *   - vagueness: directive-style use of "appropriate", "reasonable",
 *     "suitable", "as needed", "best practice" without operationalization
 *
 * Acceptance constraint (CS25-18): zero false positives at baseline on
 * the in-tree skill corpus. Heuristics are intentionally conservative:
 * the linter strips frontmatter, code blocks, tables, blockquotes,
 * headings, and reference-style lines before scanning, then applies
 * pattern matchers gated by directive-context filters.
 *
 * Default-off: this module emits a result regardless of the flag, but
 * callers (e.g., the cartridge promotion pipeline) consult
 * `isAmbiguityLintEnabled()` from `./ambiguity-settings.ts` to decide
 * whether flags block promotion or merely emit warnings.
 *
 * Source spec: .planning/missions/cs25-26-sweep/work/synthesis/specs/
 *   HB-06-ambiguity-checklist.md
 *
 * @module cartridge/linter/ambiguity
 */

export type AmbiguityType = 'lexical' | 'syntactic' | 'semantic' | 'vagueness';

export interface AmbiguityFlag {
  filePath: string;
  type: AmbiguityType;
  span: { line: number; col: number; length: number };
  text: string;
  rationale: string;
}

export interface AmbiguityCheckResult {
  filePath: string;
  flags: AmbiguityFlag[];
  passed: boolean;
}

interface ScanLine {
  /** 1-indexed line number in the original document. */
  line: number;
  /** Original text of the line. */
  text: string;
  /** True if this line is "directive content" (eligible for scanning). */
  scannable: boolean;
}

/**
 * Pre-process raw SKILL.md text into a per-line table that records
 * whether each line is scannable. Lines inside frontmatter, fenced code
 * blocks, tables, blockquotes, headings, HTML comments, and reference
 * footnotes are marked non-scannable.
 */
function classifyLines(content: string): ScanLine[] {
  const lines = content.split(/\r?\n/);
  const out: ScanLine[] = [];
  let inFrontmatter = false;
  let frontmatterClosed = false;
  let inFence = false;
  let inHtmlComment = false;

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    const trimmed = text.trim();

    // YAML frontmatter (only if at top of file).
    if (i === 0 && trimmed === '---') {
      inFrontmatter = true;
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }
    if (inFrontmatter) {
      if (trimmed === '---' || trimmed === '...') {
        inFrontmatter = false;
        frontmatterClosed = true;
      }
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }
    void frontmatterClosed; // (not currently load-bearing; reserved for future use)

    // HTML comment block.
    if (inHtmlComment) {
      if (text.includes('-->')) inHtmlComment = false;
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }
    if (text.includes('<!--') && !text.includes('-->')) {
      inHtmlComment = true;
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }

    // Fenced code block (``` or ~~~).
    if (/^\s*(```|~~~)/.test(text)) {
      inFence = !inFence;
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }
    if (inFence) {
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }

    // Headings (#, ##, …).
    if (/^\s*#{1,6}\s/.test(text)) {
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }

    // Table rows (any line containing |).
    if (/\|/.test(text)) {
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }

    // Blockquotes.
    if (/^\s*>/.test(text)) {
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }

    // Reference-style link/footnote definitions.
    if (/^\s*\[[^\]]+\]:\s/.test(text)) {
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }

    // Indented code (4+ leading spaces, non-empty, not a list continuation
    // with hyphen/star/digit).
    if (/^ {4,}\S/.test(text) && !/^ {4,}[-*+]\s/.test(text) && !/^ {4,}\d+\.\s/.test(text)) {
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }

    // Empty lines: marked non-scannable but pass through cleanly.
    if (trimmed === '') {
      out.push({ line: i + 1, text, scannable: false });
      continue;
    }

    out.push({ line: i + 1, text, scannable: true });
  }

  return out;
}

/**
 * Strip inline code spans, link targets, and quoted strings from a line
 * before pattern-matching. Quoted material is treated as defined / cited
 * and not subject to ambiguity flags.
 */
function neutralize(text: string): string {
  return text
    // Inline code.
    .replace(/`[^`]*`/g, ' ')
    // Markdown link target (keep label, drop URL).
    .replace(/\]\([^)]*\)/g, ']')
    // Double-quoted strings.
    .replace(/"[^"]*"/g, ' ')
    // Single-quoted strings (only when both quotes present and not contractions).
    .replace(/'([^'\n]{2,80})'/g, ' ')
    // Smart quotes.
    .replace(/[“”][^“”\n]*[“”]/g, ' ');
}

/**
 * Heuristic: is this a short, prescriptive line — a bullet, a numbered
 * step, or a one-sentence bare directive? The vagueness check fires only
 * inside such lines; longer narrative paragraphs explaining concepts
 * routinely (and legitimately) use words like "appropriate".
 */
function isDirectiveLine(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === '') return false;
  // Short list bullets / numbered steps.
  const isBullet = /^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);
  // Bold-prefixed directives ("**Use when:** …") count as bullets in spirit.
  const startsWithBold = /^\*\*[^*]+\*\*[:\s]/.test(trimmed);
  const wordCount = trimmed.split(/\s+/).length;
  return (isBullet || startsWithBold) && wordCount <= 25;
}

/* -------------------------------------------------------------------- */
/* Vagueness check.                                                     */
/* -------------------------------------------------------------------- */

/** Phrases that are vague when used as the operational criterion. */
const VAGUE_PATTERNS: ReadonlyArray<{ re: RegExp; phrase: string }> = [
  { re: /\bas\s+appropriate\b/i, phrase: 'as appropriate' },
  { re: /\bwhere\s+appropriate\b/i, phrase: 'where appropriate' },
  { re: /\bwhen\s+appropriate\b/i, phrase: 'when appropriate' },
  { re: /\bif\s+appropriate\b/i, phrase: 'if appropriate' },
  { re: /\bas\s+needed\b/i, phrase: 'as needed' },
  { re: /\bif\s+needed\b/i, phrase: 'if needed' },
  { re: /\bwhen\s+needed\b/i, phrase: 'when needed' },
  { re: /\bas\s+suitable\b/i, phrase: 'as suitable' },
  { re: /\bif\s+suitable\b/i, phrase: 'if suitable' },
  { re: /\bwhere\s+suitable\b/i, phrase: 'where suitable' },
  { re: /\bif\s+reasonable\b/i, phrase: 'if reasonable' },
  { re: /\bas\s+reasonable\b/i, phrase: 'as reasonable' },
];

/**
 * A vagueness phrase is operationalized if the same line contains a
 * concrete qualifier (number, threshold, named gate, frontmatter key,
 * code path, etc.). When operationalized, do not flag.
 */
function isOperationalized(text: string): boolean {
  return (
    /\d/.test(text) ||                   // numbers / thresholds
    /[<>=]/.test(text) ||                // comparisons
    /\b(when|while|if|until|after|before|given)\s+\w+\s+(is|has|equals|matches|exceeds|≥|≤|>|<|=)\b/i.test(text) ||
    /\bfrontmatter\b/i.test(text) ||
    /\.(md|ts|js|json|yml|yaml|toml)\b/i.test(text) ||
    /\bphase\s+\d+/i.test(text)
  );
}

function checkVagueness(scan: ScanLine[], filePath: string): AmbiguityFlag[] {
  const flags: AmbiguityFlag[] = [];
  for (const { line, text, scannable } of scan) {
    if (!scannable) continue;
    if (!isDirectiveLine(text)) continue;
    const neut = neutralize(text);
    if (isOperationalized(neut)) continue;
    // Skip lines that explicitly negate or define the term.
    if (/\b(not|isn't|never|don't)\b/i.test(neut)) continue;
    // Skip meta-lines that name vagueness as a topic ("flag X").
    if (/\b(flag|flags|flagged|detect|detects|detected|vague|vagueness|ambiguous|ambiguity)\b/i.test(neut)) continue;
    for (const { re, phrase } of VAGUE_PATTERNS) {
      const m = re.exec(neut);
      if (m) {
        const col = (text.toLowerCase().indexOf(phrase.toLowerCase()) >= 0
          ? text.toLowerCase().indexOf(phrase.toLowerCase())
          : 0) + 1;
        flags.push({
          filePath,
          type: 'vagueness',
          span: { line, col, length: phrase.length },
          text: phrase,
          rationale: `Directive uses "${phrase}" without operationalization. Replace with a concrete trigger (e.g., a frontmatter key, threshold, or named precondition).`,
        });
        break; // one flag per line
      }
    }
  }
  return flags;
}

/* -------------------------------------------------------------------- */
/* Semantic check (unscoped universal quantifiers in directive lines).  */
/* -------------------------------------------------------------------- */

function checkSemantic(scan: ScanLine[], filePath: string): AmbiguityFlag[] {
  const flags: AmbiguityFlag[] = [];
  for (const { line, text, scannable } of scan) {
    if (!scannable) continue;
    if (!isDirectiveLine(text)) continue;
    const neut = neutralize(text);
    // Already-narrow scope counts as operationalized.
    if (isOperationalized(neut)) continue;
    if (/\b(not|isn't|never|don't)\b/i.test(neut)) continue;
    if (/\b(flag|flags|flagged|detect|detects|detected|every|all|any)-/i.test(text)) continue;
    // Pattern: "(must|should|will) <verb> (all|every|any) <bare-noun>" with
    // no scoping clause anywhere in the line.
    const m = /\b(must|should|will|always)\s+\w+\s+(all|every|any)\s+\w+/i.exec(neut);
    if (!m) continue;
    // Skip when scoping qualifier present.
    if (/\b(in|within|inside|of|that|which|whose|having|with|under)\b/i.test(neut.slice(m.index + m[0].length))) {
      continue;
    }
    const col = m.index + 1;
    flags.push({
      filePath,
      type: 'semantic',
      span: { line, col, length: m[0].length },
      text: m[0],
      rationale: `Unscoped universal quantifier "${m[2]}" — name the population (e.g., "all skills with frontmatter X" or "every entry in the registry").`,
    });
  }
  return flags;
}

/* -------------------------------------------------------------------- */
/* Syntactic check (long sentences with multiple clauses + ambiguous    */
/* coordination).                                                       */
/* -------------------------------------------------------------------- */

function checkSyntactic(scan: ScanLine[], filePath: string): AmbiguityFlag[] {
  const flags: AmbiguityFlag[] = [];
  for (const { line, text, scannable } of scan) {
    if (!scannable) continue;
    const neut = neutralize(text);
    const wordCount = neut.trim().split(/\s+/).length;
    if (wordCount < 45) continue; // very long sentences only
    // Already-segmented sentences (multiple periods or semicolons) are fine.
    const sentenceTerminators = (neut.match(/[.;!?]/g) || []).length;
    if (sentenceTerminators >= 2) continue;
    // Need an ambiguous coordination: " and " followed by " or " (or vice versa)
    // appearing in a single un-punctuated clause.
    if (!/\band\b.*\bor\b/i.test(neut) && !/\bor\b.*\band\b/i.test(neut)) continue;
    // Skip if explicit grouping (parentheses or "either/both" markers).
    if (/[()[\]]/.test(neut)) continue;
    if (/\b(either|both|neither)\b/i.test(neut)) continue;
    const col = 1;
    flags.push({
      filePath,
      type: 'syntactic',
      span: { line, col, length: Math.min(text.length, 80) },
      text: text.slice(0, 80),
      rationale: `Long sentence (${wordCount} words) with mixed and/or coordination and no explicit grouping. Split into shorter sentences or add parentheses / "either"/"both" markers to fix the parse.`,
    });
  }
  return flags;
}

/* -------------------------------------------------------------------- */
/* Lexical check (bare polysemes in short directives, no qualifier).    */
/* -------------------------------------------------------------------- */

/**
 * Lexical-ambiguity heuristic: very tight by design (zero-FP target).
 * Trigger requires ALL of:
 *   - line is a directive bullet (≤ 18 words),
 *   - contains the literal phrase "the model" / "the kernel" / "the
 *     adapter" with no preceding modifier in the same sentence (i.e.,
 *     no hyphen, no possessive, no "lora", "attention", etc. within the
 *     two preceding tokens),
 *   - line does not also disambiguate downstream (parens, em-dash, "(a "),
 *   - word count of the line ≤ 18 (true bare directive, not narrative).
 */
const LEXICAL_BARE_TERMS = ['model', 'kernel', 'adapter'];

function checkLexical(scan: ScanLine[], filePath: string): AmbiguityFlag[] {
  const flags: AmbiguityFlag[] = [];
  for (const { line, text, scannable } of scan) {
    if (!scannable) continue;
    if (!isDirectiveLine(text)) continue;
    const trimmed = text.trim();
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 18) continue;
    const neut = neutralize(text);
    // Disambiguating context anywhere on the line.
    if (/[(\[—]/.test(neut)) continue;
    if (/\b(LoRA|lora|adapter\s+weights|attention|megakernel|scheduler|skill|chipset|GPU|GLSL|CUDA|JEPA)\b/i.test(neut)) continue;
    for (const term of LEXICAL_BARE_TERMS) {
      const re = new RegExp(`(^|[^-\\w])the\\s+${term}\\b`, 'i');
      const m = re.exec(neut);
      if (!m) continue;
      // Exclude possessive / hyphenated forms by re-checking original.
      const idx = text.toLowerCase().indexOf(`the ${term}`);
      if (idx < 0) continue;
      // Reject if preceded by a hyphen-attached modifier (e.g., "world-model").
      if (idx > 0 && text[idx - 1] === '-') continue;
      flags.push({
        filePath,
        type: 'lexical',
        span: { line, col: idx + 1, length: `the ${term}`.length },
        text: `the ${term}`,
        rationale: `Bare term "the ${term}" is polysemous in this domain (which model? which kernel? which adapter?). Disambiguate by naming the referent on first use.`,
      });
      break;
    }
  }
  return flags;
}

/* -------------------------------------------------------------------- */
/* Public entry point.                                                  */
/* -------------------------------------------------------------------- */

/**
 * Run all four ambiguity checks against a SKILL.md document.
 *
 * The function is pure and synchronous; it does not consult any flag.
 * Callers decide whether the result blocks promotion (flag on) or emits
 * warnings only (flag off / default).
 */
export function checkAmbiguity(
  skillMdContent: string,
  filePath: string,
): AmbiguityCheckResult {
  const scan = classifyLines(skillMdContent);
  const flags: AmbiguityFlag[] = [
    ...checkLexical(scan, filePath),
    ...checkSyntactic(scan, filePath),
    ...checkSemantic(scan, filePath),
    ...checkVagueness(scan, filePath),
  ];
  // Sort by line then column for stable output.
  flags.sort((a, b) =>
    a.span.line === b.span.line ? a.span.col - b.span.col : a.span.line - b.span.line,
  );
  return { filePath, flags, passed: flags.length === 0 };
}
