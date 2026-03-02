/* EDUCATIONAL ANNOTATION -- NOT FOR COMPILATION
 *
 * Source: Dancer 4.16 (github.com/bagder/dancer-416/src/dancer.c)
 * License: GPL (GNU General Public License)
 * Authors: Bjorn Reese, Daniel Stenberg
 *
 * This excerpt demonstrates the main event loop of an IRC bot.
 * The pattern shown here -- initialize, connect, register, then enter
 * a select() loop that reads lines and dispatches commands -- is the
 * canonical architecture for any IRC bot or network service.
 *
 * Cross-reference: Module 04 content.md, Topic 8 (Dancer Bot Architecture)
 * Cross-reference: Module 04 labs.ts, Lab "bot-event-loop"
 */

/* --- BEGIN ANNOTATED EXCERPT --- */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <sys/select.h>

/*
 * ANNOTATION: Forward declarations for functions defined in other
 * Dancer source files. In the full source, these come from header
 * files (dancer.h, server.h, parse.h, config.h).
 */
extern int server_connect(const char *hostname, int port);
extern int server_read_line(int sockfd, char *buffer, int maxlen);
extern void server_send(int sockfd, const char *format, ...);
extern void parse_and_dispatch(int sockfd, const char *line);
extern void config_load(const char *filename);

/*
 * ANNOTATION: Global state for the bot. In production code, this
 * would be encapsulated in a struct, but Dancer (written in 2001)
 * uses global variables as was common in C programs of that era.
 */
static int server_socket = -1;
static volatile int running = 1;
static volatile int rehash_requested = 0;

/*
 * ANNOTATION: Signal handlers allow the bot to respond to Unix
 * signals without interrupting the main event loop. SIGHUP is
 * the conventional signal for "reload configuration," and SIGTERM
 * is "shut down gracefully."
 */
void handle_sighup(int sig)
{
    (void)sig;  /* unused parameter */
    rehash_requested = 1;
}

void handle_sigterm(int sig)
{
    (void)sig;
    running = 0;
}

/*
 * ANNOTATION: The main event loop. This is the heart of the bot.
 *
 * The pattern is:
 *   1. Load configuration (server, channels, nicknames)
 *   2. Install signal handlers
 *   3. Connect to IRC server via TCP socket
 *   4. Send NICK and USER commands (IRC registration)
 *   5. Enter select() loop:
 *      a. Wait for data on the server socket (with timeout)
 *      b. If data available: read a line, parse it, dispatch
 *      c. Check for pending signals (rehash, shutdown)
 *      d. Handle periodic tasks (ping timeout, channel rejoin)
 *   6. On exit: send QUIT, close socket
 *
 * select() is used rather than blocking read() because it allows
 * the bot to handle timeouts and signals between data arrivals.
 */
int main(int argc, char *argv[])
{
    char line_buffer[512];  /* RFC 1459: max 512 bytes per line */
    fd_set read_fds;
    struct timeval timeout;
    int activity;

    /* Step 1: Load configuration */
    config_load(argc > 1 ? argv[1] : "dancer.conf");

    /* Step 2: Install signal handlers */
    signal(SIGHUP, handle_sighup);
    signal(SIGTERM, handle_sigterm);
    signal(SIGPIPE, SIG_IGN);  /* Ignore broken pipe */

    /* Step 3: Connect to IRC server */
    server_socket = server_connect("irc.example.net", 6667);
    if (server_socket < 0) {
        fprintf(stderr, "Failed to connect to IRC server\n");
        return 1;
    }

    /* Step 4: IRC registration (NICK + USER handshake) */
    server_send(server_socket, "NICK dancer\r\n");
    server_send(server_socket, "USER dancer 0 * :Dancer IRC Bot\r\n");

    /*
     * ANNOTATION: Step 5 -- The main select() loop.
     *
     * This loop runs for the entire lifetime of the bot.
     * select() blocks until either:
     *   - Data arrives on the server socket (activity > 0)
     *   - The timeout expires (activity == 0)
     *   - A signal interrupts the call (activity < 0, errno == EINTR)
     */
    while (running) {
        FD_ZERO(&read_fds);
        FD_SET(server_socket, &read_fds);
        timeout.tv_sec = 60;   /* Check for timeouts every 60 seconds */
        timeout.tv_usec = 0;

        activity = select(server_socket + 1, &read_fds, NULL, NULL, &timeout);

        if (activity > 0 && FD_ISSET(server_socket, &read_fds)) {
            /*
             * ANNOTATION: Data available -- read one complete line.
             * IRC messages are CR-LF terminated, so we read until
             * we have a complete line or the buffer is full.
             */
            if (server_read_line(server_socket, line_buffer, sizeof(line_buffer)) > 0) {
                /*
                 * ANNOTATION: This is the critical dispatch point.
                 * parse_and_dispatch() (see parse-irc.c) breaks the
                 * line into prefix, command, and parameters, then
                 * routes it to the appropriate command handler
                 * (see command-dispatch.c).
                 */
                parse_and_dispatch(server_socket, line_buffer);
            } else {
                /* Connection lost -- server closed the socket */
                fprintf(stderr, "Server connection lost\n");
                break;
            }
        }

        /* Check for rehash signal (SIGHUP) */
        if (rehash_requested) {
            rehash_requested = 0;
            config_load("dancer.conf");
        }
    }

    /* Step 6: Graceful shutdown */
    server_send(server_socket, "QUIT :Dancer shutting down\r\n");
    close(server_socket);

    return 0;
}

/* --- END ANNOTATED EXCERPT --- */
