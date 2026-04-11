# Random Number Generation: History and Origins

*From knucklebones to ENIAC --- the long path to computational randomness*

---

## 1. Ancient Randomness: When the Gods Chose

Long before anyone had a word for probability, humans were generating random numbers. They just called it divination.

The oldest known randomization devices are **astragali** --- the anklebones of sheep and goats --- found in archaeological sites across the Fertile Crescent dating to roughly 3000 BCE. Unlike modern dice with six symmetric faces, an astragalus has four distinguishable landing surfaces, each with a different probability of appearing face-up. The asymmetry was not a defect; it was a feature. The unequal odds mapped naturally onto hierarchies of fortune: some outcomes were common, others rare and therefore more significant. Mesopotamian players and priests understood this intuitively thousands of years before Cardano would formalize it.

The **Royal Game of Ur**, excavated by Leonard Woolley from the Royal Tombs of Ur in the 1920s and dating to approximately 2600 BCE, used tetrahedral dice --- four-cornered pyramidal throws with two marked and two unmarked vertices, yielding a binary outcome per die. Players rolled sets of these dice to generate move counts, producing a distribution that governed the race-like board game. The game board itself, with its ornate lapis lazuli and shell inlay, survived five millennia. The randomization mechanism it depended on was already sophisticated: multiple independent binary trials combined into a single outcome, a primitive binomial distribution carved in bone.

Roman **sortes** (lot-casting) formalized randomness into civic and religious life. The *sortes Vergilianae* involved opening Virgil's *Aeneid* at random and interpreting whatever passage appeared --- a practice that persisted into the Christian era as the *sortes Biblicae*. But the more structured Roman form used inscribed tablets (*sortes* or *tabulae*) drawn from an urn, a mechanism that enforced uniform selection without replacement. The Roman legal system occasionally used lot-casting to assign judges to cases, recognizing --- without articulating the mathematics --- that randomness could serve as a hedge against corruption. Cicero, in *De Divinatione*, argued against relying on lots for judicial decisions, but the practice persisted for centuries. In Athens, the *kleroterion* (allotment machine) was used to select jurors and certain magistrates, on the democratic theory that elections favored the wealthy and eloquent while lots treated all citizens equally.

The **Hebrew Bible** contains numerous instances of lot-casting as a method for discerning divine will. In the Book of Joshua (18:6--10), the land of Canaan is divided among the tribes of Israel by lot. In the Book of Jonah (1:7), sailors cast lots to determine who has brought a storm upon them. The Urim and Thummim, mysterious objects carried by the High Priest and described in Exodus 28:30, appear to have functioned as a sacred binary oracle --- yes or no, guilty or innocent. Proverbs 16:33 captures the theological framing precisely: "The lot is cast into the lap, but its every decision is from the LORD." These were not understood as random processes but as channels through which a deterministic God communicated decisions. The randomness was the point of access, not the source of truth.

In China, the **I Ching** (Book of Changes), compiled during the Western Zhou dynasty (c. 1000--750 BCE) and drawing on older oral traditions, codified a randomization procedure of remarkable mathematical elegance. The **yarrow stalk method** proceeds as follows: from a bundle of 50 stalks, one is set aside as an observer. The remaining 49 are divided arbitrarily into two heaps. Through a series of counting-off operations --- removing stalks in groups of four from each heap, setting remainders aside, and repeating the division-and-counting process twice more --- the diviner produces a single value from the set {6, 7, 8, 9}, each with a specific probability. The process is repeated six times to generate a hexagram of six lines, each either solid (yang) or broken (yin), with "moving" lines (6 and 9) that transform one hexagram into another. The resulting probability distribution is *not* uniform: 7 (stable yang) appears with probability 5/16, 8 (stable yin) with 7/16, 9 (changing yang) with 3/16, and 6 (changing yin) with 1/16. Whether the ancient Chinese designed this asymmetry deliberately or discovered it empirically, the result is a 64-state random variable with a nuanced transition structure. It is arguably the oldest surviving algorithm for structured random number generation.

What unites all these ancient methods is a shared recognition: for decisions that must be seen as fair, or for knowledge that must be seen as coming from beyond human bias, you need a process whose outcome no participant can control. Randomness --- real, physical, bone-and-stalk randomness --- was the technology that provided it.

