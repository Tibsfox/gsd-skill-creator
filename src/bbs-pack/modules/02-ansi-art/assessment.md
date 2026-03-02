# Module 2: ANSI Art -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Conceptual

Explain the difference between CP437's treatment of bytes 0x00-0x1F and standard ASCII's treatment of the same byte range. Why did IBM choose to assign visible glyphs to these byte values instead of using them as control characters? What consequence does this have for rendering ANSI art in a modern Unicode terminal?

## Question 2: Protocol Analysis

Parse the following ANSI escape sequence and predict the terminal state after processing it:

```
ESC[2J ESC[1;1H ESC[0;44m ESC[2K ESC[1;37;44m Welcome to The Crystal Palace BBS ESC[0m
```

Describe the screen state after each sequence is processed (what is cleared, where the cursor is, what colors are active, and what text appears).

## Question 3: Application

Given the CP437 byte sequence `0xDA 0xC4 0xC4 0xC4 0xBF`, with the current SGR state set to `ESC[1;33;40m` (bold yellow on black background), describe exactly what would appear on screen. Name each CP437 character and explain what visual structure this sequence creates.

## Question 4: Analysis

Explain why SAUCE metadata is placed at the END of an ANSI art file rather than at the beginning. Consider three scenarios: (1) a BBS terminal displaying the file byte-by-byte as it arrives over a modem, (2) an ANSI art viewer application that needs to know the artwork's dimensions before allocating a display buffer, (3) a file listing utility that needs to show the artist name and title. Which scenarios benefit from end-of-file placement, and which are made harder by it?

## Question 5: Reasoning

An ANSI artist wants to create a smooth horizontal gradient effect using only the CGA 16-color palette and CP437 characters. The gradient should transition from solid dark blue on the left to solid bright cyan on the right across a single row of 80 columns. Describe a technique using block and shade characters (0xDB full block, 0xB2 dark shade, 0xB1 medium shade, 0xB0 light shade) combined with strategic foreground/background color changes to simulate a gradient with more apparent color steps than the palette directly provides.

## Answer Key

### Answer 1

In standard ASCII, bytes 0x00-0x1F are control characters: 0x07 is BEL (audible alert), 0x08 is BS (backspace), 0x0A is LF (line feed), 0x0D is CR (carriage return), 0x1B is ESC (escape), and so on. These bytes are interpreted as commands, not displayed as visible characters.

In CP437, IBM assigned visible glyphs to these byte values: 0x01 is a smiley face, 0x02 is an inverse smiley, 0x03 is a heart, 0x04 is a diamond, 0x05 is a club, 0x06 is a spade, and so on. IBM made this choice because the PC's BIOS operated in a memory-mapped text mode where every byte in video memory was rendered as a character. Having 256 visible glyphs instead of 223 (256 minus 33 control characters) gave programmers and artists a richer character set for text-mode interfaces and games.

The consequence for modern terminals is that Unicode terminals do not display these byte values as CP437 glyphs -- they interpret them as control characters or ignore them. Rendering ANSI art in a modern terminal requires an explicit CP437-to-Unicode mapping that translates byte 0x03 to Unicode U+2665 (heart), byte 0x01 to U+263A (smiley face), and so on. Without this mapping, any ANSI art that uses bytes below 0x20 will render incorrectly or not at all.

### Answer 2

Processing each sequence in order:

