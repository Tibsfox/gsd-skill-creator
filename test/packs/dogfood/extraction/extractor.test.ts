import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...original,
    access: vi.fn(),
  };
});

import { extractPdf } from '../../../../src/packs/dogfood/extraction/extractor.js';
import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';

const mockExecFile = vi.mocked(execFile);
const mockAccess = vi.mocked(access);

function createMockPdfOutput(): string {
  const pages: string[] = [];

  // Page 1: Part I title
  pages.push('\n\nPart I: Seeing\n\nIntroductory text for Part I.\n');

  // Page 2: Chapter 1 title
  pages.push('\n\nChapter 1: Counting\n\nThe act of counting is fundamental to mathematics.\nNumbers form the basis of all measurement.\n');

  // Page 3: More chapter 1 content
  pages.push('We begin with natural numbers: 1, 2, 3, ...\nTheorem 1.1: Every natural number has a successor.\n');

  // Page 4: Chapter 2 title
  pages.push('\n\nChapter 2: Measuring\n\nMeasurement extends counting into the continuous.\nWe use real numbers to measure distances.\n');

  // Page 5: More chapter 2 content
  pages.push('The integral \u222B_a^b f(x) dx gives us area.\n');

  // Page 6: Part II title
  pages.push('\n\nPart II: Hearing\n\nSound and vibration.\n');

  // Page 7: Chapter 3 title
  pages.push('\n\nChapter 3: Vibration\n\nA vibrating string produces a wave.\nAs we saw in Chapter 1, numbers describe the frequency.\n');

  // Join with form-feed characters (page separator from pdftotext)
  return pages.join('\f');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('extractPdf', () => {
  describe('integration with mock pdftotext', () => {
    it('returns ExtractionResult with parts, chapters, rawPages, warnings', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockExecFile.mockImplementation((_cmd: any, _args: any, cb: any) => {
        cb(null, createMockPdfOutput(), '');
        return {} as any;
      });

      const result = await extractPdf({ sourcePath: '/path/to/test.pdf' });

      expect(result).toHaveProperty('parts');
      expect(result).toHaveProperty('chapters');
      expect(result).toHaveProperty('rawPages');
      expect(result).toHaveProperty('warnings');
    });

    it('detects parts from mock pdftotext output', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockExecFile.mockImplementation((_cmd: any, _args: any, cb: any) => {
        cb(null, createMockPdfOutput(), '');
        return {} as any;
      });

      const result = await extractPdf({ sourcePath: '/path/to/test.pdf' });

      expect(result.parts.length).toBe(2);
      expect(result.parts[0].title).toBe('Seeing');
      expect(result.parts[1].title).toBe('Hearing');
    });

    it('detects chapters from mock pdftotext output', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockExecFile.mockImplementation((_cmd: any, _args: any, cb: any) => {
        cb(null, createMockPdfOutput(), '');
        return {} as any;
      });

      const result = await extractPdf({ sourcePath: '/path/to/test.pdf' });

      expect(result.chapters.length).toBe(3);
      expect(result.chapters[0].title).toBe('Counting');
      expect(result.chapters[1].title).toBe('Measuring');
      expect(result.chapters[2].title).toBe('Vibration');
    });

    it('splits pages by form-feed character', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockExecFile.mockImplementation((_cmd: any, _args: any, cb: any) => {
        cb(null, createMockPdfOutput(), '');
        return {} as any;
      });

      const result = await extractPdf({ sourcePath: '/path/to/test.pdf' });

      expect(result.rawPages.length).toBe(7);
    });
  });

  describe('error handling', () => {
    it('throws descriptive error for missing PDF file', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      await expect(
        extractPdf({ sourcePath: '/nonexistent/file.pdf' })
      ).rejects.toThrow(/PDF file not found/);
    });

    it('throws with installation instructions when pdftotext not found', async () => {
      mockAccess.mockResolvedValue(undefined);
      const err = new Error('spawn pdftotext ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      mockExecFile.mockImplementation((_cmd: any, _args: any, cb: any) => {
        cb(err, '', '');
        return {} as any;
      });

      await expect(
        extractPdf({ sourcePath: '/path/to/test.pdf' })
      ).rejects.toThrow(/pdftotext not found.*poppler/i);
    });

    it('returns ExtractionResult with warning for empty PDF output', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockExecFile.mockImplementation((_cmd: any, _args: any, cb: any) => {
        cb(null, '', '');
        return {} as any;
      });

      const result = await extractPdf({ sourcePath: '/path/to/test.pdf' });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => /empty/i.test(w))).toBe(true);
    });
  });

  describe('config handling', () => {
    it('applies default config values when partial config provided', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockExecFile.mockImplementation((_cmd: any, _args: any, cb: any) => {
        cb(null, createMockPdfOutput(), '');
        return {} as any;
      });

      // Should not throw — defaults fill in missing fields
      const result = await extractPdf({ sourcePath: '/path/to/test.pdf' });
      expect(result).toBeDefined();
    });

    it('sourcePath is required (throws if missing)', async () => {
      await expect(
        // @ts-expect-error - testing missing required field
        extractPdf({})
      ).rejects.toThrow();
    });
  });
});
