# Engineering

**Domain:** engineering
**Source:** ENGR-101 Foundational Knowledge Pack
**Status:** Active
**Purpose:** Foundational engineering thinking spanning the design process, materials and structures, mechanisms and systems, prototyping and testing, and engineering ethics -- developing the iterative problem-solving mindset that turns scientific knowledge into solutions

## Wings

- The Engineering Design Process -- Define, research, ideate, prototype, test, and communicate: the iterative design cycle
- Materials & Structures -- Stress, strain, material selection, structural systems, load distribution, failure modes
- Mechanisms & Systems -- Simple machines, gear trains, linkages, hydraulics, feedback and control systems
- Prototyping & Testing -- Rapid prototyping, model making, testing methodology, data collection, failure analysis
- Engineering Ethics & Impact -- Codes of ethics, safety and risk, environmental impact, inclusive design, societal responsibility

## Entry Point

engr-design-cycle

## Concepts

### The Engineering Design Process (4 concepts)
- engr-design-cycle -- The iterative loop: define, research, ideate, prototype, test, and iterate
- engr-problem-definition -- Translating a need into a clear engineering problem statement with constraints and criteria
- engr-ideation-techniques -- Brainstorming, morphological charts, and TRIZ for generating design alternatives
- engr-design-communication -- Engineering drawings, specifications, CAD concepts, and presenting design decisions

### Materials & Structures (4 concepts)
- engr-stress-strain -- Internal forces in materials under load; elastic and plastic deformation
- engr-material-selection -- Matching material properties (strength, density, conductivity) to design requirements
- engr-structural-systems -- Beams, columns, arches, trusses, and how they carry loads to supports
- engr-structural-failure -- Buckling, fatigue, fracture, and learning from engineering failures

### Mechanisms & Systems (4 concepts)
- engr-simple-machines -- Levers, pulleys, inclined planes, screws, wheels, and wedges as force multipliers
- engr-gear-linkage-systems -- Gear ratios, gear trains, four-bar linkages, and cam-follower mechanisms
- engr-fluid-systems -- Pascal's law, hydraulic cylinders, pneumatic actuators, and fluid power
- engr-control-systems -- Open and closed loop control, feedback, sensors, actuators, and PID concepts

### Prototyping & Testing (4 concepts)
- engr-rapid-prototyping -- Low-fidelity models, cardboard prototyping, 3D printing, and iterative making
- engr-testing-methodology -- Defining test criteria, controlling variables, and systematic evaluation
- engr-data-from-experiments -- Collecting, recording, and analyzing physical test data
- engr-failure-analysis -- Why designs fail and how failure teaches better engineering

### Engineering Ethics & Impact (4 concepts)
- engr-codes-of-ethics -- Professional engineering ethics codes and the duty to public safety
- engr-safety-risk -- Risk assessment, factor of safety, and the engineer's responsibility to prevent harm
- engr-environmental-impact -- Life cycle assessment, ecological footprint, and sustainable engineering
- engr-inclusive-design -- Universal design, accessibility, and designing for diverse users

## Cross-references — Adaptive Systems

**Department:** `.college/departments/adaptive-systems/`  
**Connection type:** Advanced treatment bridge — Engineering provides the structural framing (feedback, actuator, sensor, PID); Adaptive Systems Panel B extends it with update laws that make the gain adaptive rather than fixed.

**`engr-control-systems` (Mechanisms & Systems wing).**  
PID control covered in this concept is a fixed-gain regulator: the proportional, integral, and derivative gains are set at design time and held constant. Adaptive Systems Panel B (`B-control-theoretic-roots.md`) is the direct advanced extension: Model-Reference Adaptive Systems (MRAS; Sastry & Bodson 1989 Ch. 3) and self-tuning regulators (Sastry & Bodson 1989 Ch. 5) are closed-loop control systems where the gain parameters update in real time via an outer loop derived from Lyapunov stability arguments (Lyapunov 1892). The progression is: open-loop → closed-loop (PID, covered here) → adaptive-gain closed-loop (MRAS, Panel B). The engineering vocabulary established by this concept — plant, reference, tracking error, actuator, sensor — is the prerequisite for Panel B.

**`engr-failure-analysis` (Prototyping & Testing wing).**  
The robustness theorems of Sastry & Bodson (1989 Ch. 6) provide formal failure-mode bounds for adaptive control: if persistent excitation holds and disturbances are bounded by D, then tracking error is bounded by β·D. This is the formal version of factor-of-safety reasoning: instead of an empirical safety margin, the Lyapunov-derived bound gives a provable upper limit on deviation from the reference. Adaptive Systems Panel B §4 covers this result.

**`engr-testing-methodology` (Prototyping & Testing wing).**  
Kalman filtering (Kalman 1960) is the state-estimation backbone of adaptive control — it provides the minimum-variance estimate of plant state from noisy sensor data. Panel B §1 covers the Kalman filter as the MRAS state estimator, directly extending the sensor-data-collection methodology established in this concept.
