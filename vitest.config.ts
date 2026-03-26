import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Increase timeout for tests that load embeddings models
    testTimeout: 10000,
    globals: true,
    projects: [
      // Root project — existing tests (src/, .college/, etc.)
      {
        test: {
          name: 'root',
          globals: true,
          include: [
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
            '.college/**/*.test.ts',
            '.college/**/*.test.tsx',
            'tests/**/*.test.ts',
          ],
          exclude: [
            'dist/**',
            'desktop/**',
            'the-space-between-engine/**',
            'tests/ipc-commands.test.ts',
            '.claude/**',
            'project-claude/**',
            'node_modules/**',
            '**/*.integration.test.ts',
            '**/*.system.test.ts',
          ],
        },
      },
      // The Space Between Engine — needs @/ alias and jsdom
      {
        resolve: {
          alias: {
            '@': resolve(import.meta.dirname!, './the-space-between-engine/src'),
          },
        },
        test: {
          name: 'space-between',
          root: './the-space-between-engine',
          globals: true,
          environment: 'jsdom',
          include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
          exclude: ['**/node_modules/**'],
        },
      },
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
