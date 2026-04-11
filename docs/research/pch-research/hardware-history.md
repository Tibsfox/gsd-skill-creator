# Punch Cards: The Physical and Historical Reality

*A deep research document on the cards, machines, rooms, and people that built the first information age.*

---

## Preface: A Tactile Technology

Before there was a blinking cursor, there was a stack of cards.

Before there was a filesystem, there was a tray.

Before there was an operating system scheduling jobs, there was a human being with a grease pencil and a clipboard, logging your deck into a queue.

For almost a century, from the 1890 U.S. Census to the last holdout installations of the 1990s, the primary physical interface between human thought and machine computation was a rectangle of stiff paper roughly the size of an index card, weighing less than a gram, perforated with rectangular holes in a pattern that both machine and patient human eye could learn to read.

This document is about the cards themselves.

It is about the keypunches that made them, the sorters that shuffled them, the collators that merged them, and the accounting machines that added them up before a "computer" as we understand the word even existed.

It is about the rooms where they lived, the women and men who fed them into the readers, and the specific smell of a data center in 1962.

It is about the rituals of the coding sheet, the submission window, and the overnight turnaround.

It is about the moment your rubber band broke in the hallway and your year of work scattered across a linoleum floor.

Whenever possible this is grounded in specific IBM model numbers, dates, dimensions, prices in period dollars, and the kind of sensory detail that survives in memoirs, oral histories, and the collections of museums.

Where a detail is generally attested but not traceable to a single source, the text says so. Where figures are estimates, they are labeled as estimates.

This is not a complete history of computing. It is a narrow slice of that history, focused on the physical object at the center of it: the card.

---

## Part 1: The Card Itself

### 1. Herman Hollerith and the 1890 Census

In 1880, the United States Census Bureau counted 50,189,209 people by hand.

The count took roughly eight years to process.

By the time the results of the 1880 census were fully published, the population had already grown so much that parts of the tabulation were obsolete.

Congress was told, with increasing alarm, that the 1890 census would take so long to process that the 1900 census would begin before the 1890 numbers were finished.

The Constitution requires a decennial census for apportionment of the House of Representatives.

The mathematics of population growth were threatening to overtake the mathematics of clerical labor.

Herman Hollerith, born February 29, 1860, in Buffalo, New York, the son of German immigrants, was a 20-year-old Columbia School of Mines graduate when he joined the 1880 census as a special agent.

He watched rooms full of clerks stroke tally marks onto paper forms for eight years.

The scene stuck with him.

By the time he left the Bureau, Hollerith was convinced that counting people was fundamentally a mechanical problem, not a human one.

The breakthrough came, according to his own account, from watching a railroad conductor.

On long-distance trips, conductors used a system called a "punch photograph" to prevent ticket fraud: when a passenger handed over a ticket, the conductor punched holes in positions corresponding to the passenger's height, hair color, eye color, and other physical features.

If the ticket was later used by someone else, the punched "photograph" would not match.

Hollerith realized that if you could encode a person's physical attributes as holes in a piece of paper, you could encode anything as holes in a piece of paper.

Age, occupation, number of children, state of birth, marital status.

A census.

Hollerith patented his first electromechanical tabulator in 1884.

He spent the rest of the decade refining it into something the Census Bureau would accept.

In 1889, the Bureau held a competition among three candidate systems.

Hollerith's machine processed a trial set of data in about 5.5 hours.

Its nearest competitor took 44 hours.

The Bureau awarded him the contract.

The 1890 census counted 62,622,250 people.

The tabulation phase, using Hollerith's machines, was complete in approximately six months for the basic population counts, and roughly 2.5 years for the full set of cross-tabulated reports.

The Census Bureau estimated the cost savings at about $5 million in 1890 dollars, roughly $170 million today.

Hollerith's machines had done in six months what eight years of clerks could not.

In December 1896, Hollerith incorporated the Tabulating Machine Company in Washington, D.C.

In 1911, the Tabulating Machine Company merged with the International Time Recording Company and the Computing Scale Company to form the Computing-Tabulating-Recording Company (CTR).

In 1914, a former National Cash Register executive named Thomas J.

Watson Sr. joined CTR as general manager.

On February 14, 1924, Watson renamed CTR to International Business Machines Corporation.

IBM.

The punch card industry was, from its very first moment, a business built on a U.S. government data problem.

### 2. The 80-Column Card (1928)

Hollerith's original census card was 3.25 inches by 6.625 inches—the dimensions of an 1887 U.S. dollar bill, which made it easy to store in existing cash drawers.

It had 24 columns of round holes.

Over the next four decades the format drifted.

By the early 1920s the standard Hollerith-style card had 45 columns with round holes, and it was starting to run out of room for the increasingly complex encodings businesses wanted.

In 1928, IBM introduced the card that would define the next half century of computing: the 80-column rectangular-hole card.

**Physical dimensions:** 7 + 3/8 inches wide (187.325 mm) by 3 + 1/4 inches tall (82.55 mm) by 0.007 inches thick (0.178 mm). One card weighs approximately 0.8 grams. A standard box of 2,000 cards weighs about 4 pounds. A full box of 2,500 cards (the common shipping quantity for IBM 5081 stock) weighs about 5 pounds and is roughly 8 inches tall when stacked.

**Why 80 columns?** The answer is more physical than mathematical. IBM's card-handling mechanisms, inherited from Hollerith's original design, drove the card through the machine column-by-column past a reading station. The designers wanted the thinnest practical column that would still reliably punch and read without tearing the paper. They settled on a column width of about 0.087 inches. Divide 7.375 inches by 0.087 and you get 84, minus some margin on each side and the fixed stacker mechanics, and you land on 80. Eighty columns was not a magic number. It was the answer to: *how many slim rectangular holes can you reliably punch across 7 + 3/8 inches of card stock without the paper tearing at the edges?*

The rectangular hole (0.055 inches wide by 0.125 inches tall, approximately) was a deliberate improvement over Hollerith's round holes.

A rectangle packs tighter, so you get more columns per card.

It also produces a more distinctive shadow for optical detection and a larger contact area for brush readers.

IBM patented the rectangular-hole format, which became a legal weapon against competitors for decades.

**The corner cut.** The upper-left corner of an IBM 80-column card is clipped at a 45-degree angle. The cut is purely for orientation. When you hold a deck in your hand, the corner cut tells you which way is up and which end is the front. If a card is upside-down or reversed in a deck, the cut immediately shows it as an irregularity in the otherwise uniform outline of the stack. Sorting a deck "by sight" relied on the corner cut to spot inverted cards before you fed them into a machine that would read them as garbage.

**The colors.** IBM sold cards in a rainbow of shades. Standard cream (the default, a pale buff color, because pure white paper was harder to read against the printed column numbers). Pink. Pale blue. Yellow. Pale green. Salmon. Gray. The colors had no technical meaning. They were used administratively: payroll cards might be pink, inventory cards blue, accounts receivable yellow. A glance at a tray told you what kind of job was inside. Some installations had rigid color conventions. Others used whatever was on the supply cart. The 5081 form was the plain cream default.

**The printed legend.** Most 80-column cards came pre-printed with faint gray or green lines delineating the 80 columns and the 12 rows (rows 12, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 from top to bottom). Column numbers were printed along the top and bottom edges. Some cards had field boundary lines printed on them for specific applications. Payroll cards might have "EMP NO" printed over columns 1-5, "NAME" over columns 6-25, "HOURS" over columns 26-29, and so on. A pre-printed card turned a data-entry job into a fill-in-the-blank exercise.

### 3. The Hollerith Code

A column on an 80-column card has 12 vertical punch positions, one per row.

The top three rows (12, 11, 0) are called **zone punches**.

The bottom nine rows (1-9) are called **digit punches**.

Row 0 is sometimes considered a zone punch, sometimes a digit punch, depending on context.

The encoding works like this:

- **Digits 0-9**: single punch in the corresponding row. The digit "5" is a punch in row 5. The digit "0" is a punch in row 0. Simple.
- **Letters A-I**: zone punch in row 12, plus a digit punch in rows 1-9. "A" = 12+1, "B" = 12+2, ..., "I" = 12+9.
- **Letters J-R**: zone punch in row 11, plus digits 1-9. "J" = 11+1, "K" = 11+2, ..., "R" = 11+9.
- **Letters S-Z**: zone punch in row 0, plus digits 2-9. "S" = 0+2 (because 0+1 was reserved), ..., "Z" = 0+9.
- **Special characters**: various combinations of zone punches and multiple digit punches. A period might be 12+3+8. A comma 0+3+8. A dollar sign 11+3+8. The exact assignments varied by machine.

This encoding explains two persistent oddities of computing history.

