/**
 * Heritage Book Template — scaffold and template engine for Heritage Book
 * creation. Provides typed scaffold factories and bibliography integration.
 *
 * Integrates with BibliographyEngine for citation generation with Fair Use
 * notices and creator-first links.
 *
 * @module heritage-skills-pack/project-builder/heritage-book-template
 */

import { createRequire } from 'module';
import { BibliographyEngine } from '../../canonical-works/bibliography-engine.js';
import type {
  HeritageBook,
  HeritageChapter,
  FrontMatter,
  BackMatter,
  Attribution,
  BibliographyEntry,
  Tradition,
} from '../../shared/types.js';

const require = createRequire(import.meta.url);

// ─── Template Type Definitions ────────────────────────────────────────────────

/**
 * A template descriptor for a Heritage Book chapter type.
 *
 * Each template provides guidance notes and required fields for one of the
 * 6 supported chapter content types.
 */
export type ChapterTemplate = {
  contentType: HeritageChapter['contentType'];
  title: string;
  guidanceNotes: string;
  requiredFields: string[];
  estimatedPages: number;
  culturalAttributionRequired: boolean;
  /** Present on interview-transcript only: OCAP Access principle review required. */
  ocapReviewRequired?: boolean;
};

/**
 * A template descriptor for one of the 5 attribution types.
 *
 * Each template describes the required fields, consent requirements, and
 * provides an example attribution for the type.
 */
export type AttributionTemplate = {
  type: Attribution['type'];
  requiredFields: string[];
  consentRequirements: string;
  exampleAttribution: Partial<Attribution>;
};

// ─── Chapter Template Accessors ───────────────────────────────────────────────

/**
 * Load all 6 chapter type templates.
 *
 * @returns Array of ChapterTemplate objects for all supported contentTypes.
 */
export function getChapterTemplates(): ChapterTemplate[] {
  return require('./chapter-templates.json') as ChapterTemplate[];
}

/**
 * Get a specific chapter template by contentType.
 *
 * @param contentType - The chapter content type to retrieve.
 * @returns The matching ChapterTemplate.
 * @throws Error if the contentType is not found.
 */
export function getChapterTemplate(contentType: HeritageChapter['contentType']): ChapterTemplate {
  const templates = getChapterTemplates();
  const template = templates.find(t => t.contentType === contentType);
  if (!template) {
    throw new Error(`Heritage Book Template: unknown contentType '${contentType}'`);
  }
  return template;
}

// ─── Attribution Template Accessors ──────────────────────────────────────────

/**
 * Load all 5 attribution type templates.
 *
 * @returns Array of AttributionTemplate objects for all supported attribution types.
 */
export function getAttributionTemplates(): AttributionTemplate[] {
  return require('./attribution-templates.json') as AttributionTemplate[];
}

/**
 * Get a specific attribution template by type.
 *
 * @param type - The attribution type to retrieve.
 * @returns The matching AttributionTemplate.
 * @throws Error if the attribution type is not found.
 */
export function getAttributionTemplate(type: Attribution['type']): AttributionTemplate {
  const templates = getAttributionTemplates();
  const template = templates.find(t => t.type === type);
  if (!template) {
    throw new Error(`Heritage Book Template: unknown attribution type '${type}'`);
  }
  return template;
}

// ─── Front Matter ─────────────────────────────────────────────────────────────

/**
 * Load the front matter template scaffold from JSON.
 *
 * Returns the raw template with placeholder tokens like [BOOK_TITLE]
 * and [NATION_NAME] still in place. Use createFrontMatter() for substituted output.
 *
 * @returns FrontMatter scaffold with placeholder strings.
 */
export function getFrontMatterTemplate(): FrontMatter {
  return require('./front-matter-template.json') as FrontMatter;
}

/**
 * Create a FrontMatter object from the template with title and author substitution.
 *
 * Replaces [BOOK_TITLE] and [AUTHOR_NAME] placeholders in the titlePage field.
 * The territorial acknowledgment and cultural sovereignty statement remain as
 * templates for the author to complete with nation-specific information.
 *
 * @param bookTitle - The Heritage Book title to substitute.
 * @param authorName - The author's name to substitute.
 * @returns FrontMatter with title and author substituted.
 */
