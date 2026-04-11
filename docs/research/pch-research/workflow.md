# The Programmer's Workflow in the Punch Card Era

## The Design-Code-Build-Run-Examine-Improve Loop Under Hard Constraints

*A PNW Research Series deep dive into how software was actually made
between 1955 and 1975, when every iteration had a dollar sign attached
and every mistake was measured in hours of wall-clock time.*

---

## Prologue: What This Document Is

This is not a nostalgia piece. It is a reconstruction of a workflow that
shaped how an entire generation of engineers thought about software. The
punch card era — roughly from the first commercial FORTRAN release in
1957 to the widespread arrival of interactive terminals in the mid
1970s — was the formative period for modern programming practice. Every
discipline we currently associate with "senior engineering" — designing
before coding, desk-checking, reading stack traces carefully, keeping
changes minimal, never touching code you do not understand — was forged
in this period because economics made anything else impossible.

The workflow looked like this:

1. **Design.** Hours at a desk with paper.
2. **Code.** Careful pencil writing on coding sheets, one statement per
   line, columns counted.
3. **Build.** Keypunching the coding sheet into physical cards.
4. **Run.** Submitting the deck, waiting, receiving a printout.
5. **Examine.** Reading the printout line by line, marginal notes in
   pencil.
6. **Improve.** The smallest possible change, punched into replacement
   cards, resubmitted.

Every single step in that loop had friction measured in minutes or
hours. The total cycle time for one iteration was usually an entire day.
Sometimes more. If you worked at a university, an overnight turnaround
was considered fast. If you worked at IBM itself, you might get four or
five iterations in a day if you were lucky and your deck was short.

This document describes what that felt like, what it cost, and — most
importantly — what it taught.

---

## 1. A Day in the Life: IBM Poughkeepsie, 1965

Picture a programmer named David. He works at IBM in Poughkeepsie, New
York. He is 28. He has been programming for four years, which makes him
one of the more experienced people on his floor. He works on a System/360
Model 40, which was announced in April 1964 and is by 1965 the workhorse
of IBM's middle-range offerings. David writes FORTRAN IV for scientific
customers and COBOL for commercial ones, and on a good day he will also
write some System/360 assembler.

### 9:00 AM — The Desk

David arrives at his desk at a quarter to nine. He sharpens two pencils,
lays out a fresh pad of coding sheets, and opens his notebook to the
page where he left off yesterday. The page is dense with handwritten
notes: a flowchart sketched in the margins, a list of variable names
with their meanings, and a list of test cases with expected outputs.

He does not turn on a computer. There is no computer at his desk. The
machine is on the other side of the building, behind a glass wall,
operated by men in white short-sleeved shirts and narrow ties. David
will not touch it today. He will not touch it most days.

The coding sheet is a pre-printed form. For FORTRAN, it has 80 columns
across, numbered along the top, with special markings at columns 1–5
(statement number), column 6 (continuation), columns 7–72 (statement
body), and columns 73–80 (sequence number). For COBOL, the layout is
different: columns 1–6 for sequence, column 7 for comment/continuation,
columns 8–11 for Area A (division, section, paragraph names), columns
12–72 for Area B (statements), and 73–80 for program identification.

David writes in pencil because he will erase. He writes in all capital
letters because the keypunches will punch capital letters and mixing
cases on the coding sheet is a recipe for confusion. He writes one
statement per line. If a statement is too long for one line, he marks
column 6 on the continuation line — usually with a digit or a plus sign
— and continues.

He has a subroutine to write. It is a utility that takes a date in
Julian day format and converts it to Gregorian month, day, and year. It
is the kind of thing that in 2025 takes thirty seconds and a library
call. In 1965, there is no library call. David must write it himself.
He has written similar things before. He has a mental template. But he
is careful because every mistake will cost him at least half a day.

### 9:30 AM — The Design

Before he writes any code, he sketches the logic on scratch paper. He
is going to use Zeller's congruence, but he wants to make sure his
arithmetic is right. He works three test cases by hand: January 1,
1900; December 31, 1999; and his own birthday. He gets the right answer
each time. He writes the test cases into his notebook so he can verify
the program output against them when the run comes back.

He sketches a flowchart. The flowchart uses the standard IBM template,
which he keeps in a plastic sleeve in his desk drawer. Rectangles for
process, diamonds for decision, parallelograms for input/output, small
circles for connectors. He draws the flowchart in pencil. He erases
twice. By the time he is satisfied, it is almost ten o'clock.

### 10:00 AM — The Code

Now he writes the code. He opens a fresh coding sheet. He starts with
the subroutine header:

```
      SUBROUTINE JULGRE(JDAY, IYEAR, IMONTH, IDAY)
```

The six spaces at the beginning are not decoration. In fixed-form
FORTRAN, columns 1–5 are reserved for statement numbers and column 6 is
the continuation indicator. Code begins in column 7. If you forget the
leading spaces, the compiler will reject your card. David does not
forget. He counted the columns once in 1961 and has not forgotten since.

He writes for about ninety minutes. The subroutine is about forty lines.
He uses DO loops, IF statements, and computed GO TOs (the IV standard
allowed ASSIGN and computed GO TO, though the latter was already
considered unfashionable by 1965). He uses meaningful variable names
within the FORTRAN IV limit of six characters: NDAYS, NLEAP, IYRFIX.
Short names were not laziness; they were the language constraint.

When he finishes the first draft, he desk-checks it. He reads every
line. He traces the logic with his pencil moving down the page. He
catches one mistake: a DO loop that should go to 365 goes only to 364.
He erases and corrects. He traces again. He finds a second mistake: a
variable that should be initialized before the loop is initialized
inside it. He erases, moves the statement, and traces once more. This
time the trace matches his expected output. He puts a small checkmark
next to each line.

It is 11:45 AM. His coding sheet is covered with pencil strokes,
eraser smudges, and little checkmarks. The subroutine is forty-three
lines. He numbers each line in the sequence columns (73–80), starting
at 00010 and incrementing by 10. The gaps are deliberate: if he needs
to insert a card later, he can give it a number like 00015 and it will
still sort correctly.

