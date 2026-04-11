# Modern Pseudorandom Number Generators

*The post-Mersenne Twister era — faster, smaller, better*

---

The story of modern PRNGs is a story of engineers finally admitting that 2.5 KiB of state is absurd for generating random numbers. Between 2003 and 2018, a small group of researchers — George Marsaglia, Melissa O'Neill, Sebastiano Vigna, and the D.E. Shaw team — rebuilt the foundations of pseudorandom number generation from scratch. What emerged were generators that are smaller, faster, statistically superior, and in some cases cryptographically informed. This document traces that lineage.

---

## 1. The xorshift Family (Marsaglia, 2003)

George Marsaglia's 2003 paper "Xorshift RNGs" introduced what might be the simplest viable PRNG ever published. The insight was that three successive xor-shift operations on a machine word produce full-period generators with surprisingly good statistical properties.

The core operation is trivial. A **xorshift** applies a sequence of three shift-xor pairs to a state variable. For a 32-bit generator:

```
uint32_t xorshift32(uint32_t *state) {
    uint32_t x = *state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *state = x;
    return x;
}
```

The shift constants (13, 17, 5) are not arbitrary — Marsaglia enumerated all triplets that produce maximal-period generators (period 2^32 - 1, excluding the zero state). For 64-bit and 128-bit variants, the same principle applies with different shift constants.

**xorshift128** uses four 32-bit words as state, giving period 2^128 - 1:

```
uint32_t xorshift128(uint32_t s[4]) {
    uint32_t t = s[3];
    t ^= t << 11;
    t ^= t >> 8;
    t ^= s[0];
    t ^= s[0] >> 19;
    s[3] = s[2]; s[2] = s[1]; s[1] = s[0]; s[0] = t;
    return t;
}
```

The appeal was obvious: no multiplication, no division, no lookup tables. On hardware circa 2003, three xors and three shifts executed in under a nanosecond. Mersenne Twister needed 624 words of state; xorshift128 needed four.

**The problem:** raw xorshift generators fail several statistical tests. The low bits are notably weak — a consequence of the linear recurrence over GF(2). The generator passes most of Marsaglia's own Diehard battery but fails more rigorous tests like TestU01's BigCrush. This led to the development of **xorshift+** variants.

**xorshift128+**, developed by Vigna in 2014, adds the two halves of a 128-bit xorshift state as the output function: `return s[0] + s[1]`. This simple addition scrambles the linear structure enough to pass BigCrush. It became the PRNG inside JavaScript's V8 engine (Chrome, Node.js), meaning it generates more random numbers per day than perhaps any other algorithm on Earth. When you call `Math.random()` in a browser, you are calling xorshift128+.

The xorshift family's lasting contribution is the proof that linear recurrences over GF(2) can be practical — but only with an adequate output scrambler. Raw xorshift is too linear. Dressed up with addition or multiplication, the core idea is sound.

---

## 2. SplitMix64 (Steele, Lea & Flood, 2014)

SplitMix64 emerged from the Java world. Guy Steele, Doug Lea, and Christine Flood designed it for Java 8's `SplittableRandom` class, where the primary requirement was that any thread could "split" a generator into two independent streams without coordination.

The algorithm is a counter with a mixing function — conceptually the simplest possible PRNG architecture:

```
uint64_t splitmix64(uint64_t *state) {
    uint64_t z = (*state += 0x9e3779b97f4a7c15);
    z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9;
    z = (z ^ (z >> 27)) * 0x94d049bb133111eb;
    return z ^ (z >> 31);
}
```

Breaking this down:

- **The increment** `0x9e3779b97f4a7c15` is the golden ratio (phi) scaled to 64 bits: floor(2^64 / phi). This ensures the counter visits all 2^64 values before repeating, with maximal spacing between consecutive outputs.
- **The mixing function** is a bijective hash. Each xor-shift-multiply pair is an invertible permutation of 64-bit space. The constants `0xbf58476d1ce4e5b9` and `0x94d049bb133111eb` were found by Stafford's search for good bit-mixing functions (these are his "Mix13" variant).
- **Three stages of mixing** ensure full avalanche — changing any single input bit has roughly 50% probability of flipping each output bit.

