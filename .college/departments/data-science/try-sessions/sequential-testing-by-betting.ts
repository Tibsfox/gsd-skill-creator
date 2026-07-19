/**
 * Sequential Testing by Betting try-session -- anytime-valid inference via test martingales.
 *
 * Walk a learner from the optional-stopping catastrophe of fixed-sample
 * p-values, through building a test martingale, Ville's inequality, power
 * under the alternative, choosing the bet (GRO / online-Newton), the e-value
 * calculus, and the change/drift-detection connection, to why betting gives
 * you continuous monitoring without inflating the false-alarm rate.
 *
 * @module departments/data-science/try-sessions/sequential-testing-by-betting
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const sequentialTestingByBettingSession: TrySessionDefinition = {
  id: 'data-science-sequential-testing-by-betting-first-steps',
  title: 'Sequential Testing by Betting: Continuous Monitoring Without Peeking Penalties',
  description:
    'A guided first pass through anytime-valid testing -- from the ' +
    'optional-stopping catastrophe of fixed-sample p-values, through ' +
    'building a test martingale, Ville\'s inequality, power under the ' +
    'alternative, choosing the growth-optimal bet, the e-value calculus, ' +
    'and the change/drift-detection connection.',
  estimatedMinutes: 21,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Simulate the peeking problem directly. Draw a stream of standard-normal observations under the NULL (true mean 0), and after every new observation run a fixed-sample z-test and stop the moment p < 0.05. Repeat this Monte Carlo 10,000 times and compute the fraction of runs that ever reject. What happens to that false-alarm rate as you allow more observations?',
      expectedOutcome:
        'You SEE the empirical false-alarm rate climb far past the nominal 0.05 -- toward 0.3, 0.5, and (as n grows) 1.0. A fixed-sample p-value is only valid at a single pre-committed sample size; continuously monitoring it and stopping at the first dip below alpha destroys the type-I guarantee. This is the problem anytime-valid inference exists to solve.',
      hint: 'The p-value under the null is Uniform(0,1) at each fixed n, but the RUNNING minimum of many correlated draws drifts toward 0. Optional stopping is free money against a fixed-sample test.',
      conceptsExplored: ['data-science-sequential-testing-by-betting', 'data-hypothesis-testing'],
    },
    {
      instruction:
        'Now build a test martingale for a coin. Test H0: p = 0.5 against p > 0.5. Pick a bet lambda in (0,1) and define the per-flip betting factor as (1 + lambda) on heads and (1 - lambda) on tails. Compute the wealth process wealth = np.cumprod(factors) on a stream of FAIR coin flips (null true), and plot it for a few hundred flips over many seeds. What does the wealth do under the null?',
      expectedOutcome:
        'You observe that the wealth process wanders up and down but has expectation exactly 1 at every step -- it is a non-negative martingale under the null. It occasionally spikes and occasionally decays toward 0, but it does not systematically grow. Wealth IS the e-value: your current capital measures accumulated evidence against H0.',
      hint: 'E[factor] = 0.5(1+lambda) + 0.5(1-lambda) = 1 exactly when the coin is fair. Multiplying fair bets keeps expected wealth pinned at your starting capital.',
      conceptsExplored: ['data-science-sequential-testing-by-betting'],
    },
    {
      instruction:
        'Test Ville\'s inequality empirically. Fix a rejection threshold 1/alpha = 20 (alpha = 0.05). Across your 10,000 null runs from the previous step, compute the fraction in which the wealth EVER crosses 20 at any point in the stream. Compare that fraction to alpha.',
      expectedOutcome:
        'You measure a crossing fraction at or below 0.05, matching Ville\'s inequality: P(sup_t W_t >= 1/alpha) <= alpha for a non-negative martingale with unit start. Rejecting the null the first time wealth crosses 1/alpha therefore controls the type-I error at ANY stopping time -- the peeking penalty from step 1 has vanished.',
      hint: 'Ville\'s inequality is the martingale analogue of Markov\'s inequality applied to the running supremum. It is what makes the guarantee "anytime-valid" rather than "valid at one fixed n".',
      conceptsExplored: ['data-science-sequential-testing-by-betting', 'data-hypothesis-testing'],
    },
    {
      instruction:
        'Now switch on the signal. Regenerate the stream from a BIASED coin (p = 0.6, alternative true) and rerun the same betting martingale with the same lambda. Plot log-wealth versus number of flips, and record the detection time -- the first flip at which wealth crosses 20. Contrast the shape of the curve with the null run.',
      expectedOutcome:
        'You SEE log-wealth grow roughly linearly (wealth grows exponentially) under the alternative, crossing the threshold after a modest, finite number of flips. The betting test both controls the false alarm AND stops early when the effect is real: its growth rate equals the expected log-payoff, a KL-like measure of how far the truth sits from the null.',
      hint: 'Under the alternative, E[log factor] > 0, so by the law of large numbers cumulative log-wealth marches upward at that rate. Bigger effect -> steeper slope -> earlier rejection.',
      conceptsExplored: ['data-science-sequential-testing-by-betting'],
    },
    {
      instruction:
        'Tune the bet. Sweep lambda across (0,1) and, for the p = 0.6 alternative, compute the expected log-growth rate g(lambda) = E[log(1 + lambda*(2X - 1))]. Find the lambda that maximizes it, then contrast that oracle bet with an online-Newton-step rule that learns lambda from the data without knowing the alternative.',
      expectedOutcome:
        'You find the growth-rate-optimal (GRO) bet lambda* = 2p - 1 = 0.2 maximizes expected log-wealth, giving the fastest evidence accumulation and earliest detection. Since you never know the true alternative in practice, adaptive rules -- the online Newton step, a mixture over lambdas, or plug-in estimates -- approximate the GRO bet on the fly and pay only a small regret.',
      hint: 'Maximizing expected log-wealth is the Kelly-betting criterion. A mixture martingale integrates over lambda so you never have to commit to one, at the cost of a mild log-factor.',
      conceptsExplored: ['data-science-sequential-testing-by-betting'],
    },
    {
      instruction:
        'Explore the e-value calculus. Run the betting test on two INDEPENDENT data streams to get two e-values E1 and E2, and also run several tests on the SAME data. Combine independent evidence by multiplying (E1 * E2) and combine arbitrarily dependent tests by averaging. Check that each combination is still a valid e-value (null expectation <= 1).',
      expectedOutcome:
        'You verify that e-values MULTIPLY across independent streams to accumulate evidence and AVERAGE to merge arbitrarily dependent tests -- both operations preserve the null-expectation <= 1 property. This is a clean, correction-free calculus that p-values lack: p-values need Bonferroni or Fisher combination, while e-values compose by elementary arithmetic.',
      hint: 'A product of independent e-values is an e-value because expectations of independent variables multiply; a convex combination is an e-value by linearity, with NO independence assumption required.',
      conceptsExplored: ['data-science-sequential-testing-by-betting', 'data-science-conformal-prediction'],
    },
    {
      instruction:
        'Close the loop with change detection, then place the concept. Feed the martingale a stream that is on-null for the first 500 steps and then shifts to the alternative at a hidden change point; reset-and-restart the wealth (a CUSUM/Page-Hinkley-style detector) and record how quickly it alarms after the change. Then place sequential-testing-by-betting on the complex plane of experience and state one line that captures why betting beats fixed-sample testing.',
      expectedOutcome:
        'You watch the wealth stay flat while the stream is on-null and then take off shortly after the change point, alarming with a controlled false-alarm rate -- the same betting engine behind Page-Hinkley and ADWIN drift detectors. You place it as an abstract, high-complexity research backbone and state something like: "Betting turns hypothesis testing into a martingale you can watch forever -- Ville\'s inequality guarantees the false-alarm rate, e-values compose without corrections, and the growth-optimal bet stops you the instant the evidence is in."',
      hint: 'A sequential change detector is just a test martingale that you keep restarting; the wealth process is the shared substrate of anytime-valid testing, drift detection, and conformal inference.',
      conceptsExplored: ['data-science-sequential-testing-by-betting', 'data-science-drift-detection'],
    },
  ],
};
