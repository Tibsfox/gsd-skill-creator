import { describe, it, expect } from 'vitest';
import {
  renderUploadZone,
  renderUploadZoneStyles,
  extractDocumentMetadata,
} from './upload-zone.js';

// ---------------------------------------------------------------------------
// renderUploadZone
// ---------------------------------------------------------------------------

describe('renderUploadZone', () => {
  it('returns HTML containing a drop zone container with class upload-zone', () => {
    const html = renderUploadZone();
    expect(html).toContain('class="upload-zone"');
  });

  it('contains a hidden file input accepting .md and .txt', () => {
    const html = renderUploadZone();
    expect(html).toContain('<input');
    expect(html).toContain('type="file"');
    expect(html).toContain('accept=".md,.txt"');
    expect(html).toContain('display:none');
  });

  it('contains a click-to-browse label', () => {
    const html = renderUploadZone();
    expect(html).toContain('upload-zone-browse');
    expect(html).toContain('for="upload-file-input"');
  });

  it('contains JavaScript handling dragover, drop, and change events', () => {
    const html = renderUploadZone();
    expect(html).toContain('<script');
    expect(html).toContain('dragover');
    expect(html).toContain('drop');
    expect(html).toContain('change');
  });

  it('contains FileReader usage with readAsText', () => {
    const html = renderUploadZone();
    expect(html).toContain('FileReader');
    expect(html).toContain('readAsText');
  });

  it('contains a metadata display container initially hidden', () => {
    const html = renderUploadZone();
    expect(html).toContain('class="upload-metadata"');
    expect(html).toContain('display:none');
  });

  it('adds upload-zone-active class on dragover for visual feedback', () => {
    const html = renderUploadZone();
    expect(html).toContain('upload-zone-active');
  });
});

// ---------------------------------------------------------------------------
// extractDocumentMetadata
// ---------------------------------------------------------------------------

describe('extractDocumentMetadata', () => {
  it('extracts title from first # heading line', () => {
    const meta = extractDocumentMetadata('# My Document\n\nSome content here.');
    expect(meta.title).toBe('My Document');
  });

  it('returns empty string for title when no heading found', () => {
    const meta = extractDocumentMetadata('Just some plain text without headings.');
    expect(meta.title).toBe('');
  });

  it('counts words correctly', () => {
    const meta = extractDocumentMetadata('one two three four five');
    expect(meta.wordCount).toBe(5);
  });

  it('extracts all ## through #### headings as sections', () => {
    const content = [
      '# Title',
      '## Section One',
      'Text here.',
      '### Subsection A',
      'More text.',
      '#### Deep Heading',
      'Even more text.',
    ].join('\n');
    const meta = extractDocumentMetadata(content);
    expect(meta.sections).toEqual(['Section One', 'Subsection A', 'Deep Heading']);
  });

  it('returns empty sections array when no subheadings exist', () => {
    const meta = extractDocumentMetadata('# Title\n\nJust body text here.');
    expect(meta.sections).toEqual([]);
  });

  it('counts lines correctly', () => {
    const content = 'line one\nline two\nline three';
    const meta = extractDocumentMetadata(content);
    expect(meta.lineCount).toBe(3);
  });

  it('handles empty string input without crashing', () => {
    const meta = extractDocumentMetadata('');
    expect(meta.title).toBe('');
    expect(meta.wordCount).toBe(0);
    expect(meta.sections).toEqual([]);
    expect(meta.lineCount).toBe(0);
  });

  it('includes heading text in word count but not # markers', () => {
    const content = '# My Title\n\n## Section One\n\nHello world';
    const meta = extractDocumentMetadata(content);
    // Words: My, Title, Section, One, Hello, world = 6
    expect(meta.wordCount).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// renderUploadZoneStyles
// ---------------------------------------------------------------------------

describe('renderUploadZoneStyles', () => {
  it('returns CSS string containing .upload-zone styles', () => {
    const css = renderUploadZoneStyles();
    expect(typeof css).toBe('string');
    expect(css).toContain('.upload-zone');
  });

  it('includes drag-over active state styles', () => {
    const css = renderUploadZoneStyles();
    expect(css).toContain('.upload-zone-active');
  });

  it('includes metadata display styles', () => {
    const css = renderUploadZoneStyles();
    expect(css).toContain('.upload-metadata');
  });
});
