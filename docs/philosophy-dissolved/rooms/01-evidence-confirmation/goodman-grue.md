# Goodman's New Riddle of Induction

**Room 1 — Evidence & Confirmation**

**Foundation(s):** Set Theory (F5) + Information Theory (F7)
**Architecture Connection:** GSD Pattern Detection

---

## The Paradox

In 1955, Nelson Goodman published *Fact, Fiction, and Forecast* and, in doing so, showed that the problem of induction was far worse than anyone had realized. David Hume had demonstrated in the eighteenth century that no amount of past observation logically guarantees future regularity --- that the sun rising every morning does not, by deductive logic alone, entail that it will rise tomorrow. But Hume's problem, for all its profundity, seemed like it could be patched. If we could just give a rigorous account of *confirmation* --- of what it means for evidence to support a hypothesis --- then maybe we could justify our inductive practices even without deductive certainty. Carl Hempel had made real progress on this front, formalizing the conditions under which an observation confirms a universal generalization. Goodman's contribution was to demonstrate that Hempel's project, and every project like it, was built on a hidden assumption that could not be justified within the framework itself.

Goodman introduced the predicate "grue." An object is grue if and only if it is first observed before some future time $t$ and is green, or is first observed at or after time $t$ and is blue. Now consider every emerald humanity has ever examined. Each one was observed before time $t$. Each one was green. But every green object observed before time $t$ is also grue --- by definition. The evidence set is identical. Every observation that confirms "all emeralds are green" equally confirms "all emeralds are grue." The two hypotheses are empirically indistinguishable given all available data. Yet they make incompatible predictions: after time $t$, the first hypothesis predicts green emeralds and the second predicts blue ones. If confirmation is a logical relationship between evidence and hypothesis --- as Hempel argued --- then confirmation cannot distinguish between these two hypotheses. The logic is the same. The evidence is the same. The predictions diverge.

The natural response is to say that "grue" is somehow illegitimate --- that it is a gerrymandered predicate, an artificial concoction, a trick. But Goodman anticipated this objection and turned it inside out. Define "bleen": an object is bleen if it is first observed before $t$ and is blue, or first observed at or after $t$ and is green. Now rewrite the "normal" predicates in terms of the "abnormal" ones. An object is green if and only if it is grue before $t$ and bleen after $t$. From the perspective of a language whose primitives are "grue" and "bleen," the predicate "green" is the gerrymandered one --- the one that requires a temporal boundary in its definition. There is a perfect symmetry. Neither predicate set is logically prior to the other. Neither is simpler *in terms of the other*. Goodman's point is devastating: purely logical accounts of confirmation cannot tell us which predicates to project into the future, because the choice of predicates is prior to the logic of confirmation, and there is no logical basis for the choice. Philosophy called this the "new riddle of induction," and for seventy years it remained one of the deepest unsolved problems in epistemology. The missing instrument was not more logic. It was a way to *measure* the complexity of a predicate that does not depend on which language you happen to be speaking.

---

## The Foundation

**Instruments: Kolmogorov Complexity and the Minimum Description Length Principle**

Goodman's symmetry argument is airtight within any particular language: "green" defined in terms of "grue" and "bleen" looks just as complex as "grue" defined in terms of "green" and "blue." The key word is *within a particular language*. The symmetry breaks when you step outside natural language and ask a question that has a language-independent answer: what is the shortest program, on a universal Turing machine, that produces this predicate's extension?

Kolmogorov complexity, formalized independently by Ray Solomonoff (1960), Andrey Kolmogorov (1965), and Gregory Chaitin (1966), assigns to every finite string $x$ a complexity $K(x)$ --- the length of the shortest binary program that outputs $x$ on a reference universal Turing machine $U$. This quantity is language-independent up to an additive constant: for any two universal Turing machines $U_1$ and $U_2$, there exists a constant $c$ such that $|K_{U_1}(x) - K_{U_2}(x)| \leq c$ for all $x$. The constant $c$ is the length of the compiler from one machine to the other. It is fixed and finite. For sufficiently complex objects, it vanishes into irrelevance. The Kolmogorov complexity of a predicate is an objective measure of its intrinsic complexity, and Goodman's linguistic symmetry does not survive contact with it.