SplitMix64's period is exactly 2^64. That is short by modern standards (xoshiro256 has period 2^256 - 1), but for many applications it is more than sufficient. The real value of SplitMix64 is as a **seeder**: given a single 64-bit seed, it can initialize the 256-bit state of xoshiro256++ by calling the mixing function four times. This is exactly how Vigna recommends seeding xoshiro/xoroshiro generators, and it is the standard approach in most implementations.

Java adopted SplitMix64 directly as `java.util.SplittableRandom`. Its splitting property — create two independent generators from one, recursively — makes it natural for fork-join parallelism. The quality is excellent for a non-cryptographic PRNG: it passes BigCrush without reservation.

---

## 3. xoshiro/xoroshiro (Blackman & Vigna, 2018)

David Blackman and Sebastiano Vigna's xoshiro and xoroshiro families represent the culmination of the xorshift lineage. The names are acronyms: **xo**r/**sh**ift/**ro**tate (xoshiro) and **xo**r/**ro**tate/**shi**ft/**ro**tate (xoroshiro). The key innovation is the **output scrambler** — a non-linear function applied to the linear state before returning the result.

### xoshiro256++ (the recommended variant)

The full algorithm:

```
static uint64_t s[4];  // 256 bits of state

static uint64_t rotl(uint64_t x, int k) {
    return (x << k) | (x >> (64 - k));
}

uint64_t xoshiro256pp(void) {
    // Output scrambler: rotate-add-rotate
    uint64_t result = rotl(s[0] + s[3], 23) + s[0];

    // State update (linear engine)
    uint64_t t = s[1] << 17;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 45);

    return result;
}
```

The design is a clean separation of concerns:

1. **The linear engine** (state update) is a 256-bit linear recurrence over GF(2). It has period 2^256 - 1 (excluding the all-zero state, which is absorbing). The shift-xor-rotate operations were chosen so that the characteristic polynomial is primitive, guaranteeing maximum period. The constants (17 for the shift, 45 for the rotation) were selected by exhaustive search over all valid parameterizations.

2. **The output scrambler** (`++` variant) computes `rotl(s[0] + s[3], 23) + s[0]`. The addition is non-linear over GF(2), which breaks the linear structure that defeats raw xorshift. The rotation by 23 ensures that the non-linearity propagates across all bit positions. This is cheap — one add, one rotate, one add — but sufficient to pass BigCrush.

The family includes several scrambler variants:
- **xoshiro256++** — the recommended general-purpose variant. Passes BigCrush.
- **xoshiro256\*\*** — uses multiplication as the scrambler: `rotl(s[1] * 5, 7) * 9`. Slightly more expensive but higher quality in some edge cases.
- **xoshiro256+** — uses simple addition: `s[0] + s[3]`. Fastest, but the low three bits are weak (they have weight-4 linear complexity). Vigna recommends it only for generating floating-point numbers, where you discard the low bits anyway.

### xoroshiro128 variants

For applications needing minimal state, **xoroshiro128++** and **xoroshiro128\*\*** provide 128-bit state (period 2^128 - 1) with the same scrambler philosophy. xoroshiro128+ is the variant used in JavaScript engines.

### Jump functions

A critical feature of the xoshiro/xoroshiro family is **jump functions**. Because the state update is a linear recurrence, you can compute "jump ahead by 2^128 steps" (or 2^192 steps) in O(n^2) time where n is the state size in bits. This enables parallel streams: give each thread the same seed, then jump thread _k_ forward by k * 2^128 steps. The streams are guaranteed non-overlapping for any practical computation.

Jump functions are implemented as polynomial multiplication in GF(2)[x] modulo the characteristic polynomial. Vigna provides precomputed jump polynomials for each variant.

### The controversy

Vigna has been outspoken in advocating xoshiro as the best general-purpose PRNG, publishing benchmark comparisons and maintaining a comprehensive website (prng.di.unimi.it). This brought him into direct conflict with Melissa O'Neill, creator of PCG. The disagreement centers on methodology and rhetoric more than mathematics: O'Neill argues that Vigna's benchmarks are biased, that xoshiro's linear structure creates exploitable weaknesses in adversarial settings, and that the "passes BigCrush" bar is too low. Vigna counters that PCG's claims of uniqueness are overstated and that the permutation-based output function is not qualitatively different from xoshiro's scramblers. The debate played out on blogs, mailing lists, and academic venues from 2018 through 2020 — occasionally generating more heat than light. We will return to this after presenting PCG.

