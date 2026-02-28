import { describe, it, expect } from 'vitest';
import {
  TestExpectationSchema,
  TestDifficultySchema,
  TestCaseInputSchema,
  validateTestCaseInput,
  type ValidationWarning,
} from './test-validation.js';

describe('TestExpectationSchema', () => {
  it('accepts valid expectation values', () => {
    expect(TestExpectationSchema.parse('positive')).toBe('positive');
    expect(TestExpectationSchema.parse('negative')).toBe('negative');
    expect(TestExpectationSchema.parse('edge-case')).toBe('edge-case');
  });

  it('rejects invalid expectation values', () => {
    expect(() => TestExpectationSchema.parse('unknown')).toThrow();
    expect(() => TestExpectationSchema.parse('')).toThrow();
    expect(() => TestExpectationSchema.parse(null)).toThrow();
    expect(() => TestExpectationSchema.parse(undefined)).toThrow();
  });
});

describe('TestDifficultySchema', () => {
  it('accepts valid difficulty values', () => {
    expect(TestDifficultySchema.parse('easy')).toBe('easy');
    expect(TestDifficultySchema.parse('medium')).toBe('medium');
    expect(TestDifficultySchema.parse('hard')).toBe('hard');
  });

  it('rejects invalid difficulty values', () => {
    expect(() => TestDifficultySchema.parse('impossible')).toThrow();
    expect(() => TestDifficultySchema.parse('')).toThrow();
  });
});

describe('TestCaseInputSchema', () => {
  describe('valid inputs', () => {
    it('accepts complete test case with all fields', () => {
      const input = {
        prompt: 'Can you help me commit my changes to the auth module?',
        expected: 'positive',
        description: 'Should activate for commit requests',
        tags: ['commit', 'auth'],
        difficulty: 'easy',
        minConfidence: 0.7,
        maxConfidence: 0.3,
        reason: 'User explicitly mentions commit',
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('accepts minimal test case with only required fields', () => {
      const input = {
        prompt: 'Help me with this code',
        expected: 'negative',
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prompt).toBe('Help me with this code');
        expect(result.data.expected).toBe('negative');
        expect(result.data.description).toBeUndefined();
        expect(result.data.tags).toBeUndefined();
      }
    });

    it('accepts edge-case expectation', () => {
      const input = {
        prompt: 'commit maybe?',
        expected: 'edge-case',
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('accepts empty tags array', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'positive',
        tags: [],
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });

    it('allows extra fields (passthrough)', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'positive',
        customField: 'custom value',
        anotherExtra: 123,
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).customField).toBe('custom value');
        expect((result.data as any).anotherExtra).toBe(123);
      }
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty prompt', () => {
      const input = {
        prompt: '',
        expected: 'positive',
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing expected field', () => {
      const input = {
        prompt: 'Test prompt',
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects invalid expected value', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'invalid',
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects minConfidence > 1', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'positive',
        minConfidence: 1.5,
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects minConfidence < 0', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'positive',
        minConfidence: -0.5,
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects maxConfidence > 1', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'negative',
        maxConfidence: 1.1,
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects maxConfidence < 0', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'negative',
        maxConfidence: -0.1,
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects description over 500 chars', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'positive',
        description: 'a'.repeat(501),
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects reason over 200 chars', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'negative',
        reason: 'a'.repeat(201),
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('null and undefined handling', () => {
    it('rejects null input', () => {
      const result = TestCaseInputSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('rejects undefined input', () => {
      const result = TestCaseInputSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('accepts undefined optional fields', () => {
      const input = {
        prompt: 'Test prompt',
        expected: 'positive',
        description: undefined,
        tags: undefined,
        difficulty: undefined,
        minConfidence: undefined,
        maxConfidence: undefined,
        reason: undefined,
      };

      const result = TestCaseInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});

describe('validateTestCaseInput', () => {
  describe('valid inputs', () => {
    it('returns valid=true with data for valid input', () => {
      const input = {
        prompt: 'Can you commit these changes?',
        expected: 'positive',
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.prompt).toBe('Can you commit these changes?');
      expect(result.data?.expected).toBe('positive');
      expect(result.errors).toBeUndefined();
    });

    it('returns empty warnings for normal input', () => {
      const input = {
        prompt: 'A reasonable length prompt that should not trigger any warnings',
        expected: 'positive',
        minConfidence: 0.7,
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });
  });

  describe('invalid inputs', () => {
    it('returns valid=false with errors for invalid input', () => {
      const input = {
        prompt: '',
        expected: 'positive',
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.data).toBeUndefined();
    });

    it('returns valid=false with errors for missing required field', () => {
      const input = {
        prompt: 'Test prompt',
        // missing expected
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('includes field path in error messages', () => {
      const input = {
        prompt: 'Test',
        expected: 'invalid-value',
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes('expected'))).toBe(true);
    });
  });

  describe('soft limit warnings', () => {
    it('warns on short prompt (<5 chars) but returns valid=true', () => {
      const input = {
        prompt: 'Hi',
        expected: 'positive',
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.field === 'prompt' && w.message.includes('short'))).toBe(
        true
      );
    });

    it('warns on long prompt (>500 chars) but returns valid=true', () => {
      const input = {
        prompt: 'a'.repeat(501),
        expected: 'positive',
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some((w) => w.field === 'prompt' && w.message.includes('long'))).toBe(
        true
      );
    });

    it('warns on low minConfidence (<0.3) but returns valid=true', () => {
      const input = {
        prompt: 'Test prompt for skill',
        expected: 'positive',
        minConfidence: 0.2,
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(
        result.warnings!.some(
          (w) => w.field === 'minConfidence' && w.message.includes('permissive')
        )
      ).toBe(true);
    });

    it('warns on high minConfidence (>0.95) but returns valid=true', () => {
      const input = {
        prompt: 'Test prompt for skill',
        expected: 'positive',
        minConfidence: 0.98,
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(
        result.warnings!.some((w) => w.field === 'minConfidence' && w.message.includes('strict'))
      ).toBe(true);
    });

    it('warns on low maxConfidence (<0.3) but returns valid=true', () => {
      const input = {
        prompt: 'Test prompt for skill',
        expected: 'negative',
        maxConfidence: 0.1,
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(
        result.warnings!.some((w) => w.field === 'maxConfidence' && w.message.includes('strict'))
      ).toBe(true);
    });

    it('warns on high maxConfidence (>0.95) but returns valid=true', () => {
      const input = {
        prompt: 'Test prompt for skill',
        expected: 'negative',
        maxConfidence: 0.99,
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(
        result.warnings!.some(
          (w) => w.field === 'maxConfidence' && w.message.includes('permissive')
        )
      ).toBe(true);
    });

    it('returns multiple warnings when applicable', () => {
      const input = {
        prompt: 'Hi', // short prompt warning
        expected: 'positive',
        minConfidence: 0.1, // low minConfidence warning
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBe(2);
      expect(result.warnings!.some((w) => w.field === 'prompt')).toBe(true);
      expect(result.warnings!.some((w) => w.field === 'minConfidence')).toBe(true);
    });

    it('does not warn for values at boundaries', () => {
      // Test values exactly at boundaries (5 chars, 500 chars, 0.3, 0.95)
      const input = {
        prompt: 'abcde', // exactly 5 chars
        expected: 'positive',
        minConfidence: 0.3, // exactly at lower boundary
      };

      const result = validateTestCaseInput(input);
      expect(result.valid).toBe(true);
      // Should not have warnings for minConfidence at 0.3
      if (result.warnings) {
        expect(result.warnings.some((w) => w.field === 'minConfidence')).toBe(false);
      }
    });
  });
});
