/**
 * Enhanced math parsing with readable rendering and token estimation.
 * Builds on section-parser's math extraction with richer analysis.
 */

import type { MathExpr } from '../types.js';

const MATH_SYMBOLS = /[\u2200-\u22FF\u2190-\u21FF\u00B2\u00B3\u00B9\u207F\u2070-\u209F\u0391-\u03C9\u2211\u222B\u221A\u221E\u2202\u2260\u2264\u2265\u00D7\u00F7\u2248\u2261]/g;

function mathSymbolDensity(text: string): number {
  if (text.length === 0) return 0;
  const symbolCount = (text.match(MATH_SYMBOLS) || []).length;
  return symbolCount / text.length;
}

function isDisplayMathLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  const leadingSpaces = line.length - line.trimStart().length;
  const hasMathContent = mathSymbolDensity(trimmed) > 0.1 ||
    (/[=+\-*/^_{}()[\]|]/.test(trimmed) && trimmed.length < 200);
  return leadingSpaces >= 4 && hasMathContent;
}

/**
 * Render math symbols to human-readable form.
 * Converts Unicode math symbols, Greek letters, and operators to words.
 */
export function renderReadable(text: string): string {
  let result = text;

  // Unicode math symbols to words
  result = result.replace(/\u2211/g, 'sum');
  result = result.replace(/\u222B/g, 'integral');
  result = result.replace(/\u221A/g, 'sqrt');
  result = result.replace(/\u221E/g, 'infinity');
  result = result.replace(/\u2202/g, 'partial');
  result = result.replace(/\u2192/g, '->');
  result = result.replace(/\u2190/g, '<-');
  result = result.replace(/\u21D4/g, '<=>');
  result = result.replace(/\u2264/g, '<=');
  result = result.replace(/\u2265/g, '>=');
  result = result.replace(/\u2260/g, '!=');
  result = result.replace(/\u00B2/g, '^2');
  result = result.replace(/\u00B3/g, '^3');
  result = result.replace(/\u00D7/g, '*');
  result = result.replace(/\u00F7/g, '/');
  result = result.replace(/\u2248/g, '~=');

  // Greek letters
  result = result.replace(/\u03B1/g, 'alpha');
  result = result.replace(/\u03B2/g, 'beta');
  result = result.replace(/\u03B3/g, 'gamma');
  result = result.replace(/\u03B4/g, 'delta');
  result = result.replace(/\u03B5/g, 'epsilon');
  result = result.replace(/\u03B8/g, 'theta');
  result = result.replace(/\u03BB/g, 'lambda');
  result = result.replace(/\u03BC/g, 'mu');
  result = result.replace(/\u03C0/g, 'pi');
  result = result.replace(/\u03C3/g, 'sigma');
  result = result.replace(/\u03C6/g, 'phi');
  result = result.replace(/\u03C9/g, 'omega');

  return result;
}

/**
 * Parse a text block for mathematical expressions.
 * Returns all detected MathExpr with type classification, labels, and readable rendering.
 */
