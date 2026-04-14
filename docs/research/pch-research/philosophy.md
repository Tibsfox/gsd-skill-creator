# The Philosophy of Constrained Computing

*A meditation on how the hard limits of the punch card era shaped thought, craft, and eventually AI agent orchestration.*

---

## Prologue: The Cost of a Thought

In 1965, a computer science student at the University of Michigan carried a rubber-banded stack of IBM cards down a long linoleum hallway. The deck was perhaps two hundred cards thick. Each card held eighty columns, each column held a single character, and the entire stack represented roughly three weeks of thinking.

She would hand the deck to the window clerk at the Computing Center. The clerk would log it. The deck would ride a small cart to the operator, who would feed it into a reader, watch the job queue, and eventually shove a printout and the returned deck into a pigeonhole with her name on it. She would return the next morning, or the next afternoon, or perhaps after lunch on Thursday. She would open the printout, scan for errors, find one, walk back to the keypunch room, punch a replacement card, and begin again.

The whole cycle — from the moment she decided to change a line of code to the moment she learned whether the change worked — might take six hours. It might take twenty-four. It might take three days if the machine room was backed up or the IBM 360 had been down for a preventive maintenance window.

Every run cost money. Not abstract money — real money, debited against an account her department chair had to justify. Eight dollars in 1965. Nineteen dollars in 2025-equivalent terms. Per attempt. For a student, often more than an hour of work at minimum wage. For a young researcher, a meaningful fraction of a week's grant.

She could not afford to be careless. Nobody could. And so — because nobody could — everybody got careful. The carelessness we now consider normal had not yet been invented. It would be invented later, when abundance arrived, when iterations became free, when the cost of being wrong dropped to the point that being wrong became the cheapest way to be right.

This document is about what was gained when that happened, what was lost, and why — sixty years later, on machines our punch card programmer could not have imagined — we are beginning to rediscover the old disciplines under new names. Token budgets. Context windows. Tool-call attention. These are the new punch cards. And the habits that made great programmers in 1965 are becoming, once again, the habits that make great engineers of intelligence in 2026.

It is tempting, when we look backward, to romanticize scarcity. I want to be careful about that. The punch card era was not a golden age. It was a hard, slow, unequal time for the people who lived through it. It excluded most of the world from computing by the simple expedient of making computing too expensive to enter. It made women and people of color invisible labor in machine rooms whose official histories would be written as if only a handful of men had ever touched the machines. It burned careers on turnaround delays that today would seem cruel. I do not want to go back.

But I do want to remember what that era *knew*, because some of what it knew has been forgotten in the long smooth slide into abundance, and the forgotten things turn out to matter after all. They matter in places we did not expect. They matter in the work of orchestrating intelligence at scale, which is what the next decade of engineering will be about, whether we are ready for it or not.

---

## Part I: Constraint as Forcing Function

### 1. The Creative Paradox

There is a cliché in engineering circles that constraints enable creativity. Like most clichés, it survives because it is true; and like most true things, it is easier to say than to feel in your bones.

Consider the canvas problem. Give an untrained artist an infinite canvas, infinite paints, infinite subjects, and infinite time. What do they produce? Usually nothing. They freeze. The possibility space is too large. There is no obvious first move, and every first move seems arbitrary against the weight of every move not taken. The artist who can paint on an infinite canvas is already an artist; the canvas did not make them one.

Now give a first-grader a 16×16 pixel grid and eight colors. They will fill it. They will fill twenty of them before lunch. Some will be good. Some will be bad. All of them will be finished — because finishing was always within reach, because the medium conspired to narrow the choices to a size the mind could hold.

The Commodore 64 had exactly the same effect on a generation of programmers. Its memory was small (64 kilobytes, of which less than forty were actually usable for a program). Its sound chip had three voices. Its sprite engine could move eight objects. Its palette was sixteen colors. These were not limitations one had to transcend — they were the game itself. Working around them, exploiting them, discovering that you could force the video chip to display more than sixteen colors by changing the palette mid-frame, or that you could play digitized speech by rapidly modulating the volume register — this *was* the art. The constraint defined the medium.

Haiku works this way. So does the sonnet. So does the tanka, the villanelle, the ghazal, the blues. Every durable poetic form is a set of constraints that turn raw feeling into something you can hold in your hand. A poem with no rules is a diary entry; a poem with rules is a poem.

Punch card programming was a poetic form in this sense. It had meter. It had rhyme. You could feel when a program scanned and when it didn't. Seasoned programmers spoke of programs that were *clean* or *elegant* or *ugly* the way a prosody teacher speaks of verse. Those aesthetics were not decoration. They were survival.

Igor Stravinsky said it bluntly in *Poetics of Music* (1942), long before any of this was about computers:

> "The more constraints one imposes, the more one frees one's self. And the arbitrariness of the constraint serves only to obtain precision of execution."

He was talking about composing for a chamber ensemble with fixed instrumentation. He could have been talking about writing FORTRAN for an IBM 1401. He could have been talking, today, about prompting a language model inside a two-hundred-thousand-token budget. The form changes. The insight does not.

Why does constraint enable creativity? I think it is because creativity is not the production of novelty from nothing — it is the production of *appropriate* novelty from a defined possibility space. A possibility space that is too large has no shape, and the mind cannot find its edges to push against. A possibility space that is too small is a prison, with no room to move. But a possibility space that is *just small enough to feel the walls* is the space in which craft happens.

The walls are the teacher. The walls tell you when you are being lazy. The walls tell you when you have earned the next move. And when the walls are gone — when you are standing on an infinite empty plain with infinite directions to walk — the walls' absence is not freedom. It is vertigo. You have to invent your own walls, or you don't move.

This explains why so many brilliant practitioners of any craft are drawn, late in their careers, to deliberate re-imposition of constraints. The novelist who writes a book without the letter *e*. The photographer who shoots on a fixed 35mm lens for a year. The composer who restricts herself to a twelve-tone row. These are not affectations. These are senior practitioners who have learned that their own minds work better against a wall, and who are building walls where the world forgot to put any.

Igor Stravinsky said it bluntly in *Poetics of Music* (1942), long before any of this was about computers: *"The more constraints one imposes, the more one frees one's self. And the arbitrariness of the constraint serves only to obtain precision of execution."* He was talking about composing for a chamber ensemble with fixed instrumentation. He could have been talking about writing FORTRAN for an IBM 1401. He could have been talking, today, about prompting a language model inside a two-hundred-thousand-token budget. The form changes. The insight does not.

Why does constraint enable creativity? I think it is because creativity is not the production of novelty from nothing — it is the production of *appropriate* novelty from a defined possibility space. A possibility space that is too large has no shape, and the mind cannot find its edges to push against. A possibility space that is too small is a prison, with no room to move. But a possibility space that is *just small enough to feel the walls* is the space in which craft happens. The walls are the teacher. The walls tell you when you are being lazy. The walls tell you when you have earned the next move. And when the walls are gone — when you are standing on an infinite empty plain with infinite directions to walk — the walls' absence is not freedom. It is vertigo.

### 2. The Economics of Thought

The brain runs on cheap calories. The machine runs on expensive electrons. In the punch card era, the exchange rate between the two was steeply in favor of the brain, and the programmer who exploited that arbitrage ate well.

The canonical example is desk-checking. A programmer staring at a piece of fanfold printout for forty minutes, tracing the logic of a subroutine by hand, verifying that the DO loop terminates, that the accumulator is initialized, that the format statement matches the I/O list, is running at perhaps one watt of biological compute. The IBM 360 running the same trace was consuming perhaps sixty thousand watts and billing out at something like three hundred dollars an hour of wall-clock time. Two minutes of operator thought saved an hour of machine time. The ratio was so lopsided that any programmer who submitted sloppy decks was, in a direct economic sense, stealing from the institution.

This was not abstract. Grad students lost access to the machine over excess resubmission. Professors got scolding letters from the computing center. Job priorities were reduced for users who hogged time. The social consequences of thoughtlessness were real, and they were localized to the thoughtless, and the message filtered down: *think before you run*.

The economic structure of punch card computing subsidized the cheap act — thinking — by making the alternative expensive. This was not an accident. It was an emergent property of the technology, and it produced habits of mind that the technology never deliberately selected for.

There is a wonderful passage in Ed Yourdon's *Techniques of Program Structure and Design* (1975) about what computing center managers of the era actually did with their programmers. They did not, by and large, try to make them code faster. They tried to make them code *less*. A good department would measure not lines of code produced per week but jobs submitted per correct result. A programmer who averaged 1.2 submissions per working program was a star. A programmer who averaged 5 submissions per working program was put on probation. The metric was *precision*, not *throughput*, because throughput at the expense of precision bankrupted the department.

The modern metric — velocity, commits per sprint, features shipped per quarter — measures throughput and ignores precision. It cannot do otherwise, because the cost of imprecision has been hidden in places the metric cannot see: in the technical debt that accumulates silently, in the production incidents that get attributed to "flaky tests," in the on-call burden that rotates among engineers who did not write the code that is now waking them up at 3am. The cost is real. The metric just doesn't measure it. And so the metric rewards behavior that is, in aggregate, value-destroying.

Fast forward. In 2015, a junior developer on a modern laptop can run a test suite in twelve seconds, and will run it forty times in an afternoon because the cost of each run is zero. In 2026, that same developer can invoke a cloud build farm for perhaps two cents a run and get feedback in ninety seconds. The economics inverted. Thinking became expensive relative to running. *Trying* became the cheapest way to learn.

And so trying replaced thinking. Not because thinking stopped working, but because trying worked well enough and felt more productive, and nothing punished the developer for skipping the harder path.

### 3. Slow is Smooth, Smooth is Fast

The Navy SEAL marksmanship adage — *slow is smooth, smooth is fast* — captures something that punch card programmers understood in their skeletons. The fastest way to hit a target is not the fastest trigger pull. It is the cleanest trigger pull. Hurry produces flinch, and flinch produces misses, and misses cost more than the time saved by hurrying.

A programmer forced to iterate slowly, under the duress of a six-hour turnaround, learns to make every iteration count. She doesn't submit a deck to "see what happens" because seeing what happens costs her a day. She submits a deck when she is reasonably sure, because reasonable sureness is cheaper than the alternative. And the habit of being reasonably sure — of knowing why you believe your code will work before you run it — makes you faster, not slower, over any time horizon longer than a single session.

This runs counter to modern productivity intuitions. The modern developer measures output in iterations per hour. More iterations, more progress. But measure the *gradient* of progress — distance from goal per unit of real time — and the picture changes. A punch card programmer who submitted three decks in a day and converged on a correct program often finished ahead of a modern programmer who ran the test suite forty times and was still chasing a regression at the end of the afternoon. Each deck submission was a careful step. Each test run was a blind stagger.

There is an observational experiment anyone can run. Sit next to a senior engineer debugging a problem. Notice how often they *pause*. Notice how often they stare at the code for thirty seconds without touching the keyboard. Then sit next to a junior engineer. Notice that they almost never pause. They run the test, change a line, run the test, change a line. The senior engineer is solving the problem with their brain, using the computer as a verification device. The junior engineer is solving the problem with the computer, using their brain as a steering wheel. The senior engineer finishes first, every time, when the problem is hard.

The punch card era produced senior engineers much earlier, because it offered no other path.

There is a related observation about the nature of expertise that is worth making here. Expertise, in any domain, is the ability to see what is present *and* what is absent. A grandmaster chess player sees the board differently from an amateur — not because she has more pieces in her head, but because she sees the structure of the position: the squares that are weak, the lines that are open, the plans that are available. The amateur sees individual pieces and calculates from them. The grandmaster sees the whole and recognizes it.

Programming expertise works the same way. The novice sees lines of code and traces each one. The expert sees *patterns* — she recognizes that this is a sort, and that is a state machine, and this function is a retry wrapper around a simple operation, and the whole thing is an implementation of a well-known algorithm with a small twist. She does not need to trace every line because she does not need to. She has seen enough sorts to know what a sort looks like.

This pattern recognition is built by exposure, and exposure is built by reading code with attention. The punch card programmer read her own code with extreme attention, because the alternative was expensive, and she therefore built pattern recognition faster than a modern programmer who reads her own code only cursorily because the REPL will catch any mistakes. The expertise of the old generation was not because the old programmers were smarter. It was because their workflow was a more efficient training loop for the kind of expertise that matters.

### 4. The Virtue of Expensive Failure

Cheap failure is a teacher that never gets through to the student. When you can fail a hundred times in a morning at zero cost, you stop noticing any individual failure. You don't ask *why* a run didn't work; you ask *what to change* to make the next run work. The *why* is the philosophy; the *what* is the mechanics. Modern programming has become mostly mechanics.

Expensive failure is different. When every failure costs nineteen dollars and a day of your life, you cannot afford not to understand. You have to know, in your body, why the program did not do what you expected. Otherwise the next run — which will also cost nineteen dollars and another day — will also fail, and you will be further behind and poorer, and your advisor will notice.

The punch card programmer developed post-mortem habits automatically. She would take the printout back to her desk, open it, find the error, and sit with it. She would trace back from the error to the line that caused it. She would check if similar bugs might exist elsewhere in the program. She would patch not just the specific case but the class of bugs. She would think about what she had misunderstood about the system that led her to write this bug in the first place. And then — only then — would she punch a new card and go back to the window.

That kind of reflection is a first-class skill. It does not automatically emerge in a culture of cheap failure, because cheap failure does not reward it. It has to be deliberately taught, or deliberately recovered, or deliberately imposed by external constraint. The punch card era imposed it for free.

### 5. The Design Phase as Real Work

Here is perhaps the deepest inversion between the punch card era and the modern one: in 1965, designing the program *was the program*. Coding was the transcription step. Debugging was the exception, not the rule.

