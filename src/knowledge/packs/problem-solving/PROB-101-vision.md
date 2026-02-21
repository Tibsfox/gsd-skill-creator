# PROB-101: Problem Solving — Foundational Knowledge Pack

**Date:** February 20, 2026
**Status:** Initial Vision / Pre-Research
**Depends on:** gsd-skill-creator-analysis.md, gsd-chipset-architecture-vision.md, gsd-os-desktop-vision.md
**Context:** Problem solving is what humans do when they do not know what to do. This pack teaches the universal strategies — decomposition, pattern recognition, abstraction, working backwards, analogy — that transfer across every domain. It is not about memorizing procedures for specific problem types; it is about developing the meta-cognitive toolkit that makes someone a better problem solver everywhere.

---

## Vision

Every human being encounters problems every day. Some are trivial — how to fit everything into a suitcase, how to rearrange a schedule when something changes. Others are profound — how to reduce inequality, how to cure a disease, how to build a bridge that will not fall down. What separates effective problem solvers from ineffective ones is not intelligence, talent, or knowledge (though all of those help). It is *strategy*. Effective problem solvers have a repertoire of general-purpose approaches they can apply when they do not immediately know what to do.

This pack teaches those strategies explicitly. Not as abstract theory, but as practical tools that learners use, practice, and internalize until they become habits of mind. When faced with a problem they have never seen before, a skilled problem solver does not panic. They ask: What do I know? What do I need to find out? Can I break this into smaller pieces? Have I seen something similar? Can I work backwards from the answer? Can I try a simpler version first? Can I draw a picture?

These are the heuristics that George Polya documented in his landmark work *How to Solve It* in 1945. They are the same strategies that computer scientists formalized as computational thinking. They are the same patterns that design thinkers use to navigate ambiguity. They are the same approaches that engineers use to tackle complex systems. And they are the same methods that children use naturally when they play — trying, failing, adjusting, trying again — before schooling teaches them to wait for instructions.

For GSD-OS, this pack serves as the meta-cognitive engine beneath all skill development. A learner who understands problem-solving strategies can learn mathematics more effectively, write better code, design better experiments, and navigate social challenges more skillfully. Problem solving is not a subject — it is the substrate on which all subjects build. Every STEM pack, every creative pack, every practical skills pack assumes that the learner can confront novel challenges and work through them productively. This pack ensures they can.

The deepest aspiration of this pack is to cultivate what psychologists call *productive struggle* — the willingness to stay engaged with difficulty, to treat confusion as information rather than failure, and to believe that effort applied strategically will eventually yield understanding. A learner who has internalized this disposition does not give up when problems get hard. They get curious.

---

## Problem Statement

Problem-solving education typically fails learners in four fundamental ways:

**1. Strategies taught only within specific domains.** Students learn to solve quadratic equations in algebra class, balance chemical equations in chemistry class, and debug code in computer science class. But they are rarely taught that all three activities share the same underlying strategy: identify what you have, identify what you need, and systematically work toward the goal. The transferable meta-strategies are invisible because they are never named, practiced, or discussed as standalone skills.

**2. Problems presented as exercises with known solutions.** In most educational settings, a "problem" is really an exercise — a task with a known procedure and a correct answer. Students learn to recognize problem types and apply the matching algorithm. This creates the illusion of problem-solving competence while developing none of the real skills: handling ambiguity, choosing among strategies, monitoring progress, and recovering from dead ends. When students encounter genuinely novel problems — ones where no algorithm is obvious — they freeze.

**3. Speed valued over depth.** Timed tests and rapid-fire homework reward fast pattern matching, not thoughtful analysis. Students learn that being slow means being wrong. But real problem solving is slow. Polya's first step — "understand the problem" — is where most students skip to the computation. They start calculating before they know what they are calculating, drawing before they know what they are drawing, coding before they know what they are coding. Speed without understanding is the enemy of genuine problem solving.

