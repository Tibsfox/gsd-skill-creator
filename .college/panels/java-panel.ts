/**
 * Java panel -- type safety and platform independence.
 *
 * Java's object model shows how mathematical concepts become reusable,
 * portable software components. Uses Math.exp(), generics, and
 * class-based design patterns.
 *
 * @module panels/java-panel
 */

import { PanelInterface } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type { RosettaConcept, PanelExpression, PanelId } from '../rosetta-core/types.js';

// ─── Java Panel Implementation ──────────────────────────────────────────────

/**
 * The Java panel produces code that demonstrates type safety and platform independence.
 *
 * Java's Math class provides the same results on every JVM, making
 * mathematical computation reproducible and portable. The object model
 * turns concepts into reusable components.
 */
export class JavaPanel extends PanelInterface {
  readonly panelId: PanelId = 'java';
  readonly name = 'Java Panel';
  readonly description = 'Type safety and platform independence. Java\'s object model shows how mathematical concepts become reusable, portable software components.';

  /**
   * Translate a concept into Java code with Math class bindings and OO structure.
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
      supportedDomains: ['mathematics', 'enterprise', 'education', 'cross-platform'],
      mathLibraries: ['java.lang.Math', 'java.math', 'java.util.stream'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];

    parts.push('// -- Java Panel: Type Safety and Platform Independence --');
    parts.push('//');
    parts.push('// Math.exp() produces identical results on every JVM.');
    parts.push('');

    if (expression.code) {
      parts.push(expression.code);
      parts.push('');
    }

    if (expression.explanation) {
      parts.push('// -- Explanation --');
      for (const line of expression.explanation.split('\n')) {
        parts.push(`// ${line}`);
      }
      parts.push('');
    }

    if (expression.examples && expression.examples.length > 0) {
      parts.push('// -- Examples --');
      for (const example of expression.examples) {
        parts.push(example);
        parts.push('');
      }
    }

    return parts.join('\n');
  }

  /**
   * Return the distinctive feature of the Java panel.
   */
  getDistinctiveFeature(_concept: RosettaConcept): string {
    return 'Type safety and platform independence -- Java ensures mathematical operations are portable, reproducible, and wrapped in reusable object model components.';
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
      '/** Newton\'s law of cooling as a reusable Java component. */',
      'public class ExponentialDecay {',
      '',
      '    /**',
      '     * Compute temperature at time t using Newton\'s law of cooling.',
      '     * T(t) = tAmbient + (tInitial - tAmbient) * e^(-k * t)',
      '     */',
      '    public static double coolingCurve(double t, double tInitial, double tAmbient, double k) {',
      '        return tAmbient + (tInitial - tAmbient) * Math.exp(-k * t);',
      '    }',
      '',
      '    public static void main(String[] args) {',
      '        final double tInitial = 95.0;  // initial temperature (C)',
      '        final double tAmbient = 22.0;  // room temperature (C)',
      '        final double k = 0.035;         // cooling constant',
      '',
      '        for (int t = 0; t <= 60; t += 10) {',
      '            double temp = coolingCurve(t, tInitial, tAmbient, k);',
      '            System.out.printf("t=%3d min  T=%.1fC%n", t, temp);',
      '        }',
      '    }',
      '}',
    ].join('\n');
  }

  private buildTrigFunctionsCode(): string {
    return [
      '/** Trigonometric functions on the unit circle. */',
      'public class TrigFunctions {',
      '',
      '    public static double[] unitCircle(double theta) {',
      '        return new double[] { Math.sin(theta), Math.cos(theta), Math.tan(theta) };',
      '    }',
      '',
      '    public static void main(String[] args) {',
      '        double[] angles = { 0, Math.PI/6, Math.PI/4, Math.PI/3, Math.PI/2 };',
      '',
      '        for (double theta : angles) {',
      '            double[] result = unitCircle(theta);',
      '            System.out.printf("sin=%.4f  cos=%.4f  tan=%.4f%n",',
      '                result[0], result[1], result[2]);',
      '        }',
      '    }',
      '}',
    ].join('\n');
  }

  private buildComplexNumbersCode(): string {
    return [
      '/** Complex number representation with magnitude and phase. */',
      'public class ComplexNumber {',
      '    private final double real;',
      '    private final double imag;',
      '',
      '    public ComplexNumber(double real, double imag) {',
      '        this.real = real;',
      '        this.imag = imag;',
      '    }',
      '',
      '    public double magnitude() { return Math.sqrt(real * real + imag * imag); }',
      '    public double phase() { return Math.atan2(imag, real); }',
      '',
      '    public static void main(String[] args) {',
      '        ComplexNumber z = new ComplexNumber(3, 4);',
      '        System.out.printf("|z| = %.2f, arg(z) = %.4f rad%n", z.magnitude(), z.phase());',
      '    }',
      '}',
    ].join('\n');
  }

  private buildEulerFormulaCode(): string {
    return [
      "/** Euler's formula: e^(i*theta) = cos(theta) + i*sin(theta) */",
      'public class EulerFormula {',
      '',
      '    public static double[] euler(double theta) {',
      '        return new double[] { Math.cos(theta), Math.sin(theta) };',
      '    }',
      '',
      '    public static void main(String[] args) {',
      '        double theta = Math.PI / 4;',
      '        double[] result = euler(theta);',
      '        System.out.printf("e^(i*pi/4) = %.4f + %.4fi%n", result[0], result[1]);',
      '    }',
      '}',
    ].join('\n');
  }

  private buildRatiosCode(): string {
    return [
      '/** Ratios and proportions with type-safe scaling. */',
      'public class Ratios {',
      '',
      '    public static double scale(double value, double factor) {',
      '        return value * factor;',
      '    }',
      '',
      '    public static void main(String[] args) {',
      '        double flour = 500.0;',
      '        double water = 325.0;',
      '        double ratio = water / flour;',
      '        System.out.printf("Hydration ratio: %.0f%%%n", ratio * 100);',
      '    }',
      '}',
    ].join('\n');
  }

  private buildLogarithmicCode(): string {
    return [
      '/** Logarithmic scales: compressing large ranges. */',
      'public class LogarithmicScales {',
      '',
      '    public static double decibels(double intensity) {',
      '        return 10.0 * Math.log10(intensity / 1e-12);',
      '    }',
      '',
      '    public static double ph(double hConcentration) {',
      '        return -Math.log10(hConcentration);',
      '    }',
      '',
      '    public static void main(String[] args) {',
      '        System.out.printf("Whisper: %.0f dB%n", decibels(1e-10));',
      '        System.out.printf("Lemon pH: %.1f%n", ph(0.01));',
      '    }',
      '}',
    ].join('\n');
  }

  private buildFractalCode(): string {
    return [
      '/** Mandelbrot set: z = z^2 + c */',
      'public class FractalGeometry {',
      '',
      '    public static int mandelbrot(double cReal, double cImag, int maxIter) {',
      '        double zr = 0, zi = 0;',
      '        for (int n = 0; n < maxIter; n++) {',
      '            if (zr * zr + zi * zi > 4.0) return n;',
      '            double tmp = zr * zr - zi * zi + cReal;',
      '            zi = 2 * zr * zi + cImag;',
      '            zr = tmp;',
      '        }',
      '        return maxIter;',
      '    }',
      '',
      '    public static void main(String[] args) {',
      '        int iters = mandelbrot(-0.75, 0.1, 100);',
      '        System.out.printf("mandelbrot(-0.75+0.1i) escaped at %d%n", iters);',
      '    }',
      '}',
    ].join('\n');
  }

  private buildGenericCode(concept: RosettaConcept): string {
    const className = concept.name.replace(/[^a-zA-Z0-9]/g, '');
    return [
      `/** ${concept.name} as a reusable Java component. */`,
      `public class ${className} {`,
      '',
      `    public static double compute(double x) {`,
      '        return Math.sqrt(x * x + 1.0);',
      '    }',
      '',
      '    public static void main(String[] args) {',
      `        System.out.printf("${concept.name}(2) = %.4f%n", compute(2.0));`,
      '    }',
      '}',
    ].join('\n');
  }

  private buildExplanation(concept: RosettaConcept): string {
    return [
      `${concept.name} expressed in Java.`,
      `Every method has a typed signature (double in, double out). The class structure`,
      `makes the concept a reusable component. Math.exp() produces identical results`,
      `on every JVM -- platform independence through specification.`,
    ].join('\n');
  }

  private buildExamples(concept: RosettaConcept): string[] {
    const examples: string[] = [];

    // Generics/interface example
    examples.push([
      '// Generic interface -- mathematical concepts as reusable components',
      'public interface MathConcept<T extends Number> {',
      '    double evaluate(T input);',
      '    String describe();',
      '}',
      '',
      '// Implementation with generics',
      'public class DecayConcept implements MathConcept<Double> {',
      '    @Override',
      '    public double evaluate(Double t) {',
      '        return Math.exp(-0.035 * t);',
      '    }',
      '    @Override',
      '    public String describe() { return "Exponential decay"; }',
      '}',
    ].join('\n'));

    return examples;
  }

  private buildPedagogicalNotes(): string {
    return [
      'Java\'s type system enforces correctness at compile time. Every method signature',
      'declares exactly what types go in and come out. Math.exp() produces identical',
      'results on every JVM -- platform independence means reproducible science.',
      '',
      'The object model turns mathematical concepts into reusable, portable software',
      'components. A class like ExponentialDecay can be imported, extended, and composed',
      'with other concepts through interfaces and generics.',
      '',
      'Generics (MathConcept<T extends Number>) let you write type-safe abstractions',
      'over different numeric types. The compiler catches type errors before runtime.',
    ].join('\n');
  }
}
