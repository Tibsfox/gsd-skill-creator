# Module 1: Terminal and Modem Protocols

> **Tier**: 1 | **Safety Mode**: Annotate

## Overview

The bulletin board system begins with a wire. Before TCP/IP, before Ethernet, before WiFi, a personal computer connected to a remote BBS through a modem and a telephone line using the RS-232 serial interface standard. The modem converted digital data into audio tones that could travel over the analog telephone network, and the RS-232 standard defined how the computer talked to the modem. Every BBS session started the same way: a user's terminal software opened the serial port, sent Hayes AT commands to initialize the modem, dialed the phone number, and waited for the carrier signal that meant another modem had answered. -- EIA/TIA-232; Hayes AT Command Standard

This module covers the physical and data-link layers of BBS communication: the RS-232 serial interface, UART framing, Hayes AT modem commands, flow control, and the file transfer protocols (XMODEM through ZMODEM) that enabled reliable binary data exchange over noisy telephone lines. These protocols form the foundation that all other BBS modules build upon -- ANSI art travels over this serial link, FidoNet packets are exchanged using ZMODEM, and door games inherit this serial connection from the BBS software. -- EIA/TIA-232; XMODEM/YMODEM/ZMODEM

## Topics

### Topic 1: RS-232 Serial Interface

RS-232 (formally EIA/TIA-232) defines the electrical characteristics and pin assignments for serial communication between a Data Terminal Equipment (DTE, the computer) and Data Circuit-Terminating Equipment (DCE, the modem). The standard specifies voltage levels using inverted logic: a logical 1 is represented by -3V to -15V, and a logical 0 by +3V to +15V. This voltage swing provides substantial noise immunity compared to TTL levels. The key signal lines on the DE-9 connector are TxD (Transmit Data, pin 3), RxD (Receive Data, pin 2), GND (Signal Ground, pin 5), DTR (Data Terminal Ready, pin 4), DSR (Data Set Ready, pin 6), RTS (Request to Send, pin 7), CTS (Clear to Send, pin 8), and DCD (Data Carrier Detect, pin 1). The original DB-25 connector carried additional signals, but the 9-pin DE-9 became the standard on IBM PC compatibles because BBS communication rarely needed the extra lines. -- EIA/TIA-232, signal definitions

### Topic 2: Baud Rates and Modulation

Baud rate measures the number of symbol transitions per second on the line, while bit rate (bps) measures the actual data throughput. At low speeds they are identical: the Bell 103 modem transmitted at 300 baud, encoding one bit per symbol, yielding 300 bps. The Bell 212A modem used differential phase-shift keying (DPSK) at 600 baud with 2 bits per symbol, yielding 1200 bps. The ITU-T V.32 standard achieved 9600 bps at 2400 baud using quadrature amplitude modulation (QAM) with 4 bits per symbol. V.34 pushed to 33,600 bps using trellis-coded modulation. The progression from 300 bps to 56,000 bps spanned roughly 15 years (1981-1996), and each speed increase transformed the BBS experience -- a 300 bps session scrolled text character by character, while 14,400 bps made ANSI art animation practical. -- Hayes AT Command Standard; EIA/TIA-232

### Topic 3: UART Framing

The Universal Asynchronous Receiver/Transmitter (UART) handles the byte-level framing of serial data. Each character is wrapped in a frame: one start bit (always logical 0), 5 to 8 data bits (8 being standard for BBS communication), an optional parity bit for error detection, and 1 or 2 stop bits (always logical 1). The common BBS setting was "8N1" -- 8 data bits, no parity, 1 stop bit -- yielding 10 total bits per character (including start and stop). At 2400 bps with 8N1 framing, the effective throughput was 240 characters per second. The IBM PC's original 8250 UART had only a 1-byte buffer, causing character loss at speeds above 9600 bps unless the CPU serviced interrupts fast enough. The 16550A UART introduced a 16-byte FIFO buffer that made reliable high-speed communication possible on PCs. -- EIA/TIA-232, framing conventions

### Topic 4: Hayes AT Command Set

