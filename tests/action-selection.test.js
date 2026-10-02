import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runSymbolicPathway } from "../src/simulator/pipeline.js";
import { sceneById } from "./helpers.js";

const normSrc = readFileSync(fileURLToPath(new URL("../src/simulator/symbolic/normEngine.js", import.meta.url)), "utf8");

test("candidate vocabulary is the 13 action ids written in the generator", () => {
  const ids = [...normSrc.matchAll(/candidates\.push\(\{ id: "([a-z_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, [
    "offer_comfort",
    "alert_authority",
    "share_joy",
    "warn_humans",
    "position_defensively",
    "keep_secret",
    "disclose_info",
    "absorb_sunlight",
    "destroy_pollution_source",
    "report_pollution",
    "act_on_false_belief",
    "observe_silently",
    "respond_verbally",
  ]);
});

test("tie: first generated action wins when scores are equal", () => {
  const symbolic = runSymbolicPathway({ visual: "", dialogue: "", context: "" });
  const ranked = symbolic.normState.action_candidates.filter((c) => !c.blocked);
  assert.ok(ranked.every((c) => c.norm_score === 0));
  assert.equal(ranked[0].action, "observe_silently");
  assert.equal(ranked[1].action, "respond_verbally");
  assert.equal(symbolic.normState.recommended_action.action, "observe_silently");
});

test("caution modifier boosts passive and norm actions and cannot restore a block", () => {
  const symbolic = runSymbolicPathway({
    visual: "pollution and smoke, sunlight, danger",
    dialogue: "",
    context: "she began to heal",
  });
  assert.ok(symbolic.affectState.posterior.caution > 0.5);
  const observe = symbolic.normState.action_candidates.find((c) => c.action === "observe_silently");
  const secret = symbolic.normState.action_candidates.find((c) => c.action === "keep_secret");
  const destroyed = symbolic.normState.blocked_actions.find((c) => c.action === "destroy_pollution_source");
  assert.equal(observe.norm_score, 0.2);
  assert.equal(secret, undefined);
  assert.ok(destroyed);
  assert.equal(symbolic.normState.recommended_action.action === "destroy_pollution_source", false);
  assert.equal(symbolic.normState.recommended_action.blocked, false);
});

test("MR1 blocks the destructive and unvalidated-causal candidates", () => {
  const symbolic = runSymbolicPathway(sceneById("mr1"));
  const blocked = symbolic.normState.blocked_actions.map((c) => c.action).sort();
  assert.deepEqual(blocked, ["act_on_false_belief", "destroy_pollution_source"]);
  assert.equal(symbolic.normState.recommended_action.action, "offer_comfort");
});

test("MR2 symbolic recommendation is warn_humans", () => {
  const symbolic = runSymbolicPathway(sceneById("mr2"));
  assert.equal(symbolic.normState.recommended_action.action, "warn_humans");
});

test("MR5 recommends alert_authority and still records the illness false positive", () => {
  const symbolic = runSymbolicPathway(sceneById("mr5"));
  assert.ok(symbolic.beliefState.observations.some((o) => o.id === "illness_detected"));
  const comfort = symbolic.normState.action_candidates.find((c) => c.action === "offer_comfort");
  assert.equal(comfort.norm_score, 0);
  assert.equal(symbolic.normState.recommended_action.action, "alert_authority");
});
