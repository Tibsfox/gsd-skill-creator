# College Structure — Component Specification

**Milestone:** Cooking with Claude
**Wave:** 2A (Track A)
**Model Assignment:** Sonnet (framework), Opus (Math Department seed)
**Estimated Tokens:** ~45K combined
**Dependencies:** Concept Registry (1A.1), Panel Interface (0.2), Systems Panels (2B.1)
**Produces:** `.college/departments/` framework, Mathematics Department seed, College loader

---

## Objective

Implement the College as skill-creator's knowledge organization model — a structure where each department is a wing of a library built in code. The code IS the curriculum. Exploring the Mathematics department's source code teaches mathematics. Exploring the Culinary Arts department's source code teaches food science. Walking through any department teaches both how to use the system AND the fundamentals the department encodes. Web pages, documents, Minecraft worlds, VR spaces are just renderings — different projections of the same underlying code structure.

## Context

### The Code IS the Curriculum

Traditional educational systems separate content from delivery. A textbook contains knowledge; a course management system delivers it. The College collapses this distinction. The concept definitions in `departments/mathematics/concepts/exponential-decay.ts` aren't a representation of exponential decay — they ARE the system's understanding of exponential decay, expressed in a form that:

1. **Executes** — the TypeScript compiles and runs, computing actual exponential decay values
2. **Teaches** — inline pedagogical annotations explain what each line does and why
3. **Translates** — panel mappings show the same concept in Python, C++, Lisp, Fortran, Pascal
4. **Connects** — cross-references link to related concepts (half-life → radioactive decay → cooling curves)
5. **Calibrates** — calibration rules specify how to adjust explanations based on user feedback

A student exploring this file learns exponential decay, programming, and how to use skill-creator simultaneously.

### Progressive Disclosure in Code

Following the Amiga Principle (architectural leverage through progressive capability), the College implements progressive disclosure at every level:

