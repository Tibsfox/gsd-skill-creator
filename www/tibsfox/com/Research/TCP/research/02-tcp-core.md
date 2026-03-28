# TCP Core

> **Domain:** Internet Protocol Suite
> **Module:** 2 -- Segment Format, FSM & Flow Control
> **Through-line:** *TCP is a protocol that lives in the spaces between packets. The gap between a SYN and its ACK is where a three-way handshake lives. The 2MSL wait of TIME-WAIT is the protocol's insistence that the past be honored before the future begins. Eleven states, every transition earned.*

---

## Table of Contents

1. [The Transport Layer Contract](#1-the-transport-layer-contract)
2. [TCP Segment Format](#2-tcp-segment-format)
3. [Control Flags](#3-control-flags)
4. [TCP Options](#4-tcp-options)
5. [Three-Way Handshake](#5-three-way-handshake)
6. [Initial Sequence Number Generation](#6-initial-sequence-number-generation)
7. [The 11-State Finite State Machine](#7-the-11-state-finite-state-machine)
8. [Connection Teardown](#8-connection-teardown)
9. [Simultaneous Open and Close](#9-simultaneous-open-and-close)
10. [Flow Control: Sliding Window](#10-flow-control-sliding-window)
11. [Nagle's Algorithm](#11-nagles-algorithm)
12. [TCP Fast Open](#12-tcp-fast-open)
13. [Socket Programming Model](#13-socket-programming-model)
14. [Mesh Relevance](#14-mesh-relevance)
15. [Cross-References](#15-cross-references)
16. [Sources](#16-sources)

---

## 1. The Transport Layer Contract

TCP (Transmission Control Protocol) provides reliable, ordered, byte-stream delivery over IP's best-effort datagram service. RFC 9293 (August 2022) consolidates the original RFC 793 (1981) with all amendments, obsoleting RFCs 793, 879, 2873, 6093, 6429, 6528, and 6691 [1].

TCP guarantees:

- **Reliable delivery:** Every byte sent is either delivered exactly once or the connection is reset
- **Ordered delivery:** Bytes arrive in the order they were sent
- **Flow control:** The sender does not overwhelm the receiver's buffer
- **Full-duplex:** Both endpoints can send and receive simultaneously
- **Connection-oriented:** A handshake establishes state before data transfer

TCP explicitly does *not* provide: message boundaries (it is a byte stream, not a message protocol), congestion control guarantees to the network (that is a cooperative behavior, not a contract), or latency bounds.

```
TCP IN THE PROTOCOL STACK
================================================================

  APPLICATION (HTTP, SSH, SMTP, DNS-over-TCP)
         |
         | Byte stream API (read/write)
         v
  +----------------------------------------------+
  |                 TCP (RFC 9293)                |
  |                                               |
  |  Segment Format     11-State FSM             |
  |  +-------------+    +------------------+      |
  |  | 20-60 byte  |    | CLOSED           |      |
  |  | header      |    | LISTEN           |      |
  |  | SEQ/ACK     |    | SYN-SENT/RCVD    |      |
  |  | Flags       |    | ESTABLISHED      |      |
  |  | Window      |    | FIN-WAIT-1/2     |      |
  |  | Options     |    | CLOSE-WAIT       |      |
  |  +-------------+    | CLOSING/LAST-ACK |      |
  |                      | TIME-WAIT        |      |
  |  Flow Control        +------------------+      |
  |  Congestion Ctrl (Module 03)                  |
  +----------------------------------------------+
         |
         | IP datagrams (best-effort)
         v
  INTERNET LAYER (IPv4 / IPv6)
```

---

## 2. TCP Segment Format

The TCP segment header contains a minimum of 20 bytes (5 x 32-bit words) and a maximum of 60 bytes with options [1].

### Complete Field Table

| Field | Bits | Offset | Description |
|---|---|---|---|
| Source Port | 16 | 0 | Originating port number (0-65535) |
| Destination Port | 16 | 16 | Destination port number (0-65535) |
| Sequence Number | 32 | 32 | Byte-stream position of the first data byte in this segment (or ISN when SYN is set) |
| Acknowledgment Number | 32 | 64 | Next expected byte from the other direction (valid only when ACK flag is set) |
| Data Offset | 4 | 96 | Header length in 32-bit words; options length = (DataOffset - 5) x 4 bytes |
| Reserved | 3 | 100 | Must be zero |
| Control Flags | 9 | 103 | NS, CWR, ECE, URG, ACK, PSH, RST, SYN, FIN |
| Window Size | 16 | 112 | Receive window advertised in bytes; scaled by Window Scale option (RFC 7323) |
| Checksum | 16 | 128 | Covers pseudo-header (src IP, dst IP, protocol=6, TCP length) + entire segment |
| Urgent Pointer | 16 | 144 | Byte offset from SEQ to last urgent byte; valid only when URG flag is set |
| Options | 0-320 | 160 | Variable-length; must be padded to 32-bit boundary |

### Wire Format

```
TCP SEGMENT HEADER -- BIT-LEVEL LAYOUT (RFC 9293)
================================================================

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Acknowledgment Number                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Offset| Res |N|C|E|U|A|P|R|S|F|            Window             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           Checksum            |         Urgent Pointer        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options (if Offset > 5)                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Pseudo-Header for Checksum

The TCP checksum covers a pseudo-header prepended for computation purposes but never transmitted. For IPv4: Source IP (32 bits), Destination IP (32 bits), zero byte, Protocol (8 bits, value 6), TCP Length (16 bits). For IPv6: Source Address (128 bits), Destination Address (128 bits), Upper-Layer Packet Length (32 bits), zeros (24 bits), Next Header (8 bits, value 6). The checksum is mandatory for both IPv4 and IPv6 TCP [1].

---

## 3. Control Flags

TCP uses 9 control flag bits. The original RFC 793 defined 6 (URG, ACK, PSH, RST, SYN, FIN); RFC 3168 added ECE and CWR for ECN; RFC 3540 added NS (Nonce Sum) [1][2].

| Flag | Bit Position | Purpose |
|---|---|---|
| NS (Nonce Sum) | 103 | ECN nonce concealment protection (RFC 3540) |
| CWR (Congestion Window Reduced) | 104 | Sender has reduced cwnd in response to ECE (RFC 3168) |
| ECE (ECN-Echo) | 105 | Receiver observed CE-marked packets (RFC 3168); also used in SYN for ECN negotiation |
| URG (Urgent) | 106 | Urgent Pointer field is valid; urgent data present |
| ACK (Acknowledgment) | 107 | Acknowledgment Number field is valid; set on all segments after initial SYN |
| PSH (Push) | 108 | Receiver should deliver data to application immediately (do not buffer) |
| RST (Reset) | 109 | Connection reset; abort immediately; no further communication |
| SYN (Synchronize) | 110 | Synchronize sequence numbers; used in handshake |
| FIN (Finish) | 111 | Sender has finished sending data; initiate connection teardown |

### RST Behavior

A RST segment immediately aborts the connection. It is sent in response to: segments arriving for a non-existent connection, segments with invalid sequence numbers on an established connection, or application-initiated abortive close. RST segments are not acknowledged. When a host receives a RST, it transitions immediately to CLOSED without sending any response [1].

---

## 4. TCP Options

TCP options appear between the fixed header and the data payload. They are padded to a 32-bit boundary [1].

| Kind | Name | Length | Negotiation | RFC | Purpose |
|---|---|---|---|---|---|
| 0 | End of Option List | 1 byte | -- | RFC 9293 | Marks end of options |
| 1 | No-Operation (NOP) | 1 byte | -- | RFC 9293 | Padding / alignment |
| 2 | Maximum Segment Size | 4 bytes | SYN only | RFC 9293 | Declares largest segment the sender is willing to receive |
| 3 | Window Scale | 3 bytes | SYN only | RFC 7323 | Shifts window field left by 0-14 bits; enables windows up to 1 GiB |
| 4 | SACK Permitted | 2 bytes | SYN only | RFC 2018 | Announces SACK capability |
| 5 | SACK | Variable | Any | RFC 2018 | Reports out-of-order received blocks (up to 4 block pairs per segment) |
| 8 | Timestamps | 10 bytes | SYN, then all | RFC 7323 | RTT measurement (TSval/TSecr) and PAWS protection |
| 34 | TCP Fast Open Cookie | Variable | SYN | RFC 7413 | TFO cookie for 0-RTT data in SYN |

### Maximum Segment Size (MSS)

MSS declares the largest TCP segment payload the sender is willing to receive (excluding the TCP header). It is exchanged only during the SYN/SYN-ACK handshake. The default MSS is 536 bytes for IPv4 (derived from 576-byte minimum MTU minus 40 bytes for IP and TCP headers) and 1220 bytes for IPv6 (1280 minus 60 bytes). Typical MSS on Ethernet: 1460 bytes (1500 MTU - 20 IP - 20 TCP) [1].

### Window Scale

The Window Size field is 16 bits, allowing a maximum advertised window of 65,535 bytes. Window Scale (RFC 7323, option Kind 3) provides a shift count (0-14) negotiated in the SYN/SYN-ACK. The effective window is `Window Size << shift_count`, allowing windows up to 65,535 x 2^14 = 1,073,725,440 bytes (approximately 1 GiB). This is essential for high-bandwidth, high-latency paths (high BDP networks) [3].

### Timestamps

The Timestamps option (RFC 7323, option Kind 8) serves two purposes:

1. **RTT measurement:** The sender places a timestamp (TSval) in each segment. The receiver echoes the most recent TSval back in TSecr. The sender computes RTT as current_time - TSecr. This provides per-segment RTT measurement instead of the original one-sample-per-RTT approach.
2. **PAWS (Protection Against Wrapped Sequences):** On high-speed links, sequence numbers can wrap within the MSL (Maximum Segment Lifetime). Timestamps disambiguate old and new segments with the same sequence number [3].

---

## 5. Three-Way Handshake

Connection establishment requires synchronizing sequence numbers between two endpoints. The three-way handshake (SYN, SYN-ACK, ACK) establishes bidirectional communication [1].

```
THREE-WAY HANDSHAKE
================================================================

  CLIENT                                          SERVER
    |                                               |
    |  1. SYN, SEQ=X                                |
    |---------------------------------------------->>|
    |                                               |
    |  2. SYN-ACK, SEQ=Y, ACK=X+1                  |
    |<<----------------------------------------------|
    |                                               |
    |  3. ACK, SEQ=X+1, ACK=Y+1                    |
    |---------------------------------------------->>|
    |                                               |
    |  [ESTABLISHED]            [ESTABLISHED]       |
    |                                               |
```

### Step-by-Step

1. **Client sends SYN:** SEQ=X (the client's ISN), SYN flag set. Client enters SYN-SENT state.
2. **Server sends SYN-ACK:** SEQ=Y (the server's ISN), ACK=X+1, both SYN and ACK flags set. Server enters SYN-RECEIVED state.
3. **Client sends ACK:** SEQ=X+1, ACK=Y+1. Client enters ESTABLISHED state. Server enters ESTABLISHED upon receiving this ACK.

Data can be included in the third packet (the ACK). TCP options (MSS, Window Scale, SACK Permitted, Timestamps) are negotiated in the SYN and SYN-ACK segments.

### SYN Cookies

SYN flood attacks exhaust server memory by sending large numbers of SYN segments without completing handshakes. SYN cookies (described in RFC 4987) allow the server to avoid allocating state during the handshake by encoding connection parameters into the ISN itself. The server can reconstruct the connection state from the cookie when it receives the completing ACK [4].

> **SAFETY WARNING:** SYN flood is a denial-of-service attack vector. SYN cookies are the primary defense. This is documented for defensive understanding; no amplification techniques are provided.

---

## 6. Initial Sequence Number Generation

The ISN must be chosen to minimize the probability that segments from a prior connection (using the same 4-tuple) are accepted as valid in a new connection. RFC 9293 recommends an ISN generator based on a clock incremented approximately every 4 microseconds (yielding a 32-bit cycle of approximately 4.55 hours), combined with a per-connection secret to prevent sequence number prediction attacks [1][5].

The TIME-WAIT state (2 x MSL, typically 60-120 seconds) provides additional protection: a new connection on the same 4-tuple cannot begin until TIME-WAIT expires, ensuring old segments have been purged from the network.

> **SAFETY WARNING:** ISN prediction was a historically significant attack vector (Kevin Mitnick, 1994). Modern implementations use cryptographic ISN generation per RFC 6528, rendering prediction infeasible. Documented for historical context; no prediction algorithms are provided [5].

---

## 7. The 11-State Finite State Machine

The TCP state machine governs connection lifecycle. Every TCP connection traverses a subset of these 11 states [1].

### State Table

| State | Side | Description | Entry Condition |
|---|---|---|---|
| CLOSED | Both | No connection; fictional initial/final state (no TCB exists) | Timeout, RST, or application close |
| LISTEN | Server | Waiting for incoming SYN; passive open performed | Application calls listen() |
| SYN-SENT | Client | SYN transmitted; awaiting SYN-ACK | Application calls connect() |
| SYN-RECEIVED | Server | SYN received and SYN-ACK sent; awaiting ACK | SYN arrives on LISTEN socket |
| ESTABLISHED | Both | Data transfer phase; connection fully open | Handshake completes |
| FIN-WAIT-1 | Active closer | FIN sent; awaiting ACK or FIN from remote | Application calls close() |
| FIN-WAIT-2 | Active closer | Own FIN acknowledged; awaiting remote FIN | ACK of FIN received |
| CLOSE-WAIT | Passive closer | Remote FIN received and ACKed; awaiting local close | FIN arrives during ESTABLISHED |
| CLOSING | Both | Simultaneous close; both FINs sent; awaiting ACK | FIN received while in FIN-WAIT-1 |
| LAST-ACK | Passive closer | Own FIN sent; awaiting final ACK | Application calls close() from CLOSE-WAIT |
| TIME-WAIT | Active closer | 2xMSL wait before CLOSED | ACK of remote FIN sent (from FIN-WAIT-2 or CLOSING) |

### State Transition Diagram

```
TCP 11-STATE FSM -- ALL TRANSITIONS
================================================================

                             +---------+
                             |  CLOSED |
                             +---------+
                            /           \
                   passive open       active open
                   (listen)           (connect, send SYN)
                          /               \
                  +--------+            +---------+
                  | LISTEN |            | SYN-SENT|
                  +--------+            +---------+
                     |                      |
            recv SYN,               recv SYN-ACK,
            send SYN-ACK            send ACK
                     |                      |
               +-----------+          +-----------+
               |SYN-RECEIVED|         |ESTABLISHED|
               +-----------+          +-----------+
                     |                  /         \
              recv ACK           close,         recv FIN,
                     |           send FIN        send ACK
               +-----------+       |                |
               |ESTABLISHED|  +-----------+   +-----------+
               +-----------+  |FIN-WAIT-1 |   |CLOSE-WAIT |
                              +-----------+   +-----------+
                             /      |              |
                   recv ACK    recv FIN,      close,
                      |        send ACK       send FIN
                      |             |              |
               +-----------+  +---------+    +----------+
               |FIN-WAIT-2 |  | CLOSING |    | LAST-ACK |
               +-----------+  +---------+    +----------+
                     |              |              |
               recv FIN,      recv ACK       recv ACK
               send ACK            |              |
                     |              |              |
                +-----------+       |         +---------+
                | TIME-WAIT |<------+         |  CLOSED |
                +-----------+                 +---------+
                     |
                2MSL timeout
                     |
                +---------+
                |  CLOSED |
                +---------+
```

### RST Handling From Each State

- **CLOSED:** RST received is silently discarded
- **LISTEN:** RST received is silently discarded
- **SYN-SENT:** RST with valid ACK returns to CLOSED
- **SYN-RECEIVED:** RST returns to LISTEN (if previously LISTEN) or CLOSED
- **ESTABLISHED / FIN-WAIT-1 / FIN-WAIT-2 / CLOSE-WAIT:** RST aborts connection, enters CLOSED
- **CLOSING / LAST-ACK / TIME-WAIT:** RST enters CLOSED

### Half-Open Recovery

A half-open connection occurs when one side has crashed and restarted while the other still holds state. The restarted side will send a RST in response to data segments it does not recognize, causing the surviving side to enter CLOSED and release resources [1].

---

## 8. Connection Teardown

TCP uses a four-way close to ensure both sides have finished sending data [1].

```
FOUR-WAY CONNECTION CLOSE
================================================================

  ACTIVE CLOSER                             PASSIVE CLOSER
  (FIN-WAIT-1)                              (CLOSE-WAIT)
       |                                          |
       |  FIN, SEQ=M                              |
       |---------------------------------------->>|
       |                             ACK=M+1      |
       |<<----------------------------------------|
  (FIN-WAIT-2)                                    |
       |                                          |
       |           [passive closer finishes]      |
       |                                          |
       |                             FIN, SEQ=N   |
       |<<----------------------------------------|
       |  ACK=N+1                                 |
       |---------------------------------------->>|
  (TIME-WAIT)                              (CLOSED)
       |
  2MSL timeout
       |
  (CLOSED)
```

### TIME-WAIT Purpose

The TIME-WAIT state lasts 2 x MSL (Maximum Segment Lifetime; RFC 9293 recommends MSL = 2 minutes, so TIME-WAIT = 4 minutes, though many implementations use 60 seconds total) [1]. It serves two purposes:

1. **Reliable final ACK:** If the final ACK is lost, the passive closer retransmits its FIN. TIME-WAIT allows the active closer to retransmit the ACK.
2. **Old segment protection:** Prevents delayed segments from a prior connection on the same 4-tuple from being accepted by a new connection.

### TIME-WAIT Accumulation

High-throughput servers handling many short-lived connections can accumulate thousands of TIME-WAIT sockets. Mitigations: `SO_REUSEADDR` socket option, `tcp_tw_reuse` sysctl (Linux), and TCP Timestamps for TIME-WAIT recycling [6].

---

## 9. Simultaneous Open and Close

### Simultaneous Open

Both endpoints send SYN simultaneously (rare in practice). Both transition SYN-SENT -> SYN-RECEIVED -> ESTABLISHED. Each side receives a SYN while in SYN-SENT, sends SYN-ACK, and enters SYN-RECEIVED. When each receives the other's SYN-ACK, both enter ESTABLISHED [1].

### Simultaneous Close

Both endpoints send FIN simultaneously. Both transition ESTABLISHED -> FIN-WAIT-1 -> CLOSING -> TIME-WAIT -> CLOSED. Each side receives a FIN while in FIN-WAIT-1 (instead of an ACK), sends ACK, and enters CLOSING. When each receives the other's ACK, both enter TIME-WAIT [1].

---

## 10. Flow Control: Sliding Window

TCP uses a sliding window mechanism to prevent the sender from overwhelming the receiver's buffer [1].

### Window Mechanics

- The receiver advertises its available buffer space in the Window Size field (rwnd)
- The sender maintains: `SND.UNA` (oldest unacknowledged byte), `SND.NXT` (next byte to send), `SND.WND` (send window = min(rwnd, cwnd))
- The sender cannot transmit beyond `SND.UNA + SND.WND`
- The effective send window = `min(receiver_window, congestion_window)` (congestion window is Module 03)

### Window Scaling

With RFC 7323 Window Scale option, the effective window = `Window_Size << shift_count`. A shift count of 14 allows windows up to approximately 1 GiB, essential for long fat networks (LFNs) where the bandwidth-delay product exceeds 65,535 bytes [3].

### Zero-Window Probing

When the receiver's buffer is full, it advertises a zero window. The sender must not transmit data but must periodically send zero-window probes (1-byte segments or zero-length segments, implementation-dependent) to detect when the window reopens. Without probing, both sides could deadlock -- the receiver waiting for the sender to send, the sender waiting for a window update [1].

### Silly Window Syndrome (SWS)

SWS occurs when the receiver advertises tiny window updates (e.g., 1 byte freed) and the sender transmits tiny segments. Two mitigations:

- **Receiver side (Clark's algorithm):** Do not advertise small window updates. Wait until the window is at least min(MSS, buffer/2) before advertising [7].
- **Sender side (Nagle's algorithm):** Buffer small segments until an ACK is received (see Section 11).

---

## 11. Nagle's Algorithm

Nagle's algorithm (RFC 896) reduces the number of small packets ("tinygrams") on the network by buffering data at the sender [8].

### Rules

1. If there is unacknowledged data in flight, buffer new data until either:
   - An ACK arrives for all outstanding data, or
   - Enough data accumulates to fill a full-sized segment (MSS)
2. If there is no unacknowledged data, send immediately regardless of size

### Interaction with Delayed ACKs

Nagle's algorithm can interact poorly with delayed ACKs (RFC 1122 allows receivers to delay ACKs by up to 500ms). The sender waits for an ACK before sending more small data; the receiver delays the ACK waiting for more data. This creates a latency penalty. Applications requiring low-latency small writes (e.g., interactive terminals, gaming) disable Nagle via the `TCP_NODELAY` socket option [8].

---

## 12. TCP Fast Open

TCP Fast Open (TFO, RFC 7413) allows data to be sent in the SYN packet on resumed connections, reducing connection establishment latency by 1 RTT [9].

### Mechanism

1. First connection: Client includes a TFO cookie request in SYN. Server responds with a cookie in SYN-ACK.
2. Subsequent connections: Client sends SYN with stored cookie and application data. Server validates cookie and delivers data to the application before the handshake completes.

### Deployment Challenges

TFO deployment is limited by middlebox interference. Some firewalls and load balancers drop SYN packets containing data, as this violates the traditional expectation that SYN packets carry no payload. TFO is supported in Linux (since 3.7), macOS (since 10.11), and Windows (since 10) but is not universally enabled [9].

---

## 13. Socket Programming Model

The Berkeley Sockets API (BSD, 1983) provides the standard interface for TCP programming [10].

### Server Lifecycle

1. `socket()` -- create TCP socket (AF_INET/AF_INET6, SOCK_STREAM)
2. `bind()` -- associate with local address and port
3. `listen()` -- enter LISTEN state; backlog parameter sets SYN queue size
4. `accept()` -- block until a client completes handshake; returns new connected socket
5. `read()`/`write()` -- data transfer on connected socket
6. `close()` -- initiate FIN teardown

### Client Lifecycle

1. `socket()` -- create TCP socket
2. `connect()` -- send SYN, complete handshake, enter ESTABLISHED
3. `read()`/`write()` -- data transfer
4. `close()` -- initiate FIN teardown

### Key Socket Options

| Option | Level | Purpose |
|---|---|---|
| SO_REUSEADDR | SOL_SOCKET | Allow bind to TIME-WAIT addresses |
| SO_KEEPALIVE | SOL_SOCKET | Send keepalive probes after idle period |
| TCP_NODELAY | IPPROTO_TCP | Disable Nagle's algorithm |
| TCP_CORK | IPPROTO_TCP | Linux: buffer all output until uncorked or MSS filled |
| TCP_QUICKACK | IPPROTO_TCP | Linux: disable delayed ACKs |
| TCP_FASTOPEN | IPPROTO_TCP | Enable TCP Fast Open |

---

## 14. Mesh Relevance

TCP understanding informs GSD Mesh design:

- **Connection state overhead:** TCP maintains per-connection state (TCB). In mesh topologies with many peer connections, this can consume significant memory. QUIC (Module 05) offers lighter alternatives.
- **TIME-WAIT considerations:** Mesh nodes with high connection churn will accumulate TIME-WAIT sockets. Connection pooling and SO_REUSEADDR are essential.
- **Flow control for mesh:** The sliding window mechanism provides natural backpressure. DACP can adopt similar backpressure semantics for agent-to-agent communication.
- **Nagle interaction:** Mesh control messages are typically small and latency-sensitive. TCP_NODELAY should be set on mesh control channels.
- **TFO for mesh reconnection:** Mesh nodes that frequently reconnect can benefit from TFO to reduce handshake latency.

---

## 15. Cross-References

> **Related:** [IP Layer](01-ip-layer.md) -- TCP segments are encapsulated in IP datagrams; pseudo-header checksum references IP addresses. [Congestion Control](03-congestion-control.md) -- the congestion window (cwnd) interacts with the flow control window (rwnd) to determine the effective send window. [Transport Evolution](05-transport-evolution.md) -- QUIC reimplements TCP's reliability guarantees over UDP.

**Series cross-references:**
- **SYS (Systems Admin):** `ss`, `netstat`, `tcpdump` for TCP connection state inspection and debugging
- **K8S (Kubernetes):** Service load balancing distributes TCP connections; readiness probes depend on handshake
- **CMH (Comp. Mesh):** Mesh transport layer design choices informed by TCP state machine complexity
- **WPH (Weekly Phone):** Real-time communication latency affected by Nagle/delayed-ACK interaction
- **MCF (Multi-Cluster Fed.):** Cross-cluster TCP connections face high-BDP paths requiring window scaling
- **RFC (RFC Archive):** RFC 9293 is the canonical TCP specification

---

## 16. Sources

1. Eddy, W. "Transmission Control Protocol (TCP)." RFC 9293, IETF, August 2022. Status: Internet Standard. Obsoletes RFC 793.
2. Ramakrishnan, K., Floyd, S., and Black, D. "The Addition of Explicit Congestion Notification (ECN) to IP." RFC 3168, IETF, September 2001.
3. Borman, D., Braden, R., Jacobson, V., and Scheffenegger, R. "TCP Extensions for High Performance." RFC 7323, IETF, September 2014. Obsoletes RFC 1323.
4. Eddy, W. "TCP SYN Flooding Attacks and Common Mitigations." RFC 4987, IETF, August 2007.
5. Larsen, M. and Gont, F. "Improving the Robustness of TCP Against Blind In-Window Attacks." RFC 6528, IETF, February 2012.
6. Stevens, W.R. *TCP/IP Illustrated, Volume 1: The Protocols.* 2nd ed. Addison-Wesley, 2011.
7. Clark, D. "Window and Acknowledgement Strategy in TCP." RFC 813, IETF, July 1982.
8. Nagle, J. "Congestion Control in IP/TCP Internetworks." RFC 896, IETF, January 1984.
9. Cheng, Y., Chu, J., Radhakrishnan, S., and Jain, A. "TCP Fast Open." RFC 7413, IETF, December 2014. Status: Experimental.
10. Stevens, W.R., Fenner, B., and Rudoff, A.M. *UNIX Network Programming, Volume 1: The Sockets Networking API.* 3rd ed. Addison-Wesley, 2003.
11. Duke, M., Braden, R., Eddy, W., Blanton, E., and Zimmermann, A. "A Roadmap for Transmission Control Protocol (TCP) Specification Documents." RFC 7414, IETF, February 2015.
12. Mathis, M., Semke, J., Mahdavi, J., and Ott, T. "The Macroscopic Behavior of the TCP Congestion Avoidance Algorithm." Computer Communications Review, 27(3), July 1997.
13. Allman, M., Paxson, V., and Blanton, E. "TCP Congestion Control." RFC 5681, IETF, September 2009.
14. Braden, R. "Requirements for Internet Hosts -- Communication Layers." RFC 1122, IETF, October 1989.
15. Postel, J. "Transmission Control Protocol." RFC 793, IETF, September 1981. (Historical; obsoleted by RFC 9293.)
16. Comer, D.E. *Internetworking with TCP/IP: Principles, Protocols, and Architecture.* 6th ed. Prentice Hall, 2015.

---

*TCP/IP Protocol -- Module 2: TCP Core. Eleven states, every transition earned, every byte accounted for.*
