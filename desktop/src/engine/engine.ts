/**
 * Top-level WebGL CRT engine.
 *
 * Manages the full lifecycle: context creation, shader compilation,
 * render loop (requestAnimationFrame), runtime config updates, resize
 * handling, and graceful cleanup. Falls back to CSS-only CRT when
 * WebGL2 is unavailable.
 */

import { createGLContext, attachContextLossHandlers, resizeCanvas } from './context';
import { ShaderProgram } from './shader-program';
import { FullscreenQuad } from './fullscreen-quad';
import { CRTPipeline } from './crt-pipeline';
import { RenderTarget } from './render-target';
import { PaletteTexture } from './palette-texture';
import { getPaletteColors, type PalettePreset } from './palette';
import { type CopperEntry, type CopperProgram, COPPER_PRESETS, copperListToTexture } from './copper-list';
import { type CRTConfig, CRT_DEFAULTS, mergeCRTConfig } from './crt-config';
import { FrameTimeMeasurer } from './performance';
import { applyCSSFallback, removeCSSFallback } from './css-fallback';

import quadVert from './shaders/quad.vert';
import crtDistortFrag from './shaders/crt-distort.frag';
import crtPostFrag from './shaders/crt-post.frag';
import paletteBgFrag from './shaders/palette-bg.frag';

export type EngineMode = 'webgl2' | 'css-fallback';

export class Engine {
  private readonly _mode: EngineMode;
  private readonly container: HTMLElement;
  private readonly gl: WebGL2RenderingContext | null;
  private readonly canvas: HTMLCanvasElement | null;
  private readonly pipeline: CRTPipeline | null;
  private readonly quad: FullscreenQuad | null;
  private readonly distortProgram: ShaderProgram | null;
  private readonly postProgram: ShaderProgram | null;
  private readonly paletteTexture: PaletteTexture | null;
  private readonly paletteProgram: ShaderProgram | null;
  private readonly sceneTarget: RenderTarget | null;
  private readonly measurer: FrameTimeMeasurer;
  private config: CRTConfig;
  private currentPreset: PalettePreset;
  private copperTexture: WebGLTexture | null;
  private currentCopperProgram: string;
  private readonly copperHeight: number;
  private animationFrameId: number | null = null;
  private resizeHandler: (() => void) | null = null;

  private constructor(
    mode: EngineMode,
    container: HTMLElement,
    gl: WebGL2RenderingContext | null,
    canvas: HTMLCanvasElement | null,
    pipeline: CRTPipeline | null,
    quad: FullscreenQuad | null,
    distortProgram: ShaderProgram | null,
    postProgram: ShaderProgram | null,
    paletteTexture: PaletteTexture | null = null,
    paletteProgram: ShaderProgram | null = null,
    sceneTarget: RenderTarget | null = null,
    copperTexture: WebGLTexture | null = null,
  ) {
    this._mode = mode;
    this.container = container;
    this.gl = gl;
    this.canvas = canvas;
    this.pipeline = pipeline;
    this.quad = quad;
    this.distortProgram = distortProgram;
    this.postProgram = postProgram;
    this.paletteTexture = paletteTexture;
    this.paletteProgram = paletteProgram;
    this.sceneTarget = sceneTarget;
    this.copperTexture = copperTexture;
    this.measurer = new FrameTimeMeasurer();
    this.config = { ...CRT_DEFAULTS };
    this.currentPreset = 'amiga-3.1';
    this.currentCopperProgram = 'gradient';
    this.copperHeight = 256;
  }

