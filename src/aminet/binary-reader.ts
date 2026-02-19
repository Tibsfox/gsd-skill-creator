/**
 * AmigaBinaryReader -- big-endian DataView wrapper with position tracking.
 *
 * Every Amiga binary format uses big-endian (Motorola 68000) byte order.
 * JavaScript's DataView defaults to big-endian but TypedArrays default to
 * platform-native (usually little-endian on x86/ARM). This wrapper ensures
 * consistent big-endian reads and provides sequential position tracking
 * with bounds checking on every operation.
 *
 * Used by: hunk-parser, bootblock-parser, signature-scanner
 */

/**
 * Sequential big-endian binary reader for Amiga data formats.
 *
 * Wraps a DataView with automatic big-endian byte order and a read cursor
 * that advances after each operation. All reads are bounds-checked and
 * throw RangeError with position context on overflow.
 */
export class AmigaBinaryReader {
  private readonly view: DataView;
  private readonly baseOffset: number;
  private readonly byteLen: number;
  private pos: number;

  /**
   * Create a reader from an ArrayBuffer or Uint8Array.
   *
   * When given a Uint8Array, respects its byteOffset and byteLength
   * to correctly handle sub-array views.
   */
  constructor(source: ArrayBuffer | Uint8Array) {
    if (source instanceof Uint8Array) {
      this.view = new DataView(source.buffer, source.byteOffset, source.byteLength);
      this.baseOffset = source.byteOffset;
      this.byteLen = source.byteLength;
    } else {
      this.view = new DataView(source);
      this.baseOffset = 0;
      this.byteLen = source.byteLength;
    }
    this.pos = 0;
  }

  /** Total number of bytes in the buffer. */
  get length(): number {
    return this.byteLen;
  }

  /** Current read position (byte offset from start). */
  get position(): number {
    return this.pos;
  }

  /** Number of bytes remaining from current position to end. */
  get remaining(): number {
    return this.byteLen - this.pos;
  }

  /**
   * Read an unsigned 8-bit integer and advance position by 1.
   * @throws RangeError if read would exceed buffer bounds
   */
  readUint8(): number {
    this.checkBounds(1);
    const value = this.view.getUint8(this.pos);
    this.pos += 1;
    return value;
  }

  /**
   * Read a big-endian unsigned 16-bit integer and advance position by 2.
   * @throws RangeError if read would exceed buffer bounds
   */
  readUint16(): number {
    this.checkBounds(2);
    const value = this.view.getUint16(this.pos, false); // false = big-endian
    this.pos += 2;
    return value;
  }

  /**
   * Read a big-endian unsigned 32-bit integer and advance position by 4.
   * @throws RangeError if read would exceed buffer bounds
   */
  readUint32(): number {
    this.checkBounds(4);
    const value = this.view.getUint32(this.pos, false); // false = big-endian
    this.pos += 4;
    return value;
  }

  /**
   * Read n bytes as a Uint8Array and advance position.
   * @throws RangeError if read would exceed buffer bounds
   */
  readBytes(n: number): Uint8Array {
    if (n === 0) return new Uint8Array(0);
    this.checkBounds(n);
    const bytes = new Uint8Array(this.view.buffer, this.baseOffset + this.pos, n);
    this.pos += n;
    // Return a copy to prevent external mutation of the underlying buffer
    return new Uint8Array(bytes);
  }

  /**
   * Peek at the next uint32 without advancing position.
   * @throws RangeError if read would exceed buffer bounds
   */
  peek(): number {
    this.checkBounds(4);
    return this.view.getUint32(this.pos, false);
  }

  /**
   * Skip n bytes forward.
   * @throws RangeError if skip would exceed buffer bounds
   */
  skip(n: number): void {
    this.checkBounds(n);
    this.pos += n;
  }

  /**
   * Seek to an absolute byte position.
   * @throws RangeError if position is out of bounds
   */
  seek(pos: number): void {
    if (pos < 0 || pos > this.byteLen) {
      throw new RangeError(
        `Seek position ${pos} out of bounds [0, ${this.byteLen}]`
      );
    }
    this.pos = pos;
  }

  /**
   * Bounds check: ensure n bytes can be read from current position.
   * @throws RangeError with position context
   */
  private checkBounds(n: number): void {
    if (this.pos + n > this.byteLen) {
      throw new RangeError(
        `Read of ${n} byte(s) at position ${this.pos} exceeds buffer length ${this.byteLen}`
      );
    }
  }
}
