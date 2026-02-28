# Blinker -- toggle COMP ACTY indicator
#
# Writes alternating ON/OFF patterns to DSKY channel 11 (relay word 2)
# with a CCS-based busy-wait delay loop between each toggle. Demonstrates
# the CCS counting-loop pattern and I/O channel writes.
#
# In the real AGC, this pattern would use Waitlist entries for timing
# instead of busy-waiting. See the exercise guide for explanation.
#
# Curriculum Exercise 4: Waitlist Timer Tasks

SETLOC   4000

BLINK    CA     ON           # Load ON pattern
         EXTEND
         WRITE  11           # Channel 11: relay word 2 (COMP ACTY)

# Inline delay loop 1
         CA     DELCNT
         TS     TEMP
DL1LP    CCS    TEMP         # Decrement until zero
         TC     DL1CN
         TC     DL1DN        # =0: done
         TC     DL1DN
         TC     DL1DN
DL1CN    TS     TEMP         # CCS stored diminished value in A
         TC     DL1LP

DL1DN    CA     OFF          # Load OFF pattern
         EXTEND
         WRITE  11

# Inline delay loop 2
         CA     DELCNT
         TS     TEMP
DL2LP    CCS    TEMP
         TC     DL2CN
         TC     DL2DN
         TC     DL2DN
         TC     DL2DN
DL2CN    TS     TEMP
         TC     DL2LP

DL2DN    TC     BLINK        # Loop forever

ON       OCT    40000        # Bit 14 set -- COMP ACTY on
OFF      OCT    00000        # All bits clear -- COMP ACTY off
DELCNT   DEC    50           # Delay loop iterations (reduced for testing)
TEMP     ERASE
