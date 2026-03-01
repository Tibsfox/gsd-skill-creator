/**
 * Python panel -- readability as mathematical notation.
 *
 * Python code reads almost like the mathematical notation itself, making
 * it the natural first panel for concept exploration. Uses math.exp(),
 * numpy, and Python's clean syntax to make mathematical concepts
 * immediately accessible.
 *
 * @module panels/python-panel
 */

import { PanelInterface } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type { RosettaConcept, PanelExpression, PanelId } from '../rosetta-core/types.js';

// ─── Python Panel Implementation ────────────────────────────────────────────

/**
 * The Python panel produces code that reads like mathematical notation.
 *
 * Python's clean syntax, dynamic typing, and rich scientific ecosystem
 * (math, numpy, scipy) make it the natural first panel for exploring
 * mathematical concepts. The code IS readable math.
 */
export class PythonPanel extends PanelInterface {
  readonly panelId: PanelId = 'python';
  readonly name = 'Python Panel';
  readonly description = 'Readability and rapid prototyping. Python code reads almost like mathematical notation, making it the natural first panel for concept exploration.';

  /**
   * Translate a concept into readable Python code with math library bindings.
   */
  translate(concept: RosettaConcept): PanelExpression {
    const code = this.buildCode(concept);
    const explanation = this.buildExplanation(concept);
    const examples = this.buildExamples(concept);
    const pedagogicalNotes = this.buildPedagogicalNotes();

    return {
      panelId: this.panelId,
      code,
      explanation,
      examples,
      pedagogicalNotes,
    };
  }

