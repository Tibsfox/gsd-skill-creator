/**
 * SAUCE (Standard Architecture for Universal Comment Extensions) parser.
 *
 * Reads the 128-byte metadata record appended to the tail of ANSI art files.
 * Source: https://www.acid.org/info/sauce/sauce.htm
 */

export interface BbsSauceRecord {
  /** Always "SAUCE" (5 bytes) */
  id: string;
  /** Version string, typically "00" (2 bytes) */
  version: string;
  /** Title of the artwork (35 bytes, CP437 encoded, space-padded) */
  title: string;
  /** Author/artist name (20 bytes, CP437 encoded, space-padded) */
  author: string;
  /** Group/crew name (20 bytes, CP437 encoded, space-padded) */
  group: string;
  /** Creation date in CCYYMMDD format (8 bytes) */
  date: string;
  /** Original file size excluding SAUCE (4 bytes, uint32 LE) */
  fileSize: number;
  /** Data type: 0=None, 1=Character, 2=Bitmap, etc. (1 byte) */
  dataType: number;
  /** File subtype within DataType (1 byte) */
  fileType: number;
  /** Type info 1: width/columns for character data (2 bytes, uint16 LE) */
  tInfo1: number;
  /** Type info 2: height/rows for character data (2 bytes, uint16 LE) */
  tInfo2: number;
  /** Type info 3: type-dependent (2 bytes, uint16 LE) */
  tInfo3: number;
  /** Type info 4: type-dependent (2 bytes, uint16 LE) */
  tInfo4: number;
  /** Number of comment lines, 0-255 (1 byte) */
  comments: number;
  /** Type-dependent flags (1 byte) */
  tFlags: number;
  /** Font name, null-terminated (22 bytes) */
  tInfoS: string;
}

const SAUCE_ID = 'SAUCE';
const SAUCE_RECORD_SIZE = 128;

/**
 * Extract SAUCE metadata from the tail of a binary file buffer.
 *
 * @param buffer - Complete file contents as raw bytes
 * @returns BbsSauceRecord if found, null if no SAUCE record present
 */
export function extractSauce(buffer: Uint8Array | Buffer): BbsSauceRecord | null {
  if (buffer.length < SAUCE_RECORD_SIZE) return null;

  const offset = buffer.length - SAUCE_RECORD_SIZE;

  // Copy the last 128 bytes into a fresh ArrayBuffer to avoid
  // Node.js Buffer pool issues and SharedArrayBuffer type errors
  const copy = new Uint8Array(SAUCE_RECORD_SIZE);
  for (let i = 0; i < SAUCE_RECORD_SIZE; i++) {
    copy[i] = buffer[offset + i];
  }
  const view = new DataView(copy.buffer, 0, SAUCE_RECORD_SIZE);

  // Check SAUCE ID at offset 0
  const id = String.fromCharCode(
    view.getUint8(0), view.getUint8(1), view.getUint8(2),
    view.getUint8(3), view.getUint8(4),
  );
  if (id !== SAUCE_ID) return null;

  // Helper: read fixed-length ASCII/CP437 string, trim trailing spaces/nulls
  function readString(start: number, length: number): string {
    const bytes: number[] = [];
    for (let i = 0; i < length; i++) {
      bytes.push(view.getUint8(start + i));
    }
    return bytes.map((b) => String.fromCharCode(b)).join('').replace(/[\x00\s]+$/, '');
  }

  return {
    id,
    version: readString(5, 2),
    title: readString(7, 35),
    author: readString(42, 20),
    group: readString(62, 20),
    date: readString(82, 8),
    fileSize: view.getUint32(90, true), // little-endian
    dataType: view.getUint8(94),
    fileType: view.getUint8(95),
    tInfo1: view.getUint16(96, true),
    tInfo2: view.getUint16(98, true),
    tInfo3: view.getUint16(100, true),
    tInfo4: view.getUint16(102, true),
    comments: view.getUint8(104),
    tFlags: view.getUint8(105),
    tInfoS: readString(106, 22),
  };
}
