/**
 * Provenance chain tracker with dual-index JSONL storage.
 *
 * Maintains bidirectional indexes linking citations to artifacts:
 *   by-artifact.jsonl -- artifact_path -> citation IDs
 *   by-source.jsonl   -- citation_id -> ProvenanceEntry[]
 *
 * Supports chain traversal to configurable depth with circular
 * reference detection via visited set.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { ProvenanceEntry } from '../types/index.js';

// ============================================================================
// Types
// ============================================================================

/** Record in the by-artifact index: maps an artifact path to citation IDs. */
export interface ArtifactRecord {
  artifact_path: string;
  citation_ids: string[];
}

/** Record in the by-source index: maps a citation ID to provenance entries. */
export interface SourceRecord {
  citation_id: string;
  entries: ProvenanceEntry[];
}

/** Result of chain traversal. */
export interface ProvenanceChain {
  root: string;
  children: Array<{ entry: ProvenanceEntry; citationIds: string[] }>;
  depth: number;
  circular: boolean;
}

/** Result of a verify() consistency check. */
export interface VerifyResult {
  valid: boolean;
  orphanedArtifacts: string[];
  orphanedSources: string[];
}

// ============================================================================
// ProvenanceTracker
// ============================================================================

export class ProvenanceTracker {
  private readonly basePath: string;
  private readonly artifactPath: string;
  private readonly sourcePath: string;

  /** In-memory artifact index: artifact_path -> Set<citation_id> */
  private artifactIndex: Map<string, Set<string>> = new Map();
  /** In-memory source index: citation_id -> ProvenanceEntry[] */
  private sourceIndex: Map<string, ProvenanceEntry[]> = new Map();