The Minimum Description Length (MDL) principle, developed by Jorma Rissanen (1978), operationalizes this for hypothesis selection: among hypotheses that account for the observed data equally well, prefer the one whose total description --- hypothesis plus data encoded under the hypothesis --- is shortest. MDL is the practical engineering form of Solomonoff's prior, which assigns to each hypothesis $H$ a prior probability inversely exponential in its Kolmogorov complexity: $P(H) \propto 2^{-K(H)}$. Simpler hypotheses are exponentially more probable, not by convention or aesthetic preference, but by the combinatorial fact that there are fewer short programs than long ones.

**The framework:** Kolmogorov complexity provides a language-independent measure of predicate complexity. The MDL principle and Solomonoff's prior provide a principled method for selecting among empirically equivalent hypotheses. Together, they break Goodman's symmetry.

---

## The Resolution

### 1. The Complexity of "Green" versus "Grue"

Consider what a program must do to compute the extension of each predicate for a given object $x$ observed at time $t_{\text{obs}}$.

**Program for "green":** Check whether $x$ reflects light at wavelengths in the range $\sim$495--570nm. Output 1 if yes, 0 if no. The program requires a wavelength detector and a range check. Its Kolmogorov complexity is:

$$K(\text{green}) = K(\text{wavelength-check}) + K(\text{range bounds})$$

**Program for "grue":** Check the observation time $t_{\text{obs}}$. If $t_{\text{obs}} < t$, check whether $x$ reflects light at $\sim$495--570nm. If $t_{\text{obs}} \geq t$, check whether $x$ reflects light at $\sim$450--495nm. Output 1 if the relevant condition holds, 0 otherwise. The program requires everything "green" requires, plus: a clock, a temporal threshold $t$, a conditional branch, and a second wavelength range.

$$K(\text{grue}) = K(\text{wavelength-check}) + K(\text{range bounds}_1) + K(\text{range bounds}_2) + K(\text{clock}) + K(\text{threshold } t) + K(\text{branch})$$

The additional terms are not negligible. The temporal threshold $t$ alone requires specifying a particular moment in time --- an arbitrary calendar date encoded in bits. This is pure overhead. The predicate "green" has no such parameter. The difference in complexity is:

$$K(\text{grue}) - K(\text{green}) \geq K(\text{clock}) + K(t) + K(\text{branch}) + K(\text{range bounds}_2)$$

This is strictly positive. It is not language-dependent. A Turing machine that computes "grue" must be longer than one that computes "green," regardless of the programming language, up to the fixed constant $c$ between reference machines. For any reasonable encoding, the overhead is substantial --- on the order of tens to hundreds of bits, depending on the precision with which $t$ must be specified.

### 2. Goodman's Symmetry, Broken

Goodman's symmetry holds *within a natural language*. Define "green" in terms of "grue" and "bleen," and the definitions look equally complex. But natural language is not a universal Turing machine. Natural language definitions inherit the complexity of whatever primitives the language happens to provide. If your language takes "grue" and "bleen" as primitives, then "green" looks complex. If your language takes "green" and "blue" as primitives, then "grue" looks complex. The symmetry is an artifact of the expressive medium.

Kolmogorov complexity breaks this symmetry because it is computed on a universal Turing machine whose primitives are fixed and minimal --- typically the operations of a binary tape machine. On such a machine, the program for "grue" is strictly longer than the program for "green," regardless of which natural language you use to *describe* the programs. The measurement is absolute (up to $c$), and $c$ does not depend on the object being measured.

This is the key move. Goodman was right that no *logical* framework can privilege "green" over "grue." He was right that the choice of predicates is prior to confirmation. But he was wrong that the choice is arbitrary. It is not arbitrary. It is determined by Kolmogorov complexity, which is a property of the predicates themselves, not of the language used to express them.

### 3. Solomonoff's Prior and the Weight of Evidence

Solomonoff's theory of inductive inference (1964) assigns to each hypothesis $H_i$ a prior probability:

$$P(H_i) = 2^{-K(H_i)}$$

For our two hypotheses:

$$P(\text{all emeralds are green}) = 2^{-K(\text{green hypothesis})}$$
$$P(\text{all emeralds are grue}) = 2^{-K(\text{grue hypothesis})}$$

Since $K(\text{grue hypothesis}) > K(\text{green hypothesis})$ by a margin $\Delta K$, the prior ratio is:

