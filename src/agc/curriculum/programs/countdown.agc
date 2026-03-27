# Countdown -- display 10 to 0 on R1
#
# Uses CCS (Count, Compare, and Skip) to decrement a counter from 10
# down to 0, writing each value to DSKY channel 10. Demonstrates the
# CCS 4-way branch and loop construction.
#
# Curriculum Exercise 2: Timing and Display

SETLOC   4000

START    CA     TEN          # Load 10
         TS     COUNT        # Store in counter

LOOP     CA     COUNT        # Load current count
         EXTEND
         WRITE  10           # Display on R1
         CCS    COUNT        # Decrement and test
         TC     DECR         # >0: continue
         TC     HALT         # =0: done
         TC     HALT         # <0: done (safety)
         TC     HALT         # -0: done (safety)

DECR     TS     COUNT        # CCS stored diminished value in A
         TC     LOOP

HALT     TC     HALT         # Busy loop -- program complete

TEN      DEC    10
COUNT    ERASE               # Allocate 1 word of erasable
