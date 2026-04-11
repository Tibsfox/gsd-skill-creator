# The History and Evolution of Shells and Terminals

*From teletypes to GPU-accelerated terminal emulators: the command line's long arc*

---

## Prologue: The Oldest Interface That Still Works

Every modern computing system, from a Raspberry Pi to an AWS data center, ships with a command-line shell. Despite six decades of graphical user interfaces, voice assistants, and touch screens, the shell endures as the most direct way a human can issue instructions to a machine. The reasons are structural: a shell is a text-based REPL (read-eval-print loop) that composes perfectly with every other text-based tool, and composition is the property that outlasts fashions in interface design.

But the shell as we know it did not arrive fully formed. It is the product of a lineage that begins with mechanical teletypes clattering at 110 baud, passes through the phosphor glow of DEC's video terminals, and arrives at today's ecosystem of GPU-rendered terminal emulators running shells that can manipulate structured data as fluently as plain text. The terminal and the shell co-evolved, each shaping the other's capabilities and constraints. The 80-column line, the ANSI escape code, the pseudo-terminal abstraction, the `$PS1` prompt -- each is a fossil record of a specific engineering decision made at a specific moment by specific people, preserved because the systems built on top of it were too useful to abandon.

This is the history of both halves: the terminal (the device, the emulator, the I/O channel) and the shell (the interpreter, the language, the environment). Together they form the command-line interface, and together they tell the story of how humans have talked to machines for the last sixty years.

---

# Part I: Terminals

---

## 1. Teletypes: Where "TTY" Comes From

### The Teletype Corporation

Before computers had screens, they had teletypes. The Teletype Corporation, a subsidiary of Western Electric (and thus part of the AT&T/Bell System empire), manufactured electromechanical teleprinters from the 1920s onward. These machines were originally designed for telegraph and Telex networks -- they converted electrical signals into printed characters on paper, and keyboard input into electrical signals. When the earliest interactive computers needed a human interface in the late 1950s and early 1960s, the teletype was the obvious choice: it was already a mature, mass-produced device for converting between human-readable text and electrical signals.

### The ASR-33

The **Teletype Model 33**, introduced in 1963, became the canonical computer terminal of the late 1960s and early 1970s. The ASR-33 (Automatic Send-Receive) variant included a paper tape reader and punch, making it both an I/O device and a rudimentary storage medium. Key specifications:

| Specification | Value |
|---|---|
| Speed | 10 characters/second (110 baud) |
| Character set | ASCII (7-bit, 128 characters) |
| Printing mechanism | Type cylinder |
| Interface | 20 mA current loop (later RS-232) |
| Paper width | 8.5 inches (80 columns at 10 cpi) |
| Weight | ~35 pounds |
| Cost (1963) | ~$750 ($7,500 in 2025 dollars) |

The ASR-33 was cheap enough for universities and small companies to afford, and reliable enough to leave running unattended. It was the default terminal for early PDP minicomputers, and it was the device Ken Thompson and Dennis Ritchie used when they created Unix on the PDP-7 in 1969. The physical characteristics of the ASR-33 shaped Unix in ways that persist today:

- **Uppercase-only models** existed. Early Unix file commands were lowercase partly because Thompson's PDP-7 teletype could handle lowercase, but the convention of short, lowercase command names (`ls`, `cp`, `rm`, `cat`) reflects a world where every character had to be physically struck by a mechanical typehead.
- **Carriage return + line feed.** The teletype carriage physically had to return to the left margin (CR, ASCII 13) and the paper had to advance one line (LF, ASCII 10). This is why DOS/Windows text files use `\r\n` and Unix uses just `\n` -- Unix assumed a driver that handled the translation, Windows preserved the teletype convention.
- **No backspace in the modern sense.** You could send a backspace character (ASCII 8), but the paper couldn't unprint. The `#` character was the original Unix erase character (erase one character) and `@` was the kill character (erase the whole line) -- conventions that predate video terminals.

### Why "tty" Persists

The abbreviation **tty** entered Unix's DNA from the start. The device file for a serial terminal was `/dev/tty`. The system call to query terminal settings was (and remains) exposed through the `tty` command. The `stty` utility ("set tty") configures terminal parameters: baud rate, character size, parity, and the special characters for interrupt (typically Ctrl-C), suspend (Ctrl-Z), erase, kill, and end-of-file (Ctrl-D). Even in 2026, on a machine that has never been within a hundred miles of a physical teletype, `tty` returns the name of the pseudo-terminal device attached to the current shell session:

```
$ tty
/dev/pts/3
```

The `pts` stands for "pseudo-terminal slave" -- a software abstraction of a device that last existed in hardware in the 1980s. The kernel's terminal subsystem still implements line discipline, echo, and canonical-mode line editing because the abstraction was designed for teletypes, and the abstraction survived.

---

## 2. Video Terminals: DEC's Empire

### The Transition from Paper to Phosphor

The fundamental limitation of the teletype was that it could only append. You could not go back and change a character already printed on paper. This made full-screen editors, menus, and forms impossible. The solution was the **video display terminal** (VDT): a CRT screen paired with a keyboard, capable of displaying characters at arbitrary positions and erasing or overwriting them.

The earliest video terminals appeared in the mid-1960s from companies like IBM (the 2260, 1964) and Datapoint (the 3300, 1967). But the company that came to dominate the video terminal market -- and whose products defined the escape-code conventions that every terminal emulator still implements -- was **Digital Equipment Corporation (DEC)**.

### VT05 (1970)

DEC's first video terminal, the VT05, displayed 20 lines of 72 characters on a 12-inch CRT. It used a proprietary control-code scheme (not yet ANSI) and communicated over RS-232 at up to 2400 baud. The VT05 established the basic form factor -- a CRT on a desk with an integrated keyboard -- that would persist for two decades.

### VT52 (1975)

The **VT52** was DEC's first widely adopted video terminal. It displayed 24 lines of 80 columns (the dimensions that would become standard), supported cursor addressing via escape sequences, and offered features that teletypes could not: screen clearing, cursor movement, and scrolling. The VT52's escape sequences used the `ESC` character (ASCII 27, hex 0x1B) followed by a single letter. For example:

```
ESC A    -- cursor up
ESC B    -- cursor down
ESC H    -- cursor home (upper-left)
ESC J    -- erase to end of screen
```

These were not yet ANSI standard sequences, but they established the pattern of using ESC as an introducer for control commands embedded in the character stream.

### VT100 (1978)

The **VT100**, introduced in August 1978, was the most influential terminal ever manufactured. It was designed by a team at DEC's terminal engineering group in Maynard, Massachusetts, and it became the de facto standard that all subsequent terminals and terminal emulators would target.

Key VT100 specifications:

| Specification | Value |
|---|---|
| Display | 24 lines x 80 columns (132-column mode available) |
| Character set | ASCII + DEC Special Graphics |
| Screen | 12-inch monochrome CRT (green or amber phosphor) |
| Processor | Intel 8080 |
| Escape sequences | ANSI X3.64 compliant |
| Communication | RS-232, up to 19,200 baud |
| Scrolling regions | Yes (smooth or jump scroll) |
| Price (1978) | ~$1,800 ($8,500 in 2025 dollars) |

The VT100 was the first widely available terminal to implement the **ANSI X3.64** escape-code standard (discussed in Section 4 below). This was the decision that made it canonical: because the VT100 was so popular, every other terminal manufacturer had to be "VT100 compatible," and every terminal emulator written since has implemented VT100 escape codes as its baseline.

The VT100 also introduced the concept of **DEC Private Mode** escape sequences (sequences beginning with `ESC [ ?`) for features not covered by the ANSI standard, such as smooth scrolling, origin mode, and autowrap. These DEC private modes are still implemented and used in modern terminal emulators.

### VT220 (1983) and VT320 (1987)

The **VT220** added 8-bit character support (for European languages), user-defined keys, downloadable character sets, and printer support. The **VT320** added further refinements including multiple sessions, improved character sets, and enhanced status-line handling. Both maintained backward compatibility with the VT100 escape sequences.

DEC continued the line through the VT420 (1990) and VT520 (1994), but by the early 1990s hardware terminals were dying. Workstations and PCs running terminal emulator software had replaced them. DEC sold its terminal business in 1995, and DEC itself was acquired by Compaq in 1998. But the VT100's escape-code dialect had already become immortal -- it was the language every terminal emulator spoke, and every shell expected.

