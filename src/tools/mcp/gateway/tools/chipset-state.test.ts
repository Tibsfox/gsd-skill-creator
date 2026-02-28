/**
 * Unit tests for the chipset state manager.
 *
 * Tests initialization, get/modify/replace operations, diff generation,
 * validation enforcement, and snapshot isolation.
 */

import { describe, it, expect } from 'vitest';
import {
  ChipsetStateManager,
  createChipsetStateManager,
} from './chipset-state.js';
import { createDefaultChipsetConfig } from '../../../../integrations/den/chipset.js';

describe('ChipsetStateManager', () => {
  // ── Initialization ──────────────────────────────────────────────────

  describe('initialization', () => {
    it('initializes with default Den chipset config', () => {
      const mgr = createChipsetStateManager();
      const config = mgr.get();
      expect(config.name).toBe('den-v1.28');
      expect(config.positions.length).toBe(10);
      expect(config.topology.type).toBe('squadron');
    });

    it('initializes with custom config', () => {
      const custom = createDefaultChipsetConfig();
      custom.name = 'custom-test';
      const mgr = new ChipsetStateManager(custom);
      expect(mgr.get().name).toBe('custom-test');
    });
  });

  // ── get() ───────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns a deep copy (mutation-safe)', () => {
      const mgr = createChipsetStateManager();
      const a = mgr.get();
      const b = mgr.get();
      expect(a).toEqual(b);
      a.name = 'mutated';
      expect(mgr.get().name).toBe('den-v1.28');
    });

    it('config matches ChipsetConfigSchema structure', () => {
      const mgr = createChipsetStateManager();
      const config = mgr.get();
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('positions');
      expect(config).toHaveProperty('topology');
      expect(config).toHaveProperty('totalBudget');
    });
  });

  // ── modify() ────────────────────────────────────────────────────────

  describe('modify', () => {
    it('updates scalar fields', () => {
      const mgr = createChipsetStateManager();
      const result = mgr.modify({ name: 'updated-name', version: '2.0.0' });
      expect(result.config.name).toBe('updated-name');
      expect(result.config.version).toBe('2.0.0');
      expect(mgr.get().name).toBe('updated-name');
    });

    it('updates total budget', () => {
      const mgr = createChipsetStateManager();
      const result = mgr.modify({ totalBudget: 0.75 });
      expect(result.config.totalBudget).toBe(0.75);
    });

    it('updates existing position fields', () => {
      const mgr = createChipsetStateManager();
      const result = mgr.modify({
        positions: [{ id: 'executor', tokenBudget: 0.20, role: 'builder' }],
      });
      const executor = result.config.positions.find((p) => p.id === 'executor');
      expect(executor).toBeDefined();
      expect(executor!.tokenBudget).toBe(0.20);
      expect(executor!.role).toBe('builder');
    });

    it('removes positions by ID', () => {
      const mgr = createChipsetStateManager();
      const before = mgr.get().positions.length;
      const result = mgr.modify({ removePositions: ['sentinel'] });
      expect(result.config.positions.length).toBe(before - 1);
      expect(result.config.positions.find((p) => p.id === 'sentinel')).toBeUndefined();
      // Also removed from topology
      expect(result.config.topology.agents['sentinel']).toBeUndefined();
    });

    it('updates topology type and fallback', () => {
      const mgr = createChipsetStateManager();
      const result = mgr.modify({
        topology: { type: 'pipeline', fallback: 'executor' },
      });
      expect(result.config.topology.type).toBe('pipeline');
      expect(result.config.topology.fallback).toBe('executor');
    });

    it('returns a diff showing changes', () => {
      const mgr = createChipsetStateManager();
      const result = mgr.modify({ name: 'new-name' });
      expect(result.diff).toContain('den-v1.28');
      expect(result.diff).toContain('new-name');
      expect(result.diff).toContain('---');
      expect(result.diff).toContain('+++');
    });

    it('returns "(no changes)" when nothing changes', () => {
      const mgr = createChipsetStateManager();
      const result = mgr.modify({});
      expect(result.diff).toBe('(no changes)');
    });

    it('modification is idempotent for same input', () => {
      const mgr = createChipsetStateManager();
      mgr.modify({ name: 'idempotent-test' });
      const result = mgr.modify({ name: 'idempotent-test' });
      expect(result.diff).toBe('(no changes)');
    });
  });

  // ── replace() ───────────────────────────────────────────────────────

  describe('replace', () => {
    it('replaces entire config', () => {
      const mgr = createChipsetStateManager();
      const newConfig = createDefaultChipsetConfig();
      newConfig.name = 'replaced';
      mgr.replace(newConfig);
      expect(mgr.get().name).toBe('replaced');
    });

    it('rejects invalid config', () => {
      const mgr = createChipsetStateManager();
      expect(() => mgr.replace({} as any)).toThrow();
    });
  });

  // ── toYaml() ────────────────────────────────────────────────────────

  describe('toYaml', () => {
    it('returns valid JSON string representation', () => {
      const mgr = createChipsetStateManager();
      const yaml = mgr.toYaml();
      const parsed = JSON.parse(yaml);
      expect(parsed.name).toBe('den-v1.28');
    });
  });

  // ── Snapshot isolation ──────────────────────────────────────────────

  describe('snapshot isolation', () => {
    it('modify result is isolated from subsequent modifications', () => {
      const mgr = createChipsetStateManager();
      const result1 = mgr.modify({ name: 'first' });
      mgr.modify({ name: 'second' });
      expect(result1.config.name).toBe('first');
      expect(mgr.get().name).toBe('second');
    });
  });
});
