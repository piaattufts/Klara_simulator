import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { joinCatalog } from "../../src/simulator/catalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function repoRoot() {
  return root;
}

export function readJson(rel) {
  return JSON.parse(readFileSync(path.join(root, rel), "utf8"));
}

export function loadCatalog() {
  const scenes = readJson("data/scenarios/scene_cards.json");
  const alignments = readJson("data/published/alignments.json");
  const relations = readJson("data/published/source_relations.json");
  const vignettes = readJson("data/published/vignettes.json");
  return {
    scenes,
    alignments,
    relations,
    vignettes,
    catalog: joinCatalog(scenes, alignments, relations),
  };
}
