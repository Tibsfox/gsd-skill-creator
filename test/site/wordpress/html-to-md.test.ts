import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from '../../../src/site/wordpress/html-to-md';

describe('htmlToMarkdown', () => {
  it('converts paragraphs to newlines', () => {
    const html = '<p>First paragraph.</p><p>Second paragraph.</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('First paragraph.');
    expect(md).toContain('Second paragraph.');
    // Two paragraphs separated by blank line
    expect(md).toMatch(/First paragraph\.\n\nSecond paragraph\./);
  });

  it('converts bold and italic', () => {
    const html = '<p>This is <strong>bold</strong> and <em>italic</em>.</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('**bold**');
    expect(md).toContain('_italic_');
  });

  it('converts links', () => {
    const html = '<p>Visit <a href="https://example.com">Example</a> site.</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('[Example](https://example.com)');
  });

  it('converts images', () => {
    const html = '<p><img src="https://example.com/img.png" alt="My Image"></p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('![My Image](https://example.com/img.png)');
  });

  it('converts code blocks', () => {
    const html = '<pre><code class="language-js">const x = 1;</code></pre>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('```js');
    expect(md).toContain('const x = 1;');
    expect(md).toContain('```');
  });

  it('strips WordPress-specific classes and attributes', () => {
    const html =
      '<div class="wp-block-paragraph"><p class="has-text-align-center">Clean text.</p></div>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('Clean text.');
    expect(md).not.toContain('wp-block');
    expect(md).not.toContain('has-text-align');
  });
});
