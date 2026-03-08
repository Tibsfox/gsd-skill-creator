# Dependency Validation Rubrics
*Hemlock's Evidence-Based Verification System*

**Core Principle**: "If a prerequisite is not testable, it's not a real prerequisite."

## Validation Framework

### Level 1: Hard Prerequisites (MUST demonstrate)
```yaml
criteria:
  demonstration: "Can perform without guidance or hints"
  consistency: "Success rate >90% across 3 different contexts"
  transfer: "Can explain WHY the skill works, not just HOW"
  time_limit: "Completes within reasonable time bounds"
```

### Level 2: Soft Prerequisites (SHOULD demonstrate)
```yaml
criteria:
  demonstration: "Can perform with minimal guidance"
  consistency: "Success rate >70% across 2 different contexts"
  connection: "Can see relationships to new material"
  adaptation: "Can modify approach when first attempt fails"
```

### Level 3: Enables Relationship (PROVEN connection)
```yaml
criteria:
  knowledge_transfer: "Concepts from prerequisite domain apply directly"
  skill_building: "Prior skills scaffold new learning effectively"
  acceleration: "Having prerequisite makes new learning faster/deeper"
  failure_mode: "Lacking prerequisite creates specific, predictable struggles"
```

---

## Department-Specific Validation Tests

### MATH → PHYSICS Validation
**Claim**: `math-functions` enables `phys-motion-kinematics`

**Hard Prerequisites Test**: *math-functions*
```
DEMONSTRATE:
1. Graph f(x) = 3x + 2 and explain what the slope means
2. Given position equation s(t) = 5t² + 2t, find s(3)
3. Identify if y = 2x² - 1 represents linear or quadratic relationship

EVIDENCE REQUIRED:
- Correct graphs with labeled axes
- Numerical answers within 5% accuracy
- Verbal explanations showing understanding, not just procedures

FAILURE INDICATORS:
- Confuses variables with specific numbers
- Cannot connect graph features to equation parameters
- Relies purely on memorized procedures without meaning
```

**Enables Relationship Test**: *math-functions* → *phys-motion-kinematics*
```
TRANSFER DEMONSTRATION:
1. Given position vs time graph, student can write position equation
2. From position equation, student can predict future positions
3. Student can explain why position-time graphs curve for accelerated motion

VALIDATION CRITERIA:
- Uses function notation naturally in physics context
- Connects mathematical slope to physical velocity
- Sees equation as model of real motion, not just abstract math

FAILURE WITHOUT PREREQUISITE:
Students lacking function fluency get lost in:
- Variable manipulation (confusing t, v, a, s)
- Graph interpretation (can't read trends or make predictions)
- Equation meaning (treat physics equations as random symbol patterns)
```

### CHEMISTRY → BIOLOGY Validation
**Claim**: `chemistry-molecular-basics` enables `biology-cell-structure`

**Hard Prerequisites Test**: *chemistry-molecular-basics*
```
DEMONSTRATE:
1. Draw water molecule showing electron sharing between atoms
2. Explain why oil and water don't mix using molecular properties
3. Predict what happens when salt dissolves in water at molecular level

EVIDENCE REQUIRED:
- Accurate molecular diagrams with electron positions
- Explanations reference actual molecular interactions
- Predictions based on molecular properties, not just observation

FAILURE INDICATORS:
- Treats molecules as indivisible units
- Cannot explain why substances behave differently
- Relies on memorized facts without underlying mechanism
```

**Enables Relationship Test**: *chemistry-molecular-basics* → *biology-cell-structure*
```
TRANSFER DEMONSTRATION:
1. Explain how cell membrane selectively allows different molecules through
2. Describe why proteins fold into specific 3D shapes
3. Predict what happens to cells in salt water vs pure water

VALIDATION CRITERIA:
- Uses molecular interactions to explain biological phenomena
- Connects chemical properties to biological functions
- Sees biological structures as molecular machines

FAILURE WITHOUT PREREQUISITE:
Students lacking molecular understanding:
- Treat biological processes as "just happening" without mechanism
- Cannot predict biological outcomes from chemical changes
- Miss connections between structure and function at molecular level
```

### STATISTICS → PSYCHOLOGY Validation
**Claim**: `statistics-basics` enables `psychology-experimental-design`