The Hayes Smartmodem 300 (1981) introduced the "AT" command prefix that became the universal modem control language. Every command begins with "AT" (for "Attention"), which also enables auto-baud detection. The essential commands for BBS operation are: ATZ (reset modem to stored profile), ATDT (dial using touch-tone), ATDP (dial using pulse), ATA (answer incoming call), ATH (hang up), ATO (return to data mode from command mode), ATM and ATL (speaker control and volume), and ATS followed by a register number to read or write configuration registers. S0 controls auto-answer ring count, S7 sets the wait-for-carrier timeout, and S12 sets the escape sequence guard time. The AT command set was so successful that it became a de facto standard adopted by every modem manufacturer, and its influence persists in cellular modem AT commands used today. -- Hayes AT Command Standard

### Topic 5: Auto-Baud Detection

When a modem receives the characters "AT", the bit patterns of these two ASCII characters allow it to determine the caller's baud rate. "A" (0x41, binary 01000001) and "T" (0x54, binary 01010100) contain a mix of transitions that differ predictably at different baud rates. The modem measures the timing of the start bit and early data bits of the "A" character, compares against known patterns for each supported baud rate, and locks its receive clock accordingly. This is why every Hayes command starts with "AT" -- the two letters serve double duty as both an attention signal and a baud rate training sequence. Some modems required the user to type "AT" several times for reliable detection, particularly at higher speeds where timing margins were tighter. -- Hayes AT Command Standard

### Topic 6: Command Mode versus Data Mode

A Hayes-compatible modem operates in two distinct modes. In command mode, characters sent to the modem are interpreted as AT commands. In data mode (also called online mode), characters pass through transparently to the remote system. The modem enters data mode after a successful ATDT dial and carrier connection. To return to command mode without dropping the connection, the user sends the escape sequence: a pause of at least one second (the guard time), then "+++" (three plus signs), then another one-second pause. The guard time prevents accidental mode switches when the data stream contains "+++" as part of normal content. The ATO command returns from command mode to data mode. This two-mode architecture means BBS software could issue modem commands (like checking signal quality or adjusting speaker volume) mid-session without disconnecting. -- Hayes AT Command Standard

### Topic 7: Flow Control

When data arrives faster than the receiving end can process it, flow control prevents buffer overflows and data loss. Hardware flow control uses the RTS (Request to Send) and CTS (Clear to Send) signal lines: when the receiver's buffer fills, it deasserts CTS, and the sender must stop transmitting until CTS is reasserted. Software flow control uses in-band XON (0x11, Ctrl-Q) and XOFF (0x13, Ctrl-S) characters: the receiver sends XOFF to pause the sender and XON to resume. Hardware flow control is preferred for BBS communication because XON/XOFF characters can collide with binary data during file transfers -- a 0x13 byte in a ZIP file would falsely pause transmission. BBS software typically configured RTS/CTS flow control between the computer and modem, and the modem handled flow control to the remote modem independently. -- EIA/TIA-232, flow control

### Topic 8: XMODEM Protocol

Ward Christensen created XMODEM in 1977, making it the first widely used file transfer protocol for personal computers. XMODEM is receiver-driven: the receiver initiates the transfer by sending a NAK (0x15) character, prompting the sender to begin. Each block consists of SOH (0x01), a one-byte block number, the one's complement of the block number, 128 bytes of data, and a one-byte checksum. The receiver either ACKs (acknowledges) each block or NAKs it for retransmission. XMODEM-CRC replaced the simple checksum with a 16-bit CRC for better error detection. The protocol's limitations were significant: the small 128-byte block size meant high per-block overhead on clean lines, there was no provision for transmitting filenames or file sizes, and the receiver had no way to know when the transfer was complete except by receiving an EOT (End of Transmission) marker. Despite these limitations, XMODEM's simplicity made it universal. -- XMODEM/YMODEM/ZMODEM

### Topic 9: YMODEM Improvements

YMODEM, designed by Chuck Forsberg, extended XMODEM with three key improvements. First, it introduced 1024-byte blocks (using STX instead of SOH as the block header), reducing per-block overhead by 8x on clean lines. Second, it added batch transfer capability: block 0 contains the filename, file size, and modification date, allowing multiple files to be sent in sequence without manual intervention. Third, the larger blocks and batch mode made YMODEM practical for the multi-file downloads common on BBS file sections. YMODEM-G was a variant that eliminated per-block acknowledgments for use on error-correcting modems, achieving higher throughput by streaming blocks continuously, but a single error aborted the entire transfer. -- XMODEM/YMODEM/ZMODEM

### Topic 10: ZMODEM Protocol