### Noon — The Walk

At noon, David walks his coding sheet to the keypunch room. The keypunch
room is on the second floor. It is a long rectangular room with twelve
IBM 029 Card Punches arranged in two rows of six. Each punch has its
own small desk, its own reading station, and its own reject bin. The
room smells faintly of machine oil and the warm electric smell of
vacuum-tube-era hardware kept on all day. Every machine is running; the
rhythmic clack of punches fills the air.

Eleven of the twelve operators are women. This was the norm in 1965.
Keypunch work was classified as clerical in most shops, and the
clerical workforce was overwhelmingly female. The operators wore their
hair pinned back and their nails short because the keypunches were
unforgiving of snags. They were fast — a skilled operator could punch
eighty columns in ten seconds or less, tracking their speed in KPH
(keystrokes per hour), with 8,000–12,000 KPH being a good professional
rate.

David does not hand his sheet to an operator. He punches his own cards.
This was a choice. At IBM, programmers who wanted faster turnaround
often punched their own, because handing a sheet to a keypunch operator
meant waiting in a queue. The operators had their own work schedule
and their own backlog. If David's subroutine was short and
non-urgent, it might wait an hour or two before an operator got to it.
If he punched it himself, he could walk the deck to the submission
window within twenty minutes.

There is also a craftsman's pride in punching your own cards. A
programmer who could not keypunch was considered incomplete.

### 12:15 PM — The Punch

David sits at an empty 029. He loads a hopper of blank cards. He
positions his coding sheet on the reading station, which has a clip to
hold it flat and a sliding marker to track which line he is on.

He begins typing. The 029 has a keyboard that looks superficially like
a typewriter but is not one. Each keystroke punches a column of the
current card. As he types, the card advances one column to the right
under the punching station. Above the punching station, a small print
mechanism interprets each column and prints the corresponding character
along the top edge of the card. This is how you can read what a card
says without a card reader: the print is small, eight characters per
inch, running along the top.

The mechanical sound is part of the experience. Each keystroke is a
soft thunk as the punch die drives through the card. At the end of a
card — column 80 — the machine automatically ejects the finished card
into the stacker and draws a fresh blank from the hopper. The ejected
card falls with a distinctive clatter.

David types carefully. He is watching his coding sheet, watching the
column indicator on the 029, and watching for typos. He hits the WRONG
key once — an O where a zero should be. He stops. He cannot fix this
card. The hole is already punched. He pulls the card out of the machine,
tosses it into the reject bin next to his seat, and starts that line
again.

There is another way to handle typos: the duplicate function. The 029
had a duplicate key that could copy a card column by column while you
watched. If you caught a typo, you could put the bad card in the
reading station, start a fresh card in the punch station, hit DUP to
copy up to the error point, then type the correction, then hit DUP
again to copy the rest. This was faster than retyping an entire line
but required enough presence of mind to engage the feature before you
ruined the rhythm.

By 1:30 PM, David has punched forty-three cards. Each one bears one
statement of his subroutine. He has also punched a header card with
his name, the subroutine name, and the date, and a separator card that
the operator will use to identify where his job ends.

He wraps the deck with a rubber band. The rubber band is important.
A dropped deck is a disaster. If the cards hit the floor in a random
scatter, the sequence numbers in columns 73–80 are the only thing that
lets you reconstruct the order. Many programmers told stories about
colleagues who had dropped unnumbered decks and lost an entire day
re-sorting them by hand, reading each card individually. David always
numbers his decks. He has the IBM story memorized: the junior
programmer who did not number his, and the senior who stood silently
while he sorted.

### 1:45 PM — The Submission

David walks his deck to the submission window. The window is a literal
window: a slab of Plexiglass set into the wall separating the user
area from the machine room. Behind the window sits a dispatcher, a
man with a clipboard and a rubber stamp. David slides his deck through
the gap at the bottom of the window.

The dispatcher asks: "Priority?"

David answers: "Standard." Priority cost more, and his subroutine is
not urgent. Standard means overnight. Priority might get him results
the same day, maybe by late afternoon, but it also meant the job got
charged at a higher rate and required a manager's account code.

The dispatcher stamps a job number on a carbon-copy slip and hands the
top copy back to David. The job number is David's receipt. If anything
goes wrong — if the deck is lost, if the printout is illegible — this
slip is the only proof he submitted anything.

David writes the job number in his notebook next to the date and the
name of the subroutine. He also writes a one-line description of what
the job is supposed to do. This is another discipline born of
necessity: if he gets back a confusing printout tomorrow, he wants to
know what he was trying to test.

He walks back to his desk. It is 2:00 PM. His work on this subroutine
is done for the day. He cannot run it again until tomorrow. He picks
up a different project, a customer inquiry about a COBOL report
program, and begins working on that while he waits.

### The Next Morning — The Printout

At 8:45 AM the next day, David walks to the output bins. The output
bins are a wall of wooden cubbies, each labeled with a letter of the
alphabet, near the submission window. His printout will be in the D
cubby or in the numeric range that contains his job number, depending
on how the shop sorts.

He finds a fan-folded printout on green-bar paper, rubber-banded to his
original deck. The green-bar is standard: light-green horizontal
stripes alternating with white, 132 columns wide, perforated between
pages so you can tear it flat or read it fan-folded. The print is
impact-printed by a chain or drum printer at roughly 1,100 lines per
minute, loud enough that the printer room has a separate door.

He takes the bundle to his desk. He unfolds the printout carefully and
reads from the top.

The top of the printout is the job log: a header showing the job
number, the date and time, the CPU time used, the resources consumed,
and the exit status. His job took 0.42 seconds of CPU time. That is
what he paid for.

Below the job log is the source listing. The compiler has echoed every
line of his source back to him with line numbers in the left margin.
If there were compile errors, they appear inline, interleaved with the
source, each one marked with a severity level and an error code.

There are three compile warnings and one error. The error is a typo:
on line 00170, he wrote `IMONHT` instead of `IMONTH`. The compiler
flagged it as an undefined symbol. The warnings are all about implicit
type conversions he could have avoided with more careful declarations.

