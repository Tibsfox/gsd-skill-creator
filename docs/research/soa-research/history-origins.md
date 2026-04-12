# Service-Oriented Architecture: History and Origins

*A historical narrative for the PNW Research Series*
*Research thread: HISTORY — people, dates, chronology, cultural arc*

---

## Prologue: The Word That Ate Enterprise IT

In the spring of 2003, a marketing executive at Gartner Group dropped a phrase into a research note that would, within twenty-four months, become the single most contested piece of jargon in enterprise computing. The phrase was *Service-Oriented Architecture*. By 2006, every CIO on every Fortune 500 letterhead had an "SOA strategy." By 2009, an analyst named Anne Thomas Manes would declare the same three letters dead. By 2014, the ghost of SOA would shamble back into the conversation wearing a new suit and calling itself *microservices*. By 2024, practitioners would quietly admit that SOA had been right all along — it had just been too early, too heavy, and too married to a generation of vendors who mistook standards bodies for revenue models.

This is the history of how that happened. It is a story that starts in 1984 in a basement at Xerox PARC with a paper by two researchers named Andrew Birrell and Bruce Nelson, winds through the ideological religious wars of object-oriented middleware in the 1990s, explodes into a standards arms race at the turn of the millennium, collapses under the weight of its own XML schemas, and reconstitutes itself through the humbler technologies of REST, JSON, containers, and ultimately Kubernetes. Along the way we will meet Roy Fielding in his UC Irvine office finishing a dissertation that accidentally became a manifesto; Don Box writing a snarky essay called *A Young Person's Guide to SOAP*; Dave Winer stubbornly refusing to accept that XML-RPC needed to get complicated; Jeff Bezos sending a now-legendary memo to every team at Amazon threatening to fire them; Adrian Cockcroft dragging Netflix off the mainframe and into the cloud; and Martin Fowler and James Lewis, in March 2014, coining the word that would supersede SOA while simultaneously being SOA's direct descendant.

This is also the story of what it felt like to be in the industry during those years. The SOA era had a particular cultural texture — conference keynotes with seventeen-layer reference architectures, ESB vendors selling "governance" like indulgences, analyst firms charging $50,000 for reports on Web Services standards that nobody would ever fully implement, and system integrators billing $400/hour to reconcile WSDL documents that had diverged in subtle, schema-breaking ways. SOA was, for a moment, both a genuine architectural insight and one of the most lucrative rackets in the history of enterprise software. Both things are true at once. That contradiction is what makes the story interesting.

Let us begin where all such stories must begin — with people trying to make one computer talk to another computer.

---

## Part I: Prehistory (1960s–1988)

### 1.1 Time-Sharing and the First Shared Services

Before you can have a service-oriented architecture you need to have the concept of a *service* — something a computer does on behalf of some other computer, or some other user, over some boundary. The earliest intellectual ancestor of this idea is time-sharing, the practice (radical in the 1960s, invisible in the 2020s) of allowing multiple users to interact with a single computer at the same time.

Time-sharing emerged in the early 1960s as a response to batch processing. On a batch-processing mainframe like the IBM 7094, a programmer would punch their program onto cards, drop the deck into a hopper, wait hours or days, and get back a printout. If the program had a typo, the cycle began again. John McCarthy at MIT, in a famous 1959 memo, proposed that a single computer could be shared across many interactive terminals, each user getting the illusion of a private machine through rapid context switching. CTSS — the Compatible Time-Sharing System — went live at MIT's Computation Center in November 1961, running on a modified IBM 7090. CTSS was the first successful time-sharing system, and it established a psychological precedent: the machine you were talking to was not necessarily the machine physically in front of you. Your "program" was a request for service from a distant shared resource.

Multics (Multiplexed Information and Computing Service), the successor to CTSS, made the abstraction explicit. Announced in 1964 as a collaboration between MIT, Bell Labs, and General Electric, Multics treated the computer itself as a *utility* — a service that users subscribed to the way they subscribed to electrical power. The Multics project lasted until 2000 (the last Multics installation shut down in Halifax, Nova Scotia, on October 30, 2000), and its influence on Unix, on security models, on filesystem design, and on the very vocabulary of computing was enormous. But for our story the important thing is the metaphor: the computer as a utility, offering *services* to remote callers.

By the late 1960s, commercial time-sharing services like GE Information Services, Tymshare, and the National CSS network were selling computing cycles by the minute. A user in Boston with a Teletype ASR-33 could dial a modem, connect to a remote system, run a FORTRAN program, and get results back without ever knowing where the physical machine was. The essential architectural move of SOA — "I call a thing out there, it does work for me, I get a response" — was already present in 1966. What was missing was the idea that the caller and the callee could themselves be programs rather than humans.

### 1.2 ARPANET and the First Client-Server Interactions

The ARPANET, which sent its first message on October 29, 1969 (from UCLA to SRI — the famous "LO" transmission when the receiving host crashed after two characters of the word "LOGIN"), was a research project aimed at resource sharing. The phrase "client-server" would not become commonplace until the 1980s, but the first ARPANET applications already had the shape. Telnet (1969), FTP (1971), and SMTP (1982) were all explicitly client-server protocols, each defined by an RFC, each assuming a dedicated server process running on a known port and a client process that connected from somewhere else on the network.

The Network Control Protocol (NCP), the original ARPANET transport, was replaced on January 1, 1983 — "Flag Day" — with TCP/IP. This was the technical substrate on which all future distributed computing would run. Once you had reliable byte streams across arbitrary distances, the question of *how two programs should talk* became pressing.

The early answer was: by agreeing on a text protocol. FTP, SMTP, and later HTTP were all line-oriented text protocols where the client sent commands and the server sent back status codes and data. This worked, but it had a fundamental limitation: every protocol was bespoke. If you wanted to write a new kind of server, you had to design a new protocol, write its state machine, negotiate with implementers, and submit an RFC. What programmers wanted was something more like ordinary programming — calling a function that happened to execute somewhere else.

### 1.3 Birrell and Nelson: The RPC Paper

In February 1984, the ACM Transactions on Computer Systems published a paper that, in retrospect, is the Ur-text of distributed computing: "Implementing Remote Procedure Calls" by Andrew D. Birrell and Bruce Jay Nelson, both then at Xerox PARC's Computer Science Laboratory. The paper is a dense, seventeen-page artifact of its era, describing an implementation of RPC built on top of the Xerox research internet, using Cedar (Xerox's in-house programming language), and running on the Alto and Dorado workstations.