ZMODEM, also created by Chuck Forsberg in 1988, represented the state of the art in BBS file transfer. It used variable-length blocks up to 8KB, 32-bit CRC error detection, and a streaming protocol that did not wait for per-block acknowledgments -- the sender transmitted continuously and the receiver only interrupted on error. ZMODEM's crash recovery feature was transformative: if a transfer was interrupted (by a phone line drop or timeout), the receiver could resume from the last successfully received position rather than starting over. For a 1MB file at 2400 bps (roughly a 70-minute transfer), this eliminated the frustration of losing an hour of download time. ZMODEM also featured auto-start: the receiver detected the sender's ZRQINIT header and began the transfer automatically, without the user needing to initiate it manually. FidoNet mailers adopted ZMODEM as their preferred file transfer protocol because of these reliability and efficiency features. -- XMODEM/YMODEM/ZMODEM

### Topic 11: Error Detection and Correction

The evolution from XMODEM's checksum to ZMODEM's 32-bit CRC reflects the practical challenge of transferring data over noisy telephone lines. A simple arithmetic checksum (sum of bytes mod 256) catches many errors but has only a 1-in-256 chance of detecting a random corruption. CRC-16 (used in XMODEM-CRC and YMODEM) uses polynomial division to detect all single-bit and double-bit errors, all odd numbers of errors, and all burst errors shorter than 17 bits. CRC-32 (used in ZMODEM) extends this to detect all burst errors shorter than 33 bits. On a noisy phone line where static bursts could corrupt multiple consecutive bytes, the difference between checksum and CRC-32 was the difference between a corrupted download and a reliable one. Error-correcting modems (V.42/MNP) added link-layer error correction, but the file transfer protocol's own CRC remained important as a defense against errors introduced between the modem and the computer. -- XMODEM/YMODEM/ZMODEM

### Topic 12: BBS Terminal Emulation

The BBS caller's terminal software was responsible for interpreting the data stream received over the serial connection. The most common terminal emulation mode was ANSI-BBS, which interpreted ANSI escape sequences (covered in Module 2) for color, cursor positioning, and text attributes. Other emulation modes included VT100 (the DEC standard that ANSI-BBS was loosely based on), TTY (plain text, no escape sequences), and RIPscrip (a graphical protocol for vector-based BBS interfaces). The terminal software also handled local keyboard mapping, scroll-back buffers, capture-to-disk logging, and phonebook management for storing BBS numbers. Popular terminal programs included Telix, Qmodem, Terminate, and ProComm Plus. The terminal emulation setting had to match what the BBS expected -- sending ANSI art to a TTY terminal produced garbage, and a VT100 terminal might misinterpret some ANSI-BBS extensions. -- EIA/TIA-232; ANSI X3.64 / ECMA-48

## Learn Mode Depth Markers

### Level 1: Practical

> A modem converts digital bits to audio tones for telephone transmission. The Hayes AT command set controls it: ATZ resets, ATDT dials a number, ATH hangs up, ATA answers. For file transfers, ZMODEM is the best choice -- it streams data, recovers from interruptions, and starts automatically. -- Hayes AT Command Standard; XMODEM/YMODEM/ZMODEM

### Level 2: Reference

> See EIA/TIA-232 for the complete RS-232 signal definitions including handshaking lines (RTS/CTS, DTR/DSR) and their timing relationships. The Hayes AT Command Standard documents all S-registers and extended command syntax. XMODEM, YMODEM, and ZMODEM specifications cover block formats, error detection algorithms, and streaming protocol details. -- EIA/TIA-232; Hayes AT Command Standard; XMODEM/YMODEM/ZMODEM

### Level 3: Technical

> RS-232 voltage levels: logic 1 = -3V to -15V, logic 0 = +3V to +15V (inverted). UART 8N1 frame: 1 start bit + 8 data bits + 1 stop bit = 10 bits per character. XMODEM block: SOH (0x01) + block# (1 byte) + ~block# (1 byte) + 128 data bytes + checksum (1 byte) = 132 bytes total. ZMODEM adds 32-bit CRC, variable blocks up to 8KB, streaming without per-block ACK, and crash recovery via ZRPOS (resume from byte offset). Auto-baud detection uses the bit patterns of "A" (0x41) and "T" (0x54) to measure timing intervals. -- EIA/TIA-232; XMODEM/YMODEM/ZMODEM; Hayes AT Command Standard