  getCapabilities(): PanelCapabilities {
    return {
      supportedDomains: ['mathematics', 'data-science', 'scientific-computing', 'education'],
      mathLibraries: ['math', 'numpy', 'scipy', 'matplotlib'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];

    parts.push('# -- Python Panel: Readability as Mathematical Notation --');
    parts.push('#');
    parts.push('# Python code reads like math. Compare the code below to the formula.');
    parts.push('');

    if (expression.code) {
      parts.push(expression.code);
      parts.push('');
    }

    if (expression.explanation) {
      parts.push('# -- Explanation --');
      for (const line of expression.explanation.split('\n')) {
        parts.push(`# ${line}`);
      }
      parts.push('');
    }

    if (expression.examples && expression.examples.length > 0) {
      parts.push('# -- Examples --');
      for (const example of expression.examples) {
        parts.push(example);
        parts.push('');
      }
    }

    return parts.join('\n');
  }

  /**
   * Return the distinctive feature of the Python panel.
   */
  getDistinctiveFeature(_concept: RosettaConcept): string {
    return 'Readability as mathematical notation -- Python code reads almost exactly like the math formula it implements, making it the natural first panel for concept exploration.';
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildCode(concept: RosettaConcept): string {
    if (concept.id === 'exponential-decay' || concept.id === 'math-exponential-decay') {
      return this.buildExponentialDecayCode();
    }
    if (concept.id === 'trig-functions' || concept.id === 'math-trig-functions') {
      return this.buildTrigFunctionsCode();
    }
    if (concept.id === 'complex-numbers' || concept.id === 'math-complex-numbers') {
      return this.buildComplexNumbersCode();
    }
    if (concept.id === 'euler-formula' || concept.id === 'math-euler-formula') {
      return this.buildEulerFormulaCode();
    }
    if (concept.id === 'ratios-proportions' || concept.id === 'math-ratios') {
      return this.buildRatiosCode();
    }
    if (concept.id === 'logarithmic-scales' || concept.id === 'math-logarithmic-scales') {
      return this.buildLogarithmicCode();
    }
    if (concept.id === 'fractal-geometry' || concept.id === 'math-fractal-geometry') {
      return this.buildFractalCode();
    }
    return this.buildGenericCode(concept);
  }

  private buildExponentialDecayCode(): string {
    return [
      'import math',
      '',
      'def cooling_curve(t: float, T_initial: float, T_ambient: float, k: float) -> float:',
      '    """Newton\'s law of cooling: T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt)"""',
      '    return T_ambient + (T_initial - T_ambient) * math.exp(-k * t)',
      '',
      '# Example: coffee cooling from 95C in a 22C room',
      'T_initial = 95.0  # initial temperature (C)',
      'T_ambient = 22.0  # room temperature (C)',
      'k = 0.035         # cooling constant',
      '',
      'for t in range(0, 61, 10):',
      '    T = cooling_curve(t, T_initial, T_ambient, k)',
      '    print(f"t={t:3d} min  T={T:.1f}C")',
    ].join('\n');
  }

  private buildTrigFunctionsCode(): string {
    return [
      'import math',
      '',
      'def unit_circle(theta: float) -> tuple[float, float, float]:',
      '    """Evaluate trig functions at angle theta (radians)."""',
      '    return math.sin(theta), math.cos(theta), math.tan(theta)',
      '',
      '# Standard angles on the unit circle',
      'angles = {',
      '    "0":     0,',
      '    "pi/6":  math.pi / 6,',
      '    "pi/4":  math.pi / 4,',
      '    "pi/3":  math.pi / 3,',
      '    "pi/2":  math.pi / 2,',
      '}',
      '',
      'for name, theta in angles.items():',
      '    s, c, t = unit_circle(theta)',
      '    print(f"theta={name:5s}  sin={s:.4f}  cos={c:.4f}  tan={t:.4f}")',
    ].join('\n');
  }

  private buildComplexNumbersCode(): string {
    return [
      'import cmath',
      '',
      '# Complex numbers: z = a + bi',
      'z = complex(3, 4)',
      'print(f"z = {z}, |z| = {abs(z):.2f}, arg(z) = {cmath.phase(z):.4f} rad")',
      '',
      '# Euler\'s form: z = r * e^(i*theta)',
      'r, theta = abs(z), cmath.phase(z)',
      'z_euler = r * cmath.exp(1j * theta)',
      'print(f"Euler form: {z_euler:.4f}")',
    ].join('\n');
  }

  private buildEulerFormulaCode(): string {
    return [
      'import cmath',
      'import math',
      '',
      '# Euler\'s formula: e^(i*theta) = cos(theta) + i*sin(theta)',
      'def euler(theta: float) -> complex:',
      '    """Verify Euler\'s formula at angle theta."""',
      '    lhs = cmath.exp(1j * theta)',
      '    rhs = complex(math.cos(theta), math.sin(theta))',
      '    return lhs  # lhs == rhs by Euler\'s formula',
      '',
      'theta = math.pi / 4',
      'result = euler(theta)',
      'print(f"e^(i*pi/4) = {result.real:.4f} + {result.imag:.4f}i")',
    ].join('\n');
  }

  private buildRatiosCode(): string {
    return [
      'import math',
      '',
      '# Ratios and proportions: a/b = c/d',
      'def scale_recipe(original: dict, factor: float) -> dict:',
      '    """Scale a recipe by a given factor (ratio)."""',
      '    return {k: v * factor for k, v in original.items()}',
      '',
      'recipe = {"flour_g": 500, "water_g": 325, "salt_g": 10}',
      'ratio = 325 / 500  # hydration ratio = 65%',
      'print(f"Hydration ratio: {ratio:.0%}")',
      'print(f"Doubled: {scale_recipe(recipe, 2.0)}")',
    ].join('\n');
  }

  private buildLogarithmicCode(): string {
    return [
      'import math',
      '',
      '# Logarithmic scales: compressing large ranges',
      'def decibels(intensity: float, reference: float = 1e-12) -> float:',
      '    """Convert intensity to decibels (logarithmic scale)."""',
      '    return 10 * math.log10(intensity / reference)',
      '',
      'def ph(h_concentration: float) -> float:',
      '    """pH = -log10([H+])"""',
      '    return -math.log10(h_concentration)',
      '',
      'print(f"Whisper (1e-10): {decibels(1e-10):.0f} dB")',
      'print(f"Lemon juice pH: {ph(0.01):.1f}")',
    ].join('\n');
  }

  private buildFractalCode(): string {
    return [
      'import math',
      '',
      '# Mandelbrot set: z = z^2 + c',
      'def mandelbrot(c: complex, max_iter: int = 100) -> int:',
      '    """Return iteration count for Mandelbrot escape."""',
      '    z = complex(0, 0)',
      '    for n in range(max_iter):',
      '        if abs(z) > 2:',
      '            return n',
      '        z = z * z + c',
      '    return max_iter',
      '',
      '# Test a point on the boundary',
      'c = complex(-0.75, 0.1)',
      'iters = mandelbrot(c)',
      'print(f"mandelbrot({c}) escaped at iteration {iters}")',
    ].join('\n');
  }

  private buildGenericCode(concept: RosettaConcept): string {
    const safeName = concept.id.replace(/-/g, '_');
    return [
      'import math',
      '',
      `def ${safeName}(x: float) -> float:`,
      `    """Compute ${concept.name}."""`,
      '    return math.sqrt(x ** 2 + 1)',
      '',
      `# ${concept.name}`,
      `print(f"${concept.name}(2) = {${safeName}(2):.4f}")`,
    ].join('\n');
  }

  private buildExplanation(concept: RosettaConcept): string {
    return [
      `${concept.name} expressed in Python.`,
      `Notice how the Python code reads almost like the mathematical formula itself.`,
      `Python's clean syntax and rich standard library (math, cmath) make mathematical`,
      `concepts immediately accessible without boilerplate.`,
    ].join('\n');
  }

  private buildExamples(concept: RosettaConcept): string[] {
    const examples: string[] = [];

    examples.push([
      '# Numpy vectorized computation',
      'import numpy as np',
      '',
      `# Vectorize the ${concept.name} computation`,
      't = np.linspace(0, 60, 100)',
      '# Array operations apply element-wise -- no explicit loops needed',
      'result = np.exp(-0.035 * t)  # vectorized exponential',
    ].join('\n'));

    return examples;
  }

  private buildPedagogicalNotes(): string {
    return [
      'Python code reads almost exactly like the mathematical notation it implements.',
      'Compare: T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt)',
      'To:      T_ambient + (T_initial - T_ambient) * math.exp(-k * t)',
      '',
      'This readability is Python\'s pedagogical superpower. The code IS readable math.',
      'Type hints (float, tuple) add clarity without ceremony. The def keyword reads',
      'like "define". List comprehensions read like set-builder notation.',
      '',
      'Python\'s math library provides direct translations of standard functions:',
      'math.exp(), math.sin(), math.cos(), math.log() -- each named exactly as in textbooks.',
      'For array operations, numpy extends this to vectorized computation.',
    ].join('\n');
  }
}
