/**
 * CRT pipeline orchestrator for 2-pass post-processing.
 *
 * Pass 1 (distort): barrel distortion + chromatic aberration + vignette
 * Pass 2 (post): scanlines + phosphor glow
 *
 * Both passes run unconditionally when enabled; per-effect intensity of 0
 * is handled by the shader (no CPU-side branching).
 */

import { RenderTarget } from './render-target';
import type { FullscreenQuad } from './fullscreen-quad';
import type { ShaderProgram } from './shader-program';
import type { CRTConfig } from './crt-config';

export class CRTPipeline {
  private readonly gl: WebGL2RenderingContext;
  private readonly quad: FullscreenQuad;
  private readonly distortProgram: ShaderProgram;
  private readonly postProgram: ShaderProgram;
  private readonly targets: [RenderTarget, RenderTarget];
  private width: number;
  private height: number;

  constructor(
    gl: WebGL2RenderingContext,
    quad: FullscreenQuad,
    distortProgram: ShaderProgram,
    postProgram: ShaderProgram,
    width: number,
    height: number,
  ) {
    this.gl = gl;
    this.quad = quad;
    this.distortProgram = distortProgram;
    this.postProgram = postProgram;
    this.width = width;
    this.height = height;

    this.targets = [
      new RenderTarget(gl, width, height),
      new RenderTarget(gl, width, height),
    ];
  }

  /**
   * Render the 2-pass CRT effect chain.
   * When config.enabled is false, returns immediately (no GPU work).
   *
   * @param config - CRT effect configuration
   * @param sourceTexture - Optional source texture for pass 1 input
   *                        (e.g. palette background render target).
   *                        When provided, binds to TEXTURE0 as u_source.
   */
  render(config: CRTConfig, sourceTexture?: WebGLTexture): void {
    if (!config.enabled) return;

    const { gl, quad, distortProgram, postProgram, targets, width, height } = this;

    // --- Pass 1: distortion (barrel + chromatic aberration + vignette) ---
    targets[0].bind();
    distortProgram.use();

    // Bind explicit source texture if provided (e.g. scene render target)
    if (sourceTexture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
      distortProgram.setUniform1i('u_source', 0);
    }

    distortProgram.setUniform2f('u_resolution', width, height);
    distortProgram.setUniform1f('u_barrelDistortion', config.barrelDistortion);
    distortProgram.setUniform1f('u_chromaticAberration', config.chromaticAberration);
    distortProgram.setUniform1f('u_vignette', config.vignette);
    quad.draw(gl);

    // --- Pass 2: post-processing (scanlines + phosphor glow) ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    postProgram.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets[0].colorTexture);
    postProgram.setUniform1i('u_source', 0);
    postProgram.setUniform2f('u_resolution', width, height);
    postProgram.setUniform1f('u_scanlineIntensity', config.scanlineIntensity);
    postProgram.setUniform1f('u_phosphorGlow', config.phosphorGlow);
    quad.draw(gl);
  }

  /** Resize both render targets to new dimensions. */
  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.targets[0].resize(w, h);
    this.targets[1].resize(w, h);
  }

  /** Release GPU resources for both render targets. */
  destroy(): void {
    this.targets[0].destroy();
    this.targets[1].destroy();
  }
}
