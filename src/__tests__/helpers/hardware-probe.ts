/**
 * HardwareProbe — detects system hardware capabilities for test tier routing.
 *
 * Static methods detect GPU (nvidia-smi), RAM (os.totalmem), and CPU cores.
 * Returns a HardwareProfile with suggested chipset configuration.
 */

import * as os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ============================================================================
// Types
// ============================================================================

export interface GpuInfo {
  name: string;
  memoryMb: number;
}

export interface HardwareProfile {
  gpu: GpuInfo | null;
  ramGb: number;
  cpuCores: number;
  ollamaAvailable: boolean;
}

// ============================================================================
// HardwareProbe
// ============================================================================

export class HardwareProbe {
  /**
   * Detect GPU via nvidia-smi. Returns null if unavailable.
   */
  static async detectGpu(): Promise<GpuInfo | null> {
    try {
      const { stdout } = await execFileAsync('nvidia-smi', [
        '--query-gpu=name,memory.total',
        '--format=csv,noheader,nounits',
      ]);
      const line = stdout.trim().split('\n')[0];
      if (!line) return null;

      const parts = line.split(', ');
      if (parts.length < 2) return null;

      return {
        name: parts[0]!.trim(),
        memoryMb: parseInt(parts[1]!.trim(), 10) || 0,
      };
    } catch {
      return null;
    }
  }

  /** Detect total RAM in GB (1 decimal). */
  static detectRam(): number {
    return Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 10) / 10;
  }

  /** Detect CPU core count. */
  static detectCpuCores(): number {
    return os.cpus().length;
  }

  /** Probe Ollama availability at given URL. */
  static async probeOllamaAvailable(baseUrl = 'http://localhost:11434'): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /** Full hardware summary. */
  static async probeSummary(ollamaBaseUrl?: string): Promise<HardwareProfile> {
    const [gpu, ollamaAvailable] = await Promise.all([
      HardwareProbe.detectGpu(),
      HardwareProbe.probeOllamaAvailable(ollamaBaseUrl),
    ]);

    return {
      gpu,
      ramGb: HardwareProbe.detectRam(),
      cpuCores: HardwareProbe.detectCpuCores(),
      ollamaAvailable,
    };
  }
}
