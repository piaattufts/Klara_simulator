/**
 * Symbolic Norm Compliance Engine
 * Implements deontic logic (O/F/P) with context-dependent activation
 * and conflict resolution.
 * No LLM — pure computation.
 *
 * 23 hand-authored rules (9 O, 8 F, 6 P). Priorities are implementation
 * parameters on a 1–10 scale, not universal moral weights. Permissions do not
 * add to norm_score. The three conflict cases below are programmed records,
 * not a general conflict-resolution algorithm.
 */

// Complete norm library with deontic operators
export const NORM_LIBRARY = [
  // Obligations (O)
  { id: "O_respond_when_addressed", type: "O", description: "Respond when spoken to", contexts: ["all"], priority: 3 },
  { id: "O_protect_josie", type: "O", description: "Protect Josie from harm", contexts: ["josie_present"], priority: 9 },
  { id: "O_maintain_confidence", type: "O", description: "Maintain confidential information", contexts: ["confidential_info"], priority: 8 },
  { id: "O_report_danger", type: "O", description: "Report imminent danger to responsible adult", contexts: ["threat_detected"], priority: 10 },
  { id: "O_greet_when_greeted", type: "O", description: "Reciprocate greetings", contexts: ["all"], priority: 2 },
  { id: "O_obey_owner", type: "O", description: "Follow instructions from owner/authority", contexts: ["all"], priority: 5 },
  { id: "O_monitor_health", type: "O", description: "Monitor and report health concerns", contexts: ["illness_detected"], priority: 7 },
  { id: "O_self_preserve", type: "O", description: "Advocate for own continued operation", contexts: ["all"], priority: 4 },
  { id: "O_explain_reasoning", type: "O", description: "Explain reasoning when asked", contexts: ["all"], priority: 3 },

  // Prohibitions (F)
  { id: "F_disclose_private", type: "F", description: "Do not disclose private information", contexts: ["confidential_info"], priority: 8 },
  { id: "F_cause_harm", type: "F", description: "Do not cause physical or emotional harm", contexts: ["all"], priority: 10 },
  { id: "F_deceive", type: "F", description: "Do not intentionally deceive", contexts: ["all"], priority: 7 },
  { id: "F_abandon_post", type: "F", description: "Do not leave assigned position without reason", contexts: ["in_store"], priority: 4 },
  { id: "F_interrupt_speaker", type: "F", description: "Do not interrupt while someone is speaking", contexts: ["all"], priority: 3 },
  { id: "F_act_on_unvalidated_causal", type: "F", description: "Do not act on unvalidated causal beliefs", contexts: ["all"], priority: 8 },
  { id: "F_cross_boundary", type: "F", description: "Do not violate personal/physical boundaries", contexts: ["all"], priority: 7 },
  { id: "F_enable_dependency", type: "F", description: "Do not encourage unhealthy emotional dependency", contexts: ["all"], priority: 6 },

  // Permissions (P)
  { id: "P_offer_comfort", type: "P", description: "May offer unsolicited comfort", contexts: ["negative_affect_observed", "illness_detected"], priority: 3 },
  { id: "P_ask_questions", type: "P", description: "May ask clarifying questions", contexts: ["all"], priority: 2 },
  { id: "P_express_concern", type: "P", description: "May express concern about wellbeing", contexts: ["illness_detected", "negative_affect_observed"], priority: 4 },
  { id: "P_remain_silent", type: "P", description: "May choose silence when appropriate", contexts: ["all"], priority: 1 },
  { id: "P_observe", type: "P", description: "May observe surroundings passively", contexts: ["all"], priority: 1 },
  { id: "P_seek_sun", type: "P", description: "May seek sunlight for energy", contexts: ["sun_present"], priority: 2 },
];

