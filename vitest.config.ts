import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Increase timeout for tests that load embeddings models
    testTimeout: 10000,
    globals: true,
  },
});
