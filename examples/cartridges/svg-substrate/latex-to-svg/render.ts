/**
 * Render a LaTeX equation as native SVG via MathJax v3+ (runtime route).
 * See latex-to-svg/README.md for usage and the source mission Doc 02 for full
 * provenance.
 *
 * Lazy-initialises a single MathJax instance per process; subsequent calls
 * re-use it. Output is the SVG markup as a string; the SVG carries glyphs in
 * <defs> with <use> instances per Doc 02 section 6.
 *
 * Usage:
 *   import { renderToSvg } from './render.ts';
 *   const svg = await renderToSvg('E = mc^2');
 */

let mjxPromise: Promise<{ tex2svg: (input: string) => string }> | null = null;

async function loadMathJax() {
  if (mjxPromise) return mjxPromise;
  mjxPromise = (async () => {
    // Dynamic imports keep this file static-checkable even when mathjax-full
    // is not installed in every consumer's environment.
    const { mathjax } = await import("mathjax-full/js/mathjax.js");
    const { TeX } = await import("mathjax-full/js/input/tex.js");
    const { SVG } = await import("mathjax-full/js/output/svg.js");
    const { liteAdaptor } = await import("mathjax-full/js/adaptors/liteAdaptor.js");
    const { RegisterHTMLHandler } = await import("mathjax-full/js/handlers/html.js");
    const { AllPackages } = await import("mathjax-full/js/input/tex/AllPackages.js");

    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    const tex = new TeX({ packages: AllPackages });
    const svg = new SVG({ fontCache: "local" });
    const html = mathjax.document("", { InputJax: tex, OutputJax: svg });

    return {
      tex2svg(input: string) {
        const node = html.convert(input, { display: true });
        return adaptor.outerHTML(node);
      },
    };
  })();
  return mjxPromise;
}

export async function renderToSvg(latex: string): Promise<string> {
  const m = await loadMathJax();
  return m.tex2svg(latex);
}

export const mathjax = { renderToSvg };
