# Classical Pseudorandom Number Generators

*The algorithms that powered scientific computing for four decades*

---

From the earliest days of electronic computation, deterministic algorithms that produce sequences *appearing* random have been indispensable. Monte Carlo simulations, cryptographic key generation, statistical sampling, game engines, and numerical integration all depend on fast, reproducible streams of pseudorandom numbers. This document surveys the major families of classical pseudorandom number generators (PRNGs) — the workhorses that carried scientific and industrial computing from the 1960s through the early 2000s, many of which remain embedded in production systems today.

---

## 1. Linear Congruential Generators

The linear congruential generator (LCG), introduced by D.H. Lehmer in 1949, is the oldest and most widely studied PRNG family. Its recurrence is deceptively simple:

```
X_{n+1} = (a * X_n + c) mod m
```

where `a` is the multiplier, `c` is the increment, `m` is the modulus, and `X_0` is the seed. When `c = 0`, the generator is called a *multiplicative* congruential generator (MCG); when `c > 0`, it is a *mixed* congruential generator.

### The Hull-Dobell Theorem

The central question for any LCG is: under what conditions does the generator achieve full period — that is, visit all `m` residues before repeating? Hull and Dobell (1962) proved the necessary and sufficient conditions for a mixed LCG to have period exactly `m`:

1. `c` and `m` are coprime: `gcd(c, m) = 1`
2. `a - 1` is divisible by every prime factor of `m`
3. If `m` is divisible by 4, then `a - 1` is divisible by 4

When `m = 2^k` (a power of two, the most common choice for efficiency on binary hardware), these conditions reduce to: `c` must be odd, and `a mod 4 = 1`.

For multiplicative generators (`c = 0`), full period is impossible when `m` is a power of two — the maximum period is `m/4`. This is why MCGs typically use a prime modulus, most famously `m = 2^31 - 1 = 2147483647` (a Mersenne prime), where the maximum period is `m - 1`.

### Knuth's Analysis

Donald Knuth devoted over 180 pages of *The Art of Computer Programming, Volume 2: Seminumerical Algorithms* to the theory of LCGs. His treatment remains the definitive reference. Key contributions include:

- **The spectral test** — Knuth formalized the spectral test as the primary quality measure for LCGs. The test computes the maximum distance between adjacent hyperplanes in the lattice structure of d-dimensional output tuples. For an LCG with modulus `m`, every set of `d`-dimensional output tuples `(X_n, X_{n+1}, ..., X_{n+d-1})` falls on at most `m^{1/d}` parallel hyperplanes in `[0, m)^d`. A good multiplier minimizes the gap between these hyperplanes; a bad one produces visible lattice structure. The spectral test gives a single figure of merit for each dimension — an LCG that scores well in dimensions 2 through 6 produces output that fills the space relatively uniformly, while one that scores poorly (like RANDU in dimension 3) produces visible stripes.

- **The potency** — Knuth defined the potency of an LCG as the smallest `s` such that `(a - 1)^s ≡ 0 (mod m)`. Higher potency correlates with better spectral test results. He recommended potency at least 5.

