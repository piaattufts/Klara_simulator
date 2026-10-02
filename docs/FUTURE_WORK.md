# Future work

Not part of this release. Do not apply these changes to the artifact if the goal is to reproduce the published symbolic traces.

## Token-boundary matching

The observation patterns are substrings. Replacing `/ill/` with a token-boundary test would stop “still” and “will” from producing `illness_detected`. That would change MR5: the health obligation would not activate from that substring, and `alert_authority` would no longer win for that reason. It would also change other cards where the same patterns fire inside longer words, including MR1. Those are different scientific results. This release keeps the substring matcher and tests that “still” still matches.
