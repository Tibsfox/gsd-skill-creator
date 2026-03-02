/* EDUCATIONAL ANNOTATION -- NOT FOR COMPILATION
 *
 * Source: Dancer 4.16 (github.com/bagder/dancer-416/src/parse.c)
 * License: GPL (GNU General Public License)
 * Authors: Bjorn Reese, Daniel Stenberg
 *
 * This excerpt demonstrates how Dancer parses incoming IRC messages
 * following the RFC 1459 message format:
 *   [:prefix SPACE] command [SPACE params] [SPACE :trailing]
 *
 * Key observations for protocol dissection:
 *   1. The colon prefix identifies the message origin (nick!user@host)
 *   2. Commands can be alphabetic (PRIVMSG) or 3-digit numeric (001)
 *   3. The trailing parameter (after final ':') may contain spaces
 *   4. Maximum 15 parameters per RFC 1459 Section 2.3.1
 *
 * Cross-reference: Module 04 content.md, Topic 9 (IRC Message Parsing in C)
 * Cross-reference: Module 04 labs.ts, Lab "irc-message-parse"
 */

/* --- BEGIN ANNOTATED EXCERPT --- */

#include <string.h>
#include <ctype.h>

/*
 * ANNOTATION: Maximum number of parameters in an IRC message.
 * RFC 1459 Section 2.3.1 specifies a maximum of 15 parameters.
 */
#define MAX_IRC_PARAMS 15

/*
 * ANNOTATION: Parsed message structure. After parsing, every field
 * of the incoming IRC message is accessible through this struct.
 * The pointers point into the original line buffer (modified in-place
 * by inserting null terminators), so the struct is only valid as long
 * as the original buffer exists.
 */
typedef struct {
    char *prefix;                    /* nick!user@host or server name */
    char *command;                   /* PRIVMSG, JOIN, 001, etc. */
    char *params[MAX_IRC_PARAMS];    /* parameter array */
    int   param_count;               /* number of parameters found */
    char *trailing;                  /* trailing parameter (after :) */
} irc_message_t;

/*
 * ANNOTATION: The core parsing function. This modifies the input
 * buffer in-place (inserting null terminators) and fills the
 * irc_message_t struct with pointers into the buffer.
 *
 * Parsing steps:
 *   1. Strip trailing CR-LF
 *   2. If line starts with ':', extract prefix
 *   3. Extract command token
 *   4. Extract parameters until ':' trailing or MAX_PARAMS
 *   5. If ':' found, remaining text is trailing parameter
 *
 * Returns: 0 on success, -1 on parse error
 */
int parse_irc_message(char *line, irc_message_t *msg)
{
    char *cursor = line;
    char *space;

    /*
     * ANNOTATION: Initialize the output struct to safe defaults.
     * This prevents use of uninitialized pointers if parsing fails
     * partway through.
     */
    memset(msg, 0, sizeof(irc_message_t));

    /* Step 1: Strip trailing CR-LF */
    {
        int len = strlen(line);
        while (len > 0 && (line[len - 1] == '\r' || line[len - 1] == '\n'))
            line[--len] = '\0';
    }

    /* Guard: empty line after stripping */
    if (*cursor == '\0')
        return -1;

    /*
     * ANNOTATION: Step 2 -- Prefix extraction.
     *
     * If the line begins with ':', everything up to the first space
     * is the prefix. The prefix identifies who sent this message:
     *   - For messages from users: nick!user@host
     *   - For messages from servers: servername
     *
     * Example: ":nick!user@host.com PRIVMSG #channel :Hello"
     *           ^^^^^^^^^^^^^^^^^^ this is the prefix
     */
    if (*cursor == ':') {
        cursor++;  /* skip the leading colon */
        msg->prefix = cursor;

        space = strchr(cursor, ' ');
        if (!space)
            return -1;  /* prefix with no command -- malformed */

        *space = '\0';  /* null-terminate the prefix */
        cursor = space + 1;

        /* Skip any extra spaces (defensive) */
        while (*cursor == ' ')
            cursor++;
    }

    /*
     * ANNOTATION: Step 3 -- Command extraction.
     *
     * The command is the next token: either an alphabetic string
     * (PRIVMSG, JOIN, KICK, etc.) or a 3-digit numeric (001, 433).
     * We extract it by finding the next space or end-of-line.
     */
    if (*cursor == '\0')
        return -1;  /* no command found */

    msg->command = cursor;

    space = strchr(cursor, ' ');
    if (space) {
        *space = '\0';
        cursor = space + 1;
    } else {
        /* Command with no parameters (rare but valid) */
        return 0;
    }

    /*
     * ANNOTATION: Step 4 -- Parameter extraction.
     *
     * Parameters are space-separated tokens. If we encounter a ':'
     * at the start of a token, everything after it (including spaces)
     * is the trailing parameter -- this is how IRC transmits message
     * text that contains spaces.
     *
     * Example: "PRIVMSG #channel :Hello world, this is a message"
     *           params[0] = "#channel"
     *           trailing  = "Hello world, this is a message"
     */
    while (*cursor != '\0' && msg->param_count < MAX_IRC_PARAMS) {
        /* Skip leading spaces */
        while (*cursor == ' ')
            cursor++;

        if (*cursor == '\0')
            break;

        /*
         * ANNOTATION: The trailing parameter.
         * A ':' at the start of a parameter means "everything from
         * here to end-of-line is one parameter, spaces included."
         * This is the mechanism that allows PRIVMSG text to contain
         * spaces. Without it, "Hello world" would be parsed as two
         * separate parameters.
         */
        if (*cursor == ':') {
            cursor++;  /* skip the colon */
            msg->trailing = cursor;
            msg->params[msg->param_count++] = cursor;
            break;  /* trailing consumes all remaining text */
        }

        /* Regular parameter: terminated by space or end-of-line */
        msg->params[msg->param_count++] = cursor;

        space = strchr(cursor, ' ');
        if (space) {
            *space = '\0';
            cursor = space + 1;
        } else {
            break;  /* last parameter */
        }
    }

    return 0;
}

/*
 * ANNOTATION: After parsing, the dispatch function routes the
 * parsed message to the appropriate handler. This function is
 * the bridge between parsing (this file) and command handling
 * (see command-dispatch.c).
 */
extern void dispatch_command(int sockfd, irc_message_t *msg);

void parse_and_dispatch(int sockfd, char *line)
{
    irc_message_t msg;

    if (parse_irc_message(line, &msg) == 0 && msg.command != NULL) {
        dispatch_command(sockfd, &msg);
    }
}

/* --- END ANNOTATED EXCERPT --- */
