import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaletteTexture } from './palette-texture';

/**
 * Create a mock WebGL2RenderingContext with methods used by PaletteTexture.
 */
function createMockGL() {
  const mockTexture = { __brand: 'WebGLTexture' };
  return {
    TEXTURE_2D: 0x0de1,
    TEXTURE0: 0x84c0,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    NEAREST: 0x2600,
    CLAMP_TO_EDGE: 0x812f,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    createTexture: vi.fn(() => mockTexture),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texSubImage2D: vi.fn(),
    texParameteri: vi.fn(),
    activeTexture: vi.fn(),
    deleteTexture: vi.fn(),
    mockTexture,
  } as unknown as WebGL2RenderingContext & { mockTexture: object };
}

/** Generate 32 placeholder hex colors for tests. */
function make32Colors(): string[] {
  const colors: string[] = [];
  for (let i = 0; i < 32; i++) {
    const hex = i.toString(16).padStart(2, '0');
    colors.push(`#${hex}${hex}${hex}`);
  }
  return colors;
}

describe('PaletteTexture', () => {
  let gl: ReturnType<typeof createMockGL>;
  let colors: string[];

  beforeEach(() => {
    gl = createMockGL();
    colors = make32Colors();
  });

  describe('constructor', () => {
    it('creates a WebGL texture via gl.createTexture()', () => {
      const pt = new PaletteTexture(gl as unknown as WebGL2RenderingContext, colors);

      expect(gl.createTexture).toHaveBeenCalledTimes(1);
    });

    it('binds to TEXTURE_2D and uploads 32x1 RGBA data via texImage2D', () => {
      const pt = new PaletteTexture(gl as unknown as WebGL2RenderingContext, colors);

      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.mockTexture);
      expect(gl.texImage2D).toHaveBeenCalledWith(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        32,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        expect.any(Uint8Array),
      );
    });

    it('sets NEAREST filtering and CLAMP_TO_EDGE wrapping', () => {
      const pt = new PaletteTexture(gl as unknown as WebGL2RenderingContext, colors);

      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });
  });

  describe('update', () => {
    it('re-uploads texture data via texSubImage2D when called with new colors', () => {
      const pt = new PaletteTexture(gl as unknown as WebGL2RenderingContext, colors);
      const newColors = make32Colors();

      pt.update(newColors);

      expect(gl.texSubImage2D).toHaveBeenCalledWith(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        32,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        expect.any(Uint8Array),
      );
    });

    it('passes a Uint8Array of 128 bytes (32 * 4 RGBA) to texSubImage2D', () => {
      const pt = new PaletteTexture(gl as unknown as WebGL2RenderingContext, colors);

      pt.update(colors);

      const uploadedData = (gl.texSubImage2D as ReturnType<typeof vi.fn>).mock.calls[0][8] as Uint8Array;
      expect(uploadedData).toBeInstanceOf(Uint8Array);
      expect(uploadedData.length).toBe(128);
    });

    it('reuses the same texture object across multiple update calls', () => {
      const pt = new PaletteTexture(gl as unknown as WebGL2RenderingContext, colors);

      pt.update(colors);
      pt.update(colors);

      // createTexture should only be called once (in constructor)
      expect(gl.createTexture).toHaveBeenCalledTimes(1);
      // No deleteTexture calls during updates
      expect(gl.deleteTexture).not.toHaveBeenCalled();
    });
  });

  describe('bind', () => {
    it('calls activeTexture and bindTexture with the given unit', () => {
      const pt = new PaletteTexture(gl as unknown as WebGL2RenderingContext, colors);

      pt.bind(3);

      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0 + 3);
      expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.mockTexture);
    });

    it('defaults to texture unit 1', () => {
      const pt = new PaletteTexture(gl as unknown as WebGL2RenderingContext, colors);

      pt.bind();

      expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0 + 1);
    });
  });

  describe('destroy', () => {
    it('calls gl.deleteTexture with the created texture', () => {
      const pt = new PaletteTexture(gl as unknown as WebGL2RenderingContext, colors);

      pt.destroy();

      expect(gl.deleteTexture).toHaveBeenCalledWith(gl.mockTexture);
    });
  });
});
