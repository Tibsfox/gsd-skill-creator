/**
 * Tests for DashboardService.
 *
 * Uses constructor injection for the dashboard generator function,
 * avoiding complex module mocking. File watcher behaviour is tested
 * via the AbortController signal and directory existence checks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DashboardServiceConfig } from './types.js';
import { DashboardService } from './dashboard-service.js';
import type { DashboardGeneratorFn } from './dashboard-service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default test config with non-existent but harmless paths. */
function testConfig(overrides: Partial<DashboardServiceConfig> = {}): DashboardServiceConfig {
  return {
    planningDir: '/tmp/gsd-test-planning-' + Date.now(),
    outputDir: '/tmp/gsd-test-output-' + Date.now(),
    refreshInterval: 5000,
    debounceMs: 100,
    ...overrides,
  };
}

/** Mock generate function that succeeds with 1 page. */
function successGenerator(): DashboardGeneratorFn {
  return vi.fn().mockResolvedValue({
    pages: ['index.html'],
    skipped: [],
    errors: [],
    duration: 50,
  });
}

/** Mock generate function that throws. */
function failingGenerator(): DashboardGeneratorFn {
  return vi.fn().mockRejectedValue(new Error('Generator exploded'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DashboardService', () => {
  let config: DashboardServiceConfig;
  let mockGenerate: ReturnType<typeof successGenerator>;
  let service: DashboardService;

  beforeEach(() => {
    config = testConfig();
    mockGenerate = successGenerator();
    service = new DashboardService(config, mockGenerate);
  });

  afterEach(async () => {
    // Ensure watcher is cleaned up between tests
    await service.stop();
  });

  // ---------------------------------------------------------------
  // start() -- basic generation
  // ---------------------------------------------------------------
  describe('start()', () => {
    it('generates dashboard and returns running status', async () => {
      const status = await service.start();

      expect(status.process).toBe('running');
      expect(status.pagesGenerated).toBe(1);
      expect(status.lastGeneratedAt).toBeTypeOf('string');
      expect(mockGenerate).toHaveBeenCalledOnce();
    });

    it('is idempotent when already running', async () => {
      const first = await service.start();
      const second = await service.start();

      expect(second.process).toBe('running');
      expect(mockGenerate).toHaveBeenCalledOnce();
      expect(first.lastGeneratedAt).toBe(second.lastGeneratedAt);
    });
  });

  // ---------------------------------------------------------------
  // stop() -- cleanup
  // ---------------------------------------------------------------
  describe('stop()', () => {
    it('cleans up watcher and returns stopped status', async () => {
      await service.start();
      const status = await service.stop();

      expect(status.process).toBe('stopped');
      expect(status.watching).toBe(false);
    });

    it('is idempotent when already stopped', async () => {
      const status = await service.stop();

      expect(status.process).toBe('stopped');
      expect(status.watching).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // status() -- current state
  // ---------------------------------------------------------------
  describe('status()', () => {
    it('returns current state after start', async () => {
      await service.start();
      const status = service.status();

      expect(status.process).toBe('running');
      expect(status.pagesGenerated).toBe(1);
      expect(status.planningDir).toBe(config.planningDir);
      expect(status.outputDir).toBe(config.outputDir);
      expect(status.lastGeneratedAt).toBeTypeOf('string');
    });

    it('returns stopped state before start', () => {
      const status = service.status();

      expect(status.process).toBe('stopped');
      expect(status.pagesGenerated).toBe(0);
      expect(status.lastGeneratedAt).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------
  describe('error handling', () => {
    it('handles generation errors gracefully', async () => {
      const badGen = failingGenerator();
      const errorService = new DashboardService(config, badGen);

      const status = await errorService.start();

      // Should not throw; returns a status with 0 pages
      expect(status.process).toBe('running');
      expect(status.pagesGenerated).toBe(0);
      expect(status.lastGeneratedAt).toBeNull();

      await errorService.stop();
    });

    it('handles missing planning directory', async () => {
      const missingConfig = testConfig({
        planningDir: '/nonexistent/gsd-planning-dir-that-does-not-exist',
      });
      const missingService = new DashboardService(missingConfig, mockGenerate);

      const status = await missingService.start();

      // Watcher cannot start on a nonexistent directory
      expect(status.watching).toBe(false);
      expect(status.process).toBe('running');

      await missingService.stop();
    });
  });
});