---

## 2. Mathematical Foundations of Probability

The mathematics of randomness arrived remarkably late. For three thousand years, humans rolled dice without a coherent theory of what the numbers meant.

**Gerolamo Cardano** (1501--1576), the Milanese physician, mathematician, and compulsive gambler, wrote the first systematic treatment of probability in his *Liber de Ludo Aleae* ("Book on Games of Chance"), composed around 1564 but not published until 1663, nearly a century after his death. Cardano introduced the concept of equally likely outcomes and correctly computed probabilities for dice and card games. He understood the law of large numbers in rough form: the ratio of favorable to unfavorable outcomes approaches the true ratio as the number of trials increases. He was the first to write down the formula for the probability of at least one success in repeated independent trials --- the complement rule, 1 - (1 - p)^n --- and he used it to analyze dice games that had occupied Italian gamblers for centuries. He was also candid about his own gambling addiction and his tendency to cheat. His work was brilliant but isolated: it circulated only in manuscript and had no immediate successors.

The conventional origin story of probability theory begins with the **Pascal-Fermat correspondence** of 1654, prompted by the Chevalier de Mere's gambling puzzles. Antoine Gombaud, Chevalier de Mere, posed two problems to Blaise Pascal. The first was the *problem of points*: if a game of chance is interrupted before either player has won, how should the stakes be divided fairly? The second was a paradox of dice: why is betting on at least one six in four rolls of a single die profitable (probability approximately 0.5177), while betting on at least one double-six in 24 rolls of two dice is not (probability approximately 0.4914)?

Pascal wrote to Pierre de Fermat, and across seven letters exchanged between July and October 1654, the two mathematicians laid the groundwork for combinatorial probability. Pascal's approach to the problem of points was recursive --- what we now recognize as the Pascal triangle method and the foundations of expected value. Fermat's approach was enumerative: listing all possible outcomes and counting favorable cases. Their convergence on the same answers from fundamentally different directions gave the results immediate credibility and established the dual character (recursive/combinatorial) that probability theory retains to this day.

What followed was a century of extraordinary consolidation. Jakob Bernoulli's *Ars Conjectandi* (published posthumously in 1713) proved the **law of large numbers** rigorously: the proportion of successes in a large number of independent trials converges to the true probability, and Bernoulli could bound how many trials were needed for a given level of confidence. Abraham de Moivre's *The Doctrine of Chances* (1718, with expanded editions in 1738 and 1756) developed the **normal approximation** to the binomial distribution and introduced the concept we now call standard deviation. Thomas Bayes' posthumous essay (1763), published by Richard Price, established the foundations of **inverse probability** --- reasoning from observed data back to the likely cause.

**Pierre-Simon Laplace** synthesized all of this in his monumental *Theorie analytique des probabilites* (1812) and its more accessible companion, the *Essai philosophique sur les probabilites* (1814). Laplace's philosophical essay articulated what became known as **Laplace's demon**: the idea that a sufficiently powerful intellect, knowing the position and momentum of every particle in the universe, could predict all future states with certainty. In this view, randomness is merely ignorance. Probability is not a property of the world but a measure of our incomplete knowledge:

> "We may regard the present state of the universe as the effect of its past and the cause of its future. An intellect which at a certain moment would know all forces that set nature in motion, and all positions of all items of which nature is composed, if this intellect were also vast enough to submit these data to analysis, it would embrace in a single formula the movements of the greatest bodies of the universe and those of the tiniest atom; for such an intellect nothing would be uncertain and the future just as the past would be present before its eyes."
>
> --- Pierre-Simon Laplace, *Essai philosophique sur les probabilites*, 1814

This **deterministic philosophy** cast a long shadow. If the universe is a clockwork mechanism, then "random" numbers are an oxymoron --- every die roll is, in principle, predictable from initial conditions. The tension between determinism and randomness would not be resolved (or at least complicated beyond recognition) until quantum mechanics arrived in the 1920s, when Heisenberg's uncertainty principle and Born's probability interpretation of the wave function introduced genuine indeterminacy into the physical world. But for the practical purposes of computation, the question that would drive the next century was narrower and more tractable: can we produce sequences of numbers that *behave* as if they are random, even if they are generated by a deterministic process?