The intellectual move Birrell and Nelson made was this: *treat the network as invisible*. From the perspective of the programmer, calling a procedure on another machine should look exactly like calling a procedure on the local machine. The compiler, aided by an interface definition and a stub generator, would handle the argument marshaling, the network transmission, the error cases, and the return value unmarshaling. The caller would not need to think about packets, TCP, endianness, or even whether the remote machine was up. (Actually, Birrell and Nelson's RPC used a lightweight packet protocol of their own design — not TCP — because TCP had too much overhead for a simple request-response.)

The Birrell-Nelson paper is a marvel of careful engineering. It documents how to handle the binding problem (how does the caller find the callee's address?), exception handling (what happens if the server crashes mid-call?), argument passing (how do you marshal pointers and variable-length structures?), and performance (Cedar RPC achieved about 1,100 null RPCs per second on an Alto-to-Alto link — blistering for 1984). It also is brutally honest about the semantics: "at most once" semantics are much harder than local procedure calls, and the engineers had to explicitly design for partial failure in a way that local programmers never have to.

Nelson had actually done the foundational work earlier, in his 1981 Carnegie Mellon PhD dissertation under Jim Morris and the Spice project, where he coined the phrase "remote procedure call" and laid out the argument-passing stub mechanism. The 1984 paper with Birrell was the productization at PARC and the canonical citation. If you pick up almost any textbook on distributed systems from the last forty years, the RPC chapter will cite this paper in the first paragraph.

The critical thing to notice, because it becomes relevant again and again throughout the SOA story, is that the RPC abstraction *leaks*. Jim Waldo, Geoff Wyant, Ann Wollrath, and Sam Kendall would later write a famous 1994 Sun Microsystems technical report titled "A Note on Distributed Computing" (SMLI TR-94-29) which argued, with mordant clarity, that trying to make distributed calls look like local calls was a category mistake. Local calls and remote calls differ in four fundamental ways: latency (remote is orders of magnitude slower), memory access (remote has no shared memory), partial failure (remote can fail in ways that local cannot), and concurrency (remote calls interleave with other activity on the remote host). Pretending these differences do not exist leads to systems that work in demo and fail in production. This critique — simmering in the background throughout the 1980s and 1990s — would eventually boil over in the 2000s and become the REST critique of SOAP/WSDL.

But in 1984, the insight was intoxicating. RPC let you write distributed programs without thinking. Xerox Courier, the wire protocol behind Cedar RPC, became the model. Sun followed in 1985 with Sun RPC (later standardized as ONC RPC in RFC 1057, 1988, written by Bob Lyon and colleagues at Sun). Sun RPC was the foundation for NFS (Network File System, 1984), one of the most successful distributed systems ever built. Apollo Computer, meanwhile, built its own RPC system called NCA (Network Computing Architecture) and its Network Computing System (NCS), which would become the direct technical ancestor of DCE RPC.

### 1.4 Apollo, NCS, and the Road to DCE

Apollo Computer, founded in 1980 in Chelmsford, Massachusetts, built some of the earliest commercial workstations. Apollo's DOMAIN operating system had a distributed design from day one: file systems, authentication, and process namespaces spanned multiple machines transparently. In 1987 Apollo released NCS — the Network Computing System — and its NIDL (Network Interface Definition Language), an IDL-style tool for describing RPC interfaces. NCS was aggressive about cross-platform portability (it supported byte-order negotiation in the wire protocol — the "NDR" Network Data Representation, which would later become CDR in CORBA and XDR in Sun RPC's cousin), and about location transparency (it had a "Location Broker" that let clients find services by interface rather than by hostname).

Apollo was acquired by Hewlett-Packard in 1989, and NCS became HP's contribution to a broader industry effort. That effort was the Open Software Foundation, or OSF — a consortium founded in May 1988 by IBM, DEC, HP, Apollo, Bull, Nixdorf, and Siemens, explicitly as a counterweight to AT&T and Sun's joint Unix effort (the "Unix International" camp, promoting UNIX System V Release 4). OSF held a "Request for Technology" (RFT) for distributed computing in late 1988, and in May 1990 announced the winners: HP/Apollo's NCS for RPC, MIT's Kerberos (Project Athena) for authentication, DEC's naming services, Siemens's diskless operations, and a handful of other components. This package was branded the Distributed Computing Environment — **DCE**.

DCE 1.0 shipped in January 1992. It was, for its time, an enormous achievement. DCE bundled together:

- **DCE RPC** — a C-oriented RPC system with an IDL (Interface Definition Language), stub generation, and the NDR wire format. DCE RPC was descended from NCS and would later become the wire protocol underneath Microsoft DCOM.
- **DCE Security** — Kerberos v5, authorization lists, and the concept of a "principal" that could be authenticated across the cell.
- **DCE Directory Services** — CDS (Cell Directory Service) for intra-cell naming and GDS (Global Directory Service, an X.500-based system) for inter-cell naming.
- **DCE Distributed Time Service** — a network time protocol that predated and competed with NTP.
- **DCE Distributed File System** — DFS, descended from the Andrew File System (AFS) from CMU.
- **DCE Threads** — an implementation of POSIX draft threads (pthreads) before POSIX had finalized the standard.

DCE was deployed in banks, defense contractors, and telcos throughout the 1990s. It worked. It was also, legendarily, painful to administer. A DCE "cell" required multiple servers, careful Kerberos key management, and rigorous clock synchronization. Setting up a new cell was a multi-day operation. Adding a new client machine involved registering a principal, generating keytab files, and hoping nothing had drifted. For every success story there was a story of an administrator pulling hair out at 3 AM because a Kerberos ticket had expired during a cell rebuild.

The lesson of DCE, which would be forgotten and relearned multiple times in the SOA era, was this: distributed systems have an operational tax that scales nonlinearly with the number of services. You can build the cleanest possible RPC layer and still drown in the administrative overhead of making it actually run in production. SOA would later discover this lesson via ESB vendors who charged six-figure licenses and seven-figure consulting engagements to run what was, essentially, DCE with XML on top.

### 1.5 Why the RPC Abstraction Leaked

Throughout the late 1980s and into the early 1990s, a pattern emerged that would repeat itself for decades. A research team would build a beautiful RPC system that made distributed calls look like local calls. Developers would love it in demos. Operators would deploy it. And then, six months in, the horror stories would start:

- **Timeouts that weren't timeouts.** A client call would block for thirty seconds, then return a "timeout" error, but the server had actually executed the call. Repeating the call would execute it twice. Idempotency was not yet a word people said.
- **Marshalling surprises.** A pointer argument passed to a remote call would silently become a copy rather than a reference. Mutations to the "pointer" on the callee side would be lost on return. Code that worked locally failed mysteriously when moved across the wire.
- **Byte order and padding.** A struct that marshalled fine between two Sun 4 machines would produce garbage when called from a DEC VAX because the endianness was reversed. DCE RPC handled this with NDR negotiation; sloppier systems did not.
- **Cascading failures.** When a downstream service slowed down, threads in the caller would block on RPC calls. Thread pools would fill up. The caller would run out of threads and start rejecting new work, even for calls that didn't need the downstream service. The whole system would cascade into unresponsiveness.
- **The "gray failure."** A server would accept connections but process them infinitely slowly. RPC clients would queue up, none of them would time out for minutes, and the entire distributed system would grind to a halt while the monitoring dashboards showed everything as "up."

These were not new problems. Waldo, Wyant, Wollrath, and Kendall's 1994 note laid them out with clarity. But the temptation of transparent distribution was too great to resist. Every generation of middleware — DCE in 1992, CORBA in 1991, DCOM in 1996, Java RMI in 1997, SOAP in 1999, REST in 2000 (as a reaction), gRPC in 2015 — would be marketed partly on the promise of making the network invisible, and every generation would rediscover that the network is, in fact, not invisible.

---

## Part II: The CORBA Era (1989–2000)

### 2.1 The Object Management Group

On April 11, 1989, eleven companies gathered in a meeting room and agreed to form a consortium. The companies were 3Com, American Airlines, Canon, Data General, Hewlett-Packard, Philips Telecommunications, Sun Microsystems, Unisys, and three others, and the consortium was the **Object Management Group** (OMG). The goal: to develop vendor-neutral standards for distributed object-oriented computing.

The early 1990s were the peak of the object-oriented programming hype cycle. Smalltalk had been released to industry in 1980; C++ had been standardized (informally) by 1989; Objective-C was shipping on NeXTSTEP; Eiffel was making claims about correctness; and Java would not arrive until 1995. Every major IT vendor believed that objects would eat the world. The OMG's thesis was that if objects were going to be the organizing principle of software, then distributed objects — objects that could live on any machine in the network and be called from any other — must be the organizing principle of enterprise software.

The OMG grew rapidly. By 1991 it had over 100 member companies. By 1996 it had over 700. Its working method was to issue RFPs (Requests for Proposals), collect submissions from member companies, negotiate a synthesis, and publish the result as a standard. The first fruit of this process was **CORBA 1.0**, the Common Object Request Broker Architecture, released in October 1991.

### 2.2 CORBA 1.0 and IDL

CORBA 1.0 defined three things. First, an **Interface Definition Language** (IDL), a C++-like syntactic layer for declaring interfaces:

```
interface Account {
    readonly attribute double balance;
    void deposit(in double amount);
    void withdraw(in double amount) raises (InsufficientFunds);
};
```

Second, a **core Object Request Broker** (ORB) architecture: a runtime component that would accept object references, route invocations, marshal arguments, dispatch to server skeletons, and return results. Third, a **language binding** for C (later expanded to C++, Ada, Smalltalk, Cobol, Python, Java, Lisp, and others).

The IDL was compiled by an IDL compiler (like `idl2cpp` or `omniidl`) into stubs (for the client) and skeletons (for the server). Stubs made the remote call look like a local method call; skeletons turned incoming requests into local method dispatches. This was exactly the Birrell-Nelson model, extended to handle objects rather than just procedures.

The important novelty was **object references**. In CORBA, a client did not just call a function by name — it held a reference to a specific *object instance* on a specific (possibly remote) server, and invoked methods on that reference. Object references could be passed as arguments, returned from calls, published in naming services, and stored in files (as "stringified IORs" — Interoperable Object References). This was genuinely new: CORBA was the first industrial-strength attempt to build a distributed object graph that spanned machines.

CORBA 1.0 had a glaring limitation: it did not specify a wire protocol. Each ORB vendor was free to use whatever network protocol it wanted, which meant ORBs from different vendors could not talk to each other. In practice, users were locked into a single vendor's ORB for all their CORBA needs.

### 2.3 CORBA 2.0 and IIOP

**CORBA 2.0**, released in August 1996, fixed the interoperability problem by mandating a wire protocol: the **General Inter-ORB Protocol** (GIOP) and its concrete TCP/IP binding, the **Internet Inter-ORB Protocol** (IIOP). GIOP defined a compact binary message format with CDR (Common Data Representation) for type-correct byte-order-negotiated marshaling. IIOP was GIOP over TCP.

With CORBA 2.0, an ORB from IONA (Orbix) could, at least in theory, talk to an ORB from Sun (NEO, later Iplanet), or Inprise/Borland (VisiBroker), or IBM (Component Broker, later the WebSphere ORB). In practice, interoperability was a continuous source of pain — vendors interpreted the specs differently, added proprietary extensions, or simply had bugs that only manifested at cross-vendor boundaries. Still, the step from "no interop" to "some interop" was enormous.

### 2.4 The ORB Vendor Wars

The mid-1990s saw a genuine commercial market for ORBs. The major players were:

- **IONA Technologies**, founded in 1991 in Dublin as a Trinity College spinout by Chris Horn, Sean Baker, and Annrai O'Toole. IONA's **Orbix** was considered the reference CORBA implementation by many. IONA went public on NASDAQ in 1997 at a valuation around $550 million, at the peak of its influence. Orbix was written in C++ and later ported to Java.
- **Visigenic**, founded in 1993 in San Mateo by Roger Sippl (formerly of Informix). Visigenic's **VisiBroker** was the other leading ORB. Visigenic was acquired by Borland (then known as Inprise) in 1997 for $133 million, which folded VisiBroker into the Inprise/Borland developer tools portfolio.
- **BEA Systems**, founded in 1995 by Bill Coleman, Ed Scott, and Alfred Chuang, acquired an ORB called WebLogic from the ObjectSpace/WebLogic team and also acquired the Tuxedo transaction monitor from Novell. BEA's **WebLogic** would later become the leading Java application server, eating the CORBA world from inside.
- **HP ORB Plus**, from Hewlett-Packard, descended from DCE work.
- **Sun's ORB** (NEO, and later the ORB bundled into Java 2 via IDL in the `javax.rmi.CORBA` packages).
- **IBM Component Broker**, later rebranded as the object services layer in WebSphere.

The CORBA market was, at its peak in 1998-1999, a multi-hundred-million-dollar annual business just for the ORB licenses, never mind the consulting and deployment services. Training a team in CORBA was a multi-week investment. Writing a production CORBA application required careful attention to the IDL design, the POA (Portable Object Adapter — added in CORBA 2.2 in 1998), threading models, interceptors, and the increasingly baroque collection of CORBA Services.

### 2.5 CORBA Services (CORBAservices)

On top of the core ORB, the OMG defined a suite of **CORBAservices**, each a separately-specified service that an ORB vendor could optionally implement:

- **Naming Service** — a hierarchical namespace for registering and looking up object references by name. The industry's shared spanning tree of object names.
- **Event Service** — a publish/subscribe channel for decoupled event delivery. Later extended to the **Notification Service** with filtering and QoS.
- **Transaction Service** (OTS) — distributed two-phase commit transactions, modeled on the DTP XA specification from the Open Group. OTS was the foundation of the EJB transaction model.
- **Persistent Object Service** (POS) — pluggable persistence for CORBA objects, largely ignored in practice.
- **Concurrency Control Service** — distributed locks.
- **Security Service** — authentication, authorization, audit, SSL-like channel security.
- **Query Service** — SQL-like queries over collections of CORBA objects.
- **Trader Service** — a richer alternative to Naming Service, where services advertised their properties and clients queried by capability.
- **Time Service**, **Licensing Service**, **Property Service**, and others.

In theory, these services combined into a complete enterprise computing platform. In practice, only a handful — Naming, Events, Transactions, Security — saw meaningful adoption, and vendors implemented them inconsistently. Each service was a separate 100-page spec. Assembling a working CORBA application required understanding a dozen of these specs simultaneously.

### 2.6 CORBA 3.0 and the CCM

In 2002, the OMG released **CORBA 3.0**, which included the **CORBA Component Model** (CCM). The CCM was an ambitious attempt to provide a component model on top of the ORB, roughly analogous to Enterprise JavaBeans. Components had lifecycle callbacks, persistence hooks, declarative transaction attributes, security policies, and so on. The CCM was designed by committee and showed it. Almost nobody implemented it. By the time CCM specs were final, the world had already moved on — Java EE was eating enterprise middleware, Web Services were eating cross-organization integration, and CORBA was shifting from "future of computing" to "legacy integration technology."

### 2.7 Why CORBA Is Remembered as a Partial Failure

CORBA was neither a total failure nor a total success. It was widely deployed (telecoms, banking, air traffic control, some of the systems that run the global financial settlement networks are still running CORBA in 2026) and it worked in production. But it never became what its advocates promised it would become — the universal substrate of enterprise computing. Several reasons:

1. **Complexity**. The full CORBA stack was vast. Developers had to understand IDL, the POA, the various CORBA services, the vendor's ORB quirks, and the nuances of distributed object lifecycle management. The learning curve was punishing.
2. **Vendor lock-in**. Despite IIOP, interoperability between vendors was fragile. Once you committed to Orbix or VisiBroker, moving was expensive.
3. **The firewall problem**. CORBA's IIOP ran on arbitrary TCP ports. Corporate firewalls, which had been designed for HTTP's port 80 and SMTP's port 25, blocked IIOP by default. Opening arbitrary ports to let ORBs talk across the internet was a non-starter for security-conscious enterprises. There were proposals for HTTP tunneling of IIOP but they were never adopted at scale.
4. **Byte order and wire format surprises**. Cross-vendor CDR incompatibilities were a continuous source of bugs.
5. **C++ and the impedance mismatch**. Many CORBA systems were built in C++, and the language binding was gnarly. Memory management of CORBA objects (reference counting, `_duplicate`, `_release`) was a minefield.
6. **The rise of Java**. Java RMI arrived in 1997 with a much simpler programming model. Java EE later standardized on RMI-over-IIOP as a CORBA bridge, but most Java developers never touched raw CORBA.
7. **The rise of the Web**. HTTP was simple, firewall-friendly, and ubiquitous. When the Web became a platform, everyone wanted to layer their distributed computing on HTTP, not on IIOP.

By 2002, "CORBA" had become a code word in the industry for "technology you deploy when you have to, not when you want to." It was respectable; it was reliable; it was legacy. Meanwhile, a new set of standards was being drafted on the whiteboards of Microsoft and IBM, and they would be pitched explicitly as "CORBA for the Web."

### 2.8 CORBA's Legacy

Before leaving CORBA it is worth noting what it actually gave to the next generation:

- **The IDL pattern**. The idea that you write an interface in a neutral description language, then generate client and server stubs, came into CORBA from NCS/NIDL and went on to become gRPC Protocol Buffers, Thrift, and OpenAPI.
- **IIOP under Java EE**. Java RMI over IIOP (RMI-IIOP) became the inter-EJB call protocol in Java EE. For years, every application server bundled an ORB because CORBA was the wire-level substrate of EJB.
- **The CORBAservices template**. Naming, Events, Transactions, and Security all migrated, with slightly different names, into Java EE's JNDI, JMS, JTA, and JAAS.
- **The lessons about complexity**. Every subsequent middleware effort that ignored CORBA's complexity lessons repeated them. (And the SOA/WS-* stack repeated all of them, at scale, within five years.)

Don Box, who would become the SOAP guy, wrote a book in 1998 called *Essential COM* in which he argued that CORBA had tried to do too much, and that a simpler component model could win. He was half right. The simpler model did win — but it wasn't DCOM.

---

## Part III: Microsoft and the Component Wars (1993–1999)

### 3.1 COM: Inside the Box

Microsoft's path through distributed computing took a different route. Microsoft had built **OLE** (Object Linking and Embedding) in 1990 as a way to embed Excel spreadsheets inside Word documents. OLE 1.0 was built on DDE (Dynamic Data Exchange), a clunky message-passing system. OLE 2.0, released in 1993, was built on a new substrate called **COM** — the Component Object Model.

COM was the brainchild of a team at Microsoft including Tony Williams, Kraig Brockschmidt, Bob Atkinson, and Mark Ryland. The core idea was elegant and orthogonal to object-orientation in the traditional sense: COM did not define an object model; it defined a *binary interface* standard. A COM interface was just a vtable (a table of function pointers) with a universally unique identifier (a UUID, later called a GUID). Objects exposed interfaces via a single method, `QueryInterface`, which took a GUID and returned a pointer to an interface vtable if the object supported it, or `E_NOINTERFACE` if it did not.

This was, in hindsight, the sharpest binary interface standard ever designed. Because a vtable is a language-neutral concept (any language that can call function pointers can use a COM interface), COM allowed components written in C, C++, Visual Basic, Delphi, or any language with a COM binding to interoperate at the binary level, without recompilation, on Windows. Microsoft ate its own dogfood ruthlessly: by 1995, most of the Windows shell, most of Microsoft Office, ActiveX controls on web pages, the scripting engines (VBScript, JScript), and the database access layer (ADO, OLE DB) were all built on COM.

### 3.2 DCOM: COM Across the Wire

In 1996, with the release of Windows NT 4.0, Microsoft extended COM across the network. **DCOM** — Distributed COM — was, at the wire level, a fork of DCE RPC. The NDR encoding was the same. The authentication layer used NTLM (and later Kerberos on Windows 2000). The binding mechanism used object exporters and object references ("OBJREFs") that could be passed across machine boundaries.

DCOM had some genuinely nice properties. Location transparency was clean: a client could instantiate a remote COM object with `CoCreateInstanceEx`, passing a remote machine name, and from there the object was indistinguishable from a local one. Security was integrated with Windows authentication, which meant NT domain administrators could manage DCOM permissions the same way they managed file permissions.

But DCOM inherited CORBA's firewall problem. It used arbitrary TCP ports negotiated via the RPC endpoint mapper on port 135. It had trouble traversing NAT. And — critically — it was a Microsoft-only technology. While there were third-party DCOM implementations (EntireX from Software AG, and a few others), the real market was Windows-to-Windows, and it was vanishingly small compared to the cross-platform enterprise market.

### 3.3 MTS and the Transaction Coordinator

In December 1996, Microsoft released **Microsoft Transaction Server** (MTS), a component execution environment for COM objects. MTS provided:

- Object pooling and just-in-time activation.
- Declarative transaction attributes (`Requires Transaction`, `Supports Transactions`, etc.) that were processed by the MTS runtime.
- Role-based security declared in an attribute store.
- Integration with the Distributed Transaction Coordinator (DTC) for two-phase commit across multiple resource managers (SQL Server, MSMQ, Oracle).

MTS was, in almost all the ways that mattered, the model for Enterprise JavaBeans. Sun's EJB 1.0 spec, released in March 1998, borrowed MTS's declarative transaction model, the container-managed lifecycle, and the security attribute concept. This cross-pollination between Microsoft and Sun, via the mutual copying of good ideas, would become a theme in the SOA era.

### 3.4 The Component Wars: CORBA vs DCOM vs JavaBeans

By 1997, enterprise architects faced a three-way religious war:

- **CORBA**: cross-platform, standards-based (OMG), mature, complex, expensive, vendor-fragmented.
- **DCOM**: Windows-only, Microsoft-proprietary, well-integrated with Windows tooling, cheap, firewall-unfriendly.
- **Enterprise JavaBeans**: Java-only, Sun-controlled, container-based, declarative, still immature in 1998.

Conferences were organized around these camps. Trade magazines ran cover stories on "CORBA vs DCOM." Consultants billed massive fees to help enterprises choose sides and implement the chosen framework. The religious intensity is hard to convey to anyone who wasn't there. Enterprise architects in 1998 debated distributed object frameworks the way ancient theologians debated the procession of the Holy Spirit.

The resolution came from an unlikely direction. None of these technologies won. What won was a new approach that treated distributed computing not as object invocation but as document exchange. That approach was called Web Services, and its arrival would kill the component wars within five years by obsoleting the premise of the argument.

### 3.5 Microsoft's Pivot to .NET and SOAP

In 1999, Microsoft began its "Next Generation Windows Services" (NGWS) project, later rebranded as **.NET**. .NET was a ground-up replacement for the COM-based development stack: a managed runtime (the CLR) modeled on the JVM, a common type system across languages, a unified class library (the BCL), and — critically — a new story for distributed computing that was *not* DCOM.

That new story was **SOAP**, which Microsoft would co-author with Dave Winer, Don Box, and others. When .NET 1.0 shipped in February 2002, it included comprehensive SOAP client and server support via ASP.NET Web Services (ASMX) and the `System.Web.Services` namespace. DCOM was not removed from Windows — it is still there in 2026 — but Microsoft ceased marketing it as the future. The future, according to Microsoft, was Web Services. And Microsoft had been one of the three companies that invented them.

---

## Part IV: Java EE and the Application Server Era (1998–2005)

### 4.1 The Origin of J2EE

While Microsoft and the CORBA vendors were wrestling over distributed objects, Sun Microsystems was quietly building a different kind of platform. Java had been released in 1995 as a consumer programming language (originally aimed at set-top boxes, then repurposed for web applets when Sun realized the browser was a more lucrative target). By 1997, Sun had realized that Java's real opportunity was server-side.

Sun's initial server-side story was a set of loosely coupled technologies: servlets (for HTTP request handling), JDBC (for database access), RMI (Remote Method Invocation, a Java-native RPC system), and JNDI (a directory/naming service API). In 1998 Sun announced the **Java 2 Platform, Enterprise Edition** (J2EE), which bundled these technologies with a new one: **Enterprise JavaBeans** (EJB).

J2EE 1.0 was announced in December 1998 and released in final form in December 1999. It included:

- **Servlets and JSP** for web tier.
- **EJB 1.0** for business logic.
- **JDBC 2.0** for data access.
- **JNDI 1.2** for naming and directory.
- **JMS 1.0** for messaging.
- **JTA/JTS 1.0** for distributed transactions (built on CORBA OTS under the hood).
- **RMI-IIOP** for inter-EJB calls (CORBA wire protocol, Java programming model).
- **JavaMail** for email.

### 4.2 EJB: The Beautiful and the Damned

EJB 1.0 had three bean types: **Session Beans** (stateless or stateful business logic), **Entity Beans** (persistent business objects that mapped to database tables), and — added in EJB 2.0 — **Message-Driven Beans** (asynchronous listeners on JMS queues).

EJB had a declarative programming model. You wrote an interface (the "remote interface") that declared the business methods; a "home interface" that declared the lifecycle methods (create, find, remove); an implementation class that actually did the work; and an XML deployment descriptor that specified transaction attributes, security roles, database mappings, and more. The container generated stubs, wired up the persistence, enforced the transactions, and made everything go. In theory, this was beautiful: business logic was separated from infrastructure, infrastructure was declarative, and the same beans could be redeployed from development to production with different descriptors.

In practice, EJB 1.0 and 2.0 were widely considered a nightmare. The reasons were legion:

- **Entity beans were slow**. The CMP (container-managed persistence) system in EJB 2.0 required an astonishing amount of XML and had performance characteristics that were, in some cases, 100× worse than hand-tuned JDBC.
- **The interfaces were intrusive**. Your business class had to extend `EntityBean` or `SessionBean`, implement a dozen lifecycle callbacks (most of which you left empty), and pretend to be a JavaBean even when you weren't.
- **Local and remote interfaces diverged**. In EJB 2.0, Sun added "local interfaces" to avoid the performance overhead of RMI-IIOP for co-located beans. Now you had two interfaces per bean, and the distinction leaked into client code.
- **Deployment descriptors ballooned**. A nontrivial EJB application might have a thousand lines of XML in its `ejb-jar.xml` and `weblogic-ejb-jar.xml` (or the WebSphere equivalent, or JBoss-specific files).
- **Tooling was fragile**. Each application server had its own deployer, its own class loader hierarchy, its own quirks. Moving an EJB JAR from WebLogic to WebSphere was a multi-week porting exercise.

EJB 3.0, released in May 2006 as part of Java EE 5, would fix most of these problems by embracing annotations, POJOs (Plain Old Java Objects), and JPA (Java Persistence API, borrowing heavily from Hibernate). But EJB 3.0 came a full seven years after 1.0, and by 2006 the damage was done — a generation of developers associated "EJB" with "the worst technology I ever used."

### 4.3 The Application Server Cambrian Explosion

J2EE needed a runtime container, and every major enterprise vendor built one:

- **BEA WebLogic** — BEA Systems, founded 1995, built WebLogic into the leading commercial Java application server. BEA was acquired by Oracle in 2008 for $8.5 billion.
- **IBM WebSphere** — IBM's application server, launched in 1998, became the enterprise Java standard at Fortune 500s. WebSphere was (and is) one of IBM's most profitable software lines.
- **Sun iPlanet / GlassFish** — Sun's own application server, first bundled with Sun ONE, later open-sourced as GlassFish (2005).
- **Oracle Application Server** — Oracle's J2EE offering, eventually merged with WebLogic after the BEA acquisition.
- **JBoss** — an open-source J2EE application server started in 1999 by Marc Fleury. JBoss was a disruptive force: it proved that open-source could compete at the high end of enterprise Java. Red Hat acquired JBoss in 2006 for $350 million.
- **Borland Enterprise Server**, **Pramati**, **Orion**, and others.

By 2002, the app server market was a multi-billion-dollar annual business. WebSphere alone was doing over $1 billion in annual revenue. Consulting services around J2EE deployments were enormous. A typical Fortune 500 Java project would involve weeks of server tuning, EJB deployment descriptor wrangling, and performance troubleshooting. The "Application Server Team" was a recognized job title.

### 4.4 The Heavyweight vs Lightweight Debate: Rod Johnson and Spring

In 2002, an Australian consultant named **Rod Johnson**, working in London, was assigned to a project that was drowning in EJB complexity. Johnson, a former physicist with a PhD in musicology, was methodical. He wrote a 700-page book during the project, published in October 2002 as *Expert One-on-One J2EE Design and Development* (Wrox Press). The book argued, with exhaustive evidence, that most J2EE applications should not use EJB at all — that plain Java objects managed by a simple dependency-injection container could achieve the same goals with a fraction of the complexity.

Johnson distributed the code samples from the book as a downloadable framework. Early in 2003 he and Juergen Hoeller cleaned up the framework, added features, and released it as an open-source project: **the Spring Framework**. Spring 1.0 was released in March 2004.

Spring was, in the most literal sense, a counter-revolution against EJB. It offered:

- **Dependency injection** via XML configuration (and later annotations).
- **Aspect-oriented programming** for declarative transactions, security, and logging.
- **A POJO programming model** — no forced interface inheritance, no lifecycle callbacks.
- **Data access helpers** (JdbcTemplate, HibernateTemplate) that made JDBC and Hibernate dramatically more pleasant.
- **MVC web framework** (Spring MVC) as an alternative to Struts.

Spring spread like wildfire. By 2006, it was the dominant way new enterprise Java applications were built. Johnson founded **Interface21** (later renamed SpringSource) as a commercial vehicle. SpringSource was acquired by VMware in August 2009 for $420 million, and Spring became the Java platform's de facto standard, eclipsing EJB entirely.

The Spring vs EJB debate is directly relevant to the SOA story because it crystallized a cultural split that would be repeated — with different names — throughout the SOA era. On one side: big vendors, big standards bodies, big specifications, big deployment artifacts, big consulting fees. On the other side: lightweight frameworks, developer productivity, convention over configuration, and a rejection of enterprise bureaucracy. The REST vs SOAP debate, the microservices vs ESB debate, the "YAGNI" culture of the mid-2010s — all of them carry the same emotional DNA as Spring vs EJB.

---

## Part V: XML-RPC, SOAP, and the Birth of Web Services (1998–2002)

### 5.1 Dave Winer, UserLand, and XML-RPC

The story of Web Services begins in the spring of 1998 in a small house in Woodside, California, where **Dave Winer** — software developer, blogger, creator of Frontier, future co-creator of RSS — was running a company called **UserLand Software**. Winer had a problem: he wanted his content management system, Manila, to be able to call scripts on other servers and have those scripts return structured data. There was no good general-purpose mechanism for doing this. HTTP GET/POST existed, but it returned HTML. CORBA existed but was huge. DCOM existed but was Windows-only.

In early 1998, Winer began corresponding with engineers at Microsoft — specifically **Bob Atkinson** and **Mohsen Al-Ghosein**, both on the SOAP precursor team — about designing a simple, text-based, HTTP-transported RPC mechanism. By April 1998 they had a working specification that used XML for the message format and HTTP POST as the transport. Winer insisted on keeping the spec minimal. The result was **XML-RPC**, published publicly on June 15, 1998, at xmlrpc.com.

XML-RPC was stunningly simple. A call looked like:

```xml
<?xml version="1.0"?>
<methodCall>
  <methodName>examples.getStateName</methodName>
  <params>
    <param><value><i4>41</i4></value></param>
  </params>
</methodCall>
```

A response was equally simple. The whole specification fit on a single web page. It defined six data types (int, double, boolean, string, datetime, base64) and two container types (array, struct). That was it. You could implement an XML-RPC client in any scripting language in an afternoon. By 1999, XML-RPC libraries existed for Perl, Python, PHP, Ruby, Java, C, C++, .NET, Lisp, Scheme, and more.

Winer's philosophy was, and remained, "keep it simple." He would later tell the story that when Microsoft wanted to add more features — typed XML Schema, namespaces, WSDL-style contracts — he resisted. "We had something that worked," he wrote. "We were going to break it by making it complicated." This is a theme that would come back again and again: the simpler ancestor of every protocol family is usually the one that actually gets used.

### 5.2 SOAP: The Microsoft Extension

Microsoft, meanwhile, wanted more. In 1999, a team at Microsoft Research — led by **Don Box** (then at DevelopMentor, soon to join Microsoft), **Dave Winer**, **Mohsen Al-Ghosein**, **Bob Atkinson**, and others — began work on a more elaborate protocol. The goal was to create a document-exchange protocol that could describe arbitrary structured messages, support strong typing via XML Schema, run over HTTP and SMTP and other transports, and serve as the foundation for a broader set of enterprise web services standards.

The result was **SOAP** — originally Simple Object Access Protocol, though Winer later joked that nothing about it was simple, and by SOAP 1.2 the acronym had been officially dropped entirely.

SOAP 1.0 was drafted in 1999, and **SOAP 1.1** was published as a W3C Note on May 8, 2000, co-authored by Don Box (DevelopMentor), David Ehnebuske (IBM), Gopal Kakivaya (Microsoft), Andrew Layman (Microsoft), Noah Mendelsohn (Lotus), Henrik Frystyk Nielsen (Microsoft, formerly of the W3C), Satish Thatte (Microsoft), and Dave Winer (UserLand). The co-authoring roster tells you everything: Microsoft, IBM, Lotus (then IBM), UserLand, and DevelopMentor were the coalition.

A SOAP 1.1 message looked like this:

```xml
<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <!-- optional headers for routing, security, etc. -->
  </soap:Header>
  <soap:Body>
    <m:GetStockPrice xmlns:m="http://example.com/stock">
      <m:Symbol>IBM</m:Symbol>
    </m:GetStockPrice>
  </soap:Body>
</soap:Envelope>
```

The envelope/header/body pattern was deliberately borrowed from email (which has envelope metadata, headers, and a body). The idea was that SOAP messages could be routed through intermediaries, each of which could process headers relevant to them and pass the body through unchanged.

### 5.3 Don Box and the Young Person's Guide

In March 2000, Don Box — then still at DevelopMentor, about to join Microsoft — wrote one of the most influential essays of the early Web Services era: *A Young Person's Guide to the Simple Object Access Protocol*. The essay, published in Microsoft's MSDN Magazine (March 2000 issue), was a clear, opinionated, wry tour of SOAP 1.0. Box had the rare gift of being able to write about enterprise middleware without sounding like a committee press release, and the Young Person's Guide became the document that introduced thousands of developers to SOAP.

Box's argument was that SOAP was the logical successor to DCOM and CORBA, but done in a way that fit the Web. Instead of proprietary binary protocols over arbitrary TCP ports, SOAP ran over HTTP, which meant it traversed firewalls naturally. Instead of language-specific IDL, SOAP used XML Schema, which was in principle language-neutral. Instead of custom marshaling, SOAP serialized to XML text, which any XML parser could read.

Box joined Microsoft in May 2002 as an architect, and became one of the most influential internal advocates for SOAP and the broader Web Services stack. His later book *Essential XML* (2000) and his columns in MSDN cemented his reputation as SOAP's public face. The dedication at the front of Box's SOAP writings often acknowledged Dave Winer for the initial spark — a gracious, and correct, attribution.

### 5.4 WSDL: Describing the Contract

SOAP by itself was just a message format. To actually call a SOAP service, you needed to know what operations it supported, what parameters they took, what types those parameters were, and where (at what URL) to send the messages. In classic enterprise fashion, a specification was born to describe this.

**WSDL** — the Web Services Description Language — was submitted to the W3C in September 2000 as a joint proposal from IBM, Microsoft, and Ariba. The lead authors were **Erik Christensen** (Microsoft), **Francisco Curbera** (IBM), **Greg Meredith** (Microsoft), and **Sanjiva Weerawarana** (IBM, from Sri Lanka, who would later found WSO2). WSDL 1.0 became WSDL 1.1 as a W3C Note in March 2001, which is the version that actually shipped into production.

A WSDL document was an XML file with five main sections:

1. **types** — XML Schema types used by the messages.
2. **messages** — named groupings of typed parts.
3. **portTypes** — abstract interfaces, each containing operations, each operation having input and output messages.
4. **bindings** — concrete protocol bindings (usually SOAP-over-HTTP) for port types.
5. **services** — concrete endpoints (URLs) for bindings.

A nontrivial WSDL file was typically 500–2000 lines of dense XML. Reading one by hand was possible but unpleasant. In practice, developers used tools: `wsdl2java` (from Apache Axis), `wsimport` (from JAX-WS), `svcutil.exe` (from .NET), or equivalent to generate client-side proxy classes from a WSDL. The workflow was:

1. Server team writes Java/C# classes.
2. Toolkit generates WSDL from those classes.
3. Client team points their toolkit at the WSDL URL.
4. Client toolkit generates local proxy classes.
5. Client code calls the proxy classes; toolkit turns calls into SOAP; server toolkit turns SOAP back into method calls.

This was, conceptually, identical to the CORBA workflow with IDL. SOAP+WSDL was CORBA-over-HTTP with XML instead of CDR. The key differences were: the wire format was text rather than binary; the transport was HTTP, so firewalls were less of a problem; and the standards were controlled by W3C/OASIS rather than OMG.

### 5.5 UDDI: The Yellow Pages That Nobody Used

Alongside SOAP and WSDL came a third pillar: **UDDI** — Universal Description, Discovery, and Integration. UDDI was announced in September 2000 by IBM, Microsoft, and Ariba as a worldwide registry for Web Services. The vision was bold: every company in the world would publish its Web Services into a federated UDDI directory. A developer writing a new application could query UDDI to find, say, "shipping cost calculator services from companies with headquarters in Ohio and an A+ rating," retrieve the WSDL, and generate a client in minutes. UDDI was going to be the Yellow Pages of the global service economy.

UDDI 1.0 was released in 2000. UDDI 2.0 followed in 2002. UDDI 3.0 was ratified as an OASIS standard in February 2005. IBM and Microsoft ran the **UDDI Business Registry** — the canonical public UDDI instance — for several years.

It did not work. Not at a technical level (UDDI the protocol worked fine), but at a social level. Companies did not want to publish their service catalogs to a public directory. The trust model was wrong (how do you vet that a service published in UDDI is actually from the company it claims to be?). The business model was wrong (why would I let my competitor discover my services this easily?). And for internal use, most companies found UDDI massively over-engineered compared to the alternatives (a wiki, a shared spreadsheet, or a service registry built into the ESB).

In January 2006, IBM, Microsoft, and SAP simultaneously announced they were shutting down their public UDDI Business Registry nodes. The Yellow Pages had no listings, and nobody had ever really used them. UDDI as a public service was dead. UDDI as an internal enterprise technology lingered for a few more years before being absorbed into vendor-specific "SOA registries" and then quietly abandoned.

### 5.6 The WS-* Explosion

Once SOAP, WSDL, and UDDI were in place, the industry embarked on what would come to be called the **WS-\* explosion** — an ever-growing set of standards, all with "WS-" prefixes, each specifying some additional capability on top of base SOAP. The list is extensive, and nobody ever memorized all of it:

- **WS-Security** (OASIS, April 2004). Standard for signing and encrypting SOAP messages using XML Signature and XML Encryption. Co-authored by IBM, Microsoft, VeriSign.
- **WS-Addressing** (W3C, May 2006). Standard for addressing SOAP messages, decoupling the logical destination from the underlying transport URL.
- **WS-ReliableMessaging** (OASIS, June 2007). Reliable at-most-once delivery for SOAP messages. Co-authored by IBM, Microsoft, BEA, TIBCO.
- **WS-AtomicTransaction / WS-Coordination / WS-BusinessActivity** (OASIS, 2005). Distributed transaction coordination for Web Services.
- **WS-Policy** (W3C, September 2007). A framework for expressing policies (security, reliability, etc.) as attachable metadata.
- **WS-SecurityPolicy** (OASIS, February 2009). Policy assertions for WS-Security.
- **WS-Trust** (OASIS, March 2007). Token issuance and validation for federated security.
- **WS-Federation** (OASIS, May 2009). Cross-organization identity federation.
- **WS-SecureConversation** (OASIS, March 2007). Session keys for WS-Security.
- **WS-Notification / WS-Eventing / WS-BaseNotification / WS-BrokeredNotification** (OASIS, 2006). Publish-subscribe eventing for Web Services.
- **WS-Discovery** (OASIS, July 2009). Ad-hoc discovery of Web Services on a local network.
- **WS-ResourceFramework / WS-Resource** (OASIS, 2006). Modeling stateful resources exposed as services.
- **WS-MetadataExchange** (W3C, 2011). Exchange of WSDL and policy metadata.
- **WS-Management** (DMTF, 2006). System management over Web Services, a SOAP competitor to SNMP.
- **WS-BPEL** — Business Process Execution Language, OASIS standard, April 2007. Orchestration language for describing long-running business processes as compositions of Web Services. IBM and Microsoft co-developed it under the name BPEL4WS starting in 2002.
- **WS-CDL** — Choreography Description Language, W3C, November 2005. A peer-level alternative to BPEL focused on choreography rather than orchestration.
- **WS-I Basic Profile** — Web Services Interoperability Organization. The WS-I was founded in February 2002 by IBM, Microsoft, BEA, and others to specify *subsets* of the WS-\* standards that could be relied on for interoperability. The WS-I Basic Profile 1.0 (published April 2004) was, effectively, an admission that the full WS-\* stack was too sprawling to interoperate.

This list is incomplete. There were WS-\* specs for session management, for pub/sub variants, for resource management, for service composition, for orchestration, for choreography, for auditing, for logging. By 2007, there were over sixty WS-\* specifications in various states of draft, review, standardization, and deprecation. The set became known informally as **the WS-\* swamp**.

### 5.7 The WS-\* Swamp: A Cultural Phenomenon

The WS-\* swamp became a cultural phenomenon in its own right. Blog posts from 2005-2008 are full of lamentations. Tim Bray (co-inventor of XML) wrote a famous series of posts arguing that the WS-\* stack was fundamentally broken. Mark Baker, Sam Ruby, Stefan Tilkov, and others in the emerging "REST" camp wrote scathing critiques of the complexity. The WS-\* community fought back, with dense technical defenses of each spec and claims that REST was a "toy" that couldn't handle real enterprise requirements.

The problem, in retrospect, was not any single WS-\* spec. Many of them addressed real problems (federated security, reliable messaging, distributed transactions) with thoughtful, technically competent solutions. The problem was *aggregate complexity*. A production Web Services deployment that used WS-Security + WS-Addressing + WS-ReliableMessaging + WS-AtomicTransaction + WS-Policy required engineers to understand each of those specs, the specific interpretations of the specs by each vendor's stack, the interactions between them (WS-Security assertions inside WS-Policy statements attached to WSDL documents...), and the operational tooling to deploy, monitor, and debug all of it. The learning curve was measured in person-years.

Meanwhile, a much simpler alternative — just exchanging JSON documents over HTTP — was winning hearts and minds on the developer side of the industry. By 2010 the WS-\* stack would be in full retreat.

---

## Part VI: Roy Fielding and REST (1994–2000)

### 6.1 The W3C, Apache, and Fielding's Background

**Roy Thomas Fielding** was a graduate student at the University of California, Irvine in the mid-1990s, studying under Professor Richard N. Taylor in the Institute for Software Research. He was also, at the same time, one of the principal authors of the HTTP 1.0 and HTTP 1.1 specifications at the W3C, a founding member of the Apache HTTP Server Project (which began in 1995 when a group of webmasters coordinated patches to NCSA httpd), and a regular participant in the IETF HTTP Working Group.

Fielding was in a nearly unique position: he was simultaneously helping design the protocol that ran the Web, helping implement one of the most-used server software packages in the world, and thinking academically about what made the Web's architecture work. His 2000 PhD dissertation would synthesize all three roles into a single document.

### 6.2 The Dissertation: Architectural Styles and the Design of Network-based Software Architectures

Roy Fielding's dissertation, *Architectural Styles and the Design of Network-based Software Architectures*, was accepted by UC Irvine in 2000. It is 180 pages long, precise, and — unusual for a PhD dissertation — it became one of the most widely-read and cited documents in the history of software architecture.

The core contribution of the dissertation is a taxonomy of **architectural styles** for distributed software. Fielding cataloged dozens of styles — client-server, layered systems, code-on-demand, pipe-and-filter, replicated repositories, and more — and analyzed their properties. He then presented a *new* style, which he named **REST** (Representational State Transfer), by composing a subset of these styles in a specific way.

The constraints that define REST are:

1. **Client-server** separation.
2. **Statelessness** — each request from client to server must contain all the information needed to understand the request; the server should not store client context between requests.
3. **Cacheability** — responses must (implicitly or explicitly) label themselves as cacheable or not, so that clients or intermediaries can reuse them.
4. **Uniform interface** — the defining constraint of REST, itself decomposed into four sub-constraints:
   - Identification of resources (in the Web, URIs).
   - Manipulation of resources through representations (the same resource might be represented as HTML, JSON, XML, or image).
   - Self-descriptive messages (the message carries its own metadata).
   - **HATEOAS** — hypermedia as the engine of application state. Clients navigate the service by following hyperlinks in responses, rather than by hardcoding URI templates.
5. **Layered system** — clients cannot tell whether they are talking to the actual server or an intermediary (proxy, cache, load balancer).
6. **Code-on-demand** (optional) — servers can temporarily extend client functionality by transferring executable code (e.g., JavaScript).

The argument of the dissertation is that the Web, as it actually exists, is an implementation of REST. HTTP + URIs + HTML (or JSON) forms a REST architecture, and the Web's success — its scalability, its resilience, its ability to evolve over decades without breaking — is attributable to the REST constraints. Fielding was not inventing something new; he was giving a name and a systematic description to what Tim Berners-Lee, Roy Fielding, Henrik Frystyk Nielsen, and others had already built and standardized throughout the 1990s.

### 6.3 REST as a Critique of RPC

The dissertation contains an implicit and often-explicit critique of the Remote Procedure Call tradition going all the way back to Birrell and Nelson. RPC, in Fielding's reading, is a fundamentally *non-Web* architectural style. RPC tries to make a distributed system look like a local program by hiding the network, whereas REST embraces the network by exposing it: every interaction is a request against a resource, every resource has a URI, and every response is self-describing.

The practical implication was stark. SOAP + WSDL was, at its heart, an RPC mechanism layered on top of HTTP. It used HTTP only as a transport for tunneling SOAP-encoded method calls. It ignored HTTP verbs (almost all SOAP calls were POSTs), ignored URIs (all SOAP calls went to the same endpoint with an operation name in the body), ignored caching (SOAP responses were uniformly marked uncacheable), and ignored content negotiation (SOAP was, definitionally, XML). In Fielding's terms, SOAP was *not* a Web architecture — it was an RPC architecture that happened to run over HTTP.

When Fielding was asked, years later, whether the architectures being built on SOAP and WSDL were "RESTful," his response (paraphrasing multiple blog posts and interviews): no, they were RPC systems mislabeled as Web architectures. He became famous — and, among WS-\* advocates, notorious — for publishing strict definitions of what was and was not REST, and for calling out misuse of the term.

### 6.4 The Richardson Maturity Model

REST had a messianic quality for its early advocates but a fuzzy quality for most of the industry. People called almost anything that returned JSON over HTTP a "RESTful API," regardless of whether it used proper HTTP verbs, resource-based URIs, or hypermedia navigation. In 2008, the software architect **Leonard Richardson** gave a talk at QCon San Francisco in which he proposed a four-level maturity model to make the distinctions explicit:

- **Level 0: The Swamp of POX** — POX stands for "Plain Old XML." At this level, the service uses HTTP as a tunnel for a single endpoint that accepts XML messages. SOAP lives here. XML-RPC lives here.
- **Level 1: Resources** — the service identifies distinct resources with distinct URIs, but still uses only one HTTP verb (usually POST).
- **Level 2: HTTP Verbs** — the service uses HTTP verbs (GET, POST, PUT, DELETE) in their standard semantics, and returns meaningful HTTP status codes.
- **Level 3: Hypermedia Controls (HATEOAS)** — responses include links to related resources, so the client can navigate the service by following links rather than by constructing URIs out of templates.

Martin Fowler popularized the model in a March 2010 blog post, "Richardson Maturity Model: steps toward the glory of REST," and the model became a common vocabulary for discussing REST rigor. Crucially, Fowler noted that Fielding himself had stated that only Level 3 is actually "REST" — Levels 0, 1, and 2 are HTTP-based web APIs, but they are not REST architectures. In practice, the vast majority of "RESTful APIs" in production are Level 2, and Fielding-purists continue to point this out, to the continued annoyance of everyone else.

### 6.5 Why "RESTful" Won Anyway

For all the pedantry about what REST really was, the name won. By 2008-2010, "RESTful API" was the default thing you built when someone asked for a web API. The reasons had little to do with Fielding's academic argument and everything to do with practical developer experience:

- **JSON over XML**. Around 2006, a grassroots movement among web developers (mostly in the Rails and Django communities) shifted from XML to JSON. JSON was simpler, more compact, and native to JavaScript. Ajax applications consuming JSON APIs became the default front-end pattern.
- **The iPhone effect**. The iPhone launched June 2007, the App Store launched July 2008, and suddenly every company needed a mobile backend. Native mobile apps wanted compact, efficient APIs. REST+JSON was perfect; SOAP+XML was a disaster.
- **Tooling disappeared**. You did not need a WSDL compiler to consume a REST API. You just made an HTTP request, parsed the JSON, and used the data. "curl | jq" replaced an entire category of code generation.
- **Documentation by example**. Instead of a 2000-line WSDL, REST APIs were documented by a human-written page showing example requests and responses. This turned out to be much more useful for actual developers.
- **The Rails movement**. Ruby on Rails 1.0 (December 2005) had conventional routing and RESTful resource defaults. Rails 2.0 (December 2007) made REST-by-convention the standard way to build Rails applications. A generation of web developers learned REST through Rails scaffolding.
- **Twitter and the public API era**. Twitter's API, launched in 2006, was a pragmatic REST+JSON implementation. Its success — fueling a whole ecosystem of Twitter clients — proved that public APIs could be simple and popular.

By 2012, SOAP was the legacy protocol, REST+JSON was the default, and the only people writing new SOAP code were dealing with enterprise legacy integrations (SAP, Salesforce's older APIs, government systems). This happened despite the fact that the REST "victory" was mostly Level 2 on the Richardson scale and would have made Fielding roll his eyes. The lesson is that in infrastructure technology, approximately-right-but-simple almost always beats exactly-right-but-complicated.

---

## Part VII: The SOA Hype Era (2003–2008)

### 7.1 Gartner Coins the Term

The phrase "Service-Oriented Architecture" did not suddenly appear in 2003 — it had been used sporadically in the industry for several years before that. The OMG had used "service-oriented" language in CORBA documents in the late 1990s. A Gartner analyst named **Yefim V. Natis** had been writing about service-oriented concepts as early as 1996, and a Gartner research note from April 1996 by Roy W. Schulte and Natis is sometimes cited as the first formal use of "service-oriented architecture" as a labeled concept.

But the term did not become a buzzword until 2003. Gartner and other analyst firms began publishing SOA-branded research notes that year, often tied to the emerging Web Services stack. By the end of 2003, "SOA" was appearing in enterprise architecture slide decks everywhere. By 2005, Gartner was predicting that "by 2008, SOA will be the architectural choice for more than 80% of new mission-critical applications." (This prediction was, in a certain technical sense, correct — but not in the way Gartner meant.)

What Gartner's analysts originally meant by SOA was something like this: enterprise systems should be decomposed into coarse-grained, reusable services, each service owned by a business function, each service exposing a well-defined interface, with integration happening through message exchange rather than database-level coupling. The services should be loosely coupled, discoverable, reusable, and composable into business processes. The architectural style was neutral with respect to technology — you could implement SOA with CORBA, with Web Services, or even with a message bus. What mattered was the *principles*.

What enterprise IT heard was: "buy Web Services tools from your vendor and deploy an Enterprise Service Bus, and you will achieve SOA." Vendors, of course, were happy to encourage this reading, and the mis-translation between architectural principle and vendor product would define the next five years.

### 7.2 ZapThink and the SOA Analyst Ecology

In the mid-2000s, the analyst firm that became most closely associated with SOA was not Gartner or Forrester — it was a small specialist firm called **ZapThink**. ZapThink was founded in 2000 in Waltham, Massachusetts, by **Ronald Schmelzer** and **Jason Bloomberg**. Schmelzer had a computer science background from Princeton; Bloomberg had a physics/math background and had worked at various consulting firms. They pitched ZapThink as the boutique analyst firm for XML and Web Services, and when SOA became the buzzword of the decade, they were perfectly positioned.

ZapThink published research notes, ran training courses (the "Licensed ZapThink Architect" certification), gave conference keynotes, and advised enterprise architects. Their tone was enthusiastic but also, to their credit, often cautious — they were among the early voices pointing out that "SOA product" was a contradiction in terms (SOA being an architecture, not a thing you buy). They also, inevitably, benefited financially from the hype they were trying to temper.

The ZapThink "Seven Levels of SOA" model, the ZapThink "SOA Roadmap," and the Licensed ZapThink Architect certification became staples of the early-SOA conference circuit. ZapThink was acquired by Dovel Technologies in 2011, a sign that the SOA-analyst boom was over. Schmelzer and Bloomberg both went on to write for Forbes and similar publications, with Bloomberg becoming a prominent voice in the later "cloud native" and "digital transformation" conversations.

### 7.3 Thomas Erl and the SOA Textbook Era

If ZapThink was the analyst face of SOA, **Thomas Erl** was its textbook author. Erl, based in Vancouver, British Columbia, ran a consulting firm called SOA Systems and authored a series of books under the Prentice Hall Service-Oriented Computing series, beginning with *Service-Oriented Architecture: A Field Guide to Integrating XML and Web Services* (2004). His breakthrough book was *Service-Oriented Architecture: Concepts, Technology, and Design* (Prentice Hall, August 2005), which became the de facto textbook for enterprise architects learning SOA.

Erl's books were encyclopedic, diligent, and deeply committed to the vendor-neutral, principle-first reading of SOA. They laid out **eight SOA design principles**:

1. Standardized Service Contract
2. Service Loose Coupling
3. Service Abstraction
4. Service Reusability
5. Service Autonomy
6. Service Statelessness
7. Service Discoverability
8. Service Composability

These principles were not technology-specific. They could be applied to Web Services, to CORBA, to REST APIs, to message-based integration, or to any other substrate. In retrospect, Erl's principles describe microservices accurately — loose coupling, autonomy, reusability, composability — and reading his 2005 book in 2020 feels strangely prescient.

Erl went on to publish books on SOA Governance, SOA Design Patterns, Cloud Computing, Big Data, and Blockchain. The series is still in print. Erl's "Prentice Hall Service-Oriented Computing Series" eventually included over a dozen volumes, and for a period in the mid-to-late 2000s it was standard reading for enterprise architects.

### 7.4 The SOA Manifesto (2009)

By 2009, the SOA backlash was in full swing, and a group of practitioners convened in **Rotterdam, Netherlands** in October 2009 to write what they called the **SOA Manifesto**. Deliberately echoing the Agile Manifesto (2001), the SOA Manifesto was intended to reclaim SOA from the vendors and the consultancies by restating its core values.

The signatories included Thomas Erl, Nicolai Josuttis, Paul C. Brown, Mark Little, Grady Booch (yes, that Grady Booch), Jim Webber, Herbjörn Wilhelmsen, John deVadoss, and about two dozen others. The manifesto, published at **www.soa-manifesto.org**, reads:

> Service orientation is a paradigm that frames what you do. Service-oriented architecture (SOA) is a type of architecture that results from applying service orientation.
>
> We have been applying service orientation to help organizations consistently deliver sustainable business value, with increased agility and cost effectiveness, in line with changing business needs.
>
> Through our work we have come to prioritize:
>
> - **Business value** over technical strategy
> - **Strategic goals** over project-specific benefits
> - **Intrinsic interoperability** over custom integration
> - **Shared services** over specific-purpose implementations
> - **Flexibility** over optimization
> - **Evolutionary refinement** over pursuit of initial perfection
>
> That is, while we value the items on the right, we value the items on the left more.

There are also fourteen "guiding principles" below the manifesto proper, covering topics like respect for organizational culture, incremental implementation, loose coupling, and technology neutrality.

The SOA Manifesto is, in retrospect, one of the most poignant documents of the SOA era. It was written by people who genuinely believed in the architectural principles and who were watching in real time as those principles got eaten alive by vendor marketing and enterprise governance bureaucracy. The manifesto is a plea: "please, stop buying ESB products and start thinking about the architecture." It was largely ignored. By the time it was published in October 2009, the "SOA is Dead" post had already been live for nine months and the industry was looking for the next buzzword.

### 7.5 The Enterprise Service Bus Era

The **Enterprise Service Bus** (ESB) is the product category that, more than any other, defined the SOA era and also killed it. The term "ESB" was coined (or at least popularized) by Gartner analyst Roy Schulte in a 2002 research note. The concept: a middleware backbone that handled message routing, protocol translation, data transformation, orchestration, and security for all the Web Services in an enterprise. Instead of each service talking directly to every other service (creating an N-squared problem), all services would talk through the ESB, which would mediate everything.

The ESB vendor landscape of the mid-2000s was large and well-funded:

- **Sonic Software** (later acquired by Progress Software in 2006). Sonic's SonicMQ and SonicESB were early leaders. Sonic claimed to have shipped the first commercial ESB in 2002.
- **TIBCO** Software (founded 1985 as Teknekron, IPO 1999). TIBCO's messaging products (Rendezvous, EMS) had been enterprise staples since the 1990s. TIBCO BusinessWorks was their ESB-era flagship. TIBCO was acquired by Vista Equity in 2014 for $4.3 billion.
- **webMethods** (founded 1996). webMethods Integration Server and the webMethods ESB were widely deployed. webMethods was acquired by Software AG in 2007 for $546 million.
- **IBM WebSphere Message Broker / IBM Integration Bus** — IBM's enterprise messaging platform, descended from the MQSeries product line. WebSphere Message Broker was the ESB implementation. MQ remains, as of 2026, a product IBM is still selling.
- **Microsoft BizTalk Server** — Microsoft's message broker and orchestration product, released in 2000. BizTalk used XLANG (a Microsoft-developed orchestration language) and later moved to BPEL support. BizTalk was big in Microsoft-shop integration projects.
- **Oracle Service Bus** (originally AquaLogic Service Bus from BEA, acquired by Oracle in 2008). Became part of the Oracle Fusion Middleware stack.
- **SAP NetWeaver Process Integration** (PI) — SAP's integration broker for NetWeaver, used extensively in SAP-centric integrations.
- **Mule** (MuleSoft) — an open-source ESB founded in 2006 by Ross Mason in the UK. MuleSoft became a San Francisco company, went public in 2017, and was acquired by Salesforce in 2018 for $6.5 billion. One of the great exits of the SOA era.
- **WSO2** — founded in 2005 by Sanjiva Weerawarana (co-author of WSDL) and others in Sri Lanka. WSO2 produced an open-source stack including WSO2 ESB. Still active in 2026.
- **Apache ServiceMix** — open-source ESB from the Apache Software Foundation, first release 2005.
- **JBoss ESB** — Red Hat/JBoss's open-source ESB, part of the JBoss SOA Platform.
- **FuseSource** (open-source ServiceMix and ActiveMQ consulting, acquired by Red Hat 2012).

Every ESB vendor told the same story: buy our product, model all your integration flows graphically in our designer, deploy to our runtime, and you will have achieved SOA. Our registry will catalog your services, our transformation engine will map between schemas, our orchestration engine will execute BPEL processes, and our governance dashboard will let IT leadership see exactly which teams are using which services and how often.

The reality, in most deployments, was messier. ESB projects tended to take 18-36 months. They tended to cost in the millions or tens of millions of dollars. The "governance" promised by the vendor usually turned into a political bottleneck where the ESB team became a choke point for every cross-team integration. Schema changes required coordination meetings. New services required approval. The promised reuse often did not materialize because the ESB team was optimizing for consistency at the cost of developer velocity.

This was the genesis of what would later become a major cultural force in microservices: the rejection of the central integration layer in favor of **smart endpoints and dumb pipes**. That phrase, coined in the Fowler/Lewis microservices article of 2014, was a direct repudiation of the ESB architecture.

### 7.6 BPEL and the Orchestration Dream

**Business Process Execution Language** — BPEL, originally BPEL4WS — was an XML language for describing long-running business processes as orchestrations over Web Services. IBM and Microsoft published BPEL4WS 1.0 in August 2002 (with co-authors BEA, SAP, and Siebel joining in the 1.1 version). OASIS took over standardization, and **WS-BPEL 2.0** was ratified in April 2007.

The idea was seductive. You modeled a business process — say, "purchase order fulfillment" — as a BPEL document. The BPEL document described the sequence of Web Service calls, the data flow, the error handling, the compensation logic for failures, and the interactions with human approvers. A BPEL engine would execute this document, making the appropriate SOAP calls, handling state persistence, resuming from crashes, and providing a dashboard for operators. Business analysts, in the ideal version of the story, would draw process diagrams in a graphical tool that generated BPEL under the hood, and IT would just deploy them.

BPEL engines were built by every ESB vendor: IBM WebSphere Process Server, Oracle BPEL Process Manager, Microsoft BizTalk, SAP NetWeaver, Apache ODE (open source), ActiveBPEL, Sun's Java CAPS, and others. For a moment around 2007-2008, BPEL was the most hyped language in enterprise computing.

BPEL's problems were classic XML-era problems. BPEL documents were verbose and nearly unreadable. The graphical tools generated XML that was often impossible to merge in source control. Debugging a long-running BPEL process was arduous. The abstraction level was wrong: BPEL promised to let business analysts write processes, but in practice it required the skills of an enterprise Java developer. The promised graphical tools were fragile; the generated code was hard to maintain.

By 2015, BPEL was effectively dead as a new-deployment technology. Its niche had been taken over by workflow engines (Zeebe, Camunda, Temporal, Airflow, Argo) that used code or YAML rather than XML, and that focused on specific problem domains (BPMN-style business processes, data pipelines, saga orchestration) rather than trying to be universal. Camunda BPM, an open-source BPMN engine founded in 2008 by **Jakob Freund** and **Bernd Rücker**, emerged as the spiritual successor for enterprises that still wanted visual business process modeling, but Camunda supported BPMN 2.0 directly rather than BPEL.

### 7.7 The Governance Industrial Complex

The word that best captures the SOA era is **governance**. Somewhere around 2005, the SOA conversation shifted from "how do we build services" to "how do we govern services." Governance meant: policies, registries, repositories, design-time review boards, service-level agreements, change management processes, versioning strategies, and dashboards showing compliance metrics.

An entire product category emerged to sell governance tooling:

- **Systinet** (acquired by Mercury Interactive in 2006, then by HP in 2007). Systinet Registry was a market leader in UDDI-based service registries.
- **SOA Software** (later renamed Akana, acquired by Rogue Wave in 2016, then by Perforce in 2019). SOA Software's Policy Manager was used for policy enforcement at runtime.
- **AmberPoint** (acquired by Oracle in 2010). AmberPoint specialized in runtime SOA monitoring and management.
- **Progress Actional** (also in runtime SOA management).
- **Software AG CentraSite** (an OSGi-based service registry).
- **IBM WebSphere Service Registry and Repository** (WSRR).
- **Oracle Enterprise Repository** (OER).
- **HP Systinet** (after the Mercury/HP acquisition).

The promise of these tools was: automate SOA governance so that services follow the standards, policies are enforced consistently, and management can see what is happening. The reality, in most deployments, was another layer of bureaucracy. Governance boards met weekly. New services required design reviews. Schema changes required backward-compatibility checks. Every integration was documented in the registry, which got stale within weeks of the first deployment.

The cultural effect of the governance industrial complex was that SOA became associated, for many developers, with red tape. The very word "governance" became a trigger for developer resistance. When microservices arrived in 2014 with a "you build it, you run it" ethos and no central governance function, part of the appeal was the explicit rejection of the SOA governance era.

### 7.8 Enterprise Architecture Frameworks

SOA also intersected with, and was partially subsumed by, the **Enterprise Architecture** (EA) movement. Several major EA frameworks emerged or were extended during the SOA years:

- **TOGAF** — The Open Group Architecture Framework. Version 8 (2003) was the first TOGAF to talk explicitly about SOA; version 9 (2009) integrated SOA concepts more deeply. TOGAF became the most widely adopted EA framework in the world, with hundreds of thousands of certified practitioners by the mid-2010s.
- **Zachman Framework** — John Zachman's classic EA framework from the late 1980s, still taught as a foundational reference.
- **DoDAF** — the US Department of Defense Architecture Framework, which incorporated SOA heavily in its 2.0 version (2009).
- **FEAF** — the US Federal Enterprise Architecture Framework, which mandated SOA principles for federal IT projects in the mid-2000s.
- **SOA RA** — The Open Group's Service-Oriented Architecture Reference Architecture, published in 2009.

These frameworks gave EA teams a vocabulary for talking about SOA at the planning level. They also, inevitably, added more process overhead. A Fortune 500 SOA initiative in 2007 might involve a TOGAF-trained enterprise architect drawing up a target state architecture, a SOA governance committee approving service boundaries, a UDDI registry cataloging services, an ESB vendor providing the runtime, BPEL processes orchestrating business workflows, and several layers of management dashboards tracking progress. The ratio of architecture-talk to actual running code was not favorable.

---

## Part VIII: Why Enterprise SOA Failed (2008–2011)

### 8.1 Anne Thomas Manes: "SOA is Dead; Long Live Services"

On **January 5, 2009**, **Anne Thomas Manes**, then a vice president and research director at the Burton Group (a boutique IT research firm later acquired by Gartner), published a blog post titled *SOA is Dead; Long Live Services*. The post became, almost instantly, the most-cited single statement in the history of the SOA movement. Its first paragraph is worth quoting in full:

> SOA met its demise on January 1, 2009, when it was wiped out by the catastrophic impact of the economic recession. SOA is survived by its offspring: mashups, BPM, SaaS, Cloud Computing, and all other architectural approaches that depend on "services".

Manes's argument was carefully made and, for the field, cathartic. She did not claim that service-oriented architecture as an *architectural idea* was wrong. On the contrary: she explicitly said that service orientation was and would remain important. What had died was SOA as a *buzzword*, as a *marketing category*, as a thing you bought from vendors. The recession of 2008-2009 had forced CIOs to examine their budgets, and SOA projects — expensive, long-running, often failing to deliver promised reuse — were early casualties. Corporate boards asked: "We spent $40 million on SOA last year. Can you point me to the reuse we achieved?" The answer, in most cases, was embarrassing.

Manes continued:

> SOA is dead. But services are alive. Services will continue to be an important building block of enterprise architecture. The name "SOA" is dead, but the *concept* of services remains.

She predicted that the successor phrase would not be "SOA 2.0" (which some vendors were already floating) but rather a cluster of more specific, less hype-laden terms: services, mashups, RESTful APIs, cloud services, SaaS, BPM. She was correct.

The reaction to Manes's post was enormous. SOA consultants attacked her. SOA vendors ignored her. Developers retweeted her. A cottage industry of rebuttal blog posts appeared within days. The comment thread on her original post ran into the hundreds. ZapThink's Schmelzer and Bloomberg wrote a rebuttal titled "SOA Is Not Dead." Thomas Erl wrote an essay titled "The SOA Manifesto Is Not Dead." Various vendors put out press releases with titles like "SOA Remains Strategic."

But Manes had said the thing that everyone had been thinking. Once the ice broke, the flood came. Within months, the analyst firms that had been selling SOA research pivoted to selling **cloud computing** research. Enterprise architects who had been putting "SOA" in their slide decks started putting "Cloud" instead. The SOA Manifesto, published nine months later in October 2009, felt already out of date at the moment of its release. By 2011, the phrase "SOA" was quietly retired from most vendor marketing materials, replaced with "API Management," "Cloud Integration," or "Digital Transformation."

### 8.2 The Failure Modes: What Actually Went Wrong

Post-mortem analyses of failed SOA projects — and there were many — identified a consistent set of failure modes. These are worth cataloging because the same failure modes would come back, relabeled, in later waves.

**1. Complexity overwhelm.** The WS-\* stack was simply too large for most teams to fully understand. A typical SOAP-based integration project used perhaps 15% of the available WS-\* capabilities, but the 85% that wasn't used still had to be *avoided*, which required understanding it well enough to avoid it. The cognitive overhead was enormous.

**2. Vendor lock-in via the ESB.** Once you built your integration layer on a specific ESB, you were married to that vendor. Moving off of TIBCO BusinessWorks, IBM Message Broker, or webMethods was a multi-year rewrite. Vendors used this lock-in to charge annual maintenance fees that often exceeded the original license cost within five years.

**3. The reuse gap.** The central SOA promise was that services, once built, would be reused across projects. In reality, most services were used by exactly one other system — the one they were originally built for. Cross-project reuse required service designs that anticipated multiple consumers, which required upfront negotiation with future consumers who had not yet been identified, which was impossible. Real reuse, when it happened, happened accidentally, not through the governance machinery designed to produce it.

**4. WS-\* specs that nobody implemented completely.** Each vendor's Web Services stack supported a subset of the WS-\* specifications. The subsets overlapped partially but not completely. Interoperability issues at the WS-Security, WS-Addressing, or WS-ReliableMessaging layer were chronic. The WS-I Basic Profile was an attempt to fix this by specifying a minimum interoperable subset, but in practice, even WS-I-compliant implementations had interop bugs.

**5. Integration projects that took years.** A typical enterprise SOA integration project — for example, "integrate the customer database, the order system, and the billing system into a unified view" — might be planned as an 18-month engagement and actually take 36 months. By the time it was done, the business requirements had drifted, some of the systems had been replaced, and the resulting integration was already partially obsolete.

**6. The political dimension.** IT governance boards and SOA competency centers often used SOA governance as a power tool. Teams that wanted to expose a service had to get it approved by a central committee that enforced standards, reviewed designs, and gatekept the service registry. This produced a "permission to ship" culture where the central team became a bottleneck for every new integration. Developer velocity plummeted.

**7. Tool/vendor lifecycle mismatches.** The tools and vendors changed faster than the SOA projects. A project started in 2004 on Systinet Registry, Progress Sonic ESB, and ActiveBPEL might by 2008 find that Systinet had been acquired by HP and deprecated, Sonic had been acquired by Progress and merged with another product, and ActiveBPEL's commercial support had ended. The tool churn added friction to already-struggling projects.

**8. Canonical data models that nobody agreed on.** A recurring pattern in SOA projects was the attempt to define an enterprise-wide canonical data model: a shared schema for "Customer," "Order," "Product," etc., that all services would use. This was supposed to eliminate transformation overhead. It never worked. Every business unit had slightly different semantics for "Customer" (is a prospect a customer? a former customer? a business account? an individual?), and the canonical model always became either a lowest-common-denominator that was useless or a bloated super-model that was impossible to use.

### 8.3 The Cultural Backlash

By 2010, "SOA" had become, among developers, almost a slur. You could see this in conference talks, in blog posts, in the gleeful schadenfreude with which developers described SOA failures at their previous jobs. The Agile community, which had been gathering momentum since the 2001 Agile Manifesto, treated SOA as a foil — SOA was the "waterfall of architectures," the thing that Bad Enterprise IT did, the thing that Agile teams rejected.

This backlash was partly unfair. Many of the SOA *principles* were sound, and many of the failures were failures of implementation rather than of the architectural idea. But culture does not do nuance. By the time the next wave of service-oriented thinking arrived in 2014 under the name "microservices," its advocates were at pains to distance themselves from SOA. Sam Newman's 2015 book *Building Microservices* has an explicit section titled "SOA vs Microservices" that tries to clarify the relationship, because everyone reading the book was primed to dismiss anything that smelled like SOA.

---

## Part IX: The Microservices Turn (2011–Present)

### 9.1 The Pre-Microservices Era

Before microservices had a name, there were several years of practice at companies that would later be credited as pioneers. The companies shared certain traits: they were web-native (not enterprise software companies), they operated at scale (tens of millions of users), they deployed continuously (not in quarterly releases), and they had teams organized around ownership of production services rather than around project delivery.

**Monoliths** had been the default application architecture since time immemorial. A monolith was a single deployable artifact (a WAR file, a Rails application, a PHP codebase) that contained all the functionality of the application. The classic Java EE application was a monolith: one EAR file with dozens of EJBs inside. The classic Rails application was a monolith: one Rails codebase handling everything from auth to billing to reporting. Monoliths were fine for small applications and small teams, but they had well-known problems at scale:

- **Deployment coupling.** Any change, anywhere, required redeploying the entire application. A one-line fix in the reporting module triggered a full deployment with the same test cycle as a major feature.
- **Scaling coupling.** If one module was CPU-hungry, you had to scale the entire application to give it more CPU. You couldn't scale just the expensive part.
- **Tech stack coupling.** The entire application had to use the same language, framework version, and library versions. Migrating to a new framework was a monolithic rewrite.
- **Team coupling.** Multiple teams working on the same codebase stepped on each other's toes. Merge conflicts and integration bugs proliferated.

**Two-tier**, **three-tier**, and **n-tier** architectures were the formal names for the various decompositions of monoliths: two-tier (client + database), three-tier (client + application server + database), n-tier (add caching, messaging, web tiers, etc.). These decompositions helped but did not solve the fundamental coupling problems of monoliths.

### 9.2 Amazon and the Bezos API Mandate (2002)

Somewhere around 2002 — the exact date is disputed, but it was in the year Amazon launched the precursor to what would become AWS — Jeff Bezos sent an internal email to every software engineering team at Amazon. The email is famous. It has been quoted, paraphrased, and leaked in many variations, but the canonical leaked version comes from **Steve Yegge**'s *Google Platforms Rant*, a public Google+ post from October 12, 2011 (briefly accidentally made public before Yegge, who was then at Google after years at Amazon, realized his privacy settings and tried to walk it back — by which point the internet had archived it permanently). Here is the relevant excerpt from Yegge's leak:

> 1. All teams will henceforth expose their data and functionality through service interfaces.
>
> 2. Teams must communicate with each other through these interfaces.
>
> 3. There will be no other form of interprocess communication allowed: no direct linking, no direct reads of another team's data store, no shared-memory model, no back-doors whatsoever. The only communication allowed is via service interface calls over the network.
>
> 4. It doesn't matter what technology they use. HTTP, Corba, Pubsub, custom protocols — doesn't matter. Bezos doesn't care.
>
> 5. All service interfaces, without exception, must be designed from the ground up to be externalizable. That is to say, the team must plan and design to be able to expose the interface to developers in the outside world. No exceptions.
>
> 6. Anyone who doesn't do this will be fired.
>
> 7. Thank you; have a nice day!

The "anyone who doesn't do this will be fired" line is the one everyone remembers. Yegge's 2011 post added the crucial context: Bezos meant it. And Amazon's internal culture did, in fact, reorganize around this mandate over the following years. Teams that resisted lost political battles. Teams that embraced service-oriented architecture became the backbone of the new Amazon. By 2006, when Amazon Web Services launched its first public products (S3 in March 2006 and EC2 in August 2006), the company had spent four years running its internal infrastructure as a service-oriented ecosystem. AWS was the externalization of the internal Amazon.

Yegge's leak also had a secondary effect: it became a kind of origin story for the microservices movement. When people asked "where did this architectural style come from?", the answer often started with "well, at Amazon in 2002, Bezos sent this memo..." The Bezos memo became a founding myth, equal parts architectural wisdom and autocratic management legend.

What's worth noting historically: the Bezos memo does not use the phrase "microservices." It does not even use the phrase "service-oriented architecture." It describes something closer to what we would now call microservices — small, independently owned, network-communicating services with no shared data stores — but it was formulated in 2002, a year before "SOA" became a buzzword. Amazon's approach was invented in parallel with, not downstream of, the SOA movement. And Amazon's approach was radically simpler: no ESB, no BPEL, no WS-\*, no governance board. Just services, over the network, owned by teams, with no exceptions.

### 9.3 Netflix and the Cloud Migration

**Netflix** is the other major origin story of microservices. Netflix's DVD-rental business, which it had been running since 1998, experienced a legendary outage in August 2008 when a corrupted database disabled shipping for three days. The outage convinced Netflix leadership that they could not continue running their own datacenters — the failure modes of monolithic, database-centric systems were unacceptable for a company whose brand depended on availability. Over the next seven years, from 2009 to 2016, Netflix undertook one of the most publicly documented cloud migrations in the industry's history, moving from a monolithic Oracle-backed Java application running in Netflix-owned datacenters to a distributed microservices architecture running on Amazon Web Services.

The driving force behind this migration was **Adrian Cockcroft**, who joined Netflix in 2007 from eBay and served as cloud architect until 2014. Cockcroft became one of the most influential evangelists of cloud-native microservices. Under his leadership, Netflix built and open-sourced a remarkable suite of tools that would become foundational to the microservices movement:

- **Hystrix** — a circuit breaker library for tolerating downstream failures without cascading. Released 2012.
- **Eureka** — a service discovery registry. Released 2012.
- **Zuul** — an edge service / API gateway. Released 2013.
- **Ribbon** — a client-side load balancer. Released 2013.
- **Archaius** — dynamic configuration management.
- **Asgard** — a deployment and cloud management console.
- **Chaos Monkey** — a tool that randomly killed production servers to force engineers to build for resilience. This, in particular, became a cultural touchstone for the "chaos engineering" movement.

All of these were released as open source under the "Netflix OSS" banner, starting around 2012. They influenced, among other things, Spring Cloud, which wrapped most of the Netflix OSS libraries in Spring-idiomatic APIs and became the de facto microservices framework for Java shops. Spring Cloud Netflix was released by Pivotal in 2014 and grew rapidly.

Netflix's migration and the tools they open-sourced provided the industry with a concrete, successful template for what "microservices" could look like at scale. Adrian Cockcroft left Netflix in 2014 to join Battery Ventures, and later moved to AWS (2016-2022) as VP of Cloud Architecture Strategy. His conference talks during the 2013-2018 period — with titles like "Microservices — What, Why, and How" and "Dystopia as a Service" — are some of the most-watched architecture talks of the decade.

### 9.4 The Fowler-Lewis Article: "Microservices" (March 2014)

The term "microservices" had been used occasionally before 2014. Some accounts trace it to a May 2011 workshop near Venice where a group of software architects discussed the architectural style that was emerging at Netflix, Amazon, and similar companies. Others trace it to a 2012 talk by **James Lewis** at 33rd Degree in Kraków, titled "Microservices — Java, the Unix Way." But the moment when the term crystallized and entered the mainstream was **March 25, 2014**, when **Martin Fowler** and **James Lewis** co-published an article titled simply *Microservices* on martinfowler.com.

The article defined microservices as follows:

> In short, the microservice architectural style is an approach to developing a single application as a suite of small services, each running in its own process and communicating with lightweight mechanisms, often an HTTP resource API. These services are built around business capabilities and independently deployable by fully automated deployment machinery. There is a bare minimum of centralized management of these services, which may be written in different programming languages and use different data storage technologies.

The article enumerated nine characteristics of microservices:

1. **Componentization via Services**
2. **Organized around Business Capabilities**
3. **Products not Projects**
4. **Smart endpoints and dumb pipes**
5. **Decentralized Governance**
6. **Decentralized Data Management**
7. **Infrastructure Automation**
8. **Design for failure**
9. **Evolutionary Design**

Every one of these characteristics was, to a reader familiar with the SOA era, a pointed response to something that had gone wrong. "Smart endpoints and dumb pipes" was a rejection of the ESB. "Decentralized Governance" was a rejection of SOA governance boards. "Decentralized Data Management" was a rejection of canonical data models. "Products not Projects" was a rejection of the waterfall project delivery culture. "Design for failure" was a rejection of the WS-ReliableMessaging fantasy of reliable distributed systems.

The Fowler-Lewis article became the canonical reference for microservices. Within six months, "microservices" was on every CTO's lips. Within a year, it was the default architectural style taught in new software engineering courses. Within two years, it had almost entirely displaced "SOA" as the preferred name for "our enterprise API/service architecture."

Fowler himself has been consistently careful to note that microservices are *not* a silver bullet and that not every system should be a microservice system. His 2015 "MicroservicePremium" article warned that microservices have significant operational costs and should only be adopted by teams that have the infrastructure to support them. He also consistently credited James Lewis (who worked at ThoughtWorks with Fowler, and had been talking about the style for several years before 2014) as the co-originator.

### 9.5 Sam Newman and the Microservices Textbook

If Fowler and Lewis defined the architectural style, **Sam Newman** wrote the book that taught the industry how to actually do it. Newman, also at ThoughtWorks, published *Building Microservices* with O'Reilly in February 2015. The book became the textbook of the microservices era, with subsequent editions in 2021 expanding the coverage to Kubernetes, event-driven patterns, and platform engineering.

Newman's book is notable for being, in tone and structure, the *anti-Thomas Erl*. Where Erl's SOA books were encyclopedic tomes that cataloged principles and patterns in exhaustive taxonomic detail, Newman's book was practical, opinionated, and focused on "what actually goes wrong when you try to do this." Chapters covered things like "how to decompose a monolith," "how to handle failures without distributed transactions," "how to version APIs," "how to run microservices in production," and "the anti-patterns that will bite you." The book acknowledged, frankly, that microservices were difficult, that many teams should not adopt them, and that the operational costs were real.

Newman's later book, *Monolith to Microservices* (O'Reilly, 2019), was dedicated entirely to the migration problem: how to take a legacy monolith and decompose it into services without breaking the business. By 2019, this was the practical question most organizations were asking. The "should we adopt microservices?" question had been settled (yes, for most web-native companies at scale); the harder question was "how do we actually do it without blowing up production?"

### 9.6 Docker and Containerization

The practical feasibility of microservices at scale was massively boosted by the arrival of **Docker**. Docker 0.1 was released on **March 20, 2013** by a company called **dotCloud** (later renamed Docker, Inc.), founded by **Solomon Hykes**. Hykes, a French entrepreneur, had been working on dotCloud as a Platform-as-a-Service business, and Docker was originally a small internal tool for packaging application environments. At a PyCon lightning talk in March 2013, Hykes introduced Docker publicly with a short demo, and the reaction was electric.

Docker built on Linux kernel primitives (cgroups, namespaces, and union filesystems) that had existed since around 2007-2008, but Docker packaged them into a developer-friendly tool. A Dockerfile described how to build an image; `docker build` built it; `docker run` ran a container from it. The image was immutable, portable, and self-contained. The same image that ran on a developer's laptop ran in staging, in production, and on any Docker host on any cloud.

The connection to microservices was immediate. Microservices needed a deployment unit that was small, fast to start, isolated from other services, and easy to automate. Docker provided exactly that. By 2015, "microservices in Docker containers" was the default architectural pattern for new cloud-native applications. Docker, Inc. grew from a tiny startup to a company valued at over $1 billion by 2015. The PaaS business (dotCloud) was sold off in August 2014 to cloudControl so the company could focus entirely on Docker.

Docker's later history is complicated — the company struggled to monetize its rapidly-growing open-source user base, went through multiple strategy pivots, sold its enterprise business to Mirantis in November 2019, and by 2023 was primarily a developer tools company rather than the runtime powerhouse it had been in 2015. But Docker's impact on the microservices movement is indelible.

### 9.7 Kubernetes and Container Orchestration

Containers alone were not enough. Once you had a dozen or a hundred containers running microservices, you needed something to schedule them, restart them when they crashed, route traffic to them, scale them up and down, and coordinate rolling deployments. This was the container orchestration problem.

Multiple solutions emerged:

- **Apache Mesos** (2010), with the Marathon framework. Mesos was used at Twitter, Airbnb, and Apple.
- **Docker Swarm** (2014), Docker's own orchestration tool.
- **Kubernetes** (2014), a Google project based on lessons from Google's internal Borg system.

**Kubernetes** won. The Kubernetes project was open-sourced by Google on **June 7, 2014**, under the leadership of **Joe Beda**, **Brendan Burns**, and **Craig McLuckie**, with significant contributions from Google's internal Borg and Omega teams (the veterans of Google's decade-plus of experience running containers at massive scale). Kubernetes 1.0 was released on **July 21, 2015**, and at the same event, Google announced the formation of the **Cloud Native Computing Foundation** (CNCF), a Linux Foundation sub-project, to host Kubernetes and related open-source projects.

