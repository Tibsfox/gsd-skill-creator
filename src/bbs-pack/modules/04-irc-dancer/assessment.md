# Module 4: IRC and Dancer -- Assessment

> 5 questions testing understanding, not memorization

## Question 1: Conceptual

Explain the auto-reply rule for NOTICE versus PRIVMSG in IRC. Why does RFC 1459 require that clients must never automatically respond to a NOTICE? Describe a specific scenario involving two IRC bots where violating this rule would cause a problem, and explain how the NOTICE/PRIVMSG distinction prevents it.

## Question 2: Protocol Analysis

Parse the following IRC message into its prefix, command, and parameters:

```
:nick!user@host.example.com PRIVMSG #bbs-discussion :Hello everyone, welcome to the channel!
```

Identify each component according to the RFC 1459 message format grammar. Then construct a valid IRC message (as raw text, including the CR-LF terminator) that would set channel mode +m (moderated) and grant voice (+v) to the user "sysop" in channel #main, all in a single MODE command.

## Question 3: Application

You are writing an IRC bot that needs to respond to the command "!weather <city>" in a channel. When a user types "!weather Amsterdam" in #bbs, the bot should reply with the weather. Describe the complete message flow: (1) what IRC message does the server send to your bot, (2) how does your bot parse it to extract the command and city name, (3) what IRC command does your bot send back, and (4) should the response be PRIVMSG or NOTICE, and why?

## Question 4: Analysis

In Dancer's flood protection algorithm, per-source rate limiting is used instead of a global rate limit. Explain why a per-source limit is more effective for an IRC bot than a global limit. Consider a scenario where 50 users are interacting with the bot normally while one user floods it with 100 messages per second. What would happen under each approach?

## Question 5: Reasoning

Dancer's command dispatch uses a function pointer table (array of structs mapping command strings to handler functions). Compare this design to a large if/else or switch/case chain. What are the advantages of the function pointer table approach for: (1) adding new commands, (2) runtime extensibility, (3) code organization, and (4) testability? Are there any disadvantages?

## Answer Key

### Answer 1

RFC 1459 specifies that PRIVMSG is the standard message delivery command, and clients (including bots) may automatically respond to PRIVMSG messages. NOTICE has identical syntax but carries the semantic requirement that no automatic reply should ever be generated in response.

**Scenario demonstrating the problem:** Consider two IRC bots, BotA and BotB, both in channel #main. Both are programmed to respond to any PRIVMSG addressed to them.

1. A user sends `PRIVMSG #main :BotA, what time is it?`
2. BotA processes the PRIVMSG and responds: `PRIVMSG #main :The time is 15:30`
3. BotB sees this PRIVMSG in the channel and (if poorly programmed) might try to process it as a command, responding: `PRIVMSG #main :I don't understand that command`
4. BotA sees BotB's PRIVMSG and responds again
5. This creates an infinite loop of messages that floods the channel and may cause both bots to be disconnected by the server's flood protection

**How NOTICE prevents this:** If both bots send their automated responses as NOTICE instead of PRIVMSG, neither bot processes the other's response (because they must not auto-reply to NOTICE). The loop is broken by convention. This is why all well-designed IRC bots use NOTICE for automated output and only trigger on PRIVMSG input.

### Answer 2

Parsing the message:

| Component | Value |
|-----------|-------|
| **Prefix** | `nick!user@host.example.com` (everything after the leading `:` up to the first space) |
| **Command** | `PRIVMSG` |
| **Parameter 1** | `#bbs-discussion` (the target channel) |
| **Trailing** | `Hello everyone, welcome to the channel!` (everything after the `: ` -- this is the message text, which may contain spaces) |

The prefix tells us the message was sent by user "nick" with username "user" at host "host.example.com". The command is PRIVMSG, the target is #bbs-discussion, and the trailing parameter is the message content.

**Constructing the MODE command:**

```
MODE #main +mv sysop\r\n
```

