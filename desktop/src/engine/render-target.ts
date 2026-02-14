/**
 * Offscreen render target backed by a framebuffer + texture pair.
 *
 * Used for multi-pass CRT rendering: each pass renders to a
 * RenderTarget, then the next pass samples the texture.
 */
export class RenderTarget {
  private readonly gl: WebGL2RenderingContext;
  private framebuffer: WebGLFramebuffer;
  private texture: WebGLTexture;
  private w: number;
  private h: number;

  constructor(gl: WebGL2RenderingContext, width: number, height: number) {
    this.gl = gl;
    this.w = width;
    this.h = height;

    const { tex, fb } = this.createResources(gl, width, height);
    this.texture = tex;
    this.framebuffer = fb;
  }

  private createResources(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
  ): { tex: WebGLTexture; fb: WebGLFramebuffer } {
    // Create immutable texture
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Create framebuffer and attach texture
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    );

    // Unbind to prevent accidental writes
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return { tex, fb };
  }

  /** Get the texture for use as a sampler input in the next pass. */
  get colorTexture(): WebGLTexture {
    return this.texture;
  }

  /** Get current width. */
  get width(): number {
    return this.w;
  }

  /** Get current height. */
  get height(): number {
    return this.h;
  }

  /** Bind this render target for drawing and set viewport. */
  bind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.viewport(0, 0, this.w, this.h);
  }

  /** Resize the render target, recreating GPU resources if dimensions changed. */
  resize(width: number, height: number): void {
    if (width === this.w && height === this.h) return;

    this.destroy();

    const { tex, fb } = this.createResources(this.gl, width, height);
    this.texture = tex;
    this.framebuffer = fb;
    this.w = width;
    this.h = height;
  }

  /** Release all GPU resources. */
  destroy(): void {
    this.gl.deleteFramebuffer(this.framebuffer);
    this.gl.deleteTexture(this.texture);
  }
}
