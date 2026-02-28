import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Single test directory: test/ (legacy tests dir removed in Phase 483)
    // Increase timeout for tests that load embeddings models
    testTimeout: 10000,
    globals: true,
    exclude: [
      'dist/**',
      'desktop/**',
      '.claude/**',
      'project-claude/**',
      'node_modules/**',
    ],
  },
});