A typical workflow looked like this. The programmer would sit at her desk, away from the machine, with a coding pad. The pad was ruled into columns matching the format of an IBM card — positions 1 through 5 for statement numbers, position 6 for continuation, positions 7 through 72 for the statement body. She would write the program out longhand, line by line. She would read it over. She would walk through it with a colleague, or with herself. She would find bugs on paper and fix them on paper. She would sometimes rewrite the whole subroutine before she submitted a single card to the keypunch. The program was *finished* before it was ever run.

The keypunch room was the transcription phase. Clerks, or the programmers themselves, would sit at the IBM 026 or 029 machines and type the program card by card. Each card was a line. Errors were made here, and caught here — the clerk would see that column 72 had a typo and repunch that card. The pile of cards accumulated into the deck.

The machine room was the verification phase. The deck went in, the printout came out. Either it matched what the programmer expected — in which case the program was done — or it didn't, in which case the programmer went back to her coding pad to figure out what she had misunderstood. She did *not* immediately punch a new card. She went back to the *design*.

Now compare this to the modern workflow. The modern programmer opens an editor, types a skeleton, runs it to see if it compiles, fixes the compile errors by trial and error, runs the tests, fixes the test failures by trial and error, and iterates until the tests pass. Design — in the sense of sitting quietly with paper and thinking through the algorithm — is optional, and usually skipped. The running program is the design. The tests are the specification. The code is the documentation.

There is something gained by this inversion: speed in the familiar, responsiveness to changing requirements, the ability to experiment cheaply. There is also something lost: the discipline of knowing what you're doing before you do it. Most modern programmers have never experienced a workflow where coding was transcription, and they find it hard to imagine that it could work. It did. It worked magnificently. The Apollo Guidance Computer code — which got twelve humans to the Moon on less RAM than a modern keyboard controller — was designed that way.

Margaret Hamilton led the Apollo software team at the MIT Instrumentation Laboratory. Her team shipped something like 145,000 lines of assembly code across the Command Module and Lunar Module programs, running on a computer with 2 kilowords of RAM and 36 kilowords of ROM. They shipped it with essentially zero bugs in flight. Consider that for a moment. Not "few bugs." Not "manageable bugs." *Essentially zero bugs*, in a safety-critical system that had to run perfectly the first time, on the first flight, with human lives on top of a rocket. And they did it without unit tests in the modern sense, without continuous integration, without type checkers, without fuzz testing, without any of the automated safety nets that modern software engineering considers non-negotiable.

How? They designed. They reviewed. They traced execution on paper. They walked through every branch with a colleague. They ran simulations on the available mainframe when they could get time, which was never often enough. They held each subroutine in their collective heads until they were sure. And then they wrote it down, and then they ran it, and then it worked.

This is not an argument against unit tests. Unit tests are great, and the Apollo team would have used them if they had been feasible. It is an argument that the *mental discipline* they used — the careful, deliberate, reviewed, mentally-simulated construction of software — is a real and powerful engineering technique that is fully independent of tooling. The tools we have now are better than what Hamilton had. The *discipline* she had is mostly better than what we have now. And the combination of modern tools with modern discipline — which is almost nobody — is what separates a great engineer from a competent one.

---

## Part II: The Minimum Viable Program

#### A Note on Tempo

Before we discuss the Minimum Viable Program, one more observation about the punch card era is worth making: the era had a specific *tempo*, a characteristic rhythm of work that differed markedly from the modern tempo and produced different psychological effects in the people who lived under it.

The modern developer operates at a fast, jittery tempo. Change, test, change, test, change, test. Each cycle is seconds. The brain is constantly in the final stretch of a short feedback loop, which is cognitively demanding in a particular way — it keeps you in "reactive mode," always responding to the last result, never stepping back to reconsider the whole. This is why modern developers often report feeling exhausted after a day of work even when they have not accomplished much: the reactive mode burns energy without producing forward motion, because the forward motion requires a slower, more reflective tempo that the fast feedback loop actively prevents.

The punch card developer operated at a slow, meditative tempo. Submit a job, walk away, do something else, come back hours later to read the output. The enforced downtime was not wasted time. It was thinking time. Many punch card programmers reported that their best ideas came during the walk back from the computing center, or during dinner between submissions, or at three in the morning when they woke up with a solution they had not been consciously working on. The slow tempo gave the unconscious mind room to do its work, and the unconscious mind is where the hard problems actually get solved.

There is good cognitive science behind this. The human brain has two modes of problem-solving: *focused mode* (deliberate, conscious, linear reasoning) and *diffuse mode* (relaxed, unconscious, associative connection-making). Both modes are necessary. Focused mode builds the mental representation of the problem; diffuse mode finds the solution by connecting the representation to things you already know. If you never give the diffuse mode time to run — if you stay in focused mode all day, responding to test failures and compiler errors in a tight loop — you lose access to most of your problem-solving ability. The hard problems stay hard, because the part of your brain that is good at hard problems never gets to engage.

The punch card era forced diffuse mode into the schedule by making focused mode expensive. You could not stay in tight-loop focused mode, because the loop was hours long. The time between submissions was automatically filled with diffuse-mode thinking, and the diffuse-mode thinking produced the insights that made the next submission better. The productivity of the punch card era was not in the bytes of code produced per hour; it was in the quality of the thinking per byte of code, and the quality of the thinking was enabled by a tempo that modern developers have lost.

AI agent engineering, at its best, restores this tempo. Running an agent takes minutes, not seconds. The engineer is not glued to the feedback loop. She can walk away, make coffee, think about the problem from a different angle, come back to see what the agent produced, and respond with insight that would not have been available to her in tight-loop mode. The walk to the coffee machine is the new walk back from the computing center. The diffuse mode is back, and the engineers who notice it and exploit it produce better work than the engineers who fight it.

### 6. MVP Before It Had a Name

Eric Ries wrote *The Lean Startup* in 2011 and gave a generation of product managers a new vocabulary. *Minimum Viable Product*. The idea: build the smallest thing that tests your hypothesis, ship it, learn, iterate. Treat the product roadmap as a series of experiments rather than a plan.

The punch card programmers of the 1960s would have recognized every word of this, though they never would have called it a framework. They were doing it constantly, because they had no choice.

A punch card programmer writing a 5,000-line FORTRAN program did not punch 5,000 cards and submit the whole deck. That would be insane. If the program failed — and of course it would fail, because no 5,000-line program has ever worked on first submission — she would have no idea where to start debugging. The error would be somewhere in those 5,000 cards, and the feedback channel was a printout that might or might not contain a useful diagnostic.

Instead she would write a skeleton. Perhaps fifty cards. It would do almost nothing — read a record, write a record, terminate. She would submit it. She would verify the skeleton compiled and ran. Then she would add a subroutine. Perhaps another hundred cards. She would submit *that*. She would verify it. Then she would add real input handling. Submit. Verify. Then the main algorithm. Submit. Verify. Then the output formatting. Submit. Verify.

Each submission was a viable program. Each submission tested one hypothesis: *does this change work?* Each submission was small enough that if it failed, the error had to be in the new code, because the old code had already been verified. The search space of a bug was always small. The feedback loop was always clear. And the whole 5,000-line program came together as a sequence of twenty or thirty verified increments.

This was not agile methodology. There were no post-it notes. There were no retrospectives. There were no sprint reviews. It was survival by deliberate incrementalism. Ries's contribution in 2011 was to notice that this pattern had been beaten out of modern programmers by the illusion of abundance — that you could, in theory, write 5,000 lines without verifying any of them, and it would still eventually run, just very badly. He had to re-teach the punch card discipline to a generation that had forgotten it.

There is a useful framing here that comes from Donald Knuth, who lived through both eras and was one of the few to think deeply about the difference. In his 1974 Turing Award lecture, Knuth quoted Hoare's observation that "premature optimization is the root of all evil" — a line so famous that it has become a cliché, and like most famous lines has been quoted out of context to mean something almost opposite to what Hoare and Knuth actually meant. They did not mean that performance does not matter. They meant that performance decisions should be made *after* profiling, not before, and that the profiling itself is a kind of measurement that only makes sense against a working program. The implicit assumption is that you have a working program to profile. The implicit workflow is: build the minimum, make it work, measure it, improve the hot spots. This is the punch card discipline restated as an optimization principle. Build the minimum. Verify. Measure. Improve. Repeat.

The modern misreading of "premature optimization is the root of all evil" — as if it means "do not think about performance until something breaks" — is a symptom of the abundance culture that Knuth never operated in. Knuth was saying *measure before optimizing*. The abundance generation heard *don't optimize*. These are not the same thing. The first is discipline. The second is abdication.

### 7. The Hello World Discipline

Every experienced programmer, before tackling a hard problem on a new system, writes Hello World first. This is not because they are unfamiliar with printing to a console. It is because they are unfamiliar with *this* console, *this* shell, *this* compiler, *this* platform, *this* path through the build pipeline, *this* version of the language runtime. Hello World is the test that says: can I get a byte from my fingers to the screen?

The punch card era made Hello World mandatory. Before you wrote your real program, you wrote the smallest possible valid program that would prove the machine was working and that your deck was being interpreted. If Hello World didn't print, your problem was not in your code — it was in the environment. Maybe your JCL was wrong. Maybe the card reader had misread a column. Maybe the compiler was the wrong version. You would not know until you had isolated the environment variable from the code variable.

This staging discipline survives in modern development as folk practice. Smoke tests. Sanity checks. Canary builds. "Does it even run?" These are all Hello World in disguise, and they all trace back to a time when every byte of uncertainty cost real money.

The discipline generalizes. Before you write your real function, write a stub that returns a constant and verify the callers work. Before you write your real query, hardcode the result set and verify the template renders. Before you write your real AI prompt, run a trivial prompt and verify the model responds. Each of these is a Hello World, each of them isolates one source of uncertainty, and each of them protects you from spending hours debugging a problem that was in a layer you hadn't even realized you were depending on.

### 8. The Load-And-Go Pattern

The computing centers of the 1960s and 1970s noticed the student-workflow problem and tried to solve it. The canonical solution was called *load-and-go* compilation: a fast, forgiving compiler that would load student programs, compile them aggressively, recover from syntax errors rather than giving up, and run the program anyway to get as much output as possible before the first real runtime error.

The two most famous load-and-go compilers were WATFOR and WATFIV, developed at the University of Waterloo in the late 1960s. They were FORTRAN dialects specifically designed for student use. They would compile programs in seconds instead of minutes. They would recover from missing commas and continue compiling. They would catch runtime errors and produce readable diagnostics instead of octal dumps. They were, for their era, miracles. The IBM PL/C compiler at Cornell did the same thing for PL/I.

The philosophical point these systems made, decades before anyone articulated it, was this: *make feedback cheap where you can, so that constraint can focus where it must*. Students were not learning by waiting six hours for a turnaround. They were learning by getting feedback. The expensive part of the workflow was the *thinking*, not the *running* — and the compiler could afford to be generous on the running side so that the student could invest her resources on the thinking side.

This is exactly the principle that modern developer tools have followed ever since. Fast compilers (Rust's incremental compilation, Go's speed obsession), fast test runners (Vitest, pytest-xdist), fast feedback loops (hot reload, REPL-driven development) — all of them are WATFOR's descendants. All of them are trying to remove friction from the verification step so the programmer can concentrate on the design step.

The irony is that modern systems have pushed this so far that they have eliminated the design step entirely. WATFOR meant *you can run more freely so you can spend more time thinking*. Modern tooling means *you can run so freely that you never need to think at all*. The purpose was hollowed out. The mechanism remained.

### 9. Do One Thing

In 1978, Doug McIlroy summarized the Unix philosophy in four lines. The first and most famous was: *Write programs that do one thing and do it well*.

This is usually explained as a design principle — composition over monolith, modularity over integration, small tools over large suites. All of that is true. But McIlroy's principle had a concrete historical root: batch programming was terrible for debugging large programs, and small programs composed by pipes could be debugged one at a time.

If your monolithic program of 10,000 lines has a bug, you have to submit the whole deck, read the whole printout, and chase the bug through the entire codebase. If instead you have ten programs of 1,000 lines each, chained together by shell pipes, you can test each one in isolation. You can replace one with `cat` to see its input. You can pipe it into `head` to see its output. You can verify each stage and then compose them. The constraint of batch debugging pushed the design toward small composable tools, and the shell pipeline was the glue.

This is still the fastest way to debug a data pipeline in 2026. When a Kafka stream isn't producing the output you expect, the first thing a veteran engineer does is replace one stage with an identity function and see if the problem goes away. That technique is a direct inheritance from the punch card era, refined through Unix, refined through modern data systems, but traceable in a straight line to the economic reality that decks full of 10,000 cards were a nightmare to debug.

The ghost of punch card economics is in every Unix pipeline. It is in every microservice boundary. It is in every function that takes one parameter and returns one result. It is in every refactoring that breaks a 500-line function into five 100-line functions. We do these things because they are good design, and they are good design because expensive iteration made them necessary, and the necessity outlasted the expense, and the habit outlasted the necessity, and we now call it wisdom.

It is worth lingering on McIlroy's original four-line statement of the Unix philosophy, because it is a kind of constitution for craft under constraint. The four rules were:

1. Make each program do one thing well. To do a new job, build afresh rather than complicate old programs by adding new features.
2. Expect the output of every program to become the input to another, as yet unknown, program. Don't clutter output with extraneous information. Avoid stringently columnar or binary input formats. Don't insist on interactive input.
3. Design and build software, even operating systems, to be tried early, ideally within weeks. Don't hesitate to throw away the clumsy parts and rebuild them.
4. Use tools in preference to unskilled help to lighten a programming task, even if you have to detour to build the tools and expect to throw some of them out after you've finished using them.

Read these with the punch card era in mind and they resolve into a coherent ethic. Rule one is modularity as a debugging aid. Rule two is composability as an economic necessity. Rule three is iterative refinement under expensive-iteration constraints. Rule four is meta-tooling: the willingness to invest in building the thing that builds the thing, because the investment pays for itself over the lifetime of the project. Every rule is an adaptation to the economics of batch computing, and every rule remains valuable in the economics of AI-agent computing, for the same reasons.

