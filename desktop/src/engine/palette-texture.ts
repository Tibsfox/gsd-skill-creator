/**
 * GPU-side palette texture for indexed color lookup.
 *
 * Manages a 32x1 RGBA texture that shaders sample to map palette
 * indices to colors. Uses texImage2D (not texStorage2D) for mutable
 * re-upload via texSubImage2D during runtime palette swaps.
 * NEAREST filtering prevents interpolation between palette entries.
 */
import { paletteToUint8 } from './palette';

export class PaletteTexture {
  private readonly gl: WebGL2RenderingContext;
  private readonly texture: WebGLTexture;

  constructor(gl: WebGL2RenderingContext, colors: string[]) {
    this.gl = gl;
    this.texture = gl.createTexture()!;

    // Use texImage2D (not texStorage2D) so we can re-upload via texSubImage2D
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    const data = paletteToUint8(colors);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

    // NEAREST filtering: palette indices must NOT interpolate
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /** Re-upload palette colors to existing texture. */
  update(colors: string[]): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    const data = paletteToUint8(colors);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 32, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /** Bind this palette texture to a texture unit (default unit 1). */
  bind(unit = 1): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  /** Release GPU resources. */
  destroy(): void {
    this.gl.deleteTexture(this.texture);
  }
}