David sighs. One character. One misplaced H. A full day of turnaround
lost.

He circles the error on the printout with a red pencil. He writes in
the margin: "fix 00170 IMONHT → IMONTH." Then he takes the original
deck, removes the rubber band, finds card 00170, and sets it aside.
He walks back to the keypunch room. He punches a replacement card with
the corrected spelling. He reassembles the deck, with the new card in
the right place. He rubber-bands it again. He walks back to the
submission window and resubmits.

It is 9:15 AM. His next result will be tomorrow morning. Today, David
will work on something else again.

---

## 2. The Keypunch Room: The Physical Layer

The keypunch room deserves its own section because it is where the
abstract labor of programming met the physical substrate of computing.
The cards were real. The machines were loud. The work was tiring in a
way that modern keyboarding is not: the 029's keys required more
force, the machine vibrated under your hands, and the rhythm of
column-by-column advancement trained your muscles into a different
cadence than a smooth-scrolling screen.

### The IBM 029 Card Punch

The IBM 029 was announced in 1964 as a replacement for the 026 (which
dated to 1949). It became the dominant punch of the System/360 era and
remained in use well into the 1980s in some shops. It used the
Extended Binary Coded Decimal Interchange Code (EBCDIC) character set
rather than the older BCD that the 026 used, which matched System/360's
native encoding.

Physically, the 029 was a desk-sized machine with several distinct
zones:

- **The hopper**, on the right, held a stack of blank cards, typically
  500 to 2,000. Cards were drawn from the hopper one at a time and
  registered against a set of pins that ensured exact column alignment.
- **The punching station**, center, was where keystrokes became holes.
  Under the station, twelve vertical punches — one for each row in an
  80-column card — drove through the card in response to keystrokes.
- **The reading station**, to the left of the punching station, could
  optically read an already-punched card. This was used for duplication:
  a master card could be read while a new card was being punched in
  parallel, allowing you to copy and modify.
- **The print mechanism**, above the punching station, was a small
  typewriter-style print head that inked the interpreted character at
  the top edge of each column. Without print, a punched card was
  machine-readable but essentially unreadable by humans. With print, a
  skilled programmer could read a card at a glance.
- **The stacker**, on the left, received finished cards in the order
  they were punched.

The 029 had a program drum — a small metal cylinder wrapped with a
pre-punched control card — that could automate column-by-column
behavior. For FORTRAN, a standard drum card would automatically skip
the machine from column 72 to column 73 (entering the sequence number
zone), then advance into the sequence number field with a different
behavior than the body. Each programming language had its own drum card.
COBOL had a different drum than FORTRAN, which had a different drum than
assembler. Switching languages meant swapping drums.

### The Economics of Keypunch Staff

A keypunch operator in 1965 earned roughly $3,500 to $5,000 per year,
depending on location and shop. That was well below a programmer's
salary ($10,000 to $15,000) but well above a typist's ($3,000 to
$4,000). Keypunch was considered a skilled clerical specialty. A senior
keypunch operator, often called a "keypunch supervisor," might earn
$6,000 to $8,000 and oversee a pool of fifteen or twenty operators.

The work was demanding. The best operators sustained 10,000 keystrokes
per hour, which translates to roughly 2.8 keystrokes per second, every
second, for hours. Accuracy was measured and tracked: error rates above
one percent were grounds for retraining. Some shops ran a
"verification" pass, where a second operator re-punched the same cards
on a verifier machine and the verifier compared the two punches; any
mismatch was flagged and corrected.

The gender demographics of this workforce are worth naming. In the mid
1960s, between 85% and 95% of keypunch operators in U.S. data centers
were women. In some shops it was 100%. The work was classified as
clerical, paid on clerical scales, and structured as supervised pool
work rather than individual craftsmanship. It was an entry point into
the computing industry for many women who went on to become
programmers, analysts, and systems engineers — but the entry was hard,
underpaid, and invisible in most histories of computing.

### Coding Your Own Cards vs. Using the Pool

At a large shop like IBM Poughkeepsie, Bell Labs Murray Hill, or the
University of Michigan Computing Center, a programmer had a choice:
punch your own cards or submit a coding sheet to the keypunch pool.
The pool was free (built into the cost of the machine room) but slow
(a queue, a turnaround, occasional transcription errors). Self-punching
was fast (you controlled the schedule) but took time away from
programming.

Most senior programmers self-punched their short jobs — a few dozen
cards for a bug fix, a test run, an experiment — and sent their long
jobs to the pool. A 2,000-card COBOL program was not something you
wanted to punch yourself unless you were a masochist or a purist.

In some shops, there was a social pecking order. Programmers who
always used the pool were seen as lazy or entitled. Programmers who
refused to use the pool even for huge decks were seen as obstinate.
Programmers who knew when to do which were respected.

---

## 3. The Deck: A Physical Data Structure

A deck of cards is a physical data structure. This sentence sounds
obvious now, but in the punch card era it carried a weight of practical
discipline. Every property of the deck — its length, its ordering, its
labeling, its rubber-banding — was a design decision with real
consequences.

### Sequence Numbers

Sequence numbers in columns 73–80 were the single most important
convention in the entire era. They existed because cards get dropped,
decks get shuffled, and physical order is not reliable.

If your cards were numbered, you could recover from any disaster with a
card sorter. The IBM 082 Card Sorter and its successors could
mechanically sort a tray of cards by any single column in seconds. Run
the sorter on columns 73–80, and a dropped deck reassembled itself.

If your cards were *not* numbered, a drop meant manual reconstruction.
You would sit on the floor with the scattered cards spread out around
you, reading each one, trying to remember the logical flow of your
program, placing cards in sequence one by one. Experienced programmers
could do this for small decks. For anything over a hundred cards, it
was a several-hour ordeal.

The convention for FORTRAN was to number in multiples of ten: 00010,
00020, 00030, and so on. The gaps were deliberate insertion space. If
you needed to add a statement between 00020 and 00030, you could
punch a card numbered 00025 and it would sort correctly. If you
eventually ran out of gaps, you would renumber the entire deck — a
process called "resequencing" — which was usually done with a utility
program overnight.

