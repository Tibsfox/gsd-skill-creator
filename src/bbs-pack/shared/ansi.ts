/**
 * ANSI escape sequence tokenizer.
 *
 * Parses strings containing ANSI CSI (Control Sequence Introducer) sequences
 * into typed tokens: text, SGR (Select Graphic Rendition), cursor positioning,
 * and erase commands.
 *
 * Source: ECMA-48 / ANSI X3.64
 */

export type BbsAnsiTokenType = 'text' | 'sgr' | 'cursor' | 'erase' | 'unknown';

export interface BbsAnsiToken {
  /** Token classification */
  type: BbsAnsiTokenType;
  /** Raw string content of this token */
  raw: string;
  /** Parsed numeric parameters (e.g., [31] for red, [1,33] for bold yellow) */
  params?: number[];
}

/**
 * Tokenize a string containing ANSI escape sequences into typed tokens.
 * Handles CSI sequences (ESC [ params final_byte) including SGR, cursor, erase.
 *
 * @param input - String potentially containing ANSI escape sequences
 * @returns Array of BbsAnsiToken
 */
export function tokenizeAnsi(input: string): BbsAnsiToken[] {
  const tokens: BbsAnsiToken[] = [];
  const CSI = /\x1B\[([0-9;]*)([A-Za-z])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CSI.exec(input)) !== null) {
    // Text before this escape sequence
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', raw: input.slice(lastIndex, match.index) });
    }

    const paramStr = match[1];
    const finalByte = match[2];
    const params = paramStr ? paramStr.split(';').map(Number) : [0];

    let type: BbsAnsiTokenType;
    switch (finalByte) {
      case 'm': type = 'sgr'; break;
      case 'A': case 'B': case 'C': case 'D':
      case 'H': case 'f': type = 'cursor'; break;
      case 'J': case 'K': type = 'erase'; break;
      default: type = 'unknown';
    }

    tokens.push({ type, raw: match[0], params });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last escape sequence
  if (lastIndex < input.length) {
    tokens.push({ type: 'text', raw: input.slice(lastIndex) });
  }

  return tokens;
}
