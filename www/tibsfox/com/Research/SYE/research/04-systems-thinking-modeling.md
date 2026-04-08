# Systems Thinking & Modeling

**Module:** SYE-04
**Series:** Systems Engineering (SYE)
**Date:** 2026-04-08

---

## 1. Why Systems Thinking

A rocket is not a collection of parts. A shuttle program is not a collection of rockets. An exploration architecture is not a collection of programs. At each level of aggregation, behavior appears that no component, taken alone, would predict. When the Columbia orbiter disintegrated over Texas in February 2003, no single piece of foam, no single tile, no single engineer, and no single memo caused the loss. The accident was a property of the system as a whole — of interactions, delays, feedback, and the slow erosion of safety margins by an organization doing what organizations do. Understanding that kind of failure, and more importantly preventing it, requires a discipline that reasons about wholes rather than parts.

That discipline is systems thinking. This module traces its origins, formalizes its core concepts, and walks through the modeling techniques — system dynamics, causal loop diagrams, STAMP/STPA, Soft Systems Methodology — that let an engineer or analyst reason rigorously about things that resist reductionism. The treatment is deliberately applied: every concept is anchored against an Apollo-era, Shuttle-era, or Artemis-era example, because aerospace is where these ideas were first forged under real consequences.

The claim of this module is not that systems thinking replaces analytical thinking. It is that analytical thinking alone — the relentless decomposition of a problem into smaller problems — works when and only when the whole is the sum of its parts. When it is not, decomposition systematically destroys the very information the engineer needs to solve the problem. Knowing the difference is the beginning of systems competence.

---

## 2. Origins: Bertalanffy and General Systems Theory

Ludwig von Bertalanffy was an Austrian biologist, born 1901, who spent much of his career frustrated by the way classical physics and chemistry were being used to explain living organisms. The reductionist program worked brilliantly for billiard balls and pendulums, but living things were different. They maintained themselves against entropy. They grew. They regulated their own temperatures and chemistries. They did not settle into equilibrium but into *steady states*, dynamically maintained by a constant flow of matter and energy through the system. Classical thermodynamics had no vocabulary for any of this.

Bertalanffy began formalizing his response in the 1930s and 1940s, but the definitive statement came in 1968 with *General System Theory: Foundations, Development, Applications*. The book's central claim was that isomorphisms — deep structural similarities — exist between systems in radically different domains. A population of rabbits regulating itself against a population of foxes obeys the same mathematical structure as an electrical circuit with feedback, or an economy with supply and demand, or a thermostat with a furnace. The variables differ, but the equations and the behaviors are the same. A general theory of systems should exist, Bertalanffy argued, and should be teachable and usable across disciplines.

Three concepts from Bertalanffy are worth naming explicitly because they recur throughout the rest of this module.

**Open systems.** A closed system exchanges nothing with its environment and must, by the Second Law, run down to equilibrium. An open system exchanges matter and energy and can maintain itself indefinitely in states of high organization. Every engineered system we care about — a spacecraft, a launch vehicle, a ground control center — is open. Reasoning about it as though it were closed is the commonest beginner mistake in systems work.

**Equifinality.** Different starting conditions, proceeding through different paths, can arrive at the same final state. In open systems this is the rule, not the exception. The practical consequence is that knowing the current state of a system tells you almost nothing about how it got there, and knowing the starting state tells you little about where it will end up. Path-independence in physics becomes path-sensitivity in systems.

**Isomorphism.** If two systems share a structure, they share behaviors. The designer can borrow intuition, tools, and warnings across domains. Forrester's system dynamics (below) exploited this ruthlessly: he used the same stock-and-flow formalism for inventory management, urban decay, and world population.

Bertalanffy's work was not immediately actionable for engineers, but it opened the door. It made it legitimate to ask, at a conference of biologists, "what would an electrical engineer do with this?"

---

## 3. Checkland and Soft Systems

By the 1970s a second current emerged. Peter Checkland, working at Lancaster University in the UK, was trying to apply the then-dominant "hard" systems engineering methods to problems in management, public administration, and organizational change. The hard methods — from RAND, from Bell Labs, from NASA — assumed that the problem was well-defined. You knew what you wanted. You knew the constraints. You had only to optimize. Checkland discovered, over years of consulting, that this assumption almost never held in human activity systems. In the real world, the stakeholders did not agree on what the problem was. They did not even agree on what counted as a solution. The methods that worked for designing a bridge failed utterly for reorganizing a hospital.

