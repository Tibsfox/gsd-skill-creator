/**
 * Scan gate enforcement and install orchestrator for Aminet packages.
 *
 * The scan gate is the security boundary between downloading and installation.
 * It enforces three requirements:
 * - INS-07: Unscanned packages (mirrored, scan-pending) are refused
 * - INS-08: Infected packages are always refused with no override
 * - INS-09: Suspicious packages require explicit user confirmation
 *
 * The installPackage function orchestrates the full pipeline:
 *   gate check -> extract -> place files -> detect deps -> track install -> update state
 *
 * @module
 */

import type {
  ScanGateResult,
  ScanVerdict,
  MirrorState,
  InstallConfig,
  InstallManifest,
} from './types.js';
import { getEntry, updateEntry, saveMirrorState } from './mirror-state.js';
import { extractLha } from './lha-extractor.js';
import { extractLzx } from './lzx-extractor.js';
import { placeFiles } from './filesystem-mapper.js';
import { detectDependencies } from './dependency-detector.js';
import { recordInstall } from './install-tracker.js';

/**
 * Check whether a package passes the scan gate for installation.
 *
 * Enforces the three security requirements:
 * - INS-07: Packages that have not been scanned are refused
 * - INS-08: Infected packages are always refused (no override possible)
 * - INS-09: Suspicious packages can be overridden with user confirmation
 *
 * @param fullPath - Aminet full path (e.g., "mus/edit/ProTracker36.lha")
 * @param state - Current mirror state
 * @param scanVerdict - Optional scan verdict from heuristic analysis
 * @returns ScanGateResult indicating whether installation is allowed
 */
export function checkScanGate(
  fullPath: string,
  state: MirrorState,
  scanVerdict?: ScanVerdict,
): ScanGateResult {
  const entry = getEntry(state, fullPath);

  // Package not in mirror state at all
  if (!entry) {
    return {
      allowed: false,
      reason: 'Package not found in mirror state',
      requiresOverride: false,
    };
  }

  switch (entry.status) {
    // Not yet downloaded
    case 'not-mirrored':
    case 'downloading':
      return {
        allowed: false,
        reason: 'Package has not been downloaded yet',
        requiresOverride: false,
      };

    // Downloaded but not yet scanned (INS-07)
    case 'mirrored':
    case 'scan-pending':
      return {
        allowed: false,
        reason: 'Package has not been scanned yet',
        requiresOverride: false,
      };

    // Infected -- never allow (INS-08)
    case 'infected':
      return {
        allowed: false,
        reason: 'Package is infected and cannot be installed',
        requiresOverride: false,
      };

    // Clean -- check scanVerdict for heuristic flags
    case 'clean':
      if (scanVerdict === 'suspicious') {
        return {
          allowed: false,
          reason: 'Package has suspicious heuristic flags and requires user override',
          requiresOverride: true,
        };
      }
      return {
        allowed: true,
        reason: 'Package is clean',
        requiresOverride: false,
      };

    // Already installed -- allow re-installation
    case 'installed':
      return {
        allowed: true,
        reason: 'Package is already installed (re-installation)',
        requiresOverride: false,
      };

    // Unknown status
    default:
      return {
        allowed: false,
        reason: `Unknown package status: ${entry.status}`,
        requiresOverride: false,
      };
  }
}

/**
 * Options for the installPackage orchestrator.
 */
export interface InstallPackageOptions {
  /** Aminet full path (e.g., "mus/edit/ProTracker36.lha") */
  fullPath: string;
  /** Absolute path to the archive file on disk */
  archivePath: string;
  /** Current mirror state */
  state: MirrorState;
  /** Install configuration (sysRoot, optional customPath) */
  config: InstallConfig;
  /** Directory for storing install manifests */
  manifestDir: string;
  /** Path to the mirror state file (for persistence) */
  statePath: string;
  /** Raw requires strings from .readme */
  requires?: string[];
  /** Scan verdict from heuristic analysis */
  scanVerdict?: ScanVerdict;
  /** Callback for user confirmation on suspicious packages */
  confirmFn?: (message: string) => Promise<boolean>;
}

/**
 * Orchestrate the full package installation pipeline.
 *
 * Flow:
 * 1. Scan gate check (INS-07, INS-08, INS-09)
 * 2. User confirmation for suspicious packages (via confirmFn)
 * 3. Archive format detection (.lha or .lzx)
 * 4. Extraction to temp directory
 * 5. File placement into emulated Amiga filesystem
 * 6. Dependency detection from .readme Requires:
 * 7. Install manifest recording
 * 8. Mirror state update to 'installed'
 * 9. State persistence
 *
 * @param options - Install orchestration options
 * @returns Manifest and updated mirror state
 * @throws Error if scan gate blocks, user declines override, or format unsupported
 */
export async function installPackage(
  options: InstallPackageOptions,
): Promise<{ manifest: InstallManifest; updatedState: MirrorState }> {
  const {
    fullPath,
    archivePath,
    state,
    config,
    manifestDir,
    statePath,
    requires = [],
    scanVerdict,
    confirmFn,
  } = options;

  // Step 1: Scan gate check
  const gate = checkScanGate(fullPath, state, scanVerdict);

  // Step 2: Handle gate results
  if (!gate.allowed && gate.requiresOverride) {
    // INS-09: Suspicious package needs user confirmation
    if (!confirmFn) {
      throw new Error(
        'Suspicious package requires user confirmation but no confirmFn provided',
      );
    }
    const approved = await confirmFn(
      'Package has suspicious heuristic flags. Install anyway?',
    );
    if (!approved) {
      throw new Error('Installation declined by user');
    }
  } else if (!gate.allowed) {
    // INS-07/INS-08: Hard block
    throw new Error(`Installation blocked: ${gate.reason}`);
  }

  // Step 3: Detect archive format from file extension
  const lowerPath = archivePath.toLowerCase();
  let format: 'lha' | 'lzx';
  if (lowerPath.endsWith('.lha')) {
    format = 'lha';
  } else if (lowerPath.endsWith('.lzx')) {
    format = 'lzx';
  } else {
    throw new Error(
      `Unsupported archive format: ${archivePath}. Only .lha and .lzx are supported.`,
    );
  }

  // Step 4: Extract archive
  const extraction = format === 'lha'
    ? await extractLha(archivePath)
    : await extractLzx(archivePath);

  // Step 5: Place files into emulated filesystem
  const installedFiles = placeFiles(extraction.extractDir, fullPath, config);

  // Step 6: Detect dependencies
  const dependencies = detectDependencies(requires, state);

  // Step 7: Record install manifest
  const manifest = recordInstall(
    fullPath,
    installedFiles,
    dependencies,
    config.sysRoot,
    manifestDir,
  );

  // Step 8: Update mirror state to 'installed'
  const updatedState = updateEntry(state, fullPath, { status: 'installed' });

  // Step 9: Persist state
  saveMirrorState(updatedState, statePath);

  return { manifest, updatedState };
}
