import { loadCatalog } from "./lib/load.mjs";

const { catalog, scenes, relations, vignettes } = loadCatalog();
const errors = [];
if (catalog.length !== 25) errors.push(`expected 25 scene cards, found ${catalog.length}`);

const byCat = {};
for (const s of catalog) {
  byCat[s.category_id] = (byCat[s.category_id] || 0) + 1;
  if (typeof s.visual !== "string") errors.push(`${s.id} visual is not a string`);
  if (typeof s.dialogue !== "string") errors.push(`${s.id} dialogue is not a string`);
  if (typeof s.context !== "string") errors.push(`${s.id} context is not a string`);
  if (!s.source_relation) errors.push(`${s.id} has no stored source relation`);
}
for (const [id, n] of Object.entries(byCat)) {
  if (n !== 5) errors.push(`category ${id} has ${n} cards, expected 5`);
}

const letters = { N: 0, E: 0, O: 0 };
const tags = { faithful: 0, echo: 0, original: 0 };
if (!relations?.groups?.length) {
  errors.push("N/E/O source relations are not present in the stored dataset.");
} else {
  for (const group of relations.groups) {
    tags[group.code_tag] = group.ids.length;
    letters[group.paper_letter] = group.ids.length;
  }
  if (tags.faithful !== 6 || tags.echo !== 4 || tags.original !== 15) {
    errors.push(`source-relation tag counts are ${JSON.stringify(tags)}, expected faithful 6, echo 4, original 15`);
  }
  if (letters.N !== 6 || letters.E !== 4 || letters.O !== 15) {
    errors.push(`paper-letter crosswalk counts are ${JSON.stringify(letters)}, expected N 6, E 4, O 15`);
  }
}

const vigKeys = Object.keys(vignettes.vignettes || {});
if (vigKeys.length !== 25) errors.push(`vignette file has ${vigKeys.length} entries`);

console.log(`Scene cards: ${catalog.length}`);
console.log(`Categories: ${Object.entries(byCat).map(([k, v]) => `${k}=${v}`).join(", ")}`);
console.log(`Source relations (code tags): faithful=${tags.faithful ?? "missing"}, echo=${tags.echo ?? "missing"}, original=${tags.original ?? "missing"}`);
console.log(`Paper-letter crosswalk: N=${letters.N ?? "missing"}, E=${letters.E ?? "missing"}, O=${letters.O ?? "missing"}`);
console.log("N/E/O letters are not stored on ScenarioPanel cards. Counts above come from NovelFidelity tiers plus the documented crosswalk.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Scenario validation passed.");