First, the alphabet is *not* a simple sequence of 1 through 26 in the card, which is why EBCDIC (IBM's later mainframe character encoding) has "gaps" between I and J, and between R and S—the gaps are exactly where the zone punch changes.

EBCDIC is Hollerith with eight-bit clothes on.

Second, the maximum character width that could fit in a single column was limited by what a physical mechanical brush could reliably detect in a single pass.

**The 026 vs 029 distinction.** The IBM 024 and 026 keypunches (introduced 1949) used what is now called the "BCD" or "commercial" character set. When IBM introduced the 029 keypunch in 1964 alongside System/360, they expanded the character set to match EBCDIC, adding new symbols and remapping several punctuation marks. A card punched on a 026 and a card punched on a 029 with the same keystrokes could produce different hole patterns for characters like `=`, `'`, `(`, `)`, `<`, `>`, and several others. An installation that mixed 026 and 029 machines had to either standardize on one or track which characters each class of deck used. Programming languages designed in the 026 era (early FORTRAN, early COBOL) used character sets that were the intersection of 026 and 029 capabilities. It is the reason FORTRAN initially wrote "greater than or equal to" as `.GE.` instead of `>=`—the `>` symbol was not reliably portable between keypunch types.

### 4. Card Weights and Handling

Once you have cards, you have the problem of handling cards. This is where the data-center craft begins.

**Weight.** A single 80-column card at 0.007 inches thick and standard 100-pound Manila stock weighs 0.78-0.82 grams. Call it 0.8 g for rough calculations. A deck of 2,000 cards (a standard box) weighs roughly 4 pounds (1.8 kg). A full-tray deck of 3,000 cards weighs about 6 pounds. A large batch job for a 1960s payroll run might consist of 15,000-30,000 cards, weighing 30-60 pounds and filling two or three trays. A full year of accounting records for a mid-sized company could easily run to 100,000 cards—a literal wheelbarrow of paper.

**Rubber bands.** Thick, flat rubber bands were the universal restraint. They came in rolls of 50 or 100 at every supply cabinet. You wrapped a band around a deck in both directions (long way and short way) for transit. Experienced operators kept a stash in a desk drawer because bands dried out and snapped. A snapped band on a full deck in motion was a disaster (see §27: The Drop).

**Card cases and trays.** IBM sold metal card-storage trays in several standard sizes: the 1,000-card tray, the 2,000-card tray, and the heavy-duty 3,000-card "transfer case." Trays were open-topped steel boxes, roughly 14 inches long, with a hinged end-gate and a movable "follower block" that pressed the cards tight from behind to prevent them from sliding. Every data center had racks of these trays the way a library has shelves of books. A popular alternative was the cardboard transfer box, the same shape but expendable—you shipped a box of results out and sent the empty box to the incinerator.

**Tray 9 (the overflow tray).** Many card-processing workflows involved sorting decks into pockets (see §8 on sorters). The IBM 082 sorter had 13 pockets: one per digit row (12, 11, 0, 1-9) plus a "reject" pocket. Operators often referred to the reject pocket as "tray 9" or "pocket 9" by convention, regardless of whether the specific machine numbered it that way. Cards that fell into reject were either damaged, out-of-format, or had a punch pattern the sort field didn't expect. In large installations, tray 9 was where the anomalies lived. Smart operators checked it after every pass.

### 5. The 96-Column Card (IBM System/3, 1969)

By the late 1960s, the 80-column Hollerith card was 40 years old and showing its age.

It was bulky.

It held only 80 bytes of data.

It required specific brush-reader mechanisms that limited speed.

And it was too big for the small-business computers IBM wanted to sell in the new "System/3" line.

IBM's answer, announced in 1969 with the IBM System/3 minicomputer, was the **96-column card**.

It was roughly one-third the size of an 80-column card: about 3.25 inches by 2.63 inches.

It used small round holes, not rectangles, arranged in three tiers of 32 columns each.

Each character used a six-bit BCD code instead of the multi-punch Hollerith code.

A printed legend area ran along the top of the card so the characters could still be read by eye.

The card was aimed at small businesses that wanted card-based batch processing without the floor space and cost of a full System/360 installation.

The 96-column card was a technically reasonable design.

It held 96 characters instead of 80 (a 20% increase).

It was easier to handle, cheaper to ship, and used less paper per record.

System/3 sold well—at least 25,000 units shipped over its lifetime—and so 96-column cards were manufactured in quantity for about 15 years.

And yet it failed utterly to displace the 80-column card. Why?

Because the 80-column card was not just a form factor.

It was the format of every accounting machine, every keypunch, every sorter, every collator, every reproducer, every card file, every trained operator, every printed form, every blank card inventory, every storage tray, every rubber band, and every muscle memory of every data processing professional in the world.

An installation that had spent 40 years building 80-column workflows could not switch to 96-column without throwing out everything and retraining everyone.

The 96-column card was a superior technology that arrived too late to matter.

It is a perfect case study in technical lock-in: once a standard is deep enough in the infrastructure, even a better replacement cannot move it.

By 1978 the entire punch-card industry was being eaten alive by interactive terminals anyway. The 96-column card was a late-stage refinement of a technology that was already terminal.

---

## Part 2: The Machines

### 6. The Keypunch

The keypunch was the machine where code and data were born.

If the computer room was the holy of holies, the keypunch room was the parish hall: loud, crowded, caffeinated, constantly in motion.

Every card in every deck in every installation passed through a keypunch first, and every keypunch was operated by a human being pressing keys.

**IBM 024 (1949).** The 024 was IBM's first modern keypunch, replacing earlier electromechanical designs. It had a standard 42-key keyboard laid out like an adding machine keyboard, not a typewriter. The operator read from a coding sheet and pressed keys; the machine punched the corresponding holes in the card in front of the read station, then advanced the card one column. The 024 did not print anything on the card—it just punched holes. Reading back what you had typed required either running the card through a separate interpreter or reading the holes themselves, which experienced operators could actually do by eye after some practice.

**IBM 026 (1949).** Introduced alongside the 024 in the same year, the 026 was the 024 plus a printing mechanism. As you punched each column, a tiny embossed typebar printed the character above the column at the top edge of the card. Printing slowed the machine down (maximum effective speed dropped from about 20 characters per second on the 024 to about 15 on the 026), but the payoff was huge: a human could read the card without running it through a separate machine. This made the 026 the dominant keypunch of the 1950s. Every programmer, every data-entry clerk, every scientist submitting a FORTRAN deck spent hours in front of an 026.

**IBM 029 (1964).** The 029 was the System/360 companion keypunch. It used the expanded EBCDIC character set (see §3 for the 026 vs 029 distinction). It was faster, quieter, and had a more typewriter-like keyboard layout. The 029 became the standard keypunch of the mid-1960s through the 1970s.

**IBM 129 (1971).** The 129 was the first keypunch with a buffer. Instead of punching each key press immediately into the card, the 129 stored up to 80 characters in an electronic buffer and only punched the card when the operator hit the release key. This let the operator backspace and correct errors before committing the card to paper. It was a revelation: the first time a data-entry operator could type freely without fear of wasting a card. The 129 also included a small program memory for automatic field skipping. It was the last great keypunch, and it arrived just as the terminal was about to kill the whole category.

**Physical design of the keypunch.** Every IBM keypunch followed the same basic layout. You sat at a desk-height machine roughly 50 inches wide and 30 inches deep. In front of you was a keyboard. Above the keyboard, recessed into a slanted panel, was the **card bed**: a narrow channel about 8 inches long where the card traveled from right to left past the **punch station** and then the **read station**. On the right side of the card bed was the **card hopper**, a vertical slot holding 400-500 blank cards fed by gravity and a weighted pressure plate. On the left side of the card bed was the **stacker**, a second vertical slot that caught finished cards in order.

When you loaded the hopper with blanks, pressed the feed key, and began punching, the machine physically clawed one card out of the hopper, registered it at column 1 under the punch head, advanced it one column for every key press (the punch itself was a bank of 12 metal punches that struck the card against a die with a characteristic "chunk"), and eventually pushed it past the read station and into the stacker.

The read station was used for duplication: if you put a previously-punched card in the read bed, you could duplicate its contents into the new card automatically.

**The drum card (program card).** The most sophisticated feature of the 026 and 029 was the **drum card** or **program card**. You wrapped a punched "program card" around a removable drum on the left side of the keypunch. Holes in specific columns of the program card told the machine how to treat each column of the cards being punched: which columns were alphabetic fields (shift to letters), which were numeric (shift to digits), which should be automatically skipped, which should be automatically duplicated from the previous card. A well-programmed drum card could dramatically speed up repetitive data entry. If your job was to punch a thousand employee records where columns 1-5 were employee number, 6-30 were name, and 31-35 were pay rate, the program card could skip or duplicate the fixed fields, shift modes automatically, and reduce your key press count by 60%. Changing program cards was a small ritual: unlock the drum cover, peel off the old program, wrap the new one tight, tab the ends together, lock the cover. Programming the drum card was its own skill.

**Capacity.** A skilled 026 operator could punch about 8,000 to 10,000 key presses per hour sustained, which corresponded to perhaps 100 to 150 cards per hour on dense alphanumeric data. A less experienced operator or more complex data might drop to 40-60 cards per hour. A data center running three shifts of 20 keypunch operators could punch roughly 60,000-90,000 cards per eight-hour shift. The keypunch pool was often the largest single room in a data processing department.

### 7. The Verifier

Typographical errors in keypunched data were a nightmare for downstream processing.

A single wrong digit in a payroll record meant someone's check was wrong.

A single wrong digit in a FORTRAN program meant your job came back from overnight with a cryptic error message and another 24 hours of wall-clock time before you could try again.

The solution IBM developed was not spell-check.

It was to make two humans type the same data independently and compare their work.

**IBM 056 (1949).** The 056 was the verifier companion to the 024/026 keypunches. It looked nearly identical—same desk, same keyboard, same card bed—but instead of punching holes, it compared the key pressed by the operator against the holes already in the card sitting at the read station. If the key matched the existing punch, the machine advanced to the next column. If the key did *not* match, the machine locked up, a red light came on, and the operator had to resolve the discrepancy.

The workflow: operator A punches a deck on an 026.

Operator B then runs the same deck through a 056, typing the exact same data from the same coding sheet.

Any time B's key press disagreed with A's punches, the 056 locked.

B checked the coding sheet, decided which version was correct, and either accepted A's version (by hitting a release key) or corrected the card (by switching to punch mode and repunching).

**IBM 059 (1964).** The 059 was the 029-era verifier. Same principle, updated mechanics, EBCDIC character set, quieter.

**The verification notch.** When a card passed verification without errors, the verifier cut a small notch in the *right edge* of the card, near the top. This was called the **OK notch** or **verification notch**. A quick visual inspection of a deck—literally looking at the right edge of a stacked deck—showed which cards had been verified: the verified cards had a visible notch along the edge, forming a nearly continuous groove down the side of the deck. Unverified cards showed as flat spots in the groove. An operator could see at a glance whether a deck had been fully verified without running it through anything.

Verification doubled the labor cost of data entry—you needed two operators per batch—but it caught the overwhelming majority of typos.

For critical applications (payroll, taxes, accounts receivable, medical records) verification was mandatory.

For scientific programming it was usually skipped; the programmer was the keypunch operator and the feedback loop was running the program.

### 8. The Sorter

A sorter takes a deck of cards and separates them into pockets based on a single column.

Sorters were the workhorses of card-based data processing.

If you wanted to produce a report sorted by employee number, you ran your deck through the sorter once per digit, from the rightmost column to the leftmost.

**IBM 082 (1949).** The 082 sorter was a three-foot-wide steel box with a card hopper on one end, 13 numbered pockets along the top, and a row of indicator lights. You loaded a deck, set a dial to select which column to sort on, pressed the start button, and the sorter—at a remarkable 650 cards per minute—fanned the deck into the pockets. Each card went into the pocket corresponding to whichever row was punched in the selected column. A card with row 0 punched went into pocket 0. A card with row 5 punched went into pocket 5. A card with no punch in the column went into the **reject pocket**.

**The radix sort.** Sorting a deck by a multi-column field required running the deck through the sorter once per column, starting with the *rightmost* (least significant) column and working leftward. After each pass, you stacked the pockets back together in order (0 on top, 9 on bottom... actually, the ordering convention varied; careful operators had their preferred stacking order memorized). After the last pass on the most significant column, the deck was sorted. This is a physical implementation of radix sort, and it was the original reason computer scientists bothered to study radix sort: it was the sort their data processing colleagues used every day.

A five-digit employee number required five passes.

A ten-digit account number required ten passes.

A 20-column alphabetic name field required 40 passes (each column needed two passes because alphabetic sorting required first sorting on the zone punch, then on the digit punch).

Sorting a 10,000-card deck on a 20-column name field could easily take two hours of machine time and most of an operator's afternoon.

**IBM 083 (1955).** Faster version of the 082, rated at 1,000 cards per minute.

**IBM 084 (1959).** Still faster, up to 2,000 cards per minute, with improved jam detection and a paper-dust extraction system because at 2,000 cards per minute the card edges generated visible clouds of paper fiber.

Sorters were the loudest machines in the data center after the printers.

The sound of a sorter running full speed was a rapid mechanical chatter, like an enormous card shuffler crossed with a small machine gun.

Operators wore no hearing protection in the 1950s.

By the 1970s, OSHA regulations were starting to push installations toward ear protection in sorter rooms.

### 9. The Collator

If the sorter was the workhorse, the collator was the clever cousin.

A collator reads two decks of cards simultaneously and merges, matches, or selects records based on comparisons between columns in each deck.

**IBM 085, 087, 088.** The 085 was the first major postwar collator. The 087 and 088 were upgraded versions in the System/360 era. A collator had two card hoppers (usually called "primary" and "secondary" feeds), two reading stations, four or five output pockets, and a comparison unit. You wired its plugboard (see §12) to specify which columns to compare and what to do when the comparison produced equal, higher, or lower results.

A typical collator job was **match-merge**: given a master file deck (sorted by account number) and a transaction file deck (also sorted by account number), merge the transactions into their proper positions in the master file.

The collator read the primary and secondary feeds simultaneously, compared account numbers, and routed cards to the output pockets:

- Master card = transaction card: both to pocket 1 (matched records)
- Master card < transaction card: master to pocket 2 (unmatched master)
- Master card > transaction card: transaction to pocket 3 (unmatched transaction, possibly an error)

At the end of the run, you had four pockets of sorted, classified output that could feed directly into the next step of the workflow.

Collators could process 650-1,600 cards per minute depending on the model.

They were the database JOINs of 1950s data processing.

### 10. The Reproducer

A reproducer copies cards.

At its simplest, it reads a card from one hopper and punches an identical card into another hopper.

But reproducers could do much more, and in practice they were utility machines that handled half a dozen specialized tasks.

**IBM 513 (1939) and 514 (1949).** The 513 and 514 were the classic reproducing punches. They could **duplicate** a deck (useful for making backups), **gang-punch** fixed information into blank cards (useful for adding a batch date or invoice number to a whole box of blanks), **summary-punch** totals coming from an accounting machine (the 407 could feed its running totals out to a 519 to produce a summary card), and **mark-sense read** pencil marks made on special cards and convert them to punches.

**IBM 519 (1949).** The 519 added an **interpreter** function: it could read the holes in a card and print the corresponding characters on the top edge of the card (for older cards that had been punched on a 024 without a printing mechanism, or for cards that had been machine-generated by other equipment that didn't print). An entire secondary industry of "interpretation" existed just to run old or machine-generated decks through a 519 so that humans could read them.

### 11. The Accounting Machine

The accounting machine is where you stop calling things "unit record equipment" and start getting close to calling things "computers." An accounting machine reads a deck of cards, performs arithmetic on selected columns, and prints a formatted report on a wide continuous-form paper.

In 1935, this was the state of the art in business data processing.

In 1955, in thousands of companies, it still was.

**IBM 402 (1948).** The 402 was a full-size accounting machine with a 43-column arithmetic unit, a 120-position print mechanism, and a massive plugboard. It read cards at about 80 per minute, printed at about 100 lines per minute, and could produce invoices, payroll registers, inventory reports, general ledger postings, and almost any other tabular business document. It occupied a footprint of about 5 feet by 3 feet and weighed close to 1,400 pounds. The printing mechanism alone was a marvel: a bank of 120 typebars, one per print position, each independently controlled by the plugboard to print digits, letters, or special characters on demand.

**IBM 403 (1949).** An upgrade of the 402 with a wider print mechanism (120 positions, with improved alphabetic capability) and faster card reading.

**IBM 407 (1949).** The 407 was the king of accounting machines. It could read 150 cards per minute, print 150 lines per minute, perform arithmetic on multiple 16-digit accumulators, handle both alphabetic and numeric data with equal facility, and support complex plugboard programs that could take a skilled wireman days to plan. The 407 stayed in IBM's catalog until 1976. Installations that had 407s often kept them running even after they had System/360 mainframes, because the 407 was simpler, cheaper to operate, and perfectly adequate for routine jobs. The 407 is the machine that was still printing payroll checks in factory back offices well into the 1970s.

An accounting machine did not have a stored program. Its "program" was the plugboard.

### 12. The Plugboard

Unit record equipment—sorters, collators, reproducers, accounting machines—was not programmed by writing code. It was programmed by **wiring a plugboard**.

A plugboard (also called a "control panel" or "wire-wrap panel") was a removable rectangular panel, typically about 18 inches by 12 inches, studded with hundreds of small brass sockets arranged in a grid.

Each socket corresponded to a specific logical or physical element of the machine: one socket was "card column 15, row 3 read pulse," another was "accumulator 2 input digit 0," another was "print position 42 trigger." By running insulated wires between sockets, you connected the inputs of the machine (what it read from cards) to its arithmetic elements and to its outputs (what it printed or punched).

A simple program might need a dozen wires.

A complex monthly accounting run might use 300 or 400 wires, densely packed, with wires crossing over and under each other in a rats-nest that only the person who wired it could understand.

Wires came in standardized lengths (6 inch, 9 inch, 12 inch, 18 inch, 24 inch) and colors (for the wireman's sanity).

A well-wired plugboard looked like a carefully cultivated hedge.

A poorly wired board looked like a dropped pile of spaghetti.

Either way, when you finished, you slid the board into the machine, latched it in place, fed your deck into the hopper, and pressed start.

If it worked, you ran your job.

If it didn't, you pulled the board back out and started debugging by tracing wires.

**The social role of the plugboard wireman.** In the 1950s, the person who wired plugboards was often the most technically skilled employee in an installation. They understood the machine at a level that programmers of later eras did not need to understand computers. They could trace a failure from a wrong number on the output report back to a specific miswire in a specific socket. They kept notebooks of wiring diagrams for standard jobs—payroll, invoicing, general ledger—that were treated as proprietary intellectual property. Some installations had entire libraries of pre-wired plugboards, each labeled and stored like a book, pulled from the shelf when the matching job needed to run.

When stored-program computers arrived, plugboard wiring did not immediately die.

It persisted for another two decades in smaller installations, because a 407 with a wired plugboard was cheaper, simpler, and faster-to-deploy than a stored-program computer for many routine jobs.

The last plugboard-programmed machines in regular production use held on into the late 1970s.

The plugboard is sometimes described as the ancestor of the wire-wrap prototyping board, the PCB, and the FPGA.

It is worth pausing to register that the original meaning of "program" in commercial data processing was literally a physical arrangement of wires.

When programmers later started "writing" programs, the word was a metaphor imported from the older meaning.

---

## Part 3: Card Readers for Computers

### 13. IBM 711 and 714

When stored-program computers arrived in the early 1950s, they needed a way to get data in.

The card reader was the obvious answer: card decks already existed everywhere in the business world, and an installation upgrading from a 407 to a 701 could bring its existing workflows along mostly unchanged.

**IBM 711 (1952).** The 711 was the card reader for the IBM 701, IBM's first commercial scientific computer. It read 150 cards per minute, approximately one card every 400 milliseconds. It used brush contacts to detect punches: a bank of 80 metal brushes swept across the card, completing an electrical circuit wherever a hole let the brush touch a roller beneath the card. Each card generated a burst of 80 parallel signals, which the 701 CPU interpreted as a row of the card.

**IBM 714 (1955).** The 714 was the card reader for the IBM 704 and 709. It read 250 cards per minute, which was considered fast for its era. Like the 711, it used brush contacts, but the mechanical design was improved for faster throughput and fewer jams. Many 714s stayed in service into the early 1960s.

These early readers had what we would now call bad ergonomics.

The operator stood next to the reader to load cards, watch for jams, and clear the output stacker.

A full card reader during a big batch job was a demanding post.

### 14. IBM 1402 and 1442

The System/360 era brought much faster card readers.

**IBM 1402 (1959).** The 1402 was the card reader/punch for the IBM 1401 mainframe, one of the best-selling computers of the 1960s (the 1401 sold more than 12,000 units). The 1402 read 800 cards per minute and could punch 250 cards per minute, all in one integrated unit the size of a small refrigerator. It was built to be chained directly to the 1403 line printer, forming a complete card-to-print pipeline: read a card, compute something, print a line. The 1402/1403/1401 combination was the workhorse of small and medium installations throughout the 1960s. Thousands of business programs were written specifically to the 1401+1402+1403 architecture.

**IBM 1442 (1963).** The 1442 was a smaller, cheaper card reader/punch designed for the IBM 1440 and later as a utility device for the System/360. It read 300-400 cards per minute and punched 80-160 cards per minute. The 1442 was often used as a secondary reader or as the primary I/O device for small batch jobs.

### 15. IBM 2501 and 2540

The System/360 mainline got its own family of card readers.

**IBM 2501 (1965).** The 2501 was a read-only card reader. It came in two speeds: the 2501 Model B1 at 600 cards per minute, and the 2501 Model B2 at 1,000 cards per minute. The 2501 was the standard card input device for smaller System/360 configurations.

**IBM 2540 (1965).** The 2540 was the System/360's high-end card reader/punch. It could read 1,000 cards per minute and punch 300 cards per minute, simultaneously. The 2540 had two input hoppers and five output stackers, with a complex mechanical system for routing cards based on control signals from the CPU. It was one of the most sophisticated electromechanical devices IBM ever built in the card-handling category, and it was the reader of choice for large commercial mainframe installations.

The 2540 was also one of the loudest pieces of equipment in the machine room.

A 2540 running at full speed had a distinctive high-frequency mechanical scream from the card transport, punctuated by the heavy thud of cards landing in the stackers.

Operators near a 2540 talked loudly and learned to read lips.

### 16. Card Jams

No card reader ran without jams.

Jams were the defining operational reality of card-based I/O.

A card reader's published "cards per minute" rating was a best-case number that assumed zero jams.

In practice, a large batch job might see a jam every 5,000-10,000 cards.

A bad deck—damaged, warped, coffee-stained, stapled, corner-torn—could jam every few hundred cards.

**What caused jams?** Almost everything. A card with a bent corner would catch on the feed gate. A card with a coffee stain would stick to the next card in the feed. A card that had been run through a reader before and acquired a static charge would cling to its neighbors. A card with a stapled-on note (people sometimes stapled comments to their decks, a deeply frowned-upon practice) would tear in half when the feed mechanism tried to move it past the read station. A card with moist edges from a humid data center would swell slightly and jam the stacker. A card with a chip of paper hanging off a punch position could catch in the brush mechanism and tear.

**Clearing a jam.** The operator stopped the reader, opened the top cover, gently extracted the jammed card (often in pieces), inspected the card path for fragments, closed the cover, re-registered the deck, and restarted the run. A good operator could clear a jam in 30-60 seconds. A bad jam—where card fragments had worked their way into the brush assembly—could take 15 minutes or more and might require calling a field engineer.

**The damaged card log.** Installations that ran large batch jobs kept a "damaged card log" where operators recorded which cards had caused jams, which decks had excessive jam rates, and which operators had submitted problem decks. Chronic jam offenders got politely asked to handle their cards more carefully, keep them dry, and not staple anything to them ever.

**The torn-card repair kit.** When a card tore in half, it had to be reconstructed. Most installations kept a small kit for this purpose: a **card-duplicating punch** (often just a keypunch used in duplicate mode), a roll of transparent tape, and a pair of tweezers. If the torn halves were legible, the operator taped them together, ran the taped card through a duplicator to produce a clean replacement, and destroyed the taped original. If the halves were not legible, the operator had to go back to the source (the coding sheet, the original data entry record, the programmer) and have the card repunched.

---

## Part 4: The Data Center

### 17. The Physical Layout

A 1960s corporate data center was a specific kind of room.

It did not look like an office.

It did not look like a factory.

It looked like a cross between a hospital laboratory and a telephone exchange.

**The raised floor.** Most data centers had a **raised computer floor**—modular square tiles (typically 2 feet by 2 feet) suspended on adjustable steel pedestals about 12 to 18 inches above the structural concrete slab. The space under the floor was used to route the enormous bundles of power cables, signal cables, and chilled water lines that connected the various pieces of equipment. A raised floor also let cold air be pumped up from below through perforated tiles positioned in front of the hottest equipment. The floor tiles were removable with a special suction-cup lifting tool; every data center kept one by the door.

The raised floor generated its own folklore.

Lost items fell into it.

Coins, pens, paper clips, keys, staples, ID badges—anything dropped on the floor had a tendency to slip through the hairline gaps between tiles and vanish into the under-floor plenum.

Periodic floor cleanings turned up years of accumulated debris.

Operators told stories of finding coffee cups, wristwatches, and in one famous case (recounted in several IBM histories) a live mouse.

**The zones of the room.** A typical mainframe data center had several distinct zones:

1.

**The keypunch room.** Usually a separate room because of the noise.

Twenty or more keypunches running simultaneously produced a loud, constant percussion of clacking keys and punch strikes.

Keypunch rooms often had their own air conditioning because of the body heat of 20-40 operators and the thermal load of the machines.
2. **The job submission counter.** A window or half-door where programmers dropped off their decks and picked up their printouts. Typically staffed by a clerk with a log book.
3.

**The operator's console area.** Near the main CPU.

Contained the system console (a typewriter terminal or later a CRT), a rack of operator manuals, and usually a clipboard of the current job queue.
4. **The tape library and tape drives.** Racks of half-inch magnetic tape reels in round tape cases, and a row of tape drives where operators mounted the tapes needed for the current jobs.
5. **The card reader line.** One to several card readers in a row, each with a stacker loaded and an input hopper being fed.
6. **The printer area.** One to several line printers, usually at the far end of the room because they were the loudest. The operator kept printers supplied with paper and ribbon.
7. **The machine room proper.** The CPU, memory cabinets, disk drives, and associated control units. Usually a fenced-off area with a "no unauthorized personnel" sign.
8. **The output distribution area.** A set of pigeonhole slots where finished printouts were filed by job owner, waiting for pickup.

The whole room was kept at 68 to 72 degrees Fahrenheit with humidity controlled to around 45-55% to prevent static electricity from zapping sensitive components and to prevent card stock from swelling or drying.

The air conditioning alone consumed as much power as a small apartment building.

### 18. The Operators

Operators were not programmers. Operators were not analysts. Operators were a specific job category with specific duties: they kept the machines running.

An operator's duties included: loading card decks into the readers, mounting tape reels on drives, mounting disk packs on drives, feeding paper into printers, changing printer ribbons, clearing card jams, clearing paper jams, responding to console messages, logging completed jobs, distributing printouts to the output bins, handling night-shift emergency callouts, and calling the field engineer when something broke that was beyond their training to fix.

Operators typically worked three shifts: day (8am-4pm), evening (4pm-midnight), and graveyard (midnight-8am).

A large installation might have 4-6 operators per shift.

The graveyard shift was usually the lightest-staffed and was often the shift when the biggest batch jobs ran (because the machines were otherwise idle, and because the heat load at night was lower so the machines ran cooler and faster).

Becoming an operator did not require a college degree.

Most operators in the 1950s-1960s were trained on the job from high school graduates.

IBM and competing vendors ran operator training schools that graduated operators with certificates after 4-12 weeks.

The job was physically demanding, moderately skilled, and paid better than most clerical work but less than programming.

It was also, for many people, the on-ramp to a programming career: operators who took night classes in FORTRAN or COBOL could move up into programming jobs, and many of the first generation of commercial programmers came up through the operator pipeline.

### 19. Women in the Data Center

The keypunch operators who punched the cards that fed the machines were, in the overwhelming majority, women. This was a specific historical pattern that deserves to be recorded clearly.

In the 1920s, when Hollerith-style tabulators first spread to insurance companies, banks, and government agencies, data entry on the early keypunches was classified as "clerical" work.

In the gendered labor market of the time, clerical work was women's work.

By the 1930s, keypunch operator was a predominantly female occupation in the United States and Western Europe.

The pattern persisted for the next fifty years.

Photographs of keypunch rooms from the 1950s show rows of women in dresses, hair pinned up, operating 026s in unison, with the occasional male supervisor walking between the rows.

**World War II and WRENS.** During World War II, the Bletchley Park codebreaking effort in the UK employed thousands of women from the Women's Royal Naval Service (WRNS, universally called "Wrens") to operate the Colossus computers and the Bombe machines used to break Enigma and Lorenz ciphers. Many of the Wrens had no idea what the machines were for. They knew only that their job was to run the machines, follow the procedures, and keep quiet. The secrecy surrounding Bletchley Park meant that their role was not publicly acknowledged until the 1970s. Much of the early operational experience of running large computing installations was held by women who were forbidden to talk about it.

**Grace Hopper.** Grace Brewster Murray Hopper (1906-1992) was a Yale PhD in mathematics who joined the U.S. Navy Reserve in 1943 and was assigned to the Harvard Mark I computer project. Hopper became one of the first three programmers of the Mark I, wrote its original 500-page operating manual, and went on to develop the first compiler (the A-0 system, 1952) and lead the standardization of COBOL. She stayed in the Navy until 1986 and retired as a Rear Admiral. Hopper's career is an existence proof that the women in early computing were not confined to operator roles; many were scientists, mathematicians, and engineers who happened to enter the field when it was still too new to have firm gender boundaries.

**The ENIAC programmers.** The ENIAC, completed in 1945 at the University of Pennsylvania, was "programmed" by physically rewiring its plugboard-like patch panels—a process more like wiring a telephone exchange than like writing code. The six original ENIAC programmers were all women: Kay McNulty, Betty Jennings, Betty Snyder, Marlyn Meltzer, Fran Bilas, and Ruth Lichterman. They had been hired during the war as "computers"—the word originally referred to human beings, usually women, who performed mathematical calculations by hand for the Army's ballistics tables. When ENIAC was built to automate their work, they transitioned from computing by hand to programming the new machine. They developed the original techniques of stored-program debugging, flowcharting, and subroutine libraries. Their contributions were largely uncredited at the time and only fully acknowledged in the 1980s and 1990s.

**The decline.** As programming became more prestigious and higher-paid in the 1960s and 1970s, the field shifted from majority-female to majority-male. The percentage of women in U.S. computer science peaked around 1984 at about 37% and declined steadily afterward. But in the punch-card era, from 1920 through the 1970s, the data center was a workplace where women were not just present but essential—and where most of the actual information entered into every machine passed through women's hands.

### 20. The Noise

A working data center in 1962 was not quiet. The sound was layered and continuous:

- The **card readers** produced a rapid mechanical chatter, like a wooden ruler being drawn across a picket fence at high speed, punctuated by the heavy thumps of cards landing in the stackers.
- The **keypunches** in the next room produced a steady rhythm of key presses and punch strikes, like a large army of typewriters all being used by people who typed fast.
- The **sorters** produced a high-speed fluttering sound, like a deck of cards being shuffled by a machine that never stopped.
- The **line printers** produced the characteristic hammer-strike of a chain printer or the rapid drum-strike of a drum printer, at roughly 1,100 lines per minute for an IBM 1403 chain printer—about 18 lines per second, each line an impact.
- The **tape drives** produced a low whirring punctuated by sudden high-speed rewinds that sounded like jet engines spinning up and then abruptly stopping. When a tape drive did a fast rewind on a full 2,400-foot reel, the sound was unmistakable and audible throughout the room.
- The **disk drives** (when they arrived with the IBM 1301 in 1961 and later the 2311 and 2314) added a low aerodynamic hum and the occasional mechanical clunk of head seeks.
- The **air conditioning** was the loudest steady sound in the whole room, running constantly at a volume that made casual conversation difficult and phone calls nearly impossible. Large installations had air handlers mounted on the roof with ducts the size of subway tunnels feeding the under-floor plenum.

A measurement taken at a typical corporate mainframe installation in the late 1960s (cited in early ergonomics literature) estimated ambient noise at 78 to 85 dBA at operator workstations, with peaks above 95 dBA near the printers.

That is roughly the noise level of a busy restaurant or a vacuum cleaner, sustained for an entire shift.

Operators commonly developed mild hearing loss over long careers.

Hearing protection in data centers was rare before the mid-1970s and became standard only after OSHA workplace noise regulations took effect in 1971.

### 21. The Smell

The smell of a punch-card data center was distinctive and is remembered by everyone who worked in one.

- **Paper dust.** Every card reader, sorter, collator, and printer threw off fine paper dust from the edges of cards and continuous forms. The dust settled on every horizontal surface, accumulated in the air conditioning filters, and produced a dry, slightly sweet paper smell throughout the building.
- **Machine oil.** The lubricants used on bearings, transport belts, and sliding mechanisms had their own light petroleum smell. Operators who spent time inside the machines clearing jams picked up the smell on their hands and clothes.
- **Ozone.** Relays and brush-based readers generated small amounts of ozone from electrical arcing. The smell was most noticeable near the relay banks of the older unit record equipment (the accounting machines, the sorters, the collators) and near the large relay cabinets of early stored-program computers. Ozone has a sharp, metallic, slightly chlorinated smell, often associated with the smell of thunderstorms. A room full of aging 1940s electromechanical equipment smelled faintly of ozone at all times.
- **Overheated tubes.** The very earliest machines (ENIAC, UNIVAC I, IBM 701, IBM 702) used vacuum tubes in the thousands. Vacuum tubes ran hot, and their glass envelopes, phenolic sockets, and waxed paper capacitors all contributed to a particular smell of warm electronics that older engineers described as "vacuum tube smell"—something between hot dust, warm rosin, and slightly toasted cardboard. When a tube was failing, the smell grew sharper and sometimes acquired a burnt-plastic note. A nose trained on the smell could diagnose a failing tube before the diagnostic lights did.
- **Carbon paper and ribbons.** Line printer ribbons were carbon-impregnated fabric, and continuous forms often had carbon paper interleaved between multi-part copies. The carbon had a dry, chalky, slightly inky smell.
- **Cigarette smoke.** Until the mid-1980s, smoking was permitted in most data centers. Operators smoked at their consoles. Programmers smoked at the coding tables. The combination of cigarette smoke, paper dust, and ozone produced a very specific background atmosphere that is almost impossible to reconstruct today. People who worked in data centers for years carried the smell home in their clothes.

---

## Part 5: The Dominance Years (1950s-1970s)

### 22. Scale

The raw numbers of the punch card industry are easy to underestimate.

- By 1937, IBM had produced an estimated 5 to 10 billion cards for the U.S. Social Security Administration alone, to support the newly-established SSN and payroll system.
- By 1950, IBM was manufacturing an estimated **10 billion punch cards per year**, worldwide.
- By the mid-1960s, at the industry peak, the figure is often cited as **25 to 32 billion cards per year** from IBM and perhaps another 5 to 10 billion from competitors.
- At an average card thickness of 0.007 inches, 30 billion cards stacked would form a column more than 3,300 miles tall—more than the distance from New York to Los Angeles.
- At an average weight of 0.8 grams per card, 30 billion cards weighed about 24,000 tons per year.

The paper came from dedicated card stock manufacturers.

The preferred paper was a specific grade called "Manila" with a weight of about 100 pounds per 500-sheet ream, made from high-quality wood pulp with a tight grain to prevent warping and to give a clean edge when punched.

IBM had long-term contracts with paper mills in the American South and in Canada to supply card stock.

In some years, card stock accounted for a measurable fraction of the U.S. paper industry's total output.

Entire forests were cut and pulped for punch cards.

### 23. IBM's Punch Card Monopoly

Punch cards were IBM's cash cow.

The machines were leased to customers under long-term contracts, but the cards themselves were consumable—a customer who leased an IBM 407 had to buy new blank cards continuously to feed it.

IBM sold cards at margins that, according to later antitrust investigations, ranged from 300% to 700% of manufacturing cost.

The cards alone generated an enormous, stable revenue stream.

Competitors—Remington Rand (which had acquired the Powers tabulating machine business in 1927), Burroughs, and smaller firms—manufactured their own card formats that were deliberately incompatible with IBM's.

A Powers tabulator used round holes in a different position grid.

A Remington Rand UNIVAC machine used its own 90-column card format.

This incompatibility was sometimes framed as technical preference and sometimes as defensive patent strategy, but the practical effect was that a customer who chose IBM was locked into IBM cards forever, and a customer who chose a competitor was locked into that competitor's cards forever.

**The 1952 antitrust case.** In 1952, the U.S. Department of Justice filed an antitrust suit against IBM alleging, among other things, that IBM was illegally tying the purchase of punch cards to the lease of IBM machines. The case was settled by a consent decree in 1956. Under the decree, IBM agreed to sell its machines (not just lease them) and agreed to license its card manufacturing patents to competitors. The immediate effect was that third-party card manufacturers—a market IBM had effectively monopolized for 40 years—were able to enter legally. Companies like Globe Ticket and Label, Wallace Business Forms, and Uarco began manufacturing IBM-compatible cards at lower prices.

The consent decree did not end IBM's dominance in the card business.

IBM continued to supply most of the cards for most of its customers throughout the 1960s and 1970s.

But it did reduce the margins and introduce price competition, and it established a precedent for government intervention in IBM's business model that would shape later antitrust actions.

### 24. CPU Cost vs Card Cost

A specific illustration of how the economics worked: at 1960 prices, an IBM 1401 mainframe leased for about $2,500 per month ($30,000 per year).

A single IBM 5081 punch card cost roughly $1 to $1.50 per thousand, depending on volume and vendor.

A large installation processing 30 million cards per year on a 1401 would spend $30,000 to $45,000 per year on cards alone—as much as the lease of the computer itself.

Over the ten-year typical life of an installation, the cards cost more than the computer.

This is why the card business was so profitable and so strategically important. It was not the machines. It was the recurring consumable revenue that underwrote the entire data processing industry.

### 25. Library Punch Cards

Not all punch cards were 80-column IBM cards.

A parallel tradition used a different, simpler format: the **edge-notched card**, also called the **McBee card** or **library card**, used for manual information retrieval.

An edge-notched card was typically about 5 by 8 inches and had a row of small holes punched around its entire perimeter.

Each hole represented a category or attribute.

To encode a record, you wrote the information in the center of the card and then, with a simple hand punch (the McBee Keysort hand punch), clipped the edge open at the holes corresponding to the attributes the record had.

To search a stack of edge-notched cards, you stuck a long needle through the stack at the position of the attribute you wanted, lifted the needle, and the cards matching that attribute (because their hole had been clipped open) fell out of the stack while the non-matching cards remained speared on the needle.

This is a physical implementation of bit-vector indexing.

It required no machinery and worked on hundreds or thousands of records per search.

Edge-notched cards were used extensively in libraries, medical records, patent searches, and any application where a small office needed to retrieve records by attribute but could not justify the expense of a tabulating machine.

The most famous product line was the **McBee Keysort** system, sold from the 1930s into the 1980s.

Every small library and most research offices in the mid-20th century had a stack of McBee cards in a drawer somewhere.

This is a different tradition from the IBM punch card, but it is part of the same conceptual family, and the two systems coexisted for fifty years.

### 26. IBM 5081

IBM's standard blank 80-column card was catalog number **5081**.

An IBM 5081 card was a plain cream-colored 80-column card with printed column and row legends and the IBM logo in the upper-right corner, sold in boxes of 2,000 cards.

The 5081 was the generic default: you ordered 5081 when you wanted blank cards.

Variants (5082, 5083, etc.) had different pre-printed field legends for specific applications.

The 5081 is still manufactured. As of this writing (2026), a handful of specialty vendors still sell blank IBM 5081 cards in small quantities, primarily for the following markets:

- **Museum exhibits and restoration projects.** The Computer History Museum, the IBM archives, and private collectors who operate restored 1950s-1960s hardware need authentic card stock.
- **Hobbyist and demoscene projects.** A small but real community of enthusiasts builds and operates replica punch card equipment for demonstration and education.
- **Art projects.** Punch cards have become a recurring motif in visual art and print design, partly because the format is instantly recognizable and partly because the cards themselves photograph well.
- **Novelty and nostalgia items.** Printed wedding invitations, business cards, and similar items occasionally use 5081 blanks as substrate for the unmistakable retro effect.

A box of 5081 cards that sold for $5 in 1965 (roughly $50 in today's dollars) now sells for upwards of $200 per box from specialty vendors, which represents a more than 4x real price increase over 60 years.

The cards have become rarer than the computers they once fed.

---

## Part 6: The Physical Rituals

### 27. The Drop

Ask anyone who worked with punch cards in the 1960s or 1970s about their worst day, and you will hear about dropping their deck.

The scene: you are walking from the keypunch room to the submission window with a full box of 3,000 cards containing the FORTRAN source and input data for your PhD thesis.

The rubber band you wrapped around the deck is a year old.

As you turn the corner by the coffee machine, the rubber band dries out, snaps, and your entire deck fans across the linoleum floor of the corridor.

You watch your year of work slide under the vending machine and spread out in a slick arc of paper.

The deck is not destroyed.

Every card is still intact and still readable.

But the *order* is gone, and the order is the program.

A FORTRAN program in 1970 consisted of roughly one card per line of source code.

A 3,000-card deck was a 3,000-line program, and those lines had to run in the exact sequence they had been written in.

A scrambled deck could not be re-sorted unless every card had an identifying sequence number—and even then, you had to put the cards back through a sorter to reorder them.

**Sequence numbers in columns 73-80.** This is why, in the Hollerith-era conventions that FORTRAN inherited, **columns 73-80 of a FORTRAN source card were reserved for a sequence number**. The FORTRAN compiler ignored columns 73 onward; they were not part of the program. But they were the programmer's insurance policy. If you numbered your deck 10, 20, 30, 40 (leaving gaps so you could insert new cards later as 15, 25, etc.), a dropped deck could be reassembled by running it through a sorter on columns 73-80. A sorter could restore the correct order of a 3,000-card deck in about 20 minutes of machine time.

This is why experienced programmers never punched a new deck without first punching sequence numbers.

The overhead was trivial (the keypunch could auto-increment sequence numbers in duplicate mode), and the insurance was priceless.

Dropping a deck that had not been sequence-numbered was a disaster.

Dropping a deck that had been sequence-numbered was merely an inconvenience.

The word "sorted"—as in "the list is sorted"—entered everyday computing vocabulary partly through this workflow.

The reason you sort a list is the same reason you sort a dropped card deck: to put it back in the order it needs to be in to work.

### 28. Blowing Your Stack

Modern programmers say "blowing the stack" to mean a stack overflow in memory. The original physical meaning of the phrase was somewhat different.

Card readers used vacuum belts or weighted pressure plates to feed cards out of the hopper and into the reader.

At the output end, cards dropped into a stacker where they were supposed to land in order, face-down, against a pressure plate.

If the vacuum belt failed, if the output stacker gate jammed, or if a card caught a corner and tumbled sideways, the reader would sometimes eject cards at full speed—several cards per second at 1,000 CPM—out of the stacker and into the air.

When this happened, cards flew across the room.

A high-speed reader in a failed stacker event could launch a stream of cards six to ten feet from the machine in a few seconds.

Operators described it as "blowing your stack"—the stack (the output stacker) had blown (had expelled its contents explosively).

After a stack-blow, cards were scattered across the data center floor, sometimes in hundreds.

Recovering them was often impossible to do in the original order, which meant re-reading the source deck from scratch.

The phrase migrated into general computing vocabulary when stack-based languages started appearing in the 1950s, and "blowing the stack" came to mean any catastrophic overflow of a data structure.

But the original meaning was entirely physical, and it referred to a specific spectacular failure mode of a mechanical card reader.

### 29. The Coding Sheet

Before keypunching, you wrote code on a **coding sheet**: a paper form, typically 8.5 by 14 inches, pre-printed with 80 columns numbered 1 through 80 across the top, and 20 to 40 rows numbered down the side.

Each row represented one punch card.

You wrote one character per column box, laboriously filling in the program by hand.

FORTRAN coding sheets had color-coded columns to remind the programmer of the language's column conventions: columns 1-5 were the statement label field (yellow or green background), column 6 was the continuation field (often red), columns 7-72 were the statement field (white), and columns 73-80 were the sequence number field (yellow or gray).

A programmer wrote the program by hand on the coding sheet, checked it carefully, and then carried the sheet to the keypunch room to be punched.

Some installations had dedicated keypunch operators who took coding sheets from programmers and punched them on behalf of the programmer.

Other installations—especially scientific and academic ones—had programmers punch their own cards.

The workflow shaped the culture: in the first model, the programmer and the keypunch operator were separate roles, and the programmer was always waiting; in the second model, the programmer was self-sufficient but spent a large fraction of the workday keypunching.

Coding sheets became artifacts in their own right.

Careful programmers kept them as documentation of the program.

When the program needed to be modified later, you could update the coding sheet and know exactly which cards to re-punch.

A well-maintained coding sheet archive was the closest thing a punch-card shop had to source control.

### 30. The Submission Window

At most corporate and academic installations, programmers did not put their own decks into the reader.

There was a **submission window**: a half-door or counter at the boundary between the user area and the machine room, staffed by a clerk.

You brought your deck to the window.

The clerk logged your job into a paper log book: date, time, your name, job name, expected runtime, priority, special requirements (tapes to mount, special forms, etc.).

You got a small paper receipt with a job number on it.

The clerk placed your deck in the job queue, which was a physical rack of trays sorted by priority.

Operators ran jobs in priority order.

Small, fast jobs might run within an hour.

Larger jobs ran overnight.

The biggest jobs ran over weekends.

Turnaround times in a busy 1960s installation were commonly 2 to 24 hours for routine jobs, and multiple days for large jobs.

Students at universities with shared computers sometimes waited 48 hours or longer for a single batch run.

This turnaround time is almost impossible to convey to anyone who has only used interactive computers.

Imagine writing a program, waiting 24 hours, finding that you had mistyped a variable name, correcting the card, waiting another 24 hours, finding that you had used the wrong FORMAT statement, correcting the card, waiting another 24 hours, and so on.

A simple program that would take an hour to debug today could take weeks of wall-clock time to get running in the card era.

This is the single biggest reason that "structured programming," careful design, code review, and desk-checking became cultural norms in the 1960s: the feedback loop was so slow that you could not afford to discover bugs at runtime.

You had to find them by reading the code before you submitted it.

### 31. The Printout Pickup

Later—hours later, overnight, sometimes days later—you came back to the submission window and asked for your output.

The clerk consulted the log, walked to the output bins, and handed you a folded stack of continuous-form paper: your **printout**.

Printouts were on 14 7/8 inch by 11 inch continuous form paper, greenbar or blue-bar ruled (alternating pale green and white bands, or alternating pale blue and white bands, to make long columns of numbers easier to read by eye).

A single printout could be a few sheets or hundreds of sheets, folded accordion-style at the perforations into a stack.

The printout included:

- A **job control listing** showing the JCL cards you had submitted
- A **source listing** showing your program with line numbers and any compiler error messages
- The **program output** if the program had run successfully
- A **runtime summary** with CPU time used, pages printed, cards read, etc.
- Any **diagnostic dumps** if the program had crashed

You took the printout to a reading table—a long, well-lit table in the user area outside the machine room—and sat down to read it.

You were looking for your bugs.

A good programmer read the entire listing carefully, pencil in hand, before resubmitting.

A careless programmer skimmed the first error message, changed one card, and resubmitted immediately.

The careful programmer usually finished the program in less wall-clock time than the careless one.

Discarded printouts accumulated at these reading tables in drifts.

At the end of each shift, janitors cleared them out and sent them to a paper recycling bin.

Environmental consciousness about paper waste was still decades away; a 1960s programmer generated a shocking amount of paper per program.

### 32. Hollerith, Jacquard, and the Deeper History

The punch card did not begin with Hollerith. The lineage runs back to the beginning of the 19th century, a century before the Tabulating Machine Company existed.

**Jacquard loom (1804).** Joseph Marie Jacquard, a French weaver, introduced a mechanical loom in 1804 that used **punched cards** to control the pattern of the weave. Each card in a Jacquard loom encoded one row of the woven pattern: holes in the card determined which warp threads were lifted and which were lowered as the shuttle passed. A long chain of cards, strung together in sequence, produced an entire woven image. Jacquard looms could produce silk brocades and tapestries of astonishing complexity—portraits, landscapes, religious scenes—entirely through the mechanical action of the punched cards. The most famous Jacquard-woven image is probably the 1839 silk portrait of Jacquard himself, woven from a program of about 24,000 cards. Charles Babbage owned a copy of this portrait and showed it to visitors as an example of the power of programmed mechanical computation.

**Babbage's Analytical Engine (1830s-1840s).** Charles Babbage, the English mathematician, designed the Analytical Engine beginning in 1834 as a mechanical general-purpose computer. The Analytical Engine was never fully built in Babbage's lifetime, but its design was complete enough to demonstrate that Babbage had understood the essential architecture of a programmable computing machine: an arithmetic unit ("the mill"), a memory ("the store"), and a mechanism for control by external instructions. Those instructions were to come from **punched cards**, borrowed directly from the Jacquard loom. Babbage's notes describe several types of cards:

- **Operation cards:** specified what arithmetic operation to perform (add, subtract, multiply, divide)
- **Variable cards:** specified which memory locations to operate on
- **Number cards:** carried numerical constants into the machine

This is, essentially, a description of a punched-card instruction format.

Babbage had conceived of computer programs as punched cards 50 years before Hollerith used them for the census and 130 years before they became the standard interface to commercial computers.

**Ada Lovelace.** Augusta Ada King, Countess of Lovelace (1815-1852), Lord Byron's daughter, collaborated with Babbage on descriptions of the Analytical Engine. Her 1843 translation and annotation of an article by Luigi Menabrea about the Analytical Engine contains, in the notes she added (labeled Note A through Note G), what is generally considered the first published computer program: a method for computing Bernoulli numbers using the Analytical Engine's punched-card input. Lovelace's notes also contain what is, as far as we know, the first published analysis of what a programmed computer might become beyond pure numerical calculation—her famous observation that the Analytical Engine might in principle act on "other things besides number" such as musical notes, if the relationships among those things could be expressed formally.

The punched card thus has a continuous conceptual lineage from weaving pattern to mathematical instruction to population census to business data to computer program to the boxes of 5081 cards still being manufactured for museum exhibits today.

It is almost certainly the longest-lived physical input format in the history of information technology.

Two hundred and twenty years from Jacquard to the 2026 hobbyist ordering a box of cards online.

---

## Part 7: Legacy and Death

### 33. The Decline (1980s)

The death of punch cards was sudden and inevitable.

The killer was the **interactive terminal**.

The DEC VT52 (1975) and especially the DEC VT100 (1978) made affordable, high-quality video terminals available to mainstream computing.

A VT100 cost about $1,500 in 1978 dollars—roughly the same as a year's worth of cards for a medium-sized installation.

Connected to a time-sharing system like TSO on IBM mainframes, CMS on VM/CMS, RSTS on DEC PDP-11s, or VMS on VAX, a terminal let a programmer edit files directly on the computer, save them, compile them, run them, and see results immediately.

The feedback loop collapsed from 24 hours to under 10 seconds. A bug that used to take three days to find and fix could be found and fixed in five minutes.

Once this experience was available, nobody went back.

Between 1978 and 1985, interactive development displaced card-based development almost completely in new installations.

Existing card-based workflows persisted for a few years more because of sunk costs and retraining, but new projects started on terminals and old projects migrated as quickly as possible.

By 1985, most commercial mainframe shops in the United States had terminated their regular punch-card workflows.

The keypunches were mothballed or scrapped.

The keypunch rooms were converted into additional office space.

The keypunch operator job category was eliminated; many operators retrained as data entry clerks (using terminals), programmers, or system administrators.

A few found jobs at the last remaining card-based installations.

The cultural memory of punch cards faded quickly once the hardware was gone.

By the early 1990s, most programmers entering the field had never seen a keypunch in operation.

By 2000, even senior programmers who had started in the 1980s often had no direct experience with cards.

### 34. The Last Holdouts

Some systems kept running on punch cards into the 1990s and even the 2000s.

**The Internal Revenue Service.** The IRS operated a card-based processing system for certain tax filings well into the 1980s and used card-derived workflows (on the back-end) into the 1990s. Some legacy batch-processing code in IRS systems was originally written for card-based workflows and has been maintained, patched, and ported across platforms without fundamentally being rewritten. Parts of the IRS's internal accounting systems are, at this writing, still built on architectures that assumed cards as input.

**Utility billing.** Electricity, gas, and water utilities in many small and medium U.S. municipalities ran card-based billing systems into the 1990s. The reason was simple: the existing system worked, the population was small enough that the batch job fit in an overnight run, and there was no business reason to replace a working system. Some small utilities kept IBM 1401s or 1403 printers alive into the early 1990s specifically to run legacy card-based billing.

**Florida 2000: the hanging chad.** The most infamous late appearance of punch cards in public life was the November 2000 U.S. presidential election in Florida. Several Florida counties used **Votomatic** and **Datavote** punch-card voting systems. These were small cards (not 80-column Hollerith cards; a different format designed for voting) punched with a stylus by the voter through a plastic overlay that marked the ballot positions. When the voter's stylus did not fully dislodge the paper "chad" from the card, the card was marked ambiguously: a **hanging chad** (attached by one corner), a **swinging chad** (attached by two corners), a **pregnant chad** (indented but not broken), or a **dimpled chad** (barely marked). In a close presidential race—the Florida result was eventually decided by 537 votes out of nearly 6 million cast—these ambiguities became the subject of weeks of recount, legal challenge, and Supreme Court argument. The term "hanging chad" entered the American vocabulary and brought nationwide attention to the fact that punch cards were still in use in elections in the year 2000.

The aftermath of the 2000 election included the **Help America Vote Act of 2002**, which funded the replacement of punch-card voting systems with electronic voting machines.

By the 2008 election, punch-card voting had been essentially eliminated from U.S. elections.

The political and emotional fallout of the hanging chad is a significant reason punch cards have a very specific negative connotation in American political memory.

### 35. Museums

The preserved history of punch cards lives in museums and private collections.

**The Computer History Museum (Mountain View, California).** The CHM, founded in 1996 and reopened at its current location in 2003, has the most comprehensive collection of punch-card hardware in the world. Visitors can see:

- An operational IBM 026 keypunch
- An IBM 029 keypunch (also restored to working condition)
- An IBM 077 collator
- Multiple IBM card readers from the 701, 704, 1401, and System/360 eras
- A working IBM 1401 mainframe (the Museum maintains two 1401 systems in operating condition, with scheduled public demonstrations)
- Original Hollerith tabulating equipment from the 1890s-1900s

The CHM's **IBM 1401 Demo Lab** is one of very few places in the world where you can watch a 1950s-1960s card-based batch workflow executed live.

The demonstrations run on authentic hardware, using authentic 5081 cards, with authentic operators (volunteers, many of whom worked on these machines professionally decades ago).

**IBM Archives.** IBM maintains historical archives at its Endicott, New York and Poughkeepsie, New York facilities, where original examples of virtually every IBM punch card machine are preserved. Some of these are on public display; others are available to researchers by appointment.

**Other collections.** The Smithsonian National Museum of American History in Washington has Hollerith's original 1890 census tabulator. The Science Museum in London has Babbage's partially-constructed Difference Engine No. 2. The Heinz Nixdorf MuseumsForum in Paderborn, Germany, the world's largest computer museum, has an extensive collection of punch card equipment. The Living Computers: Museum + Labs in Seattle (founded by Paul Allen, paused in 2020) had operational punch card machines as part of its collection.

Private collectors, many of them retired IBM engineers or data processing professionals, maintain keypunches and sorters in home workshops.

There is a small but active community of restoration enthusiasts who trade parts, documentation, and know-how on a handful of email lists and forums.

The skill of repairing a 1950s electromechanical card sorter is held by perhaps a few dozen people in the world in 2026, almost all of them over 70.

This skill is being lost fast.

---

## Coda: What the Cards Remember

A punch card is an object that carries information in an almost painfully literal way.

You can hold an 80-column card up to the light and see the holes.

If you know the Hollerith code, you can read it with your eyes.

The information is not encoded in a bit stream or a magnetic flux reversal or a voltage threshold; it is encoded as the presence or absence of small rectangles of air in a piece of paper.

It is the most material form of digital information that has ever existed at industrial scale.

For a century, from Hollerith's first census tabulator in 1890 to the last IBM 5081 rolling off a production line in 1990, the world's most important data—census records, payroll records, scientific calculations, bank transactions, tax filings, inventory records, train schedules, insurance policies, birth certificates, death certificates, election results—was written onto these rectangles of paper.

Roughly a trillion cards were produced in total.

Most were burned, pulped, or buried in landfills after their data had been transferred to tape and then to disk.

A few are preserved in museums.

A few more float through flea markets, attics, and estate sales, often taped to the backs of family photograph albums because somebody kept them as mementos of their first programming job.

The cards remember things that the digital descendants do not.

They remember the humidity of the room they were punched in, the oil from the fingers that sorted them, the coffee that spilled on the corner.

They remember the rubber bands.

They remember being dropped.

They remember the sequence numbers in columns 73-80 that the programmer typed in at 2 a.m. in case of disaster.

They remember the distinct "chunk" sound of the punch striking the die, a sound that no software can reproduce.

When the people who worked with these cards are all gone—and that generation is in its 70s and 80s now, passing into memory—the cards themselves will still be in the museums, still carrying their data, still readable with a light and a patient eye.

They will outlast the magnetic tapes that replaced them.

They will outlast the disk drives that replaced the tapes.

They may even outlast the SSDs that replaced the disks.

Paper, properly stored, lasts a very long time.

The cards in IBM's archives from the 1930s are still in good condition almost a century later, and there is no physical reason they will not be in good condition a century from now.

This is a strange property for a technology we think of as obsolete.

The cards are the longest-lived digital storage medium humanity has ever deployed.

They were designed to survive being dropped, stepped on, mailed, stored in attics, and passed through machines at a thousand per minute.

They were designed by engineers who did not trust anything they could not see and touch, for users who had to reassemble a deck after a rubber band broke.

They are, in their way, the most robust digital artifacts ever made.

The punch card was a keyboard, a filesystem, a network, a backup, a source control system, and a data interchange format, all implemented in paper.

It lasted for a hundred years.

It trained a generation to think about information as something you could hold in your hands.

And then it vanished from daily life in less than a decade, leaving behind only the word "sort," a few phrases like "blowing your stack," a handful of museum exhibits, and the knowledge—passed down now mostly through books and stories—that there was once a time when a program was a stack of rectangles tied up with a rubber band, and the most important question in the building was whether your rubber band would hold.

---

*End of document.*
