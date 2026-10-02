# Traces

This directory does not store precomputed traces. Canonical traces are produced by the engines.

```bash
npm run reproduce
```

writes:

- `outputs/reproduction/traces/<id>.json` for all 25 cards
- `outputs/reproduction/summary.json`
- `examples/MR1/trace.json`, `examples/MR2/trace.json`, and `examples/MR5/trace.json`

Those example files are exports of real engine runs. They are not hand-written traces. `llm_outputs` is null. Observation timestamps are omitted because `Date.now()` is not part of the score.

Do not edit the example traces by hand. Re-run the script.
