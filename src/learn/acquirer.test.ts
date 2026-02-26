// === sc:learn Source Acquirer — TDD Tests ===
//
// RED phase: all tests written before implementation.
// Tests source type detection, local file acquisition, archive handling,
// GitHub URL detection, and staging area management.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  acquireSource,
  detectSourceType,
  filterByScope,
  isSupportedExtension,
  type AcquisitionResult,
  type AcquisitionSource,
  type SourceType,
  type StagedContent,
} from './acquirer.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'acquirer-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// === Group 1: Source type detection ===

describe('source type detection', () => {
  it('detects local markdown file', () => {
    const result = detectSourceType('/path/to/doc.md');
    expect(result.type).toBe('local-file');
    expect(result.familiarity).toBe('HOME');
  });

  it('detects local PDF file', () => {
    const result = detectSourceType('/path/to/doc.pdf');
    expect(result.type).toBe('local-file');
    expect(result.familiarity).toBe('HOME');
  });

  it('detects local docx file', () => {
    const result = detectSourceType('/path/to/doc.docx');
    expect(result.type).toBe('local-file');
    expect(result.familiarity).toBe('HOME');
  });

  it('detects local txt file', () => {
    const result = detectSourceType('/path/to/doc.txt');
    expect(result.type).toBe('local-file');
    expect(result.familiarity).toBe('HOME');
  });

  it('detects local epub file', () => {
    const result = detectSourceType('/path/to/doc.epub');
    expect(result.type).toBe('local-file');
    expect(result.familiarity).toBe('HOME');
  });

  it('detects zip archive', () => {
    const result = detectSourceType('/path/to/archive.zip');
    expect(result.type).toBe('archive');
    expect(result.familiarity).toBe('HOME');
  });

  it('detects tgz archive', () => {
    const result = detectSourceType('/path/to/archive.tgz');
    expect(result.type).toBe('archive');
    expect(result.familiarity).toBe('HOME');
  });

  it('detects tar.gz archive', () => {
    const result = detectSourceType('/path/to/archive.tar.gz');
    expect(result.type).toBe('archive');
    expect(result.familiarity).toBe('HOME');
  });

  it('detects GitHub URL', () => {
    const result = detectSourceType('https://github.com/user/repo');
    expect(result.type).toBe('github-url');
    expect(result.familiarity).toBe('STRANGER');
  });

  it('detects generic URL', () => {
    const result = detectSourceType('https://example.com/doc.pdf');
    expect(result.type).toBe('url');
    expect(result.familiarity).toBe('STRANGER');
  });

  it('rejects unsupported extension', () => {
    expect(() => detectSourceType('/path/to/file.exe')).toThrow(/unsupported/i);
  });
});

// === Group 2: Local file acquisition ===

describe('local file acquisition', () => {
  it('acquires markdown file', async () => {
    const mdPath = path.join(tmpDir, 'doc.md');
    fs.writeFileSync(mdPath, '# Hello World\n\nSome content here.');

    const result = await acquireSource(mdPath, { stagingDir: path.join(tmpDir, 'staging') });

    expect(result.staged).toHaveLength(1);
    expect(result.staged[0].content).toBe('# Hello World\n\nSome content here.');
    expect(result.source.familiarity).toBe('HOME');
  });

  it('acquires txt file', async () => {
    const txtPath = path.join(tmpDir, 'doc.txt');
    fs.writeFileSync(txtPath, 'Plain text content.');

    const result = await acquireSource(txtPath, { stagingDir: path.join(tmpDir, 'staging') });

    expect(result.staged).toHaveLength(1);
    expect(result.staged[0].content).toBe('Plain text content.');
  });

  it('rejects file exceeding maxFileSize', async () => {
    const bigPath = path.join(tmpDir, 'big.txt');
    // Create a file that exceeds the size limit
    fs.writeFileSync(bigPath, 'x'.repeat(1024));

    await expect(
      acquireSource(bigPath, { stagingDir: path.join(tmpDir, 'staging'), maxFileSize: 512 })
    ).rejects.toThrow(/exceeds/i);
  });

  it('rejects non-existent file', async () => {
    await expect(
      acquireSource('/nonexistent/path/doc.md', { stagingDir: path.join(tmpDir, 'staging') })
    ).rejects.toThrow(/not found|ENOENT/i);
  });

  it('stages content with provenance metadata', async () => {
    const mdPath = path.join(tmpDir, 'provenance.md');
    fs.writeFileSync(mdPath, 'Provenance test content.');
    const stagingDir = path.join(tmpDir, 'staging');

    const result = await acquireSource(mdPath, { stagingDir });

    // ISO timestamp
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Staging dir exists on disk
    expect(fs.existsSync(result.stagingDir)).toBe(true);
    // Source input matches original path
    expect(result.source.input).toBe(mdPath);
  });
});

// === Group 3: Archive acquisition ===

