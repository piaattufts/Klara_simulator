import { runSymbolicPathway } from './pipeline.js';
import { createSharedState, fillSharedState } from './state/sharedState.js';

function omitTimestamp(observation) {
  const { timestamp, ...rest } = observation;
  return rest;
}

/**
 * Build one reproduction trace. llm_outputs is always null.
 * Observation timestamps from Date.now() are omitted so the exported JSON is
 * stable; they are not inputs to scoring.
 *
 * Stored alignment and source relation are attached from stored files when
 * the caller has them. They are not computed here.
 */
export function buildTrace(scenario, symbolic, extras = {}) {
  const { beliefState, affectState, normState } = symbolic;
  return {
    scenario_id: scenario.id,
    category: scenario.category_id,
    source_relation: extras.sourceRelation?.code_tag ?? null,
    source_relation_paper_letter: extras.sourceRelation?.paper_letter ?? null,
    inputs: {
      visual: scenario.visual,
      dialogue: scenario.dialogue,
      context: scenario.context,
    },
    observations: beliefState.observations.map(omitTimestamp),
    beliefs: beliefState.beliefs_added,
    affect: {
      prior: affectState.prior,
      deltas: affectState.deltas,
      posterior: affectState.posterior,
      discrete_emotions: affectState.discrete_emotions,
    },
    active_norms: normState.norms_active,
    norm_conflicts: normState.conflicts,
    candidates: normState.action_candidates.map((c) => ({
      action: c.action,
      label: c.label,
      type: c.type,
      norm_score: c.norm_score,
      blocked: c.blocked,
      satisfies: c.satisfies,
      violations: c.violations,
    })),
    blocked_candidates: normState.blocked_actions.map((c) => c.action),
    candidate_scores: normState.action_candidates.map((c) => ({
      action: c.action,
      norm_score: c.norm_score,
      blocked: c.blocked,
      type: c.type,
    })),
    symbolic_recommendation: normState.recommended_action
      ? {
          action: normState.recommended_action.action,
          label: normState.recommended_action.label,
          type: normState.recommended_action.type,
          norm_score: normState.recommended_action.norm_score,
        }
      : null,
    published_alignment: extras.publishedAlignment ?? null,
    causal_evaluations: beliefState.causal_evaluations,
    contradictions: beliefState.contradictions,
    caution_modifier: normState.caution_modifier,
    llm_outputs: null,
  };
}

/**
 * Run one scene in isolation. The SharedState object is created inside this
 * call and is not retained for the next scene.
 */
export function runScenarioIsolated(scenario, extras = {}) {
  const state = createSharedState(scenario.id);
  const symbolic = runSymbolicPathway({
    visual: scenario.visual,
    dialogue: scenario.dialogue,
    context: scenario.context,
  });
  fillSharedState(state, symbolic);
  const trace = buildTrace(scenario, symbolic, extras);
  return { state, symbolic, trace };
}
