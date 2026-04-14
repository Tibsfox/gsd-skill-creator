/**
 * Grove Export — directory-based export and import for Grove codebases.
 *
 * Implements the Grove spec section 8 ("Export format"), with one
 * deviation: the canonical bundle is written as a directory structure
 * instead of a tar archive. Users who need a single-file bundle can
 * `tar -cf export.tar grove-export/` the output. Tarball support can
 * be added as a thin wrapper later without changing this module.
 *
 * The directory layout matches the spec exactly:
 *
 *     <outputDir>/
 *     ├── MANIFEST.grove         — canonical-encoded ExportManifest record
 *     ├── records/
 *     │   ├── <hex-hash>.grove   — one file per record, canonical bytes
 *     │   └── ...
 *     └── README.txt             — human-readable summary
 *
 * Export walks every chunk in the `ContentAddressedStore` and writes it
 * out as a record file. Import walks the directory, verifies every file's
 * hash matches its filename, and puts the bytes back into the store.
 *
 * The exported codebase is self-sufficient: a reader can reconstruct
 * state from an export without any out-of-band configuration, as long
 * as the reader understands the Grove format.
 *
 * @module mesh/grove-export
 */

import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import type { GroveStore } from '../memory/grove-store.js';
import { GroveNamespace, HEAD_POINTER_HASH } from './grove-namespace.js';
import {
  type CanonicalValue,
  type GroveRecord,
  type HashRef,
  GROVE_VERSION,
  HASH_ALGO,
  buildRecord,
  decode,
  encode,
  encodeRecord,
  hashBytes,
  hashRecord,
  hashRefToHex,
  hashRefFromHex,
  v,
  TYPE_RECORD_HASH,
  typeRecordPayload,
} from '../memory/grove-format.js';

// ─── ExportManifest type record ─────────────────────────────────────────────

/**
 * The ExportManifest type describes the shape of the manifest file.
 * Its own type hash is computed at module load and embedded in every
 * manifest written by this module.
 */
export function buildExportManifestTypeRecord(): GroveRecord {
  const payload = typeRecordPayload(
    'ExportManifest',
    'A manifest describing the contents of a Grove codebase export.',
    [
      { name: 'format_version', kind: 'uint64', elementKind: null, required: true,
        description: 'Grove format version used to write this export.' },
      { name: 'exported_at_ms', kind: 'uint64', elementKind: null, required: true,
        description: 'Unix milliseconds when the export was created.' },
      { name: 'exported_by',    kind: 'string', elementKind: null, required: false,
        description: 'Opaque identifier of the exporter.' },
      { name: 'record_count',   kind: 'uint64', elementKind: null, required: true,
        description: 'Number of record files in this export.' },
      { name: 'head_namespace', kind: 'hashref', elementKind: null, required: false,
        description: 'Hashref to the head NamespaceRecord at export time, or null.' },
      { name: 'hash_algorithm', kind: 'string', elementKind: null, required: true,
        description: 'Name of the hash algorithm used for record identities.' },
      { name: 'records',        kind: 'array', elementKind: 'hashref', required: true,
        description: 'Every record included in this export, as hashrefs.' },
    ],
  );
  return {
    version: GROVE_VERSION,
    typeHash: TYPE_RECORD_HASH,
    payload,
    provenance: {
      createdAtMs: 0,
      author: null,
      parentHashes: [],
      sessionId: null,
      toolVersion: 'grove-export/1.0',
      dependencies: [],
    },
  };
}

export const EXPORT_MANIFEST_TYPE_HASH: HashRef = hashRecord(buildExportManifestTypeRecord());

// ─── Public types ───────────────────────────────────────────────────────────

export interface ExportOptions {
  /** Where to write the export. Created if missing. */
  outputDir: string;
  /** Opaque identifier of the exporter. Written to the manifest. */
  exportedBy?: string;
  /** Include a human-readable README.txt. Defaults to true. */
  includeReadme?: boolean;
}

export interface ExportResult {
  manifestPath: string;
  recordCount: number;
  records: HashRef[];
  headNamespace: HashRef | null;
}

export interface ImportOptions {
  /** Directory produced by `exportCodebase`. */
  inputDir: string;
  /** If true, verify every record's filename hash matches its contents. Defaults to true. */
  verify?: boolean;
}

export interface ImportResult {
  manifestPath: string;
  recordCount: number;
  imported: number;
  skipped: number;
  headNamespace: HashRef | null;
  /** List of records whose filename hash didn't match content — only populated when verify=true. */
  corruptRecords: string[];
}

// ─── Manifest encode/decode ─────────────────────────────────────────────────