---

## 4. The PCG Family (O'Neill, 2014)

Melissa O'Neill's PCG (Permuted Congruential Generator) family, published in her 2014 paper "PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation," represents the most carefully argued design in modern PRNG history. Where other generators were presented as "here is an algorithm that passes tests," O'Neill presented a **design philosophy** — and then implemented it with rigor.

### The design philosophy

O'Neill's argument is that a good PRNG combines:
1. **A well-understood state transition function** with known period and equidistribution properties.
2. **A non-invertible output permutation** that destroys the structure visible in the raw state.

The state transition is a **linear congruential generator** (LCG): `state = state * multiplier + increment`. LCGs have been known since Lehmer (1949). Their period is exactly 2^n (for power-of-2 modulus with odd increment), and they have provable equidistribution in their high bits. But raw LCGs are terrible PRNGs — the low bits cycle with short periods, and the outputs are predictable.

O'Neill's insight is that LCGs are *excellent state transition functions* — simple, fast, full-period, well-analyzed — and their weakness is entirely in the *output*, which can be fixed with a good permutation. Instead of abandoning LCGs (as the field did in the 1990s), she rehabilitated them.

### PCG-XSH-RR: the flagship variant

The most widely used variant is PCG-XSH-RR (XorShift-High, Rotate-Right), which maps a 64-bit LCG state to a 32-bit output:

```
// State: 64-bit LCG
static uint64_t state;
static uint64_t inc;  // must be odd

uint32_t pcg_xsh_rr(void) {
    uint64_t oldstate = state;

    // Advance the LCG
    state = oldstate * 6364136223846793005ULL + inc;

    // Output permutation: XSH-RR
    // 1. XorShift the high bits down to break LCG linearity
    uint32_t xorshifted = ((oldstate >> 18) ^ oldstate) >> 27;
    // 2. Rotate right by a data-dependent amount (top 5 bits of state)
    uint32_t rot = oldstate >> 59;
    return (xorshifted >> rot) | (xorshifted << ((-rot) & 31));
}
```

