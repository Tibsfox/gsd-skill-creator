import { describe, it, expect } from 'vitest';
import { normalizePaths } from './path-normalizer.js';

// ============================================================================
// normalizePaths() tests
// ============================================================================

describe('normalizePaths', () => {
  it('converts references backslash paths to forward slashes', () => {
    const input = 'See references\\REFERENCE.md for details';
    const result = normalizePaths(input);
    expect(result).toBe('See references/REFERENCE.md for details');
  });

  it('converts scripts backslash paths to forward slashes', () => {
    const input = 'Run scripts\\validate.sh to check';
    const result = normalizePaths(input);
    expect(result).toBe('Run scripts/validate.sh to check');
  });

  it('converts assets backslash paths to forward slashes', () => {
    const input = 'Image at assets\\image.png is used';
    const result = normalizePaths(input);
    expect(result).toBe('Image at assets/image.png is used');
  });

  it('handles nested paths', () => {
    const input = 'See references\\sub\\file.md for info';
    const result = normalizePaths(input);
    expect(result).toBe('See references/sub/file.md for info');
  });

  it('does NOT modify non-path backslashes (regex patterns)', () => {
    const input = 'Use regex \\d+ to match numbers and \\w+ for words';
    const result = normalizePaths(input);
    expect(result).toBe('Use regex \\d+ to match numbers and \\w+ for words');
  });

  it('handles mixed forward/backslash paths', () => {
    const input = 'See references\\sub/file.md';
    const result = normalizePaths(input);
    expect(result).toBe('See references/sub/file.md');
  });

  it('handles content with no paths (returns unchanged)', () => {
    const input = 'This is plain content with no path references.';
    const result = normalizePaths(input);
    expect(result).toBe(input);
  });

  it('handles markdown link syntax', () => {
    const input = '[See guide](references\\file.md)';
    const result = normalizePaths(input);
    expect(result).toBe('[See guide](references/file.md)');
  });

  it('handles multiple paths in the same content', () => {
    const input = 'See references\\guide.md and scripts\\build.sh and assets\\logo.png';
    const result = normalizePaths(input);
    expect(result).toBe('See references/guide.md and scripts/build.sh and assets/logo.png');
  });
});
