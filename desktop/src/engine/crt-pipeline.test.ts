import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CRTPipeline } from './crt-pipeline';
import type { CRTConfig } from './crt-config';
import { CRT_DEFAULTS } from './crt-config';

/**
 * Create a minimal WebGL2RenderingContext mock with all methods
 * used by CRTPipeline and its dependencies.
 */
function createMockGL() {
  const gl = {
    FRAMEBUFFER: 0x8d40,
    TEXTURE_2D: 0x0de1,
    TEXTURE0: 0x84c0,
    COLOR_BUFFER_BIT: 0x4000,
    TRIANGLES: 0x0004,
    RGBA8: 0x8058,
    LINEAR: 0x2601,
    CLAMP_TO_EDGE: 0x812f,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    COLOR_ATTACHMENT0: 0x8ce0,
    bindFramebuffer: vi.fn(),
    viewport: vi.fn(),
    activeTexture: vi.fn(),
    bindTexture: vi.fn(),
    useProgram: vi.fn(),
    drawArrays: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform1i: vi.fn(),
    getUniformLocation: vi.fn((_prog: unknown, name: string) => name),
    clear: vi.fn(),
    clearColor: vi.fn(),
    createTexture: vi.fn(() => ({})),
    createFramebuffer: vi.fn(() => ({})),
    bindVertexArray: vi.fn(),
    texStorage2D: vi.fn(),
    texParameteri: vi.fn(),
    framebufferTexture2D: vi.fn(),
    deleteFramebuffer: vi.fn(),
    deleteTexture: vi.fn(),
  } as unknown as WebGL2RenderingContext;
  return gl;
}

/** Minimal mock for ShaderProgram. */
function createMockShaderProgram() {
  return {
    use: vi.fn(),
    setUniform1f: vi.fn(),
    setUniform2f: vi.fn(),
    setUniform1i: vi.fn(),
    destroy: vi.fn(),
  };
}

/** Minimal mock for FullscreenQuad. */
function createMockQuad() {
  return {
    draw: vi.fn(),
    destroy: vi.fn(),
  };
}

