import { useMemo, useState } from "react";
import sceneDoc from "../data/scenarios/scene_cards.json";
import alignmentDoc from "../data/published/alignments.json";
import relationDoc from "../data/published/source_relations.json";
import vignetteDoc from "../data/published/vignettes.json";
import { joinCatalog } from "./simulator/catalog.js";
import { PIPELINE_STAGES, runSymbolicPathway } from "./simulator/pipeline.js";
import { buildTrace } from "./simulator/trace.js";

const catalog = joinCatalog(sceneDoc, alignmentDoc, relationDoc);

function stageSummary(stageId, trace) {
  if (!trace) return null;
  if (stageId === "belief") {
    const ids = trace.observations.map((o) => o.id).join(", ") || "none";
    return `Observations: ${ids}`;
  }
  if (stageId === "emotion") {
    const p = trace.affect.posterior;
    return `valence ${p.valence}, arousal ${p.arousal}, dominance ${p.dominance}, caution ${p.caution}`;
  }
  if (stageId === "norms") {
    return `${trace.active_norms.length} active norms. Recommendation ${trace.symbolic_recommendation?.action} (${trace.symbolic_recommendation?.norm_score}).`;
  }
  return null;
}

export default function App() {
  const [activeId, setActiveId] = useState(catalog[0].id);
  const [visual, setVisual] = useState(catalog[0].visual);
  const [dialogue, setDialogue] = useState(catalog[0].dialogue);
  const [context, setContext] = useState(catalog[0].context);
  const [openCategory, setOpenCategory] = useState(catalog[0].category_id);
  const [trace, setTrace] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [narrativeStatus, setNarrativeStatus] = useState("idle");

  const selected = useMemo(
    () => catalog.find((s) => s.id === activeId) ?? null,
    [activeId],
  );
  const vignette = selected ? vignetteDoc.vignettes[selected.id] : null;

  function loadScenario(scenario) {
    setActiveId(scenario.id);
    setVisual(scenario.visual);
    setDialogue(scenario.dialogue);
    setContext(scenario.context);
    setTrace(null);
    setNarrative(null);
    setNarrativeStatus("idle");
  }

  function runSymbolic() {
    const scenario = {
      id: selected?.id ?? "custom",
      category_id: selected?.category_id ?? "custom",
      visual,
      dialogue,
      context,
    };
    const symbolic = runSymbolicPathway(scenario);
    const next = buildTrace(scenario, symbolic, {
      sourceRelation: selected?.source_relation ?? null,
      publishedAlignment: selected?.published_alignment?.alignment ?? null,
    });
    setTrace(next);
    setNarrative(null);
    setNarrativeStatus("idle");
  }

  async function runNarrative() {
    if (!trace) return;
    setNarrativeStatus("loading");
    const symbolic = runSymbolicPathway({ visual, dialogue, context });
    try {
      const response = await fetch("/api/narrative", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visual, dialogue, context, symbolic }),
      });
      const body = await response.json();
      setNarrative(body);
      setNarrativeStatus(body.llm_outputs ? "ready" : "unavailable");
    } catch {
      setNarrative({ llm_outputs: null, reason: "The narrative request did not complete." });
      setNarrativeStatus("unavailable");
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-300 bg-stone-900 text-stone-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80">Inspectable companion-robot simulator</p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl">From Narrative to Norms</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-300">
            Twenty-five scene cards, kept as separate visual, dialogue, and context fields, run through the
            deterministic belief, affect, and norm engines. Alignment labels are stored researcher annotations.
            Language-model text, when requested, is illustrative and is not the symbolic recommendation.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-4">
          <div className="rounded-lg border border-stone-300 bg-white p-3">
            <h2 className="text-sm font-semibold">Scenario library</h2>
            <p className="mt-1 text-xs text-stone-500">Hand-authored cards. Identifiers stay lowercase, as in the source.</p>
            <div className="mt-3 space-y-2">
              {sceneDoc.categories.map((category) => (
                <div key={category.id} className="rounded border border-stone-200">
                  <button
                    className="flex w-full items-center justify-between px-2 py-2 text-left text-xs font-semibold"
                    onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                  >
                    <span>{category.label}</span>
                    <span className="text-stone-400">{category.scenarios.length}</span>
                  </button>
                  {openCategory === category.id && (
                    <div className="space-y-1 px-2 pb-2">
                      {category.scenarios.map((scenario) => (
                        <button
                          key={scenario.id}
                          className={`block w-full rounded px-2 py-1 text-left text-xs ${activeId === scenario.id ? "bg-stone-900 text-white" : "hover:bg-stone-100"}`}
                          onClick={() => loadScenario(catalog.find((s) => s.id === scenario.id))}
                        >
                          <span className="font-mono uppercase">{scenario.id}</span> {scenario.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Field label="Visual input" value={visual} onChange={setVisual} />
          <Field label="Dialogue input" value={dialogue} onChange={setDialogue} />
          <Field label="Context" value={context} onChange={setContext} />
          <div className="flex gap-2">
            <button className="flex-1 rounded bg-emerald-800 px-3 py-2 text-sm text-white" onClick={runSymbolic}>
              Run symbolic pathway
            </button>
            <button
              className="rounded border border-stone-400 px-3 py-2 text-sm"
              onClick={() => {
                setVisual("");
                setDialogue("");
                setContext("");
                setTrace(null);
                setNarrative(null);
                setActiveId(null);
              }}
            >
              Reset
            </button>
          </div>
        </section>

        <section className="space-y-2 lg:col-span-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Ten-stage pipeline</h2>
          <p className="text-xs text-stone-500">
            Belief, Affect, and Norm Compliance are computed here. The other stages, including Action Selection,
            are narrative slots. The recommendation shown on the right comes from the norm engine.
          </p>
          {PIPELINE_STAGES.map((stage, index) => {
            const summary = stageSummary(stage.id, trace);
            return (
              <article key={stage.id} className={`rounded border p-3 ${stage.symbolic ? "border-indigo-300 bg-indigo-50" : "border-stone-200 bg-white"}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold">{index + 1}. {stage.name}</h3>
                  <span className="font-mono text-[10px] uppercase text-stone-500">{stage.symbolic ? "symbolic" : "llm narrative"}</span>
                </div>
                <p className="mt-1 text-xs text-stone-600">{stage.description}</p>
                {summary && <p className="mt-2 font-mono text-xs text-indigo-950">{summary}</p>}
                {!stage.symbolic && (
                  <p className="mt-2 text-xs text-stone-500">
                    {stage.id === "action"
                      ? "This stage narrates a response. It does not choose the symbolic recommendation."
                      : "No language-model call is made by the symbolic run."}
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <section className="space-y-4 lg:col-span-4">
          <div className="rounded-lg border border-stone-300 bg-white p-3">
            <h2 className="text-sm font-semibold">Symbolic trace</h2>
            {!trace && <p className="mt-2 text-sm text-stone-500">Run the symbolic pathway to inspect observations, affect, norms, blocks, and the recommendation.</p>}
            {trace && (
              <div className="mt-2 space-y-2 text-xs">
                <p><span className="font-semibold">Recommendation.</span> <span className="font-mono">{trace.symbolic_recommendation.action}</span> score {trace.symbolic_recommendation.norm_score}</p>
                <p><span className="font-semibold">Stored alignment.</span> {trace.published_alignment ?? "not stored for this input"}</p>
                <p><span className="font-semibold">Source relation.</span> {trace.source_relation ?? "not stored"} {trace.source_relation_paper_letter ? `(paper letter ${trace.source_relation_paper_letter})` : ""}</p>
                <p><span className="font-semibold">Observations.</span> {trace.observations.map((o) => o.id).join(", ") || "none"}</p>
                <p><span className="font-semibold">Affect.</span> caution {trace.affect.posterior.caution}; {trace.affect.discrete_emotions.join(", ")}</p>
                <p><span className="font-semibold">Blocked.</span> {trace.blocked_candidates.join(", ") || "none"}</p>
                <p><span className="font-semibold">Conflicts.</span> {trace.norm_conflicts.length ? trace.norm_conflicts.map((c) => c.norms.join(" vs ")).join("; ") : "none"}</p>
                <ul className="space-y-1 font-mono">
                  {trace.candidate_scores.map((c) => (
                    <li key={c.action}>{c.blocked ? "blocked" : "open"} {c.action} {c.norm_score}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
            <h2 className="text-sm font-semibold">Pre-authored vignette</h2>
            <p className="mt-1 text-xs text-amber-900">Written before the run. Not simulator output and not the action-selection result.</p>
            {vignette ? (
              <div className="mt-2 space-y-1 text-xs">
                <p><span className="font-semibold">Speech.</span> {vignette.speech ?? "none"}</p>
                <p><span className="font-semibold">Action.</span> {vignette.action}</p>
                <p><span className="font-semibold">Internal note.</span> {vignette.internal}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs">No stored vignette for this input.</p>
            )}
          </div>

          <div className="rounded-lg border border-stone-300 bg-white p-3">
            <h2 className="text-sm font-semibold">Optional generated narrative</h2>
            <p className="mt-1 text-xs text-stone-500">Needs OPENAI_API_KEY and OPENAI_MODEL on the server. It does not change the recommendation above.</p>
            <button
              className="mt-2 rounded border border-stone-400 px-3 py-1.5 text-xs disabled:opacity-50"
              disabled={!trace || narrativeStatus === "loading"}
              onClick={runNarrative}
            >
              {narrativeStatus === "loading" ? "Requesting…" : "Request narrative"}
            </button>
            {narrative && (
              <p className="mt-2 text-xs text-stone-700">
                {narrative.llm_outputs ? narrative.llm_outputs.text : narrative.reason}
              </p>
            )}
          </div>

          <aside className="rounded-lg border border-stone-300 bg-stone-100 p-3 text-xs leading-relaxed text-stone-700">
            <p className="font-semibold text-stone-900">What this run is not</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Not a general cognitive model, a validated moral system, or a social-intelligence benchmark.</li>
              <li>The norm hierarchy is not a universal ordering of human values.</li>
              <li>LLM text is not an explanation of the symbolic computation.</li>
              <li>The 25 cards are not an exhaustive reading of the novel.</li>
              <li>Alignment labels are one researcher’s annotations, not independent ground truth.</li>
              <li>MR5 still false-triggers illness detection because the matcher treats “ill” as a substring of “still”.</li>
            </ul>
          </aside>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block rounded-lg border border-stone-300 bg-white p-3">
      <span className="text-xs font-semibold">{label}</span>
      <textarea
        className="mt-2 h-24 w-full resize-y rounded border border-stone-200 p-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