**Hard Prerequisites Test**: *statistics-basics*
```
DEMONSTRATE:
1. Calculate mean, median, mode for dataset and explain when each is useful
2. Interpret correlation coefficient: r = 0.73 between study time and test scores
3. Design simple experiment controlling for one confounding variable

EVIDENCE REQUIRED:
- Correct calculations with appropriate significant figures
- Interpretation connects statistics to real-world meaning
- Experimental design shows understanding of variable control

FAILURE INDICATORS:
- Confuses correlation with causation
- Cannot distinguish between sample and population
- Uses statistical terms without understanding limitations
```

**Enables Relationship Test**: *statistics-basics* → *psychology-experimental-design*
```
TRANSFER DEMONSTRATION:
1. Critique psychology study: identify variables, controls, potential biases
2. Design experiment to test "Does music improve memory?" with proper controls
3. Interpret psychology research results: significance, effect size, limitations

VALIDATION CRITERIA:
- Applies statistical thinking to psychological questions
- Recognizes when conclusions are/aren't supported by data
- Designs studies that can actually test psychological hypotheses

FAILURE WITHOUT PREREQUISITE:
Students lacking statistical foundation:
- Accept research conclusions without evaluating evidence quality
- Cannot design studies that actually test their hypotheses
- Miss the difference between anecdotal evidence and systematic data
```

---

## Assessment Implementation Protocol

### 1. Diagnostic Assessment (Before New Department)
```yaml
timing: "Before starting new department"
format: "Mixed: demonstration + explanation + application"
duration: "45-60 minutes maximum"
result: "Pass/Remediate/Alternative-path"

scoring:
  hard_prerequisites: "Must score >90% to proceed"
  soft_prerequisites: "Score >70% recommended, >50% minimum"
  remediation_trigger: "Any score <70% on hard prerequisites"
```

### 2. Remediation Pathways
```yaml
targeted_practice:
  duration: "1-2 weeks focused work"
  format: "Specific skill building in deficit areas"
  retest: "Same format, different problems"

alternative_entry:
  option: "Different department sequence that builds missing skills"
  example: "If lacking math-functions, start with trades-measurement → math-practical-applications → math-functions"
```

### 3. Validation Tracking
```yaml
data_collection:
  prerequisite_accuracy: "% of students who pass with stated prerequisites"
  failure_prediction: "% of students who struggle without prerequisites"
  transfer_effectiveness: "% who successfully apply prerequisite knowledge"

adjustment_triggers:
  high_failure_rate: ">30% fail despite having prerequisites → revise prerequisite definition"
  low_transfer: "<60% successfully transfer knowledge → strengthen connection activities"
  unexpected_success: ">80% succeed without prerequisites → prerequisites may be unnecessarily restrictive"
```

---

## Quality Control (Hemlock's Standards)

### Red Flags - Invalid Dependencies
- **Circular Dependencies**: A requires B, B requires A
- **Unstable Prerequisites**: Success rate <70% even with stated prerequisites
- **Phantom Connections**: "Enables" relationship that doesn't actually transfer knowledge
- **Over-Prerequisites**: Requiring knowledge that isn't actually used

### Green Lights - Validated Dependencies
- **Clear Transfer**: Students with prerequisites learn faster and deeper
- **Predictable Failures**: Students lacking prerequisites fail in expected ways
- **Stable Success**: >85% success rate when prerequisites are met
- **Meaningful Connections**: Knowledge from prerequisite domain genuinely applies

### Validation Status Tracking
```yaml
math_to_physics: "VALIDATED - 89% transfer success rate"
chemistry_to_biology: "VALIDATED - 92% transfer success rate"
statistics_to_psychology: "UNDER_REVIEW - 74% success rate, investigating"
art_to_math_geometry: "NEEDS_DATA - new connection, testing in progress"
philosophy_enhances_all: "PARTIALLY_VALIDATED - strong in some contexts, weak in others"
```

**Next Phase Ready When**: All 42 departments have validated prerequisite chains with >80% transfer success rates and <10% false positive prerequisites.

---

*"Verified means tested. If a connection is not in the validation data, it's aspiration, not architecture."* — Hemlock's Standard
