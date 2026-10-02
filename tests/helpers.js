import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { joinCatalog } from "../src/simulator/catalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function readJson(rel) {
  return JSON.parse(readFileSync(path.join(root, rel), "utf8"));
}

export function loadCatalog() {
  return joinCatalog(
    readJson("data/scenarios/scene_cards.json"),
    readJson("data/published/alignments.json"),
    readJson("data/published/source_relations.json"),
  );
}

export function sceneById(id) {
  const scene = loadCatalog().find((s) => s.id === id);
  if (!scene) throw new Error(`missing scene ${id}`);
  return scene;
}
