# Psychology Department

**Domain:** psychology
**Source:** PSYCH-101 Psychology & Human Development Foundational Knowledge Pack
**Status:** Active
**Purpose:** Psychology, human development, and behavioral understanding across K-College -- building self-awareness, empathy, and evidence-based understanding of why people do what they do

## Wings

- Brain & Cognition -- Sensory processing, perception, attention, memory systems, cognitive biases, brain structure and function
- Emotion & Motivation -- Emotional regulation, theories of emotion, motivation models, stress response, well-being
- Development -- Lifespan development from prenatal through aging, cognitive stages, attachment, social development
- Social Psychology -- Social influence, conformity, prejudice, group dynamics, prosocial behavior, interpersonal attraction
- Behavior & Mental Health -- Learning theory, behavioral principles, psychological disorders, treatment approaches, stigma

## Entry Point

psych-perception-construction

## Concepts

### Brain & Cognition (4 concepts)
- psych-perception-construction -- How the brain constructs perception from incomplete sensory data
- psych-attention-memory -- Selective attention, working memory, long-term memory systems and forgetting
- psych-cognitive-biases -- Confirmation bias, availability, anchoring -- systematic errors in human reasoning
- psych-brain-structure -- Prefrontal cortex, limbic system, amygdala -- structure to function relationships

### Emotion & Motivation (4 concepts)
- psych-theories-of-emotion -- James-Lange, Cannon-Bard, Schachter-Singer -- what triggers emotional experience
- psych-emotional-regulation -- Reappraisal, suppression, acceptance -- strategies and their long-term effects
- psych-motivation-models -- Maslow's hierarchy, self-determination theory, intrinsic vs. extrinsic motivation
- psych-stress-response -- Fight-flight-freeze, cortisol, allostatic load -- chronic stress effects on the body

### Development (4 concepts)
- psych-developmental-stages -- Piaget's cognitive stages, Erikson's psychosocial stages across the lifespan
- psych-attachment-theory -- Bowlby and Ainsworth: secure, avoidant, anxious, disorganized attachment styles
- psych-language-development -- Critical period, babbling, two-word stage, grammar acquisition, bilingualism
- psych-adolescent-development -- Identity formation (Erikson), peer influence, risk-taking, neurological changes

### Social Psychology (4 concepts)
- psych-social-influence -- Milgram obedience, Asch conformity -- how situations shape behavior
- psych-prejudice-stereotyping -- Implicit bias, in-group/out-group dynamics, stereotype threat, reduction strategies
- psych-prosocial-behavior -- Bystander effect, diffusion of responsibility, what promotes helping behavior
- psych-attribution-theory -- Fundamental attribution error, actor-observer bias, self-serving bias

### Behavior & Mental Health (4 concepts)
- psych-learning-theory -- Classical conditioning (Pavlov), operant conditioning (Skinner), observational learning
- psych-behavior-reinforcement -- Positive/negative reinforcement and punishment, schedules of reinforcement
- psych-psychological-disorders -- DSM categories, biopsychosocial model, prevalence, stigma reduction
- psych-treatment-approaches -- CBT, exposure therapy, medication, the evidence base for psychological treatments

## Calibration Models

None currently -- future phases will add behavioral observation and self-report calibration models.

## Safety Boundaries

None -- psychology department has no safety-critical parameters.

## Cross-references — Adaptive Systems

**Department:** `.college/departments/adaptive-systems/`  
**Connection type:** Empirical foundation bridge — Psychology provides the empirical phenomena; Adaptive Systems Panel A provides the mathematical formalisation.

**`psych-learning-theory` (Behavior & Mental Health wing).**  
Classical conditioning (Pavlov 1927) and operant conditioning (Skinner 1938) are the empirical foundation for reinforcement learning. The Barto, Sutton & Anderson (1983) actor-critic architecture is the direct mathematical formalisation of operant conditioning: the Associative Search Element (ASE) is Skinner's instrumental response-selection rule implemented as a stochastic gradient update on a weight vector; the Adaptive Critic Element (ACE) is a formalisation of Skinner's discriminative stimulus as a value function. Learners who reach the limit of the empirical treatment in this concept are directed to Adaptive Systems Panel A (`A-behavioural-roots.md`) for the formal extension.

**`psych-behavior-reinforcement` (Behavior & Mental Health wing).**  
Schedules of reinforcement (fixed-ratio, variable-ratio, fixed-interval, variable-interval) determine the temporal structure of reward delivery, which directly maps to the eligibility trace decay constant λ in TD(λ) learning (Sutton 1988): the trace decay constant tunes how far back in time credit is assigned, which is the computational counterpart of the timing structure of reinforcement schedules. Formal extension: Adaptive Systems Panel A (`A-behavioural-roots.md`), §3 on eligibility traces.

**`psych-perception-construction` (Brain & Cognition wing).**  
The free-energy principle (Friston 2010) is a formal theory of perception-as-inference: the brain constructs perception by minimising variational free energy F = D_KL[q(I) || p(I|S)], where q(I) is the internal model and S is sensory data. This is the mechanistic account underlying the constructive-perception concept. Formal extension: Adaptive Systems Panel D (`D-biological-roots.md`), §4 on variational free energy.