export function parseMathBlock(text: string): MathExpr[] {
  const exprs: MathExpr[] = [];

  // 1. Theorem blocks
  const theoremPattern = /^(Theorem)\s*(\d+\.?\d*)?[:.]\s*(.+?)(?=\n\n|\n(?:Definition|Proof|Theorem|Lemma)|$)/gms;
  let match: RegExpExecArray | null;

  while ((match = theoremPattern.exec(text)) !== null) {
    const latex = match[3].trim();
    const label = match[2] ? `thm:${match[2]}` : undefined;
    exprs.push({
      latex,
      readable: renderReadable(latex),
      type: 'theorem',
      label,
    });
  }

  // 2. Definition blocks
  const defPattern = /^(Definition)\s*(\d+\.?\d*)?[:.]\s*(.+?)(?=\n\n|\n(?:Theorem|Proof|Definition|Lemma)|$)/gms;

  while ((match = defPattern.exec(text)) !== null) {
    const latex = match[3].trim();
    const label = match[2] ? `def:${match[2]}` : undefined;
    exprs.push({
      latex,
      readable: renderReadable(latex),
      type: 'definition',
      label,
    });
  }

  // 3. Proof blocks
  const proofPattern = /^Proof[.\s:](.+?)(?:QED|q\.e\.d\.|Q\.E\.D\.|\u25A0|\u25FC)/gms;

  while ((match = proofPattern.exec(text)) !== null) {
    const latex = match[1].trim();
    exprs.push({
      latex,
      readable: renderReadable(latex),
      type: 'proof',
    });
  }

  // 4. Display math: centered lines with math content
  const lines = text.split('\n');
  let displayBlock: string[] = [];
  let inDisplayBlock = false;

  for (const line of lines) {
    if (isDisplayMathLine(line)) {
      inDisplayBlock = true;
      displayBlock.push(line.trim());
    } else {
      if (inDisplayBlock && displayBlock.length > 0) {
        const latex = displayBlock.join(' ');
        exprs.push({
          latex,
          readable: renderReadable(latex),
          type: 'display',
        });
        displayBlock = [];
      }
      inDisplayBlock = false;
    }
  }
  if (displayBlock.length > 0) {
    const latex = displayBlock.join(' ');
    exprs.push({
      latex,
      readable: renderReadable(latex),
      type: 'display',
    });
  }

  // 5. Inline math: segments containing math symbols within prose lines
  const proseLines = lines.filter(l => !isDisplayMathLine(l) && l.trim().length > 0);
  for (const line of proseLines) {
    if (/^(Theorem|Definition|Proof)\s/i.test(line.trim())) continue;

    // Find words containing or adjacent to math symbols
    const words = line.split(/\s+/);
    let mathRun: string[] = [];

    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      const hasMath = MATH_SYMBOLS.test(word);
      // Reset regex lastIndex since it's global
      MATH_SYMBOLS.lastIndex = 0;

      if (hasMath) {
        // Start or extend a math run
        if (mathRun.length === 0) {
          // Include one context word before if available
          if (wi > 0) mathRun.push(words[wi - 1]);
        }
        mathRun.push(word);
      } else if (mathRun.length > 0) {
        // Check if the next word also has math (bridge short gaps)
        const nextHasMath = wi + 1 < words.length && MATH_SYMBOLS.test(words[wi + 1]);
        MATH_SYMBOLS.lastIndex = 0;

        if (nextHasMath && word.length < 10) {
          // Bridge word (like "of", "to", "f(x)", etc.)
          mathRun.push(word);
        } else {
          // Include trailing context word
          mathRun.push(word);
          // Emit the run
          const candidate = mathRun.join(' ').trim();
          if (candidate.length > 0) {
            const isDuplicate = exprs.some(e => e.latex === candidate);
            if (!isDuplicate) {
              exprs.push({
                latex: candidate,
                readable: renderReadable(candidate),
                type: 'inline',
              });
            }
          }
          mathRun = [];
        }
      }
    }

    // Flush remaining math run
    if (mathRun.length > 0) {
      const candidate = mathRun.join(' ').trim();
      if (candidate.length > 0) {
        const isDuplicate = exprs.some(e => e.latex === candidate);
        if (!isDuplicate) {
          exprs.push({
            latex: candidate,
            readable: renderReadable(candidate),
            type: 'inline',
          });
        }
      }
    }
  }

  return exprs;
}

/**
 * Estimate the number of tokens in a text string.
 * Uses word count with density-adjusted ratio:
 * - Pure prose: ~1.3 tokens/word
 * - Math-heavy: up to ~1.8 tokens/word
 */
export function estimateTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  const words = text.match(/\S+/g);
  if (!words) return 0;

  const wordCount = words.length;
  const density = mathSymbolDensity(text);

  // Base ratio 1.3, adjusted up for math content
  const ratio = 1.3 + density * 0.5;
  return Math.round(wordCount * ratio);
}
