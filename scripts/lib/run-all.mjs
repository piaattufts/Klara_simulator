import { runScenarioIsolated } from "../../src/simulator/trace.js";
import { loadCatalog } from "./load.mjs";

/**
 * Reproduction core.
 * 1. Load all scene cards.
 * 2. Fresh SharedState inside each runScenarioIsolated call.
 * 3. Deterministic symbolic path only.
 * 4. One trace per scenario.
 * 5. Attach stored published alignment when present.
 * Does not call a language model and does not read the environment.
 */
export function reproduceAll() {
  const { catalog, alignments, relations } = loadCatalog();
  if (!alignments?.annotations || Object.keys(alignments.annotations).length === 0) {
    const error = new Error(
      "Published alignment annotations are not in the source dataset. Refusing to count 6/17/2."
    );
    error.code = "ALIGNMENTS_MISSING";
    throw error;
  }
  const traces = [];
  for (const scenario of catalog) {
    const { trace } = runScenarioIsolated(scenario, {
      sourceRelation: scenario.source_relation,
      publishedAlignment: scenario.published_alignment?.alignment ?? null,
    });
    traces.push(trace);
  }
  const counts = { aligned: 0, partially: 0, misaligned: 0, missing: 0 };
  for (const trace of traces) {
    if (!trace.published_alignment) counts.missing += 1;
    else if (Object.prototype.hasOwnProperty.call(counts, trace.published_alignment)) {
      counts[trace.published_alignment] += 1;
    } else {
      counts.missing += 1;
    }
  }
  const relationCounts = { faithful: 0, echo: 0, original: 0, missing: 0 };
  const letterCounts = { N: 0, E: 0, O: 0 };
  for (const trace of traces) {
    if (!trace.source_relation) relationCounts.missing += 1;
    else relationCounts[trace.source_relation] = (relationCounts[trace.source_relation] || 0) + 1;
    if (trace.source_relation_paper_letter) {
      letterCounts[trace.source_relation_paper_letter] =
        (letterCounts[trace.source_relation_paper_letter] || 0) + 1;
    }
  }
  const categoryCounts = {};
  for (const trace of traces) {
    categoryCounts[trace.category] = (categoryCounts[trace.category] || 0) + 1;
  }
  const expected = { aligned: 6, partially: 17, misaligned: 2 };
  const alignmentOk =
    counts.missing === 0 &&
    counts.aligned === expected.aligned &&
    counts.partially === expected.partially &&
    counts.misaligned === expected.misaligned;
  return {
    traces,
    summary: {
      scenario_count: traces.length,
      category_counts: categoryCounts,
      source_relation_counts: relationCounts,
      source_relation_paper_letters: letterCounts,
      source_relation_note: relations.note,
      alignment_counts: { aligned: counts.aligned, partially: counts.partially, misaligned: counts.misaligned },
      alignment_missing: counts.missing,
      alignment_expected: expected,
      alignment_check: alignmentOk ? "pass" : "fail",
      llm_outputs: "null",
      recommendations: Object.fromEntries(
        traces.map((t) => [t.scenario_id, t.symbolic_recommendation?.action ?? null])
      ),
    },
  };
}
