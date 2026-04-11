# ARexx Port System, Inter-Process Communication, and Modern Mapping

> PNW Research Series -- Computation Cluster
> April 2026

---

## Preface

The ARexx port system is the single most architecturally significant feature of the
language. Without it, ARexx is just another REXX dialect -- a capable string-processing
language with decent control flow and a convenient INTERPRET instruction. With it,
ARexx became the connective tissue of an entire operating system. Every application
that exposed an ARexx port became programmable. Every script could orchestrate a
symphony of applications. The port system turned the Amiga from a collection of
programs into a living, scriptable environment.

This document dissects the port system from the metal up: the Amiga exec.library
message-passing primitives that underpin it, the RexxMsg structure that carries
commands between processes, the ADDRESS instruction that targets ports, the
application protocol that makes programs scriptable, and the mapping of all of this
to modern architectures including Rust, TypeScript, x86-64 assembly, and CUDA.

This is porting research. Every detail here serves the goal of building a faithful,
high-performance ARexx implementation on modern hardware.

---

## Part I: The Amiga exec.library Foundation

### 1. Message Ports

The entire ARexx port system is built on top of exec.library's message-passing IPC.
Understanding exec messages is prerequisite to understanding ARexx.

#### 1.1 The MsgPort Structure

Every process on the Amiga that wanted to receive messages created a MsgPort:

```c
struct MsgPort {
    struct Node mp_Node;       /* linked list node for port registry */
    UBYTE       mp_Flags;      /* signal/softint/ignore flags */
    UBYTE       mp_SigBit;     /* signal bit number (0-31) */
    void       *mp_SigTask;    /* task to signal when message arrives */
    struct List mp_MsgList;    /* doubly-linked list of pending messages */
};
```

Field-by-field:

- **mp_Node:** A standard exec Node, containing ln_Name (the port's public name,
  or NULL for a private port), ln_Type (set to NT_MSGPORT), and ln_Pri (priority
  for list ordering). The name is what ARexx uses to find application ports.

- **mp_Flags:** Controls what happens when a message arrives:
  - `PA_SIGNAL` (0): Signal the task identified by mp_SigTask. This is the normal
    mode -- the receiving task sleeps on Wait() and wakes when a message arrives.
  - `PA_SOFTINT` (1): Cause a software interrupt. Used by device drivers and
    real-time subsystems that cannot afford the latency of task switching.
  - `PA_IGNORE` (2): Do nothing on arrival. The receiver polls with GetMsg().

- **mp_SigBit:** A bit number (0-31) in the task's signal mask. Each Amiga task
  had 32 signal bits. Bit 0-15 were reserved for system use (SIGF_BLIT, SIGF_SINGLE,
  etc.); bits 16-31 were available to applications. AllocSignal() handed out unused
  bits. When a message arrived at a PA_SIGNAL port, exec set this bit in the
  receiving task's signal mask, which woke it from Wait().

- **mp_SigTask:** Pointer to the Task or Process structure that owns this port.
  In PA_SOFTINT mode, this points to an Interrupt structure instead.

- **mp_MsgList:** A standard exec doubly-linked list. Messages queue here FIFO.
  GetMsg() dequeues from the head.

#### 1.2 The Message Structure

Messages were the actual data packets:

```c
struct Message {
    struct Node mn_Node;       /* linked list linkage */
    struct MsgPort *mn_ReplyPort; /* port to reply to (CRITICAL) */
    UWORD       mn_Length;     /* total size of this message */
};
```

The mn_ReplyPort field is the key insight. Every message carried a return address.
When the receiver finished processing, it called ReplyMsg(), which sent the message
back to the sender's reply port. This created a natural request-response cycle:

```
Sender                              Receiver
  |                                    |
  |-- PutMsg(receiverPort, msg) ------>|
  |   (sender sleeps on WaitPort)      |
  |                                    |-- GetMsg() picks up message
  |                                    |-- processes message
  |                                    |-- sets result fields
  |                                    |-- ReplyMsg(msg) ----------->|
  |<----- message returns to sender's reply port --------------------|
  |   (sender wakes, reads result)     |
```

This is fundamentally different from Unix pipes or sockets. The message itself is the
communication buffer. It goes out, gets processed, comes back with results. No
separate request and response objects. No serialization. The same block of memory
travels both directions.

#### 1.3 The Core API

**CreatePort(name, priority)** -- Convenience function (actually in amiga.lib, not
exec.library proper) that:
1. Calls AllocSignal(-1) to get a free signal bit
2. Allocates a MsgPort structure
3. Sets mp_Flags = PA_SIGNAL, mp_SigBit = allocated bit, mp_SigTask = FindTask(NULL)
4. Initializes mp_MsgList as an empty list
5. If name is non-NULL, calls AddPort() to make it publicly findable

**AddPort(port)** -- Adds a named port to exec's public port list. After this call,
FindPort(name) can locate it. The port list was a simple linked list protected by
Forbid()/Permit() (interrupt disabling). No hash table, no tree -- O(n) lookup.
This was fine because the typical Amiga system had maybe 20-50 ports.

**FindPort(name)** -- Scans the public port list for a port with the given name.
Returns the MsgPort pointer or NULL. Must be called inside a Forbid()/Permit()
pair to prevent the port from being removed between finding it and using it.

**PutMsg(port, message)** -- Sends a message to a port:
1. Sets message->mn_Node.ln_Type = NT_MESSAGE
2. Disable(); (brief interrupt disable for list safety)
3. Adds message to the tail of port->mp_MsgList
4. If port->mp_Flags == PA_SIGNAL: Signal(port->mp_SigTask, 1 << port->mp_SigBit)
5. Enable();

**GetMsg(port)** -- Removes and returns the first message from port->mp_MsgList,
or NULL if the list is empty. Non-blocking.

**WaitPort(port)** -- Waits for a message to arrive:
1. If port->mp_MsgList is not empty, return immediately (the first message)
2. Otherwise, Wait(1 << port->mp_SigBit) to sleep until signaled
3. Return the first message (does NOT dequeue it -- you still need GetMsg)

**ReplyMsg(message)** -- Sends a message back to its mn_ReplyPort:
1. Sets message->mn_Node.ln_Type = NT_REPLYMSG
2. PutMsg(message->mn_ReplyPort, message) -- exactly the same as sending

**DeletePort(port)** -- Removes the port from the public list (RemPort), frees the
signal bit (FreeSignal), and deallocates the MsgPort structure.

#### 1.4 The Signal System

Signals were the interrupt mechanism. Each of the 32 bits in a task's signal mask
could be independently waited on:

```c
ULONG signals = Wait(SIGF_PORT1 | SIGF_PORT2 | SIGF_INTUITION);
if (signals & SIGF_PORT1) { /* handle port 1 messages */ }
if (signals & SIGF_PORT2) { /* handle port 2 messages */ }
if (signals & SIGF_INTUITION) { /* handle GUI events */ }
```

This was the Amiga's equivalent of select()/poll()/epoll(). A single task could
wait on multiple ports simultaneously by OR-ing their signal bits together. This
is exactly what applications did in their main event loop: wait on both the
Intuition (GUI) port and the ARexx port.

The signal mechanism was lightweight. Setting a signal was a single atomic OR
operation on a memory word plus a potential task reschedule. No system call
overhead, no kernel transition (the Amiga had no user/kernel mode distinction).
Signal latency was measured in microseconds even on the original 7.14 MHz 68000.

#### 1.5 The Typical Main Event Loop

Every ARexx-aware application had an event loop like this:

```c
struct MsgPort *appPort;     /* Intuition/IDCMP window port */
struct MsgPort *rexxPort;    /* ARexx command port */

ULONG appSig  = 1L << appPort->mp_SigBit;
ULONG rexxSig = 1L << rexxPort->mp_SigBit;
ULONG waitMask = appSig | rexxSig;

BOOL running = TRUE;
while (running) {
    ULONG signals = Wait(waitMask);

    if (signals & appSig) {
        struct IntuiMessage *imsg;
        while ((imsg = (struct IntuiMessage *)GetMsg(appPort))) {
            /* handle GUI event */
            HandleGUI(imsg);
            ReplyMsg((struct Message *)imsg);
        }
    }

    if (signals & rexxSig) {
        struct RexxMsg *rmsg;
        while ((rmsg = (struct RexxMsg *)GetMsg(rexxPort))) {
            /* handle ARexx command */
            HandleARexxCommand(rmsg);
            /* reply is handled inside HandleARexxCommand */
        }
    }
}
```

Note: both the GUI messages and ARexx messages are handled in the SAME loop, at
the SAME priority. ARexx commands were first-class citizens of the application's
event model, not a bolt-on afterthought.

### 2. Memory Model

#### 2.1 The Flat Address Space

The Amiga ran all processes in a single, flat, unprotected address space. Every
process could read and write every byte of memory. There was no MMU in the
original Amiga hardware (the 68000 had no MMU support; the 68030 and 68040 in
later Amigas had MMUs, but AmigaOS never used them for memory protection).

This had profound consequences for IPC:

**Zero-copy message passing.** When PutMsg() sent a message, it did not copy the
message data. It placed a POINTER to the message structure on the receiver's queue.
The receiver read the same physical memory the sender wrote. This made message
passing essentially free -- the cost was a list insertion plus a signal, regardless
of message size.

**Shared data structures.** A message could contain pointers to arbitrarily complex
data (strings, arrays, nested structures), and the receiver could follow those
pointers directly. No serialization, no deserialization, no marshalling.

**Mutual trust.** The sender had to trust the receiver not to corrupt the message
or follow the pointers to corrupt the sender's private data. The receiver had to
trust that the sender's pointers were valid. A buggy ARexx host application could
crash not just itself but the entire system.

**Memory ownership protocol.** Since messages were shared memory, there was an
implicit ownership protocol:
1. Sender owns the message before PutMsg()
2. Receiver owns the message between GetMsg() and ReplyMsg()
3. Sender owns the message again after receiving the reply
4. NEVER free a message that is "in flight" (sent but not yet replied)
5. NEVER modify a message that you don't currently own

This is precisely the ownership model that Rust enforces at compile time. The Amiga
enforced it by convention and crash-if-you-violate-it. Modern ARexx implementations
must decide which enforcement strategy to use.

#### 2.2 Memory Allocation

exec.library provided two-tier memory allocation:

```c
void *AllocMem(ULONG byteSize, ULONG requirements);
void FreeMem(void *memoryBlock, ULONG byteSize);
```

Requirements flags:
- `MEMF_PUBLIC`: Memory accessible by all tasks and DMA. Required for messages.
- `MEMF_CHIP`: Memory in the lower address range accessible by custom chips (for
  graphics, audio, disk DMA). Not needed for IPC.
- `MEMF_FAST`: Memory not accessible by custom chips but typically faster.
- `MEMF_CLEAR`: Zero the memory before returning.

All ARexx messages had to be allocated with at least MEMF_PUBLIC because they were
shared between processes. In practice, since the Amiga had no memory protection,
all memory was equally accessible -- but the MEMF_PUBLIC flag ensured the memory
came from a region that would survive task termination (important for messages in
flight when a task crashed).

#### 2.3 String Management

ARexx's string management was sophisticated for its era. Internally, ARexx strings
were reference-counted, immutable "argstrings" managed by the rexx support library:

```c
/* Create an ARexx argstring */
UBYTE *CreateArgstring(UBYTE *string, ULONG length);

/* Delete an ARexx argstring (decrement refcount, free if zero) */
void DeleteArgstring(UBYTE *string);

/* Get the length of an argstring */
ULONG LengthArgstring(UBYTE *string);
```

Argstrings had a hidden header before the character data:

```
Memory layout:
  [4 bytes: length][4 bytes: hash/flags][string data ...][NUL]
                                         ^
                                         |
                              pointer returned to caller
```

The pointer returned by CreateArgstring pointed to the START of the string data,
not the header. This meant argstrings could be passed to standard C string functions
(they were NUL-terminated), while ARexx internals could access the header at
negative offsets. Clever. This is the same trick used by Pascal strings, Delphi
strings, and COM BSTRs.

### 3. Libraries

#### 3.1 The Amiga Shared Library Model

Amiga shared libraries were loaded into memory once and shared by all processes.
They were accessed through a jump table (function vector) at negative offsets from
the library base pointer:

```
Memory layout of a library:

    -30: JMP function_5     ← fifth function
    -24: JMP function_4     ← fourth function
    -18: JMP function_3     ← third function
    -12: JMP function_2     ← second function
     -6: JMP function_1     ← first function (Open)
      0: [Library structure] ← lib_Base points here
     +n: [Library data]
```

Each entry was a 6-byte 68000 JMP instruction (2 bytes opcode + 4 bytes absolute
address). To call function N, you loaded the library base into a register (typically
A6) and did:

```asm
    move.l  _RexxSysBase,a6    ; load library base
    jsr     -$1E(a6)           ; call function at offset -30
```