This sets +m (moderated) on the channel and +v (voice) for the user "sysop" in a single command. The modes are combined as "+mv" and the parameter "sysop" applies to the +v mode (which requires a target nickname). The +m mode does not require a parameter. The message is terminated by CR-LF (0x0D 0x0A).

### Answer 3

Complete message flow:

**(1) Server sends to bot:**
```
:CoolUser!~cool@dsl-123.isp.net PRIVMSG #bbs :!weather Amsterdam
```
The server forwards the channel message with the sender's full prefix.

**(2) Bot parsing steps:**
- Detect the leading colon: extract prefix "CoolUser!~cool@dsl-123.isp.net"
- Extract command: "PRIVMSG"
- Extract parameter 1: "#bbs" (the channel)
- Extract trailing: "!weather Amsterdam" (the message text)
- The bot's command parser splits the trailing on spaces: command trigger "!weather", argument "Amsterdam"
- The bot recognizes "!weather" as a registered command and extracts "Amsterdam" as the city

**(3) Bot sends response:**
```
NOTICE #bbs :Weather for Amsterdam: 12C, partly cloudy
```

**(4) NOTICE, not PRIVMSG.** The bot should use NOTICE for its automated response because:
- RFC 1459 requires that automated responses never use PRIVMSG
- Using PRIVMSG could trigger other bots in the channel to respond (bot loop potential)
- NOTICE semantically indicates "this is an automated/informational message"
- Some IRC clients visually distinguish NOTICE from PRIVMSG, helping users identify bot output

If the response were sent to the user privately (not the channel), it would be `NOTICE CoolUser :Weather for Amsterdam: 12C, partly cloudy`.

### Answer 4

**Per-source rate limiting** tracks message rates individually for each user (identified by their nick!user@host). **Global rate limiting** tracks a single aggregate message rate across all sources.

**Scenario: 50 normal users + 1 flooder (100 msgs/sec)**

**Under global rate limiting** (say, 50 messages/second threshold):
- The flooder sends 100 msgs/sec, exceeding the global limit almost immediately
- The bot starts dropping ALL incoming messages to stay under the rate limit
- All 50 normal users are penalized -- their legitimate commands are dropped or delayed
- The flooder has effectively denial-of-service'd the bot for everyone
- This is the worst outcome: one bad actor disables the bot for all users

**Under per-source rate limiting** (say, 5 messages/second per user):
- The flooder exceeds their individual limit within the first second
- The bot ignores further messages from the flooder's address for the penalty period
- All 50 normal users continue to interact with the bot normally
- The flooder only harms themselves
- The bot remains functional for everyone except the abuser

Per-source limiting is more effective because IRC abuse is typically source-specific: one user (or a small number) floods while the majority are well-behaved. Global limiting cannot distinguish between legitimate aggregate traffic and abusive traffic from a single source.

### Answer 5

**Function pointer table advantages:**

**(1) Adding new commands:** Adding a command requires only adding one struct entry to the table array (command string, handler function, metadata). No modification to the dispatch logic itself. With if/else, you must add a new branch to the chain, which grows linearly and requires modifying the dispatch function.

**(2) Runtime extensibility:** A function pointer table can be modified at runtime -- entries can be added, removed, or replaced dynamically. This enables plugin architectures where modules register their commands at startup. An if/else chain is compiled statically and cannot be extended without recompilation.

**(3) Code organization:** Each command handler is a separate function in its own logical unit. The dispatch table serves as a clean interface between parsing and handling. With if/else, all handler logic tends to accumulate in a single function, becoming a "god function" that grows unmanageably large.

**(4) Testability:** Individual handler functions can be tested in isolation by calling them directly with constructed parameters. The dispatch table itself can be tested by verifying its entries (no missing handlers, correct parameter counts). With if/else, testing a single command path requires invoking the entire dispatch function and following the specific branch.

**Disadvantages:**
- Slightly more complex initial setup (defining the struct type, populating the table)
- String comparison loop for dispatch is O(n) in the number of commands (though this could be optimized with a hash table)
- Debugging through function pointers can be harder than following explicit if/else branches
- Compiler cannot optimize across the indirect call boundary as well as it can optimize within a switch/case