---

## 3. The Need for Random Numbers in Science

By the early twentieth century, the statistical methods pioneered by Karl Pearson, Ronald Fisher, and their contemporaries had created a new and urgent demand: science needed random numbers, and it needed them in bulk.

The problem was experimental design. Fisher's work on agricultural field trials, beginning at the Rothamsted Experimental Station in 1919, established that valid inference requires **randomization**: treatments must be assigned to experimental units randomly, not systematically, to prevent confounding with unknown variables. But randomization requires random numbers, and random numbers required labor.

**Karl Pearson**, in a 1927 issue of *Tracts for Computers*, described the process of generating random digits by repeated die-rolling. The work was performed by human "computers" --- people, usually women, employed to perform calculations by hand. Rolling a die thousands of times, recording each result, checking for transcription errors, and then using the digits for sampling and assignment was tedious, error-prone, and painfully slow. Pearson recognized the bottleneck: statistical methods were outrunning the supply of random numbers needed to apply them.

**Leonard H.C. Tippett**, a student of Pearson's at University College London, published the first widely used table of random numbers in 1927: *Random Sampling Numbers*, a set of 41,600 digits. Tippett's method was ingenious if imperfect --- he extracted digits from census reports, specifically from area measurements of parishes, reasoning that the trailing digits of such measurements would be effectively random. The resulting table, published as Tract No. 15 of the series *Tracts for Computers*, became a standard tool in British statistics for over a decade.

**Ronald A. Fisher and Frank Yates** published their own table in 1938, as part of the first edition of their influential *Statistical Tables for Biological, Agricultural, and Medical Research*. Their table contained 15,000 random digits, generated by a method Fisher described only vaguely as involving "randomizing apparatus" --- likely a mechanical device similar to the one Kendall and Babington Smith would describe later. Fisher and Yates' table had a practical advantage: it was formatted for direct use in experimental design, with columns laid out for random assignment of treatments to plots, selection of sample members, and other common tasks that working statisticians performed daily.

The fundamental problem with all table-based approaches was scale. A table of 15,000 digits --- or even 41,600 --- is quickly exhausted by any serious Monte Carlo calculation or large-scale experimental design. Worse, tables invite reuse: if two experiments use the same "random" assignments from the same page of the same table, they are not independent. And the labor involved in producing the tables was extraordinary. Kendall and Babington Smith, writing in the *Journal of the Royal Statistical Society* in 1938, described building a mechanical device --- a motor-driven disk divided into ten sectors --- and running it to generate 100,000 digits, which they then subjected to four statistical tests (frequency, serial, gap, and poker tests). The entire enterprise took months. The statistical community needed a source of random numbers that was both larger and more reliably random than anything human labor could produce.

---

## 4. RAND Corporation's "A Million Random Digits" (1955)

In 1947, the RAND Corporation in Santa Monica, California, began a project to solve the random number supply problem once and for all. The result, published in 1955 as ***A Million Random Digits with 100,000 Normal Deviates***, remains one of the most unusual and important books in the history of computing.

The need was driven by the emerging **Monte Carlo method**. Stanislaw Ulam, recovering from an illness in 1946, had realized while playing solitaire that the probability of a given layout being solvable could be estimated by playing many random games and counting successes --- replacing intractable analytical computation with statistical sampling. Ulam shared the idea with John von Neumann, who recognized its power for the nuclear weapons calculations underway at Los Alamos. Nicholas Metropolis named the technique after the Monte Carlo casino, reportedly a nod to Ulam's uncle who "just had to go" to Monte Carlo. Monte Carlo simulation required enormous quantities of random numbers, far beyond what any published table could supply.

RAND's digits were generated by an **electronic roulette wheel** --- a random frequency pulse generator based on vacuum tube noise, gated by a constant-frequency pulse. The random source produced a stream of electronic pulses at irregular intervals; a regular clock sampled this stream, producing random bits. Five bits were grouped to produce a number between 0 and 31, and values above 9 were rejected, leaving a uniform random decimal digit. The process ran continuously for months.

