/**
 * SharedState is fresh for every scenario. The symbolic engines are pure:
 * they do not read or write a store that survives the call. This helper makes
 * that boundary explicit for the reproduction runner and the UI.
 */
export function createSharedState(scenarioId = null) {
  return {
    scenario_id: scenarioId,
    observations: [],
    beliefs: [],
    affect: null,
    active_norms: [],
    norm_conflicts: [],
    candidates: [],
    blocked_candidates: [],
    candidate_scores: [],
    symbolic_recommendation: null,
    llm_outputs: null,
  };
}

export function fillSharedState(state, symbolic) {
  const { beliefState, affectState, normState } = symbolic;
  state.observations = beliefState.observations;
  state.beliefs = beliefState.beliefs_added;
  state.affect = affectState.posterior;
  state.active_norms = normState.norms_active;
  state.norm_conflicts = normState.conflicts;
  state.candidates = normState.action_candidates;
  state.blocked_candidates = normState.blocked_actions;
  state.candidate_scores = normState.action_candidates.map((c) => ({
    action: c.action,
    norm_score: c.norm_score,
    blocked: c.blocked,
  }));
  state.symbolic_recommendation = normState.recommended_action;
  state.llm_outputs = null;
  return state;
}
