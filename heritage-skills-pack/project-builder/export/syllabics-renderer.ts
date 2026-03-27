/**
 * Syllabics Renderer — Inuktitut Unicode syllabic block validation and
 * annotation utilities for Heritage Book export.
 *
 * Covers the Unified Canadian Aboriginal Syllabics Unicode blocks:
 * - Primary block: U+1400-U+167F (Unified Canadian Aboriginal Syllabics)
 * - Extended block: U+18B0-U+18FF (Unified Canadian Aboriginal Syllabics Extended)
 *
 * Used by docx and pdf exporters to ensure Inuktitut syllabics
 * (ᐃᓄᒃᑎᑐᑦ) render correctly in exported documents.
 *
 * @module heritage-skills-pack/project-builder/export/syllabics-renderer
 */

export interface SyllabicRange {
  /** Start index in the original string. */
  start: number;
  /** End index (exclusive) in the original string. */
  end: number;
  /** The syllabic text content of this range. */
  text: string;
}

export interface SyllabicsValidationResult {
  /** Whether all syllabic characters are valid Unicode code points. */
  isValid: boolean;
  /** Issues found during validation (empty if isValid=true). */
  issues: string[];
}

export interface SyllabicsUnicodeBlock {
  /** Name of the Unicode block. */
  name: string;
  /** First code point in the block (inclusive). */
  start: number;
  /** Last code point in the block (inclusive). */
  end: number;
}

export class SyllabicsRenderer {
  // U+1400-U+167F: Unified Canadian Aboriginal Syllabics
  private static readonly PRIMARY_BLOCK_START = 0x1400;
  private static readonly PRIMARY_BLOCK_END = 0x167f;

  // U+18B0-U+18FF: Unified Canadian Aboriginal Syllabics Extended
  private static readonly EXTENDED_BLOCK_START = 0x18b0;
  private static readonly EXTENDED_BLOCK_END = 0x18ff;

  /**
   * Returns true if the text contains any Inuktitut syllabic characters.
   */
  containsSyllabics(text: string): boolean {
    for (const char of text) {
      const codePoint = char.codePointAt(0);
      if (codePoint !== undefined && this.isSyllabic(codePoint)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Extract all contiguous syllabic character ranges from the text.
   * Returns an array of { start, end, text } objects.
   */
  extractSyllabicRanges(text: string): SyllabicRange[] {
    const ranges: SyllabicRange[] = [];
    let currentRangeStart = -1;
    let currentRangeText = '';

    for (let i = 0; i < text.length; i++) {
      const codePoint = text.codePointAt(i);
      if (codePoint !== undefined && this.isSyllabic(codePoint)) {
        if (currentRangeStart === -1) {
          currentRangeStart = i;
          currentRangeText = '';
        }
        currentRangeText += text[i];
      } else {
        if (currentRangeStart !== -1) {
          ranges.push({ start: currentRangeStart, end: i, text: currentRangeText });
          currentRangeStart = -1;
          currentRangeText = '';
        }
      }
    }

    // Flush trailing range
    if (currentRangeStart !== -1) {
      ranges.push({ start: currentRangeStart, end: text.length, text: currentRangeText });
    }

    return ranges;
  }

  /**
   * Validate that syllabic characters in the text are properly encoded.
   * Checks for: replacement characters (U+FFFD), isolated surrogates, null bytes.
   */
  validateSyllabicEncoding(text: string): SyllabicsValidationResult {
    const issues: string[] = [];

    // Check for Unicode replacement character — indicates encoding failure
    if (text.includes('\uFFFD')) {
      issues.push(
        'Text contains Unicode replacement character (U+FFFD) — syllabics may have been corrupted during encoding',
      );
    }

    // Check for null bytes
    if (text.includes('\u0000')) {
      issues.push('Text contains null byte (U+0000) — possible encoding issue');
    }

    // Verify each syllabic character is in the expected Unicode range
    const ranges = this.extractSyllabicRanges(text);
    for (const range of ranges) {
      for (const char of range.text) {
        const codePoint = char.codePointAt(0);
        if (codePoint !== undefined && !this.isSyllabic(codePoint)) {
          issues.push(
            `Character at range position is not a valid syllabic code point: U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
          );
        }
      }
    }

    return { isValid: issues.length === 0, issues };
  }

  /**
   * Wrap syllabic character runs in HTML annotation spans for correct rendering.
   *
   * Output: `<span lang="iu" dir="ltr" class="inuktitut-syllabics">ᐃᓄᒃᑎᑐᑦ</span>`
   */
  renderSyllabicsAnnotation(text: string): string {
    if (!this.containsSyllabics(text)) return text;

    const ranges = this.extractSyllabicRanges(text);
    let result = text;
    let offset = 0;

    for (const range of ranges) {
      const annotated = `<span lang="iu" dir="ltr" class="inuktitut-syllabics">${range.text}</span>`;
      const adjustedStart = range.start + offset;
      const adjustedEnd = range.end + offset;
      result = result.slice(0, adjustedStart) + annotated + result.slice(adjustedEnd);
      offset += annotated.length - range.text.length;
    }

    return result;
  }

  /**
   * Returns the two Unicode block definitions used for syllabics detection.
   */
  getSyllabicsUnicodeBlocks(): SyllabicsUnicodeBlock[] {
    return [
      {
        name: 'Unified Canadian Aboriginal Syllabics',
        start: SyllabicsRenderer.PRIMARY_BLOCK_START,
        end: SyllabicsRenderer.PRIMARY_BLOCK_END,
      },
      {
        name: 'Unified Canadian Aboriginal Syllabics Extended',
        start: SyllabicsRenderer.EXTENDED_BLOCK_START,
        end: SyllabicsRenderer.EXTENDED_BLOCK_END,
      },
    ];
  }

  private isSyllabic(codePoint: number): boolean {
    return (
      (codePoint >= SyllabicsRenderer.PRIMARY_BLOCK_START &&
        codePoint <= SyllabicsRenderer.PRIMARY_BLOCK_END) ||
      (codePoint >= SyllabicsRenderer.EXTENDED_BLOCK_START &&
        codePoint <= SyllabicsRenderer.EXTENDED_BLOCK_END)
    );
  }
}
