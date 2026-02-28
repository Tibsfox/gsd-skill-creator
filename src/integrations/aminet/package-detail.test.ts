import { describe, it, expect } from 'vitest';
import { buildPackageDetail } from './package-detail.js';
import type { AminetPackage, PackageReadme, MirrorEntry } from './types.js';

/** Synthetic AminetPackage fixture */
const samplePackage: AminetPackage = {
  filename: 'ProTracker36.lha',
  directory: 'mus/edit',
  category: 'mus',
  subcategory: 'edit',
  sizeKb: 142,
  ageDays: 3650,
  description: 'The legendary ProTracker module editor v3.6',
  fullPath: 'mus/edit/ProTracker36.lha',
};

/** Synthetic PackageReadme fixture */
const sampleReadme: PackageReadme = {
  short: 'The legendary ProTracker module editor v3.6',
  author: 'Lars Hamre',
  uploader: 'lars@example.com',
  type: 'mus/edit',
  version: '3.62b',
  requires: ['OS 3.0+', '68020+'],
  architecture: ['m68k-amigaos'],
  description: 'ProTracker is a music tracker application for the Amiga.\nIt supports 4-channel MOD playback and editing.',
  rawHeader: { short: 'The legendary ProTracker module editor v3.6', author: 'Lars Hamre' },
};

/** Synthetic MirrorEntry fixture with status "clean" */
const sampleMirrorEntry: MirrorEntry = {
  fullPath: 'mus/edit/ProTracker36.lha',
  status: 'clean',
  sizeKb: 142,
  sha256: 'abc123def456',
  localPath: '/mirrors/mus/edit/ProTracker36.lha',
  downloadedAt: '2026-01-15T10:00:00Z',
  lastChecked: '2026-01-16T12:00:00Z',
};

describe('buildPackageDetail', () => {
  it('merges all fields from AminetPackage, PackageReadme, and MirrorEntry', () => {
    const detail = buildPackageDetail(samplePackage, sampleReadme, sampleMirrorEntry);

    // INDEX fields preserved
    expect(detail.filename).toBe('ProTracker36.lha');
    expect(detail.directory).toBe('mus/edit');
    expect(detail.category).toBe('mus');
    expect(detail.subcategory).toBe('edit');
    expect(detail.sizeKb).toBe(142);
    expect(detail.ageDays).toBe(3650);
    expect(detail.description).toBe('The legendary ProTracker module editor v3.6');
    expect(detail.fullPath).toBe('mus/edit/ProTracker36.lha');

    // Readme fields
    expect(detail.author).toBe('Lars Hamre');
    expect(detail.version).toBe('3.62b');
    expect(detail.requires).toEqual(['OS 3.0+', '68020+']);
    expect(detail.architecture).toEqual(['m68k-amigaos']);
    expect(detail.longDescription).toBe(
      'ProTracker is a music tracker application for the Amiga.\nIt supports 4-channel MOD playback and editing.',
    );

    // Mirror status
    expect(detail.mirrorStatus).toBe('clean');
  });

  it('handles missing readme gracefully with null/empty defaults', () => {
    const detail = buildPackageDetail(samplePackage, null, undefined);

    // INDEX fields still present
    expect(detail.filename).toBe('ProTracker36.lha');
    expect(detail.directory).toBe('mus/edit');
    expect(detail.fullPath).toBe('mus/edit/ProTracker36.lha');

    // Readme fields default to null/empty
    expect(detail.author).toBeNull();
    expect(detail.version).toBeNull();
    expect(detail.requires).toEqual([]);
    expect(detail.architecture).toEqual([]);
    expect(detail.longDescription).toBeNull();

    // No mirror entry -> "not-mirrored"
    expect(detail.mirrorStatus).toBe('not-mirrored');
  });

  it('derives mirrorStatus from mirrorEntry status "mirrored"', () => {
    const entry: MirrorEntry = { ...sampleMirrorEntry, status: 'mirrored' };
    const detail = buildPackageDetail(samplePackage, null, entry);
    expect(detail.mirrorStatus).toBe('mirrored');
  });

  it('derives mirrorStatus from mirrorEntry status "scan-pending"', () => {
    const entry: MirrorEntry = { ...sampleMirrorEntry, status: 'scan-pending' };
    const detail = buildPackageDetail(samplePackage, null, entry);
    expect(detail.mirrorStatus).toBe('scan-pending');
  });

  it('derives mirrorStatus from mirrorEntry status "installed"', () => {
    const entry: MirrorEntry = { ...sampleMirrorEntry, status: 'installed' };
    const detail = buildPackageDetail(samplePackage, null, entry);
    expect(detail.mirrorStatus).toBe('installed');
  });

  it('defaults mirrorStatus to "not-mirrored" when no mirror entry', () => {
    const detail = buildPackageDetail(samplePackage, sampleReadme, undefined);
    expect(detail.mirrorStatus).toBe('not-mirrored');
  });

  it('handles readme with partial data (author but no version)', () => {
    const partialReadme: PackageReadme = {
      short: 'Partial readme',
      author: 'Some Author',
      uploader: null,
      type: null,
      version: null,
      requires: [],
      architecture: [],
      description: '',
      rawHeader: { short: 'Partial readme', author: 'Some Author' },
    };

    const detail = buildPackageDetail(samplePackage, partialReadme, undefined);
    expect(detail.author).toBe('Some Author');
    expect(detail.version).toBeNull();
    expect(detail.requires).toEqual([]);
    expect(detail.architecture).toEqual([]);
    expect(detail.longDescription).toBe('');
    expect(detail.mirrorStatus).toBe('not-mirrored');
  });

  it('preserves all INDEX fields unchanged', () => {
    const detail = buildPackageDetail(samplePackage, sampleReadme, sampleMirrorEntry);

    expect(detail.filename).toBe(samplePackage.filename);
    expect(detail.directory).toBe(samplePackage.directory);
    expect(detail.category).toBe(samplePackage.category);
    expect(detail.subcategory).toBe(samplePackage.subcategory);
    expect(detail.sizeKb).toBe(samplePackage.sizeKb);
    expect(detail.ageDays).toBe(samplePackage.ageDays);
    expect(detail.description).toBe(samplePackage.description);
    expect(detail.fullPath).toBe(samplePackage.fullPath);
  });
});
