import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { exportToFlatGeobuf, readFlatGeobufRoundTrip } from '../flatgeobuf-export.js';
import { FLATGEOBUF_MAGIC } from '../format-constants.js';
import type { PgQueryable } from '../hybrid-query.js';

function mockClient(rowMap: Record<string, unknown[]>): PgQueryable {
  let callIdx = 0;
  const order = ['bbox', 'rows'] as const;
  return {
    query: async <R>() => {
      const key = order[callIdx++];
      const rows = (rowMap[key!] ?? []) as R[];
      return { rows, rowCount: rows.length };
    },
  };
}

describe('exportToFlatGeobuf — fall-through (upstream absent)', () => {
  const tmpFile = resolve(tmpdir(), 'fgb-export-test.fgb');

  afterEach(() => {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  });

  it('throws when no positions exist', async () => {
    const client = mockClient({
      bbox: [{ min_x: null, min_y: null, max_x: null, max_y: null }],
      rows: [],
    });
    await expect(exportToFlatGeobuf({ pgClient: client, outPath: tmpFile })).rejects.toThrow(/no positions/);
  });

  it('writes a stub file with FlatGeobuf magic when upstream is absent', async () => {
    const client = mockClient({
      bbox: [{ min_x: 0, min_y: 0, max_x: 100, max_y: 100 }],
      rows: [
        { id: 's1', qualified_name: 'foo.bar', kind: 'function', file_path: 'src/foo.ts',
          geom_json: '{"type":"Point","coordinates":[10,20]}' },
        { id: 's2', qualified_name: 'foo.baz', kind: 'function', file_path: 'src/foo.ts',
          geom_json: '{"type":"Point","coordinates":[30,40]}' },
      ],
    });
    const report = await exportToFlatGeobuf({ pgClient: client, outPath: tmpFile });

    expect(existsSync(tmpFile)).toBe(true);
    expect(report.row_count).toBe(2);
    expect(report.bbox).toEqual([0, 0, 100, 100]);
    expect(report.upstream_flatgeobuf_available).toBe(false);

    // First 8 bytes must match FlatGeobuf magic (even on stub fallback).
    const buf = readFileSync(tmpFile);
    for (let i = 0; i < 8; i++) {
      expect(buf[i]).toBe(FLATGEOBUF_MAGIC[i]);
    }
  });

  it('passes project_id and kindFilter as bound parameters (HIGH-04 fix)', async () => {
    const captured: { values?: unknown[] }[] = [];
    const client: PgQueryable = {
      query: async <R>(_text: string, values?: unknown[]) => {
        captured.push({ values });
        if (captured.length === 1) {
          return { rows: [{ min_x: 0, min_y: 0, max_x: 1, max_y: 1 }] as R[], rowCount: 1 };
        }
        return { rows: [] as R[], rowCount: 0 };
      },
    };
    await exportToFlatGeobuf({
      pgClient: client,
      outPath: tmpFile,
      projectId: 'gsd-skill-creator',
      kindFilter: 'function',
    }).catch(() => null);
    expect(captured[0]!.values).toEqual(['gsd-skill-creator', 'function']);
  });
});

describe('readFlatGeobufRoundTrip (scaffold)', () => {
  it('reports unverified parity when upstream is absent', async () => {
    const result = await readFlatGeobufRoundTrip('/no/such/file.fgb');
    expect(result.upstream_available).toBe(false);
    expect(result.row_count).toBeNull();
    expect(result.bbox).toBeNull();
  });
});
