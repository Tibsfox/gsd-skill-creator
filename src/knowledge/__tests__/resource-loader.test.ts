/**
 * Tests for resource catalog markdown parser.
 *
 * Validates parseResources() extracts categorized links from markdown
 * resource documents.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { parseResources, parseResourcesFile } from '../resource-loader.js';

// ============================================================================
// Fixtures
// ============================================================================

const RESOURCES_MD = `# Resources

## For Young Learners

- [Beast Academy](https://beastacademy.com) Comic-based math curriculum
- [CoolMath](https://coolmath.com) Game-based exploration of concepts

## For Older Learners

- [3Blue1Brown](https://youtube.com/3blue1brown) Exceptional visual explanations
- [Desmos](https://desmos.com) Interactive graphing and exploration

## For Parents

- [NCTM Parent Guides](https://nctm.org/parents) Conversation starters per grade level

## For Deeper Study

- [What is Mathematics?](https://example.com/courant) Deep, beautiful survey by Richard Courant
- [Concrete Mathematics](https://example.com/gkp) Discrete math foundations
`;

const EMPTY_SECTION_MD = `# Resources

## Active Resources

- [Link One](https://example.com/one) First link

## Empty Section

No links in this section, just text.

## More Resources

- [Link Two](https://example.com/two) Second link
`;

// ============================================================================
// parseResources
// ============================================================================

describe('parseResources', () => {
  it('extracts categorized links', () => {
    const catalog = parseResources(RESOURCES_MD);
    expect(catalog.categories).toBeInstanceOf(Map);

    const youngLearners = catalog.categories.get('For Young Learners');
    expect(youngLearners).toBeDefined();
    expect(youngLearners).toHaveLength(2);
    expect(youngLearners![0].title).toBe('Beast Academy');
    expect(youngLearners![0].url).toBe('https://beastacademy.com');

    const olderLearners = catalog.categories.get('For Older Learners');
    expect(olderLearners).toBeDefined();
    expect(olderLearners).toHaveLength(2);

    const parents = catalog.categories.get('For Parents');
    expect(parents).toBeDefined();
    expect(parents).toHaveLength(1);

    const deeper = catalog.categories.get('For Deeper Study');
    expect(deeper).toBeDefined();
    expect(deeper).toHaveLength(2);
  });

  it('parses markdown links with descriptions', () => {
    const catalog = parseResources(RESOURCES_MD);
    const youngLearners = catalog.categories.get('For Young Learners')!;
    expect(youngLearners[0].title).toBe('Beast Academy');
    expect(youngLearners[0].url).toBe('https://beastacademy.com');
    expect(youngLearners[0].description).toContain('Comic-based');
  });

  it('handles section with no links', () => {
    const catalog = parseResources(EMPTY_SECTION_MD);
    const empty = catalog.categories.get('Empty Section');
    // Section exists but has no links
    expect(empty).toBeDefined();
    expect(empty).toHaveLength(0);
  });

  it('flattens all links into allLinks', () => {
    const catalog = parseResources(RESOURCES_MD);
    expect(catalog.allLinks.length).toBe(7);
    const urls = catalog.allLinks.map((l) => l.url);
    expect(urls).toContain('https://beastacademy.com');
    expect(urls).toContain('https://desmos.com');
  });

  it('handles empty markdown', () => {
    const catalog = parseResources('');
    expect(catalog.categories.size).toBe(0);
    expect(catalog.allLinks).toHaveLength(0);
  });
});

// ============================================================================
// parseResourcesFile
// ============================================================================

describe('parseResourcesFile', () => {
  let mockReadFile: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const fs = await import('node:fs/promises');
    mockReadFile = fs.readFile as ReturnType<typeof vi.fn>;
    mockReadFile.mockReset();
  });

  it('reads and parses file', async () => {
    mockReadFile.mockResolvedValue(RESOURCES_MD);
    const catalog = await parseResourcesFile('/path/to/resources.md');
    expect(catalog.allLinks.length).toBe(7);
    expect(mockReadFile).toHaveBeenCalledWith('/path/to/resources.md', 'utf-8');
  });
});
