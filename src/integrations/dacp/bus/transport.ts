/**
 * DACP bus transport layer.
 *
 * Wraps the existing GSD Den filesystem bus to add bundle directory
 * companions alongside .msg files. The transport is purely additive --
 * it enhances messages with optional bundle directories without changing
 * any existing bus behavior.
 *
 * Uses the same BusConfig, priority directories, and naming conventions
 * as the Den bus. Bundle directories mirror .msg file naming with a
 * .bundle extension instead of .msg.
 */

import { cp, rename, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';

import type { BusConfig, BusMessage } from '../../den/types.js';
import { sendMessage } from '../../den/bus.js';
import { formatTimestamp, messageFilename } from '../../den/encoder.js';
import { scanForBundles } from './scanner.js';
import type { DACPBusEntry, DACPSendOptions } from './types.js';

// ============================================================================
// DACPTransport
// ============================================================================

/**
 * Transport layer that sends DACP bundles alongside .msg files
 * through the GSD Den filesystem bus.
 *
 * All operations use the same priority directory structure and naming
 * conventions as the underlying Den bus. Bundle directories are placed
 * next to their companion .msg files with matching stem names.
 */
export class DACPTransport {
  private readonly config: BusConfig;

  constructor(config: BusConfig) {
    this.config = config;
  }

  /**
   * Send a message through the bus with an optional bundle companion.
   *
   * 1. Builds a BusMessage and writes .msg via den/bus sendMessage()
   * 2. If bundleDir is provided, copies it alongside the .msg with
   *    matching stem name and .bundle extension
   *
   * @param options - Send parameters including optional bundle directory
   * @returns Absolute path to the written .msg file
   */
  async send(options: DACPSendOptions): Promise<string> {
    const timestamp = formatTimestamp(new Date());

    const message: BusMessage = {
      header: {
        timestamp,
        priority: options.priority,
        opcode: options.opcode as BusMessage['header']['opcode'],
        src: options.source as BusMessage['header']['src'],
        dst: options.target as BusMessage['header']['dst'],
        length: options.payload.length,
      },
      payload: options.payload,
    };

    // Write the .msg file via the standard Den bus
    const msgPath = await sendMessage(this.config, message);

    // If a bundle directory is provided, copy it alongside the .msg
    if (options.bundleDir) {
      const stem = msgPath.replace(/\.msg$/, '');
      const bundlePath = `${stem}.bundle`;
      await cp(options.bundleDir, bundlePath, { recursive: true });
    }

    return msgPath;
  }

  /**
   * Scan all priority directories for messages destined to targetAgent.
   *
   * Returns DACPBusEntry objects with bundlePath populated when a
   * .bundle/ companion exists, or null for plain messages.
   *
   * Results are ordered by priority (ascending), then timestamp (ascending).
   *
   * @param targetAgent - Agent ID to filter by (also matches 'all' broadcasts)
   * @returns Array of bus entries in priority order
   */
  async scan(targetAgent: string): Promise<DACPBusEntry[]> {
    const allEntries = await scanForBundles(this.config);

    return allEntries.filter(
      (entry) => entry.target === targetAgent || entry.target === 'all',
    );
  }

  /**
   * Acknowledge a message by moving both .msg and .bundle/ to acknowledged/.
   *
   * If a bundle companion exists, it is moved first. If the bundle move
   * fails, the .msg is NOT moved (ensuring atomicity). If no bundle
   * exists, only the .msg is moved via the standard Den bus acknowledge.
   *
   * @param msgPath - Absolute path to the .msg file
   * @throws Error if the bundle move fails (leaves .msg in place)
   */
  async acknowledge(msgPath: string): Promise<void> {
    const hasBundle = await this.hasBundleCompanion(msgPath);

    if (hasBundle) {
      const stem = msgPath.replace(/\.msg$/, '');
      const bundlePath = `${stem}.bundle`;
      const bundleDirname = basename(bundlePath);
      const ackBundlePath = join(this.config.busDir, 'acknowledged', bundleDirname);

      try {
        await rename(bundlePath, ackBundlePath);
      } catch (err) {
        throw new Error(
          `Failed to acknowledge bundle companion: ${err instanceof Error ? err.message : String(err)}. ` +
          `The .msg file was NOT moved to preserve atomicity.`,
        );
      }
    }

    // Move the .msg file via standard bus acknowledge
    const msgFilename = basename(msgPath);
    const ackMsgPath = join(this.config.busDir, 'acknowledged', msgFilename);
    await rename(msgPath, ackMsgPath);
  }

  /**
   * Check if a .msg file has a companion .bundle/ directory.
   *
   * Derives the bundle path by replacing .msg with .bundle and
   * checking if that directory exists.
   *
   * @param msgPath - Absolute path to the .msg file
   * @returns true if a companion .bundle/ directory exists
   */
  async hasBundleCompanion(msgPath: string): Promise<boolean> {
    const stem = msgPath.replace(/\.msg$/, '');
    const bundlePath = `${stem}.bundle`;

    try {
      const st = await stat(bundlePath);
      return st.isDirectory();
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a DACPTransport instance.
 *
 * Convenience factory that returns a configured transport.
 * The caller is responsible for ensuring initBus() has been called.
 *
 * @param config - Bus configuration
 * @returns Configured DACPTransport instance
 */
export function createDACPTransport(config: BusConfig): DACPTransport {
  return new DACPTransport(config);
}