- **Bit-level correlation** — Knuth showed that the low-order bits of an LCG with power-of-two modulus have devastatingly short periods. Bit `k` (counting from 0) has period at most `2^{k+1}`. The least significant bit alternates between 0 and 1 — a catastrophic deficiency for any application that extracts randomness from low bits. The standard mitigation is to discard the low bits: the glibc implementation of `rand()` right-shifts by 16 and returns the upper 15 bits. The better solution is a prime modulus (like MINSTD's `2^31 - 1`), which does not suffer from low-bit periodicity.

### Notable Constants

| Name | a | c | m | Period | Source |
|------|---|---|---|--------|--------|
| MINSTD | 16807 | 0 | 2^31 - 1 | 2^31 - 2 | Park & Miller (1988) |
| MINSTD revised | 48271 | 0 | 2^31 - 1 | 2^31 - 2 | Park, Miller & Stockmeyer (1993) |
| Numerical Recipes | 1664525 | 1013904223 | 2^32 | 2^32 | Press et al. |
| Borland C/C++ | 22695477 | 1 | 2^32 | 2^32 | Borland |
| glibc | 1103515245 | 12345 | 2^31 | 2^31 | POSIX |
| MMIX | 6364136223846793005 | 1442695040888963407 | 2^64 | 2^64 | Knuth |
| Java `java.util.Random` | 25214903917 | 11 | 2^48 | 2^48 | Sun Microsystems |
| RANDU | 65539 | 0 | 2^31 | 2^29 | IBM (1960s) |

The Knuth MMIX multiplier deserves special attention. Knuth selected `6364136223846793005` through extensive spectral testing — it minimizes the worst-case lattice figure of merit across dimensions 2 through 8. This multiplier has been independently validated by L'Ecuyer's tables of good LCG parameters.

**RANDU** deserves special mention as a cautionary tale. IBM distributed it widely in the 1960s, and its multiplier `a = 65539 = 2^16 + 3` produces catastrophic correlation: consecutive triples `(X_n, X_{n+1}, X_{n+2})` fall on only 15 parallel planes in three-dimensional space. The relation `X_{n+2} = 6 * X_{n+1} - 9 * X_n (mod 2^31)` is easily verified algebraically. Decades of scientific simulations were contaminated by RANDU's pathological structure before the community recognized the problem. Knuth called it "truly horrible." Marsaglia's 1968 paper *"Random Numbers Fall Mainly in the Planes"* was partly inspired by RANDU's failure and established the theoretical framework for understanding why all LCG outputs have hyperplane structure — the only question is how many planes and how far apart.

### Pseudocode

```
function lcg(seed, a, c, m):
    state = seed
    loop:
        state = (a * state + c) mod m
        yield state
```

For the common case `m = 2^k`, the modular reduction is free — unsigned integer overflow on a `k`-bit register performs the operation implicitly. This extreme efficiency is why LCGs dominated early computing despite their statistical limitations.

### Strengths and Weaknesses

LCGs are fast (a single multiply-add), have minimal state (one integer), and are trivially reproducible. But their lattice structure is inherent and irreducible: all `d`-tuples of consecutive outputs lie on a lattice in `d`-dimensional space. No choice of constants can eliminate this — only minimize its visibility. For dimensions above about 6, even the best LCG constants produce detectable structure in moderate sample sizes. The spectral test measures how bad the lattice is, but cannot make it go away.

---

## 2. Linear Feedback Shift Registers

A linear feedback shift register (LFSR) generates pseudorandom bits by shifting a binary register and computing a new input bit as a linear function (XOR) of selected register positions called *taps*. LFSRs are rooted in the algebra of polynomials over GF(2), the finite field with elements {0, 1}.

### Fibonacci Form

In the Fibonacci LFSR, the new bit enters at one end and is computed from taps at fixed positions:

```
function lfsr_fibonacci(state, taps, n_bits):
    loop:
        feedback = 0
        for t in taps:
            feedback = feedback XOR bit(state, t)
        state = (state >> 1) OR (feedback << (n_bits - 1))
        yield state
```

The register contents shift right; the feedback bit enters at the most significant position.

### Galois Form

The Galois LFSR is mathematically equivalent but computes differently — feedback is applied at the tap positions simultaneously during the shift, rather than being combined into a single bit:

```
function lfsr_galois(state, polynomial_mask, n_bits):
    loop:
        lsb = state AND 1
        state = state >> 1
        if lsb:
            state = state XOR polynomial_mask
        yield state
```

The Galois form is typically faster in software because it avoids the multi-tap XOR reduction — the conditional XOR with the polynomial mask accomplishes the same feedback in a single operation. In hardware (FPGAs, ASICs), the Galois form requires only one XOR gate per tap, with all gates operating in the same clock cycle.

### Connection to GF(2) Polynomials

An LFSR with `n` bits and taps at positions `t_1, t_2, ..., t_k` corresponds to the characteristic polynomial:

```
p(x) = x^n + x^{t_k} + ... + x^{t_1} + 1
```

over GF(2). The LFSR achieves maximal length — a period of `2^n - 1`, visiting every nonzero state exactly once — if and only if `p(x)` is a *primitive polynomial* over GF(2). The state of all zeros is a fixed point and must be excluded.

Notable primitive polynomials and their tap positions:

| Bits | Polynomial | Taps | Period |
|------|-----------|------|--------|
| 7 | x^7 + x^6 + 1 | [7, 6] | 127 |
| 15 | x^15 + x^14 + 1 | [15, 14] | 32,767 |
| 16 | x^16 + x^15 + x^13 + x^4 + 1 | [16, 15, 13, 4] | 65,535 |
| 23 | x^23 + x^18 + 1 | [23, 18] | 8,388,607 |
| 31 | x^31 + x^28 + 1 | [31, 28] | 2^31 - 1 |
| 32 | x^32 + x^22 + x^2 + x + 1 | [32, 22, 2, 1] | 2^32 - 1 |
| 64 | x^64 + x^62 + x^61 + x + 1 | [64, 62, 61, 1] | 2^64 - 1 |

Two-tap polynomials (trinomials) are preferred in hardware because they require only a single XOR gate in the feedback path, but they are rarer among primitive polynomials and their statistical properties are sometimes inferior to multi-tap alternatives.

### Maximal-Length Sequence Properties

A maximal-length LFSR sequence (m-sequence) of period `L = 2^n - 1` has remarkable autocorrelation properties that approach those of true white noise. The normalized autocorrelation function is:

- `R(0) = 1` (perfect self-correlation at zero lag)
- `R(k) = -1/L` for all other lags `k = 1, 2, ..., L-1`

This near-ideal autocorrelation makes m-sequences invaluable for spread-spectrum communications, radar ranging, and synchronization. The GPS C/A code, for example, uses a pair of 10-bit LFSRs with taps [10, 3] and [10, 9, 8, 6, 3, 2] to generate Gold codes — pairs of m-sequences combined by XOR to produce code families with bounded cross-correlation.

### The Xorshift Insight

George Marsaglia (2003) observed that three successive XOR-shift operations — `x ^= x << a; x ^= x >> b; x ^= x << c` — implement a product of three LFSR-like transformation matrices over GF(2). By choosing the shift constants carefully, the composite transformation can have a primitive characteristic polynomial, yielding a maximal-period generator with extremely fast software execution (three shifts and three XORs, no multiplication).

Marsaglia's `xorshift32` with constants (13, 17, 5):

```
function xorshift32(state):
    loop:
        state = state XOR (state << 13)
        state = state XOR (state >> 17)
        state = state XOR (state << 5)
        yield state
```

Period: `2^32 - 1`. The zero state is again a fixed point. While xorshift generators are fast and simple, they have linear dependencies (they are GF(2)-linear) and fail certain statistical tests, notably the binary-rank and linear-complexity tests. This motivated the later development of scrambled variants like xorshift128+ and xoshiro, which apply a nonlinear output function to mask the linearity.

### Hardware Applications

LFSRs are ubiquitous in hardware:

- **CRC computation** — CRC-32 (Ethernet, ZIP, PNG) uses the polynomial x^32 + x^26 + x^23 + x^22 + x^16 + x^12 + x^11 + x^10 + x^8 + x^7 + x^5 + x^4 + x^2 + x + 1. The LFSR structure makes hardware implementation trivial.
- **Scrambling in telecommunications** — DVB, Wi-Fi (802.11), Bluetooth, SONET all use LFSRs to whiten data streams. Bluetooth uses x^7 + x^4 + 1.
- **Built-in self-test (BIST)** — Chip manufacturers use LFSRs for manufacturing defect detection. An LFSR generates pseudo-exhaustive test patterns while another LFSR compresses the output into a signature.
- **Spread-spectrum systems** — GPS, CDMA, and military communications rely on LFSR-generated pseudo-noise codes for signal spreading, synchronization, and multiple-access.
- **Stream ciphers** — The A5/1 cipher (GSM mobile encryption, 1987-2010s) combined three irregularly clocked LFSRs of lengths 19, 22, and 23 bits.

---

## 3. Mersenne Twister (MT19937)

Published by Makoto Matsumoto and Takuji Nishimura in 1998, the Mersenne Twister became the default PRNG in an extraordinary number of languages and libraries: Python's `random`, Ruby's `Kernel#rand`, R's default RNG, PHP's `mt_rand`, MATLAB's `rand`, NumPy's legacy `RandomState`, GCC's `std::mt19937`, and many others. Its dominance lasted roughly two decades.

### Design

MT19937 is a twisted generalized feedback shift register (TGFSR) with a state of 624 32-bit words (19,968 bits total, with effective state size 19,937 bits — hence the name, as `2^19937 - 1` is a Mersenne prime). The period is `2^19937 - 1`, approximately `4.3 × 10^6001`.

The twist matrix A has the rational normal form:

```
A = | 0      I_{31} |
    | a_31           |
```

where `I_{31}` is the 31×31 identity matrix and `a_31 = 0x9908B0DF` is the bottom row. The effect of multiplying a 32-bit vector by A is: shift right by 1, and if the lowest bit was 1, XOR with `0x9908B0DF`.

The state array `MT[0..623]` is advanced by the *twist* transformation:

```
function twist(MT):
    for i from 0 to 623:
        x = (MT[i] AND 0x80000000) OR (MT[(i + 1) mod 624] AND 0x7FFFFFFF)
        xA = x >> 1
        if x is odd:
            xA = xA XOR 0x9908B0DF
        MT[i] = MT[(i + 397) mod 624] XOR xA
```

The upper bit of `MT[i]` is concatenated with the lower 31 bits of `MT[i+1]` to form `x`, which is then multiplied by matrix A. The offset 397 is a carefully chosen parameter that, together with the twist matrix, ensures the characteristic polynomial of the entire state transition is primitive over GF(2) with degree 19937.

### The Tempering Transform

The raw state bits have poor equidistribution in their lower bits (a consequence of the GF(2)-linear structure). Matsumoto and Nishimura applied an invertible *tempering* transformation to each output word to improve the bit-level distribution:

```
function temper(y):
    y = y XOR (y >> 11)
    y = y XOR ((y << 7) AND 0x9D2C5680)
    y = y XOR ((y << 15) AND 0xEFC60000)
    y = y XOR (y >> 18)
    return y
```

These four operations — two right-shifts with XOR and two masked left-shifts with XOR — are an invertible linear transformation over GF(2). The constants `0x9D2C5680` and `0xEFC60000` were optimized by exhaustive search to maximize the k-distribution properties of the output. The invertibility of the tempering is critical: it means the transformation is a bijection on 32-bit words, so it preserves the period and equidistribution guarantees of the underlying TGFSR. It also means that, given the tempered output, the untempered state word can be recovered — which is why observing 624 consecutive outputs allows full state reconstruction.

### Complete Pseudocode

```
constants:
    n = 624                        // state size in words
    m = 397                        // shift offset
    MATRIX_A   = 0x9908B0DF        // twist matrix constant
    UPPER_MASK = 0x80000000        // most significant bit
    LOWER_MASK = 0x7FFFFFFF        // least significant 31 bits

state:
    MT[0..n-1]                     // state array
    index = n + 1                  // force twist on first use

function seed_mt(seed):
    MT[0] = seed AND 0xFFFFFFFF
    for i from 1 to n-1:
        MT[i] = (1812433253 * (MT[i-1] XOR (MT[i-1] >> 30)) + i) AND 0xFFFFFFFF
    index = n

function generate_twist():
    for i from 0 to n-1:
        x = (MT[i] AND UPPER_MASK) OR (MT[(i+1) mod n] AND LOWER_MASK)
        xA = x >> 1
        if x mod 2 != 0:
            xA = xA XOR MATRIX_A
        MT[i] = MT[(i + m) mod n] XOR xA
    index = 0

function extract_number():
    if index >= n:
        generate_twist()

    y = MT[index]
    y = y XOR (y >> 11)                          // tempering shift u
    y = y XOR ((y << 7) AND 0x9D2C5680)          // tempering shift s
    y = y XOR ((y << 15) AND 0xEFC60000)         // tempering shift t
    y = y XOR (y >> 18)                          // tempering shift l

    index = index + 1
    return y AND 0xFFFFFFFF
```

The initialization constant `1812433253` (sometimes written as `0x6C078965`) seeds the state array from a single 32-bit seed using a multiplicative hash that decorrelates adjacent entries. Matsumoto later published an improved initialization using an array of seeds to provide more than 32 bits of seeding entropy.

### 623-Dimensional Equidistribution

MT19937 is *k-distributed to 32-bit accuracy* for all `k` from 1 to 623. This means that in the full period of `2^19937 - 1` outputs, every possible 32-bit value appears equally often in every window of `k` consecutive outputs (with the all-zero tuple appearing one fewer time). No generator before or since has matched this equidistribution at this state size. The property is verified by the lattice reduction algorithm described in Matsumoto and Nishimura's original paper.

To appreciate the scale: 623-dimensional equidistribution means that if you partition the output sequence into blocks of 623 consecutive 32-bit values, every possible 623-tuple (a point in a space of 2^19936 possibilities) appears with equal frequency. For comparison, a 32-bit LCG is equidistributed only in 1 dimension.

### Why It Dominated

MT19937 offered a compelling combination for its era:

- **Enormous period.** `2^19937 - 1` has 6,002 decimal digits. No simulation will exhaust this period. Running MT on every computer on Earth, generating a billion numbers per second, for the lifetime of the universe, would not exhaust a single MT sequence.
- **Proven equidistribution.** 623-dimensional equidistribution with 32-bit accuracy was qualitatively superior to any prior generator.
- **Acceptable speed.** The twist processes 624 words in bulk (amortized over 624 outputs), and the tempering requires only shifts, masks, and XORs — no multiplication.
- **Free implementation.** Matsumoto and Nishimura released a clean, unpatented, BSD-licensed C implementation. Language standard libraries adopted it aggressively.
- **Diehard compliance.** MT19937 passed Marsaglia's Diehard battery (1995), the standard benchmark of its era.

### Weaknesses

Despite its long reign, MT19937 has significant limitations:

- **Predictability.** Observing 624 consecutive 32-bit outputs suffices to recover the entire state, because the tempering transform is invertible. The generator is completely unsuitable for any security application — not just cryptography, but also online poker, lottery systems, and session token generation.

- **Slow startup.** When seeded with low-entropy input (e.g., a single integer), the initial state has strong correlations that persist for hundreds of outputs. The `seed_mt` function's linear recurrence does not diffuse entropy well. This is fundamental to the GF(2)-linear structure.

- **Large state.** 2,496 bytes (624 × 4) per instance is prohibitive when many independent streams are needed (per-thread or per-particle generators in GPU simulations). By comparison, xoshiro256** uses 32 bytes.

- **Fails BigCrush.** L'Ecuyer and Simard's TestU01 BigCrush battery (2007) exposed systematic failures, particularly in linear complexity tests. The generator's GF(2)-linearity means it fails any test sensitive to linear structure over the binary field.

- **Not parallelizable.** The 624-word state and global index make MT19937 awkward for SIMD or GPU implementation. Creating independent parallel streams requires the Dynamic Creator extension (dcmt), which is complex and slow to initialize.

---

## 4. Lagged Fibonacci Generators

Lagged Fibonacci generators (LFGs) generalize the Fibonacci recurrence by using two *lag* values and a binary operation:

```
S_n = S_{n-j} ⊕ S_{n-k}    (mod m, if applicable)
```

where `j < k` are the lags, and `⊕` is one of addition, subtraction, multiplication, or XOR. The state consists of the `k` most recent values, forming a sliding window over the sequence history.

### Variants by Operation

| Operation | Notation | Maximum Period | Notes |
|-----------|----------|---------------|-------|
| Addition mod 2^w | ALFG | (2^k - 1) × 2^{w-1} | Most common. Good equidistribution. |
| Subtraction mod 2^w | SLFG | (2^k - 1) × 2^{w-1} | Equivalent to ALFG up to sign. |
| Multiplication mod 2^w | MLFG | (2^k - 1) × 2^{w-3} | Odd terms only. Better randomness properties. |
| XOR | XLFG | 2^k - 1 | GF(2)-linear. Shorter period. Weakest variant. |

### Lag Selection

The lags `(j, k)` must be chosen so that the characteristic polynomial `x^k + x^{k-j} + 1` is primitive over GF(2) (for XOR variants) or has the analogous property over the integers (for additive/multiplicative variants). Well-known lag pairs include:

| (j, k) | Period bits (additive, 32-bit words) | Source |
|---------|--------------------------------------|--------|
| (24, 55) | ~86 | Knuth (1969), Mitchell & Moore |
| (38, 89) | ~120 | Marsaglia |
| (97, 127) | ~158 | Marsaglia |
| (168, 521) | ~552 | Luscher/RANLUX predecessor |
| (37, 100) | ~131 | Ziff (1998) |

The lag pair (24, 55) is the oldest and most famous. Knuth analyzed it extensively. The state requires 55 words — modest by modern standards. It was widely used in Fortran numerical libraries (e.g., Cray's RANF).

### Statistical Quality

Additive LFGs have better statistical properties than LFSRs or XOR-based LFGs because the carry propagation in integer addition introduces nonlinearity. However, they still exhibit correlations at the lag distance: the value `S_n` is directly computed from `S_{n-j}` and `S_{n-k}`, which means tests examining those specific distances can detect structure. Multiplicative LFGs have superior randomness properties because multiplication introduces stronger nonlinear mixing, but the restriction to odd terms (the least significant bit is always 1 when multiplying two odd numbers) requires masking or post-processing.

### RANLUX: Decimation for Quality

Lagged Fibonacci generators achieved their greatest success in the form of RANLUX (Luscher, 1994), which applied a *luxury* decimation — systematically discarding most outputs to break the lag-distance correlations. RANLUX at luxury level 4 discards 365 of every 389 generated values, reducing throughput dramatically but achieving provably good statistical quality via a connection to the chaotic dynamics of the subtract-with-borrow variant. Martin Luscher proved that the discarded outputs carry away the short-range correlations, leaving a sequence whose distribution converges to uniform as the luxury level increases. RANLUX was the generator of choice for lattice QCD simulations at CERN through the 2000s.

---

## 5. Combined Generators

Pierre L'Ecuyer pioneered the systematic combination of multiple short-period generators to produce a composite generator with a much longer period and better statistical properties. The core insight is that if two independent generators with coprime periods `p_1` and `p_2` are combined (typically by addition or subtraction modulo some value), the resulting generator has period `lcm(p_1, p_2) ≈ p_1 × p_2`.

### Theory of Combination

The theoretical foundation rests on the Chinese Remainder Theorem and the structure of combined linear recurrences. If generator 1 has state space `Z_{m_1}` and generator 2 has state space `Z_{m_2}` with `gcd(m_1, m_2) = 1`, then the combined state space is isomorphic to `Z_{m_1 × m_2}`. The combination by subtraction (or XOR) ensures that correlations present in individual components are disrupted in the output, provided the components are truly independent (different moduli, no shared algebraic structure).

L'Ecuyer's key insight was that combining two generators of moderate quality and moderate period produces a generator whose quality *exceeds* both components — the lattice defects of each component are incommensurate and partially cancel. This is not merely additive improvement; the spectral test figures of merit for the combined generator can exceed those of either component individually.

### MRG31k3p

L'Ecuyer and Touzin (2000) designed MRG31k3p as a fast combined multiple recursive generator (CMRG) using 31-bit arithmetic to avoid the need for 64-bit multiplication:

```
Component 1:
    X_{1,n} = (2^12 * X_{1,n-1} + 2^22 * X_{1,n-2} + (2^31 - 21069) * X_{1,n-3})
              mod (2^31 - 1)

Component 2:
    X_{2,n} = (2^15 * X_{2,n-1} + 2^21 * X_{2,n-3})
              mod (2^31 - 21069)

Output:
    U_n = (X_{1,n} - X_{2,n}) mod (2^31 - 1)
```

The multipliers are powers of two, meaning all multiplications reduce to shifts — no general-purpose multiplier is needed. Period: approximately `2^185`. The generator passes all tests in TestU01's SmallCrush, Crush, and BigCrush batteries.

### MRG32k3a

L'Ecuyer's most widely deployed generator (1999) combines two order-3 multiple recursive generators:

```
Component 1:
    X_{1,n} = (1403580 * X_{1,n-2} - 810728 * X_{1,n-3}) mod 4294967087

Component 2:
    X_{2,n} = (527612 * X_{2,n-1} - 1370589 * X_{2,n-3}) mod 4294944443

Output:
    if X_{1,n} > X_{2,n}:
        return (X_{1,n} - X_{2,n}) * (1 / 4294967088)
    else:
        return (X_{1,n} - X_{2,n} + 4294967087) * (1 / 4294967088)
```

Period: approximately `2^191` (the product of the two component periods, each near `2^95.5`). The moduli `4294967087` and `4294944443` are both primes slightly below `2^32`, chosen so that the intermediate products in the recurrence do not overflow 53-bit double-precision arithmetic — a critical practical constraint for the era, when most scientific code used IEEE 754 doubles as the primary numeric type.

MRG32k3a passes all TestU01 batteries and supports efficient stream splitting: the state can be advanced by any multiple of `2^76` in constant time using precomputed jump matrices, enabling `2^51` independent parallel streams of length `2^76` each. This made it the first generator with rigorous support for parallel simulation — each thread or process gets its own non-overlapping subsequence with guaranteed independence.

MRG32k3a is the default generator in several simulation libraries, including SSJ (L'Ecuyer's own Java library) and was recommended by L'Ecuyer for general-purpose scientific simulation through the 2010s. It was also adopted in Arena, SIMUL8, and other commercial discrete-event simulation packages.

### The Earlier Combined LCG (1988)

L'Ecuyer's earlier work demonstrated the combination principle with two simple 32-bit LCGs:

```
Generator 1:  X_n = 40014 * X_{n-1}  mod  2147483563
Generator 2:  Y_n = 40692 * Y_{n-1}  mod  2147483399
Combined:     Z_n = (X_n - Y_n)  mod  2147483562
```

Period: approximately `2^61`. This was a major improvement over single LCGs in both period and statistical quality, and it showed the community that simple combinations of simple generators could be surprisingly effective. The paper establishing this methodology (*"Efficient and Portable Combined Random Number Generators"*, CACM 1988) has been cited over 3,000 times.

---

## Historical Context and Legacy

The progression from LCGs to LFSRs to Mersenne Twister to combined generators traces the evolution of computing itself. LCGs were designed for machines where a single multiply was expensive and memory was measured in kilobytes. LFSRs emerged from the hardware community, where XOR gates are free and shift registers are natural. Mersenne Twister arrived when memory was cheap and statistical rigor mattered. Combined generators reflected the mathematical maturity of a field that could now prove properties of its constructions.

Each generation exposed the weaknesses of its predecessors. RANDU taught the community that multiplier selection is not arbitrary. Marsaglia's *Diehard* tests (1995) and L'Ecuyer and Simard's *TestU01* (2007) provided increasingly rigorous empirical frameworks. The progression from "does it look random?" to "does it pass 160 distinct statistical tests at 10^38 sample sizes?" fundamentally changed how generators are evaluated.

The common thread across all classical generators is **linearity**. LCGs are linear over the integers. LFSRs are linear over GF(2). Mersenne Twister is linear over GF(2). Lagged Fibonacci generators with XOR are linear over GF(2); the additive and multiplicative variants have their own predictable algebraic structures. Linearity is what makes these generators analyzable — you can prove theorems about their periods, their equidistribution properties, their lattice structure. But linearity is also what makes them breakable. Statistical tests that look for linear dependencies (binary rank, linear complexity, spectral analysis) find them.

Yet the classical generators persist. `java.util.Random` still uses the 48-bit LCG from 1995. Legacy scientific codes still embed MT19937. Embedded systems still use LFSRs. Understanding these algorithms — their mathematical structure, their failure modes, their historical context — remains essential for anyone working with randomness in computation.

The next generation — PCG, xoshiro, ChaCha-based CSPRNGs, and hardware entropy sources — builds directly on the lessons learned from four decades of classical PRNG design. Every modern generator is, in some sense, an answer to a question that LCGs, LFSRs, and Mersenne Twister taught us to ask.

---

## References

1. Knuth, D.E. *The Art of Computer Programming, Volume 2: Seminumerical Algorithms.* 3rd ed. Addison-Wesley, 1997.
2. Hull, T.E., and Dobell, A.R. "Random number generators." *SIAM Review* 4.3 (1962): 230-254.
3. Coveyou, R.R., and MacPherson, R.D. "Fourier analysis of uniform random number generators." *Journal of the ACM* 14.1 (1967): 100-119.
4. Park, S.K., and Miller, K.W. "Random number generators: Good ones are hard to find." *Communications of the ACM* 31.10 (1988): 1192-1201.
5. Matsumoto, M., and Nishimura, T. "Mersenne Twister: A 623-dimensionally equidistributed uniform pseudorandom number generator." *ACM TOMACS* 8.1 (1998): 3-30.
6. L'Ecuyer, P. "Efficient and portable combined random number generators." *Communications of the ACM* 31.6 (1988): 742-749.
7. L'Ecuyer, P. "Good parameters and implementations for combined multiple recursive random number generators." *Operations Research* 47.1 (1999): 159-164.
8. L'Ecuyer, P., and Touzin, R. "Fast combined multiple recursive generators with multipliers of the form a = ±2^q ± 2^r." *Proceedings of the 2000 Winter Simulation Conference* (2000): 683-689.
9. Marsaglia, G. "Random numbers fall mainly in the planes." *PNAS* 61.1 (1968): 25-28.
10. Marsaglia, G. "Xorshift RNGs." *Journal of Statistical Software* 8.14 (2003): 1-6.
11. Luscher, M. "A portable high-quality random number generator for lattice field theory simulations." *Computer Physics Communications* 79.1 (1994): 100-110.
12. L'Ecuyer, P., and Simard, R. "TestU01: A C library for empirical testing of random number generators." *ACM TOMS* 33.4 (2007): Article 22.

---

## Study Guide — Classical PRNGs

### Key algorithms

1. **LCG** — Linear Congruential Generator.
2. **LFSR** — Linear Feedback Shift Register.
3. **Mersenne Twister (MT19937)** — 1998, huge period.
4. **Xorshift** — Marsaglia 2003.

## DIY — Implement an LCG

`X_{n+1} = (a X_n + c) mod m`. 5 lines. Known bad
choice (a=1103515245, c=12345, m=2^31). Compare to a
modern PRNG.

## TRY — Reproduce Marsaglia's plot

"Random numbers fall mainly in the planes" (1968).
Plot consecutive outputs of a bad LCG in 3D. You will
see the lattice structure.

## Related College Departments

- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)

*Part of the [Random Number Generation research series](./README.md).*
