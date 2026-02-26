/**
 * Bibliography generator barrel export.
 *
 * Re-exports the formatter orchestrator and format-specific renderers.
 */

export { BibliographyFormatter, type FormatRenderer } from './formatter.js';

export {
  formatEntry as formatBibtexEntry,
  formatBibliography as formatBibtexBibliography,
  generateKey as generateBibtexKey,
  deduplicateKeys as deduplicateBibtexKeys,
  escapeLatex,
} from './formats/bibtex.js';

export {
  formatEntry as formatApa7Entry,
  formatBibliography as formatApa7Bibliography,
  formatAuthors as formatApa7Authors,
} from './formats/apa7.js';
