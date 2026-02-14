/**
 * TDD tests for the staging metadata Zod validation schema.
 *
 * Covers StagingMetadataSchema: valid metadata, missing fields,
 * invalid values, and extensibility via passthrough.
 *
 * @module staging/schema.test
 */

import { describe, it, expect } from 'vitest';
import { StagingMetadataSchema } from './schema.js';

describe('StagingMetadataSchema', () => {
  const validMetadata = {
    submitted_at: '2026-02-13T12:00:00Z',
    source: 'dashboard',
    status: 'inbox' as const,
  };

  // --------------------------------------------------------------------------
  // Valid metadata passes
  // --------------------------------------------------------------------------

  it('accepts valid metadata', () => {
    const result = StagingMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Missing fields rejected
  // --------------------------------------------------------------------------

  it('rejects missing submitted_at', () => {
    const { submitted_at, ...rest } = validMetadata;
    const result = StagingMetadataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing source', () => {
    const { source, ...rest } = validMetadata;
    const result = StagingMetadataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects missing status', () => {
    const { status, ...rest } = validMetadata;
    const result = StagingMetadataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Invalid values rejected
  // --------------------------------------------------------------------------

  it('rejects invalid status value', () => {
    const result = StagingMetadataSchema.safeParse({
      ...validMetadata,
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-ISO submitted_at', () => {
    const result = StagingMetadataSchema.safeParse({
      ...validMetadata,
      submitted_at: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // All five valid status values accepted
  // --------------------------------------------------------------------------

  it.each(['inbox', 'checking', 'attention', 'ready', 'aside'])(
    'accepts status value "%s"',
    (status) => {
      const result = StagingMetadataSchema.safeParse({
        ...validMetadata,
        status,
      });
      expect(result.success).toBe(true);
    },
  );

  // --------------------------------------------------------------------------
  // Extensibility -- additional fields preserved
  // --------------------------------------------------------------------------

  it('accepts additional fields via passthrough', () => {
    const extended = {
      ...validMetadata,
      custom_field: 'extra-data',
      priority: 5,
    };
    const result = StagingMetadataSchema.safeParse(extended);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('custom_field', 'extra-data');
      expect(result.data).toHaveProperty('priority', 5);
    }
  });

  // --------------------------------------------------------------------------
  // Status is required, not defaulted
  // --------------------------------------------------------------------------

  it('does not default status when missing', () => {
    const { status, ...rest } = validMetadata;
    const result = StagingMetadataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
