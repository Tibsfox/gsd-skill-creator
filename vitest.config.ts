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
    coverage: {
      provider: 'v8',
      include: ['.college/**/*.ts'],
      exclude: [
        '.college/**/*.test.ts',
        '.college/**/*.integration.test.ts',
        '.college/departments/test-department/**',
      ],
      reporter: ['text', 'text-summary', 'json-summary'],
      reportsDirectory: '.college/coverage',
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});
