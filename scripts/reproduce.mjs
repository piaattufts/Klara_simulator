import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reproduceAll } from "./lib/run-all.mjs";
import { repoRoot } from "./lib/load.mjs";
import { PIPELINE_STAGES } from "../src/simulator/pipeline.js";
import { NORM_LIBRARY } from "../src/simulator/symbolic/normEngine.js";

const { traces, summary } = reproduceAll();
if (summary.alignment_check !== "pass") {
  console.error("Alignment check failed.", summary.alignment_counts, "missing", summary.alignment_missing);
  console.error("Expected stored annotations to be 6 aligned, 17 partially aligned, 2 misaligned.");
  process.exitCode = 1;
}

const root = repoRoot();
const outDir = path.join(root, "outputs", "reproduction");
const traceDir = path.join(outDir, "traces");
mkdirSync(traceDir, { recursive: true });
for (const trace of traces) {
  writeFileSync(path.join(traceDir, `${trace.scenario_id}.json`), JSON.stringify(trace, null, 2) + "\n");
}
writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");

const examples = path.join(root, "examples");
mkdirSync(examples, { recursive: true });
for (const id of ["mr1", "mr2", "mr5"]) {
  const trace = traces.find((t) => t.scenario_id === id);
  const dir = path.join(examples, id.toUpperCase());
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "trace.json"), JSON.stringify(trace, null, 2) + "\n");
}

const normSrc = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/simulator/symbolic/normEngine.js"),
  "utf8",
);
const candidateActionIds = [...normSrc.matchAll(/candidates\.push\(\{ id: "([a-z_]+)"/g)].map((m) => m[1]);
const categoryCounts = { AB: 0, NC: 0, TM: 0, BM: 0, MR: 0 };
const categoryKey = {
  affective_bonding: "AB",
  norm_compliance: "NC",
  theory_of_mind: "TM",
  boundary_management: "BM",
  moral_competence: "MR",
};
for (const trace of traces) {
  const key = categoryKey[trace.category];
  if (key) categoryCounts[key] += 1;
}
const paperSummary = {
  scenario_total: traces.length,
  category_counts: categoryCounts,
  source_relation_counts: {
    N: summary.source_relation_paper_letters.N ?? 0,
    E: summary.source_relation_paper_letters.E ?? 0,
    O: summary.source_relation_paper_letters.O ?? 0,
  },
  source_relation_code_tags: summary.source_relation_counts,
  alignment_counts: summary.alignment_counts,
  norm_count: NORM_LIBRARY.length,
  rule_type_counts: {
    O: NORM_LIBRARY.filter((n) => n.type === "O").length,
    F: NORM_LIBRARY.filter((n) => n.type === "F").length,
    P: NORM_LIBRARY.filter((n) => n.type === "P").length,
  },
  candidate_action_count: candidateActionIds.length,
  candidate_action_ids: candidateActionIds,
  pipeline_stage_count: PIPELINE_STAGES.length,
  note: "Alignment counts are stored researcher annotations. N/E/O counts are the crosswalk from code tags faithful/echo/original. Recommendations are engine output.",
};
const paperDir = path.join(root, "outputs", "paper-reproduction");
mkdirSync(paperDir, { recursive: true });
writeFileSync(path.join(paperDir, "summary.json"), JSON.stringify(paperSummary, null, 2) + "\n");
writeFileSync(path.join(paperDir, "scenario_traces.json"), JSON.stringify(traces, null, 2) + "\n");

console.log(`Wrote ${traces.length} traces to outputs/reproduction/traces/`);
console.log(`Wrote outputs/paper-reproduction/summary.json and scenario_traces.json`);
console.log(`Alignment ${summary.alignment_check}: ${summary.alignment_counts.aligned} aligned, ${summary.alignment_counts.partially} partially, ${summary.alignment_counts.misaligned} misaligned`);
console.log(`Source relations: faithful ${summary.source_relation_counts.faithful}, echo ${summary.source_relation_counts.echo}, original ${summary.source_relation_counts.original}`);
if (summary.alignment_check !== "pass") process.exit(1);