describe('archive acquisition', () => {
  it('acquires files from zip archive', async () => {
    // Create a zip archive with 2 .md files using the zip CLI
    const archiveDir = path.join(tmpDir, 'archive-src');
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(path.join(archiveDir, 'file1.md'), '# File One');
    fs.writeFileSync(path.join(archiveDir, 'file2.md'), '# File Two');

    const zipPath = path.join(tmpDir, 'test.zip');
    const { execSync } = await import('node:child_process');
    execSync(`cd "${archiveDir}" && zip "${zipPath}" file1.md file2.md`, { stdio: 'pipe' });

    const result = await acquireSource(zipPath, { stagingDir: path.join(tmpDir, 'staging') });

    expect(result.staged.length).toBeGreaterThanOrEqual(2);
    const filenames = result.staged.map(s => s.filename);
    expect(filenames).toContain('file1.md');
    expect(filenames).toContain('file2.md');
  });

  it('filters archive contents to supported types', async () => {
    const archiveDir = path.join(tmpDir, 'archive-filter');
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(path.join(archiveDir, 'readme.md'), '# Readme');
    fs.writeFileSync(path.join(archiveDir, 'binary.exe'), 'fake-binary');

    const zipPath = path.join(tmpDir, 'filter.zip');
    const { execSync } = await import('node:child_process');
    execSync(`cd "${archiveDir}" && zip "${zipPath}" readme.md binary.exe`, { stdio: 'pipe' });

    const result = await acquireSource(zipPath, { stagingDir: path.join(tmpDir, 'staging') });

    const filenames = result.staged.map(s => s.filename);
    expect(filenames).toContain('readme.md');
    expect(filenames).not.toContain('binary.exe');
    // Unsupported file should appear in errors
    expect(result.errors.some(e => e.file.includes('binary.exe') && /unsupported/i.test(e.reason))).toBe(true);
  });

  it('rejects archive exceeding maxTotalSize', async () => {
    const archiveDir = path.join(tmpDir, 'archive-big');
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(path.join(archiveDir, 'big.md'), 'x'.repeat(2048));

    const zipPath = path.join(tmpDir, 'big.zip');
    const { execSync } = await import('node:child_process');
    execSync(`cd "${archiveDir}" && zip "${zipPath}" big.md`, { stdio: 'pipe' });

    await expect(
      acquireSource(zipPath, { stagingDir: path.join(tmpDir, 'staging'), maxTotalSize: 16 })
    ).rejects.toThrow(/exceeds/i);
  });
});

// === Group 4: GitHub URL acquisition ===

describe('GitHub URL acquisition', () => {
  it('detects GitHub URLs and sets familiarity to STRANGER', () => {
    const result = detectSourceType('https://github.com/user/repo');
    expect(result.type).toBe('github-url');
    expect(result.familiarity).toBe('STRANGER');
  });

  it('applies scope filter to cloned files', () => {
    // Test the scope filtering logic directly using exported helpers
    // (avoids ESM mock limitations for child_process.execSync)
    const cloneDir = path.join(tmpDir, 'mock-clone');
    fs.mkdirSync(path.join(cloneDir, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(cloneDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(cloneDir, 'docs', 'readme.md'), '# Docs Readme');
    fs.writeFileSync(path.join(cloneDir, 'src', 'code.ts'), 'const x = 1;');
    fs.writeFileSync(path.join(cloneDir, 'README.md'), '# Root Readme');

    const allFiles = [
      path.join(cloneDir, 'docs', 'readme.md'),
      path.join(cloneDir, 'src', 'code.ts'),
      path.join(cloneDir, 'README.md'),
    ];

    // Filter by docs/ scope only
    const scopeFiltered = filterByScope(allFiles, cloneDir, ['docs/']);
    expect(scopeFiltered).toHaveLength(1);
    expect(scopeFiltered[0]).toContain('docs/readme.md');

    // Filter by docs/ + README.md
    const widerScope = filterByScope(allFiles, cloneDir, ['docs/', 'README.md']);
    expect(widerScope).toHaveLength(2);

    // Extension filtering
    expect(isSupportedExtension('readme.md')).toBe(true);
    expect(isSupportedExtension('code.ts')).toBe(false);
    expect(isSupportedExtension('doc.pdf')).toBe(true);
  });
});

// === Group 5: Staging area ===

describe('staging area', () => {
  it('creates staging directory if not exists', async () => {
    const mdPath = path.join(tmpDir, 'stage-test.md');
    fs.writeFileSync(mdPath, '# Stage Test');
    const stagingDir = path.join(tmpDir, 'new-staging');

    const result = await acquireSource(mdPath, { stagingDir });

    expect(fs.existsSync(result.stagingDir)).toBe(true);
  });

  it('writes staged content to disk', async () => {
    const mdPath = path.join(tmpDir, 'disk-write.md');
    fs.writeFileSync(mdPath, '# Disk Write Test');
    const stagingDir = path.join(tmpDir, 'disk-staging');

    const result = await acquireSource(mdPath, { stagingDir });

    // Check that a staged file exists in the staging directory
    const stagedFiles = fs.readdirSync(result.stagingDir);
    expect(stagedFiles.length).toBeGreaterThan(0);
    // Staged content should match
    const stagedContent = fs.readFileSync(
      path.join(result.stagingDir, stagedFiles[0]),
      'utf-8'
    );
    expect(stagedContent).toBe('# Disk Write Test');
  });

  it('uses custom stagingDir when provided', async () => {
    const mdPath = path.join(tmpDir, 'custom-staging.md');
    fs.writeFileSync(mdPath, '# Custom Staging');
    const customDir = path.join(tmpDir, 'my-custom-staging');

    const result = await acquireSource(mdPath, { stagingDir: customDir });

    expect(result.stagingDir).toBe(customDir);
    expect(fs.existsSync(customDir)).toBe(true);
  });
});