Early runs revealed **biases** in the hardware: uneven vacuum tube characteristics caused certain digits to appear more frequently than expected. RAND engineers corrected this by applying a mathematical post-processing step: pairs of digits were added modulo 10. This transformation provably reduces bias: if one digit has a slight excess probability of being, say, 3, adding it to another digit (even one with its own biases) smooths the distribution toward uniformity, because the convolution of two nearly-uniform distributions is more nearly uniform than either alone.

The final million digits were subjected to a comprehensive battery of **statistical tests** --- frequency tests, serial correlation tests, gap tests, and the poker test (classifying groups of five digits as "hands" and comparing to expected frequencies). The digits passed every test available at the time, establishing a standard of quality that physical random number tables had never previously achieved.

The book was revolutionary for three reasons. First, its **scale**: one million digits was orders of magnitude larger than any previous table. A researcher could use it for years without repetition. Second, its **quality**: the combination of a physical random source with mathematical post-processing set a template that hardware random number generators still follow today. Third, its **accessibility**: RAND distributed the book and the associated punched cards widely, and later made the entire dataset available as a free download. For two decades, RAND's random digits were the gold standard for scientific computing.

The book also became famous for its **reviews**, which are among the most entertaining in the history of scientific publishing. An early review in a mathematical journal noted dryly that while the book was "not light reading, it is encyclopedic." Decades later, when the book appeared on Amazon, it attracted reviews that have become part of computing folklore:

> *"I had randomly selected this book to purchase and am pleased to say it does not disappoint."*

> *"If you like this book, I highly recommend that you also purchase a copy of the sequel, '2,000,000 Random Digits' -- same great digits, just more of them."*

RAND continues to make the book available today, both in print and as a free PDF from rand.org. It stands as a monument to an era when random numbers were a scarce industrial resource, manufactured with the same care and quality control as any other precision instrument.

---

## 5. Von Neumann's Middle-Square Method (1949)

The transition from physical to algorithmic random number generation began with **John von Neumann** in 1949. Working on hydrogen bomb calculations at Los Alamos National Laboratory, von Neumann needed random numbers faster than any physical device could supply them --- and he needed them *inside the computer*, generated on the fly, without pausing to read from punched cards or tables. His solution was the **middle-square method**, described in a 1949 lecture to the National Bureau of Standards and published in their Applied Mathematics Series in 1951.

The algorithm is disarmingly simple:

1. Start with an *n*-digit seed (von Neumann used 10-digit numbers on the ENIAC).
2. Square the seed to produce a 2*n*-digit number (padding with leading zeros if necessary).
3. Extract the middle *n* digits as the next "random" number.
4. Use this number as the new seed.
5. Repeat.

For a concrete example with a 4-digit seed of 5227:

```
Seed:     5227
Square:   27321529    -> middle 4 digits: 3215
Square:   10336225    -> middle 4 digits: 3362
Square:   11303044    -> middle 4 digits: 3030
Square:   09180900    -> middle 4 digits: 1809
Square:   03272481    -> middle 4 digits: 2724
```

The method has several **fatal flaws**:

1. **Convergence to zero.** If the middle digits ever become 0000 (or any value whose square has all-zero middle digits), the sequence degenerates permanently. The state 0000 is an absorbing state: 0000^2 = 00000000, and the middle digits are 0000 forever.

2. **Short cycles.** Even without hitting zero, sequences tend to be short. A 4-digit version has at most 10,000 possible states, but empirical testing shows that most seeds produce cycles of only a few hundred iterations. Some seeds fall into fixed points almost immediately --- 2500^2 = 06250000, yielding 2500 again.

3. **Seed sensitivity without theoretical guidance.** Small changes in the initial seed can produce wildly different cycle lengths, and there is no mathematical theory to predict which seeds are good. This is in stark contrast to later generators, where the period can be computed exactly from the parameters.

Von Neumann was fully aware of these limitations. His attitude toward algorithmic randomness was characteristically blunt and has become one of the most quoted lines in computer science:

> "Anyone who considers arithmetical methods of producing random digits is, of course, in a state of sin. For, as has been pointed out several times, there is no such thing as a random number --- there are only methods of producing random numbers, and a strict arithmetic procedure of course is not such a method."
>
> --- John von Neumann, 1951

