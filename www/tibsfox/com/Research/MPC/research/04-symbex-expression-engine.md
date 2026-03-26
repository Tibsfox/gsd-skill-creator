# SYMBEX -- Symbolic Expression Evaluator

> **Domain:** Symbolic-to-GPU Compilation
> **Module:** 4 -- SYMBEX: The Symbolic Expression Evaluator
> **Through-line:** *SYMBEX bridges symbolic mathematics with GPU execution. A mathematical expression defined in the skill-creator's Math Department can be compiled into a CUDA kernel and evaluated across thousands of parameter values simultaneously. The Rosetta Panel becomes executable.*

---

## Table of Contents

1. [The Symbolic-Numerical Bridge](#1-the-symbolic-numerical-bridge)
2. [Expression Tree Compilation](#2-expression-tree-compilation)
3. [The JIT Pipeline](#3-the-jit-pipeline)
4. [Connection to The Space Between](#4-connection-to-the-space-between)
5. [Identity Verification](#5-identity-verification)
6. [Performance Characteristics](#6-performance-characteristics)
7. [Cross-References](#7-cross-references)
8. [Sources](#8-sources)

---

## 1. The Symbolic-Numerical Bridge

SYMBEX is the most novel chip in the Math Co-Processor -- it bridges two traditionally separate worlds [1]:

- **Computer algebra systems** (Mathematica, SymPy, Maple): manipulate expressions symbolically, producing exact results but running on CPU at interpreter speed
- **GPU compute libraries** (cuBLAS, cuFFT): execute numerical operations at hardware speed but require pre-compiled kernels

SYMBEX takes symbolic expressions, compiles them into CUDA kernels at runtime, and evaluates them across parameter spaces on the GPU. The expression retains its symbolic structure (for display, differentiation, simplification) while executing at GPU speed [1].

---

## 2. Expression Tree Compilation

The SymPhas 2.0 project demonstrates that symbolic mathematical expressions can be compiled into optimized CUDA kernels using C++ template metaprogramming [2]:

### 2.1 The Template Approach

The expression tree is represented as nested template types:

```
Expression: sin(x)^2 + cos(x)^2

Template tree:
  Add<
    Pow<Sin<Var<X>>, Const<2>>,
    Pow<Cos<Var<X>>, Const<2>>
  >
```

The compiler generates specialized kernel code for each unique expression structure. This achieves performance comparable to hand-written kernels while preserving the symbolic structure [2].

### 2.2 Advantages

- No runtime interpretation overhead
- Compiler optimizations apply (constant folding, common subexpression elimination)
- The symbolic form and compiled form coexist
- Cache the compiled kernel for repeated evaluations

---

## 3. The JIT Pipeline

For SYMBEX, the SymPhas approach is adapted to JIT (Just-In-Time) compilation [1][2]:

### 3.1 Compilation Workflow

1. **Define:** Claude or skill-creator's Math Department defines an expression as an abstract syntax tree (AST)
2. **Translate:** SYMBEX converts the AST into CUDA C++ source code
3. **Compile:** NVRTC (NVIDIA Runtime Compilation) compiles to PTX (NVIDIA's virtual ISA)
4. **Load:** The compiled kernel is loaded into the CUDA context
5. **Execute:** The kernel evaluates the expression across a parameter space
6. **Cache:** The compiled kernel is cached to disk for future sessions

### 3.2 Cache Strategy

- First evaluation: includes compilation time (~100-200 ms for typical expressions)
- Subsequent evaluations: kernel loaded from cache, execution only (~1-10 ms)
- Cache keyed on expression structure hash -- structurally identical expressions share compiled kernels
- Cache directory: `.chipset/symbex-cache/`

---

## 4. Connection to The Space Between

The eight-layer mathematical progression defined in The Space Between textbook seeds the SYMBEX operation library [1]:

| Layer | Mathematical Concept | SYMBEX Application |
|-------|---------------------|-------------------|
| 1 | Unit circle, trigonometric identities | Identity verification across theta |
| 2 | Vectors, dot/cross products | Batch vector operations |
| 3 | Complex numbers, Euler's formula | Complex exponential evaluation |
| 4 | Calculus, derivatives, integrals | Numerical differentiation/integration |
| 5 | Linear algebra, matrix operations | Deferred to ALGEBRUS |
| 6 | Differential equations | Numerical ODE solving |
| 7 | Fourier analysis | Deferred to FOURIER |
| 8 | Statistical distributions | Deferred to STATOS |

SYMBEX handles Layers 1-4 and 6 natively; Layers 5, 7, and 8 are dispatched to their specialized chips [1].

---

## 5. Identity Verification

The canonical use case: verifying mathematical identities across their domain [1]:

### 5.1 Example: Unit Circle Identity

Expression: sin^2(theta) + cos^2(theta) = 1

SYMBEX workflow:
1. Compile `sin(x)*sin(x) + cos(x)*cos(x)` into a CUDA kernel
2. Evaluate at 10,000 uniformly spaced theta values from 0 to 2*pi
3. Check that all 10,000 results equal 1.0 within floating-point tolerance
4. Report: identity verified across domain, maximum deviation from 1.0 = 2.2e-16 (double precision machine epsilon)

### 5.2 Batch Identity Verification

Multiple identities can be verified in parallel. The Math Department's collection of identities becomes a test suite that SYMBEX executes on the GPU, producing a verification report [1].

---

## 6. Performance Characteristics

| Operation | First Call (JIT) | Cached Call | Batch Size |
|-----------|-----------------|-------------|-----------|
| Simple expression (sin^2 + cos^2) | ~150 ms | ~2 ms | 10,000 points |
| Moderate expression (Taylor series) | ~200 ms | ~5 ms | 100,000 points |
| Complex expression (PDE right-hand side) | ~300 ms | ~10 ms | 1,000,000 points |

The JIT cost is paid once per unique expression. For expressions that recur (which mathematical identities and standard functions do), the amortized cost is negligible [1][2].

---

## 7. Cross-References

| Project | Connection |
|---------|------------|
| [CMH](../CMH/index.html) | CUDA compilation infrastructure; NVRTC as the JIT compiler for GPU kernels |
| [GRD](../GRD/index.html) | Symbolic gradient expressions compiled to CUDA for high-performance gradient evaluation |
| [BPS](../BPS/index.html) | Sensor calibration curves expressed symbolically and evaluated at GPU speed |
| [ECO](../ECO/index.html) | Ecological growth models (logistic, Lotka-Volterra) as SYMBEX expressions |
| [GSD2](../GSD2/index.html) | Skill-creator Math Department as the source of SYMBEX expression definitions |

---

## 8. Sources

1. [GSD Math Co-Processor Vision -- SYMBEX Design](../../index.html)
2. [SymPhas 2.0 -- Symbolic-to-CUDA Expression Compilation | GitHub](https://github.com/SoftSimu/SymPhas)
3. [NVIDIA NVRTC -- Runtime Compilation](https://docs.nvidia.com/cuda/nvrtc/)