  constructor(basePath?: string) {
    this.basePath = basePath ?? path.join(process.cwd(), '.citations', 'provenance');
    this.artifactPath = path.join(this.basePath, 'by-artifact.jsonl');
    this.sourcePath = path.join(this.basePath, 'by-source.jsonl');
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  /** Ensure storage directory exists and load indexes into memory. */
  async init(): Promise<void> {
    fs.mkdirSync(this.basePath, { recursive: true });

    if (!fs.existsSync(this.artifactPath)) {
      fs.writeFileSync(this.artifactPath, '');
    }
    if (!fs.existsSync(this.sourcePath)) {
      fs.writeFileSync(this.sourcePath, '');
    }

    this.loadFromDisk();
  }

  // --------------------------------------------------------------------------
  // Core operations
  // --------------------------------------------------------------------------

  /**
   * Link a citation to an artifact via a provenance entry.
   * Updates both indexes atomically.
   */
  async link(citationId: string, entry: ProvenanceEntry): Promise<void> {
    // Update artifact index
    const artifactCitations = this.artifactIndex.get(entry.artifact_path) ?? new Set();
    artifactCitations.add(citationId);
    this.artifactIndex.set(entry.artifact_path, artifactCitations);

    // Update source index
    const sourceEntries = this.sourceIndex.get(citationId) ?? [];
    // Avoid duplicate entries for the same artifact path
    const alreadyLinked = sourceEntries.some(e => e.artifact_path === entry.artifact_path);
    if (!alreadyLinked) {
      sourceEntries.push(entry);
      this.sourceIndex.set(citationId, sourceEntries);
    }

    await this.flushToDisk();
  }

  /**
   * Remove the link between a citation and an artifact.
   * Updates both indexes.
   */
  async unlink(citationId: string, artifactPath: string): Promise<void> {
    // Update artifact index
    const artifactCitations = this.artifactIndex.get(artifactPath);
    if (artifactCitations) {
      artifactCitations.delete(citationId);
      if (artifactCitations.size === 0) {
        this.artifactIndex.delete(artifactPath);
      }
    }

    // Update source index
    const sourceEntries = this.sourceIndex.get(citationId);
    if (sourceEntries) {
      const filtered = sourceEntries.filter(e => e.artifact_path !== artifactPath);
      if (filtered.length === 0) {
        this.sourceIndex.delete(citationId);
      } else {
        this.sourceIndex.set(citationId, filtered);
      }
    }

    await this.flushToDisk();
  }

  /**
   * Get all citation IDs linked to an artifact.
   */
  async getByArtifact(artifactPath: string): Promise<string[]> {
    const ids = this.artifactIndex.get(artifactPath);
    return ids ? Array.from(ids) : [];
  }

  /**
   * Get all provenance entries for a citation.
   */
  async getBySource(citationId: string): Promise<ProvenanceEntry[]> {
    return this.sourceIndex.get(citationId) ?? [];
  }

  /**
   * Walk the provenance chain from a root citation to configurable depth.
   *
   * For each artifact that references the root citation, find what other
   * citations that artifact references, and recurse. Detects circular
   * references using a visited set.
   */
  async getChain(citationId: string, depth = 3): Promise<ProvenanceChain> {
    const visited = new Set<string>();
    const children: Array<{ entry: ProvenanceEntry; citationIds: string[] }> = [];
    let circular = false;

    visited.add(citationId);

    const walk = async (currentId: string, currentDepth: number): Promise<void> => {
      if (currentDepth <= 0) return;

      const entries = await this.getBySource(currentId);
      for (const entry of entries) {
        const linkedIds = await this.getByArtifact(entry.artifact_path);
        // Filter out already-visited citations
        const newIds = linkedIds.filter(id => {
          if (visited.has(id)) {
            circular = true;
            return false;
          }
          return true;
        });

        if (linkedIds.length > 0) {
          children.push({ entry, citationIds: newIds });
        }

        for (const newId of newIds) {
          visited.add(newId);
          await walk(newId, currentDepth - 1);
        }
      }
    };

    await walk(citationId, depth);

    return {
      root: citationId,
      children,
      depth,
      circular,
    };
  }

  /**
   * Verify consistency between the two indexes.
   * Returns orphaned entries that exist in one index but not the other.
   */
  async verify(): Promise<VerifyResult> {
    const orphanedArtifacts: string[] = [];
    const orphanedSources: string[] = [];

    // Check: every citation in artifact index has a source entry
    for (const [artifactPath, citationIds] of this.artifactIndex) {
      for (const citationId of citationIds) {
        const sourceEntries = this.sourceIndex.get(citationId);
        if (!sourceEntries) {
          orphanedArtifacts.push(`${artifactPath}:${citationId}`);
          continue;
        }
        const hasMatchingEntry = sourceEntries.some(e => e.artifact_path === artifactPath);
        if (!hasMatchingEntry) {
          orphanedArtifacts.push(`${artifactPath}:${citationId}`);
        }
      }
    }

    // Check: every entry in source index has a corresponding artifact entry
    for (const [citationId, entries] of this.sourceIndex) {
      for (const entry of entries) {
        const artifactCitations = this.artifactIndex.get(entry.artifact_path);
        if (!artifactCitations || !artifactCitations.has(citationId)) {
          orphanedSources.push(`${citationId}:${entry.artifact_path}`);
        }
      }
    }

    return {
      valid: orphanedArtifacts.length === 0 && orphanedSources.length === 0,
      orphanedArtifacts,
      orphanedSources,
    };
  }

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  private loadFromDisk(): void {
    this.artifactIndex.clear();
    this.sourceIndex.clear();

    // Load artifact index
    const artifactLines = this.readJsonlLines(this.artifactPath);
    for (const line of artifactLines) {
      try {
        const record = JSON.parse(line) as ArtifactRecord;
        this.artifactIndex.set(record.artifact_path, new Set(record.citation_ids));
      } catch {
        // Skip malformed lines
      }
    }

    // Load source index
    const sourceLines = this.readJsonlLines(this.sourcePath);
    for (const line of sourceLines) {
      try {
        const record = JSON.parse(line) as SourceRecord;
        this.sourceIndex.set(record.citation_id, record.entries);
      } catch {
        // Skip malformed lines
      }
    }
  }

  private async flushToDisk(): Promise<void> {
    // Rewrite artifact index
    const artifactLines: string[] = [];
    for (const [artifactPathKey, citationIds] of this.artifactIndex) {
      const record: ArtifactRecord = {
        artifact_path: artifactPathKey,
        citation_ids: Array.from(citationIds),
      };
      artifactLines.push(JSON.stringify(record));
    }
    fs.writeFileSync(this.artifactPath, artifactLines.join('\n') + (artifactLines.length > 0 ? '\n' : ''));

    // Rewrite source index
    const sourceLines: string[] = [];
    for (const [citationId, entries] of this.sourceIndex) {
      const record: SourceRecord = {
        citation_id: citationId,
        entries,
      };
      sourceLines.push(JSON.stringify(record));
    }
    fs.writeFileSync(this.sourcePath, sourceLines.join('\n') + (sourceLines.length > 0 ? '\n' : ''));
  }

  private readJsonlLines(filePath: string): string[] {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').filter(line => line.trim().length > 0);
  }
}