The quote is routinely taken out of context. Von Neumann was not arguing against pseudorandom number generators --- he was arguing against *trusting* them uncritically. His full argument was pragmatic: algorithmic methods are useful precisely because they are deterministic (reproducible, debuggable, fast), and the middle-square method had the specific virtue that its failures were *visible*. If the generator fell into a short cycle or converged to zero, a programmer would notice. This was better, von Neumann argued, than opaque hardware generators whose subtle biases might go undetected for years.

The middle-square method was quickly superseded, but it established the paradigm that all subsequent pseudorandom number generators would follow: **a deterministic function that maps a current state to a next state, producing output that appears random to statistical tests even though it is entirely predictable from the initial seed**. Von Neumann's sin turned out to be the founding act of an entire field.

---

## 6. Lehmer's Linear Congruential Generator (1951)

The algorithm that would dominate pseudorandom number generation for the next four decades was proposed by **Derrick Henry Lehmer** in 1951, in a paper presented at a symposium on large-scale digital computing machinery at Harvard's Computation Laboratory. Lehmer, a number theorist at UC Berkeley, had been among the first mathematicians to use ENIAC for serious computation --- he ran number-theoretic calculations on it in the late 1940s --- and he understood both the mathematical requirements for good pseudorandom sequences and the computational constraints of the machines that would generate them.

The **linear congruential generator (LCG)** is defined by the recurrence relation:

```
X_{n+1} = (a * X_n + c) mod m
```

where:
- *X_n* is the current state (and output),
- *a* is the **multiplier**,
- *c* is the **increment** (when c = 0, the generator is called a *multiplicative* congruential generator),
- *m* is the **modulus**, and
- *X_0* is the **seed**.

The elegance of the LCG lies in its economy: one multiply, one add, one modular reduction. On the machines of the 1950s, where a multiplication might take hundreds of microseconds and memory was measured in kilobytes, this parsimony was not merely aesthetic --- it was essential for practical use.

Lehmer's original formulation used c = 0 (the multiplicative variant) with a prime modulus. He recognized immediately that the choice of constants was critical to the quality of the output. The **period** of the generator --- the length of the sequence before it repeats --- is at most *m* for the full LCG and at most *m* - 1 for the multiplicative variant (since zero is an absorbing state when c = 0). Achieving the maximum possible period requires specific relationships between the parameters.

The **Hull-Dobell theorem** (1962) established the necessary and sufficient conditions for an LCG to achieve full period (period = *m*):

1. *c* and *m* are coprime (gcd(c, m) = 1),
2. *a* - 1 is divisible by every prime factor of *m*, and
3. if *m* is divisible by 4, then *a* - 1 is also divisible by 4.

A common and computationally efficient choice is to set m = 2^k for some integer *k*, since modular reduction by a power of 2 requires no division --- it is simply the natural overflow behavior of fixed-width integer arithmetic on binary computers, or equivalently a bit-mask operation. This made LCGs particularly attractive for implementation, and power-of-two moduli became the standard choice.

But the **constants problem** --- choosing *a*, *c*, and *m* to produce sequences with good statistical properties --- proved to be far more subtle than it first appeared. A full-period generator is necessary but not sufficient for quality output. The low-order bits of an LCG with m = 2^k are notoriously non-random: the least significant bit has period 2 (it alternates between 0 and 1), the second-least-significant bit has period 4, the third has period 8, and so on. Only the highest-order bits achieve the full period. This means that extracting random bits from the bottom of an LCG's output --- a natural thing to do if you want small random numbers --- gives you the worst bits the generator produces.

Worse still, the outputs of an LCG have an inherent geometric structure discovered by **George Marsaglia** in 1968. When consecutive outputs are plotted as points in *d*-dimensional space, all points fall on a limited number of parallel hyperplanes. For a modulus *m* in *d* dimensions, the maximum number of hyperplanes is bounded by approximately (d! * m)^(1/d). This **lattice structure** is an inherent property of the LCG recurrence, not a deficiency of any particular parameter choice --- it cannot be eliminated, only managed by choosing constants that make the lattice as fine-grained as possible. The **spectral test**, which measures the quality of this lattice, became the primary tool for evaluating LCG constants.

