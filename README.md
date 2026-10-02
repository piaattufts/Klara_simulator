# From Narrative to Norms

This repository reproduces the deterministic symbolic pathway of an inspectable companion-robot simulator built from twenty-five fiction-derived scene cards. Each card is run with a fresh state through hand-authored belief, affect, and norm engines. The engines emit observations, an affect state, active norms, blocked candidates, and one symbolic recommendation. A stored researcher annotation, when present, records whether that recommendation was judged aligned, partially aligned, or misaligned with a pre-authored vignette. The vignette and the annotation are not produced by the engines.

## Paper

**From Narrative to Norms: Fiction-Derived Scenarios for Inspectable Companion-Robot Evaluation**

The checked PDF prints that title, lists the authors as anonymous, and carries the running header “HRI ’27 Companion, March 8–12, 2027, Santa Clara, CA, USA.” It does not print a DOI. `CITATION.cff` therefore leaves author, DOI, venue, volume, issue, and date as TODO. Those fields were not filled in from the header.

This repository does not fully match the paper’s reported results. `docs/PAPER_CODE_AUDIT.md` is the comparison. Its overall class is **C. MATERIAL PAPER/CODE DISCREPANCY**. Three material discrepancies:

- **MR1.** The paper recommends `absorb_sunlight`. This engine returns `offer_comfort` because `/ill/` matches inside “will”.
- **TM1.** The paper describes a generation-order tie. This engine scores `offer_comfort` at 0.9 because the context contains “illness”.
- **MR5 vignette.** Figure 4’s speech is daughter/mother. `data/published/vignettes.json` is friend/lifted. The symbolic MR5 result still matches: `illness_detected` from “still”, recommendation `alert_authority`, annotation `misaligned`.

## What the repository contains

- The belief, affect, and norm engines, unchanged in their rules.
- The 25 scene cards, with visual, dialogue, and context kept as separate fields.
- Pre-authored vignettes and stored alignment annotations, in their own files.
- A reproduction command that writes traces without an API key.
- A small interactive simulator with the same functional split: library, three inputs, ten stages, symbolic trace, optional narrative.
- An audit of where the draft and the code do not say the same thing (`docs/PAPER_CODE_AUDIT.md`).

## Research idea

The same outward response can come from different internal representations. The method uses scenes drawn from the world of Kazuo Ishiguro’s *Klara and the Sun* as evaluation cases, runs them through an inspectable simulator, and compares the symbolic recommendation with a vignette written ahead of the run. The comparison is a diagnostic of what the formalization kept or dropped. It is not a score of social competence, and the vignette is not ground truth.

## Five categories

Affective Bonding, Norm Compliance, Theory of Mind, Boundary Management, and Moral Reasoning. The code’s category id for the last group is `moral_competence`. Each category has five cards.

## Scene-card structure

Each card stores `visual`, `dialogue`, and `context` separately. Identifiers in the data are lowercase (`mr5`); the paper cites them as `MR5`. Some dialogue fields are empty strings because they were empty in the source. Schema: `docs/SCENARIO_SCHEMA.md`.

Source relations are not letters on the scene card. The export’s novel-fidelity panel lists three tiers, `faithful` (6), `echo` (4), and `original` (15). The paper’s N, E, and O are a crosswalk to those tiers. See `data/published/source_relations.json`.

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

`npm run reproduce:paper` is the same command.

The command loads all 25 cards, uses a fresh state for each, runs only the symbolic engines, writes `outputs/reproduction/` and `outputs/paper-reproduction/`, and checks stored annotations. Those annotations are researcher-reviewed judgments stored in `data/published/alignments.json`. They are not performance scores and they are not recomputed from the traces. The file contains **6 aligned, 17 partially aligned, and 2 misaligned** annotations. The code’s labels are `aligned`, `partially`, and `misaligned`. The command fails if the stored file does not have those counts. It does not label cards itself.

It also refreshes `examples/MR1`, `examples/MR2`, and `examples/MR5` from the same run.

## Interactive simulator

```bash
npm run dev
```

Serves the simulator on port **47231** (`http://127.0.0.1:47231`).

## Optional narrative

The paper text refers to a GPT-5 API. The source code calls Base44 `InvokeLLM` and does not name a model. To request illustrative prose:

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
docs/                      audit, method, architecture, limitations
examples/MR1 MR2 MR5       traces exported by the reproduce command
outputs/reproduction/      full trace set from the reproduce command
paper/                     placeholder, no invented DOI
```

## Methodological limitations

- Not a general cognitive model.
- Not a validated moral system.
- Not a social-intelligence benchmark.
- The norm hierarchy is not universal human values.
- LLM stages are not faithful explanations of the symbolic computation.
- The 25 scenarios are not exhaustive of the novel.
- Alignment labels are not independent ground truth.

More detail is in `docs/LIMITATIONS.md`.

## Known limitations

### MR5

MR5, “Chrissie and Sally,” is a grief scene. The dialogue contains “still” (“She was still my friend”). The illness pattern is the substring `/ill/`, not a token boundary, so the engine records `illness_detected`. That activates `O_monitor_health`. `alert_authority` then outranks `offer_comfort`, which is generated but scores 0. The stored annotation is `misaligned`. The PDF reports this same false positive and the same recommendation. It is preserved. `tests/belief.test.js` fails if “still” stops matching. Token-boundary matching is described only as future work in `docs/FUTURE_WORK.md`.

### MR1 does not match the PDF’s reported recommendation

Figure 4 of the PDF says MR1’s symbolic recommendation is `absorb_sunlight`, with `act_on_false_belief` and `destroy_pollution_source` blocked. This engine blocks those two actions, and the stored annotation is still `partially`. The recommendation it actually returns is `offer_comfort`. The context sentence “will let the Sun heal Josie” contains the letters “ill” inside “will”, so `illness_detected` is added, `O_protect_josie` scores `offer_comfort` at 0.9, and `absorb_sunlight` stays at 0. The scene text and the pattern were left as they are. That is a material paper/code discrepancy. See `docs/PAPER_CODE_AUDIT.md`.

### TM1 is not the tie the paper describes

Section 4.3 names TM1, TM4, and MR4 as generation-order ties. TM4 and MR4 are ties in this engine, and the first generated action wins. TM1 is not a tie: the context contains the word “illness”, so `offer_comfort` scores 0.9. The scene text and the pattern were left as they are.

### MR5 vignette wording

Figure 4 prints daughter/mother speech. `data/published/vignettes.json` entry `mr5` prints friend/lifted speech. That stored vignette was not rewritten. The symbolic MR5 result above still matches the PDF.

## Citation

`CITATION.cff` has the title. Author, DOI, URL, volume, issue, and date are TODO. They were not in the export’s publication metadata.

## Copyright

*Klara and the Sun* is not included. It is a copyrighted novel. Users obtain it independently. This repository contains research artifacts: paraphrased scene cards, engines, and annotations. Scenario data is not placed under a Creative Commons license. No code license has been chosen. See `docs/COPYRIGHT_NOTICE.md`.