If you want a single sentence that summarizes the punch card era's engineering philosophy, it is: *make the work small enough to verify and the verification cheap enough to do often*. McIlroy's four rules are this sentence, decomposed into practices. Every durable software engineering principle that has emerged since is a rediscovery or specialization of one of them.

---

## Part III: The Mental Muscle

### 10. Desk-Checking as Primary Skill

The single most valuable skill of the punch card programmer was desk-checking: reading a listing line by line, maintaining the state of every variable in your head (or on a sheet of paper), and simulating the execution of the program well enough to predict its output. A good desk-checker could find subtle logic errors in hundreds of lines of code without ever running the program. A great desk-checker could do it in thousands.

This is a lost skill. Not rare — *lost*. Ask a modern programmer to predict the output of a 50-line function containing two loops and a conditional, without running it, and most will balk. They will say "let me just run it and see." They mean this sincerely; they are not being lazy. They genuinely cannot hold the variable state in their head well enough to trace execution. The muscle has atrophied because it was never built. Interactive development let them grow up without ever needing it.

The skill can be recovered. I know engineers who have deliberately practiced it, often after being burned by a debugging session they could not make progress on because they could not reason about what the code was doing. The practice looks like this: read a function, predict what it will return for a given input, then run it and check. Keep doing this until your predictions are usually right. Then read longer functions. Then read whole files. Then read code you didn't write. After a few months of this, something clicks. You start to *see* the execution when you read the code. The letters on the page become state transitions. The program runs in your mind.

This is what senior programmers mean when they say they can "read code." They are not reading; they are executing. They are running the program on wetware. And that skill, more than any other, is the ceiling on what problems you can solve — because problems that are too big to fit on wetware are problems you cannot reason about, only grope toward.

Punch card programmers had this skill because they had no alternative. The modern programmer has to choose to build it.

There is a specific desk-checking technique worth describing in detail, because it illustrates just how far the old discipline went. The technique was called *trace table* or *execution trace*, and it worked like this. On a sheet of paper, you drew a table. The columns were the names of every variable in the program. The rows were the sequence of statements executed. For each row, you wrote down the current value of each variable after that statement executed. You would trace the program for a specific input, filling in the table one row at a time, until you reached the end of the program or found a bug.

A full trace table for a 50-line program might run to several pages. An experienced programmer could do it in her head for simple programs, on paper for complex ones, and on a coffee-stained printout for really hairy ones. The value was not just in finding the bug — it was in the mental model she built while doing the trace. After tracing a subroutine once, she understood it in a way that simply reading it could never produce. The trace forced her to be the machine, and being the machine for a few minutes taught her more about the subroutine than hours of passive reading.

This technique is not lost. It is taught in some introductory programming courses, usually as "dry running" or "mental execution," usually in the first two weeks, usually never mentioned again. Students are told it is a learning aid for beginners, and they drop it as soon as they have a debugger. But dry running is not a learning aid. It is *the* core skill of programming. Debuggers are the learning aid, because they let you cheat when your mental model is insufficient. And cheating feels great in the moment, but the cheater never develops the skill, and the cheater is helpless when the debugger cannot reach the problem — when the code is running in production, or on a customer's machine, or inside a process that cannot be paused, or on a system you do not own.

The senior engineers who hold teams together through catastrophic debugging sessions are usually, not coincidentally, the ones who can still dry-run code in their heads. They are the ones who, when everyone else is staring helplessly at the debugger output, say "wait — what if the state of variable X at line 47 is actually..." and walk through the execution by hand and find the bug that the debugger could not see because the debugger was attached to the wrong instance. These engineers are disproportionately old. This is not because they are smarter. It is because they learned the craft in an era when dry running was mandatory, and they never unlearned it.

### 11. Holding the Whole Program in Mind

Fred Brooks, in *The Mythical Man-Month*, observed that the maximum complexity of a program is limited by the cognitive capacity of the programmers who must hold it in their heads. He was writing in 1975 about the OS/360 project, which was the largest software system ever attempted up to that point and which had famously been late, overbudget, and buggy. The problem, Brooks argued, was not that the programmers were not smart enough. It was that no single mind could hold the whole system, and the coordination overhead between minds grew faster than the productivity gained by adding them.

The implication runs in both directions. If no single mind can hold the whole system, the system will have emergent bugs that no single person can find. If a single mind *can* hold the whole system, that mind can find bugs that no test suite will ever catch, because tests only catch known classes of failure.

In 1965, a capable programmer could hold a 1,000-line FORTRAN program in her head. I do not mean she had memorized it character-for-character. I mean she had *comprehended* it: she knew what every subroutine did, how the data flowed, which variables were live where, which invariants held, which edge cases were handled, which were not. She could navigate the program by thought alone, and when a bug was reported, her first move was not to run a debugger — it was to ask her mind *where could this have gone wrong?* and nine times out of ten the mind would supply an answer that turned out to be right.

This is how the Apollo flight software got written. This is how the original Unix kernel got written. This is how the original UCSD Pascal compiler got written. This is how most of the foundational software of the twentieth century got written. The programmers held the whole thing in their heads, because the whole thing fit, because the constraints forced the whole thing to *be* small enough to fit.

Modern systems are too large for any one mind. Most modern programmers do not hold any system in their head; they navigate by search. They grep for a symbol, follow the reference, read the function, grep for another symbol. It works. It is a valid style of comprehension. But it produces a different shape of understanding — local, fragmentary, context-free. Bugs that span modules are hard to find by grep, because you have to already suspect the connection to search for it. Bugs that span subsystems are nearly impossible.

Something was lost when systems grew past the holding-in-head size. Nobody is to blame — the growth was necessary, and the tools adapted. But the loss should be named. And it should be remembered, because the punch card era proves that the holding-in-head limit is not a property of human minds. It is a property of how we structure the code. A sufficiently modular system remains holdable even at a million lines, *if the modules are designed to fit in mind*. Unix systems of 1980 did this. Most modern systems do not.

The early Unix kernel is the canonical example. In 1979, Version 7 Unix — the ancestor of essentially every Unix-derived system today, including macOS and Linux and every Android phone — fit on a PDP-11 with 256 kilobytes of memory. The kernel was perhaps nine thousand lines of C. You could read the whole thing in an afternoon. Lions' commentary on Sixth Edition Unix, produced at the University of New South Wales in 1977 as a teaching text, walked through every line of the kernel with explanations. The entire kernel. Every line. In a book you could finish in a week.

The modern Linux kernel is over thirty million lines of C. No human has read all of it. No human ever will. The kernel is beyond the comprehension of any single mind, not just at the level of details but at the level of overall shape. Senior kernel developers specialize in subsystems — the memory manager, the scheduler, the filesystem layer, the network stack — and maintain deep expertise only in their own subsystem, relying on the maintainers of other subsystems to do the same.

This is not a criticism of the modern kernel. It is an order of magnitude more capable than Version 7, it runs on hardware that did not exist in 1979, it supports use cases that would have been unimaginable at the time. The growth was necessary. The cost was that comprehension by any single mind became impossible, and the mode of development shifted from *holding the whole thing* to *navigating the whole thing*. The navigation works — Linux development is one of the most productive software engineering efforts in history — but it produces a different kind of software, with different strengths and different failure modes, than the comprehension-bound software of an earlier era.

There is a middle path that the punch card era suggests and the modern era rarely takes: *keep each module small enough to hold, even if the system is too large to hold in aggregate*. A well-designed modern system can do this. It can have hundreds of modules, each small enough for a single engineer to understand completely, with interfaces clean enough that the interactions between modules can also be held in mind. A poorly-designed modern system has modules that sprawl, interfaces that leak, and no boundary that a single mind can hold. Both kinds of systems exist. The well-designed ones are usually maintained by teams that explicitly invoke the punch card discipline, often without knowing its history. The poorly-designed ones are the default, because the discipline requires deliberate effort and the default is no effort.

### 12. The Cost of Cognitive Load

In a long debugging session, the enemy is not stupidity. It is cognitive load leakage — the slow seepage of details out of the working set, replaced by other details, until the programmer has lost track of something they knew five minutes ago and is now going in circles.

There is a lovely passage in Peter Naur's 1985 paper *Programming as Theory Building* that captures what the punch card generation understood implicitly. Naur — one of the ALGOL 60 authors, a man who had lived every era of computing up to that point — argued that the real product of programming is not the code. The real product is a *theory* in the programmer's head: a coherent understanding of why the system is the way it is, what its invariants are, what its edges are, what its purposes are. The code is a partial expression of this theory. The tests are another partial expression. The documentation is another. But the theory itself lives only in human minds, and when those minds disperse — when the original team moves on, when the company is acquired, when the project goes into maintenance mode under new owners — the theory dies, and the code that remains becomes an artifact whose meaning is lost, even if its syntax is preserved.

Naur's argument, which is one of the most unfashionable and most correct ideas in the software engineering literature, is that a program is not a product you can hand over. It is a conversation between the programmer and the problem, and when the programmer leaves, the conversation ends. The new programmer has to start a new conversation with the same problem, and that conversation is not faster for having the previous programmer's code to read. It may even be slower, because the code encodes decisions whose reasons are gone, and the new programmer cannot tell which parts of the code are load-bearing intentions and which are accidents.

Punch card programmers felt this intuitively. They knew that the code was a fragile residue of the real work, which was the thinking. They protected the thinking by writing it down — not as code, but as comments explaining *why*, as design documents that survived the project, as conversations with colleagues that seeded theories in other minds. They understood that the theory was the asset and the code was only an artifact.

The modern era has largely forgotten this. Modern engineering culture treats code as the asset — as something you can version, measure, test, ship. The theory in the head is treated as incidental, and the cost of its loss is absorbed into the cost of "onboarding new engineers," which is a line item nobody ever questions even though it accounts for a huge fraction of total engineering cost. Naur would recognize what happened. He wrote the paper predicting it.

Punch card programmers could not afford cognitive leaks. Every detail they forgot was a cycle of wasted turnaround. They developed habits to plug the leaks:

- **Comments explaining *why*, not *what*.** The *what* is in the code; the *why* is in the head and will disappear the moment the head moves to the next problem. Good comments said things like `/* we use bubble sort here because the array is almost always already sorted */` — explanations that rescued the future-self from re-deriving the design decision.

- **Clear variable names.** Variables named `x1, x2, x3` forced the reader to hold the mapping from name to meaning in working memory, and that memory was expensive. Variables named `head_count, total_weight, current_index` carried their meaning with them, freeing working memory for the actual problem.

- **Consistent formatting.** Indentation. Alignment. Whitespace. A program that looked messy was a program that took extra cognitive cycles to read, and cognitive cycles were the whole budget. A program that looked clean was a program you could scan quickly and trust.

- **Careful layout.** Related code grouped together. Subroutines in a consistent order. Data structures near their definitions. Declarations separate from use. The printout was a physical document you would hold in your hand and stare at, and the layout of the printout determined how fast you could find things.

None of this was mandated by a style guide. There *were* no style guides in the modern sense. These habits were forged by the economic pressure of expensive reading. When reading your own code tomorrow would cost you a day of turnaround if you got confused, you invested today in making the code un-confusing.

The modern programmer can afford to skip all of this because modern tools let you jump to a definition with a keystroke, rename a variable across a whole file in a click, and run the code to see what it does. The tools have absorbed the cognitive load the old habits used to prevent. And the habits, no longer necessary for survival, have atrophied — until they become necessary again, in an AI agent context where every token of description is a token not available for reasoning, and clean code once again pays for itself in currency you can measure.

### 13. The Ethos of First Do No Harm

There is a Hippocratic Oath for programmers, though nobody has written it down. It goes: *when a program is working, touch it carefully.*

Punch card programmers touched working programs with great reverence, because a working program represented an enormous investment of time and money, and any change carried the risk of breaking something you could not easily restore. Source control in the modern sense did not exist. Backup strategies were primitive — you would keep a copy of the working deck in a filing cabinet, labeled with a date and a version number, and if you broke the program while modifying it, you would have to find the filing cabinet copy and start over from there.

The result was a programming culture in which every modification was planned, reviewed, and rehearsed. You would not change a working subroutine to "try something." You would analyze the current behavior, design the new behavior, write out the change on paper, walk through the consequences mentally, and only then punch new cards. And you would always punch a replacement card rather than modifying the working deck in-place, so that if the change did not work you could reconstitute the original by swapping cards.

The modern programmer, protected by git, refactors aggressively. She deletes code, rewrites files, restructures modules, and knows that if any of it breaks she can `git reset --hard` to the last commit. This is a genuine engineering advance. It permits experimentation at scales that were impossible before, and experiments produce knowledge.

But aggressive refactoring also carries a cost: the programmer loses the habit of *reverence* for working code. She treats working code as a starting point rather than an achievement. And in a subtle way, this affects the shape of the code itself. Code written in a reverent culture is different from code written in a permissive one. Reverent code is more *stable*, more *considered*, more *finished*. Permissive code is more *lively*, more *speculative*, more *in-progress*. Both have their virtues, but they are not the same.

The punch card era erred on the side of reverence. The modern era errs on the side of permissiveness. A balanced engineer recognizes when each is appropriate: revere the code that has earned reverence, and refactor the code that hasn't. Knowing which is which is a skill that has to be learned, and the punch card era taught it automatically.

---

## Interlude: The Women of the Machine Room

Any honest history of constrained computing has to pause and name the people that most tellings leave out. The image that "punch card programmer" conjures in most modern minds is a man in a short-sleeve dress shirt and a clip-on tie, bending over a coding pad at a government lab. That image is not wrong — there were plenty of men like that — but it is catastrophically incomplete.