describe('CRTPipeline', () => {
  let gl: WebGL2RenderingContext;
  let distortProgram: ReturnType<typeof createMockShaderProgram>;
  let postProgram: ReturnType<typeof createMockShaderProgram>;
  let quad: ReturnType<typeof createMockQuad>;

  beforeEach(() => {
    gl = createMockGL();
    distortProgram = createMockShaderProgram();
    postProgram = createMockShaderProgram();
    quad = createMockQuad();
  });

  it('creates two RenderTarget instances internally', () => {
    // createTexture + createFramebuffer are called twice each (one per RenderTarget)
    const pipeline = new CRTPipeline(
      gl,
      quad as any,
      distortProgram as any,
      postProgram as any,
      800,
      600,
    );
    expect(pipeline).toBeDefined();
    // Two render targets = 2 calls to createTexture and 2 calls to createFramebuffer
    expect(gl.createTexture).toHaveBeenCalledTimes(2);
    expect(gl.createFramebuffer).toHaveBeenCalledTimes(2);
  });

  it('render() does nothing when config.enabled is false', () => {
    const pipeline = new CRTPipeline(
      gl,
      quad as any,
      distortProgram as any,
      postProgram as any,
      800,
      600,
    );
    const config: CRTConfig = { ...CRT_DEFAULTS, enabled: false };

    pipeline.render(config);

    // No draw calls when disabled
    expect(quad.draw).not.toHaveBeenCalled();
    expect(distortProgram.use).not.toHaveBeenCalled();
    expect(postProgram.use).not.toHaveBeenCalled();
  });

  it('render() executes 2 passes when enabled', () => {
    const pipeline = new CRTPipeline(
      gl,
      quad as any,
      distortProgram as any,
      postProgram as any,
      800,
      600,
    );
    const config: CRTConfig = { ...CRT_DEFAULTS };

    pipeline.render(config);

    // Pass 1: distort shader used and quad drawn
    expect(distortProgram.use).toHaveBeenCalledTimes(1);
    // Pass 2: post shader used and quad drawn
    expect(postProgram.use).toHaveBeenCalledTimes(1);
    // Two draws total (one per pass)
    expect(quad.draw).toHaveBeenCalledTimes(2);
  });

  it('render() pass 1 sets distortion uniforms', () => {
    const pipeline = new CRTPipeline(
      gl,
      quad as any,
      distortProgram as any,
      postProgram as any,
      800,
      600,
    );
    const config: CRTConfig = {
      enabled: true,
      scanlineIntensity: 0.6,
      barrelDistortion: 0.15,
      phosphorGlow: 0.4,
      chromaticAberration: 2.0,
      vignette: 0.5,
    };

    pipeline.render(config);

    expect(distortProgram.setUniform2f).toHaveBeenCalledWith('u_resolution', 800, 600);
    expect(distortProgram.setUniform1f).toHaveBeenCalledWith('u_barrelDistortion', 0.15);
    expect(distortProgram.setUniform1f).toHaveBeenCalledWith('u_chromaticAberration', 2.0);
    expect(distortProgram.setUniform1f).toHaveBeenCalledWith('u_vignette', 0.5);
  });

  it('render() pass 2 binds screen framebuffer and sets post uniforms', () => {
    const pipeline = new CRTPipeline(
      gl,
      quad as any,
      distortProgram as any,
      postProgram as any,
      800,
      600,
    );
    const config: CRTConfig = {
      enabled: true,
      scanlineIntensity: 0.6,
      barrelDistortion: 0.15,
      phosphorGlow: 0.4,
      chromaticAberration: 2.0,
      vignette: 0.5,
    };

    pipeline.render(config);

    // Pass 2: bind null framebuffer (screen)
    expect(gl.bindFramebuffer).toHaveBeenCalledWith(gl.FRAMEBUFFER, null);
    // Pass 2: bind texture from target[0] to TEXTURE0
    expect(gl.activeTexture).toHaveBeenCalledWith(gl.TEXTURE0);

    // Post uniforms
    expect(postProgram.setUniform1i).toHaveBeenCalledWith('u_source', 0);
    expect(postProgram.setUniform2f).toHaveBeenCalledWith('u_resolution', 800, 600);
    expect(postProgram.setUniform1f).toHaveBeenCalledWith('u_scanlineIntensity', 0.6);
    expect(postProgram.setUniform1f).toHaveBeenCalledWith('u_phosphorGlow', 0.4);
  });

  it('render() still sets uniforms to 0 when individual effects have intensity 0', () => {
    const pipeline = new CRTPipeline(
      gl,
      quad as any,
      distortProgram as any,
      postProgram as any,
      800,
      600,
    );
    const config: CRTConfig = {
      enabled: true,
      scanlineIntensity: 0,
      barrelDistortion: 0,
      phosphorGlow: 0,
      chromaticAberration: 0,
      vignette: 0,
    };

    pipeline.render(config);

    // Uniforms are still set (shader handles zero values)
    expect(distortProgram.setUniform1f).toHaveBeenCalledWith('u_barrelDistortion', 0);
    expect(distortProgram.setUniform1f).toHaveBeenCalledWith('u_chromaticAberration', 0);
    expect(distortProgram.setUniform1f).toHaveBeenCalledWith('u_vignette', 0);
    expect(postProgram.setUniform1f).toHaveBeenCalledWith('u_scanlineIntensity', 0);
    expect(postProgram.setUniform1f).toHaveBeenCalledWith('u_phosphorGlow', 0);
    // Both passes still execute
    expect(quad.draw).toHaveBeenCalledTimes(2);
  });

  it('resize() resizes both render targets', () => {
    const pipeline = new CRTPipeline(
      gl,
      quad as any,
      distortProgram as any,
      postProgram as any,
      800,
      600,
    );

    // Reset mocks after construction
    vi.mocked(gl.createTexture).mockClear();
    vi.mocked(gl.createFramebuffer).mockClear();
    vi.mocked(gl.deleteTexture).mockClear();
    vi.mocked(gl.deleteFramebuffer).mockClear();

    pipeline.resize(1024, 768);

    // Both targets recreated: 2 new textures + 2 new framebuffers
    expect(gl.createTexture).toHaveBeenCalledTimes(2);
    expect(gl.createFramebuffer).toHaveBeenCalledTimes(2);
    // Old resources destroyed: 2 deleted textures + 2 deleted framebuffers
    expect(gl.deleteTexture).toHaveBeenCalledTimes(2);
    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(2);
  });

  it('destroy() destroys both render targets', () => {
    const pipeline = new CRTPipeline(
      gl,
      quad as any,
      distortProgram as any,
      postProgram as any,
      800,
      600,
    );

    vi.mocked(gl.deleteTexture).mockClear();
    vi.mocked(gl.deleteFramebuffer).mockClear();

    pipeline.destroy();

    expect(gl.deleteTexture).toHaveBeenCalledTimes(2);
    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(2);
  });
});