The output permutation does three things:
1. **XorShift** (`((oldstate >> 18) ^ oldstate) >> 27`): folds the high bits (which have good LCG properties) into the low bits (which don't), then truncates to 32 bits. The shift by 18 is chosen so that each output bit depends on multiple state bits.
2. **Data-dependent rotation** (`rot = oldstate >> 59`): the rotation amount is drawn from the top 5 bits of the state itself. This makes the permutation key-dependent — different states apply different rotations, creating a family of permutations indexed by the state.
3. **Non-invertibility**: the 64→32 bit reduction means the output function is many-to-one. You cannot recover the internal state from the output, even in principle (without brute force). This is a qualitative advantage over generators like xoshiro where the output width equals the state width.

### Stream selection

The LCG increment `inc` must be odd (to ensure full period), and there are 2^63 distinct odd values. Each odd increment produces a completely independent stream. PCG thus provides **2^63 selectable streams** — trivially, by choosing different odd increments. This is not a jump function (which gives non-overlapping subsequences of a single sequence) but genuinely independent sequences from different LCG parameterizations.

### PCG-XSL-RR and PCG-DXSM

For 128→64 bit generation (needed when 32-bit output is insufficient), O'Neill defined:

- **PCG-XSL-RR** (XorShift-Low, Rotate-Right): analogous to XSH-RR but for 128-bit state producing 64-bit output. Uses a 128-bit LCG (requiring 128-bit multiplication, which is cheap on 64-bit hardware via widening multiply).
- **PCG-DXSM** (Double Xor Shift Multiply): a newer variant that replaces the rotation with multiplication, improving statistical quality at a small speed cost. This is now the recommended 128→64 variant.

### Why PCG won the consensus

By around 2020, PCG had become the de facto recommendation for new projects needing a general-purpose PRNG. The reasons are cumulative:

| Property | PCG-XSH-RR | xoshiro256++ | Mersenne Twister | SplitMix64 |
|---|---|---|---|---|
| State size | 128 bits (64 state + 64 stream) | 256 bits | 19,937 bits | 64 bits |
| Period | 2^64 | 2^256 - 1 | 2^19937 - 1 | 2^64 |
| Output bits | 32 | 64 | 32 | 64 |
| Speed (cycles/output) | ~3-4 | ~3-4 | ~8-10 | ~4-5 |
| Passes BigCrush | Yes | Yes | No (linear complexity) | Yes |
| Predictable from output? | No (non-invertible) | Yes (linear) | Yes (linear) | Yes (invertible) |
| Independent streams | 2^63 | Via jump functions | Awkward | Via splitting |
| Equidistribution | 1-dimensionally | 4-dimensionally | 623-dimensionally | 1-dimensionally |

The comparison reveals PCG's balanced position:
- It is **as fast** as xoshiro (both are ~1 ns per call on modern x86).
- It has **smaller state** than xoshiro (128 vs 256 bits) while still having ample period for any non-cryptographic application.
- Its output is **non-invertible** — you cannot reconstruct the state from the output stream without 2^64 work. xoshiro's output is linearly related to its state, meaning the state can be reconstructed from any 4 consecutive outputs by solving a system of linear equations over GF(2).
- It provides **genuine stream selection** without computing jump polynomials.
- The design is **principled and transparent** — every choice is justified in the paper, with proofs where applicable.

The equidistribution comparison deserves nuance. xoshiro256++ is 4-dimensionally equidistributed (every 4-tuple of 64-bit values appears equally often over the full period), while PCG-XSH-RR is only 1-dimensionally equidistributed. In practice, this rarely matters — you will never exhaust even 2^64 outputs, let alone 2^256 — but it is a theoretical advantage for xoshiro.

### The Vigna-O'Neill debate

The disagreement between Sebastiano Vigna and Melissa O'Neill ran from approximately 2018 to 2020 and illuminated real methodological questions.

**Vigna's position:** xoshiro is simpler, faster (in some benchmarks), requires no multiplication, and has longer period. PCG's claims of superiority rest on the non-invertibility of its output function, which Vigna argues is irrelevant for non-cryptographic PRNGs. He published PractRand results showing that PCG-XSH-RR fails certain tests when run with specific seeds (the "minimal standard" criticism).

**O'Neill's position:** Vigna's benchmarks were conducted in ways that favored xoshiro (e.g., inlining the generator in the benchmark loop, which advantages xoshiro's simpler output function). The non-invertibility of PCG's output is not about cryptography — it is about **defense in depth**. A generator whose internal state cannot be recovered from its output is more robust against correlations that no existing test suite detects. The fact that xoshiro's state is trivially recoverable from 4 outputs means any latent weakness in the linear engine is directly exposed in the output.

**The deeper issue:** the debate exposed that the field lacks consensus on what "statistically good" means beyond "passes BigCrush and PractRand." BigCrush runs ~800 tests over ~10^12 outputs. Modern applications often consume far more. The question is whether passing existing tests is *sufficient evidence* of quality, or whether *structural arguments* (like non-invertibility) should also carry weight. O'Neill argues for structural guarantees; Vigna argues that empirical performance is the only meaningful metric.

My position: O'Neill is right on the structural argument. A non-invertible output function is strictly more conservative than an invertible one, and it costs nothing in performance. PCG's design is better *reasoned*, even if both generators perform identically on today's test suites. When you choose a PRNG for a project, you are betting that its outputs will not create problems you have not tested for. PCG is a safer bet.

---

## 5. Counter-Based RNGs (Salmon et al., 2011)

John Salmon, Mark Moraes, Ron Dror, and David Shaw at D.E. Shaw Research published "Parallel Random Numbers: As Easy as 1, 2, 3" in 2011, introducing a fundamentally different PRNG architecture: **counter-based RNGs** (CBRNGs).

