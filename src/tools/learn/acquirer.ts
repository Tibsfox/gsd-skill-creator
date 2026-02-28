// === sc:learn Source Acquirer ===
//
// Entry point for the sc:learn pipeline. Acquires content from local files,
// archives, and GitHub repositories. Normalizes to plain text and stages
// with provenance metadata. Source familiarity (HOME vs STRANGER) drives
// downstream sanitization tier.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';

// === Types ===

export type SourceFamiliarity = 'HOME' | 'STRANGER';
export type SourceType = 'local-file' | 'archive' | 'github-url' | 'url';
export type SupportedExtension = '.pdf' | '.md' | '.markdown' | '.docx' | '.txt' | '.epub';
export type SupportedArchive = '.zip' | '.tgz' | '.tar.gz';

export interface AcquisitionSource {
  input: string;
  type: SourceType;
  familiarity: SourceFamiliarity;
}

export interface StagedContent {
  filename: string;
  content: string;
  byteSize: number;
  encoding: string;
  sourceFile: string;
}

export interface AcquisitionResult {
  source: AcquisitionSource;
  staged: StagedContent[];
  stagingDir: string;
  timestamp: string;
  errors: AcquisitionError[];
}

export interface AcquisitionError {
  file: string;
  reason: string;
  fatal: boolean;
}

export interface AcquireOptions {
  stagingDir?: string;
  maxFileSize?: number;
  maxTotalSize?: number;
  githubScope?: string[];
  timeout?: number;
}

// === Constants ===

export const SUPPORTED_EXTENSIONS: SupportedExtension[] = ['.pdf', '.md', '.markdown', '.docx', '.txt', '.epub'];
export const SUPPORTED_ARCHIVES: SupportedArchive[] = ['.zip', '.tgz', '.tar.gz'];
export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;  // 50MB
export const DEFAULT_MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB
export const DEFAULT_GITHUB_SCOPE = ['docs/', 'README.md'];
export const DEFAULT_TIMEOUT = 30_000;

// === Source Type Detection ===

export function detectSourceType(input: string): { type: SourceType; familiarity: SourceFamiliarity } {
  // GitHub URL detection
  if (input.startsWith('https://github.com/') || input.startsWith('https://www.github.com/')) {
    return { type: 'github-url', familiarity: 'STRANGER' };
  }

  // Generic URL detection
  if (input.startsWith('https://') || input.startsWith('http://')) {
    return { type: 'url', familiarity: 'STRANGER' };
  }

  // Archive detection (check tar.gz before .gz)
  if (input.endsWith('.tar.gz')) {
    return { type: 'archive', familiarity: 'HOME' };
  }
  if (input.endsWith('.zip') || input.endsWith('.tgz')) {
    return { type: 'archive', familiarity: 'HOME' };
  }

  // Local file detection
  const ext = path.extname(input).toLowerCase();
  if (SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)) {
    return { type: 'local-file', familiarity: 'HOME' };
  }

  throw new Error(`Unsupported source type: ${ext || '(no extension)'}`);
}

// === Main Entry Point ===

export async function acquireSource(input: string, options?: AcquireOptions): Promise<AcquisitionResult> {
  const detected = detectSourceType(input);
  const stagingDir = options?.stagingDir ?? path.join(process.cwd(), '.learn-staging');
  const maxFileSize = options?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const maxTotalSize = options?.maxTotalSize ?? DEFAULT_MAX_TOTAL_SIZE;
  const githubScope = options?.githubScope ?? DEFAULT_GITHUB_SCOPE;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

  fs.mkdirSync(stagingDir, { recursive: true });

  const source: AcquisitionSource = {
    input,
    type: detected.type,
    familiarity: detected.familiarity,
  };

  const errors: AcquisitionError[] = [];
  let staged: StagedContent[] = [];

  switch (detected.type) {
    case 'local-file':
      staged = [await acquireLocalFile(input, stagingDir, maxFileSize)];
      break;
    case 'archive':
      staged = await acquireArchive(input, stagingDir, maxFileSize, maxTotalSize, errors);
      break;
    case 'github-url':
      staged = await acquireGitHub(input, stagingDir, githubScope, maxFileSize, errors);
      break;
    case 'url':
      staged = [await acquireUrl(input, stagingDir, maxFileSize, timeout)];
      break;
  }

  return {
    source,
    staged,
    stagingDir,
    timestamp: new Date().toISOString(),
    errors,
  };
}

// === Local File Handler ===

