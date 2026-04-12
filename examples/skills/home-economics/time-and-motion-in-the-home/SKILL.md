---
name: time-and-motion-in-the-home
description: Applying motion study and time analysis to household work. Based directly on Lillian Gilbreth's *The Home-Maker and Her Job* and *Cheaper by the Dozen*, this skill covers the therblig-motion catalog, task decomposition, batch processing, parallelism, routine chart design, and the ergonomics of work surfaces. Use when diagnosing why a household is running out of time, designing a weekly routine, teaching task sharing to children, or reducing the friction of any repeated household task.
type: skill
category: home-economics
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/skills/home-economics/time-and-motion-in-the-home/SKILL.md
superseded_by: null
---
# Time and Motion in the Home

The household is the original production floor that Lillian Gilbreth studied. Motion study, the stopwatch, the routine chart, and the therblig catalog were not invented for factories alone — Gilbreth brought them into her own twelve-child household and wrote a series of books (*The Home-Maker and Her Job*, 1927; *Living With Our Children*, 1928; and *Management in the Home*, 1954) that applied scientific management to cooking, cleaning, and child care. This skill catalogs those tools in a form usable today: task decomposition, motion analysis, batch processing, parallelism, routine chart design, and ergonomics. The goal is not a Taylorized household but a household that does not waste the time it has.

**Agent affinity:** gilbreth (motion study founder, primary source), liebhardt (pedagogy of routines and habit formation), richards (systems frame for where the time goes)

**Concept IDs:** home-task-decomposition, home-routine-chart, home-batch-parallelism

## 1. The Therblig Catalog

Frank and Lillian Gilbreth broke every hand motion into eighteen fundamental elements they called *therbligs* (their name spelled backward, approximately). Eight are useful; ten are waste:

**Useful therbligs.**
- **Transport empty** — move the hand to pick something up
- **Grasp** — take hold
- **Transport loaded** — move the hand with something in it
- **Release load** — put down
- **Position** — align
- **Use** — actually do the task
- **Disassemble / Assemble** — take apart or put together
- **Inspect** — verify

**Waste therbligs.**
- **Search** — look for something
- **Find** — realize you found it (always preceded by Search)
- **Select** — choose among alternatives
- **Plan** — decide next step
- **Hold** — restrain
- **Rest for fatigue** — recover
- **Unavoidable delay** — wait for something else to finish
- **Avoidable delay** — idle
- **Preposition** — set up for next step

The first eight are the work; the last ten are what the work steps on. **Search** and **Find** are the biggest household wastes. If you spend thirty seconds looking for the garlic press every time you cook, you have added ninety minutes of search to your cooking week. Eliminating search is done by storage topology (see the household-systems-design skill): put the tool where the hand reaches for it, and Search/Find go to zero.

## 2. Task Decomposition

Before any time study, decompose the task into steps. A week of laundry is not a task; it is:

1. Collect dirty clothes from each room
2. Sort by color and fabric
3. Pre-treat stains
4. Load washer
5. Start washer
6. Transfer to dryer (or hang)
7. Start dryer
8. Remove and fold
9. Return to each room

Nine steps. A motion study measures each step separately, because most of the inefficiency lives between steps, not within them. Step 1 (collection) is dominated by walking; step 8 (folding) is dominated by the folding surface and lighting. Fixes target specific steps, not "laundry" as a monolith.

## 3. Batch Processing

Batch processing is doing the same step for many items before moving to the next step. A cook can chop all the vegetables for a week's stir-fries on Sunday, then assemble the meals on weeknights with five minutes of cooking. This trades setup time (get out the knife, the board, the containers) against repetition (chop many at once) and wins when setup cost is high relative to unit cost.

**When batching works.**
- High setup cost relative to per-item cost
- Items are similar enough that context-switching overhead is low
- Storage can preserve the intermediate state (prepped vegetables in the fridge for five days, not fifteen)
- The batch output has predictable downstream demand

**When batching fails.**
- Setup cost is low (quick tasks do not benefit from batching)
- Storage degrades the intermediate state (basil bruises within hours of chopping)
- Demand is unpredictable (you will throw out most of the batch)

**Household batch candidates.** Weekly vegetable prep, laundry by load type, monthly financial review, quarterly clothing rotation, annual pantry audit.

## 4. Parallelism

Parallelism is starting a task that runs without attention, then starting a second task that also runs without attention, so that wall-clock time compresses even though total work is unchanged. The classic example is starting the dishwasher, then starting the laundry, then starting dinner prep — all three run simultaneously because the first two are unattended.

**Parallel-friendly tasks.** Washer, dryer, dishwasher, oven, slow cooker, pressure cooker, bread machine, overnight soak, marinade, drying rack. Any task that continues after you initiate it and before you finish it.

**Parallel-hostile tasks.** Knife work, hand washing, driving, supervising a young child. Anything that requires your continuous attention.

**Dependency tracking.** The Gilbreth diagram for a household routine looks like a Gantt chart. Start every unattended task first, then begin attended tasks during the unattended windows. A household that starts the dishwasher after dinner is done is missing a window; a household that starts the dishwasher while the rice is cooking has a free machine-hour.

## 5. The Routine Chart

Gilbreth's routine chart — developed specifically for household use — is a time-indexed plan for a day or a week that names who does what, when. It is not a to-do list; it is a schedule with assignments.

**Ingredients of a routine chart.**
- A time axis (hour slots for a daily chart, day columns for a weekly chart)
- Rows for each household member (or each work zone)
- Cells filled with specific tasks
- A legend distinguishing routine (daily), weekly, monthly, and seasonal tasks
- A visible home (kitchen wall, fridge door) where every member can see it

