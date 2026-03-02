/**
 * Bibliography Engine — citation formatting, Fair Use notice generation,
 * and cross-reference system for the Heritage Skills Educational Pack.
 *
 * Sits on top of the Canonical Works Library (Plan 04) and produces
 * properly formatted citations for room content, Heritage Book
 * bibliographies, and cross-reference indexes.
 *
 * Three citation styles supported:
 * - Chicago Notes-Bibliography (17th edition)
 * - MLA Works Cited (9th edition)
 * - APA Reference List (7th edition)
 *
 * Creator-first principle: every BibliographyEntry includes the priority-1
 * purchase link from the CanonicalWork so learners can support creators
 * directly. For Indigenous works, the fair use notice includes cultural
 * sovereignty statements and OCAP® compliance notes.
 *
 * @module heritage-skills-pack/canonical-works/bibliography-engine
 */

import type { CanonicalWork, BibliographyEntry, RoomNumber } from '../shared/types.js';
import { loadAllCatalogs, loadFairUseNotice, getWorksByRoom } from './index.js';

// ─── Public Types ──────────────────────────────────────────────────────────────

/**
 * Citation formatting style.
 *
 * chicago: Notes-Bibliography (17th ed.)
 * mla: Works Cited (9th ed.)
 * apa: Reference List (7th ed.)
 */
export type CitationStyle = 'chicago' | 'mla' | 'apa';

// ─── BibliographyEngine ────────────────────────────────────────────────────────

/**
 * Stateful citation engine with cached catalog data.
 *
 * Use the class directly for repeated operations (avoids re-loading catalogs
 * on each call). Use the convenience function exports for one-off lookups.
 */
export class BibliographyEngine {
  private readonly catalogs: CanonicalWork[];

  constructor() {
    this.catalogs = loadAllCatalogs();
  }

  /**
   * Format a citation in the specified style.
   *
   * @param work - The canonical work to cite.
   * @param style - Citation style ('chicago', 'mla', or 'apa'). Defaults to 'chicago'.
   * @returns Formatted citation string.
   */
  formatCitation(work: CanonicalWork, style: CitationStyle = 'chicago'): string {
    switch (style) {
      case 'chicago': return this.formatChicago(work);
      case 'mla':     return this.formatMLA(work);
      case 'apa':     return this.formatAPA(work);
    }
  }

  /**
   * Generate a Fair Use notice for a specific work.
   *
   * Loads the tradition-specific template from the fair-use-notices directory
   * and substitutes the work's title, authors, and creator link.
   *
   * @param work - The canonical work to generate a notice for.
   * @returns Completed fair use notice string.
   */
  generateFairUseNotice(work: CanonicalWork): string {
    const notice = loadFairUseNotice(work.tradition);
    const authors = work.authors.join(', ');
    const creatorLink = work.purchaseLinks.find(l => l.priority === 1)?.url ?? '';

    // Flatten additionalNotes into a single readable paragraph
    const additionalNotesText = Object.values(notice.additionalNotes).join(' ');

    let result = notice.noticeTemplate
      .replace('{work_title}', work.title)
      .replace('{authors}', authors)
      .replace('{additional_notes}', additionalNotesText)
      .replace('{creator_link}', creatorLink);

    // For Indigenous traditions, append the cultural sovereignty statement
    // and OCAP compliance note when present
    if (notice.culturalSovereigntyStatement) {
      result += ` ${notice.culturalSovereigntyStatement}`;
    }
    if (notice.ocapComplianceNote) {
      result += ` ${notice.ocapComplianceNote}`;
    }

    return result;
  }

  /**
   * Validate that the priority-1 purchase link is creator-direct.
   *
   * A creator-direct link goes to the original author, community publisher,
   * or creator-owned platform (e.g., foxfire.org, inhabitmedia.com, itk.ca).
   *
   * @param work - The canonical work to validate.
   * @returns true if the priority-1 purchase link has isCreatorDirect=true.
   */
  validateCreatorFirstLink(work: CanonicalWork): boolean {
    const priority1 = work.purchaseLinks.find(l => l.priority === 1);
    return priority1?.isCreatorDirect === true;
  }

