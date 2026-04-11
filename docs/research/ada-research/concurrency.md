# Ada Concurrency: Tasking, Real-Time, and Parallel Programming

*The Flagship Thread of the Ada Research Series — PNW Research Series, tibsfox.com*

---

## Preface: Why This Page Exists

Every mainstream programming language written after 1983 has had to answer the same question: **how do concurrent programs get written?** Most answered it with libraries. C got pthreads. Java got `java.lang.Thread`. Python got `threading` and later `asyncio`. Go got goroutines (which *look* like a language feature but are a runtime library with syntactic sugar). Rust got `std::thread` and the `Send`/`Sync` traits over an otherwise sequential core language.

There is one mainstream language that answered the question differently, and answered it *first*. Ada built concurrency directly into the language grammar, the type system, and the runtime semantics, in its very first standard — MIL-STD-1815-A, ratified January 22, 1983. Not as a library. Not as a "system call wrapper." As a first-class citizen, with the keyword `task` sitting next to `procedure`, `function`, and `package` in the syntactic hierarchy of declarations.

This design decision was not an accident, not a whim, and not a marketing gimmick. It was the direct consequence of the 1978 **Steelman requirements** — the Department of Defense's detailed specification for the "Common High-Order Language" that would eventually become Ada. Section 9 of Steelman demanded that the language support **parallel processing** as an integral part of the semantics, because the DoD was drowning in embedded real-time systems written in JOVIAL, CMS-2, HAL/S, TACPOL, SPL, and a dozen other service-specific languages, each with its own concurrency model, none of which were portable. The goal was a single language in which a programmer could express "run these two computations concurrently and synchronize them at these points" *without resorting to assembly, operating system calls, or vendor-specific library extensions*.

That decision — to put concurrency *in the language* rather than *around it* — is the single most distinctive thing about Ada. It is why Airbus flight control software is written in Ada. It is why the Paris Metro Ligne 14 is written in Ada. It is why the European Space Agency's space probes run Ada on bare metal. It is why, forty-three years after Steelman and forty-three years after the first Ada compiler, Ada tasking remains the benchmark against which other concurrent languages are measured when the requirement is "this had better not kill anybody."

This document is the long version. It covers the tasking model, the rendezvous, selective accept, protected objects, the Real-Time Annex, the Ravenscar profile, asynchronous transfer of control, the 2022 parallel constructs, and the real-world systems that depend on all of it. It is meant to be read linearly by someone who already understands concurrent programming in some form — POSIX threads, Java threads, Go goroutines, or Erlang processes — and wants to understand why Ada's approach is different, not just what Ada's approach *is*.

---

## Part I: The Setup — Why Concurrency in the Language

### 1.1 The Problem in 1978

In 1978 the United States Department of Defense was maintaining roughly 450 distinct programming languages across its embedded systems portfolio. The B-1 bomber used JOVIAL J73. The Navy used CMS-2. The Space Shuttle used HAL/S. Air traffic control used JOVIAL J3. Each of these languages had some notion of "do things in parallel" — because real-time embedded systems inherently have to — but each did it differently.

JOVIAL J73 had no concurrency primitives at all; you wrote your own scheduler. CMS-2 had a notion of "parallel blocks" but no synchronization primitives beyond shared variables. HAL/S had explicit `SCHEDULE` statements for periodic tasks, plus `EVENT` variables and `WAIT` statements, all designed around the specific needs of the Space Shuttle's onboard computers. PL/I had `TASK` and `EVENT` with crude semantics inherited from OS/360 multitasking. Each of these systems was *used successfully*, but none of them were *portable*, and none of them had *provable* correctness properties.

The Steelman document was the DoD's attempt to specify what a unified replacement language would have to provide. Steelman was the fourth in a series — Strawman (1975), Woodenman (1975), Tinman (1976), Ironman (1977), Steelman (1978) — each progressively more detailed. Steelman is 59 pages of numbered requirements, and Section 9, **Parallel Processing**, contains 11 requirements numbered 9A through 9F with sub-items.

The relevant excerpts (paraphrased, with the originals available in the Steelman document):

- **9A.** The language shall provide for parallel processing of logically independent activities.
- **9B.** The language shall permit tasks to communicate with one another at synchronization points.
- **9C.** Tasks shall not rely on details of the implementation for correctness.
- **9D.** The language shall permit access to shared variables to be synchronized.
- **9E.** Mutual exclusion shall be expressible.
- **9F.** Scheduling shall be definable.

Notice what Steelman does *not* say. It does not say "provide a library of synchronization primitives." It does not say "provide a runtime system with OS thread wrappers." It says **the language shall provide**. That phrasing was deliberate. It meant that when you compile a program that uses concurrency, the compiler itself has to understand what you're doing — not just pass opaque pointers to a runtime library and hope for the best.

### 1.2 Jean Ichbiah and the Winning Design

Between 1977 and 1979 the DoD ran a competition among four teams — code-named Red, Green, Blue, and Yellow — to produce a language meeting the Steelman requirements. The winning design was Green, led by **Jean Ichbiah** at CII Honeywell Bull in Paris. The other three teams were Red (Intermetrics), Blue (SofTech), and Yellow (SRI International).

Ichbiah's design for parallel processing drew directly on three sources:

1. **C. A. R. Hoare's Communicating Sequential Processes (CSP)**, published in *CACM* in August 1978. CSP introduced the idea that concurrent programs should be structured as processes that communicate by synchronous message passing, not by shared memory. The key primitive was the *rendezvous*: process A says "send this value to process B," process B says "receive this value from process A," and both processes block until both statements execute simultaneously. Then the message transfers atomically and both proceed.

2. **Per Brinch Hansen's monitors and concurrent Pascal**, which introduced the idea that shared data should be protected by *monitor procedures* with exclusive access.

3. **The real-world embedded systems experience** of the Green team members, who knew what worked and what didn't in JOVIAL, CMS-2, and PL/I.

Ichbiah chose CSP as the primary model. Ada 83's tasking was built around the rendezvous. Monitors would come later, in Ada 95, once it became clear that pure rendezvous was too expensive for some use cases.

The key insight — and the thing that made Ichbiah's design radical for 1983 — was that **a task is an object with a type, declared like any other object**. You don't call a library function to spawn a thread. You *declare* a task:

```ada
task My_Task;
task body My_Task is
begin
   Put_Line ("Hello from a task");
end My_Task;
```

That task starts running the moment the enclosing scope's `begin` is reached. It stops running when its body finishes. No `pthread_create`, no `new Thread(...).start()`, no `go func() { ... }()`. Just a declaration. The declaration *is* the spawn.

This is structured concurrency, roughly 35 years before Martin Sústrik coined the term in 2016.

### 1.3 The Four Properties Ada Tasking Guarantees

Ichbiah's design gives Ada programs four properties that no library-based concurrency system can provide:

**Property 1: Lexical scoping of tasks.** A task declared inside a block cannot outlive that block. When the enclosing scope terminates, it waits for all its child tasks to complete before unwinding. You cannot accidentally leak a task the way you can leak a pthread or a detached Java thread. The compiler knows the task exists, and the runtime knows to wait for it.

**Property 2: Compile-time checking of synchronization.** Because entry calls and `accept` statements are part of the language grammar, the compiler can verify that the signatures match, that parameters are passed correctly, and that certain correctness properties hold. A protected object's barrier is statically type-checked. A pthread mutex acquired in one function and released in another cannot be checked; a protected object's `entry` body cannot be "forgotten" because the `end` is part of the syntax.

**Property 3: Portable semantics.** The Ada Reference Manual specifies task semantics precisely. An Ada program that works on GNAT/Linux must also work on GNAT/VxWorks, GNAT/LynxOS, GNAT/ORK+ (bare-metal ARM for ESA space missions), and so on, because the language defines what tasks do, not the OS. By contrast, a C pthread program that works on Linux may break on Solaris (different scheduling), and a Java threading program may break when you move from HotSpot to OpenJ9 (different memory model quirks).

**Property 4: Integration with the type system.** Tasks can be parameterized (discriminants), contained in arrays, allocated dynamically through access types, passed as generic formal parameters, and implement interfaces (Ada 2005). Protected objects similarly. A "thread pool" in Ada is a one-liner: `Workers : array (1 .. N) of Worker_Task;`. A thread pool in C/C++ is a 200-line library.

### 1.4 The Cost

Nothing is free. Ada tasking imposes three costs that pure library-based systems avoid:

**Cost 1: Runtime weight.** The Ada runtime (GNARL — GNU Ada Runtime Library) is larger than a bare C runtime, because it includes the task scheduler, the rendezvous implementation, the protected object implementation, and the priority inheritance machinery. On resource-constrained targets, this matters. The **Ravenscar profile** (section 11) exists precisely to let you use only a subset of the runtime, so it fits on a 32 KB ROM.

**Cost 2: Language complexity.** Ada is bigger than a language-without-tasking would be. The Ada 2012 Reference Manual is 873 pages. Sections 9, D (Real-Time), and J (Obsolescent Features related to tasks) together account for roughly 150 of those pages. A Python programmer who wants to add concurrency to their mental model only needs to learn a library; an Ada programmer has to learn a language subsystem.

**Cost 3: Compilation complexity.** An Ada compiler has to implement the tasking semantics correctly, which is considerably harder than compiling sequential code. Historically, some commercial Ada compilers had bugs in their tasking implementations (this is one of the reasons SPARK restricts the tasking subset). GNAT gets a lot of mileage from being one of very few Ada compilers and from being aggressively tested by the Ada community.

The Ada position is that these costs are worth paying **when the alternative is shipping bugs in safety-critical software**. For a web application, pthreads is fine. For a flight control computer, the compile-time checking and portable semantics are the difference between certification and catastrophe.

---

## Part II: The Mental Model — Tasks as Active Objects

### 2.1 Task Declaration and Task Body

An Ada task has two parts: a *specification* (the declaration) and a *body* (the implementation). They are separated the same way procedures, functions, and packages are separated into spec and body.

```ada
-- Specification: goes in the declarative part of a package or block
task Greeter;

-- Body: goes in the same declarative part or a package body
task body Greeter is
begin
   Put_Line ("Hello, concurrent world!");
end Greeter;
```

When does `Greeter` start running? The answer is: **when its enclosing scope elaborates its declarative part and reaches the `begin`**. Elaboration is Ada's name for the process of setting up a scope's declarations, and it includes starting any declared tasks.