**Worked example — a weekly cleaning chart.**

| Day | Task | Owner |
|---|---|---|
| Monday | Bathrooms | A |
| Tuesday | Vacuum common areas | B |
| Wednesday | Laundry start | A |
| Thursday | Laundry finish + fold | B |
| Friday | Kitchen deep clean | A |
| Saturday | Grocery + meal prep | B |
| Sunday | Bedrooms + rest | both |

The chart converts implicit labor into visible assignment. Implicit labor is the source of most household conflict: one person assumes they are doing more, the other assumes the same, and neither can see the actual division. The chart makes it legible.

## 6. Work Surface Ergonomics

Gilbreth's motion study included a strong ergonomic component. The height of a work surface, the reach radius, and the fatigue profile all affect how much work a person can do in a given time.

**Height rules.** Counter height should match the worker's elbow-to-floor measurement minus about 10 cm for heavy work (kneading dough, chopping) and minus about 5 cm for light work (assembling). A household with a 150 cm and a 185 cm worker needs either a compromise height (with a riser for the shorter worker or a step for heavy tasks) or two work zones.

**Reach radius.** The arc within which the hand can reach without leaning is roughly shoulder-to-fingertip. Tools used often should be inside this arc; tools used rarely can be outside. If you lean to reach a knife every time you cook, you are spending on the order of a hundred leans a week on a single tool placement error.

**Fatigue profile.** Standing for an hour is harder than standing for ten minutes six times; the fatigue accumulates nonlinearly. Long tasks benefit from stool breaks and changes of posture. Cooks who stand for their whole prep sit more at the end of the day; cooks who alternate last longer at both.

## 7. Time Estimation and the Hofstadter Discipline

Households routinely underestimate how long tasks take. Hofstadter's Law — "it always takes longer than you expect, even when you take into account Hofstadter's Law" — applies to household work as much as software. The mitigation is:

1. **Measure actual times for recurring tasks.** A week of logging what each task takes.
2. **Add a buffer factor.** New tasks: multiply estimate by 2. Familiar tasks: multiply by 1.3.
3. **Plan from measured times, not wished times.** The schedule is a contract with the actual household, not with an idealized one.
4. **Retro after each cycle.** What took longer than expected? What was wrong with the estimate? Adjust next cycle's plan.

## 8. Teaching Children to Share Work

One of Gilbreth's core contributions (as a mother of twelve) was that household work can be decomposed and taught. Children can do many tasks if the task is sized for their capacity and the expectation is calibrated. The pedagogy:

- **Start small.** A three-year-old can put shoes in a basket. A five-year-old can set a table. A seven-year-old can fold simple laundry.
- **Show the motion explicitly.** Do the task alongside the child; verbalize the steps.
- **Name the waste therbligs you are eliminating.** "We keep the shoes here so we don't have to search for them."
- **Retrospect kindly.** "That was hard — what would make it easier next time?"
- **Rotate tasks.** Do not assign permanent ownership; rotate so everyone learns every task.
- **Do not grade the output.** The child's fold is not as tight as an adult's. It is good enough, and criticism wrecks the willingness to do the task at all.

## 9. The Gilbreth Family Case Study

In *Cheaper by the Dozen*, Frank and Ernestine Gilbreth describe how their parents applied motion study at home. Process charts hung in bathrooms so that the children could practice efficient tooth brushing. The children had assigned rotating tasks. Meal prep was a Gantt chart on the wall. This was caricatured later as obsessive, but the underlying insight was sound: a household of fourteen people (twelve children, two parents) cannot function on improvisation alone, and the tools of motion study scale from factory to home without modification.

The cautions, acknowledged even by the Gilbreths: efficiency is a means, not an end; the household also serves rest, play, and connection; over-optimization can drive out the slack time that makes family life livable. The routine chart is a tool; the purpose is still a good life, not a productive one.

## 10. Common Failure Patterns

| Pattern | Cause | Fix |
|---|---|---|
| "We're always rushing in the morning" | No routine chart; each morning is improvised | Build and post a 60-minute morning chart |
| "Laundry takes forever" | Sequential instead of parallel | Start the washer first, do other tasks during the run |
| "I can never find the tool I need" | Search therbligs dominate | Storage topology, tools at point of use |
| "The kids don't help" | Never taught, or tasks too big | Age-appropriate tasks, explicit teaching, rotation |
| "Every cleanup is a fight about who should do it" | Implicit labor, no chart | Post the chart, make assignments visible |
| "I'm exhausted but nothing looks different" | Waste therbligs unmeasured, Hold and Rest hidden | One week of task logging reveals the hidden time sinks |

## 11. Cross-References

- **gilbreth agent** — Primary source of motion study and household application
- **liebhardt agent** — Pedagogy of routines, habit formation, teaching children
- **richards agent** — Systems framing that connects motion study to household engineering
- **household-systems-design skill** — Storage topology eliminates search therbligs
- **household-economics-and-budgeting skill** — Time is the other currency of the household
- **sustainable-household-pedagogy skill** — Teaching these routines as a durable practice

## 12. References

- Gilbreth, L. M. (1927). *The Home-Maker and Her Job*. D. Appleton.
- Gilbreth, L. M. (1954). *Management in the Home*. Dodd, Mead.
- Gilbreth, F. B., Jr., & Carey, E. G. (1948). *Cheaper by the Dozen*. Thomas Y. Crowell.
- Gilbreth, F. B., & Gilbreth, L. M. (1916). *Fatigue Study*. Sturgis & Walton.
- Barnes, R. M. (1980). *Motion and Time Study: Design and Measurement of Work* (7th ed.). Wiley.