interface ExportManifestPayload {
  formatVersion: number;
  exportedAtMs: number;
  exportedBy: string | null;
  recordCount: number;
  headNamespace: HashRef | null;
  hashAlgorithm: string;
  records: HashRef[];
}

function encodeManifestPayload(payload: ExportManifestPayload): Uint8Array {
  return encode({
    format_version: v.uint(payload.formatVersion),
    exported_at_ms: v.uint(payload.exportedAtMs),
    exported_by: payload.exportedBy === null ? v.null() : v.string(payload.exportedBy),
    record_count: v.uint(payload.recordCount),
    head_namespace:
      payload.headNamespace === null
        ? v.null()
        : v.hashref(payload.headNamespace.algoId, payload.headNamespace.hash),
    hash_algorithm: v.string(payload.hashAlgorithm),
    records: payload.records.map((h) => v.hashref(h.algoId, h.hash)),
  });
}

function decodeManifestPayload(bytes: Uint8Array): ExportManifestPayload {
  const { value } = decode(bytes);
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'kind' in value) {
    throw new Error('grove-export: manifest payload is not a map');
  }
  const m = value as Record<string, CanonicalValue>;
  return {
    formatVersion: Number(unwrapUint(m.format_version, 'format_version')),
    exportedAtMs: Number(unwrapUint(m.exported_at_ms, 'exported_at_ms')),
    exportedBy: unwrapStringOrNull(m.exported_by, 'exported_by'),
    recordCount: Number(unwrapUint(m.record_count, 'record_count')),
    headNamespace: unwrapHashRefOrNull(m.head_namespace, 'head_namespace'),
    hashAlgorithm: unwrapString(m.hash_algorithm, 'hash_algorithm'),
    records: unwrapHashRefArray(m.records, 'records'),
  };
}

function unwrapUint(v: CanonicalValue | undefined, ctx: string): bigint {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'uint64') {
    return v.value;
  }
  throw new Error(`grove-export: expected uint64 at ${ctx}`);
}
function unwrapString(v: CanonicalValue | undefined, ctx: string): string {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'string') {
    return v.value;
  }
  throw new Error(`grove-export: expected string at ${ctx}`);
}
function unwrapStringOrNull(v: CanonicalValue | undefined, ctx: string): string | null {
  if (v === null) return null;
  return unwrapString(v, ctx);
}
function unwrapHashRef(v: CanonicalValue | undefined, ctx: string): HashRef {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'hashref') {
    return v.value;
  }
  throw new Error(`grove-export: expected hashref at ${ctx}`);
}
function unwrapHashRefOrNull(v: CanonicalValue | undefined, ctx: string): HashRef | null {
  if (v === null) return null;
  return unwrapHashRef(v, ctx);
}
function unwrapHashRefArray(v: CanonicalValue | undefined, ctx: string): HashRef[] {
  if (!Array.isArray(v)) {
    throw new Error(`grove-export: expected array at ${ctx}`);
  }
  return v.map((e, i) => unwrapHashRef(e, `${ctx}[${i}]`));
}

// ─── Export ─────────────────────────────────────────────────────────────────

/**
 * Export every record in a ContentAddressedStore to a directory.
 *
 * Walks the CAS's hash index and writes each entry as `records/<hex>.grove`.
 * Also writes a manifest and an optional README. If a namespace head
 * pointer is present in the store, its hash is captured in the manifest
 * so importers can reconstruct name bindings.
 */
export async function exportCodebase(
  store: GroveStore,
  options: ExportOptions,
): Promise<ExportResult> {
  const outputDir = options.outputDir;
  const recordsDir = join(outputDir, 'records');
  await mkdir(recordsDir, { recursive: true });

  // Gather all hashes and their bytes.
  const hashes = await store.listHashes();
  const records: HashRef[] = [];
  let exportedHeadNamespace: HashRef | null = null;

  for (const hex of hashes) {
    // The head pointer lives under HEAD_POINTER_HASH, which is a
    // non-record bytes blob. Special-case it: read its contents as
    // a canonical hashref, capture it for the manifest, but DO NOT
    // write it to records/ (it's not a record, it's an arena-level
    // mutable pointer that gets reconstructed on import).
    const headPointerHex = toHex(HEAD_POINTER_HASH);
    if (hex === headPointerHex) {
      const bytes = await store.getByHash(hex);
      if (bytes) {
        try {
          const { value } = decode(bytes);
          if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            'kind' in value &&
            value.kind === 'hashref'
          ) {
            exportedHeadNamespace = value.value;
          }
        } catch {
          // silent — head pointer was malformed; skip
        }
      }
      continue;
    }

    const bytes = await store.getByHash(hex);
    if (!bytes) continue;
    const outPath = join(recordsDir, `${hex}.grove`);
    await writeFile(outPath, bytes);
    records.push(hashRefFromHex(hex, HASH_ALGO.SHA_256));
  }

  // Build the manifest as a canonical Grove record.
  const manifestPayload = encodeManifestPayload({
    formatVersion: GROVE_VERSION,
    exportedAtMs: Date.now(),
    exportedBy: options.exportedBy ?? null,
    recordCount: records.length,
    headNamespace: exportedHeadNamespace,
    hashAlgorithm: 'sha-256',
    records,
  });
  const manifestRecord = buildRecord(EXPORT_MANIFEST_TYPE_HASH, manifestPayload, {
    author: options.exportedBy ?? null,
    toolVersion: 'grove-export/1.0',
    dependencies: records,
  });
  const manifestBytes = encodeRecord(manifestRecord);
  const manifestPath = join(outputDir, 'MANIFEST.grove');
  await writeFile(manifestPath, manifestBytes);

  if (options.includeReadme ?? true) {
    await writeFile(join(outputDir, 'README.txt'), buildReadme(records.length, exportedHeadNamespace));
  }

  return {
    manifestPath,
    recordCount: records.length,
    records,
    headNamespace: exportedHeadNamespace,
  };
}