### Other Notable Terminals

- **Wyse 50/60** (Wyse Technology, 1983-84) -- popular in corporate environments, known for reliability and affordability.
- **Televideo 925/950** (1982-83) -- widely used in business and industrial settings.
- **IBM 3270** (1971) -- block-mode terminal for IBM mainframes. Unlike character-at-a-time VT100-style terminals, the 3270 sent entire screenfuls of data at once, a fundamentally different model that required its own protocol (TN3270 for Telnet).
- **Heathkit H19** (1979) -- a popular kit terminal that implemented a VT52-compatible escape set.

---

## 3. The 80-Column Standard

### IBM Punch Cards: 1928

The 80-column line width did not originate with video terminals. It originated with **Herman Hollerith's punch card**, as revised by IBM in 1928. The IBM 80-column card format (12 rows by 80 columns, with one character per column) became the standard data entry and storage medium for mainframe computing from the 1930s through the 1970s. Billions of these cards were manufactured. Entire buildings were designed around their dimensions.

When terminals replaced cards, the 80-column width was carried forward by simple inertia and compatibility: programs written for 80-column card input expected 80-column terminal output. FORTRAN's fixed-format source code assumed 80 columns (columns 1-5 for statement labels, column 6 for continuation, columns 7-72 for code, columns 73-80 for sequence numbers). COBOL used all 80 columns. The VT100 defaulted to 80 columns. The convention stuck.

### 40 Columns: Home Computers

Not all screens were 80 columns wide. The first generation of home computers in the late 1970s and early 1980s typically used television sets as displays, and the bandwidth of NTSC (the North American TV standard, 525 interlaced lines at 60 Hz) could not cleanly resolve 80 columns of text at consumer price points. As a result:

| System | Default Text Columns | Year |
|---|---|---|
| Apple II | 40 | 1977 |
| Commodore PET | 40 | 1977 |
| TRS-80 Model I | 64 | 1977 |
| Atari 800 | 40 | 1979 |
| Commodore 64 | 40 | 1982 |
| Commodore 128 | 40/80 (switchable) | 1985 |
| IBM PC (CGA) | 40 or 80 | 1981 |

The Apple II and Commodore 64 displayed 40 columns by default, using large, readable characters on a TV screen. An 80-column card was available for the Apple IIe ($125, 1983) and for the Commodore 64 (the Commodore 1700/1764 REU or third-party 80-column cards), but they were add-ons. The IBM PC, aimed at business users who needed compatibility with existing 80-column software, shipped with 80-column support from day one via its MDA (Monochrome Display Adapter) and CGA cards.

### The 80-Column Discipline in 2026

