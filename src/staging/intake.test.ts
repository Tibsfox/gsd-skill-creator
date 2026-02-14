/**
 * TDD tests for document intake function.
 *
 * Covers stageDocument: saves document to inbox, creates companion
 * .meta.json, validates metadata fields, returns paths, handles
 * directory creation on first use, preserves content, and supports
 * multiple documents without collision.
 *
 * @module staging/intake.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stageDocument, type StageDocumentResult } from './intake.js';
import { STAGING_DIRS } from './types.js';

describe('stageDocument', () => {
  const tempDirs: string[] = [];

  function createTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'intake-test-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  // --------------------------------------------------------------------------
  // 1. Saves document to inbox directory
  // --------------------------------------------------------------------------

  it('saves document to inbox directory', async () => {
    const base = createTempDir();
    const content = 'Hello, staging pipeline!';
    const filename = 'test-doc.md';

    await stageDocument({ basePath: base, filename, content, source: 'test' });

    const docPath = join(base, STAGING_DIRS.inbox, filename);
    expect(existsSync(docPath)).toBe(true);
    expect(readFileSync(docPath, 'utf-8')).toBe(content);
  });

  // --------------------------------------------------------------------------
  // 2. Creates companion .meta.json alongside document
  // --------------------------------------------------------------------------

  it('creates companion .meta.json alongside document', async () => {
    const base = createTempDir();
    const filename = 'companion-test.md';

    await stageDocument({ basePath: base, filename, content: 'data', source: 'test' });

    const metaPath = join(base, STAGING_DIRS.inbox, `${filename}.meta.json`);
    expect(existsSync(metaPath)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 3. Metadata contains required fields
  // --------------------------------------------------------------------------

  it('metadata contains submitted_at, source, and status=inbox', async () => {
    const base = createTempDir();
    const filename = 'meta-fields.md';

    await stageDocument({ basePath: base, filename, content: 'data', source: 'dashboard' });

    const metaPath = join(base, STAGING_DIRS.inbox, `${filename}.meta.json`);
    const metadata = JSON.parse(readFileSync(metaPath, 'utf-8'));

    // submitted_at is a valid ISO 8601 string
    expect(typeof metadata.submitted_at).toBe('string');
    expect(isNaN(Date.parse(metadata.submitted_at))).toBe(false);

    // source matches provided value
    expect(metadata.source).toBe('dashboard');

    // status is 'inbox'
    expect(metadata.status).toBe('inbox');
  });

  // --------------------------------------------------------------------------
  // 4. Returns document and metadata paths
  // --------------------------------------------------------------------------

  it('returns document and metadata paths', async () => {
    const base = createTempDir();
    const filename = 'paths-test.md';

    const result: StageDocumentResult = await stageDocument({
      basePath: base,
      filename,
      content: 'data',
      source: 'test',
    });

    // Both paths are absolute
    expect(result.documentPath.startsWith('/')).toBe(true);
    expect(result.metadataPath.startsWith('/')).toBe(true);

    // documentPath ends with the filename
    expect(result.documentPath.endsWith(filename)).toBe(true);

    // metadataPath ends with {filename}.meta.json
    expect(result.metadataPath.endsWith(`${filename}.meta.json`)).toBe(true);

    // Both files exist
    expect(existsSync(result.documentPath)).toBe(true);
    expect(existsSync(result.metadataPath)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 5. Creates staging directories on first use
  // --------------------------------------------------------------------------

  it('creates staging directories on first use', async () => {
    const base = createTempDir();

    // .planning/staging/ does not exist yet
    expect(existsSync(join(base, STAGING_DIRS.root))).toBe(false);

    const result = await stageDocument({
      basePath: base,
      filename: 'first-use.md',
      content: 'first document',
      source: 'test',
    });

    // Directories were created
    expect(existsSync(join(base, STAGING_DIRS.inbox))).toBe(true);

    // Document was saved
    expect(existsSync(result.documentPath)).toBe(true);
    expect(readFileSync(result.documentPath, 'utf-8')).toBe('first document');
  });

  // --------------------------------------------------------------------------
  // 6. Handles markdown content correctly
  // --------------------------------------------------------------------------

  it('handles markdown content correctly (byte-for-byte preservation)', async () => {
    const base = createTempDir();
    const markdownContent = `# Heading

## Subheading

Some paragraph text with **bold** and *italic*.

\`\`\`typescript
const x = 42;
console.log(x);
\`\`\`

- List item 1
- List item 2

> Blockquote with special chars: <>&"'

---

End of document.
`;

    await stageDocument({
      basePath: base,
      filename: 'markdown.md',
      content: markdownContent,
      source: 'test',
    });

    const saved = readFileSync(join(base, STAGING_DIRS.inbox, 'markdown.md'), 'utf-8');
    expect(saved).toBe(markdownContent);
  });

  // --------------------------------------------------------------------------
  // 7. Handles multiple documents without collision
  // --------------------------------------------------------------------------

  it('handles multiple documents without collision', async () => {
    const base = createTempDir();

    await stageDocument({
      basePath: base,
      filename: 'doc-one.md',
      content: 'first document content',
      source: 'test',
    });

    await stageDocument({
      basePath: base,
      filename: 'doc-two.md',
      content: 'second document content',
      source: 'test',
    });

    // Both documents exist with correct content
    const one = readFileSync(join(base, STAGING_DIRS.inbox, 'doc-one.md'), 'utf-8');
    const two = readFileSync(join(base, STAGING_DIRS.inbox, 'doc-two.md'), 'utf-8');
    expect(one).toBe('first document content');
    expect(two).toBe('second document content');

    // Both metadata files exist
    expect(existsSync(join(base, STAGING_DIRS.inbox, 'doc-one.md.meta.json'))).toBe(true);
    expect(existsSync(join(base, STAGING_DIRS.inbox, 'doc-two.md.meta.json'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 8. Metadata submitted_at is close to current time
  // --------------------------------------------------------------------------

  it('metadata submitted_at is close to current time', async () => {
    const base = createTempDir();
    const before = Date.now();

    await stageDocument({
      basePath: base,
      filename: 'timestamp.md',
      content: 'data',
      source: 'test',
    });

    const after = Date.now();

    const metaPath = join(base, STAGING_DIRS.inbox, 'timestamp.md.meta.json');
    const metadata = JSON.parse(readFileSync(metaPath, 'utf-8'));
    const submittedMs = Date.parse(metadata.submitted_at);

    // submitted_at should be between before and after (with small tolerance)
    expect(submittedMs).toBeGreaterThanOrEqual(before - 1000);
    expect(submittedMs).toBeLessThanOrEqual(after + 1000);
  });

  // --------------------------------------------------------------------------
  // 9. Source field accepts any string
  // --------------------------------------------------------------------------

  it('source field accepts any string', async () => {
    const base = createTempDir();
    const sources = ['console', 'cli', 'api'];

    for (const source of sources) {
      await stageDocument({
        basePath: base,
        filename: `source-${source}.md`,
        content: 'data',
        source,
      });

      const metaPath = join(base, STAGING_DIRS.inbox, `source-${source}.md.meta.json`);
      const metadata = JSON.parse(readFileSync(metaPath, 'utf-8'));
      expect(metadata.source).toBe(source);
    }
  });
});