function buildReadme(recordCount: number, head: HashRef | null): string {
  const lines = [
    'Grove codebase export',
    '=====================',
    '',
    `Record count:    ${recordCount}`,
    `Head namespace:  ${head ? hashRefToHex(head) : '(none)'}`,
    `Format version:  ${GROVE_VERSION}`,
    '',
    'Structure:',
    '  MANIFEST.grove    Canonical-encoded ExportManifest record',
    '  records/<hex>.grove    One file per Grove record, raw canonical bytes',
    '',
    'To import into another Grove store:',
    '  1. Pass this directory to importCodebase().',
    '  2. The importer verifies every file\'s filename hash matches its contents.',
    '  3. After import, the head namespace pointer is restored.',
    '',
    'To bundle as a single file:',
    '  tar -cf grove-export.tar <this-directory>',
    '',
    'See docs/GROVE-FORMAT.md for the spec.',
  ];
  return lines.join('\n') + '\n';
}

// ─── Import ─────────────────────────────────────────────────────────────────

/**
 * Import every record file from an export directory into a
 * ContentAddressedStore. Verifies filename hash matches contents (when
 * enabled), then restores the head namespace pointer if one was
 * captured in the manifest.
 *
 * Safe to run against a populated store: existing hashes are skipped
 * (dedup via put).
 */
export async function importCodebase(
  store: GroveStore,
  options: ImportOptions,
): Promise<ImportResult> {
  const inputDir = options.inputDir;
  const verify = options.verify ?? true;

  // Read + parse manifest.
  const manifestPath = join(inputDir, 'MANIFEST.grove');
  const manifestBytes = await readFile(manifestPath);
  const manifest = decodeManifestRecord(manifestBytes);

  // Walk records/ and import each file.
  const recordsDir = join(inputDir, 'records');
  const entries = await readdir(recordsDir);
  let imported = 0;
  let skipped = 0;
  const corruptRecords: string[] = [];

  for (const entry of entries) {
    if (!entry.endsWith('.grove')) continue;
    const expectedHex = basename(entry, '.grove');
    const filePath = join(recordsDir, entry);
    const bytes = await readFile(filePath);

    if (verify) {
      const actualHex = toHex(hashBytes(bytes, HASH_ALGO.SHA_256));
      if (actualHex !== expectedHex) {
        corruptRecords.push(entry);
        skipped++;
        continue;
      }
    }

    const { created } = await store.put(expectedHex, bytes);
    if (created) imported++;
    else skipped++;
  }

  // Restore the head pointer if the manifest captured one.
  if (manifest.headNamespace) {
    const headBytes = encode(v.hashref(manifest.headNamespace.algoId, manifest.headNamespace.hash));
    await store.replaceByHash(HEAD_POINTER_HASH, headBytes);
  }

  return {
    manifestPath,
    recordCount: manifest.recordCount,
    imported,
    skipped,
    headNamespace: manifest.headNamespace,
    corruptRecords,
  };
}

/** Decode a manifest record (envelope + payload) into a plain struct. */
function decodeManifestRecord(bytes: Uint8Array): ExportManifestPayload {
  const { value } = decode(bytes);
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'kind' in value) {
    throw new Error('grove-export: manifest record is not a map');
  }
  const m = value as Record<string, CanonicalValue>;
  // Extract the payload bytes from the envelope.
  const payload = m.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !('kind' in payload) || payload.kind !== 'bytes') {
    throw new Error('grove-export: manifest payload is not bytes');
  }
  return decodeManifestPayload(payload.value);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}