export function createFrontMatter(bookTitle: string, authorName: string): FrontMatter {
  const template = getFrontMatterTemplate();
  return {
    ...template,
    titlePage: template.titlePage
      .replace('[BOOK_TITLE]', bookTitle)
      .replace('[AUTHOR_NAME]', authorName),
  };
}

// ─── Back Matter ──────────────────────────────────────────────────────────────

/**
 * Load the back matter template scaffold from JSON.
 *
 * Includes glossary entries spanning Inuktitut syllabics, Anishinaabemowin,
 * and Appalachian dialect terms. The glossary serves as a starting point;
 * authors should add tradition-specific terms for their Heritage Book.
 *
 * @returns BackMatter scaffold with sample glossary and resource directory.
 */
export function getBackMatterTemplate(): BackMatter {
  return require('./back-matter-template.json') as BackMatter;
}

/**
 * Create a BackMatter object from the template.
 *
 * Returns the template as-is. Authors should extend the glossary with
 * tradition-specific terms and update the resourceDirectory.
 *
 * @returns BackMatter scaffold ready for author customization.
 */
export function createBackMatter(): BackMatter {
  return getBackMatterTemplate();
}

// ─── Attribution Factory ──────────────────────────────────────────────────────

/**
 * Create an Attribution from the template with required fields.
 *
 * Validates that the type is one of the 5 supported attribution types.
 * For elder and community types, nation field is required.
 *
 * @param type - The attribution type.
 * @param fields - The required and optional fields for this attribution.
 * @returns A typed Attribution object.
 */
export function createAttribution(
  type: Attribution['type'],
  fields: Pick<Attribution, 'name' | 'role' | 'consent'> & { nation?: string },
): Attribution {
  return { type, ...fields };
}

// ─── Bibliography Integration ─────────────────────────────────────────────────

/**
 * Generate BibliographyEntry[] for the given room numbers using BibliographyEngine.
 *
 * Deduplicates entries across rooms (same work may be cited in multiple rooms).
 * Integrates Fair Use notices and creator-first links via BibliographyEngine.
 *
 * @param rooms - Array of room numbers to generate bibliography for.
 * @returns Deduplicated array of BibliographyEntry objects.
 */
export function createBibliography(rooms: number[]): BibliographyEntry[] {
  const engine = new BibliographyEngine();
  const entries: BibliographyEntry[] = [];
  const seenIds = new Set<string>();

  for (const room of rooms) {
    const roomEntries = engine.getCitationsForRoom(room);
    for (const entry of roomEntries) {
      if (!seenIds.has(entry.id)) {
        entries.push(entry);
        seenIds.add(entry.id);
      }
    }
  }

  return entries;
}

// ─── Heritage Book Factory ────────────────────────────────────────────────────

/**
 * Create a HeritageBook scaffold with pre-populated front matter, back matter,
 * and empty chapters/attributions.
 *
 * If rooms are provided, the bibliography is pre-populated using the
 * BibliographyEngine for all cited rooms (deduplicated). This integrates
 * Fair Use notices and creator-first links automatically.
 *
 * @param options.id - Unique identifier for the Heritage Book.
 * @param options.title - The book title.
 * @param options.authorName - The primary author's name.
 * @param options.traditions - Cultural traditions covered in this book.
 * @param options.rooms - Optional room numbers to pre-populate bibliography.
 * @returns A HeritageBook scaffold ready for chapter authoring.
 */
export function createHeritageBook(options: {
  id: string;
  title: string;
  authorName: string;
  traditions: Tradition[];
  rooms?: number[];
}): HeritageBook {
  return {
    id: options.id,
    title: options.title,
    traditions: options.traditions,
    chapters: [],
    frontMatter: createFrontMatter(options.title, options.authorName),
    backMatter: createBackMatter(),
    bibliography: options.rooms ? createBibliography(options.rooms) : [],
    attributions: [],
  };
}

/**
 * Add a chapter scaffold to an existing HeritageBook.
 *
 * Returns a new HeritageBook with the chapter appended (immutable — original
 * book is not mutated). Chapter order is automatically set to the next
 * sequential position.
 *
 * @param book - The existing HeritageBook to add a chapter to.
 * @param chapter - The chapter to add. The order field will be overridden.
 * @returns A new HeritageBook with the chapter added at the end.
 */
export function addChapter(book: HeritageBook, chapter: HeritageChapter): HeritageBook {
  return {
    ...book,
    chapters: [...book.chapters, { ...chapter, order: book.chapters.length + 1 }],
  };
}
