/**
 * Multi-ecosystem manifest discovery.
 *
 * Locates and parses package manifest files for npm, PyPI, conda, Cargo, and
 * RubyGems — returning a unified list of DependencyRecord objects.  Missing
 * manifests silently produce empty arrays; they are not errors.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { DependencyRecord, AuditorConfig, Ecosystem } from './types.js';
import { MANIFEST_FILENAMES } from './types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

function makeRecord(
  name: string,
  version: string,
  ecosystem: Ecosystem,
  sourceManifest: string,
): DependencyRecord {
  return { name, version, ecosystem, sourceManifest };
}

// ─── npm ─────────────────────────────────────────────────────────────────────

async function parseNpm(projectRoot: string): Promise<DependencyRecord[]> {
  const manifestPath = join(projectRoot, MANIFEST_FILENAMES.npm[0]);
  const raw = await tryReadFile(manifestPath);
  if (!raw) return [];

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return [];
  }

  const records: DependencyRecord[] = [];
  for (const field of ['dependencies', 'devDependencies'] as const) {
    const section = pkg[field];
    if (section && typeof section === 'object') {
      for (const [name, version] of Object.entries(
        section as Record<string, string>,
      )) {
        records.push(makeRecord(name, String(version), 'npm', manifestPath));
      }
    }
  }
  return records;
}

// ─── PyPI ─────────────────────────────────────────────────────────────────────

function parsePypiLine(
  line: string,
  manifestPath: string,
): DependencyRecord | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  // Match `name==version`, `name>=version`, `name<=version`, etc.
  const constraintMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\s*(==|>=|<=|~=|!=|>|<)\s*(.+)$/);
  if (constraintMatch) {
    const name = constraintMatch[1].toLowerCase();
    const op = constraintMatch[2];
    const ver = constraintMatch[3].trim();
    const version = op === '==' ? ver : `${op}${ver}`;
    return makeRecord(name, version, 'pypi', manifestPath);
  }

  // Plain package name, no version constraint
  const nameMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\s*$/);
  if (nameMatch) {
    return makeRecord(nameMatch[1].toLowerCase(), '*', 'pypi', manifestPath);
  }

  return null;
}

async function parsePypi(projectRoot: string): Promise<DependencyRecord[]> {
  const manifestPath = join(projectRoot, MANIFEST_FILENAMES.pypi[0]);
  const raw = await tryReadFile(manifestPath);
  if (!raw) return [];

  return raw
    .split('\n')
    .map((line) => parsePypiLine(line, manifestPath))
    .filter((r): r is DependencyRecord => r !== null);
}

// ─── Conda ───────────────────────────────────────────────────────────────────

function parseCondaDepString(
  item: string,
  manifestPath: string,
  ecosystem: Ecosystem,
): DependencyRecord | null {
  const trimmed = item.trim();
  if (!trimmed) return null;

  // `name=version` (conda style) or `name==version` / `name>=version`
  const match = trimmed.match(/^([A-Za-z0-9_.-]+)\s*(==|>=|<=|~=|!=|>|<|=)\s*(.+)$/);
  if (match) {
    const name = match[1].toLowerCase();
    const op = match[2];
    const ver = match[3].trim();
    const version = op === '=' || op === '==' ? ver : `${op}${ver}`;
    return makeRecord(name, version, ecosystem, manifestPath);
  }

  const nameOnly = trimmed.match(/^([A-Za-z0-9_.-]+)\s*$/);
  if (nameOnly) {
    return makeRecord(nameOnly[1].toLowerCase(), '*', ecosystem, manifestPath);
  }

  return null;
}

async function parseConda(projectRoot: string): Promise<DependencyRecord[]> {
  const manifestPath = join(projectRoot, MANIFEST_FILENAMES.conda[0]);
  const raw = await tryReadFile(manifestPath);
  if (!raw) return [];

  let doc: unknown;
  try {
    doc = yaml.load(raw);
  } catch {
    return [];
  }

  if (!doc || typeof doc !== 'object') return [];
  const envDoc = doc as Record<string, unknown>;
  const deps = envDoc['dependencies'];
  if (!Array.isArray(deps)) return [];

  const records: DependencyRecord[] = [];

  for (const item of deps) {
    if (typeof item === 'string') {
      const rec = parseCondaDepString(item, manifestPath, 'conda');
      if (rec) records.push(rec);
    } else if (item && typeof item === 'object') {
      // pip subsection: { pip: ['requests==2.31.0', ...] }
      const itemObj = item as Record<string, unknown>;
      if (Array.isArray(itemObj['pip'])) {
        for (const pipItem of itemObj['pip'] as unknown[]) {
          if (typeof pipItem === 'string') {
            const rec = parsePypiLine(pipItem, manifestPath);
            if (rec) records.push(rec);
          }
        }
      }
    }
  }

  return records;
}

// ─── Cargo ───────────────────────────────────────────────────────────────────

async function parseCargo(projectRoot: string): Promise<DependencyRecord[]> {
  const manifestPath = join(projectRoot, MANIFEST_FILENAMES.cargo[0]);
  const raw = await tryReadFile(manifestPath);
  if (!raw) return [];

  const records: DependencyRecord[] = [];
  let inDepsSection = false;

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();

    // Section headers
    if (line.startsWith('[')) {
      inDepsSection =
        line === '[dependencies]' || line === '[dev-dependencies]';
      continue;
    }

    if (!inDepsSection || !line || line.startsWith('#')) continue;

    // Simple string: `serde = "1.0"`
    const simpleMatch = line.match(/^([\w-]+)\s*=\s*["']([^"']+)["']/);
    if (simpleMatch) {
      records.push(
        makeRecord(simpleMatch[1], simpleMatch[2], 'cargo', manifestPath),
      );
      continue;
    }

    // Inline table: `tokio = { version = "1.28", ... }`
    const tableMatch = line.match(
      /^([\w-]+)\s*=\s*\{[^}]*version\s*=\s*["']([^"']+)["']/,
    );
    if (tableMatch) {
      records.push(
        makeRecord(tableMatch[1], tableMatch[2], 'cargo', manifestPath),
      );
    }
  }

  return records;
}

// ─── RubyGems ─────────────────────────────────────────────────────────────────

async function parseRubyGems(projectRoot: string): Promise<DependencyRecord[]> {
  const manifestPath = join(projectRoot, MANIFEST_FILENAMES.rubygems[0]);
  const raw = await tryReadFile(manifestPath);
  if (!raw) return [];

  const records: DependencyRecord[] = [];

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // `gem 'name', 'version'` or `gem "name", "version"` or `gem 'name'`
    const match = line.match(/^gem\s+['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)["'])?/);
    if (match) {
      const name = match[1];
      const version = match[2] ?? '*';
      records.push(makeRecord(name, version, 'rubygems', manifestPath));
    }
  }

  return records;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Discovers all declared dependencies in a project directory across all five
 * supported ecosystems.  Returns an empty array (never throws) when a manifest
 * file is absent or malformed.
 */
export async function discoverManifests(
  projectRoot: string,
): Promise<DependencyRecord[]> {
  const [npm, pypi, conda, cargo, rubygems] = await Promise.all([
    parseNpm(projectRoot),
    parsePypi(projectRoot),
    parseConda(projectRoot),
    parseCargo(projectRoot),
    parseRubyGems(projectRoot),
  ]);

  return [...npm, ...pypi, ...conda, ...cargo, ...rubygems];
}

/**
 * Class wrapper around `discoverManifests` for use by the AuditOrchestrator.
 * Accepts the same config object so it can be composed into the orchestrator
 * without duplicating the `projectRoot` reference.
 */
export class ManifestDiscovery {
  private readonly projectRoot: string;

  constructor(config: Pick<AuditorConfig, 'projectRoot'>) {
    this.projectRoot = config.projectRoot;
  }

  /** Discover all dependencies in the configured project root. */
  discover(): Promise<DependencyRecord[]> {
    return discoverManifests(this.projectRoot);
  }
}
