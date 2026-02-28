import { describe, it, expect } from 'vitest';
import { extractToc } from '../../../../src/integrations/site/utils/toc';
import type { TocEntry } from '../../../../src/integrations/site/types';

describe('extractToc', () => {
  it('extracts h1-h6 headings', () => {
    const html = `
      <h1>Title</h1>
      <p>Intro paragraph.</p>
      <h2>Section One</h2>
      <h3>Subsection</h3>
      <h4>Detail</h4>
      <h5>Fine Print</h5>
      <h6>Footnote</h6>
    `;

    const toc = extractToc(html);
    expect(toc).toHaveLength(6);
    expect(toc[0]).toEqual({ level: 1, text: 'Title', id: 'title' });
    expect(toc[1]).toEqual({ level: 2, text: 'Section One', id: 'section-one' });
    expect(toc[2]).toEqual({ level: 3, text: 'Subsection', id: 'subsection' });
    expect(toc[3]).toEqual({ level: 4, text: 'Detail', id: 'detail' });
    expect(toc[4]).toEqual({ level: 5, text: 'Fine Print', id: 'fine-print' });
    expect(toc[5]).toEqual({ level: 6, text: 'Footnote', id: 'footnote' });
  });

  it('generates slugified IDs', () => {
    const html = '<h2>Getting Started with Rust</h2>';
    const toc = extractToc(html);
    expect(toc[0].id).toBe('getting-started-with-rust');
  });

  it('handles special characters in headings', () => {
    const html = `<h2>Ohm's Law: V = I * R</h2>`;
    const toc = extractToc(html);
    expect(toc[0].text).toBe("Ohm's Law: V = I * R");
    expect(toc[0].id).toBe('ohms-law-v-i-r');
  });

  it('handles duplicate headings by appending -1, -2', () => {
    const html = `
      <h2>Introduction</h2>
      <h2>Introduction</h2>
      <h2>Introduction</h2>
    `;

    const toc = extractToc(html);
    expect(toc[0].id).toBe('introduction');
    expect(toc[1].id).toBe('introduction-1');
    expect(toc[2].id).toBe('introduction-2');
  });

  it('returns empty array for empty HTML', () => {
    expect(extractToc('')).toEqual([]);
  });

  it('maintains heading level hierarchy', () => {
    const html = `
      <h1>Top</h1>
      <h2>Mid A</h2>
      <h3>Sub A1</h3>
      <h2>Mid B</h2>
      <h3>Sub B1</h3>
      <h3>Sub B2</h3>
    `;

    const toc = extractToc(html);
    expect(toc.map((e) => e.level)).toEqual([1, 2, 3, 2, 3, 3]);
  });

  it('ignores non-heading tags', () => {
    const html = `
      <p>Paragraph</p>
      <div>Block</div>
      <h2>Real Heading</h2>
      <span>Inline</span>
    `;

    const toc = extractToc(html);
    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe('Real Heading');
  });

  it('handles headings with inline code', () => {
    const html = '<h2>Using <code>vitest</code> for Testing</h2>';
    const toc = extractToc(html);
    expect(toc[0].text).toBe('Using vitest for Testing');
    expect(toc[0].id).toBe('using-vitest-for-testing');
  });
});