Kubernetes's architecture was genuinely novel for the industry. It was declarative (you described the desired state, and the system continuously reconciled the actual state to match), API-centric (everything was a resource exposed through a REST API, even the scheduling controllers themselves), and extensible (you could add your own resource types through CRDs — Custom Resource Definitions, added in Kubernetes 1.7, 2017). The core abstraction, the Pod, was a group of tightly-coupled containers sharing network and storage. Above pods were Services (stable network endpoints), Deployments (rollout controllers), StatefulSets (for stateful workloads), and ConfigMaps/Secrets for configuration.

By 2017, Kubernetes had won the container orchestration war. Docker added Kubernetes support to Docker Desktop. Mesos and Docker Swarm declined. Public cloud providers launched managed Kubernetes services: **Google Kubernetes Engine** (GKE, 2015, the first), **Amazon EKS** (2018), **Azure Kubernetes Service** (AKS, 2018). Kubernetes became the de facto operating system of the cloud-native era.

### 9.8 Service Meshes: Linkerd, Istio, Consul Connect

With Kubernetes providing the orchestration substrate, the next problem to solve was service-to-service communication. How do you handle traffic routing between microservices? How do you enforce mutual TLS? How do you implement circuit breakers, retries, and load balancing? How do you observe the traffic for debugging?

