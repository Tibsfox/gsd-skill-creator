import { describe, it, expect, vi } from 'vitest';
import { FullscreenQuad } from './fullscreen-quad';

function createMockGL() {
  const mockVAO = { __type: 'vao' };
  const mockBuffer = { __type: 'buffer' };

  const gl = {
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    TRIANGLES: 4,

    createVertexArray: vi.fn(() => mockVAO),
    bindVertexArray: vi.fn(),
    deleteVertexArray: vi.fn(),
    createBuffer: vi.fn(() => mockBuffer),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    drawArrays: vi.fn(),
    deleteBuffer: vi.fn(),
  } as unknown as WebGL2RenderingContext;

  return { gl, mockVAO, mockBuffer };
}

describe('FullscreenQuad', () => {
  it('constructor creates VAO, buffer, and sets up vertex attrib', () => {
    const { gl, mockVAO, mockBuffer } = createMockGL();

    const quad = new FullscreenQuad(gl);

    // Creates VAO and binds it
    expect(gl.createVertexArray).toHaveBeenCalledTimes(1);
    expect(gl.bindVertexArray).toHaveBeenCalledWith(mockVAO);

    // Creates buffer with 12 floats (6 vertices * 2 components)
    expect(gl.createBuffer).toHaveBeenCalledTimes(1);
    expect(gl.bindBuffer).toHaveBeenCalledWith(gl.ARRAY_BUFFER, mockBuffer);
    expect(gl.bufferData).toHaveBeenCalledTimes(1);

    // Verify the buffer data: 12 floats for 2 triangles covering clip space
    const bufferDataCall = (gl.bufferData as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(bufferDataCall[0]).toBe(gl.ARRAY_BUFFER);
    const data = bufferDataCall[1] as Float32Array;
    expect(data).toBeInstanceOf(Float32Array);
    expect(data.length).toBe(12);

    // Vertex attrib pointer at location 0, 2 components, FLOAT
    expect(gl.enableVertexAttribArray).toHaveBeenCalledWith(0);
    expect(gl.vertexAttribPointer).toHaveBeenCalledWith(0, 2, gl.FLOAT, false, 0, 0);

    // Unbinds VAO after setup
    expect(gl.bindVertexArray).toHaveBeenLastCalledWith(null);
  });

  it('draw() binds VAO then calls drawArrays with TRIANGLES', () => {
    const { gl, mockVAO } = createMockGL();
    const quad = new FullscreenQuad(gl);

    // Reset call tracking after construction
    (gl.bindVertexArray as ReturnType<typeof vi.fn>).mockClear();
    (gl.drawArrays as ReturnType<typeof vi.fn>).mockClear();

    quad.draw(gl);

    expect(gl.bindVertexArray).toHaveBeenCalledWith(mockVAO);
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, 6);
  });

  it('destroy() deletes VAO and buffer', () => {
    const { gl, mockVAO, mockBuffer } = createMockGL();
    const quad = new FullscreenQuad(gl);

    quad.destroy(gl);

    expect(gl.deleteVertexArray).toHaveBeenCalledWith(mockVAO);
    expect(gl.deleteBuffer).toHaveBeenCalledWith(mockBuffer);
  });
});