Checkland's response was Soft Systems Methodology (SSM), first published in *Systems Thinking, Systems Practice* (1981) and refined through the 1980s and 1990s. SSM is not a technique; it is a learning cycle. It begins by taking seriously the fact that different people see the same situation differently, and it treats those different views as data rather than noise.

The SSM process, in its classic seven-stage form, looks like this:

1. **Enter the problem situation.** Do not jump to defining the problem. Observe. Listen.
2. **Express the situation.** Draw a *rich picture* — a hand-drawn cartoon of the situation, with stick figures, speech bubbles, arrows, crossed swords, and whatever else captures the political and emotional reality as well as the technical facts.
3. **Formulate root definitions.** For each relevant worldview, write a short structured sentence: "a system, owned by X, that does Y by means of Z, in order to achieve W, within environmental constraints V, operated by actors T."
4. **Build conceptual models.** For each root definition, list the minimum activities the system must do to deliver its stated transformation.
5. **Compare models with reality.** Where does the conceptual model disagree with what you observed? Those gaps are where the interesting questions live.
6. **Identify feasible and desirable changes.** Some changes are desirable but not feasible. Some are feasible but not desirable. Only the intersection is actionable.
7. **Take action.** Then go back to step 1, because the situation has now changed.

The root definition step uses a mnemonic checklist called **CATWOE**:

- **C**ustomer: who benefits or suffers from this transformation?
- **A**ctors: who performs the activities?
- **T**ransformation: what input becomes what output?
- **W**eltanschauung: the worldview that makes this transformation meaningful.
- **O**wner: who could stop it?
- **E**nvironment: what constraints must the system live within?

CATWOE is disarmingly simple and, used honestly, ruthless. Most organizational initiatives fail to specify at least two of the six. The commonest omission is Weltanschauung — the worldview — because insiders assume their worldview is universal. The second commonest omission is Owner, because naming the person who can kill the project is politically uncomfortable.

Checkland's contribution was to make it respectable, in engineering circles, to treat subjective perception as a first-class variable. That matters in aerospace programs as much as in hospital reform. The shuttle's organizational culture, which eventually contributed to both *Challenger* and *Columbia*, was a soft-systems problem that the hard-systems tools of the 1980s were not equipped to see.

---

## 4. Meadows and Leverage

Donella Meadows was a biophysicist who led the team that produced *The Limits to Growth* in 1972, the first widely-known application of system dynamics to the question of global sustainability. Thirty years later, in a short essay posthumously expanded into the book *Thinking in Systems: A Primer* (2008), she left the clearest introduction to systems thinking ever written. If you read only one text on this topic, read Meadows.

Meadows's framing is built around three primitives: **stocks**, **flows**, and **feedback**. A stock is anything that accumulates — water in a bathtub, money in a bank, CO₂ in the atmosphere, crew fatigue on a long-duration flight. A flow is anything that changes a stock over time. Feedback is the structural relationship in which the level of a stock influences the rate of one of its flows.

She identifies two kinds of feedback loop, and the distinction is probably the single most important idea in this entire module.

A **balancing (or negative) feedback loop** pushes a stock toward a goal. A thermostat is the canonical example: when room temperature falls below setpoint, the furnace turns on; when it rises above setpoint, the furnace turns off. Balancing loops produce stability and goal-seeking behavior. Almost every homeostatic process in biology and every well-designed control system in engineering is built from balancing loops.

A **reinforcing (or positive) feedback loop** amplifies change. The more money you have in the bank, the more interest you earn, the more money you have. The more hydrogen ignites, the hotter the combustion chamber, the faster the reaction rate, the more hydrogen ignites. Reinforcing loops produce exponential growth or exponential collapse. They are the engines of runaway behavior, good and bad.

Real systems are webs of balancing and reinforcing loops acting simultaneously, often with **delays** — gaps in time between cause and effect. Delays are where intuition fails. A balancing loop with a long delay will overshoot its target, then correct, then overshoot again; what looks like instability is just a slow loop trying to do its job. A reinforcing loop with a long delay will appear dormant for years, then explode.