**4. Failure treated as something to avoid.** In most classrooms, wrong answers are penalized. Students learn to avoid risk, avoid novel approaches, and avoid the possibility of being wrong. But wrong answers are *information*. Dead ends are *data*. Failed attempts reveal what does not work, which is essential for discovering what does. The fear of failure is the single greatest obstacle to developing problem-solving competence, and traditional education cultivates that fear systematically.

Additionally, many parents and mentors believe that problem solving is an innate ability — you either "get it" or you do not. This fixed-mindset belief prevents them from teaching strategies explicitly, offering productive struggle, and modeling the messy, iterative reality of how problems actually get solved.

This pack addresses these gaps by:
1. Teaching problem-solving strategies explicitly as domain-independent skills
2. Presenting genuinely novel problems that require strategy selection, not algorithm application
3. Valuing process over answer — rewarding good strategy use even when the solution is not reached
4. Normalizing productive struggle and treating failure as essential feedback
5. Providing parents and mentors with concrete tools for supporting problem solvers without rescuing them

---

## Core Concepts

The five essential ideas that everything in this pack builds from:

1. **Understanding the Problem:** Before solving anything, you must understand what is being asked. This sounds obvious but is where most problem solvers fail. Understanding means restating the problem in your own words, identifying what is known and what is unknown, clarifying constraints and conditions, and determining what a solution would actually look like. Polya called this "understanding the problem" and placed it first for a reason — everything else depends on it. A learner who rushes past this step will solve the wrong problem efficiently.

   At the foundation level, this means asking "What are we trying to do?" and "What do we already know?" At advanced levels, it means formal problem specification, constraint analysis, and identifying the problem's relationship to known classes of problems. At every level, it means the discipline to slow down and think before acting.

2. **Decomposition and Organization:** Big problems are scary. Small problems are manageable. Decomposition is the strategy of breaking a large, complex problem into smaller, more tractable sub-problems that can be solved independently and then assembled into a complete solution. Organization is the complementary skill of structuring information — making lists, drawing diagrams, creating tables, building models — so that patterns become visible and relationships become clear.

   Computational thinking places decomposition as one of its four pillars for good reason: it is the single most powerful general-purpose problem-solving strategy. Every engineer who designs a complex system, every programmer who writes a large application, every project manager who plans a multi-year initiative, and every chef who prepares a multi-course dinner uses decomposition. Teaching it explicitly and early gives learners a tool they will use for the rest of their lives.

3. **Strategy Selection:** When faced with a problem, experienced problem solvers do not immediately start computing. They pause and consider which approach is most likely to work. This pack teaches a toolkit of general-purpose heuristics — strategies that do not guarantee a solution but often lead to one:

   - **Work backwards:** Start from the desired end state and reason toward the current state.
   - **Find a pattern:** Look for regularities that suggest a general rule.
   - **Simplify first:** Solve a smaller or easier version of the problem, then generalize.
   - **Guess and check:** Make an educated guess, test it, and refine based on the result.
   - **Draw a diagram:** Create a visual representation that makes relationships concrete.
   - **Make a table:** Organize data systematically to reveal patterns.
   - **Use analogy:** Recall a similar problem and adapt its solution to the current one.
   - **Consider extreme cases:** Test what happens at the boundaries to build intuition.
   - **Eliminate possibilities:** Systematically rule out options to narrow the solution space.

   The goal is not to memorize these strategies but to internalize them so deeply that selecting and applying them becomes automatic. A skilled problem solver does not think "I should try working backwards." They simply start working backwards because their experience tells them it is promising for this type of problem.

4. **Execution and Monitoring:** Having a plan is not enough — you must carry it out while continuously monitoring whether it is working. Execution requires persistence, precision, and attention to detail. Monitoring requires metacognition — the ability to observe your own thinking process and evaluate whether you are making progress.

   Key monitoring questions include: Am I getting closer to the goal? Is this approach working, or should I try something else? Have I made an error somewhere? Am I solving the right problem? These questions distinguish experts from novices. Novices persist with failing strategies because they do not monitor their own progress. Experts switch strategies fluidly because they are constantly evaluating effectiveness.

   This concept also encompasses the skill of *getting unstuck*. Every problem solver gets stuck. The difference is what happens next. Novices give up or wait for help. Experts try a different strategy, simplify the problem, take a break and return with fresh eyes, or seek out the specific piece of knowledge they are missing.

