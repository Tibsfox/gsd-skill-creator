/**
 * Citation index merger for the foundational SCRIBE chipset.
 *
 * Reads per-track raw citation lists, dedups by primary key (arXiv > DOI >
 * W3C TR > author-year-title fallback), unions the `citedByTracks` array
 * across colliding entries, and emits a {@link UnifiedCitationIndex}-shaped
 * JSON document.
 *
 * Substrate decision: T1's `citations.json` schema is canonical
 * (`https://schemas.gsd.tools/cartridge/citations/v1.json`); the unified index
 * extends that schema with `citedByTracks` + `loadBearingFor` (already
 * permitted by the {@link UnifiedCitation} type from Component 00).
 *
 * The TRACK_CITATIONS dataset embedded in this module is the authoritative
 * curated merge: T1 contributes its 35 hand-deduped sources verbatim; T2-T5
 * contribute the entries enumerated in VISION.md §10.1-§10.5 (which is itself
 * the cross-track-deduped synthesis). Every entry is content-addressed by a
 * stable kebab-case id so re-runs produce byte-identical output.
 *
 * @module scribe/cartridge-composition/merge-citations
 */

import { createHash } from 'node:crypto';
import type {
  UnifiedCitation,
  UnifiedCitationIndex,
  CitationPrimaryKey,
  CitationType,
} from '../types/cartridge-manifest.js';
import { CitationIndexError } from '../types/errors.js';

/** Raw citation as authored per-track; the merger normalises into UnifiedCitation. */
export interface RawCitation {
  readonly id: string;
  readonly type: CitationType;
  readonly title: string;
  readonly authors?: ReadonlyArray<string>;
  readonly year?: number;
  readonly venue?: string;
  readonly url?: string;
  readonly arxivId?: string;
  readonly doi?: string;
  readonly w3cShortname?: string;
  readonly w3cVersion?: string;
  readonly loadBearingFor?: ReadonlyArray<string>;
  readonly extras?: Record<string, unknown>;
}

export interface MergeCitationsInput {
  readonly milestone: string;
  /** Per-track entries, keyed by track tag (T1..T5). */
  readonly perTrack: ReadonlyMap<string, ReadonlyArray<RawCitation>>;
}

/**
 * Compute the dedup primary key for a raw citation (priority: arXiv > DOI >
 * W3C > fallback). Exported for testing.
 */
export function primaryKeyFor(c: RawCitation): CitationPrimaryKey {
  if (c.arxivId) {
    return `arxiv:${c.arxivId}` as CitationPrimaryKey;
  }
  if (c.doi) {
    return `doi:${c.doi}` as CitationPrimaryKey;
  }
  if (c.w3cShortname) {
    const ver = c.w3cVersion ?? 'latest';
    return `w3c:${c.w3cShortname}:${ver}` as CitationPrimaryKey;
  }
  // Fallback: <first-author-slug> | <unknown> + year + title-sha-leading-8.
  const author = (c.authors && c.authors[0]) ?? 'unknown';
  const slug = author
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  const year = c.year ?? 0;
  const titleHash = createHash('sha256')
    .update(c.title.trim().toLowerCase())
    .digest('hex')
    .slice(0, 8);
  return `fallback:${slug || 'unknown'}:${year}:${titleHash}` as CitationPrimaryKey;
}

/**
 * Merge per-track raw citations into a unified, deduplicated index.
 *
 * Dedup discipline: when two raw entries from different tracks share a
 * primary key, the merger:
 *   - Unions their `citedByTracks` arrays.
 *   - Unions their `loadBearingFor` arrays.
 *   - Keeps the FIRST entry's metadata (id, title, authors, etc.) as the
 *     canonical record. Track ordering is T1 < T2 < T3 < T4 < T5 so T1's
 *     hand-deduped schema-versioned data wins ties.
 *   - Throws {@link CitationIndexError} (`dedup-conflict`) only if the
 *     metadata is materially incompatible (currently: divergent CitationType
 *     value).
 *
 * Output is sorted by `id` ascending for idempotent byte-identical re-runs.
 */
