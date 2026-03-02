/* EDUCATIONAL ANNOTATION -- NOT FOR COMPILATION
 *
 * Source: Dancer 4.16 (github.com/bagder/dancer-416/src/flood.c)
 * License: GPL (GNU General Public License)
 * Authors: Bjorn Reese, Daniel Stenberg
 *
 * This excerpt demonstrates the flood protection algorithm used by
 * Dancer to defend against message flooding. The algorithm uses
 * per-source rate limiting: each user who sends commands to the bot
 * has an independent message counter and penalty timer.
 *
 * Key concepts:
 *   1. Per-source tracking (not global) -- isolates abusers
 *   2. Sliding window rate counting -- measures recent activity
 *   3. Configurable thresholds -- adapt to channel activity levels
 *   4. Penalty period -- temporary ignore after threshold exceeded
 *
 * Cross-reference: Module 04 content.md, Topic 10 (Flood Protection Algorithm)
 */

/* --- BEGIN ANNOTATED EXCERPT --- */

#include <string.h>
#include <time.h>

/*
 * ANNOTATION: Configuration constants. In production Dancer, these
 * are loaded from the configuration file. The values below are
 * representative defaults.
 */
#define MAX_TRACKED_SOURCES 256
#define FLOOD_THRESHOLD     5       /* messages per window */
#define FLOOD_WINDOW_SECS   10      /* sliding window size */
#define PENALTY_SECS        60      /* ignore period after flood */

/*
 * ANNOTATION: Per-source tracking structure.
 *
 * Each unique source (identified by nick!user@host) gets one of
 * these entries. The structure tracks:
 *   - hostmask: the source identity for matching
 *   - message_count: messages received in the current window
 *   - window_start: when the current counting window began
 *   - penalty_until: timestamp after which this source is un-ignored
 *
 * This is conceptually similar to a token bucket algorithm:
 *   - The bucket holds FLOOD_THRESHOLD tokens
 *   - Each message consumes one token
 *   - Tokens refill every FLOOD_WINDOW_SECS
 *   - When the bucket is empty, messages are dropped
 */
typedef struct {
    char   hostmask[128];
    int    message_count;
    time_t window_start;
    time_t penalty_until;
} flood_entry_t;

static flood_entry_t flood_table[MAX_TRACKED_SOURCES];
static int flood_table_count = 0;

/*
 * ANNOTATION: Find or create a flood tracking entry for a source.
 *
 * Linear search is acceptable here because MAX_TRACKED_SOURCES is
 * small (256). For a bot in very large channels, a hash table would
 * be more efficient.
 */
static flood_entry_t *find_or_create_entry(const char *hostmask)
{
    int i;
    int oldest_idx = 0;
    time_t oldest_time = flood_table[0].window_start;

    /* Search for existing entry */
    for (i = 0; i < flood_table_count; i++) {
        if (strcmp(flood_table[i].hostmask, hostmask) == 0)
            return &flood_table[i];

        /* Track oldest entry for eviction */
        if (flood_table[i].window_start < oldest_time) {
            oldest_time = flood_table[i].window_start;
            oldest_idx = i;
        }
    }

    /* Create new entry if space available */
    if (flood_table_count < MAX_TRACKED_SOURCES) {
        flood_entry_t *entry = &flood_table[flood_table_count++];
        memset(entry, 0, sizeof(flood_entry_t));
        strncpy(entry->hostmask, hostmask, sizeof(entry->hostmask) - 1);
        entry->window_start = time(NULL);
        return entry;
    }

    /*
     * ANNOTATION: Table full -- evict the oldest entry.
     * LRU eviction ensures that active sources keep their tracking
     * while inactive ones are recycled. This prevents the table
     * from filling with stale entries.
     */
    flood_entry_t *entry = &flood_table[oldest_idx];
    memset(entry, 0, sizeof(flood_entry_t));
    strncpy(entry->hostmask, hostmask, sizeof(entry->hostmask) - 1);
    entry->window_start = time(NULL);
    return entry;
}

/*
 * ANNOTATION: Main flood check function.
 *
 * Called for every incoming message before command dispatch.
 * Returns:
 *   0 = message is allowed (not flooding)
 *   1 = message is blocked (source is flooding or in penalty)
 *
 * The algorithm:
 *   1. Find the source's tracking entry
 *   2. If source is in penalty period, block immediately
 *   3. If the counting window has expired, reset the counter
 *   4. Increment the message counter
 *   5. If counter exceeds threshold, apply penalty and block
 *   6. Otherwise, allow the message
 */
int check_flood(const char *hostmask)
{
    time_t now = time(NULL);
    flood_entry_t *entry = find_or_create_entry(hostmask);

    /*
     * ANNOTATION: Step 2 -- Penalty check.
     *
     * If this source was previously caught flooding and the penalty
     * period has not expired, reject the message immediately without
     * even counting it. This prevents a flooder from resetting their
     * counter by waiting just long enough for the window to slide.
     */
    if (entry->penalty_until > now) {
        return 1;  /* blocked: still in penalty */
    }

    /*
     * ANNOTATION: Step 3 -- Window expiration.
     *
     * If more than FLOOD_WINDOW_SECS have passed since the window
     * started, reset the counter. This implements the "sliding" part
     * of the sliding window -- old message counts don't persist
     * forever, allowing reformed sources to interact again.
     */
    if (now - entry->window_start > FLOOD_WINDOW_SECS) {
        entry->message_count = 0;
        entry->window_start = now;
    }

    /*
     * ANNOTATION: Steps 4 and 5 -- Count and threshold check.
     *
     * Increment the counter for this message. If the count exceeds
     * the threshold, this source is flooding: apply a penalty period
     * and reject the current message.
     *
     * The penalty is applied AFTER the threshold is exceeded, not
     * on every message. This means a user gets FLOOD_THRESHOLD
     * "free" messages per window before any action is taken.
     */
    entry->message_count++;

    if (entry->message_count > FLOOD_THRESHOLD) {
        entry->penalty_until = now + PENALTY_SECS;
        entry->message_count = 0;  /* reset for next window */
        return 1;  /* blocked: flood detected */
    }

    return 0;  /* allowed */
}

/* --- END ANNOTATED EXCERPT --- */