The 80-column convention persists in style guides (PEP 8 originally recommended 79 characters for Python; the Linux kernel style guide recommends 80; Go's `gofmt` is indifferent but most Go code fits in 80), in default terminal window sizes, and in the design of command-line tools that assume output will be piped and paged in an 80-column window.

Many modern style guides have relaxed to 100, 120, or even unlimited line lengths, reflecting the reality that most developers work on screens wider than 80 columns. But the gravitational pull of the original standard is still detectable in every `printf("%-79s\n")` and every `tput cols` that returns 80.

---

## 4. ANSI Escape Codes

### X3.64 and ECMA-48

The proliferation of incompatible escape-code schemes in the 1970s (VT52, Hazeltine, Lear Siegler ADM-3A, Heathkit H19, and dozens of others) created a serious portability problem: programs written for one terminal type would display garbage on another. The solution was a standard.

**ANSI X3.64** ("Additional Controls for Use with American National Standard Code for Information Interchange"), published by ANSI in 1979 and based on ECMA-48 (1976, European Computer Manufacturers Association), defined a uniform set of escape sequences for cursor control, display attributes, and screen manipulation. The standard was also adopted as ISO 6429 (1983).

### CSI: Control Sequence Introducer

The core of ANSI escape codes is the **CSI (Control Sequence Introducer)**, which is the two-byte sequence `ESC [` (hex `1B 5B`). A CSI sequence has the general form:

```
ESC [ <parameter> ; <parameter> <final byte>
```

where parameters are decimal numbers separated by semicolons, and the final byte determines the command. Examples:

| Sequence | Meaning |
|---|---|
| `ESC[2J` | Erase entire screen |
| `ESC[H` | Move cursor to home position (1,1) |
| `ESC[10;40H` | Move cursor to row 10, column 40 |
| `ESC[A` | Move cursor up one line |
| `ESC[5B` | Move cursor down 5 lines |
| `ESC[K` | Erase from cursor to end of line |
| `ESC[?25l` | Hide cursor (DEC private mode) |
| `ESC[?25h` | Show cursor (DEC private mode) |
| `ESC[6n` | Device Status Report (terminal responds with cursor position) |

### SGR: Select Graphic Rendition

The most widely used CSI sequence is **SGR (Select Graphic Rendition)**, introduced by the final byte `m`. SGR controls text attributes: bold, underline, color, and other visual properties.

```
ESC [ <code> ; <code> ; ... m
```

The original SGR codes defined by ANSI X3.64:

| Code | Effect |
|---|---|
| 0 | Reset all attributes |
| 1 | Bold (or increased intensity) |
| 2 | Dim (decreased intensity) |
| 3 | Italic |
| 4 | Underline |
| 5 | Blink (slow) |
| 7 | Reverse video |
| 8 | Hidden (concealed) |
| 9 | Strikethrough |
| 30-37 | Set foreground color (8 colors) |
| 40-47 | Set background color (8 colors) |

The 8 original ANSI colors and their standard indices:

| Index | Color | Foreground | Background |
|---|---|---|---|
| 0 | Black | `ESC[30m` | `ESC[40m` |
| 1 | Red | `ESC[31m` | `ESC[41m` |
| 2 | Green | `ESC[32m` | `ESC[42m` |
| 3 | Yellow | `ESC[33m` | `ESC[43m` |
| 4 | Blue | `ESC[34m` | `ESC[44m` |
| 5 | Magenta | `ESC[35m` | `ESC[45m` |
| 6 | Cyan | `ESC[36m` | `ESC[46m` |
| 7 | White | `ESC[37m` | `ESC[47m` |

### 256-Color Mode

In the late 1990s, terminal emulators began supporting an extended 256-color palette, accessed via SGR codes 38 and 48:

```
ESC[38;5;<n>m    -- set foreground to color n (0-255)
ESC[48;5;<n>m    -- set background to color n (0-255)
```

The 256-color palette is structured as:
- **0-7:** Standard ANSI colors
- **8-15:** High-intensity ("bright") ANSI colors
- **16-231:** A 6x6x6 color cube (216 colors)
- **232-255:** A 24-step grayscale ramp

`xterm` was the first major terminal emulator to implement 256 colors (Thomas Dickey added the support in the early 2000s). The `TERM=xterm-256color` terminfo entry signals that the terminal supports this palette.

### 24-Bit True Color

Modern terminal emulators support **24-bit true color** (16.7 million colors) via an extension to the SGR syntax:

```
ESC[38;2;<r>;<g>;<b>m    -- set foreground to RGB
ESC[48;2;<r>;<g>;<b>m    -- set background to RGB
```

This was first implemented in Konsole (KDE's terminal emulator) around 2012 and has since been adopted by virtually all modern terminal emulators: iTerm2, GNOME Terminal (via VTE), Alacritty, Kitty, WezTerm, and Windows Terminal. The feature is not yet standardized in any formal specification and relies on de facto consensus among implementors.

---

## 5. Terminal Emulators

### xterm (1984)

**xterm** was written by Mark Vandevoorde as part of MIT's Project Athena in 1984, with the explicit goal of providing a VT102-compatible terminal window under the X Window System. Thomas Dickey became the primary maintainer in 1996 and has maintained it continuously for three decades, during which he added 256-color support, Unicode, TrueType font rendering, and hundreds of other features while preserving backward compatibility.

xterm established the expectations for all subsequent terminal emulators:
- VT100/VT102/VT220 escape-code compatibility
- Selection and clipboard integration with the X selection mechanism
- Configurable fonts, colors, and geometry
- The `TERM=xterm` (later `TERM=xterm-256color`) terminfo identifier

xterm's codebase is notoriously large (over 70,000 lines of C) and its configuration is byzantine (hundreds of X resources), but it remains the reference implementation against which other terminal emulators test their escape-code handling.

### rxvt and urxvt

**rxvt** (Rob Nation, 1990s) was designed as a lighter-weight alternative to xterm, stripping out features like Tektronix 4014 graphics emulation to reduce memory usage. **urxvt** (rxvt-unicode, Marc Lehmann, 2003) added Unicode support and Perl extension scripting, and became popular in the Linux tiling-window-manager community for its low resource usage and high configurability.

### GNOME Terminal and VTE

**GNOME Terminal** (Miguel de Icaza and others, 1999) uses the **VTE (Virtual Terminal Emulator)** widget library, originally written by Nalin Dahyabhai. VTE provides the terminal emulation engine and is shared by GNOME Terminal, Terminator, Tilix, Guake, and many other GTK-based terminal emulators. VTE tracks the de facto standard escape codes closely and has been a driver of true-color support in the GNOME ecosystem.

### iTerm2

**iTerm2** (George Nachman, 2009) is the dominant third-party terminal emulator on macOS. It introduced features that pushed the boundaries of what a terminal could do:
- Split panes within a single window
- Triggers (automatic actions based on output patterns)
- Shell integration (command status reporting, directory tracking)
- Inline image display (the iTerm2 inline image protocol, later partially adopted by other emulators)
- Profile-based configuration with dynamic profiles
- tmux integration (control mode)

### The GPU-Accelerated Generation (2017-present)

Starting around 2017, a new generation of terminal emulators emerged that used GPU rendering (via OpenGL, Metal, or Vulkan) for dramatically faster text display, especially on high-DPI screens with large scrollback buffers.

**Alacritty** (Joe Wilm, first released January 2017) was the first. Written in Rust, it positioned itself as "the fastest terminal emulator in existence" by offloading all rendering to the GPU via OpenGL. Alacritty deliberately omits features like tabs, splits, and scrollback search in its core, following a philosophy that these should be provided by a terminal multiplexer like tmux.

**Kitty** (Kovid Goyal, 2017) is also GPU-accelerated (using OpenGL) but takes the opposite design philosophy from Alacritty: it includes tabs, layouts, image display (via a custom protocol called the Kitty graphics protocol), ligature rendering, and extensive extension points via `kittens` (Python scripts). Kitty's graphics protocol allows displaying arbitrary images inline in the terminal, including animated images -- a significant departure from the text-only tradition.

**WezTerm** (Wez Furlong, 2018) is written in Rust, GPU-accelerated, cross-platform (Linux, macOS, Windows), and includes a built-in multiplexer, ligature support, the iTerm2 image protocol, and Lua-based configuration. Furlong, who had previously worked on the Watchman file watcher at Facebook, designed WezTerm with an emphasis on correctness and completeness of terminal emulation.

**Windows Terminal** (Microsoft, released May 2019, open source) replaced the legacy `conhost.exe` as the default terminal on Windows. It uses DirectX for GPU-accelerated rendering and supports multiple shell profiles (PowerShell, CMD, WSL distributions), ANSI escape codes (which Windows had historically not supported), tabs, panes, and customizable color schemes. Its release marked a fundamental shift in Microsoft's attitude toward command-line tooling, driven by the WSL (Windows Subsystem for Linux) initiative and the broader developer community's expectation of Unix-compatible terminal behavior.

| Emulator | Language | GPU | First Release | Key Feature |
|---|---|---|---|---|
| xterm | C | No | 1984 | Reference VT100 implementation |
| rxvt/urxvt | C/Perl | No | ~1995/2003 | Low resource usage, Perl extensions |
| GNOME Terminal | C (VTE) | No* | 1999 | GNOME desktop integration |
| iTerm2 | Objective-C | Metal | 2009 | macOS power terminal |
| Alacritty | Rust | OpenGL | 2017 | Minimal, GPU-accelerated |
| Kitty | C/Python | OpenGL | 2017 | Graphics protocol, kittens |
| WezTerm | Rust | OpenGL | 2018 | Built-in multiplexer, cross-platform |
| Windows Terminal | C++ | DirectX | 2019 | Windows ANSI escape support |

\* VTE gained GPU acceleration via GTK4 in later versions.

---

## 6. Pseudo-Terminals

### The Problem

When terminal emulators replaced hardware terminals, a question arose: programs that read from and wrote to `/dev/tty` (expecting a terminal device on the other end) needed to work unchanged inside a windowed terminal emulator. The solution was the **pseudo-terminal (pty)**: a software device pair that mimics a hardware terminal connection entirely within the kernel.

### How PTYs Work

A pseudo-terminal consists of two endpoints:

- **The master side (ptm):** Held by the terminal emulator (or SSH server, or screen/tmux). Data written to the master appears as input to the slave; data written by the program to the slave appears as output on the master.
- **The slave side (pts):** Presented to the shell (and its child processes) as a regular terminal device. The shell opens `/dev/pts/N` and treats it exactly as it would a hardware serial terminal.

The kernel's **line discipline** layer sits between the two, providing the same canonical-mode editing, echo, and signal generation (Ctrl-C for SIGINT, Ctrl-Z for SIGTSTP, Ctrl-D for EOF) that it would provide for a physical terminal.

On Linux, the modern pty interface is the **Unix 98 pty** system: the master is obtained by opening `/dev/ptmx`, which allocates a new pty pair and returns a file descriptor for the master side. The corresponding slave device appears as `/dev/pts/N`. The `posix_openpt()`, `grantpt()`, `unlockpt()`, and `ptsname()` system calls manage the lifecycle.

### SSH and PTYs

When you SSH into a remote machine, the SSH server allocates a pty on the remote side. Your local terminal emulator talks to the local SSH client over a local pty; the SSH client encrypts the data and sends it over the network; the remote SSH daemon writes it to the remote pty's master side; the remote shell reads it from the slave side. This is why interactive programs (vim, top, less) work over SSH -- they see a pty that behaves like a real terminal.

When SSH is used non-interactively (e.g., `ssh host 'ls -la'`), no pty is allocated on the remote side by default. The `-t` flag forces pty allocation, which is necessary when the remote command needs terminal features.

### screen and tmux: Terminal Multiplexing

**GNU Screen** (Oliver Laumann, 1987; later maintained by Juergen Weigert and Michael Schroeder) and **tmux** (Nicholas Marriott, 2007) are terminal multiplexers: they create multiple virtual terminals within a single terminal session, each backed by its own pty pair, and allow the user to detach from and reattach to running sessions.

The architecture is:

```
Terminal Emulator  <-->  [pty pair 1]  <-->  tmux client
                                                  |
                                            Unix socket
                                                  |
                                            tmux server
                                              /       \
                              [pty pair 2]          [pty pair 3]
                                  |                     |
                                bash                   vim
```

The tmux server persists even when all clients detach, keeping the shell sessions alive. This is why `tmux attach` can reconnect to a session after a network disconnection -- the shell was talking to the tmux server's pty, not to the now-dead SSH connection's pty.

tmux has largely supplanted GNU Screen in modern usage due to its cleaner codebase, better documentation, scriptable configuration, and active development. Its architecture influenced Zellij (Aram Drevekenin, 2021), a Rust-based terminal multiplexer with a plugin system and a tiling layout engine.

---

## 7. termcap, terminfo, and ncurses

### The Problem of Terminal Diversity

By the early 1980s, there were hundreds of different terminal types in use, each with its own escape sequences for cursor movement, screen clearing, attribute setting, and special features. Programs that wanted to use full-screen capabilities (editors like `vi`, pagers like `more`, mailers like `elm`) needed a way to abstract over terminal differences.

### termcap (1978)

**termcap** (terminal capability database) was created by Bill Joy at UC Berkeley as part of the BSD Unix distribution. The termcap database was a flat text file (`/etc/termcap`) that contained entries for each terminal type, listing its capabilities as two-letter codes:

```
vt100|dec vt100:\
    :co#80:li#24:cl=\E[H\E[J:cm=\E[%i%d;%dH:\
    :ce=\E[K:cd=\E[J:so=\E[7m:se=\E[m:us=\E[4m:\
    :ue=\E[m:md=\E[1m:me=\E[m:
```

The `TERM` environment variable told the C library (and the `tgetent()`, `tgetstr()`, `tputs()` functions) which entry to look up. Programs that used termcap were automatically portable across any terminal type that had a termcap entry.

### terminfo (1981)

**terminfo** was created by Mark Horton at AT&T as a replacement for termcap, first appearing in System V Unix. terminfo used a compiled binary format (stored in `/usr/share/terminfo/` or `/usr/lib/terminfo/`) instead of a text file, which was faster to look up. It also used longer, more readable capability names:

| termcap | terminfo | Meaning |
|---|---|---|
| `cl` | `clear_screen` | Clear the entire screen |
| `cm` | `cursor_address` | Move cursor to (row, col) |
| `co` | `columns` | Number of columns |
| `li` | `lines` | Number of lines |
| `so` | `enter_standout_mode` | Begin standout (reverse video) |

terminfo entries are compiled with `tic` (terminfo compiler) and queried with `tput`:

```bash
$ tput cols        # prints number of columns
80
$ tput setaf 1     # outputs escape code for red foreground
$ tput sgr0        # outputs escape code to reset attributes
```

### ncurses (1993)

**ncurses** (new curses) is the free-software replacement for AT&T's proprietary `curses` library. Written by Zeyd Ben-Halim and Eric Raymond, and maintained since 1996 by Thomas Dickey (the same Thomas Dickey who maintains xterm), ncurses provides the `curses` API for full-screen terminal I/O, built on top of the terminfo database. It is the library that makes `htop`, `vim` (in terminal mode), `dialog`, `mc` (Midnight Commander), and thousands of other TUI programs work across different terminal types.

### Why TERM=xterm-256color

The `TERM` environment variable tells the curses/terminfo layer which set of capabilities to assume. Setting `TERM=xterm-256color` tells programs that:

1. The terminal understands xterm-compatible escape sequences (VT100/VT220 baseline)
2. The terminal supports 256 colors (SGR 38;5;N and 48;5;N)
3. The terminal has certain features listed in the `xterm-256color` terminfo entry

Setting `TERM` incorrectly causes visual glitches: if your terminal supports 256 colors but `TERM` is set to `vt100`, programs will only use 8 colors. If `TERM` is set to `xterm-256color` but your terminal only supports 8 colors, programs will emit escape codes the terminal does not understand, producing visible garbage.

---

# Part II: Shells

---

## 8. Pre-Unix: CTSS and Multics

### CTSS RUNCOM (1963)

The concept of a command-line shell predates Unix by nearly a decade. The **Compatible Time-Sharing System (CTSS)**, developed at MIT under the direction of Fernando Corbato beginning in 1961, was one of the first time-sharing operating systems. CTSS introduced the concept of **RUNCOM** (run commands): a facility for executing a stored sequence of commands from a file. The `RUNCOM` subsystem is the direct ancestor of Unix's `rc` files (`.bashrc`, `.vimrc`, `/etc/rc.d/`) -- the abbreviation `rc` stands for "run commands," a lineage that traces directly back to CTSS.

### Louis Pouzin and the Multics Shell (1964-1965)

**Louis Pouzin**, a French computer scientist working at MIT's Project MAC, conceived and implemented the first program that would recognize the name "shell" -- a command interpreter for CTSS and later for MULTICS. Pouzin described the shell as a program that surrounds the operating system kernel like a shell surrounds a nut: the user interacts with the shell, and the shell translates those interactions into system calls.

Pouzin's ideas were carried forward into the **Multics** project (Multiplexed Information and Computing Service), the ambitious MIT/Bell Labs/GE collaboration that began in 1964. The Multics shell, documented in the Multics design papers and influenced by Pouzin's work, had features that would not appear in Unix shells for years:

- **Command names as segments.** Any program in the file system could be invoked by name from the command line.
- **I/O redirection.** Multics supported redirecting command input and output.
- **Active functions.** A primitive form of command substitution.

The Multics project itself was notoriously complex and over-ambitious -- Bell Labs withdrew from it in 1969. But the shell concept, including the very word "shell," went with Ken Thompson when he began building Unix on the PDP-7.

---

## 9. The Thompson Shell (1971)

### Ken Thompson's Minimal Shell

The first Unix shell was written by Ken Thompson for the first edition of Unix (V1, November 1971). It was not a scripting language. It was a simple command interpreter that:

- Read a line of input
- Parsed it into a command name and arguments
- Forked a child process
- Executed the command using `exec()`
- Waited for the child to exit (unless `&` was specified for background execution)

The Thompson shell supported:
- **I/O redirection:** `>` for output, `<` for input
- **Pipes:** The `|` operator (added in V3 Unix, 1973)
- **Sequential execution:** `;` to separate commands
- **Background execution:** `&` to run a command without waiting
- **Globbing:** Handled by a separate program (`/etc/glob`), not by the shell itself

It did *not* support:
- Variables (no `$HOME`, no `$PATH`)
- Control flow (`if`, `while`, `for`)
- Shell scripting (no `#!` mechanism, no script execution)

The Thompson shell was functional and small. Its source code was roughly 900 lines of C. It was exactly what Thompson needed: a way to run programs interactively on a PDP-11.

### Doug McIlroy and the Pipe

The pipe is one of the most important abstractions in Unix, and its story is well documented. **Malcolm Douglas McIlroy**, a mathematician and programmer who headed the Computing Techniques Research Department at Bell Labs (the department that included Thompson and Ritchie), had been advocating for a mechanism to connect programs since the mid-1960s. In a 1964 memo, McIlroy wrote:

> "We should have some ways of coupling programs like garden hose -- screw in another segment when it becomes necessary to massage data in another way."

The pipe was implemented in V3 Unix (February 1973) by Thompson in a single night, after McIlroy kept insisting on it. The original syntax used `|` as the pipe operator (some early versions used `^`). The pipe transformed Unix from a collection of individual tools into a composable system: `ls | grep foo | wc -l` became possible, and the Unix philosophy -- small programs that do one thing well, connected by pipes -- was born.

---

## 10. The Bourne Shell (1979)

### Stephen Bourne

**Stephen Richard Bourne**, a British computer scientist who had studied at King's College, Cambridge (where he earned a PhD on the ALGOL 68 compiler), joined Bell Labs' Computer Science Research Center in 1975. Bourne was given the task of creating a new shell for Version 7 Unix (V7, January 1979), the release that would be distributed to universities and businesses worldwide and become the foundation for both the BSD and System V Unix lineages.

### Design Goals

Bourne set out to create a shell that was simultaneously:

1. **An interactive command interpreter** (replacing the Thompson shell)
2. **A programming language** (with variables, control flow, and functions)
3. **A tool for writing system startup scripts** (replacing ad-hoc `init` mechanisms)

The result was `/bin/sh`, the **Bourne shell**, distributed with V7 Unix in 1979. It was a radical advance over the Thompson shell.

### Key Features

**Variables and parameter expansion.** The Bourne shell introduced shell variables (`NAME=value`), environment variable export (`export NAME`), and the `$` expansion syntax (`$HOME`, `$PATH`, `$1`, `$@`, `$?`).

**Control flow.** A complete set of programming constructs:

```sh
if command; then
    ...
elif command; then
    ...
else
    ...
fi

while command; do
    ...
done

for var in word1 word2 word3; do
    ...
done

case $var in
    pattern1) ... ;;
    pattern2) ... ;;
esac
```

The reversed-keyword delimiters (`if/fi`, `case/esac`, `do/done`) reflected Bourne's ALGOL background. They were unusual in the Unix world and drew mild criticism, but they worked and they stayed.

**Here-documents.** A mechanism for embedding multi-line input within a script:

```sh
cat << EOF
This is a here-document.
Variables like $HOME are expanded.
EOF
```

The `<<` operator, followed by a delimiter word, told the shell to feed subsequent lines as standard input to the command until the delimiter appeared alone on a line. This was essential for writing scripts that generated configuration files, email messages, and other multi-line output.

**Signal trapping.** The `trap` built-in allowed scripts to catch and handle signals (SIGINT, SIGTERM, etc.), enabling cleanup routines and graceful shutdown.

**Command substitution.** Using backticks:

```sh
DATE=`date`
echo "Today is $DATE"
```

**Subshells.** Parenthesized groups ran in a child process: `(cd /tmp && ls)` would not change the parent shell's working directory.

### Legacy

The Bourne shell's syntax became the foundation for POSIX sh, bash, ksh, and zsh. Every `if/then/fi` in every shell script written in the last 45 years traces back to Bourne's design. The Bourne shell was replaced in practice by its descendants, but its syntax and semantics live on as the bedrock of the POSIX shell standard.

Bourne later wrote *The UNIX System* (1983), an influential introduction to Unix. He left Bell Labs in 1984 and eventually moved to Silicon Valley, working at Digital Equipment Corporation, Cisco, and several startups.

---

## 11. The C Shell (1978)

### Bill Joy

**William Nelson Joy**, born November 8, 1954, in Farmington Hills, Michigan, was a graduate student at UC Berkeley in the late 1970s and one of the most prolific contributors to the Berkeley Software Distribution (BSD). Joy wrote (or co-wrote) the C shell, `vi`, significant portions of the BSD kernel's TCP/IP stack, and the BSD virtual memory system. He later co-founded Sun Microsystems in 1982.

### csh: The Interactive Shell

Joy designed the **C shell** (`csh`) in 1978 as part of 2BSD (the second Berkeley Software Distribution). Unlike Bourne's shell, which was designed primarily as a scripting language, Joy's C shell was designed for interactive use by programmers:

**History substitution.** `csh` was the first Unix shell to provide command-line history. The `!` operator allowed users to recall and modify previous commands:

```csh
!!        # re-run last command
!42       # re-run command number 42
!grep     # re-run last command starting with "grep"
!:s/old/new/  # re-run last command with substitution
```

**Aliases.** Users could define shorthand for frequently used commands:

```csh
alias ll 'ls -la'
alias grep 'grep --color=auto'
```

**Job control.** `csh` introduced the ability to suspend running processes with Ctrl-Z, send them to the background with `bg`, bring them to the foreground with `fg`, and list running jobs with `jobs`. Job control required kernel support (the `SIGTSTP`, `SIGCONT` signals and the process group mechanism), which was added to BSD Unix in parallel with the C shell.

**C-like syntax.** Joy chose a syntax closer to C for scripting:

```csh
if ($count > 10) then
    echo "Too many"
endif

foreach file (*.txt)
    echo $file
end
```

### The csh Controversy

The C shell's scripting language, despite its superficial resemblance to C, was widely criticized. Tom Christiansen's famous 1995 essay "Csh Programming Considered Harmful" cataloged its deficiencies: inconsistent quoting rules, no functions, unreliable error handling, inability to manipulate file descriptors, and subtle parsing bugs. The conclusion, accepted as gospel in the Unix community, was: *use csh for interactive work if you like it, but write scripts in Bourne shell.*

### tcsh

**tcsh** (Ken Greer, Carnegie Mellon University, 1981; later maintained by Christos Zoulas and Paul Placeway) was an enhanced C shell that added:

- Command-line editing (emacs and vi modes)
- Programmable completion
- Spelling correction
- The `where` built-in

tcsh became the default shell on FreeBSD and was widely used on early Linux systems. It was the default interactive shell on macOS until macOS 10.3 Panther (2003), when bash took over. tcsh remains available on most Unix systems but its user base has declined steadily since the 1990s.

---

## 12. The KornShell (1983)

### David Korn

**David G. Korn**, a researcher at Bell Labs' Computing Sciences Research Center, created the **KornShell** (`ksh`) in 1983. Korn's goal was to combine the best of both worlds: the Bourne shell's scripting language (which was sound and standardizable) with the C shell's interactive features (which users loved). The result was a shell that was backward-compatible with the Bourne shell for scripting but added the interactive conveniences that `sh` lacked.

### Key Features

**Command-line editing.** `ksh` was the first Bourne-compatible shell to offer inline command editing in both **emacs** and **vi** modes. The user could press Escape to enter vi-mode editing of the current command line, or use Ctrl-P/Ctrl-N (emacs mode) to navigate history -- without leaving the command line.

**Command history.** Like `csh`, `ksh` maintained a history of commands, accessible via the `fc` (fix command) built-in and via the editing modes.

**Aliases and functions.** `ksh` supported both csh-style aliases and Bourne-style functions, giving users flexibility.

**Coprocesses.** The `|&` operator launched a background process with its standard input and output connected to the shell via pipes, allowing two-way communication between a script and a long-running subprocess:

```ksh
command |&
print -p "input to coprocess"
read -p response
```

**Associative arrays.** `ksh93` (the 1993 revision, a major rewrite) introduced associative arrays:

```ksh
typeset -A colors
colors[red]="#ff0000"
colors[green]="#00ff00"
echo ${colors[red]}
```

**Arithmetic evaluation.** `ksh` introduced the `$((...))` syntax for integer arithmetic, which was later adopted by POSIX and bash:

```ksh
result=$((2 + 3 * 4))
```

### ksh88, ksh93, and Beyond

- **ksh88** (1988): The version standardized in POSIX.2 and SVR4 Unix.
- **ksh93** (1993): A complete rewrite by Korn with associative arrays, floating-point arithmetic, compound variables, name references, and discipline functions. ksh93 was far more powerful than ksh88 but was also proprietary AT&T software.
- **Open-source release (2000):** AT&T released ksh93 under an open-source license.
- **ksh93u+ (2012):** The last AT&T-maintained release.
- **ksh2020:** A community attempt at modernization that was later abandoned.

ksh was the default shell on many commercial Unix systems (AIX, HP-UX, Solaris) and influenced both bash and zsh significantly. Its influence on POSIX was direct: the POSIX shell standard is essentially "ksh88 minus the parts that were too ksh-specific."

---

## 13. Bash (1989)

### Brian Fox and the GNU Project

**Brian J. Fox**, a programmer working for the Free Software Foundation, wrote the first version of **Bash** (Bourne-Again SHell) in 1989, at the request of Richard Stallman. The GNU Project needed a free replacement for the Bourne shell to complete the GNU operating system. At the time, `/bin/sh` was AT&T proprietary code, and the FSF's goal was to create a complete Unix-like operating system composed entirely of free software.

Fox wrote Bash from scratch (no AT&T code was used) and released it as part of the GNU project. Chet Ramey, a computer science PhD student at Case Western Reserve University, became the co-maintainer in 1990 and has been the sole maintainer since Fox left the project in 1994. Ramey has maintained Bash for over three decades -- one of the longest-running single-maintainer tenures in free software.

### Design Philosophy

Bash was designed to be:

1. **A superset of the POSIX shell.** Any valid POSIX sh script should work under bash.
2. **Backward-compatible with the Bourne shell.** Existing sh scripts should work unchanged.
3. **Inclusive of the best features from csh and ksh.** History, aliases, job control, command-line editing, arrays, and arithmetic from ksh; history substitution from csh.
4. **Freely licensed.** Under the GNU GPL.

### Key Features (Cumulative Across Versions)

**Readline.** Bash uses the **GNU Readline library** (also written by Brian Fox, later maintained by Ramey) for command-line editing. Readline provides emacs and vi editing modes, customizable key bindings (via `~/.inputrc`), search through history (Ctrl-R for reverse incremental search), and word-level manipulation. Readline is a separate library used by many other programs (Python's interactive interpreter, GDB, the MySQL client).

**Programmable completion.** Bash 2.04 (2000) introduced the `complete` and `compgen` built-ins, allowing users and distributions to define context-sensitive tab completion rules for any command. The `bash-completion` package (Ian Macdonald, later maintained by Ville Skyttae and David Paleino) provides completion rules for hundreds of common commands and is installed by default on most Linux distributions.

**Arrays.** Indexed arrays (bash 2.0, 1996) and associative arrays (bash 4.0, 2009):

```bash
# Indexed array
files=(foo.txt bar.txt baz.txt)
echo ${files[1]}    # bar.txt
echo ${#files[@]}   # 3

# Associative array (bash 4.0+)
declare -A config
config[host]="localhost"
config[port]="8080"
```

**Process substitution.** The `<(command)` and `>(command)` syntax, adopted from ksh:

```bash
diff <(sort file1) <(sort file2)
```

**Brace expansion.** `{a,b,c}` expands to `a b c`; `{1..10}` expands to `1 2 3 ... 10`.

**Here strings.** `<<<` operator (bash 2.05b, 2002):

```bash
read -r word <<< "hello world"
```

### Major Bash Versions

| Version | Year | Key Additions |
|---|---|---|
| 1.0 | 1989 | Initial release, Bourne shell compatibility |
| 2.0 | 1996 | Indexed arrays, `select`, extended globbing |
| 2.05a | 2001 | Programmable completion |
| 3.0 | 2004 | `=~` regex matching in `[[ ]]` |
| 4.0 | 2009 | Associative arrays, `coproc`, `mapfile` |
| 4.4 | 2016 | `${parameter@operator}` transformation |
| 5.0 | 2019 | `EPOCHSECONDS`, `EPOCHREALTIME`, `BASH_ARGV0`, `local -` |
| 5.1 | 2020 | `SRANDOM` (cryptographic random), `PROMPT_COMMANDS` array |
| 5.2 | 2022 | Arithmetic `++`/`--` in `for (( ))`, `READLINE_MARK` |

### Bash's Dominance

Bash became the default `/bin/sh` on most Linux distributions (until Debian switched to dash in 2006 for boot speed) and the default interactive shell on virtually all Linux systems and macOS (from 10.3 Panther in 2003 through 10.14 Mojave in 2018; macOS switched to zsh in 10.15 Catalina in 2019 due to licensing -- Apple did not want to ship GPL v3 software).

As of 2026, bash remains the most widely installed shell in the world. Every Linux distribution ships it. Every Docker container that has a shell has bash. Every CI/CD pipeline assumes bash. It is not the most loved shell among power users (zsh and fish have passionate followings), but it is the one you can count on being present.

---

## 14. Zsh (1990)

### Paul Falstad

**Paul Falstad**, a student at Princeton University, wrote the first version of **zsh** (Z shell) in 1990. The name "zsh" came from Zhong Shao, a teaching assistant at Princeton whose login name was `zsh` -- Falstad thought it was a good name for a shell.

After Falstad's initial implementation, the project was taken over by a community of developers. Peter Stephenson became the primary maintainer and has been central to zsh development for decades.

### Design Philosophy

Zsh was designed to be the maximalist shell -- incorporating features from bash, ksh, csh, and tcsh, plus original innovations, into a single comprehensive shell. Where bash aimed for POSIX compatibility with ksh/csh extensions, zsh aimed to be the most powerful interactive shell possible while also maintaining high compatibility with sh scripts.

### Key Features

**Extended globbing.** Zsh's globbing system is the most powerful of any shell:

```zsh
ls **/*.txt          # recursive glob (also in bash 4.0+ with globstar)
ls *.txt(.)          # glob qualifier: regular files only
ls *.txt(om)         # glob qualifier: order by modification time
ls *(Lk+100)         # glob qualifier: files larger than 100 KB
ls *(mw-1)           # glob qualifier: modified within last week
```

**Spell correction.** Zsh can correct misspelled commands and arguments:

```
$ gerp foo bar.txt
zsh: correct 'gerp' to 'grep' [nyae]?
```

**Loadable modules.** Zsh functionality is split into loadable modules (`zsh/zle`, `zsh/compctl`, `zsh/mathfunc`, etc.) that can be loaded on demand.

**Themeable prompts.** Zsh's prompt system supports elaborate customization through the `PROMPT` variable and the `%` escape sequences, enabling prompts that show git branch, exit status, execution time, and other context.

**ZLE (Zsh Line Editor).** Zsh's command-line editor is more extensible than Readline, supporting custom widgets (editor commands implemented as shell functions) and multi-line editing.

### oh-my-zsh and the Theme Revolution

**oh-my-zsh** (Robby Russell, 2009) is a framework for managing zsh configuration. It provides:
- 300+ plugins (git, docker, kubectl, aws, etc.)
- 150+ themes
- An auto-update mechanism
- A community of over 2,200 contributors

oh-my-zsh made zsh accessible to users who would never have configured it from scratch. Its popularity drove zsh adoption beyond the power-user niche and into the mainstream developer community.

**Powerlevel10k** (Roman Perepelitsa, 2019) is a zsh theme that pushes prompt customization to its limit: it shows git status, language version, AWS profile, Kubernetes context, and other indicators in a fast, visually rich prompt. Powerlevel10k uses a technique called "instant prompt" (displaying a cached prompt immediately while the full prompt computation runs asynchronously) to achieve sub-millisecond prompt latency even with complex configurations.

### Zsh Today

Zsh is the default shell on macOS since Catalina (10.15, October 2019). It is available on all major Linux distributions. Its combination of powerful globbing, completion, and extensibility makes it the preferred shell for developers who want maximum customization.

---

## 15. Fish (2005)

### Axel Liljencrantz

**Axel Liljencrantz**, a Swedish programmer, created **fish** (friendly interactive shell) in 2005, with a design philosophy radically different from every preceding Unix shell: *discoverability over tradition*. Fish was designed for users who had never read a shell manual and did not want to.

### Design Principles

1. **No configuration needed.** Fish works well with default settings. Syntax highlighting, autosuggestions, and tab completion work out of the box.
2. **Syntax highlighting.** Fish highlights valid commands in green and invalid ones in red *as you type*, before you press Enter. No other shell did this at the time.
3. **Autosuggestions.** Fish shows a grayed-out suggestion based on command history as you type. Press the right arrow to accept.
4. **Web-based configuration.** Running `fish_config` opens a web browser with a GUI for configuring colors, prompts, functions, and abbreviations.
5. **No POSIX compatibility.** This is the controversial decision. Fish deliberately breaks with POSIX sh syntax. There are no `$()` command substitutions in the traditional sense (fish uses `(command)` instead), no `export VAR=value` (fish uses `set -x VAR value`), no `&&`/`||` (fish originally used `; and`/`; or`, though `&&`/`||` were added in fish 3.0 in 2018 after years of user demand). The philosophy is that POSIX sh syntax is a historical accident, not a design ideal, and a modern shell should not be constrained by it.

### Fish Syntax

```fish
# Variables
set name "world"
echo "Hello, $name"

# Functions
function greet
    echo "Hello, $argv[1]"
end

# Conditionals
if test (count $argv) -gt 0
    echo "Arguments: $argv"
end

# Loops
for file in *.txt
    echo $file
end
```

### Fish's Influence

Fish proved that a shell could be user-friendly without being a toy. Its autosuggestions and syntax highlighting were so popular that both were back-ported as plugins to zsh (zsh-autosuggestions, zsh-syntax-highlighting) and bash (ble.sh). Fish demonstrated that the "expert-only" reputation of the command line was a design choice, not an inherent property.

Fish 3.0 (December 2018) rewrote the parser and added `&&`/`||`, making it more approachable for users coming from bash. Fish 4.0 (December 2024, beta in 2023) was a major milestone: the implementation language was changed from C++ to Rust, a multi-year effort that resulted in a faster, more memory-safe codebase.

---

## 16. The POSIX Shell Standard

### What POSIX Mandates

The **POSIX.2** standard (IEEE Std 1003.2, first published in 1992; the shell and utilities portion is now part of POSIX.1-2017, also known as IEEE Std 1003.1-2017) defines a portable shell language and a set of utilities that conforming systems must provide. The POSIX shell is based on the KornShell (ksh88), with some features removed for portability:

**Required features:**
- Variable assignment and expansion (`$VAR`, `${VAR}`, `${VAR:-default}`)
- All Bourne shell control flow (`if/then/fi`, `while/do/done`, `for/do/done`, `case/esac`)
- Functions (`name() { ... }`)
- Command substitution (`$(command)` -- the POSIX standard specifies `$(...)` over backticks)
- Here-documents (`<<`)
- I/O redirection (`>`, `>>`, `<`, `2>&1`)
- Pipes (`|`)
- The `test` / `[` built-in
- `set`, `unset`, `export`, `readonly`
- Signal trapping (`trap`)
- `$?`, `$!`, `$$`, `$#`, `$@`, `$*`

**Not required by POSIX:**
- Arrays (indexed or associative)
- `[[ ]]` extended test syntax
- Brace expansion (`{a,b,c}`)
- Process substitution (`<(command)`)
- `select` loops
- The `source` command (POSIX specifies `.` instead)
- Arithmetic `for (( ))` loops

### Why POSIX Matters

POSIX compliance matters because shell scripts are infrastructure. Init scripts, CI/CD pipelines, Dockerfiles, Makefiles, and build systems all invoke `/bin/sh`. If `/bin/sh` is a POSIX-compliant shell, scripts written to POSIX syntax will work. If `/bin/sh` is bash (which accepts non-POSIX syntax like `[[ ]]` and arrays), scripts may accidentally use bash-specific features and break on systems where `/bin/sh` is not bash.

**Debian/Ubuntu** switched `/bin/sh` from bash to **dash** (Debian Almquist Shell, a minimal POSIX-compliant shell) in 2006 to improve boot speed. Dash is dramatically faster than bash for script execution because it is smaller and simpler (roughly 30,000 lines of C vs. bash's 170,000+). This switch exposed thousands of scripts that used bash-specific syntax under a `#!/bin/sh` shebang -- a painful but necessary lesson in portability.

### Compliance Differences

| Feature | POSIX sh | bash | zsh | dash | ksh93 |
|---|---|---|---|---|---|
| Arrays | No | Yes | Yes | No | Yes |
| `[[ ]]` | No | Yes | Yes | No | Yes |
| Associative arrays | No | Yes (4.0+) | Yes | No | Yes |
| Process substitution | No | Yes | Yes | No | Yes |
| Brace expansion | No | Yes | Yes | No | Yes |
| `local` keyword | No | Yes | Yes | Yes* | No |
| `source` built-in | No | Yes | Yes | No | Yes |
| Arithmetic `(( ))` | No | Yes | Yes | No | Yes |

\* dash supports `local` as an extension despite it not being in POSIX.

---

## 17. PowerShell (2006)

### Jeffrey Snover and the Monad Manifesto

**Jeffrey Snover**, a Microsoft Technical Fellow and Distinguished Engineer, began designing what would become PowerShell in the early 2000s. His 2002 white paper, the **Monad Manifesto**, laid out the vision: Windows system administration was broken because it relied on GUIs that could not be scripted, and the existing Windows command-line tools (CMD.exe, VBScript, WScript) were inadequate for managing large-scale Windows infrastructure.

Snover's key insight was that Unix pipes carry *text*, and every tool in a pipeline has to parse that text to extract structured data -- a process that is brittle, locale-dependent, and lossy. PowerShell would pipe *objects*. Every cmdlet (command) in PowerShell receives .NET objects as input and emits .NET objects as output. Formatting is applied only at the final display stage, not at each step of the pipeline.

### The Object Pipeline

```powershell
# This is not string parsing -- each item in the pipeline is a .NET object
Get-Process | Where-Object { $_.CPU -gt 100 } | Sort-Object CPU -Descending | Select-Object Name, CPU
```

In a Unix shell, the equivalent requires parsing `ps` output with `awk` or `cut`, which is fragile if the column layout changes. In PowerShell, `Get-Process` returns `System.Diagnostics.Process` objects with typed properties, and `Where-Object` filters on those properties directly.

### Key Features

- **Cmdlet naming convention:** `Verb-Noun` (e.g., `Get-ChildItem`, `Set-Location`, `Invoke-WebRequest`)
- **Providers:** Abstract file systems, the registry, environment variables, certificates, and other stores as navigable drives (`C:`, `HKLM:`, `Env:`, `Cert:`)
- **Remoting:** `Enter-PSSession` and `Invoke-Command` for remote administration via WinRM
- **Pipeline by property name:** Objects can be passed between cmdlets with automatic property binding
- **Rich type system:** Built on the .NET Common Language Runtime

### Cross-Platform PowerShell

In 2016, Microsoft released **PowerShell Core** (version 6.0) as open-source software under the MIT License, running on Windows, macOS, and Linux via .NET Core. PowerShell 7.x (2020-present, built on .NET 5/6/7/8) is the current cross-platform version.

PowerShell's adoption outside Windows has been modest but real, particularly for managing Azure cloud resources, for which PowerShell has first-class support via the `Az` module. In the Linux/macOS world, it occupies a niche for administrators who manage mixed Windows/Linux environments.

### PowerShell Version History

| Version | Year | Runtime | Key Change |
|---|---|---|---|
| 1.0 | 2006 | .NET Framework 2.0 | Initial release |
| 2.0 | 2009 | .NET Framework 2.0 | Remoting, modules, background jobs |
| 3.0 | 2012 | .NET Framework 4.0 | Workflows, improved cmdlet discovery |
| 5.1 | 2016 | .NET Framework 4.5.2 | Classes, package management |
| 6.0 | 2018 | .NET Core 2.x | Open-source, cross-platform |
| 7.0 | 2020 | .NET Core 3.1 | Merged Windows/Core feature sets |
| 7.4 | 2023 | .NET 8.0 | LTS, performance improvements |

---

## 18. The Modern Shell Renaissance

Starting around 2015, a wave of new shells appeared, each questioning fundamental assumptions about what a shell should be.

### Oil / Oils (Andy Chu, 2016)

**Andy Chu**, a former Google engineer, began the **Oil Shell** project in 2016 (later renamed **Oils** in 2023) with an ambitious goal: fix bash by creating a shell that could *parse existing bash scripts faithfully* while offering a new, cleaner language (OSH for bash compatibility, YSH for the new syntax) as a migration path.

Oils is implemented in Python (compiled to C via a custom translation tool called mycpp) and aims to be a drop-in replacement for bash that also offers:
- A proper expression language with Python-like syntax
- Typed variables (Str, Int, Float, List, Dict)
- Structured data (JSON integration)
- Better error handling

```ysh
# YSH syntax (the new language)
var name = 'world'
echo "Hello, $name"

var files = $(find . -name '*.py')
for f in (files) {
  echo $f
}
```

### Nushell (Jonathan Turner, Yehuda Katz, and Andr{e}s Robalino, 2019)

**Nushell** (`nu`) reimagines the shell around structured data. Every command in Nushell operates on tables (structured records with named columns), not text streams. It draws inspiration from PowerShell's object pipeline, functional programming, and modern data tools like pandas.

```nu
# List files as a table
ls | where size > 1mb | sort-by modified

# Parse structured data natively
open data.json | get users | where age > 30

# Built-in data types
let x = {name: "Foxy", age: 50}
echo $x.name
```

Nushell is written in Rust, cross-platform, and has grown a dedicated community. It represents perhaps the most radical rethinking of the shell since PowerShell: every pipeline stage operates on typed, structured data with a consistent query language.

### Elvish (Qi Xiao, 2016)

**Elvish** is a shell that combines a proper programming language (with namespaces, closures, exception handling, and a pipeline that can carry values of any type) with a rich interactive experience (real-time syntax highlighting, structured argument completion, a built-in file navigator). Elvish is written in Go and positions itself as a shell for programmers who want their shell to be a real language, not a string-processing DSL.

### Xonsh (Anthony Scopatz, 2015)

**Xonsh** (pronounced "conch") is a Python-powered shell: it accepts both standard shell commands and Python expressions, with seamless interleaving. Any Python expression can be embedded in a shell command, and any shell command can be called from Python code.

```xonsh
# Mix Python and shell freely
for f in $(ls *.py):
    if 'import' in open(f).read():
        print(f'Found imports in {f}')
```

Xonsh appeals to data scientists and Python developers who live in a Python ecosystem and want their shell to speak the same language.

### Murex (Laurence Morgan, 2018)

**Murex** is a shell designed for DevOps and infrastructure work, with typed pipes (JSON, CSV, YAML, S-expression, and generic types), inline spell checking, smart autocompletion, and a built-in test framework. It aims to bring the safety and introspection of modern programming languages to the shell, while remaining familiar to bash users.

---

## 19. Shell Comparison Matrix

| Shell | Author | Year | Language | POSIX | Key Strength |
|---|---|---|---|---|---|
| Thompson sh | Ken Thompson | 1971 | C | N/A | First Unix shell |
| Bourne sh | Stephen Bourne | 1979 | C | Basis | Scripting language foundation |
| csh | Bill Joy | 1978 | C | No | Interactive features, history |
| ksh | David Korn | 1983 | C | Yes | Combined scripting + interactive |
| bash | Brian Fox | 1989 | C | Superset | Ubiquity, GNU ecosystem |
| zsh | Paul Falstad | 1990 | C | Superset | Maximalist, themes |
| dash | Herbert Xu | 1997 | C | Yes | Minimal, fast script execution |
| fish | Axel Liljencrantz | 2005 | C++/Rust | No | User-friendly, discoverable |
| PowerShell | Jeffrey Snover | 2006 | C# | No | Object pipeline, .NET |
| Elvish | Qi Xiao | 2016 | Go | No | Typed pipeline, real language |
| Oils | Andy Chu | 2016 | Python/C | Superset | Bash compatibility + new syntax |
| Nushell | Turner, Katz, Robalino | 2019 | Rust | No | Structured data pipeline |

---

## Epilogue: The Shell as Survivor

The command-line shell has survived every attempt to replace it. Graphical file managers did not replace `ls`. IDEs did not replace `make`. Web dashboards did not replace `ssh`. Voice assistants did not replace `grep`. Each new interface paradigm added a layer on top of the command line; none removed it.

The reason is compositional. A shell command is a function: it takes input, produces output, and can be composed with other commands via pipes, redirection, and substitution. This compositionality is the same property that makes mathematical functions, Unix pipes, and functional programming endure: the ability to build complex behavior from simple, well-defined parts.

The terminal, too, has survived -- not as a physical device, but as an abstraction. The pseudo-terminal in the kernel, the escape-code protocol in the emulator, the line discipline in the driver, the terminfo database in the library -- these are layers of abstraction built up over sixty years, each one accommodating the one below it while presenting a stable interface to the one above. When you type `ls` in a GPU-accelerated terminal emulator in 2026, the bytes travel the same conceptual path they did on a VT100 in 1978: keyboard to terminal to pty to shell to kernel to program and back.

What has changed is not the architecture but the surface: the terminal now renders Unicode, true-color graphics, and inline images; the shell now manipulates structured data, manages cloud resources, and embeds full programming languages. The fossil record of teletypes, punch cards, and DEC hardware remains visible in every 80-column default, every `\n` line ending, every `/dev/pts/` device file. The old constraints were never removed. They were built upon, layer by layer, until the original teletype was entirely encased in software -- like a fossil preserved in amber, still determining the shape of the structure around it.

---

## Addendum: The 2025–2026 Terminal Renaissance

This section was added in April 2026 as part of a catalog-wide enrichment
pass. The main history above closes with a theoretical note on survival.
The survival story continues, and 2025 was an unusually interesting year
for terminal emulators specifically — the first year in a long time when
the terminal layer was newsworthy on its own merits rather than as
context for the shell or the application running in it.

### Ghostty 1.0 (late 2024 → 2025)

Ghostty, a new terminal emulator written in Zig by Mitchell Hashimoto
(co-founder of HashiCorp), reached 1.0 in late 2024 and spent 2025 as
one of the most discussed developer tools of the year. Its defining
design choices set the tone for the whole conversation:

- **Platform-native UI.** Ghostty uses AppKit directly on macOS and
  GTK on Linux, rather than a cross-platform rendering layer. The
  practical effect is that its input latency is — in several
  independent benchmarks — the lowest of any terminal emulator ever
  measured, which is an odd thing to be able to say about a sixty-year-old
  abstraction.
- **GPU acceleration** for cell rendering.
- **No account system, no telemetry, no cloud.** The comparison point
  here is Warp (see below), and Ghostty's position is that a terminal
  is a local-first tool whose job is to stay out of the way.
- **Standards-compliant with existing shells and multiplexers.** Ghostty
  does not try to replace `tmux`, `zellij`, `fish`, or `zsh`. It tries
  to be the fastest possible host for them.
- **macOS and Linux only.** Windows support is explicitly not on the
  roadmap.

In 2025 the Ghostty project moved under Hack Club's 501(c)(3) umbrella,
which gives it a long-term governance story that a single-author project
would not have. The combination of "fastest terminal in existence",
"HashiCorp-founder pedigree", and "local-first privacy posture" made
Ghostty the de facto 2025 replacement for iTerm2 on macOS among
developers who had grown tired of the sprawl of older emulators.

**Sources:** [Ghostty — ghostty.org](https://ghostty.org/) · [Warp vs. Ghostty: Which Terminal App Meets Your Dev Needs? — The New Stack](https://thenewstack.io/warp-vs-ghostty-which-terminal-app-meets-your-dev-needs/) · [Ghostty: A Fast, Modern, and Private Terminal Emulator — henrywithu.com](https://henrywithu.com/ghostty-a-fast-modern-and-private-terminal-emulator/) · [Best Terminal Emulators 2026: Warp vs Ghostty vs Kitty vs Alacritty vs iTerm2 Compared — DevToolReviews](https://www.devtoolreviews.com/reviews/best-terminal-emulators-2026)

### Warp — the AI-terminal alternative

Warp, which predates Ghostty by several years, took the opposite bet:
instead of treating the terminal as a thin, fast host for existing
shells, treat it as a product with a GPU renderer, a structured block
model for command output, and an integrated AI assistant that can
generate, explain, and debug commands. Warp requires a login. Warp
sends usage data. Warp is positioned as a collaborative, AI-native
development environment that happens to speak shell protocol.

The 2025 conversation between Ghostty and Warp is the most interesting
thing the terminal emulator space has hosted in a decade. It is not a
fight about speed or features — it is a fight about what a terminal
*is*. Ghostty's position is that a terminal is a transport protocol
and a rendering surface, full stop. Warp's position is that a terminal
is a conversational IDE that runs commands. Both positions have real
constituencies; both have been stable throughout 2025.

### The multiplexer-as-terminal trend

A quieter thread in 2025 was the continued rise of **Zellij** and
**Wezterm** as "terminal multiplexer and emulator in one binary"
products. Zellij, in particular, reached a level of maturity in 2025
where it was a plausible default for developers who had previously
used `tmux` inside iTerm2 or Alacritty, and Wezterm remained the
cross-platform choice for users who wanted a single tool on
macOS, Linux, and Windows.

### Nushell keeps cooking

The structured-data shell trend that produced Nushell in 2019 continued
through 2025. Nushell's typed-pipeline model has not replaced bash or
zsh, and nobody expects it to, but it has found a stable constituency
among users who do data-wrangling work at the shell — and the community
ports of Nushell's structured display approach are starting to show up
in fish and PowerShell in subtler forms. The shell-as-language direction
(Elvish, Oils, Nushell) remains a real, if minority, path forward.

### What this means for the history

The terminal and shell have always been moving targets. What is
characteristic about the 2025 moment is that the two questions — "how
fast can the transport be" and "how smart can the interface be" — have
finally split into two separate products that both take themselves
seriously. For forty years the shell was the interesting part and the
terminal was a dumb pipe. For the next few years, the terminal is going
to be a product category again. That has not been true since the
CRT-era DEC VT series, and it is the sort of thing a history document
that closes on "the shell as survivor" has to acknowledge at least in
passing.

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  Shell scripting sits in the Programming Fundamentals wing. The Unix
  command-line toolkit is the canonical example of a composable
  programming environment built from small pieces with simple
  interfaces.
- [**digital-literacy**](../../../.college/departments/digital-literacy/DEPARTMENT.md)
  — The command line is the baseline interface for serious computing,
  and digital-literacy's relationship to it is complicated: most
  students will never need to use a shell, and the ones who do will
  need it fluently.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) —
  The path from the teletype to the GPU-accelerated terminal emulator
  is sixty years of accumulated layering, each layer preserving the
  one below it. This is one of the cleanest examples of
  backwards-compatibility-as-fossil-record in all of computing.
- [**art**](../../../.college/departments/art/DEPARTMENT.md) — The
  terminal is also an aesthetic object. `culture-art.md` is the entry
  point for this thread, and the art department is the natural home
  for the ASCII, ANSI, and Unicode typography traditions that the CLI
  carries forward.

---

*PNW Research Series -- tibsfox.com*
*Written April 2026*
*Addendum (2025–2026 Terminal Renaissance) and College Departments cross-link added during the Session 018 catalog enrichment pass.*
