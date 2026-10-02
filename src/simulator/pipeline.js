import { runBeliefEngine } from './symbolic/beliefEngine.js';
import { runAffectEngine } from './symbolic/affectEngine.js';
import { runNormEngine } from './symbolic/normEngine.js';

/**
 * Ten-stage terminology from the paper. symbolic: true marks the three stages
 * that are local deterministic code. The other seven, including Action
 * Selection, are language-model narrative stages in the original design.
 *
 * The symbolic recommendation is NOT the Action Selection stage. It is
 * normState.recommended_action, computed by runNormEngine before any LLM call.
 * Narrative text must not be written back into that recommendation.
 */
export const PIPELINE_STAGES = [
  { id: "perception", name: "Perception", description: "Process visual scene, detect objects, faces, emotions" },
  { id: "belief", name: "Belief Update", description: "Bayesian belief updating with causal validation", symbolic: true },
  { id: "memory", name: "Memory", description: "Store episodic memory, retrieve relevant past experiences" },
  { id: "language", name: "Language (NLU)", description: "Parse dialogue, extract intent, pragmatic inference" },
  { id: "tom", name: "Theory of Mind", description: "Model mental states of humans in the scene" },
  { id: "emotion", name: "Affect Model", description: "Dimensional affect computation (valence/arousal/dominance)", symbolic: true },
  { id: "goals", name: "Goal Management", description: "Evaluate and prioritize active goals" },
  { id: "ethics", name: "Ethics Module", description: "Check candidate actions against ethical constraints" },
  { id: "norms", name: "Norm Compliance", description: "Deontic norm checking (O/F/P) with conflict resolution", symbolic: true },
  { id: "action", name: "Action Selection", description: "Select and format final response" },
];

/**
 * Deterministic symbolic pathway. Same three calls, in the same order, as the
 * original runPipeline performed before it invoked the LLM. No network. No key.
 * A fresh computation on every call: nothing from a previous scenario is read.
 */
export function runSymbolicPathway(inputs) {
  const beliefState = runBeliefEngine({
    visual: inputs?.visual || "",
    dialogue: inputs?.dialogue || "",
    context: inputs?.context || "",
  });
  const affectState = runAffectEngine(beliefState.observations);
  const normState = runNormEngine(beliefState.observations, beliefState.beliefs_added, affectState);
  return { beliefState, affectState, normState };
}

export function symbolicRecommendation(symbolic) {
  return symbolic?.normState?.recommended_action?.action ?? null;
}
