# Module 5: Door Games -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Conceptual

Explain why BBS door games used a per-day-turn system rather than allowing unlimited play. Identify at least three distinct constraints of the BBS environment that made per-day turns the dominant design pattern. For each constraint, explain how the per-day-turn system specifically addresses it.

## Question 2: Protocol Analysis

Given the following lines from a DOOR.SYS drop file, extract the caller's name, remaining time, and ANSI graphics support status:

```
COM2:
38400
8
1
N
N
John Q. Sysop
Portland, OR
503-555-1234
503-555-5678
PASSWORD
75
20
01/15/1995
9600
0
1
25
120
80,25
GR
```

Identify which line number each piece of information comes from, and explain what a door program should do differently if line 23 were "NG" instead of "GR".

## Question 3: Application

Design the startup sequence for a new door game. Your game needs to: (a) work with both DOOR.SYS and CHAIN.TXT drop files, (b) handle local testing (no serial port), and (c) gracefully handle a caller who disconnects mid-game. Describe the initialization steps in order, including drop file detection, serial port setup, carrier detect monitoring, and the first screen display.

## Question 4: Analysis

Compare the door game mechanism to modern web server CGI. Both involve a host program (BBS software / web server) passing session state to an external program (door game / CGI script) through files or environment variables. Identify at least three specific parallels between the two systems, and one significant difference that affects how programs are designed.

## Question 5: Reasoning

BBS door games achieved multiplayer interaction through shared state files on disk rather than real-time networking. A game like Barren Realms Elite even supported inter-BBS leagues where players on different BBS systems competed, with game state synchronized via FidoNet echomail packets. Explain why this asynchronous, store-and-forward multiplayer model was the only practical option for BBS gaming. What fundamental constraints of the BBS architecture prevent real-time multiplayer in the style of modern online games?

## Answer Key

### Answer 1

Three distinct constraints that made per-day turns the dominant design:

**1. Limited phone lines (hardware constraint).** Most BBS systems had 1-4 phone lines. If one player stayed on the line playing a game for hours, other callers would get a busy signal and could not connect. Per-day turns set an upper bound on game session length: once you use your turns, there is no reason to stay connected. This naturally limited session times to 15-30 minutes, leaving phone lines available for other callers.

**2. Fairness across unequal access (social constraint).** Some callers could phone the BBS dozens of times per day (free local calls, unlimited time), while others could only call once (long-distance, limited phone access). Without turn limits, players with more access would dominate purely through time invested. Per-day turns equalize competition: every player gets the same number of actions per day regardless of how many times they call or how long they stay connected. A player who calls once and uses all turns has the same game impact as a player who calls ten times.

**3. Time-limit enforcement (operational constraint).** BBS operators set per-session time limits (typically 30-60 minutes) to ensure fair sharing of phone lines. If a game allowed unlimited actions, players would hit their time limit mid-game and be forcibly disconnected, losing progress. Per-day turns ensure that the game's natural session length fits within the BBS time limit. A game designed for 20 turns per day at 1-2 minutes per turn creates a 20-40 minute session that comfortably fits within a 60-minute time limit.

### Answer 2

Parsing the DOOR.SYS file:

| Information | Line # | Value |
|-------------|--------|-------|
| Caller's name | **Line 7** | **John Q. Sysop** |
| Time remaining | **Line 18** | **120 minutes** (2 hours) |
| ANSI support | **Line 23** | **GR** (graphics mode -- ANSI is supported) |

Note: The other fields are: Line 1 = COM2: (serial port), Line 2 = 38400 (baud rate), Line 8 = Portland, OR (location), Line 12 = 75 (security level), Line 20 = 80,25 (screen dimensions).

