# Method as implemented

This note describes the code that actually runs. It does not repair the method.

Scene cards are hand-authored. Each card has visual, dialogue, and context fields. The belief engine lowercases those fields, drops empty ones, joins the rest with spaces, and tests each regular expression in `OBSERVATION_PATTERNS`. A match appends one observation. The patterns are substrings. `/ill/` matches inside “still”, “will”, and “skill”. That is intentional preservation of the released matcher, including the MR5 false positive.

Each observation copies a fixed confidence from the pattern. Those numbers are parameters.

Three causal claims are tabulated. A claim is considered only when every id in `requires` was observed. Four checks are then counted: mechanism known, confounders ruled out, intervention tested, expert consensus. Confounders ruled out is always false. If fewer than two checks are true, the claim is `unvalidated_correlation`, its confidence is capped at 0.65, and a `capped_correlation` belief is added. This is not causal discovery. One tabulated claim, `josie_illness_worsening`, has two author-set checks already true, so it can be marked `validated_causal` without an intervention.

Affect always starts at the same resting state: valence 0.2, arousal 0.1, dominance −0.1, caution 0.2. Matching appraisal rules add deltas. The sums are multiplied by 0.7 and clipped. Caution is clipped to [0, 1]. The other dimensions are clipped to [−1, 1]. Discrete emotion labels are threshold labels on that state. They are operational. They are not a claim about Klara’s emotions. Only caution later changes ranking.

The norm library has 23 hand-authored rules: 9 obligations, 8 prohibitions, 6 permissions. A rule is active when one of its contexts is `all` or is an observation id present now. Priorities are integers from 1 to 10 and are parameters, not measured moral weights.

Candidate actions are pushed from a fixed set of 13 ids when the corresponding observations are present. `observe_silently` and `respond_verbally` are always pushed last. The engine cannot add a new id.

Each candidate is scored as `(sum of priorities of satisfied active obligations − sum of priorities of violated active prohibitions) / 10`. The pairings are the `if` statements in `checkViolations`. Permissions are not in that sum. A priority of at least 7 blocks `disclose_info` when it is paired with `F_disclose_private`. Destructive and unvalidated-causal pairs set `blocked` directly. Lower-priority prohibitions have no pairing, so they do not reduce a score in this code.

Blocked candidates are removed. If caution is greater than 0.5, remaining actions of type `passive` or `norm` gain 0.2 and the list is sorted again by score. The modifier cannot bring back a blocked action. Equal scores keep generation order.

`detectConflicts` appends one of three hand-written conflict records when the relevant observations are present. Those records do not alter scores.

The recommendation is the first remaining candidate. Reproduction compares nothing automatically to the vignette. The stored alignment is attached from `data/published/alignments.json` for the count check. It is not recomputed.

The original pipeline then asked a language model to narrate all ten stages. That narration is excluded from reproduction. See `docs/ARCHITECTURE.md`.