$$\frac{P(\text{green})}{P(\text{grue})} = 2^{\Delta K}$$

If the complexity difference $\Delta K$ is even 20 bits --- a conservative estimate given that specifying the temporal threshold $t$ alone requires encoding a calendar date --- then the prior ratio is $2^{20} \approx 10^6$. The "green" hypothesis is a million times more probable *before any evidence is considered*. The evidence, which supports both hypotheses equally, does not change this ratio. After observing a million green emeralds, both posteriors increase, but the ratio between them is unchanged. The "green" hypothesis dominates not because of the evidence but because of the prior, and the prior is not subjective --- it is a theorem about the distribution of programs on a universal Turing machine.

### 4. Set-Theoretic Natural Kinds

Set theory (F5) provides the complementary framework. Define a *natural kind* as an equivalence class of objects under a membership function of minimum description length. The set $\{x : x \text{ is green}\}$ partitions color space by wavelength alone. The set $\{x : x \text{ is grue}\}$ partitions color space by wavelength AND time. The grue partition is strictly more complex: it requires a temporal coordinate that the green partition does not.

The equivalence relation "same color" under the green/blue system groups objects by a single physical parameter (reflectance spectrum). The equivalence relation "same color" under the grue/bleen system groups objects by two parameters (reflectance spectrum AND time of first observation). The grue system's equivalence classes are not wrong --- they are *more expensive*. They encode strictly more information per classification, and the additional information (the temporal boundary) does not correspond to any physical property of the objects being classified. It is bookkeeping overhead.

The natural kinds --- the equivalence classes that carve nature at its joints --- are the ones with minimum description length. This is not convention. It is compression. Nature privileges the encoding that carries the signal with the least overhead.

### The Key Insight

The preference for "green" over "grue" is not a cultural habit, a psychological bias, or an unjustifiable convention. It is information-theoretic compression. "Green" has lower Kolmogorov complexity than "grue." The Minimum Description Length principle selects "green" over "grue" for the same reason a compression algorithm selects shorter codewords for more frequent symbols: because the mathematics of encoding demands it. Goodman identified a real gap in the logical theory of confirmation --- confirmation alone cannot select predicates. But the gap is filled not by more logic but by a measuring instrument: Kolmogorov complexity, which is to predicates what a scale is to mass. The measurement is objective, the result is unambiguous, and the paradox does not survive contact with the formalism.

---

## The Architecture

This resolution is operationalized in the GSD skill-creator's pattern detection infrastructure.

The `PatternAnalyzer` in the observation engine detects recurring sequences in agent behavior and scores them by frequency, support, and --- critically --- description length. When the system observes that an agent consistently uses a particular workflow, it encodes that pattern as a candidate skill. The scoring function implicitly implements MDL: a pattern that can be described concisely (few parameters, no temporal boundaries, no conditional branches on extraneous variables) scores higher than a pattern that requires elaborate qualification.

Consider what a "grue-like" pattern would look like in practice. Suppose an agent uses workflow A before Tuesday and workflow B after Tuesday. The observation engine would detect two separate patterns (A and B), each with its own frequency and support, and each would be simpler than the combined conditional pattern "A-before-Tuesday-B-after." The n-gram analysis naturally decomposes the conditional pattern into its simpler components, because the combined pattern's description length is strictly greater than either component's. The system does not need to argue about which pattern is "real." It measures their complexity and lets the shorter descriptions win.

This is Goodman dissolved into engineering. The observation engine does not debate which predicates to project. It computes description lengths and selects the encoding with the best compression. A stable pattern --- one that holds without temporal qualification --- compresses better than a time-dependent pattern, and the scoring function reflects this automatically. The same information-theoretic principle that distinguishes "green" from "grue" distinguishes a genuine recurring workflow from an accidental temporal correlation. The instrument does the work that philosophical argument could not: it measures complexity, and the measurement is the decision.

The deeper lesson is that Goodman's riddle was never about emeralds. It was about the relationship between observation and projection --- about which patterns in the past are safe to extend into the future. The answer is: the ones with the shortest description. Not because simplicity is beautiful, but because simple patterns are exponentially more probable in the space of all possible patterns. The skill-creator's pattern detection does not know this theorem. It does not need to. The theorem is built into the scoring function, the way gravity is built into the trajectory of a thrown ball. The mathematics is the architecture.
