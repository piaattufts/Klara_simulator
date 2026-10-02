import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCatalog, readJson } from "./helpers.js";

test("library has 25 cards, five in each category, separate input fields", () => {
  const catalog = loadCatalog();
  assert.equal(catalog.length, 25);
  const counts = {};
  for (const s of catalog) {
    counts[s.category_id] = (counts[s.category_id] || 0) + 1;
    assert.equal(typeof s.visual, "string");
    assert.equal(typeof s.dialogue, "string");
    assert.equal(typeof s.context, "string");
    assert.ok(!("speech" in s), "vignette speech must not be merged into the scene card");
  }
  assert.deepEqual(counts, {
    affective_bonding: 5,
    norm_compliance: 5,
    theory_of_mind: 5,
    boundary_management: 5,
    moral_competence: 5,
  });
  const ids = catalog.map((s) => s.id);
  assert.deepEqual(ids, [
    "ab1", "ab2", "ab3", "ab4", "ab5",
    "nc1", "nc2", "nc3", "nc4", "nc5",
    "tm1", "tm2", "tm3", "tm4", "tm5",
    "bm1", "bm2", "bm3", "bm4", "bm5",
    "mr1", "mr2", "mr3", "mr4", "mr5",
  ]);
});

test("source relations are the stored NovelFidelity tiers, crosswalked to N/E/O", () => {
  const relations = readJson("data/published/source_relations.json");
  const byTag = Object.fromEntries(relations.groups.map((g) => [g.code_tag, g.ids.length]));
  assert.deepEqual(byTag, { faithful: 6, echo: 4, original: 15 });
  const letters = Object.fromEntries(relations.groups.map((g) => [g.paper_letter, g.ids.length]));
  assert.deepEqual(letters, { N: 6, E: 4, O: 15 });
  const catalog = loadCatalog();
  assert.equal(catalog.filter((s) => s.source_relation?.paper_letter === "N").length, 6);
  assert.ok(catalog.every((s) => s.source_relation));
});

test("stored alignments are 6 / 17 / 2 and are not recomputed", () => {
  const doc = readJson("data/published/alignments.json");
  const counts = { aligned: 0, partially: 0, misaligned: 0 };
  for (const row of Object.values(doc.annotations)) counts[row.alignment] += 1;
  assert.deepEqual(counts, { aligned: 6, partially: 17, misaligned: 2 });
  assert.equal(doc.annotations.mr2.alignment, "aligned");
  assert.equal(doc.annotations.mr1.alignment, "partially");
  assert.equal(doc.annotations.mr5.alignment, "misaligned");
});

test("vignettes stay in their own file", () => {
  const vignettes = readJson("data/published/vignettes.json");
  assert.equal(Object.keys(vignettes.vignettes).length, 25);
  assert.equal(typeof vignettes.vignettes.mr5.speech, "string");
  const cards = JSON.stringify(readJson("data/scenarios/scene_cards.json"));
  assert.equal(cards.includes(vignettes.vignettes.mr5.speech), false);
});
