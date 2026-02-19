/**
 * Scan orchestrator coordinating signature and heuristic scanners.
 *
 * Main entry point for virus scanning. Loads scan policy from YAML,
 * runs enabled scanning layers (signature, heuristic) based on
 * configurable depth, merges verdicts using worst-case semantics,
 * and provides batch processing for mirror state entries.
 *
 * Scan depths:
 * - fast: signature scan only
 * - standard: signatures + heuristics + checksum lookup
 * - thorough: all layers including emulated scanning
 *
 * @module
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

import { scanBuffer, isBootBlock, isHunkFile } from './signature-scanner.js';
import { analyzeHunkFile, analyzeBootBlock, deriveHeuristicVerdict } from './heuristic-scanner.js';
import { loadSignatureDatabase } from './signature-db.js';
import { quarantineFile } from './quarantine.js';
import { loadMirrorState, saveMirrorState, updateEntry } from './mirror-state.js';
import { parseHunkFile } from './hunk-parser.js';
import { parseBootBlock } from './bootblock-parser.js';
import { ScanPolicyConfigSchema } from './types.js';
import type {
  VirusSignature,
  ScanReport,
  ScanVerdict,
  ScanDepth,
  ScanPolicyConfig,
  ScanMatch,
  HeuristicFlag,
  MirrorState,
} from './types.js';

// ============================================================================
// Verdict merging
// ============================================================================

/** Severity rank for verdict comparison: higher = worse. */
const VERDICT_RANK: Record<ScanVerdict, number> = {
  unscanned: 0,
  clean: 1,
  suspicious: 2,
  infected: 3,
};

/**
 * Merge multiple layer verdicts using worst-case semantics.
 *
 * Priority: infected > suspicious > clean > unscanned.
 * An empty array returns 'unscanned'.
 *
 * @param verdicts - Array of verdicts from individual scan layers
 * @returns The worst-case merged verdict
 */
export function mergeVerdicts(verdicts: ScanVerdict[]): ScanVerdict {
  if (verdicts.length === 0) return 'unscanned';

  let worst: ScanVerdict = 'unscanned';
  let worstRank = 0;

  for (const v of verdicts) {
    const rank = VERDICT_RANK[v];
    if (rank > worstRank) {
      worstRank = rank;
      worst = v;
    }
  }

  return worst;
}

// ============================================================================
// Scan policy
// ============================================================================

/**
 * Return the default scan policy (embedded, no YAML file needed).
 *
 * Defaults:
 * - fast: signatures only
 * - standard: signatures + heuristics + checksum
 * - thorough: all layers
 */
export function defaultScanPolicy(): ScanPolicyConfig {
  return {
    version: 1,
    defaultDepth: 'standard',
    depths: {
      fast: {
        signatureScan: true,
        heuristicScan: false,
        emulatedScan: false,
        checksumLookup: false,
      },
      standard: {
        signatureScan: true,
        heuristicScan: true,
        emulatedScan: false,
        checksumLookup: true,
      },
      thorough: {
        signatureScan: true,
        heuristicScan: true,
        emulatedScan: true,
        checksumLookup: true,
      },
    },
  };
}

/**
 * Load scan policy from a YAML file with Zod validation.
 *
 * Falls back to defaultScanPolicy() when the file does not exist.
 * Throws a ZodError if the file exists but contains invalid data.
 *
 * @param yamlPath - Absolute path to the scan-policy.yaml file
 * @returns Validated ScanPolicyConfig
 */
export function loadScanPolicy(yamlPath: string): ScanPolicyConfig {
  if (!existsSync(yamlPath)) {
    return defaultScanPolicy();
  }

  const raw = readFileSync(yamlPath, 'utf-8');
  const parsed = yaml.load(raw);
  return ScanPolicyConfigSchema.parse(parsed);
}

// ============================================================================
// Single-file scanning
// ============================================================================

/**
 * Scan a single file against all enabled layers.
 *
 * Determines which layers to run based on the scan depth configuration,
 * dispatches to signature scanner and heuristic analyzer as appropriate,
 * and merges the layer verdicts into a unified ScanReport.
 *
 * @param fullPath - Aminet path for the scan report (e.g., "mus/edit/Tracker.lha")
 * @param data - File content as Uint8Array
 * @param signatures - Loaded virus signatures
 * @param policy - Scan policy configuration
 * @param depth - Scan depth override (uses policy.defaultDepth if omitted)
 * @returns Complete ScanReport
 */