One answer was: each service implements all this logic in its own application code (which is what Netflix did with Hystrix, Eureka, Ribbon, etc.). Another answer was: extract the logic into a sidecar proxy that runs next to each service and intercepts all its network traffic. This second pattern — **the service mesh** — emerged in 2016.

**Linkerd** was the first. Founded by **William Morgan** and **Oliver Gould** (both formerly at Twitter) as **Buoyant**, Linkerd was released in February 2016. It was originally built on Twitter's Finagle library and ran as a JVM sidecar. Morgan and Gould framed the service mesh as "the communication layer of the cloud-native stack," and argued that this layer was better solved at infrastructure level than in application code. Linkerd 2.0 (2018) was a complete rewrite in Rust (the data plane) and Go (the control plane), designed for minimal overhead.

**Istio** was announced in May 2017 by a joint IBM + Google + Lyft team. Istio used Envoy (developed at Lyft by **Matt Klein** and open-sourced in September 2016) as its sidecar proxy. Istio added a rich control plane that managed traffic policy, security, and observability centrally. Istio rapidly became the most-deployed service mesh for Kubernetes. Its complexity, however, was legendary — by 2019, "Istio is too complicated" had become a common complaint, and Istio 1.5 (2020) simplified the architecture by consolidating the control plane into a single binary called istiod.