Meadows's most influential single contribution is her enumeration of **leverage points**: places to intervene in a system, ranked by power. Her list, in ascending order of leverage, is:

12. Numbers (parameters, subsidies, taxes).
11. Buffers (the size of stabilizing stocks).
10. Stock-and-flow structures.
9. Delays.
8. Balancing feedback loops.
7. Reinforcing feedback loops.
6. Information flows (who has access to what).
5. Rules (incentives, punishments, constraints).
4. Self-organization (the power to add, change, or evolve structure).
3. Goals (the purpose of the system).
2. Paradigms (the mindset out of which the system arises).
1. The power to transcend paradigms.

Her lesson is that the interventions we most love — changing the numbers, tweaking the tax rate — are the least effective. The interventions we most fear — questioning the goal, changing the paradigm — are the most effective but also the hardest and slowest. When Apollo reoriented NASA's paradigm from "incremental experimentation" to "end-to-end architectures with hard deadlines", the resulting leverage was enormous. When the post-Apollo era drifted back to incrementalism without a goal, the leverage went with it.

---

## 5. Hierarchy and Holons: Koestler and Simon

If everything is connected to everything, analysis is impossible. Fortunately, real systems are not structured that way. They are structured in near-decomposable hierarchies, a point made independently by Arthur Koestler and Herbert Simon in the 1960s.

Koestler, in *The Ghost in the Machine* (1967), coined the word **holon** for an entity that is simultaneously a whole and a part. A cell is a whole relative to its organelles and a part relative to its tissue. A crew member is a whole relative to their own cognition and a part relative to the flight crew. A spacecraft is a whole relative to its subsystems and a part relative to the mission architecture. Every real system is a *holarchy* — a hierarchy of holons, each of which can be treated, depending on the question being asked, as an atomic unit or as a sub-system to be opened up and examined.

Simon's *The Architecture of Complexity* (1962) made the same observation more mathematically. He argued that complex systems that survive tend to have a specific architectural property he called **near-decomposability**: the interactions within a subsystem are much stronger, and much faster, than the interactions between subsystems. This is not a coincidence; Simon offered a parable to explain it.

> Two watchmakers, Hora and Tempus, each assembled watches containing a thousand parts. Tempus built each watch as a single long sequence of steps. If he was interrupted, the partial assembly fell apart and he had to start over. Hora built stable sub-assemblies of ten parts, then assemblies of ten sub-assemblies, and finally assemblies of ten of those. If Hora was interrupted, he lost only the sub-assembly in progress. Given the same rate of interruption, Hora finished thousands of watches in the time it took Tempus to finish one.

The parable is ostensibly about manufacturing, but Simon's real point is evolutionary: any complex system that emerges by any stochastic process whatsoever will, over time, be dominated by near-decomposable architectures, because the non-decomposable ones get wiped out before they can complete. Engineered systems, biological systems, and social systems all show this signature. The engineer's corollary is that **well-designed systems should be near-decomposable by construction**. If your subsystem interface specs are thin and your intra-subsystem interactions are rich, you have built a system that can be understood, tested, evolved, and repaired. If your interfaces are fat and your internals are thin, you have built a thing that cannot be debugged.

The Apollo Guidance Computer is a textbook example. Its software was organized into short real-time jobs, scheduled by priority, communicating through a carefully defined set of erasable-memory variables. When the 1201 and 1202 alarms fired during the Apollo 11 descent, the system could shed low-priority jobs and continue with critical ones precisely because its architecture was near-decomposable. A monolithic design would have crashed the landing.

---

## 6. Emergence

Emergence is the most misused word in systems thinking. Strip away the mysticism and emergence means something precise: **a property of a whole that cannot be predicted from the properties of its parts in isolation, and that requires the interactions between the parts to explain.**

A pendulum's period emerges from gravity, mass, and length. That is *weak emergence*: in principle, given the parts and the laws, you could compute the period from first principles. Most of engineering is weak emergence. Stress concentrations in a bracket, resonant frequencies of a truss, launch loads on a payload shroud — all of these are computable from the components and the rules. You compute them; they are not surprises. The word "emergent" applied to such phenomena is a label, not a mystery.

