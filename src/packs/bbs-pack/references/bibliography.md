# BBS Pack Bibliography

## Primary Sources

- **SAUCE Specification** -- ACiD Productions. "Standard Architecture for Universal Comment Extensions." Version 00.5, 1996. Retrieved from https://www.acid.org/info/sauce/sauce.htm. Defines the 128-byte metadata record appended to ANSI art files.

- **FTS-0001** -- Bush, Randy. "A Basic FidoNet Technical Standard." FidoNet Technical Standards Committee, Revision 16, September 30 1995. The foundational packet format specification for FidoNet message transport including Type 2 packet headers and packed message structures.

- **RFC 1459** -- Oikarinen, Jarkko; Reed, Darren. "Internet Relay Chat Protocol." IETF, May 1993. The original IRC protocol specification defining message format, channel operations, and server-to-server communication.

- **CP437 / Unicode Mapping** -- Unicode Consortium. "CP437 to Unicode." unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP437.TXT. The authoritative 256-entry mapping from IBM PC Code Page 437 byte values to Unicode code points, including the 0x00-0x1F graphical characters.

- **ANSI X3.64 / ECMA-48** -- ECMA International. "Control Functions for Coded Character Sets." ECMA-48, 5th Edition, June 1991. The standard governing ANSI escape sequences including Select Graphic Rendition (SGR), cursor positioning, and erase functions.

- **EIA/TIA-232** -- Electronic Industries Alliance. "Interface Between Data Terminal Equipment and Data Circuit-Terminating Equipment Employing Serial Binary Data Interchange." The RS-232 serial communication standard defining signal levels, pin assignments, and handshaking.

- **Hayes AT Command Set** -- Hayes Microcomputer Products. "Smartmodem 300 Reference Manual." 1981. The original AT command set for modem control that became the de facto industry standard.

- **XMODEM/YMODEM/ZMODEM** -- Forsberg, Chuck. "The ZMODEM Inter Application File Transfer Protocol." Stroudsburg, PA: Stroudsburg-area Computer Users Group, October 14 1988. File transfer protocols used by BBS systems for reliable binary data exchange over serial links.

- **DOOR.SYS / CHAIN.TXT** -- Various BBS software authors. Drop file specifications for passing user session information from BBS software to external door programs. DOOR.SYS (52-line standard) and CHAIN.TXT (WWIV-format) are the two most common formats.

- **FOSSIL Driver Specification** -- Jennings, Tom; Pearson, Bob. "Fido/Opus/SEAdog Standard Interface Layer." Version 5, February 11 1988. A standardized serial port API for BBS and mailer software, providing interrupt-driven I/O abstraction.

## Citation Convention

When citing BBS sources in content.md files, use the following format:

**Inline citation:** Reference the source by short name and relevant section:
- `-- SAUCE spec, field definitions`
- `-- FTS-0001, Section 2: Packet Header`
- `-- RFC 1459, Section 2.3.1: Message format`
- `-- CP437 mapping, 0x00-0x1F range`

**Block citation:** For extended quotations or protocol excerpts, use blockquote with attribution:
```
> The SAUCE record is exactly 128 bytes, located at the end of the file.
> -- SAUCE Specification v00.5, ACiD Productions (1996)
```

BBS pack sources are protocol specifications, RFCs, and technical standards documents. Do not use electronics-pack citation conventions.