5. **Reflection and Transfer:** After solving a problem (or failing to solve it), the learning is not over. Reflection means looking back at the process: What strategy did I use? Why did it work (or not)? What would I do differently next time? Could this approach work for other problems?

   Transfer is the ultimate goal of problem-solving education — the ability to apply strategies learned in one context to problems in a completely different domain. A student who learns to decompose problems in mathematics should recognize the same strategy when facing a complex essay assignment, a multi-step cooking recipe, or a social conflict with multiple dimensions. Transfer does not happen automatically; it requires explicit practice in recognizing structural similarities across superficially different problems.

---

## Skill Tree

Problem-solving skills develop across a continuous spectrum. This skill tree organizes development from earliest exposure through expert-level mastery:

### Foundation (PreK-2)

At the earliest levels, problem solving is play. Children naturally explore, experiment, and try different approaches when they encounter obstacles. The goal at this stage is to preserve and strengthen these instincts rather than replace them with rule-following.

**Key skills:**
- Trial and error with simple physical puzzles (shape sorters, building blocks, simple mazes)
- Identifying what is "the same" and "different" (early pattern recognition)
- Describing a problem in own words ("What are we trying to do?")
- Trying more than one approach when the first one does not work
- Asking for specific help rather than giving up ("I need..." vs. "I can't")

### Elementary (3-5)

Students begin to use named strategies consciously. They can decompose simple problems, create organized representations, and reflect on their process with increasing sophistication.

**Key skills:**
- Breaking multi-step problems into smaller steps (decomposition)
- Drawing diagrams and making tables to organize information
- Working backwards from a known answer to verify solutions
- Finding and extending simple patterns
- Using guess-and-check with systematic improvement
- Explaining their strategy to a peer ("First I tried... then I noticed... so I...")
- Identifying when they are stuck and choosing a different approach
- Comparing their approach with others' approaches to see different valid paths

### Middle School (6-8)

Students develop fluency with multiple strategies and begin to select among them based on problem characteristics. They encounter more complex problems requiring multi-step reasoning and integration of knowledge across domains.

**Key skills:**
- Selecting appropriate strategies based on problem structure
- Combining multiple strategies within a single problem
- Using analogy: recognizing structural similarity between problems in different domains
- Creating and testing conjectures systematically
- Evaluating the quality and efficiency of different solution paths
- Collaborative problem solving: contributing to and building on group reasoning
- Identifying assumptions and questioning whether they are valid
- Persisting through extended problems that require multiple sessions

### High School (9-12)

Students tackle genuinely complex problems involving multiple variables, competing constraints, and ambiguous success criteria. They develop facility with formal problem-solving frameworks (computational thinking, design thinking, systems thinking).

**Key skills:**
- Formal decomposition of complex systems into interacting components
- Abstraction: identifying the essential structure of a problem by removing irrelevant detail
- Algorithm design: creating step-by-step procedures for classes of problems
- Optimization: finding not just a solution but the best solution under given constraints
- Proof and argumentation: demonstrating why a solution works, not just that it works
- Managing uncertainty: making decisions with incomplete information
- Cross-domain transfer: deliberately applying strategies from one field to another
- Metacognitive monitoring: real-time awareness of one's own reasoning process

### College and Beyond

Advanced problem solvers work at the frontier of knowledge where no established procedures exist. They create new frameworks, identify new problem classes, and develop novel approaches.

**Key skills:**
- Research methodology: formulating questions that advance understanding
- Complex systems analysis: modeling problems with many interacting variables
- Wicked problems: engaging with problems that have no clear definition or solution
- Creative problem solving: generating novel approaches through lateral thinking
- Teaching problem solving: helping others develop their own strategic repertoire
- Meta-problem-solving: recognizing which problems are worth solving and why