Programming in the punch card era was, by a wide margin, work done by women. Not exclusively, but predominantly, and especially in the early decades. The ENIAC programmers of 1945 — Jean Jennings Bartik, Betty Snyder Holberton, Kathleen McNulty Mauchly Antonelli, Marlyn Wescoff Meltzer, Frances Bilas Spence, and Ruth Lichterman Teitelbaum — were six women who were handed a machine with no programming manual (there wasn't one), no debugger (the concept did not yet exist), and a delivery schedule imposed by the United States Army during the last months of the Second World War. They built the discipline of programming from scratch, by desk-checking, by physical inspection of the plug-board, by arguing with each other about what the machine should do next. They did this without fanfare, without credit, and in many cases without even being named in the press photos that were taken of "the computer" — meaning the machine, though the word *computer* had until quite recently referred to the women who did computations by hand.

Grace Hopper invented the first compiler (A-0, 1952) and coined the term *bug* after finding a literal moth in a relay of the Harvard Mark II. She also invented the idea of a high-level language — that one might write code in a human-readable form and have the machine translate it to machine code, a notion that her colleagues initially dismissed as impossible, because computers "only understood numbers." She was right and they were wrong, and her work made FORTRAN and COBOL possible, and COBOL ran — still runs, today — the financial infrastructure of the developed world.

Margaret Hamilton led the Apollo software team, as we have noted. Frances Allen pioneered compiler optimization and became the first woman to win the Turing Award in 2006. Jean Sammet wrote *Programming Languages: History and Fundamentals*, the definitive early reference. Mary Allen Wilkes designed the LINC operating system and was, as far as anyone can tell, the first person to use a computer in her own home — in 1965, when the very idea of a "personal" computer was so exotic it did not yet exist as a term.

The keypunch rooms of university computing centers were almost entirely staffed by women. The "computers" of NASA's early space program, later made famous by the film *Hidden Figures*, were Black women doing orbital mechanics calculations by hand and later becoming the first programmers of the IBM 7090 at Langley. The operators of the great mainframes of the 1960s and 1970s were disproportionately women, because "operator" was classified as a clerical job and clerical jobs were women's work, until the job became high-status and was reclassified as "systems administrator" and became, without anyone quite noticing how, men's work instead.

Why am I pausing on this? Because the punch card era's discipline was in significant part a *women's discipline*, built and transmitted by women, and the historical amnesia that treats programming as a male profession has also treated the specific habits of careful craft — desk-checking, reverence for working code, incremental verification, precise commenting — as if they were universal when they were in fact the contribution of particular people working in particular ways. The erasure of the women also erased the specific origins of the craft, and made it possible, in the 1990s and 2000s, for a new generation of mostly-male programmers to re-imagine the entire history as one in which the old ways had always been optional.

They were not optional. They were necessary. And the people who did the work the hardest and best were, disproportionately, not the people whose portraits now hang in the Computer History Museum.

When we recover the punch card discipline for AI agent orchestration, we should recover it with this lineage in mind. We should name the women who built it. We should teach the history accurately. And we should notice that the new discipline of prompt engineering and context management is, in its present form, being developed by a more diverse group than the hagiographies of Silicon Valley usually credit — and that this is a good thing, and a return to the actual historical pattern, rather than a departure from it.

---

---

## Interlude: Three Quotes from the Old Masters

Before we turn to what abundance destroyed, let me lay down three quotations from people who lived and thought deeply through the punch card era. Each of them said something that I find returning to my mind, unbidden, whenever I watch a modern engineer struggle with an AI agent workflow. The quotes are old. The applications are new. The correspondence is exact.

The first is from Edsger Dijkstra, in his 1972 Turing Award lecture *The Humble Programmer*:

> "The problems of business administration in general and database management in particular are much too difficult for people that think in IBMese, whilst they are amply challenging for people that think in ALGOL60 or LISP."

Dijkstra's point, which sounds like snobbery but is actually a deep observation, was that *the language you think in determines the problems you can solve*. Languages shape cognition. A programmer fluent only in COBOL thinks the way COBOL thinks, and the problems she can elegantly express are COBOL-shaped problems. A programmer fluent in LISP or ALGOL can express a wider variety of problems because the languages admit a wider variety of abstractions.

The modern translation is obvious. *The prompt language you think in determines the AI agent behaviors you can orchestrate*. An engineer whose mental model of AI agents is "chatbot" can orchestrate chatbot-shaped tasks, but nothing more. An engineer whose mental model is "autonomous software subsystem with a context budget and tool affordances" can orchestrate software development, research, verification, and long-running project management. The vocabulary is the ceiling.

The second quote is from Alan Kay, reflecting on his work at Xerox PARC in the 1970s:

> "Simple things should be simple, complex things should be possible."

Kay was articulating a design goal for Smalltalk and for the PARC systems generally. It sounds obvious, but it is in fact a demanding constraint. It means that you cannot make the simple things complicated in order to enable the complex things — a temptation many system designers give in to. It means that you cannot make the complex things impossible in order to keep the simple things simple — a temptation many beginner-friendly tools give in to. You have to do both. You have to design the simple interface *and* the escape hatch, and you have to make the escape hatch reachable from the simple interface without discarding it, and this is much harder than most designers realize.

AI agent systems are currently failing Kay's test in both directions. The "simple things simple" version is a chatbot with a prompt box: simple to use, impossible to push into complex territory. The "complex things possible" version is a fully programmable agent framework with dozens of configuration options: powerful, but so complicated that simple tasks become an exercise in reading documentation. Neither is what we want. What we want is a system where asking the agent to summarize a file is one line, and asking the agent to run a three-day research project with budget constraints and human checkpoints is ten lines, and the ten-line version is a natural extension of the one-line version rather than a separate system. Kay's principle is still the right target. Most current systems do not meet it.

The third quote is from Fred Brooks in *The Mythical Man-Month* (1975):

> "Good judgment comes from experience, and experience comes from bad judgment."

This is a joke with a serious point underneath. The serious point is that you cannot produce good engineers by protecting them from bad experiences. You have to let them make mistakes, feel the consequences of the mistakes, and build up a mental model of what goes wrong and why. The bad judgment is not a bug in the process of becoming a good engineer. It is the *mechanism* by which one becomes a good engineer.

This has implications for how we should treat AI agent engineering. Novice agent engineers will make mistakes. They will burn tokens on thrashing. They will submit half-baked prompts and get garbage back. They will blame the model for things that were their own fault. This is part of the learning curve, and it cannot be skipped by any amount of documentation or training.

The implication is that agent engineering, like every other engineering discipline, has to be *practiced* under conditions where the mistakes are instructive but not catastrophic. The practice environment should have real constraints (so the mistakes teach real lessons) but forgiving consequences (so the mistakes do not end careers). The punch card era had university computing centers for this purpose — places where students could make mistakes on real machines with real turnaround delays, learning the discipline at a cost that the institution could absorb. AI agent engineering needs the equivalent: practice environments where engineers can burn small amounts of token budget to learn large amounts of craft.

---

## Part IV: What Abundance Destroyed

### 14. The Fast Feedback Fallacy

Between 1970 and 1985, interactive terminals replaced batch submission at most computing centers. The transition was gradual — timesharing systems like DTSS, CTSS, and Multics had offered interactive access since the 1960s, but they were expensive, and batch remained the common case for students and routine work well into the 1970s. By the mid-1980s, with the rise of Unix workstations and personal computers, interactive development was the default. The punch card workflow was history.

The shift was celebrated, and rightly so. Interactive development removed a lot of friction. The student who used to wait six hours for a turnaround could now type a command and see a response in seconds. Productivity went up. Frustration went down. More people could become programmers, because the learning curve was no longer steepened by punitive feedback loops.

But something else happened, too. The punishment for sloppy iteration was removed. Suddenly you could *try things* — type a line, see what happened, fix it, try again. This was liberating for beginners, and it was also liberating for experts, who could prototype ideas in minutes that used to take days. But it was also, in a subtle way, corrosive to the discipline that the old workflow had enforced.

The rise of interpreted languages accelerated the shift. BASIC in the 1970s, then Python and JavaScript in the 1990s and 2000s, offered REPLs — Read-Eval-Print Loops — where you could test one line at a time. Every expression you typed was a tiny program, submitted to an immediate verification loop. The REPL was the ultimate form of fast feedback. It was also, quietly, the ultimate form of *not having to know what you were doing*.

I do not mean this as an insult to REPLs. They are wonderful tools. They are the fastest path to exploration for a skilled programmer, and the gentlest on-ramp for a new one. But in the hands of a programmer who does not have the discipline of desk-checking, the REPL becomes a crutch: a way to substitute trial-and-error for reasoning, to grope toward a correct expression without ever understanding why the incorrect ones were incorrect. Over time, this produces a programmer who cannot predict behavior without running code — and who is therefore helpless when the code is too expensive or too slow or too dangerous to run.

This is what I mean by the fast feedback fallacy. Fast feedback is good. Fast feedback *that replaces thinking* is not. The distinction is subtle, and nobody teaches it explicitly, and so an entire generation of programmers has grown up conflating the two.

### 15. The Abstraction Tax

Modern programming is built on a tower of abstractions. A typical web application running in 2026 passes through:

- A browser DOM, implemented in C++, compiled to native code.
- A JavaScript runtime, implemented in C++, compiled to native code.
- A rendering engine, running on the GPU via shader programs.
- A React framework, written in JavaScript, running on the JS runtime.
- A component library (say, Radix), written in TypeScript, transpiled to JavaScript.
- The application code, written in TypeScript, transpiled to JavaScript, bundled by Vite, served by a CDN.
- An HTTP/2 stack handling the transport, implemented in C and Rust.
- A TLS layer handling encryption, implemented in C.
- A network stack handling packet routing, implemented in the operating system kernel.
- An operating system, written in C, running on a CPU executing microcode.

Each layer is a convenience. Each layer also removes a little bit of understanding from the programmer above. The application developer does not know how React schedules updates; the React developer does not know how V8 compiles JavaScript; the V8 developer does not know exactly how Intel's branch predictor handles speculative execution. Each layer is someone else's problem, and the system works because of the collective pretense that it does.

The punch card programmer had no abstraction tower. She had the machine, the operating system, the compiler, and her program. Four things. She understood each of them well enough to reason about their interaction. When her FORTRAN program produced unexpected output, she could ask: is it a logic error in my code? A compiler bug? An operating system quirk? A hardware glitch? And she could investigate each of those herself, because each was in her grasp.

The modern programmer confronting an unexpected bug has to triage through dozens of layers, most of which are black boxes. "Is it my code? React? React Router? TanStack Query? The TypeScript compiler? The bundler? The service worker? The CDN cache? The origin server? The database? The database's replication lag? The network? The browser extension the user happens to have installed?" Any of these can produce the symptom. Most of them are opaque to the application developer. The only practical strategy is trial-and-error, bisection, and praying to the debugging gods.

Abstractions pay their own tax. They accelerate the common case, and they render the uncommon case nearly impossible to debug. The punch card era had less abstraction, and therefore less convenience, and therefore less mystery. When you hit a wall, you could see the wall. Now you hit walls that are invisible, and you cannot tell if you hit a wall or stepped into a well.

#### The Leaky Abstraction Principle

Joel Spolsky coined the phrase *Law of Leaky Abstractions* in 2002: "All non-trivial abstractions, to some degree, are leaky." He meant that every abstraction eventually fails to hide the thing it is abstracting over, and when it does, the programmer has to understand the underlying reality to make progress. The abstraction is an optimization for the common case; the exception cases punch through and demand the raw truth.

Spolsky's law explains why the abstraction tax is so pernicious. It is not that the abstractions don't work most of the time — they do. It is that when they fail, they fail in ways that require the programmer to have retained the deeper understanding the abstractions let her skip building. The programmer who skipped building it cannot debug the failure, because she lacks the mental model of the layer below. She has to either learn the lower layer at the worst possible moment (under production pressure, with a bug in her face) or give up and rewrite the system on a different abstraction, hoping the new one does not leak in the same way.

The punch card programmer did not have this problem because she had not skipped the lower layers. She knew the machine, the OS, the compiler, and her program. When the abstraction leaked — and it did, often — she had the tools to understand why. Her mental model was deep enough to catch the leak and patch it.

This is not an argument against abstractions. Abstractions are necessary. The argument is that abstractions should be chosen with the awareness that they will eventually leak, and the team using them should have at least one person who understands the layer below and can debug the leaks when they happen. A team in which *nobody* understands the layers below the topmost framework is a team that is one production incident away from catastrophe, because when the catastrophe happens they will have no tools to fight it.

Constraint culture forces people to understand the layers below, because there is no topmost framework to hide in. Abundance culture permits people to ignore the layers below, because the frameworks are good enough most of the time. Both cultures ship software. Only one of them can fix software when it breaks in unexpected ways.

### 16. The Disposable Code Problem

When iteration is free, code becomes disposable. Prototypes that should be thrown away get promoted to production. Quick hacks written to test an idea become load-bearing infrastructure, because there was always something more urgent to build and the quick hack was "good enough for now." The modern codebase is often a palimpsest of abandoned experiments, frozen into place by the inertia of other code that depends on them.

The punch card era had disposable code too — but less of it, and for a different reason. When every run costs money, you tend not to submit code you plan to throw away. You submit code you plan to keep. The very act of investing in the run is an implicit commitment to the design. Whereas in a modern codebase, you can write a function at 2pm, realize at 3pm that it was the wrong approach, leave it there anyway because you're now chasing a more urgent bug, and discover six months later that twelve other functions depend on it and removing it would break production.

The accumulation of load-bearing quick hacks is a signature failure mode of abundance-era programming. It does not happen because anyone is lazy. It happens because the economics permit it. Each individual decision to leave a quick hack in place is locally rational — the cost of removing it now exceeds the benefit — but the aggregate effect is a codebase that is progressively less coherent, less understandable, and less maintainable, until finally a rewrite is the only option, and the rewrite itself accumulates its own quick hacks, and the cycle repeats.

Constraint is the only cure. When you cannot afford to leave disposable code lying around, you either delete it or promote it properly. Neither option is painful enough to skip. The punch card era had this forcing function built in. The modern era has to impose it deliberately, and most codebases do not.

There is a principle I have heard attributed to various senior engineers, and I do not know who said it first, but it captures the disposable code problem perfectly: *"Every line of code you write is a liability, not an asset. The asset is the behavior the code produces. If you can produce the behavior with fewer lines, you have more asset per unit of liability, and that is the only metric that matters."* This reverses the modern obsession with "lines of code produced" as a measure of productivity. A programmer who produces ten thousand lines of messy code in a month has shipped ten thousand lines of liability. A programmer who produces a thousand lines of clean code in a month, and deletes two thousand lines of old messy code while doing it, has *reduced* the system's liability by a thousand lines while adding the same behavior. The second programmer is ten times as productive as the first, by the only metric that matters — and zero times as productive by the metric that gets measured in most engineering organizations. This is why the metric is wrong. This is why the best engineers often look unproductive by the metric, because they are doing the invisible work of reducing liability, and the metric does not see it.

The punch card era instinctively measured the right thing, because the programmers themselves paid the cost of excess code in their own personal budgets of turnaround time and money. Writing more code than necessary made the deck larger, which made submission slower, which made iteration more expensive. The programmer had every personal incentive to write the smallest correct program, and she did, and the system was better for it.

### 17. The Skill Atrophy Cycle

Here is the sad arithmetic of abundance. As feedback gets faster, the skill of predicting program behavior atrophies. Why predict when you can run? Why think when you can try? The brain, like the body, cuts metabolic investment in muscles it does not use. Over a career, the modern programmer loses the ability to reason about unrun code, because she never has to. She is fast in familiar territory — where the REPL can answer any question in a second — and helpless in unfamiliar territory, where the REPL cannot be consulted because the code is too slow, too dangerous, or too expensive to run.

The cycle is self-reinforcing. Each generation of tools makes feedback faster. Each generation of programmers thinks a little less. Each generation of tools has to compensate for the reduced thinking by offering more features — autocomplete, refactoring tools, type checkers, linters, language servers — that do the thinking *for* the programmer. And each such feature further reduces the need to think, and further atrophies the skill.

There is no villain here. No conspiracy. Just the gradient of incentives, all of them local, all of them reasonable, all of them pushing in the same direction. Tool builders want to make their tools useful. Programmers want to be productive. Employers want to ship faster. Every individual decision is correct. The aggregate result is a class of engineers who are very productive on problems that fit inside the tool chain and very poor at problems that don't.

The skill atrophy cycle is not irreversible. A programmer who notices it can arrest it by deliberately choosing harder problems, refusing to run the code until she has predicted its behavior, and practicing the old disciplines even though nothing forces her to. Some do. Most don't. And so the baseline drifts.

The only hope for the baseline is external constraint. Something that forces thinking back into the loop. Something that makes careless running expensive again. Something like — and here we arrive at the core argument of this document — the token budget of an AI agent.

#### The Embedded-Systems Exception

Before we move on, it is worth noting that the skill atrophy cycle has not run its course uniformly across the whole field. There is a population of programmers who never stopped honoring the old constraints, because their domain never let them. Embedded-systems developers writing firmware for microcontrollers with four kilobytes of RAM have always lived in punch-card economics. They cannot "just try things," because the edit-flash-test cycle on a bare-metal target is expensive, slow, and dangerous. They cannot ignore memory, because there is no memory to ignore. They cannot ignore timing, because the thing they are controlling is a motor or a valve or a sensor that will misbehave if the deadline is missed.

As a result, the embedded-systems community has retained a culture of craft that the application-software community has largely lost. They still desk-check. They still design before coding. They still comment *why*, not *what*. They still treat every byte as precious and every cycle as billable. They are, in a real sense, the last continuously operating remnant of the punch card tradition.

Go to a talk at an embedded-systems conference and you will hear the same cadence as a computing-center training manual from 1972. The speaker will describe a problem, then describe the design, then describe the trade-offs, then describe the implementation, then describe the verification, then describe what went wrong and how it was found. The structure is ancient because the economics are ancient. The tools are different — modern debuggers, real-time trace captures, logic analyzers — but the rhythm has not changed.

When AI agent engineers look for role models, they should look here. The embedded community has already solved the problem of doing great work inside hard resource budgets. Their techniques port. Their discipline transfers. And their existence proves that the skill atrophy cycle is not a one-way door: cultures that maintain contact with real constraints maintain the old craft, and cultures that lose that contact lose the craft, and cultures that rediscover the constraints can rebuild the craft from the still-living traditions that never let it die.

---

## Interlude: The Space Shuttle, the Pager, and the Pacemaker

Before we turn fully to AI agents, I want to pause on three systems that illustrate the survival of punch card craft into the modern era. None of them are historical curiosities. All three are alive today, running code written under punch-card discipline, maintained by people who have refused to let the discipline die. They are proof that the old ways are not obsolete — they are just rare.

#### The Space Shuttle Avionics

The Primary Avionics Software System (PASS) that flew the Space Shuttle from 1981 to 2011 is one of the most famous examples of software engineering under extreme constraint. It was written in HAL/S, a purpose-built language. It ran on the Shuttle's five General Purpose Computers, which had 416 kilobytes of memory apiece — less than the laptop on which I am writing this document by four orders of magnitude. It controlled a vehicle that flew at Mach 25, landed without engines, and carried astronauts on top of 4.5 million pounds of thrust. It had to work the first time. It mostly did.

The team that maintained PASS over its thirty-year operational life had a reputation for producing software with an error rate of approximately 0.1 defects per thousand lines of code, which was about seventy-five times better than the industry average for commercial software at the time. This was not because they were seventy-five times smarter. It was because they had a workflow that took them seventy-five times longer per line of code — and they shipped software that worked, on a system where "worked" meant "astronauts came home alive."

Their workflow included exhaustive review of every change, formal specification of every subroutine, independent verification and validation by a separate team, and a culture in which claiming "I don't know why it works but the tests pass" was a firing offense. The culture was, unmistakably, a direct descendant of the punch card era — preserved into the modern age by the simple expedient of *never letting the constraints relax*. NASA made the constraints real, enforced them through process, and got the old craft as a result.

This is the key insight: the old craft does not require old hardware. It requires *real constraints*, rigorously enforced, and a culture that honors them. NASA provides the constraints by institutional decree. Private-sector engineering cannot usually do this, because private-sector economics do not punish sloppiness the way a fatal accident does. But the lesson is clear. The craft is available to anyone willing to impose the constraints.

#### The Pager Network

The second example is less famous and more melancholy. As of 2026, North American pager networks are still running, serving perhaps a few hundred thousand users — mostly emergency responders, hospital workers, and people who work in environments where cellular coverage is unreliable. The core of these networks runs on equipment designed in the 1980s, maintained by a small cadre of engineers who understand the POCSAG and FLEX protocols at a level of depth that nobody is training anymore.

I know one of these engineers. He is in his sixties. He learned the craft in an era when every byte transmitted over the air was billed, every transmitter was expensive, and every failure was visible to the customer within seconds. The discipline he brought to the work — careful design, exhaustive testing on the bench before deploying to the network, detailed logs of every change — was the same discipline he would have brought to a punch card shop in 1970, because he learned from people who had been punch card programmers, and the lineage was unbroken.

When he retires, the lineage in that particular pocket of the industry will end. The pager networks will continue running for a while on autopilot, then something will break, and the replacement engineers will not understand the system deeply enough to fix it cheaply. The network will be decommissioned, and the discipline that kept it running will be lost.

This is a small story, and it happens constantly in corners of the industry nobody pays attention to. It is the slow attrition of craft through the retirement of its last practitioners. Every such loss is a reminder that discipline, like any other cultural practice, has to be transmitted to survive. If you cannot name the next generation you are training, you are watching the last generation work.

#### The Pacemaker

The third example is the modern implantable pacemaker. Modern pacemakers run on microcontrollers with perhaps 32 kilobytes of RAM, execute programs written in tightly-reviewed C, and must operate for a decade on a single battery, inside a human chest cavity, with no possibility of field updates and a failure mode that is directly lethal. The firmware for a pacemaker is one of the purest surviving examples of punch card-era discipline, because the consequences of sloppiness are immediate, personal, and final.

Pacemaker engineers do not iterate by trial and error. They cannot. Every change is reviewed, modeled, simulated, verified, validated, tested in vitro, tested in vivo, and then — only then — approved for human implantation. The process takes years. The cost is enormous. The result is a class of device that fails so rarely that the failures are studied as case studies for the industry, because they are rare enough to be individually memorable.

The pacemaker industry proves that the old discipline still works, that it produces the best outcomes when outcomes matter most, and that the only reason the rest of the industry does not use it is that the rest of the industry does not have outcomes that matter as much. When outcomes matter — when the cost of failure is measured in human lives or vaporized rockets or national-security catastrophes — the old discipline comes out of the archives and is used, and it works, every time.

The question the rest of the industry has to ask is whether its outcomes matter enough to deserve the discipline. Most of the time the honest answer is "no" — a bug in a social-media feed is not a pacemaker failure, and demanding pacemaker-quality engineering for every web app would be economically ruinous. But some of the time the answer is "yes," and the organizations that recognize when it is yes and respond accordingly are the ones that build systems that last.

AI agent orchestration is, I would argue, one of the cases where the answer is yes. Not because a failing agent kills anyone directly — it mostly doesn't — but because agents that are deployed at scale, with real money on the line, operating on real codebases and real customer data, carry enough cumulative risk that the punch card discipline pays for itself even in pure dollar terms. The pacemaker engineers are not the only model. They are *a* model. And the model scales.

---

## Part V: The Return of Constraint — AI Agent Orchestration

### 18. Token Budgets as the New Punch Card

In 2023, the first generation of AI coding assistants appeared in production. They were small, limited, and experimental. By 2024 they were capable enough to be useful on real projects. By 2025 they were capable enough to be trusted with entire phases of work, running autonomously, making dozens of tool calls per task. By 2026 they were a routine part of engineering workflows at companies that would have laughed at the idea three years earlier.

And they were expensive. Not extravagantly — a single task might cost a dollar or ten, not hundreds — but expensively enough to matter. Running an AI agent carelessly could burn through a project's monthly budget in a week. Running it recklessly could fail to achieve the goal while still spending the money. The economics echoed 1965 with uncanny precision: every run cost real money, every run took real time, every run might fail, and the only way to get good results was to be thoughtful about what you asked for.

Token budgets are the new punch cards. They are the new forcing function. They are the new economic constraint that separates careful operators from careless ones, and they are already producing, in a small community of engineers who have learned to use them well, a renaissance of the old disciplines.

Consider the mental posture of an engineer running an AI agent well. She does not say "go figure out this problem." She writes a specification. She reads it back to herself. She trims it. She identifies which files the agent will need and specifies them explicitly, so the agent does not waste tokens searching. She defines success criteria in concrete terms, so the agent knows when to stop. She designs the task as a sequence of small verifiable steps, so that if the agent fails at step three she can intervene without losing steps one and two. She thinks about context management: what information does the agent need, what can it discard, what should it summarize. She thinks about tool budgets: how many tool calls is this task worth, and what does she want to happen when the budget is exhausted.

Every one of these habits is a direct transplant from the punch card era. The specification is the coding pad. The trimming is the desk-check. The file identification is the deck preparation. The success criteria are the expected output. The step decomposition is the incremental submission. The context management is the memory budget. The tool budget is the compute budget. She is, without being told, running the same workflow as a 1965 programmer at the University of Michigan computing center. She has reinvented it from first principles, because the economics reinvented her problem.

### 19. Context Windows as Core Memory

Early computers had tiny memories. The IBM 1401 (1959) shipped with as little as 1,400 characters of core memory in its base configuration. The PDP-8 (1965) had 4,096 twelve-bit words. The original Apollo Guidance Computer had 2,048 words of erasable RAM and 36,864 words of read-only core rope, hand-woven by women at the Raytheon plant in Waltham, Massachusetts. These were the machines that flew to the Moon.

Programmers who targeted these machines had to fit their entire program — *and* their entire data — into a handful of kilobytes. Every byte mattered. Every variable was chosen carefully. Every data structure was designed to minimize its footprint. There were no frameworks. There were no standard libraries in the modern sense. You brought what you needed, you wrote it to fit, and you did not bring anything you did not need.

Modern AI agents have context windows. These are, functionally, the core memory of the agent's reasoning process. A state-of-the-art context window in 2026 is 200,000 tokens, sometimes a million. This sounds enormous — 200,000 tokens is roughly 150,000 words, or a novel-length document. But once you start loading the agent with a codebase, a task description, tool definitions, previous tool outputs, and a chain of reasoning, the window fills fast. An engineer running an agent on a large project routinely runs out of context before the task is done.

When you run out of context, you cannot add more. There is no paging to disk. There is no swap. There is no "load another chip." The window is the window, and the agent must complete the task within it, or fail.

This is exactly the constraint that PDP-8 programmers lived with. And it produces exactly the same habits. You don't load things into the context that you don't need. You summarize long histories instead of keeping them verbatim. You chunk large files and load only the chunks that matter. You prune tool outputs to their essentials before they pile up. You write clean prompts that don't waste tokens on pleasantries. You budget your context the way a Moon lander programmer budgeted core: every token is precious real estate.

There is a beautiful recursion here. The punch card programmer of 1965 carefully managed the 4,096 words of memory on the machine she was programming. The agent engineer of 2026 carefully manages the 200,000 tokens of context on the *AI* that is doing the programming. The level of abstraction has gone up by several orders — we have moved from silicon to language models — but the principle has not changed. Memory is finite. Every unit of it has to earn its place. And the engineer who respects this ships better work.

### 20. The Return of Design

Watch an AI agent work on a task without a plan. It will thrash. It will read files it doesn't need. It will make changes it later has to undo. It will run tests before the implementation is ready. It will burn through its context on exploration when it should have spent it on execution. It will often get the task done eventually, but inefficiently, and sometimes it will fail entirely because it ran out of budget while still lost in the exploration phase.

Now watch an AI agent work on a task with a plan. A real plan, written out as a sequence of steps, with explicit success criteria, with a list of files to read, with a bounded tool budget per step. It will move with purpose. It will read the files it was told to read. It will make the changes it was asked to make. It will verify as it goes. It will finish with budget left over.

The difference is not intelligence. The two agents are the same model. The difference is *design*. The first agent is executing without a plan. The second agent is executing against a plan. And the value of the plan is not that it tells the agent what to do — the agent could figure out what to do, given enough context — but that it conserves context by removing the need to figure it out.

This is the return of the design phase. In the punch card era, design was the primary work. In the REPL era, design became optional. In the AI agent era, design is primary again, because running an undesigned agent is as wasteful as running an undesigned punch card program, for exactly the same reason: the running costs real money, and the design costs only thought.

I watch engineers learn this lesson with a kind of poignant recognition. They start by trying to "just ask the agent" for things, and the agent does a mediocre job, and they blame the agent. Then they start writing more detailed requests, and the agent does better, and they credit the agent. Then they start writing full plans, with explicit steps, and the agent does great work, and they realize — with a little jolt of historical humility — that they have reinvented the workflow that their grandparents' programming manuals described in the first chapter.

There is a specific moment in this learning curve that I have come to recognize as the "punch card epiphany." It happens when the engineer, for the first time, spends an hour writing a plan for a task that they could probably have just started working on, and then they watch the agent execute the plan in twelve minutes with no errors and no wasted tokens, and they realize — with a startled intake of breath — that the hour they spent on the plan saved something like four hours of thrashing they would otherwise have done. The ratio clicks. The economics click. They stop complaining about the time they spent planning and start complaining about the tasks where they *didn't* plan enough, because now they can feel the cost of unplanned work in their bones.

After the punch card epiphany, engineers often become evangelical about planning. They will tell you, unprompted, that "the plan is the work," and that "coding is just the transcription step," and that "design is the only thing that matters," and they will do this without irony, not realizing that they are quoting, nearly word for word, Ed Yourdon's structured-programming manuals from 1975. They have rediscovered the old truth by independent derivation, from first principles, under the economic pressure of a new constraint. And the rediscovery feels like revelation, because to them it *is* revelation — they have never been told that programming used to work this way, because nobody teaches the history, because nobody alive in their professional circle remembers it firsthand.

The epiphany is the moment when the new engineer joins the old tradition without knowing it. They will not use the old vocabulary, because they do not know the old vocabulary. They will invent new terms — "context engineering," "prompt patterns," "agentic planning" — that describe the same practices the old hands called "structured design," "top-down decomposition," and "stepwise refinement." The continuity is perfect. Only the names have changed.

### 21. Batch Execution

Modern AI agent workflows include a pattern called *parallel tool calls*: prepare a batch of independent tool invocations, submit them together, collect the results, and synthesize. This pattern exists because tool calls are expensive in two ways — latency (each tool call is a round trip) and context (each tool call fills the agent's window with output). Batching reduces the latency cost and lets the agent process many results with a single reasoning step.

This is exactly the batch execution model of 1965. Prepare the deck. Submit. Wait. Read the output. Improve. The only difference is that the deck is now a JSON object and the operator is now a container runtime. Everything else — the mental posture, the economics, the need for careful preparation — is the same.

A well-orchestrated AI agent workflow looks remarkably similar to a 1965 computing center workflow. There is a submission step. There is a processing step. There is a return step. There is an analysis step. There is a resubmission step. There are checkpoints, logs, status pages. There is, above all, a discipline of not submitting half-baked work, because submitting half-baked work wastes a run. The technology is new. The rhythm is ancient.

The engineers who learn this rhythm produce better outcomes than the engineers who fight it. I have seen this repeatedly. The engineer who treats an AI agent like an interactive REPL — asking it one question at a time, reading the response, asking another — gets slow, expensive, mediocre results. The engineer who treats an AI agent like a batch processor — preparing full instructions, submitting, analyzing the output, iterating carefully — gets fast, efficient, excellent results. The rhythm matters. The rhythm is everything.

### 22. Iterative Refinement

The punch card programmer iterated slowly but deliberately. The modern interactive programmer iterates quickly but often aimlessly. The AI agent engineer must iterate deliberately because deliberation pays off in tokens saved and budgets respected.

What does deliberate iteration look like? It looks like this:

1. **Define the current gap.** What, exactly, is missing between where we are and where we want to be? Not vaguely — specifically.

2. **Hypothesize the smallest change that closes the gap.** Not the most complete change. Not the most elegant. The *smallest*.

3. **Predict the outcome.** What will happen if we make this change? What should the tests show? What should the logs say? What should the program do?

4. **Execute the change.** Submit the deck. Run the agent. Invoke the tool.

5. **Compare outcome to prediction.** Did the change do what you expected? If yes, you have learned that your model of the system is accurate, which is valuable. If no, you have learned that your model is wrong in a specific way, which is even more valuable.

6. **Update the model.** Revise your understanding based on what you saw. Now your prediction for the next iteration will be sharper.

7. **Return to step 1.**

This loop is not fast. Each iteration takes minutes, sometimes longer. But each iteration *compounds*. The programmer who runs this loop ten times in an hour is building a model of the system that will serve her for the entire project. The programmer who runs forty undeliberate iterations in the same hour is building nothing. She has forty data points but no theory.

The punch card era forced the deliberate version of this loop. The REPL era made the undeliberate version possible. The AI agent era is, once again, forcing the deliberate version — because the undeliberate version is simply too expensive and too slow to compete.

### 23. The Amiga Principle

I want to linger on a single machine because it makes the point more vividly than any abstract argument.

The Commodore Amiga 1000 shipped in 1985. It had 256 kilobytes of RAM. It had a 7.16 MHz Motorola 68000 CPU. It had a custom chipset with names out of Norse mythology — Agnus, Denise, Paula — that handled graphics, sound, and I/O in parallel with the main CPU. It cost $1,295 at launch. The Macintosh released a year earlier, with less graphics capability and monaural audio, sold for $2,495.

In 256 kilobytes — the size of a single modern JPEG — the Amiga ran:

- A preemptive multitasking operating system (AmigaOS) with message passing, dynamic library loading, and shared memory.
- A windowing system with overlapping windows, menus, drag-and-drop, and font rendering.
- Four-channel stereo audio at 8-bit resolution, with DMA playback, enabling music playback at a quality that would not be matched by PC sound cards for another five years.
- 32-color graphics on a 320x200 screen, or 16 colors at 640x400 interlaced, with hardware sprites, blitter operations, and a programmable copper list for per-scanline effects.
- A BASIC interpreter, a text editor, a shell, a file manager, and a handful of utilities.
- Room for a user program to run on top of all of it.

This was not a technology demo. This was a shipping consumer product that families bought to run spreadsheets and play games and render 3D animations at home. The Video Toaster, a professional video editing system that ran on the Amiga 2000, was used to produce television shows throughout the 1990s. The Amiga's demoscene produced real-time visual effects in the late 1980s and early 1990s that rivaled anything running on workstations ten times the price.

The Amiga did all of this in 256 kilobytes because the constraints were *real*, and the constraints *forced careful design*. The OS was written in assembly and hand-tuned C. The custom chipset offloaded parallelizable work from the CPU so the CPU could focus on logic. The shared-library system let multiple programs reuse code without duplicating it in memory. Every byte was scrutinized. Every cycle was accounted for. The design was pervaded by a refusal to waste.

Modern software running on machines with a quarter-million times more memory often *does less* than the Amiga did. Not because modern programmers are worse — they are not — but because they operate without the forcing function. When you have 64 gigabytes, you can afford to ship sloppy. When you have 256 kilobytes, you can't. The Amiga team couldn't, so they didn't, and what they shipped was a small miracle.

**This is the Amiga principle: real constraints produce real craft, and relaxed constraints relax craft by default, unless the relaxation is compensated by deliberate discipline.**

AI agent programming is the Amiga principle returning. A 200,000 token context window is, in today's world, a 256-kilobyte Amiga. It is laughably small compared to what the machines themselves can do. But it is the budget inside which the agent must work, and the engineer who honors it produces small miracles, and the engineer who ignores it produces sloppy demos that bloat into nothing.

The Amiga engineers would recognize the workflow. They would nod at the tool budgets, the context pruning, the careful step planning. They would recognize it as their own craft, transplanted into a new medium. They would, I suspect, feel a little vindicated. The old ways still work. They were never wrong. They were only paused.

#### The Copper List as a Design Pattern

Let me go deeper into one specific Amiga technique, because it illustrates the philosophy with uncommon clarity. The Amiga had a co-processor called the *Copper* — short for "co-processor," naturally — that ran a tiny program called the *copper list*. The copper list was not a general-purpose program. It could do three things: wait for a specific screen position, skip an instruction, and write a value to a hardware register. That was the entire instruction set. Three instructions.

And yet the copper list was the engine behind some of the most visually striking effects in 1980s computing. By changing hardware registers at specific scanlines, the copper could produce color gradients that exceeded the display's stated color depth. It could re-enable hardware sprites mid-screen to produce more sprites than the hardware officially supported. It could change the screen mode partway down the display, producing mixed-resolution outputs in a single frame. It could synchronize the audio hardware with the video in ways that no general-purpose CPU of the era could have kept up with.

The copper list was a constrained language, and the constraint was what made it powerful. Because the copper had only three instructions, the language was easy to reason about, easy to debug, and easy to optimize. Because the language was cheap to execute, the copper could run in parallel with the main CPU, leaving the CPU free to do other work. Because the copper could write to hardware registers at precise moments, it could exploit the temporal structure of the display in ways that would have been impossible from a CPU that did not have that precise a relationship with the display timing.

Here is the pattern: *a tiny, highly-constrained language, executed by a dedicated agent, operating on a tight schedule, producing effects that the unconstrained alternative could not match*. Sound familiar? This is exactly the pattern that well-designed AI agent systems are beginning to converge on. You do not give the agent free rein. You give it a small domain-specific language of allowed operations. You give it a tight budget. You give it precise instructions about when and how to use its tools. And the agent, operating inside these constraints, produces results that an unconstrained agent would have thrashed on.

The copper list is, retrospectively, a template for agentic computing. It is also a template that was built in 1985, by engineers who had no idea that forty years later the pattern would resurface in a completely different substrate, carrying the same philosophical lessons. The Amiga team was teaching us something. We did not listen at the time. We are listening now, or at least some of us are, and the ones who are listening are building the best agent systems of our era.

#### The Blitter and the Cost Model

There is one more Amiga chip worth naming, because it encodes a lesson about cost models that AI agent engineers are currently rediscovering. The chip was the *Blitter* (short for "block image transferer"), and its job was to move chunks of memory around fast — copying sprites to the screen, filling polygons, drawing lines, scrolling backgrounds. The Blitter could do all of this in parallel with the main CPU, so the CPU could keep thinking while the Blitter kept drawing.

The key point about the Blitter was that programming it required you to *know what it cost*. Every Blitter operation was specified by a register configuration: source A, source B, source C, destination D, the logical operation to perform, the modulo values, the shift values, the size of the block. An experienced Amiga programmer knew the cost of each operation in Blitter cycles and could predict, to within a few cycles, how long the blit would take. This was not optional knowledge. If you set up a blit that was too big for the available time, it would overrun the vertical blank interval and cause screen tearing, and your program would look broken.

The cost model was explicit, knowable, and part of the programmer's mental model. This is the opposite of the modern norm. Most modern APIs hide their costs. You call a function, you get a result, you do not know whether the function took a microsecond or a second, ten kilobytes of memory or ten megabytes, one network round trip or a hundred. The cost is hidden by the abstraction, and the programmer is actively discouraged from asking about it, because asking is considered "premature optimization."

AI agents have forced the cost model back into the open. When you call a tool, you pay tokens for the output. When you read a file, you pay tokens for its contents. When you invoke a sub-agent, you pay tokens for its context plus its response. The cost is right there in the billing dashboard at the end of the day, and the engineer who cannot predict it is the engineer who will run out of budget mid-task. The Blitter programmers would recognize the posture. The cost is visible. The cost is knowable. The cost is part of the design. The engineer who respects the cost ships good work. The engineer who ignores it crashes out before the task is done.

This is perhaps the deepest lesson of the return of constraint: *the cost model is not an optimization concern; it is a design concern*. When the cost of your operations is hidden, you cannot design well, because you cannot tell which designs are feasible. When the cost is visible, design becomes possible, because you can reason about trade-offs. The entire abundance-era project of hiding costs from programmers was, in retrospect, a mistake — not because the hiding was wrong in every case, but because it was wrong in so many cases that the habit of asking about costs has been lost across a generation. Recovering the habit is hard. The only reliable way to recover it is external pressure: a constraint that refuses to be ignored. Token budgets are that constraint for AI agents. Real-time deadlines were that constraint for Amiga programmers. Memory limits were that constraint for embedded engineers. The form of the pressure varies. The recovered craft is the same.

---

## Part VI: Doing More With Less

#### Intermission: On the Poetry of Small Machines

Let me indulge, briefly, in a feeling rather than an argument.

There is something beautiful about small machines. Not beautiful in the way a Bugatti is beautiful — that is a beauty of lavish excess. Beautiful in the way a haiku is beautiful, or a well-designed teapot, or a word that perfectly fits the thing it names. Small machines make you feel the world as the world actually is: finite, specific, composed of parts you can count. Large machines obscure the world. Small machines reveal it.

When you program a 4-kilobyte PDP-8, you know where every byte is. When you program a 256-kilobyte Amiga, you know which chip is handling which register. When you program a 32-kilobyte microcontroller today, you can still point to the exact address where your variable lives. This physical groundedness is a kind of honesty that large-machine programming cannot offer. On a large machine, your variable is "somewhere in virtual memory," paged in and out by an allocator you cannot see, mapped to a physical address you will never know, protected by a memory manager whose decisions are opaque. The abstraction is convenient, but the abstraction is also a lie: the variable *is* somewhere, at some physical address, at some specific moment in time. The abstraction just hides this fact from you because the fact is not useful at the scales large-machine programmers work at.

Small machines make the fact useful again. They bring the programmer into direct contact with the material of computing — the memory, the registers, the clock cycles, the bus bandwidth. And direct contact with the material is, in any craft, the precondition for mastery. A woodworker who has never touched wood cannot be a woodworker. A programmer who has never touched bytes cannot, I think, quite be a programmer in the full old sense. She can be a very effective modern programmer, and that is a real skill, and I am not diminishing it. But something is absent — a kind of knowledge that comes only from having held the machine in your hand.

AI agents offer a strange echo of small-machine programming. The context window is small in a way that modern memory is not — it is a finite, countable, bounded resource, and every token in it is present to the engineer's awareness. When you are designing for a tight context budget, you are back in contact with the material. You feel the weight of each token. You notice what you cannot afford to say. You prune, you summarize, you choose words carefully, because the machine is small again. The small-machine feeling has returned, wearing unfamiliar clothes.

And with the small-machine feeling has come the old pleasure of making a small machine do something unreasonable. The Amiga demoscene of the late 1980s pushed 7 MHz Motorolas to produce real-time 3D effects that should have been impossible on the hardware. The demosceners did it by knowing the machine so deeply that they could exploit undocumented behaviors, interleave operations across the custom chips, and coax more work out of each cycle than the designers had imagined possible. Similar work is happening today with AI agents: engineers pushing small context windows to produce results that should not be possible at their token counts, by knowing the models so deeply that they can exploit behaviors the model's creators did not anticipate. The tradition of the demoscene has found a new home. The heroes are different but the pleasure is the same.

### 24. The Forcing Function Insight

The deepest insight of the punch card era — the one that generalizes beyond computing into almost any domain of craft — is this: *real constraints produce real craft*. Not arbitrary constraints. Not constraints invented to teach discipline. *Real* constraints, imposed by physics or economics or biology, constraints that will punish you if you ignore them, constraints that cannot be wished away.

If you want your programmers to be thoughtful, constrain them. If you want your AI agents to be efficient, budget them. If you want your designs to be elegant, limit the canvas. If you want your organization to ship real work, force it to ship within real limits.

The opposite is also true. If you want sloppy work, remove the constraints. If you want bloat, give unlimited budgets. If you want thrashing, eliminate the cost of trying. Relaxation of constraints does not produce better work by giving the worker more room to maneuver; it produces worse work by removing the pressure that made the maneuver necessary in the first place.

This is deeply counterintuitive in a culture that has, for fifty years, equated abundance with progress. More compute is better. More memory is better. More storage is better. Faster networks are better. Cheaper cloud is better. And in some sense all of these are true — they enable problems that were previously unsolvable. But they also dissolve the craft that earlier generations built under scarcity, and the dissolution is slow enough that nobody notices it happening, until one day you realize that the programmers who grew up under abundance cannot do things that the programmers who grew up under scarcity could do in their sleep.

The forcing function insight suggests a counterintuitive strategy for engineering managers: *deliberately impose constraints that the infrastructure would let you ignore*. Budget tokens even when budgets aren't enforced. Constrain context even when windows are large. Require design documents before code even when prototyping is free. These artificial constraints simulate the scarcity that the infrastructure removed, and they produce, in the team that honors them, the kind of craft that abundance erodes.

### 25. The Iterative Refinement Engine

Let me state the fundamental rhythm of engineering as plainly as I can.

*Design. Build. Run. Examine. Improve.*

Five steps, in order, repeated. Every engineering tradition — from punch card programming to modern AI agent orchestration — uses some version of this loop. The steps may be compressed (the REPL compresses them into seconds), or expanded (aerospace engineering expands them into months), but the steps are always there.

What varies across traditions is not the steps. It is the *time between steps* and the *deliberation within each step*.

- **Punch card programming**: steps take hours; deliberation is high; iterations are few; total progress per day is modest but cumulative; errors are caught at each step; the loop compounds learning.
- **REPL programming**: steps take seconds; deliberation is low; iterations are many; total progress per day is high in the short run; errors may be masked by fast retries; the loop does not compound learning.
- **AI agent orchestration**: steps take minutes; deliberation must be moderate; iterations are bounded by budget; total progress per dollar is the key metric; errors cost money; the loop compounds or does not depending on whether the engineer designs it to.

The engineering discipline that respects the loop wins, regardless of the time scale. The engineering discipline that skips steps — especially design and examine — loses, regardless of the time scale.

The punch card era enforced respect for the loop by economic necessity. The REPL era made it optional and most programmers opted out. The AI era is re-enforcing respect for the loop because skipping the steps is, once again, too expensive to afford.

This is why AI agent orchestration is not a regression. It is a return to a rhythm that was never wrong, only temporarily relaxed by cheap compute.

### 26. The Human in the Loop

The punch card workflow had humans at every step of the process. The programmer wrote the code. The keypunch operator transcribed it. The window clerk logged it. The operator ran the deck. The printer printed the output. The mail room delivered it. Each of these humans was a checkpoint, a potential catcher of errors, a point at which the system could pause and ask *wait, does this look right?*

Modern automation has removed most of these humans. The code goes from the programmer's editor directly to the production environment in seconds, untouched by human hands after the initial keystroke. This is great for speed. It is terrible for error-catching, because the humans were doing more than their job descriptions said they were. They were serving as redundancy, as sanity checks, as carriers of tacit knowledge that the automation does not have and cannot have.

AI agent orchestration is re-introducing humans in the loop, but deliberately and at specific checkpoints. A well-designed agent workflow might include:

- Human review of the agent's plan before execution begins.
- Human approval of significant actions (deleting files, merging pull requests, running destructive commands).
- Human verification of the agent's output before it enters production.
- Human escalation paths when the agent is uncertain.

These checkpoints are not nostalgia. They are not a fear of automation. They are a recognition that the agent, like the punch card programmer's deck, is a thing that produces output that humans have to live with, and that putting humans at the right points in the loop produces better outcomes than removing them.

There is a version of this argument that sounds anti-progress, and I want to be clear it isn't. The point is not that humans should do the work the agents can do. The point is that humans should do the work the agents *cannot* do, which is to say: the thinking, the judging, the reviewing, the catching of subtle errors, the maintaining of context across weeks and months, the holding of values that the agent does not hold. The agents are the keypunch operators and the machine room crew. The humans are the programmers. Each is necessary. Neither replaces the other.

The punch card era understood this division of labor viscerally, because the division was made of physical flesh and steel. The modern era has to understand it deliberately, because the division is invisible unless you draw it.

#### The Debugger Paradox

There is a specific phenomenon in modern software engineering that is worth naming, because it is a pure symptom of the cost-model inversion I described earlier. I call it the *debugger paradox*.

Here is the paradox. Modern debuggers are remarkable tools. They let you set breakpoints, inspect variable state, step through execution line by line, modify values on the fly, and generally observe the internal workings of a running program with a level of detail that would have been unimaginable to a punch card programmer. By any reasonable measure, debuggers should have made programmers more productive at finding bugs. And yet, empirically, the time spent debugging per line of code has *gone up* since the introduction of debuggers, not down. How is this possible?

The answer is that debuggers reduce the cost of each debugging session, and reducing the cost of each debugging session changes the behavior upstream. When debugging is expensive (punch card era), programmers invest heavily in not introducing bugs in the first place. When debugging is cheap (modern era), programmers invest less in not introducing bugs, because they know they can always debug later. The result is more bugs per line of code, each bug easier to find, and a net increase in total debugging time.

This is not speculation. It has been observed repeatedly in empirical software engineering studies, and it matches the lived experience of anyone who has worked in both eras. The debugger is a useful tool *once the bug exists*, but its existence shifts the cost-benefit equation of prevention, and the shift is not offset by the tool's usefulness.

The punch card era had no debuggers in the modern sense. It had core dumps — printouts of the entire machine state at the moment of the crash — which were notoriously hard to read but forced the programmer to think about what the machine was doing at a very low level. The experience of reading a core dump was unpleasant enough that programmers did everything they could to avoid it, and "everything they could" included writing code that did not crash, which turned out to be the most productive use of their time.

AI agent engineering currently has something like core dumps: the full conversation history of a failed agent run, which you can read to see exactly what the agent tried and where it went wrong. Reading these transcripts is, like reading a core dump, unpleasant but instructive. Engineers who read their failed transcripts learn to prevent the failures upstream. Engineers who ignore the transcripts — who just "try again with a different prompt" — never develop the prevention skill, and their token budgets keep getting eaten by the same failures in slightly different disguises.

The lesson is the same as it was in 1965: *the unpleasantness of the failure is the teacher*. Making the failure pleasant does not help the student learn. It just makes the student comfortable with failing. And over a career, comfort with failure is not a neutral trait. It is a degradation of the craft.

### 27. The GSD-OS Vision

This document is being written as part of a larger project to build what might be called an operating system for AI agents. The project is called GSD-OS — Get Shit Done OS — and its design is deeply informed by the arguments in this document.

The central design principle is the Amiga principle: constraints are real, designs are deliberate, iterations are deliberate, and the result is software that does more with less. Token budgets are honored as first-class resources. Context is managed as core memory was managed on the Apollo Guidance Computer. Plans precede execution. Verification precedes integration. Humans gate significant actions. The loop is respected.

What does this look like in practice?

- **Phase-based development**: work is decomposed into phases, each of which has a plan, a budget, a success criterion, and a verification step. No phase begins until its predecessor is verified. No phase proceeds beyond its budget without escalation.
- **Explicit context management**: the agent's working context is pruned between phases. Only the summary of prior phases is carried forward. The full history is archived for audit, not loaded for reasoning.
- **Atomic commits**: every significant change is a single commit with a single purpose. The git history reads like a coding pad — one deliberate step after another, reversible, bisectable, comprehensible.
- **Verifiability**: every output has a way to be checked. Every claim is grounded in evidence. The agent cannot ship work without a verification step that confirms it did what it was supposed to do.
- **Human gates**: at phase boundaries, at milestone transitions, at significant decisions, a human reviews and approves. The human is not in the way; the human is the final safety check.

This is not a new idea. The IBM 360 computing centers of 1965 had versions of every one of these practices, and they had them because the economics made them necessary, and they lost them when the economics changed, and we are rebuilding them now because the economics have changed back.

The GSD-OS vision is, in the end, the punch card vision, implemented in LLMs and shell scripts instead of card readers and line printers. It is the same rhythm in a new medium. It is the old craft under new names. And it works, because the principles it is built on are not arbitrary preferences but adaptations to real constraints — and the real constraints, as we have seen, are back.

#### The Chipset Metaphor

One design metaphor inside GSD-OS that deserves elaboration is the *chipset*. The name is deliberate, and it comes — unsurprisingly, given everything else in this document — from the Amiga. The Amiga's original chipset (Denise, Agnus, Paula) was a collection of specialized co-processors, each with a defined job, each with a small and well-understood interface, each cooperating with the others through shared memory and carefully-orchestrated DMA cycles. The chipset was the machine's personality. Change the chipset and you had a different machine.

GSD-OS treats agent subsystems as chipsets in exactly this sense. There is a chipset for research (how to gather information from the web and the codebase efficiently). There is a chipset for planning (how to decompose a task into verifiable steps). There is a chipset for execution (how to make changes to a codebase under supervision). There is a chipset for verification (how to confirm that a change did what it was supposed to do). Each chipset has a defined interface, a defined budget, and a defined role. The chipsets compose to form a working agent the way Denise, Agnus, and Paula compose to form an Amiga.

The reason to organize this way is not aesthetic. It is the same reason the Amiga used custom chips: *specialization enables efficiency under constraint*. A general-purpose agent trying to do research, planning, and execution all in one undifferentiated prompt will waste context switching between modes. A chipset-based agent keeps each mode in its own context window, calls the right chipset for each phase of work, and composes the results. The total token cost is lower. The total quality is higher. The system is easier to debug, because if the research chipset produces bad output you know exactly where to look.

This is, once again, a direct transplant from the Amiga philosophy. And once again, it was built under the pressure of real constraints — token budgets, context limits, cost per agent invocation — that forced a design the relaxed-constraint alternative would not have arrived at. The pressure is the teacher. The teacher is back.

#### The Phase Boundary

A specific GSD-OS primitive that embodies the philosophy is the *phase boundary*. A phase is a unit of work: scoped, budgeted, verifiable. A phase boundary is the moment between phases, when one is done and the next is about to begin. At a phase boundary, the following things happen:

1. The current phase's work is verified against its success criteria.
2. The current phase's artifacts (code, documents, test results) are committed to source control.
3. The current phase's context — the accumulated working state of the agent — is summarized.
4. The summary is carried forward to the next phase. The full context is discarded.
5. The next phase begins with a clean working state and only the summary of its predecessor.

This is memory management. It is exactly what the Amiga did when it swapped out a task's context, or what the IBM 360 did when it rolled a batch job to tape to make room for the next one. The only difference is that the memory in question is the agent's context window, and the swap is from verbose working state to compressed summary, and the operator is a human reviewer who approves the transition.

Phase boundaries are painful to implement. They require the engineer to define what "done" means for each phase, which is harder than it sounds. They require careful thinking about what to carry forward and what to discard, which is also harder than it sounds. They require humans to review and approve, which adds latency. They require the whole workflow to be structured around discrete checkpoints rather than continuous flow, which feels un-modern in a culture that has celebrated continuous delivery for a decade.

But phase boundaries are what make long-running agent work possible. Without them, the agent drowns in its own history, runs out of context, and fails. With them, the agent can work on projects that span days and weeks, because each day's work starts fresh, carries only the essentials forward, and avoids the accumulation of noise that would otherwise kill it.

The punch card programmer had phase boundaries too. They were called *job boundaries*. Each submission was a phase. Each printout was a checkpoint. Each decision about what to change next was a summary of what had been learned. The boundary was enforced by the economics of submission. The agent engineer has to enforce the boundary by discipline, because the infrastructure does not enforce it by default. The principle is the same; the enforcement mechanism is different.

#### Artifacts Over Conversations

One last GSD-OS principle deserves mention, because it is the one most directly inherited from the old culture: *artifacts over conversations*. The unit of engineering memory is the artifact — a document, a commit, a test, a log — not the conversation. Conversations are ephemeral. Artifacts persist.

In a well-run punch card shop, every conversation between programmer and machine was mediated by an artifact. The deck was an artifact. The printout was an artifact. The design document was an artifact. The error log in the margin of the printout was an artifact. Nothing important was verbal. If it wasn't written down, it didn't happen.

The modern culture has slipped a long way from this. Engineering decisions are made in Slack threads that are searched only once and then buried under the next day's threads. Design conversations happen in video calls that are neither recorded nor transcribed. "Tribal knowledge" accumulates in the heads of senior engineers and evaporates when they leave. The artifacts — the files checked into git, the docs in the wiki — are a thin and often misleading summary of the real state of the project.

GSD-OS pushes back against this by treating artifacts as primary. Every phase produces artifacts. Every decision is captured in a document. Every change is a commit with a clear message explaining *why*. The conversation is allowed, encouraged, even necessary — but the conversation is not the output. The output is what you can point to afterward and say *this is what we built*. If you cannot point to it, you did not build it. If you can only describe it in a video call, you are building on sand.

This is, once again, the punch card discipline. The deck was what you could point to. The printout was what you could point to. Everything else was ephemera. And ephemera, in an engineering culture, is a liability — because ephemera cannot be reviewed, cannot be audited, cannot be transferred, cannot outlive its original context. Only artifacts can.

---

#### Addendum: A Short Catalog of Returning Disciplines

Before the closing meditation, I want to make a compact list of the specific disciplines from the punch card era that are returning under new names in AI agent engineering. The list is not exhaustive, but it captures the major patterns, and it may be useful to an engineer who wants to go back to the old manuals to learn from their ancestors.

1. **Desk-checking** is returning as *prompt review*. Before you submit a prompt to an agent, you read it carefully, check its assumptions, verify that its instructions are unambiguous, and trace what the agent will likely do in response. The practice is the same. The artifact is different.

2. **Incremental development** is returning as *phased execution*. You do not ask the agent to do the whole task in one shot. You decompose the task into phases, each with a verification step, and you run the phases in sequence. The practice is the same. The unit of increment is different.

3. **Hello World discipline** is returning as *capability verification*. Before you ask the agent to do real work, you ask it to do a trivial task to verify that the tool integration is working, the file paths are correct, and the model is responsive. The practice is the same. The trivial task is different.

4. **The load-and-go principle** is returning as *fast feedback tooling*. You build infrastructure that lets the agent get quick signals from the environment — linters, type checkers, unit tests — so that it can iterate within a single turn rather than requiring a full round trip. The practice is the same. The feedback mechanism is different.

5. **Do one thing** is returning as *tool decomposition*. Each tool the agent can call should do one thing well, with a clear interface and predictable behavior. Agents that have tools with overlapping or confused responsibilities produce worse results. The practice is the same. The composition mechanism is different.

6. **Trace tables** are returning as *chain-of-thought auditing*. You read the agent's reasoning trace to verify that it is tracking the state of the problem correctly, that it is not confabulating, that it is making progress. The practice is the same. The trace format is different.

7. **Modular design** is returning as *sub-agent architecture*. You split the work across multiple agents, each with a narrow scope, each with a well-defined interface to the others. This keeps each agent's context manageable and each agent's behavior auditable. The practice is the same. The module boundary is different.

8. **The reverence principle** is returning as *guardrails around working agents*. Once you have an agent workflow that works, you change it carefully, because the behavior of the LLM can shift unpredictably with small prompt changes. The practice is the same. The fragility is different.

9. **Comments explaining why** are returning as *prompt documentation*. You annotate your prompts with comments explaining the reasoning behind specific instructions, so that future engineers (or your future self) can understand why the prompt is shaped the way it is. The practice is the same. The commented object is different.

10. **Job boundaries** are returning as *phase checkpoints*. Between phases, you commit, summarize, and reset the context. This is the punch card workflow of "submit, wait, read output, improve" applied to AI agents. The practice is the same. The checkpoint mechanism is different.

All ten of these are in the literature of 1965-1985. All ten of them have been forgotten by most of the industry. All ten of them are being rediscovered, piecemeal and without historical awareness, by AI agent engineers in 2024-2026. The rediscovery is happening because the constraints are back, and the constraints were what made the practices necessary in the first place.

The engineers who study the old literature get a head start on the rediscovery. They do not have to derive everything from first principles. They can read Ed Yourdon and Edsger Dijkstra and Fred Brooks and Peter Naur and Grace Hopper and walk away with a ready-made vocabulary for the problems they are facing. The vocabulary is fifty years old. The problems are one year old. The match is eerie. And the engineers who make the match are the ones who are shipping the best agent systems of our era.

---

## Closing Meditation: The Loop Is Eternal

I began this document with a student in a linoleum hallway at the University of Michigan in 1965, carrying a deck of cards that represented three weeks of thinking. I want to end with a different image.

It is 2026. An engineer is sitting at a desk in front of three monitors. On the left monitor is a plan: a sequence of phases, each with a scope and a budget, written in markdown, reviewed by a colleague, committed to a planning directory. On the middle monitor is a code editor, showing the files that the current phase will touch. On the right monitor is a terminal, in which an AI agent is executing the phase according to the plan. The agent is reading files, making changes, running tests, reporting progress. It will finish in about twenty minutes. The engineer is not watching every keystroke. She is watching the progress indicators, waiting for the verification step, ready to intervene if something goes off track. In the meantime, she is reading a paper on her tablet.

The engineer and the 1965 student look completely different. They are sixty-one years apart. They use machines the student could not have imagined. The student used cardboard; the engineer uses language models. The student waited for the operator; the engineer waits for the tool call. The student's program was measured in kilobytes; the engineer's context window is measured in tokens. Nothing about the surface of their work is the same.

But the *rhythm* is the same. Design before action. Budget before execution. Verify before integration. Iterate deliberately. Compound the learning. Respect the loop.

They are running the same algorithm on different hardware. The hardware is human brain plus machine, but the algorithm — the thing that makes the work good — is the algorithm of craft under constraint. It was ancient when the student used it in 1965, because it predated computing by centuries. It was obsolete when the REPL era dismissed it in 1985. It is back now because the economics of intelligence have made it necessary again.

I said earlier that the punch card algorithm predated computing by centuries, and I want to justify that claim before closing. The rhythm of *design, build, run, examine, improve* is not a software invention. It is a universal feature of skilled craft. A cabinetmaker building a chest of drawers does not begin by sawing wood. She begins by drawing plans, measuring the stock, calculating the joinery, imagining the finished piece, and walking through the whole construction mentally. Only then does she touch a tool to a board. And when she does touch a tool to a board, she proceeds deliberately, checks her work at every step, and never cuts twice where one cut would do.

A blacksmith hammering out a hinge does not swing at random. He heats the stock to the right temperature, which he judges by color. He places the stock on the anvil in a position he chose before the hammer came down. He strikes with a force and angle he determined before the stroke began. Between strokes, he examines the work, checks the line, reheats if necessary, and strikes again. Every stroke is deliberate. Every stroke costs him heat, and heat is fuel, and fuel is money, and the blacksmith who wastes heat wastes his own wages.

A bricklayer laying a wall does not pile bricks at random. She lays a course, checks the level, lays the next course, checks the level, corrects any drift before it can compound. A violin-maker carving a top plate does not hog out wood and hope. He carves thin, checks the thickness, carves a little more, checks again. A chef preparing a sauce tastes as she cooks, corrects as she goes, and tastes again before serving. Every skilled craft has this rhythm. It is a universal pattern of human work under real material constraints.

What computing forgot — and what punch cards briefly preserved, and what AI agent engineering is rediscovering — is that software is also a craft, and software also has real material constraints, even when the constraints are invisible. The constraints of memory, of time, of attention, of context, of money, of correctness. These are as real as the heat in the blacksmith's forge. They are just harder to see, because they don't glow red. When the constraints were made visible by punch card economics, programmers treated them with the respect all craftspeople give to their materials. When the constraints became invisible, programmers stopped seeing them, and sloppy work followed, as it always does when a craftsperson forgets what their material is actually capable of.

The AI agent has made the constraints visible again. The token counter is the new thermometer. The context window is the new anvil. The cost per call is the new fuel bill. And the engineer who sees these things and respects them is, at last, a craftsperson again — working in a strange new substrate, but in the old tradition, with the old disciplines, producing the old kind of quality for the first time in two generations.

---

## Epilogue: A Letter to the Next Generation

I want to close with a letter, addressed to whoever is reading this ten or twenty years from now, when the specific AI systems I am describing are historical curiosities and the new scarcities have taken forms I cannot yet imagine. The letter is short. It is also the only thing in this document that I am fully certain is true.

Dear future engineer,

The tools you are using today did not exist when this document was written. The constraints you are navigating today are probably not the ones I described. The vocabulary you use for your craft is probably different from mine, and the specific practices you have developed for managing your resources are probably unrecognizable to me.

That is fine. That is how it should be. The surface of the work changes constantly, and every generation has to adapt to the shape of its own era.

What I want you to know is that the underlying rhythm has not changed and will not change. There will always be a design phase, and there will always be an execution phase, and there will always be a verification phase, and there will always be an improvement phase, and these phases will always cost real resources, and the engineers who respect the phases and the resources will always produce better work than the engineers who don't.

Whenever someone tells you that the new tools have made the old disciplines obsolete, they are wrong. The new tools change *which* disciplines you need, and they change the vocabulary, but the *need* for discipline is permanent. Every generation of engineers has heard "we don't need that old stuff anymore," and every generation has had to rediscover, the hard way, that the old stuff was not arbitrary preferences — it was an adaptation to constraints that are still there, under the new abstractions, waiting to bite when the abstractions fail.

When you find yourself under a new kind of scarcity — and you will, because scarcity is permanent, it just changes shape — look backward. Find the last era that had a constraint like yours, and study what they did. Their vocabulary will be strange to you, but their solutions will be good ones, because they were selected by the same pressure you are facing now.

The punch card era solved many of the problems you are facing. The embedded systems community solved many of them. The aerospace community solved many of them. The pacemaker engineers solved many of them. They solved the problems without knowing that you would ever exist, and their solutions are still good, because the problems are permanent. Read their old manuals. Read their old papers. The language will be archaic but the logic will be exactly what you need.

And when you have learned from them, pass the learning on. The last thing the craft needs is another broken transmission. Name the people who taught you. Teach the people who come after you. Write down what you know, before it dies with you, because craft that is not written dies with the craftsperson, and every dead craft has to be rebuilt from scratch by the next generation, and the rebuilding is almost always incomplete.

That is all. The work is ancient. The work is good. Respect the constraints. Honor the loop. Do the craft.

Yours,
A punch card programmer writing in 2026, which is to say, a new kind of punch card programmer, using a new kind of card, under the same old sky.

---

The lesson is not *go back to the old ways*. The old ways were hard. The old ways were slow. The old ways left a lot of people out because the price of entry was too high. The old ways had things wrong that needed to change, and they were changed, and we are better for it in a thousand ways.

The lesson is this: *when abundance seduces you into sloppiness, remember that constraint is what made the original work possible*. Honor the constraint. Design before you act. Think before you submit. Read what comes back. Learn from it. Improve. The loop is eternal, even if the hardware changes, even if the century changes, even if the substrate goes from silicon to language and back again.

The punch card was never really about cards. The cards were a symbol for the underlying reality: that running a computation cost real resources, and that the only way to compute well was to honor the cost with care. The cards are gone. The computations are different. But the underlying reality is still there, because the underlying reality is not about cards. It is about the relationship between thought and action, between design and execution, between the cheap work of planning and the expensive work of realization, and the wisdom of investing heavily in the cheap side to save on the expensive one.

That wisdom is older than computing. It was old when the first stone was carved. It was old when the first sonnet was written. It was old when the first cathedral was designed. It will be old when we are building things we cannot yet imagine, on substrates we cannot yet name. It is older than cards and older than silicon and older than language models and older than whatever comes after them.

It is the wisdom of making your choices before the resources are spent, because the resources are always scarce in the end — and if they are not scarce in the moment, they will be scarce over a lifetime, and the craft that survives is the craft that treated every moment as if it were the only one.

The student in 1965 knew this because the machine forced her to know it.

The engineer in 2026 is relearning it because a new machine is forcing her to know it again.

And somewhere in between, for a brief strange interval of unearned abundance, we forgot.

Now we remember.

The loop is eternal. Honor it.

---

## Study Guide — Philosophy of Constrained Computing

### Why read this

Constraints create discipline, and discipline creates
craft. The punch-card era is one of the clearest case
studies in "less was more." This file is a meditation on
what we gain when the medium forces us to think before
we act.

## DIY — Impose a batch constraint for a day

Commit your code only at end-of-day. Plan your changes in
the morning on paper. Work without interactive debugging.
Observe what changes in your thinking.

## TRY — Write a program on paper first

Pick a 100-line program. Write it on paper. Then type it
in. Then run it. Count syntax errors. Then do it again in
your usual interactive style. Compare cognitive load.

## Related College Departments

- [**philosophy**](../../../.college/departments/philosophy/DEPARTMENT.md)

---

*End of meditation.*