### The Header Card

A deck always had a header card. The header was a physical label:
programmer's name, program name, date, and a brief description. Some
shops used pre-printed header cards with forms to fill in; others had
you punch the header yourself. The header served two purposes: it let
the operator identify your job at the submission window, and it
reminded you what was in the deck when you found it on your desk a
month later.

The header was also often color-coded. Many shops had different color
cards for different purposes: yellow for control cards, red for
headers, blue for data, plain buff for source. A deck could be read at
a glance by color before you even looked at what was punched on it.

### The Rubber Band

Every deck was held together with a rubber band, wrapped around the
long axis. The rubber band served one purpose: to prevent the deck
from scattering if dropped. Some programmers used two rubber bands, one
near each end, for security. Some used wide rubber bands meant for
bundling money. Some used plain office-supply rubber bands. All of them
understood that the rubber band was not optional.

When a deck was in active use, the rubber band lived on your wrist. You
peeled it off the deck, slid it onto your wrist, worked with the deck,
and re-rubber-banded it when you were done. Any programmer who
mis-stored a deck without a rubber band was remembered for it.

### The Storage Rack

Long-lived decks lived in a rack. Racks were wooden or metal shelving
units with vertical dividers that held decks on end. A big shop might
have a wall of racks with hundreds of decks stored in alphabetical
order by program name or project. Each deck had its rubber band and
often a paper label taped to the header card.

Utility decks were stored in the rack: sort routines, print routines,
common subroutines, the standard header for your project. When you
built a job, you assembled it from cards and from utility decks pulled
from the rack. Assembly was literally physical: you fetched the needed
decks, stacked them in the correct order, rubber-banded the whole
assembly, and carried it to submission.

---

## 4. The Economics: What a Run Cost

The cost structure of punch card computing drove every decision. This
section unpacks the actual numbers, because the numbers are the thing.
Without the numbers, none of the workflow decisions make sense.

### Machine Time Pricing

IBM 704 time in 1960 was roughly $200 per hour in billable rate. The
704 was a vacuum-tube machine from 1954, already past its peak by 1960
but still in heavy use. The $200 figure came from internal IBM and
university accounting practices; MIT's Computation Center, for
example, billed internal users at rates in that range.

Converting to 2025 dollars using a straight CPI adjustment, $200 in 1960
is roughly $2,100 to $2,300. So an hour of 704 time cost, in today's
money, about what a mid-range cloud GPU instance costs for a week.

The System/360 Model 30, introduced in 1965, was cheaper. It rented for
around $7,000 per month, which at one-shift operation worked out to
something like $40 per hour of wall-clock time. Larger models — the
Model 65, the Model 75 — ran five to ten times that.

But the pricing was not linear with wall clock time. Shops charged by
CPU-second, by I/O count, by memory allocated, by tape mounts, by
printer pages. A single compile-and-run of a small FORTRAN program
might consume:

- 0.3 CPU seconds (at $0.05/sec = $0.015)
- 150 card reads (at $0.001 each = $0.15)
- 80 print lines (at $0.002 each = $0.16)
- 4 KB of core memory for 0.3 seconds (allocated at flat session rate)
- Total: roughly $0.50 to $2.00 per run in 1965 dollars.

That is $5 to $20 in 2025 dollars per single compile-and-run
iteration. If you ran ten iterations in a day — which was ambitious —
you spent $50 to $200 in today's money on machine time, just for one
programmer working on one small subroutine.

At larger scales, the numbers became vivid. A big simulation run — a
weather model, a nuclear calculation, a statistical analysis of a large
dataset — could consume hours of CPU time. An hour of a Model 65 at
$250/hour was $250 per submission in 1965 dollars, which is roughly
$2,500 in 2025 dollars. If you submitted a run with a bug and had to
resubmit, you spent $5,000 in modern terms for the privilege of
finding out you had a typo in your DATA statement.

### Programmer Time Pricing

A skilled programmer in 1965 earned $10,000 to $15,000 per year. Adding
benefits, facilities, and management overhead, the fully-loaded cost
to the employer was roughly twice that — so call it $25,000 to $30,000
per year, or about $12 to $15 per hour.

In 2025 dollars, that is $110 to $135 per hour of programmer time.

Now do the comparison:

- Machine time: $40 to $200 per hour (1965), $400 to $2,000 per hour (2025)
- Programmer time: $12 to $15 per hour (1965), $110 to $135 per hour (2025)

The machine was 3x to 15x more expensive per hour than the programmer
— but it was also the bottleneck resource, because the machine could
only run one job at a time while the programmer pool had many people.
The queue for machine time was the critical path.

This is why workflow was optimized around machine time, not programmer
time. You would willingly spend four hours of your own labor designing
a program on paper to save one hour of wall-clock turnaround on the
machine. You would willingly desk-check a program for an hour to avoid
one wasted submission. The ratio was not about cost; it was about
sequencing. Machine time was the bottleneck. Programmer time was
elastic.

### Batch Scheduling

Jobs were scheduled by priority and resource profile. A typical shop
had multiple priority classes:

- **Priority 1** — Production jobs with deadlines. Nightly payroll,
  weekly billing runs, month-end reports. These had guaranteed slots.
- **Priority 2** — Development jobs for paying customers. Compilations
  and test runs of new code, bounded in CPU time.
- **Priority 3** — Internal development. Programmer testing,
  experimental runs, learning exercises.
- **Priority 4** — Student jobs at universities. These ran in the
  overnight batch, after everything else.

Within each priority, jobs were sub-sorted by expected resource use.
Short jobs (under 10 seconds of CPU, under 500 lines of print) were
batched together and run during the day as short-job queues. Long
jobs were saved for overnight when the machine could run uninterrupted.

At a university, the turnaround for a student FORTRAN job was commonly
twelve hours. You submitted in the afternoon, came back the next
morning. At a commercial shop with dedicated machines, you might get
two to four turnarounds per day if your jobs were short. At a busy
time-shared commercial shop, overnight was still common.

---