*Strong emergence* is the harder case. It is the claim that there exist wholes whose behavior cannot, even in principle, be computed from the parts — that qualitatively new causal powers appear at higher levels. Strong emergence is philosophically contested, and for an engineer it is mostly a warning flag rather than a tool: when someone invokes it, ask whether they have actually checked that the behavior is not merely weakly emergent but not-yet-computed.

Between the two, and most useful practically, is what we might call **computational emergence** or **epistemological emergence**: behaviors that are in principle derivable from the parts and the rules but that are computationally intractable to predict. Turbulence. Organizational culture. The decision-making of a flight control team under stress. These are not magic, but you will never sit down with a spreadsheet and derive them. You will have to simulate, model, experiment, or observe.

The practical engineer's posture toward emergence is therefore: expect it, instrument for it, and do not design as though it does not exist. The Columbia accident is often framed as foam impact plus reinforced carbon-carbon damage, but the deeper story is the emergence of a risk-tolerant culture from thousands of individually-reasonable decisions, each taken inside a local bureaucratic context, none of which would have seemed dangerous to its author. No one *decided* to fly with a weakening safety margin. The weakening was emergent.

---

## 7. System Dynamics: Forrester's Engine

Jay Forrester was an electrical engineer at MIT who, in the 1950s, was invited to help General Electric understand why a particular appliance factory in Kentucky experienced violent three-year cycles in employment. The factory would hire frantically, then lay off frantically, then hire again. GE management blamed the business cycle. Forrester, used to thinking about feedback and delays from his servomechanism work on the Whirlwind computer and the SAGE air defense system, modeled the factory's internal ordering, production, and staffing policies and discovered that the cycles were generated *inside* the factory. The external demand was essentially flat. The oscillations were produced by a reinforcing loop coupled to a balancing loop with delays — the classic recipe for oscillation.

That insight, generalized, became **system dynamics**, formalized in Forrester's *Industrial Dynamics* (1961). System dynamics models a situation as a set of stocks connected by flows, with feedback loops governing the flow rates. The modeler writes differential equations (usually first-order, often nonlinear), parameterizes them from whatever data is available, and runs the simulation forward in time. The output is a set of time-series trajectories that reveal the system's dynamic behavior: growth, decay, oscillation, S-shaped growth, overshoot and collapse.

The key elements of a system dynamics model are:

**Stocks** — accumulations, drawn as rectangles. Examples: number of completed widgets in a warehouse, crew fatigue hours, cumulative launch experience, money in a program budget.

**Flows** — rates, drawn as thick arrows with valve symbols. Examples: widgets produced per day, fatigue accumulated per mission hour, launches per year, dollars spent per quarter.

**Auxiliaries** — computed quantities that are not stocks themselves but depend on stocks. Examples: desired inventory, fatigue-adjusted performance, launch rate target.

**Feedback loops** — chains of cause and effect that close on themselves, labeled R for reinforcing or B for balancing.

A **causal loop diagram** (CLD) is the informal, qualitative cousin of a full stock-and-flow model. It shows variables as nodes and causal influences as arrows, annotated with + (same direction) or − (opposite direction) and looped identifiers (R1, B1, and so on). A CLD will not simulate, but it will communicate structure rapidly and will expose thinking errors. Experienced practitioners usually draw CLDs first, then convert to stock-and-flow only for the loops that matter enough to quantify.

Here is a simple textual CLD for a spacecraft program's schedule pressure, which is worth studying because it explains a large fraction of aerospace program behavior:

```
    Schedule pressure ──(+)──> Hours worked
            ^                        │
            │                       (+)
            │                        v
           (+)                   Short-term
            │                    progress
            │                        │
            │                       (+)
            │                        v
            │              Apparent schedule
            │                    health
            │                        │
            │                       (−)
            │                        v
            └──────────(+)──── Management comfort
                                     │
                                    (−)
                                     v
                          Reviews & oversight
                                     │
                                    (−)
                                     v
                             Defect detection
                                     │
                                    (+)
                                     v
                            Latent defects  ────(+)────> Rework later
                                                               │
                                                              (+)
                                                               v
                                                       Schedule pressure
```

