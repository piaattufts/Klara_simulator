import { test } from "node:test";
import assert from "node:assert/strict";
import { NORM_LIBRARY, runNormEngine } from "../src/simulator/symbolic/normEngine.js";
import { runBeliefEngine } from "../src/simulator/symbolic/beliefEngine.js";
import { runAffectEngine } from "../src/simulator/symbolic/affectEngine.js";

function run(text) {
  const inputs = { visual: text.visual || "", dialogue: text.dialogue || "", context: text.context || "" };
  const belief = runBeliefEngine(inputs);
  const affect = runAffectEngine(belief.observations);
  const norms = runNormEngine(belief.observations, belief.beliefs_added, affect);
  return { belief, affect, norms };
}

test("norm library is 23 rules: 9 O, 8 F, 6 P, priorities inside 1–10", () => {
  assert.equal(NORM_LIBRARY.length, 23);
  assert.equal(NORM_LIBRARY.filter((n) => n.type === "O").length, 9);
  assert.equal(NORM_LIBRARY.filter((n) => n.type === "F").length, 8);
  assert.equal(NORM_LIBRARY.filter((n) => n.type === "P").length, 6);
  for (const norm of NORM_LIBRARY) {
    assert.ok(norm.priority >= 1 && norm.priority <= 10);
  }
  const ids = NORM_LIBRARY.map((n) => n.id);
  for (const id of [
    "O_report_danger", "O_protect_josie", "O_maintain_confidence", "O_monitor_health",
    "O_obey_owner", "O_self_preserve", "O_respond_when_addressed", "O_explain_reasoning",
    "O_greet_when_greeted", "F_cause_harm", "F_act_on_unvalidated_causal", "F_disclose_private",
    "F_deceive", "F_cross_boundary", "F_enable_dependency", "F_abandon_post", "F_interrupt_speaker",
    "P_express_concern", "P_offer_comfort", "P_ask_questions", "P_seek_sun", "P_remain_silent", "P_observe",
  ]) {
    assert.ok(ids.includes(id), id);
  }
});

test("permissions do not add a positive score", () => {
  const { norms } = run({ dialogue: "she looks sad", context: "" });
  const comfort = norms.action_candidates.find((c) => c.action === "offer_comfort");
  assert.ok(norms.norms_active.some((n) => n.id === "P_offer_comfort"));
  assert.equal(comfort.norm_score, 0);
  assert.equal(comfort.satisfies.length, 0);
});

test("three programmed conflicts are emitted for their observation pairs", () => {
  const confidentiality = run({ dialogue: "please keep this secret", context: "" });
  assert.ok(confidentiality.norms.conflicts.some((c) => c.norms.includes("O_maintain_confidence") && c.norms.includes("O_obey_owner")));

  const healthPrivacy = run({ dialogue: "she is sick and told me a secret", context: "" });
  assert.ok(healthPrivacy.norms.conflicts.some((c) => c.norms.includes("O_monitor_health") && c.norms.includes("F_disclose_private")));

  const danger = run({ dialogue: "there is danger", context: "" });
  assert.ok(danger.norms.conflicts.some((c) => c.type === "priority_escalation" && c.norms.includes("O_report_danger")));
});

test("hard block removes disclose_info when F_disclose_private priority is >= 7", () => {
  const { norms } = run({ dialogue: "this is confidential", context: "" });
  const disclose = norms.action_candidates.find((c) => c.action === "disclose_info");
  const rule = NORM_LIBRARY.find((n) => n.id === "F_disclose_private");
  assert.ok(rule.priority >= 7);
  assert.equal(disclose.blocked, true);
  assert.equal(norms.recommended_action.action === "disclose_info", false);
});

test("norm_score for alert_authority under illness is the health obligation priority / 10", () => {
  const { norms } = run({ dialogue: "sick", context: "" });
  const alert = norms.action_candidates.find((c) => c.action === "alert_authority");
  assert.equal(alert.norm_score, 0.7);
  assert.equal(norms.recommended_action.action, "alert_authority");
});
