import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShaderProgram } from './shader-program';

/** Build a minimal WebGL2 mock with spy-able shader/program methods. */
function createMockGL() {
  const mockShader = {};
  const mockProgram = {};
  const mockLocation = {};

  const gl = {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,

    createShader: vi.fn(() => mockShader),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),

    createProgram: vi.fn(() => mockProgram),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),

    useProgram: vi.fn(),
    getUniformLocation: vi.fn(() => mockLocation),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform1i: vi.fn(),
  } as unknown as WebGL2RenderingContext;

  return { gl, mockShader, mockProgram, mockLocation };
}

describe('ShaderProgram', () => {
  let gl: WebGL2RenderingContext;
  let mockProgram: unknown;
  let mockLocation: unknown;

  beforeEach(() => {
    const mocks = createMockGL();
    gl = mocks.gl;
    mockProgram = mocks.mockProgram;
    mockLocation = mocks.mockLocation;
  });

  it('compiles vertex + fragment shaders and links program', () => {
    const sp = new ShaderProgram(gl, 'vert-src', 'frag-src');

    expect(gl.createShader).toHaveBeenCalledTimes(2);
    expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
    expect(gl.createShader).toHaveBeenCalledWith(gl.FRAGMENT_SHADER);
    expect(gl.shaderSource).toHaveBeenCalledTimes(2);
    expect(gl.compileShader).toHaveBeenCalledTimes(2);
    expect(gl.createProgram).toHaveBeenCalledTimes(1);
    expect(gl.attachShader).toHaveBeenCalledTimes(2);
    expect(gl.linkProgram).toHaveBeenCalledTimes(1);

    // Program created successfully -- no throw
    expect(sp).toBeTruthy();
  });

  it('throws when shader compilation fails', () => {
    (gl.getShaderParameter as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (gl.getShaderInfoLog as ReturnType<typeof vi.fn>).mockReturnValue('ERROR: bad syntax');

    expect(() => new ShaderProgram(gl, 'bad-vert', 'frag'))
      .toThrow('Shader compilation failed: ERROR: bad syntax');
  });

  it('throws when program linking fails', () => {
    (gl.getProgramParameter as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (gl.getProgramInfoLog as ReturnType<typeof vi.fn>).mockReturnValue('LINK ERROR');

    expect(() => new ShaderProgram(gl, 'vert', 'frag'))
      .toThrow('Program linking failed: LINK ERROR');
  });

  it('use() calls gl.useProgram', () => {
    const sp = new ShaderProgram(gl, 'vert', 'frag');
    sp.use();
    expect(gl.useProgram).toHaveBeenCalledWith(mockProgram);
  });

  it('setUniform1f calls getUniformLocation then uniform1f', () => {
    const sp = new ShaderProgram(gl, 'vert', 'frag');
    sp.setUniform1f('u_time', 1.5);
    expect(gl.getUniformLocation).toHaveBeenCalledWith(mockProgram, 'u_time');
    expect(gl.uniform1f).toHaveBeenCalledWith(mockLocation, 1.5);
  });

  it('setUniform2f calls getUniformLocation then uniform2f', () => {
    const sp = new ShaderProgram(gl, 'vert', 'frag');
    sp.setUniform2f('u_resolution', 1920, 1080);
    expect(gl.getUniformLocation).toHaveBeenCalledWith(mockProgram, 'u_resolution');
    expect(gl.uniform2f).toHaveBeenCalledWith(mockLocation, 1920, 1080);
  });

  it('setUniform1i calls getUniformLocation then uniform1i', () => {
    const sp = new ShaderProgram(gl, 'vert', 'frag');
    sp.setUniform1i('u_texture', 0);
    expect(gl.getUniformLocation).toHaveBeenCalledWith(mockProgram, 'u_texture');
    expect(gl.uniform1i).toHaveBeenCalledWith(mockLocation, 0);
  });

  it('destroy() calls gl.deleteProgram', () => {
    const sp = new ShaderProgram(gl, 'vert', 'frag');
    sp.destroy();
    expect(gl.deleteProgram).toHaveBeenCalledWith(mockProgram);
  });
});