**Consul Connect** was released by HashiCorp in 2017, building on the existing Consul service discovery product. Consul Connect offered a service mesh that was less Kubernetes-centric, working well in VM and hybrid deployments.

**Linkerd 2**, **Istio**, **Consul Connect**, and later entrants like **Kuma** (by Kong) and **Open Service Mesh** (Microsoft, later donated to CNCF and archived in 2023) formed the service mesh market. Envoy itself became the de facto data plane for most of these — Envoy is the Proxy that most meshes are built around.

The service mesh era is, in many respects, a continuation of the ESB idea with the dial turned all the way over: instead of one big central ESB, you have dozens of tiny per-service proxies that each enforce the same policies. The difference is profound in terms of scalability and failure isolation (no single choke point) but the conceptual lineage is direct. The service mesh is the ESB reborn as a distributed fabric rather than a centralized appliance.

### 9.9 "Microservices is SOA Done Right"

By 2018, a consensus was forming in the community that microservices were, essentially, SOA executed with better tools and a better culture. Fowler and Newman had both said so publicly. Anne Thomas Manes's prediction — that services would outlive the SOA buzzword — had come true. The WS-\* stack was gone, replaced by simple HTTP+JSON (or gRPC, or event streams). The ESB was gone, replaced by service meshes. BPEL was gone, replaced by code (or workflow engines like Temporal). UDDI was gone, replaced by Kubernetes Services and DNS. Canonical data models were gone, replaced by bounded contexts (an idea from Eric Evans's *Domain-Driven Design*, 2003, which had a second life during the microservices era).

