/* EDUCATIONAL ANNOTATION -- NOT FOR COMPILATION
 *
 * Source: Dancer 4.16 (github.com/bagder/dancer-416/src/command.c)
 * License: GPL (GNU General Public License)
 * Authors: Bjorn Reese, Daniel Stenberg
 *
 * This excerpt demonstrates the command dispatch pattern used by
 * Dancer to route parsed IRC commands to their handler functions.
 * The dispatch table is an array of structs, each mapping a command
 * string to a function pointer, with metadata for parameter count
 * and privilege level requirements.
 *
 * Key design patterns:
 *   1. Function pointer table -- extensible without modifying dispatch logic
 *   2. Metadata per command -- min_params and privilege level checks
 *   3. Linear search dispatch -- simple and sufficient for ~30 commands
 *   4. Separation of parsing from handling -- clean architecture
 *
 * Cross-reference: Module 04 content.md, Topic 11 (Command Dispatch Pattern)
 */

/* --- BEGIN ANNOTATED EXCERPT --- */

#include <string.h>
#include <strings.h>  /* for strcasecmp */

/*
 * ANNOTATION: Forward declaration of the parsed message struct
 * from parse-irc.c. In the full Dancer source, this comes from
 * the parse.h header file.
 */
typedef struct {
    char *prefix;
    char *command;
    char *params[15];
    int   param_count;
    char *trailing;
} irc_message_t;

/*
 * ANNOTATION: Privilege levels for command access control.
 *
 * Dancer implements a tiered privilege system:
 *   PRIV_NONE:   Any user can trigger this command
 *   PRIV_VOICED: User must have +v in the channel
 *   PRIV_OP:     User must have +o in the channel
 *   PRIV_OWNER:  User must be a configured bot owner
 *
 * This prevents unauthorized users from issuing administrative
 * commands to the bot.
 */
#define PRIV_NONE   0
#define PRIV_VOICED 1
#define PRIV_OP     2
#define PRIV_OWNER  3

/*
 * ANNOTATION: Handler function type.
 *
 * Every command handler has the same signature: it receives the
 * server socket (for sending responses) and the parsed message.
 * This uniform interface is what makes the function pointer table
 * possible -- the dispatch logic doesn't need to know anything
 * about what each handler does internally.
 */
typedef void (*command_handler_t)(int sockfd, irc_message_t *msg);

/*
 * ANNOTATION: Command table entry structure.
 *
 * Each entry maps:
 *   - command:    The IRC command string to match (case-insensitive)
 *   - handler:    Function pointer to the handler
 *   - min_params: Minimum number of parameters required
 *   - priv_level: Minimum privilege level to execute
 *   - description: Human-readable description (for help output)
 *
 * The dispatch function iterates this table on every incoming
 * message, comparing the parsed command against each entry.
 */
typedef struct {
    const char       *command;
    command_handler_t handler;
    int               min_params;
    int               priv_level;
    const char       *description;
} command_entry_t;

/*
 * ANNOTATION: Forward declarations of handler functions.
 * In the full Dancer source, each handler is implemented in
 * a separate source file or grouped by category.
 */
extern void handle_privmsg(int sockfd, irc_message_t *msg);
extern void handle_join(int sockfd, irc_message_t *msg);
extern void handle_part(int sockfd, irc_message_t *msg);
extern void handle_kick(int sockfd, irc_message_t *msg);
extern void handle_mode(int sockfd, irc_message_t *msg);
extern void handle_nick(int sockfd, irc_message_t *msg);
extern void handle_quit(int sockfd, irc_message_t *msg);
extern void handle_ping(int sockfd, irc_message_t *msg);
extern void handle_notice(int sockfd, irc_message_t *msg);
extern void handle_numeric(int sockfd, irc_message_t *msg);
extern void handle_invite(int sockfd, irc_message_t *msg);
extern void handle_topic(int sockfd, irc_message_t *msg);

