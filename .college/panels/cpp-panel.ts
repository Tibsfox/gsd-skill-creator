/**
 * C++ panel -- performance and precision.
 *
 * C++ forces you to think about types, memory, and hardware -- revealing
 * what the computer actually does with your math. Uses #include <cmath>,
 * std::exp(), double precision, and templates.
 *
 * @module panels/cpp-panel
 */

import { PanelInterface } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type { RosettaConcept, PanelExpression, PanelId } from '../rosetta-core/types.js';

// ─── C++ Panel Implementation ───────────────────────────────────────────────

/**
 * The C++ panel produces code that forces thinking about types, memory, and hardware.
 *
 * Where Python hides the machine, C++ reveals it. Every math operation has
 * a type (double, not float), every function has a calling convention, and
 * templates enable compile-time computation.
 */
export class CppPanel extends PanelInterface {
  readonly panelId: PanelId = 'cpp';
  readonly name = 'C++ Panel';
  readonly description = 'Performance and precision. C++ forces you to think about types, memory, and hardware -- revealing what the computer actually does with your math.';

  /**
   * Translate a concept into C++ code with cmath bindings and double precision.
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
      supportedDomains: ['mathematics', 'systems-programming', 'scientific-computing', 'performance'],
      mathLibraries: ['cmath', 'algorithm', 'numeric', 'complex'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];

    parts.push('// -- C++ Panel: Performance and Precision --');
    parts.push('//');
    parts.push('// C++ reveals what the machine does with your math.');
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
   * Return the distinctive feature of the C++ panel.
   */
  getDistinctiveFeature(_concept: RosettaConcept): string {
    return 'Performance and precision -- C++ forces you to think about types, memory layout, and hardware reality behind every mathematical operation.';
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
      '#include <cmath>',
      '#include <iostream>',
      '#include <iomanip>',
      '',
      '// Newton\'s law of cooling: T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt)',
      'double cooling_curve(double t, double T_initial, double T_ambient, double k) {',
      '    return T_ambient + (T_initial - T_ambient) * std::exp(-k * t);',
      '}',
      '',
      'int main() {',
      '    const double T_initial = 95.0;  // initial temperature (C)',
      '    const double T_ambient = 22.0;  // room temperature (C)',
      '    const double k = 0.035;         // cooling constant',
      '',
      '    for (int t = 0; t <= 60; t += 10) {',
      '        double T = cooling_curve(t, T_initial, T_ambient, k);',
      '        std::cout << "t=" << std::setw(3) << t',
      '                  << " min  T=" << std::fixed << std::setprecision(1)',
      '                  << T << "C" << std::endl;',
      '    }',
      '    return 0;',
      '}',
    ].join('\n');
  }

  private buildTrigFunctionsCode(): string {
    return [
      '#include <cmath>',
      '#include <iostream>',
      '#include <iomanip>',
      '',
      '// Trig functions on the unit circle',
      'struct TrigResult {',
      '    double sin_val;',
      '    double cos_val;',
      '    double tan_val;',
      '};',
      '',
      'TrigResult unit_circle(double theta) {',
      '    return { std::sin(theta), std::cos(theta), std::tan(theta) };',
      '}',
      '',
      'int main() {',
      '    const double pi = M_PI;',
      '    double angles[] = { 0.0, pi/6, pi/4, pi/3, pi/2 };',
      '',
      '    for (double theta : angles) {',
      '        auto [s, c, t] = unit_circle(theta);',
      '        std::cout << std::fixed << std::setprecision(4)',
      '                  << "sin=" << s << "  cos=" << c',
      '                  << "  tan=" << t << std::endl;',
      '    }',
      '    return 0;',
      '}',
    ].join('\n');
  }

  private buildComplexNumbersCode(): string {
    return [
      '#include <cmath>',
      '#include <complex>',
      '#include <iostream>',
      '',
      'int main() {',
      '    // Complex numbers: z = a + bi',
      '    std::complex<double> z(3.0, 4.0);',
      '    double magnitude = std::abs(z);',
      '    double phase = std::arg(z);',
      '',
      '    std::cout << "z = " << z',
      '              << ", |z| = " << magnitude',
      '              << ", arg(z) = " << phase << " rad" << std::endl;',
      '    return 0;',
      '}',
    ].join('\n');
  }

  private buildEulerFormulaCode(): string {
    return [
      '#include <cmath>',
      '#include <complex>',
      '#include <iostream>',
      '',
      "// Euler's formula: e^(i*theta) = cos(theta) + i*sin(theta)",
      'std::complex<double> euler(double theta) {',
      '    return std::exp(std::complex<double>(0.0, theta));',
      '}',
      '',
      'int main() {',
      '    double theta = M_PI / 4.0;',
      '    auto result = euler(theta);',
      '    std::cout << "e^(i*pi/4) = " << result.real()',
      '              << " + " << result.imag() << "i" << std::endl;',
      '    return 0;',
      '}',
    ].join('\n');
  }

  private buildRatiosCode(): string {
    return [
      '#include <cmath>',
      '#include <iostream>',
      '',
      '// Ratios and proportions with type-safe scaling',
      'double scale(double value, double factor) {',
      '    return value * factor;',
      '}',
      '',
      'int main() {',
      '    double flour_g = 500.0;',
      '    double water_g = 325.0;',
      '    double ratio = water_g / flour_g;  // hydration 65%',
      '',
      '    std::cout << "Hydration ratio: " << ratio * 100 << "%" << std::endl;',
      '    std::cout << "Doubled flour: " << scale(flour_g, 2.0) << "g" << std::endl;',
      '    return 0;',
      '}',
    ].join('\n');
  }

  private buildLogarithmicCode(): string {
    return [
      '#include <cmath>',
      '#include <iostream>',
      '',
      '// Logarithmic scales: compressing large ranges',
      'double decibels(double intensity, double reference = 1e-12) {',
      '    return 10.0 * std::log10(intensity / reference);',
      '}',
      '',
      'double ph(double h_concentration) {',
      '    return -std::log10(h_concentration);',
      '}',
      '',
      'int main() {',
      '    std::cout << "Whisper: " << decibels(1e-10) << " dB" << std::endl;',
      '    std::cout << "Lemon pH: " << ph(0.01) << std::endl;',
      '    return 0;',
      '}',
    ].join('\n');
  }

  private buildFractalCode(): string {
    return [
      '#include <cmath>',
      '#include <complex>',
      '#include <iostream>',
      '',
      '// Mandelbrot set: z = z^2 + c',
      'int mandelbrot(std::complex<double> c, int max_iter = 100) {',
      '    std::complex<double> z(0.0, 0.0);',
      '    for (int n = 0; n < max_iter; ++n) {',
      '        if (std::abs(z) > 2.0) return n;',
      '        z = z * z + c;',
      '    }',
      '    return max_iter;',
      '}',
      '',
      'int main() {',
      '    std::complex<double> c(-0.75, 0.1);',
      '    int iters = mandelbrot(c);',
      '    std::cout << "mandelbrot(" << c << ") escaped at " << iters << std::endl;',
      '    return 0;',
      '}',
    ].join('\n');
  }

  private buildGenericCode(concept: RosettaConcept): string {
    const safeName = concept.id.replace(/-/g, '_');
    return [
      '#include <cmath>',
      '#include <iostream>',
      '',
      `// ${concept.name}`,
      `double ${safeName}(double x) {`,
      '    return std::sqrt(x * x + 1.0);',
      '}',
      '',
      'int main() {',
      `    std::cout << "${concept.name}(2) = " << ${safeName}(2.0) << std::endl;`,
      '    return 0;',
      '}',
    ].join('\n');
  }

  private buildExplanation(concept: RosettaConcept): string {
    return [
      `${concept.name} expressed in C++.`,
      `Every variable has an explicit type (double for 64-bit IEEE 754 precision).`,
      `The compiler enforces type safety -- you choose double over float because`,
      `accumulated floating-point error matters in scientific computation.`,
    ].join('\n');
  }

  private buildExamples(concept: RosettaConcept): string[] {
    const examples: string[] = [];

    // Template example for compile-time computation
    examples.push([
      '// Template version -- compile-time type parametrization',
      'template<typename T>',
      `T cooling_curve_generic(T t, T T_initial, T T_ambient, T k) {`,
      '    return T_ambient + (T_initial - T_ambient) * std::exp(-k * t);',
      '}',
      '',
      '// constexpr for compile-time evaluation (C++20)',
      'constexpr double pi = 3.14159265358979323846;',
    ].join('\n'));

    return examples;
  }

  private buildPedagogicalNotes(): string {
    return [
      'C++ makes you think about what the hardware actually does with your math.',
      'Every double occupies exactly 8 bytes of IEEE 754 storage. Every std::exp()',
      'call maps to a specific CPU instruction (or a libm routine).',
      '',
      'Precision matters: double gives you ~15 significant digits, float only ~7.',
      'In iterative computations like cooling curves, the difference between',
      'double and float accumulates with every step. C++ forces this choice.',
      '',
      'Templates let you write the same algorithm for any numeric type --',
      'double, float, or even custom fixed-point types. The compiler generates',
      'specialized machine code for each type at compile time.',
    ].join('\n');
  }
}