async function acquireLocalFile(
  filePath: string,
  stagingDir: string,
  maxFileSize: number,
): Promise<StagedContent> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Source not found: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size > maxFileSize) {
    throw new Error(`File exceeds maximum size (${stat.size} > ${maxFileSize}): ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  let content: string;

  switch (ext) {
    case '.md':
    case '.markdown':
    case '.txt':
      content = fs.readFileSync(filePath, 'utf-8');
      break;
    case '.pdf':
      content = extractPdfText(filePath);
      break;
    case '.docx':
      content = extractDocxText(filePath);
      break;
    case '.epub':
      content = extractEpubText(filePath);
      break;
    default:
      content = fs.readFileSync(filePath, 'utf-8');
  }

  const basename = path.basename(filePath, ext);
  const stagedFilename = `${basename}.staged.txt`;
  const stagedPath = path.join(stagingDir, stagedFilename);
  fs.writeFileSync(stagedPath, content, 'utf-8');

  return {
    filename: path.basename(filePath),
    content,
    byteSize: stat.size,
    encoding: 'utf-8',
    sourceFile: filePath,
  };
}

// === Archive Handler ===

async function acquireArchive(
  archivePath: string,
  stagingDir: string,
  maxFileSize: number,
  maxTotalSize: number,
  errors: AcquisitionError[],
): Promise<StagedContent[]> {
  const stat = fs.statSync(archivePath);
  if (stat.size > maxTotalSize) {
    throw new Error(`Archive exceeds maximum total size (${stat.size} > ${maxTotalSize}): ${archivePath}`);
  }

  const isZip = archivePath.endsWith('.zip');
  const staged: StagedContent[] = [];

  if (isZip) {
    // List zip contents
    const listOutput = execSync(`unzip -l "${archivePath}"`, { encoding: 'utf-8' });
    const lines = listOutput.split('\n');
    const files: string[] = [];

    for (const line of lines) {
      // unzip -l format: "  length  date time  name"
      // Date can be MM-DD-YY, MM-DD-YYYY, or YYYY-MM-DD
      const match = line.match(/^\s*(\d+)\s+\d{2,4}-\d{2}-\d{2,4}\s+\d{2}:\d{2}\s+(.+)$/);
      if (match && match[2].trim()) {
        files.push(match[2].trim());
      }
    }

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)) {
        errors.push({ file, reason: `Unsupported file type: ${ext}`, fatal: false });
        continue;
      }

      try {
        const content = execSync(`unzip -p "${archivePath}" "${file}"`, { encoding: 'utf-8' });
        const basename = path.basename(file, ext);
        const stagedFilename = `${basename}.staged.txt`;
        const stagedPath = path.join(stagingDir, stagedFilename);
        fs.writeFileSync(stagedPath, content, 'utf-8');

        staged.push({
          filename: path.basename(file),
          content,
          byteSize: Buffer.byteLength(content, 'utf-8'),
          encoding: 'utf-8',
          sourceFile: `${archivePath}!${file}`,
        });
      } catch (err) {
        errors.push({ file, reason: `Extraction failed: ${(err as Error).message}`, fatal: false });
      }
    }
  } else {
    // tar.gz / tgz
    const listOutput = execSync(`tar -tzf "${archivePath}"`, { encoding: 'utf-8' });
    const files = listOutput.split('\n').filter(f => f.trim() && !f.endsWith('/'));

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)) {
        errors.push({ file, reason: `Unsupported file type: ${ext}`, fatal: false });
        continue;
      }

      try {
        const content = execSync(`tar -xzf "${archivePath}" -O "${file}"`, { encoding: 'utf-8' });
        const basename = path.basename(file, ext);
        const stagedFilename = `${basename}.staged.txt`;
        const stagedPath = path.join(stagingDir, stagedFilename);
        fs.writeFileSync(stagedPath, content, 'utf-8');

        staged.push({
          filename: path.basename(file),
          content,
          byteSize: Buffer.byteLength(content, 'utf-8'),
          encoding: 'utf-8',
          sourceFile: `${archivePath}!${file}`,
        });
      } catch (err) {
        errors.push({ file, reason: `Extraction failed: ${(err as Error).message}`, fatal: false });
      }
    }
  }

  return staged;
}

// === GitHub Handler ===

async function acquireGitHub(
  url: string,
  stagingDir: string,
  scope: string[],
  maxFileSize: number,
  errors: AcquisitionError[],
): Promise<StagedContent[]> {
  const tempCloneDir = path.join(os.tmpdir(), `learn-github-${Date.now()}`);

  try {
    execSync(`git clone --depth 1 --single-branch "${url}" "${tempCloneDir}"`, {
      stdio: 'pipe',
      timeout: 60_000,
    });

    // Walk the cloned directory and filter by scope
    const staged: StagedContent[] = [];
    const allFiles = walkDir(tempCloneDir);

    for (const file of allFiles) {
      const relPath = path.relative(tempCloneDir, file);

      // Check if file matches any scope path
      const inScope = scope.some(s => {
        if (s.endsWith('/')) {
          return relPath.startsWith(s);
        }
        return relPath === s || path.basename(relPath) === s;
      });

      if (!inScope) continue;

      const ext = path.extname(file).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)) {
        errors.push({ file: relPath, reason: `Unsupported file type: ${ext}`, fatal: false });
        continue;
      }

      try {
        const result = await acquireLocalFile(file, stagingDir, maxFileSize);
        staged.push(result);
      } catch (err) {
        errors.push({ file: relPath, reason: (err as Error).message, fatal: false });
      }
    }

    return staged;
  } finally {
    // Clean up cloned directory
    if (fs.existsSync(tempCloneDir)) {
      fs.rmSync(tempCloneDir, { recursive: true, force: true });
    }
  }
}

// === URL Handler ===

async function acquireUrl(
  url: string,
  stagingDir: string,
  maxFileSize: number,
  timeout: number,
): Promise<StagedContent> {
  const tempFile = path.join(os.tmpdir(), `learn-url-${Date.now()}${path.extname(url) || '.txt'}`);

  try {
    execSync(`curl -sL --max-time ${Math.ceil(timeout / 1000)} -o "${tempFile}" "${url}"`, {
      stdio: 'pipe',
      timeout: timeout + 5000,
    });

    return await acquireLocalFile(tempFile, stagingDir, maxFileSize);
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

// === Text Extraction Helpers ===

function extractPdfText(filePath: string): string {
  // Basic PDF text extraction: scan for text between BT and ET operators,
  // extract Tj/TJ string operands. Good enough for simple PDFs.
  const buffer = fs.readFileSync(filePath);
  const raw = buffer.toString('latin1');
  const textParts: string[] = [];

  // Find text between BT (begin text) and ET (end text) operators
  const btRegex = /BT\s([\s\S]*?)ET/g;
  let match: RegExpExecArray | null;

  while ((match = btRegex.exec(raw)) !== null) {
    const block = match[1];
    // Extract Tj operands: (text) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      textParts.push(tjMatch[1]);
    }
    // Extract TJ array operands: [(text)] TJ
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrMatch: RegExpExecArray | null;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const arrContent = tjArrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch: RegExpExecArray | null;
      while ((strMatch = strRegex.exec(arrContent)) !== null) {
        textParts.push(strMatch[1]);
      }
    }
  }

  return textParts.join(' ').replace(/\s+/g, ' ').trim() || '(PDF text extraction: no readable text found)';
}

function extractDocxText(filePath: string): string {
  // docx is a zip archive. Extract word/document.xml and strip XML tags.
  const tempDir = path.join(os.tmpdir(), `learn-docx-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    execSync(`unzip -o "${filePath}" word/document.xml -d "${tempDir}"`, { stdio: 'pipe' });
    const xmlPath = path.join(tempDir, 'word', 'document.xml');
    if (!fs.existsSync(xmlPath)) {
      return '(DOCX extraction: word/document.xml not found)';
    }
    const xml = fs.readFileSync(xmlPath, 'utf-8');
    // Strip XML tags, keep text content
    return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '(DOCX extraction failed)';
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function extractEpubText(filePath: string): string {
  // epub is a zip archive with XHTML content files
  const tempDir = path.join(os.tmpdir(), `learn-epub-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    execSync(`unzip -o "${filePath}" -d "${tempDir}"`, { stdio: 'pipe' });

    // Find all xhtml/html files
    const htmlFiles = walkDir(tempDir).filter(
      f => f.endsWith('.xhtml') || f.endsWith('.html') || f.endsWith('.htm')
    );

    const parts: string[] = [];
    for (const htmlFile of htmlFiles) {
      const html = fs.readFileSync(htmlFile, 'utf-8');
      parts.push(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }

    return parts.join('\n\n').trim() || '(EPUB extraction: no readable content found)';
  } catch {
    return '(EPUB extraction failed)';
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// === Exported Utilities (for testability) ===

/** Filter files by scope paths — used by GitHub handler, exported for testing */
export function filterByScope(files: string[], baseDir: string, scope: string[]): string[] {
  return files.filter(file => {
    const relPath = path.relative(baseDir, file);
    return scope.some(s => {
      if (s.endsWith('/')) {
        return relPath.startsWith(s);
      }
      return relPath === s || path.basename(relPath) === s;
    });
  });
}

/** Filter to supported extensions only */
export function isSupportedExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension);
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === '.git') continue; // Skip .git directories
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}
