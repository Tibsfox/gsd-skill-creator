/**
 * Perl panel -- text processing, regex-as-syntax, closure factories, POD-as-curriculum.
 *
 * Designed by a linguist (Larry Wall), Perl's syntax mirrors natural language processing.
 * Regular expressions are first-class grammar. Closures capture lexical scope.
 * POD embeds curriculum directly in code. CPAN's 220,000 modules demonstrate
 * knowledge ecosystem architecture.
 *
 * @module panels/perl-panel
 */

import { PanelInterface } from './panel-interface.js';
import type { PanelCapabilities } from './panel-interface.js';
import type { RosettaConcept, PanelExpression, PanelId } from '../rosetta-core/types.js';

// ─── Perl Panel Implementation ──────────────────────────────────────────────

/**
 * The Perl panel demonstrates three features in every concept expression:
 * regex-as-syntax, closure factories, and POD-as-curriculum.
 *
 * A single Perl concept example is simultaneously executable code,
 * formatted documentation, and a demonstration of pattern-matching
 * and higher-order programming.
 */
export class PerlPanel extends PanelInterface {
  readonly panelId: PanelId = 'perl';
  readonly name = 'Perl Panel';
  readonly description = 'Natural language in code. Designed by a linguist, Perl\'s syntax mirrors how humans process text and patterns. Regular expressions are first-class syntax — executable finite automata built into the grammar. Context sensitivity models how meaning depends on usage. CPAN\'s 220,000 modules demonstrate knowledge ecosystem architecture. POD embeds curriculum directly in code.';

