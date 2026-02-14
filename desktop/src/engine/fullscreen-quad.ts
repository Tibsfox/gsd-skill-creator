/**
 * Fullscreen quad geometry for post-processing passes.
 *
 * Draws 2 triangles covering the full clip space (-1..1).
 * UV coordinates are derived in the vertex shader from position.
 */
export class FullscreenQuad {
  private readonly vao: WebGLVertexArrayObject;
  private readonly buffer: WebGLBuffer;

  constructor(gl: WebGL2RenderingContext) {
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    this.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    // Two triangles covering clip space: (-1,-1) to (1,1)
    const vertices = new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Vertex attrib at location 0: 2 float components per vertex
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Unbind VAO to prevent accidental mutation
    gl.bindVertexArray(null);
  }

  /** Bind VAO and issue the draw call. */
  draw(gl: WebGL2RenderingContext): void {
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /** Release GPU resources. */
  destroy(gl: WebGL2RenderingContext): void {
    gl.deleteVertexArray(this.vao);
    gl.deleteBuffer(this.buffer);
  }
}
