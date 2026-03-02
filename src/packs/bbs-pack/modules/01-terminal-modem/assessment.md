# Module 1: Terminal and Modem Protocols -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Conceptual

Explain why RS-232 uses inverted voltage levels (negative voltage for logic 1, positive for logic 0) and a wide voltage swing (-3V to -15V and +3V to +15V). What advantage does this provide for noise immunity compared to TTL logic levels (0V and 5V)? Why would this matter specifically for modem communication over telephone lines?

## Question 2: Protocol Analysis

Given the Hayes command string `ATZ\r ATM0L0DT5551234\r`, explain what each command does in sequence and predict the modem's behavior at each step. What would happen if you sent `ATH0` while the modem was in data mode (connected to a remote BBS)?

## Question 3: Application

A BBS operator reports that file transfers using XMODEM frequently fail after transferring about 100KB on a noisy phone line that experiences static bursts lasting 10-50ms. At 2400 bps, calculate how many bytes are affected by a 50ms burst. Explain why XMODEM's 128-byte block size and simple checksum make it particularly vulnerable to this problem, and describe specifically how ZMODEM's design addresses each weakness.

## Question 4: Design

You are designing a BBS terminal program and need to implement flow control between the PC's serial port and the modem. The user will be both browsing text menus (character-at-a-time) and downloading binary files (continuous data streams). Explain why you would choose hardware (RTS/CTS) flow control over software (XON/XOFF) flow control. What specific problem would XON/XOFF cause during a binary file transfer?

## Question 5: Reasoning

ZMODEM's crash recovery feature resumes a file transfer from the last successfully received byte position. Explain the protocol-level mechanism that makes this possible (hint: consider what information the receiver must store and communicate to the sender). Why was this feature especially important in the BBS era compared to modern file downloads over HTTP?

## Answer Key

### Answer 1

RS-232's inverted voltage levels and wide swing provide a large noise margin for reliable communication. The voltage difference between logic states is at least 6V (from -3V to +3V), and can be as large as 30V (from -15V to +15V). TTL logic uses 0V and 5V with much smaller noise margins (typically less than 1V between valid logic levels). For modem communication, the serial cable between the computer and modem could be several meters long and was susceptible to electromagnetic interference. The RS-232 voltage swing ensured that noise picked up on the cable would not corrupt the signal. Additionally, the inverted logic (negative = 1, positive = 0) means the idle state of the line is a negative voltage, which provides a clear distinction from a disconnected or unpowered line (0V). This matters for modem communication because the DCD (Data Carrier Detect) signal must reliably indicate whether a connection exists.

### Answer 2

The command sequence executes as follows:

1. **ATZ** -- Resets the modem to its stored default profile (S-register values, speaker settings, etc.). The modem responds "OK".
2. **ATM0** -- Disables the modem speaker entirely. No dial tone, connection negotiation, or carrier sounds will be audible.
3. **ATL0** -- Sets the speaker volume to its lowest level (redundant since M0 already disables the speaker, but harmless).
4. **ATDT5551234** -- Dials the phone number 555-1234 using touch-tone dialing. The modem goes off-hook, dials, and waits for a carrier signal from the remote modem.

If you sent **ATH0** while in data mode, the modem would NOT interpret it as a command -- it would transmit the literal characters "ATH0" to the remote system. To hang up from data mode, you must first return to command mode by sending the escape sequence (1-second pause, "+++", 1-second pause), then send ATH0.

### Answer 3

At 2400 bps, a 50ms burst affects: 2400 * 0.050 = 120 bits = 15 bytes. This is significant because:

**XMODEM's vulnerability:**
- With 128-byte blocks, a 15-byte corruption affects one entire block, which must be retransmitted. With the simple 1-byte checksum (1/256 chance of not detecting an error), there is a small but real probability that the corrupted block passes the checksum and is accepted with bad data.
- On a noisy line, every 128-byte block has an independent chance of being hit by a burst. After 100KB (about 800 blocks), accumulated retransmissions slow the transfer dramatically. A single undetected corruption means the entire file is bad.

**How ZMODEM addresses each weakness:**
1. **32-bit CRC** instead of 1-byte checksum: CRC-32 detects all burst errors shorter than 33 bits (4+ bytes), making undetected corruption from a 15-byte burst essentially impossible.
2. **Variable blocks up to 8KB**: On clean sections of the line, larger blocks reduce per-block overhead. On noisy sections, ZMODEM adaptively reduces block size, so fewer bytes need retransmission per error.
3. **Streaming protocol**: ZMODEM does not wait for ACK per block, so the overhead of retransmission is lower -- only the affected data needs resending, not an entire stop-and-wait cycle.
4. **Crash recovery**: If the line drops entirely during the noisy period, the transfer can resume from the last good position rather than restarting the full 100KB.

### Answer 4

Hardware flow control (RTS/CTS) uses dedicated signal lines separate from the data stream, so it works identically regardless of the data content. Software flow control (XON/XOFF) embeds control characters within the data stream: XOFF (0x13, Ctrl-S) pauses transmission and XON (0x11, Ctrl-Q) resumes it.

During a binary file transfer (ZIP, GIF, executable), the file data will inevitably contain bytes with values 0x11 and 0x13. If XON/XOFF flow control is active, a 0x13 byte in the file data would be interpreted as an XOFF command, pausing the transfer unexpectedly. A subsequent 0x11 byte might resume it, but the flow control characters themselves would be stripped from the data stream, corrupting the file. Even if the transfer protocol (XMODEM/ZMODEM) detects the corruption via CRC, the repeated false pauses and stripped bytes would make the transfer unreliable and extremely slow.

With RTS/CTS, the data channel carries only file data. The flow control signals travel on separate wires (pins 7 and 8 on the DE-9 connector), so there is zero possibility of confusion between control and data. This is why every BBS guide recommended enabling hardware flow control and disabling software flow control.

### Answer 5

ZMODEM crash recovery works through the ZRPOS frame. When a transfer is interrupted and later restarted:

1. The **receiver** checks its local disk for the partially received file and determines the byte offset of the last complete, CRC-verified data.
2. The receiver sends a **ZRPOS** (Resume Position) frame to the sender containing this byte offset.
3. The **sender** seeks to that position in the source file and begins streaming from there, skipping all the data already successfully received.

This requires the receiver to maintain knowledge of exactly how many bytes were verified (not just received, but CRC-checked), which ZMODEM's 32-bit CRC per block makes reliable.

This was especially important in the BBS era for several reasons:
- **Phone line drops were common** -- call waiting, line noise, or someone picking up an extension phone could disconnect a call.
- **Transfer speeds were slow** -- a 1MB file at 2400 bps took approximately 70 minutes. Losing 60 minutes of progress and starting over was devastating.
- **Long-distance calls cost money** -- BBS access often required toll calls, and retransmitting an entire file doubled the phone bill.
- **No alternative paths** -- unlike modern HTTP downloads where you can retry from a CDN, the BBS had one phone line and one modem. Crash recovery was the only option for resumption.

Modern HTTP supports range requests (the Range header) for similar resume functionality, but the cost of failure is much lower because broadband connections are fast, flat-rate, and rarely drop.