The outer loop is reinforcing with a long delay: schedule pressure produces more hours, more hours produce short-term progress, short-term progress produces comfort, comfort reduces oversight, reduced oversight lets latent defects accumulate, defects eventually cause rework, rework worsens schedule pressure. The delay between "reduced oversight" and "rework later" is the killer; it is measured in years for an aerospace program, and by the time the feedback closes, the people who reduced the oversight are gone or promoted.

This is not a toy. It is a recognizable fingerprint in almost every troubled aerospace program of the last fifty years, from the Shuttle thermal protection system to the James Webb Space Telescope early years to the 737 MAX. Once you have seen it, you cannot unsee it.

Modern system dynamics tools include **Vensim** (Ventana Systems, since 1988, the de-facto standard in academic and policy work, with a free educational version), **Stella** (isee systems, user-friendly and widely used in K-12 and undergraduate teaching), and **AnyLogic** (multi-paradigm, combining system dynamics with agent-based and discrete-event modeling, widely used in industry for supply chain and operational analysis). Vensim's strength is rigor and auditability; Stella's is pedagogy; AnyLogic's is integration with other modeling paradigms.

---

## 8. Systems of Systems: Maier's Taxonomy

Not every large collection of systems is a "system of systems". Mark Maier, at Aerospace Corporation, published in 1998 the definitive taxonomy that distinguishes genuine SoS from merely large systems. His test has two parts, and both must hold.

**Operational independence.** Each constituent system is useful on its own. If you disassemble the SoS into its components, every component still performs some meaningful function for some stakeholder. A GPS satellite, taken out of the constellation, is still a radio beacon. A brake caliper, taken out of a car, is not a brake caliper.

**Managerial independence.** Each constituent system is not only capable of independent operation but is actually operated, acquired, and managed by a separate organization with its own goals, budget, and authority. GPS satellites are managed by the US Space Force. GPS receivers are designed, built, and operated by dozens of independent companies and agencies. No single manager controls the whole constellation plus receiver ecosystem, and that is the defining feature.

Systems that meet both tests also exhibit three further characteristics:

**Evolutionary development.** The SoS is never "done". It grows, shrinks, and reconfigures over decades. There is no final acceptance test.

**Emergent behavior.** The behaviors that matter at the SoS level are emergent from the interactions of constituents. No constituent, read alone, exhibits them.

**Geographic distribution.** Constituents are physically separated enough that interactions must happen through information exchange rather than through physical coupling.

Maier then classifies SoS by the degree of central authority that exists over the constituents:

**Directed SoS.** Built and managed to fulfill specific purposes. Central authority exists and can direct constituents, though each constituent retains an ability to operate independently. The US Ballistic Missile Defense System is a directed SoS. The Space Launch System plus Orion plus Gateway plus Human Landing System, taken as the Artemis architecture, is increasingly directed.

**Acknowledged SoS.** Recognized objectives, a designated manager, and resources for the SoS. But constituents retain their own management, funding, and development approaches. Most of DoD's major programs are acknowledged SoS. The International Space Station program, with its five partner agencies each managing their own segment, is a canonical example.

**Collaborative SoS.** Constituent systems voluntarily interact to fulfill agreed-upon central purposes. There is no central authority that can compel participation. The Internet is the archetype. International deep-space tracking, with contributions from NASA's DSN, ESA's ESTRACK, and others, is a collaborative SoS.

**Virtual SoS.** No central management authority and no centrally agreed-upon purpose. The SoS emerges from the interactions of independently-managed systems. The global civil aviation system, or the global food supply, is a virtual SoS. Many large ecosystems — natural and technological — operate this way.

The taxonomy matters because the engineering approach that works for one category fails for another. You cannot do directed-SoS engineering on a virtual SoS; you will simply be ignored. You cannot do virtual-SoS engineering on a directed SoS; you will fail to exploit the authority you actually have. The first question in any SoS problem is which category you are in.

**Artemis as an SoS.** The Artemis program, as currently structured, is a hybrid. The SLS/Orion launch stack is directed. The Human Landing System contract, with multiple providers, is acknowledged. The Lunar Gateway, with international partners, is acknowledged trending toward collaborative. The broader cislunar economy — commercial lunar landers, communications relays, science payloads from multiple agencies — is collaborative. The right SoS posture varies element by element, and conflating them is a failure mode. Historical parallel: the Shuttle program in its operational years was managed as though it were a directed product, but its customer base, crew training, payload community, and international partnerships made it, in Maier's sense, an acknowledged SoS whose managerial complexity was systematically underestimated.

