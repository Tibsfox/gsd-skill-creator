/**
 * Test fixtures for HB-01 tool-attention.
 *
 * Provides a temp-directory config writer so tests can flip the flag without
 * touching the repo's `.claude/gsd-skill-creator.json`.
 */

import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type {
  CompactToolEntry,
  ToolEmbeddingSidecar,
} from '../types.js';
import { hashingEmbedding } from '../iso-score.js';

export function withFlag(value: boolean): { configPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'tool-attn-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(
    configPath,
    JSON.stringify({
      'gsd-skill-creator': {
        'cs25-26-sweep': {
          'tool-attention': { enabled: value },
        },
      },
    }),
  );
  return { configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/**
 * Tiered synthetic tool corpus for baseline measurement.
 *
 * Tier breakdown (matches spec §6: simple-CRUD / mid-complexity-with-enums /
 * large-schema-with-nested-objects). Token counts are approximate but stable.
 */
export interface SyntheticTool {
  compact: CompactToolEntry;
  sidecar: ToolEmbeddingSidecar;
  schema: Record<string, unknown>;
}

export function buildSyntheticCorpus(n: number = 60): SyntheticTool[] {
  const tools: SyntheticTool[] = [];
  for (let i = 0; i < n; i++) {
    const tier = i % 3; // 0=simple, 1=mid, 2=large
    const name = tierName(tier, i);
    const desc = tierDescription(tier);
    const schema = tierSchema(tier);
    const compactTokens = 8 + Math.ceil(desc.length / 4);
    // Token estimate from JSON schema length / 4 (standard heuristic).
    const fullSchemaTokens = Math.ceil(JSON.stringify(schema).length / 4);
    tools.push({
      compact: {
        name,
        shortDescription: desc,
        compactTokens,
        fullSchemaTokens,
      },
      sidecar: {
        name,
        embedding: hashingEmbedding(name + ' ' + desc, 64),
        // Pin "noop_simple_0" only — distinctive name for pin-tests.
        phasePins: name === 'simple_0' ? ['planning'] : undefined,
      },
      schema,
    });
  }
  return tools;
}

function tierName(tier: number, i: number): string {
  if (tier === 0) return `simple_${i}`;
  if (tier === 1) return `mid_${i}`;
  return `large_${i}`;
}

function tierDescription(tier: number): string {
  if (tier === 0) return 'Simple CRUD operation against a flat record store';
  if (tier === 1) return 'Mid-complexity action with enum parameters and validation';
  return 'Large nested-object schema covering multi-step workflow control';
}

function tierSchema(tier: number): Record<string, unknown> {
  if (tier === 0) {
    return {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Record identifier' },
        value: { type: 'string', description: 'Field value' },
      },
      required: ['id'],
    };
  }
  if (tier === 1) {
    return {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'delete', 'archive', 'restore', 'move'],
        },
        target: {
          type: 'string',
          description: 'Target identifier; resolved against the active workspace registry',
        },
        priority: { type: 'string', enum: ['low', 'normal', 'high'] },
        timestamp: { type: 'string', format: 'date-time' },
        metadata: { type: 'object', additionalProperties: { type: 'string' } },
      },
      required: ['action', 'target'],
    };
  }
  return {
    type: 'object',
    properties: {
      workflow: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['shell', 'http', 'fn', 'wait', 'branch'] },
                payload: {
                  type: 'object',
                  properties: {
                    args: { type: 'array', items: { type: 'string' } },
                    env: { type: 'object', additionalProperties: { type: 'string' } },
                    timeoutMs: { type: 'number', minimum: 0 },
                    retry: {
                      type: 'object',
                      properties: {
                        maxAttempts: { type: 'number' },
                        backoffMs: { type: 'number' },
                      },
                    },
                  },
                },
                preconditions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      kind: { type: 'string', enum: ['env', 'file', 'value'] },
                      expression: { type: 'string' },
                    },
                  },
                },
              },
              required: ['kind'],
            },
          },
          policies: {
            type: 'object',
            properties: {
              concurrency: { type: 'number' },
              isolation: { type: 'string', enum: ['none', 'process', 'sandbox'] },
              network: { type: 'string', enum: ['off', 'on', 'restricted'] },
            },
          },
        },
        required: ['steps'],
      },
      identity: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          tenant: { type: 'string' },
          permissions: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    required: ['workflow'],
  };
}

/**
 * p50/p95 from a sorted array. Inputs may contain integers or floats.
 */
export function percentiles(sorted: number[]): { p50: number; p95: number } {
  if (sorted.length === 0) return { p50: 0, p95: 0 };
  const idx = (p: number) => Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return { p50: sorted[idx(0.50)] ?? 0, p95: sorted[idx(0.95)] ?? 0 };
}