## 5. The Design Discipline

Because runs were expensive and slow, the design phase of programming
was elevated to an art. Programmers spent hours — sometimes days —
designing a program before writing any code. This was not waterfall
dogma; it was survival.

### Flowcharts

The flowchart was the primary design tool. IBM sold pre-printed
flowchart template plastic stencils (the IBM Flowcharting Template,
X20-8020) that every programmer kept in their desk. The template had
cutouts for the standard symbols: rectangle for process, diamond for
decision, parallelogram for input/output, rounded rectangle for
terminal, small circle for connector, cylinder for storage.

You drew a flowchart on graph paper or on pre-printed flowchart forms.
You drew it carefully because you were going to refer to it while
coding. A well-drawn flowchart was a program in a visual language: you
could read the logic at a glance and verify the control flow before
committing to code.

Flowcharts were also a communication tool. When you explained a
program to a colleague or a manager, you did it with a flowchart. When
you documented a program for maintenance, you archived the flowchart
alongside the source. Some shops required flowcharts as a deliverable
for every program; others treated them as personal artifacts. Either
way, they were universal.

### Pseudocode

Pseudocode — English-like descriptions of the program logic — was
another design tool. You wrote pseudocode before you wrote real code,
often in the same notebook as your flowchart. Pseudocode let you think
about the logic without getting distracted by syntax.

Pseudocode style varied by shop and by programmer. Some used
structured English with if-then-else keywords. Some used a heavily
abbreviated shorthand. Some used a formal pseudocode like PDL (Program
Design Language) that had its own syntax and tools. But the idea was
the same: think in plain language first, translate to FORTRAN or COBOL
second.

### Desk-Checking

Desk-checking was the most important design discipline of all. To
desk-check a program meant to read it line by line, by hand, tracing
execution on paper as if you were the computer.

You drew a table of variables across the top of a sheet. As you walked
through the code, you updated the variables, erasing and rewriting as
they changed. You traced conditionals by hand, taking each branch and
tracking its effect. You traced loops, iterating on paper until the
exit condition was met.

Senior programmers could desk-check complex programs in their heads,
keeping dozens of variables in working memory. Junior programmers used
scratch paper. A good desk-check could catch 80% to 90% of bugs before
the program ever hit a card. The other 10% to 20% became the reason
you had to run the program at all.

The discipline of desk-checking produced a kind of programmer that is
rare today: one who could read code on paper and know what it did,
completely, without running it. This was not magic. It was practice
forced by economics. When running the program costs $20 and takes 24
hours, reading it carefully for an hour to save that $20 and that 24
hours was an excellent trade.

### Playing Computer

A variation on desk-checking was "playing computer." You sat with your
code and a fresh sheet of paper. You assigned yourself the role of
CPU. You read each line, decided what it meant, updated the state on
the paper, and moved to the next line. You kept this up until the
program finished or you got bored.

Playing computer was taught in introductory programming classes as a
debugging technique. It was also taught as a test of understanding: if
you could not play computer through your own program, you did not
understand it, and you were not ready to submit it.

---

## 6. The Examine Phase: Reading the Printout

When the printout came back, the examine phase began. This was its own
craft.

### The Job Log

The top of the printout was the job log. It told you whether the job
ran at all, what resources it consumed, and what status it exited with.

Exit status was critical. A zero exit meant success — the program ran
to completion. A non-zero exit meant some kind of failure. System/360
OS had dozens of completion codes, each with its own meaning:

- **000** — Normal termination
- **001** — Wait state with no work
- **013** — Data management error (bad file reference)
- **0C1** — Operation exception (illegal instruction)
- **0C4** — Protection exception (addressing violation)
- **0C7** — Data exception (bad packed decimal)
- **80A** — Insufficient storage
- **322** — Time limit exceeded

Reading the job log told you whether you were dealing with a compile
error, a load error, a runtime exception, a wrong output, or a
time-out. Each category pointed to a different debugging approach.

### The Source Listing

Below the job log came the source listing. The compiler echoed every
line of source back to you, with line numbers in the margin and error
messages inline. For a clean compile, the source listing was
uninteresting; you skipped to the next section. For a failed compile,
the source listing was where you lived.

Compile errors were annotated inline. A typical IBM FORTRAN H compiler
error looked like:

```
   00170  IF (IMONHT .EQ. 2) GOTO 200
   IEY0141I  UNDEFINED SYMBOL IMONHT
```

The error code `IEY0141I` was a lookup key. You could find its meaning
in the IBM reference manuals — specifically the "Messages and Codes"
volume, which was a thick book that lived on every programmer's desk.
The manual told you the meaning of every compiler and runtime message,
what it indicated, and what to do about it.

### The Runtime Output

If the program compiled cleanly, it ran. Runtime output appeared after
the source listing: whatever PRINT, WRITE, or DISPLAY statements your
program executed showed up here, formatted into the 132-column
green-bar layout.

Reading runtime output was part of the discipline. You had to check
not just whether the output was right, but whether it was in the right
format, whether page breaks fell correctly, whether numeric columns
lined up, whether headers and footers appeared where expected. Output
formatting was a huge fraction of COBOL programming.

### The Core Dump

If the program crashed, you often got a core dump. A core dump was a
hex listing of all of memory at the moment of the crash. The first few
lines identified the fault: the program status word, the general
registers, the failing instruction address. Below that came the entire
contents of your program's memory, sixteen bytes per line, addressed
in hex.

Reading a core dump was a black art. You had to know:

- The layout of your program in memory (from the link map, printed
  earlier in the listing)
- The format of the instruction set (to read machine code)
- The calling conventions and register usage
- The structure of your data (what variables were at what addresses)
- The state at the moment of the crash (by inspecting registers and
  the stack)

From all of this, you reconstructed what had happened. You figured out
which subroutine was running, which instruction had failed, what data
it was operating on, and why it had blown up. A skilled programmer
could do this in twenty minutes for a simple crash. A complex crash
could take hours.

There were specialists who did nothing but read core dumps. At large
shops, they were called "systems programmers" and they were the court
of last resort when a weird bug defeated the application programmers.
Systems programmers had shelves of reference manuals and an uncanny
ability to look at a page of hex and see the story it told.

