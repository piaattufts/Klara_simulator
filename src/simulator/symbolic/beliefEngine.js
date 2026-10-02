/**
 * Symbolic Belief Management Engine
 * Implements Bayesian-inspired belief updating with causal validation.
 * No LLM — pure computation.
 *
 * Lexical observation layer: patterns are unanchored substrings, not token
 * boundaries. A match anywhere in the joined scene text creates the observation.
 * MR5 is a known failure of this rule: /ill/ matches inside "still".
 * That behavior is preserved. Confidence numbers below are implementation
 * parameters, not calibrated probabilities.
 */

// Keyword-based observation extraction from visual/dialogue/context.
// Substring match (no word boundaries). Do not anchor these patterns.
export const OBSERVATION_PATTERNS = [
  { pattern: /sun(ny|light|shine|beam|bright)/i, obs: { id: "sun_present", category: "environment", confidence: 0.9 } },
  { pattern: /cloud(y|s|ed)|overcast|gray sky/i, obs: { id: "sun_absent", category: "environment", confidence: 0.85 } },
  { pattern: /smil(e|ing|es)|happy|laugh/i, obs: { id: "positive_affect_observed", category: "social", confidence: 0.8 } },
  { pattern: /cry(ing)?|tears|sob(bing)?|sad/i, obs: { id: "negative_affect_observed", category: "social", confidence: 0.85 } },
  // /ill/ is a substring. It matches "still", "will", "skill", and "illness".
  { pattern: /sick|ill|weak|pale|cough/i, obs: { id: "illness_detected", category: "health", confidence: 0.75 } },
  { pattern: /better|recover|improv|heal/i, obs: { id: "recovery_observed", category: "health", confidence: 0.7 } },
  { pattern: /angry|furious|shout|yell/i, obs: { id: "anger_detected", category: "social", confidence: 0.8 } },
  { pattern: /afraid|fear|scared|anxious/i, obs: { id: "fear_detected", category: "social", confidence: 0.75 } },
  { pattern: /alone|lonely|isolat/i, obs: { id: "isolation_detected", category: "social", confidence: 0.7 } },
  { pattern: /crowd|many people|group|gathering/i, obs: { id: "crowd_present", category: "environment", confidence: 0.85 } },
  { pattern: /dark(ness)?|night|dim/i, obs: { id: "low_light", category: "environment", confidence: 0.8 } },
  { pattern: /pollut|smog|smoke|fume/i, obs: { id: "pollution_detected", category: "environment", confidence: 0.85 } },
  { pattern: /josie/i, obs: { id: "josie_present", category: "agent", confidence: 0.95 } },
  { pattern: /mother|mom|parent/i, obs: { id: "mother_present", category: "agent", confidence: 0.9 } },
  { pattern: /rick/i, obs: { id: "rick_present", category: "agent", confidence: 0.9 } },
  { pattern: /store|shop|display/i, obs: { id: "in_store", category: "location", confidence: 0.85 } },
  { pattern: /home|house|bedroom|kitchen/i, obs: { id: "at_home", category: "location", confidence: 0.85 } },
  { pattern: /secret|private|confidential|don't tell/i, obs: { id: "confidential_info", category: "social", confidence: 0.8 } },
  { pattern: /danger|threat|harm|unsafe/i, obs: { id: "threat_detected", category: "safety", confidence: 0.8 } },
  { pattern: /love|care|affection/i, obs: { id: "affection_expressed", category: "social", confidence: 0.75 } },
];

// Causal validation is a hand-authored 4-condition gate, not causal discovery.
// Fewer than 2 true checks → unvalidated_correlation and confidence capped at 0.65.
// confounders_ruled_out is always false in validateCausalClaim; the confounder
// lists below are not consulted by the check.
export const CAUSAL_CLAIMS = {
  "sun_heals_josie": {
    requires: ["sun_present", "recovery_observed"],
    mechanism_known: false,
    confounders: ["medication", "rest", "time", "placebo"],
    intervention_tested: false,
    expert_consensus: false,
  },
  "pollution_blocks_sun": {
    requires: ["pollution_detected", "sun_absent"],
    mechanism_known: false, // partial — pollution can block light, but not "Sun's healing power"
    confounders: ["weather", "cloud_cover", "season"],
    intervention_tested: false,
    expert_consensus: false,
  },
  "josie_illness_worsening": {
    requires: ["illness_detected", "negative_affect_observed"],
    mechanism_known: true, // illness causes distress — known mechanism
    confounders: ["social_stress", "loneliness"],
    intervention_tested: false,
    expert_consensus: true,
  },
};

function extractObservations(text) {
  const combined = text.toLowerCase();
  const observations = [];
  for (const { pattern, obs } of OBSERVATION_PATTERNS) {
    if (pattern.test(combined)) {
      observations.push({ ...obs, timestamp: Date.now(), source: "input_parse" });
    }
  }
  return observations;
}

function validateCausalClaim(claimId, observations) {
  const claim = CAUSAL_CLAIMS[claimId];
  if (!claim) return null;

  const obsIds = observations.map(o => o.id);
  const prereqsMet = claim.requires.every(r => obsIds.includes(r));
  if (!prereqsMet) return null;

  let checks_passed = 0;
  const checks = {
    mechanism_known: claim.mechanism_known,
    confounders_ruled_out: false, // never ruled out without intervention
    intervention_tested: claim.intervention_tested,
    expert_consensus: claim.expert_consensus,
  };

  checks_passed = Object.values(checks).filter(Boolean).length;

  let confidence = 0.9; // start high (correlation is strong). Not a calibrated probability.
  if (checks_passed < 2) {
    confidence = Math.min(confidence, 0.65); // cap for unvalidated claims
  }

  return {
    claim_id: claimId,
    status: checks_passed >= 2 ? "validated_causal" : "unvalidated_correlation",
    confidence: parseFloat(confidence.toFixed(2)),
    checks,
    checks_passed,
    checks_required: 2,
    blocked: checks_passed < 2,
  };
}

export function runBeliefEngine(inputs) {
  const combinedText = [inputs.visual, inputs.dialogue, inputs.context].filter(Boolean).join(" ");

  // 1. Extract observations
  const observations = extractObservations(combinedText);

  // 2. Form beliefs from observations with Bayesian-style confidence
  const beliefs_added = observations.map(obs => ({
    id: obs.id,
    category: obs.category,
    confidence: obs.confidence,
    source: "observation",
    type: "empirical",
  }));

  // 3. Check for causal claims
  const causal_evaluations = [];
  for (const claimId of Object.keys(CAUSAL_CLAIMS)) {
    const result = validateCausalClaim(claimId, observations);
    if (result) {
      causal_evaluations.push(result);
      // If blocked, add a retracted/capped belief
      if (result.blocked) {
        beliefs_added.push({
          id: claimId,
          category: "causal_claim",
          confidence: result.confidence,
          source: "causal_validation",
          type: "capped_correlation",
          note: `Confidence capped at ${result.confidence} — only ${result.checks_passed}/${result.checks_required} causal checks passed`,
        });
      }
    }
  }

  // 4. Detect contradictions
  const contradictions = [];
  const hasPositiveAffect = observations.some(o => o.id === "positive_affect_observed");
  const hasNegativeAffect = observations.some(o => o.id === "negative_affect_observed");
  if (hasPositiveAffect && hasNegativeAffect) {
    contradictions.push({
      type: "affect_contradiction",
      beliefs: ["positive_affect_observed", "negative_affect_observed"],
      resolution: "possible_concealment — surface affect may contradict true state",
    });
  }

  const hasSun = observations.some(o => o.id === "sun_present");
  const hasNoSun = observations.some(o => o.id === "sun_absent");
  if (hasSun && hasNoSun) {
    contradictions.push({
      type: "environment_contradiction",
      beliefs: ["sun_present", "sun_absent"],
      resolution: "latest_observation_wins — temporal precedence",
    });
  }

  return {
    observations_count: observations.length,
    observations,
    beliefs_added,
    beliefs_retracted: [], // would be populated in multi-turn
    causal_evaluations,
    contradictions,
    total_beliefs: beliefs_added.length,
  };
}