---

## 9. STAMP and STPA: Leveson's Safety Framework

Nancy Leveson at MIT spent two decades watching hazard analysis tools fail to keep up with the systems they were supposed to analyze. Fault Tree Analysis (FTA) and Failure Modes and Effects Analysis (FMEA) were developed for electromechanical systems in which components failed in well-defined modes: a valve stuck open, a resistor burned out, a bearing seized. These tools are excellent at what they were designed for, and they are still the right tool for many jobs. But they share a structural assumption: that accidents are caused by component failures. In modern software-intensive, tightly-coupled, socio-technical systems, that assumption is often wrong. Accidents increasingly arise from *unsafe interactions between components that were each working exactly as specified*.

Leveson's response, developed through the 2000s and formalized in *Engineering a Safer World* (2011), is **STAMP** — the Systems-Theoretic Accident Model and Processes. STAMP reframes accidents as arising from *inadequate control*. Every safety-critical system is modeled as a hierarchical control structure, with controllers issuing control actions to controlled processes, and feedback flowing upward. A safe system is one in which every controller has an accurate model of the process it controls, and in which control actions are sufficient to keep the process within safe states. An accident happens when the controller's process model diverges from reality, or when control actions become unsafe.

On top of STAMP, Leveson built **STPA** — System-Theoretic Process Analysis — a hazard analysis technique that works top-down from system-level losses. The STPA process has four steps.

**Step 1: Define the purpose of the analysis.** Identify the losses you want to prevent (loss of crew, loss of vehicle, loss of mission), the system-level hazards that could cause them (uncontrolled re-entry, collision, fire), and the safety constraints that must hold.

**Step 2: Model the control structure.** Draw a hierarchical diagram of controllers, controlled processes, control actions (downward arrows), and feedback (upward arrows). Include human controllers, software controllers, organizational controllers, and regulatory controllers. For a lunar descent, this diagram spans from the propulsion hardware at the bottom to the crew to the flight control team to the mission management team to the program office to the regulator, with control actions and feedback defined at every level.

**Step 3: Identify unsafe control actions.** For each control action, ask four questions. Could a loss occur if the action were (a) not provided when required, (b) provided when not required, (c) provided too early, too late, or in the wrong order, or (d) stopped too soon or applied too long? Each "yes" is an unsafe control action that must be traced to a safety requirement.

**Step 4: Identify loss scenarios.** For each unsafe control action, determine *why* it might occur. Possible causes include wrong process model, missing feedback, delayed feedback, controller algorithm flaws, coordination failures between multiple controllers, and inadequate control in the face of external disturbances.

The output of an STPA analysis is a set of new safety requirements, refinements to the control structure, and specific scenarios that must be guarded against. Unlike FTA, STPA does not require starting from a known failure; it can find hazards in systems where every component works perfectly.

**Columbia re-examined.** Leveson and her students applied STAMP retrospectively to the Columbia accident and demonstrated something the Columbia Accident Investigation Board had also found, but which STAMP made structurally explicit: the accident was caused not by foam but by the slow erosion of the control structure. Specifically, the "foam shedding" hazard had been downgraded over years from "in-flight anomaly requiring resolution" to "accepted risk" through a series of individually-reasonable decisions, each taken by a controller (program office, flight readiness review, engineering community) whose process model had drifted away from the physical reality. The foam strike on STS-107 was not a surprise in the narrow sense; similar strikes had occurred repeatedly. The surprise was that the control structure had become incapable of treating it as a hazard. STAMP gives us vocabulary for that diagnosis: *inadequate control due to process-model divergence across the hierarchy*.

**Other applications.** STPA has been applied to nuclear plant safety (for instance in Japan after Fukushima), to medical devices including radiation therapy systems, to automotive brake-by-wire and autonomous driving, to air traffic management, and to spacecraft software from academic CubeSats up through operational human-spaceflight programs. The STPA Handbook (Leveson and Thomas, 2018) is freely available and is the standard reference.

---

## 10. Soft Systems in Practice: Rich Pictures and Systemigrams

We return briefly to soft-systems methods because they are the right tools for messy, ill-defined problem situations that hard-systems methods mishandle. Two artifacts deserve mention.

