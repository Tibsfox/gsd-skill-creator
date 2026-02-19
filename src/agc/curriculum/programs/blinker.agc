# Blinker -- toggle COMP ACTY indicator
#
# Writes alternating ON/OFF patterns to DSKY channel 11 (relay word 2)
# with a busy-wait delay loop between each toggle. Demonstrates the
# subroutine calling convention (TC saves return in Q, TC Q returns)
# and the CCS-based counting loop pattern.
#
# In the real AGC, this pattern would use Waitlist entries for timing
# instead of busy-waiting. See the exercise guide for explanation.
#
# Curriculum Exercise 4: Waitlist Timer Tasks

SETLOC   4000

BLINK    CA     ON           # Load ON pattern
         EXTEND
         WRITE  11           # Channel 11: relay word 2 (COMP ACTY)
         TC     DELAY        # Busy-wait delay
         CA     OFF          # Load OFF pattern
         EXTEND
         WRITE  11
         TC     DELAY
         TC     BLINK        # Loop forever

DELAY    CA     DELCNT       # Simple delay loop
         TS     TEMP
DLLOOP   CCS    TEMP         # Decrement until zero
         TC     CONT
         TC     DLDONE       # =0: done
         TC     DLDONE
         TC     DLDONE
CONT     TS     TEMP         # CCS stored diminished value in A
         TC     DLLOOP
DLDONE   TC     Q            # Return (Q holds return address from TC DELAY)

ON       OCT    40000        # Bit 14 set -- COMP ACTY on
OFF      OCT    00000        # All bits clear -- COMP ACTY off
DELCNT   DEC    500          # Delay loop iterations
TEMP     ERASE
