# Reproducibility

The paper comparison does not need an API key.

```bash
npm install
npm test
npm run reproduce
```

`npm run reproduce` and `npm run reproduce:paper` are the same command. It:

1. Loads all 25 scene cards.
2. Builds a new SharedState for each card and discards it afterward.
3. Runs only `runBeliefEngine`, `runAffectEngine`, and `runNormEngine`.
4. Writes one trace JSON per card to `outputs/reproduction/traces/`.
5. Attaches `published_alignment` from `data/published/alignments.json` when that id is stored.
6. Writes `outputs/reproduction/summary.json` with counts.
7. Exits with a failure if the stored annotations are not 6 aligned, 17 partially aligned, and 2 misaligned.
8. Copies the MR1, MR2, and MR5 traces to `examples/`.

It does not call a model, does not read `OPENAI_API_KEY`, and does not overwrite `data/`.

`npm run verify:paper` checks the same stored counts.

`npm run validate:scenarios` checks 25 cards, five per category, and the faithful/echo/original tier sizes 6/4/15. The letters N/E/O are the crosswalk documented in `data/published/source_relations.json`. If that file were absent, the script would fail. It is present because `NovelFidelity.jsx` listed the ids.

Observation timestamps are omitted from traces. `Date.now()` still runs inside the engine and is not used for scoring.

Interactive simulator:

```bash
npm run dev
```

The dev server binds `0.0.0.0:47231`.

Optional narrative, separate from reproduction:

```bash
# .env is gitignored. Copy .env.example and set both values.
OPENAI_API_KEY=... OPENAI_MODEL=... npm run dev
```

The source `InvokeLLM` call does not name a model. The paper text says GPT-5. Set `OPENAI_MODEL` only if you want that demo. The response is shown as narrative and is not written into the recommendation.
