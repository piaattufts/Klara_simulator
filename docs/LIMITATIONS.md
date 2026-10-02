# Limitations

These limits are part of the method. They are not a backlog for this release.

- The simulator is not a general cognitive model.
- It is not a validated moral system.
- It is not a social-intelligence benchmark.
- The norm hierarchy is not a universal ordering of human values. Priorities are hand-assigned parameters.
- Language-model stages are not faithful explanations of the symbolic computation. The paper’s comparison does not use them.
- The 25 scene cards are not an exhaustive account of *Klara and the Sun*.
- Alignment labels are one researcher’s annotations of one researcher’s vignettes. They are not independent ground truth.
- Observation matching is lexical and unanchored. MR5 shows the consequence: the letters “ill” inside “still” create `illness_detected`, the health-monitoring obligation becomes active, and the recommendation is `alert_authority`.
- Confidence values are not calibrated probabilities.
- The causal table is not a discovery procedure. One claim can be marked validated because two of its checks were authored as true.
- The three conflict records do not implement a general conflict solver, and in this code they do not change scores.
- Several prohibitions never pair with an action, so a priority of 7 does not by itself block every candidate.
- Affect is an operational state. Caution is the only dimension that moves the ranking.
- There is no memory across scenarios.
- The action vocabulary cannot express presence, grief, or a specifically verbal ethical act unless one of the 13 ids is selected for another reason. That gap is visible in the traces. It was not filled by adding actions.

See `docs/FUTURE_WORK.md` for token-boundary matching, which is not part of this release.