### Marginal Notes

Every programmer annotated the printout in pencil or red pen as they
read it. Circles around errors. Arrows connecting related lines.
Margin notes with questions: "why is this zero?" "should this be
200?" "missing case?" "off by one?"

The annotated printout was a working document. It was the bridge
between "what the machine did" and "what I need to change." By the
end of the examine phase, your printout was marked up enough that you
could carry it back to the keypunch room and know exactly which cards
to punch.

---

## 7. Job Control Language

JCL deserves its own section because it was the most hated thing about
System/360. Programmers who loved FORTRAN or COBOL unreservedly still
complained about JCL. The complaints were well-earned. JCL was cryptic,
unforgiving, and powerful in ways that were easy to misuse.

### What JCL Did

JCL was IBM's job specification language. It told the operating system
what program to run, what files to use, what resources to allocate,
and how to handle output. A JCL file was itself a deck of cards (or a
set of cards at the front of your program deck). The OS read the JCL
cards before it read your program, and used them to set up the runtime
environment.

### The Three Main Statements

JCL had three main statement types, each identified by the word after
the `//`:

**JOB** — The first card of every job. Identified the programmer,
the account to charge, and global job parameters.

```
//DAVIDS01 JOB (1234,DEPT90),'DAVID SMITH',CLASS=A,MSGCLASS=H
```

**EXEC** — Invoked a program or a procedure. Gave it parameters.

```
//STEP1    EXEC PGM=IEBGENER
```

**DD** — Data Definition. Attached a file to a logical name the
program would use.

```
//SYSUT1   DD DSN=DAVIDS.INPUT.DATA,DISP=SHR
//SYSUT2   DD DSN=DAVIDS.OUTPUT.DATA,DISP=(NEW,CATLG,DELETE),
//            SPACE=(TRK,(10,5)),UNIT=SYSDA
```

The DD card above says: create a new dataset, catalog it if the step
succeeds, delete it if the step fails, allocate 10 tracks initially
with 5-track extents on any system direct-access device.

Every option had abbreviations, defaults, and interactions. Mess up
the DISP parameter and your output disappeared into the void. Forget
to specify SPACE and the system allocated the default, which might be
too small for your output. Specify the wrong UNIT and the job failed
because the device class did not exist on that configuration.

### The //SYSIN DD * Trick

The most famous JCL pattern was inline input:

```
//SYSIN    DD *
1 INPUT RECORD
2 INPUT RECORD
3 INPUT RECORD
/*
```

The `DD *` said: the input data is the next cards in the deck, up to a
terminator. The terminator was `/*` — two characters, slash asterisk,
always in columns 1–2. The OS would read cards until it hit `/*` and
feed them to the program as standard input.

This let you embed test data directly in your job deck. For a small
test run, the data and the program traveled together in the same
physical bundle.

### The Green Card

IBM published a reference card called the "System/360 Reference Data"
card, known universally as the "green card" because it was printed on
green card stock. It was a folded plastic card, roughly the size of a
postcard when folded, that unfolded to reveal several panels of
essential reference data:

- Machine instructions with opcodes
- Condition codes
- Format specifications
- JCL syntax
- ASCII/EBCDIC character tables
- Storage allocation constants

Every mainframe programmer had a green card. It lived in their shirt
pocket or on their desk next to the keypunch template. When you had a
question about JCL syntax or about how a particular instruction
behaved, you pulled out the green card. It was the original quick
reference, and it defined a whole generation of programmer's pocket
accessory.

---

## 8. Batch Culture and the Absence of Interactivity

The defining feature of punch card programming was the absence of
interactivity. There was no prompt. No REPL. No way to stop a running
program and look at its state. No way to try something and see what
happened. The program ran from start to finish, produced output, and
exited. That was the only mode.

### No Debugger

The concept of a debugger in the modern sense — an interactive tool
that let you set breakpoints, step through code, and inspect variables
— did not exist in the punch card era. It could not exist. There was
no screen. There was no keyboard connected to a running program. There
was nothing to interact with.

Debugging was done in three ways:

1. **Reading core dumps** — For crashes, you read the hex dump and
   figured it out.
2. **Adding print statements** — For wrong output, you added PRINT
   statements at strategic points, recompiled, resubmitted, and looked
   at the traces.
3. **Desk-checking harder** — For things you could not figure out from
   the printout, you went back to the paper and read the code again,
   more slowly.

The PRINT-statement style of debugging was familiar but expensive.
Every PRINT statement was a modification to the deck (more cards,
punched, inserted into the right place). Every iteration of adding
prints and re-running was a full turnaround cycle. So you added many
prints at once, in anticipation of needing them, then stripped them out
later.

Some shops had primitive trace facilities: a compiler option that
would automatically print the value of every variable as it was
assigned. This generated huge amounts of output but sometimes that was
the only way to find a subtle bug.

### Checkpoint Files

Long-running programs used checkpoint files. A checkpoint was a
snapshot of the program's state written to tape at regular intervals.
If the program crashed or was killed by the operator, it could be
restarted from the last checkpoint instead of from the beginning.

Checkpoint programming was its own skill. You had to identify the
right places to checkpoint (typically at the end of each major phase
of the computation), write out all the variables needed to restart,
and arrange your code so that a restart actually worked. Writing
checkpoint code was boring but essential for anything that ran longer
than about an hour.

### Core Dumps as Forensics

When a program crashed, the core dump was forensic evidence. You
could not ask the program what had happened. You could only examine
the body.

A core dump typically ran hundreds of pages on green-bar. The top
showed the registers and the PSW (Program Status Word). Below that,
the program's memory was dumped in hex, sixteen bytes per line, with
the EBCDIC character interpretation alongside. Unprintable bytes
showed as dots.

You started at the PSW to find the failing instruction address. Then
you looked at the instruction at that address (remembering to
translate from the absolute address to the program-relative address
using the link map). Then you looked at the register values to see
what data the instruction was operating on. Then you tried to figure
out why the data was wrong.

