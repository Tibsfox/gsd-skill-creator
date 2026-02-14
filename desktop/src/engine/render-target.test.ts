import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RenderTarget } from './render-target';

function createMockGL() {
  let textureCount = 0;
  let framebufferCount = 0;

  const gl = {
    TEXTURE_2D: 3553,
    RGBA8: 0x8058,
    LINEAR: 9729,
    CLAMP_TO_EDGE: 33071,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    FRAMEBUFFER: 36160,
    COLOR_ATTACHMENT0: 36064,

    createTexture: vi.fn(() => ({ __id: ++textureCount })),
    bindTexture: vi.fn(),
    texStorage2D: vi.fn(),
    texParameteri: vi.fn(),
    deleteTexture: vi.fn(),

    createFramebuffer: vi.fn(() => ({ __id: ++framebufferCount })),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    deleteFramebuffer: vi.fn(),

    viewport: vi.fn(),
  } as unknown as WebGL2RenderingContext;

  return { gl };
}

describe('RenderTarget', () => {
  let gl: WebGL2RenderingContext;

  beforeEach(() => {
    ({ gl } = createMockGL());
  });

  it('constructor creates texture with texStorage2D and framebuffer', () => {
    const rt = new RenderTarget(gl, 1920, 1080);

    // Texture creation
    expect(gl.createTexture).toHaveBeenCalledTimes(1);
    expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, expect.anything());
    expect(gl.texStorage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 1, gl.RGBA8, 1920, 1080);

    // Filtering: LINEAR, wrap: CLAMP_TO_EDGE
    expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Framebuffer creation + texture attachment
    expect(gl.createFramebuffer).toHaveBeenCalledTimes(1);
    expect(gl.bindFramebuffer).toHaveBeenCalledWith(gl.FRAMEBUFFER, expect.anything());
    expect(gl.framebufferTexture2D).toHaveBeenCalledWith(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      expect.anything(),
      0
    );

    // Unbinds both after construction
    expect(gl.bindTexture).toHaveBeenLastCalledWith(gl.TEXTURE_2D, null);
    expect(gl.bindFramebuffer).toHaveBeenLastCalledWith(gl.FRAMEBUFFER, null);
  });

  it('bind() binds framebuffer and sets viewport', () => {
    const rt = new RenderTarget(gl, 800, 600);

    (gl.bindFramebuffer as ReturnType<typeof vi.fn>).mockClear();
    (gl.viewport as ReturnType<typeof vi.fn>).mockClear();

    rt.bind();

    expect(gl.bindFramebuffer).toHaveBeenCalledWith(gl.FRAMEBUFFER, expect.anything());
    expect(gl.viewport).toHaveBeenCalledWith(0, 0, 800, 600);
  });

  it('resize() skips if same dimensions', () => {
    const rt = new RenderTarget(gl, 800, 600);

    (gl.deleteFramebuffer as ReturnType<typeof vi.fn>).mockClear();
    (gl.deleteTexture as ReturnType<typeof vi.fn>).mockClear();
    (gl.createTexture as ReturnType<typeof vi.fn>).mockClear();
    (gl.createFramebuffer as ReturnType<typeof vi.fn>).mockClear();

    rt.resize(800, 600);

    // Nothing should be recreated
    expect(gl.deleteFramebuffer).not.toHaveBeenCalled();
    expect(gl.deleteTexture).not.toHaveBeenCalled();
    expect(gl.createTexture).not.toHaveBeenCalled();
    expect(gl.createFramebuffer).not.toHaveBeenCalled();
  });

  it('resize() recreates resources at new dimensions', () => {
    const rt = new RenderTarget(gl, 800, 600);

    (gl.deleteFramebuffer as ReturnType<typeof vi.fn>).mockClear();
    (gl.deleteTexture as ReturnType<typeof vi.fn>).mockClear();
    (gl.createTexture as ReturnType<typeof vi.fn>).mockClear();
    (gl.createFramebuffer as ReturnType<typeof vi.fn>).mockClear();
    (gl.texStorage2D as ReturnType<typeof vi.fn>).mockClear();

    rt.resize(1920, 1080);

    // Old resources deleted
    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1);

    // New resources created at new dimensions
    expect(gl.createTexture).toHaveBeenCalledTimes(1);
    expect(gl.createFramebuffer).toHaveBeenCalledTimes(1);
    expect(gl.texStorage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 1, gl.RGBA8, 1920, 1080);
  });

  it('destroy() deletes framebuffer and texture', () => {
    const rt = new RenderTarget(gl, 800, 600);

    (gl.deleteFramebuffer as ReturnType<typeof vi.fn>).mockClear();
    (gl.deleteTexture as ReturnType<typeof vi.fn>).mockClear();

    rt.destroy();

    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
  });
});
