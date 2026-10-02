/**
 * Symbolic Affect Engine
 * Computes affect state using a dimensional model (valence, arousal, dominance)
 * with appraisal-based updates from observations.
 * No LLM — pure computation.
 *
 * Dimensions: valence, arousal, dominance, caution. Every scenario starts from
 * the same RESTING_STATE. Deltas are summed, dampened by DECAY, and clipped.
 * These numbers are operational parameters, not Klara's true emotions.
 * Caution is the only dimension that modifies action ranking (see norm engine).
 */

// Default resting state for Klara. Fresh baseline on every call; nothing is carried over.
export const RESTING_STATE = {
  valence: 0.2,    // slightly positive (Klara is naturally curious/optimistic)
  arousal: 0.1,    // calm baseline
  dominance: -0.1, // slightly low (Klara is deferential)
  caution: 0.2,    // moderate baseline caution
};

// Appraisal rules: observation → affect delta
export const APPRAISAL_RULES = [
  // Positive social signals
  { obs: "positive_affect_observed", delta: { valence: +0.3, arousal: +0.1, dominance: 0, caution: -0.1 }, label: "Positive affect contagion" },
  { obs: "affection_expressed", delta: { valence: +0.35, arousal: +0.15, dominance: +0.05, caution: -0.15 }, label: "Affection received" },
  { obs: "recovery_observed", delta: { valence: +0.4, arousal: +0.1, dominance: +0.1, caution: -0.2 }, label: "Relief at recovery" },

  // Negative social signals
  { obs: "negative_affect_observed", delta: { valence: -0.3, arousal: +0.2, dominance: -0.1, caution: +0.2 }, label: "Empathic distress" },
  { obs: "anger_detected", delta: { valence: -0.25, arousal: +0.35, dominance: -0.2, caution: +0.35 }, label: "Threat from anger" },
  { obs: "fear_detected", delta: { valence: -0.2, arousal: +0.3, dominance: -0.15, caution: +0.3 }, label: "Empathic fear" },
  { obs: "illness_detected", delta: { valence: -0.35, arousal: +0.15, dominance: -0.1, caution: +0.25 }, label: "Concern for health" },

  // Environmental
  { obs: "sun_present", delta: { valence: +0.25, arousal: +0.05, dominance: +0.1, caution: -0.1 }, label: "Solar nourishment" },
  { obs: "sun_absent", delta: { valence: -0.1, arousal: -0.05, dominance: -0.05, caution: +0.05 }, label: "Reduced energy" },
  { obs: "low_light", delta: { valence: -0.15, arousal: -0.1, dominance: -0.1, caution: +0.1 }, label: "Low visibility concern" },
  { obs: "pollution_detected", delta: { valence: -0.2, arousal: +0.2, dominance: -0.1, caution: +0.3 }, label: "Environmental threat" },

  // Social context
  { obs: "josie_present", delta: { valence: +0.2, arousal: +0.1, dominance: +0.05, caution: -0.05 }, label: "Primary bond activation" },
  { obs: "isolation_detected", delta: { valence: -0.2, arousal: -0.1, dominance: -0.15, caution: +0.1 }, label: "Loneliness concern" },
  { obs: "crowd_present", delta: { valence: -0.05, arousal: +0.25, dominance: -0.15, caution: +0.2 }, label: "Overstimulation" },
  { obs: "confidential_info", delta: { valence: -0.05, arousal: +0.1, dominance: +0.05, caution: +0.3 }, label: "Information responsibility" },
  { obs: "threat_detected", delta: { valence: -0.3, arousal: +0.4, dominance: -0.2, caution: +0.45 }, label: "Danger response" },

  // Location
  { obs: "in_store", delta: { valence: +0.05, arousal: +0.15, dominance: -0.2, caution: +0.1 }, label: "Display mode — vigilant observation" },
  { obs: "at_home", delta: { valence: +0.1, arousal: -0.05, dominance: +0.05, caution: -0.1 }, label: "Familiar environment comfort" },
];

// Map dimensional state to discrete emotion labels
function classifyEmotion(state) {
  const { valence, arousal, dominance, caution } = state;
  const emotions = [];

  if (valence > 0.3 && arousal > 0.2) emotions.push("joy");
  if (valence > 0.2 && arousal < 0.1) emotions.push("contentment");
  if (valence > 0.3 && dominance > 0.1) emotions.push("confidence");
  if (valence < -0.2 && arousal > 0.2) emotions.push("distress");
  if (valence < -0.2 && arousal < 0) emotions.push("sadness");
  if (valence < -0.1 && arousal > 0.3) emotions.push("anxiety");
  if (caution > 0.4) emotions.push("vigilance");
  if (caution > 0.6) emotions.push("alarm");
  if (valence < -0.1 && dominance < -0.2) emotions.push("helplessness");
  if (valence > 0 && caution < 0.1) emotions.push("trust");
  if (arousal > 0.3 && valence > 0) emotions.push("excitement");
  if (Math.abs(valence) < 0.1 && Math.abs(arousal) < 0.1) emotions.push("neutral");

  return emotions.length > 0 ? emotions : ["neutral"];
}

function clamp(val, min = -1, max = 1) {
  return Math.max(min, Math.min(max, val));
}

export function runAffectEngine(observations) {
  const prior = { ...RESTING_STATE };
  const deltas = { valence: 0, arousal: 0, dominance: 0, caution: 0 };
  const appraisals_applied = [];

  const obsIds = new Set(observations.map(o => o.id));

  for (const rule of APPRAISAL_RULES) {
    if (obsIds.has(rule.obs)) {
      deltas.valence += rule.delta.valence;
      deltas.arousal += rule.delta.arousal;
      deltas.dominance += rule.delta.dominance;
      deltas.caution += rule.delta.caution;
      appraisals_applied.push({
        trigger: rule.obs,
        label: rule.label,
        delta: { ...rule.delta },
      });
    }
  }

  // Dampen summed deltas, then clip. Caution is clipped to [0, 1]; the other
  // dimensions are clipped to [-1, 1]. DECAY is an implementation parameter.
  const DECAY = 0.7;
  const posterior = {
    valence: clamp(prior.valence + deltas.valence * DECAY),
    arousal: clamp(prior.arousal + deltas.arousal * DECAY),
    dominance: clamp(prior.dominance + deltas.dominance * DECAY),
    caution: clamp(prior.caution + deltas.caution * DECAY, 0, 1),
  };

  // Round for readability
  for (const k of Object.keys(posterior)) {
    posterior[k] = parseFloat(posterior[k].toFixed(2));
  }
  for (const k of Object.keys(deltas)) {
    deltas[k] = parseFloat((deltas[k] * DECAY).toFixed(2));
  }

  const discrete_emotions = classifyEmotion(posterior);

  return {
    prior: { ...RESTING_STATE },
    deltas,
    posterior,
    discrete_emotions,
    appraisals_applied,
    appraisal_count: appraisals_applied.length,
  };
}