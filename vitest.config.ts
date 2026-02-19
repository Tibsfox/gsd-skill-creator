import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