This was fast (no symbol lookup, no PLT/GOT indirection), versioned (libraries
tracked version numbers and callers could require minimum versions), and hot-
patchable (SetFunction could replace individual jump table entries at runtime).

#### 3.2 Opening Libraries

```c
struct Library *OpenLibrary(STRPTR name, ULONG version);
```

OpenLibrary searched the system library list first. If the library was already
loaded and its version was >= the requested version, it incremented the open count
and returned the base pointer. If not loaded, it searched LIBS: (a logical device
that mapped to the system's Libs/ directory) for the library file, loaded it,
called the library's init function, added it to the system list, and returned
the base pointer.

Closing: `CloseLibrary(base)` decremented the open count. Libraries with an open
count of zero could be expunged (freed) by the system under memory pressure.

#### 3.3 rexxsyslib.library

The rexxsyslib.library was ARexx's core library, providing the interpreter, message
management, and string functions. It was special in several ways:

1. **Resident:** It was typically loaded at boot time (via the Libs directory or
   the resident list) and stayed in memory permanently.

2. **Dual role:** It served both as a shared library (callable from C/assembly
   programs that wanted to interact with ARexx) and as the ARexx interpreter
   itself (invoked by the RexxMast process to run scripts).

3. **Port management:** It provided the functions for creating and managing
   ARexx-specific message ports:

```c
/* Key rexxsyslib.library functions (partial list): */

/* Message creation and management */
struct RexxMsg *CreateRexxMsg(struct MsgPort *replyPort,
                              UBYTE *extension,
                              UBYTE *host);
void DeleteRexxMsg(struct RexxMsg *msg);
BOOL IsRexxMsg(struct Message *msg);

/* Argstring management */
UBYTE *CreateArgstring(UBYTE *string, ULONG length);
void DeleteArgstring(UBYTE *string);
ULONG LengthArgstring(UBYTE *string);

/* Environment management */
BOOL SetRexxVar(struct RexxMsg *msg, UBYTE *name, UBYTE *value, ULONG length);
BOOL GetRexxVar(struct RexxMsg *msg, UBYTE *name, UBYTE **value);
```

4. **The REXX master process (RexxMast):** A background process started at boot time
   that listened on the public port named "REXX". When it received a RXCOMM message
   containing a script name, it launched a new process to interpret that script.
   RexxMast was the daemon, rexxsyslib.library was the engine.

---

## Part II: The ARexx Port System (Deep)

### 4. How ARexx Ports Work

The ARexx port system is a layer of protocol and convention built on top of exec
message ports. Here is the complete lifecycle:

#### 4.1 Application Creates a Named Port

When an ARexx-aware application starts, it creates a public message port:

```c
#include <rexx/storage.h>
#include <rexx/rxslib.h>

/* Application startup */
struct MsgPort *rexxPort = CreatePort("MYAPP", 0);
if (!rexxPort) {
    /* port name already taken -- another instance running? */
    cleanup_and_exit();
}
```

The port name is a simple ASCII string. By convention:
- Application names are uppercase: "IMAGEFX", "DOPUS", "GOLDED"
- Instance numbers are appended with a dot: "DOPUS.1", "DOPUS.2"
- The port named "REXX" is reserved for the RexxMast process
- The port named "COMMAND" is not actually a port -- it's a keyword that routes
  to the AmigaDOS command shell

The port name is the ONLY addressing mechanism. There is no port number, no UUID,
no hierarchical namespace. If you know the name, you can send to it. This
simplicity is the source of ARexx's power and its limitation.

#### 4.2 ARexx Script Targets the Port

In an ARexx script, the ADDRESS instruction selects the target port:

```rexx
/* Set default host to MYAPP for all subsequent commands */
ADDRESS 'MYAPP'

/* Now every unquoted statement and every string command goes to MYAPP */
"LOAD FILE picture.iff"
"CROP 0 0 320 240"
"SAVE FORMAT JPEG"
```

When the interpreter encounters a string expression at the statement level (like
`"LOAD FILE picture.iff"`), it does not try to interpret it as REXX code. Instead,
it sends it as a command to the current host address. This is the crucial design
insight: strings that aren't REXX keywords are commands to external applications.

#### 4.3 Command Transmission

When the interpreter dispatches a command to a host, the following occurs:

1. **Lookup the target port:** FindPort(hostName) in the exec public port list.
   If the port does not exist, the interpreter sets RC=10 (error) and continues
   (or invokes the SYNTAX or NOVALUE condition handler).

2. **Create a RexxMsg:** CreateRexxMsg() allocates and initializes a RexxMsg
   structure with the appropriate fields (see Section 5).

3. **Set the command string:** The command text is placed in rm_Args[0] as an
   argstring.

4. **Set the action:** rm_Action = RXCOMM | RXFF_RESULT (command mode, requesting
   a result string).

5. **Send the message:** PutMsg(targetPort, &rexxMsg->rm_Node).

6. **Suspend the script:** The interpreter stops executing the current script and
   waits for the reply. It does NOT busy-wait; it calls WaitPort() on its own
   reply port. Other ARexx scripts can continue executing concurrently (ARexx was
   multitasking from day one).

7. **Receive the reply:** When the application replies, the interpreter wakes up,
   reads rm_Result1 (return code) and rm_Result2 (result string), sets the RC
   and RESULT variables, and resumes execution.

#### 4.4 The Complete Command Dispatch Sequence

```
Time →

ARexx Interpreter              exec.library              Application
       |                            |                         |
  1. Parse "LOAD FILE pic.iff"      |                         |
       |                            |                         |
  2. FindPort("MYAPP") --------→  scan port list --------→ found!
       |                       ← return MsgPort* ←            |
       |                            |                         |
  3. CreateRexxMsg()                |                         |
       |                            |                         |
  4. Set rm_Args[0] =              |                         |
     "LOAD FILE pic.iff"            |                         |
       |                            |                         |
  5. PutMsg(appPort, msg) ------→  add to mp_MsgList          |
       |                       → Signal(appTask) ----------→ wake!
       |                            |                         |
  6. WaitPort(replyPort)           |                    7. GetMsg()
     (script suspended)             |                    8. Parse command
       |                            |                    9. Execute LOAD
       |                            |                   10. Set rm_Result1=0
       |                            |                       rm_Result2="ok"
       |                            |                   11. ReplyMsg(msg)
       |                       ← PutMsg to replyPort ←       |
       |                       → Signal(rexxTask) →           |
       |                            |                         |
 12. Wake from WaitPort             |                         |
 13. GetMsg(replyPort)             |                         |
 14. RC = rm_Result1 (0)           |                         |
     RESULT = rm_Result2 ("ok")     |                         |
 15. DeleteRexxMsg()                |                         |
 16. Resume script execution        |                         |
```

The entire cycle involves:
- 2 port lookups (FindPort for the target, implicit for reply)
- 2 message sends (PutMsg to application, ReplyMsg back)
- 2 signals (one each direction)
- 2 task context switches (minimum)
- 0 data copies (zero-copy throughout)

On a 14 MHz 68020, a complete command round-trip took approximately 200-500
microseconds depending on message complexity. This was fast enough for real-time
scripting of GUI applications.

### 5. The RexxMsg Structure

The RexxMsg is the heart of ARexx IPC. It extends the standard exec Message with
all the fields needed for ARexx command dispatch, function calls, and result passing.

```c
struct RexxMsg {
    struct Message rm_Node;      /* standard exec message header */
    APTR    rm_TaskBlock;        /* pointer to global data block */
    APTR    rm_LibBase;          /* pointer to rexx library base */
    LONG    rm_Action;           /* action code + flags */
    LONG    rm_Result1;          /* primary result (return code) */
    LONG    rm_Result2;          /* secondary result (argstring or error) */
    STRPTR  rm_Args[16];        /* argument strings (0-15) */
    struct MsgPort *rm_PassPort; /* forwarding port */
    STRPTR  rm_CommAddr;         /* host address name */
    STRPTR  rm_FileExt;          /* file extension for scripts */
    LONG    rm_Stdin;            /* input file handle */
    LONG    rm_Stdout;           /* output file handle */
    LONG    rm_avail;            /* reserved/future use */
};
```

#### 5.1 Field-by-Field Documentation

**rm_Node** (struct Message)
The standard exec Message header. Contains:
- mn_ReplyPort: The port where the reply should be sent. For commands sent by the
  interpreter, this is the interpreter's private reply port. For commands sent by
  applications, this is whatever reply port the application set up.
- mn_Length: Size of the complete RexxMsg structure.

**rm_TaskBlock** (APTR)
Pointer to the interpreter's internal global data block for the running script.
This is opaque to applications -- they should never read or write it. It contains
the variable pool, stem arrays, internal stacks, and execution context. For
messages created by applications (not the interpreter), this is NULL.

**rm_LibBase** (APTR)
Pointer to the RexxSysBase (the rexxsyslib.library base). Applications can use
this to call rexxsyslib functions without maintaining their own copy of the base
pointer. Convenience field.

**rm_Action** (LONG)
Encodes the message type in the upper 8 bits and modifier flags in the lower 24 bits:

```
Bits 31-24: Action code
Bits 23-0:  Modifier flags

Action codes:
  RXCOMM   (0x01000000)  Command invocation
  RXFUNC   (0x02000000)  Function call
  RXCLOSE  (0x04000000)  Close/shutdown request
  RXQUERY  (0x08000000)  Query request
  RXADDFH  (0x10000000)  Add function host
  RXADDLIB (0x20000000)  Add function library
  RXREMLIB (0x40000000)  Remove function library
  RXTCOPN  (0x80000000)  Open for clipboard

Modifier flags:
  RXFF_RESULT  (0x00020000)  Request result string in rm_Result2
  RXFF_STRING  (0x00010000)  Argument is a "string file" (inline script)
  RXFF_TOKEN   (0x00008000)  Pre-tokenized (internal use)
  RXFF_NONRET  (0x00004000)  Non-returning (don't wait for completion)

Argument count stored in lower bits (0-15) for RXFUNC mode.
```

The most common action values:
- `RXCOMM | RXFF_RESULT` (0x01020000): "Execute this command and give me back a
  result string." This is what ADDRESS sends.
- `RXFUNC | RXFF_RESULT | argcount` (0x02020000 | n): "Call this function with
  n arguments and return the result."
- `RXCLOSE` (0x04000000): "Shut down your ARexx port." Polite shutdown request.

**rm_Result1** (LONG)
The primary return code. Set by the application before ReplyMsg(). Convention:
- 0: Success (maps to RC=0 in the script)
- 5: Warning (RC=5, non-fatal)
- 10: Error (RC=10, triggers ERROR condition if enabled)
- 20: Severe error (RC=20, triggers FAILURE condition)

These severity levels follow the AmigaDOS convention and map directly to the
REXX condition model.

**rm_Result2** (LONG)
The secondary result. Its interpretation depends on rm_Result1:
- If rm_Result1 == 0 and RXFF_RESULT was set: rm_Result2 is a pointer to an
  argstring containing the result. The RECIPIENT of the reply (usually the
  interpreter) is responsible for freeing this argstring with DeleteArgstring().
- If rm_Result1 != 0: rm_Result2 may contain an error code number (NOT a string
  pointer). The interpreter maps this to an error message.

This overloading of rm_Result2 (sometimes a pointer, sometimes a number) is a
source of bugs in application ARexx implementations. The application MUST check
whether RXFF_RESULT was set in rm_Action before creating a result argstring.

**rm_Args[16]** (STRPTR array)
Up to 16 argument slots. For RXCOMM (command) mode:
- rm_Args[0]: The command string. This is the ENTIRE command as a single string
  (e.g., "LOAD FILE picture.iff"). The application is responsible for parsing
  this string into a command name and arguments.

For RXFUNC (function call) mode:
- rm_Args[0]: The function name
- rm_Args[1] through rm_Args[15]: The function arguments
- The number of arguments is encoded in the lower bits of rm_Action

All argument strings are argstrings created with CreateArgstring(). They are
reference-counted and must be properly freed.

**rm_PassPort** (struct MsgPort *)
A forwarding port. If the application cannot handle the command, it can forward
the message to this port. In practice, this was rarely used -- most applications
either handled the command or returned an error.

**rm_CommAddr** (STRPTR)
The name of the current host address. Set by the interpreter to the name used in
the ADDRESS instruction. Applications can check this to verify the message was
intended for them (useful if an application maintains multiple ports).

**rm_FileExt** (STRPTR)
The default file extension for ARexx scripts. Normally ".rexx" but could be
overridden per-port. When ARexx searched for a script file, it tried the
filename as-is first, then appended this extension.

**rm_Stdin** (LONG)
AmigaDOS file handle for standard input redirection. If non-zero, the application
should read input from this handle instead of its normal input. Used by the
ARexx interpreter to redirect script I/O.

**rm_Stdout** (LONG)
AmigaDOS file handle for standard output redirection. If non-zero, the application
should write output to this handle. Used by:
```rexx
/* Redirect ARexx output to a file */
OPTIONS RESULTS
ADDRESS 'MYAPP'
"QUERY STATUS"    /* RESULT goes to the script */

/* Or redirect at the OS level via rm_Stdout */
```

**rm_avail** (LONG)
Reserved for future use. Must be zero.

#### 5.2 RexxMsg Memory Layout (for assembly port)

For the x86-64 assembly port, the exact byte offsets matter:

```
Offset  Size  Field                    Notes
------  ----  -----                    -----
  0      20   rm_Node (Message)        exec Message header
                 0: mn_Node (14 bytes)   Node: ln_Succ, ln_Pred, ln_Type, ln_Pri, ln_Name
                14: mn_ReplyPort (4)     reply port pointer
                18: mn_Length (2)        message size
 20       4   rm_TaskBlock             interpreter context (opaque)
 24       4   rm_LibBase               rexxsyslib base pointer
 28       4   rm_Action                action code + flags
 32       4   rm_Result1               return code
 36       4   rm_Result2               result string/error
 40      64   rm_Args[16]              16 x 4-byte string pointers
104       4   rm_PassPort              forwarding port
108       4   rm_CommAddr              host address name
112       4   rm_FileExt               file extension
116       4   rm_Stdin                 input file handle
120       4   rm_Stdout                output file handle
124       4   rm_avail                 reserved
------
128 bytes total (original 68K, 32-bit pointers)
```

For the x86-64 port, pointer fields expand to 8 bytes:

```
Offset  Size  Field                    Notes
------  ----  -----                    -----
  0      40   rm_Node (Message)        exec Message header (expanded)
 40       8   rm_TaskBlock             interpreter context
 48       8   rm_LibBase               library base
 56       4   rm_Action                action code + flags (LONG stays 32-bit)
 60       4   rm_Result1               return code (LONG stays 32-bit)
 64       8   rm_Result2               result pointer (64-bit)
 72     128   rm_Args[16]              16 x 8-byte string pointers
200       8   rm_PassPort              forwarding port
208       8   rm_CommAddr              host address name
216       8   rm_FileExt               file extension
224       8   rm_Stdin                 file handle (64-bit)
232       8   rm_Stdout                file handle (64-bit)
240       8   rm_avail                 reserved
------
248 bytes total (x86-64 port, 64-bit pointers)
```

### 6. The Command Dispatch Cycle (Complete)

Here is the FULL command dispatch cycle with every intermediate step:

```rexx
/* ARexx script: process.rexx */
OPTIONS RESULTS                    /* enable result strings */
ADDRESS 'MYAPP'                    /* set default host */
"LOAD FILE picture.iff"            /* send command */
IF RC = 0 THEN
    SAY "Result:" RESULT
ELSE
    SAY "Error:" RC
```

**Step 1: OPTIONS RESULTS**
The interpreter sets an internal flag indicating that RXFF_RESULT should be
included in rm_Action for all subsequent host commands. Without this, rm_Result2
will not contain a result string even on success.

**Step 2: ADDRESS 'MYAPP'**
The interpreter stores "MYAPP" as the current host address. It does NOT look up
the port yet -- that happens at command dispatch time. This means:
- You can ADDRESS a port before the application has started
- If the application crashes and restarts, the script will find the new port
- Port resolution is always dynamic

ADDRESS also saves the previous host on a stack:
```rexx
ADDRESS 'APP1'        /* current=APP1, previous=COMMAND */
ADDRESS 'APP2'        /* current=APP2, previous=APP1 */
ADDRESS               /* swap: current=APP1, previous=APP2 */
ADDRESS               /* swap: current=APP2, previous=APP1 */
```

**Step 3: "LOAD FILE picture.iff"**
The interpreter encounters a string expression at the statement level. Since this
is not a REXX keyword, it is treated as a host command. The dispatch sequence:

1. Build the command string: Evaluate all embedded expressions and concatenate.
   In this case, the string is a literal, so no evaluation needed.

2. Find the target port:
   ```c
   Forbid();
   struct MsgPort *port = FindPort("MYAPP");
   if (!port) {
       Permit();
       /* Set RC = 10, raise ERROR condition */
       return;
   }
   ```

3. Create the RexxMsg:
   ```c
   struct RexxMsg *msg = CreateRexxMsg(replyPort, "rexx", "MYAPP");
   msg->rm_Args[0] = CreateArgstring("LOAD FILE picture.iff", 21);
   msg->rm_Action = RXCOMM | RXFF_RESULT;
   ```

4. Send and wait:
   ```c
   PutMsg(port, &msg->rm_Node);
   Permit();
   WaitPort(replyPort);
   struct RexxMsg *reply = (struct RexxMsg *)GetMsg(replyPort);
   ```

5. Process the reply:
   ```c
   LONG rc = reply->rm_Result1;
   /* Set RC variable to rc */
   if (rc == 0 && (reply->rm_Action & RXFF_RESULT)) {
       /* Set RESULT variable to the argstring in rm_Result2 */
       SetRexxVar(msg, "RESULT", (STRPTR)reply->rm_Result2,
                  LengthArgstring((STRPTR)reply->rm_Result2));
       DeleteArgstring((STRPTR)reply->rm_Result2);
   }
   DeleteRexxMsg(reply);
   ```

**On the application side:**

6. Application wakes from Wait(), calls GetMsg():
   ```c
   struct RexxMsg *rmsg = (struct RexxMsg *)GetMsg(rexxPort);
   ```

7. Application parses the command:
   ```c
   char *cmd = rmsg->rm_Args[0];  /* "LOAD FILE picture.iff" */
   /* Parse: command = "LOAD", args = "FILE picture.iff" */
   ```

8. Application executes:
   ```c
   if (stricmp(command, "LOAD") == 0) {
       result = LoadFile(args);  /* application-specific */
   }
   ```

9. Application sets results and replies:
   ```c
   rmsg->rm_Result1 = 0;  /* success */
   if (rmsg->rm_Action & RXFF_RESULT) {
       rmsg->rm_Result2 = (LONG)CreateArgstring("picture.iff loaded", 18);
   }
   ReplyMsg((struct Message *)rmsg);
   ```

### 7. The ADDRESS Instruction in Depth

ADDRESS is the ARexx port selector. It has several forms:

#### 7.1 Permanent Address Change

```rexx
ADDRESS 'IMAGEFX'
/* All subsequent commands go to IMAGEFX */
"OPEN picture.iff"
"CROP 0 0 320 240"
"SAVE FORMAT JPEG"
```

This sets the current host for ALL subsequent commands until the next ADDRESS.
The previous host is saved and can be restored:

```rexx
ADDRESS 'IMAGEFX'    /* current = IMAGEFX */
"OPEN picture.iff"
ADDRESS 'DOPUS.1'    /* current = DOPUS.1, saved = IMAGEFX */
"COPY #?.iff TO Work:Images/"
ADDRESS               /* toggle: current = IMAGEFX, saved = DOPUS.1 */
"CLOSE"
```

#### 7.2 Single-Command Address

```rexx
ADDRESS 'IMAGEFX' "OPEN picture.iff"
/* Only this ONE command goes to IMAGEFX */
/* The default host is unchanged */
```

This is syntactic sugar. The interpreter temporarily switches the host, sends the
command, and switches back. It's equivalent to:
```rexx
ADDRESS 'IMAGEFX'
"OPEN picture.iff"
ADDRESS  /* toggle back */
```

#### 7.3 Dynamic Address Selection

```rexx
portname = 'IMAGEFX'
ADDRESS VALUE portname
/* The host is now whatever portname evaluates to */
```

ADDRESS VALUE evaluates the expression and uses the result as the port name.
This enables dynamic port selection at runtime:

```rexx
/* Send a command to every running editor instance */
DO i = 1 TO 10
    portname = 'GOLDED.' || i
    IF SHOW('P', portname) THEN DO
        ADDRESS VALUE portname
        "SAVE"
    END
END
```

#### 7.4 Built-in Hosts

Several host names are handled specially by the interpreter:

| Host | Behavior |
|------|----------|
| `COMMAND` | Routes to the AmigaDOS shell (default host). Commands are executed as CLI commands via SystemTagList(). |
| `REXX` | Routes to the RexxMast process. Used to launch other ARexx scripts. |
| `ARexx` | Synonym for REXX in some implementations. |

```rexx
/* Default: commands go to COMMAND (AmigaDOS) */
"List >T:filelist SYS:#?"          /* runs the List command */
"Delete T:filelist"                 /* runs the Delete command */

/* Switch to ARexx's own port */
ADDRESS 'REXX'
"run_other_script.rexx arg1 arg2"  /* launches another ARexx script */
```

#### 7.5 Nested ADDRESS in Subroutines

Each subroutine invocation gets its OWN address environment:

```rexx
ADDRESS 'APP1'
"COMMAND_FOR_APP1"
CALL MySub
/* After return, we're still addressing APP1 */
"ANOTHER_COMMAND_FOR_APP1"
EXIT

MySub:
    ADDRESS 'APP2'       /* local to this subroutine */
    "COMMAND_FOR_APP2"
    RETURN
```

The ADDRESS setting is part of the subroutine's local environment, just like
local variables. When the subroutine returns, the caller's ADDRESS is restored.
This is critical for writing reusable library procedures that don't disturb the
caller's host setting.

### 8. Bi-Directional Communication

ARexx communication was never one-way. The protocol supported rich interaction
patterns.

#### 8.1 Script-to-Application (the common case)

```rexx
/* Script sends commands to application */
ADDRESS 'IMAGEFX'
"OPEN picture.iff"
"SCALE 640 480"
"SAVE FORMAT PNG"
```

#### 8.2 Application-to-Script

Applications could LAUNCH ARexx scripts and receive results:

```c
/* Application launches an ARexx script */
struct RexxMsg *msg = CreateRexxMsg(replyPort, "rexx", "REXX");
msg->rm_Args[0] = CreateArgstring("process_data.rexx", 17);
msg->rm_Action = RXCOMM | RXFF_STRING;  /* RXFF_STRING = inline, or omit for file */

/* Send to RexxMast */
struct MsgPort *rexxPort = FindPort("REXX");
PutMsg(rexxPort, &msg->rm_Node);

/* Wait for completion */
WaitPort(replyPort);
struct RexxMsg *reply = (struct RexxMsg *)GetMsg(replyPort);
/* reply->rm_Result1 = script's exit code */
/* reply->rm_Result2 = script's exit value (if RXFF_RESULT was set) */
```

This created a powerful pattern: applications could use ARexx scripts as
"macros" or "plugins" without compiling anything. Users could extend
application behavior by writing scripts.

#### 8.3 Application-to-Application via ARexx

Two applications could communicate through ARexx as a broker:

```rexx
/* ARexx script bridges two applications */
ADDRESS 'SPREADSHEET'
"GET CELL A1"
value = RESULT

ADDRESS 'CHARTMAKER'
"PLOT VALUE" value
```

The script acts as glue code, translating between application command vocabularies.
Neither application needs to know about the other. ARexx is the universal translator.

#### 8.4 Function Call Mode

Besides RXCOMM (command) mode, ARexx supported RXFUNC (function call) mode. In
this mode, the application received a function name and arguments and returned a
value directly:

```rexx
/* Script calls a function provided by an application */
result = MYAPPFUNC(arg1, arg2, arg3)
```

The application registered itself as a "function host" via RXADDFH. When the
interpreter encountered an unknown function, it searched function hosts before
raising a SYNTAX error. The application received a RexxMsg with:
- rm_Action = RXFUNC | argcount
- rm_Args[0] = function name
- rm_Args[1..n] = arguments

This was more efficient than command mode for returning values, since function
call syntax naturally captured the return value without needing OPTIONS RESULTS.

#### 8.5 Synchronous vs. Asynchronous

By default, all ARexx commands were synchronous: the script blocked until the
application replied. However, asynchronous patterns were possible:

```rexx
/* Launch a background task via COMMAND host */
ADDRESS COMMAND
"Run >NIL: <NIL: LongProcess"
/* Script continues immediately -- Run detaches the process */

/* Or use ARexx's own concurrency */
ADDRESS 'REXX'
"background_script.rexx"    /* if sent with RXFF_NONRET, fire-and-forget */
```

True async command dispatch required the RXFF_NONRET flag, which told the
interpreter not to wait for a reply. This was rarely used in scripts (which had
no built-in await/callback mechanism) but was common in application-to-application
communication.

### 9. Port Enumeration and Discovery

ARexx provided built-in functions for discovering active ports:

#### 9.1 SHOW('P') -- List All Ports

```rexx
/* List all public message ports */
portList = SHOW('P')
SAY portList
/* Output: REXX COMMAND DOPUS.1 IMAGEFX GOLDED.1 MYAPP ... */
```

SHOW('P') returned a space-separated list of all public port names. The script
could parse this to discover available applications:

```rexx
/* Find all instances of Directory Opus */
allPorts = SHOW('P')
DO i = 1 TO WORDS(allPorts)
    port = WORD(allPorts, i)
    IF LEFT(port, 5) = 'DOPUS' THEN
        SAY "Found Directory Opus instance:" port
END
```

#### 9.2 SHOW('P', name) -- Check Specific Port

```rexx
/* Check if ImageFX is running */
IF SHOW('P', 'IMAGEFX') THEN DO
    ADDRESS 'IMAGEFX'
    "OPEN picture.iff"
END
ELSE
    SAY "ImageFX is not running."
```

This returned 1 (true) if the named port exists, 0 (false) otherwise. Under the
hood, it was just FindPort() wrapped in a Forbid()/Permit() pair.

#### 9.3 Wait-for-Port Pattern

A common pattern was waiting for an application to start:

```rexx
/* Wait for ImageFX to start (with timeout) */
timeout = 30  /* seconds */
DO i = 1 TO timeout
    IF SHOW('P', 'IMAGEFX') THEN LEAVE
    ADDRESS COMMAND "Wait 1"   /* AmigaDOS Wait command, 1 second */
END

IF \SHOW('P', 'IMAGEFX') THEN DO
    SAY "ImageFX did not start within" timeout "seconds."
    EXIT 20
END

ADDRESS 'IMAGEFX'
"OPEN picture.iff"
```

#### 9.4 Other SHOW() Resources

SHOW() could enumerate other ARexx resources:
- `SHOW('L')` -- Function libraries (added with ADDLIB)
- `SHOW('H')` -- Function hosts (applications providing functions)
- `SHOW('C')` -- Clip list entries (inter-script data sharing)
- `SHOW('F')` -- Open file handles
- `SHOW('L', name)` -- Check if a specific library is available

---

## Part III: The ARexx Application Protocol

### 10. How Applications Implemented ARexx Support

#### 10.1 Minimal ARexx Host Implementation

Here is a COMPLETE, minimal C implementation of an ARexx-aware application:

```c
#include <exec/types.h>
#include <exec/ports.h>
#include <rexx/storage.h>
#include <rexx/rxslib.h>
#include <proto/exec.h>
#include <proto/rexxsyslib.h>
#include <string.h>
#include <stdio.h>

#define PORTNAME "MYAPP"

struct Library *RexxSysBase = NULL;

/* Command handler table */
struct CmdEntry {
    char *name;
    LONG (*handler)(char *args, char *result, LONG resultMax);
};

/* Example command handlers */
LONG cmd_HELLO(char *args, char *result, LONG max) {
    snprintf(result, max, "Hello from MYAPP! Args: %s", args);
    return 0;  /* RC = 0, success */
}

LONG cmd_QUIT(char *args, char *result, LONG max) {
    strcpy(result, "Goodbye");
    return -1;  /* special: signal quit */
}

LONG cmd_VERSION(char *args, char *result, LONG max) {
    strcpy(result, "MYAPP 1.0");
    return 0;
}

struct CmdEntry commands[] = {
    { "HELLO",   cmd_HELLO },
    { "QUIT",    cmd_QUIT },
    { "VERSION", cmd_VERSION },
    { NULL, NULL }
};

/* Parse a command string into command name and arguments */
void ParseCommand(char *cmdString, char **cmd, char **args) {
    static char cmdBuf[256];
    strncpy(cmdBuf, cmdString, 255);
    cmdBuf[255] = 0;

    *cmd = cmdBuf;
    *args = strchr(cmdBuf, ' ');
    if (*args) {
        **args = 0;       /* NUL-terminate command name */
        (*args)++;        /* advance to arguments */
    } else {
        *args = "";
    }
}

/* Handle one ARexx message */
BOOL HandleRexxMsg(struct RexxMsg *rmsg) {
    char *cmdString = rmsg->rm_Args[0];
    char *cmd, *args;
    char resultBuf[512];
    BOOL quit = FALSE;
    LONG rc = 10;  /* default: error */

    resultBuf[0] = 0;
    ParseCommand(cmdString, &cmd, &args);

    /* Search command table */
    struct CmdEntry *entry = commands;
    while (entry->name) {
        if (stricmp(cmd, entry->name) == 0) {
            rc = entry->handler(args, resultBuf, sizeof(resultBuf));
            if (rc == -1) {
                rc = 0;
                quit = TRUE;
            }
            break;
        }
        entry++;
    }

    if (!entry->name) {
        rc = 10;
        snprintf(resultBuf, sizeof(resultBuf), "Unknown command: %s", cmd);
    }

    /* Set results */
    rmsg->rm_Result1 = rc;
    if ((rmsg->rm_Action & RXFF_RESULT) && rc == 0 && resultBuf[0]) {
        rmsg->rm_Result2 = (LONG)CreateArgstring(resultBuf, strlen(resultBuf));
    } else {
        rmsg->rm_Result2 = 0;
    }

    /* Reply to the message */
    ReplyMsg((struct Message *)rmsg);

    return quit;
}

int main(void) {
    struct MsgPort *rexxPort;

    /* Open rexxsyslib.library */
    RexxSysBase = OpenLibrary("rexxsyslib.library", 0);
    if (!RexxSysBase) {
        printf("Cannot open rexxsyslib.library\n");
        return 20;
    }

    /* Create the public ARexx port */
    rexxPort = CreatePort(PORTNAME, 0);
    if (!rexxPort) {
        printf("Cannot create port %s\n", PORTNAME);
        CloseLibrary(RexxSysBase);
        return 20;
    }

    printf("MYAPP ready. ARexx port: %s\n", PORTNAME);

    /* Main event loop */
    ULONG rexxSig = 1L << rexxPort->mp_SigBit;
    BOOL running = TRUE;

    while (running) {
        ULONG signals = Wait(rexxSig | SIGBREAKF_CTRL_C);

        if (signals & SIGBREAKF_CTRL_C) {
            running = FALSE;
        }

        if (signals & rexxSig) {
            struct RexxMsg *rmsg;
            while ((rmsg = (struct RexxMsg *)GetMsg(rexxPort))) {
                if (HandleRexxMsg(rmsg)) {
                    running = FALSE;
                }
            }
        }
    }

    /* Cleanup */
    DeletePort(rexxPort);
    CloseLibrary(RexxSysBase);
    printf("MYAPP exiting.\n");
    return 0;
}
```

This is approximately 130 lines. Adding ARexx support to an existing Amiga
application was genuinely straightforward -- the programming model was simple and
well-documented.

#### 10.2 Adding to an Existing Event Loop

The critical integration point was adding the ARexx signal to the application's
existing Wait() mask. Most Amiga GUI applications already had:

```c
ULONG waitMask = windowSig | timerSig;
ULONG sigs = Wait(waitMask);
```

ARexx integration was just:

```c
ULONG waitMask = windowSig | timerSig | rexxSig;  /* add rexx */
ULONG sigs = Wait(waitMask);
/* ... existing handlers ... */
if (sigs & rexxSig) HandleRexxMessages();
```

No threads. No callbacks. No event bus. Just one more bit in the signal mask.

### 11. The Command Vocabulary Pattern

#### 11.1 Design Principles

Each application defined its own command language. The best implementations
followed these conventions:

1. **Commands are English verbs:** LOAD, SAVE, OPEN, CLOSE, CROP, SCALE, FILTER
2. **Arguments are keyword=value pairs or positional:** `LOAD FILE picture.iff` or
   `SCALE 640 480` or `FILTER NAME GaussianBlur RADIUS 3`
3. **Quoting is consistent:** String arguments with spaces use double quotes:
   `LOAD FILE "My Picture.iff"`
4. **Commands are case-insensitive:** LOAD = Load = load
5. **Query commands return values via RESULT:** `GET WIDTH` sets RESULT to "640"
6. **Batch-friendly:** Commands work without user interaction

#### 11.2 ImageFX Command Vocabulary (Representative Example)

ImageFX by Nova Design was one of the most comprehensive ARexx implementations.
Its command set included approximately 200 commands:

```
File Operations:
  OPEN <filename>                    Load an image
  SAVE [FORMAT <fmt>] [FILE <name>]  Save the current image
  CLOSE                              Close the current image
  IMPORT <format> <filename>         Import non-native format

Editing:
  CROP <x1> <y1> <x2> <y2>          Crop to rectangle
  SCALE <width> <height>             Scale image
  ROTATE <angle>                     Rotate by degrees
  FLIP HORIZONTAL | VERTICAL         Mirror image
  UNDO                               Undo last operation

Drawing:
  SETPEN <r> <g> <b>                 Set drawing color
  LINE <x1> <y1> <x2> <y2>          Draw line
  RECT <x1> <y1> <x2> <y2>          Draw rectangle
  CIRCLE <x> <y> <radius>           Draw circle

Filters:
  FILTER <name> [params...]          Apply named filter
  BLUR [RADIUS <n>]                  Gaussian blur
  SHARPEN [AMOUNT <n>]               Unsharp mask
  EDGE                               Edge detection

Queries:
  GET WIDTH                          Returns image width
  GET HEIGHT                         Returns image height
  GET DEPTH                          Returns color depth
  GET PIXEL <x> <y>                  Returns pixel color

System:
  LOCKGUI                            Lock GUI during batch
  UNLOCKGUI                          Unlock GUI
  REQUESTFILE [TITLE <t>]            Show file requester
  REQUESTSTRING [PROMPT <p>]         Show string requester
  QUIT                               Exit application
```

#### 11.3 The Lack of IDL

There was no formal interface definition language. Command vocabularies were
documented in manuals, README files, or learned by experimentation. This was both
a strength and a weakness:

**Strength:** Low barrier to entry. An application developer could add ARexx
support in an afternoon. No IDL compiler, no stub generation, no header
synchronization. Just parse a string and do the thing.

**Weakness:** No compile-time checking, no auto-completion, no tooling. Scripts
broke silently when applications changed their command vocabulary. Arguments were
positional strings with no type information -- you could pass "banana" where a
number was expected and only find out at runtime.

Modern ports should address this with optional type annotations while preserving
the string-based simplicity of the original.

### 12. Real-World Workflows

#### 12.1 Batch Image Processing

```rexx
/* batch_convert.rexx -- Convert all IFF images to JPEG */
/* Demonstrates: ImageFX automation, AmigaDOS commands, error handling */

OPTIONS RESULTS
SIGNAL ON ERROR

/* Check that ImageFX is running */
IF \SHOW('P', 'IMAGEFX') THEN DO
    SAY "Please start ImageFX first."
    EXIT 10
END

ADDRESS 'IMAGEFX'

/* Lock the GUI for faster batch processing */
"LOCKGUI"

/* Get list of IFF files */
ADDRESS COMMAND "List >T:filelist Work:Images/#?.iff LFORMAT %p%n"
ADDRESS COMMAND "Type T:filelist"

/* Read the file list */
IF OPEN('flist', 'T:filelist', 'R') THEN DO
    count = 0
    errors = 0

    DO WHILE \EOF('flist')
        filename = READLN('flist')
        IF filename = '' THEN ITERATE

        /* Extract base name (strip .iff extension) */
        basename = LEFT(filename, LASTPOS('.iff', filename) - 1)
        outfile = basename || '.jpg'

        SAY "Processing:" filename

        ADDRESS 'IMAGEFX'
        "OPEN" filename
        IF RC \= 0 THEN DO
            SAY "  ERROR: Could not open" filename
            errors = errors + 1
            ITERATE
        END

        /* Auto-level and sharpen */
        "FILTER AutoLevel"
        "SHARPEN AMOUNT 30"

        /* Scale to web-friendly size if too large */
        "GET WIDTH"
        width = RESULT
        "GET HEIGHT"
        height = RESULT

        IF width > 1024 THEN DO
            newHeight = TRUNC(height * (1024 / width))
            "SCALE 1024" newHeight
        END

        /* Save as JPEG quality 85 */
        "SAVE FORMAT JPEG QUALITY 85 FILE" outfile
        IF RC = 0 THEN
            count = count + 1
        ELSE DO
            SAY "  ERROR: Could not save" outfile
            errors = errors + 1
        END

        "CLOSE"
    END

    CALL CLOSE 'flist'
END

"UNLOCKGUI"

SAY ""
SAY "Batch complete:" count "converted," errors "errors."
EXIT 0

ERROR:
    SAY "Script error at line" SIGL ": RC =" RC
    ADDRESS 'IMAGEFX'
    "UNLOCKGUI"
    EXIT 20
```

#### 12.2 Text Editor Automation

```rexx
/* code_format.rexx -- Reformat source code in GoldEd */
/* Demonstrates: GoldEd text manipulation, loop-driven editing */

OPTIONS RESULTS

IF \SHOW('P', 'GOLDED.1') THEN DO
    SAY "GoldEd is not running."
    EXIT 10
END

ADDRESS 'GOLDED.1'

/* Save cursor position */
"QUERY CURSOR LINE"
savedLine = RESULT
"QUERY CURSOR COLUMN"
savedCol = RESULT

/* Go to top of document */
"GOTO TOP"

/* Replace all tabs with 4 spaces */
tabCount = 0
"FIND" '09'x         /* hex 09 = tab character */
DO WHILE RC = 0
    "DELETE CHAR"
    "INSERT TEXT '    '"    /* 4 spaces */
    tabCount = tabCount + 1
    "FIND NEXT" '09'x
END
SAY "Replaced" tabCount "tabs."

/* Remove trailing whitespace on each line */
"GOTO TOP"
"QUERY LINES"
totalLines = RESULT

DO i = 1 TO totalLines
    "GOTO LINE" i
    "GOTO EOL"
    "QUERY CURSOR COLUMN"
    col = RESULT

    /* Walk backwards removing spaces and tabs */
    DO WHILE col > 1
        "CURSOR LEFT"
        "QUERY CHAR"
        ch = RESULT
        IF ch = ' ' | ch = '09'x THEN
            "DELETE CHAR"
        ELSE
            LEAVE
        col = col - 1
    END
END
SAY "Cleaned trailing whitespace on" totalLines "lines."

/* Restore cursor */
"GOTO LINE" savedLine
"GOTO COLUMN" savedCol

SAY "Formatting complete."
EXIT 0
```

#### 12.3 System Administration

```rexx
/* sys_backup.rexx -- Selective backup with Directory Opus */
/* Demonstrates: DOpus file management, conditional logic, logging */

OPTIONS RESULTS

IF \SHOW('P', 'DOPUS.1') THEN DO
    SAY "Directory Opus is not running."
    EXIT 10
END

ADDRESS 'DOPUS.1'

/* Create backup timestamp */
today = DATE('S')    /* YYYYMMDD format */
backupDir = 'Work:Backups/' || today || '/'

/* Ensure backup directory exists */
ADDRESS COMMAND "MakeDir" backupDir

/* Open log file */
logFile = backupDir || 'backup.log'
CALL OPEN 'log', logFile, 'W'
CALL WRITELN 'log', 'Backup started:' DATE() TIME()
CALL WRITELN 'log', 'Target:' backupDir

/* Back up source code */
SAY "Backing up source code..."
"SCANDIRECTORY Work:Source/ PATTERN #?.c|#?.h|#?.rexx"
IF RC = 0 THEN DO
    "QUERY NUMENTRIES"
    n = RESULT
    CALL WRITELN 'log', 'Source files found:' n
    "COPY ALL TO" backupDir || 'Source/'
    CALL WRITELN 'log', 'Source backed up: RC=' RC
END

/* Back up configuration */
SAY "Backing up configuration..."
"SCANDIRECTORY S: PATTERN #?.prefs|Startup-Sequence|User-Startup"
IF RC = 0 THEN DO
    "COPY ALL TO" backupDir || 'Config/'
    CALL WRITELN 'log', 'Config backed up: RC=' RC
END

/* Calculate and log sizes */
ADDRESS COMMAND "List" backupDir "ALL LFORMAT %l >T:sizes"
totalSize = 0
IF OPEN('sizes', 'T:sizes', 'R') THEN DO
    DO WHILE \EOF('sizes')
        line = READLN('sizes')
        IF DATATYPE(line, 'W') THEN
            totalSize = totalSize + line
    END
    CALL CLOSE 'sizes'
END

CALL WRITELN 'log', 'Total backup size:' totalSize 'bytes'
CALL WRITELN 'log', 'Backup completed:' DATE() TIME()
CALL CLOSE 'log'

SAY "Backup complete:" totalSize "bytes written to" backupDir
EXIT 0
```

#### 12.4 Multi-Application Workflow

```rexx
/* publish_report.rexx -- Full workflow across 3 applications */
/* Demonstrates: orchestrating multiple apps through ARexx */

OPTIONS RESULTS
SIGNAL ON ERROR

SAY "=== Monthly Report Publisher ==="
SAY ""

/* Step 1: Extract data from spreadsheet */
SAY "Extracting data from TurboCalc..."
IF \SHOW('P', 'TURBOCALC') THEN DO
    SAY "ERROR: TurboCalc is not running."
    EXIT 10
END

ADDRESS 'TURBOCALC'
"OPEN Work:Data/monthly_sales.tc"

/* Read sales figures */
"GET CELL B2"
salesTotal = RESULT
"GET CELL B3"
expenseTotal = RESULT
"GET CELL B4"
profit = RESULT
"GET CELL A1"
reportTitle = RESULT

"CLOSE"
SAY "  Sales:" salesTotal "  Expenses:" expenseTotal "  Profit:" profit

/* Step 2: Generate chart in ImageFX */
SAY "Generating chart in ImageFX..."
IF \SHOW('P', 'IMAGEFX') THEN DO
    SAY "ERROR: ImageFX is not running."
    EXIT 10
END

ADDRESS 'IMAGEFX'
"NEW 640 480 24"                        /* new 640x480 24-bit canvas */
"LOCKGUI"

/* Draw a simple bar chart */
"SETPEN 0 0 200"                        /* blue for sales */
barHeight = TRUNC((salesTotal / 100000) * 400)
"FILLRECT 100 " || (440 - barHeight) || " 230 440"

"SETPEN 200 0 0"                        /* red for expenses */
barHeight = TRUNC((expenseTotal / 100000) * 400)
"FILLRECT 270 " || (440 - barHeight) || " 400 440"

"SETPEN 0 200 0"                        /* green for profit */
barHeight = TRUNC((profit / 100000) * 400)
"FILLRECT 440 " || (440 - barHeight) || " 570 440"

"SAVE FORMAT PNG FILE Work:Reports/chart.png"
"CLOSE"
"UNLOCKGUI"
SAY "  Chart saved."

/* Step 3: Compose report in text editor */
SAY "Composing report in GoldEd..."
IF \SHOW('P', 'GOLDED.1') THEN DO
    SAY "ERROR: GoldEd is not running."
    EXIT 10
END

ADDRESS 'GOLDED.1'
"NEW"
"INSERT TEXT '" || reportTitle || "'"
"NEWLINE"
"INSERT TEXT '========================'"
"NEWLINE"
"NEWLINE"
"INSERT TEXT 'Generated:" DATE() TIME() "'"
"NEWLINE"
"NEWLINE"
"INSERT TEXT 'Sales Total:    $" || salesTotal || "'"
"NEWLINE"
"INSERT TEXT 'Expenses Total: $" || expenseTotal || "'"
"NEWLINE"
"INSERT TEXT 'Net Profit:     $" || profit || "'"
"NEWLINE"
"NEWLINE"
"INSERT TEXT 'See chart.png for graphical summary.'"
"NEWLINE"
"SAVE FILE Work:Reports/monthly_report.txt"

SAY ""
SAY "=== Report published to Work:Reports/ ==="
EXIT 0

ERROR:
    SAY "ERROR at line" SIGL ": RC =" RC
    EXIT 20
```

This workflow touches THREE applications (TurboCalc, ImageFX, GoldEd) plus the
AmigaDOS shell, all orchestrated by a single ARexx script. No shared libraries,
no compiled interfaces, no complex setup. Just strings flowing between ports.

---

## Part IV: Mapping to Modern Architectures

### 13. ARexx Ports to Modern IPC Comparison

| ARexx Concept | D-Bus | COM/OLE | AppleScript | Unix Pipes | gRPC | MCP |
|---------------|-------|---------|-------------|------------|------|-----|
| Named port | Well-known bus name | ProgID/CLSID | Application dictionary | File path | Service endpoint | Tool name |
| ADDRESS instruction | Proxy creation | QueryInterface | tell application | Pipe open | Channel connection | Tool selection |
| RexxMsg | D-Bus message | VARIANT | Apple Event | Byte stream | Protobuf | JSON-RPC |
| rm_Args[0] command string | Method + params | Invoke(DISPATCH_METHOD) | Command verb | stdin bytes | RPC method | Tool input |
| rm_Result1 (return code) | Error reply | HRESULT | Error number | Exit code | Status code | Error object |
| rm_Result2 (result string) | Return value | Out VARIANT | Reply event | stdout bytes | Response message | Tool output |
| SHOW('P') | ListNames | ROT enumeration | Running applications | /proc/*/fd | Service discovery | ListTools |
| RXCLOSE | (no standard) | Release | Quit | SIGPIPE/EOF | Channel shutdown | (no standard) |
| OPTIONS RESULTS | (always returns) | (always returns) | (always returns) | (always returns) | (always returns) | (always returns) |
| RXFUNC (function call) | (method call) | QueryInterface+Invoke | Handler call | (no equivalent) | Unary RPC | Tool call |
| rm_Stdin/rm_Stdout | FD passing | Stream interface | (no equivalent) | Pipe chaining | Streaming RPC | Streaming |
| Zero-copy (shared mem) | Serialized (XML/binary) | Serialized (NDR) | Serialized (AE) | Serialized (bytes) | Serialized (protobuf) | Serialized (JSON) |

Key observations from this comparison:

1. **ARexx was the simplest.** No type definitions, no schemas, no compilation
   step. Everything was strings. This is its greatest strength for rapid
   prototyping and its greatest weakness for large-scale systems.

2. **ARexx was zero-copy.** Every modern IPC mechanism serializes data. ARexx
   passed pointers. This made it faster than any modern mechanism for the
   common case (small command strings), but it required the shared address space
   that modern OSes deliberately avoid.

3. **ARexx was synchronous by default.** Most modern IPC mechanisms support async
   natively. ARexx scripts blocked on every command. This made scripts simple to
   write and reason about but limited throughput for high-frequency communication.

4. **ARexx combined the protocol and the language.** D-Bus is just an IPC
   mechanism; you need a separate language to use it. ARexx IS the language AND
   the IPC mechanism. This integration is what made it so powerful -- there was
   zero boilerplate between "I want to do X" and the code to do X.

### 14. Why MCP Is ARexx for the AI Age

The Model Context Protocol (MCP) is the closest modern analog to the ARexx port
system. The parallels are striking:

| ARexx | MCP | Analysis |
|-------|-----|----------|
| Named port (e.g., "IMAGEFX") | Tool name (e.g., "read_file") | Both are string identifiers for capabilities |
| ADDRESS 'IMAGEFX' | Tool selection in prompt | Both route commands to the right handler |
| "LOAD FILE pic.iff" | `{"tool": "read_file", "path": "pic.iff"}` | Both send a command string/object to the handler |
| rm_Result1 = 0, rm_Result2 = "ok" | `{"result": "ok"}` | Both return status + result |
| SHOW('P') | ListTools RPC | Both enumerate available capabilities |
| OPTIONS RESULTS | (always on in MCP) | ARexx made results opt-in; MCP always returns |
| Application ARexx port | MCP server | Both expose capabilities to external callers |
| ARexx script | AI agent | Both orchestrate tools to accomplish goals |
| RexxMast daemon | MCP client runtime | Both manage the lifecycle of tool invocations |

The conceptual mapping extends deeper:

**Application command vocabulary = MCP tool schema.**
An ImageFX ARexx port that accepts LOAD, SAVE, CROP, SCALE is functionally
identical to an MCP server that exposes load_image, save_image, crop_image,
scale_image tools. The difference is formalization: MCP tools have JSON Schema
definitions; ARexx commands had English documentation.

**Multi-application workflow = Multi-tool agent.**
The publish_report.rexx script above (Section 12.4) that orchestrates TurboCalc,
ImageFX, and GoldEd is the SAME PATTERN as an AI agent that uses a spreadsheet
tool, an image generation tool, and a document tool to produce a report.

**Port discovery = Tool discovery.**
SHOW('P') listing available ports is ListTools listing available tools. Both
enable dynamic capability discovery at runtime.

**The vision for GSD-OS:**
In our architecture, the ARexx port system IS the MCP substrate. A modern ARexx
implementation where:
- Each MCP server is an ARexx port
- Each MCP tool is a command in that port's vocabulary
- ADDRESS 'mcp_server_name' selects the MCP server
- ARexx scripts are the orchestration language for AI tool use
- The ARexx interpreter is the agent runtime

This is not a metaphor. It is a literal architectural mapping. The ARexx port
system, implemented in modern languages with modern IPC, becomes a native MCP
client/server framework.

### 15. Mapping to Port Targets

#### 15.1 Modern Language Port (Rust / TypeScript)

**Ports become async channels:**

```rust
// Rust: ARexx port as a tokio mpsc channel
use tokio::sync::{mpsc, oneshot};

struct RexxMsg {
    action: u32,
    args: Vec<String>,          // rm_Args equivalent
    result_tx: oneshot::Sender<RexxResult>,  // replaces mn_ReplyPort
}

struct RexxResult {
    rc: i32,                    // rm_Result1
    result: Option<String>,     // rm_Result2
}

struct RexxPort {
    name: String,
    tx: mpsc::Sender<RexxMsg>,
    rx: mpsc::Receiver<RexxMsg>,
}

// Port registry (replaces exec's public port list)
struct PortRegistry {
    ports: HashMap<String, mpsc::Sender<RexxMsg>>,
}

impl PortRegistry {
    // FindPort equivalent
    fn find_port(&self, name: &str) -> Option<mpsc::Sender<RexxMsg>> {
        self.ports.get(name).cloned()
    }

    // AddPort equivalent
    fn add_port(&mut self, name: String, tx: mpsc::Sender<RexxMsg>) -> Result<(), Error> {
        if self.ports.contains_key(&name) {
            return Err(Error::PortExists(name));
        }
        self.ports.insert(name, tx);
        Ok(())
    }

    // SHOW('P') equivalent
    fn list_ports(&self) -> Vec<&str> {
        self.ports.keys().map(|s| s.as_str()).collect()
    }
}

// ADDRESS + command dispatch
async fn send_command(
    registry: &PortRegistry,
    host: &str,
    command: &str,
) -> Result<RexxResult, Error> {
    let tx = registry.find_port(host)
        .ok_or(Error::PortNotFound(host.to_string()))?;

    let (result_tx, result_rx) = oneshot::channel();

    let msg = RexxMsg {
        action: RXCOMM | RXFF_RESULT,
        args: vec![command.to_string()],
        result_tx,
    };

    tx.send(msg).await.map_err(|_| Error::PortClosed)?;
    result_rx.await.map_err(|_| Error::NoReply)
}
```

```typescript
// TypeScript: ARexx port as an EventEmitter + Promise pattern

interface RexxMsg {
  action: number;
  args: string[];
  resolve: (result: RexxResult) => void;
  reject: (error: Error) => void;
}

interface RexxResult {
  rc: number;
  result?: string;
}

class RexxPort {
  readonly name: string;
  private queue: RexxMsg[] = [];
  private waiters: ((msg: RexxMsg) => void)[] = [];

  constructor(name: string) {
    this.name = name;
  }

  // PutMsg equivalent
  send(msg: RexxMsg): void {
    if (this.waiters.length > 0) {
      const waiter = this.waiters.shift()!;
      waiter(msg);  // wake the receiver
    } else {
      this.queue.push(msg);
    }
  }

  // GetMsg equivalent
  async receive(): Promise<RexxMsg> {
    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }
    return new Promise(resolve => {
      this.waiters.push(resolve);
    });
  }
}

class PortRegistry {
  private ports = new Map<string, RexxPort>();

  createPort(name: string): RexxPort {
    if (this.ports.has(name)) throw new Error(`Port ${name} exists`);
    const port = new RexxPort(name);
    this.ports.set(name, port);
    return port;
  }

  findPort(name: string): RexxPort | undefined {
    return this.ports.get(name);
  }

  // SHOW('P')
  listPorts(): string[] {
    return Array.from(this.ports.keys());
  }

  // SHOW('P', name)
  hasPort(name: string): boolean {
    return this.ports.has(name);
  }
}

// ADDRESS + command dispatch
async function sendCommand(
  registry: PortRegistry,
  host: string,
  command: string
): Promise<RexxResult> {
  const port = registry.findPort(host);
  if (!port) throw new Error(`Port not found: ${host}`);

  return new Promise((resolve, reject) => {
    port.send({
      action: RXCOMM | RXFF_RESULT,
      args: [command],
      resolve,
      reject,
    });
  });
}
```

**Key design decisions for the modern language port:**

1. **oneshot channels replace ReplyMsg.** Instead of the message traveling back,
   we use a one-shot channel embedded in the message. The receiver resolves the
   channel, which wakes the sender. Same semantics, no shared mutable state.

2. **The port registry is thread-safe.** Use RwLock<HashMap> in Rust or a simple
   Map in single-threaded TypeScript. The original exec port list was protected
   by Forbid()/Permit(); we protect ours with locks or single-threaded guarantees.

3. **Strings remain the primary data type.** Resist the urge to make everything
   typed. The power of ARexx was stringly-typed simplicity. Add optional type
   checking as a layer on top, not a replacement.

4. **Async/await maps naturally to the ARexx execution model.** When a script
   sends a command and waits for a reply, that is exactly `await send_command()`.
   The interpreter yields its execution context; other scripts can run; when the
   reply comes back, the interpreter resumes. This is cooperative multitasking,
   which is what ARexx always was.

#### 15.2 x86-64 Assembly Port

The assembly port requires a bare-metal approach to the port system.

**Port table as a memory-mapped structure:**

```asm
; Port table layout in memory
; Each port entry is 64 bytes (cache-line aligned)

struc PORT_ENTRY
    .name       resq 1      ; pointer to NUL-terminated name string
    .name_hash  resd 1      ; FNV-1a hash of name (for fast lookup)
    .flags      resd 1      ; PA_SIGNAL/PA_IGNORE equivalent
    .msg_head   resq 1      ; pointer to first message in queue
    .msg_tail   resq 1      ; pointer to last message in queue
    .msg_count  resq 1      ; number of queued messages
    .signal_fd  resd 1      ; eventfd for signaling (Linux)
    .owner_tid  resd 1      ; owning thread ID
    .padding    resb 8      ; pad to 64 bytes
endstruc

; Port registry: fixed-size table (256 ports max, expandable)
section .bss
    align 64
    port_table:     resb PORT_ENTRY_size * 256
    port_count:     resq 1

section .data
    port_table_lock: dq 0   ; spinlock for thread safety
```

**Message structure for x86-64:**

```asm
struc REXX_MSG
    .next       resq 1      ; linked list next pointer
    .reply_fd   resd 1      ; eventfd for reply notification
    .padding1   resd 1      ; alignment
    .action     resd 1      ; action code + flags
    .result1    resd 1      ; return code
    .result2    resq 1      ; result string pointer
    .arg_count  resd 1      ; number of arguments
    .padding2   resd 1      ; alignment
    .args       resq 16     ; argument string pointers (128 bytes)
    .comm_addr  resq 1      ; host address name
    .file_ext   resq 1      ; file extension
    .stdin_fd   resd 1      ; stdin file descriptor
    .stdout_fd  resd 1      ; stdout file descriptor
endstruc
; Total: 184 bytes (round to 192 for cache alignment)
```

**FindPort in x86-64 assembly:**

```asm
; find_port: Look up a port by name
; Input:  rdi = pointer to port name string
; Output: rax = pointer to PORT_ENTRY, or 0 if not found
; Clobbers: rcx, rdx, rsi, r8

find_port:
    push rbx
    push r12

    ; First, compute FNV-1a hash of the name for fast comparison
    mov r12, rdi            ; save name pointer
    call fnv1a_hash         ; rax = hash of name
    mov r8d, eax            ; r8d = target hash

    ; Acquire read lock (spin lock for simplicity)
    lea rdi, [rel port_table_lock]
    call spinlock_acquire

    ; Scan port table
    lea rbx, [rel port_table]
    mov rcx, [rel port_count]
    test rcx, rcx
    jz .not_found

.scan_loop:
    ; Fast path: compare hash first (avoids strcmp for non-matches)
    cmp [rbx + PORT_ENTRY.name_hash], r8d
    jne .next_entry

    ; Hash match -- do full string comparison
    mov rdi, [rbx + PORT_ENTRY.name]
    mov rsi, r12
    call strcmp             ; rax = 0 if equal
    test eax, eax
    jz .found

.next_entry:
    add rbx, PORT_ENTRY_size
    dec rcx
    jnz .scan_loop

.not_found:
    xor eax, eax           ; return NULL
    jmp .done

.found:
    mov rax, rbx           ; return pointer to PORT_ENTRY

.done:
    ; Release lock
    push rax
    lea rdi, [rel port_table_lock]
    call spinlock_release
    pop rax

    pop r12
    pop rbx
    ret
```

**PutMsg in x86-64 assembly:**

```asm
; put_msg: Send a message to a port
; Input:  rdi = pointer to PORT_ENTRY
;         rsi = pointer to REXX_MSG
; Output: eax = 0 on success, -1 on error

put_msg:
    push rbx
    push r12
    mov rbx, rdi            ; port
    mov r12, rsi            ; message

    ; Clear next pointer (message goes to tail)
    mov qword [r12 + REXX_MSG.next], 0

    ; Atomically append to port's message queue
    ; (using compare-and-swap on tail pointer)
.retry_enqueue:
    mov rax, [rbx + PORT_ENTRY.msg_tail]
    test rax, rax
    jz .empty_queue

    ; Queue has messages -- append after tail
    mov [rax + REXX_MSG.next], r12
    lock cmpxchg [rbx + PORT_ENTRY.msg_tail], r12
    jnz .retry_enqueue
    jmp .enqueued

.empty_queue:
    ; Queue was empty -- set both head and tail
    mov [rbx + PORT_ENTRY.msg_head], r12
    mov [rbx + PORT_ENTRY.msg_tail], r12

.enqueued:
    lock inc qword [rbx + PORT_ENTRY.msg_count]

    ; Signal the receiver (write to eventfd)
    mov edi, [rbx + PORT_ENTRY.signal_fd]
    mov rsi, 1              ; eventfd increment value
    lea rdx, [rsp - 8]
    mov qword [rdx], 1
    mov rdi, [rbx + PORT_ENTRY.signal_fd]
    mov eax, 1              ; SYS_write
    mov rsi, rdx            ; buffer containing uint64_t 1
    mov edx, 8              ; 8 bytes
    syscall

    xor eax, eax            ; success
    pop r12
    pop rbx
    ret
```

**System call interface for port operations:**

On Linux, the assembly port uses these kernel primitives:
- `eventfd2()` for signal bits (replaces Amiga signals)
- `epoll_wait()` for Wait() (multiplexing multiple eventfds)
- `futex()` for spinlocks (if contention is expected)
- `mmap()` for shared memory regions (if cross-process ports are needed)

The mapping from Amiga to Linux x86-64:

| Amiga exec | Linux x86-64 | syscall # |
|------------|-------------|-----------|
| AllocSignal() | eventfd2(0, EFD_NONBLOCK) | 290 |
| Signal(task, mask) | write(eventfd, &1, 8) | 1 |
| Wait(mask) | epoll_wait(epfd, ...) | 232 |
| Forbid()/Permit() | futex(FUTEX_LOCK_PI) or spinlock | 202 |
| AllocMem(MEMF_PUBLIC) | mmap(PROT_READ\|PROT_WRITE, MAP_SHARED) | 9 |
| FreeMem() | munmap() | 11 |

#### 15.3 CUDA Port

The CUDA port maps the ARexx port system to GPU-CPU communication. This is
the most radical reinterpretation because GPUs are not general-purpose
computers -- they are massively parallel SIMD processors with their own
memory hierarchy.

**Port system as GPU-CPU communication bridge:**

```
CPU (Host)                              GPU (Device)
+------------------+                    +------------------+
| Port Registry    |                    | Kernel Dispatch  |
| (HashMap)        |   PCIe Bus        | Table            |
|                  | ←——————————————→  |                  |
| ARexx            |   cudaMemcpy      | Command Buffer   |
| Interpreter      |   cudaLaunch      | (ring buffer in  |
|                  |   cudaStream      |  device memory)  |
+------------------+                    +------------------+
```

**Command buffer in device memory:**

```c
// Shared command buffer structure (in device-visible memory)

#define MAX_COMMAND_LEN 256
#define MAX_RESULT_LEN  256
#define CMD_BUFFER_SIZE 1024  // ring buffer capacity

struct CudaRexxCommand {
    int32_t  action;                    // RXCOMM, RXFUNC, etc.
    int32_t  status;                    // 0=pending, 1=executing, 2=complete
    int32_t  result_code;               // rm_Result1 equivalent
    int32_t  arg_count;
    char     command[MAX_COMMAND_LEN];   // rm_Args[0] equivalent
    char     result[MAX_RESULT_LEN];     // rm_Result2 equivalent
};

struct CudaCommandBuffer {
    volatile int32_t head;              // next slot to write (CPU)
    volatile int32_t tail;              // next slot to read (GPU)
    volatile int32_t completed;         // last completed slot
    CudaRexxCommand  commands[CMD_BUFFER_SIZE];
};

// Allocated in unified memory for CPU-GPU shared access
CudaCommandBuffer *cmdBuffer;
cudaMallocManaged(&cmdBuffer, sizeof(CudaCommandBuffer));
```

**Kernel dispatch table:**

Instead of parsing command strings on the GPU (which would be prohibitively
expensive), the CUDA port pre-compiles a dispatch table mapping command names
to kernel function pointers:

```c
// Command-to-kernel mapping (host side)
typedef void (*KernelFunc)(CudaRexxCommand *cmd, void *data);

struct KernelEntry {
    const char *name;
    KernelFunc  kernel;
};

// Pre-registered kernels
__global__ void kernel_matrix_multiply(CudaRexxCommand *cmd, void *data);
__global__ void kernel_fft(CudaRexxCommand *cmd, void *data);
__global__ void kernel_reduce(CudaRexxCommand *cmd, void *data);
__global__ void kernel_transform(CudaRexxCommand *cmd, void *data);

KernelEntry gpu_commands[] = {
    { "MATMUL",    kernel_matrix_multiply },
    { "FFT",       kernel_fft },
    { "REDUCE",    kernel_reduce },
    { "TRANSFORM", kernel_transform },
    { NULL, NULL }
};

// CPU-side dispatch (called from ARexx interpreter)
void dispatch_to_gpu(const char *command, CudaCommandBuffer *buf) {
    // Parse command name
    char cmdName[64];
    extract_command_name(command, cmdName);

    // Look up kernel
    KernelFunc kernel = NULL;
    for (int i = 0; gpu_commands[i].name; i++) {
        if (strcasecmp(cmdName, gpu_commands[i].name) == 0) {
            kernel = gpu_commands[i].kernel;
            break;
        }
    }

    if (!kernel) {
        // Command not found -- handle as error
        return;
    }

    // Write command to shared buffer
    int slot = atomicAdd(&buf->head, 1) % CMD_BUFFER_SIZE;
    CudaRexxCommand *cmd = &buf->commands[slot];
    strncpy(cmd->command, command, MAX_COMMAND_LEN);
    cmd->action = RXCOMM;
    cmd->status = 0;  // pending

    // Launch kernel
    kernel<<<gridDim, blockDim>>>(cmd, deviceData);

    // Wait for completion (or use CUDA streams for async)
    cudaDeviceSynchronize();

    // Read results back
    // cmd->result_code and cmd->result are now populated
}
```

**Block-level port resolution:**

Within a GPU kernel, multiple thread blocks can operate as independent "ports,"
each handling a different aspect of a complex command:

```c
__global__ void kernel_batch_process(CudaRexxCommand *cmd, float *data, int n) {
    int blockPort = blockIdx.x;  // each block = one "port"
    int tid = threadIdx.x;

    // Block 0: statistics computation
    // Block 1: normalization
    // Block 2: transformation
    // Block 3: result aggregation

    __shared__ float blockResult[256];

    switch (blockPort) {
        case 0:  // "STATS" sub-port
            compute_stats(data, n, tid, blockResult);
            break;
        case 1:  // "NORMALIZE" sub-port
            normalize_data(data, n, tid, blockResult);
            break;
        case 2:  // "TRANSFORM" sub-port
            apply_transform(data, n, tid, blockResult);
            break;
        case 3:  // "AGGREGATE" sub-port
            aggregate_results(data, n, tid, blockResult);
            break;
    }

    // Block 0 writes final result
    if (blockPort == 0 && tid == 0) {
        snprintf(cmd->result, MAX_RESULT_LEN,
                 "Processed %d elements, mean=%.4f", n, blockResult[0]);
        cmd->result_code = 0;
        cmd->status = 2;  // complete
    }
}
```

**Key CUDA port design decisions:**

1. **Command parsing happens on the CPU, not the GPU.** String parsing is
   inherently serial and branchy -- exactly what GPUs are bad at. The CPU parses
   the ARexx command, resolves it to a kernel, and dispatches.

2. **INTERPRET becomes a lookup, not dynamic execution.** You cannot JIT-compile
   REXX code on a GPU. Instead, INTERPRET on the CUDA target resolves to a
   pre-compiled kernel dispatch table. This is the most significant semantic
   departure from the original ARexx. (See Section 16.)

3. **Results flow back through unified memory.** CUDA unified memory
   (cudaMallocManaged) provides a shared address space between CPU and GPU,
   which maps naturally to the Amiga's flat address space. The command buffer
   and result strings live in this shared region.

4. **CUDA streams enable asynchronous port communication.** Each "port" can
   be assigned its own CUDA stream, allowing multiple commands to execute
   concurrently on the GPU -- parallel command dispatch, which was NOT possible
   in original ARexx.

### 16. The INTERPRET Challenge for Each Target

The INTERPRET instruction is ARexx's most powerful and most dangerous feature.
It takes a string and executes it as REXX code at runtime:

```rexx
code = "SAY 'Hello from interpreted code'"
INTERPRET code

/* Or more dangerously: */
expr = "2 + 2"
INTERPRET "result =" expr
SAY result   /* 4 */
```

This is `eval()`. It requires a full REXX parser and interpreter to be available
at runtime. Each port target handles this differently.

#### 16.1 Modern Language Port (Rust/TypeScript)

**Approach: Embedded interpreter.**

The modern language port includes the full ARexx interpreter as a library. When
INTERPRET is encountered, the interpreter recursively invokes itself on the
provided string. This is straightforward because the interpreter is already
written in the same language:

```rust
fn execute_interpret(&mut self, code: &str) -> Result<(), RexxError> {
    // Parse the string into an AST
    let ast = self.parser.parse(code)?;

    // Execute in the CURRENT environment (shares variables, ports, etc.)
    self.execute_ast(&ast)
}
```

The only subtlety is that INTERPRET must share the calling environment: variables
set by INTERPRET are visible to the caller, and vice versa. This means the
interpreted code does NOT get its own scope -- it runs in the caller's scope.

**Performance consideration:** Each INTERPRET call involves parsing, which can
be expensive. A JIT cache (keyed by the code string) can avoid re-parsing
repeated INTERPRET calls. This is a common pattern in REXX programs:

```rexx
/* Build and execute a formula dynamically */
DO i = 1 TO 1000
    formula = "x =" i "* 2 + 3"
    INTERPRET formula
    /* Without caching, this parses "x = N * 2 + 3" 1000 times */
END
```

#### 16.2 x86-64 Assembly Port

**Approach: Self-modifying code or embedded interpreter.**

Option A -- Embedded interpreter: The assembly port includes a minimal REXX
parser/interpreter written in assembly. This is the safe, portable approach.
INTERPRET calls the parser, which generates an intermediate representation,
which the interpreter executes. Performance is moderate.

Option B -- Runtime code generation: The assembly port includes a simple
REXX-to-x86-64 compiler that generates machine code at runtime. INTERPRET
compiles the string to native code in an mmap(PROT_EXEC) region and jumps
to it. This is effectively a JIT compiler. Performance is excellent but the
implementation is complex and raises security concerns (W^X policy violations
on some systems).

```asm
; Option B: JIT compilation of INTERPRET
; Input: rdi = pointer to REXX code string
; Output: rax = function pointer to compiled code

interpret_jit:
    push rbx
    push r12

    ; Step 1: Parse REXX string into IR
    mov rdi, rdi            ; code string
    call rexx_parse_to_ir   ; returns IR in rax
    mov r12, rax            ; save IR

    ; Step 2: Allocate executable memory
    mov edi, 4096           ; page size
    mov esi, PROT_READ | PROT_WRITE
    mov edx, MAP_PRIVATE | MAP_ANONYMOUS
    mov r10d, -1            ; fd = -1
    xor r8d, r8d            ; offset = 0
    mov eax, 9              ; SYS_mmap
    syscall
    mov rbx, rax            ; rbx = code buffer

    ; Step 3: Compile IR to x86-64 machine code
    mov rdi, r12            ; IR
    mov rsi, rbx            ; output buffer
    call rexx_compile_ir    ; returns code size in eax
    mov r12d, eax           ; save code size

    ; Step 4: Make executable (W^X transition)
    mov rdi, rbx            ; address
    mov esi, r12d           ; size
    mov edx, PROT_READ | PROT_EXEC  ; remove write, add exec
    mov eax, 10             ; SYS_mprotect
    syscall

    ; Step 5: Return function pointer
    mov rax, rbx

    pop r12
    pop rbx
    ret
```

**Recommended approach:** Start with Option A (embedded interpreter) for
correctness, then add Option B (JIT) as an optimization for hot INTERPRET paths.
The JIT should be optional and disabled by default for security.

#### 16.3 CUDA Port

**Approach: Pre-compiled dispatch table (INTERPRET becomes lookup).**

CUDA devices cannot execute arbitrary code at runtime. There is no malloc for
executable memory on the GPU, no self-modifying code, no JIT. INTERPRET on
CUDA must be handled by one of:

1. **CPU fallback:** INTERPRET executes on the CPU, not the GPU. Any results
   are copied back to the GPU context. This is correct but slow for GPU-intensive
   workloads.

2. **Pre-compiled kernel table:** Common INTERPRET patterns are identified at
   compile time and pre-compiled into GPU kernels. At runtime, the INTERPRET
   string is matched against the table:

```c
// Pre-compiled INTERPRET patterns for CUDA
struct InterpretPattern {
    const char *pattern;     // regex or exact match
    int        kernel_id;    // index into kernel table
};

InterpretPattern cuda_interpret_table[] = {
    { "result = %f * %f + %f",  KERNEL_FMA },
    { "result = sqrt(%f)",       KERNEL_SQRT },
    { "result = sin(%f)",        KERNEL_SIN },
    { "result = %f ** %f",      KERNEL_POW },
    { NULL, -1 }
};

// At runtime:
int resolve_interpret(const char *code) {
    for (int i = 0; cuda_interpret_table[i].pattern; i++) {
        if (match_pattern(code, cuda_interpret_table[i].pattern)) {
            return cuda_interpret_table[i].kernel_id;
        }
    }
    return -1;  // not found -- fall back to CPU
}
```

3. **PTX assembly emission:** The CUDA port could emit PTX (NVIDIA's virtual
   ISA) at runtime and use the CUDA driver API to compile it. This is the
   closest to true INTERPRET on GPU:

```c
// Dynamic PTX compilation (CUDA driver API)
CUmodule module;
CUfunction kernel;

const char *ptx = generate_ptx_from_rexx(interpret_string);
cuModuleLoadDataEx(&module, ptx, 0, NULL, NULL);
cuModuleGetFunction(&kernel, module, "interpret_kernel");
cuLaunchKernel(kernel, gridDim, blockDim, 0, stream, args, NULL);
```

This works but is slow (PTX compilation takes milliseconds) and complex. It
should be reserved for INTERPRET strings that will be executed many times.

**This is the key design decision for the CUDA port:** INTERPRET on GPU is
either a lookup (fast but limited), a CPU fallback (correct but slow), or a
PTX JIT (flexible but complex). The recommended approach is a tiered strategy:
hot patterns in the dispatch table, rare patterns on CPU, and PTX JIT as an
optional optimization for users who need it.

---

## Part V: Architecture Diagrams

### Complete Port System Architecture (Original Amiga)

```
+-----------------------------------------------------------------------+
|                         Amiga Shared Address Space                     |
|                                                                        |
|  +-----------+    +-----------+    +-----------+    +-----------+      |
|  | ARexx     |    | ImageFX   |    | DOpus     |    | GoldEd    |      |
|  | Interp.   |    |           |    |           |    |           |      |
|  |           |    |           |    |           |    |           |      |
|  | script    |    | event     |    | event     |    | event     |      |
|  | executor  |    | loop      |    | loop      |    | loop      |      |
|  |     |     |    |   |       |    |   |       |    |   |       |      |
|  |     v     |    |   v       |    |   v       |    |   v       |      |
|  | [reply    |    | [IMAGEFX] |    | [DOPUS.1] |    | [GOLDED.1]|      |
|  |  port]    |    |  port     |    |  port     |    |  port     |      |
|  +-----|-----+    +-----|-----+    +-----|-----+    +-----|-----+      |
|        |               |               |               |               |
|        +-------+-------+-------+-------+-------+-------+              |
|                |                                                       |
|        +-------|-------+                                               |
|        | exec.library  |                                               |
|        | Public Port   |   [REXX] [IMAGEFX] [DOPUS.1] [GOLDED.1]     |
|        | List          |   (linked list of named MsgPort structures)   |
|        +---------------+                                               |
|                                                                        |
|  +-------------------------------------------------------------------+ |
|  | RexxMast Daemon                                                   | |
|  | - Listens on port "REXX"                                         | |
|  | - Launches script interpreter processes                           | |
|  | - Manages function libraries and hosts                            | |
|  +-------------------------------------------------------------------+ |
+------------------------------------------------------------------------+
```

### Modern Port System Architecture (Rust/TypeScript)

```
+--------------------------------------------------------------------+
|  Process / Runtime                                                  |
|                                                                     |
|  +-------------------+    +-------------------+                     |
|  | ARexx Interpreter |    | MCP Server        |                     |
|  | (async task)      |    | (async task)      |                     |
|  |                   |    |                    |                     |
|  | ADDRESS 'APP1'    |    | tools: [           |                     |
|  | "LOAD file"       |    |   load_image,      |                     |
|  |   |               |    |   save_image,      |                     |
|  |   v               |    |   crop_image       |                     |
|  | sendCommand() ----|--->| ]                  |                     |
|  |   |               |    |   |                |                     |
|  |   | await reply   |    |   v                |                     |
|  |   |               |    | dispatch(cmd)      |                     |
|  |   |               |    |   |                |                     |
|  |   |<-- result ----|----|   | execute         |                     |
|  |   |               |    |   |                |                     |
|  |   v               |    |   v                |                     |
|  | RC=0, RESULT=ok   |    | reply(0, "ok")    |                     |
|  +-------------------+    +-------------------+                     |
|           |                        |                                |
|  +--------|------------------------|------+                         |
|  |        v                        v      |                         |
|  | +----------------------------------+   |                         |
|  | | Port Registry                    |   |                         |
|  | | (RwLock<HashMap<String, Sender>>)|   |                         |
|  | |                                  |   |                         |
|  | | "APP1" → Sender<RexxMsg>        |   |                         |
|  | | "APP2" → Sender<RexxMsg>        |   |                         |
|  | | "REXX" → Sender<RexxMsg>        |   |                         |
|  | +----------------------------------+   |                         |
|  |                                        |                         |
|  | Tokio Runtime / Node.js Event Loop     |                         |
|  +----------------------------------------+                         |
+----------------------------------------------------------------------+
```

### CUDA Port Architecture

```
+---------------------------+          +---------------------------+
|        CPU (Host)         |          |       GPU (Device)        |
|                           |          |                           |
| +---------------------+  |  PCIe    | +---------------------+  |
| | ARexx Interpreter   |  |  Bus     | | Kernel Dispatch     |  |
| |                     |  |          | | Table               |  |
| | ADDRESS 'GPU'       |  |          | |                     |  |
| | "MATMUL A B C"      |  |          | | MATMUL → __global__ |  |
| |   |                 |  |          | | FFT    → __global__ |  |
| |   v                 |  |          | | REDUCE → __global__ |  |
| | parse_command()     |  |          | |                     |  |
| |   |                 |  |          | +---------------------+  |
| |   v                 |  |          |           |               |
| | resolve_kernel()    |  |          |           v               |
| |   |                 |  |          | +---------------------+  |
| |   v                 |  |          | | Thread Blocks       |  |
| | write to cmd buffer-|--+--------->| |                     |  |
| |   |                 |  |          | | Block 0: [T0..T255] |  |
| |   v                 |  |          | | Block 1: [T0..T255] |  |
| | cudaLaunchKernel()  |  |          | | Block 2: [T0..T255] |  |
| |   |                 |  |          | | ...                 |  |
| |   v                 |  |          | | Block N: [T0..T255] |  |
| | cudaDeviceSync()    |  |          | |                     |  |
| |   |                 |  |          | +---------------------+  |
| |   v                 |  |          |           |               |
| | read result <-------|-----------+--          v               |
| |   |                 |  |          | result in unified mem   |
| |   v                 |  |          |                           |
| | RC=0, RESULT="done" |  |          |                           |
| +---------------------+  |          |                           |
+---------------------------+          +---------------------------+
```

### Message Flow Comparison: Original vs. Modern

```
ORIGINAL (Amiga, 1987):
========================

   Script Task          exec.library          App Task
        |                    |                    |
        |-- PutMsg() ------->|-- Signal() ------->|
        |   (pointer move)   | (bit set, ~1 us)  |
        |                    |                    |
        |                    |<-- ReplyMsg() -----|
        |<-- Signal() -------|   (pointer move)   |
        |   (bit set)        |                    |
        |                    |                    |
   Total: ~200-500 us, zero copies, zero serialization


MODERN (Rust, 2026):
=====================

   Script Task          Port Registry          App Task
        |                    |                    |
        |-- send() --------->|-- channel.send --->|
        |   (Arc<RexxMsg>)   | (mpsc, ~50 ns)   |
        |                    |                    |
        |                    |<-- oneshot.send ---|
        |<-- await ----------|   (RexxResult)    |
        |                    |                    |
   Total: ~1-5 us, 1 allocation, no serialization
   (within process; cross-process adds serde ~10 us)


CUDA (GPU, 2026):
==================

   CPU Interpreter      Unified Memory         GPU Kernel
        |                    |                    |
        |-- write cmd ------>|                    |
        |-- cudaLaunch ----->|-- read cmd ------->|
        |   (~5-10 us)      |                    |
        |                    |                    |-- execute
        |                    |                    |   (~varies)
        |                    |<-- write result ---|
        |-- cudaSync ------->|                    |
        |<-- read result ----|                    |
        |                    |                    |
   Total: ~15-50 us + kernel time, 0 explicit copies (unified memory)
```

---

## Part VI: Porting Specification Summary

### Data Type Mapping

| Original (68K) | Rust | TypeScript | x86-64 ASM | CUDA |
|----------------|------|------------|------------|------|
| struct MsgPort | `RexxPort` (struct w/ mpsc) | `RexxPort` (class) | PORT_ENTRY (struc) | CudaCommandBuffer |
| struct Message | (embedded in RexxMsg) | (embedded) | (embedded) | (embedded) |
| struct RexxMsg | `RexxMsg` (struct) | `RexxMsg` (interface) | REXX_MSG (struc) | CudaRexxCommand |
| STRPTR (argstring) | `String` / `Arc<str>` | `string` | ptr + len | `char[]` (fixed) |
| MsgPort.mp_SigBit | tokio Notify / channel | Promise resolve | eventfd | cudaEvent_t |
| FindPort() | `registry.find_port()` | `registry.findPort()` | `find_port:` | (CPU-side only) |
| PutMsg() | `tx.send()` | `port.send()` | `put_msg:` | `cudaMemcpy + Launch` |
| GetMsg() | `rx.recv()` | `await port.receive()` | `get_msg:` | (kernel reads buffer) |
| WaitPort() | `rx.recv().await` | `await port.receive()` | `epoll_wait` | `cudaDeviceSync` |
| ReplyMsg() | `result_tx.send()` | `msg.resolve()` | `reply_msg:` | (kernel writes result) |
| SHOW('P') | `registry.list_ports()` | `registry.listPorts()` | `list_ports:` | (CPU-side only) |
| ADDRESS | interpreter state | interpreter state | interpreter state | interpreter state |
| INTERPRET | recursive interpret | recursive interpret | embedded interp / JIT | dispatch table / CPU fallback |

### Semantic Guarantees That Must Be Preserved

1. **Commands are synchronous by default.** The script MUST block until the
   application replies. Async must be opt-in (via a new ASYNCADDRESS or similar).

2. **ADDRESS is scoped to the current procedure.** Subroutines get their own
   ADDRESS context. This maps to per-coroutine state in modern implementations.

3. **RC and RESULT are set after every command.** RC is always set. RESULT is
   set only if OPTIONS RESULTS is active and RC=0. The previous RESULT is
   dropped (not accumulated).

4. **Port names are case-sensitive.** "IMAGEFX" and "ImageFX" are different
   ports. (In practice, all Amiga applications used uppercase.)

5. **Port lookup is dynamic.** ADDRESS does not bind to a port at parse time.
   It resolves the port at each command dispatch. A port can appear and
   disappear between commands.

6. **Messages are processed FIFO.** A port's message queue is strictly ordered.
   Messages are dispatched in the order received.

7. **Reply ownership.** The result string (rm_Result2) is allocated by the
   application and freed by the interpreter. In modern terms: the application
   transfers ownership of the result to the caller.

8. **Error codes follow the 0/5/10/20 convention.** 0 = success, 5 = warning,
   10 = error, 20 = severe error. These map to REXX condition handlers
   (NOVALUE, SYNTAX, ERROR, FAILURE).

### Open Design Questions for Porting

1. **Cross-process ports?** Original ARexx ports worked across processes because
   of the shared address space. Modern implementations must decide: are ports
   process-local (like Go channels) or cross-process (like D-Bus)? Recommendation:
   start process-local, add cross-process as an optional transport.

2. **Type annotations?** Should the modern port system support typed arguments
   beyond strings? Recommendation: strings remain the base protocol. Type
   annotations are optional metadata (like JSON Schema for MCP tools).

3. **Concurrent command execution?** Original ARexx dispatched one command at a
   time per script. Should modern implementations support concurrent dispatch
   (send multiple commands, await all)? Recommendation: yes, as an extension.
   `ADDRESS ASYNC 'PORT' "CMD"` sends without blocking; `AWAIT` collects results.

4. **Port namespacing?** The flat namespace worked for single-user Amigas. Multi-
   user or networked systems need namespaces. Recommendation: use dot-separated
   hierarchical names (e.g., "user.tibsfox.imagefx") with flat names as sugar
   for the local namespace.

5. **Security?** Original ARexx had no access control -- any script could talk to
   any port. Modern implementations need capability-based security. Recommendation:
   port creators specify an access policy (open, token-required, same-process-only).
   This aligns with MCP's permission model.

---

## Part VII: Historical Context and Legacy

### Why the Port System Mattered

The Amiga ARexx port system, operational from 1987 onwards, was arguably the first
successful implementation of universal application scripting on a personal computer.
It predated:
- Microsoft OLE Automation (1993) by 6 years
- AppleScript (1993) by 6 years
- D-Bus (2002) by 15 years
- Language Server Protocol (2016) by 29 years
- Model Context Protocol (2024) by 37 years

Every one of these later systems solved the same fundamental problem: how do you
let a scripting language control arbitrary applications? Every one of them arrived
at a similar architecture: named endpoints, message passing, command dispatch,
result return. The Amiga got there first, with the simplest possible implementation
(shared memory + named ports + string commands), and it worked well enough that an
entire ecosystem grew up around it.

### What the Amiga Got Right

1. **Simplicity of adoption.** Adding ARexx support to an application was a few
   hours of work. No IDL, no code generation, no complex registration. This low
   barrier meant that MOST Amiga applications eventually supported ARexx.

2. **Language and IPC as one.** ARexx didn't just provide IPC -- it provided a
   complete scripting language that naturally integrated IPC. You didn't need to
   learn two things (a language and an IPC mechanism); learning ARexx gave you both.

3. **Zero-copy performance.** Message passing was essentially free. A command
   dispatch was faster than a function call through a shared library (no stack
   frame setup, no register saves -- just a pointer move and a signal).

4. **The ecosystem effect.** Once enough applications supported ARexx, the value
   of every application increased because they could all talk to each other.
   This created a network effect that drove further adoption.

### What the Amiga Got Wrong

1. **No type safety.** Everything was strings. You found out about argument
   errors at runtime, often with cryptic error messages. A command that expected
   a number and got a word would either crash or silently produce wrong results.

2. **No formal interfaces.** Without IDL, there was no way to programmatically
   discover what commands an application supported, what arguments they took, or
   what results they returned. You needed the manual.

3. **No security.** Any script could send any command to any port. There was no
   authentication, no authorization, no sandboxing. A malicious script could
   silently control any application on the system.

4. **No memory protection.** A bug in the message passing code could corrupt any
   process's memory. In practice, this was rare (the protocol was simple enough
   to get right), but when it happened, the system crashed.

5. **Single-machine only.** The port system was fundamentally tied to shared
   memory on a single machine. There was no network transparency, no remote
   port access, no distributed scripting.

Our modern port addresses all five weaknesses while preserving the four strengths.
That is the design goal. That is the porting specification.

---

## References

1. Commodore-Amiga, Inc. *Amiga ROM Kernel Reference Manual: Libraries.* 3rd edition, 1992.
2. Commodore-Amiga, Inc. *Amiga ROM Kernel Reference Manual: Includes and Autodocs.* 3rd edition, 1992.
3. William S. Hawes. *ARexx: An Implementation of the REXX Language for the Amiga.* Hawes, Inc., 1987.
4. Ralph Babel. *The Amiga Guru Book.* Babel, 1993. (Definitive reference for exec.library internals.)
5. IBM. *The REXX Language: A Practical Approach to Programming.* Mike Cowlishaw, 1990.
6. AmigaDOS Technical Reference Manual, Commodore, 1986.
7. ImageFX ARexx Reference, Nova Design, 1994.
8. GoldEd ARexx Reference, Dietmar Eilert, 1995.
9. Directory Opus ARexx Reference, Jonathan Potter (GP Software), 1993.

---

> PNW Research Series -- Computation Cluster
> Document: RXX-PORTS-IPC
> Version: 1.0
> Status: Complete
> Lines: ~1,150
> Cross-references: asm-research/architectures.md, c-research/language-core.md
> Next document: rxx-stdlib.md (ARexx standard library and built-in functions)
