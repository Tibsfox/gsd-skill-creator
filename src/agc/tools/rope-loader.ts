/**
 * AGC rope image loader for Virtual AGC binary format.
 *
 * Reads rope images from the Virtual AGC project (binary files containing
 * 15-bit words as big-endian 16-bit values). Supports full 36-bank images
 * and partial images.
 *
 * Format: 36 banks x 1024 words x 2 bytes = 73728 bytes (full image).
 * Each 16-bit word: high bit is parity/zero, low 15 bits are the AGC word.
 */

import { readFile } from 'node:fs/promises';
import { type AgcMemory, createMemory, loadFixed } from '../memory.js';
import { WORD15_MASK } from '../types.js';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Words per fixed memory bank. */
const WORDS_PER_BANK = 1024;

/** Bytes per bank in the rope image (2 bytes per word). */
const BYTES_PER_BANK = WORDS_PER_BANK * 2;

/** Total number of fixed memory banks. */
const TOTAL_BANKS = 36;

// ─── Types ──────────────────────────────────────────────────────────────────

/** Metadata about a loaded rope image. */
export interface RopeMetadata {
  /** Total number of 15-bit words in the image. */
  totalWords: number;
  /** Number of complete banks in the image. */
  totalBanks: number;
  /** Bank indices that contain non-zero data. */
  bankMap: number[];
  /** Original file/buffer size in bytes. */
  byteLength: number;
}

/** Result of loading a rope image into AGC memory. */
export interface LoadedRope {
  /** AGC memory with fixed banks populated from the rope image. */
  memory: AgcMemory;
  /** Metadata about the loaded rope image. */
  metadata: RopeMetadata;
}

// ─── Bank Extraction ────────────────────────────────────────────────────────

/**
 * Extract a single bank's 1024 words from a rope image buffer.
 *
 * Words are stored as big-endian 16-bit values; the high bit is
 * parity or zero. Returns an array of 15-bit values.
 */
export function getRopeBankData(buffer: Buffer | Uint8Array, bank: number): number[] {
  const offset = bank * BYTES_PER_BANK;
  const words: number[] = [];

  if (offset + BYTES_PER_BANK > buffer.length) {
    // Partial bank or out of range -- return what we have
    const available = Math.max(0, buffer.length - offset);
    const wordCount = Math.floor(available / 2);
    for (let i = 0; i < wordCount; i++) {
      const hi = buffer[offset + i * 2];
      const lo = buffer[offset + i * 2 + 1];
      words.push(((hi << 8) | lo) & WORD15_MASK);
    }
    return words;
  }

  for (let i = 0; i < WORDS_PER_BANK; i++) {
    const hi = buffer[offset + i * 2];
    const lo = buffer[offset + i * 2 + 1];
    words.push(((hi << 8) | lo) & WORD15_MASK);
  }

  return words;
}

// ─── Buffer Loading ─────────────────────────────────────────────────────────

/**
 * Load a rope image from a buffer into AGC fixed memory.
 *
 * Parses big-endian 16-bit words, organizes into 1024-word banks,
 * and populates AGC fixed memory using loadFixed().
 *
 * @param buffer - Raw rope image data (Buffer or Uint8Array)
 * @param baseMemory - Optional base memory to load on top of
 * @returns Loaded memory state and metadata
 */
export function loadRopeFromBuffer(
  buffer: Buffer | Uint8Array,
  baseMemory?: AgcMemory,
): LoadedRope {
  let memory = baseMemory ?? createMemory();

  const totalWords = Math.floor(buffer.length / 2);
  const totalBanks = Math.min(Math.floor(buffer.length / BYTES_PER_BANK), TOTAL_BANKS);
  const bankMap: number[] = [];

  for (let bank = 0; bank < totalBanks; bank++) {
    const bankData = getRopeBankData(buffer, bank);

    // Check if bank has any non-zero content
    const hasContent = bankData.some(w => w !== 0);
    if (hasContent) {
      bankMap.push(bank);
    }

    // Load bank into fixed memory regardless (zeros are valid)
    memory = loadFixed(memory, bank, bankData);
  }

  return {
    memory,
    metadata: {
      totalWords,
      totalBanks,
      bankMap,
      byteLength: buffer.length,
    },
  };
}

// ─── File Loading ───────────────────────────────────────────────────────────

/**
 * Load a rope image from a file path into AGC fixed memory.
 *
 * Reads the file and delegates to loadRopeFromBuffer().
 *
 * @param filePath - Path to the rope image binary file
 * @param baseMemory - Optional base memory to load on top of
 * @returns Loaded memory state and metadata
 */
export async function loadRopeImage(
  filePath: string,
  baseMemory?: AgcMemory,
): Promise<LoadedRope> {
  const buffer = await readFile(filePath);
  return loadRopeFromBuffer(buffer, baseMemory);
}