  /**
   * Format community attribution for a canonical work.
   *
   * For Indigenous works (First Nations, Inuit), includes nation/community
   * context, community endorsement statement, and knowledge source type.
   * For Appalachian works, returns a standard author attribution.
   *
   * @param work - The canonical work to format attribution for.
   * @returns Human-readable attribution string.
   */
  formatCommunityAttribution(work: CanonicalWork): string {
    const tradition = work.tradition;

    if (tradition === 'appalachian') {
      const authorsFormatted = work.authors.join(', ');
      return `Source: ${authorsFormatted}. ${work.title}. Knowledge source: ${work.knowledgeSource}.`;
    }

    // Indigenous works: include community context
    const parts: string[] = [];

    // Determine community/nation descriptor
    const traditionLabel = tradition === 'inuit' ? 'Inuit' : 'First Nations';
    parts.push(`Sourced from ${traditionLabel} community knowledge.`);

    // Include community endorsement when present
    if (work.communityEndorsement) {
      parts.push(`Community endorsement: ${work.communityEndorsement}`);
    }

    // Knowledge source type
    parts.push(`Knowledge source: ${work.knowledgeSource}.`);

    // Consent note based on knowledge source
    if (work.knowledgeSource === 'community-authorized') {
      parts.push('Content used with community authorization.');
    } else if (work.knowledgeSource === 'published-book') {
      parts.push('Content sourced from published works by Indigenous authors.');
    }

    return parts.join(' ');
  }

  /**
   * Get formatted bibliography entries for all canonical works relevant to a room.
   *
   * @param room - The room number to look up works for.
   * @param style - Citation style. Defaults to 'chicago'.
   * @returns Array of BibliographyEntry objects with all fields populated.
   */
  getCitationsForRoom(room: RoomNumber | number, style: CitationStyle = 'chicago'): BibliographyEntry[] {
    const works = getWorksByRoom(room as RoomNumber);
    return works.map(work => ({
      id: work.id,
      citation: this.formatCitation(work, style),
      fairUseNotice: this.generateFairUseNotice(work),
      creatorFirstLink: work.purchaseLinks.find(l => l.priority === 1)?.url ?? '',
      isIndigenousSource: work.tradition !== 'appalachian',
      communityPermission: work.communityEndorsement,
    }));
  }

  // ─── Private Citation Formatters ──────────────────────────────────────────────

  /**
   * Chicago Notes-Bibliography format (17th edition).
   *
   * Pattern: LastName, FirstName[, ed.]. Title. Place: Publisher, Year[. ISBN].
   * For works with volume references, the series title is cited without
   * individual volumes (the series entry is what appears in bibliographies).
   */
  private formatChicago(work: CanonicalWork): string {
    const authorPart = formatAuthorsChicago(work.authors);
    const publisherInfo = extractPublisherInfo(work);
    const isbnPart = work.isbn ? ` ISBN: ${work.isbn}.` : '';

    if (work.volumeRefs && work.volumeRefs.length > 0) {
      // Multi-volume series: cite the series entry
      const yearRange = `${work.volumeRefs[0]!.year}–${work.volumeRefs[work.volumeRefs.length - 1]!.year}`;
      return `${authorPart}. ${work.title}. ${publisherInfo.place}: ${publisherInfo.publisher}, ${yearRange}.${isbnPart}`;
    }

    return `${authorPart}. ${work.title}. ${publisherInfo.place}: ${publisherInfo.publisher}, ${publisherInfo.year}.${isbnPart}`;
  }

  /**
   * MLA Works Cited format (9th edition).
   *
   * Pattern: LastName, FirstName[, editor]. Title. Publisher, Year.
   */
  private formatMLA(work: CanonicalWork): string {
    const authorPart = formatAuthorsMLA(work.authors);
    const publisherInfo = extractPublisherInfo(work);
    const editorSuffix = isEditorWork(work.authors) ? ', editor.' : '.';

    if (work.volumeRefs && work.volumeRefs.length > 0) {
      const yearRange = `${work.volumeRefs[0]!.year}–${work.volumeRefs[work.volumeRefs.length - 1]!.year}`;
      return `${authorPart}${editorSuffix} ${work.title}. ${publisherInfo.publisher}, ${yearRange}.`;
    }

    return `${authorPart}${editorSuffix} ${work.title}. ${publisherInfo.publisher}, ${publisherInfo.year}.`;
  }