  translate(concept: RosettaConcept): PanelExpression {
    const code = this.buildPerlCode(concept);
    const explanation = this.buildExplanation(concept);
    const examples = this.buildExamples(concept);
    const pedagogicalNotes = this.buildPedagogicalNotes(concept);

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
      supportedDomains: ['text-processing', 'mathematics', 'nlp', 'data-transformation', 'glue'],
      mathLibraries: ['POSIX-math', 'Math::Complex', 'Math::Trig'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation', 'example'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    const parts: string[] = [];

    parts.push('# ── Perl Panel: Regex + Closures + POD ──────────────────────────');
    parts.push('# Three features in one: regex as syntax, closure factories,');
    parts.push('# and POD as curriculum. The file IS both program and textbook.');
    parts.push('');

    if (expression.code) {
      parts.push(expression.code);
      parts.push('');
    }

    if (expression.explanation) {
      parts.push('# ── Explanation ─────────────────────────────────────────────────');
      for (const line of expression.explanation.split('\n')) {
        parts.push(`# ${line}`);
      }
      parts.push('');
    }

    if (expression.examples && expression.examples.length > 0) {
      parts.push('# ── Examples ───────────────────────────────────────────────────');
      for (const example of expression.examples) {
        parts.push(example);
        parts.push('');
      }
    }

    return parts.join('\n');
  }

  getDistinctiveFeature(concept: RosettaConcept): string {
    if (concept.domain === 'text-processing' || concept.domain === 'nlp') {
      return 'Native text processing -- regex as syntax, not library calls. Perl compiles /pattern/ into finite automata at parse time.';
    }
    if (concept.domain === 'mathematics' && concept.id.includes('formal')) {
      return 'Regular expressions ARE executable finite automata -- the theory made concrete in syntax.';
    }
    return 'TMTOWTDI -- There\'s More Than One Way To Do It. Multiple valid expressions reveal different facets of the concept.';
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private buildPerlCode(concept: RosettaConcept): string {
    if (concept.domain === 'mathematics' && (concept.id === 'exponential-decay' || concept.id === 'math-exponential-decay')) {
      return this.buildExponentialDecayPerl();
    }
    return this.buildGenericPerl(concept);
  }

  private buildExponentialDecayPerl(): string {
    return [
      `#!/usr/bin/perl`,
      `use strict;`,
      `use warnings;`,
      ``,
      `=head1 NAME`,
      ``,
      `exponential_decay - Newton's law of cooling as executable mathematics`,
      ``,
      `=head1 DESCRIPTION`,
      ``,
      `Exponential decay governs how hot things cool down. The same equation`,
      `describes radioactive decay, capacitor discharge, and drug metabolism.`,
      `This file IS both executable program AND formatted curriculum.`,
      `Run it as code. Format it with perldoc. Same source, two outputs.`,
      ``,
      `=head1 MATHEMATICAL BASIS`,
      ``,
      `T(t) = T_ambient + (T_initial - T_ambient) * e^(-kt)`,
      ``,
      `=cut`,
      ``,
      `# ── Regex as syntax ──────────────────────────────────────────────`,
      `# In Perl, /pattern/ is grammar, not a library call.`,
      `# The regex below compiles into a finite automaton at parse time.`,
      `# No "import re" -- regex IS part of the language.`,
      ``,
      `sub validate_params {`,
      `    my ($input) = @_;`,
      `    # regex IS syntax -- compiled to finite automaton at parse time`,
      `    return $input =~ /^[\\d.]+$/;`,
      `}`,
      ``,
      `# ── Closure factory (Higher-Order Perl, Ch. 7) ─────────────────`,
      `# Returns a FUNCTION that computes temperature at any time t.`,
      `# The returned sub captures lexical variables from enclosing scope.`,
      ``,
      `sub make_cooling_curve {`,
      `    my ($t_initial, $t_ambient, $k) = @_;`,
      `    # Sigils: $scalar captures a single value`,
      `    # This closure captures lexical variables via 'my'`,
      `    return sub {`,
      `        my ($t) = @_;`,
      `        return $t_ambient + ($t_initial - $t_ambient) * exp(-$k * $t);`,
      `    };`,
      `}`,
      ``,
      `=head2 USAGE`,
      ``,
      `    my $cooling = make_cooling_curve(212, 72, 0.05);`,
      `    my @temperatures = map { $cooling->($_) } (0, 10, 20, 30);`,
      ``,
      `=cut`,
      ``,
      `# ── Application ──────────────────────────────────────────────────`,
      `# Sigils in action: $scalar, @array, %hash`,
      ``,
      `my $cooling = make_cooling_curve(212, 72, 0.05);`,
      `my @times = (0, 10, 20, 30, 60);`,
      `my %results;`,
      ``,
      `for my $t (@times) {`,
      `    if (validate_params($t)) {`,
      `        $results{$t} = $cooling->($t);`,
      `        # Use regex to format output: s/pattern/replacement/`,
      `        my $formatted = sprintf("%.2f", $results{$t});`,
      `        $formatted =~ s/(\\d+\\.\\d{2}).*/$1/;`,
      `        print "t=$t: T=$formatted\\n";`,
      `    }`,
      `}`,
    ].join('\n');
  }

  private buildGenericPerl(concept: RosettaConcept): string {
    const safeName = concept.id.replace(/-/g, '_');
    return [
      `#!/usr/bin/perl`,
      `use strict;`,
      `use warnings;`,
      ``,
      `=head1 NAME`,
      ``,
      `${safeName} - ${concept.name}`,
      ``,
      `=cut`,
      ``,
      `sub validate_input {`,
      `    my ($input) = @_;`,
      `    return $input =~ /^[\\w\\s]+$/;`,
      `}`,
      ``,
      `sub make_${safeName} {`,
      `    my ($param) = @_;`,
      `    return sub {`,
      `        my ($x) = @_;`,
      `        return $param * $x;`,
      `    };`,
      `}`,
    ].join('\n');
  }

  private buildExplanation(concept: RosettaConcept): string {
    return [
      `${concept.name} expressed in Perl.`,
      `This single file demonstrates three Perl principles simultaneously:`,
      `1. Regex as syntax: /pattern/ is grammar, compiled to finite automata`,
      `2. Closure factory: sub returning sub, capturing lexical scope`,
      `3. POD as curriculum: =head1/=cut sections embed documentation in code`,
    ].join('\n');
  }

  private buildExamples(concept: RosettaConcept): string[] {
    return [
      [
        `# CPAN ecosystem: hierarchical namespace architecture`,
        `# Math::Complex, Math::Trig, Lingua::EN::Inflect, Text::CSV`,
        `# 220,000+ modules organized in namespaces like Math::, Lingua::, Text::`,
        `# Each namespace is a domain of knowledge: Math for mathematics,`,
        `# Lingua for natural language, Text for text processing.`,
        `use Math::Trig;  # Trigonometric functions from CPAN`,
      ].join('\n'),
      [
        `# Context sensitivity: same variable, different meaning`,
        `# Perl sigils encode context:`,
        `#   $scalar  - single value (the one)`,
        `#   @array   - ordered list (all of them)`,
        `#   %hash    - key-value pairs (labeled things)`,
        `my @temperatures = map { $cooling->($_) } @times;`,
      ].join('\n'),
    ];
  }

  private buildPedagogicalNotes(_concept: RosettaConcept): string {
    return [
      `Larry Wall (a linguist) designed Perl with the Huffman coding principle:`,
      `common operations get concise syntax, rare operations get verbose syntax.`,
      `This is why /regex/ is built into grammar (text matching is common) while`,
      `socket programming requires a module (networking is specialized).`,
      ``,
      `Three features demonstrated in one concept:`,
      `1. Regex as syntax: /pattern/ compiles to a finite automaton at parse time.`,
      `   No import statement needed -- regex IS part of the language grammar.`,
      `2. Closure factory: make_cooling_curve() returns a subroutine reference`,
      `   that captures lexical variables. Higher-order programming via closures.`,
      `3. POD as curriculum: The same source file, when formatted with perldoc,`,
      `   becomes a formatted textbook page. Code and curriculum in one file.`,
      ``,
      `CPAN's 220,000 modules in hierarchical namespaces (Math::Complex,`,
      `Lingua::EN::Inflect, Text::CSV) demonstrate knowledge ecosystem`,
      `architecture -- organized domains of reusable human knowledge.`,
    ].join('\n');
  }
}