1. **ESC[2J** -- Clears the entire screen. Cursor moves to row 1, column 1 (home position). Screen is now blank with default attributes.

2. **ESC[1;1H** -- Moves cursor to row 1, column 1. Redundant after ESC[2J but explicit. Cursor is at top-left.

3. **ESC[0;44m** -- Resets all attributes (0), then sets background color to blue (44). Text will now appear with default foreground (light gray/white) on blue background.

4. **ESC[2K** -- Clears the entire current line (row 1) using the current background color. Row 1 is now a solid blue line across all 80 columns. Cursor remains at row 1, column 1.

5. **ESC[1;37;44m** -- Sets bold (1), foreground to white (37), background to blue (44). Bold + white (37) gives bright white foreground. Background remains blue.

6. **" Welcome to The Crystal Palace BBS "** -- This text is displayed starting at row 1, column 1 in bright white on blue. The cursor advances to the column after the last character.

7. **ESC[0m** -- Resets all attributes to default (light gray on black).

Final state: Row 1 is a blue bar containing "Welcome to The Crystal Palace BBS" in bright white text. The rest of the blue bar (columns after the text) remains solid blue from the ESC[2K. All other rows are blank with default attributes. Cursor is on row 1 at the column after the text, with attributes reset to default.

### Answer 3

With SGR state `ESC[1;33;40m` (bold yellow foreground, black background), the CP437 byte sequence renders as:

1. **0xDA** -- Top-left corner of a single-line box (looks like a right angle: lines going right and down). Displayed in bright yellow.
2. **0xC4** -- Horizontal single line. Displayed in bright yellow.
3. **0xC4** -- Another horizontal single line. Displayed in bright yellow.
4. **0xC4** -- Another horizontal single line. Displayed in bright yellow.
5. **0xBF** -- Top-right corner of a single-line box (lines going left and down). Displayed in bright yellow.

The visual result is the **top edge of a single-line box**: a yellow line segment starting with a top-left corner, extending horizontally for 3 characters, and ending with a top-right corner, all on a black background. This is the beginning of a window border or panel frame, a ubiquitous visual element in BBS interfaces. The corresponding bottom edge would use 0xC0 (bottom-left corner), 0xC4 (horizontal line), and 0xD9 (bottom-right corner).

### Answer 4

**End-of-file placement benefits scenario (1) directly.** When a BBS terminal receives an ANSI file byte-by-byte over a modem, it processes and displays each byte as it arrives. If SAUCE metadata were at the beginning, the terminal would need to parse and skip 128+ bytes of binary metadata before displaying the art. Worse, the SAUCE binary data might contain bytes that look like ANSI escape sequences, causing display corruption. With SAUCE at the end, the terminal simply displays the art stream and the SAUCE record arrives after the last visible character -- most terminals just display it as garbage characters on the last line, which is harmless.

**Scenario (2) is made harder by end-of-file placement.** An ANSI art viewer that needs dimensions (TInfo1 for width, TInfo2 for height) must seek to the end of the file, read the SAUCE record, extract the dimensions, then seek back to the beginning to start rendering. With metadata at the beginning, the viewer could read dimensions first and allocate the buffer in a single forward pass. This is a minor inconvenience for local files but would be significant for streaming scenarios.

**Scenario (3) is also made harder.** A file listing utility must read the end of every .ANS file to extract the artist name and title, rather than reading a header at a known offset. For large directories with hundreds of ANSI files, this means many seek operations.

The design choice prioritized the most common use case: displaying art on a terminal over a serial connection, where forward-only streaming was the norm and seeking was impossible.

### Answer 5

The technique uses foreground/background color pairing with shade characters to create intermediate visual tones between two colors:

**Zone 1 (columns 1-16): Solid dark blue.** ESC[0;34;40m with full block (0xDB). The full block fills the cell entirely with the foreground color (dark blue).

**Zone 2 (columns 17-28): Dark blue to blue transition.** ESC[0;34;44m (dark blue foreground, blue background) with shade characters: dark shade (0xB2) shows mostly dark blue with some blue showing through, medium shade (0xB1) shows equal parts, light shade (0xB0) shows mostly blue with some dark blue.

**Zone 3 (columns 29-40): Solid blue.** ESC[0;34;44m with full block, or ESC[0;44m with space -- both produce solid blue.

**Zone 4 (columns 41-52): Blue to cyan transition.** ESC[0;34;46m (dark blue foreground, cyan background) with shades from dark to light, creating a blue-to-cyan transition.

**Zone 5 (columns 53-64): Solid cyan.** ESC[0;36;40m with full block produces solid dark cyan.

**Zone 6 (columns 65-76): Cyan to bright cyan transition.** ESC[1;36;46m (bright cyan foreground, dark cyan background) with shade characters.

**Zone 7 (columns 77-80): Solid bright cyan.** ESC[1;36;40m with full block.

The key insight is that each shade character creates a visual "mix" of the foreground and background colors, effectively tripling the number of apparent color steps between any two palette colors. By choosing adjacent palette colors and transitioning through shade characters, you get approximately 4 visual steps per color pair (full block, dark shade, medium shade, light shade) instead of just 2 (one color or the other).
