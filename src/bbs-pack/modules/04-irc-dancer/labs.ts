/**
 * Module 04: IRC/Dancer interactive labs.
 *
 * Lab 1: IRC message parser — inline implementation of RFC 1459 message parsing,
 * handling prefix, command, params, and trailing parameter correctly.
 *
 * Lab 2: Bot command dispatch — minimal dispatch table pattern mirroring
 * Dancer's command-dispatch.c function pointer routing.
 *
 * learn_notes cross-reference the actual Dancer C source files in
 * data/bbs/dancer-irc/ for educational value.
 *
 * Covers requirement: BBS-08 (interactive labs with verify functions).
 */

import type { BbsLab } from '../../shared/types.js';

/**
 * Parsed IRC message following RFC 1459 grammar.
 * Defined locally because the parser IS the educational exercise.
 */
interface IrcMessage {
  prefix?: string;
  command: string;
  params: string[];
  trailing?: string;
}

/**
 * Parse an IRC protocol message per RFC 1459.
 *
 * Grammar: [':', prefix, SPACE] command {SPACE, middle} [SPACE, ':', trailing]
 *
 * The trailing parameter captures everything after ' :' including spaces.
 * This mirrors the parsing logic in data/bbs/dancer-irc/parse-irc.c.
 */
function parseIrcMessage(line: string): IrcMessage {
  let rest = line;
  let prefix: string | undefined;

  // Extract prefix if line starts with ':'
  if (rest.startsWith(':')) {
    const spaceIdx = rest.indexOf(' ');
    if (spaceIdx === -1) {
      return { command: '', params: [] };
    }
    prefix = rest.slice(1, spaceIdx);
    rest = rest.slice(spaceIdx + 1);
  }

  // Split trailing parameter at ' :' (space-colon)
  let trailing: string | undefined;
  const trailingIdx = rest.indexOf(' :');
  if (trailingIdx !== -1) {
    trailing = rest.slice(trailingIdx + 2);
    rest = rest.slice(0, trailingIdx);
  }

  // Split remaining on spaces to get command + middle params
  const parts = rest.split(' ').filter((p) => p.length > 0);
  const command = parts[0] || '';
  const params = parts.slice(1);

  return { prefix, command, params, trailing };
}

const lab01: BbsLab = {
  id: 'bbs-m4-lab-01',
  title: 'IRC Message Parse',
  steps: [
    {
      instruction:
        'Parse RFC 1459 IRC messages: PRIVMSG (channel message with trailing text), ' +
        'JOIN (channel join with no trailing), and PART (channel leave with trailing reason). ' +
        'The parser must handle the prefix (:nick!user@host), the command, middle params, ' +
        'and the trailing parameter (everything after " :") correctly.',
      expected_observation:
        'PRIVMSG: prefix=nick!user@host, command=PRIVMSG, params=[#channel], trailing=Hello World. ' +
        'JOIN: command=JOIN, params=[#channel], no trailing. ' +
        'PART: command=PART, params=[#channel], trailing=Goodbye everyone.',
      learn_note:
        'RFC 1459 defines the IRC wire protocol grammar. The same parsing logic is implemented in C ' +
        'in data/bbs/dancer-irc/parse-irc.c — the Dancer IRC bot extracts prefix, command, and ' +
        'params with pointer arithmetic on the raw line buffer. The trailing parameter (after " :") ' +
        'is special because it can contain spaces, making it suitable for chat messages and quit reasons.',
    },
  ],
  verify(): boolean {
    // Test PRIVMSG with trailing
    const privmsg = parseIrcMessage(':nick!user@host PRIVMSG #channel :Hello World');
    if (privmsg.prefix !== 'nick!user@host') return false;
    if (privmsg.command !== 'PRIVMSG') return false;
    if (privmsg.params[0] !== '#channel') return false;
    if (privmsg.trailing !== 'Hello World') return false;

    // Test JOIN without trailing
    const join = parseIrcMessage(':nick JOIN #channel');
    if (join.command !== 'JOIN') return false;
    if (join.params[0] !== '#channel') return false;

    // Test PART with trailing
    const part = parseIrcMessage(':nick PART #channel :Goodbye everyone');
    if (part.command !== 'PART') return false;
    if (part.params[0] !== '#channel') return false;
    if (part.trailing !== 'Goodbye everyone') return false;

    return true;
  },
};

const lab02: BbsLab = {
  id: 'bbs-m4-lab-02',
  title: 'Bot Command Dispatch',
  steps: [
    {
      instruction:
        'Implement a minimal command dispatch table mirroring the pattern from ' +
        'data/bbs/dancer-irc/command-dispatch.c. Create a Record<string, (args: string) => string> ' +
        'with entries for !help and !info. Parse an incoming PRIVMSG, look up the trailing text ' +
        'in the dispatch table, and verify the correct handler is invoked.',
      expected_observation:
        '!help returns "Available commands: !help, !info". ' +
        '!info returns "Dancer IRC Bot v1.0". ' +
        'Unknown command !unknown returns undefined (no matching handler).',
      learn_note:
        'The Dancer IRC bot routes commands through a dispatch table implemented as a struct array ' +
        'of { command_name, handler_function_pointer } in data/bbs/dancer-irc/command-dispatch.c. ' +
        'This pattern — mapping string keys to handler functions — is fundamental to IRC bot design. ' +
        'The C version uses strcmp() in a loop; the TypeScript Record<string, Function> achieves the ' +
        'same routing with cleaner syntax. Flood protection (data/bbs/dancer-irc/flood-protection.c) ' +
        'uses a token-bucket algorithm to rate-limit command processing.',
    },
  ],
  verify(): boolean {
    // Dispatch table mirroring Dancer's command-dispatch.c pattern
    const dispatch: Record<string, (args: string) => string> = {
      '!help': () => 'Available commands: !help, !info',
      '!info': () => 'Dancer IRC Bot v1.0',
    };

    // Parse a PRIVMSG carrying a bot command
    const msg = parseIrcMessage(':user PRIVMSG #ch :!help');
    if (!msg.trailing) return false;

    const handler = dispatch[msg.trailing];
    if (!handler) return false;
    const result = handler('');
    if (result !== 'Available commands: !help, !info') return false;

    // Verify !info handler
    const infoResult = dispatch['!info']('');
    if (infoResult !== 'Dancer IRC Bot v1.0') return false;

    // Verify unknown command returns undefined
    const unknown = dispatch['!unknown'];
    if (unknown !== undefined) return false;

    return true;
  },
};

export const labs: BbsLab[] = [lab01, lab02];
