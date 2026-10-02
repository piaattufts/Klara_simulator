# Artifact

This repository is a reproducibility package for the symbolic simulator used in “From Narrative to Norms: Fiction-Derived Scenarios for Inspectable Companion-Robot Evaluation.”

The engines in `src/simulator/symbolic/` are the export’s belief, affect, and norm engines. Comments were added. Scoring, patterns, norms, and candidate rules were not edited. In particular, the substring matcher that makes MR5 detect illness from “still” is unchanged.

Scene cards, vignettes, alignment annotations, and novel-fidelity tiers were extracted from the export into `data/`. Vignettes and alignments are not simulator outputs. N, E, and O are a crosswalk to the export’s `faithful` / `echo` / `original` tiers. See `docs/PAPER_CODE_AUDIT.md` before treating a paper sentence as what the code does. The audit’s MR1 row is the clearest example: the draft says the recommendation is `absorb_sunlight`; this scene text and this matcher produce `offer_comfort`.

What was not carried over from the export: the course shell, other paper drafts, the v2 pictorial engines, Base44 client and OAuth code, and `generateStudyData`, whose seeded “symbolic” metrics name actions the engine does not have. No API key was stored in the export. None is stored here.

Reproduction: `npm run reproduce`. Interactive simulator: `npm run dev` on port 47231. Neither step needs `OPENAI_API_KEY`.