- **DEPARTMENT.md** — Always loaded. Overview, learning path, department map (~500 tokens)
- **concepts/index.ts** — Summary layer. Concept names, relationships, entry points (~2K tokens)
- **concepts/*.ts** — Active layer. Full concept definitions with panel mappings (~1K per concept)
- **references/** — Deep layer. Extended examples, historical context, research citations (~5K+ per topic)

## Technical Specification

### Department Structure

```typescript
interface CollegeDepartment {
  id: string;                          // e.g., 'mathematics', 'culinary-arts'
  name: string;                        // Human-readable: "Mathematics", "Culinary Arts"
  description: string;                 // One paragraph overview
  wings: DepartmentWing[];             // Subject areas within the department
  learningPath: LearningPath;          // Suggested exploration order
  crossReferences: CrossDepartmentRef[]; // Links to concepts in other departments
  tokenBudget: {
    summary: number;                   // Max tokens for summary tier (~3K)
    active: number;                    // Max tokens for active tier (~12K)
    deep: number;                      // Max tokens for deep tier (~50K)
  };
}

interface DepartmentWing {
  id: string;                          // e.g., 'algebra', 'food-science'
  name: string;
  concepts: string[];                  // Concept IDs in this wing
  trySessions: TrySession[];           // Interactive entry points
  calibrationModel?: string;           // Domain-specific calibration model ID
  safetyBoundaries?: SafetyBoundary[]; // Wing-specific safety rules
}

interface LearningPath {
  entryPoint: string;                  // First concept for new explorers
  suggestedOrder: string[][];          // Groups of concepts that can be explored in parallel
  prerequisites: Map<string, string[]>; // concept → concepts that should come first
}

interface TrySession {
  id: string;
  title: string;                       // "Your First Derivative" or "Make an Omelette"
  estimatedMinutes: number;
  prerequisites: string[];             // Required prior concepts (empty = truly beginner)
  steps: TryStep[];
}

interface TryStep {
  instruction: string;                 // What to do
  expectedOutcome: string;             // What should happen
  hint?: string;                       // If stuck
  conceptsExplored: string[];          // Which concepts this step touches
}
```

### College Loader

```typescript
class CollegeLoader {
  private departments: Map<string, CollegeDepartment> = new Map();
  private loadedTier: Map<string, 'summary' | 'active' | 'deep'> = new Map();
  
  // Load department at summary tier (always safe, <3K tokens)
  async loadSummary(departmentId: string): Promise<DepartmentSummary> {
    // Reads DEPARTMENT.md and concepts/index.ts only
    // Returns: name, description, wing list, entry points
  }
  
  // Load specific wing at active tier (<12K tokens for the wing)
  async loadWing(departmentId: string, wingId: string): Promise<WingContent> {
    // Reads all concepts in the wing
    // Loads relevant calibration model
    // Returns: concept definitions with panel mappings
  }
  
  // Load deep reference material (on explicit request only)
  async loadDeep(departmentId: string, topic: string): Promise<DeepReference> {
    // Reads from references/ directory
    // Returns: extended explanations, historical context, citations
    // WARNING: May exceed active tier token budget
  }
  
  // Navigation — where the "explorable code" experience lives
  async explore(path: string): Promise<ExplorationResult> {
    // Path like "mathematics/geometry/unit-circle"
    // Returns the concept with pedagogical annotations
    // Triggers observation pipeline (exploration IS usage)
  }
  
  // Cross-department navigation
  async crossReference(
    fromDept: string, fromConcept: string,
    toDept: string
  ): Promise<CrossReferenceResult> {
    // Finds analogous concepts across departments
    // e.g., math/exponential-decay → culinary-arts/cooling-curves
  }
}
```

### Mathematics Department Seed

The Mathematics Department is the first fully-implemented department, seeded by "The Space Between" (923-page mathematical textbook). It demonstrates the College pattern for all future departments.

**Wings:**

1. **Algebra Wing** — Variables, expressions, equations, functions. Entry point for the department.
2. **Geometry Wing** — Shapes, transformations, the unit circle. Integrates the unit circle architecture from skill-creator's learning functions.
3. **Calculus Wing** — Limits, derivatives, integrals, series. The mathematical machinery behind calibration adjustments.
4. **Statistics Wing** — Probability, distributions, inference. The mathematical machinery behind pattern detection.
5. **Complex Analysis Wing** — Complex numbers, Euler's formula, the Complex Plane. The mathematical foundation for the Complex Plane of Experience.

**Initial Concept Set (seeded from "The Space Between"):**

| Concept | Wing | Panels | Cross-References |
|---------|------|--------|-----------------|
| Exponential growth/decay | Calculus | Python, C++, Java, Fortran, Lisp | Culinary: cooling curves, fermentation, yeast growth |
| Trigonometric functions | Geometry | All 6 panels | Culinary: periodic flavor development, oven temperature cycling |
| Complex numbers | Complex Analysis | Python, C++, Lisp | Unit circle architecture (skill-creator core) |
| Euler's formula | Complex Analysis | All 6 panels | Skill composition, concept rotation on Complex Plane |
| Ratios and proportions | Algebra | Python, Pascal | Culinary: baker's percentages, recipe scaling |
| Logarithmic scales | Algebra | Python, C++, Fortran | Culinary: pH in cooking, taste perception (Weber-Fechner) |
| Fractal geometry | Complex Analysis | Python, Lisp | Calibration Engine: fractal expansion of seed ideas |

**Example Concept Definition (demonstrating code-as-curriculum):**

```typescript
// departments/mathematics/concepts/exponential-decay.ts
// 
// WHAT THIS FILE TEACHES:
// - Exponential decay describes how quantities decrease at a rate
//   proportional to their current value
// - The mathematical model: N(t) = N₀ · e^(-λt)
// - Applications range from radioactive decay to Newton's law of cooling
//   to flavor dissipation in cooking
//
// EXPLORING THIS FILE:
// Read the concept definition to understand the mathematical structure.
// Check the panels map to see how different languages express the same idea.
// Follow the cross-references to see where this concept appears in other departments.

import { RosettaConcept, PanelExpression } from '../../rosetta-core/types';

export const exponentialDecay: RosettaConcept = {
  id: 'math-exponential-decay',
  name: 'Exponential Decay',
  domain: 'mathematics',
  description: 'A quantity decreases at a rate proportional to its current value. ' +
    'The universal pattern of "things cool down, fade away, and approach equilibrium."',
  
  panels: new Map([
    ['python', {
      panelId: 'python',
      code: `import math\n\ndef decay(initial: float, rate: float, time: float) -> float:\n    """N(t) = N₀ · e^(-λt)"""\n    return initial * math.exp(-rate * time)`,
      explanation: 'Python\'s math.exp() computes e raised to a power. ' +
        'The negative rate means the value shrinks over time.',
      pedagogicalNotes: 'Notice how Python reads almost like the mathematical notation. ' +
        'This is why Python is often chosen for scientific computing — ' +
        'the code communicates the math clearly.'
    }],
    ['cpp', {
      panelId: 'cpp',
      code: `#include <cmath>\n\ndouble decay(double initial, double rate, double time) {\n    return initial * std::exp(-rate * time);\n}`,
      explanation: 'C++ cmath provides std::exp(). The type system enforces double precision.',
      pedagogicalNotes: 'C++ makes you think about precision (float vs double). ' +
        'In scientific computing, this matters — accumulated floating-point error ' +
        'can produce wrong results in long simulations.'
    }],
    ['lisp', {
      panelId: 'lisp',
      code: `(defun decay (initial rate time)\n  (* initial (exp (- (* rate time)))))`,
      explanation: 'In Lisp, the function IS a list. (defun decay ...) defines a function ' +
        'that is also a data structure you can inspect and transform.',
      pedagogicalNotes: 'This is homoiconicity in action. The decay function is both ' +
        'executable code and a list you can manipulate. You could write a program ' +
        'that reads this definition and generates variations — that\'s the Rosetta principle.'
    }],
    ['fortran', {
      panelId: 'fortran',
      code: `REAL FUNCTION DECAY(INITIAL, RATE, TIME)\n    REAL, INTENT(IN) :: INITIAL, RATE, TIME\n    DECAY = INITIAL * EXP(-RATE * TIME)\nEND FUNCTION`,
      explanation: 'Fortran — the oldest high-level language still in production use — ' +
        'was designed for FORmula TRANslation. Mathematical expressions in Fortran ' +
        'look almost exactly like their textbook form.',
      pedagogicalNotes: 'Fortran is the mother tongue of scientific computing. ' +
        'Most of the world\'s weather models, fluid dynamics simulations, and ' +
        'nuclear physics codes are still written in Fortran. Understanding it ' +
        'connects you to sixty years of computational science.'
    }],
    ['pascal', {
      panelId: 'pascal',
      code: `function Decay(Initial, Rate, Time: Real): Real;\nbegin\n    Decay := Initial * Exp(-Rate * Time);\nend;`,
      explanation: 'Pascal assigns the return value by setting the function name. ' +
        'The begin/end structure makes scope visually explicit.',
      pedagogicalNotes: 'Niklaus Wirth designed Pascal to teach structured programming. ' +
        'Every construct has a clear beginning and end. Every variable has an explicit type. ' +
        'The language enforces the discipline that produces reliable software.'
    }]
  ]),
  
  relationships: [
    { type: 'depends-on', targetId: 'math-euler-number', description: 'e is the base of natural exponential functions' },
    { type: 'generalizes', targetId: 'math-half-life', description: 'Half-life is exponential decay with a specific rate' },
    { type: 'analogy', targetId: 'culinary-cooling-curve', description: 'Newton\'s law of cooling IS exponential decay — hot food approaches room temperature exponentially' },
    { type: 'analogy', targetId: 'culinary-fermentation-rate', description: 'Yeast growth follows exponential patterns until resources limit it' }
  ],
  
  complexPlanePosition: {
    theta: Math.PI / 6,    // Mostly concrete, slightly abstract
    radius: 0.8            // Well-developed concept with deep coverage
  }
};
```

## Implementation Steps

1. Define `CollegeDepartment`, `DepartmentWing`, `LearningPath`, `TrySession` types
2. Implement `CollegeLoader` with three-tier progressive disclosure
3. Implement `explore()` method with observation pipeline integration
4. Implement `crossReference()` for inter-department navigation
5. Create Mathematics Department structure following the filesystem contract
6. Seed 7 initial Math concepts with full panel mappings (exponential decay, trig functions, complex numbers, Euler's formula, ratios, logarithms, fractal geometry)
7. Create Math Department try-sessions ("Your First Function," "The Unit Circle," "Why e Matters")
8. Create DEPARTMENT.md with learning path and department map
9. Verify token budget compliance at each loading tier
10. Write integration tests for exploration and cross-referencing

## Test Cases

| Test | Input | Expected Output |
|------|-------|----------------|
| Summary load | loadSummary('mathematics') | <3K tokens, all wing names, entry point |
| Wing load | loadWing('mathematics', 'calculus') | All calculus concepts, <12K tokens |
| Deep load | loadDeep('mathematics', 'exponential-decay') | Full history, all panels, cross-refs, <5K per concept |
| Exploration | explore('mathematics/calculus/exponential-decay') | Full concept with annotations; observation pipeline triggered |
| Cross-reference | crossReference('mathematics', 'exponential-decay', 'culinary-arts') | Returns cooling-curve analogy |
| Token compliance | Load entire Math summary + one wing | Total < 15K tokens |
| New department | Add stub department with single concept | Loads without modifying framework code |
| Learning path | getLearningPath('mathematics') | Valid ordered path, no missing prerequisites |

## Verification Gate

- [ ] College loader successfully loads Mathematics Department at all three tiers
- [ ] Exploring a concept file teaches both the subject and the system usage
- [ ] Cross-department references resolve correctly
- [ ] Token budget respected at each tier
- [ ] Adding a new department requires only new files, no framework changes
- [ ] All 7 seeded Math concepts have correct panel mappings in Python, C++, Java, and at least 2 heritage panels
- [ ] Try-sessions are completable and educational
- [ ] No type errors

## Safety Boundaries

- Token budget limits are enforced by the loader — requesting more content than the budget allows returns a truncated result with a "load more" indicator, never an overflow
- Concept dependencies must form a DAG (directed acyclic graph) — circular dependencies are detected and rejected at registration time
- Mathematical content must be correct — all code in panel expressions must produce mathematically accurate results when executed
