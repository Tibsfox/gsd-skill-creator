/**
 * CalibrationStore -- persists per-capability-class calibration adjustments.
 *
 * Stores calibration data in calibration.json files. Missing files are not errors.
 * Default adjustments are all zeros (no calibration effect).
 *
 * CAL-02: Per-tier calibration claims
 * CAL-03: model_context schema integration
 */

import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { CapabilityClassSchema } from './capability-classifier.js';
import type { CapabilityClass } from './capability-classifier.js';
import { CalibrationAdjustmentSchema } from './model-aware-grader.js';
import type { CalibrationAdjustment } from './model-aware-grader.js';

// ============================================================================
// Schema
// ============================================================================

export const CalibrationFileSchema = z.object({
  version: z.literal(1),
  classes: z.record(z.string(), CalibrationAdjustmentSchema),
}).passthrough();

export type CalibrationFile = z.infer<typeof CalibrationFileSchema>;

// ============================================================================
// Defaults
// ============================================================================

function defaultAdjustment(): CalibrationAdjustment {
  return {
    passRateAdjustment: 0,
    knownLimitationWeight: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// CalibrationStore
// ============================================================================

export class CalibrationStore {
  private data: Map<CapabilityClass, CalibrationAdjustment>;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = new Map();
  }

  /**
   * Load calibration data from file. Missing file returns defaults (no error).
   */
  async load(path?: string): Promise<void> {
    const p = path ?? this.filePath;
    try {
      const content = await fs.readFile(p, 'utf-8');
      const parsed = CalibrationFileSchema.parse(JSON.parse(content));
      this.data.clear();
      for (const [cls, adj] of Object.entries(parsed.classes)) {
        const validClass = CapabilityClassSchema.safeParse(cls);
        if (validClass.success) {
          this.data.set(validClass.data, adj);
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ENOENT') {
        // Missing file is not an error — use defaults
        this.data.clear();
        return;
      }
      throw err;
    }
  }

  /**
   * Save calibration data to file.
   */
  async save(path?: string): Promise<void> {
    const p = path ?? this.filePath;
    const classes: Record<string, CalibrationAdjustment> = {};
    for (const [cls, adj] of this.data) {
      classes[cls] = adj;
    }
    const file: CalibrationFile = { version: 1, classes };
    await fs.writeFile(p, JSON.stringify(file, null, 2), 'utf-8');
  }

  /**
   * Get calibration adjustment for a capability class. Returns default zeros if not set.
   */
  getAdjustment(capabilityClass: CapabilityClass): CalibrationAdjustment {
    return this.data.get(capabilityClass) ?? defaultAdjustment();
  }

  /**
   * Set calibration adjustment. Merges with existing, clamps values.
   */
  setAdjustment(
    capabilityClass: CapabilityClass,
    adjustment: Partial<CalibrationAdjustment>,
  ): void {
    const existing = this.getAdjustment(capabilityClass);
    const merged: CalibrationAdjustment = {
      passRateAdjustment: clamp(
        adjustment.passRateAdjustment ?? existing.passRateAdjustment,
        -0.25,
        0.25,
      ),
      knownLimitationWeight: clamp(
        adjustment.knownLimitationWeight ?? existing.knownLimitationWeight,
        0,
        1,
      ),
      lastUpdated: new Date().toISOString(),
    };
    this.data.set(capabilityClass, merged);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