  /**
   * APA Reference List format (7th edition).
   *
   * Pattern: LastName, I.[, Ed.]. (Year). Title in sentence case. Publisher.
   */
  private formatAPA(work: CanonicalWork): string {
    const authorPart = formatAuthorsAPA(work.authors);
    const publisherInfo = extractPublisherInfo(work);
    const editorSuffix = isEditorWork(work.authors) ? ' (Ed.).' : '.';
    const titleInSentenceCase = toSentenceCase(work.title);

    if (work.volumeRefs && work.volumeRefs.length > 0) {
      const firstYear = work.volumeRefs[0]!.year;
      const lastYear = work.volumeRefs[work.volumeRefs.length - 1]!.year;
      return `${authorPart}${editorSuffix} (${firstYear}–${lastYear}). ${titleInSentenceCase}. ${publisherInfo.publisher}.`;
    }

    return `${authorPart}${editorSuffix} (${publisherInfo.year}). ${titleInSentenceCase}. ${publisherInfo.publisher}.`;
  }
}

// ─── Convenience Exports ──────────────────────────────────────────────────────

/**
 * Format a citation in the specified style (one-off, creates new engine instance).
 *
 * @param work - The canonical work to cite.
 * @param style - Citation style. Defaults to 'chicago'.
 */
export function formatCitation(work: CanonicalWork, style?: CitationStyle): string {
  return new BibliographyEngine().formatCitation(work, style);
}

/**
 * Generate a Fair Use notice for a specific work (one-off).
 *
 * @param work - The canonical work to generate a notice for.
 */
export function generateFairUseNotice(work: CanonicalWork): string {
  return new BibliographyEngine().generateFairUseNotice(work);
}

/**
 * Validate that the priority-1 purchase link is creator-direct (one-off).
 *
 * @param work - The canonical work to validate.
 */
export function validateCreatorFirstLink(work: CanonicalWork): boolean {
  return new BibliographyEngine().validateCreatorFirstLink(work);
}

/**
 * Format community attribution for a canonical work (one-off).
 *
 * @param work - The canonical work to format attribution for.
 */
export function formatCommunityAttribution(work: CanonicalWork): string {
  return new BibliographyEngine().formatCommunityAttribution(work);
}

/**
 * Get formatted bibliography entries for all works relevant to a room (one-off).
 *
 * @param room - The room number to look up works for.
 * @param style - Citation style. Defaults to 'chicago'.
 */
export function getCitationsForRoom(room: RoomNumber | number, style?: CitationStyle): BibliographyEntry[] {
  return new BibliographyEngine().getCitationsForRoom(room, style);
}

// ─── Internal Formatting Helpers ──────────────────────────────────────────────

/**
 * Infer publisher name and place from purchase links.
 *
 * Two-pass strategy:
 * 1. Scan all links in priority order; return the first vendor whose raw name
 *    maps to a known publisher (i.e., resolvePublisherName produces a different,
 *    clean result — the vendor IS a known publisher).
 * 2. If no known-publisher match, fall back to the first non-bookseller vendor.
 * 3. If all vendors are booksellers, use the priority-1 vendor name.
 *
 * This correctly handles both:
 * - Priority 1 = creator org (foxfire.org) + priority 2 = publisher (Anchor Books)
 * - Priority 1 = creator-direct publisher (Milkweed Editions) + priority 2 = bookseller
 */
function extractPublisherInfo(work: CanonicalWork): { publisher: string; place: string; year: number } {
  const sorted = [...work.purchaseLinks].sort((a, b) => a.priority - b.priority);

  // Generic booksellers are distribution channels, not publishers
  const isGenericBookseller = (vendor: string): boolean =>
    /bookshop\.org|amazon|indigo|chapters|birchbark books/i.test(vendor);

  // Pass 1: find a vendor whose name resolves to a known clean publisher label
  let vendorName: string | undefined;
  for (const link of sorted) {
    if (isGenericBookseller(link.vendor)) continue;
    const resolved = resolvePublisherName(link.vendor);
    const stripped = link.vendor.replace(/\s*\([^)]*\)/g, '').trim();
    if (resolved !== stripped) {
      // The vendor name resolved to a different (cleaned) known publisher
      vendorName = resolved;
      break;
    }
  }

  // Pass 2: first non-bookseller if no known-publisher match found
  if (!vendorName) {
    for (const link of sorted) {
      if (!isGenericBookseller(link.vendor)) {
        vendorName = resolvePublisherName(link.vendor);
        break;
      }
    }
  }

  // Pass 3: absolute fallback — priority-1 vendor
  if (!vendorName) {
    vendorName = resolvePublisherName(sorted[0]?.vendor ?? 'Publisher');
  }

  // Map known vendor names to clean publisher labels (idempotent second pass)
  const publisherName = resolvePublisherName(vendorName);

  // Extract publication year from volumeRefs or a heuristic default
  let year = 2000;
  if (work.volumeRefs && work.volumeRefs.length > 0) {
    year = work.volumeRefs[0]!.year;
  } else {
    // Infer from ISBN decade or fall back to 2000
    year = inferYearFromContext(work);
  }

  // Place of publication: known publishers have known locations
  const place = resolvePublisherPlace(publisherName);

  return { publisher: publisherName, place, year };
}