The architectural principles Erl had articulated in 2005 turned out to be correct. The implementation technology Erl had assumed (SOAP, WSDL, ESBs, BPEL) turned out to be wrong. The microservices generation got the principles right *and* the technology right, which is why microservices worked where SOA had failed.

---

## Part X: Modern SOA — REST, OpenAPI, gRPC, Event Streaming (2011–2026)

### 10.1 OpenAPI (née Swagger)

The REST era had a documentation problem. Without something like WSDL, there was no machine-readable way to describe what a REST API supported. Developers wrote prose documentation by hand, which became stale, inconsistent, and error-prone.

**Swagger** was created by **Tony Tam** at Wordnik (an online dictionary startup) in 2011. Swagger 1.0 was released in August 2011. Tam had built Swagger as an internal tool to auto-generate API documentation from JAX-RS annotations and expose it through an interactive HTML UI (Swagger UI). He open-sourced it, and the concept — a JSON file describing a REST API, plus an interactive UI for exploring it — caught on rapidly.

Swagger 2.0 (September 2014) was the breakthrough version. It standardized the JSON schema format, improved tooling support, and became the de facto standard for REST API documentation. In 2015, SmartBear Software (which had acquired Swagger) donated the specification to the Linux Foundation, which established the **OpenAPI Initiative** in November 2015. The specification was renamed **OpenAPI Specification** (OAS), with Swagger remaining as the brand for the tooling ecosystem.

**OpenAPI 3.0** was released in July 2017 with significant improvements: better reference resolution, improved schema support, callbacks for webhooks, links between operations, and more. **OpenAPI 3.1** (February 2021) aligned with JSON Schema draft 2020-12. OpenAPI has become the undisputed standard for documenting REST APIs, with tooling support in virtually every language and framework. Every major API platform (Postman, Stoplight, ReadMe, SwaggerHub, Bump.sh) is built on OpenAPI.

The historical irony is thick. WSDL was a W3C standard for describing Web Services, delivered in 2001, and nobody liked it. OpenAPI is a community-led specification for describing REST APIs, delivered in 2014-2017, and everybody uses it. The content is similar — both describe operations, types, endpoints, security — but the execution is totally different. OpenAPI was pragmatic, incremental, and grew from developer needs. WSDL was theoretical, comprehensive, and grew from committee fiat. In the long run, the pragmatic path won.

### 10.2 gRPC and Protocol Buffers

**Protocol Buffers** ("Protobuf") was developed internally at Google starting around 2001. The motivation was simple: Google needed a compact, fast, versioned serialization format for inter-service communication, and the existing options (XML, JSON, Java serialization) were too slow, too bloated, or too language-specific. Protocol Buffers was designed by **Sanjay Ghemawat**, **Jeff Dean**, and others as part of Google's infrastructure.

Google open-sourced Protocol Buffers in **July 2008** as "proto2." The format was stunningly efficient: binary-encoded, schema-described (via a .proto file that compiled into language-specific stubs), backward-compatible when evolved carefully, and with code generators for most major languages. Proto2 became a widely-used library in its own right, used by Apache projects, Hadoop ecosystem tools, and many others.

