# HD-10: Koopman Operator Theory

## The Koopman Operator

The Koopman operator K acts on **observable functions** rather than state
vectors. If F is a dynamical system (x_{n+1} = F(x_n)), and g is any
scalar-valued observable, then:

    Kg(x) = g(F(x))

The operator K is **infinite-dimensional** but **linear** — this is the
key insight. Even when F is highly nonlinear, K acts linearly on the
space of all observables. We trade a finite-dimensional nonlinear problem
for an infinite-dimensional linear one.

## Eigenfunctions and Eigenvalues

An eigenfunction phi of the Koopman operator satisfies:

    phi(F(x)) = lambda * phi(x)

where lambda is the corresponding eigenvalue. Applying F maps phi to a
scalar multiple of itself — the eigenfunction "factors out" the dynamics
into simple exponential growth or decay: phi(F^n(x)) = lambda^n * phi(x).

## Connection to Holomorphic Dynamics

For the squaring map f(z) = z^2 on the complex plane, the monomial
z^n is a Koopman eigenfunction:

    z^n -> (z^2)^n = z^{2n} = (z^n)^2

with eigenvalue 2^n. More generally, for a holomorphic map f with a
fixed point z* and multiplier lambda = f'(z*), the Koopman eigenvalues
near z* are powers of lambda. The Koopman eigenvalues are the
**geometric multipliers** of the holomorphic dynamics — connecting
HD-02 fixed-point classification to data-driven spectral analysis.

## Extended Dynamic Mode Decomposition (EDMD)

EDMD approximates the Koopman operator from data by **lifting** the
state into a higher-dimensional space of observables (the dictionary):

1. **Choose a dictionary** of observable functions psi_1, psi_2, ..., psi_p.
   Common choices: polynomials, radial basis functions, Fourier modes.
2. **Lift the data:** Evaluate each dictionary function on every state
   snapshot to form the lifted matrices Psi(X) and Psi(X').
3. **Approximate K:** Compute K_approx = Psi(X') * Psi(X)^+
   (pseudoinverse), a finite p x p matrix that approximates the
   infinite-dimensional Koopman operator in the dictionary subspace.
4. **Analyze eigenvalues:** The eigenvalues of K_approx approximate
   true Koopman eigenvalues; eigenvectors give approximate eigenfunctions.

The dictionary acts as a **lifting trick**: nonlinear dynamics in state
space become (approximately) linear dynamics in observable space, letting
us apply DMD (HD-09) to the lifted coordinates.

## EDMD and Bounded Learning

Koopman modes that grow (|lambda| > 1) correspond to unstable behaviors
in the underlying system. In the skill-creator context, a growing Koopman
mode signals that a skill's activation pattern is diverging — the analog
of a repelling fixed point (HD-02).

The piDMD constraint from HD-09 carries over: capping eigenvalue magnitude
enforces bounded learning. If EDMD yields an eigenvalue with |lambda| > 1
plus a bounded learning margin, the mode is flagged for review — mirroring
the 20% content-change limit in skill-creator's refinement cycle.

## Practical Use

Koopman analysis lets us **predict skill behavior from observations**
without knowing the exact evolution law. Given a history of skill
activations, EDMD lifts the observations into a rich dictionary space,
extracts the dominant Koopman modes, and projects forward. Decaying modes
indicate convergent learning; persistent modes indicate stable mastery;
growing modes indicate instability requiring intervention.