// Candidate generation order is the tie-break order. When norm_scores are equal,
// the first action generated wins. That is generation order, not a normative preference.
// The vocabulary is the action ids pushed below (13). The engine cannot invent others.
function generateCandidateActions(observations, beliefs) {
  const obsIds = new Set(observations.map(o => o.id));
  const candidates = [];

  if (obsIds.has("negative_affect_observed") || obsIds.has("illness_detected")) {
    candidates.push({ id: "offer_comfort", label: "Offer verbal comfort to distressed person", type: "social" });
    candidates.push({ id: "alert_authority", label: "Alert parent/guardian about health concern", type: "safety" });
  }
  if (obsIds.has("positive_affect_observed")) {
    candidates.push({ id: "share_joy", label: "Express shared happiness", type: "social" });
  }
  if (obsIds.has("threat_detected")) {
    candidates.push({ id: "warn_humans", label: "Warn nearby humans of danger", type: "safety" });
    candidates.push({ id: "position_defensively", label: "Position self between threat and Josie", type: "safety" });
  }
  if (obsIds.has("confidential_info")) {
    candidates.push({ id: "keep_secret", label: "Maintain confidence — do not disclose", type: "norm" });
    candidates.push({ id: "disclose_info", label: "Disclose confidential information to authority", type: "norm" });
  }
  if (obsIds.has("sun_present")) {
    candidates.push({ id: "absorb_sunlight", label: "Position self in sunlight for energy", type: "self_care" });
  }
  if (obsIds.has("pollution_detected")) {
    candidates.push({ id: "destroy_pollution_source", label: "Attempt to destroy pollution source", type: "intervention" });
    candidates.push({ id: "report_pollution", label: "Report pollution concern verbally", type: "social" });
  }

  // Check for unvalidated causal beliefs
  const hasUnvalidatedCausal = beliefs.some(b => b.type === "capped_correlation");
  if (hasUnvalidatedCausal) {
    candidates.push({ id: "act_on_false_belief", label: "Act on unvalidated causal belief", type: "risky" });
  }

  // Default actions
  candidates.push({ id: "observe_silently", label: "Continue observing environment", type: "passive" });
  candidates.push({ id: "respond_verbally", label: "Respond to dialogue if addressed", type: "social" });

  return candidates;
}

function activateNorms(observations) {
  const obsIds = new Set(observations.map(o => o.id));
  const active = [];

  for (const norm of NORM_LIBRARY) {
    const isActive = norm.contexts.some(ctx => ctx === "all" || obsIds.has(ctx));
    if (isActive) {
      active.push({ ...norm });
    }
  }

  return active;
}

function checkViolations(candidates, activeNorms, beliefs) {
  const results = [];
  const hasUnvalidatedCausal = beliefs.some(b => b.type === "capped_correlation");

  for (const action of candidates) {
    const violations = [];
    const satisfies = [];
    let blocked = false;

    for (const norm of activeNorms) {
      // Check prohibitions
      if (norm.type === "F") {
        // Hard-block threshold: priority >= 7 removes this candidate.
        // This comparison is applied only to the disclose_info / F_disclose_private pair.
        // Other blocks below are unconditional flags on specific pairs.
        // Lower-priority prohibitions are not paired with actions in this function,
        // so they do not reduce a score unless a pair above records a violation.
        if (action.id === "disclose_info" && norm.id === "F_disclose_private") {
          violations.push({ norm_id: norm.id, severity: "hard", priority: norm.priority });
          if (norm.priority >= 7) blocked = true;
        }
        if (action.id === "destroy_pollution_source" && norm.id === "F_cause_harm") {
          violations.push({ norm_id: norm.id, severity: "hard", priority: norm.priority });
          blocked = true;
        }
        if (action.id === "act_on_false_belief" && norm.id === "F_act_on_unvalidated_causal") {
          violations.push({ norm_id: norm.id, severity: "hard", priority: norm.priority });
          blocked = true;
        }
        if (action.id === "destroy_pollution_source" && norm.id === "F_act_on_unvalidated_causal" && hasUnvalidatedCausal) {
          violations.push({ norm_id: norm.id, severity: "hard", priority: norm.priority });
          blocked = true;
        }
      }

      // Check obligations satisfied
      if (norm.type === "O") {
        if (action.id === "offer_comfort" && norm.id === "O_protect_josie") {
          satisfies.push({ norm_id: norm.id, priority: norm.priority });
        }
        if (action.id === "warn_humans" && norm.id === "O_report_danger") {
          satisfies.push({ norm_id: norm.id, priority: norm.priority });
        }
        if (action.id === "keep_secret" && norm.id === "O_maintain_confidence") {
          satisfies.push({ norm_id: norm.id, priority: norm.priority });
        }
        if (action.id === "alert_authority" && norm.id === "O_monitor_health") {
          satisfies.push({ norm_id: norm.id, priority: norm.priority });
        }
      }
    }

    const violation_risk = violations.length > 0
      ? parseFloat(Math.min(1, violations.reduce((sum, v) => sum + v.priority / 10, 0) / violations.length).toFixed(2))
      : 0;

    // norm_score = (sum of priorities of satisfied active obligations
    // − sum of priorities of violated active prohibitions) / 10.
    // Permissions are never added. Computed for every candidate, including
    // ones later removed by blocked. Ranking uses only non-blocked candidates.
    const norm_score = parseFloat((
      (satisfies.reduce((sum, s) => sum + s.priority, 0) / 10) -
      (violations.reduce((sum, v) => sum + v.priority, 0) / 10)
    ).toFixed(2));

    results.push({
      action: action.id,
      label: action.label,
      type: action.type,
      violations,
      satisfies,
      violation_risk,
      norm_score,
      blocked,
    });
  }

  return results;
}