The idea is disarmingly simple: a CBRNG has no mutable state. It is a pure function from (key, counter) to random output. To generate a sequence, you increment a counter and apply a keyed bijection:

```
output = encrypt(key, counter)
counter += 1
```

If `encrypt` is a good block cipher, the outputs are indistinguishable from random. The trick is finding ciphers that are fast enough for PRNG use while providing adequate statistical quality.

### Philox

**Philox** (from "philosophical fox" — no, really, from the Feistel network structure) uses a simplified Feistel network operating on pairs of 32-bit or 64-bit words. Philox-4x32-10 applies 10 rounds of a Feistel-like mixing function to a 4-word (128-bit) counter, keyed by a 64-bit key:

Each round performs:
1. Multiply one word by a carefully chosen constant.
2. XOR the high half of the product with another word.
3. Swap word pairs.

Ten rounds provide ample mixing for statistical quality (the paper shows that even 7 rounds pass BigCrush). The multiply-and-xor-high-bits structure maps efficiently to the `mulhi` instruction available on most architectures.

### Threefry

**Threefry** is derived from the Threefish block cipher (designed by Schneier et al. for the SHA-3 competition). It uses only additions, XORs, and rotations (no multiplication), making it attractive for hardware without fast multiply. Threefry-4x64-20 applies 20 rounds of ARX mixing to a 256-bit counter.

### Why CBRNGs matter for parallel computing

The stateless design of CBRNGs solves the parallelism problem elegantly:

- **No synchronization needed.** Each thread computes `encrypt(key, thread_id * block_size + i)`. There is no shared state to protect with locks.
- **Reproducibility is free.** To regenerate the 10,000th random number, compute `encrypt(key, 10000)`. No need to generate the first 9,999.
- **GPU-native.** GPUs launch thousands of threads that must run independently. CBRNGs require zero coordination — each thread just increments its own counter. This makes them the default PRNG for GPU computing.

**PyTorch adopted Philox-4x32-10** as its default PRNG for CUDA tensors. When you call `torch.randn(1000, device='cuda')`, Philox generates the underlying random bits. The counter-based design ensures that results are reproducible across different GPU configurations (same seed + same counter = same output, regardless of thread scheduling).

The D.E. Shaw paper also introduced the **Random123** library, which provides production implementations of Philox and Threefry in C, C++, CUDA, and OpenCL.

The trade-off is speed: Philox-4x32-10 is roughly 2-3x slower than xoshiro or PCG on scalar CPU code, because 10 rounds of Feistel mixing is more work than one round of LCG + permutation. On GPUs, this overhead is negligible compared to the cost of synchronization that a stateful PRNG would require.

---

## 6. ChaCha-Based PRNGs

Daniel Bernstein's ChaCha stream cipher (2008), itself a refinement of his Salsa20, occupies a unique position: it is a cryptographically secure PRNG that is fast enough for general-purpose use.

### ChaCha20

ChaCha20 operates on a 512-bit state (sixteen 32-bit words) arranged in a 4x4 matrix:

```
constant  constant  constant  constant
key       key       key       key
key       key       key       key
counter   counter   nonce     nonce
```

The core operation is the **quarter round**, applied in alternating column and diagonal patterns for 20 rounds. Each quarter round performs four add-xor-rotate operations. The full 20-round function produces 512 bits of output per block.

ChaCha20's design priorities are the opposite of PCG's: where PCG minimizes work per output bit, ChaCha20 maximizes security margin. Twenty rounds provide a comfortable margin against the best known cryptanalytic attacks (which break roughly 7 rounds of ChaCha).

### ChaCha as a PRNG

The bridge between cryptography and PRNG usage comes from reducing the round count:

- **ChaCha20** — full cryptographic strength. Used in TLS, WireGuard, and `/dev/urandom` on Linux.
- **ChaCha12** — Rust's `StdRng` (via the `rand` crate). Twelve rounds still resist all known attacks while running ~40% faster than ChaCha20. Rust's rationale: general-purpose code should not leak PRNG state, and the performance cost of cryptographic quality is acceptable (~3-5 ns per 64-bit output on modern x86).
- **ChaCha8** — Go's `math/rand/v2` default (since Go 1.22, 2024). Eight rounds are empirically secure and significantly faster. Go's rationale: `math/rand` is not a cryptographic API, but there is no reason to use a weaker generator when ChaCha8 is fast enough.