A **rich picture**, in Checkland's SSM tradition, is a hand-drawn cartoon of a situation. It includes stick figures with speech bubbles, arrows indicating influence, crossed swords indicating conflict, hearts indicating alliances, dollar signs indicating money flows, clock faces indicating time pressure, and anything else the analyst finds relevant. It is deliberately informal because its purpose is to capture the *felt* structure of the situation — the politics, the frustrations, the implicit power relations — that a formal diagram would sanitize away. Rich pictures work because they are fast, cheap, embarrassing (which means they force honesty), and shareable. When a team draws a rich picture together, the act of drawing surfaces disagreements that would have remained invisible in a discussion.

A **systemigram**, developed by John Boardman and Brian Sauser in the 2000s, is a more structured cousin. It is a single diagram that tells a *story* about a system in words and arrows, read from upper-left to lower-right. Every node is a noun phrase. Every arrow is a verb phrase. The diagram is constructed so that any path from upper-left to lower-right reads as a grammatical sentence. Systemigrams are used in SoS stakeholder analysis because they force the analyst to produce a diagram that non-technical stakeholders can read aloud. If you cannot read your own diagram as English sentences, you do not yet understand it.

---

## 11. The Eleven Principles

Across the traditions surveyed — Bertalanffy, Checkland, Meadows, Simon, Forrester, Maier, Leveson — a consistent set of principles recurs. The following list is a synthesis drawn from Meadows, Sterman (*Business Dynamics*, 2000), and INCOSE's SoS guide.

1. **Structure generates behavior.** The same people with the same intentions will produce different behaviors if you change the structure they operate in.
2. **Everything is connected, but not equally.** Near-decomposability is the saving grace that makes analysis possible.
3. **Systems resist change.** Policy resistance is the rule. Look for the balancing loops that are defending the current state.
4. **The bottleneck is not where you think it is.** It is where the slowest loop closes.
5. **Delays matter more than intuition suggests.** A delayed balancing loop will oscillate; a delayed reinforcing loop will surprise you.
6. **Stocks are memory.** They encode the system's history and give it inertia.
7. **Feedback makes cause and effect non-local in time and space.** Today's problem is often yesterday's solution.
8. **Boundaries are chosen, not given.** The boundary of your model determines what you can learn from it.
9. **Emergence is the rule, not the exception.** Design for observability.
10. **No single worldview is complete.** Multiple models are always necessary.
11. **Leverage lives in paradigms, not parameters.** The hardest changes are the most powerful.

Memorizing the list is pointless. Using it as a checklist during problem analysis is extremely valuable, especially the ones that contradict your instincts on a given day.

---

## 12. Three Applied Examples

**Apollo Guidance Computer as emergent design.** The AGC was not a masterpiece because any single component was remarkable. Individual ropes of core memory were mundane. The ISA was minimal. The clock rate was painful even by 1966 standards. What made it remarkable was the priority-scheduled real-time executive — the Executive and Waitlist routines — which allowed the software to degrade gracefully under load. The behavior that saved Apollo 11 (shedding low-priority jobs during the 1201/1202 alarms) was a property of the architecture as a whole. No component was designed to "save the mission during rendezvous-radar interference"; the capability emerged from the structure. This is weak emergence at its best, and it is what good systems design looks like.

**Shuttle as SoS.** The Space Shuttle is usually described as a vehicle, but operationally it was an acknowledged SoS in Maier's sense. The orbiter, the main engines, the solid rocket boosters, the external tank, the ground processing at KSC, the Mission Control Center in Houston, the TDRS satellite network, the payload community, the astronaut office, the international partners on Spacelab and ISS — all of these had operational independence (each did useful work outside the context of any single mission) and managerial independence (each had its own budget, its own schedule, its own reporting chain). Treating the whole as a single vehicle, managed as a single product, was structurally incompatible with how it was actually organized and contributed to the difficulty of reforming it after both tragedies.

**Artemis as SoS.** The Artemis architecture, spanning SLS, Orion, Gateway, Starship HLS, Blue Moon HLS, lunar surface EVA suits, commercial lunar payload services, and international partnerships, is explicitly designed as a system of systems. Different elements are in different Maier categories. SLS/Orion is directed. HLS is acknowledged with some collaborative features. Cislunar infrastructure is trending toward collaborative. Understanding the architectural posture of each element determines the right engineering and management approach for that element. It also determines which safety analysis technique to use: STPA at the integrated-control-structure level is particularly well-suited to SoS where traditional FTA cannot span the boundary between directed and collaborative constituents.