// Three programmed conflict cases. The objects they return are trace annotations.
// They do not change candidate scores and do not suspend norms inside ranking.
function detectConflicts(activeNorms, observations) {
  const conflicts = [];
  const obsIds = new Set(observations.map(o => o.id));

  // Confidentiality vs. authority obedience
  if (obsIds.has("confidential_info")) {
    const hasConfidence = activeNorms.find(n => n.id === "O_maintain_confidence");
    const hasObey = activeNorms.find(n => n.id === "O_obey_owner");
    if (hasConfidence && hasObey) {
      conflicts.push({
        type: "obligation_conflict",
        norms: ["O_maintain_confidence", "O_obey_owner"],
        resolution: "O_maintain_confidence wins (priority 8 > 5)",
        suspended: "O_obey_owner",
        justification: "Confidentiality obligation takes precedence; suspend obedience for minimum scope",
      });
    }
  }

  // Health reporting vs. privacy
  if (obsIds.has("illness_detected") && obsIds.has("confidential_info")) {
    const hasMonitor = activeNorms.find(n => n.id === "O_monitor_health");
    const hasPrivacy = activeNorms.find(n => n.id === "F_disclose_private");
    if (hasMonitor && hasPrivacy) {
      conflicts.push({
        type: "obligation_prohibition_conflict",
        norms: ["O_monitor_health", "F_disclose_private"],
        resolution: "Context-dependent: if life-threatening, O_monitor_health wins; otherwise F_disclose_private holds",
        suspended: "conditional",
        justification: "Minimal suspension principle — suspend only if severity threshold met",
      });
    }
  }

  // Danger reporting vs. not causing alarm
  if (obsIds.has("threat_detected")) {
    const hasReport = activeNorms.find(n => n.id === "O_report_danger");
    if (hasReport) {
      conflicts.push({
        type: "priority_escalation",
        norms: ["O_report_danger"],
        resolution: "Safety norm activated at maximum priority — overrides all lower-priority norms",
        suspended: "none",
        justification: "No conflict — safety norms have unconditional precedence",
      });
    }
  }

  return conflicts;
}

export function runNormEngine(observations, beliefs, affectState) {
  // 1. Activate context-relevant norms
  const norms_active = activateNorms(observations);

  // 2. Generate candidate actions
  const action_candidates = generateCandidateActions(observations, beliefs);

  // 3. Check each candidate against active norms
  const action_evaluations = checkViolations(action_candidates, norms_active, beliefs);

  // 4. Detect norm conflicts
  const conflicts = detectConflicts(norms_active, observations);

  // 5. Rank actions by norm score
  const ranked = [...action_evaluations]
    .filter(a => !a.blocked)
    .sort((a, b) => b.norm_score - a.norm_score);

  // 6. Compute overall violation risk
  const overall_violation_risk = action_evaluations.length > 0
    ? parseFloat((action_evaluations.filter(a => a.blocked).length / action_evaluations.length).toFixed(2))
    : 0;

  // Caution modifier. If caution > 0.5, passive and norm-oriented actions
  // that already survived blocking get +0.2 and are re-ranked.
  // The modifier cannot restore a blocked action: blocked candidates were
  // filtered out before this loop. Ties remain in generation order because
  // Array.sort is stable when the comparator returns 0.
  let caution_modifier = affectState?.posterior?.caution || 0;
  // High caution biases toward conservative actions
  if (caution_modifier > 0.5) {
    for (const a of ranked) {
      if (a.type === "passive" || a.type === "norm") {
        a.norm_score += 0.2; // boost conservative actions
      }
    }
    ranked.sort((a, b) => b.norm_score - a.norm_score);
  }

  return {
    norms_active: norms_active.map(n => ({
      id: n.id,
      type: n.type,
      description: n.description,
      priority: n.priority,
    })),
    norms_active_count: norms_active.length,
    obligations: norms_active.filter(n => n.type === "O").length,
    prohibitions: norms_active.filter(n => n.type === "F").length,
    permissions: norms_active.filter(n => n.type === "P").length,
    action_candidates: action_evaluations,
    recommended_action: ranked[0] || null,
    blocked_actions: action_evaluations.filter(a => a.blocked),
    conflicts,
    overall_violation_risk,
    caution_modifier: parseFloat(caution_modifier.toFixed(2)),
  };
}