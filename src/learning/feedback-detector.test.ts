import { describe, it, expect } from 'vitest';
import type { Change } from '../types/learning.js';
import {
  analyzeCorrection,
  countWords,
  isFormattingOnly,
  FeedbackDetector,
} from './feedback-detector.js';

describe('analyzeCorrection', () => {
  it('should return similarity = 1.0 for identical strings', () => {
    const result = analyzeCorrection('hello world', 'hello world');
    expect(result.similarity).toBe(1.0);
    expect(result.isSignificant).toBe(false);
    expect(result.addedWords).toBe(0);
    expect(result.removedWords).toBe(0);
    expect(result.keptWords).toBe(2);
  });

  it('should return similarity = 0 for completely different strings', () => {
    const result = analyzeCorrection('hello world', 'goodbye universe');
    expect(result.similarity).toBe(0);
    expect(result.isSignificant).toBe(true);
    expect(result.removedWords).toBe(2);
    expect(result.addedWords).toBe(2);
    expect(result.keptWords).toBe(0);
  });

  it('should calculate partial overlap correctly', () => {
    const result = analyzeCorrection('the quick brown fox', 'the slow brown fox');
    // 'the', 'brown', 'fox' kept (3 words), 'quick' removed (1 word)
    expect(result.keptWords).toBe(3);
    expect(result.removedWords).toBe(1);
    expect(result.addedWords).toBe(1); // 'slow' added
    expect(result.similarity).toBe(0.75); // 3 / (3 + 1) = 0.75
    expect(result.isSignificant).toBe(false); // 0.75 >= 0.7 threshold
  });

  it('should handle empty original string', () => {
    const result = analyzeCorrection('', 'new content');
    expect(result.originalLength).toBe(0);
    expect(result.addedWords).toBe(2);
    expect(result.similarity).toBe(0);
    expect(result.isSignificant).toBe(true);
  });

  it('should handle empty final string', () => {
    const result = analyzeCorrection('some content', '');
    expect(result.finalLength).toBe(0);
    expect(result.removedWords).toBe(2);
    expect(result.similarity).toBe(0);
    expect(result.isSignificant).toBe(true);
  });

  it('should handle both strings empty', () => {
    const result = analyzeCorrection('', '');
    expect(result.similarity).toBe(1.0);
    expect(result.isSignificant).toBe(false);
  });

  it('should respect custom threshold', () => {
    // 50% similarity - significant with default 0.7, not significant with 0.4
    const result1 = analyzeCorrection('one two three four', 'one two five six', 0.7);
    expect(result1.isSignificant).toBe(true); // 0.5 < 0.7

    const result2 = analyzeCorrection('one two three four', 'one two five six', 0.4);
    expect(result2.isSignificant).toBe(false); // 0.5 >= 0.4
  });
});

describe('countWords', () => {
  it('should count words correctly', () => {
    expect(countWords('hello world')).toBe(2);
    expect(countWords('one two three')).toBe(3);
    expect(countWords('')).toBe(0);
    expect(countWords('single')).toBe(1);
  });

  it('should handle multiple spaces', () => {
    expect(countWords('hello    world')).toBe(2);
    expect(countWords('  leading spaces')).toBe(2);
    expect(countWords('trailing spaces  ')).toBe(2);
  });
});

describe('isFormattingOnly', () => {
  it('should return true for whitespace-only changes', () => {
    const changes: Change[] = [
      { value: 'hello' },
      { value: '  ', added: true },
      { value: 'world' },
    ];
    expect(isFormattingOnly(changes)).toBe(true);
  });

  it('should return true for punctuation-only changes', () => {
    const changes: Change[] = [
      { value: 'hello' },
      { value: ',', added: true },
      { value: ' world' },
    ];
    expect(isFormattingOnly(changes)).toBe(true);
  });

  it('should return false for content changes', () => {
    const changes: Change[] = [
      { value: 'hello' },
      { value: ' world', removed: true },
      { value: ' universe', added: true },
    ];
    expect(isFormattingOnly(changes)).toBe(false);
  });

  it('should handle mixed formatting and content changes', () => {
    const changes: Change[] = [
      { value: '  ', added: true },
      { value: 'word', added: true },
    ];
    expect(isFormattingOnly(changes)).toBe(false);
  });
});

describe('FeedbackDetector', () => {
  describe('detect', () => {
    it('should return DetectionResult for significant correction', () => {
      const detector = new FeedbackDetector({ threshold: 0.9, minChangedWords: 3 });
      const result = detector.detect(
        'The old approach was simple and basic',
        'The new approach is sophisticated and comprehensive with validation',
        'my-skill'
      );

      expect(result).not.toBeNull();
      expect(result!.skillName).toBe('my-skill');
      expect(result!.analysis.isSignificant).toBe(true);
      expect(result!.timestamp).toBeDefined();
    });

    it('should return null for minor edit (high similarity)', () => {
      const detector = new FeedbackDetector();
      const result = detector.detect(
        'The quick brown fox jumps over the lazy dog',
        'The quick brown fox jumps over the sleepy dog',
        'my-skill'
      );

      // Only 1 word changed out of 9 - not significant
      expect(result).toBeNull();
    });

    it('should return null when below minChangedWords', () => {
      const detector = new FeedbackDetector({ minChangedWords: 5 });
      const result = detector.detect(
        'hello world',
        'goodbye world',
        'my-skill'
      );

      // Only 2 words changed, threshold is 5
      expect(result).toBeNull();
    });

    it('should respect custom threshold', () => {
      const detector = new FeedbackDetector({ threshold: 0.9, minChangedWords: 1 });
      const result = detector.detect(
        'hello world here',
        'hello world there',
        'my-skill'
      );

      // With 0.9 threshold, even small changes are significant
      expect(result).not.toBeNull();
    });

    it('should return null for formatting-only changes', () => {
      const detector = new FeedbackDetector({ minChangedWords: 0, threshold: 1 });
      const result = detector.detect(
        'hello world',
        'hello  world',
        'my-skill'
      );

      expect(result).toBeNull();
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      const detector = new FeedbackDetector();
      expect(detector.getConfig().threshold).toBe(0.7);

      detector.configure({ threshold: 0.5 });
      expect(detector.getConfig().threshold).toBe(0.5);
    });
  });

  describe('real-world examples', () => {
    it('should detect code variable rename', () => {
      const detector = new FeedbackDetector({ minChangedWords: 1 });
      const original = 'const data = fetchData(); processData(data);';
      const corrected = 'const userData = fetchUserData(); processUserData(userData);';

      const result = detector.detect(original, corrected, 'code-skill');
      expect(result).not.toBeNull();
    });

    it('should detect significant text revision', () => {
      const detector = new FeedbackDetector({ minChangedWords: 3, threshold: 0.8 });
      const original = 'Process the data quickly without validation';
      const corrected = 'Process the data carefully with full validation and logging';

      const result = detector.detect(original, corrected, 'code-skill');
      expect(result).not.toBeNull();
    });

    it('should detect complete rewrite', () => {
      const detector = new FeedbackDetector();
      const original = 'Use the basic approach for simplicity.';
      const corrected = 'Implement the advanced algorithm with proper error handling and logging.';

      const result = detector.detect(original, corrected, 'writing-skill');
      expect(result).not.toBeNull();
      expect(result!.analysis.similarity).toBeLessThan(0.3);
    });
  });
});