Despite these limitations, LCGs dominated for decades because they were fast, simple to implement, easy to analyze mathematically, and --- when the constants were well-chosen --- adequate for many applications that did not require high-dimensional uniformity. The best-studied constants include the Park-Miller **MINSTD** parameters (a = 16807, c = 0, m = 2^31 - 1, proposed in 1988 as a "minimal standard" generator) and the *Numerical Recipes* recommendation (a = 1664525, c = 1013904223, m = 2^32). Both remain in use today in contexts where speed matters more than statistical perfection.

---

## 7. Early Computer Implementations: RANDU, rand(), and FORTRAN

The history of random number generation in practice is, to a significant degree, a history of bad defaults shipped to unsuspecting users.

### The RANDU Disaster

**RANDU**, distributed by IBM beginning in the early 1960s as part of the Scientific Subroutine Package for the System/360 mainframe, is the most infamous random number generator in computing history. It was a multiplicative LCG with the parameters:

```
X_{n+1} = 65539 * X_n mod 2^31
```

The multiplier 65539 = 2^16 + 3 was chosen not for its statistical properties but for **computational convenience**: multiplication by 65539 could be decomposed into a shift-left-16 and a multiply-by-3, both cheap operations on the System/360. This hardware optimization turned out to be catastrophic for the mathematical quality of the output.

RANDU passes many one-dimensional statistical tests --- its output looks reasonably uniform when examined one number at a time. But when consecutive triples (X_n, X_{n+1}, X_{n+2}) are plotted in three-dimensional space, the hyperplane problem reveals itself in its most devastating form: all points fall on exactly **15 parallel planes**. An entire dimension of apparent randomness is an illusion.

The algebraic reason is straightforward. From the recurrence relation, one can derive:

```
X_{n+2} = 6 * X_{n+1} - 9 * X_n  (mod 2^31)
```

This means every third output is a fixed linear combination of the previous two. The sequence has only two degrees of freedom in three dimensions, which forces all triples onto a family of planes. Marsaglia published this analysis in his landmark 1968 paper "Random Numbers Fall Mainly in the Planes" --- a title that is both a precise technical description and a pun on the Lerner and Loewe lyric "The Rain in Spain Falls Mainly in the Plain."

The damage was real and lasting. RANDU continued to ship as IBM's default random number generator for years after the problem was known. Scientific papers published throughout the 1960s and 1970s used RANDU-generated "random" numbers, and the results of any Monte Carlo simulation that depended on three-or-more-dimensional uniformity are suspect. Donald Knuth, in *The Art of Computer Programming, Volume 2: Seminumerical Algorithms* (first edition 1969, with major revisions in 1981 and 1997), devoted substantial space to the RANDU debacle and wrote bluntly: "It should be removed from all computer libraries."

### C's rand() and the Legacy of Bad Defaults

The **C standard library function `rand()`**, specified in K&R C (1978) and standardized in ANSI C (1989), inherited the same philosophy that produced RANDU: provide *something*, and let the implementor worry about quality. The standard specified only that `rand()` must return pseudorandom integers in the range 0 to `RAND_MAX` (at least 32767) and that `srand()` sets the seed. It said nothing about the algorithm, the period, the distribution quality, or the statistical properties of the output.

Most implementations used simple LCGs. The classic BSD implementation:

```c
static unsigned long seed = 1;

int rand(void) {
    seed = seed * 1103515245 + 12345;
    return (unsigned int)(seed >> 16) & 0x7fff;
}
```

This returns values in [0, 32767] --- a 15-bit range. The right-shift by 16 discards the worst low-order bits, but 15 bits of output from a 32-bit state is still poor by any modern standard. On some implementations, `RAND_MAX` was only 32767 (2^15 - 1), meaning that `rand() % n` for even modest values of *n* introduces severe **modular bias** --- the remainders are not uniformly distributed unless *n* evenly divides RAND_MAX + 1.

The low-order bit problem was particularly insidious. In some implementations, `rand() % 2` alternated exactly between 0 and 1 --- a period-2 cycle that made even the simplest randomized algorithm (a coin flip) useless. The BSD man page eventually included the warning: "the low dozen bits generated by rand go through a cyclic pattern." The standard workaround, `rand() / (RAND_MAX / n + 1)`, existed specifically to use the high-order bits instead, but most programmers never learned it.