  /**
   * Create an Engine instance.
   * Attempts WebGL2 first; falls back to CSS-only CRT if unavailable.
   */
  static create(container: HTMLElement): Engine {
    const result = createGLContext(container);

    if (result.type === 'webgl2') {
      const { gl, canvas } = result;

      // Compile shaders
      const distortProgram = new ShaderProgram(gl, quadVert, crtDistortFrag);
      const postProgram = new ShaderProgram(gl, quadVert, crtPostFrag);

      // Create geometry
      const quad = new FullscreenQuad(gl);

      // Initial size
      resizeCanvas(canvas, gl);
      const w = canvas.width;
      const h = canvas.height;

      // Create palette texture with default preset
      const paletteTexture = new PaletteTexture(gl, getPaletteColors('amiga-3.1'));

      // Compile palette background shader
      const paletteProgram = new ShaderProgram(gl, quadVert, paletteBgFrag);

      // Scene render target: palette background renders here, CRT reads from it
      const sceneTarget = new RenderTarget(gl, w, h);

      // Create copper list texture (Nx1 RGBA, per-scanline color parameters)
      const copperHeight = 256;
      const copperTexture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, copperTexture);
      const copperData = copperListToTexture(COPPER_PRESETS['gradient'], copperHeight);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, copperHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, copperData);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);

      // Create pipeline
      const pipeline = new CRTPipeline(gl, quad, distortProgram, postProgram, w, h);

      // Clear with transparent black
      gl.clearColor(0, 0, 0, 0);

      const engine = new Engine(
        'webgl2',
        container,
        gl,
        canvas,
        pipeline,
        quad,
        distortProgram,
        postProgram,
        paletteTexture,
        paletteProgram,
        sceneTarget,
        copperTexture,
      );

      // Context loss/restore handlers
      attachContextLossHandlers(
        canvas,
        () => {
          engine.stop();
          applyCSSFallback(container);
        },
        () => {
          removeCSSFallback(container);
          // Full re-init would be needed here; for now just restart the loop
          engine.start();
        },
      );

      // Debounced resize listener
      let resizeTimer: ReturnType<typeof setTimeout> | null = null;
      const onResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resizeCanvas(canvas, gl);
          const newW = canvas.width;
          const newH = canvas.height;
          pipeline.resize(newW, newH);
          sceneTarget.resize(newW, newH);
        }, 100);
      };
      window.addEventListener('resize', onResize);
      engine.resizeHandler = onResize;

      return engine;
    }

    // CSS fallback path
    applyCSSFallback(container);
    return new Engine('css-fallback', container, null, null, null, null, null, null);
  }

  /** Current rendering mode. */
  get mode(): EngineMode {
    return this._mode;
  }

  /** Merge partial config into current config. */
  updateConfig(partial: Partial<CRTConfig>): void {
    this.config = mergeCRTConfig({ ...this.config, ...partial });
  }

  /** Return a copy of the current CRT config. */
  getConfig(): CRTConfig {
    return { ...this.config };
  }

  /** Return current performance metrics. */
  getPerformance(): { averageMs: number; maxMs: number; withinBudget: boolean } {
    return {
      averageMs: this.measurer.averageMs,
      maxMs: this.measurer.maxMs,
      withinBudget: this.measurer.withinBudget,
    };
  }

  /** Get the current palette preset name. */
  getPalette(): PalettePreset {
    return this.currentPreset;
  }

  /** Switch to a named palette preset. */
  setPalette(preset: PalettePreset): void {
    if (!this.paletteTexture) return;
    const colors = getPaletteColors(preset);
    this.paletteTexture.update(colors);
    this.currentPreset = preset;
  }

  /** Set a custom 32-color palette from exact hex strings. */
  setPaletteColors(colors: string[]): void {
    if (!this.paletteTexture) return;
    if (colors.length !== 32) {
      throw new Error(`setPaletteColors requires exactly 32 colors, got ${colors.length}`);
    }
    this.paletteTexture.update(colors);
    this.currentPreset = 'custom';
  }

  /** Get the current copper program name. */
  getCopperProgram(): string {
    return this.currentCopperProgram;
  }

  /** Switch to a named copper preset program. */
  setCopperProgram(name: string): void {
    if (!this.gl || !this.copperTexture) return;
    const preset = COPPER_PRESETS[name];
    if (!preset) return;
    const data = copperListToTexture(preset, this.copperHeight);
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.copperTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1, this.copperHeight, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.currentCopperProgram = name;
  }

  /** Set a custom copper list from explicit entries. */
  setCopperEntries(entries: CopperEntry[]): void {
    if (!this.gl || !this.copperTexture) return;
    const program: CopperProgram = { name: 'custom', entries };
    const data = copperListToTexture(program, this.copperHeight);
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.copperTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 1, this.copperHeight, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.currentCopperProgram = 'custom';
  }

  /** Start the requestAnimationFrame render loop. */
  start(): void {
    if (this._mode !== 'webgl2' || !this.gl || !this.pipeline) return;

    const gl = this.gl;
    const pipeline = this.pipeline;
    const sceneTarget = this.sceneTarget;
    const paletteProgram = this.paletteProgram;
    const paletteTexture = this.paletteTexture;
    const quad = this.quad;

    const frame = () => {
      this.measurer.measure(() => {
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Render palette background to scene target
        if (sceneTarget && paletteProgram && paletteTexture && quad) {
          sceneTarget.bind();
          gl.clear(gl.COLOR_BUFFER_BIT);
          paletteProgram.use();
          paletteTexture.bind(1);
          paletteProgram.setUniform1i('u_palette', 1);

          // Bind copper list texture to unit 2
          if (this.copperTexture) {
            gl.activeTexture(gl.TEXTURE0 + 2);
            gl.bindTexture(gl.TEXTURE_2D, this.copperTexture);
            paletteProgram.setUniform1i('u_copperList', 2);
            paletteProgram.setUniform1f('u_copperHeight', this.copperHeight);
          }

          paletteProgram.setUniform1f('u_time', performance.now() / 1000);
          paletteProgram.setUniform2f('u_resolution', sceneTarget.width, sceneTarget.height);
          quad.draw(gl);

          // CRT pipeline reads from scene target texture
          pipeline.render(this.config, sceneTarget.colorTexture);
        } else {
          pipeline.render(this.config);
        }
      });
      this.animationFrameId = requestAnimationFrame(frame);
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }

  /** Stop the render loop. */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Stop loop, destroy GPU resources, remove DOM elements. */
  destroy(): void {
    this.stop();

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this._mode === 'webgl2') {
      this.pipeline?.destroy();
      this.quad?.destroy(this.gl!);
      this.distortProgram?.destroy();
      this.postProgram?.destroy();
      this.paletteTexture?.destroy();
      this.paletteProgram?.destroy();
      this.sceneTarget?.destroy();
      if (this.copperTexture && this.gl) {
        this.gl.deleteTexture(this.copperTexture);
        this.copperTexture = null;
      }
      this.canvas?.remove();
    } else {
      removeCSSFallback(this.container);
    }
  }
}