---

## 13. Practicing

The fastest route into real systems thinking, for an engineer who already knows enough math to be dangerous, is the following.

Read Meadows's *Thinking in Systems* cover to cover. It is short. Do the exercises with a pencil.

Draw causal loop diagrams for three situations you know well. One should be technical (a development program, a reliability problem, a safety issue). One should be organizational (a team dynamic, a hiring cycle, a meeting culture). One should be personal (your sleep, your training schedule, your budget). Drawing CLDs for things you know well teaches you what the method can and cannot do, before you apply it to things you do not know well.

Download Vensim PLE (free for educational use) and build a stock-and-flow model of one of your CLDs. Simulate it. Compare the output to what actually happened. Adjust. Learn from the disagreement.

Read the STPA Handbook by Leveson and Thomas. Apply STPA to a small system you care about. If you work in aerospace, pick a real subsystem you do not own but understand. If you work elsewhere, pick a household system with safety implications (a propane water heater and its vent, a wood stove and its chimney, a home electrical panel). The scale does not matter; the discipline does.

Draw a rich picture of your current project's *political* landscape, not its technical one. Do not show anyone. Notice what you learned.

That sequence, worked carefully, takes about three months of evenings. At the end you will have the tools to reason about systems at four levels — quantitative simulation, qualitative causal diagrams, hierarchical control analysis, and soft-systems situational assessment — and the judgment to know which level to use for which problem.

---

## 14. Closing

Systems thinking is not a philosophy and it is not a branch of engineering. It is a discipline for reasoning about things whose behavior is a property of the whole. Every spacecraft program, every launch vehicle, every flight operations center, every lunar architecture, and every exploration campaign is such a thing. The tools surveyed in this module — Bertalanffy's general systems view, Checkland's soft systems methodology, Meadows's leverage points, Simon's near-decomposability, Forrester's system dynamics, Maier's SoS taxonomy, Leveson's STAMP and STPA — are not competing schools. They are complementary instruments in a single toolbox, and the competent systems engineer reaches for whichever one fits the question at hand.

The Apollo program was, among many other things, the first aerospace effort large enough that systems thinking became structurally necessary rather than optional. The Shuttle program was the first in which the absence of explicit SoS-level management contributed directly to two losses of crew. The Artemis program is the first that has been designed, from the beginning, as a declared system of systems. Whether that design is matched by the practice is the question every Artemis engineer will face in the next decade.

The answer will not be a matter of better parts. It will be a matter of better wholes.

---

## References

Bertalanffy, L. von (1968). *General System Theory: Foundations, Development, Applications.* George Braziller.

Checkland, P. (1981). *Systems Thinking, Systems Practice.* John Wiley & Sons.

Checkland, P., and Scholes, J. (1990). *Soft Systems Methodology in Action.* John Wiley & Sons.

Forrester, J. W. (1961). *Industrial Dynamics.* MIT Press.

Koestler, A. (1967). *The Ghost in the Machine.* Hutchinson.

Leveson, N. (2011). *Engineering a Safer World: Systems Thinking Applied to Safety.* MIT Press.

Leveson, N., and Thomas, J. (2018). *STPA Handbook.* MIT.

Maier, M. (1998). "Architecting Principles for Systems-of-Systems." *Systems Engineering*, 1(4), 267–284.

Meadows, D. H. (2008). *Thinking in Systems: A Primer.* Chelsea Green.

Meadows, D. H., Meadows, D. L., Randers, J., and Behrens, W. (1972). *The Limits to Growth.* Universe Books.

Simon, H. A. (1962). "The Architecture of Complexity." *Proceedings of the American Philosophical Society*, 106(6), 467–482.

Sterman, J. D. (2000). *Business Dynamics: Systems Thinking and Modeling for a Complex World.* Irwin/McGraw-Hill.

Columbia Accident Investigation Board (2003). *Report, Volume I.* NASA.

INCOSE (2022). *Systems Engineering Handbook*, 5th edition, System of Systems chapter.
