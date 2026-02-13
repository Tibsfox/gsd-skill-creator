/**
 * TDD tests for staging state machine transitions.
 *
 * Covers moveDocument: valid transitions, invalid transitions,
 * metadata updates, content preservation, sequential moves,
 * and target directory creation.
 *
 * @module staging/state-machine.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { moveDocument, VALID_TRANSITIONS } from './state-machine.js';
import type { StagingState } from './types.js';

/**
 * Create a test document and its .meta.json in a staging state directory.
 */
function createTestDocument(
  base: string,
  state: string,
  filename: string,
  extra?: Record<string, unknown>,
): void {
  const dir = join(base, '.planning/staging', state);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), '# Test Document\n\nContent here.', 'utf-8');
  const meta: Record<string, unknown> = {
    submitted_at: new Date().toISOString(),
    source: 'test',
    status: state,
    ...extra,
  };
  writeFileSync(join(dir, filename + '.meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
}

describe('VALID_TRANSITIONS', () => {
  // --------------------------------------------------------------------------
  // 1. Defines allowed state transitions
  // --------------------------------------------------------------------------

  it('allows inbox to move to checking and aside', () => {
    expect(VALID_TRANSITIONS.inbox).toEqual(['checking', 'aside']);
  });

  it('allows checking to move to attention, ready, and aside', () => {
    expect(VALID_TRANSITIONS.checking).toEqual(['attention', 'ready', 'aside']);
  });

  it('allows attention to move to checking, ready, and aside', () => {
    expect(VALID_TRANSITIONS.attention).toEqual(['checking', 'ready', 'aside']);
  });

  it('allows ready to move to checking and aside', () => {
    expect(VALID_TRANSITIONS.ready).toEqual(['checking', 'aside']);
  });

  it('allows aside to move to inbox', () => {
    expect(VALID_TRANSITIONS.aside).toEqual(['inbox']);
  });
});

describe('moveDocument', () => {
  const tempDirs: string[] = [];

  function createTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'staging-move-'));
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
  // 2. Moves document from inbox to checking
  // --------------------------------------------------------------------------

  it('moves document from inbox to checking', async () => {
    const base = createTempDir();
    createTestDocument(base, 'inbox', 'doc.md');
    // Ensure target directory exists
    mkdirSync(join(base, '.planning/staging/checking'), { recursive: true });

    await moveDocument({
      basePath: base,
      filename: 'doc.md',
      fromState: 'inbox',
      toState: 'checking',
    });

    // File no longer in inbox
    expect(existsSync(join(base, '.planning/staging/inbox/doc.md'))).toBe(false);
    expect(existsSync(join(base, '.planning/staging/inbox/doc.md.meta.json'))).toBe(false);

    // File now in checking
    expect(existsSync(join(base, '.planning/staging/checking/doc.md'))).toBe(true);
    expect(existsSync(join(base, '.planning/staging/checking/doc.md.meta.json'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 3. Updates metadata status after move
  // --------------------------------------------------------------------------

  it('updates metadata status after move', async () => {
    const base = createTempDir();
    createTestDocument(base, 'inbox', 'doc.md');
    mkdirSync(join(base, '.planning/staging/checking'), { recursive: true });

    await moveDocument({
      basePath: base,
      filename: 'doc.md',
      fromState: 'inbox',
      toState: 'checking',
    });

    const metaPath = join(base, '.planning/staging/checking/doc.md.meta.json');
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));

    expect(meta.status).toBe('checking');
    // Original fields preserved
    expect(meta.submitted_at).toBeDefined();
    expect(meta.source).toBe('test');
  });

  // --------------------------------------------------------------------------
  // 4. Returns the new paths
  // --------------------------------------------------------------------------

  it('returns the new document and metadata paths', async () => {
    const base = createTempDir();
    createTestDocument(base, 'inbox', 'doc.md');
    mkdirSync(join(base, '.planning/staging/checking'), { recursive: true });

    const result = await moveDocument({
      basePath: base,
      filename: 'doc.md',
      fromState: 'inbox',
      toState: 'checking',
    });

    expect(result.documentPath).toBe(join(base, '.planning/staging/checking/doc.md'));
    expect(result.metadataPath).toBe(join(base, '.planning/staging/checking/doc.md.meta.json'));
  });

  // --------------------------------------------------------------------------
  // 5. Rejects invalid state transition
  // --------------------------------------------------------------------------

  it('rejects invalid state transition (inbox -> ready)', async () => {
    const base = createTempDir();
    createTestDocument(base, 'inbox', 'doc.md');

    await expect(
      moveDocument({
        basePath: base,
        filename: 'doc.md',
        fromState: 'inbox',
        toState: 'ready',
      }),
    ).rejects.toThrow(/invalid state transition.*inbox.*ready/i);
  });

  // --------------------------------------------------------------------------
  // 6. Rejects move to same state
  // --------------------------------------------------------------------------

  it('rejects move to same state', async () => {
    const base = createTempDir();
    createTestDocument(base, 'inbox', 'doc.md');

    await expect(
      moveDocument({
        basePath: base,
        filename: 'doc.md',
        fromState: 'inbox',
        toState: 'inbox',
      }),
    ).rejects.toThrow(/same state/i);
  });

  // --------------------------------------------------------------------------
  // 7. Rejects move of non-existent document
  // --------------------------------------------------------------------------

  it('rejects move of non-existent document', async () => {
    const base = createTempDir();
    mkdirSync(join(base, '.planning/staging/inbox'), { recursive: true });
    mkdirSync(join(base, '.planning/staging/checking'), { recursive: true });

    await expect(
      moveDocument({
        basePath: base,
        filename: 'missing.md',
        fromState: 'inbox',
        toState: 'checking',
      }),
    ).rejects.toThrow();
  });

  // --------------------------------------------------------------------------
  // 8. Preserves document content byte-for-byte
  // --------------------------------------------------------------------------

  it('preserves document content byte-for-byte', async () => {
    const base = createTempDir();
    const content = '# Specific Content\n\nWith special chars: \u00e9\u00e0\u00fc\u00f1 and newlines\n\n';
    const dir = join(base, '.planning/staging/inbox');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'special.md'), content, 'utf-8');
    const meta = { submitted_at: new Date().toISOString(), source: 'test', status: 'inbox' };
    writeFileSync(join(dir, 'special.md.meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
    mkdirSync(join(base, '.planning/staging/checking'), { recursive: true });

    await moveDocument({
      basePath: base,
      filename: 'special.md',
      fromState: 'inbox',
      toState: 'checking',
    });

    const movedContent = readFileSync(
      join(base, '.planning/staging/checking/special.md'),
      'utf-8',
    );
    expect(movedContent).toBe(content);
  });

  // --------------------------------------------------------------------------
  // 9. Preserves extra metadata fields
  // --------------------------------------------------------------------------

  it('preserves extra metadata fields through move', async () => {
    const base = createTempDir();
    createTestDocument(base, 'inbox', 'doc.md', { word_count: 500, tags: ['skill'] });
    mkdirSync(join(base, '.planning/staging/checking'), { recursive: true });

    await moveDocument({
      basePath: base,
      filename: 'doc.md',
      fromState: 'inbox',
      toState: 'checking',
    });

    const metaPath = join(base, '.planning/staging/checking/doc.md.meta.json');
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));

    expect(meta.word_count).toBe(500);
    expect(meta.tags).toEqual(['skill']);
    expect(meta.status).toBe('checking');
  });

  // --------------------------------------------------------------------------
  // 10. Multiple sequential moves
  // --------------------------------------------------------------------------

  it('handles multiple sequential moves (inbox -> checking -> attention -> ready)', async () => {
    const base = createTempDir();
    createTestDocument(base, 'inbox', 'doc.md');
    mkdirSync(join(base, '.planning/staging/checking'), { recursive: true });
    mkdirSync(join(base, '.planning/staging/attention'), { recursive: true });
    mkdirSync(join(base, '.planning/staging/ready'), { recursive: true });

    await moveDocument({
      basePath: base,
      filename: 'doc.md',
      fromState: 'inbox',
      toState: 'checking',
    });

    await moveDocument({
      basePath: base,
      filename: 'doc.md',
      fromState: 'checking',
      toState: 'attention',
    });

    await moveDocument({
      basePath: base,
      filename: 'doc.md',
      fromState: 'attention',
      toState: 'ready',
    });

    // Only exists in ready
    expect(existsSync(join(base, '.planning/staging/inbox/doc.md'))).toBe(false);
    expect(existsSync(join(base, '.planning/staging/checking/doc.md'))).toBe(false);
    expect(existsSync(join(base, '.planning/staging/attention/doc.md'))).toBe(false);
    expect(existsSync(join(base, '.planning/staging/ready/doc.md'))).toBe(true);

    // Final metadata status is 'ready'
    const meta = JSON.parse(
      readFileSync(join(base, '.planning/staging/ready/doc.md.meta.json'), 'utf-8'),
    );
    expect(meta.status).toBe('ready');
  });

  // --------------------------------------------------------------------------
  // 11. Creates target directory if missing
  // --------------------------------------------------------------------------

  it('creates target directory if missing', async () => {
    const base = createTempDir();
    createTestDocument(base, 'inbox', 'doc.md');
    // Intentionally do NOT create checking directory

    const result = await moveDocument({
      basePath: base,
      filename: 'doc.md',
      fromState: 'inbox',
      toState: 'checking',
    });

    expect(existsSync(result.documentPath)).toBe(true);
    expect(existsSync(result.metadataPath)).toBe(true);
    expect(existsSync(join(base, '.planning/staging/checking'))).toBe(true);
  });
});
