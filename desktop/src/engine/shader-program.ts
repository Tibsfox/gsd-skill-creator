/**
 * Typed wrapper around a WebGL2 shader program.
 *
 * Handles vertex + fragment shader compilation, program linking,
 * uniform setters, and cleanup.
 */
export class ShaderProgram {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;

  constructor(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
    this.gl = gl;

    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) ?? '';
      gl.deleteProgram(program);
      throw new Error('Program linking failed: ' + info);
    }

    this.program = program;
  }

  private compileShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
  ): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) ?? '';
      gl.deleteShader(shader);
      throw new Error('Shader compilation failed: ' + info);
    }

    return shader;
  }

  /** Bind this program for rendering. */
  use(): void {
    this.gl.useProgram(this.program);
  }

  /** Set a float uniform. */
  setUniform1f(name: string, value: number): void {
    this.gl.uniform1f(this.gl.getUniformLocation(this.program, name), value);
  }

  /** Set a vec2 uniform. */
  setUniform2f(name: string, x: number, y: number): void {
    this.gl.uniform2f(this.gl.getUniformLocation(this.program, name), x, y);
  }

  /** Set an integer uniform (e.g. sampler2D texture unit). */
  setUniform1i(name: string, value: number): void {
    this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), value);
  }

  /** Release GPU resources. */
  destroy(): void {
    this.gl.deleteProgram(this.program);
  }
}
