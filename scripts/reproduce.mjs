import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { reproduceAll } from "./lib/run-all.mjs";
import { repoRoot } from "./lib/load.mjs";

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

console.log(`Wrote ${traces.length} traces to outputs/reproduction/traces/`);
console.log(`Alignment ${summary.alignment_check}: ${summary.alignment_counts.aligned} aligned, ${summary.alignment_counts.partially} partially, ${summary.alignment_counts.misaligned} misaligned`);
console.log(`Source relations: faithful ${summary.source_relation_counts.faithful}, echo ${summary.source_relation_counts.echo}, original ${summary.source_relation_counts.original}`);
if (summary.alignment_check !== "pass") process.exit(1);