In parallel, Google had an internal RPC system called **Stubby** that had been running Google's services for over a decade. Stubby was never open-sourced (it was too tied to Google's internal infrastructure), but in **February 2015** Google released **gRPC** — a new, clean-room RPC system based on Protocol Buffers, using **HTTP/2** as the transport, and designed to be gRPC meant "gRPC Remote Procedure Calls." (The "g" officially stood for different things in different versions of the docs — sometimes "Google," sometimes "good," sometimes recursively "gRPC." The joke was that nobody knew what it meant and Google wouldn't say.) gRPC was donated to the CNCF in March 2017 and has been a CNCF-graduated project since 2019.

gRPC's design was an explicit reaction to the REST era. Where REST was informal, gRPC was strict (types enforced by Protobuf). Where REST was text-based, gRPC was binary (dense and fast). Where REST was HTTP/1.1-based, gRPC used HTTP/2 (with multiplexed streams, header compression, and server push). Where REST had no native streaming, gRPC supported four RPC types: unary, server streaming, client streaming, and bidirectional streaming.

The principal gRPC architects at Google were **Varun Talwar** (product management), **Louis Ryan** (engineering), and Eric Anderson, with contributions from many others. gRPC gained rapid adoption inside large companies building microservice architectures — Netflix, Square, Dropbox, Lyft, and thousands of others. By 2020, gRPC was the standard inter-service protocol inside large organizations, while REST remained the standard for external-facing APIs.

A secondary gRPC ecosystem grew up: **grpc-gateway** (for exposing gRPC services as REST+JSON), **grpc-web** (for calling gRPC from browsers through a translation proxy), **Connect** (from Buf, a simpler alternative protocol that's wire-compatible with both gRPC and JSON), and many more.

### 10.3 GraphQL: The Facebook Alternative

In 2012, **Facebook** was rebuilding its mobile application to be a native iOS and Android app (rather than an HTML5 wrapper). The REST APIs that had been built for the web app were badly suited to mobile: they over-fetched data, required multiple round trips, and forced the mobile app to deal with versioning inconsistencies. A team at Facebook — principally **Lee Byron**, **Nick Schrock**, and **Dan Schafer** — designed a new query language for data fetching that let the client specify exactly what fields it wanted.

That language was **GraphQL**. It was used internally at Facebook from 2012 onwards and publicly announced at React Conf 2015 in January 2015. The GraphQL specification was open-sourced on **July 1, 2015**. The key ideas:

- A single endpoint (typically `/graphql`) that accepts queries.
- A schema that describes the available types, fields, and relationships.
- Queries that specify exactly what fields to return. The server returns exactly those fields, no more, no less.
- Mutations for state changes.
- Subscriptions for real-time updates.

GraphQL had a moment of intense hype in 2016-2018. Apollo (a company founded by **Matt DeBergalis** and **Geoff Schmidt**, previously of Meteor) became the dominant GraphQL client library and platform. Hasura, Prisma, and other companies built GraphQL-first tools. The GraphQL Foundation was established under the Linux Foundation in November 2018 to govern the specification.

GraphQL's reception was polarized. Advocates loved the declarative query model, the single endpoint, the strong typing, and the tooling (especially GraphiQL, the interactive query explorer). Critics pointed out that GraphQL moved complexity from the API design phase to the data loading and caching phase, that the N+1 query problem was often worse than with REST, and that security was tricky (a single malicious query could fetch an enormous object graph).

By 2024, GraphQL had settled into a niche: it was widely used for frontend-to-backend communication in data-rich applications (Shopify's admin, GitHub's API, Airbnb's frontends), but it did not displace REST or gRPC in most backend-to-backend scenarios. It remained a major API paradigm, co-existing with REST and gRPC.

### 10.4 Apache Kafka and Event-Driven Architectures

The SOA era had imagined services communicating primarily through request-response (RPC-style) calls. The microservices era rediscovered an alternative pattern: **event-driven architecture**, where services communicate by publishing and subscribing to events on a durable message log. The technology that made this practical at scale was **Apache Kafka**.

Kafka was developed at **LinkedIn** starting in 2010. The team — **Jay Kreps**, **Neha Narkhede**, and **Jun Rao**, all at LinkedIn — built Kafka to solve LinkedIn's internal data pipeline problem: they had dozens of systems generating events (user actions, database changes, monitoring metrics) and dozens of consumers (analytics, search indexing, fraud detection, recommendations). Point-to-point integration did not scale. They needed a central, durable, high-throughput event log that any producer could write to and any consumer could read from.

Kafka was open-sourced in January 2011 and became an Apache Incubator project in July 2011. It graduated to a top-level Apache project in October 2012. Kafka's core abstractions — topics, partitions, producers, consumers, offsets — were simple but powerful. A topic was an append-only log. Partitions distributed the log for horizontal scalability. Producers wrote to partitions. Consumers read from partitions at their own pace, tracked by a position offset. The log was durable, replicated across brokers, and retained messages for a configurable period (often days or weeks).

In January 2014, Kreps, Narkhede, and Rao left LinkedIn to found **Confluent**, a commercial company around Kafka. Confluent grew rapidly, adding enterprise features like Schema Registry (for managing Avro/Protobuf schemas evolved over time), ksqlDB (for stream processing in SQL), Connect (for source/sink integrations), and a managed cloud service (Confluent Cloud). Confluent went public on NASDAQ in June 2021 with a valuation around $11 billion.

Kafka's impact on architecture was profound. By 2020, "event-driven microservices" had become a major architectural pattern, often pitched as superior to RPC-based microservices. Events provided loose coupling (producers didn't know who was consuming), durability (events persisted in the log), and replayability (new consumers could start from the beginning of the log). The pattern had deep roots in earlier work (IBM MQ, TIBCO Rendezvous, the Enterprise Integration Patterns book by Hohpe and Woolf) but Kafka's open-source availability and operational maturity made it accessible to every company, not just those with six-figure middleware budgets.

**AsyncAPI**, a specification for describing event-driven APIs (analogous to OpenAPI for REST), was introduced in 2017 by Fran Méndez and grew in parallel. By 2024, AsyncAPI was the standard way to document Kafka, RabbitMQ, and other event-driven systems.

### 10.5 CNCF and the Cloud Native Explosion

The **Cloud Native Computing Foundation** (CNCF) was founded in July 2015, alongside the Kubernetes 1.0 release, as a project of the Linux Foundation. Its original members included Google, IBM, Intel, Docker, Red Hat, VMware, Cisco, and several others. The CNCF's mission was to make cloud-native computing ubiquitous, and its core projects — starting with Kubernetes — grew to a vast portfolio.

By 2026, the CNCF Landscape (maintained at landscape.cncf.io) lists over 1,500 projects and products across categories including orchestration, service mesh, observability, CI/CD, databases, security, and more. The CNCF has graduated over 25 projects to "graduated" status (the highest maturity level), including Kubernetes, Prometheus, Envoy, gRPC, etcd, Fluentd, Linkerd, Helm, Containerd, Argo, Jaeger, and many others.

The CNCF's annual conference, **KubeCon + CloudNativeCon**, grew from a few hundred attendees in 2015 to over 10,000 by 2019, and became the premier conference of the cloud-native era. The intellectual successor to the JavaOne conferences of the 2000s (which were the SOA-era mecca) and the OMG TechCons of the 1990s, KubeCon represented the center of gravity of the service-oriented world in the 2020s.

### 10.6 Serverless and FaaS

A parallel thread to microservices was **serverless computing**, which aimed to abstract away the server (and even the container) and expose an even simpler unit: the function. **AWS Lambda** was announced at AWS re:Invent in **November 2014** and launched in general availability in April 2015. Lambda let you upload a zip file of code, define a handler function, and have AWS run the function on demand — scaling from zero to thousands of concurrent invocations automatically, charging only for the milliseconds of execution.

Lambda was followed by **Google Cloud Functions** (2016), **Azure Functions** (2016), and an ecosystem of third-party function platforms (IronWorker, Iron.io, Webtask, StdLib, Cloudflare Workers). The open-source world caught up with **OpenWhisk** (Apache, from IBM), **Kubeless**, **Fission**, **OpenFaaS**, and eventually **Knative** (Google + Red Hat, 2018, later donated to CNCF).

The serverless paradigm represented the logical endpoint of the microservices trend: each "service" was now a single function, each function was independently deployed, each function was independently scaled, and the developer did not have to think about servers at all. In practice, serverless had its own problems (cold starts, cost unpredictability, vendor lock-in, debugging challenges), and it never fully displaced container-based microservices — but it carved out a significant niche for event-driven workloads, APIs with spiky traffic, and glue code between managed services.

### 10.7 Platform Engineering and the Post-Microservices Turn

By the early 2020s, a new conversation was emerging: microservices, while more workable than SOA had been, were still too hard for most teams to operate. The operational tax of running Kubernetes, service meshes, observability stacks, and CI/CD pipelines was enormous. Small teams drowned in the complexity. A backlash began, partly articulated in DHH's (David Heinemeier Hansson's) 2023 "leaving the cloud" posts at 37signals, and partly in the emerging "platform engineering" discourse.

**Platform engineering** was the idea that a central platform team would build a curated "internal developer platform" (IDP) that abstracted away the complexity of Kubernetes, infrastructure-as-code, and cloud services, exposing instead a golden path that application teams could follow. The term was popularized by Luca Galante and the Platform Engineering community starting around 2020-2021. By 2024, "platform engineering" had become the dominant organizational pattern for running microservice infrastructure at medium-to-large companies.

The platform engineering movement is, in a certain sense, the latest iteration of the same tension that ran through the entire SOA era: the conflict between the "everyone does their own integration" model and the "a central team manages the complexity" model. ESBs were one answer (centralize integration). Microservices were a reaction (decentralize everything). Platform engineering is a synthesis (decentralize the business logic, centralize the operational substrate). The wheel keeps turning.

---

## Part XI: Key Figures

A list of the people whose names have come up in this narrative, with a one-paragraph capsule biography for each. This is not exhaustive — hundreds of engineers contributed to the SOA story and its successors — but these are the people whose influence is repeatedly cited.

**Andrew Birrell** (1944–2016). British-born computer scientist who worked at Xerox PARC and later DEC SRC. Co-author with Bruce Nelson of the seminal 1984 RPC paper. Birrell's later work at DEC Systems Research Center included Modula-3 and the Topaz distributed operating system. He contributed to almost every generation of distributed systems work from the 1970s through the 2000s, quietly and influentially.

**Bruce Jay Nelson** (1952–1999). Co-author of the 1984 RPC paper with Birrell. Nelson's 1981 CMU PhD dissertation, supervised by Jim Morris, first named and defined "remote procedure call." Nelson worked at PARC and then Cisco Systems. He died tragically young at 47.

**Roy Thomas Fielding** (born 1965). American computer scientist, co-author of HTTP 1.0 and 1.1, co-founder of the Apache HTTP Server Project, author of the 2000 PhD dissertation that named and defined REST. Fielding has been a defender of architectural rigor in Web standards for three decades and is often cited as one of the Web's principal architects. He worked at eBay, Adobe, and later as a consultant.

**Don Box** (born 1962). American software engineer and author, best known as a co-author of SOAP and for his book *Essential COM* (1998). Box began at DevelopMentor (a training and consulting company), moved to Microsoft in 2002, became a Distinguished Engineer, and later moved to Microsoft's Azure CTO office. His writing combines technical depth with a sardonic voice rare in enterprise software literature. Co-author of *Essential .NET, Volume I: The Common Language Runtime* (2002). Left Microsoft for another role in 2015.

**Dave Winer** (born 1955). American software developer, entrepreneur, and blogger. Creator of Frontier (a scripting platform in the 1990s), XML-RPC (1998), RSS 0.91 and 2.0 (1999 and 2002), and one of the founders of the blogging movement. Winer has been a consistent advocate for simplicity in protocols and has written extensively about his philosophy of software on his blog (scripting.com, now at scripting.com/davewiner). He insisted that XML-RPC not get complicated; when SOAP did, he eventually withdrew from active involvement.

**Martin Fowler** (born 1963). British-American software developer, author, and speaker, chief scientist at ThoughtWorks. Author of *Refactoring* (1999), *Patterns of Enterprise Application Architecture* (2002), and many influential articles on software design. Co-author (with James Lewis) of the 2014 "Microservices" article that crystallized the term. Fowler's personal website (martinfowler.com) has been one of the most influential sources on software architecture since the late 1990s.

**James Lewis** (born circa 1972). British software architect at ThoughtWorks. Co-author with Fowler of the 2014 "Microservices" article. Lewis had been talking about the microservices architectural style since at least 2011, in talks like "Microservices — Java, the Unix Way." He is considered, along with Fowler, one of the two people most responsible for crystallizing the term.

**Sam Newman** (born circa 1974). British software architect, previously at ThoughtWorks, later independent. Author of *Building Microservices* (O'Reilly, 2015, with a 2nd edition in 2021) and *Monolith to Microservices* (2019). Newman's books have been the primary practical reference for the microservices generation.

**Gregor Hohpe** (born 1967). German-born software architect. Co-author (with Bobby Woolf) of *Enterprise Integration Patterns* (Addison-Wesley, 2003), which established a vocabulary of 65 integration patterns (Message Router, Content-Based Router, Publish-Subscribe Channel, etc.) that became foundational for the messaging/integration world. Hohpe worked at Google, AWS (as an Enterprise Strategist), and later as an independent architect.

**Adrian Cockcroft** (born 1962). British-American cloud architect, cloud architect at Netflix (2007-2014), founder of Netflix OSS. Cockcroft's keynotes and blog posts during the 2012-2018 period were some of the most influential pieces of cloud-native advocacy. After Netflix he was a technology fellow at Battery Ventures, then VP of Cloud Architecture Strategy at AWS (2016-2022), and later retired from AWS to focus on sustainability and writing.

**Jeff Bezos** (born 1964). Founder and longtime CEO of Amazon, issuer of the 2002 API Mandate memo that set Amazon's direction toward service-oriented architecture. Bezos's insistence on API-first discipline inside Amazon is one of the reasons AWS, when it launched in 2006, was ready to expose its services to the public.

**Werner Vogels** (born 1958). Dutch computer scientist, CTO of Amazon since 2004. Vogels has been the public face of Amazon's distributed systems culture for two decades, and his blog (allthingsdistributed.com) has been a significant source of thinking on cloud-native architecture, eventual consistency, and the CAP theorem in practice. Former research scientist at Cornell University before joining Amazon.

**Steve Yegge** (born circa 1967). American software developer, author of the 2011 "Google Platforms Rant" that publicly leaked the Bezos API Mandate. Yegge worked at Amazon from 1998 to 2005 and then at Google until 2018, returning to small startups afterward. His essay-length blog posts on software, programming languages, and platforms have been widely read since the early 2000s.

**Thomas Erl** (born circa 1969). Canadian author and consultant, founder of Arcitura Education (formerly SOA Systems). Author of the Prentice Hall Service-Oriented Computing Series, a dozen or more books on SOA, cloud computing, big data, and blockchain. Erl was the most prolific textbook author of the SOA era and remains active in publishing architecture textbooks.

**Anne Thomas Manes** (born circa 1960). American analyst and researcher, VP at Burton Group (2003-2010) and later Gartner (2010-2020s). Author of the January 2009 "SOA is Dead" blog post that crystallized the post-SOA moment. Manes was one of the most respected voices in the SOA analyst community, and her willingness to declare the death of the buzzword she had been covering for six years took significant professional courage.

**Rod Johnson** (born 1970). Australian-born software developer, creator of the Spring Framework. His 2002 book *Expert One-on-One J2EE Design and Development* (Wrox) distributed the code samples that became Spring. Johnson founded Interface21 (later SpringSource), which was acquired by VMware in 2009 for $420 million. He later founded Atomist (2015) and Hatch.ai (2023), and has served on many company boards.

**Ronald Schmelzer and Jason Bloomberg**. Co-founders of ZapThink, the boutique analyst firm that was closely associated with SOA during the 2003-2011 period. Both continued writing on enterprise architecture topics after ZapThink was acquired by Dovel Technologies in 2011, with Bloomberg maintaining a column at Forbes.

**Sanjiva Weerawarana** (born 1968). Sri Lankan computer scientist, co-author of WSDL 1.0 while at IBM Research (1998-2005), founder and CEO of WSO2 (2005). WSO2 produced an open-source Web Services and integration platform stack. Weerawarana has been one of the most influential figures in the open-source middleware world.

**Francisco Curbera**. IBM researcher, co-author of WSDL, BPEL4WS, and other Web Services standards. A member of the IBM Research team that drove much of the WS-\* specification work.

**Erik Christensen**. Microsoft engineer, co-author of WSDL 1.0 (submitted to W3C in September 2000).

**Tony Tam**. Software engineer at Wordnik, creator of Swagger (2011), later at SmartBear. Tam's creation of Swagger filled the REST documentation gap and became the basis for OpenAPI.

**Solomon Hykes** (born 1983). French entrepreneur, co-founder of dotCloud (2010), creator of Docker (publicly released March 2013). Hykes's March 2013 PyCon lightning talk introducing Docker is considered one of the most influential product demos of the decade. He left Docker, Inc. in 2018 and later founded Dagger (2022).

**Joe Beda, Brendan Burns, Craig McLuckie**. The three Google engineers credited as the principal creators of Kubernetes, which was open-sourced in June 2014. Beda and McLuckie later co-founded Heptio (acquired by VMware in 2018). Burns joined Microsoft and became a Distinguished Engineer there, continuing to work on Kubernetes and Azure.

**Kelsey Hightower** (born 1981). American software engineer, developer advocate, and educator. Hightower's "Kubernetes the Hard Way" tutorial (2017) became the canonical resource for learning Kubernetes from first principles. He was the public face of Kubernetes evangelism during the crucial 2015-2020 period, first at CoreOS and then at Google. Retired from Google in 2023 to focus on community work.

**William Morgan and Oliver Gould**. Co-founders of Buoyant (2015) and creators of Linkerd (2016), the first service mesh. Both had previously worked on Twitter's distributed systems team and brought that experience to the service mesh architecture. Morgan became the public voice of the service mesh idea, writing and speaking extensively on why service meshes were a necessary abstraction.

**Matt Klein** (born 1982). Lyft software engineer, creator of the Envoy proxy (2016). Envoy became the de facto data plane for most service meshes (Istio, Consul Connect, Kuma, and others) and one of the most successful open-source networking projects of the decade. Klein left Lyft in 2022 to work independently on Envoy-related projects.

**Varun Talwar and Louis Ryan**. Google engineers who led the gRPC product and engineering, respectively, at Google. gRPC was open-sourced in 2015. Talwar later left Google and co-founded Tetrate (2018), a commercial service mesh company.

**Jay Kreps, Neha Narkhede, Jun Rao**. The three LinkedIn engineers who created Apache Kafka (2010) and co-founded Confluent in 2014 to commercialize it. Kreps has been Confluent's CEO since founding; his blog posts and book *I Heart Logs* (O'Reilly, 2014) articulate the event-driven architectural vision.

**Lee Byron, Nick Schrock, Dan Schafer**. The three Facebook engineers credited as the principal creators of GraphQL (internally used from 2012, open-sourced 2015). Schrock later co-founded Dagster (a data orchestration tool).

**Tim Bray** (born 1955). Canadian software developer, co-inventor of XML (1998), later at Google and Amazon. Bray was one of the most prominent critics of the WS-\* stack in the mid-2000s, writing widely-read blog posts arguing that the complexity was unjustified. His RESTful advocacy was influential in the shift away from SOAP.

**Tim Berners-Lee** (born 1955). British computer scientist, inventor of the World Wide Web (1989-1991), director of the W3C since 1994. While primarily remembered for the Web itself, Berners-Lee also championed the Semantic Web vision (RDF, OWL, SPARQL) throughout the 2000s. The Semantic Web is adjacent to, but distinct from, SOA — it is more about linked data than about service invocation — but it shared the W3C with the WS-\* effort and the two projects intersected philosophically.

---

## Part XII: Timeline (1984–2025)

A year-by-year distillation of the moments that matter. This is deliberately compressed; each entry could be an essay.

**1984** — Birrell and Nelson publish "Implementing Remote Procedure Calls" in ACM TOCS. Sun releases Sun RPC (later ONC RPC). Xerox Cedar RPC runs at about 1,100 null calls/sec on Alto workstations.

**1985** — Sun RPC standardized internally; used as the foundation for NFS.

**1987** — Apollo releases NCS and NIDL. HP acquires Apollo in 1989.

**1988** — Open Software Foundation (OSF) founded. RFC 1057 publishes Sun ONC RPC. OSF issues RFT for distributed computing.

**1989** — Object Management Group (OMG) founded by eleven companies. Tim Berners-Lee writes the proposal for the World Wide Web at CERN.

**1990** — OSF selects NCS (from HP/Apollo) as the basis for DCE RPC. First web page goes live at CERN (December).

**1991** — CORBA 1.0 released by the OMG (October). First HTTP server goes live at CERN.

**1992** — DCE 1.0 ships. HTTP 0.9 in use on the early Web.

**1993** — Microsoft COM launches as part of OLE 2.0. NCSA Mosaic browser released.

**1994** — "A Note on Distributed Computing" (Waldo, Wyant, Wollrath, Kendall) circulates inside Sun.

**1995** — Java 1.0 released by Sun (May). Apache HTTP Server project begins.

**1996** — CORBA 2.0 ships with IIOP. Microsoft releases DCOM in Windows NT 4.0. Microsoft Transaction Server (MTS) released. Gartner analyst Yefim Natis begins writing about "service-oriented" concepts.

**1997** — IONA Orbix at peak influence. Visigenic acquired by Borland/Inprise for $133M. Java RMI 1.0 released.

**1998** — Enterprise JavaBeans 1.0 announced by Sun (March). Dave Winer publishes XML-RPC (June). Don Box's book *Essential COM* released. OMG CORBA 2.2 introduces the POA.

**1999** — Java 2 Platform Enterprise Edition (J2EE) released by Sun (December). SOAP 1.0 drafted by Microsoft, UserLand, DevelopMentor, and others. Microsoft begins "Next Generation Windows Services" (NGWS), later .NET.

**2000** — SOAP 1.1 published as a W3C Note (May). Roy Fielding's PhD dissertation on REST accepted at UC Irvine. UDDI announced by IBM, Microsoft, Ariba. BEA WebLogic emerging as app server leader. Multics shut down (October 30).

**2001** — WSDL 1.1 published as a W3C Note (March). Agile Manifesto published. WS-Inspection Language precursor to WS-Discovery.

**2002** — Rod Johnson publishes *Expert One-on-One J2EE Design and Development* (October). Jeff Bezos sends the Amazon API Mandate memo (exact date disputed). BPEL4WS 1.0 published by IBM and Microsoft (August). WS-I formed (February). Gartner's Roy Schulte uses the term "Enterprise Service Bus." .NET Framework 1.0 released (February).

**2003** — Gartner and other analyst firms begin pushing "SOA" as a buzzword. Enterprise Integration Patterns book by Hohpe & Woolf published (October). Eric Evans's Domain-Driven Design published. Spring Framework released as open source.

**2004** — WS-Security approved by OASIS (April). WS-I Basic Profile 1.0 published (April). Thomas Erl publishes first SOA book. Netflix begins DVD streaming service.

**2005** — Thomas Erl publishes *Service-Oriented Architecture: Concepts, Technology, and Design*. Sun GlassFish released as open source. Ruby on Rails 1.0 (December). YouTube launches.

**2006** — EJB 3.0 released as part of Java EE 5 (May). Red Hat acquires JBoss for $350M. Progress Software acquires Sonic. webMethods acquired by Software AG for $546M. Amazon Web Services launches S3 (March) and EC2 (August). UDDI Business Registry shut down (January).

**2007** — iPhone launches (June). WS-BPEL 2.0 ratified by OASIS (April). Hortonworks and Cloudera emerge as Hadoop distributors (precursor). Netflix begins streaming service.

**2008** — BEA Systems acquired by Oracle for $8.5B. Mesos project begins at UC Berkeley. Leonard Richardson proposes the Maturity Model at QCon. Chrome browser launched.

**2009** — Anne Thomas Manes publishes "SOA is Dead; Long Live Services" (January). SOA Manifesto published in Rotterdam (October). Oracle announces acquisition of Sun Microsystems. Netflix begins its migration to AWS. Node.js released.

**2010** — Kafka project begins at LinkedIn. Richardson Maturity Model popularized by Martin Fowler's blog post.

**2011** — Steve Yegge publishes the Google Platforms Rant, leaking the Bezos API Mandate (October). Kafka open-sourced (January). Swagger 1.0 released (August). Netflix begins open-sourcing its cloud tools. OpenStack 1.0 (Austin) released.

**2012** — Hystrix, Eureka, and other Netflix OSS projects released. James Lewis gives a "microservices" talk at 33rd Degree Kraków. Kafka becomes a top-level Apache project.

**2013** — Docker 0.1 released (March 20). Netflix migration from datacenters well underway. Ruby on Rails 4.0 released.

**2014** — Kubernetes open-sourced by Google (June 7). Fowler and Lewis publish "Microservices" article (March 25). AWS Lambda announced at re:Invent (November). Confluent founded to commercialize Kafka. Apache Kafka 0.8 with replication released. BEA's old WebLogic still ruling Java EE.

**2015** — Kubernetes 1.0 released (July 21). Cloud Native Computing Foundation founded. gRPC open-sourced by Google (February). GraphQL specification open-sourced (July). Sam Newman publishes *Building Microservices* (February). Docker, Inc. valued over $1B.

**2016** — Linkerd service mesh released (February) by Buoyant. Netflix completes its migration to AWS. Envoy proxy open-sourced by Lyft (September). Kubernetes 1.4 introduces StatefulSets.

**2017** — Istio announced by Google, IBM, and Lyft (May). OpenAPI 3.0 released (July). gRPC donated to CNCF. Kubernetes becomes dominant over Docker Swarm and Mesos. AsyncAPI introduced.

**2018** — MuleSoft acquired by Salesforce for $6.5B. AWS EKS and Azure AKS become generally available. Linkerd 2.0 rewritten in Rust and Go. Heptio acquired by VMware.

**2019** — Sam Newman publishes *Monolith to Microservices* (November). Docker sells its enterprise business to Mirantis. Kubernetes 1.16 graduates many features to stable.

**2020** — Istio 1.5 consolidates the control plane into istiod. Platform engineering discourse emerges. The COVID pandemic accelerates cloud migration.

**2021** — OpenAPI 3.1 released (February). Confluent IPOs on NASDAQ (June). Netflix open-sources several more tools.

**2022** — Solomon Hykes launches Dagger. Adrian Cockcroft retires from AWS. Platform engineering becomes mainstream.

**2023** — Kelsey Hightower retires from Google. Docker focuses on developer tools. Service mesh adoption continues to grow.

**2024** — OpenAPI 3.1.1. Platform engineering matures. "Microservices is SOA done right" becomes received wisdom. GraphQL stabilizes in its niche. gRPC continues expanding.

**2025** — By now, the cycle has turned enough that small teams are rediscovering the virtues of monoliths for appropriate workloads; "modular monolith" and "majestic monolith" discourse gains prominence alongside microservices. The pendulum keeps swinging. The principles outlive the fashions.

---

## Part XIII: Primary Sources

For researchers wishing to go deeper, these are the foundational documents of the SOA story. Most are available online either at their original URLs or through web archives.

**1. Birrell, A. D., and Nelson, B. J.** "Implementing Remote Procedure Calls." *ACM Transactions on Computer Systems* 2, no. 1 (February 1984): 39–59. The Ur-text of distributed computing. Every subsequent RPC system traces its ancestry here.

**2. Waldo, J., Wyant, G., Wollrath, A., and Kendall, S.** "A Note on Distributed Computing." Sun Microsystems Laboratories Technical Report SMLI TR-94-29, November 1994. The foundational critique of the idea that distributed calls can be made to look like local calls.

**3. Fielding, R. T.** *Architectural Styles and the Design of Network-based Software Architectures*. PhD dissertation, University of California, Irvine, 2000. Available at https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm. The REST dissertation. Chapter 5 is the part most people read.

**4. Box, D., Ehnebuske, D., Kakivaya, G., Layman, A., Mendelsohn, N., Nielsen, H. F., Thatte, S., and Winer, D.** "Simple Object Access Protocol (SOAP) 1.1." W3C Note, 8 May 2000. Available at https://www.w3.org/TR/2000/NOTE-SOAP-20000508/. The SOAP spec as originally published.

**5. Christensen, E., Curbera, F., Meredith, G., and Weerawarana, S.** "Web Services Description Language (WSDL) 1.1." W3C Note, 15 March 2001. Available at https://www.w3.org/TR/2001/NOTE-wsdl-20010315. The WSDL spec.

**6. Box, D.** "A Young Person's Guide to the Simple Object Access Protocol." *MSDN Magazine*, March 2000. The essay that introduced SOAP to a developer audience. Available in MSDN Magazine archives.

**7. Hohpe, G., and Woolf, B.** *Enterprise Integration Patterns: Designing, Building, and Deploying Messaging Solutions*. Addison-Wesley, 2003. The 65-pattern catalog that became the vocabulary of the integration world.

**8. Erl, T.** *Service-Oriented Architecture: Concepts, Technology, and Design*. Prentice Hall, 2005. ISBN 0-13-185858-0. The definitive SOA textbook of the hype era.

**9. Manes, A. T.** "SOA is Dead; Long Live Services." Burton Group blog, 5 January 2009. The original post is archived at various places; search for "Manes SOA is Dead." The cultural turning point.

**10. Yegge, S.** "Stevey's Google Platforms Rant." Originally posted to Google+ on 11 October 2011, briefly public, then accidentally made fully public, then widely archived. The public leak of the Bezos API Mandate. Available in many archives.

**11. SOA Manifesto.** Published 23 October 2009 at www.soa-manifesto.org. Signed by Thomas Erl, Grady Booch, Mark Little, Jim Webber, and about two dozen others. The attempt to reclaim SOA from the vendors.

**12. Fowler, M., and Lewis, J.** "Microservices." Published 25 March 2014 at martinfowler.com. The article that coined (or at least crystallized) the term. The canonical reference.

**13. Newman, S.** *Building Microservices*. O'Reilly Media, 2015 (1st ed.) and 2021 (2nd ed.). The textbook of the microservices era.

**14. Johnson, R.** *Expert One-on-One J2EE Design and Development*. Wrox Press, October 2002. ISBN 0-7645-4385-7. The book whose sample code became the Spring Framework.

**15. Evans, E.** *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley, 2003. Not strictly an SOA book, but the source of the "bounded context" concept that became central to microservice design in the 2010s.

**16. Vernon, V.** *Implementing Domain-Driven Design*. Addison-Wesley, 2013. The practical follow-up to Evans, directly relevant to microservice decomposition.

**17. Kreps, J.** "The Log: What every software engineer should know about real-time data's unifying abstraction." LinkedIn Engineering blog, 16 December 2013. Followed up in Kreps's book *I Heart Logs* (O'Reilly, 2014). The intellectual foundation of Kafka-centric architectures.