---

## Modules

### Module 1: Understanding Problems (PROB-101-M1)

**What It Teaches:**
Before you can solve a problem, you must understand it. This module develops the foundational skill of problem comprehension — the ability to take a messy, ambiguous, or unfamiliar situation and transform it into a clear, actionable problem statement. This is where most problem-solving failures begin: people start solving before they understand what they are solving.

**Core Skills:**
- Restating problems in your own words to verify comprehension
- Identifying knowns (what you have) and unknowns (what you need)
- Clarifying constraints (what limits the solution) and conditions (what the solution must satisfy)
- Distinguishing between the stated problem and the real problem
- Identifying relevant information and filtering out distractions
- Recognizing problem types: open-ended vs. well-defined, one-solution vs. many-solutions

**Interactive Elements:**
- *Problem Translation Challenge:* Given a problem in technical language, restate it in everyday words. Given a problem in everyday language, restate it precisely.
- *What Do We Know? What Do We Need?:* Structured sorting activity where learners categorize information as "known," "unknown," "can find out," and "irrelevant."
- *The Hidden Question:* Present a scenario with an obvious question and a deeper question beneath it. Can learners find both?
- *Constraint Cards:* Shuffle and add constraints to a problem to see how they change the solution space.

**Technical Implementation Notes:**
The skill-creator tracks how long learners spend on the understanding phase relative to the solving phase. A ratio that increases over time (more time understanding, faster solving) is a positive indicator. Conversely, learners who rush to solutions should receive gentle prompts to slow down and restate the problem.

**Parent/Mentor Guidance:**
When your child asks for help, resist the urge to explain the answer. Instead, ask: "What do you think the problem is asking?" "What do you already know?" "What would a solution look like?" These questions develop the understanding habit. If they say "I don't know," respond with "What *do* you know about it?" — there is always something.

---

### Module 2: Problem-Solving Strategies (PROB-101-M2)

**What It Teaches:**
This is the strategy toolkit — the core repertoire of heuristics that experienced problem solvers draw from when facing unfamiliar challenges. Each strategy is taught explicitly, practiced in isolation, and then combined with others in increasingly complex problems.

**Core Strategies:**

*Work Backwards:* Start from the desired outcome and reason backward toward the starting conditions. Powerful for problems where the end state is clear but the path is not. "If the answer is 42, what could the question have been?"

*Find a Pattern:* Examine specific cases to discover a regularity that applies generally. Often involves creating an organized list or table and looking for relationships between entries.

*Simplify First:* Replace the hard problem with an easier version. Solve the easy version. Then ask: "What changes when I make it harder?" Often the strategy that works for the simple case works for the hard case with minor adjustments.

*Guess and Check (Systematically):* Make a reasonable estimate, test it, and use the result to make a better estimate. Not random guessing — informed, strategic refinement. Each guess should be informed by the results of previous guesses.

*Draw a Diagram:* Create a visual representation — a sketch, chart, graph, map, or model — that makes abstract relationships concrete. Spatial reasoning often reveals patterns that verbal reasoning misses.

*Make a Table:* Organize information in rows and columns to reveal structure. Especially powerful when combined with "Find a Pattern" — the table makes the pattern visible.

*Use Analogy:* Ask "Have I seen a problem like this before?" and adapt the previous solution. Requires recognizing structural similarity beneath surface differences.

*Consider Extreme Cases:* Test what happens when variables are at their maximum, minimum, or zero. Boundary behavior often reveals the essential structure of a problem.

*Eliminate Possibilities:* Instead of searching for the answer directly, systematically rule out what the answer cannot be. Often faster than direct search, especially for problems with discrete solution spaces.

**Interactive Elements:**
- *Strategy Rotation:* Give groups the same problem and assign each group a different strategy. Compare solutions to see how different approaches reach the same answer (or different valid answers).
- *Strategy Selection Game:* Present a series of problems. Before solving, learners must choose which strategy they think will work best and explain why. After solving, they evaluate whether their choice was effective.
- *Multi-Strategy Challenge:* Problems that require combining two or more strategies, where no single approach is sufficient.

