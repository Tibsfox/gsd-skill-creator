/**
 * Bibliography generator barrel export.
 *
 * Re-exports the formatter orchestrator, format-specific renderers,
 * attribution report, and integrity auditor.
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

export {
  formatEntry as formatChicagoEntry,
  formatBibliography as formatChicagoBibliography,
} from './formats/chicago.js';

export {
  formatEntry as formatMlaEntry,
  formatBibliography as formatMlaBibliography,
} from './formats/mla.js';

export {
  formatWithTemplate,
  formatBibliography as formatCustomBibliography,
} from './formats/custom.js';

export {
  AttributionReport,
  type AttributionReportData,
} from './attribution-report.js';

export {
  IntegrityAuditor,
  type AuditResult,
} from './integrity-audit.js';