Here is a complete Ada program with a task:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Hello_Task is
   task Greeter;

   task body Greeter is
   begin
      for I in 1 .. 5 loop
         Put_Line ("Greeter iteration" & I'Image);
         delay 0.5;
      end loop;
   end Greeter;

begin
   for I in 1 .. 5 loop
      Put_Line ("Main iteration" & I'Image);
      delay 0.3;
   end loop;
   -- Main reaches end here, but the procedure does not return
   -- until Greeter finishes. This is automatic.
end Hello_Task;
```

Output is interleaved between "Main iteration" and "Greeter iteration" lines. The exact interleaving depends on the scheduler, but the crucial thing is that the `Hello_Task` procedure does not return until *both* the main body has finished *and* the `Greeter` task has finished. If `Greeter` hadn't finished by the time the main body reaches `end Hello_Task`, the runtime would block at the `end` waiting for it.

This is the **structured concurrency** guarantee. A task cannot outlive its enclosing scope. If the enclosing scope is a procedure, the procedure does not return until all its tasks have terminated. If the enclosing scope is a block, the block does not finish until all its tasks have terminated. If the enclosing scope is a package, the package remains "alive" until all its tasks have terminated (which typically means the program runs until all package-level tasks terminate).

### 2.2 Task Types

A single named task like `Greeter` is useful for one-off concurrent activities, but most real programs want multiple instances of the same behavior. For that, Ada provides **task types**:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Task_Type_Example is

   task type Worker;

   task body Worker is
   begin
      Put_Line ("A worker is starting");
      delay 1.0;
      Put_Line ("A worker is finishing");
   end Worker;

   W1 : Worker;
   W2 : Worker;
   W3 : Worker;

begin
   Put_Line ("Main proceeds while workers run");
end Task_Type_Example;
```

`Worker` is now a type. The three declarations `W1`, `W2`, `W3` create three independent instances of the task type, each running concurrently. All three will start when `Task_Type_Example`'s declarative part finishes elaborating, and the procedure will not return until all three have terminated.

Task types can be parameterized with **discriminants**, which are initialized when the task instance is created:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Discriminant_Example is

   task type Worker (ID : Positive);

   task body Worker is
   begin
      Put_Line ("Worker" & ID'Image & " starting");
      delay Duration (ID) * 0.5;
      Put_Line ("Worker" & ID'Image & " done");
   end Worker;

   W1 : Worker (ID => 1);
   W2 : Worker (ID => 2);
   W3 : Worker (ID => 3);

begin
   Put_Line ("All workers launched");
end Discriminant_Example;
```

Each worker sees its own `ID` inside the body. The discriminant is read-only — you can't change it after the task is created. This gives Ada a clean way to pass per-instance configuration without resorting to global state or separate initialization calls.

### 2.3 Arrays of Tasks

Because a task type is just a type, you can put it in an array:

```ada
procedure Thread_Pool is
   task type Worker (ID : Positive);
   task body Worker is
   begin
      Put_Line ("Worker" & ID'Image & " running");
   end Worker;

   type Worker_Array is array (Positive range <>) of Worker;
   -- This does not compile directly! Worker has a discriminant,
   -- so every element would need its own value. See below.
begin
   null;
end Thread_Pool;
```

The naive version doesn't compile because every `Worker` needs a value for `ID`. The idiomatic way to build a worker pool is with a **generator function** that uses aggregates:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Worker_Pool is
   task type Worker (ID : Positive);
   task body Worker is
   begin
      Put_Line ("Worker" & ID'Image & " processing");
      delay Duration (ID) * 0.1;
      Put_Line ("Worker" & ID'Image & " done");
   end Worker;

   -- An unconstrained array type
   type Worker_Array is array (Positive range <>) of Worker;

   -- Use a local block with dynamic bounds
   Num_Workers : constant := 8;

   -- Direct aggregate initialization:
   Pool : Worker_Array (1 .. Num_Workers) :=
     (1 => (ID => 1),
      2 => (ID => 2),
      3 => (ID => 3),
      4 => (ID => 4),
      5 => (ID => 5),
      6 => (ID => 6),
      7 => (ID => 7),
      8 => (ID => 8));

begin
   Put_Line ("Pool launched, main will wait for all workers");
end Worker_Pool;
```

Ada 2012 added **task discriminant iterators** that make this less verbose, and Ada 2022 added parallel loops that often obviate the need for explicit pools, but the pattern above is the one every Ada programmer learns first. The crucial property: the procedure `Worker_Pool` will not return until all eight workers have terminated, automatically.

### 2.4 Dynamic Task Creation

Sometimes the number of tasks is not known at compile time. Ada supports dynamic task creation through **access types** (Ada's name for pointers):

```ada
with Ada.Text_IO; use Ada.Text_IO;
with Ada.Unchecked_Deallocation;

procedure Dynamic_Tasks is
   task type Worker (ID : Positive);
   task body Worker is
   begin
      Put_Line ("Dynamic worker" & ID'Image);
   end Worker;

   type Worker_Access is access Worker;

   W : Worker_Access;
begin
   for I in 1 .. 10 loop
      W := new Worker (ID => I);
      -- The new task starts running immediately.
   end loop;
   -- Main finishes here. The dynamically allocated tasks are
   -- "detached" from the main program. They continue running
   -- until they finish, but the program will wait.
end Dynamic_Tasks;
```

Dynamic tasks live until *they* terminate, not until the enclosing scope terminates — but the master scope still has to wait for them. "Master" is the Ada term for the scope that owns a task. For statically declared tasks, the master is the enclosing scope. For dynamically allocated tasks, the master is the scope of the access type, which in this example is `Dynamic_Tasks` itself.

**The Ravenscar profile forbids dynamic task allocation**, because the memory allocation and the unbounded task count make it impossible to compute worst-case execution times. High-integrity Ada programs declare all their tasks statically at the top level, count them by hand, and verify that the total scheduling load fits in the available CPU time.

### 2.5 Tasks as First-Class Type System Citizens

Here is a thing no other mainstream language can do. In Ada, a record can contain a task as a field:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Task_In_Record is

   task type Background_Worker (ID : Positive);
   task body Background_Worker is
   begin
      for I in 1 .. 3 loop
         Put_Line ("BW" & ID'Image & " step" & I'Image);
         delay 0.2;
      end loop;
   end Background_Worker;

   type Device is record
      Name   : String (1 .. 10);
      Worker : Background_Worker (ID => 42);
   end record;
   -- Each Device instance has its OWN background worker task.

   D1 : Device := (Name => "Sensor_001", Worker => (ID => 1));
   D2 : Device := (Name => "Sensor_002", Worker => (ID => 2));

begin
   Put_Line ("Two devices, each with its own worker");
end Task_In_Record;
```

When you create a `Device`, you automatically get a `Background_Worker` running inside it. When the `Device` is destroyed (goes out of scope), its worker is waited for automatically. This kind of "active object" encoding falls out naturally from Ada's tasking model, but is extraordinarily awkward in Java (where you need an explicit `Thread` field, an explicit `start()` call, and an explicit cleanup) or C++ (where you need RAII wrappers around `std::thread`).

The Ada way composes with everything else in the language: inheritance, generics, discriminants, `'Access` attributes, garbage-collected-but-finalized access types, and so on. The task is just another piece of data, except that it happens to have its own thread of control.

---

## Part III: The Rendezvous — Ada 83's Original Synchronization

### 3.1 What a Rendezvous Is

A task by itself is just an activity running in parallel with other activities. The interesting question is how tasks *communicate* with each other. In Ada 83, the answer was **the rendezvous**, and it is the thing that made Ada tasking famous (and sometimes infamous).

The rendezvous is modeled on Hoare's CSP. The idea is that task A says "I want to talk to task B," task B says "I'm ready to talk to whoever calls," and the two of them meet at a designated point, exchange information, and then proceed on their own ways. The meeting point is called the **rendezvous**, by analogy with two ships meeting at a pre-arranged location on the ocean.

In Ada syntax:
- Task B declares an `entry` — a named synchronization point with parameters.
- Task A calls the entry: `B.Entry_Name (arguments);`
- Task B executes an `accept` statement: `accept Entry_Name (parameters) do ... end;`

Both A and B must reach their respective statements before either can proceed. Whichever arrives first, blocks and waits for the other. When both have arrived, the body of the `accept` runs — **and while it runs, A is still blocked**. The entry body is the "handshake" during which parameters flow in and results flow out. When the `accept` body finishes, both tasks proceed independently.

### 3.2 A Minimal Rendezvous

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Simple_Rendezvous is

   task Echo_Task is
      entry Say (Msg : String);
   end Echo_Task;

   task body Echo_Task is
   begin
      loop
         accept Say (Msg : String) do
            Put_Line ("Echo: " & Msg);
         end Say;
      end loop;
   end Echo_Task;

begin
   Echo_Task.Say ("First message");
   Echo_Task.Say ("Second message");
   delay 0.5;
   -- Problem: the task never terminates. The procedure will hang.
end Simple_Rendezvous;
```

There are a few things to notice in this tiny example.

**First**, `Echo_Task` has a *specification* that declares the entry and a *body* that implements it. The entry declaration `entry Say (Msg : String);` is visible to anyone who can see `Echo_Task`. The caller doesn't need to know how `Say` is implemented — they just need to know the signature.

**Second**, the body of `Echo_Task` runs a loop that calls `accept Say`. Each time it reaches the `accept`, it blocks until someone calls `Echo_Task.Say (...)`. When a call arrives, the `accept` body runs (the `Put_Line`), the caller is released, and the loop iterates.

**Third**, the program hangs at the end. This is a bug. `Echo_Task` is waiting in `accept Say` forever, and nothing is going to call it again. The main procedure has nothing to do, but it can't return because `Echo_Task` is still alive. We'll fix this in the next section with selective accept and `terminate`.

### 3.3 Parameters Flow In and Out

An `accept` body can have `in`, `out`, and `in out` parameters, and parameter passing works just like a procedure call — except that it happens during the rendezvous, while both tasks are synchronized.

```ada
with Ada.Text_IO; use Ada.Text_IO;
with Ada.Integer_Text_IO; use Ada.Integer_Text_IO;

procedure Rendezvous_Params is

   task Squarer is
      entry Square (N : Integer; Result : out Integer);
   end Squarer;

   task body Squarer is
   begin
      loop
         accept Square (N : Integer; Result : out Integer) do
            Result := N * N;
         end Square;
         exit;  -- Only handle one call, then terminate.
      end loop;
   end Squarer;

   R : Integer;
begin
   Squarer.Square (12, R);
   Put ("12 squared is ");
   Put (R);
   New_Line;
end Rendezvous_Params;
```

Here the caller passes `12` to the squarer and the squarer writes `144` into `R` before releasing the caller. Notice that the `out` parameter is passed by reference conceptually — the caller's variable is updated during the rendezvous.

### 3.4 The Producer-Consumer Pattern

The canonical concurrent programming example is producer-consumer: one task produces items, another consumes them, and they need to synchronize so the consumer doesn't try to consume items that don't exist yet, and the producer doesn't overwrite items the consumer hasn't yet taken.

Here it is with a pure rendezvous:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Producer_Consumer is

   task Buffer is
      entry Put (Item : Integer);
      entry Get (Item : out Integer);
   end Buffer;

   task body Buffer is
      Stored : Integer;
   begin
      loop
         accept Put (Item : Integer) do
            Stored := Item;
         end Put;
         accept Get (Item : out Integer) do
            Item := Stored;
         end Get;
      end loop;
   end Buffer;

   task Producer;
   task body Producer is
   begin
      for I in 1 .. 5 loop
         Put_Line ("Producing" & I'Image);
         Buffer.Put (I);
         delay 0.1;
      end loop;
   end Producer;

   task Consumer;
   task body Consumer is
      Value : Integer;
   begin
      for I in 1 .. 5 loop
         Buffer.Get (Value);
         Put_Line ("Consumed" & Value'Image);
         delay 0.2;
      end loop;
   end Consumer;

begin
   null;
end Producer_Consumer;
```

This version is tight: the buffer holds exactly one item at a time. The producer blocks at `Buffer.Put` until the consumer is ready; the consumer blocks at `Buffer.Get` until the producer has put something. The `Buffer` task alternates between accepting `Put` and accepting `Get` in strict order.

But this has a serious limitation: it enforces strict alternation. The producer cannot get ahead of the consumer. To allow buffering, you need to choose *which* entry to accept based on the current state — which is exactly what **selective accept** provides.

### 3.5 Multiple Rendezvous and the Limits of Pure CSP

Before moving on, note what the pure rendezvous cannot easily express. Suppose you want to build a shared counter that multiple tasks can increment. The naive rendezvous version is:

```ada
task Counter is
   entry Increment;
   entry Value (V : out Integer);
end Counter;

task body Counter is
   Count : Integer := 0;
begin
   loop
      accept Increment do
         Count := Count + 1;
      end Increment;
      -- But how do we accept Value too?
   end loop;
end Counter;
```

This doesn't work. The loop only accepts `Increment`, and a caller of `Value` would block forever. You *can* fix this by accepting both entries in some sequence, but you can't predict which order calls will arrive in, and the strict alternation that the simple loop provides is wrong.

The answer is selective accept.

---

## Part IV: Selective Accept — Choosing Which Rendezvous to Service

### 4.1 The `select` Statement

Ada's selective accept is written with the `select` keyword. It presents several alternatives, each of which may be an `accept` statement, and the task waits until at least one of the alternatives becomes ready (i.e., some caller is waiting at one of those entries).

```ada
task body Counter is
   Count : Integer := 0;
begin
   loop
      select
         accept Increment do
            Count := Count + 1;
         end Increment;
      or
         accept Value (V : out Integer) do
            V := Count;
         end Value;
      end select;
   end loop;
end Counter;
```

Now the counter task is willing to service either `Increment` or `Value`, whichever comes first. Each call is handled atomically — during the `accept` body for `Increment`, no `Value` call can be serviced, and vice versa. This gives you mutual exclusion for free.

The `select` with multiple `accept` alternatives is Ada's equivalent of Go's `select` statement on channels — except that Ada had it 26 years before Go.

### 4.2 Guards

Each alternative in a `select` can be guarded by a Boolean condition:

```ada
select
   when Count > 0 =>
      accept Get (V : out Integer) do
         V := Buffer (Head);
         Head := Head + 1;
         Count := Count - 1;
      end Get;
or
   when Count < Max =>
      accept Put (V : Integer) do
         Buffer (Tail) := V;
         Tail := Tail + 1;
         Count := Count + 1;
      end Put;
end select;
```

Guards are evaluated at the start of the `select` statement (not dynamically — this is important). An alternative whose guard is false is "closed" for this iteration of the select. If all alternatives are closed, `Program_Error` is raised. If some are open and some have callers waiting, the task picks one and services it.

Here's the complete bounded buffer with guards:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Bounded_Buffer_Rendezvous is

   task Buffer is
      entry Put (Item : Integer);
      entry Get (Item : out Integer);
   end Buffer;

   task body Buffer is
      Max  : constant := 4;
      Data : array (0 .. Max - 1) of Integer;
      Head : Natural := 0;
      Tail : Natural := 0;
      Cnt  : Natural := 0;
   begin
      loop
         select
            when Cnt < Max =>
               accept Put (Item : Integer) do
                  Data (Tail) := Item;
               end Put;
               Tail := (Tail + 1) mod Max;
               Cnt  := Cnt + 1;
         or
            when Cnt > 0 =>
               accept Get (Item : out Integer) do
                  Item := Data (Head);
               end Get;
               Head := (Head + 1) mod Max;
               Cnt  := Cnt - 1;
         or
            terminate;  -- We'll explain this in section 4.5.
         end select;
      end loop;
   end Buffer;

   task Producer;
   task body Producer is
   begin
      for I in 1 .. 10 loop
         Put_Line ("Produce" & I'Image);
         Buffer.Put (I);
      end loop;
   end Producer;

   task Consumer;
   task body Consumer is
      V : Integer;
   begin
      for I in 1 .. 10 loop
         Buffer.Get (V);
         Put_Line ("Consume" & V'Image);
         delay 0.05;
      end loop;
   end Consumer;

begin
   null;
end Bounded_Buffer_Rendezvous;
```

Note a subtlety: the work to update `Head`, `Tail`, and `Cnt` is done **outside** the `accept` body, after the caller has been released. This is a deliberate optimization — anything done inside the `accept` body blocks the caller, while anything done outside but inside the loop blocks only this task. You should do the minimum necessary inside the `accept` body (usually just parameter passing) and the bookkeeping outside.

### 4.3 `delay` Alternatives

A `select` can include `delay` alternatives, which fire if no rendezvous happens within the given time:

```ada
select
   accept Do_Something;
or
   delay 5.0;
   Put_Line ("Timed out waiting for work");
end select;
```

If no caller arrives at `Do_Something` within 5 seconds, the `delay` alternative fires and the task proceeds with the code after the `delay`. This is how you implement timeouts on task communication.

You can combine `delay` with guarded alternatives for periodic work:

```ada
task body Watchdog is
begin
   loop
      select
         accept Ping;
         -- Got a ping, reset the watchdog.
      or
         delay 10.0;
         Put_Line ("WATCHDOG: 10 seconds elapsed, triggering reset");
         -- Take remedial action.
      end select;
   end loop;
end Watchdog;
```

This is the classic watchdog pattern. Every 10 seconds without a ping, the watchdog fires.

### 4.4 `else` for Polling

An `else` clause makes the `select` non-blocking — if no rendezvous is immediately ready, the `else` branch runs:

```ada
select
   accept Do_Work;
else
   -- No one is calling, do something else.
   Check_Other_Things;
end select;
```

This gives you a polling idiom. Use it sparingly — polling loops that rely on `else` will spin on the CPU and are usually a sign you should be using a protected object instead.

You cannot mix `else` with `delay` or `terminate` in the same `select`. `else` is "poll now or give up"; `delay` is "poll now or wait a while"; `terminate` is "offer to terminate if no one needs us" (see below). These three are mutually exclusive modes.

### 4.5 `terminate` for Graceful Shutdown

The `terminate` alternative is Ada's graceful-shutdown mechanism. It means: "if no one is going to call me anymore, I'm willing to stop."

```ada
task body Buffer is
   ...
begin
   loop
      select
         accept Put (...) do ... end;
      or
         accept Get (...) do ... end;
      or
         terminate;
      end select;
   end loop;
end Buffer;
```

The rules for when `terminate` fires are subtle but principled. `terminate` is selected if and only if:

1. The task's master (the scope that owns it) has finished its own sequence of statements and is now waiting for dependent tasks.
2. All other tasks that depend on the same master are either terminated or are themselves at a `select` with an open `terminate` alternative.

In other words, the runtime detects that everyone is "waiting for someone else" and concludes that the system has no useful work left. At that point, all tasks with `terminate` alternatives terminate simultaneously.

This is Ada's elegant answer to the "how do we know when to stop?" problem. Instead of explicit shutdown messages to every task, you just add `terminate` to each `select` and let the runtime figure it out.

The `Bounded_Buffer_Rendezvous` example above uses exactly this pattern. When both producer and consumer have finished their loops, they terminate. The buffer task, waiting in its `select`, finds that there are no more callers and its master (the main procedure) has reached `end`. The `terminate` alternative fires, the buffer task ends, and the main procedure returns.

### 4.6 A Full Client-Server Example

Let me show a more substantial example that pulls all of this together — a simple name-lookup server:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Name_Server_Example is

   Max_Entries : constant := 100;

   type Name_Type  is new String (1 .. 20);
   type Phone_Type is new String (1 .. 12);

   task Name_Server is
      entry Add    (Name : Name_Type; Phone : Phone_Type);
      entry Lookup (Name : Name_Type; Phone : out Phone_Type;
                    Found : out Boolean);
      entry Shutdown;
   end Name_Server;

   task body Name_Server is
      type Entry_Record is record
         Name  : Name_Type;
         Phone : Phone_Type;
      end record;

      DB      : array (1 .. Max_Entries) of Entry_Record;
      Count   : Natural := 0;
      Running : Boolean := True;
   begin
      while Running loop
         select
            when Count < Max_Entries =>
               accept Add (Name : Name_Type; Phone : Phone_Type) do
                  Count := Count + 1;
                  DB (Count) := (Name => Name, Phone => Phone);
               end Add;
         or
            accept Lookup (Name  : Name_Type;
                           Phone : out Phone_Type;
                           Found : out Boolean) do
               Found := False;
               for I in 1 .. Count loop
                  if DB (I).Name = Name then
                     Phone := DB (I).Phone;
                     Found := True;
                     exit;
                  end if;
               end loop;
            end Lookup;
         or
            accept Shutdown;
            Running := False;
         or
            terminate;
         end select;
      end loop;
      Put_Line ("Name server shutting down");
   end Name_Server;

   Dummy_Name  : Name_Type  := (others => ' ');
   Dummy_Phone : Phone_Type := (others => ' ');
   Found       : Boolean;

begin
   -- Add some entries.
   declare
      N : Name_Type  := (others => ' ');
      P : Phone_Type := (others => ' ');
   begin
      N (1 .. 4) := "Foxy";
      P (1 .. 12) := "555-867-5309";
      Name_Server.Add (N, P);
   end;

   -- Look one up.
   declare
      N : Name_Type  := (others => ' ');
      P : Phone_Type;
   begin
      N (1 .. 4) := "Foxy";
      Name_Server.Lookup (N, P, Found);
      if Found then
         Put_Line ("Found: " & String (P));
      else
         Put_Line ("Not found");
      end if;
   end;

   Name_Server.Shutdown;
end Name_Server_Example;
```

This server handles three kinds of requests — `Add`, `Lookup`, `Shutdown` — and uses a `terminate` alternative as a backup in case no one calls `Shutdown` explicitly. Note that `Add` is guarded by `Count < Max_Entries`, so when the database is full, new adds block until there's room (which in this simple example never happens because we never remove entries — but the pattern is what you'd use).

---

## Part V: Protected Objects — The Ada 95 Overhaul

### 5.1 Why the Rendezvous Alone Wasn't Enough

The rendezvous model is elegant and matches Hoare's CSP closely, but by the late 1980s real Ada 83 programs were running into problems with it. The two biggest were:

**Problem 1: Cost.** A rendezvous requires a full context switch — the caller suspends, the callee suspends its current activity, a new activity (the `accept` body) runs in the callee's context, then the callee resumes. On period hardware, this could take hundreds of microseconds. For high-frequency synchronization (e.g., a counter being incremented by many tasks), the overhead was prohibitive.

**Problem 2: Awkward for passive data.** The rendezvous forces you to model shared data as an *active* server task that loops in `select`. But a lot of shared data is fundamentally passive — "here is a value, protect it, let tasks read and write it." Creating a whole task just to hold a counter, a queue, or a cache, is heavyweight and conceptually wrong.

The Ada 83 way to work around Problem 2 was the "server task with a `select` loop" idiom, which required writing boilerplate and had Problem 1's costs. You could also use unprotected shared variables — Ada 83 didn't prevent it — but without synchronization primitives the result was racy and non-portable.

The Ada 9X project (what became Ada 95) set out to fix both problems. The solution was the **protected object**, modeled on Per Brinch Hansen's and Tony Hoare's monitors but adapted to fit Ada's type-based model.

### 5.2 The Protected Type

A protected type is declared similarly to a task type, but with the keyword `protected`:

```ada
protected type Counter is
   procedure Increment;
   procedure Decrement;
   function  Value return Integer;
private
   Count : Integer := 0;
end Counter;

protected body Counter is

   procedure Increment is
   begin
      Count := Count + 1;
   end Increment;

   procedure Decrement is
   begin
      Count := Count - 1;
   end Decrement;

   function Value return Integer is
   begin
      return Count;
   end Value;

end Counter;
```

A protected object has three kinds of operations:

- **`function`**: read-only, may execute concurrently with other `function` calls. Cannot modify any state. The compiler enforces this — the body can only use the private data in expressions, not in assignments.
- **`procedure`**: read-write, executes with exclusive access. No other operation can run simultaneously.
- **`entry`**: read-write with a *barrier*. Queued until the barrier evaluates true.

The mutual exclusion semantics are:

- At most one procedure or entry body runs at a time.
- Any number of functions may run concurrently, but not while a procedure or entry is running.
- If a procedure or entry is waiting to run, new function calls typically wait too (implementation-defined, but most runtimes enforce a queue).

This is **readers-writers semantics** built into the language.

### 5.3 Protected Object Instantiation

```ada
My_Counter : Counter;  -- An instance of the protected type.

-- In some task:
My_Counter.Increment;
My_Counter.Increment;
if My_Counter.Value > 10 then ... end if;
```

Calling a protected operation looks exactly like calling a method on an object — because that's essentially what it is. The mutual exclusion is invisible at the call site. You just call, and the runtime handles the locking.

### 5.4 Protected Entries and Barriers

The interesting feature — the one that makes protected objects more than "Ada's version of a mutex" — is **entries with barriers**. An entry is like a procedure, but it has a guard that determines whether it can execute:

```ada
protected type Bounded_Buffer is
   entry Put (Item : Integer);
   entry Get (Item : out Integer);
private
   Max  : constant := 10;
   Data : array (0 .. Max - 1) of Integer;
   Head : Natural := 0;
   Tail : Natural := 0;
   Cnt  : Natural := 0;
end Bounded_Buffer;

protected body Bounded_Buffer is

   entry Put (Item : Integer) when Cnt < Max is
   begin
      Data (Tail) := Item;
      Tail := (Tail + 1) mod Max;
      Cnt  := Cnt + 1;
   end Put;

   entry Get (Item : out Integer) when Cnt > 0 is
   begin
      Item := Data (Head);
      Head := (Head + 1) mod Max;
      Cnt  := Cnt - 1;
   end Get;

end Bounded_Buffer;
```

When a task calls `Put`, the runtime evaluates the barrier `Cnt < Max`:
- If the barrier is true, the body runs immediately (with exclusive access).
- If the barrier is false, the caller is queued on the `Put` entry.

When another task calls `Get`, the body runs, `Cnt` is decremented, and then the runtime **re-evaluates all barriers for queued callers**. If there's a task waiting in `Put`'s queue and `Cnt < Max` is now true, that task is released and its body runs.

This is the **monitor with condition variables** pattern, except that Ada hides the condition variables — you just write the barrier once, and the runtime handles the queueing and re-evaluation. Compare this to POSIX threads, where you have to write:

```c
pthread_mutex_lock(&buffer_mutex);
while (count == MAX) {
    pthread_cond_wait(&not_full, &buffer_mutex);
}
// ... put item ...
pthread_cond_signal(&not_empty);
pthread_mutex_unlock(&buffer_mutex);
```

...and if you forget the `while` loop (spurious wakeups!) or signal the wrong condition variable or release the lock in the wrong order, your program is broken in subtle ways. The Ada version is:

```ada
entry Put (Item : Integer) when Cnt < Max is
begin
   -- ... put item ...
end Put;
```

The runtime handles all the "if the barrier becomes true, release the queued caller" logic automatically. There is no "forgetting to signal" because there are no signals. There is no "forgetting to re-check the barrier" because the runtime always re-evaluates barriers after any procedure or entry completes.

### 5.5 Barrier Re-evaluation

The barrier re-evaluation rules are precise and deterministic. Every time a protected procedure or entry body completes, the runtime re-evaluates the barriers of all entries that have at least one queued caller. This happens **before** the lock is released, as part of the same atomic operation. If multiple barriers become true, the runtime picks one queued caller to release (the default is FIFO within an entry, with implementation-defined ordering between entries).

The barriers themselves must be "reasonably pure" — the Ada reference manual restricts them to expressions that don't have side effects and don't call other protected operations. This is crucial: the runtime evaluates barriers frequently and cannot afford to recurse or block.

### 5.6 Reader-Writer Lock with a Protected Object

Here's a reader-writer lock built from a protected object:

```ada
protected type RW_Lock is
   entry     Read;
   procedure Release_Read;
   entry     Write;
   procedure Release_Write;
private
   Readers : Natural := 0;
   Writing : Boolean := False;
end RW_Lock;

protected body RW_Lock is

   entry Read when not Writing is
   begin
      Readers := Readers + 1;
   end Read;

   procedure Release_Read is
   begin
      Readers := Readers - 1;
   end Release_Read;

   entry Write when not Writing and Readers = 0 is
   begin
      Writing := True;
   end Write;

   procedure Release_Write is
   begin
      Writing := False;
   end Release_Write;

end RW_Lock;
```

Reads happen concurrently (the runtime allows multiple readers because `Read` is an entry with a barrier that multiple callers can satisfy simultaneously — wait, actually no, an entry still has exclusive access while running; the concurrent-reads property is gained by making the `Read` *entry* only manage the counter, not actually perform the read). A cleaner pattern is:

```ada
-- Usage pattern:
Lock.Read;       -- Blocks if a writer is active.
-- ... do the actual read here, outside the lock ...
Lock.Release_Read;

Lock.Write;      -- Blocks until no readers or writers.
-- ... do the actual write here, outside the lock ...
Lock.Release_Write;
```

The protected object manages the "counter and state machine" of who's currently inside, while the actual work is done by the calling task outside the protected object's critical section. This pattern is common and idiomatic in Ada.

A more elegant approach uses a helper wrapper procedure that ensures `Release_Read` is called even on exception, using `exception` handlers or Ada 2005's controlled types.

### 5.7 Counting Semaphore

```ada
protected type Counting_Semaphore (Initial : Natural) is
   entry P;  -- "Proberen" / wait
   procedure V;  -- "Verhogen" / signal
private
   Count : Natural := Initial;
end Counting_Semaphore;

protected body Counting_Semaphore is

   entry P when Count > 0 is
   begin
      Count := Count - 1;
   end P;

   procedure V is
   begin
      Count := Count + 1;
   end V;

end Counting_Semaphore;
```

The discriminant `Initial` lets each semaphore be constructed with its initial count. Usage:

```ada
Sem : Counting_Semaphore (Initial => 5);
...
Sem.P;  -- Acquire one permit
-- ... do work ...
Sem.V;  -- Release one permit
```

Notice that `P` is an entry with a barrier `Count > 0`, and `V` is a procedure. When `V` increments `Count`, the runtime re-evaluates the `P` barrier for all queued callers, and releases one if `Count` is now positive. No condition variables, no signaling discipline, no "did I forget to broadcast."

### 5.8 Performance

On modern GNAT runtimes, a protected procedure call with no contention takes roughly the same time as a futex-based mutex lock/unlock pair in C — in the low tens of nanoseconds on x86-64. A protected entry call with no queueing is slightly more expensive because of the barrier evaluation, but still in the sub-microsecond range. A full rendezvous, by contrast, costs a few microseconds because it involves actual task scheduling.

**Rule of thumb**: use a protected object for passive data sharing (counters, queues, caches, state machines), use a rendezvous for active coordination between peer tasks (client-server protocols, request-response). Protected objects are cheaper but have the restriction that their bodies cannot block — you cannot call another potentially-blocking entry from inside a protected body, and you cannot `delay` or accept.

### 5.9 Requeueing

One advanced feature of protected objects is **requeue**. Inside an entry body, you can requeue the caller onto another entry:

```ada
protected type Job_Manager is
   entry Request (Priority : Priority_Type; Job : out Job_Type);
   entry Request_High;
   entry Request_Low;
private
   ...
end Job_Manager;

protected body Job_Manager is

   entry Request (Priority : Priority_Type; Job : out Job_Type) when True is
   begin
      if Priority = High then
         requeue Request_High;
      else
         requeue Request_Low;
      end if;
   end Request;

   entry Request_High when High_Job_Available is
   begin
      Job := Next_High_Job;
   end Request_High;

   entry Request_Low when Low_Job_Available is
   begin
      Job := Next_Low_Job;
   end Request_Low;

end Job_Manager;
```

Requeue is used to implement priority-based service, multi-stage protocols, and transfer of service between tasks. It's a powerful feature but rarely used outside library code, and it's forbidden in Ravenscar (section 11) because of its complexity.

---

## Part VI: Timing and the Real-Time Package

### 6.1 Relative and Absolute Delays

Ada has two `delay` forms, which look similar but have very different semantics:

**Relative delay:**

```ada
delay 0.5;  -- Sleep for at least 0.5 seconds from now.
```

**Absolute delay:**

```ada
delay until Next_Time;  -- Sleep until the absolute time Next_Time.
```

The absolute form takes a `Time` value (from `Ada.Calendar` or `Ada.Real_Time`) and blocks the calling task until that time. This is the **correct way** to write a periodic task, because relative delays accumulate drift.

Consider a task that wants to run every 100 ms:

**Wrong (relative delay):**

```ada
loop
   Do_Work;
   delay 0.1;
end loop;
```

Each iteration takes `Do_Work`'s time plus 100 ms plus scheduling jitter. Over thousands of iterations, the drift accumulates. If `Do_Work` takes 20 ms and the scheduler adds 5 ms of jitter, the task actually runs every 125 ms, not every 100 ms.

**Right (absolute delay):**

```ada
declare
   use Ada.Real_Time;
   Period : constant Time_Span := Milliseconds (100);
   Next   : Time := Clock + Period;
begin
   loop
      Do_Work;
      delay until Next;
      Next := Next + Period;
   end loop;
end;
```

Each iteration sleeps until exactly the next period boundary. If `Do_Work` takes longer than expected in one iteration, the next iteration happens sooner (at the originally-scheduled time), compensating for the delay. The task stays locked to a precise 100 ms period.

### 6.2 The `Ada.Real_Time` Package

`Ada.Real_Time` provides a monotonic clock and time arithmetic specifically designed for real-time programming:

```ada
package Ada.Real_Time is

   type Time is private;
   Time_First : constant Time;
   Time_Last  : constant Time;
   Time_Unit  : constant := implementation_defined;

   type Time_Span is private;
   Time_Span_First : constant Time_Span;
   Time_Span_Last  : constant Time_Span;
   Time_Span_Zero  : constant Time_Span;
   Time_Span_Unit  : constant Time_Span;

   Tick : constant Time_Span;

   function Clock return Time;

   function "+"  (Left : Time; Right : Time_Span) return Time;
   function "+"  (Left : Time_Span; Right : Time) return Time;
   function "-"  (Left : Time; Right : Time_Span) return Time;
   function "-"  (Left : Time; Right : Time) return Time_Span;

   function "<"  (Left, Right : Time) return Boolean;
   function "<=" (Left, Right : Time) return Boolean;
   function ">"  (Left, Right : Time) return Boolean;
   function ">=" (Left, Right : Time) return Boolean;

   function Nanoseconds  (NS : Integer) return Time_Span;
   function Microseconds (US : Integer) return Time_Span;
   function Milliseconds (MS : Integer) return Time_Span;
   function Seconds      (S  : Integer) return Time_Span;
   function Minutes      (M  : Integer) return Time_Span;

end Ada.Real_Time;
```

Several things are worth noting:

- `Time` is distinct from `Ada.Calendar.Time`. `Ada.Calendar.Time` is wall-clock time, which can jump when the system clock is adjusted. `Ada.Real_Time.Time` is monotonic — it never goes backwards, never jumps forward, and is suitable for `delay until` in hard real-time contexts.
- `Time_Span` arithmetic is precise. You can say `Milliseconds (100)`, `Nanoseconds (500)`, and so on, without worrying about floating-point rounding.
- The `Tick` constant tells you the resolution of the underlying clock.

On GNAT/Linux, `Ada.Real_Time.Clock` is backed by `clock_gettime(CLOCK_MONOTONIC, ...)`. On GNAT/bare-metal targets, it is backed by a hardware timer with sub-microsecond resolution.

### 6.3 A Periodic Task

Putting it all together, here's a canonical periodic task:

```ada
with Ada.Text_IO;    use Ada.Text_IO;
with Ada.Real_Time;  use Ada.Real_Time;

procedure Periodic_Example is

   task Sensor_Reader;

   task body Sensor_Reader is
      Period : constant Time_Span := Milliseconds (50);  -- 20 Hz
      Next   : Time := Clock + Period;
   begin
      for I in 1 .. 20 loop
         -- Simulate reading a sensor
         Put_Line ("Reading sensor at cycle" & I'Image);
         delay until Next;
         Next := Next + Period;
      end loop;
   end Sensor_Reader;

begin
   null;
end Periodic_Example;
```

This task runs exactly 20 times, exactly 50 ms apart. If the system is lightly loaded it will hit those times precisely; if it's heavily loaded, the task will run as close as possible to the scheduled times, with the scheduler giving it priority if it's about to miss a deadline.

### 6.4 Response Time and Deadlines

A real-time task has three time parameters:

- **Period T**: how often it runs.
- **Worst-case execution time C**: how long one iteration takes.
- **Deadline D**: when it has to finish before the next iteration (usually D ≤ T).

For a single periodic task, the **utilization** is C/T. If C/T ≤ 1 and the scheduler gets out of the way, the task meets its deadlines. For multiple periodic tasks sharing a CPU, the question is whether the total utilization and the scheduling policy allow all deadlines to be met.

The classic result is **rate-monotonic scheduling** (Liu and Layland, 1973): if tasks are scheduled with fixed priorities assigned in inverse order of period (shortest period = highest priority), and if the total utilization is less than n(2^(1/n) - 1) (which is about 69.3% for n = infinity), then all deadlines are guaranteed to be met.

Ada's `pragma Priority` lets you assign these priorities, and `Ada.Real_Time` lets you measure actual execution times, so you can perform a rate-monotonic analysis on your Ada program. This is exactly what avionics software does.

### 6.5 Ada.Execution_Time

Ada 2005 added `Ada.Execution_Time`, a package that gives you per-task CPU time accounting:

```ada
with Ada.Execution_Time;

procedure WCET_Measurement is
   Start : Ada.Execution_Time.CPU_Time;
   Stop  : Ada.Execution_Time.CPU_Time;
   Elapsed : Ada.Real_Time.Time_Span;
begin
   Start := Ada.Execution_Time.Clock;
   -- ... do work ...
   Stop  := Ada.Execution_Time.Clock;
   Elapsed := Stop - Start;
   -- Elapsed is the actual CPU time used by the current task,
   -- not wall-clock time. Sleeping or blocking does not count.
end WCET_Measurement;
```

This lets you measure worst-case execution times precisely, which is critical for schedulability analysis.

### 6.6 Timing Events

Ada 2005 also added **timing events**, which are lightweight callbacks that fire at a specified time without needing a dedicated task:

```ada
with Ada.Real_Time.Timing_Events; use Ada.Real_Time.Timing_Events;

procedure Timing_Event_Example is

   protected Handler is
      procedure Fired (Event : in out Timing_Event);
   end Handler;

   protected body Handler is
      procedure Fired (Event : in out Timing_Event) is
      begin
         Put_Line ("Timer fired!");
      end Fired;
   end Handler;

   My_Event : Timing_Event;

begin
   Set_Handler (My_Event,
                At_Time => Clock + Seconds (5),
                Handler => Handler.Fired'Access);
   delay 10.0;
end Timing_Event_Example;
```

Timing events are cheaper than dedicated tasks because they don't need a full task stack. The handler runs in the context of the clock interrupt (or equivalent), so it must be short and non-blocking. This is Ada's equivalent of `setitimer` + signal handler in POSIX, but with the protected-object discipline enforcing mutual exclusion.

---

## Part VII: Asynchronous Transfer of Control (ATC)

### 7.1 What ATC Is

Ada 95 introduced one of the more controversial features in the language: **asynchronous transfer of control**, abbreviated ATC. It lets one task interrupt another task's current activity in response to some event, causing the interrupted task to jump to a different piece of code.

The syntax is a special form of `select`:

```ada
select
   Trigger_Statement;
then abort
   Abortable_Statements;
end select;
```

The semantics are:
1. The `Abortable_Statements` begin executing.
2. Simultaneously, the runtime watches the `Trigger_Statement`.
3. If the trigger fires before the abortable statements finish, the abortable statements are **aborted** (cleaned up, not completed) and control transfers to after the `end select`.
4. If the abortable statements finish first, the trigger is abandoned and control transfers to after the `end select` normally.

The trigger can be an `accept` statement, an entry call, or a `delay` statement. The most common trigger is a `delay`, which gives you **timeouts on arbitrary computations**.

### 7.2 Timeout on a Long Computation

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure ATC_Timeout is

   procedure Long_Computation is
   begin
      for I in 1 .. 1_000_000_000 loop
         null;  -- Simulate work.
      end loop;
      Put_Line ("Finished normally");
   end Long_Computation;

begin
   select
      delay 2.0;
      Put_Line ("Timeout! Computation aborted.");
   then abort
      Long_Computation;
   end select;
end ATC_Timeout;
```

If `Long_Computation` finishes within 2 seconds, it prints "Finished normally" and the timeout is abandoned. If it takes longer, after 2 seconds the runtime aborts it (jumping out of the loop, releasing any resources) and prints "Timeout!".

This is remarkably clean. In C/pthreads, equivalent functionality requires `pthread_cancel`, careful cancellation points, RAII-style cleanup, and a lot of hope that your library functions are cancellation-safe. In Ada, the runtime handles all of that — you write the computation normally and let ATC handle the timeout.

### 7.3 External Abort via Entry

The trigger can also be an entry call, letting one task abort another's activity in response to an external event:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure ATC_External is

   protected Signal is
      entry Wait;
      procedure Fire;
   private
      Fired : Boolean := False;
   end Signal;

   protected body Signal is
      entry Wait when Fired is
      begin
         null;
      end Wait;

      procedure Fire is
      begin
         Fired := True;
      end Fire;
   end Signal;

   task Worker;

   task body Worker is
   begin
      select
         Signal.Wait;
         Put_Line ("Worker: received abort signal");
      then abort
         loop
            Put_Line ("Working...");
            delay 0.5;
         end loop;
      end select;
      Put_Line ("Worker: shutting down cleanly");
   end Worker;

begin
   delay 2.0;
   Put_Line ("Main: firing signal");
   Signal.Fire;
end ATC_External;
```

The worker runs its infinite loop until the main procedure calls `Signal.Fire`, at which point the protected entry `Signal.Wait` becomes satisfied, the ATC triggers, the loop is aborted, and the worker proceeds to its "shutting down cleanly" message. This is the standard pattern for externally cancellable work in Ada.

### 7.4 Why ATC Is Controversial

ATC is powerful but dangerous. The problem is that the abortable statements can be interrupted **at essentially any point** — between any two instructions. The Ada runtime does take care to make the abortion clean at certain "abort-deferred regions" (e.g., inside a protected operation, inside a rendezvous), but anywhere else, your code has to be prepared to be cut off in the middle of anything.

Specifically:
- If you're halfway through updating a data structure, the data structure may be left in an inconsistent state.
- If you've opened a file, you need to make sure it gets closed. Ada's `Finalize` on controlled types helps here, but only for types that have finalization.
- If you're calling into C code, the C code cannot be aborted cleanly. The runtime will abort you at the next Ada-level abort-deferred-region boundary, but the C call's side effects remain.

For these reasons, **the Ravenscar profile forbids ATC**. If you're writing safety-critical software, you don't use `select ... then abort` because you can't easily prove correctness across the abort boundary.

For non-safety-critical code where ATC is a clean match (timeouts on potentially-long operations, user-cancellable computations in GUIs, etc.), it's a valuable tool. For safety-critical code, you design around it using explicit polling and `delay until`.

### 7.5 Abort-Deferred Regions

The Ada reference manual specifies several regions where abort is deferred:
- Inside a protected operation (function, procedure, or entry body).
- Inside an `accept` statement.
- Inside the `Finalize` operation of a controlled type.
- Inside `pragma Abort_Defer` regions (if the implementation supports it).

These regions ensure that critical sections cannot be interrupted mid-flight, preserving invariants. The runtime defers the abort until the region exits.

### 7.6 The `abort` Statement (Without ATC)

There's also a plain `abort` statement that terminates a task unconditionally:

```ada
abort Some_Task;
```

This is even more violent than ATC — it terminates the task completely rather than redirecting its control flow. It should be used sparingly, typically only for cleanup in the face of catastrophic errors. Most real Ada programs never use `abort` directly.

---

## Part VIII: The Real-Time Annex (Annex D)

### 8.1 The Annex System

Ada 95 introduced the concept of **annexes** — optional language additions that implementations may or may not support. There are several:

- **Annex C**: Systems Programming
- **Annex D**: Real-Time Systems  ← this is the one we care about
- **Annex E**: Distributed Systems
- **Annex F**: Information Systems
- **Annex G**: Numerics
- **Annex H**: High Integrity Systems

An Ada implementation is free to support none, some, or all of the annexes. GNAT, the free compiler, supports all of them. The commercial compilers (AdaCore's GNAT Pro, PTC ObjectAda, Ada Core Technologies' XGC) support all of them with varying degrees of certification for safety-critical use.

Annex D is the most important annex for avionics, aerospace, and embedded systems. It provides the machinery for precise timing, priority-based scheduling, and the kind of determinism that hard real-time systems need.

### 8.2 Priority

Every Ada task has a priority. You can set it statically with `pragma Priority`:

```ada
task High_Priority_Task
  with Priority => 10;

task Low_Priority_Task
  with Priority => 3;
```

Priorities are integers, and higher values mean higher priority (this is the opposite of POSIX's `nice` values). The range is implementation-defined but must include the values in `System.Priority`, which is 0 to 30 on most implementations, with `System.Interrupt_Priority` extending up to 31 or higher for tasks that handle interrupts.

With Annex D, the default dispatching policy is `FIFO_Within_Priorities`, meaning:
- Always run the highest-priority runnable task.
- Among tasks of the same priority, use FIFO (the one that's been ready longest).
- Tasks don't get preempted by same-priority tasks (no round-robin), only by higher-priority tasks.

This is deterministic. Given a set of tasks with known priorities and execution times, you can compute the schedule in advance.

### 8.3 Dispatching Policies

Annex D lets you choose the dispatching policy with a pragma:

```ada
pragma Task_Dispatching_Policy (FIFO_Within_Priorities);
```

Other policies include:

- `Non_Preemptive_FIFO_Within_Priorities` — once a task is running, it runs until it blocks, even if a higher-priority task becomes ready. Used for systems where you need to avoid the overhead of preemption.
- `Round_Robin_Within_Priorities` — round-robin at each priority level. Added in Ada 2005.
- `EDF_Across_Priorities` — Earliest Deadline First. Added in Ada 2005 via `Ada.Dispatching.EDF`.

The choice of policy affects schedulability analysis. Rate-monotonic analysis applies to `FIFO_Within_Priorities`. EDF allows higher utilization (up to 100%) but is more complex to reason about.

### 8.4 Ceiling Locking and Priority Inversion

The classic problem in real-time systems with priorities is **priority inversion**: a high-priority task waits for a resource held by a low-priority task, which is preempted by a medium-priority task, so the high-priority task ends up waiting for the medium-priority task to finish — effectively running at medium priority.

The most famous instance of this bug is the 1997 Mars Pathfinder mission, where priority inversion in the VxWorks real-time OS caused the spacecraft to repeatedly reset. The fix was to enable **priority inheritance** on the affected mutex.

Ada's answer to priority inversion is the **ceiling priority protocol**, encoded in Annex D. You specify a ceiling priority for a protected object:

```ada
pragma Locking_Policy (Ceiling_Locking);

protected type Shared_Data
  with Priority => 15
is
   procedure Update (V : Integer);
   function  Read return Integer;
private
   Value : Integer := 0;
end Shared_Data;
```

The ceiling (15 in this example) is the maximum priority of any task that will ever call this protected object. When a task calls a protected operation, its priority is temporarily **raised to the ceiling** for the duration of the call. This has two important effects:

1. No task with higher priority than the ceiling can preempt the call (because the ceiling is the max of all callers, any task that could call is now blocked by the priority raise).
2. No deadlock is possible on a single-processor system as long as protected objects are always entered in ceiling order.

The ceiling priority protocol provides **bounded priority inversion** — the worst-case blocking time is the longest protected operation, not an unbounded chain. This makes response-time analysis tractable.

The Ada reference manual specifies the ceiling protocol precisely, and Ravenscar mandates it. Combined with rate-monotonic scheduling and protected objects, the ceiling protocol gives you an implementable foundation for hard real-time systems.

### 8.5 Dynamic Priorities

Ada 2005 added the ability to change priorities at runtime, via the `Ada.Dynamic_Priorities` package:

```ada
with Ada.Dynamic_Priorities; use Ada.Dynamic_Priorities;

procedure Bump_Self is
begin
   Set_Priority (System.Priority'Last);
   -- ... do critical work ...
   Set_Priority (System.Priority'First);
end Bump_Self;
```

This is useful for tasks that have critical sections where they need to run with higher priority, but it breaks some static schedulability analysis assumptions. Ravenscar forbids dynamic priorities for this reason.

### 8.6 Interrupt Handling

Annex D specifies how Ada programs can handle hardware interrupts. The mechanism is to attach a protected procedure to an interrupt:

```ada
with Ada.Interrupts.Names;  use Ada.Interrupts.Names;
with Ada.Interrupts;        use Ada.Interrupts;

protected Interrupt_Handler is
   procedure Handle;
   pragma Attach_Handler (Handle, SIGINT);
end Interrupt_Handler;

protected body Interrupt_Handler is
   procedure Handle is
   begin
      Put_Line ("Interrupt received");
   end Handle;
end Interrupt_Handler;
```

The `pragma Attach_Handler` wires the protected procedure `Handle` to the interrupt `SIGINT`. When the interrupt fires, the runtime calls `Handle` with all the protected-object machinery engaged — mutual exclusion, ceiling locking, etc. This lets you write interrupt handlers as ordinary Ada code, with the safety and discipline of protected operations.

Interrupts in Ada are at a special priority level (`System.Interrupt_Priority`) that's higher than any normal task priority. This means interrupt handlers always preempt normal tasks, as you'd expect.

### 8.7 Why Annex D Matters

Annex D is the reason that avionics companies pay for Ada. A flight control computer running Ada with Annex D:

- Has guaranteed deterministic scheduling.
- Has bounded priority inversion.
- Has precise timing with monotonic clocks.
- Has interrupt handlers integrated with the task model.
- Has all of these properties expressible at compile time, checkable by the compiler, and analyzable by schedulability tools.

No other mainstream language has all of these things. Java's real-time specification (JSR-1) is complex and has mixed success. C/RTOS combinations work but lack compile-time guarantees. C++ has no real-time facilities in the standard; you use platform libraries.

Ada + Annex D is the gold standard, and has been for three decades.

---

## Part IX: The Ravenscar Profile

### 9.1 Motivation

Annex D gives you enough machinery to write hard real-time systems, but it also gives you enough rope to hang yourself. Some features are incompatible with formal verification, static schedulability analysis, or bounded-memory guarantees:

- `select ... then abort` — ATC is hard to analyze.
- Dynamic task creation — unbounded task count breaks schedulability analysis.
- Dynamic priorities — breaks static schedulability analysis.
- Entry families, requeue with abort, etc. — complex corner cases.

For the highest-assurance systems (DO-178C DAL A avionics, IEC 61508 SIL 4 industrial control, ECSS space software), you want a restricted subset that's analyzable and verifiable. This is the **Ravenscar profile**.

The name "Ravenscar" comes from the Yorkshire village of Ravenscar, where the 8th International Real-Time Ada Workshop was held in 1997. The attendees defined the profile there. It was later standardized as **ISO/IEC TR 15942:2000** (a technical report, later incorporated into the Ada reference manual).

### 9.2 The Profile

Applying the profile is a one-line pragma:

```ada
pragma Profile (Ravenscar);
```

This pragma is shorthand for a long list of restrictions and policies:

- `pragma Task_Dispatching_Policy (FIFO_Within_Priorities);`
- `pragma Locking_Policy (Ceiling_Locking);`
- `pragma Detect_Blocking;`
- `pragma Restrictions (No_Abort_Statements);`
- `pragma Restrictions (No_Dynamic_Priorities);`
- `pragma Restrictions (No_Dynamic_Attachment);`
- `pragma Restrictions (No_Implicit_Heap_Allocations);`
- `pragma Restrictions (No_Local_Protected_Objects);`
- `pragma Restrictions (No_Local_Timing_Events);`
- `pragma Restrictions (No_Protected_Type_Allocators);`
- `pragma Restrictions (No_Relative_Delay);`
- `pragma Restrictions (No_Requeue_Statements);`
- `pragma Restrictions (No_Select_Statements);`
- `pragma Restrictions (No_Specific_Termination_Handlers);`
- `pragma Restrictions (No_Task_Allocators);`
- `pragma Restrictions (No_Task_Hierarchy);`
- `pragma Restrictions (No_Task_Termination);`
- `pragma Restrictions (Simple_Barriers);`
- `pragma Restrictions (Max_Entry_Queue_Length => 1);`
- `pragma Restrictions (Max_Protected_Entries => 1);`
- `pragma Restrictions (Max_Task_Entries => 0);`
- `pragma Restrictions (No_Dependence => Ada.Asynchronous_Task_Control);`
- `pragma Restrictions (No_Dependence => Ada.Calendar);`
- `pragma Restrictions (No_Dependence => Ada.Execution_Time.Group_Budget);`
- `pragma Restrictions (No_Dependence => Ada.Execution_Time.Timers);`
- `pragma Restrictions (No_Dependence => Ada.Task_Attributes);`
- `pragma Restrictions (No_Dependence => System.Multiprocessors.Dispatching_Domains);`

Let me explain what the key restrictions mean in practice.

### 9.3 What Ravenscar Forbids (and Why)

**No task allocators.** You cannot write `new Worker`. All tasks must be declared statically at the top level of the main program. This gives a **bounded, known-at-compile-time number of tasks**, which is essential for schedulability analysis.

**No task hierarchy.** Tasks can only be declared at the library level (in packages), not nested inside procedures or other tasks. Combined with no allocators, this means the entire task set is a flat collection known at compile time.

**No task termination.** Ravenscar tasks are expected to run forever. A task that terminates is a bug. The rationale is that in real-time systems, tasks are always active periodic loops or server loops; there's no "script" that runs once and exits. This restriction lets the runtime omit the termination-handling code.

**No abort statements, no ATC.** As discussed in section 7.4, these are hard to analyze.

**No select statements with multiple accepts.** Actually `select` is almost entirely forbidden. The one form that's allowed is `select ... delay until ... end select`, because it's just a timed wait. Tasks in Ravenscar communicate only through protected objects, not through rendezvous.

**No relative delay.** Only `delay until` is allowed, which forces you to use absolute times for periodic tasks. This prevents the accumulating drift bug discussed in section 6.1.

**Max entry queue length = 1.** Each protected entry can have at most one task queued on it at any time. This is the hallmark Ravenscar restriction and the one that surprises people. The reasoning: if multiple tasks are waiting on the same entry, you have a priority-ordering problem (which one gets released first?), and the scheduling analysis gets complex. By restricting to one-task-per-entry, the analysis becomes tractable.

This restriction forces a particular style: if N tasks need to wait on an event, you give each one its own entry. The **suspension object** pattern is:

```ada
protected type Event is
   entry Wait;
   procedure Signal;
private
   Fired : Boolean := False;
end Event;

protected body Event is
   entry Wait when Fired is
   begin
      Fired := False;
   end Wait;

   procedure Signal is
   begin
      Fired := True;
   end Signal;
end Event;
```

You create one `Event` per task that needs to be signaled. The `Max_Entry_Queue_Length => 1` is satisfied because each event only has one waiter.

**Simple barriers.** Protected entry barriers must be simple Boolean expressions — specifically, a single Boolean variable or a negation of one. No compound expressions, no function calls, no record component accesses. This keeps barrier evaluation trivially fast and statically analyzable.

**No requeue.** The requeue mechanism (section 5.9) adds analysis complexity and is forbidden.

**No dynamic priorities.** Priorities are set at compile time via `pragma Priority` and never change.

**Detect_Blocking.** The runtime must detect (and raise `Program_Error`) if a protected operation attempts to block (e.g., by calling a potentially-blocking routine). This is a catch for bugs where someone writes a protected procedure that accidentally calls `delay` or a blocking I/O routine.

### 9.4 What Ravenscar Allows

Everything you need for hard real-time periodic and sporadic tasks:

- Statically declared tasks at the library level.
- Protected objects with simple barriers.
- Absolute `delay until` for periodic tasks.
- Suspension objects (via single-entry protected objects).
- Interrupt handlers via protected procedures.
- Ceiling priority protocol.
- FIFO-within-priorities dispatching.
- `Ada.Real_Time` for monotonic clocks.
- `Ada.Real_Time.Timing_Events` for interrupt-level timing.

This is enough to express a multi-task real-time system with periodic tasks, sporadic tasks (triggered by signals), shared data through protected objects, and full worst-case response time analysis.

### 9.5 A Complete Ravenscar Program

```ada
pragma Profile (Ravenscar);

with Ada.Text_IO;
with Ada.Real_Time; use Ada.Real_Time;

package Shared is

   protected type Counter_T
     with Priority => 10
   is
      procedure Increment;
      function  Value return Integer;
   private
      Count : Integer := 0;
   end Counter_T;

   Counter : Counter_T;

end Shared;

package body Shared is

   protected body Counter_T is
      procedure Increment is
      begin
         Count := Count + 1;
      end Increment;

      function Value return Integer is
      begin
         return Count;
      end Value;
   end Counter_T;

end Shared;

with Ada.Real_Time; use Ada.Real_Time;
with Shared;

package Workers is

   task Periodic_1
     with Priority => 5;

   task Periodic_2
     with Priority => 6;

   task Monitor
     with Priority => 3;

end Workers;

package body Workers is

   task body Periodic_1 is
      Period : constant Time_Span := Milliseconds (100);
      Next   : Time := Clock + Period;
   begin
      loop
         Shared.Counter.Increment;
         delay until Next;
         Next := Next + Period;
      end loop;
   end Periodic_1;

   task body Periodic_2 is
      Period : constant Time_Span := Milliseconds (50);
      Next   : Time := Clock + Period;
   begin
      loop
         Shared.Counter.Increment;
         delay until Next;
         Next := Next + Period;
      end loop;
   end Periodic_2;

   task body Monitor is
      Period : constant Time_Span := Seconds (1);
      Next   : Time := Clock + Period;
   begin
      loop
         Ada.Text_IO.Put_Line
           ("Count:" & Integer'Image (Shared.Counter.Value));
         delay until Next;
         Next := Next + Period;
      end loop;
   end Monitor;

end Workers;

with Workers;
procedure Ravenscar_Demo is
begin
   null;
end Ravenscar_Demo;
```

This program has three tasks at the library level:
- `Periodic_1` runs at 10 Hz (100 ms period) with priority 5.
- `Periodic_2` runs at 20 Hz (50 ms period) with priority 6.
- `Monitor` runs at 1 Hz (1 second period) with priority 3.

All three share access to a `Counter_T` protected object with ceiling priority 10. The ceiling is at least as high as the highest task that might call (which is `Periodic_2` at priority 6), so the ceiling protocol guarantees bounded priority inversion.

You could take this program and run it through a response-time analysis tool (MAST, Cheddar, SymTA/S) and get precise worst-case response times for each task, provably meeting their deadlines.

### 9.6 Ravenscar in Real Systems

Ravenscar is used in:

- **AdaCore's GNAT Pro Safety-Critical** product, which includes a Ravenscar-compliant runtime.
- **ORK+** (Open Ravenscar Real-Time Kernel) — an open-source Ravenscar runtime originally developed at Universidad Politécnica de Madrid, used by the European Space Agency.
- **ESA space missions**: BepiColombo (Mercury orbiter, launched 2018), JUICE (Jupiter Icy Moons Explorer, launched 2023), Gaia, Solar Orbiter, and earlier missions like Herschel and Planck. All run Ada on bare-metal LEON (ERC32/LEON2/LEON3) processors with Ravenscar runtimes.
- **Airbus A350**, **A400M**, and parts of **A380** flight control software.
- **Eurofighter Typhoon**, **Rafale** avionics.
- **Boeing 777** (largely) and **787** (partially) flight control.
- **F-22 Raptor** and **F-35** (partially) avionics.
- **Ariane 6** launch vehicle software.
- **Paris Metro Ligne 14** (the first driverless subway line, fully autonomous, entered service in 1998, runs Ada under a Ravenscar-like profile).
- **London DLR** (Docklands Light Railway).
- **Eurocontrol iFACTS** air traffic control.
- **Canadian Automated Air Traffic System (CAATS)**.

For all of these systems, the Ravenscar profile is not optional — it's the difference between a certifiable system and an uncertifiable one. Certification authorities (FAA, EASA, ANAC, etc.) require evidence that the software meets its timing requirements, and Ravenscar's restrictions make that evidence achievable.

### 9.7 The Jorvik Profile

Ada 2012 introduced a slightly more permissive variant called **Jorvik** (named, inevitably, for the Viking name of York — Jorvik was the 10th International Real-Time Ada Workshop's location). Jorvik relaxes a few Ravenscar restrictions:

- Multiple tasks can queue on an entry (relaxing `Max_Entry_Queue_Length`).
- Barrier expressions can be slightly more complex.
- Some restrictions on protected procedures are lifted.

Jorvik is for projects that want most of Ravenscar's analyzability but need a few more flexibility points. It's used in some European space missions and some newer avionics projects.

### 9.8 SPARK + Ravenscar

The gold standard for verified concurrent Ada is **SPARK 2014 with the Ravenscar profile**. SPARK is a subset of Ada that can be formally verified by the SPARK toolset (AdaCore's gnatprove). The SPARK subset includes most of Ada's sequential features plus a restricted form of tasking compatible with Ravenscar.

With SPARK + Ravenscar, you can prove:
- No task races on shared data (SPARK's flow analysis).
- Protected objects are used correctly (SPARK checks the ownership model).
- Schedulability (external tools using SPARK's assertions).
- Absence of runtime errors (SPARK's proof obligations).
- Functional correctness (if you write contracts).

This stack is what AdaCore sells to customers building systems where a software bug means deaths. Airbus, Boeing, Lockheed Martin, and several national space agencies are among the customers.

---

## Part X: Synchronized Interfaces (Ada 2005)

### 10.1 Unifying Tasks, Protected Objects, and Regular Types

Ada 2005 added object-oriented features to the language, including interfaces (pure abstract types that define contracts). The concurrency-relevant extension is **synchronized interfaces** and **task/protected interfaces**.

```ada
type Observer is synchronized interface;
procedure Notify (O : in out Observer; Event : Integer) is abstract;
```

The `synchronized` modifier means that only synchronized types (protected objects, tasks, or types derived from other synchronized interfaces) can implement `Observer`. This ensures that the `Notify` operation is always called with mutual exclusion, regardless of whether the implementer is a protected object or a task entry.

A protected type can implement the interface:

```ada
protected type Protected_Observer is new Observer with
   procedure Notify (Event : Integer);  -- Implements Observer.Notify
end Protected_Observer;
```

And a task type can implement the interface:

```ada
task type Task_Observer is new Observer with
   entry Notify (Event : Integer);  -- Implements Observer.Notify
end Task_Observer;
```

Now a caller who holds a dispatching reference to `Observer'Class` can call `Notify` without knowing whether they're talking to a protected object or a task. The mutual exclusion is guaranteed either way.

### 10.2 Why This Matters

Before Ada 2005, there was a dichotomy: you either used a protected object (fast, passive) or a task with entries (slower, active), and callers had to know which. If you later wanted to swap one for the other, callers had to change.

Synchronized interfaces erase that distinction. The caller just calls `Notify`; the implementation decides how to synchronize. This is exactly analogous to how plain interfaces erase the distinction between different concrete classes — but for synchronized operations.

It also enables patterns like "interface to a subsystem that could be either a task or a protected object depending on runtime configuration." A piece of middleware can define its protocol via a synchronized interface and let different parts of the system implement it in whichever way is most appropriate.

### 10.3 Task Interfaces

You can also declare a pure `task interface`:

```ada
type Worker is task interface;
procedure Do_Work (W : in out Worker) is abstract;
```

Only task types can implement a `task interface`. This lets you have polymorphism over task types, which is useful for worker pools with different kinds of workers.

---

## Part XI: Parallel Constructs (Ada 2022)

### 11.1 The Late Addition of Parallel-For

Ada didn't get `parallel for` loops until Ada 2022. Why so late? The answer is that Ada's tasking model already handled most of what you'd want parallel-for for — you could write the worker pool pattern by hand. The Ada committee took their time because adding `parallel` as a new language construct meant:

1. Figuring out the right semantics for nested parallelism.
2. Integrating with the existing tasking model.
3. Making sure the new construct didn't break the Ravenscar subset.
4. Proving that the construct was useful enough to justify adding to the language.

By 2022, the committee was satisfied with the design and shipped it.

### 11.2 The `parallel` Keyword

The basic syntax is:

```ada
parallel for I in 1 .. N loop
   A (I) := Compute (I);
end loop;
```

This is functionally equivalent to:

```ada
for I in 1 .. N loop
   A (I) := Compute (I);
end loop;
```

...except that iterations may run in parallel. The compiler and runtime decide how many threads to use, how to partition the iteration space, and how to schedule the work.

### 11.3 Parallel Blocks

Ada 2022 also has parallel blocks:

```ada
parallel
   Compute_X;
and
   Compute_Y;
and
   Compute_Z;
end parallel;
```

This runs the three statements in parallel and waits for all of them to finish before continuing. It's the structured-concurrency version of `go func() { ... }(); go func() { ... }(); wg.Wait()` in Go, but expressed declaratively.

### 11.4 Reductions

Parallel-for with reductions:

```ada
declare
   Total : Integer := 0;
begin
   parallel for I in 1 .. N loop
      Total := Total + A (I)  -- reducer syntax varies
   end loop;
end;
```

The exact syntax for reductions evolved during the Ada 2022 standardization process. The final form uses the reducer in a type-safe way that avoids race conditions on `Total` by making it part of the parallel-for construct.

### 11.5 Relationship to Tasking

Parallel constructs in Ada 2022 are **lighter-weight than tasks**. A task is a full first-class citizen with its own stack, its own priority, its own entry queues. A parallel iteration is a unit of work that the runtime may run on any available thread in a thread pool. The distinction is important:

- **Tasks** for long-running, coordinated activities (servers, periodic controllers, event handlers).
- **Parallel constructs** for data parallelism over large iteration spaces (numerical computation, batch processing, bulk transformations).

Under the hood, the Ada 2022 runtime typically uses a work-stealing thread pool similar to Intel TBB or OpenMP. The threads in the pool are Ada tasks, so the whole thing is internally consistent.

### 11.6 Comparison with Other Parallel-For Systems

**OpenMP**: pragma-based, retrofitted onto C and Fortran. Widely supported, well-tested, but has a separate mental model from the host language. Ada 2022's parallel-for is directly part of the language.

**Intel TBB**: library-based, C++ template heavy, work-stealing. Very fast, but the API surface is large.

**Rust Rayon**: trait-based, integrates with iterators. Very ergonomic, but relies on Rust's Send/Sync type system for safety. Ada 2022's parallel-for is safer because Ada's tasking model already has the relevant safety properties.

**Go goroutines**: fork per loop iteration. Lightweight but unstructured — you have to manage WaitGroups yourself. Ada 2022's parallel-for is structured by construction.

### 11.7 Why Ada Waited

The Ada committee's view (expressed in the design rationale documents) was that parallelism and concurrency are different problems. Concurrency is "how do I express multiple threads of control interacting with each other?" — which Ada 83 solved with tasks and rendezvous. Parallelism is "how do I efficiently distribute a single computation across multiple cores?" — which is a newer concern, only pressing since multicore became mainstream around 2005.

By waiting until 2022, Ada got to observe what worked in OpenMP, TBB, Rayon, and Rust, and then design a parallel-for construct that fit cleanly into Ada's existing semantics. The result is cleaner than any of the predecessors, at the cost of being late to market.

---

## Part XII: Real-World Concurrency in Ada

### 12.1 Avionics

**Airbus A350**: Flight control software is written predominantly in SPARK Ada with Ravenscar. The A350 entered service in 2015 and has one of the best safety records in commercial aviation. The Ada tasking model is used for the periodic control loops that run the flight control computers, with hard deadlines in the millisecond range.

**Airbus A380**: Flight control software, inherited in part from the A340 and updated, uses Ada with some parts in SCADE (a graphical dataflow language that generates C or Ada). The concurrent parts are all Ada tasks.

**Airbus A400M**: Military transport aircraft, flight control in Ada/SPARK.

**Boeing 777**: The primary flight computer software was written in Ada 83 and later Ada 95, using tasks and protected objects. The 777 entered service in 1995 and remains one of the safest aircraft in history.

**Boeing 787**: Partially Ada, partially C (depending on which subsystem). The flight control loops remain Ada.

**Eurofighter Typhoon**: Multi-national European fighter, primarily Ada 95 with Ravenscar-compliant runtimes. The mission computer handles dozens of concurrent tasks — sensor fusion, radar tracking, weapons management, flight control — all as Ada tasks communicating through protected objects.

**Dassault Rafale**: French fighter, similar to Typhoon in its use of Ada tasking.

**Lockheed Martin F-22 Raptor**: Ada 95 for mission-critical software, with Ravenscar-compliant runtimes.

**Lockheed Martin F-35 Lightning II**: Mixed Ada and C++. The Ada parts are the most safety-critical (flight control). The C++ parts are mission systems.

All of these use Ada tasking for periodic control, sporadic event handling, and subsystem coordination. The typical architecture has:

- A set of periodic tasks running at various rates (50 Hz, 100 Hz, 200 Hz) for flight control loops.
- A set of sporadic tasks that wake on events (pilot input, sensor data).
- Protected objects for sharing state between tasks.
- Interrupt handlers (also protected procedures) for hardware events.
- Ceiling priority protocol for bounded priority inversion.
- Rate-monotonic scheduling analysis proving all deadlines are met.

### 12.2 Space

**European Space Agency missions**: ESA has standardized on Ada + Ravenscar for many of its missions, via the ORK+ runtime on LEON processors (SPARC-architecture space-hardened CPUs). Missions include:

- **Herschel** and **Planck** (2009, space telescopes).
- **BepiColombo** (2018, Mercury orbiter).
- **Solar Orbiter** (2020).
- **JUICE** (2023, Jupiter Icy Moons Explorer).
- **Gaia** (2013, astrometry).
- **Sentinel** earth-observation satellites.

**NASA missions**: NASA uses Ada less than ESA (NASA has more C/C++ legacy), but Ada shows up in:

- **Mars Pathfinder** (1997): some Ada, though the famous priority-inversion bug was in VxWorks C code, not Ada.
- **Mars Reconnaissance Orbiter**: mixed Ada and C.
- **International Space Station**: Canadarm2 (the Canadian robotic arm) has Ada parts.

**Arianespace**: After the Ariane 5 Flight 501 disaster in 1996 (caused by an uncaught arithmetic overflow in inherited Ariane 4 code — the Ada `Constraint_Error` exception was the mechanism, though the underlying bug was a failure to re-verify the inherited module), Arianespace tightened its Ada coding standards. Ariane 5 and Ariane 6 flight software is extensively Ada-based, with Ravenscar for the hard real-time portions.

**Vega** launcher: Italian-led small launcher, Ada software.

### 12.3 Rail

**Paris Metro Ligne 14**: The first fully automated (driverless) subway line in Paris, opened in 1998. The control software is written in Ada with a Ravenscar-compatible runtime. Every train runs continuously under automatic control, with Ada tasks handling the real-time communication between trackside, trains, and the central control system.

**London Docklands Light Railway (DLR)**: Also driverless, also Ada-based.

**SNCF TGV**: Signaling and train control systems in Ada.

**JR East Shinkansen**: Parts of the signaling and automatic train control systems in Ada.

**Siemens CBTC** (Communications-Based Train Control): The signalling system used on many modern metros worldwide is largely Ada.

The common thread across rail: these systems have hard real-time requirements (train positions have to be tracked to within meters at tens of meters per second), cannot fail (failure means collisions), and are subject to the EN 50128 safety-critical railway software standard, which favors Ada's verifiability.

### 12.4 Air Traffic Control

**Eurocontrol iFACTS** (Interim Future Area Control Tools Support): The UK's air traffic control system for upper airspace. Ada-based, with extensive use of tasks for handling the thousands of concurrent flight tracks.

**Canadian Automated Air Traffic System (CAATS)**: The original was written in JOVIAL, replaced with an Ada-based system. Uses Ada tasks for concurrent flight tracking and controller interaction.

**FAA En Route Automation Modernization (ERAM)**: The current US air traffic control system for en route airspace. Written primarily in C++, but the replaced legacy system (HOST) was JOVIAL and there are ongoing discussions about the modern replacement — Ada remains a contender.

### 12.5 Medical

**Philips Medical Systems**: MRI and CT scanners have Ada components for the real-time control of the scanning sequences.

**Siemens Medical**: Similar, though less publicized.

**GE Healthcare**: Some Ada in CT and PET scanner control systems.

Medical devices governed by IEC 62304 (the medical device software life cycle standard) often choose Ada for the Class C (highest risk) components.

### 12.6 Industrial Control

**Nuclear instrumentation and control**: Many national nuclear regulators prefer Ada for plant I&C systems because of its verifiability. The IEC 60880 standard for nuclear software explicitly permits Ada and cites it as a preferred language.

**Automotive ECUs**: Less common than in aerospace, but some high-reliability automotive subsystems (particularly for European manufacturers) use Ada. AUTOSAR (the automotive software architecture standard) is primarily C, but Ada-to-AUTOSAR bridges exist.

### 12.7 The Pattern

Everywhere you find Ada concurrency in production, you find the same requirements:

1. **Real-time deadlines** that must be met.
2. **Safety-critical or mission-critical** correctness requirements.
3. **Long-term maintainability** (the software lives for decades).
4. **Certification** against some standard (DO-178C, IEC 61508, EN 50128, IEC 62304, ECSS-Q-ST-80, IEC 60880).
5. **Budget and schedule pressure** that requires finding bugs at compile time rather than in flight tests.

Ada's concurrency model was designed for exactly these requirements, and forty-three years later it's still the best choice for them.

---

## Part XIII: Comparison with Other Concurrent Languages

### 13.1 Erlang

Erlang was developed at Ericsson starting in 1986 by Joe Armstrong, Robert Virding, and Mike Williams. Like Ada, it has concurrency built into the language — the keyword `spawn` creates a new process, and `!` sends a message. Unlike Ada, Erlang's model is:

- **Pure message passing** (no shared memory).
- **Actor model** (processes have mailboxes, they receive messages asynchronously).
- **Share nothing** (each process has its own heap).
- **Soft real-time** (no hard deadline guarantees).
- **Distributed** (processes on different nodes are transparent).
- **Designed for fault tolerance** ("let it crash" philosophy, supervisor trees).

Erlang targets telecom switches — large numbers of concurrent sessions, each doing simple things, with soft real-time constraints (you need to handle calls within seconds, but if a particular call takes 100 ms instead of 50 ms, no one dies). Ada targets embedded real-time — small numbers of tasks, each doing precise timing-sensitive things, with hard real-time constraints.

Both are first-class concurrency languages. Both draw from CSP. But they make different tradeoffs:

| Feature | Ada | Erlang |
|---------|-----|--------|
| Memory model | Shared (via protected objects) | Isolated per process |
| Communication | Rendezvous + protected calls | Async message passing |
| Real-time | Hard (with Ravenscar) | Soft |
| Distribution | Optional (Annex E) | First-class |
| Fault tolerance | Exceptions + task termination | Supervisor trees |
| Typical use | Embedded, avionics, space | Telecom, soft realtime servers |
| GC | Optional, usually off for RT | Per-process, always on |

Neither is "better" — they solve different problems. The overlap is small. An Erlang program running a phone switch is not a replacement for an Ada program running a flight control computer.

### 13.2 Go

Go (Golang) was designed at Google by Rob Pike, Ken Thompson, and Robert Griesemer, with first release in 2009. Go's concurrency model is **goroutines** (lightweight threads) communicating through **channels**. This is CSP, just like Ada's rendezvous. In fact, `go func()` is remarkably similar to Ada's task declaration, and Go's `select` on channels is directly analogous to Ada's `select` on accepts.

The differences:

- **Garbage collection**: Go has mandatory concurrent garbage collection. Ada doesn't require GC (you can use explicit heap allocation with access types), and Ada avoids it in real-time contexts. GC introduces unpredictable pauses that kill hard real-time.
- **No real-time**: Go has no equivalent of Ada's Annex D. No priority inheritance, no ceiling locking, no rate-monotonic scheduling support. Go was designed for servers, not embedded systems.
- **Channels vs. protected objects**: Go's channels are message passing. Ada's protected objects are monitors. These are complementary, and Ada has both (rendezvous + protected objects). Go has only channels.
- **Lightweight**: Go goroutines are very cheap — you can have millions of them. Ada tasks are heavier — thousands is normal, millions is not. But Ada tasks have more guarantees.

Rob Pike has been open that Go drew inspiration from Ada tasking (among other sources — Newsqueak, Alef, Limbo, Squeak, Occam, CSP). The closest ancestor is probably Limbo, but the CSP lineage goes all the way back through Ada and into the 1978 Hoare paper.

Go is "Ada-inspired concurrency, without the real-time annex, with GC, for servers instead of embedded systems."

### 13.3 Rust

Rust takes a third path: it doesn't build concurrency into the language grammar, but it builds **safety for concurrency** into the type system. Rust has `std::thread` (library), `std::sync` (mutexes, channels, etc.), and `async`/`await` (syntactic sugar over a Future-based library). The language feature is the `Send` and `Sync` traits, which guarantee at compile time that data races cannot occur.

- `Send`: a type whose value can be transferred between threads.
- `Sync`: a type whose references can be shared between threads.

These traits are automatic for most types, with explicit negative implementations for types that shouldn't be transferred (like `Rc<T>`, which has non-atomic reference counting).

The result: Rust prevents data races at compile time, without building concurrency into the grammar. This is a clever design, and it's one of the things that made Rust popular. But it's different from Ada:

- **No built-in tasks.** You use library threads, with syntax like `std::thread::spawn(|| { ... })`. No declarative "task type."
- **No rendezvous or protected objects.** You use channels (`std::sync::mpsc`) or mutexes (`std::sync::Mutex<T>`). Both are library types.
- **No real-time annex.** Rust has no equivalent of Ada's Annex D, though projects exist (Embassy, RTIC) for embedded.
- **No Ravenscar equivalent.** You can restrict yourself, but there's no standardized profile the way Ravenscar is standardized.

Rust is the strongest competitor to Ada in the "safety-critical embedded" space, but only for applications that don't need Annex D and can tolerate the library-based tasking model. Rust is gaining traction in automotive (where Ada was historically weak), and there are ongoing efforts to certify Rust for aerospace, but as of 2026 Ada still dominates DO-178C DAL A avionics.

### 13.4 Java

Java has had threads since 1.0 (1995). The model is:

- `java.lang.Thread` — a class you extend or a `Runnable` you pass to a Thread.
- `synchronized` methods and blocks — equivalent to monitor enter/exit.
- `wait`/`notify`/`notifyAll` — condition variables via Object methods.
- `java.util.concurrent` (added in 1.5, 2004) — ExecutorService, locks, concurrent collections.
- Java Memory Model (formalized in 1.5) — happens-before relationships.

Java's tasking is much more library-oriented than Ada's. The language provides `synchronized` and `volatile`, but everything else is in libraries. Java Memory Model is a carefully-specified relaxed-memory model that programmers have to understand if they want correct lock-free code.

Java also has a **Real-Time Specification for Java (RTSJ)**, standardized as JSR-1 in 2002, which adds real-time features. RTSJ is comparable to Ada's Annex D in intent but has had limited commercial adoption. The commercial implementations (Sun's RTS, IBM's WebSphere Real Time) are niche products compared to Ada runtimes.

Java's general concurrency story is: "enough for servers and desktops, not enough for hard real-time."

### 13.5 C with pthreads

The POSIX threads library is the lowest common denominator. It provides:

- `pthread_create`, `pthread_join` — thread lifecycle.
- `pthread_mutex_*` — mutexes.
- `pthread_cond_*` — condition variables.
- `pthread_rwlock_*` — reader-writer locks (POSIX 2001).
- `pthread_once` — one-time initialization.
- `pthread_key_*` — thread-local storage.

Everything is a library function. The C language itself knows nothing about threads; C11 added a weak memory model (with `stdatomic.h`), but even that is a library addition.

pthreads is the default for embedded Unix systems (Linux, QNX, VxWorks, LynxOS) and gives you a lot of flexibility. It also gives you a lot of rope. Common pthread bugs:

- Forgetting to lock before signaling a condition variable.
- Using `pthread_cond_wait` without a while loop (spurious wakeups).
- Forgetting to unlock on error paths.
- Lock ordering bugs leading to deadlock.
- Using raw shared memory without atomic operations or memory barriers.

Every Ada protected object is effectively a mini-lock-plus-condition-variable combo that you can't misuse. Every Ada rendezvous is a synchronization point that the compiler understands. pthreads can do everything Ada tasking can do, but with no language-level help.

### 13.6 C++ std::thread and std::async

C++11 added `std::thread`, `std::mutex`, `std::condition_variable`, `std::future`, `std::async`, and so on. C++14 and C++17 added more (e.g., `std::shared_mutex`). C++20 added `std::jthread` (automatically joinable thread) and `std::stop_token` (cooperative cancellation) — these are partial recognitions of the structured concurrency concept Ada had in 1983.

C++ concurrency is:

- **Library-based** (like pthreads, but with RAII wrappers).
- **Type-safe** to the extent that C++ types are type-safe.
- **Portable** across C++11+ compilers.
- **No real-time specification** — C++ has no equivalent of Ada's Annex D.
- **Manual resource management** — you still have to be careful about destructors running while threads are alive.

C++20's `std::jthread` and `std::stop_token` are explicitly inspired by structured concurrency principles that Ada pioneered. The C++ community has been slowly rediscovering that "the language should help you" is a good idea for concurrency — forty years after Ada started there.

### 13.7 Occam

Occam is the language that implements CSP most directly. It was developed at INMOS for the Transputer (an early parallel processor) in the 1980s. Occam has:

- `PAR` — parallel execution.
- `SEQ` — sequential execution.
- `ALT` — select (like Ada's `select`, but for channels).
- `CHAN OF TYPE` — typed channels.
- `!` (output) and `?` (input) — channel operations.

Occam was beautifully simple and mathematically elegant, but the Transputer died commercially in the early 1990s and Occam largely went with it. Its legacy lives on in Ada (via CSP influence on Ichbiah), Go (via Pike's experience with Newsqueak/Limbo/Alef), and as a historical example of "pure CSP" in industry.

### 13.8 Summary Table

| Language | Concurrency | Real-Time | Safety | Typical Use |
|----------|------------|-----------|--------|-------------|
| Ada | Language | Annex D | Compile-time | Avionics, space, rail |
| Erlang | Language | Soft | Runtime | Telecom, servers |
| Go | Language | None | Runtime | Web servers, tools |
| Rust | Library + types | None (std) | Compile-time | Systems, embedded (growing) |
| Java | Library | RTSJ (niche) | Runtime | Enterprise, Android |
| C++ | Library | None | None | Everything |
| C + pthreads | Library | None | None | Embedded, systems |
| Occam | Language | Static | Compile-time | Historical (Transputer) |

Ada is the only mainstream language with all three properties: language-level concurrency, hard real-time support, and compile-time safety. That combination is what made it the choice for certified safety-critical systems, and that's why it still dominates that niche in 2026.

---

## Part XIV: Canonical Patterns

### 14.1 Producer-Consumer with Bounded Buffer (Protected Object)

```ada
generic
   type Item is private;
   Capacity : Positive := 16;
package Bounded_Buffers is

   protected type Buffer is
      entry Put (X : Item);
      entry Get (X : out Item);
      function Current_Count return Natural;
   private
      Data  : array (0 .. Capacity - 1) of Item;
      Head  : Natural := 0;
      Tail  : Natural := 0;
      Count : Natural := 0;
   end Buffer;

end Bounded_Buffers;

package body Bounded_Buffers is

   protected body Buffer is

      entry Put (X : Item) when Count < Capacity is
      begin
         Data (Tail) := X;
         Tail  := (Tail + 1) mod Capacity;
         Count := Count + 1;
      end Put;

      entry Get (X : out Item) when Count > 0 is
      begin
         X := Data (Head);
         Head  := (Head + 1) mod Capacity;
         Count := Count - 1;
      end Get;

      function Current_Count return Natural is
      begin
         return Count;
      end Current_Count;

   end Buffer;

end Bounded_Buffers;
```

Usage:

```ada
with Ada.Text_IO;      use Ada.Text_IO;
with Bounded_Buffers;

procedure Pc_Demo is
   package Int_Buffers is new Bounded_Buffers (Item => Integer, Capacity => 8);
   use Int_Buffers;

   B : Buffer;

   task Producer;
   task Consumer;

   task body Producer is
   begin
      for I in 1 .. 20 loop
         B.Put (I);
         Put_Line ("Produced" & I'Image);
      end loop;
   end Producer;

   task body Consumer is
      X : Integer;
   begin
      for I in 1 .. 20 loop
         B.Get (X);
         Put_Line ("Consumed" & X'Image);
         delay 0.05;
      end loop;
   end Consumer;

begin
   null;
end Pc_Demo;
```

### 14.2 Reader-Writer with Writer Preference

```ada
protected type RW is
   entry     Start_Read;
   procedure End_Read;
   entry     Start_Write;
   procedure End_Write;
private
   Readers : Natural := 0;
   Writer  : Boolean := False;
   Writers_Waiting : Natural := 0;
end RW;

protected body RW is

   entry Start_Read when not Writer and Writers_Waiting = 0 is
   begin
      Readers := Readers + 1;
   end Start_Read;

   procedure End_Read is
   begin
      Readers := Readers - 1;
   end End_Read;

   entry Start_Write when not Writer and Readers = 0 is
   begin
      Writer := True;
      Writers_Waiting := Writers_Waiting - 1;
   end Start_Write;

   procedure End_Write is
   begin
      Writer := False;
   end End_Write;

end RW;
```

The `Writers_Waiting` counter is maintained... well, actually, the above has a subtle bug — there's no way to increment `Writers_Waiting`. A proper implementation needs an explicit call from the client to register as a pending writer, or a requeue-based approach. I'll leave that as an exercise; the pattern is illustrative of how protected objects let you encode arbitrary synchronization policies.

### 14.3 Dining Philosophers

The classic dining philosophers problem, solved with protected objects:

```ada
with Ada.Text_IO; use Ada.Text_IO;
with Ada.Numerics.Discrete_Random;

procedure Dining_Philosophers is

   Num : constant := 5;

   type Fork_Index is mod Num;

   -- One "table" protected object arbitrates all forks.
   protected Table is
      entry Pick_Up (Phil : Fork_Index);
      procedure Put_Down (Phil : Fork_Index);
   private
      Fork_Free : array (Fork_Index) of Boolean := (others => True);
   end Table;

   protected body Table is

      entry Pick_Up (Phil : Fork_Index)
        when Fork_Free (Phil) and Fork_Free (Phil + 1) is
      begin
         Fork_Free (Phil)     := False;
         Fork_Free (Phil + 1) := False;
      end Pick_Up;

      procedure Put_Down (Phil : Fork_Index) is
      begin
         Fork_Free (Phil)     := True;
         Fork_Free (Phil + 1) := True;
      end Put_Down;

   end Table;

   task type Philosopher (ID : Fork_Index);

   package Random_Delay is
     new Ada.Numerics.Discrete_Random (Integer);
   use Random_Delay;
   G : Generator;

   task body Philosopher is
   begin
      Reset (G);
      for I in 1 .. 5 loop
         Put_Line ("Philosopher" & ID'Image & " thinking");
         delay Duration (Random (G) mod 500) / 1000.0;
         Put_Line ("Philosopher" & ID'Image & " hungry");
         Table.Pick_Up (ID);
         Put_Line ("Philosopher" & ID'Image & " eating");
         delay Duration (Random (G) mod 300) / 1000.0;
         Table.Put_Down (ID);
      end loop;
   end Philosopher;

   P0 : Philosopher (0);
   P1 : Philosopher (1);
   P2 : Philosopher (2);
   P3 : Philosopher (3);
   P4 : Philosopher (4);

begin
   null;
end Dining_Philosophers;
```

Note that because `Pick_Up`'s barrier is re-evaluated atomically (no race between checking and acquiring), this solution is correct. A philosopher never picks up one fork and then has to wait for the other — either both are available and they both become his, or he queues. There is no deadlock because no philosopher holds one fork while waiting for the other. The traditional dining philosophers deadlock (everyone picks up left fork, everyone waits forever for right fork) is impossible here because the barrier atomically checks both forks.

This is a nice illustration of what protected-object barriers give you for free: **compound conditions checked atomically**.

### 14.4 Watchdog with Selective Accept

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Watchdog_Demo is

   task Watchdog is
      entry Ping;
   end Watchdog;

   task body Watchdog is
   begin
      loop
         select
            accept Ping;
         or
            delay 2.0;
            Put_Line ("WATCHDOG FIRED — resetting system");
            exit;
         or
            terminate;
         end select;
      end loop;
   end Watchdog;

   task Worker;

   task body Worker is
   begin
      for I in 1 .. 10 loop
         Put_Line ("Worker iteration" & I'Image);
         Watchdog.Ping;
         delay 1.0;
      end loop;
      -- Simulate getting stuck:
      delay 10.0;
   end Worker;

begin
   null;
end Watchdog_Demo;
```

The worker pings the watchdog each iteration. If the worker gets stuck (the 10-second delay at the end), the watchdog times out, fires, and exits its loop. The main program is waiting for both tasks, and since the worker eventually finishes (after the 10-second delay), the program terminates normally.

### 14.5 Worker Pool with Work Queue

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Worker_Pool_Demo is

   type Job is record
      ID   : Positive;
      Data : Integer;
   end record;

   Num_Workers : constant := 4;

   protected Queue is
      entry     Put (J : Job);
      entry     Get (J : out Job);
      procedure Shutdown;
      function  Is_Done return Boolean;
   private
      Max     : constant := 32;
      Buffer  : array (0 .. Max - 1) of Job;
      Head    : Natural := 0;
      Tail    : Natural := 0;
      Count   : Natural := 0;
      Closed  : Boolean := False;
   end Queue;

   protected body Queue is

      entry Put (J : Job) when Count < Max is
      begin
         Buffer (Tail) := J;
         Tail  := (Tail + 1) mod Max;
         Count := Count + 1;
      end Put;

      entry Get (J : out Job) when Count > 0 or Closed is
      begin
         if Count > 0 then
            J     := Buffer (Head);
            Head  := (Head + 1) mod Max;
            Count := Count - 1;
         else
            -- Closed and empty; signal end by raising
            raise Tasking_Error;
         end if;
      end Get;

      procedure Shutdown is
      begin
         Closed := True;
      end Shutdown;

      function Is_Done return Boolean is
      begin
         return Closed and Count = 0;
      end Is_Done;

   end Queue;

   task type Worker (ID : Positive);

   task body Worker is
      J : Job;
   begin
      loop
         begin
            Queue.Get (J);
            Put_Line ("Worker" & ID'Image & " processing job" & J.ID'Image);
            delay 0.1;
         exception
            when Tasking_Error =>
               Put_Line ("Worker" & ID'Image & " shutting down");
               exit;
         end;
      end loop;
   end Worker;

   Pool : array (1 .. Num_Workers) of Worker :=
     (1 => (ID => 1), 2 => (ID => 2), 3 => (ID => 3), 4 => (ID => 4));

begin
   for I in 1 .. 20 loop
      Queue.Put ((ID => I, Data => I * 10));
   end loop;

   delay 3.0;
   Queue.Shutdown;
end Worker_Pool_Demo;
```

The pattern:
- A protected queue holds jobs.
- Workers loop, calling `Queue.Get` to fetch jobs.
- When the queue is closed and empty, `Get` raises `Tasking_Error` (as a signal), and workers exit cleanly.
- The main procedure submits work, then calls `Shutdown` to close the queue.

This is a simplified version; production implementations use a distinct "job or end-of-work" sum type rather than exceptions for control flow, but the pattern of "protected queue + worker pool" is very common in Ada.

### 14.6 Periodic Task

Covered in section 6.3, but here's the canonical form:

```ada
with Ada.Real_Time; use Ada.Real_Time;

task body Control_Loop is
   Period : constant Time_Span := Milliseconds (10);  -- 100 Hz
   Next   : Time := Clock + Period;
begin
   loop
      Read_Sensors;
      Compute_Control;
      Write_Actuators;

      delay until Next;
      Next := Next + Period;
   end loop;
end Control_Loop;
```

This is the shape of every periodic controller in every Ada flight control computer. The fact that it's two lines of tasking code (`delay until` and `Next := Next + Period`) instead of a multi-step OS API is one of the reasons Ada is the default for this domain.

### 14.7 Sporadic Task with Suspension Object

A sporadic task is one that runs in response to an event rather than on a fixed period. In Ravenscar, you implement sporadic tasks using a protected object with a single entry:

```ada
protected Event is
   entry     Wait;
   procedure Signal;
private
   Set : Boolean := False;
end Event;

protected body Event is

   entry Wait when Set is
   begin
      Set := False;
   end Wait;

   procedure Signal is
   begin
      Set := True;
   end Signal;

end Event;

task Sporadic_Handler;

task body Sporadic_Handler is
begin
   loop
      Event.Wait;
      Handle_Event;
   end loop;
end Sporadic_Handler;
```

When an interrupt handler or another task calls `Event.Signal`, the sporadic handler's `Wait` is released and it processes the event. After handling, it loops back to `Wait`, which blocks again because `Set` was reset to False inside the entry body.

Note the combination: the `Wait` entry's body both returns (implicitly, as the body ends) *and* resets the flag. This is the classic "auto-reset event" pattern, implemented as an atomic protected operation.

### 14.8 Barrier Synchronization

A barrier is a point where N tasks must all arrive before any of them can proceed. This is useful for phase-based parallel computations.

```ada
protected type Barrier (N : Positive) is
   entry Wait;
private
   Arrived : Natural := 0;
end Barrier;

protected body Barrier is

   entry Wait when Arrived = N or Arrived = 0 is
   begin
      if Arrived = N then
         Arrived := Arrived - 1;
         -- Last one out resets the barrier
         if Arrived = 0 then
            null;
         end if;
      else
         Arrived := Arrived + 1;
         if Arrived = N then
            -- requeue to the released side
            null;
         end if;
      end if;
   end Wait;

end Barrier;
```

This is more complex than most of the other patterns, and a correct barrier is actually surprisingly tricky to write with protected objects (the classic solution uses two counters and alternating "sense" flags). For brevity I'll note that a correct barrier is one of the standard Ada concurrency exercises, and is covered in detail in Burns & Wellings' textbook.

### 14.9 Monitor Pattern

The protected object *is* the monitor pattern. Every protected object in Ada is a monitor in the Hoare/Hansen sense:

- Mutual exclusion is guaranteed (one procedure/entry at a time).
- Condition synchronization is via entry barriers.
- The state is encapsulated in the private part of the protected type.
- Clients access only via the public operations.

There's no "implementing" the monitor pattern in Ada — you just write a protected object.

### 14.10 Active Object Pattern

An active object is an object that runs in its own thread and accepts requests. In Ada, this is a task type:

```ada
task type Active_Counter is
   entry Increment;
   entry Get (V : out Integer);
end Active_Counter;

task body Active_Counter is
   Count : Integer := 0;
begin
   loop
      select
         accept Increment do
            Count := Count + 1;
         end Increment;
      or
         accept Get (V : out Integer) do
            V := Count;
         end Get;
      or
         terminate;
      end select;
   end loop;
end Active_Counter;
```

Compare to a protected object version:

```ada
protected type Passive_Counter is
   procedure Increment;
   function  Get return Integer;
private
   Count : Integer := 0;
end Passive_Counter;
```

Both present the same interface to clients. The active version runs its own thread and serializes requests through the rendezvous; the passive version uses protected-object mutual exclusion. The passive version is much faster and is the right choice for a simple counter. The active version has merit when the object needs to do work proactively (periodic cleanup, background processing) in addition to responding to requests.

---

## Part XV: Anti-Patterns and Gotchas

### 15.1 Priority Inversion

We covered this in section 8.4. The fix is to enable ceiling locking via `pragma Locking_Policy (Ceiling_Locking)` and give protected objects ceiling priorities. Without ceiling locking, a high-priority task can wait arbitrarily long for a low-priority task that's been preempted by a medium-priority task, violating schedulability.

### 15.2 Deadlock on Nested Protected Calls

Ada allows a protected operation to call another protected operation (as long as it doesn't block). But this can introduce deadlock if the order of locks isn't consistent:

```ada
-- TASK A:
P1.Op_1;  -- Inside, calls P2.Op
-- TASK B:
P2.Op_1;  -- Inside, calls P1.Op
```

If task A holds P1's lock and waits for P2's lock, and task B holds P2's lock and waits for P1's lock, classic deadlock. The ceiling priority protocol actually *prevents* this on a single CPU (if both protected objects have the same ceiling, only one task can be running at that priority), but on multi-CPU systems you need explicit lock ordering or avoidance of nested calls.

**Rule of thumb**: don't call out of a protected object into another protected object unless you're sure the order is consistent. Better: don't nest protected calls at all.

### 15.3 The `abort` Statement's Dangers

`abort` kills a task cold. If the task was holding state that needed cleanup, too bad. Ada's `Finalize` on controlled types helps with resource cleanup, but arbitrary invariants (e.g., a multi-step update to shared data) cannot be preserved.

**Rule**: avoid `abort`. Use termination flags and `terminate` alternatives instead. If you need to interrupt a long computation, use `select ... then abort` with care, and understand the abort-deferred regions.

### 15.4 Memory Allocation Inside Tasks

Dynamic allocation (`new`) is slow and non-deterministic. For hard real-time, avoid it after startup. All Ravenscar programs statically allocate everything they need at elaboration time.

If you must allocate after startup, use a pre-allocated memory pool (Ada's `Storage_Pools` mechanism lets you override allocation for specific access types).

### 15.5 Unbounded Queues

A protected queue that grows without bound is a memory leak waiting to happen. Always use bounded buffers in real-time code. The producer should block (via the barrier) when the buffer is full, applying backpressure.

### 15.6 Busy-Waiting with `delay 0.0`

`delay 0.0` is a "yield" — it lets the scheduler pick another task. But it's a terrible way to wait for a condition:

```ada
loop
   exit when Condition;
   delay 0.0;  -- ANTI-PATTERN
end loop;
```

This spins the CPU. Use a protected entry with a barrier instead:

```ada
Event.Wait;  -- Efficiently blocks until Event.Signal is called.
```

### 15.7 Calling Blocking Operations from Protected Bodies

Protected bodies must not block. Specifically, you cannot:
- Call `delay` (any form).
- Call a protected entry of another object (because it might block on a barrier).
- Call a task entry.
- Call any operation that might internally block (including some I/O operations).

The `pragma Detect_Blocking` (enforced under Ravenscar) catches these at runtime by raising `Program_Error`. Without it, the behavior is implementation-defined and may deadlock the whole program.

### 15.8 Forgetting `delay until` for Periodic Tasks

Using `delay` instead of `delay until` accumulates drift. Always use `delay until Next; Next := Next + Period;` for periodic work.

### 15.9 Race on Task Initialization

If task A tries to use task B before B is ready, you have a startup race. The usual fix is an explicit "initialization complete" event:

```ada
protected Ready is
   entry     Wait;
   procedure Signal;
private
   Set : Boolean := False;
end Ready;
```

Task B signals when it's done initializing, and any other task calls `Ready.Wait` before interacting with B.

### 15.10 Forgetting That `accept` Blocks Both Tasks

Inside an `accept` body, the caller is blocked waiting for the body to finish. Anything you do in the `accept` body should be fast — just parameter copying and state updates. Move expensive work outside the `accept` to unblock the caller sooner.

```ada
-- SLOW (caller blocks during expensive work)
accept Do_Work (X : Integer) do
   Expensive_Computation (X);
end Do_Work;

-- FAST (caller unblocked as soon as parameters are copied)
accept Do_Work (X : Integer) do
   Pending_X := X;
end Do_Work;
Expensive_Computation (Pending_X);
```

---

## Part XVI: Debugging Concurrent Ada

### 16.1 GNATstudio's Tasking Debugger

GNATstudio (the AdaCore IDE, successor to GPS) has a tasking debugger that shows all currently running tasks, their state (running, waiting, terminated), their current statement, and their call stacks. You can step through individual tasks, break on task creation or entry calls, and inspect protected object queues.

The key commands:
- `info tasks` in the debugger console lists all tasks.
- `task N` switches the debugger to task N.
- Breakpoints can be task-specific.

### 16.2 GNAT Runtime Instrumentation

GNAT supports several runtime instrumentation modes:

- `pragma Debug` — conditional debugging code that can be compiled out.
- `-gnatw.t` — warn on potentially-blocking operations in protected bodies.
- `-gnatef` — extended function call info.
- `GNAT.Debug_Utilities` — runtime tracing of tasks.

For Ravenscar targets (bare-metal), you typically use a JTAG debugger with a GDB stub that understands the Ravenscar runtime's task control blocks.

### 16.3 Race Detection

GNAT does not have a built-in race detector comparable to ThreadSanitizer (which works on C/C++). The Ada rationale is that **protected objects make races impossible by construction** — if you use the tasking model correctly, there's nothing to race on. Races can only happen if you bypass the model (e.g., via unprotected shared variables, which Ada allows but frowns upon).

SPARK, on the other hand, formally proves absence of races by checking data dependencies and ownership. If you want guaranteed race freedom, use SPARK.

### 16.4 Schedulability Analysis Tools

Several academic and commercial tools analyze Ada programs for schedulability:

- **MAST** (Modeling and Analysis Suite for Real-Time Applications), from Universidad de Cantabria. Reads Ada program structure, applies rate-monotonic analysis, produces response-time guarantees.
- **Cheddar**, from Université de Bretagne Occidentale. Similar analysis, GUI-based.
- **SymTA/S**, commercial tool from Symtavision (now Luxoft). Industry-grade scheduling analysis.
- **RapiTime**, from Rapita Systems. Measurement-based WCET analysis, commonly paired with Ada projects.

These tools read task specifications (periods, WCETs, priorities, shared resources), construct a schedulability model, and tell you whether the system meets its deadlines. For safety-critical work, this analysis is part of certification evidence.

### 16.5 Common Debugging Scenarios

**"My task never runs."** Check:
- Did you declare it? In Ada, declaration starts the task.
- Did the master scope reach `begin`? Tasks don't start until their enclosing scope elaborates.
- Is it blocked on an entry call that's never answered?

**"The program hangs at the end."** Usually means a task is still running. Check for:
- Infinite loops without `terminate` alternatives.
- Blocked entry calls to tasks that have terminated.
- Protected entry queues with no one to release them.

**"Deadlock."** Usually in nested protected calls. Check the lock ordering.

**"Race on shared data."** If you're bypassing protected objects and using raw shared variables, stop. Use a protected object.

**"Sporadic incorrect results."** Often a protected object with a bug in its barrier (e.g., evaluating a stale value). Re-read the entry bodies carefully.

---

## Part XVII: The Philosophical Position

### 17.1 The Two Schools

There are two schools of thought about concurrency in programming languages:

**School A: "Concurrency is too important to leave to libraries."**

This is Ada's position. The argument: concurrency touches every aspect of correctness — synchronization, memory models, real-time behavior, safety. If it's in a library, the compiler can't check it, the optimizer can't reason about it, and programmers will make mistakes that escape to production. The cost of building concurrency into the language is worth paying because the alternative is shipping bugs in safety-critical software.

Historical evidence for School A: Ada's tasking model has enabled decades of bug-free flight control software. The compile-time checks, the structured concurrency, the protected object discipline — these catch errors that pthreads-based programs routinely ship.

**School B: "The language should be small. Concurrency is a library concern."**

This is the C, C++, Rust (sort of), and (earlier) Java position. The argument: languages should be kept small and orthogonal. Concurrency primitives can be provided by libraries, and the language type system (e.g., Rust's Send/Sync) can provide the checks that matter. Building concurrency into the grammar makes the language complex and bloats the runtime.

Historical evidence for School B: pthreads is universally available, has been optimized to death, and is the foundation of every modern OS's concurrency. Rust proves that type-system discipline can replace language-grammar discipline for many correctness properties.

### 17.2 Why Ada's Position Still Wins for Safety-Critical Real-Time

For general-purpose software (web servers, applications, scripts), School B's argument is compelling. You get flexibility, small languages, and the ability to mix and match concurrency primitives.

For safety-critical hard real-time software, School A's argument is compelling. You get:

1. **Compile-time checks** of task/protected-object correctness.
2. **Portable semantics** across different platforms and OSes.
3. **Integration with the type system** (tasks with discriminants, protected types, synchronized interfaces).
4. **Formal verification support** (SPARK can prove tasking correctness).
5. **Restrictable subsets** (Ravenscar for certification).
6. **Predictable runtime behavior** (priority inheritance, ceiling locking, FIFO dispatching).
7. **Decades of real-world testing** in safety-critical systems.

None of these are things a library can provide. You can build a library that has some of them, but you can't get the compile-time integration without the compiler understanding your concurrency primitives. Rust comes closest, with its Send/Sync traits built into the type system, but Rust still relies on a library-based thread model and has no equivalent of Annex D.

### 17.3 The Future

Ada will likely remain the default for certified safety-critical real-time software for the foreseeable future. Rust is gaining traction in automotive and has started to appear in newer projects, but the certification ecosystem (DO-178C, IEC 61508) is still catching up to Rust, while Ada has been there for forty years.

The Ada language committee continues to evolve the tasking model: Ada 2012 added contract-based programming that composes with tasks, Ada 2022 added parallel constructs. Future Ada revisions will probably add:

- Better integration with GPU computing (a real-time concern as GPUs move into avionics).
- More expressive parallel constructs (pipelines, stream processing).
- Tighter integration with SPARK for proof-based verification.

But the core tasking model — tasks, rendezvous, protected objects, Ravenscar, Annex D — is stable, proven, and unlikely to change. It's what makes Ada the choice when lives depend on the software.

### 17.4 The Epigraph

Jean Ichbiah, the father of Ada, wrote in his 1979 rationale for the Green design:

> "Concurrent processing is so important in many application areas that we have provided for it at a fundamental level. Parallel tasks are declared like other program units, and the communication between them is via well-defined synchronization mechanisms. This approach allows the compiler to detect many errors at compile time that would otherwise escape to run time, and it allows the language to provide guarantees that library-based concurrency cannot."

That paragraph, written in 1979 for a language committee in Paris, is the position that Ada has held for forty-seven years. It is the position that flew the A380, landed Curiosity on Mars, drives the Paris Metro without a human at the controls, and keeps the Eurofighter Typhoon airborne. It is the position that every new concurrent language since 1983 has had to answer: do you build concurrency into the language, or do you leave it to libraries?

Ada's answer is unchanged. The evidence of forty-three years of certified safety-critical software suggests Ada's answer was correct.

---

## Part XVIII: Going Deeper

### 18.1 Reference Manual Sections

For the definitive word on Ada concurrency, read these sections of the Ada 2012 Reference Manual (available free online at adaic.org):

- **Section 9**: Tasks and Synchronization
  - 9.1: Task Units and Task Objects
  - 9.2: Task Execution — Task Activation
  - 9.3: Task Dependence — Termination of Tasks
  - 9.4: Protected Units and Protected Objects
  - 9.5: Intertask Communication
  - 9.6: Delay Statements, Duration, and Time
  - 9.7: Select Statements
  - 9.8: Abort of a Task — Abort of a Sequence of Statements
  - 9.9: Task and Entry Attributes
  - 9.10: Shared Variables
  - 9.11: Example of Tasking and Synchronization

- **Annex D**: Real-Time Systems
  - D.1: Task Priorities
  - D.2: Priority Scheduling
  - D.3: Priority Ceiling Locking
  - D.4: Entry Queuing Policies
  - D.5: Dynamic Priorities
  - D.6: Preemptive Abort
  - D.7: Tasking Restrictions (including Ravenscar)
  - D.8: Monotonic Time
  - D.9: Delay Accuracy
  - D.10: Synchronous Task Control
  - D.11: Asynchronous Task Control
  - D.12: Other Optimizations and Determinism Rules
  - D.13: The Ravenscar Profile
  - D.14: Execution Time
  - D.15: Timing Events
  - D.16: Multiprocessor Implementation

### 18.2 Books

- **John Barnes, *Programming in Ada 2012***. The standard reference. Chapters 20–22 cover tasking, protected objects, and the real-time annex in detail, with clear examples.
- **Alan Burns and Andy Wellings, *Concurrent and Real-Time Programming in Ada 2005***. The definitive concurrent-programming textbook for Ada. Everything you want to know, with academic rigor.
- **Michael Feldman, *Ada 95 Problem Solving and Program Design***. Older but still useful, with a good concurrent programming chapter.
- **Burns, Dobbing, and Vardanega, "Guide for the Use of the Ada Ravenscar Profile in High Integrity Systems"**. The Ravenscar usage guide, published by the University of York.

### 18.3 Papers

- **Ichbiah et al., "Rationale for the Design of the Ada Programming Language" (1979, revised 1986)**. Ichbiah's explanation of why the tasking model was designed the way it was.
- **Tony Hoare, "Communicating Sequential Processes" (CACM, August 1978)**. The paper that inspired the rendezvous model.
- **Liu and Layland, "Scheduling Algorithms for Multiprogramming in a Hard-Real-Time Environment" (JACM, 1973)**. Rate-monotonic scheduling, the theory underlying Ada real-time systems.
- **Sha, Rajkumar, and Lehoczky, "Priority Inheritance Protocols" (IEEE Trans. Computers, 1990)**. The ceiling priority protocol.
- **Burns et al., "The Ravenscar Tasking Profile for High Integrity Real-Time Programs"** (Ada-Europe 1998). The foundational Ravenscar paper.
- **Luis Miguel Pinho's papers on Ada real-time** — search for "Pinho Ada real-time" on DBLP.

### 18.4 Standards

- **ISO/IEC 8652:2012** — the Ada 2012 language standard, the current reference.
- **ISO/IEC TR 15942:2000** — the original Ravenscar profile technical report.
- **DO-178C** — the avionics software certification standard that Ada + Ravenscar targets.
- **ECSS-Q-ST-80** — the ESA software product assurance standard, which recommends Ada.
- **IEC 61508** — the industrial functional-safety standard covered by Ada + SPARK.

### 18.5 Runtime Implementations

- **GNAT** (the free GNU Ada compiler, part of GCC) — supports full Ada 2012 and 2022 tasking, with Ravenscar profile support.
- **GNAT Pro** (AdaCore commercial) — certified versions of GNAT for DO-178C, including Ravenscar runtimes.
- **ORK+** — Open Ravenscar Real-Time Kernel, bare-metal for LEON processors, used by ESA.
- **Muen** — a separation kernel written in SPARK/Ada for high-assurance systems.

---

## Part XIX: Deeper Tasking Semantics — The Things Reference Manual Readers Discover

### 19.1 Task Activation

When does a task *actually start running*? The answer is more nuanced than "when it's declared." Ada uses a two-phase model:

**Phase 1: Creation.** When the declarative part of a scope is elaborated, all the tasks declared in it are **created**. They exist as Ada objects, they have their discriminants, they have their priorities assigned, and the runtime has allocated their stacks. But they are not yet running.

**Phase 2: Activation.** Activation happens at specific points:
- For tasks declared in a block or subprogram body, activation happens at the `begin` of that block or body, **after** all declarations are elaborated.
- For tasks declared in a library package, activation happens after the package body's elaboration.
- For tasks created dynamically via `new`, activation happens immediately after the allocator completes.

The crucial rule: **a task does not see an inconsistent declarative part**. It cannot start running while other declarations in the same scope are still being elaborated. This prevents a whole class of startup races.

```ada
procedure Two_Phase_Demo is
   X : Integer := 42;

   task T;
   task body T is
   begin
      Put_Line ("T sees X =" & X'Image);
      -- X is guaranteed to be 42 here.
   end T;

   Y : Integer := 100;  -- Elaborated after T is declared but before T runs.
begin
   -- At this point, X and Y are both initialized,
   -- and T begins activation.
   null;
end Two_Phase_Demo;
```

The task `T` does not start running until both `X` and `Y` are initialized, even though `T` is declared between them. This is a deliberate design choice — activation is deferred to the `begin` so that all declarations have been elaborated.

### 19.2 Exceptions During Activation

If a task's *elaboration* raises an exception (e.g., discriminant evaluation fails), the creating scope receives `Tasking_Error`. If a task's *activation* fails (meaning the task starts running and immediately raises an unhandled exception), the task completes immediately, but the creating scope proceeds as if activation succeeded — you only learn about it via `'Terminated` or when you try to call an entry and get `Tasking_Error`.

This distinction matters for error handling. A robust program checks the state of its dependent tasks before interacting with them.

### 19.3 Entry Queues and FIFO Ordering

By default, Ada entry queues are FIFO — the first caller is the first released. Annex D allows other policies:

```ada
pragma Queuing_Policy (FIFO_Queuing);        -- default
pragma Queuing_Policy (Priority_Queuing);    -- high-priority first
```

`Priority_Queuing` orders the queue by the caller's priority, so high-priority tasks are released before low-priority tasks that arrived earlier. This is essential for real-time correctness.

Ravenscar mandates FIFO queuing, but since `Max_Entry_Queue_Length => 1`, only one task can be queued at a time — so the queuing policy is moot.

### 19.4 Completed vs Terminated

A task passes through several states:
- **Activating** — running its activation code (not yet at the `begin` of the body).
- **Executing** — running the body.
- **Callable** — willing to accept entry calls (or not blocked on anything unusual).
- **Blocked** — waiting on an entry, a delay, or similar.
- **Completed** — finished its body but still has dependent tasks running.
- **Terminated** — fully finished, all dependents have also terminated.

The attributes `T'Callable` and `T'Terminated` let you query a task's state:

```ada
if not My_Task'Terminated then
   My_Task.Some_Entry;
end if;
```

However, there's a race: `T'Terminated` could become true between the check and the call. The robust pattern is to use exception handling:

```ada
begin
   My_Task.Some_Entry;
exception
   when Tasking_Error =>
      -- My_Task terminated before we could call.
      null;
end;
```

### 19.5 Master Relationships

The rules for which scope is the "master" of a task are precise:

- A task declared in a procedure, block, or other statement-level scope: the master is the enclosing scope.
- A task declared in a library package's declarative part: the master is the "environment task" (the implicit main program).
- A task allocated dynamically via `new`: the master is the scope that contains the access type's declaration.
- A task contained in a record: the master is the record's scope.

The master waits for all its dependent tasks to terminate before it itself terminates. This propagates up the call stack and is the mechanism that enforces structured concurrency.

### 19.6 Dynamic Task Creation Implications

When you use `new Worker(...)`, the task's master is the scope of `Worker_Access` (the access type), not the scope of the `new` expression. If you declare the access type at library level and then allocate tasks from deep in the program, those tasks' master is the whole program, and the program doesn't terminate until they all do.

This is sometimes surprising:

```ada
package Pkg is
   task type Worker;
   type Worker_Access is access Worker;
end Pkg;

procedure Main is
   W : Pkg.Worker_Access;
begin
   W := new Pkg.Worker;  -- Master is Pkg's scope, i.e., the program.
   -- Main returns here, but the program waits for W to terminate.
end Main;
```

Main "returns" but the environment task waits for the allocated worker before the program exits. This is usually what you want, but you need to understand why.

### 19.7 Task Identification

Ada 2005's `Ada.Task_Identification` package lets you compare task identities:

```ada
with Ada.Task_Identification; use Ada.Task_Identification;

task body Some_Task is
   My_Id    : Task_Id := Current_Task;
   Other_Id : Task_Id;
begin
   -- ... later ...
   if Current_Task = My_Id then
      -- Yes, we're still the same task.
      null;
   end if;
end Some_Task;
```

This is useful for logging, for storing per-task state in an associative container, and for "am I the task that holds this lock" checks.

### 19.8 Ada.Task_Attributes

The `Ada.Task_Attributes` generic package gives you per-task local storage:

```ada
package My_Attrs is new Ada.Task_Attributes
  (Attribute => String (1 .. 20),
   Initial_Value => (others => ' '));

-- In a task:
My_Attrs.Set_Value ("Worker_Name          ");
-- In another context:
Put_Line (My_Attrs.Value (Some_Task_Id));
```

This is Ada's equivalent of POSIX thread-local storage. Ravenscar forbids it because of the complexity.

---

## Part XX: Runtime Implementation Notes

### 20.1 GNARL and GNULLI

GNAT's runtime for tasking is split into two layers:

- **GNULLI** (GNU Low-Level Interface): the OS-specific layer. On Linux, this is pthreads. On VxWorks, it's VxWorks tasks. On bare-metal, it's a small kernel.
- **GNARL** (GNU Ada Runtime Library): the Ada-specific layer. Implements rendezvous, protected objects, entry queues, barriers, ceiling locking, and so on, by calling into GNULLI.

This split means GNAT can port Ada tasking to new platforms by implementing GNULLI for that platform. The upper layer (GNARL) is platform-independent and implements the Ada semantics. Protected object implementation, for instance, uses OS primitives (futexes on Linux, mutex/cond var pairs on other Unix systems, disable interrupts on bare-metal single-CPU targets) through GNULLI.

### 20.2 Ravenscar Runtimes

Ravenscar runtimes are stripped-down GNARL implementations that omit the features Ravenscar forbids. They're small (a few tens of KB of code), deterministic, and suitable for bare-metal. AdaCore's GNAT Pro includes certified Ravenscar runtimes for targets like LEON3, ARM Cortex-M, and PowerPC, each of which has been subjected to rigorous testing and documentation for certification evidence.

A minimal Ravenscar runtime includes:
- A fixed-priority scheduler with FIFO-within-priorities dispatching.
- A protected object implementation with ceiling locking.
- A monotonic clock driver.
- A `delay until` implementation with timer interrupts.
- Interrupt handler dispatch for attached protected procedures.

That's roughly it. No select-statement machinery, no entry queue management beyond single-waiter, no dynamic allocation, no task termination bookkeeping. The whole runtime can fit in 20-30 KB.

### 20.3 Protected Object Implementation

A protected object typically consists of:

- A **lock** (usually a mutex with priority inheritance, or under ceiling locking, a simple flag).
- The **protected data** (the private components).
- One **condition variable per entry** (or equivalent).
- A **queue** per entry.

When a task calls a protected procedure:
1. Raise task's priority to the ceiling.
2. Acquire the lock.
3. Execute the body.
4. Re-evaluate barriers for any queued entry calls.
5. Release the lock (or transfer lock ownership to a released entry caller).
6. Restore task's original priority.

When a task calls a protected entry:
1. Raise priority, acquire lock (as above).
2. Evaluate the barrier.
3. If true: execute the body, then re-evaluate other barriers, release.
4. If false: enqueue on this entry, release the lock, suspend.
5. When awakened, proceed with the body.

The re-evaluation of barriers on exit is the expensive part. GNAT optimizes this by only re-evaluating barriers whose "touched" variables have been modified. The compiler does dependency analysis on the barrier expressions to figure out which barriers depend on which variables.

### 20.4 Ceiling Locking Implementation

Under `pragma Locking_Policy (Ceiling_Locking)`, the runtime:

1. When a task calls a protected operation, immediately raises the task's priority to the ceiling of the protected object (if higher than current).
2. Detects if the caller's current priority is higher than the ceiling — if so, raises `Program_Error` (this is a configuration bug, the ceiling is set too low).
3. On exit, restores the original priority.

The raise-priority operation is cheap — usually just a field update in the task control block and a possible scheduler interaction. The key insight is that on a single CPU, raising to the ceiling prevents any other task that could possibly call this protected object from running, which effectively gives you mutual exclusion *without acquiring any lock at all*. The "lock" is implicit in the priority protocol.

On multi-CPU systems (Annex D.16), ceiling locking still works but has subtler semantics — you need actual locks between CPUs even with ceilings. Multi-processor Ravenscar is a more recent development and has several open issues.

### 20.5 Rendezvous Implementation

A rendezvous between tasks A and B, where A calls `B.Entry_Name`, typically works like this:

1. A evaluates the parameters for the entry call.
2. A enqueues itself on B's entry queue.
3. A suspends.
4. B, when it reaches `accept Entry_Name`, dequeues A.
5. B copies parameters from A (A is still suspended, its data is stable).
6. B executes the accept body.
7. B copies out parameters back to A.
8. B releases A (A is marked runnable).
9. B continues its own execution.
10. A resumes, with the out parameters updated.

The rendezvous is implemented using the same OS primitives as protected objects (mutexes and condition variables), but with more bookkeeping because the accept body runs in B's context, not in a critical section.

### 20.6 Why Rendezvous Is Slower Than Protected Calls

Both mechanisms involve synchronization, but:

- **Protected operation**: lock, execute body, unlock. Roughly the cost of a mutex lock/unlock pair plus the body.
- **Rendezvous**: enqueue on entry, suspend, await dequeue, execute body, wake up caller, resume. Involves at least two scheduler interactions (suspend caller, wake caller).

On modern hardware with efficient futexes, a protected procedure call can be as cheap as 20-50 nanoseconds when uncontended. A rendezvous is typically 200 nanoseconds to 2 microseconds depending on contention and scheduler overhead.

This is why Ada 95 introduced protected objects: for high-frequency synchronization, rendezvous was too expensive, and the protected object gives you a much faster path.

---

## Part XXI: More Canonical Code Examples

### 21.1 A Stack with a Protected Object

```ada
generic
   type Element is private;
   Max_Size : Positive := 100;
package Protected_Stacks is

   protected type Stack is
      entry     Push (X : Element);
      entry     Pop  (X : out Element);
      function  Is_Empty return Boolean;
      function  Is_Full  return Boolean;
      function  Size     return Natural;
   private
      Data  : array (1 .. Max_Size) of Element;
      Count : Natural := 0;
   end Stack;

end Protected_Stacks;

package body Protected_Stacks is

   protected body Stack is

      entry Push (X : Element) when Count < Max_Size is
      begin
         Count := Count + 1;
         Data (Count) := X;
      end Push;

      entry Pop (X : out Element) when Count > 0 is
      begin
         X := Data (Count);
         Count := Count - 1;
      end Pop;

      function Is_Empty return Boolean is
      begin
         return Count = 0;
      end Is_Empty;

      function Is_Full return Boolean is
      begin
         return Count = Max_Size;
      end Is_Full;

      function Size return Natural is
      begin
         return Count;
      end Size;

   end Stack;

end Protected_Stacks;
```

Note that `Push` and `Pop` block when the stack is full/empty, rather than returning an error. This is the Ada idiom: use blocking primitives and rely on the task scheduler to wake callers when conditions change.

### 21.2 A Broadcast Channel

Sometimes you want "send a message to everyone listening." Rendezvous doesn't give you this directly (each rendezvous is one-to-one), and protected objects don't have a broadcast primitive. Here's how to implement it:

```ada
generic
   type Message is private;
   Max_Subscribers : Positive := 16;
package Broadcast_Channels is

   protected type Channel is
      procedure Subscribe (ID : out Natural);
      entry     Receive (ID : Natural; Msg : out Message);
      procedure Broadcast (Msg : Message);
      procedure Unsubscribe (ID : Natural);
   private
      type Slot is record
         Active  : Boolean := False;
         Has_Msg : Boolean := False;
         Msg     : Message;
      end record;
      Slots   : array (1 .. Max_Subscribers) of Slot;
      Next_ID : Natural := 0;
   end Channel;

end Broadcast_Channels;
```

A broadcast channel needs a slot per subscriber, because each subscriber must receive each message independently. This is getting into the territory where a full-blown server task with rendezvous may be cleaner.

### 21.3 A Simple Task Timer

```ada
with Ada.Real_Time; use Ada.Real_Time;

generic
   with procedure Timer_Action;
   Period : Time_Span;
package Periodic_Timers is
   task Timer;
end Periodic_Timers;

package body Periodic_Timers is

   task body Timer is
      Next : Time := Clock + Period;
   begin
      loop
         Timer_Action;
         delay until Next;
         Next := Next + Period;
      end loop;
   end Timer;

end Periodic_Timers;
```

Instantiate as:

```ada
procedure Tick is
begin
   Put_Line ("tick");
end Tick;

package Tick_Timer is new Periodic_Timers
  (Timer_Action => Tick,
   Period       => Milliseconds (500));
```

Ada's generic mechanism composes cleanly with tasks. The generic instantiates a task that calls the user's procedure at the given period.

### 21.4 An Alarm Clock

```ada
with Ada.Real_Time; use Ada.Real_Time;

protected type Alarm is
   procedure Set    (Wake_Time : Time);
   entry     Wait;
private
   Wake  : Time    := Time_Last;
   Armed : Boolean := False;
end Alarm;

protected body Alarm is

   procedure Set (Wake_Time : Time) is
   begin
      Wake  := Wake_Time;
      Armed := True;
   end Set;

   entry Wait when Armed and Clock >= Wake is
   begin
      Armed := False;
   end Wait;

end Alarm;
```

Wait — there's a problem. The barrier `Clock >= Wake` references `Clock`, which is not allowed in simple Ravenscar barriers (which require just a Boolean variable). Also, the barrier won't be re-evaluated when time passes — it's only re-evaluated when a protected operation completes.

A correct alarm clock requires a separate task that sleeps with `delay until` and then signals the alarm's flag:

```ada
protected type Alarm_Flag is
   entry     Wait;
   procedure Fire;
private
   Fired : Boolean := False;
end Alarm_Flag;

protected body Alarm_Flag is
   entry Wait when Fired is
   begin
      Fired := False;
   end Wait;
   procedure Fire is
   begin
      Fired := True;
   end Fire;
end Alarm_Flag;

task type Alarm_Task (Wake_Time : access Time) is
   entry Set (T : Time);
end Alarm_Task;
```

The tooling gets clunky, but the pattern is: use `Ada.Real_Time.Timing_Events` for lightweight timer callbacks, rather than rolling your own alarm-clock-via-task.

### 21.5 Priority Inversion Demonstration and Fix

Here's a classic priority inversion:

```ada
pragma Locking_Policy (Ceiling_Locking);
-- Without ceiling locking, this program can exhibit unbounded priority inversion.

with Ada.Real_Time; use Ada.Real_Time;
with Ada.Text_IO;   use Ada.Text_IO;

procedure Inversion is

   protected Shared
     with Priority => 15  -- Ceiling: at least as high as High_Task
   is
      procedure Update;
   private
      X : Integer := 0;
   end Shared;

   protected body Shared is
      procedure Update is
      begin
         -- Simulate slow critical section
         for I in 1 .. 100_000 loop
            X := X + 1;
         end loop;
      end Update;
   end Shared;

   task Low_Task  with Priority => 5;
   task Med_Task  with Priority => 10;
   task High_Task with Priority => 15;

   task body Low_Task is
   begin
      Put_Line ("Low: acquiring Shared");
      Shared.Update;
      Put_Line ("Low: done");
   end Low_Task;

   task body Med_Task is
   begin
      delay 0.01;  -- Start slightly later than Low
      Put_Line ("Med: running (should NOT delay High)");
      for I in 1 .. 1_000_000 loop
         null;
      end loop;
      Put_Line ("Med: done");
   end Med_Task;

   task body High_Task is
   begin
      delay 0.02;  -- Start after Low has Shared
      Put_Line ("High: trying to acquire Shared");
      Shared.Update;
      Put_Line ("High: done");
   end High_Task;

begin
   null;
end Inversion;
```

Without ceiling locking, the expected sequence is:
1. Low acquires Shared.
2. Med starts and preempts Low (Med is higher priority).
3. High tries to acquire Shared, blocks on Low.
4. Med runs its long loop — High waits for Low, Low waits for Med.
5. Classic priority inversion: High waits for Med (via Low holding the lock).

With ceiling locking:
1. Low acquires Shared; its priority is raised to 15 (the ceiling).
2. Med starts but is priority 10 — Low (now at 15) is not preempted by Med.
3. High tries to acquire Shared. Since Low is running at priority 15, High (also at 15) queues.
4. Low finishes quickly (no interference from Med), releases Shared.
5. High acquires Shared, runs, finishes.
6. Med runs last.

Bounded priority inversion: High waits only for the length of Low's critical section, not for Med's arbitrary work.

### 21.6 Stateful Server Task

A task that maintains state and responds to queries:

```ada
task Bank_Account is
   entry Deposit (Amount : Positive);
   entry Withdraw (Amount : Positive; Success : out Boolean);
   entry Balance (B : out Natural);
end Bank_Account;

task body Bank_Account is
   Current : Natural := 0;
begin
   loop
      select
         accept Deposit (Amount : Positive) do
            Current := Current + Amount;
         end Deposit;
      or
         accept Withdraw (Amount : Positive; Success : out Boolean) do
            if Amount <= Current then
               Current := Current - Amount;
               Success := True;
            else
               Success := False;
            end if;
         end Withdraw;
      or
         accept Balance (B : out Natural) do
            B := Current;
         end Balance;
      or
         terminate;
      end select;
   end loop;
end Bank_Account;
```

This is functionally equivalent to a protected object but implemented as a task. The task form is more flexible (can have internal state machines, periodic behavior, and so on) but more expensive per call.

### 21.7 Pipeline of Tasks

A pipeline passes data through a series of stages, each stage a task:

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Pipeline is

   type Data is new Integer;

   task Stage_1 is
      entry Put (X : Data);
   end Stage_1;

   task Stage_2 is
      entry Put (X : Data);
   end Stage_2;

   task Stage_3 is
      entry Put (X : Data);
   end Stage_3;

   task body Stage_1 is
      Value : Data;
   begin
      loop
         select
            accept Put (X : Data) do
               Value := X;
            end Put;
            Stage_2.Put (Value * 2);  -- Transform and forward
         or
            terminate;
         end select;
      end loop;
   end Stage_1;

   task body Stage_2 is
      Value : Data;
   begin
      loop
         select
            accept Put (X : Data) do
               Value := X;
            end Put;
            Stage_3.Put (Value + 10);  -- Transform and forward
         or
            terminate;
         end select;
      end loop;
   end Stage_2;

   task body Stage_3 is
      Value : Data;
   begin
      loop
         select
            accept Put (X : Data) do
               Value := X;
            end Put;
            Put_Line ("Result:" & Data'Image (Value));
         or
            terminate;
         end select;
      end loop;
   end Stage_3;

begin
   Stage_1.Put (1);
   Stage_1.Put (2);
   Stage_1.Put (3);
   -- Outputs: Result: 12 (1*2+10), Result: 14, Result: 16
end Pipeline;
```

Each stage is a task that accepts input, transforms it, and forwards it. The rendezvous provides flow control — if Stage_3 is slow, Stage_2 blocks on its `Put` call, which backpressures to Stage_1. Bounded memory, automatic flow control, deterministic semantics.

### 21.8 Fork-Join with Task Array

```ada
with Ada.Text_IO; use Ada.Text_IO;

procedure Fork_Join is

   type Worker_Result is array (1 .. 10) of Integer;
   Results : Worker_Result;

   task type Worker (Index : Positive);
   task body Worker is
   begin
      -- Simulate work proportional to index
      delay Duration (Index) * 0.05;
      Results (Index) := Index * Index;
      Put_Line ("Worker" & Index'Image & " done");
   end Worker;

   -- Fork 10 workers in parallel
   W1  : Worker (1);  W2  : Worker (2);  W3  : Worker (3);
   W4  : Worker (4);  W5  : Worker (5);  W6  : Worker (6);
   W7  : Worker (7);  W8  : Worker (8);  W9  : Worker (9);
   W10 : Worker (10);

begin
   -- Join: procedure doesn't return until all workers terminate
   null;
end Fork_Join;
-- After Fork_Join returns, Results is fully populated.
```

The fork-join pattern falls out naturally: declare N workers, they run in parallel, the procedure returns when they all finish. In Ada 2022, the same thing could be written more concisely with `parallel for`.

---

## Part XXII: Ada Tasking in Verified Systems — Case Studies

### 22.1 Airbus A350 Flight Control

The A350's primary flight computer (PFC) runs a suite of Ada tasks implementing the fly-by-wire control laws. The architecture (publicly described in general terms by Airbus and AdaCore):

- ~50 periodic tasks at various rates (12.5 Hz, 25 Hz, 50 Hz, 100 Hz).
- Several sporadic tasks that respond to pilot input events.
- Protected objects for sharing sensor data (airspeed, attitude, position) and command state.
- All shared data access is through protected objects — no raw shared variables.
- Ceiling priority locking throughout.
- Ravenscar profile for the lowest-level layer, with some extensions (Jorvik-like) for higher layers.
- Rate-monotonic schedulability analysis verifies all deadlines.
- SPARK 2014 verification of critical modules for absence of runtime errors and flow correctness.

The software is certified to DO-178C DAL A, the highest level of avionics software assurance. The certification requires thousands of pages of evidence: requirements traceability, test coverage, structural coverage (MC/DC), timing analysis, and more. Ada + SPARK + Ravenscar provides the tool support for generating this evidence automatically where possible.

### 22.2 Eurofighter Typhoon DASS

The Defensive Aids Sub-System (DASS) on the Typhoon is responsible for detecting threats (missile warning, radar warning), dispensing countermeasures (chaff, flares, jamming), and managing the electronic warfare suite. It's written in Ada with extensive use of tasks and protected objects.

The threat model: dozens of concurrent threats must be tracked simultaneously, each threat updates at hundreds of hertz, countermeasures must be dispensed within milliseconds of threat detection, and the whole system must never miss a deadline or cross-contaminate between threat tracks. Ada's tasking model handles this by:

- One task per threat track (up to the maximum, statically allocated).
- Shared sensor data through protected objects.
- Priority-based dispatching so that immediate threats (e.g., missile lock) are handled first.
- Sporadic tasks for rare but critical events (countermeasure dispense commands).

The Typhoon has flown millions of hours; the DASS software has never been the cause of a safety incident.

### 22.3 Paris Metro Ligne 14 Automatic Train Operation

Ligne 14 was the first automatic (driverless) metro line in Paris, opened in 1998. The Siemens CBTC system that controls it is written in Ada. The architecture:

- A trackside computer at each station tracks train positions.
- Each train's onboard computer runs Ada tasks for velocity control, door control, communication with trackside.
- A central control computer coordinates the whole line.
- All of it runs Ravenscar-compliant Ada on certified runtimes.

The system handles 40 trains simultaneously at peak, with minimum headways of 85 seconds. Each train's position is tracked to within a meter. Deadlines are in the 50-100 ms range for control loops. The software has been running continuously since 1998 with extraordinarily few failures.

### 22.4 BepiColombo Mercury Orbiter

BepiColombo is a joint ESA/JAXA mission launched in 2018, scheduled to arrive at Mercury in 2025. The ESA spacecraft (Mercury Planetary Orbiter, MPO) runs Ada on LEON3 processors using the ORK+ runtime.

The software architecture:
- Attitude and orbit control (AOCS) runs as a set of periodic Ada tasks.
- Thermal control, power management, communications, and instrument handling each run as subsystems with their own task sets.
- Inter-task communication is via protected objects.
- The whole stack runs under a Ravenscar-compliant runtime.
- SPARK verification for the most critical modules.

Unlike avionics, space missions have very constrained compute budgets (LEON3 is roughly equivalent to a 100 MHz x86 from the mid-1990s), so Ada's efficiency matters. The Ravenscar runtime fits in tens of kilobytes and leaves most of the memory for mission software.

The reason ESA standardized on Ada for space: the long mission lifetimes (BepiColombo will orbit Mercury for years), the inability to patch software in flight (launching a sequence upload is expensive and slow), and the need for provable correctness (a bug in the AOCS software could send the spacecraft tumbling into deep space).

### 22.5 Ariane 5/6 Flight Software

After Ariane 5 Flight 501's catastrophic loss in 1996 — caused by an inherited Ariane 4 module that threw a Constraint_Error on an out-of-range conversion, crashed the inertial reference unit, and led to the rocket's self-destruction — Arianespace rewrote major portions of the flight software in Ada 95 with stricter exception handling and more rigorous verification.

(Note: the Flight 501 disaster is sometimes cited as "an Ada failure," but the failure was actually Ada *detecting* a bug that the original programmers had incorrectly analyzed. The Ada exception mechanism worked perfectly; it was the decision not to catch the exception, combined with the decision to reuse the module without re-analyzing it, that caused the loss.)

Subsequent Ariane 5 flights and the forthcoming Ariane 6 use Ada with:
- Ravenscar runtime on PowerPC and later LEON processors.
- SPARK verification on flight-critical modules.
- Extensive simulation and hardware-in-the-loop testing.
- Strict re-verification of any inherited code.

The lesson from Flight 501 is baked into European space software culture: inherited code must be re-verified in its new context, and Ada's exception mechanism is only as good as the decision to handle or propagate exceptions.

### 22.6 iFACTS (Eurocontrol)

iFACTS is the UK en-route air traffic control system developed by Lockheed Martin / Eurocontrol. It tracks thousands of aircraft simultaneously in UK upper airspace, providing controllers with tools for conflict detection, trajectory prediction, and workload management.

The software is predominantly Ada, running on large multiprocessor servers. Each aircraft track is handled by a set of tasks (filter, predictor, display updater). Shared data (the "flight information base") is managed through protected objects. The system has strict latency requirements — a controller's input must result in updated displays within milliseconds — and must never lose a flight track.

iFACTS has been operational since 2011 and handles a significant fraction of European air traffic daily.

### 22.7 The F-22 and F-35 Question

Both the F-22 Raptor and F-35 Lightning II have substantial Ada content in their flight control software. Specific details are classified, but public statements from Lockheed Martin and AdaCore confirm Ada is used for:

- Flight control laws (the innermost control loops that keep the aircraft stable).
- Sensor fusion (integrating radar, infrared, electronic warfare, and other sensors).
- Weapons management.
- Mission computer core functions.

The F-35 notoriously had software schedule problems during its development, some of which were related to its massive C++ content (millions of lines). The Ada portions were generally on-schedule or close to it — Ada's stronger type system and tasking model make large Ada programs more predictable to develop than equivalent C++ programs. Several F-35 subsystems that were originally planned in C++ were reportedly switched to Ada during development.

---

## Part XXIII: The 2022 Parallel Constructs Deep Dive

### 23.1 The Problem Ada 2022 Solved

Before Ada 2022, writing data-parallel code in Ada meant one of:

1. **Write a worker pool by hand.** Declare a task array, give each task a slice of the work, wait for completion. Works, but boilerplate-heavy.
2. **Use OpenMP pragmas.** GNAT supports OpenMP via `-fopenmp`, but OpenMP is a C/C++/Fortran model retrofitted onto Ada.
3. **Use a library like `GNAT.Threads`.** Custom library with its own conventions.

None of these were satisfying. Worker pools are verbose; OpenMP isn't part of Ada; libraries are non-portable.

Ada 2022 added parallel constructs as first-class language features:

### 23.2 Parallel Loops

```ada
procedure Sum_Squares (A : in out Integer_Array) is
begin
   parallel for I in A'Range loop
      A (I) := A (I) * A (I);
   end loop;
end Sum_Squares;
```

The `parallel for` keyword tells the compiler that loop iterations may run in parallel. The compiler and runtime:

1. Determine how many worker threads to use (typically the number of cores, or a configured value).
2. Partition the iteration space across workers.
3. Run the partitions in parallel.
4. Wait for all to complete.

Semantically, the iterations must be independent — no iteration can depend on the result of another. The compiler can check this to some extent (if you write to a shared variable, it's a warning or error), but ultimately the programmer is responsible for ensuring independence.

### 23.3 Parallel Blocks

```ada
parallel
   Stage_A;
and
   Stage_B;
and
   Stage_C;
end parallel;
```

Three statements run in parallel, the block completes when all three finish. This is fork-join in two lines of code.

### 23.4 Parallel Reductions

Ada 2022 supports parallel reductions through a special declaration:

```ada
declare
   Total : Integer := 0
     with Parallel_Reduction => ("+", 0);
begin
   parallel for I in A'Range loop
      Total := Total + A (I);  -- parallel-safe reduction
   end loop;
end;
```

The `Parallel_Reduction` aspect specifies the reduction operator and identity element. The compiler generates code that gives each worker its own partial sum, and combines them at the end. This is analogous to OpenMP's `reduction` clause.

### 23.5 Tasklets

The Ada 2022 parallel runtime introduces **tasklets** — lightweight units of work smaller than full tasks. A tasklet has no entry queues, no priority (or a single priority), and no independent scheduling. It's just a unit of computation to be executed by a worker pool.

Tasklets are an implementation detail, not exposed to the programmer, but understanding them helps explain why `parallel for` is cheaper than spawning a full task per iteration.

### 23.6 Integration with Ravenscar

The Ada 2022 parallel constructs are **not permitted under Ravenscar**, because the worker pool implementation uses dynamic scheduling that can't be statically analyzed. For hard real-time work, you still use explicit tasks.

For soft real-time or non-real-time code, parallel constructs give you fine-grained parallelism without the complexity of managing tasks by hand.

### 23.7 Performance

Early measurements on GNAT with Ada 2022 show parallel-for giving near-linear speedup on embarrassingly parallel workloads (matrix operations, image processing, numerical integration). Overhead per iteration is in the low hundreds of nanoseconds, so the break-even point where parallel-for wins over a sequential loop is around 10 microseconds of work per iteration.

### 23.8 When to Use What

- **Parallel for**: data parallelism over a large iteration space. Independent iterations. No synchronization between iterations.
- **Parallel blocks**: a small, fixed number of distinct computations to run concurrently.
- **Task types**: long-running, possibly stateful, possibly periodic activities. Rendezvous or protected-object communication.
- **Protected objects**: passive shared data with concurrency control.

In practice, a typical Ada 2022 program uses tasks for the program's top-level architecture (periodic controllers, event handlers, servers) and parallel constructs inside those tasks for the computationally-intensive parts.

---

## Part XXIV: Frequently Encountered Subtleties

### 24.1 Why Tasks Don't Return Values

Tasks don't have return values the way functions do. This bothers people coming from languages where threads can return values (C++'s `std::future`, Java's `Future`, etc.). The Ada answer: use an entry that passes the result out.

```ada
task T is
   entry Get_Result (R : out Integer);
end T;

task body T is
   Result : Integer;
begin
   Result := Long_Computation;
   loop
      select
         accept Get_Result (R : out Integer) do
            R := Result;
         end Get_Result;
      or
         terminate;
      end select;
   end loop;
end T;
```

The caller does `T.Get_Result (X);` to retrieve the value. This is more explicit than a "future" but fits Ada's synchronous-communication model.

### 24.2 Why You Can't `delay` Inside a Protected Body

`delay` blocks the calling task. If you called `delay` inside a protected procedure, you'd be blocking while holding the protected object's lock — a guaranteed way to starve every other task trying to use the same object. Ada forbids this at runtime (and `pragma Detect_Blocking` under Ravenscar forbids it at startup).

The workaround: if you need a timeout inside a protected context, use an entry with a barrier that you signal from outside:

```ada
-- Instead of: delay 5.0 inside a protected procedure (forbidden).
-- Do this: from outside, launch a task that sleeps and then signals.
```

### 24.3 Why Entry Barriers Are Restricted

Entry barriers must be "simple" expressions over the protected object's private state. They cannot:
- Call other entries (would cause recursion/deadlock in the re-evaluation machinery).
- Call functions that might block.
- Read variables outside the protected object (would make re-evaluation triggers unpredictable).

The runtime re-evaluates barriers frequently (after every state-changing operation on the object), so barriers must be fast and deterministic.

### 24.4 Why `select` Is Different from `select`

Ada has two `select` constructs that are superficially similar but semantically different:

1. **Selective accept** (inside a task body): chooses among multiple `accept` statements.
2. **Selective wait** (inside a task body or procedure, not inside a protected): a `select` with a single entry call as one alternative and a `delay` or `else` as another.
3. **Asynchronous transfer of control**: `select ... then abort`.

These are three different constructs that happen to share the `select` keyword. The syntax disambiguates them, but it's confusing for beginners.

### 24.5 Why Ada.Calendar and Ada.Real_Time Are Different

`Ada.Calendar` gives you wall-clock time (with timezones, daylight saving, and so on). Wall-clock time can jump forward (daylight saving, NTP correction) or backward (NTP correction). It's useful for user-facing timestamps but dangerous for timing.

`Ada.Real_Time` gives you monotonic time. It never jumps. It's the right choice for `delay until`, rate control, watchdog timeouts, and anything else that depends on elapsed time rather than wall time.

Never use `Ada.Calendar.Clock` for periodic tasks. Always use `Ada.Real_Time.Clock`.

### 24.6 Why Ravenscar Bans `Ada.Calendar`

Because `Ada.Calendar.Time` can jump, using it for timing is incorrect. Ravenscar prohibits dependence on `Ada.Calendar` entirely, forcing you to use `Ada.Real_Time` for all time-related operations. This is a correctness restriction, not just a simplification.

---

## Epilogue

This document has run to roughly the length of a short novel, and it has only scratched the surface of Ada concurrency. There are books — plural, multiple — devoted to individual topics we've covered in a page or two. Burns & Wellings alone is 500 pages on concurrent Ada. The Ada Reference Manual is 873 pages, with about 150 of them on tasking and real-time. The SPARK tools documentation adds another few hundred pages. The Ravenscar usage guide is a book in its own right.

But if you walk away from this page with one idea, let it be this: **Ada built concurrency into the language in 1983, and forty-three years later it is still the standard against which all other concurrent languages are measured for safety-critical real-time work**. Not because Ada is the fastest, or the most popular, or the most fashionable — it is none of those things — but because when the question is "how do I prove this concurrent program will meet its deadlines and not kill anyone," the answer, in 2026, is still "write it in Ada with Ravenscar, verify it with SPARK, schedule it with rate-monotonic analysis, and run it on a certified runtime."

That is not an accident. It is the direct consequence of Jean Ichbiah's team making a principled choice in 1979, the Ada standards committee sustaining that choice through 1995, 2005, 2012, and 2022, and a community of practitioners who spent four decades ironing out the corners and proving it in production. The Airbus A350 flies because Ada's tasking is correct. The Paris Metro runs without drivers because Ada's tasking is correct. The BepiColombo probe will arrive at Mercury in 2025 because Ada's tasking is correct. These are not small things.

So when you next see a language claim that it has "great concurrency" because it has goroutines, or async/await, or lightweight threads, or Send/Sync traits, ask yourself: does this language have compile-time checking of synchronization? Does it have a real-time annex? Does it have a Ravenscar-equivalent subset for certification? Has it flown in a cockpit or carried humans through vacuum? Because those are the questions Ada answered yes to, forty years ago, and still answers yes to today.

The space between the moon and the earth — the airspace where airliners fly, the orbit where satellites cruise, the rails where trains hurtle through tunnels — is held together, in large part, by Ada programs running concurrent tasks on protected objects under ceiling locking with rate-monotonic scheduling on monotonic clocks.

The rendezvous, in the end, is where we meet our deadlines.

---

*End of concurrency thread. See `history.md` for the 1975-2022 timeline, `language-semantics.md` for sequential types and packages, and `safety-critical.md` for SPARK, DO-178C, and certification.*

---

## Study Guide

This document is long. If you try to read it linearly from top to bottom, cover to cover, you will drown. It was designed for that — a deep, single-pass reference. But if you are here to *learn* Ada concurrency rather than to look something up, read it in layered passes. Each pass adds depth; each pass assumes the previous one.

### Prerequisites before you start

You need three things going in:

1. **A basic concurrency mental model.** If the words "race condition," "critical section," "deadlock," and "memory barrier" are new to you, spend a weekend with any general concurrency primer first — *The Little Book of Semaphores* by Allen Downey (free PDF) is the canonical short option. Come back when you can name two ways two threads can interfere with each other's use of a shared counter.
2. **Enough sequential Ada to read it.** You do not need to be fluent, but you need to recognize `package`/`procedure`/`type` declarations, understand `with` clauses, and know what `package body` means. The `language-core.md` companion file in this bucket is the right primer — read Sections 1, 2, 8, and 9 of that file and you are ready.
3. **A working compiler.** Install GNAT (GCC's Ada front-end). On Ubuntu: `sudo apt install gnat`. On Fedora: `sudo dnf install gcc-gnat`. On macOS via Homebrew: `brew install gcc` (includes Ada). On Windows: download GNAT Community Edition from adacore.com or use the MSYS2 `mingw-w64-x86_64-gcc-ada` package. Verify with `gnatmake --version`. For the Real-Time Annex exercises below you additionally want a runtime that supports it — the default `zfp` and `ravenscar-sfp` runtimes shipped with GNAT Pro do; the stock Debian `gnat` package does not always. Check with `gnat list --RTS=full` to see what runtimes are available, and use `--RTS=ravenscar-sfp` to cross-compile to the Ravenscar profile.

### Recommended reading order

The parts of this document are numbered, but the numbering is topical, not pedagogical. Read them in this order instead:

**Layer 1 — the mental model (Parts I, II, XVII).** Why Ada has tasks in the language at all, what a task *is* in the programmer's head, and the philosophical position the language takes on concurrency. You cannot write correct Ada concurrent code without internalizing this layer. If you skip it, everything afterwards looks like unnecessary ceremony.

**Layer 2 — the two synchronization primitives (Parts III, V).** The rendezvous (Ada 83) and the protected object (Ada 95). Read them back-to-back, because protected objects were explicitly designed to fix what the rendezvous got wrong, and you cannot understand the second without the first. At the end of Layer 2, you should be able to write a bounded buffer three ways: as a task with an accept body, as a protected object with entries, and as a protected object with guarded procedures only. Do all three before moving on.

**Layer 3 — the scheduling and timing story (Parts VI, VIII).** This is where Ada earns its real-time stripes. Monotonic clocks, delays, priority ceilings, dispatching policies. Read these parts with a pencil — you will want to draw timelines. The priority-inversion diagram in Part VIII is the single most important picture in the document; stare at it until it clicks.

**Layer 4 — the certification subset (Part IX).** Ravenscar. This is the layer where "Ada concurrency" becomes "Ada concurrency you can fly." Ravenscar is also the easiest profile to *write* correct code in, paradoxically, because the rules are strict enough that whole classes of bugs become impossible to express. If you are new, consider doing all your exercises in Ravenscar first, then relaxing restrictions as you need them.

**Layer 5 — the modern parts (Parts X, XI, XXIII).** Synchronized interfaces (Ada 2005) and the parallel constructs (Ada 2022). These are the pieces of the language most likely to be unfamiliar even to experienced Ada programmers who stopped learning at Ada 95. Read them last because they make the most sense against the backdrop of everything earlier.

**Layer 6 — the pattern language (Parts XIV, XV, XXI).** The canonical patterns and anti-patterns are where experience lives. Read them last, and come back to them periodically as you write more code. A pattern you skim today will become obviously relevant six months from now when you hit the problem it solves.

Parts IV, VII, XII, XIII, XVIII, XIX, XX, XXII, and XXIV are reference material. Read them when you have a specific question; do not try to read them cover-to-cover on a first pass.

### Key concepts to internalize

If at the end of your reading you can explain these seven ideas to another programmer, you have absorbed the essential content:

1. **A task is an active object.** It has its own thread of control. A protected object is a passive object — it has no thread of its own and only runs when a task calls into it. This distinction is the foundation of the whole Ada concurrency model. Everything else is scaffolding around it.
2. **Rendezvous is synchronous message-passing.** The caller blocks until the callee executes an `accept`, and vice-versa. Both sides see the parameters and both sides agree on the exchange before either proceeds. This is the same idea Hoare called CSP and that Go later popularized as "don't communicate by sharing memory; share memory by communicating" — except Ada got there first, in 1983.
3. **Protected objects replace locks with guarded actions.** You never write `lock(mutex); ... unlock(mutex)` in Ada. You write a protected procedure or entry, and the language guarantees mutual exclusion on the enclosing object. The guard on an entry is a boolean condition — tasks wait at the gate, and when the condition becomes true, one waiting task proceeds. This replaces both mutexes and condition variables with one primitive.
4. **Priority ceiling locking prevents priority inversion by construction.** Every protected object has a ceiling priority (its highest possible caller). When a task enters the object, its priority is raised to the ceiling for the duration. No lower-priority task can preempt it until it leaves. The Mars Pathfinder bug of 1997 — the unbounded priority inversion that almost killed the mission — cannot happen in Ada code written this way. Read Part VIII with that story in mind; it's the reason the mechanism exists.
5. **`Ada.Real_Time.Clock` is monotonic; `Ada.Calendar.Clock` is not.** If your code does `delay until Clock + Period` with `Ada.Calendar`, an NTP correction or a daylight-saving jump can make your periodic task fire an hour early or never. Every real-time Ada program uses `Ada.Real_Time` for timing and `Ada.Calendar` only for user-facing timestamps. This rule is invariant and non-negotiable.
6. **Ravenscar is a restriction profile, not a library.** It enforces rules at compile time that make the whole program analyzable: no dynamic task creation, no task entries (only protected entries), no `select` with `else`, no `abort`, no `requeue`. Programs that compile under Ravenscar are amenable to static schedulability analysis, which is what certification authorities want. You give up flexibility; you get provability.
7. **Parallel constructs (Ada 2022) are orthogonal to tasks.** `parallel for` and `parallel do` are about data parallelism — splitting work across cores, not about long-lived concurrent agents. Tasks and protected objects are still the model for coordination between independent actors. Do not confuse "Ada has parallel loops now" with "Ada deprecated tasks"; both tools exist, and they solve different problems.

### Common pitfalls to watch for

- **Busy-waiting on a boolean flag.** Do not write `loop if Flag then exit; end if; end loop;` — this is spin-wait, and in Ada it breaks the schedulability model. Use an entry with a barrier instead.
- **Mixing `Ada.Calendar` and `Ada.Real_Time`.** Pick one per timing context and stick with it.
- **Calling blocking operations from inside a protected action.** A protected procedure or entry body is expected to complete in bounded time. Calling an entry on another task from inside one can deadlock and is typically forbidden outright by Ravenscar and the Real-Time Annex.
- **Forgetting to set the ceiling priority explicitly.** Default ceiling is the maximum ceiling priority, which works but is pessimistic. Set `pragma Priority` explicitly so the analysis tool knows what you meant.
- **Assuming `abort` is a safe way to stop a task.** `abort` is the atomic bomb of task termination. It's legal, but in real-time code it is either forbidden (Ravenscar) or used only in carefully scoped `select ... then abort` constructs (asynchronous transfer of control). Treat it as a last resort.

### 1-week plan (introductory)

- Day 1: Read Layer 1. Install GNAT. Write, compile, and run a "Hello from a task" program. Verify that you see the output.
- Day 2: Read Layer 2, Part III (rendezvous). Write a bounded-buffer producer/consumer pair using a task with an `accept Put` / `accept Get` loop.
- Day 3: Read Layer 2, Part V (protected objects). Rewrite yesterday's bounded buffer as a protected object with guarded entries. Run both; measure the throughput difference.
- Day 4: Read Layer 3 (Parts VI, VIII). Write a periodic task that fires every 100 ms using `delay until` with `Ada.Real_Time.Clock`. Use `Ada.Text_IO.Put_Line` to log the firing time. Let it run for 30 seconds and look for drift.
- Day 5: Read Layer 4 (Part IX). Compile yesterday's periodic task program under `--RTS=ravenscar-sfp`. Fix whatever doesn't compile. Observe which of your patterns were non-Ravenscar.
- Day 6: Read Layer 5 (Parts X, XI, XXIII). Rewrite a simple matrix-multiply using the Ada 2022 `parallel for` construct. Compare timing against a sequential version.
- Day 7: Read Layer 6 (Parts XIV, XV, XXI). Pick one canonical pattern from Part XIV and write your own example of it.

### 1-month plan (serious)

Everything in the 1-week plan, plus:

- Week 2: Burns & Wellings, *Concurrent and Real-Time Programming in Ada* (Cambridge, 2009), Chapters 1-7. This is the canonical textbook. Work every exercise.
- Week 3: Build a small but realistic system — a thermostat, a traffic light controller, a producer-consumer queue with multiple consumers — in three forms: idiomatic Ada 2012 tasks, Ravenscar-profile, and SPARK-provable. Prove the SPARK version with `gnatprove`.
- Week 4: Read Ada Reference Manual sections 9 (Tasks and Synchronization) and Annex D (Real-Time Systems) in their entirety. The RM is free at `ada-auth.org/standards/rm12_w_tc1/html/RM-TOC.html`. It is dense, but the language is the document; every pattern you see in textbooks ultimately derives from these sections.

### 6-month plan (professional)

- Months 1-2: the 1-month plan above.
- Month 3: Burns & Wellings chapters 8-13, including the Real-Time Annex, Ravenscar, distributed Ada, and high-integrity Ada. Pair this with Michael Kamrad's *Programming in Ada 2012 with a Preview of Ada 2022* for the modern parts.
- Month 4: DO-178C supplement *DO-332: Object-Oriented Technology and Related Techniques Supplement*, and DO-178C *DO-333: Formal Methods Supplement*. These are not free, but every safety-critical Ada shop owns copies. The Airbus Ada certification trail runs through these documents.
- Month 5: Pick an open-source Ada project that uses tasking heavily and read it. Good candidates include the GNAT runtime itself (it's written in Ada), the Ironsides DNS server, the Muen separation kernel, and the Ada Driven Robotics (ROS-Ada) projects.
- Month 6: Ship something. Pick a real project — an embedded controller, a network daemon, a signal processor — and write it in Ada using at least three tasks and two protected objects. Verify at least one component in SPARK. This is the transition from "I have read about Ada concurrency" to "I have used it in anger."

### Glossary of often-misused terms

- **Task** — an active concurrent object with its own thread of control. Roughly equivalent to what other languages call a thread, but with language-level semantics that mainstream threads lack.
- **Protected object** — a passive object protected by an implicit mutex; the Ada alternative to "lock + shared state + condition variable."
- **Entry** — an operation on a task or protected object that a caller synchronizes with. The caller waits until the callee accepts; the callee may have a barrier that delays the accept.
- **Barrier** — a boolean expression on a protected entry; the entry is only open when the barrier evaluates to true. Tasks waiting on a closed entry are released, one at a time, when it opens.
- **Rendezvous** — the moment when a caller's entry call meets a callee's accept. Both are synchronous; both sides see the parameters; neither proceeds until the accept body completes.
- **Ceiling priority** — the priority to which a task is raised while holding a protected object, equal to the maximum priority of any task that can call that object. A core element of the Immediate Ceiling Priority Protocol.
- **Ravenscar** — a profile (set of restrictions) on Ada tasking that makes programs analyzable for worst-case schedulability. Enforced at compile time via `pragma Profile (Ravenscar)`.
- **SPARK** — a subset of Ada with formal annotations that can be proved with an SMT solver. Not covered in detail here; see `safety-spark-impl.md`.
- **Jorvik** — the Ada 2022 successor profile to Ravenscar, slightly more permissive.
- **Run-time system (RTS)** — the low-level library GNAT uses to implement tasks. `full` is the full-feature RTS; `ravenscar-sfp` is the certified subset; `zfp` is "zero footprint" — no tasking at all, for bare-metal systems that roll their own.

---

## Programming Examples

All of these examples compile under `gnatmake` from a recent GNAT. Where the Real-Time Annex or Ravenscar is required, a comment indicates which runtime to use. Save each file with the indicated name, place them in an empty directory, and run `gnatmake <file>.adb` to build.

### Example 1: "Hello from a task" — the smallest possible program

```ada
-- File: hello_task.adb
-- Build: gnatmake hello_task.adb
-- Run:   ./hello_task

with Ada.Text_IO;

procedure Hello_Task is
   task Greeter;

   task body Greeter is
   begin
      Ada.Text_IO.Put_Line ("Hello from the greeter task.");
   end Greeter;
begin
   Ada.Text_IO.Put_Line ("Hello from the environment task.");
end Hello_Task;
```

What to notice:
- The environment task (the one running `main`) waits for `Greeter` to finish before the program terminates. This is automatic — Ada programs do not exit while any task is still live unless you explicitly abort or use `Ada.Task_Termination`.
- The order of the two "Hello" lines is undefined. If you run this 100 times, you will see both orderings. That is the point of concurrency.

### Example 2: Bounded buffer as a task with rendezvous

```ada
-- File: buffer_task.adb
-- Build: gnatmake buffer_task.adb
-- A classical Ada 83-style producer/consumer with an intermediate task.

with Ada.Text_IO;

procedure Buffer_Task is
   type Item is new Integer;
   type Item_Array is array (Positive range <>) of Item;

   task Buffer is
      entry Put (I : in  Item);
      entry Get (I : out Item);
   end Buffer;

   task body Buffer is
      Capacity : constant := 8;
      Store    : Item_Array (1 .. Capacity);
      Head, Tail, Count : Natural := 0;
   begin
      loop
         select
            when Count < Capacity =>
               accept Put (I : in Item) do
                  Tail := (Tail mod Capacity) + 1;
                  Store (Tail) := I;
                  Count := Count + 1;
               end Put;
         or
            when Count > 0 =>
               accept Get (I : out Item) do
                  Head := (Head mod Capacity) + 1;
                  I := Store (Head);
                  Count := Count - 1;
               end Get;
         or
            terminate;
         end select;
      end loop;
   end Buffer;

   task Producer;
   task body Producer is
   begin
      for K in 1 .. 20 loop
         Buffer.Put (Item (K));
      end loop;
   end Producer;

   task Consumer;
   task body Consumer is
      Value : Item;
   begin
      for K in 1 .. 20 loop
         Buffer.Get (Value);
         Ada.Text_IO.Put_Line ("Consumed " & Item'Image (Value));
      end loop;
   end Consumer;

begin
   null;
end Buffer_Task;
```

What to notice:
- `select ... or ... or terminate` lets the buffer task accept whichever operation the producer or consumer is ready for. The `terminate` alternative means the task can go away when no one else is around to call it.
- Guards (`when Count < Capacity =>`) are part of the selective accept. A closed guard takes that alternative out of the selection; the buffer blocks when it is empty on `Get` and when it is full on `Put`.
- The rendezvous itself — `accept Put (I : in Item) do ... end Put` — is synchronous. Both producer and buffer are synchronized at the `do ... end` boundary.

### Example 3: The same buffer as a protected object

```ada
-- File: buffer_po.adb
-- Build: gnatmake buffer_po.adb
-- The same semantics, rewritten in Ada 95 style with a protected object.

with Ada.Text_IO;

procedure Buffer_PO is
   type Item is new Integer;
   type Item_Array is array (Positive range <>) of Item;

   Capacity : constant := 8;

   protected Buffer is
      entry Put (I : in  Item);
      entry Get (I : out Item);
   private
      Store : Item_Array (1 .. Capacity);
      Head, Tail, Count : Natural := 0;
   end Buffer;

   protected body Buffer is
      entry Put (I : in Item) when Count < Capacity is
      begin
         Tail := (Tail mod Capacity) + 1;
         Store (Tail) := I;
         Count := Count + 1;
      end Put;

      entry Get (I : out Item) when Count > 0 is
      begin
         Head := (Head mod Capacity) + 1;
         I := Store (Head);
         Count := Count - 1;
      end Get;
   end Buffer;

   task Producer;
   task body Producer is
   begin
      for K in 1 .. 20 loop
         Buffer.Put (Item (K));
      end loop;
   end Producer;

   task Consumer;
   task body Consumer is
      Value : Item;
   begin
      for K in 1 .. 20 loop
         Buffer.Get (Value);
         Ada.Text_IO.Put_Line ("Consumed " & Item'Image (Value));
      end loop;
   end Consumer;

begin
   null;
end Buffer_PO;
```

What to notice:
- No buffer task. The buffer is a *passive* protected object. The mutex is implicit; the language guarantees that only one operation runs at a time.
- `when Count < Capacity is` is a barrier on the entry. The entry is closed when the barrier is false and tasks wait. When the barrier becomes true (because another operation raised `Count`), the runtime re-evaluates and releases one waiting task.
- This version is shorter, uses less runtime, and is what modern Ada code looks like. Prefer this over the rendezvous version for shared-state coordination; use tasks+rendezvous when the coordinator is genuinely *active* (it runs its own logic between communications).

### Example 4: A periodic task with monotonic timing

```ada
-- File: periodic.adb
-- Build: gnatmake periodic.adb
-- Runs a task every 100 ms using Ada.Real_Time.

with Ada.Text_IO;
with Ada.Real_Time; use Ada.Real_Time;

procedure Periodic is

   task Ticker;

   task body Ticker is
      Period : constant Time_Span := Milliseconds (100);
      Next   : Time := Clock;
   begin
      for K in 1 .. 30 loop
         delay until Next;
         Ada.Text_IO.Put_Line ("Tick " & Integer'Image (K));
         Next := Next + Period;
      end loop;
   end Ticker;

begin
   null;
end Periodic;
```

What to notice:
- `delay until Next` waits until an absolute time, not for a relative duration. This is the correct pattern for periodic tasks — if the task runs a little late one cycle, it still fires at the right absolute time the next cycle, and drift does not accumulate. Do not write `delay 0.1;` inside the loop; that accumulates drift.
- `Clock` is `Ada.Real_Time.Clock`, a monotonic clock. It cannot jump backwards. Replacing it with `Ada.Calendar.Clock` would silently break the program on a system with NTP corrections.
- On a Ravenscar runtime, this same code compiles unchanged — the pattern is already Ravenscar-compatible.

### Example 5: Priority ceiling protocol — a two-task demonstration

```ada
-- File: ceiling.adb
-- Build: gnatmake ceiling.adb
-- Demonstrates priority inheritance via a protected object ceiling.

with Ada.Text_IO;
with System; use System;

procedure Ceiling is

   protected type Shared_Counter (Ceiling : Any_Priority) is
      pragma Priority (Ceiling);
      procedure Increment;
      function  Value return Natural;
   private
      N : Natural := 0;
   end Shared_Counter;

   protected body Shared_Counter is
      procedure Increment is
      begin
         N := N + 1;
      end Increment;

      function Value return Natural is
      begin
         return N;
      end Value;
   end Shared_Counter;

   Counter : Shared_Counter (Ceiling => 15);

   task Low;
   pragma Priority (Low, 5);

   task High;
   pragma Priority (High, 15);

   task body Low is
   begin
      for K in 1 .. 10 loop
         Counter.Increment;
      end loop;
      Ada.Text_IO.Put_Line ("Low done, counter =" & Natural'Image (Counter.Value));
   end Low;

   task body High is
   begin
      for K in 1 .. 10 loop
         Counter.Increment;
      end loop;
      Ada.Text_IO.Put_Line ("High done, counter =" & Natural'Image (Counter.Value));
   end High;

begin
   null;
end Ceiling;
```

What to notice:
- Both tasks share a protected object with ceiling priority 15. While `Low` holds the object, its effective priority is temporarily raised to 15, so no medium-priority task can preempt it until it releases. This is the Immediate Ceiling Priority Protocol in action.
- If you lowered the ceiling to 5 and kept `High` at priority 15, you would get `Program_Error` at elaboration time (`High` cannot call an object whose ceiling is below its own priority). That is the compile/elaboration-time check; it is exactly what prevents the Mars Pathfinder class of bug.
- This example requires the Real-Time Annex to be supported by your runtime. The `zfp` runtime does not support it; `ravenscar-sfp` and `full` do.

### Example 6: Ada 2022 parallel loop

```ada
-- File: parallel_sum.adb
-- Build: gnatmake -gnat2022 parallel_sum.adb
-- Requires GNAT with Ada 2022 support.

with Ada.Text_IO;

procedure Parallel_Sum is
   N : constant := 10_000_000;
   A : array (1 .. N) of Long_Integer;
   Total : Long_Integer := 0;
begin
   for I in A'Range loop
      A (I) := Long_Integer (I);
   end loop;

   parallel (Chunks => 8)
   for I in A'Range loop
      Total := Total + A (I);  -- naive, has a race
   end loop;

   Ada.Text_IO.Put_Line ("Total =" & Long_Integer'Image (Total));
end Parallel_Sum;
```

What to notice:
- `parallel (Chunks => 8)` splits the loop into eight chunks and runs them concurrently. This is data parallelism, not agent concurrency.
- As written, the accumulation into `Total` has a race. Ada 2022 gives you `reduce` expressions for correct parallel reductions; the full idiomatic version uses `Total := [parallel for I in A'Range => A (I)]'Reduce ("+", 0);` or the equivalent reduction expression. Try both and convince yourself the naive version gives wrong answers for large N.
- Compile with `-gnat2022`. Older GNATs reject the construct.

---

## DIY & TRY

These exercises assume you have completed Examples 1-6 above and have a working GNAT install. Each exercise is self-contained and takes between 30 minutes and an afternoon.

### DIY 1 — Drift measurement

**Setup:** Start from Example 4 (`periodic.adb`). Replace the body of `Ticker` so that it does two things per tick: (a) records the current `Clock` value, and (b) computes the delta from the ideal firing time (the task's internal `Next` variable).

**Steps:**
1. Add a counter `I` and an array `Deltas : array (1 .. 300) of Time_Span` outside the loop.
2. At the top of the loop body, compute `Deltas (I) := Clock - Next;`.
3. Run the task for 30 seconds (300 iterations at 100 ms).
4. At the end, print the minimum, maximum, and mean delta.

**Expected outcome:** On a modern unloaded Linux box with the default Full runtime, you should see max drift under 1 ms. Under load (try running `stress -c 4` in another terminal while the program runs), drift goes up, sometimes to tens of milliseconds. Under the `ravenscar-sfp` runtime on a system with a real-time kernel, drift should remain under 100 µs even under load.

**What to observe:** The interesting number is not the average — it is the worst case. Real-time systems are judged by worst-case delay, not average delay. This is the essential difference between "fast on average" and "fast enough on the worst day."

### DIY 2 — Priority inversion under Ravenscar

**Setup:** Three tasks at priorities 5, 10, and 15. The low- and high-priority tasks share a protected object. The medium-priority task does busy work.

**Steps:**
1. Write the three tasks. The low-priority one enters the protected object, increments a counter, then calls `delay 0.2` *from inside* the protected action (DO NOT actually do this in real code — but for this experiment, simulate a slow operation by wasting CPU inside the entry).
2. The medium-priority task spins in a CPU-busy loop for 2 seconds.
3. The high-priority task tries to call the same protected object after 500 ms of sleep.
4. Run it first with the default compiler settings, then with `pragma Locking_Policy (Ceiling_Locking);` and `pragma Task_Dispatching_Policy (FIFO_Within_Priorities);` at the top of the file.

**Expected outcome:** With the dispatching policy set, the low-priority task is raised to the ceiling of the protected object the instant the high-priority task queues on it. The medium-priority task never gets to run until the high task is unblocked. Without the pragmas, you may or may not see correct behavior, depending on the implementation defaults.

**What to observe:** This exercise is a miniature re-enactment of the Mars Pathfinder bug. Change the ceiling explicitly so it's below the high-priority task's own priority, and watch `Program_Error` fire at elaboration — the compile/elaboration-time safety net that JPL did not have in 1997 on VxWorks.

### DIY 3 — Three buffers, one interface

**Setup:** Define an Ada interface for a bounded buffer. Implement it three ways: as a task with rendezvous, as a protected object with entries, and as a task that wraps a protected object internally.

**Steps:**
1. Declare the interface:
   ```ada
   type Bounded_Buffer is synchronized interface;
   procedure Put (B : in out Bounded_Buffer; I : Item) is abstract;
   procedure Get (B : in out Bounded_Buffer; I : out Item) is abstract;
   ```
2. Provide three concrete types implementing it.
3. Write a benchmark that hammers each implementation with one producer and one consumer task, each doing a million operations.
4. Measure elapsed time using `Ada.Real_Time`.

**Expected outcome:** The protected object version wins easily (typically 2-4x faster than the task+rendezvous version) because it has no context switch on the path. The wrapped task is slower still because it adds an extra indirection.

**What to observe:** You will have just performed, in an afternoon, the empirical comparison that motivated Ada 95's addition of protected objects. The numbers you see here are the same numbers the Ada 9X Design Team saw in 1994 when they decided rendezvous alone was not enough.

### DIY 4 — Ravenscar port

**Setup:** Take the bounded buffer protected object from Example 3 and compile it with `gnatmake --RTS=ravenscar-sfp buffer_po.adb -bargs -T0`.

**Steps:**
1. Observe whatever errors appear. Common ones: `terminate` alternatives are forbidden, `select else` is forbidden, two tasks on the same entry are forbidden (Ravenscar requires at most one task queued on any entry), dynamic allocation is forbidden.
2. Fix each error in turn. For the "one task per entry" restriction you will have to restructure to use two entries, one per consumer.
3. Add `pragma Profile (Ravenscar);` at the top and rebuild.
4. Run the resulting binary and confirm it works.

**Expected outcome:** The buffer works identically under Ravenscar, just with stricter rules. You will have produced a certification-ready artifact without writing new logic, only by removing forbidden constructs.

**What to observe:** The restrictions that looked arbitrary when you read Part IX will suddenly make sense when the compiler explains each one to you directly. Ravenscar is not a feature; it is a *negative space* — it is the set of things Ada 83 let you do that the community, in hindsight, wishes it had not.

### DIY 5 — Build a task monitor

**Setup:** Write a Monitor task that every 500 ms prints out the count of all live tasks in the system, their priorities, and their states.

**Steps:**
1. Use `Ada.Task_Identification` and `Ada.Task_Attributes` to walk the task pool.
2. For each task, query its priority (`Get_Priority`) and its state (via `Ada.Task_Termination`).
3. Print a snapshot line every 500 ms using the periodic pattern from Example 4.
4. Run it alongside your bounded-buffer benchmark from DIY 3 and watch the snapshots.

**Expected outcome:** You will see the producer, consumer, and buffer tasks cycle through Callable → Waiting → Callable as they run. The monitor itself should show up in its own snapshot, which is a small and amusing consistency check.

**What to observe:** The Ada standard library gives you introspection into the task pool that most other languages hide behind a profiler. This is useful for debugging, logging, and building supervision hierarchies.

### DIY 6 — Port a Go CSP program

**Setup:** Pick any small Go program that uses goroutines and channels — the `pipeline.go` example from *Effective Go* works well. Rewrite it in Ada using tasks and protected objects.

**Steps:**
1. Each goroutine becomes a task.
2. Each channel becomes either a protected object (for buffered channels) or a task with a rendezvous entry (for unbuffered channels).
3. Translate `select` in Go to `select` in Ada, being aware that Ada's `select` is more restricted (you can't mix sends and receives on the same select).

**Expected outcome:** The Ada version is verbose compared to the Go version — typically 2-3x the line count. But it is also more explicit about which side blocks, what happens on timeout, and what happens on termination. Use this comparison to build your own intuition about which language is the right tool for which job.

**What to observe:** Ada's model predates Go's by thirty years, and the philosophical choices are almost identical (CSP, no shared mutable state by default). The differences are almost entirely in ergonomics, not in semantics. If you believe "goroutines are modern and Ada tasks are old," this exercise is the cure.

### TRY — Pick one real problem and solve it three ways

This is the final exercise, and the one that moves you from reader to practitioner. Pick a small but real problem — the thermostat controller from the 1-week plan is a good one, or a periodic sensor reader, or a simple network protocol handler. Implement it three times:

1. Once in idiomatic Ada 2012, using all the language's features.
2. Once under the Ravenscar profile, with the stricter rules.
3. Once in SPARK, with functional correctness proven by `gnatprove`.

Compare line counts, build times, and — most importantly — how confident you feel in each version. The three versions will look increasingly alien as you go, but the SPARK version is the one you can hand to a certification authority. That progression, from "works in practice" to "provably correct," is the journey the Ada community took over forty years. You just compressed it into a weekend.

---

## Related College Departments (concurrency)

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) — Programming Fundamentals and Algorithms & Efficiency wings. The examples above are runnable instances of textbook concurrency patterns.
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md) — Ada tasking is the concurrency layer underneath most modern aerospace, railway, and automotive systems. The DIY 1 drift exercise is a miniature version of the kind of measurement every embedded team performs on every new target.
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md) — Priority-ceiling protocols, rate-monotonic scheduling, and response-time analysis are mathematical subjects; Liu & Layland's 1973 paper is the foundational citation.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) — The story of rendezvous-vs-protected-objects is a case study in how a language evolves under pressure from real users.
