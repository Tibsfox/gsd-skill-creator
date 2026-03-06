import { describe, it, expect } from 'vitest';
import { getStory, getBridge, getPrompts } from '../../src/narrative/index';
import { wonderStories } from '../../src/narrative/stories';
import { hundredVoicesBridges } from '../../src/narrative/bridges';
import { FOUNDATION_ORDER } from '../../src/types/index';
import type { FoundationId } from '../../src/types/index';

describe('Safety-Critical Narrative + Content Tests', () => {

  // ── SC-01: All 8 wonder stories contain ZERO math notation ──

  describe('SC-01: Wonder stories contain zero math notation', () => {
    // LaTeX markers that indicate math notation
    const MATH_NOTATION_PATTERNS = [
      /\\\(/,             // \( inline math start
      /\\\)/,             // \) inline math end
      /\\\[/,             // \[ display math start
      /\\\]/,             // \] display math end
      /\\frac/,           // \frac
      /\\sqrt/,           // \sqrt
      /\\sum/,            // \sum
      /\\int/,            // \int
      /\\pi(?![a-z])/,    // \pi (LaTeX, not "piano")
      /\\theta/,          // \theta
      /\\sin/,            // \sin
      /\\cos/,            // \cos
      /\\tan/,            // \tan
      /\\alpha/,          // \alpha
      /\\beta/,           // \beta
      /\\infty/,          // \infty
      /\$\$.+?\$\$/s,     // $$ display math $$
      /\$[^$]+\$/,        // $ inline math $
      /\\begin\{/,        // \begin{equation} etc.
      /\\end\{/,          // \end{equation} etc.
      /[a-z]\^[0-9]/,     // superscript notation like x^2 (but not in natural language)
      /[a-z]_[0-9]/,      // subscript notation like x_1
    ];

    for (const foundation of FOUNDATION_ORDER) {
      it(`${foundation} wonder story has no math notation`, () => {
        const story = getStory(foundation);
        expect(story.body.length).toBeGreaterThan(0);

        for (const pattern of MATH_NOTATION_PATTERNS) {
          expect(story.body).not.toMatch(pattern);
        }
      });
    }
  });

  // ── SC-14: All 8 Hundred Voices bridges contain zero quoted literary text ──

  describe('SC-14: Hundred Voices bridges contain no quoted literary text', () => {
    for (const foundation of FOUNDATION_ORDER) {
      it(`${foundation} bridge contains no quoted multi-word literary text`, () => {
        const bridge = getBridge(foundation);
        expect(bridge.description.length).toBeGreaterThan(0);

        // No quotation marks wrapping multi-word phrases (3+ words in quotes)
        // This catches "word word word" style literary quotes
        const quotedMultiWord = /"[^"]*\s[^"]*\s[^"]*"/;
        expect(bridge.description).not.toMatch(quotedMultiWord);
      });
    }
  });

  // ── SC-20: Wonder stories contain no author names ──

  describe('SC-20: Wonder stories contain no author names', () => {
    const FORBIDDEN_AUTHORS = [
      'Hemingway', 'Morrison', 'Woolf', 'Pynchon',
      'Borges', 'Le Guin', 'Calvino', 'Everett',
    ];

    for (const foundation of FOUNDATION_ORDER) {
      it(`${foundation} wonder story body does not mention any author by name`, () => {
        const story = getStory(foundation);

        for (const author of FORBIDDEN_AUTHORS) {
          expect(story.body).not.toContain(author);
        }
      });
    }
  });

  // ── WC-01 through WC-08: Each wonder story exists and is non-empty ──

  describe('WC-01:08: All 8 wonder stories exist and are non-empty', () => {
    const expectedStories: [string, FoundationId][] = [
      ['WC-01', 'unit-circle'],
      ['WC-02', 'pythagorean'],
      ['WC-03', 'trigonometry'],
      ['WC-04', 'vector-calculus'],
      ['WC-05', 'set-theory'],
      ['WC-06', 'category-theory'],
      ['WC-07', 'information-theory'],
      ['WC-08', 'l-systems'],
    ];

    for (const [testId, foundation] of expectedStories) {
      it(`${testId}: ${foundation} wonder story exists and is non-empty`, () => {
        const story = getStory(foundation);
        expect(story).toBeDefined();
        expect(story.foundationId).toBe(foundation);
        expect(story.title.length).toBeGreaterThan(0);
        expect(story.body.length).toBeGreaterThan(100);
        expect(story.voiceTone.length).toBeGreaterThan(0);
        expect(story.keyImage.length).toBeGreaterThan(0);
        expect(story.literaryVoice.length).toBeGreaterThan(0);
      });
    }

    it('wonderStories array contains exactly 8 stories', () => {
      expect(wonderStories).toHaveLength(8);
    });
  });

  // ── NR-01 through NR-08: Each bridge exists and contains no quoted text ──

  describe('NR-01:08: All 8 Hundred Voices bridges exist with no quoted text', () => {
    const expectedBridges: [string, FoundationId][] = [
      ['NR-01', 'unit-circle'],
      ['NR-02', 'pythagorean'],
      ['NR-03', 'trigonometry'],
      ['NR-04', 'vector-calculus'],
      ['NR-05', 'set-theory'],
      ['NR-06', 'category-theory'],
      ['NR-07', 'information-theory'],
      ['NR-08', 'l-systems'],
    ];

    for (const [testId, foundation] of expectedBridges) {
      it(`${testId}: ${foundation} bridge exists and contains no quoted text`, () => {
        const bridge = getBridge(foundation);
        expect(bridge).toBeDefined();
        expect(bridge.foundationId).toBe(foundation);
        expect(bridge.description.length).toBeGreaterThan(50);
        expect(bridge.literaryVoice.length).toBeGreaterThan(0);
        expect(bridge.connectionType.length).toBeGreaterThan(0);

        // No quoted multi-word passages
        const quotedMultiWord = /"[^"]*\s[^"]*\s[^"]*"/;
        expect(bridge.description).not.toMatch(quotedMultiWord);
      });
    }

    it('hundredVoicesBridges array contains exactly 8 bridges', () => {
      expect(hundredVoicesBridges).toHaveLength(8);
    });
  });

  // ── PE-14: Each foundation has at least 1 reflection prompt with "already know" ──

  describe('PE-14: Each foundation has reflection prompts with "already know"', () => {
    const ALREADY_KNOW_VARIANTS = [
      'already know',
      'already knew',
    ];

    for (const foundation of FOUNDATION_ORDER) {
      it(`${foundation} has at least 1 prompt containing "already know" or equivalent`, () => {
        const prompts = getPrompts(foundation);
        expect(prompts.length).toBeGreaterThanOrEqual(1);

        const hasAlreadyKnow = prompts.some(p => {
          const combined = (p.prompt + ' ' + (p.followUp ?? '')).toLowerCase();
          return ALREADY_KNOW_VARIANTS.some(variant => combined.includes(variant));
        });

        expect(hasAlreadyKnow).toBe(true);
      });
    }
  });
});
