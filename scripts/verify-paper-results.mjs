import { reproduceAll } from "./lib/run-all.mjs";

let result;
try {
  result = reproduceAll();
} catch (error) {
  if (error.code === "ALIGNMENTS_MISSING") {
    console.error(error.message);
    console.error("verify-paper-results: FAIL. Annotations were not in the source, so 6/17/2 cannot be checked.");
    process.exit(1);
  }
  throw error;
}

const { summary } = result;
const { aligned, partially, misaligned } = summary.alignment_counts;
console.log(`Stored alignment counts: aligned=${aligned}, partially=${partially}, misaligned=${misaligned}`);
console.log("Expected from the paper, checked against stored annotations only: 6 / 17 / 2");
if (summary.alignment_missing > 0 || summary.alignment_check !== "pass") {
  console.error(`FAIL. missing=${summary.alignment_missing}. This script does not label scenarios.`);
  process.exit(1);
}
console.log("PASS. Stored annotations are 6 aligned, 17 partially aligned, 2 misaligned.");
