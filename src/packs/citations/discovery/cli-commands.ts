/**
 * Citation CLI command implementations.
 *
 * Each function implements the logic for an `sc cite` subcommand.
 * These return formatted output strings for display -- actual CLI
 * registration (argument parsing, help text) happens in Phase 358.
 *
 * Dependencies are injected to allow testing without real store/resolver
 * and to decouple from Phase 355 generator files that may not exist yet.
 *
 * @module citations/discovery/cli-commands
 */

import type { CitedWork, BibliographyFormat, FormatOptions } from '../types/index.js';
import type { DiscoveryOptions, SearchResult } from './search-engine.js';
import type { DiscoverySearchEngine } from './search-engine.js';
import type { CitationGraph, GraphNode } from './citation-graph.js';
import type { CitationStore } from '../store/citation-db.js';
import type { ProvenanceTracker } from '../store/provenance-chain.js';
import type { ResolverEngine } from '../resolver/resolver-engine.js';

// ============================================================================
// Injectable dependencies for commands that need generator
// ============================================================================

/** Injectable formatter function (matches BibliographyFormatter.format). */
export type FormatterFn = (
  works: CitedWork[],
  options: FormatOptions,
) => string;

/** Injectable integrity auditor function. */
export type AuditFn = (
  works: CitedWork[],
) => Promise<AuditSummary>;

/** Summary from integrity audit. */
export interface AuditSummary {
  totalWorks: number;
  verified: number;
  unverified: number;
  issues: string[];
}

// ============================================================================
// Command context (shared dependencies)
// ============================================================================

export interface CommandContext {
  store: CitationStore;
  provenance: ProvenanceTracker;
  resolver: ResolverEngine;
  searchEngine: DiscoverySearchEngine;
  graph: CitationGraph;
  formatter?: FormatterFn;
  auditor?: AuditFn;
}

// ============================================================================
// cite search
// ============================================================================

/**
 * Search for citations across all configured API adapters.
 * Returns formatted results for CLI display.
 */