/*
 * ANNOTATION: The command dispatch table.
 *
 * This is the central registry of all IRC commands the bot handles.
 * Adding support for a new command requires only:
 *   1. Writing the handler function
 *   2. Adding one entry to this table
 *
 * The dispatch logic (below) does not need to be modified.
 * This is the Open/Closed Principle in action: the dispatch
 * mechanism is closed for modification but open for extension.
 *
 * Note: PING is handled with PRIV_NONE because the server sends
 * PING to keep the connection alive -- the bot must always respond.
 */
static const command_entry_t command_table[] = {
    /* IRC protocol commands */
    { "PRIVMSG", handle_privmsg, 2, PRIV_NONE,   "Channel/private message" },
    { "NOTICE",  handle_notice,  2, PRIV_NONE,   "Notice message"          },
    { "JOIN",    handle_join,    1, PRIV_NONE,   "User joined channel"     },
    { "PART",    handle_part,    1, PRIV_NONE,   "User left channel"       },
    { "KICK",    handle_kick,    2, PRIV_NONE,   "User kicked from channel"},
    { "MODE",    handle_mode,    2, PRIV_NONE,   "Mode change"             },
    { "NICK",    handle_nick,    1, PRIV_NONE,   "Nickname change"         },
    { "QUIT",    handle_quit,    0, PRIV_NONE,   "User disconnected"       },
    { "PING",    handle_ping,    1, PRIV_NONE,   "Server ping (keepalive)" },
    { "INVITE",  handle_invite,  2, PRIV_NONE,   "Channel invitation"      },
    { "TOPIC",   handle_topic,   1, PRIV_NONE,   "Topic change"            },

    /* Sentinel: marks the end of the table */
    { NULL, NULL, 0, 0, NULL }
};

/*
 * ANNOTATION: Helper to check if a command string is a 3-digit
 * numeric reply (like 001, 433, 375). Numeric replies are handled
 * by a single function that switches on the numeric value.
 */
static int is_numeric_command(const char *cmd)
{
    return (cmd[0] >= '0' && cmd[0] <= '9'
         && cmd[1] >= '0' && cmd[1] <= '9'
         && cmd[2] >= '0' && cmd[2] <= '9'
         && cmd[3] == '\0');
}

/*
 * ANNOTATION: The dispatch function.
 *
 * This is called by parse_and_dispatch() (see parse-irc.c) after
 * every successful message parse. It:
 *   1. Checks for numeric commands (handled specially)
 *   2. Iterates the command table looking for a match
 *   3. Validates parameter count
 *   4. Checks privilege level
 *   5. Calls the handler function
 *
 * The linear search is O(n) in the number of commands, but with
 * ~12 entries this is negligible compared to the network I/O cost.
 * A hash table would be premature optimization here.
 */
void dispatch_command(int sockfd, irc_message_t *msg)
{
    const command_entry_t *entry;

    if (msg->command == NULL)
        return;

    /* Handle numeric replies (001, 433, etc.) */
    if (is_numeric_command(msg->command)) {
        handle_numeric(sockfd, msg);
        return;
    }

    /* Search the command table */
    for (entry = command_table; entry->command != NULL; entry++) {
        /*
         * ANNOTATION: Case-insensitive comparison.
         * IRC commands are case-insensitive per RFC 1459.
         * "PRIVMSG", "privmsg", and "Privmsg" are all valid.
         */
        if (strcasecmp(msg->command, entry->command) == 0) {
            /* Check minimum parameter count */
            if (msg->param_count < entry->min_params) {
                /* Not enough parameters -- ignore silently */
                return;
            }

            /*
             * ANNOTATION: Privilege check would go here.
             * In the full Dancer source, the bot looks up the
             * sender's privilege level from its user database
             * and compares against entry->priv_level.
             * Omitted from this excerpt for clarity.
             */

            /* Dispatch to handler */
            entry->handler(sockfd, msg);
            return;
        }
    }

    /*
     * ANNOTATION: Unknown commands are silently ignored.
     * The IRC protocol has many commands that a bot doesn't need
     * to handle (WALLOPS, SQUIT, SERVER, etc.). Logging unknown
     * commands can be useful for debugging but is not shown here.
     */
}

/* --- END ANNOTATED EXCERPT --- */
