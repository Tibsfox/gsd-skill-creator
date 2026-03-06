import { describe, it, expect } from 'vitest';
import { wonderStories } from '@/narrative/wonder-stories';
import { hundredVoicesBridges } from '@/narrative/hundred-voices-bridge';
import { reflectionPrompts } from '@/narrative/reflection-prompts';
import { FOUNDATION_ORDER } from '@/types';
import type { FoundationId } from '@/types';

// ─── Wonder Stories ──────────────────────────────────

describe('Wonder Stories', () => {
  it('should have exactly 8 stories, one per foundation', () => {
    expect(Object.keys(wonderStories)).toHaveLength(8);
    for (const id of FOUNDATION_ORDER) {
      expect(wonderStories[id]).toBeDefined();
      expect(wonderStories[id].foundationId).toBe(id);
    }
  });

  it('should have correct titles for each story', () => {
    const expectedTitles: Record<FoundationId, string> = {
      'unit-circle': "The Shadow's Circle",
      pythagorean: "The Spider's Theorem",
      trigonometry: "The Moon's Pull",
      'vector-calculus': 'The Fox in the Field',
      'set-theory': "The River's Name",
      'category-theory': "The Musician's Fingers",
      'information-theory': 'The Photo You Shared',
      'l-systems': "The Fern's Secret",
    };
    for (const id of FOUNDATION_ORDER) {
      expect(wonderStories[id].title).toBe(expectedTitles[id]);
    }
  });

  it('should contain no mathematical notation', () => {
    // Math notation patterns: =, +, -, *, /, ^, sqrt, sum, integral,
    // sin(), cos(), tan(), theta, pi (as standalone symbols), x^2, etc.
    const mathPatterns = [
      /\b\d+\s*[\+\-\*\/\^]\s*\d+/, // arithmetic: 3 + 4
      /\bsin\s*\(/, // sin(
      /\bcos\s*\(/, // cos(
      /\btan\s*\(/, // tan(
      /\blog\s*\(/, // log(
      /\bsqrt\s*\(/, // sqrt(
      /\b\w\s*=\s*\d/, // variable = number
      /\btheta\b/i, // theta
      /\bpi\b/, // pi (lowercase, standalone)
      /\d+\^/, // exponent notation
      /\bintegral\b/, // integral
      /\bsummation\b/, // summation
      /\bderivative\b/, // derivative
      /[∫∑∏∂∇√πθ]/, // unicode math symbols
      /\bf\(x\)/, // f(x)
    ];

    for (const id of FOUNDATION_ORDER) {
      const body = wonderStories[id].body;
      for (const pattern of mathPatterns) {
        expect(
          pattern.test(body),
          `Story "${wonderStories[id].title}" contains math notation matching ${pattern}`,
        ).toBe(false);
      }
    }
  });

  it('should have story bodies between 200 and 600 words', () => {
    for (const id of FOUNDATION_ORDER) {
      const wordCount = wonderStories[id].body.split(/\s+/).filter(Boolean).length;
      expect(
        wordCount,
        `Story "${wonderStories[id].title}" has ${wordCount} words (expected 200-600)`,
      ).toBeGreaterThanOrEqual(200);
      expect(
        wordCount,
        `Story "${wonderStories[id].title}" has ${wordCount} words (expected 200-600)`,
      ).toBeLessThanOrEqual(600);
    }
  });

  it('should have non-empty voiceTone and keyImage', () => {
    for (const id of FOUNDATION_ORDER) {
      expect(wonderStories[id].voiceTone.length).toBeGreaterThan(0);
      expect(wonderStories[id].keyImage.length).toBeGreaterThan(0);
    }
  });
});

// ─── Hundred Voices Bridges ──────────────────────────

describe('Hundred Voices Bridges', () => {
  it('should have exactly 8 bridges, one per foundation', () => {
    expect(Object.keys(hundredVoicesBridges)).toHaveLength(8);
    for (const id of FOUNDATION_ORDER) {
      expect(hundredVoicesBridges[id]).toBeDefined();
      expect(hundredVoicesBridges[id].foundationId).toBe(id);
    }
  });

  it('should have correct literary voices', () => {
    const expectedVoices: Record<FoundationId, string> = {
      'unit-circle': 'Ernest Hemingway',
      pythagorean: 'Virginia Woolf',
      trigonometry: 'Toni Morrison',
      'vector-calculus': 'Thomas Pynchon',
      'set-theory': 'Jorge Luis Borges',
      'category-theory': 'Ursula K. Le Guin',
      'information-theory': 'Italo Calvino',
      'l-systems': 'Percival Everett',
    };
    for (const id of FOUNDATION_ORDER) {
      expect(hundredVoicesBridges[id].literaryVoice).toBe(expectedVoices[id]);
    }
  });

  it('should contain no quoted text from the authors', () => {
    // Check for direct quotation marks around multi-word phrases
    // Single-word quotes are OK (scare quotes), but multi-word quotes suggest direct attribution
    const directQuotePattern = /[""\u201C\u201D][A-Z][^""\u201C\u201D]{20,}[""\u201C\u201D]/;
    for (const id of FOUNDATION_ORDER) {
      const desc = hundredVoicesBridges[id].description;
      // Allow for the phrase 'Hemingway once said that...' pattern which is paraphrase
      // We check for long quoted strings that look like direct attribution
      const matches = desc.match(directQuotePattern);
      if (matches) {
        // Filter out meta-references (talking about quotes in general)
        const isMeta = matches.some(
          (m) =>
            m.includes('said that') || m.includes('wrote that') || m.includes('claimed that'),
        );
        if (!isMeta) {
          expect(
            false,
            `Bridge for "${id}" appears to contain quoted text: ${matches[0]}`,
          ).toBe(true);
        }
      }
    }
  });

  it('should have non-empty connectionType and description', () => {
    for (const id of FOUNDATION_ORDER) {
      expect(hundredVoicesBridges[id].connectionType.length).toBeGreaterThan(0);
      expect(hundredVoicesBridges[id].description.length).toBeGreaterThan(30);
    }
  });

  it('should describe thematic connections, not biographical details', () => {
    // Bridges should talk about writing style and math parallels,
    // not about the author's life, birth dates, etc.
    const biographicalPatterns = [
      /\bborn\s+in\b/i,
      /\bdied\s+in\b/i,
      /\b\d{4}\s*-\s*\d{4}\b/, // date ranges
      /\bbiography\b/i,
      /\bnobel prize\b/i,
      /\bpulitzer\b/i,
    ];
    for (const id of FOUNDATION_ORDER) {
      const desc = hundredVoicesBridges[id].description;
      for (const pattern of biographicalPatterns) {
        expect(
          pattern.test(desc),
          `Bridge for "${id}" contains biographical content: ${pattern}`,
        ).toBe(false);
      }
    }
  });
});

// ─── Reflection Prompts ──────────────────────────────

describe('Reflection Prompts', () => {
  it('should have at least 20 prompts total (2 per foundation + 4 cross)', () => {
    expect(reflectionPrompts.length).toBeGreaterThanOrEqual(20);
  });

  it('should have at least 2 prompts per foundation', () => {
    for (const id of FOUNDATION_ORDER) {
      const count = reflectionPrompts.filter((p) => p.foundationId === id).length;
      expect(
        count,
        `Foundation "${id}" has only ${count} prompts (expected >= 2)`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have at least 4 cross-foundation prompts (no foundationId)', () => {
    const crossPrompts = reflectionPrompts.filter((p) => !p.foundationId);
    expect(crossPrompts.length).toBeGreaterThanOrEqual(4);
  });

  it('should have unique IDs', () => {
    const ids = reflectionPrompts.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have non-empty prompt text', () => {
    for (const prompt of reflectionPrompts) {
      expect(prompt.prompt.length).toBeGreaterThan(10);
    }
  });

  it('should end prompts with a question mark', () => {
    for (const prompt of reflectionPrompts) {
      expect(
        prompt.prompt.endsWith('?'),
        `Prompt "${prompt.id}" does not end with a question mark: "${prompt.prompt.slice(-30)}"`,
      ).toBe(true);
    }
  });
});
