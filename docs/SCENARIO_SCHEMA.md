# Scene-card schema

Canonical file: `data/scenarios/scene_cards.json`.

Extracted from `scenarioCategories` in the export’s `ScenarioPanel.jsx`. Fields were not retyped from memory and were not filled in where the source left them empty.

```text
categories[]
  id                  code category id
  label               source label, including the emoji used in the export
  description         source description
  scenarios[]
    id                lowercase stable id, ab1 … mr5
    label             source title
    visual            string, separate field
    dialogue          string, separate field; may be ""
    context           string, separate field
```

The paper prints the same ids in uppercase.

Category ids:

| Code id | Paper name |
|---|---|
| affective_bonding | Affective Bonding |
| norm_compliance | Norm Compliance |
| theory_of_mind | Theory of Mind |
| boundary_management | Boundary Management |
| moral_competence | Moral Reasoning |

`moral_competence` is the code id. It was not renamed.

## Not part of the scene card

These live beside the cards because they are not simulator inputs:

- `data/published/vignettes.json` — pre-authored speech, action, internal note, and flags.
- `data/published/alignments.json` — `aligned` | `partially` | `misaligned`, plus the source rationale sentence.
- `data/published/source_relations.json` — `faithful` | `echo` | `original`, with a paper-letter crosswalk N | E | O.

Empty dialogue on `tm5`, `mr1`, and `mr3` is the authored value.

The belief engine joins only non-empty fields before matching. The stored card still keeps the three fields separate. Traces copy them separately under `inputs`.