A generation of C programmers wrote `rand() % 6 + 1` to simulate a die roll, not realizing that the modular reduction amplified the bias in the low-order bits and that the resulting die was measurably unfair.

### FORTRAN Random Number Subroutines

**FORTRAN** followed a parallel trajectory of vendor-supplied mediocrity. Early implementations (FORTRAN II and IV, 1960s) provided no standard random number function at all; each computer manufacturer supplied its own subroutine with its own parameters and its own quality characteristics --- or lack thereof. FORTRAN 77 still included no standard random number facility.

It was not until **Fortran 90** that the language standard introduced `RANDOM_NUMBER()` and `RANDOM_SEED()` as intrinsic subroutines. But even then, the standard left the choice of algorithm entirely to the implementor. The result was the same patchwork of quality that plagued C: some vendor implementations used excellent generators, while others shipped minimal LCGs that would fail basic statistical tests. A FORTRAN program that produced correct Monte Carlo results with one compiler's random number generator might produce subtly biased results with another's, and the programmer would have no way to know without running the spectral test themselves.

The common thread across RANDU, `rand()`, and the FORTRAN subroutines is a **failure of defaults**. In each case, the language or platform provided a random number generator that was easy to call and difficult to evaluate, and the people choosing the algorithm prioritized implementation convenience over statistical quality. The users --- scientists, engineers, graduate students --- trusted the defaults because they had no reason not to. The tools looked authoritative. The output looked random. The damage was invisible until someone thought to plot the points in three dimensions, or to check whether the low bits cycled, or to run a Monte Carlo simulation whose answer was known analytically and notice that the computed answer was wrong.

This pattern --- convenient defaults, invisible failures, delayed discovery --- would repeat throughout the history of pseudorandom number generation. It remains a live issue today, four decades after Knuth's warning, in every language and framework that ships a random number generator without clearly documenting its limitations.

---

## References

1. David, F.N. *Games, Gods, and Gambling: A History of Probability and Statistical Ideas.* Dover, 1998 (originally 1962).
2. Finkel, I.L. "On the Rules for the Royal Game of Ur." *Ancient Board Games in Perspective*, British Museum Press, 2007.
3. Cardano, G. *Liber de Ludo Aleae.* c. 1564 (published 1663). English translation in Oystein Ore, *Cardano: The Gambling Scholar*, 1953.
4. Laplace, P.-S. *Essai philosophique sur les probabilites.* 1814.
5. Tippett, L.H.C. "Random Sampling Numbers." *Tracts for Computers*, No. 15. Cambridge University Press, 1927.
6. Kendall, M.G., and Babington Smith, B. "Randomness and Random Sampling Numbers." *JRSS* 101.1 (1938): 147--166.
7. Fisher, R.A., and Yates, F. *Statistical Tables for Biological, Agricultural, and Medical Research.* Oliver & Boyd, 1938.
8. RAND Corporation. *A Million Random Digits with 100,000 Normal Deviates.* Free Press, 1955.
9. von Neumann, J. "Various techniques used in connection with random digits." *NBS Applied Math Series* 12 (1951): 36--38.
10. Lehmer, D.H. "Mathematical methods in large-scale computing units." *Annals of the Computation Laboratory of Harvard University* 26 (1951): 141--146.
11. Hull, T.E., and Dobell, A.R. "Random number generators." *SIAM Review* 4.3 (1962): 230--254.
12. Marsaglia, G. "Random numbers fall mainly in the planes." *PNAS* 61.1 (1968): 25--28.
13. Knuth, D.E. *The Art of Computer Programming, Volume 2: Seminumerical Algorithms.* 3rd ed. Addison-Wesley, 1997.
14. Metropolis, N., and Ulam, S. "The Monte Carlo method." *JASA* 44.247 (1949): 335--341.
15. Park, S.K., and Miller, K.W. "Random number generators: good ones are hard to find." *CACM* 31.10 (1988): 1192--1201.

---

*Part 1 of the Random Number Generation research series. See also: [Classical PRNGs](classical-prngs.md), [Modern PRNGs](modern-prngs.md), [Cryptographic RNG](cryptographic-rng.md), [Testing and Quality](testing-quality.md), [Applications](applications.md).*