**If line 23 were "NG" (No Graphics):** The door program should:
1. Disable all ANSI escape sequences -- no color codes, no cursor positioning, no screen clearing via ESC[2J
2. Use plain text output only, with line-by-line scrolling
3. Replace ANSI art menus with simple text menus (numbered lists)
4. Use "Press Enter to continue" prompts instead of cursor-positioned status updates
5. Avoid using CP437 box-drawing characters, which may not display correctly without ANSI.SYS

This dramatically changes the user experience from a colorful, screen-positioned interface to a plain scrolling text interface, but ensures the game is usable for callers with terminals that do not support ANSI.

### Answer 3

Startup sequence for a door game with dual drop file support:

**Step 1: Detect drop file.** Check the current directory (and common BBS drop file paths) for:
- "DOOR.SYS" (most common)
- "CHAIN.TXT" (WWIV)
If neither is found, check for command-line arguments specifying a path. If still not found, enter local/test mode with default values.

**Step 2: Parse drop file.** Based on which file was found:
- DOOR.SYS: Read lines positionally (Line 1 = COM port, Line 7 = name, Line 18 = time, Line 23 = ANSI mode)
- CHAIN.TXT: Read lines positionally (different layout -- user number, alias, security level, ANSI flag, time in seconds)
Store parsed values in a unified session structure that abstracts the format differences.

**Step 3: Initialize serial port.** Read the COM port from the drop file:
- If "COM0:" or local mode: skip serial port initialization (use standard console I/O)
- Otherwise: initialize FOSSIL driver (INT 14h, function 04h) for the specified port and baud rate
- Set hardware flow control (RTS/CTS) via FOSSIL
- Verify carrier detect (DCD) signal is present -- if not, the caller may have already disconnected

**Step 4: Start carrier detect monitoring.** Set up a periodic check (every 1-2 seconds) of the DCD signal via FOSSIL status function (03h). If DCD drops during the game:
- Save the player's current state to disk
- Close the serial port
- Exit cleanly (return to BBS software)

**Step 5: Set time remaining.** Start a countdown timer from the value in the drop file. Warn the player at 5 minutes remaining. Force-save and exit at 0 minutes.

**Step 6: Display first screen.** Based on ANSI mode:
- GR: Send ESC[2J (clear screen), display ANSI art title screen, show status bar with player name and turns remaining
- NG: Print text-only title, show simple text menu

**Step 7: Enter main game loop.** Read keystrokes, process commands, update display, check DCD and time remaining.

### Answer 4

Three parallels between BBS door games and web server CGI:

**1. Session state via files.** BBS: The BBS writes DOOR.SYS/CHAIN.TXT before spawning the door. CGI: The web server sets environment variables (QUERY_STRING, REMOTE_ADDR, CONTENT_LENGTH) before spawning the CGI script. Both use external state transfer rather than shared memory or IPC.

**2. Process spawning model.** BBS: The BBS forks or exec's the door program as a separate process. CGI: The web server forks the CGI script as a separate process. Both models create a fresh process for each session/request, with the host program managing the lifecycle.

**3. I/O redirection.** BBS: The door inherits the serial port file descriptor (or accesses it via FOSSIL). CGI: The CGI script reads from stdin (HTTP request body) and writes to stdout (HTTP response). Both redirect I/O between the external program and the remote client through the host's managed connection.

**Significant difference: session persistence.** A BBS door maintains a long-running interactive session -- the program stays alive for the entire player session (potentially 30+ minutes), with back-and-forth I/O. A CGI script handles a single request-response cycle and exits. This means door games manage their own input loop and state, while CGI scripts must encode state in hidden form fields, cookies, or server-side sessions. This difference fundamentally affects program architecture: door games are interactive applications, while CGI scripts are stateless request handlers.

### Answer 5

The asynchronous, store-and-forward model was the only practical option due to four fundamental constraints:

**1. Single-user phone lines.** Each BBS phone line could handle exactly one caller at a time. For two players to interact in real time, they would both need to be connected simultaneously -- but on a single-line BBS, this is impossible. Even on multi-line systems (2-4 lines), the probability of two specific players being online at the same time was very low.

**2. No persistent network connections.** Unlike Internet game servers with always-on TCP connections, BBS connections were temporary dial-up sessions. A player connects, plays, and disconnects. There is no mechanism to push real-time updates to a player who is not currently connected. Shared state files solve this by being "eventually consistent" -- each player reads the latest state when they connect.

**3. Inter-BBS leagues require asynchronous transport.** For cross-BBS multiplayer (like BRE leagues), game state must travel between BBS systems. The only transport mechanism is FidoNet echomail, which is inherently store-and-forward with latency measured in hours. Real-time multiplayer across BBS systems would require simultaneous phone calls between the BBS systems, which would monopolize phone lines and incur long-distance charges for every game interaction.

**4. Geographic distribution and time zones.** BBS players were spread across cities and time zones. Even if real-time multiplayer were technically possible, coordinating simultaneous play sessions across different time zones would be impractical. The asynchronous model allows a player in Tokyo to attack a player in New York's territory at 3 PM JST, and the New York player sees the result when they log in at 9 AM EST.

Modern online games solve these constraints with: always-on broadband (no per-connection cost), dedicated game servers (persistent state and push notifications), and flat-rate Internet (no per-minute long-distance charges). The BBS era had none of these, making asynchronous shared-state the only viable multiplayer architecture.