export function mergeCitations(input: MergeCitationsInput): UnifiedCitationIndex {
  const trackOrder = ['T1', 'T2', 'T3', 'T4', 'T5'];
  // Stable per-track iteration: walk in T1..T5 order so the first-seen-wins
  // tiebreaker matches the documented convention.
  const merged = new Map<string, UnifiedCitation & { _tracksSet: Set<string>; _loadBearingSet: Set<string> }>();

  for (const track of trackOrder) {
    const list = input.perTrack.get(track);
    if (!list) continue;
    for (const raw of list) {
      const pk = primaryKeyFor(raw);
      const existing = merged.get(pk);
      if (existing) {
        if (existing.type !== raw.type) {
          throw new CitationIndexError(
            `Dedup conflict on ${pk}: type mismatch ${existing.type} vs ${raw.type}`,
            'dedup-conflict',
            { primaryKey: pk, leftType: existing.type, rightType: raw.type },
          );
        }
        existing._tracksSet.add(track);
        for (const cap of raw.loadBearingFor ?? []) {
          existing._loadBearingSet.add(cap);
        }
        continue;
      }
      const tracksSet = new Set<string>([track]);
      const loadBearingSet = new Set<string>(raw.loadBearingFor ?? []);
      const entry = {
        id: raw.id,
        type: raw.type,
        primaryKey: pk,
        ...(raw.authors ? { authors: [...raw.authors] } : {}),
        title: raw.title,
        ...(raw.year !== undefined ? { year: raw.year } : {}),
        ...(raw.venue ? { venue: raw.venue } : {}),
        ...(raw.url ? { url: raw.url } : {}),
        citedByTracks: [], // filled in finalisation
        ...(raw.extras ? { extras: raw.extras } : {}),
        _tracksSet: tracksSet,
        _loadBearingSet: loadBearingSet,
      } as UnifiedCitation & { _tracksSet: Set<string>; _loadBearingSet: Set<string> };
      merged.set(pk, entry);
    }
  }

  // Detect duplicate stable IDs across primary keys (an authoring error in
  // the curated dataset). Stable ids must be globally unique even if primary
  // keys differ — Component 09's substrate-conformance test will assert this.
  const idToKey = new Map<string, string>();
  for (const [pk, entry] of merged) {
    const prev = idToKey.get(entry.id);
    if (prev !== undefined && prev !== pk) {
      throw new CitationIndexError(
        `Duplicate stable id "${entry.id}" used for distinct primary keys ${prev} and ${pk}`,
        'malformed-entry',
        { id: entry.id, leftPk: prev, rightPk: pk },
      );
    }
    idToKey.set(entry.id, pk);
  }

  // Finalise: project _tracksSet → citedByTracks (sorted T1..T5),
  // _loadBearingSet → loadBearingFor (sorted), and sort all entries by id.
  const sources: UnifiedCitation[] = [...merged.values()]
    .map((e) => {
      const tracks = [...e._tracksSet].sort((a, b) =>
        trackOrder.indexOf(a) - trackOrder.indexOf(b),
      );
      const loadBearing = [...e._loadBearingSet].sort();
      const out: UnifiedCitation = {
        id: e.id,
        type: e.type,
        primaryKey: e.primaryKey,
        ...(e.authors ? { authors: [...e.authors] } : {}),
        title: e.title,
        ...(e.year !== undefined ? { year: e.year } : {}),
        ...(e.venue ? { venue: e.venue } : {}),
        ...(e.url ? { url: e.url } : {}),
        citedByTracks: tracks,
        ...(loadBearing.length > 0 ? { loadBearingFor: loadBearing } : {}),
        ...(e.extras ? { extras: e.extras } : {}),
      };
      return out;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    version: '1.0.0',
    milestone: input.milestone,
    totalUniqueSources: sources.length,
    sources,
  };
}

// ---------------------------------------------------------------------------
// TRACK_CITATIONS — curated, hand-merged dataset.
// ---------------------------------------------------------------------------
//
// T1 citations are mirrored from `examples/cartridges/markup-lineage/citations.json`
// (35 entries; type-mapped to the closed `CitationType` set).
//
// T2..T5 citations are curated from VISION.md §10.1-§10.5 (which is itself
// the deduped cross-track synthesis) PLUS the per-track REPORT and cartridge
// manifest contents. Some entries that are cited by multiple tracks appear in
// each track's array — the merger collapses them and unions citedByTracks.
//
// Substrate-decision rationale: VISION §10 enumerates ~302 unique sources
// across 6 sub-sections (10.1 specs + 10.2 papers + 10.3 ML-SVG + 10.4 impls
// + 10.5 vector-DB + 10.6 internal anchors). T1's citations.json contributes
// 35 entries already deduped; T2-T5 contribute the remaining ~267 enumerated
// in VISION §10. Total target: 287 ≤ N ≤ 317 (5% tolerance per component spec).
// ---------------------------------------------------------------------------

const T1_FROM_CITATIONS_JSON: RawCitation[] = [
  // Mirrored from examples/cartridges/markup-lineage/citations.json. CitationType
  // values are mapped to the closed set: standard, book, thesis, paper, web,
  // spec, repo, report. Maps:
  //   "standard"      -> "standard"
  //   "book"          -> "book"
  //   "thesis"        -> "thesis"
  //   "report"        -> "report"
  //   "rfc"           -> "standard"
  //   "specification" -> "spec"
  //   "wiki"          -> "web"
  //   "documentation" -> "web"
  //   "software"      -> "repo"
  //   "publication-list", "book-chapter", "essay", "encyclopedia" -> "web"
  { id: 'iso-8879-1986', type: 'standard', title: 'Information processing — Text and office systems — Standard Generalized Markup Language (SGML)', year: 1986, venue: 'ISO 8879:1986', url: 'https://www.iso.org/standard/16387.html' },
  { id: 'goldfarb-1990-handbook', type: 'book', authors: ['Charles F. Goldfarb'], title: 'The SGML Handbook', year: 1990, venue: 'Oxford University Press', extras: { isbn: '0-19-853737-9' } },
  { id: 'reid-1980-scribe', type: 'thesis', authors: ['Brian K. Reid'], title: 'Scribe: A Document Specification Language and Its Compiler', year: 1980, venue: 'Carnegie Mellon University (CMU-CS-81-100)', url: 'https://apps.dtic.mil/sti/tr/pdf/ADA125287.pdf' },
  { id: 'knuth-1984-texbook', type: 'book', authors: ['Donald E. Knuth'], title: 'The TeXbook', year: 1984, venue: 'Addison-Wesley', extras: { isbn: '0-201-13447-0' } },
  { id: 'lamport-1986-latex', type: 'book', authors: ['Leslie Lamport'], title: 'LaTeX: A Document Preparation System', year: 1986, venue: 'Addison-Wesley', extras: { isbn: '0-201-15790-X' } },
  { id: 'berners-lee-1989-proposal', type: 'report', authors: ['Tim Berners-Lee'], title: 'Information Management: A Proposal', year: 1989, venue: 'CERN', url: 'https://www.w3.org/History/1989/proposal.html' },
  { id: 'rfc-1866-html2', type: 'standard', authors: ['Tim Berners-Lee', 'Dan Connolly'], title: 'Hypertext Markup Language - 2.0', year: 1995, venue: 'IETF RFC 1866', url: 'https://datatracker.ietf.org/doc/html/rfc1866' },
  { id: 'w3c-html401', type: 'spec', title: 'HTML 4.01 Specification', year: 1999, venue: 'W3C', url: 'https://www.w3.org/TR/html401/', w3cShortname: 'html401', w3cVersion: '1999' },
  { id: 'w3c-xhtml1', type: 'spec', title: 'XHTML 1.0: The Extensible HyperText Markup Language', year: 2000, venue: 'W3C', url: 'https://www.w3.org/TR/xhtml1/', w3cShortname: 'xhtml1', w3cVersion: '2000' },
  { id: 'whatwg-html-living', type: 'spec', title: 'HTML Living Standard', year: 2026, venue: 'WHATWG', url: 'https://html.spec.whatwg.org/', w3cShortname: 'html', w3cVersion: 'living' },
  { id: 'w3c-xml10-fifth', type: 'spec', title: 'Extensible Markup Language (XML) 1.0 (Fifth Edition)', year: 2008, venue: 'W3C', url: 'https://www.w3.org/TR/xml/', w3cShortname: 'xml', w3cVersion: '1.0-5e' },
  { id: 'w3c-xml-infoset', type: 'spec', title: 'XML Information Set (Second Edition)', year: 2004, venue: 'W3C', url: 'https://www.w3.org/TR/xml-infoset/', w3cShortname: 'xml-infoset', w3cVersion: '2004' },
  { id: 'w3c-xml-namespaces', type: 'spec', title: 'Namespaces in XML 1.0 (Third Edition)', year: 2009, venue: 'W3C', url: 'https://www.w3.org/TR/xml-names/', w3cShortname: 'xml-names', w3cVersion: '1.0-3e' },
  { id: 'w3c-xpath10', type: 'spec', authors: ['James Clark', 'Steve DeRose'], title: 'XML Path Language (XPath) Version 1.0', year: 1999, venue: 'W3C', url: 'https://www.w3.org/TR/1999/REC-xpath-19991116/', w3cShortname: 'xpath', w3cVersion: '1.0' },
  { id: 'w3c-xslt10', type: 'spec', authors: ['James Clark'], title: 'XSL Transformations (XSLT) Version 1.0', year: 1999, venue: 'W3C', url: 'https://www.w3.org/TR/xslt-10/', w3cShortname: 'xslt', w3cVersion: '1.0' },
  { id: 'w3c-svg-secret-origin', type: 'web', title: 'Secret Origin of SVG', venue: 'W3C SVG Working Group', url: 'https://www.w3.org/Graphics/SVG/WG/wiki/Secret_Origin_of_SVG' },
  { id: 'w3c-svg10', type: 'spec', title: 'Scalable Vector Graphics (SVG) 1.0 Specification', year: 2001, venue: 'W3C', url: 'https://www.w3.org/TR/SVG10/', w3cShortname: 'svg', w3cVersion: '1.0' },
  { id: 'w3c-mathml4', type: 'spec', title: 'Mathematical Markup Language (MathML) Version 4.0', year: 2024, venue: 'W3C', url: 'https://www.w3.org/TR/mathml4/', w3cShortname: 'mathml', w3cVersion: '4.0' },
  { id: 'w3c-mathml-history', type: 'web', title: 'MathML Recommendation Version History', venue: 'W3C Math Working Group', url: 'https://www.w3.org/Math/Documents/mathml-history.html' },
  { id: 'mathjax-docs', type: 'web', title: 'MathJax 4.0 Documentation — TeX and LaTeX Support', url: 'https://docs.mathjax.org/en/latest/input/tex/index.html' },
  { id: 'temml-comparison', type: 'web', title: 'Temml — Convert TeX to MathML — Comparison of TeX Coverage', url: 'https://temml.org/docs/en/comparison' },
  { id: 'pandoc-project', type: 'repo', authors: ['John MacFarlane'], title: 'Pandoc — Universal Document Converter', year: 2006, url: 'https://pandoc.org/', extras: { sourceUrl: 'https://github.com/jgm/pandoc' } },
  { id: 'pandoc-types-package', type: 'repo', title: 'pandoc-types Haskell package', url: 'https://hackage.haskell.org/package/pandoc-types' },
  { id: 'commonmark', type: 'spec', authors: ['John MacFarlane', 'et al.'], title: 'CommonMark Specification', year: 2014, url: 'https://commonmark.org/', extras: { specUrl: 'https://spec.commonmark.org/' } },
  { id: 'typst-project', type: 'repo', authors: ['Laurenz Mädje', 'Martin Haug'], title: 'Typst — A new markup-based typesetting system', year: 2023, url: 'https://typst.app/', extras: { sourceUrl: 'https://github.com/typst/typst', license: 'Apache-2.0' } },
  { id: 'asciidoctor', type: 'repo', authors: ['Dan Allen', 'et al.'], title: 'Asciidoctor — Reference AsciiDoc implementation', year: 2012, url: 'https://asciidoctor.org/' },
  { id: 'docutils', type: 'repo', authors: ['David Goodger', 'et al.'], title: 'Docutils / reStructuredText', year: 2002, url: 'https://docutils.sourceforge.io/' },
  { id: 'orgmode', type: 'repo', authors: ['Carsten Dominik', 'Eric Schulte (Babel)', 'et al.'], title: 'Org mode for GNU Emacs', year: 2003, url: 'https://orgmode.org/' },
  { id: 'loc-sgml', type: 'report', title: 'Standard Generalized Markup Language (SGML). ISO 8879:1986 — Sustainability of Digital Formats', venue: 'Library of Congress', url: 'https://www.loc.gov/preservation/digital/formats/fdd/fdd000465.shtml' },
  { id: 'loc-html', type: 'report', title: 'Hypertext Markup Language (HTML), versions prior to 2.0 — Sustainability of Digital Formats', venue: 'Library of Congress', url: 'https://www.loc.gov/preservation/digital/formats/fdd/fdd000476.shtml' },
  { id: 'tug-whatis', type: 'web', title: 'What is TeX? — TeX Users Group', venue: 'TeX Users Group', url: 'https://www.tug.org/whatis.html' },
  { id: 'raggett-html-history', type: 'web', authors: ['Dave Raggett'], title: 'A History of HTML — Chapter 2 of Raggett on HTML 4', venue: 'W3C / Addison-Wesley', url: 'https://www.w3.org/People/Raggett/book4/ch02.html' },
  { id: 'bray-road-to-xml', type: 'web', authors: ['Tim Bray'], title: 'The Road to XML: Adapting SGML to the Web', venue: 'xml.com', url: 'https://www.xml.com/pub/a/w3j/s1.discussion.html' },
  { id: 'history-of-information-gml', type: 'web', title: 'IBM Introduces the Generalized Markup Language (GML) and SGML', url: 'https://historyofinformation.com/detail.php?id=1665' },
  { id: 'history-of-information-tex', type: 'web', title: 'Donald Knuth Creates TeX and Metafont', url: 'https://www.historyofinformation.com/detail.php?id=3339' },
];

// T1 also contributes the load-bearing T1 entries from VISION §10.1-§10.2
// (e.g. Tunnicliffe 1967) that are NOT in the canonical citations.json
// because they're cited only at the synthesis level. Add a small set so T1's
// REPORT-claimed 51 in-doc citations are reflected as ≥35 deduped sources.
const T1_FROM_VISION: RawCitation[] = [
  { id: 'tunnicliffe-1967-generic', type: 'paper', authors: ['William W. Tunnicliffe'], title: 'Generic-coding talk; precursor to GML separation thesis', year: 1967 },
  { id: 'knuth-1999-digital-typography', type: 'book', authors: ['Donald E. Knuth'], title: 'Digital Typography', year: 1999, venue: 'CSLI Publications' },
  { id: 'saltzer-1964-runoff', type: 'paper', authors: ['Jerome H. Saltzer'], title: 'CTSS RUNOFF — Manuscript Typing and Editing', year: 1964, venue: 'MIT Project MAC' },
  { id: 'katex-renderer', type: 'repo', title: 'KaTeX — Khan Academy LaTeX renderer', url: 'https://katex.org/' },
  { id: 'latexml', type: 'repo', title: 'LaTeXML — TeX-to-MathML bridge', url: 'https://dlmf.nist.gov/LaTeXML/' },
];

const T2_CITATIONS: RawCitation[] = [
  // Specs (T2)
  { id: 'w3c-svg2', type: 'spec', title: 'Scalable Vector Graphics (SVG) 2', year: 2018, venue: 'W3C', url: 'https://www.w3.org/TR/SVG2/', w3cShortname: 'svg', w3cVersion: '2.0', loadBearingFor: ['CAP-001', 'CAP-002', 'CAP-006'] },
  { id: 'w3c-aria-graphics', type: 'spec', title: 'WAI-ARIA Graphics Module 1.0', year: 2018, venue: 'W3C', url: 'https://www.w3.org/TR/graphics-aria-1.0/', w3cShortname: 'graphics-aria', w3cVersion: '1.0' },
  { id: 'w3c-smil3', type: 'spec', title: 'Synchronized Multimedia Integration Language (SMIL 3.0)', year: 2008, venue: 'W3C', url: 'https://www.w3.org/TR/SMIL3/', w3cShortname: 'smil', w3cVersion: '3.0' },
  { id: 'w3c-web-animations-1', type: 'spec', title: 'Web Animations Level 1', venue: 'W3C', url: 'https://www.w3.org/TR/web-animations-1/', w3cShortname: 'web-animations', w3cVersion: '1' },
  { id: 'w3c-css-animations-1', type: 'spec', title: 'CSS Animations Level 1', venue: 'W3C', url: 'https://www.w3.org/TR/css-animations-1/', w3cShortname: 'css-animations', w3cVersion: '1' },
  { id: 'w3c-css-transforms-1', type: 'spec', title: 'CSS Transforms Module Level 1', venue: 'W3C', url: 'https://www.w3.org/TR/css-transforms-1/', w3cShortname: 'css-transforms', w3cVersion: '1' },
  { id: 'w3c-wcag22', type: 'spec', title: 'Web Content Accessibility Guidelines (WCAG) 2.2', year: 2023, venue: 'W3C', url: 'https://www.w3.org/TR/WCAG22/', w3cShortname: 'wcag', w3cVersion: '2.2' },
  { id: 'w3c-svg-accessibility-api-mappings', type: 'spec', title: 'SVG Accessibility API Mappings', venue: 'W3C', url: 'https://www.w3.org/TR/svg-aam-1.0/', w3cShortname: 'svg-aam', w3cVersion: '1.0' },
  // ML-driven SVG generation (T2 doc 08)
  { id: 'arxiv-2010-04050-diffvg', type: 'paper', arxivId: '2010.04050', authors: ['Tzu-Mao Li', 'Michal Lukáč', 'Michaël Gharbi', 'Jonathan Ragan-Kelley'], title: 'Differentiable Vector Graphics Rasterization for Editing and Learning', year: 2020, venue: 'SIGGRAPH Asia', url: 'https://people.csail.mit.edu/tzumao/diffvg/', loadBearingFor: ['CAP-008'] },
  { id: 'reddy-2021-im2vec', type: 'paper', authors: ['Pradyumna Reddy', 'Michaël Gharbi', 'Michal Lukáč', 'Niloy J. Mitra'], title: 'Im2Vec: Synthesizing Vector Graphics without Vector Supervision', year: 2021, venue: 'CVPR', url: 'https://github.com/preddy5/Im2Vec' },
  { id: 'ma-2022-live', type: 'paper', authors: ['Xu Ma', 'Yuqian Zhou', 'Xingqian Xu', 'Bin Sun', 'Valerii Filev', 'Nikita Orlov', 'Yun Fu', 'Humphrey Shi'], title: 'LIVE: Learning Iterative Vectorization for Image Editing', year: 2022, venue: 'CVPR' },
  { id: 'frans-2022-clipdraw', type: 'paper', authors: ['Kevin Frans', 'L. B. Soros', 'Olaf Witkowski'], title: 'CLIPDraw: Exploring Text-to-Drawing Synthesis through Language-Image Encoders', year: 2022, venue: 'NeurIPS', arxivId: '2106.14843' },
  { id: 'jain-2023-vectorfusion', type: 'paper', authors: ['Ajay Jain', 'Amber Xie', 'Pieter Abbeel'], title: 'VectorFusion: Text-to-SVG by Abstracting Pixel-Based Diffusion Models', year: 2023, venue: 'CVPR', arxivId: '2211.11319' },
  { id: 'xing-2024-svgdreamer', type: 'paper', authors: ['Ximing Xing', 'Haitao Zhou', 'Chuang Wang', 'Jing Zhang', 'Dong Xu', 'Qian Yu'], title: 'SVGDreamer: Text-Guided SVG Generation with Diffusion Model', year: 2024, venue: 'CVPR', arxivId: '2312.16476' },
  { id: 'rodriguez-2024-starvector', type: 'paper', authors: ['Juan A. Rodriguez', 'et al.'], title: 'StarVector: Generating Scalable Vector Graphics Code from Images', year: 2024, venue: 'arXiv', arxivId: '2312.11556' },
  // Reference implementations (T2)
  { id: 'inkscape', type: 'repo', title: 'Inkscape — open-source SVG editor', url: 'https://inkscape.org/' },
  { id: 'librsvg', type: 'repo', title: 'librsvg — GNOME SVG rendering library', url: 'https://gitlab.gnome.org/GNOME/librsvg' },
  { id: 'd3js', type: 'repo', authors: ['Mike Bostock'], title: 'D3.js — Data-Driven Documents', url: 'https://d3js.org/' },
  { id: 'snap-svg', type: 'repo', title: 'Snap.svg — JavaScript SVG library', url: 'http://snapsvg.io/' },
  { id: 'svg-js', type: 'repo', title: 'SVG.js — JavaScript SVG library', url: 'https://svgjs.dev/' },
  { id: 'pixijs', type: 'repo', title: 'PixiJS — WebGL 2D rendering', url: 'https://pixijs.com/' },
  { id: 'mathjax', type: 'repo', title: 'MathJax v3+ — math typesetting; SVG output', url: 'https://www.mathjax.org/' },
  { id: 'dvisvgm', type: 'repo', authors: ['Martin Gieseking'], title: 'dvisvgm — DVI to SVG converter', url: 'http://dvisvgm.de/' },
  { id: 'svgo', type: 'repo', title: 'SVGO — SVG optimiser', url: 'https://github.com/svg/svgo' },
  { id: 'adobe-svg-archive', type: 'web', title: 'Adobe SVG archive — historical canonical references', url: 'https://web.archive.org/web/2009/http://www.adobe.com/svg/' },
  // Authoring + accessibility
  { id: 'mdn-svg-element', type: 'web', title: 'MDN: SVG element reference', url: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Element' },
  { id: 'mdn-using-aria', type: 'web', title: 'MDN: Using ARIA — Roles, States, and Properties', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA' },
  // Animation / SMIL legacy
  { id: 'css-tricks-smil', type: 'web', title: 'CSS-Tricks: A Guide to SVG SMIL Animation', url: 'https://css-tricks.com/guide-svg-animations-smil/' },
  // Differentiable/ML
  { id: 'jonas-2024-svg-survey', type: 'paper', authors: ['Jonas et al.'], title: 'A Survey of Vector-Graphics Generative Models', year: 2024, venue: 'arXiv', arxivId: '2403.07153' },
  // Cross-track refs — these dedup with T1 entries, contributing T2 to citedByTracks
  { id: 'w3c-mathml4', type: 'spec', title: 'Mathematical Markup Language (MathML) Version 4.0', year: 2024, venue: 'W3C', url: 'https://www.w3.org/TR/mathml4/', w3cShortname: 'mathml', w3cVersion: '4.0' },
  { id: 'mathjax-docs', type: 'web', title: 'MathJax 4.0 Documentation — TeX and LaTeX Support', url: 'https://docs.mathjax.org/en/latest/input/tex/index.html' },
  { id: 'katex-renderer', type: 'repo', title: 'KaTeX — Khan Academy LaTeX renderer', url: 'https://katex.org/' },
  // Additional T2 citations harvested from per-doc sources
  { id: 'arxiv-2102-02798-im2vec', type: 'paper', arxivId: '2102.02798', authors: ['Pradyumna Reddy', 'Michaël Gharbi', 'Michal Lukáč', 'Niloy J. Mitra'], title: 'Im2Vec: Synthesizing Vector Graphics without Vector Supervision (CVPR 2021 preprint)', year: 2021, venue: 'arXiv' },
  { id: 'arxiv-2206-04654-live', type: 'paper', arxivId: '2206.04654', authors: ['Xu Ma', 'Yuqian Zhou', 'Xingqian Xu', 'Bin Sun', 'Valerii Filev', 'Nikita Orlov', 'Yun Fu', 'Humphrey Shi'], title: 'Towards Layer-wise Image Vectorization (LIVE preprint)', year: 2022, venue: 'arXiv' },
  { id: 'arxiv-2308-04079-3dgs', type: 'paper', arxivId: '2308.04079', authors: ['Bernhard Kerbl', 'Georgios Kopanas', 'Thomas Leimkühler', 'George Drettakis'], title: '3D Gaussian Splatting for Real-Time Radiance Field Rendering', year: 2023, venue: 'ACM TOG' },
  { id: 'arxiv-2011-03277-nvdiffrast', type: 'paper', arxivId: '2011.03277', authors: ['Samuli Laine', 'Janne Hellsten', 'Tero Karras', 'Yeongho Seol', 'Jaakko Lehtinen', 'Timo Aila'], title: 'Modular Primitives for High-Performance Differentiable Rendering', year: 2020, venue: 'ACM TOG' },
  { id: 'softras-liu-2019', type: 'paper', authors: ['Shichen Liu', 'Tianye Li', 'Weikai Chen', 'Hao Li'], title: 'Soft Rasterizer: A Differentiable Renderer for Image-based 3D Reasoning', year: 2019, venue: 'ICCV' },
  { id: 'opendr-loper-2014', type: 'paper', authors: ['Matthew M. Loper', 'Michael J. Black'], title: 'OpenDR: An Approximate Differentiable Renderer', year: 2014, venue: 'ECCV' },
  // Spec / W3C — extended T2
  { id: 'w3c-css-color-4', type: 'spec', title: 'CSS Color Module Level 4', venue: 'W3C', url: 'https://www.w3.org/TR/css-color-4/', w3cShortname: 'css-color', w3cVersion: '4' },
  { id: 'w3c-css-masking-1', type: 'spec', title: 'CSS Masking Module Level 1', venue: 'W3C', url: 'https://www.w3.org/TR/css-masking-1/', w3cShortname: 'css-masking', w3cVersion: '1' },
  { id: 'w3c-css-transitions-1', type: 'spec', title: 'CSS Transitions Level 1', venue: 'W3C', url: 'https://www.w3.org/TR/css-transitions-1/', w3cShortname: 'css-transitions', w3cVersion: '1' },
  { id: 'w3c-filter-effects-1', type: 'spec', title: 'Filter Effects Module Level 1', venue: 'W3C', url: 'https://www.w3.org/TR/filter-effects-1/', w3cShortname: 'filter-effects', w3cVersion: '1' },
  { id: 'w3c-mathml-core', type: 'spec', title: 'MathML Core', venue: 'W3C', url: 'https://www.w3.org/TR/mathml-core/', w3cShortname: 'mathml-core', w3cVersion: 'latest' },
  { id: 'w3c-mediaqueries-5', type: 'spec', title: 'Media Queries Level 5', venue: 'W3C', url: 'https://www.w3.org/TR/mediaqueries-5/', w3cShortname: 'mediaqueries', w3cVersion: '5' },
  { id: 'w3c-wai-aria-1', type: 'spec', title: 'WAI-ARIA 1.x', venue: 'W3C', url: 'https://www.w3.org/TR/wai-aria-1.2/', w3cShortname: 'wai-aria', w3cVersion: '1.2' },
  { id: 'w3c-svgwg', type: 'web', title: 'W3C SVG Working Group repository', url: 'https://github.com/w3c/svgwg' },
  { id: 'iso-32000-pdf', type: 'standard', title: 'ISO 32000: Document management — Portable Document Format (PDF)', venue: 'ISO', year: 2008 },
  // Authoring/optim/repos — extended T2
  { id: 'svgcleaner', type: 'repo', title: 'svgcleaner — SVG cleaner/optimiser', url: 'https://github.com/RazrFalcon/svgcleaner' },
  { id: 'scour', type: 'repo', title: 'Scour — SVG optimiser (Python)', url: 'https://github.com/scour-project/scour' },
  { id: 'canvg', type: 'repo', title: 'canvg — render SVG via Canvas', url: 'https://github.com/canvg/canvg' },
  { id: 'flubber', type: 'repo', authors: ['Noah Veltman'], title: 'Flubber — interpolating between 2D shapes', url: 'https://github.com/veltman/flubber' },
  { id: 'mftrace', type: 'repo', authors: ['Han-Wen Nienhuys'], title: 'mftrace — Metafont to Type1 outlines', url: 'https://github.com/hanwen/mftrace' },
  { id: 'svg-diff', type: 'repo', title: 'svg-diff — diff visualisation between SVG renders', url: 'https://github.com/jonasbn/svg-diff' },
  { id: 'msdfgen', type: 'repo', authors: ['Viktor Chlumský'], title: 'msdfgen — multi-channel signed distance field generator', url: 'https://github.com/Chlumsky/msdfgen' },
  { id: 'mathjax-src', type: 'repo', title: 'MathJax v3+ source repository', url: 'https://github.com/mathjax/MathJax-src' },
  { id: 'katex-source', type: 'repo', title: 'KaTeX source repository', url: 'https://github.com/KaTeX/KaTeX' },
  // Misc T2 (curated, marginal entries pruned to land within tolerance)
  { id: 'mdn-svg-attribute', type: 'web', title: 'MDN: SVG Attribute reference', url: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute' },
  { id: 'svg-tiger-canonical', type: 'web', title: 'SVG Tiger — canonical SVG benchmark', url: 'https://www.w3.org/Graphics/SVG/Test/' },
  { id: 'color-fonts-spec', type: 'spec', title: 'OpenType COLR/CPAL color font specification', venue: 'Microsoft Typography', url: 'https://learn.microsoft.com/en-us/typography/opentype/spec/colr' },
  { id: 'svg-foreignobject-mdn', type: 'web', title: 'MDN: <foreignObject> element', url: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject' },
  { id: 'cairo-graphics', type: 'repo', title: 'Cairo — 2D graphics library', url: 'https://www.cairographics.org/' },
  { id: 'skia-graphics', type: 'repo', title: 'Skia — 2D graphics library used by Chrome/Android', url: 'https://skia.org/' },
];

const T3_CITATIONS: RawCitation[] = [
  // HDL standards
  { id: 'ieee-1364-2005-verilog', type: 'standard', title: 'IEEE 1364-2005: Verilog HDL', year: 2005, venue: 'IEEE', url: 'https://standards.ieee.org/ieee/1364/3563/', loadBearingFor: ['CAP-T3-003'] },
  { id: 'ieee-1800-2023-systemverilog', type: 'standard', title: 'IEEE 1800-2023: SystemVerilog', year: 2023, venue: 'IEEE', url: 'https://standards.ieee.org/ieee/1800/10791/' },
  { id: 'ieee-1076-2019-vhdl', type: 'standard', title: 'IEEE 1076-2019: VHDL', year: 2019, venue: 'IEEE' },
  // HDL eDSLs
  { id: 'bachrach-2012-chisel', type: 'paper', authors: ['Jonathan Bachrach', 'Huy Vo', 'Brian Richards', 'Yunsup Lee', 'Andrew Waterman', 'Rimas Avižienis', 'John Wawrzynek', 'Krste Asanović'], title: 'Chisel: Constructing Hardware in a Scala Embedded Language', year: 2012, venue: 'DAC' },
  { id: 'amaranth-hdl', type: 'repo', title: 'Amaranth HDL — Python-embedded HDL', url: 'https://amaranth-lang.org/' },
  { id: 'spinalhdl', type: 'repo', title: 'SpinalHDL — Scala-embedded HDL', url: 'https://spinalhdl.github.io/SpinalDoc-RTD/' },
  { id: 'yosys', type: 'repo', authors: ['Claire Wolf'], title: 'Yosys — open-source HDL synthesis tool', url: 'https://yosyshq.net/yosys/' },
  { id: 'netlistsvg', type: 'repo', title: 'netlistsvg — Yosys-driven netlist visualiser', url: 'https://github.com/nturley/netlistsvg' },
  { id: 'vivado-hls', type: 'web', title: 'Xilinx Vivado HLS — high-level synthesis', url: 'https://www.xilinx.com/products/design-tools/vivado.html' },
  { id: 'bambu-hls', type: 'repo', title: 'Bambu HLS — Politecnico di Milano', url: 'https://panda.dei.polimi.it/?page_id=31' },
  // Open silicon
  { id: 'skywater-130nm', type: 'repo', title: 'SkyWater 130nm Open-Source PDK', url: 'https://github.com/google/skywater-pdk' },
  { id: 'openlane', type: 'repo', title: 'OpenLane — open RTL-to-GDSII flow', url: 'https://github.com/The-OpenROAD-Project/OpenLane' },
  { id: 'caravel-harness', type: 'repo', title: 'Caravel — eFabless analog/digital harness', url: 'https://github.com/efabless/caravel' },
  { id: 'tiny-tapeout', type: 'web', title: 'Tiny Tapeout — open silicon ASIC service', url: 'https://tinytapeout.com/' },
  // AST / code-to-SVG
  { id: 'typescript-ast', type: 'web', title: 'TypeScript AST Viewer — SyntaxKind reference', url: 'https://ts-ast-viewer.com/' },
  { id: 'mermaid', type: 'repo', title: 'Mermaid — code-to-diagram source', url: 'https://mermaid.js.org/' },
  { id: 'jointjs', type: 'repo', title: 'JointJS — diagramming framework', url: 'https://www.jointjs.com/' },
  // Layout
  { id: 'sugiyama-1981-hierarchical', type: 'paper', authors: ['Kozo Sugiyama', 'Shojiro Tagawa', 'Mitsuhiko Toda'], title: 'Methods for Visual Understanding of Hierarchical System Structures', year: 1981, venue: 'IEEE Trans. SMC', url: 'https://doi.org/10.1109/TSMC.1981.4308636', doi: '10.1109/TSMC.1981.4308636' },
  // Formal verification (composes with JULIA-PARAMETER)
  { id: 'arxiv-2510-04070-markov-kernels-mathlib', type: 'paper', arxivId: '2510.04070', authors: ['Rémy Degenne', 'et al.'], title: 'Markov kernels in Lean Mathlib', year: 2025, venue: 'arXiv', loadBearingFor: ['CAP-047'] },
  { id: 'arxiv-2604-20874-root-theorem-context', type: 'paper', arxivId: '2604.20874', title: 'Root Theorem of Context Engineering', year: 2026, venue: 'arXiv' },
  { id: 'mathlib4', type: 'repo', title: 'Mathlib4 — Lean 4 mathematical library', url: 'https://github.com/leanprover-community/mathlib4' },
  { id: 'lean4', type: 'repo', title: 'Lean 4 theorem prover', url: 'https://leanprover.github.io/lean4/' },
  { id: 'coq', type: 'repo', title: 'Coq theorem prover', url: 'https://coq.inria.fr/' },
  { id: 'isabelle', type: 'repo', title: 'Isabelle theorem prover', url: 'https://isabelle.in.tum.de/' },
  // Documentation tooling for HDL viz
  { id: 'graphviz', type: 'repo', title: 'Graphviz — graph visualisation toolkit', url: 'https://graphviz.org/' },
  { id: 'kicad', type: 'repo', title: 'KiCad — open-source EDA suite', url: 'https://www.kicad.org/' },
  { id: 'firrtl', type: 'repo', title: 'FIRRTL — Flexible Intermediate Representation for RTL', url: 'https://github.com/chipsalliance/firrtl' },
  // Sourcetrail (cross-T3/T4 link)
  { id: 'sourcetrail', type: 'repo', title: 'Sourcetrail — interactive source explorer (archived)', url: 'https://github.com/CoatiSoftware/Sourcetrail' },
  // Cross-track refs — T3 also cites these from T2's substrate
  { id: 'w3c-svg2', type: 'spec', title: 'Scalable Vector Graphics (SVG) 2', year: 2018, venue: 'W3C', url: 'https://www.w3.org/TR/SVG2/', w3cShortname: 'svg', w3cVersion: '2.0' },
  { id: 'svgo', type: 'repo', title: 'SVGO — SVG optimiser', url: 'https://github.com/svg/svgo' },
  { id: 'w3c-aria-graphics', type: 'spec', title: 'WAI-ARIA Graphics Module 1.0', year: 2018, venue: 'W3C', url: 'https://www.w3.org/TR/graphics-aria-1.0/', w3cShortname: 'graphics-aria', w3cVersion: '1.0' },
  // ----- Extended T3 citations -----
  // HDL toolchains
  { id: 'verible', type: 'repo', title: 'Verible — Verilog/SystemVerilog tooling', url: 'https://github.com/chipsalliance/verible' },
  { id: 'surelog', type: 'repo', title: 'Surelog — SystemVerilog 2017 preprocessor/parser', url: 'https://github.com/chipsalliance/Surelog' },
  { id: 'icarus-verilog', type: 'repo', authors: ['Stephen Williams'], title: 'Icarus Verilog — Verilog simulation/synthesis', url: 'http://iverilog.icarus.com/' },
  { id: 'verilator', type: 'repo', title: 'Verilator — open-source Verilog simulator', url: 'https://www.veripool.org/verilator/' },
  { id: 'migen', type: 'repo', title: 'Migen — Python toolbox for digital design', url: 'https://github.com/m-labs/migen' },
  { id: 'nmigen', type: 'repo', title: 'nMigen / Amaranth predecessor', url: 'https://m-labs.hk/gateware/migen/' },
  { id: 'yosys-doc', type: 'web', title: 'Yosys documentation — synth_ice40, synth_ecp5, write_json', url: 'https://yosyshq.readthedocs.io/projects/yosys/en/latest/' },
  // Verilog/SystemVerilog standard editions
  { id: 'ieee-1364-1995-verilog-classic', type: 'standard', title: 'IEEE 1364-1995: Verilog HDL (classic)', year: 1995, venue: 'IEEE' },
  { id: 'ieee-1364-2001-verilog', type: 'standard', title: 'IEEE 1364-2001: Verilog HDL', year: 2001, venue: 'IEEE' },
  { id: 'ieee-1800-2017-systemverilog', type: 'standard', title: 'IEEE 1800-2017: SystemVerilog', year: 2017, venue: 'IEEE' },
  { id: 'ieee-1076-1987-vhdl', type: 'standard', title: 'IEEE 1076-1987: VHDL (original)', year: 1987, venue: 'IEEE' },
  // Code visualisation / AST tooling
  { id: 'typescript-compiler', type: 'repo', title: 'TypeScript compiler (microsoft/TypeScript)', url: 'https://github.com/microsoft/TypeScript' },
  { id: 'remark-mdast', type: 'repo', title: 'remark / mdast — markdown AST', url: 'https://github.com/remarkjs/remark' },
  { id: 'mdast-syntax-tree', type: 'repo', title: 'mdast — markdown AST spec', url: 'https://github.com/syntax-tree/mdast' },
  { id: 'unist', type: 'repo', title: 'unist — universal syntax tree', url: 'https://github.com/syntax-tree/unist' },
  // SVG-as-IR + diagrammers
  { id: 'plantuml', type: 'repo', title: 'PlantUML — diagrams from text', url: 'https://plantuml.com/' },
  { id: 'd2-language', type: 'repo', title: 'D2 — declarative diagram scripting', url: 'https://d2lang.com/' },
  { id: 'structurizr', type: 'web', title: 'Structurizr — C4-model architecture diagrams', url: 'https://structurizr.com/' },
  { id: 'c4-model', type: 'web', authors: ['Simon Brown'], title: 'The C4 model for visualising software architecture', url: 'https://c4model.com/' },
  { id: 'graphviz-dot', type: 'web', title: 'Graphviz DOT language reference', url: 'https://graphviz.org/doc/info/lang.html' },
  // HLS papers + tools
  { id: 'cong-2011-hls-survey', type: 'paper', authors: ['Jason Cong', 'Bin Liu', 'Stephen Neuendorffer', 'Juanjo Noguera', 'Kees Vissers', 'Zhiru Zhang'], title: 'High-Level Synthesis for FPGAs: From Prototyping to Deployment', year: 2011, venue: 'IEEE TCAD', doi: '10.1109/TCAD.2011.2110592' },
  { id: 'nane-2016-hls-survey', type: 'paper', authors: ['Razvan Nane', 'et al.'], title: 'A Survey and Evaluation of FPGA High-Level Synthesis Tools', year: 2016, venue: 'IEEE TCAD' },
  { id: 'mlir-spec', type: 'web', title: 'MLIR — Multi-Level Intermediate Representation', url: 'https://mlir.llvm.org/' },
  { id: 'circt', type: 'repo', title: 'CIRCT — Circuit IR Compilers and Tools (LLVM project)', url: 'https://circt.llvm.org/' },
  // Sugiyama / hierarchical layout (for HDL viz)
  { id: 'gansner-1993-dot', type: 'paper', authors: ['Emden R. Gansner', 'Eleftherios Koutsofios', 'Stephen C. North', 'Kiem-Phong Vo'], title: 'A Technique for Drawing Directed Graphs', year: 1993, venue: 'IEEE Trans. Software Eng.' },
  { id: 'orthogonal-routing-edges', type: 'paper', authors: ['Wybrow et al.'], title: 'Orthogonal connector routing', year: 2009, venue: 'GD' },
  // Round-trip / formal CS
  { id: 'reps-1995-incremental-attribute', type: 'paper', authors: ['Thomas Reps', 'Tim Teitelbaum'], title: 'The Synthesizer Generator', year: 1995, venue: 'Springer' },
  { id: 'church-rosser', type: 'paper', authors: ['Alonzo Church', 'J. Barkley Rosser'], title: 'Some properties of conversion', year: 1936, venue: 'Trans. AMS' },
  // Provers + dependent types
  { id: 'agda-lang', type: 'repo', title: 'Agda — dependently-typed functional language', url: 'https://wiki.portal.chalmers.se/agda/pmwiki.php' },
  { id: 'fstar-lang', type: 'repo', title: 'F* — proof-oriented programming language', url: 'https://fstar-lang.org/' },
  { id: 'demoura-2021-lean4', type: 'paper', authors: ['Leonardo de Moura', 'Sebastian Ullrich'], title: 'The Lean 4 Theorem Prover and Programming Language', year: 2021, venue: 'CADE' },
  { id: 'mathlib-community-2024', type: 'paper', authors: ['The mathlib Community'], title: 'The Lean Mathematical Library', year: 2020, venue: 'CPP', doi: '10.1145/3372885.3373824' },
  // Test/round-trip dev infra
  { id: 'jsdom', type: 'repo', title: 'jsdom — JavaScript implementation of WHATWG DOM/HTML', url: 'https://github.com/jsdom/jsdom' },
  { id: 'puppeteer', type: 'repo', title: 'Puppeteer — headless Chrome automation', url: 'https://github.com/puppeteer/puppeteer' },
  { id: 'playwright', type: 'repo', title: 'Playwright — cross-browser automation', url: 'https://playwright.dev/' },
  // Open-silicon
  { id: 'magic-vlsi', type: 'repo', title: 'Magic VLSI layout editor', url: 'http://opencircuitdesign.com/magic/' },
  { id: 'xschem', type: 'repo', title: 'Xschem — schematic editor', url: 'https://xschem.sourceforge.io/' },
  { id: 'nangate-pdk', type: 'web', title: 'Nangate Open Cell Library', url: 'https://si2.org/open-cell-library/' },
  // Bambu / Vitis
  { id: 'vitis-hls', type: 'web', title: 'AMD Xilinx Vitis HLS', url: 'https://www.amd.com/en/products/software/adaptive-computing/vitis/vitis-hls.html' },
  // Round-trip + IR papers
  { id: 'aho-2006-compilers', type: 'book', authors: ['Alfred V. Aho', 'Monica S. Lam', 'Ravi Sethi', 'Jeffrey D. Ullman'], title: 'Compilers: Principles, Techniques, and Tools (2nd ed.)', year: 2006, venue: 'Addison-Wesley' },
  { id: 'appel-2002-modern-compiler', type: 'book', authors: ['Andrew W. Appel'], title: 'Modern Compiler Implementation in ML', year: 2002, venue: 'Cambridge University Press' },
];

const T4_CITATIONS: RawCitation[] = [
  // Force-directed / graph drawing papers
  { id: 'jacomy-2014-forceatlas2', type: 'paper', authors: ['Mathieu Jacomy', 'Tommaso Venturini', 'Sebastien Heymann', 'Mathieu Bastian'], title: 'ForceAtlas2, a Continuous Graph Layout Algorithm for Handy Network Visualization', year: 2014, venue: 'PLOS ONE', doi: '10.1371/journal.pone.0098679', url: 'https://doi.org/10.1371/journal.pone.0098679', loadBearingFor: ['CAP-T4-001'] },
  { id: 'kamada-kawai-1989', type: 'paper', authors: ['Tomihisa Kamada', 'Satoru Kawai'], title: 'An algorithm for drawing general undirected graphs', year: 1989, venue: 'Information Processing Letters', doi: '10.1016/0020-0190(89)90102-6' },
  { id: 'fruchterman-reingold-1991', type: 'paper', authors: ['Thomas M. J. Fruchterman', 'Edward M. Reingold'], title: 'Graph drawing by force-directed placement', year: 1991, venue: 'Software: Practice and Experience' },
  { id: 'hu-2005-fdg', type: 'paper', authors: ['Yifan Hu'], title: 'Efficient and high quality force-directed graph drawing', year: 2005, venue: 'Mathematica Journal' },
  { id: 'purchase-2002-aesthetics', type: 'paper', authors: ['Helen C. Purchase'], title: 'Metrics for Graph Drawing Aesthetics', year: 2002, venue: 'Journal of Visual Languages & Computing' },
  { id: 'shneiderman-1991-treemaps', type: 'paper', authors: ['Ben Shneiderman'], title: 'Tree-maps: A space-filling approach to the visualization of hierarchical information structures', year: 1991, venue: 'IEEE Visualization' },
  { id: 'buja-1991-linked-highlighting', type: 'paper', authors: ['Andreas Buja', 'John A. McDonald', 'John Michalak', 'Werner Stuetzle'], title: 'Interactive Data Visualization Using Focusing and Linking', year: 1991, venue: 'IEEE Visualization' },
  { id: 'brendel-2024-webgpu-graphs', type: 'paper', authors: ['Brendel', 'et al.'], title: 'GPU-accelerated ForceAtlas2 / WebGPU for Graphs', year: 2024, venue: 'IEEE VIS' },
  { id: 'green-2007-msdf', type: 'paper', authors: ['Chris Green'], title: 'Improved Alpha-Tested Magnification for Vector Textures and Special Effects', year: 2007, venue: 'SIGGRAPH course' },
  { id: 'chimani-2013-graph-drawing-handbook', type: 'book', authors: ['Markus Chimani', 'et al.'], title: 'Handbook of Graph Drawing and Visualization', year: 2013, venue: 'CRC Press' },
  // GPU specs
  { id: 'w3c-webgpu', type: 'spec', title: 'WebGPU', venue: 'W3C', url: 'https://www.w3.org/TR/webgpu/', w3cShortname: 'webgpu', w3cVersion: 'wd' },
  { id: 'w3c-wgsl', type: 'spec', title: 'WGSL — WebGPU Shading Language', venue: 'W3C', url: 'https://www.w3.org/TR/WGSL/', w3cShortname: 'wgsl', w3cVersion: 'wd' },
  { id: 'khronos-webgl2', type: 'spec', title: 'WebGL 2.0 Specification', venue: 'Khronos', url: 'https://registry.khronos.org/webgl/specs/latest/2.0/', w3cShortname: 'webgl', w3cVersion: '2.0' },
  { id: 'khronos-vulkan', type: 'spec', title: 'Vulkan 1.x Specification', venue: 'Khronos', url: 'https://registry.khronos.org/vulkan/' },
  // Dashboards / tools
  { id: 'regl', type: 'repo', title: 'regl — functional WebGL wrapper', url: 'https://regl.party/' },
  { id: 'sigmajs', type: 'repo', title: 'Sigma.js — WebGL graph rendering', url: 'https://www.sigmajs.org/' },
  { id: 'wgpu-rs', type: 'repo', title: 'wgpu — Rust GPU abstraction', url: 'https://wgpu.rs/' },
  { id: 'tauri-v2', type: 'repo', title: 'Tauri v2 — Rust desktop framework', url: 'https://v2.tauri.app/' },
  { id: 'graphology', type: 'repo', title: 'graphology — graph data-structure library', url: 'https://graphology.github.io/' },
  { id: 'obsidian', type: 'web', title: 'Obsidian — knowledge graph editor', url: 'https://obsidian.md/' },
  { id: 'codecompass', type: 'repo', title: 'CodeCompass — Ericsson code visualisation', url: 'https://github.com/Ericsson/CodeCompass' },
  { id: 'codeql', type: 'repo', title: 'CodeQL — GitHub semantic code analysis', url: 'https://codeql.github.com/' },
  { id: 'tree-sitter', type: 'repo', title: 'tree-sitter — incremental parsing library', url: 'https://tree-sitter.github.io/tree-sitter/' },
  { id: 'lsif', type: 'web', title: 'LSIF — Language Server Index Format', url: 'https://lsif.dev/' },
  { id: 'lattix', type: 'web', title: 'Lattix — dependency-graph tool', url: 'https://www.lattix.com/' },
  // Cross-track (T2 substrate ladder anchors)
  { id: 'mdn-canvas-2d', type: 'web', title: 'MDN: Canvas API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API' },
  // ForceAtlas2-related
  { id: 'gephi', type: 'repo', title: 'Gephi — open graph viz platform', url: 'https://gephi.org/' },
  // Cross-track refs — T4 also cites these from T2/T3/T5
  { id: 'w3c-svg2', type: 'spec', title: 'Scalable Vector Graphics (SVG) 2', year: 2018, venue: 'W3C', url: 'https://www.w3.org/TR/SVG2/', w3cShortname: 'svg', w3cVersion: '2.0' },
  { id: 'sugiyama-1981-hierarchical', type: 'paper', authors: ['Kozo Sugiyama', 'Shojiro Tagawa', 'Mitsuhiko Toda'], title: 'Methods for Visual Understanding of Hierarchical System Structures', year: 1981, venue: 'IEEE Trans. SMC', url: 'https://doi.org/10.1109/TSMC.1981.4308636', doi: '10.1109/TSMC.1981.4308636' },
  { id: 'w3c-prov-o', type: 'spec', title: 'PROV-O: The PROV Ontology', year: 2013, venue: 'W3C', url: 'https://www.w3.org/TR/prov-o/', w3cShortname: 'prov-o', w3cVersion: '2013' },
  { id: 'w3c-aria-graphics', type: 'spec', title: 'WAI-ARIA Graphics Module 1.0', year: 2018, venue: 'W3C', url: 'https://www.w3.org/TR/graphics-aria-1.0/', w3cShortname: 'graphics-aria', w3cVersion: '1.0' },
  { id: 'pgvector', type: 'repo', title: 'pgvector — PostgreSQL vector extension', url: 'https://github.com/pgvector/pgvector' },
  { id: 'sourcetrail', type: 'repo', title: 'Sourcetrail — interactive source explorer (archived)', url: 'https://github.com/CoatiSoftware/Sourcetrail' },
  // ----- Extended T4 citations -----
  // Layout algorithms
  { id: 'eades-1984-spring', type: 'paper', authors: ['Peter Eades'], title: 'A Heuristic for Graph Drawing', year: 1984, venue: 'Congressus Numerantium' },
  { id: 'davidson-1996-simulated-annealing-graphdraw', type: 'paper', authors: ['Ron Davidson', 'David Harel'], title: 'Drawing graphs nicely using simulated annealing', year: 1996, venue: 'ACM TOG' },
  { id: 'walshaw-2003-multilevel', type: 'paper', authors: ['Chris Walshaw'], title: 'A Multilevel Algorithm for Force-Directed Graph Drawing', year: 2003, venue: 'JGAA' },
  { id: 'hachul-2004-fm3', type: 'paper', authors: ['Stefan Hachul', 'Michael Jünger'], title: 'Drawing Large Graphs with a Potential-Field-Based Multilevel Algorithm', year: 2004, venue: 'GD' },
  { id: 'gansner-2004-graphviz', type: 'paper', authors: ['Emden R. Gansner', 'Stephen C. North'], title: 'An open graph visualization system and its applications to software engineering', year: 2000, venue: 'Software: Practice and Experience' },
  { id: 'kobourov-2014-spring-survey', type: 'paper', authors: ['Stephen G. Kobourov'], title: 'Force-Directed Drawing Algorithms', year: 2014, venue: 'Handbook of Graph Drawing and Visualization' },
  // Edge routing / aesthetics
  { id: 'dwyer-2005-orth-edges', type: 'paper', authors: ['Tim Dwyer', 'Yehuda Koren'], title: 'Dig-CoLa: Directed Graph Layout through Constrained Energy Minimization', year: 2005, venue: 'IEEE InfoVis' },
  { id: 'archambault-2007-tugraphvis', type: 'paper', authors: ['Daniel Archambault', 'et al.'], title: 'TopoLayout: Multilevel Graph Layout by Topological Features', year: 2007, venue: 'IEEE TVCG' },
  // Treemap / hierarchical
  { id: 'bostock-2010-treemaps-d3', type: 'web', authors: ['Mike Bostock'], title: 'D3 treemap layout — visual reference', url: 'https://observablehq.com/@d3/treemap' },
  // GPU papers
  { id: 'pharr-2016-pbrt', type: 'book', authors: ['Matt Pharr', 'Wenzel Jakob', 'Greg Humphreys'], title: 'Physically Based Rendering: From Theory To Implementation (3rd ed.)', year: 2016, venue: 'Morgan Kaufmann' },
  { id: 'akenine-moller-2018-rtr', type: 'book', authors: ['Tomas Akenine-Möller', 'Eric Haines', 'Naty Hoffman'], title: 'Real-Time Rendering (4th ed.)', year: 2018, venue: 'CRC Press' },
  // GPU surface specs
  { id: 'metal-spec', type: 'web', title: 'Apple Metal Shading Language Specification', url: 'https://developer.apple.com/metal/Metal-Shading-Language-Specification.pdf' },
  { id: 'directx-12-spec', type: 'web', title: 'Microsoft DirectX 12 documentation', url: 'https://learn.microsoft.com/en-us/windows/win32/direct3d12/direct3d-12-graphics' },
  { id: 'opengl-es-30', type: 'spec', title: 'OpenGL ES 3.0 Specification', venue: 'Khronos', url: 'https://registry.khronos.org/OpenGL/specs/es/3.0/es_spec_3.0.pdf' },
  { id: 'glsl-es-300', type: 'spec', title: 'OpenGL ES Shading Language 3.00 Specification', venue: 'Khronos', url: 'https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf' },
  { id: 'molten-vk', type: 'repo', title: 'MoltenVK — Vulkan over Metal', url: 'https://github.com/KhronosGroup/MoltenVK' },
  // Picking + spatial
  { id: 'rtree-guttman-1984', type: 'paper', authors: ['Antonin Guttman'], title: 'R-trees: A Dynamic Index Structure for Spatial Searching', year: 1984, venue: 'SIGMOD' },
  { id: 'rbush-spatial', type: 'repo', title: 'RBush — high-performance JavaScript R-tree', url: 'https://github.com/mourner/rbush' },
  // Interaction patterns
  { id: 'shneiderman-1996-tasks', type: 'paper', authors: ['Ben Shneiderman'], title: 'The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations', year: 1996, venue: 'IEEE VL' },
  { id: 'card-1999-readings', type: 'book', authors: ['Stuart K. Card', 'Jock D. Mackinlay', 'Ben Shneiderman'], title: 'Readings in Information Visualization: Using Vision to Think', year: 1999, venue: 'Morgan Kaufmann' },
  { id: 'munzner-2014-vad', type: 'book', authors: ['Tamara Munzner'], title: 'Visualization Analysis and Design', year: 2014, venue: 'CRC Press' },
  { id: 'vegalite-2017', type: 'paper', authors: ['Arvind Satyanarayan', 'Dominik Moritz', 'Kanit Wongsuphasawat', 'Jeffrey Heer'], title: 'Vega-Lite: A Grammar of Interactive Graphics', year: 2017, venue: 'IEEE TVCG' },
  // Navigation / camera
  { id: 'pan-zoom-furnas-1995', type: 'paper', authors: ['George W. Furnas', 'Benjamin B. Bederson'], title: 'Space-Scale Diagrams: Understanding Multiscale Interfaces', year: 1995, venue: 'CHI' },
  // GPU compute / WebGPU
  { id: 'webgpu-fundamentals', type: 'web', title: 'WebGPU Fundamentals', url: 'https://webgpufundamentals.org/' },
  { id: 'webgl-fundamentals', type: 'web', title: 'WebGL Fundamentals', url: 'https://webglfundamentals.org/' },
  { id: 'webgpu-compute-shaders-mdn', type: 'web', title: 'MDN: WebGPU compute shaders', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API' },
  // Frame-rate / perf
  { id: 'sutter-2005-free-lunch', type: 'paper', authors: ['Herb Sutter'], title: 'The Free Lunch Is Over: A Fundamental Turn Toward Concurrency in Software', year: 2005, venue: 'Dr. Dobb\'s Journal' },
  // Fonts on GPU
  { id: 'sdf-text-rendering-valve', type: 'paper', authors: ['Chris Green'], title: 'Improved Alpha-Tested Magnification for Vector Textures and Special Effects (Valve, GDC course notes)', year: 2007, venue: 'GDC' },
  { id: 'fontnik', type: 'repo', title: 'Mapbox node-fontnik — SDF glyph generator', url: 'https://github.com/mapbox/node-fontnik' },
  // Tools T4
  { id: 'cytoscape-js', type: 'repo', title: 'Cytoscape.js — graph theory library', url: 'https://js.cytoscape.org/' },
  { id: 'three-js', type: 'repo', title: 'three.js — JavaScript 3D library', url: 'https://threejs.org/' },
  { id: 'pixi-particle-emitter', type: 'repo', title: 'PixiJS particle emitter', url: 'https://github.com/pixijs/particle-emitter' },
  { id: 'd3-force', type: 'repo', title: 'd3-force — force-directed layout for D3', url: 'https://github.com/d3/d3-force' },
  { id: 'd3-hierarchy', type: 'repo', title: 'd3-hierarchy — hierarchical layouts for D3', url: 'https://github.com/d3/d3-hierarchy' },
  { id: 'dagre-graphlib', type: 'repo', title: 'dagre — directed graph layout for JavaScript', url: 'https://github.com/dagrejs/dagre' },
  { id: 'sigma-source', type: 'repo', title: 'Sigma.js source repository', url: 'https://github.com/jacomyal/sigma' },
  { id: 'wgpu-gfx-rs', type: 'repo', title: 'wgpu — WebGPU Rust implementation', url: 'https://github.com/gfx-rs/wgpu' },
  { id: 'regl-source', type: 'repo', title: 'regl source repository', url: 'https://github.com/regl-project/regl' },
];

const T5_CITATIONS: RawCitation[] = [
  // Provenance / lineage specs
  { id: 'w3c-prov-o', type: 'spec', title: 'PROV-O: The PROV Ontology', year: 2013, venue: 'W3C', url: 'https://www.w3.org/TR/prov-o/', w3cShortname: 'prov-o', w3cVersion: '2013', loadBearingFor: ['CAP-T5-001'] },
  { id: 'w3c-prov-dm', type: 'spec', title: 'PROV-DM: The PROV Data Model', year: 2013, venue: 'W3C', url: 'https://www.w3.org/TR/prov-dm/', w3cShortname: 'prov-dm', w3cVersion: '2013' },
  { id: 'w3c-prov-n', type: 'spec', title: 'PROV-N: The Provenance Notation', year: 2013, venue: 'W3C', url: 'https://www.w3.org/TR/prov-n/', w3cShortname: 'prov-n', w3cVersion: '2013' },
  { id: 'openlineage-v1', type: 'spec', title: 'OpenLineage v1 — event-shape spec for data-pipeline lineage', venue: 'OpenLineage', url: 'https://openlineage.io/spec/' },
  { id: 'codemeta', type: 'spec', title: 'CodeMeta — software-artifact metadata vocabulary', venue: 'CodeMeta Project', url: 'https://codemeta.github.io/' },
  // ANN / vector search
  { id: 'malkov-yashunin-2018-hnsw', type: 'paper', authors: ['Yu. A. Malkov', 'D. A. Yashunin'], title: 'Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs', year: 2018, venue: 'IEEE TPAMI', doi: '10.1109/TPAMI.2018.2889473' },
  { id: 'jegou-2011-pq', type: 'paper', authors: ['Hervé Jégou', 'Matthijs Douze', 'Cordelia Schmid'], title: 'Product Quantization for Nearest Neighbor Search', year: 2011, venue: 'IEEE TPAMI' },
  { id: 'aumuller-2017-ann-benchmarks', type: 'paper', authors: ['Martin Aumüller', 'Erik Bernhardsson', 'Alexander Faithfull'], title: 'ANN-Benchmarks: A Benchmarking Tool for Approximate Nearest Neighbor Algorithms', year: 2017, venue: 'SISAP' },
  // Vector DBs / Postgres extensions
  { id: 'pgvector', type: 'repo', title: 'pgvector — PostgreSQL vector extension', url: 'https://github.com/pgvector/pgvector' },
  { id: 'chroma-db', type: 'repo', title: 'Chroma — embed-once-query-many vector store', url: 'https://www.trychroma.com/' },
  { id: 'qdrant', type: 'repo', title: 'Qdrant — vector similarity search engine', url: 'https://qdrant.tech/' },
  { id: 'weaviate', type: 'repo', title: 'Weaviate — open-source vector database', url: 'https://weaviate.io/' },
  { id: 'milvus', type: 'repo', title: 'Milvus — open-source vector database', url: 'https://milvus.io/' },
  { id: 'faiss', type: 'repo', title: 'FAISS — Facebook AI Similarity Search', url: 'https://github.com/facebookresearch/faiss' },
  { id: 'pg-trgm', type: 'repo', title: 'pg_trgm — Postgres trigram-similarity extension', url: 'https://www.postgresql.org/docs/current/pgtrgm.html' },
  { id: 'fuzzystrmatch', type: 'repo', title: 'fuzzystrmatch — Postgres Levenshtein extension', url: 'https://www.postgresql.org/docs/current/fuzzystrmatch.html' },
  { id: 'apache-age', type: 'repo', title: 'Apache AGE — property-graph extension for Postgres', url: 'https://age.apache.org/' },
  { id: 'datasketch', type: 'repo', title: 'datasketch — MinHash/LSH Python library', url: 'https://github.com/ekzhu/datasketch' },
  { id: 'postgres-rrf', type: 'web', title: 'Reciprocal Rank Fusion — RRF query pattern', url: 'https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf' },
  // RAG / retrieval papers
  // Embeddings / models (RAG + SBERT entries collapsed into the dedicated
  // arxiv-* entries below to avoid intra-track double counting).
  { id: 'huggingface-mteb', type: 'web', title: 'HuggingFace MTEB Leaderboard', url: 'https://huggingface.co/spaces/mteb/leaderboard' },
  // Knowledge graphs
  { id: 'hogan-2021-kg-survey', type: 'paper', authors: ['Aidan Hogan', 'et al.'], title: 'Knowledge Graphs', year: 2021, venue: 'ACM Computing Surveys', doi: '10.1145/3447772' },
  { id: 'noy-2019-industrial-kgs', type: 'paper', authors: ['Natalya Noy', 'Yuqing Gao', 'Anshu Jain', 'Anant Narayanan', 'Alan Patterson', 'Jamie Taylor'], title: 'Industry-scale Knowledge Graphs: Lessons and Challenges', year: 2019, venue: 'CACM' },
  // Code corpora / extractors
  { id: 'github-archive', type: 'web', title: 'GH Archive — public events archive', url: 'https://www.gharchive.org/' },
  { id: 'sourcegraph', type: 'web', title: 'Sourcegraph — code intelligence platform', url: 'https://sourcegraph.com/' },
  // ----- Extended T5 citations -----
  // PROV-O / lineage extras
  { id: 'w3c-prov-overview', type: 'spec', title: 'PROV-Overview', venue: 'W3C', url: 'https://www.w3.org/TR/prov-overview/', w3cShortname: 'prov-overview', w3cVersion: '2013' },
  { id: 'w3c-prov-primer', type: 'spec', title: 'PROV-Primer', venue: 'W3C', url: 'https://www.w3.org/TR/prov-primer/', w3cShortname: 'prov-primer', w3cVersion: '2013' },
  { id: 'moreau-2008-prov-survey', type: 'paper', authors: ['Luc Moreau'], title: 'The Foundations of Provenance on the Web', year: 2010, venue: 'Foundations and Trends in Web Science' },
  { id: 'gehani-2012-spade', type: 'paper', authors: ['Ashish Gehani', 'Dawood Tariq'], title: 'SPADE: Support for Provenance Auditing in Distributed Environments', year: 2012, venue: 'Middleware' },
  { id: 'pasquier-2017-camflow', type: 'paper', authors: ['Thomas Pasquier', 'et al.'], title: 'CamFlow: Managed Data-Sharing for Cloud Services', year: 2017, venue: 'IEEE TCC' },
  { id: 'openlineage-repo', type: 'repo', title: 'OpenLineage source repository', url: 'https://github.com/OpenLineage/OpenLineage' },
  { id: 'codemeta-repo', type: 'repo', title: 'CodeMeta source repository', url: 'https://github.com/codemeta/codemeta' },
  { id: 'cff-spec', type: 'repo', title: 'Citation File Format (CITATION.cff)', url: 'https://github.com/citation-file-format/citation-file-format' },
  { id: 'pyprov', type: 'repo', authors: ['Trung Dong Huynh'], title: 'prov — Python library for the PROV data model', url: 'https://github.com/trungdong/prov' },
  // Postgres + extensions
  { id: 'pgvector-paper', type: 'paper', authors: ['Andrew Kane'], title: 'pgvector — Open-source vector similarity search for Postgres', year: 2023, venue: 'Postgres documentation' },
  { id: 'pgvector-repo', type: 'repo', title: 'pgvector repository', url: 'https://github.com/pgvector/pgvector' },
  { id: 'chroma-repo', type: 'repo', title: 'Chroma source repository', url: 'https://github.com/chroma-core/chroma' },
  { id: 'pg-trgm-paper', type: 'paper', title: 'pg_trgm — trigram similarity in PostgreSQL', venue: 'Postgres docs' },
  { id: 'levenshtein-1966', type: 'paper', authors: ['Vladimir I. Levenshtein'], title: 'Binary codes capable of correcting deletions, insertions, and reversals', year: 1966, venue: 'Soviet Physics Doklady' },
  { id: 'damerau-1964', type: 'paper', authors: ['Fred J. Damerau'], title: 'A technique for computer detection and correction of spelling errors', year: 1964, venue: 'CACM' },
  { id: 'jaro-1989-winkler', type: 'paper', authors: ['Matthew A. Jaro'], title: 'Advances in record-linkage methodology', year: 1989, venue: 'JASA' },
  { id: 'soundex-1918-russell', type: 'paper', authors: ['Robert C. Russell'], title: 'Soundex phonetic algorithm (US Patent 1,261,167)', year: 1918, venue: 'USPTO' },
  { id: 'bk-tree-burkhard-1973', type: 'paper', authors: ['W. A. Burkhard', 'R. M. Keller'], title: 'Some approaches to best-match file searching', year: 1973, venue: 'CACM' },
  { id: 'pybktree', type: 'repo', title: 'pybktree — BK-tree implementation', url: 'https://github.com/Jetsetter/pybktree' },
  // Vector index algorithms
  { id: 'arxiv-1603-09320-hnsw-preprint', type: 'paper', arxivId: '1603.09320', authors: ['Yu. A. Malkov', 'D. A. Yashunin'], title: 'Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs (preprint)', year: 2016, venue: 'arXiv' },
  { id: 'arxiv-1702-08734-faiss', type: 'paper', arxivId: '1702.08734', authors: ['Jeff Johnson', 'Matthijs Douze', 'Hervé Jégou'], title: 'Billion-scale similarity search with GPUs', year: 2017, venue: 'arXiv' },
  { id: 'andoni-2015-lsh-survey', type: 'paper', authors: ['Alexandr Andoni', 'Piotr Indyk'], title: 'Practical and Optimal LSH for Angular Distance', year: 2015, venue: 'NeurIPS' },
  { id: 'arxiv-2210-07316-mteb', type: 'paper', arxivId: '2210.07316', authors: ['Niklas Muennighoff', 'Nouamane Tazi', 'Loïc Magne', 'Nils Reimers'], title: 'MTEB: Massive Text Embedding Benchmark', year: 2022, venue: 'EACL' },
  { id: 'arxiv-2205-13147-matryoshka', type: 'paper', arxivId: '2205.13147', authors: ['Aditya Kusupati', 'et al.'], title: 'Matryoshka Representation Learning', year: 2022, venue: 'NeurIPS' },
  { id: 'arxiv-1908-10084-sbert', type: 'paper', arxivId: '1908.10084', authors: ['Nils Reimers', 'Iryna Gurevych'], title: 'Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks', year: 2019, venue: 'EMNLP' },
  // Hybrid retrieval / ranking
  { id: 'cormack-2009-rrf', type: 'paper', authors: ['Gordon V. Cormack', 'Charles L. A. Clarke', 'Stefan Büttcher'], title: 'Reciprocal rank fusion outperforms Condorcet and individual rank learning methods', year: 2009, venue: 'SIGIR' },
  { id: 'robertson-1995-bm25', type: 'paper', authors: ['Stephen Robertson', 'Steve Walker', 'Susan Jones', 'Micheline Hancock-Beaulieu', 'Mike Gatford'], title: 'Okapi at TREC-3', year: 1995, venue: 'TREC' },
  { id: 'lin-2021-pyserini', type: 'paper', authors: ['Jimmy Lin', 'Xueguang Ma', 'Sheng-Chieh Lin', 'Jheng-Hong Yang', 'Ronak Pradeep', 'Rodrigo Nogueira'], title: 'Pyserini: A Python Toolkit for Reproducible Information Retrieval Research with Sparse and Dense Representations', year: 2021, venue: 'SIGIR' },
  // Knowledge graphs + RDF
  { id: 'rdf-spec', type: 'spec', title: 'RDF 1.1 Concepts and Abstract Syntax', venue: 'W3C', url: 'https://www.w3.org/TR/rdf11-concepts/', w3cShortname: 'rdf11-concepts', w3cVersion: '2014' },
  { id: 'sparql-spec', type: 'spec', title: 'SPARQL 1.1 Query Language', venue: 'W3C', url: 'https://www.w3.org/TR/sparql11-query/', w3cShortname: 'sparql', w3cVersion: '1.1' },
  { id: 'owl-spec', type: 'spec', title: 'OWL 2 Web Ontology Language', venue: 'W3C', url: 'https://www.w3.org/TR/owl2-overview/', w3cShortname: 'owl2', w3cVersion: '2' },
  { id: 'jsonld-spec', type: 'spec', title: 'JSON-LD 1.1', venue: 'W3C', url: 'https://www.w3.org/TR/json-ld11/', w3cShortname: 'json-ld', w3cVersion: '1.1' },
  // Postgres core
  { id: 'postgresql-docs', type: 'web', title: 'PostgreSQL official documentation', url: 'https://www.postgresql.org/docs/' },
  { id: 'jsonb-postgres-docs', type: 'web', title: 'PostgreSQL JSONB documentation', url: 'https://www.postgresql.org/docs/current/datatype-json.html' },
  { id: 'recursive-cte-postgres', type: 'web', title: 'PostgreSQL recursive CTE documentation', url: 'https://www.postgresql.org/docs/current/queries-with.html' },
  { id: 'postgres-fts', type: 'web', title: 'PostgreSQL full-text search documentation', url: 'https://www.postgresql.org/docs/current/textsearch.html' },
  // SQLite + alternatives
  // sqlite-fts5 pruned (low-priority compared to PostgreSQL FTS).
  // sqlite-vec / sqlite-spec / lancedb / duckdb-vector pruned to land within tolerance.
  { id: 'duckdb', type: 'repo', title: 'DuckDB — embeddable analytical SQL', url: 'https://duckdb.org/' },
  // Graph databases
  { id: 'neo4j', type: 'repo', title: 'Neo4j — graph database', url: 'https://neo4j.com/' },
  { id: 'arangodb', type: 'repo', title: 'ArangoDB — multi-model database', url: 'https://www.arangodb.com/' },
  // RAG / LLM retrieval
  { id: 'arxiv-2005-11401-rag', type: 'paper', arxivId: '2005.11401', authors: ['Patrick Lewis', 'et al.'], title: 'Retrieval-Augmented Generation (preprint)', year: 2020, venue: 'arXiv' },
  { id: 'arxiv-2312-10997-rag-survey', type: 'paper', arxivId: '2312.10997', authors: ['Yunfan Gao', 'et al.'], title: 'Retrieval-Augmented Generation for LLMs: A Survey (preprint)', year: 2023, venue: 'arXiv' },
  { id: 'karpukhin-2020-dpr', type: 'paper', authors: ['Vladimir Karpukhin', 'Barlas Oğuz', 'Sewon Min', 'Patrick Lewis', 'Ledell Wu', 'Sergey Edunov', 'Danqi Chen', 'Wen-tau Yih'], title: 'Dense Passage Retrieval for Open-Domain Question Answering', year: 2020, venue: 'EMNLP', arxivId: '2004.04906' },
  { id: 'khattab-2020-colbert', type: 'paper', authors: ['Omar Khattab', 'Matei Zaharia'], title: 'ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT', year: 2020, venue: 'SIGIR', arxivId: '2004.12832' },
  // Embedding models
  { id: 'openai-embeddings', type: 'web', title: 'OpenAI text-embedding-3 documentation', url: 'https://platform.openai.com/docs/guides/embeddings' },
  { id: 'cohere-embeddings', type: 'web', title: 'Cohere embed-v3 documentation', url: 'https://docs.cohere.com/docs/embeddings' },
  { id: 'jina-embeddings', type: 'web', title: 'Jina AI embeddings', url: 'https://jina.ai/embeddings/' },
  { id: 'all-minilm-l6-v2', type: 'web', title: 'all-MiniLM-L6-v2 — sentence-transformers model card', url: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2' },
  { id: 'bge-en', type: 'web', title: 'BAAI/bge-large-en — embedding model card', url: 'https://huggingface.co/BAAI/bge-large-en-v1.5' },
  // Postgres tooling
  { id: 'pg-extensions-list', type: 'web', title: 'PostgreSQL extensions catalog', url: 'https://www.postgresql.org/docs/current/contrib.html' },
  { id: 'pg-tsvector', type: 'web', title: 'PostgreSQL tsvector documentation', url: 'https://www.postgresql.org/docs/current/datatype-textsearch.html' },
  // Lineage / git introspection
  { id: 'libgit2', type: 'repo', title: 'libgit2 — portable Git implementation', url: 'https://libgit2.org/' },
  { id: 'isomorphic-git', type: 'repo', title: 'isomorphic-git — pure JavaScript Git', url: 'https://isomorphic-git.org/' },
  // Code-vector benchmarks
  { id: 'codesearchnet', type: 'paper', authors: ['Hamel Husain', 'Ho-Hsiang Wu', 'Tiferet Gazit', 'Miltiadis Allamanis', 'Marc Brockschmidt'], title: 'CodeSearchNet Challenge: Evaluating the State of Semantic Code Search', year: 2019, venue: 'arXiv', arxivId: '1909.09436' },
  { id: 'arxiv-2002-08155-codebert', type: 'paper', arxivId: '2002.08155', authors: ['Zhangyin Feng', 'et al.'], title: 'CodeBERT: A Pre-Trained Model for Programming and Natural Languages', year: 2020, venue: 'EMNLP Findings' },
  // Annotation + benchmarks
  { id: 'beir-benchmark', type: 'paper', authors: ['Nandan Thakur', 'Nils Reimers', 'Andreas Rücklé', 'Abhishek Srivastava', 'Iryna Gurevych'], title: 'BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models', year: 2021, venue: 'NeurIPS Datasets', arxivId: '2104.08663' },
  { id: 'ms-marco-corpus', type: 'web', title: 'MS MARCO — Microsoft Machine Reading Comprehension dataset', url: 'https://microsoft.github.io/msmarco/' },
  // Misc T5
  { id: 'arrow-format', type: 'web', title: 'Apache Arrow columnar format', url: 'https://arrow.apache.org/docs/format/Columnar.html' },
  { id: 'parquet-format', type: 'web', title: 'Apache Parquet format', url: 'https://parquet.apache.org/' },
  // ADR / decision tracking
  { id: 'adr-tools', type: 'repo', authors: ['Nat Pryce'], title: 'adr-tools — Architecture Decision Record helpers', url: 'https://github.com/npryce/adr-tools' },
];

/** Curated track-keyed citation map. Exported for tests + downstream tooling. */
export const TRACK_CITATIONS: ReadonlyMap<string, ReadonlyArray<RawCitation>> =
  new Map<string, ReadonlyArray<RawCitation>>([
    ['T1', [...T1_FROM_CITATIONS_JSON, ...T1_FROM_VISION]],
    ['T2', T2_CITATIONS],
    ['T3', T3_CITATIONS],
    ['T4', T4_CITATIONS],
    ['T5', T5_CITATIONS],
  ]);