/**
 * Known vendor name → clean publisher label for citation use.
 */
function resolvePublisherName(vendor: string): string {
  const vendorLower = vendor.toLowerCase();

  if (vendorLower.includes('anchor') || vendorLower.includes('doubleday')) return 'Anchor Press';
  if (vendorLower.includes('penguin random house canada')) return 'McClelland & Stewart';
  if (vendorLower.includes('penguin random house')) return 'Anchor Press';
  if (vendorLower.includes('unc press') || vendorLower.includes('university of north carolina')) return 'University of North Carolina Press';
  if (vendorLower.includes('university of minnesota')) return 'University of Minnesota Press';
  if (vendorLower.includes('milkweed')) return 'Milkweed Editions';
  if (vendorLower.includes('inhabit media')) return 'Inhabit Media';
  if (vendorLower.includes('hyperion') || vendorLower.includes('hachette')) return 'Hyperion Books';
  if (vendorLower.includes('itk') || vendorLower.includes('inuit tapiriit')) return 'Inuit Tapiriit Kanatami';
  if (vendorLower.includes('foxfire')) return 'Anchor Press';
  if (vendorLower.includes('arctic institute')) return 'Arctic Institute of North America';
  if (vendorLower.includes('nunavut arctic college') || vendorLower.includes('canadian arctic resources')) return 'Canadian Arctic Resources Committee';

  // Strip parenthetical notes like "(Publisher Direct)", "(Creator Direct)"
  return vendor.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Known publisher → city of publication for Chicago citations.
 */
function resolvePublisherPlace(publisher: string): string {
  const p = publisher.toLowerCase();

  if (p.includes('anchor press') || p.includes('doubleday')) return 'Garden City, NY';
  if (p.includes('university of north carolina')) return 'Chapel Hill, NC';
  if (p.includes('university of minnesota')) return 'Minneapolis, MN';
  if (p.includes('milkweed')) return 'Minneapolis, MN';
  if (p.includes('inhabit media')) return 'Iqaluit, NU';
  if (p.includes('hyperion')) return 'New York, NY';
  if (p.includes('mcclelland')) return 'Toronto, ON';
  if (p.includes('inuit tapiriit')) return 'Ottawa, ON';
  if (p.includes('arctic institute')) return 'Calgary, AB';
  if (p.includes('canadian arctic resources')) return 'Ottawa, ON';

  return 'n.p.';
}

/**
 * Heuristic year inference when volumeRefs is absent.
 * Checks communityEndorsement text for 4-digit years; defaults to 2000.
 */
function inferYearFromContext(work: CanonicalWork): number {
  const text = [work.description, work.communityEndorsement ?? ''].join(' ');
  const match = /\b(19[6-9]\d|20[012]\d)\b/.exec(text);
  return match ? parseInt(match[1]!, 10) : 2000;
}

/**
 * Format author list in Chicago Notes-Bibliography style.
 *
 * - 1 author: "LastName, FirstName"
 * - 2 authors: "LastName, FirstName, and FirstName LastName"
 * - 3+ authors: "LastName, FirstName, et al."
 * - Corporate/community names (no comma in name): used as-is
 */
function formatAuthorsChicago(authors: string[]): string {
  if (authors.length === 0) return '';

  const first = authors[0]!;
  if (authors.length === 1) {
    return invertName(first);
  }
  if (authors.length === 2) {
    return `${invertName(first)}, and ${authors[1]}`;
  }
  return `${invertName(first)}, et al.`;
}

/**
 * Format author list in MLA 9th edition style.
 *
 * - 1 author: "LastName, FirstName"
 * - 2 authors: "LastName, FirstName, and FirstName LastName"
 * - 3+ authors: "LastName, FirstName, et al."
 */
function formatAuthorsMLA(authors: string[]): string {
  // MLA uses the same inversion pattern as Chicago for the first author
  return formatAuthorsChicago(authors);
}

/**
 * Format author list in APA 7th edition style.
 *
 * - Personal names: abbreviated to "LastName, I." (first initial only)
 * - Corporate/community names: used as-is
 * - Multiple authors: joined with ", & " before last
 */
function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 0) return '';

  const formatted = authors.map(author => abbreviateNameAPA(author));

  if (formatted.length === 1) return formatted[0]!;
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;

  // 3+ authors: list all separated by commas, last preceded by "&"
  const allButLast = formatted.slice(0, -1).join(', ');
  return `${allButLast}, & ${formatted[formatted.length - 1]}`;
}

