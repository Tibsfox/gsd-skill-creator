import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* ---- Module mocks ---- */

const mockBuild = vi.fn();
const mockDryRun = vi.fn();
const mockDeploy = vi.fn();
const mockRunAudit = vi.fn();

vi.mock('../../src/site/build', () => ({
  build: (...args: unknown[]) => mockBuild(...args),
}));

vi.mock('../../src/site/deploy', () => ({
  dryRun: (...args: unknown[]) => mockDryRun(...args),
  deploy: (...args: unknown[]) => mockDeploy(...args),
}));

vi.mock('../../src/site/audit', () => ({
  runAudit: (...args: unknown[]) => mockRunAudit(...args),
}));

import { siteCommand } from '../../src/cli/commands/site';

describe('siteCommand', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  /* ---- Build subcommand ---- */

  describe('build subcommand', () => {
    it('calls build() with default options and returns 0', async () => {
      mockBuild.mockResolvedValue({
        pagesBuilt: 42,
        pagesSkipped: 3,
        warnings: [],
        elapsedMs: 150,
        outputDir: 'www',
      });

      const code = await siteCommand(['build']);

      expect(code).toBe(0);
      expect(mockBuild).toHaveBeenCalledOnce();
      const opts = mockBuild.mock.calls[0][0];
      expect(opts.outputDir).toBe('www');
      expect(opts.includeDrafts).toBeFalsy();
      expect(opts.clean).toBeFalsy();
    });

    it('passes --output flag to build()', async () => {
      mockBuild.mockResolvedValue({
        pagesBuilt: 10,
        pagesSkipped: 0,
        warnings: [],
        elapsedMs: 50,
        outputDir: 'dist',
      });

      const code = await siteCommand(['build', '--output=dist']);

      expect(code).toBe(0);
      const opts = mockBuild.mock.calls[0][0];
      expect(opts.outputDir).toBe('dist');
    });

    it('passes --drafts flag to build()', async () => {
      mockBuild.mockResolvedValue({
        pagesBuilt: 15,
        pagesSkipped: 0,
        warnings: [],
        elapsedMs: 80,
        outputDir: 'www',
      });

      const code = await siteCommand(['build', '--drafts']);

      expect(code).toBe(0);
      const opts = mockBuild.mock.calls[0][0];
      expect(opts.includeDrafts).toBe(true);
    });

    it('passes --clean flag to build()', async () => {
      mockBuild.mockResolvedValue({
        pagesBuilt: 5,
        pagesSkipped: 0,
        warnings: [],
        elapsedMs: 30,
        outputDir: 'www',
      });

      const code = await siteCommand(['build', '--clean']);

      expect(code).toBe(0);
      const opts = mockBuild.mock.calls[0][0];
      expect(opts.clean).toBe(true);
    });

    it('prints page count and elapsed time', async () => {
      mockBuild.mockResolvedValue({
        pagesBuilt: 42,
        pagesSkipped: 3,
        warnings: [],
        elapsedMs: 150,
        outputDir: 'www',
      });

      await siteCommand(['build']);

      const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('42');
      expect(output).toContain('150');
    });

    it('prints warnings if any', async () => {
      mockBuild.mockResolvedValue({
        pagesBuilt: 10,
        pagesSkipped: 0,
        warnings: ['Missing template for special page'],
        elapsedMs: 50,
        outputDir: 'www',
      });

      await siteCommand(['build']);

      const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('Missing template for special page');
    });

    it('aliases "b" to build', async () => {
      mockBuild.mockResolvedValue({
        pagesBuilt: 1,
        pagesSkipped: 0,
        warnings: [],
        elapsedMs: 10,
        outputDir: 'www',
      });

      const code = await siteCommand(['b']);

      expect(code).toBe(0);
      expect(mockBuild).toHaveBeenCalledOnce();
    });
  });

  /* ---- Deploy subcommand ---- */

  describe('deploy subcommand', () => {
    it('calls dryRun() with --dry-run flag', async () => {
      mockDryRun.mockResolvedValue({
        files: ['index.html', 'about/index.html'],
        totalSize: 2048,
      });

      const code = await siteCommand(['deploy', '--dry-run']);

      expect(code).toBe(0);
      expect(mockDryRun).toHaveBeenCalledOnce();
    });

    it('returns 1 without --dry-run (safety)', async () => {
      const code = await siteCommand(['deploy']);

      expect(code).toBe(1);
      expect(mockDeploy).not.toHaveBeenCalled();
    });

    it('prints file list for dry run', async () => {
      mockDryRun.mockResolvedValue({
        files: ['index.html', 'about/index.html'],
        totalSize: 2048,
      });

      await siteCommand(['deploy', '--dry-run']);

      const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('index.html');
      expect(output).toContain('2048');
    });

    it('aliases "d" to deploy', async () => {
      mockDryRun.mockResolvedValue({
        files: ['index.html'],
        totalSize: 512,
      });

      const code = await siteCommand(['d', '--dry-run']);

      expect(code).toBe(0);
      expect(mockDryRun).toHaveBeenCalledOnce();
    });
  });

  /* ---- Audit subcommand ---- */

  describe('audit subcommand', () => {
    it('calls runAudit() and returns 0 when all checks pass', async () => {
      mockRunAudit.mockResolvedValue({
        passed: true,
        checks: [
          { name: 'css-size', passed: true, details: 'CSS under limit' },
          { name: 'js-size', passed: true, details: 'JS under limit' },
        ],
        warnings: [],
      });

      const code = await siteCommand(['audit']);

      expect(code).toBe(0);
      expect(mockRunAudit).toHaveBeenCalledOnce();
    });

    it('returns 1 when any audit check fails', async () => {
      mockRunAudit.mockResolvedValue({
        passed: false,
        checks: [
          { name: 'css-size', passed: true, details: 'CSS under limit' },
          { name: 'js-size', passed: false, details: 'JS exceeds 5KB limit' },
        ],
        warnings: [],
      });

      const code = await siteCommand(['audit']);

      expect(code).toBe(1);
    });

    it('prints each check result', async () => {
      mockRunAudit.mockResolvedValue({
        passed: true,
        checks: [
          { name: 'css-size', passed: true, details: 'CSS 3.2KB < 15KB' },
          { name: 'js-size', passed: true, details: 'JS 1.1KB < 5KB' },
        ],
        warnings: [],
      });

      await siteCommand(['audit']);

      const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('css-size');
      expect(output).toContain('js-size');
    });

    it('prints warnings from audit', async () => {
      mockRunAudit.mockResolvedValue({
        passed: true,
        checks: [],
        warnings: ['No sitemap.xml found'],
      });

      await siteCommand(['audit']);

      const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('No sitemap.xml found');
    });

    it('aliases "a" to audit', async () => {
      mockRunAudit.mockResolvedValue({
        passed: true,
        checks: [],
        warnings: [],
      });

      const code = await siteCommand(['a']);

      expect(code).toBe(0);
      expect(mockRunAudit).toHaveBeenCalledOnce();
    });
  });

  /* ---- Help / error cases ---- */

  describe('help and error cases', () => {
    it('prints usage help and returns 0 with no subcommand', async () => {
      const code = await siteCommand([]);

      expect(code).toBe(0);
      const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('build');
      expect(output).toContain('deploy');
      expect(output).toContain('audit');
    });

    it('prints usage help and returns 1 for unknown subcommand', async () => {
      const code = await siteCommand(['invalid']);

      expect(code).toBe(1);
      const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
      expect(output).toContain('build');
    });
  });
});