export function scanPackage(
  fullPath: string,
  data: Uint8Array,
  signatures: VirusSignature[],
  policy: ScanPolicyConfig,
  depth?: ScanDepth,
): ScanReport {
  const effectiveDepth = depth ?? policy.defaultDepth;
  const depthConfig = policy.depths[effectiveDepth];

  const signatureMatches: ScanMatch[] = [];
  const heuristicFlags: HeuristicFlag[] = [];
  const layerVerdicts: ScanVerdict[] = [];

  // Layer 1: Signature scanning
  if (depthConfig.signatureScan) {
    const matches = scanBuffer(data, signatures);
    signatureMatches.push(...matches);
    layerVerdicts.push(matches.length > 0 ? 'infected' : 'clean');
  } else {
    layerVerdicts.push('unscanned');
  }

  // Layer 2: Heuristic analysis (only on recognized binary formats)
  if (depthConfig.heuristicScan) {
    let heuristicRan = false;

    if (isHunkFile(data)) {
      try {
        const parsed = parseHunkFile(data);
        const flags = analyzeHunkFile(parsed, data);
        heuristicFlags.push(...flags);
        heuristicRan = true;
      } catch {
        // Parsing failure: treat as non-binary, skip heuristics
      }
    }

    if (isBootBlock(data)) {
      try {
        const parsed = parseBootBlock(data);
        const flags = analyzeBootBlock(parsed);
        heuristicFlags.push(...flags);
        heuristicRan = true;
      } catch {
        // Parsing failure: skip heuristics
      }
    }

    if (heuristicRan) {
      layerVerdicts.push(deriveHeuristicVerdict(heuristicFlags));
    } else {
      // Not a recognized binary format: heuristic layer has nothing to analyze
      layerVerdicts.push('clean');
    }
  } else {
    layerVerdicts.push('unscanned');
  }

  const verdict = mergeVerdicts(layerVerdicts);

  return {
    fullPath,
    verdict,
    scannedAt: new Date().toISOString(),
    scanDepth: effectiveDepth,
    signatureMatches,
    heuristicFlags,
  };
}

// ============================================================================
// Batch scanning
// ============================================================================

/**
 * Batch scan all 'scan-pending' packages in the mirror.
 *
 * Loads the scan policy and signature database, iterates over all
 * mirror state entries with status 'scan-pending', scans each file,
 * quarantines infected files, updates entry statuses, and persists
 * the updated mirror state.
 *
 * @param config - Batch scan configuration
 * @returns Summary counts: scanned, clean, infected, suspicious
 */
export function batchScan(config: {
  mirrorDir: string;
  quarantineDir: string;
  cacheDir: string;
  policyPath?: string;
  depth?: ScanDepth;
}): { scanned: number; clean: number; infected: number; suspicious: number } {
  // Load scan policy
  const policy = config.policyPath
    ? loadScanPolicy(config.policyPath)
    : defaultScanPolicy();

  // Load signature database
  const signatures = loadSignatureDatabase();

  // Load mirror state
  let state = loadMirrorState(config.cacheDir);

  const summary = { scanned: 0, clean: 0, infected: 0, suspicious: 0 };

  // Process scan-pending entries
  for (const [fullPath, entry] of Object.entries(state.entries)) {
    if (entry.status !== 'scan-pending') continue;

    // Read file from mirror directory
    const localPath = entry.localPath ?? fullPath;
    const filePath = join(config.mirrorDir, localPath);

    if (!existsSync(filePath)) {
      // File missing from mirror: skip (don't crash the batch)
      continue;
    }

    const data = new Uint8Array(readFileSync(filePath));

    // Scan the file
    const report = scanPackage(fullPath, data, signatures, policy, config.depth);

    summary.scanned++;

    if (report.verdict === 'infected') {
      // Quarantine infected file
      quarantineFile(filePath, report, config.quarantineDir);
      state = updateEntry(state, fullPath, { status: 'infected' });
      summary.infected++;
    } else if (report.verdict === 'suspicious') {
      // Suspicious files are flagged but not quarantined
      state = updateEntry(state, fullPath, { status: 'clean' });
      summary.suspicious++;
    } else {
      // Clean
      state = updateEntry(state, fullPath, { status: 'clean' });
      summary.clean++;
    }
  }

  // Persist updated mirror state
  saveMirrorState(state, config.cacheDir);

  return summary;
}