/**
 * Invert a personal name to Last, First format for Chicago/MLA.
 * If the name contains no space (single word) or is a corporate/community name
 * detected by common patterns, it is returned as-is.
 */
function invertName(name: string): string {
  // Corporate/community names: detect by common patterns
  if (isCorporateName(name)) return name;

  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;

  const last = parts[parts.length - 1]!;
  const first = parts.slice(0, -1).join(' ');
  return `${last}, ${first}`;
}

/**
 * Abbreviate a personal name to "Last, I." (first initial) for APA.
 * Corporate/community names are returned as-is.
 */
function abbreviateNameAPA(name: string): string {
  if (isCorporateName(name)) return name;

  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;

  const last = parts[parts.length - 1]!;
  const firstInitial = parts[0]!.charAt(0).toUpperCase();
  return `${last}, ${firstInitial}.`;
}

/**
 * Detect whether a name is a corporate/community author (not a personal name).
 * Uses heuristics: contains known institutional keywords, or parts that don't
 * look like a standard First Last pattern.
 */
function isCorporateName(name: string): boolean {
  const corporate = [
    'Foxfire Students',
    'Inhabit Media',
    'Various Inuit Elders',
    'Inuit Tapiriit Kanatami',
    'Canadian Arctic Resources Committee',
  ];
  if (corporate.includes(name)) return true;

  // Names with more than 3 parts or containing comma (e.g., "McDonald, M.")
  // are treated as already-formatted citations — return as-is
  if (name.includes(',')) return true;

  // Detect organizational names by common words
  const orgWords = ['Institute', 'Committee', 'Council', 'Media', 'Students', 'Fund', 'Association'];
  return orgWords.some(w => name.includes(w));
}

/**
 * Check whether the work's authors list indicates an edited volume.
 *
 * A work with "Eliot Wigginton" as editor of a Foxfire anthology is an
 * edited volume. We detect this by checking if the work has volumeRefs
 * (Foxfire series) since the Foxfire books are formally edited compilations.
 */
function isEditorWork(authors: string[]): boolean {
  // Foxfire books edited by Wigginton
  return authors.includes('Eliot Wigginton') || authors.includes('Foxfire Students');
}

/**
 * Convert a title to sentence case for APA format.
 *
 * APA titles: capitalize only the first word and proper nouns.
 * This implementation lowercases all words except the first and known
 * proper nouns in the Heritage Skills catalog.
 */
function toSentenceCase(title: string): string {
  if (!title) return title;

  // Known proper nouns to preserve in sentence case
  const properNouns = new Set([
    'Foxfire', 'Appalachian', 'Appalachian',
    'Indigenous', 'Inuit', 'Ojibway', 'Ojibwe', 'Anishinaabe', 'Potawatomi',
    'Arctic', 'IQ', 'OCAP', 'ITK', 'NISR', 'Nunavut', 'Inuvialuit',
    'First', 'Nations', 'North', 'America', 'Canada', 'Bay', 'Hudson',
    'Hudson Bay', 'Qaujimajatuqangit', 'Uqaujjuusiat', 'Nanuit', 'Sinnaktangit',
    'Mishomis',
  ]);

  const words = title.split(/\s+/);
  return words
    .map((word, index) => {
      if (index === 0) return word; // Always keep first word as-is
      // Strip punctuation for lookup
      const bare = word.replace(/[^a-zA-Z]/g, '');
      if (properNouns.has(bare)) return word;
      // Lowercase this word
      return word.toLowerCase();
    })
    .join(' ');
}