export async function citeSearch(
  query: string,
  options: DiscoveryOptions,
  ctx: CommandContext,
): Promise<string> {
  const results = await ctx.searchEngine.search(query, options);

  if (results.length === 0) {
    return `No results found for "${query}".`;
  }

  const lines: string[] = [
    `Found ${results.length} result(s) for "${query}":`,
    '',
  ];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const storeFlag = r.alreadyInStore ? ' [in store]' : '';
    const authors = formatAuthors(r.work);
    const year = r.work.year ?? '????';
    const title = r.work.title ?? 'Untitled';
    const conf = (r.confidence * 100).toFixed(0);

    lines.push(`  ${i + 1}. ${authors} (${year}). ${title}`);
    lines.push(`     Source: ${r.source} | Confidence: ${conf}%${storeFlag}`);
    if (r.work.doi) {
      lines.push(`     DOI: ${r.work.doi}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// cite trace
// ============================================================================

/**
 * Trace a citation's reference chain and display as a tree.
 */
export async function citeTrace(
  citationId: string,
  depth: number,
  ctx: CommandContext,
): Promise<string> {
  const tree = await ctx.graph.trace(citationId, depth);

  const lines: string[] = ['Citation trace:'];
  renderTree(tree, lines, '');

  if (tree.children.length === 0) {
    lines.push('  (no references found)');
  }

  return lines.join('\n');
}

/**
 * Render a GraphNode tree as indented text lines.
 */
function renderTree(node: GraphNode, lines: string[], indent: string): void {
  const status = node.resolved ? '+' : '?';
  const title = node.work?.title ?? `[unresolved: ${node.citationId.slice(0, 12)}...]`;
  const year = node.work?.year ?? '';
  const yearStr = year ? ` (${year})` : '';

  lines.push(`${indent}[${status}] ${title}${yearStr}`);

  for (const child of node.children) {
    renderTree(child, lines, indent + '  ');
  }
}

// ============================================================================
// cite verify
// ============================================================================

/**
 * Verify citation integrity for a document or the entire store.
 * Uses the injected auditor if available, otherwise performs basic checks.
 */
export async function citeVerify(
  documentPath: string | undefined,
  ctx: CommandContext,
): Promise<string> {
  const allWorks = await ctx.store.all();

  // Filter to document if specified
  const works = documentPath
    ? allWorks.filter(w =>
        w.cited_by.some(p => p.artifact_path === documentPath),
      )
    : allWorks;

  if (works.length === 0) {
    const scope = documentPath ? `in "${documentPath}"` : 'in store';
    return `No citations found ${scope}.`;
  }

  if (ctx.auditor) {
    const audit = await ctx.auditor(works);
    const lines: string[] = [
      'Citation Integrity Report',
      '========================',
      `Total works:  ${audit.totalWorks}`,
      `Verified:     ${audit.verified}`,
      `Unverified:   ${audit.unverified}`,
    ];

    if (audit.issues.length > 0) {
      lines.push('', 'Issues:');
      for (const issue of audit.issues) {
        lines.push(`  - ${issue}`);
      }
    } else {
      lines.push('', 'No issues found.');
    }

    return lines.join('\n');
  }

  // Basic verification without injected auditor
  const verified = works.filter(w => w.verified).length;
  const unverified = works.length - verified;
  const lowConfidence = works.filter(w => w.confidence < 0.7).length;

  const lines: string[] = [
    'Citation Integrity Report (basic)',
    '=================================',
    `Total works:     ${works.length}`,
    `Verified:        ${verified}`,
    `Unverified:      ${unverified}`,
    `Low confidence:  ${lowConfidence}`,
  ];

  return lines.join('\n');
}

// ============================================================================
// cite export
// ============================================================================

/**
 * Export citations in a bibliography format.
 * Uses the injected formatter if available.
 */
export async function citeExport(
  format: BibliographyFormat,
  options: FormatOptions,
  ctx: CommandContext,
  outputPath?: string,
): Promise<string> {
  const works = await ctx.store.all();

  if (works.length === 0) {
    return 'No citations to export.';
  }

  if (!ctx.formatter) {
    return `Export requires bibliography formatter (not yet available). ${works.length} works in store.`;
  }

  const output = ctx.formatter(works, options);

  if (outputPath) {
    return `Exported ${works.length} citations in ${format} format to ${outputPath}`;
  }

  return output;
}

// ============================================================================
// cite enrich
// ============================================================================

/**
 * Re-attempt resolution for unresolved citations in the store.
 */
export async function citeEnrich(
  ctx: CommandContext,
  limit?: number,
  adapter?: string,
): Promise<string> {
  const unresolved = await ctx.store.getUnresolved();

  if (unresolved.length === 0) {
    return 'No unresolved citations to enrich.';
  }

  const toProcess = limit ? unresolved.slice(0, limit) : unresolved;

  const results = await ctx.resolver.resolveBatch(toProcess);

  const lines: string[] = [
    'Enrichment Results',
    '==================',
    `Attempted:  ${results.stats.total_attempted}`,
    `Resolved:   ${results.stats.resolved_count}`,
    `API calls:  ${results.stats.api_calls}`,
    `Avg conf:   ${(results.stats.avg_confidence * 100).toFixed(0)}%`,
  ];

  if (results.unresolved.length > 0) {
    lines.push(`Still unresolved: ${results.unresolved.length}`);
  }

  return lines.join('\n');
}

// ============================================================================
// cite status
// ============================================================================

/**
 * Display summary statistics for the citation store.
 */
export async function citeStatus(ctx: CommandContext): Promise<string> {
  const works = await ctx.store.all();
  const unresolved = await ctx.store.getUnresolved();
  const provenanceVerify = await ctx.provenance.verify();

  const verified = works.filter(w => w.verified).length;
  const avgConfidence = works.length > 0
    ? works.reduce((sum, w) => sum + w.confidence, 0) / works.length
    : 0;

  // Count unique artifact paths
  const artifactPaths = new Set<string>();
  for (const work of works) {
    for (const entry of work.cited_by) {
      artifactPaths.add(entry.artifact_path);
    }
  }

  // Count types
  const typeCounts: Record<string, number> = {};
  for (const work of works) {
    typeCounts[work.type] = (typeCounts[work.type] ?? 0) + 1;
  }

  const lines: string[] = [
    'Citation Store Status',
    '=====================',
    `Total works:        ${works.length}`,
    `Verified:           ${verified}`,
    `Unresolved queue:   ${unresolved.length}`,
    `Avg confidence:     ${(avgConfidence * 100).toFixed(0)}%`,
    `Linked artifacts:   ${artifactPaths.size}`,
    `Provenance valid:   ${provenanceVerify.valid ? 'yes' : 'no'}`,
    '',
    'By type:',
  ];

  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${type}: ${count}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Helpers
// ============================================================================

function formatAuthors(work: Partial<CitedWork>): string {
  if (!work.authors || work.authors.length === 0) return 'Unknown';
  if (work.authors.length === 1) {
    const a = work.authors[0];
    return a.given ? `${a.family}, ${a.given}` : a.family;
  }
  const first = work.authors[0];
  return `${first.family} et al.`;
}