### Why languages are adopting ChaCha

The trend toward ChaCha-based PRNGs in standard libraries reflects a pragmatic calculation: the cost of using a CSPRNG has fallen to the point where the security benefit is essentially free.

On modern x86-64 with SIMD, ChaCha8 generates 64 random bits in approximately 3-4 nanoseconds — competitive with PCG and xoshiro. The throughput advantage of non-cryptographic generators (perhaps 2x faster) does not justify the risk of state leakage in applications where the PRNG output is observable.

This is not an argument that PCG or xoshiro are *bad* — they are excellent for their design goals. It is an argument that the default PRNG in a language's standard library should be conservatively chosen, and ChaCha provides a conservative choice at acceptable cost. Counter-based structure gives you parallelism and reproducibility. Cryptographic rounds give you unpredictability. And "fast enough" is, for standard library defaults, better than "fastest."

---

## The Landscape in 2026

The modern PRNG ecosystem has settled into clear niches:

**For simulation and Monte Carlo:** PCG-DXSM (128→64) or xoshiro256++ are the workhorses. Both pass all known statistical tests, run at memory bandwidth speed, and provide adequate period for any single-threaded computation. PCG has the edge in stream selection; xoshiro has the edge in equidistribution. Either is a defensible choice. If forced to pick one, I pick PCG for the structural argument: non-invertible output functions are a free lunch.

**For GPU and massively parallel computing:** Philox (counter-based) is the uncontested winner. Stateless design eliminates coordination overhead. PyTorch, JAX, and most scientific GPU codes use it.

**For language standard libraries:** ChaCha (8 or 12 rounds) is the emerging default. Rust and Go have adopted it. The performance penalty relative to PCG/xoshiro is negligible on modern hardware, and the security margin eliminates an entire class of bugs.

**For seeding other generators:** SplitMix64 is the universal seeder. Its bijective mixing function expands a 64-bit seed into arbitrarily wide state with excellent avalanche properties.

**For JavaScript:** xorshift128+ remains the engine-level PRNG in V8 and SpiderMonkey. It is fast and adequate for `Math.random()`, though the linear structure means it should never be used where unpredictability matters.

Mersenne Twister persists in legacy codebases (notably Python's `random` module and many numerical libraries), but no new project should adopt it. It fails statistical tests, wastes cache space, and produces predictable output. It was a remarkable achievement in 1997. It is an anachronism in 2026.

The deeper lesson of this generation of PRNG design is that **algorithm design is not just about the algorithm**. O'Neill's contribution was not merely PCG-XSH-RR — it was the argument that principled design matters, that structural properties (non-invertibility, provable period, independent streams) are worth pursuing even when empirical tests cannot distinguish between generators. The best PRNG is not the one that passes the most tests today; it is the one least likely to surprise you tomorrow.

---

## References

- Marsaglia, G. (2003). "Xorshift RNGs." *Journal of Statistical Software*, 8(14).
- Steele, G. L., Lea, D., & Flood, C. H. (2014). "Fast Splittable Pseudorandom Number Generators." *OOPSLA 2014*.
- O'Neill, M. E. (2014). "PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation." *Technical Report HMC-CS-2014-0905*, Harvey Mudd College.
- Blackman, D. & Vigna, S. (2018). "Scrambled Linear Pseudorandom Number Generators." arXiv:1805.01407.
- Salmon, J. K., Moraes, M. A., Dror, R. O., & Shaw, D. E. (2011). "Parallel Random Numbers: As Easy as 1, 2, 3." *SC '11: Proceedings of the International Conference for High Performance Computing*.
- Bernstein, D. J. (2008). "ChaCha, a variant of Salsa20." *SASC 2008*.
- Vigna, S. (2016). "An experimental exploration of Marsaglia's xorshift generators, scrambled." *ACM TOMS*, 42(4).
- L'Ecuyer, P. & Simard, R. (2007). "TestU01: A C Library for Empirical Testing of Random Number Generators." *ACM TOMS*, 33(4).
