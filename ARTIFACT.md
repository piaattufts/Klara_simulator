# Artifact

This repository is the Klara companion-robot simulator: twenty-five fiction-derived scene cards and the belief, affect, and norm engines that run them.

The engines in `src/simulator/symbolic/` score, match, and rank as implemented. Comments describe that behavior. Scoring, patterns, norms, and candidate rules were not edited for this documentation pass. In particular, the substring matcher that makes MR5 detect illness from “still” is unchanged.

Scene cards, vignettes, alignment annotations, and novel-fidelity tiers are in `data/`. Vignettes and alignments are not simulator outputs. N, E, and O sit on the `faithful` / `echo` / `original` tiers in `data/published/source_relations.json`.

What was not carried over from the earlier export: the course shell, the v2 pictorial engines, Base44 client and OAuth code, and `generateStudyData`, whose seeded metrics name actions the engine does not have. No API key is stored here.

Reproduction: `npm run reproduce`. Interactive simulator: `npm run dev` on port 47231. Neither step needs `OPENAI_API_KEY`.
