import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../../../../src/integrations/site/utils/frontmatter';
import type { FrontMatter } from '../../../../src/integrations/site/types';

describe('parseFrontmatter', () => {
  it('parses complete frontmatter with all fields', () => {
    const raw = `---
title: My Page
description: A test page
template: article
date: "2026-01-15"
updated: "2026-02-01"
author: Foxy
tags:
  - electronics
  - learning
agent_visible: true
agent_priority: high
schema_type: Article
nav_section: foundations
nav_order: 3
draft: false
comments: true
wp_post_id: 42
wp_sync: true
original_url: https://old.example.com/page
---
Body content here.`;

    const result = parseFrontmatter(raw);
    expect(result.frontmatter.title).toBe('My Page');
    expect(result.frontmatter.description).toBe('A test page');
    expect(result.frontmatter.template).toBe('article');
    expect(result.frontmatter.date).toBe('2026-01-15');
    expect(result.frontmatter.updated).toBe('2026-02-01');
    expect(result.frontmatter.author).toBe('Foxy');
    expect(result.frontmatter.tags).toEqual(['electronics', 'learning']);
    expect(result.frontmatter.agent_visible).toBe(true);
    expect(result.frontmatter.agent_priority).toBe('high');
    expect(result.frontmatter.schema_type).toBe('Article');
    expect(result.frontmatter.nav_section).toBe('foundations');
    expect(result.frontmatter.nav_order).toBe(3);
    expect(result.frontmatter.draft).toBe(false);
    expect(result.frontmatter.comments).toBe(true);
    expect(result.frontmatter.wp_post_id).toBe(42);
    expect(result.frontmatter.wp_sync).toBe(true);
    expect(result.frontmatter.original_url).toBe('https://old.example.com/page');
    expect(result.content).toBe('Body content here.');
  });

  it('parses minimal frontmatter (title only)', () => {
    const raw = `---
title: Simple Page
---
Some content.`;

    const result = parseFrontmatter(raw);
    expect(result.frontmatter.title).toBe('Simple Page');
    expect(result.frontmatter.template).toBe('page');
    expect(result.frontmatter.agent_visible).toBe(true);
    expect(result.frontmatter.draft).toBe(false);
    expect(result.frontmatter.agent_priority).toBe('medium');
    expect(result.content).toBe('Some content.');
  });

  it('uses sensible defaults for empty frontmatter', () => {
    const raw = `---
---
Content only.`;

    const result = parseFrontmatter(raw, 'docs/my-great-article.md');
    expect(result.frontmatter.title).toBe('My Great Article');
    expect(result.frontmatter.template).toBe('page');
    expect(result.frontmatter.agent_visible).toBe(true);
    expect(result.frontmatter.draft).toBe(false);
    expect(result.frontmatter.agent_priority).toBe('medium');
    expect(result.content).toBe('Content only.');
  });

  it('handles no frontmatter at all using file path for defaults', () => {
    const raw = 'Just plain markdown content.';

    const result = parseFrontmatter(raw, 'essays/the-space-between.md');
    expect(result.frontmatter.title).toBe('The Space Between');
    expect(result.frontmatter.template).toBe('page');
    expect(result.frontmatter.agent_visible).toBe(true);
    expect(result.frontmatter.draft).toBe(false);
    expect(result.content).toBe('Just plain markdown content.');
  });

  it('parses frontmatter with tags array', () => {
    const raw = `---
title: Tagged Post
tags:
  - rust
  - wasm
  - performance
---
Tagged content.`;

    const result = parseFrontmatter(raw);
    expect(result.frontmatter.tags).toEqual(['rust', 'wasm', 'performance']);
  });

  it('parses frontmatter with agent_priority', () => {
    const raw = `---
title: Low Priority
agent_priority: low
---
Content.`;

    const result = parseFrontmatter(raw);
    expect(result.frontmatter.agent_priority).toBe('low');
  });

  it('parses frontmatter with draft: true', () => {
    const raw = `---
title: Draft Post
draft: true
---
Work in progress.`;

    const result = parseFrontmatter(raw);
    expect(result.frontmatter.draft).toBe(true);
  });

  it('preserves content after frontmatter', () => {
    const raw = `---
title: Content Test
---
First paragraph.

Second paragraph.

## Heading

Third paragraph.`;

    const result = parseFrontmatter(raw);
    expect(result.content).toBe(
      'First paragraph.\n\nSecond paragraph.\n\n## Heading\n\nThird paragraph.',
    );
  });

  it('handles multi-line description', () => {
    const raw = `---
title: Multi Desc
description: >
  This is a very long description
  that spans multiple lines
  in the YAML frontmatter.
---
Body.`;

    const result = parseFrontmatter(raw);
    expect(result.frontmatter.description).toContain('This is a very long description');
    expect(result.frontmatter.description).toContain('multiple lines');
  });

  it('handles special characters in title', () => {
    const raw = `---
title: "Ohm's Law: V = I * R (& More)"
---
Content.`;

    const result = parseFrontmatter(raw);
    expect(result.frontmatter.title).toBe("Ohm's Law: V = I * R (& More)");
  });

  it('parses WordPress fields', () => {
    const raw = `---
title: WP Post
wp_post_id: 123
wp_sync: false
original_url: https://example.com/old-post
---
Migrated content.`;

    const result = parseFrontmatter(raw);
    expect(result.frontmatter.wp_post_id).toBe(123);
    expect(result.frontmatter.wp_sync).toBe(false);
    expect(result.frontmatter.original_url).toBe('https://example.com/old-post');
  });

  it('handles invalid YAML gracefully', () => {
    const raw = `---
title: [invalid yaml
  : broken: stuff
---
Content after bad YAML.`;

    const result = parseFrontmatter(raw, 'broken-file.md');
    // Should not throw, should return defaults
    expect(result.frontmatter.title).toBe('Broken File');
    expect(result.content).toBe('Content after bad YAML.');
  });
});
