# Code map

| Path | Role |
|---|---|
| `src/simulator/symbolic/beliefEngine.js` | Observation patterns, causal gate. Logic from the export. |
| `src/simulator/symbolic/affectEngine.js` | Resting state, appraisal, decay, clip. Logic from the export. |
| `src/simulator/symbolic/normEngine.js` | Norm library, candidates, blocks, scores, caution modifier, three conflicts. Logic from the export. |
| `src/simulator/pipeline.js` | Ten stage names and `runSymbolicPathway`. |
| `src/simulator/state/sharedState.js` | Fresh state object per scenario. |
| `src/simulator/trace.js` | Trace JSON. Strips observation timestamps. Sets `llm_outputs` to null. |
| `src/simulator/catalog.js` | Joins cards, stored alignments, and stored relation tiers. |
| `src/simulator/llm/narrative.js` | Optional OpenAI narrative. Not imported by the symbolic path. |
| `src/App.jsx` | Simulator UI: library, three fields, stages, trace, vignette, optional narrative. |
| `data/scenarios/scene_cards.json` | 25 cards. |
| `data/published/alignments.json` | Stored annotations. |
| `data/published/vignettes.json` | Pre-authored vignettes. |
| `data/published/source_relations.json` | Novel-fidelity tiers and the N/E/O crosswalk. |
| `scripts/reproduce.mjs` | Writes `outputs/reproduction/` and `examples/MR1`, `MR2`, `MR5`. |
| `scripts/verify-paper-results.mjs` | Fails unless stored annotations are 6 / 17 / 2. |
| `scripts/validate-scenarios.mjs` | Counts cards, categories, and relation tiers. |
| `tests/` | Invariants, including the MR5 substring regression. |

The export also contained a course site, other paper drafts, a v2 pictorial, and a Base44 study seeder. Those are not on this map. Reasons are in `docs/PAPER_CODE_AUDIT.md` and `ARTIFACT.md`.

The original UI components (`ScenarioPanel`, `PipelineStage`, `StateDiffPanel`, and the rest of `src/pages/Simulator.jsx`) depended on the Base44 Vite plugin and on Radix wrappers. This release keeps their functional split — library, three inputs, ten stages, symbolic trace, separate generated text — in `src/App.jsx` so the app runs without Base44 credentials. The engines were not rewritten.
