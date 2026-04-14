## Naive Prompt
I have a bug that only happens in production. I can't reproduce it locally. Where do I start?

## Expected Baseline Failure
Agent gives ad-hoc suggestions ("add print statements", "check logs") without the
systematic debugging methodology: observe → hypothesize → predict → test → iterate.

## Expected Skill Activation
debugging-testing activates on "bug in production" / "can't reproduce" and delivers the
Heisenbug section with timing-sensitivity guidance plus the scientific-method framework.

## Rationalization Table
| Rationalization | Counter |
|----------------|---------|
| "I know debugging techniques from training" | The skill provides systematic methodology, not facts — the 5-step scientific-method framework reduces random-change debugging |
| "This is a language-specific issue, not general debugging" | Production-only bugs are a named failure class (Heisenbug) the skill explicitly covers with timing and concurrency guidance |
| "The user didn't ask for debugging methodology" | 'Where do I start' is an explicit request for a systematic approach — that is the skill's primary value proposition |