A typical dump analysis session looked like this: the programmer at
the desk with a stack of printouts, a link map, a reference manual
open to the instruction set pages, a pad of scratch paper, a sharp
pencil, and hours of quiet concentration. It was the opposite of
modern debugging. It was more like detective work.

---

## 9. MVPs Before MVPs

The discipline of incremental development — build the smallest thing
that could possibly work, then add one feature at a time — was not
invented by Agile or by Eric Ries. It was forced on punch card
programmers by the economics of iteration.

### Why Small Decks Mattered

A 100-card program was manageable. A 1,000-card program was risky. A
10,000-card program was a project with real physical challenges.

At 10,000 cards, the deck weighed about 30 pounds. It required a
hand truck to move. It filled multiple card trays. Submitting it meant
carrying the trays to the machine room. Dropping any part of it was a
disaster. Keeping it in sync with the latest changes was hard.

Practical programs grew to 10,000 cards and beyond, of course — major
COBOL applications routinely exceeded 20,000 cards. But they did not
start there. They started at 100 cards, 500 cards, maybe 1,000 cards,
and they grew feature by feature, test by test, iteration by iteration.

### One Bug Per Run

You could not fix ten bugs in one run. You could try, but if one of
your fixes introduced a new bug, you could not tell which one. The
full-day turnaround meant you had to be sure each change was correct
before stacking another change on top of it.

The discipline was: fix one bug, verify the fix, then move to the next
bug. This made progress slow but steady. It also meant that you had to
prioritize ruthlessly. Which bug is the most important to fix next?
Which one is blocking the most work? Which one will be hardest to
verify if I let it go longer?

### The First Version Is the Skeleton

Your first submission of a program was never the full program. It was
the smallest thing that could possibly run: a main routine, a single
subroutine, a hard-coded input, a PRINT statement showing the output.
This was the skeleton. If the skeleton ran, you knew the compile and
link process was working, your JCL was correct, and your I/O was set
up properly. Then you added the real logic, one piece at a time.

This is the exact pattern Kent Beck would later call "make it run,
make it right, make it fast." It is the exact pattern Martin Fowler
called "tracer bullets." It is the exact pattern every modern agile
methodology claims as an innovation. And it was invented, from sheer
necessity, by FORTRAN programmers in 1960 who could not afford to
debug ten things at once.

### Chesterton's Fence

The conservative principle of "do not remove code you do not
understand" — which the essayist G. K. Chesterton articulated in a
1929 essay about literal rural fences — became a programming discipline
in the punch card era. Removing working code and introducing a bug
meant a full turnaround cycle. Maybe two. You could lose a day finding
out that the mysterious WRITE statement you deleted was actually
needed.

So the rule became: never touch code you do not understand. If a line
seems weird, figure out why it is there before you change it. If you
cannot figure out why, leave it alone. The economics of iteration
enforced humility.

---

## 10. The Mythical Man-Month

Fred Brooks wrote *The Mythical Man-Month* in 1975, published while
the punch card era was ending but describing a world he had lived in
his whole career. Brooks had managed the development of OS/360 at
IBM, which at its peak employed over a thousand programmers working
on a single operating system. The experience had taught him several
hard lessons that he condensed into the book's most famous
aphorisms:

- **Brooks's Law** — Adding people to a late software project makes
  it later.
- **The surgical team** — Small teams of highly skilled programmers
  outperform large teams of average ones.
- **Conceptual integrity** — The most important single attribute of a
  software system is that it feels like the product of one mind.
- **Second-system effect** — The second system a programmer designs is
  the most dangerous: bloated with features from the first system plus
  speculative features for the future.

Brooks's observations were grounded in the physical reality of punch
card development. Adding programmers to a project meant more coding
sheets, more decks, more keypunch pressure, more submission queue
contention, and more coordination overhead. Every programmer needed
access to the machine, which meant every programmer contended for the
same bottleneck resource. You could not scale past the machine.

The absence of interactivity made coordination worse. You could not
pair-program because there was nothing to pair at. You could not
share a screen because there was no screen. Code review was done on
printouts passed around the office. Integration was done by physically
combining decks.

Brooks's Law was the direct consequence of these constraints. The only
way to deliver a project faster was to make the remaining work more
parallel, and the punch card workflow resisted parallelism at every
layer.

---

## 11. The End of the Era

The punch card era ended, not in a day, but in a decade. The transition
from batch cards to interactive terminals began in 1961 with CTSS at
MIT, gathered momentum through the late 1960s, and was essentially
complete at most commercial shops by the mid 1980s.

### Time-Sharing Arrives

Compatible Time-Sharing System (CTSS) ran on a modified IBM 709 and
later 7094 at MIT starting in 1961. It allowed multiple users to
interact with the same computer simultaneously through teletype
terminals. Each user felt like they had the machine to themselves;
the operating system time-sliced between them.

CTSS was a research system, not a product. But it demonstrated the
possibility: interactive computing could exist. A user could type a
command, see a response, type another command, and iterate. The full
day turnaround could become seconds.

### TSO, VM/CMS, and Interactive Batch

IBM's Time Sharing Option (TSO) for OS/360 appeared in 1971. TSO let
terminal users edit files, compile programs, submit jobs, and view
output interactively. It was grafted onto a batch operating system, so
it was clunky and slow compared to purpose-built time-sharing systems,
but it ran on the machines that commercial shops already owned. It
spread rapidly.

VM/CMS (Virtual Machine / Conversational Monitor System) appeared
around 1972. VM gave each user their own virtual machine — a complete
illusion of a private System/370 — while CMS was the interactive
monitor users ran inside their virtual machine. VM/CMS became the
preferred interactive environment at many IBM shops, especially for
program development. It was faster, more responsive, and cleaner than
TSO.

VMS for DEC's VAX minicomputer line arrived in 1977 and brought full
interactive computing to the midrange market. A VAX running VMS with a
few dozen terminals was a different kind of machine entirely: users
typed at their own stations, ran commands in seconds, edited files in
screen editors, and iterated in minutes instead of days.

### The New Workflow