**Technical Implementation Notes:**
The skill-creator monitors strategy diversity. Learners who always use the same strategy (e.g., always drawing diagrams) should receive problems where their preferred strategy is inefficient and alternatives are more natural. The goal is a flexible repertoire, not a single strong tool.

**Parent/Mentor Guidance:**
Model strategy use out loud. When you encounter a problem — even a mundane one like figuring out the best route, planning a meal, or deciding how to rearrange furniture — narrate your thinking: "I'm going to start with what I want the end result to look like and work backwards." "Let me try a simpler version first." Children learn problem-solving strategies by observing them in action.

---

### Module 3: Creative and Lateral Thinking (PROB-101-M3)

**What It Teaches:**
Not all problems yield to systematic strategies. Some require a shift in perspective — looking at the problem from a completely different angle, questioning assumptions that everyone else takes for granted, or combining ideas from distant domains. This module develops creative problem-solving skills: the ability to generate novel approaches when conventional ones fail.

**Core Skills:**
- Brainstorming: generating many ideas without judgment before evaluating any
- SCAMPER technique: Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse — seven prompts for generating variations on existing ideas
- Reframing: restating the problem to reveal new solution paths ("Instead of asking how to make the bridge stronger, ask how to make the load lighter")
- Analogical reasoning: drawing inspiration from solutions in distant domains (Velcro from burrs, sonar from bats, organizational structures from ecosystems)
- Lateral thinking: deliberately violating assumptions to discover unconventional solutions (Edward de Bono's provocative operation: "What if roads were made of rubber?")
- Perspective-taking: solving the problem as if you were someone else (an engineer, an artist, a child, a historical figure) to access different knowledge and assumptions

**Interactive Elements:**
- *SCAMPER an Everyday Object:* Take a common object (pencil, chair, backpack) and systematically apply all seven SCAMPER prompts to generate creative redesigns.
- *Reframing Practice:* Given a problem stated one way, restate it in at least three different ways. Each restatement opens different solution paths.
- *Analogical Problem Solving:* Solve a problem in one domain (e.g., ecology), then use the same structural solution for a problem in a different domain (e.g., social networks).
- *Assumption-Busting:* List all assumptions implicit in a problem, then systematically violate each one to see what new solutions become possible.

**Technical Implementation Notes:**
Creative thinking is harder to assess than systematic strategy use. The skill-creator should track divergent thinking metrics (number and variety of ideas generated) as well as convergent thinking metrics (quality of the solution ultimately selected). High divergence followed by effective convergence is the ideal pattern.

**Parent/Mentor Guidance:**
Encourage "What if?" thinking at home. What if cars could fly? What if dogs could talk? What if we had to eat dinner using only spoons? These playful provocations develop the habit of questioning assumptions, which is the foundation of creative problem solving. When your child suggests a "silly" solution, explore it before dismissing it — some of the greatest innovations started as silly ideas.

---

### Module 4: Collaborative Problem Solving (PROB-101-M4)

**What It Teaches:**
Many real-world problems are too large, too complex, or too multi-dimensional for any single person to solve alone. Collaborative problem solving combines the strategies from Modules 1-3 with the social skills needed to think productively as a group: listening, building on others' ideas, managing disagreement, dividing work effectively, and integrating contributions into a coherent solution.

**Core Skills:**
- Active listening: understanding others' ideas before evaluating them
- Building on ideas: "Yes, and..." rather than "No, but..."
- Role distribution: assigning different aspects of a problem to different team members based on strengths
- Constructive disagreement: disagreeing about ideas without attacking people
- Distributed cognition: recognizing that the group knows more than any individual
- Consensus building: reaching agreements that everyone can support
- Conflict resolution through problem solving: treating interpersonal conflicts as problems to be solved collaboratively

**Interactive Elements:**
- *Escape Room Team Challenge:* A multi-puzzle challenge that requires different skills (spatial reasoning, logical deduction, pattern recognition, language play) that no single person is likely to have all of. Teams must distribute work and integrate findings.
- *Community Problem Identification and Proposal:* Identify a real problem in the school or community. As a team, define the problem, research its causes, generate solutions, evaluate them against constraints, and present a proposal. The process matters more than the polish.
- *The Expert Jigsaw:* Each team member becomes the "expert" on one aspect of a complex problem. They must teach their piece to the group, and the group must integrate all pieces to solve the whole problem.
- *Silent Problem Solving:* Solve a problem as a group without speaking — using only writing, drawing, and gestures. Develops non-verbal communication and forces clearer expression of ideas.

**Technical Implementation Notes:**
The skill-creator should monitor group dynamics in addition to individual problem-solving behavior. Key metrics include: equitable participation (no one dominates, no one withdraws), idea evolution (are ideas improving through group interaction?), and productive conflict (does disagreement lead to better solutions?).

**Parent/Mentor Guidance:**
Family problem-solving sessions are powerful learning opportunities. When planning a vacation, a home project, or even a weekend schedule, involve children as genuine contributors — not just asking for preferences, but engaging them in the full process: defining what we are trying to accomplish, identifying constraints, generating options, evaluating tradeoffs, and making decisions. This is collaborative problem solving in its most natural form.

---

### Module 5: Complex and Wicked Problems (PROB-101-M5)

**What It Teaches:**
The world's most important problems do not have clean definitions, single correct answers, or clear stopping points. This advanced module introduces complex and "wicked" problems — challenges characterized by ambiguity, multiple stakeholders with conflicting interests, incomplete information, and solutions that create new problems. Climate change, poverty, healthcare access, urban planning — these are wicked problems.

**Core Skills:**
- Systems thinking: understanding problems as networks of interacting components rather than isolated variables
- Stakeholder analysis: identifying who is affected by a problem and how their perspectives differ
- Tradeoff evaluation: recognizing that every solution involves giving something up
- Decision under uncertainty: making the best choice with incomplete information
- Iterative refinement: accepting that solutions to complex problems must evolve over time
- Ethical reasoning: considering not just what *can* be done but what *should* be done
- Failure modes: anticipating how solutions might fail and building in safeguards

**Interactive Elements:**
- *Systems Mapping:* Take a complex issue (food waste, traffic congestion, school stress) and create a map of all the factors that contribute to it and how they interact. Discover that "simple" problems are rarely simple.
- *Stakeholder Debate:* Assign students different stakeholder roles in a complex issue. Each must argue from their stakeholder's perspective. The group must find a solution that addresses all stakeholders' core concerns.
- *The Unintended Consequences Game:* Propose a solution to a problem. Then systematically explore what new problems the solution might create. Then propose solutions to those problems, and explore their consequences. Build awareness that intervention in complex systems always has side effects.
- *Decision Under Uncertainty:* Present problems where key information is unavailable or unreliable. Learners must make and justify decisions while explicitly acknowledging what they do not know and how it affects their confidence.

**Technical Implementation Notes:**
Complex problem-solving cannot be assessed with right/wrong grading. The skill-creator should evaluate: quality of problem analysis (how many relevant factors identified?), quality of reasoning (are tradeoffs acknowledged? are assumptions explicit?), and quality of communication (can the learner explain their reasoning to someone who disagrees?).

**Parent/Mentor Guidance:**
When current events present complex problems (new policy, environmental issue, community conflict), use them as discussion starters: Who is affected? What are the different perspectives? What are the tradeoffs? What would you do, and why? There are no right answers — the value is in the reasoning process. Resist the urge to share your own opinion first; let the child work through the complexity.

---

## Assessment Framework

### Philosophy

Problem-solving assessment must evaluate *process*, not just *product*. A student who uses excellent strategy but makes an arithmetic error has demonstrated stronger problem-solving skills than a student who gets the right answer by luck or by following a memorized procedure. Assessment in this pack focuses on:

1. **Strategy awareness:** Can the learner name and describe multiple problem-solving strategies?
2. **Strategy selection:** Does the learner choose appropriate strategies for the problem at hand?
3. **Process quality:** Does the learner understand the problem before attempting a solution, monitor progress, and adjust when stuck?
4. **Transfer:** Can the learner apply strategies learned in one context to problems in a different context?
5. **Persistence:** Does the learner persist productively when stuck, or give up / wait for help?
6. **Reflection:** Can the learner evaluate their own problem-solving process and identify improvements?

### Formative Assessment

Formative assessment occurs continuously during problem-solving activities:

- **Think-aloud protocols:** Learners narrate their thinking while solving, revealing strategy use, monitoring, and decision-making in real time
- **Strategy journals:** Learners record which strategies they tried, what worked, and what did not after each problem-solving session
- **Peer observation:** Learners observe a partner solving a problem and note the strategies they see being used
- **Getting-stuck check-ins:** When learners report being stuck, assess what they have tried and guide them toward a new strategy rather than toward the answer

### Summative Assessment

Summative assessment evaluates cumulative growth in problem-solving competence:

- **Problem-solving portfolio:** Collection of solved and unsolved problems with written reflections on strategy, process, and learning
- **Novel problem challenge:** Present a genuinely unfamiliar problem and evaluate the quality of the approach, not just the answer
- **Strategy teaching:** Have the learner teach a problem-solving strategy to a younger student — teaching requires deep understanding
- **Transfer demonstration:** Solve problems from two different domains using the same strategy, with explicit reflection on how the strategy applies to both

---

## Connection to Other Packs

PROB-101 is the meta-cognitive foundation that enhances every other pack in the GSD-OS ecosystem:

- **MATH-101 (Mathematics):** Mathematical problem solving is the most developed domain-specific application of general strategies. PROB-101 provides the meta-strategies; MATH-101 provides the mathematical content.
- **CRIT-101 (Critical Thinking):** Critical thinking is the evaluative complement to problem solving. PROB-101 teaches how to find solutions; CRIT-101 teaches how to evaluate whether those solutions are good.
- **ENGR-101 (Engineering Design):** Engineering design is problem solving with physical constraints. The design thinking process (empathize, define, ideate, prototype, test) maps directly onto Polya's heuristics.
- **CODE-101 (Coding and Computational Thinking):** Computational thinking formalizes several problem-solving strategies (decomposition, pattern recognition, abstraction, algorithm design) and implements them in code.
- **SCI-101 (Scientific Method):** Scientific inquiry is a specialized form of problem solving where the "problem" is an unanswered question about the natural world and the "solution" is evidence-based understanding.
- **DATA-101 (Data Literacy):** Data analysis is problem solving applied to information — identifying patterns, drawing conclusions, and making decisions based on evidence.

---

## Parent/Mentor Guidance Summary

The single most important thing a parent or mentor can do for a young problem solver is to **model productive struggle**. Let children see you encountering problems you do not immediately know how to solve. Narrate your thinking: "I'm not sure how to do this. Let me think about what I know... Maybe I should try a simpler version first... That didn't work, let me try a different approach..."

**Do:**
- Ask "What have you tried so far?" before offering help
- Celebrate strategy use, not just correct answers ("Great idea to draw a diagram!")
- Share problems you are working on and invite your child's input
- Allow sufficient time — problem solving cannot be rushed
- Normalize being stuck: "Being stuck means your brain is working on something new"

**Don't:**
- Jump in with the answer when your child is struggling
- Express frustration at wrong answers or slow progress
- Present yourself as someone who "just knows" the answer — model the process
- Limit problem solving to academic subjects — it is everywhere
- Compare your child's speed or ability with others

---

## Frequently Asked Questions

**Q: Is problem solving a separate subject or integrated into other subjects?**
A: Both. PROB-101 teaches the strategies explicitly as standalone content so learners become consciously aware of them. Then every other pack applies these strategies in domain-specific contexts. The explicit teaching is essential because strategies remain invisible if they are only experienced implicitly.

**Q: Can problem solving really be taught, or is it innate?**
A: It can absolutely be taught. Research by Schoenfeld, Polya, and many others demonstrates that explicit instruction in problem-solving strategies significantly improves performance. Some people have more initial aptitude, but everyone can improve dramatically with practice and explicit strategy instruction.

**Q: What if my child gives up easily?**
A: Giving up is a learned behavior, usually from experiencing too many unsolvable problems or from environments that punish mistakes. Start with problems just above their current level — challenging enough to require effort, but solvable with persistence. Celebrate the effort, not the outcome. Over time, the tolerance for difficulty increases.

**Q: How do I know if my child is making progress?**
A: Look for these indicators: longer engagement with difficult problems before seeking help, use of multiple strategies rather than always trying the same thing, ability to describe their own thinking process, and willingness to try problems outside their comfort zone.

**Q: What is the difference between problem solving and critical thinking?**
A: Problem solving is about finding solutions to challenges. Critical thinking is about evaluating the quality of information, arguments, and solutions. They are deeply complementary: a good problem solver finds answers, and a good critical thinker determines whether those answers are trustworthy.

**Q: At what age should problem-solving instruction begin?**
A: From the very beginning. Infants are natural problem solvers — they experiment constantly. The goal at early ages is not to teach formal strategies but to preserve the experimental disposition, encourage persistence, and provide appropriately challenging problems (puzzles, building challenges, open-ended play).

**Q: How does this pack handle different learning styles?**
A: Problem-solving strategies are inherently multi-modal. Drawing diagrams is visual. Talking through a strategy is verbal. Building a physical model is kinesthetic. Making a table is logical-mathematical. The toolkit approach naturally accommodates different strengths while encouraging development across all modes.

**Q: Can problem solving be assessed fairly?**
A: Yes, but it requires assessing process, not just product. Strategy journals, think-aloud protocols, peer observation, and portfolio assessment all provide evidence of problem-solving competence that a single right-or-wrong test cannot capture. This pack provides rubrics and assessment frameworks designed specifically for evaluating problem-solving process.

---

## Implementation Notes for GSD-OS

### Dashboard Integration

PROB-101 appears in the Core Academic ring of the GSD-OS dashboard with a puzzle-piece icon in amber (#FF9800). It visually connects to MATH-101, CRIT-101, ENGR-101, and CODE-101 via dependency lines, reflecting its role as the meta-cognitive foundation for all structured problem-solving domains.

### Adaptive Pacing

The skill-creator monitors several indicators to pace the learner:
- **Time on understanding phase:** Increasing time spent understanding before solving is a positive signal
- **Strategy diversity:** Using multiple strategies across problems indicates growing flexibility
- **Recovery from being stuck:** Faster recovery and more independent strategy-switching indicate growing metacognition
- **Transfer success:** Applying strategies to new domains without prompting indicates deep internalization

### Prompt Caching

Parallel instruction patterns shared across modules:
- Module introduction structure (What It Teaches, Core Skills, Interactive Elements, Implementation Notes, Parent Guidance)
- Activity format (name, description, materials, grade range, variations)
- Assessment rubric structure (Beginning, Developing, Proficient, Advanced)
- Parent guidance question-and-encouragement format

These patterns are cached for token efficiency during content generation and skill-creator operations.

### Skill-Creator Integration

Observation points for automatic skill detection:
- Learner spontaneously restates problems before solving
- Learner tries a different strategy when the first one fails
- Learner recognizes structural similarity between problems in different domains
- Learner explains their reasoning process without being asked
- Learner helps a peer get unstuck by suggesting a strategy

Pattern detection:
- Effective problem-understanding protocols
- Successful strategy selection patterns
- Productive struggle sequences (stuck -> new strategy -> progress)
- Transfer recognition events

Skill promotion:
- Promote successful understanding protocols to reusable skills
- Create strategy selection guides from observed successes
- Build "getting unstuck" toolkits from recovery patterns
- Develop collaborative problem-solving frameworks from team successes
