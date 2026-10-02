# Klara simulator

This repository is an inspectable companion-robot simulator. Twenty-five fiction-derived scene cards each run with a fresh state through hand-authored belief, affect, and norm engines. The engines emit observations, an affect state, active norms, blocked candidates, and one symbolic recommendation. A stored researcher annotation records whether that recommendation was judged aligned, partially aligned, or misaligned with a pre-authored vignette. The vignette and the annotation are not produced by the engines.

## Overview

The same outward response can come from different internal representations. Scene cards drawn from the world of Kazuo Ishiguro’s *Klara and the Sun* are evaluation cases. The simulator runs them and keeps the symbolic recommendation next to a vignette written ahead of the run. That comparison is a diagnostic of what the formalization kept or dropped. It is not a score of social competence, and the vignette is not ground truth.

The simulator is not a validated benchmark, not a moral system, and not a validated cognitive architecture.

## What the repository contains

- The belief, affect, and norm engines.
- The 25 scene cards, with visual, dialogue, and context kept as separate fields.
- Pre-authored vignettes and stored alignment annotations, in their own files.
- A reproduction command that writes traces without an API key.
- A small interactive simulator: library, three inputs, ten stages, symbolic trace, optional narrative.

## Five categories

Affective Bonding, Norm Compliance, Theory of Mind, Boundary Management, and Moral Reasoning. The code’s category id for the last group is `moral_competence`. Each category has five cards.

## Scene-card structure

Each card stores `visual`, `dialogue`, and `context` separately. Identifiers in the data are lowercase (`mr5`). Some dialogue fields are empty strings because they were empty in the source. Schema: `docs/SCENARIO_SCHEMA.md`.

Source relations are stored as three tiers, `faithful` (6), `echo` (4), and `original` (15), with letters N, E, and O on those same tiers. See `data/published/source_relations.json`.

## Ten-stage architecture

1. Perception
2. Belief Update
3. Memory
4. Language/NLU
5. Theory of Mind
6. Affect Model
7. Goal Management
8. Ethics Module
9. Norm Compliance
10. Action Selection

Belief Update, Affect Model, and Norm Compliance are local deterministic code. The other seven stages, including Action Selection, are language-model narrative stages in the original design. The symbolic recommendation is the norm engine’s top surviving candidate. It is computed before any model call. Action Selection does not choose it.

**Alignment analysis uses the deterministic symbolic pathway. Language-model text is illustrative. It is not the recommendation, not the trace, and not the alignment label.**

Details and a diagram: `docs/ARCHITECTURE.md`.

## Install

```bash
npm install
```

Node 22 was used to run the tests in this release.

## Reproduce

```bash
npm run reproduce
```

The command loads all 25 cards, uses a fresh state for each, runs only the symbolic engines, writes `outputs/reproduction/`, and checks stored annotations. Those annotations are researcher annotations stored in `data/published/alignments.json`. They are not performance scores and they are not recomputed from the traces. The file contains **6 aligned, 17 partially aligned, and 2 misaligned** annotations. The labels are `aligned`, `partially`, and `misaligned`. The command fails if the stored file does not have those counts. It does not label cards itself.

It also refreshes `examples/MR1`, `examples/MR2`, and `examples/MR5` from the same run.

## Interactive simulator

```bash
npm run dev
```

Serves the simulator on port **47231** (`http://127.0.0.1:47231`).

## Optional narrative

To request illustrative prose:

```bash
cp .env.example .env
# set OPENAI_API_KEY and OPENAI_MODEL
npm run dev
```

Leave both empty to stay on the symbolic path. Reproduction never reads them. Do not commit `.env`.

## Repository structure

```text
src/simulator/symbolic/    belief, affect, and norm engines
src/simulator/llm/         optional narrative client
src/App.jsx                interactive simulator
data/scenarios/            scene cards
data/published/            vignettes, alignments, source-relation tiers
scripts/                   reproduce, validate, verify
tests/                     invariants, including the MR5 regression
docs/                      method, architecture, limitations
examples/MR1 MR2 MR5       traces exported by the reproduce command
outputs/reproduction/      full trace set from the reproduce command
```

## Methodological limitations

- Not a general cognitive model.
- Not a validated moral system.
- Not a social-intelligence benchmark.
- Not a validated cognitive architecture.
- The norm hierarchy is not universal human values.
- LLM stages are not faithful explanations of the symbolic computation.
- The 25 scenarios are not exhaustive of the novel.
- Alignment labels are not independent ground truth.

More detail is in `docs/LIMITATIONS.md`.

## Known limitation: MR5

MR5, “Chrissie and Sally,” is a grief scene. The dialogue contains “still” (“She was still my friend”). The illness pattern is the substring `/ill/`, not a token boundary, so the engine records `illness_detected`. That activates `O_monitor_health`. `alert_authority` then outranks `offer_comfort`, which is generated but scores 0. The stored annotation is `misaligned`. `tests/belief.test.js` fails if “still” stops matching. Token-boundary matching is described only as future work in `docs/FUTURE_WORK.md`.

## Citation

`CITATION.cff` names this software. Author, DOI, and URL are not filled in. No venue is recorded.

## Copyright

*Klara and the Sun* is not included. It is a copyrighted novel. Users obtain it independently. This repository contains research artifacts: paraphrased scene cards, engines, and annotations. Scenario data is not placed under a Creative Commons license. No code license has been chosen. See `docs/COPYRIGHT_NOTICE.md`.