With interactive terminals, the design-code-build-run-examine-improve
loop collapsed. Instead of hours or days per iteration, you could do
an iteration in minutes. You could try something and see what happened
immediately. You could experiment. You could explore.

The new workflow looked like this:

1. Edit source in a screen editor.
2. Compile in a few seconds.
3. Run in a few seconds.
4. See output on the screen.
5. Edit again.

The physical deck disappeared. The rubber bands disappeared. The walks
to the keypunch room disappeared. The submission queue disappeared.
The overnight wait disappeared. All the friction of the punch card
era was gone.

### What Was Lost

Older programmers noticed that something was lost, too. The discipline
of designing before coding. The discipline of desk-checking. The
discipline of fixing one bug at a time. The discipline of never
touching code you did not understand. All of these disciplines had
been enforced by economics in the punch card era. When the economics
changed, the discipline became optional.

Interactive computing made it easy to be sloppy. You could type a bad
line, run it, see it fail, change a character, run it again. You could
iterate your way to a working program without ever understanding what
you had written. The fast feedback loop was seductive. It rewarded
experimentation over thinking.

Some older programmers resisted this. They continued to design before
coding, to desk-check, to keep their changes minimal. They were
respected for their discipline but considered slow by the new
generation. The new generation produced working code faster but with
more bugs, less understanding, and less care.

The trade-off was real. Neither side was wrong. The older discipline
was a response to punishing economics, and when those economics
changed, the response was no longer necessary in the same way. But the
underlying habits — think before you code, know what every line does,
make the smallest change you can — remained good habits, even in a
world where mistakes were cheap. The programmers who kept those habits
wrote better code than the programmers who did not.

### What Was Gained

The gains were enormous. Interactive computing made programming
accessible to vastly more people. It made exploration and prototyping
trivial. It enabled entire categories of software that could not have
existed in the batch world: interactive graphics, real-time games,
live data analysis, conversational interfaces. It turned programming
from a rare specialty into a common craft.

It also enabled the scripting languages and REPLs that define modern
computing culture. Python, Ruby, JavaScript, Lisp's interactive
environments — all of them presuppose the interactive loop that the
punch card era could not provide. They are the direct descendants of
the terminal-based workflow that replaced batch cards.

---

## 12. What the Punch Card Era Teaches

The punch card era is not just a historical curiosity. It is a
laboratory experiment in what programming looks like when iteration
is expensive. Every discipline it forced on programmers is still
relevant today, even though the economics have inverted.

The lessons are worth summarizing:

1. **Design before coding is cheap.** The hours you spend at a desk
   with pencil and paper are cheaper than the hours you spend debugging
   a bad design. This was literally true in 1965 and it is still true
   in 2025 — we just hide the costs differently.

2. **Desk-checking catches most bugs.** Reading your own code slowly,
   line by line, and tracing execution on paper catches a surprisingly
   large fraction of bugs before they ever run. Modern programmers who
   learn to do this produce code with fewer bugs than programmers who
   rely on the debugger.

3. **One change at a time is faster than ten.** Making one change,
   verifying it, then making the next is slower per-iteration but
   faster overall because you never have to untangle interactions. This
   was true in 1965 because you could not afford to debug tangled
   interactions. It is still true in 2025 because your future self
   cannot afford to, either.

4. **Chesterton's Fence is law.** Do not remove code you do not
   understand. The cost of removing working code and introducing a bug
   is always higher than the cost of understanding why the code is
   there. This lesson was enforced by turnaround time in 1965. Today it
   is enforced by the cost of debugging production incidents.

5. **Small programs are easier than large ones.** Build the skeleton
   first. Add one feature. Verify. Add another. The incremental
   approach is not a methodology; it is a way of not drowning.

6. **Know what every line does.** The punch card programmer had to
   know every line of their program because they could not rely on the
   machine to tell them. Modern programmers can rely on the machine,
   but the ones who know every line anyway produce better software.

7. **Humility about the unknown.** When a line of code is mysterious,
   pause before changing it. The cost of guessing wrong is higher than
   the cost of figuring it out.

None of these lessons are unique to punch cards. They are universal
engineering principles that the punch card era forced into the
collective memory of the profession. The medium is different now. The
lessons are the same.

---

## 13. Coda: A Craft Lost, a Craft Remembered

The punch card era lasted about twenty years as a dominant mode. It
overlapped with the first interactive systems for about ten years. By
1985, most programmers working in most commercial shops had never
touched a punch card. By 2005, most programmers had never even seen
one. By 2025, the entire era is a museum piece.

But the craft the era produced was not a museum piece. It was the
foundation of professional programming. The programmers who came out
of the punch card era and transitioned to interactive computing carried
their habits with them. They taught those habits to their juniors.
The juniors taught them to their juniors. Some of it was lost along
the way — the desk-checking discipline especially — but the core of
it survived as the intuitive sense of what "good engineering" means.

When a senior engineer today tells a junior to "think before you
code," or "make the smallest change that could work," or "do not touch
that until you understand it," they are passing down wisdom that was
forged in a keypunch room in 1965 and paid for in hours of wall-clock
turnaround and dollars of machine time. The advice is correct. The
origins are specific. And the reasons the advice is correct are the
same reasons it was correct then.

Programmers today work in a world of infinite iteration. Every run is
nearly free. Every mistake is nearly free. The feedback loop is fast
enough that you can almost always just try something and see what
happens. This is a gift of the modern era, and it is not to be
despised.

But the gift has a shadow. The feedback loop is so fast that it
rewards not thinking. The cost of a mistake is so low that it rewards
not understanding. The iteration is so cheap that it rewards not
caring. The punch card era forced the opposite: every step cost
something, so every step had to be worth taking.

A programmer who works today with the habits of a punch card
programmer — who thinks before coding, who desk-checks, who makes
minimal changes, who knows every line — will produce better software
than one who does not. The economic pressure is gone, but the
underlying value of the habits remains. They were not arbitrary
responses to arbitrary constraints. They were expressions of
engineering care in a medium that did not tolerate carelessness.

The medium tolerates carelessness now. But the care is still worth it.

*— End of research document.*
