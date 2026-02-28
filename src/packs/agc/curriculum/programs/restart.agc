# Restart -- BAILOUT restart protection demonstration
#
# Three job bodies representing CRITICAL (guidance), IMPORTANT
# (navigation), and DEFERRABLE (display). Each writes a unique
# identifier to a different I/O channel. Used with the Executive
# and BAILOUT to demonstrate restart group preservation.
#
# Curriculum Exercise 7: Restart Protection

SETLOC   4000

# Critical job: guidance (always preserved)
CRIT     CA     CRITID
         EXTEND
         WRITE  10
         TC     CRIT

# Important job: navigation (preserved if room)
IMPRT    CA     IMPID
         EXTEND
         WRITE  11
         TC     IMPRT

# Deferrable job: display (always discarded)
DEFER    CA     DEFID
         EXTEND
         WRITE  12
         TC     DEFER

CRITID   OCT    00100        # Critical marker
IMPID    OCT    00200        # Important marker
DEFID    OCT    00300        # Deferrable marker

# Restart addresses
CRITRST  TC     CRIT         # Critical restart: resume guidance
IMPRST   TC     IMPRT        # Important restart: resume navigation