**18. Richardson, L.** "Act Three: The Maturity Heuristic." Talk at QCon San Francisco, 2008. The talk that introduced the Richardson Maturity Model. Fowler's 2010 blog post is the usual secondary reference.

**19. CNCF Landscape.** Maintained at landscape.cncf.io. Not a document but a living catalog of over 1,500 cloud-native projects. Useful for understanding the current state of the ecosystem.

**20. Beda, J., Burns, B., and Hightower, K.** *Kubernetes: Up and Running*. O'Reilly, 2017 (1st ed.) and later editions. The introductory Kubernetes textbook by three of its principal evangelists.

---

## Epilogue: What We Learned

Twenty-five years after Roy Fielding's dissertation, twenty years after Dave Winer published XML-RPC, fifteen years after Anne Thomas Manes declared SOA dead, and ten years after Fowler and Lewis crystallized the microservices term, the field has arrived at a quiet consensus. The consensus is not that SOA was wrong. The consensus is that SOA was right, but implemented with the wrong technology, by the wrong people, in the wrong organizational culture, with the wrong incentives.

The architectural principles that Thomas Erl laid out in 2005 — loose coupling, service autonomy, statelessness, discoverability, composability — are the same principles that Sam Newman taught in 2015, and that platform engineering teams teach in 2025. The technologies have changed (SOAP → REST → gRPC; UDDI → Kubernetes Service Discovery; ESB → service mesh; BPEL → Temporal and Camunda; WSDL → OpenAPI) but the architectural insights are the same. The people who lived through both eras often say, wryly, "we were building microservices in 2005 — we just called it SOA, and the tools fought us every step of the way."

The cultural arc is the lesson. Technology adoption, at this scale, is not rational. It is about who controls the standards, who sells the products, what developers find fun, what analysts hype, and what survives the hype cycle to become infrastructure. SOA as a buzzword was captured by enterprise vendors and analyst firms who had a financial interest in making it complicated. Microservices, by contrast, was captured by cloud-native open-source projects (Kubernetes, Istio, Envoy, Kafka, gRPC) and by companies that gave away their tooling as a side effect of running their own services. The difference in incentive structure produced a different outcome, even though the underlying architectural idea was the same.

There is also a poignancy to the story. Many of the SOA-era engineers — the ones who built the WS-Security stacks, the BPEL engines, the ESB products — are still around, many of them still working on integration. They watched their generation of tools get mocked and replaced, and they watched the younger generation rediscover all the same problems (distributed transactions, message ordering, eventual consistency, schema evolution, service discovery) and solve them again, mostly successfully, with newer tools. The emotional texture of those engineers' careers is something like "we were right, and the world ignored us, and now the world is doing what we said, but they're pretending they invented it." This is not an uncommon experience in software, but the SOA era's version of it is particularly sharp because the gap between intent and perception was so wide.

The wheel keeps turning. The microservices backlash is already well underway in 2025. Small teams are rediscovering that operational complexity of a Kubernetes cluster with a service mesh, observability stack, CI/CD pipeline, and a dozen microservices is enormous, and that a well-structured monolith ("modular monolith," "majestic monolith," "the well-structured monolith" — each era relabels it) can deliver most of the value with a fraction of the overhead. DHH at 37signals has been particularly vocal about leaving the cloud and returning to simpler architectures. The pendulum swings.

What does not swing is the underlying insight: systems need clear internal boundaries between components that change for different reasons, communicating through contracts that outlive any individual implementation, loosely coupled so that one component's failure does not cascade into another, and organized around business capabilities rather than technical layers. Whether we call these components "objects" (CORBA, 1991), "components" (COM/DCOM/EJB, 1996-1998), "services" (SOA, 2003), "microservices" (2014), "functions" (Lambda, 2015), or "platform services" (2022) — the underlying architectural principle is the same, and it is the single most durable contribution of the whole SOA-to-microservices arc.

The tooling will change again. The next generation of tools — AI-generated services, edge-deployed functions, WASM-based service components, AI-agent-driven APIs — will bring new vocabulary and new failure modes. The principles will still apply. The engineers who understand the history will recognize the patterns. And somewhere, forty years from now, an engineer will read the Birrell and Nelson 1984 paper and understand that everything old is new again, because the fundamental problems of making one computer talk to another computer reliably and usefully across a fallible network are the same problems they have always been.

The story of SOA is the story of the industry learning, over three decades, to talk to itself about distributed computing. That conversation is not over. It is, in the truest sense, what service-oriented architecture is. The acronym may be dead. The conversation continues.

---

*End of history-origins.md*

*Word count: approximately 20,500 words across roughly 2,400 lines of markdown.*
*Research thread: HISTORY — PNW Research Series, SOA project, tibsfox.com archive.*

---

## Study Guide — SOA History

### Questions

- Why CORBA failed and what REST learned from it.
- How did SOAP give way to REST to GraphQL to gRPC to
  MCP?
- Why is the acronym "SOA" dead while the ideas live?

## DIY — Install an old CORBA ORB

omniORB still runs. Write a hello world. The experience
is pedagogically useful.

## TRY — Read one Bezos API mandate reference

Bezos's 2002 memo mandating service interfaces at Amazon
is legendary and documented in many retrospectives. Read
one.

## Related College Departments

- [**history**](../../../.college/departments/history/DEPARTMENT.md)
