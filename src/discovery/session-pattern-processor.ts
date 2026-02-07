/**
 * Session pattern processor with subagent discovery.
 *
 * Consumes an AsyncGenerator<ParsedEntry> in a single pass, extracting both
 * tool sequence n-grams and bash command categories. Discovers subagent JSONL
 * files from the session directory and processes them alongside the main session,
 * attributing all patterns to the parent session's projectSlug.
 *
 * Three exported functions:
 * - processSession: single-pass extraction from AsyncGenerator
 * - discoverSubagentFiles: find .jsonl files in subagents/ directory
 * - createPatternSessionProcessor: SessionProcessor factory for CorpusScanner
 *
 * Implements: PATT-05 (session processing + integration with CorpusScanner)
 */

import * as path from 'path';
import { readdir } from 'fs/promises';
import type { ParsedEntry, SessionInfo } from './types.js';
import type { SessionPatterns } from './pattern-aggregator.js';
import type { PatternAggregator } from './pattern-aggregator.js';
import type { SessionProcessor } from './corpus-scanner.js';
import { extractNgrams } from './tool-sequence-extractor.js';
import { classifyBashCommand } from './bash-pattern-extractor.js';
import { parseSessionFile } from './session-parser.js';

// ============================================================================
// processSession
// ============================================================================

/**
 * Process a session's parsed entries in a single pass, extracting tool
 * sequence n-grams and bash command category counts.
 *
 * Consumes the AsyncGenerator exactly once. Collects all tool names for
 * n-gram extraction AND classifies bash commands in the same loop. After
 * the loop completes, extracts bigrams (n=2) and trigrams (n=3) from the
 * accumulated tool name sequence.
 *
 * @param entries - AsyncGenerator of ParsedEntry from session parser
 * @param sessionId - Session identifier
 * @param projectSlug - Project slug for attribution
 * @returns SessionPatterns ready for PatternAggregator.addSessionPatterns()
 */
export async function processSession(
  entries: AsyncGenerator<ParsedEntry>,
  sessionId: string,
  projectSlug: string,
): Promise<SessionPatterns> {
  const toolNames: string[] = [];
  const bashCounts = new Map<string, number>();

  // Single pass: consume the generator exactly once
  for await (const entry of entries) {
    if (entry.kind !== 'tool-uses') continue;

    // Collect tool names for n-gram extraction
    for (const tool of entry.data) {
      toolNames.push(tool.name);

      // Check for Bash tool invocations for bash pattern extraction
      if (tool.name === 'Bash' && typeof tool.input.command === 'string') {
        const category = classifyBashCommand(tool.input.command);
        bashCounts.set(category, (bashCounts.get(category) ?? 0) + 1);
      }
    }
  }

  // Extract n-grams from the accumulated tool sequence
  const toolBigrams = extractNgrams(toolNames, 2);
  const toolTrigrams = extractNgrams(toolNames, 3);

  return {
    sessionId,
    projectSlug,
    toolBigrams,
    toolTrigrams,
    bashPatterns: bashCounts,
  };
}

// ============================================================================
// discoverSubagentFiles
// ============================================================================

/**
 * Discover subagent JSONL files for a given session.
 *
 * Derives the subagent directory by stripping the .jsonl extension from
 * the session file path and appending /subagents/. Returns absolute paths
 * to all .jsonl files found, or an empty array if the directory does not exist.
 *
 * @param sessionFullPath - Full path to the main session .jsonl file
 * @returns Array of absolute paths to subagent .jsonl files
 */
export async function discoverSubagentFiles(sessionFullPath: string): Promise<string[]> {
  // Strip .jsonl extension, append /subagents/
  const withoutExt = sessionFullPath.replace(/\.jsonl$/, '');
  const subagentDir = path.join(withoutExt, 'subagents');

  let entries: string[];
  try {
    entries = await readdir(subagentDir);
  } catch {
    // Directory doesn't exist or can't be read
    return [];
  }

  return entries
    .filter(name => name.endsWith('.jsonl'))
    .map(name => path.join(subagentDir, name));
}

// ============================================================================
// createPatternSessionProcessor
// ============================================================================

/**
 * Create a SessionProcessor callback compatible with CorpusScanner.scan().
 *
 * Returns a closure over the given PatternAggregator. When invoked:
 * 1. Processes the main session entries via processSession()
 * 2. Adds the resulting patterns to the aggregator
 * 3. Discovers subagent JSONL files for the session
 * 4. For each subagent: parses its JSONL, processes entries, adds patterns
 *
 * Subagent patterns are attributed to the parent session's projectSlug.
 * Subagent sessionId format: `${parentSessionId}:subagent:${basename}`
 *
 * @param aggregator - PatternAggregator to accumulate patterns into
 * @returns SessionProcessor function for CorpusScanner
 */
export function createPatternSessionProcessor(aggregator: PatternAggregator): SessionProcessor {
  return async (session: SessionInfo, entries: AsyncGenerator<ParsedEntry>): Promise<void> => {
    // 1. Process the main session
    const mainPatterns = await processSession(entries, session.sessionId, session.projectSlug);
    aggregator.addSessionPatterns(mainPatterns);

    // 2. Discover and process subagent JSONL files
    const subagentFiles = await discoverSubagentFiles(session.fullPath);

    for (const subagentPath of subagentFiles) {
      const basename = path.basename(subagentPath);
      const subagentSessionId = `${session.sessionId}:subagent:${basename}`;

      const subEntries = parseSessionFile(subagentPath);
      const subPatterns = await processSession(subEntries, subagentSessionId, session.projectSlug);
      aggregator.addSessionPatterns(subPatterns);
    }
  };
}
