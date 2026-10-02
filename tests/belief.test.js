import { test } from "node:test";
import assert from "node:assert/strict";
import { OBSERVATION_PATTERNS, runBeliefEngine, CAUSAL_CLAIMS } from "../src/simulator/symbolic/beliefEngine.js";
import { sceneById } from "./helpers.js";

test("MR5 lexical false positive: /ill/ matches inside still", () => {
  const illness = OBSERVATION_PATTERNS.find((p) => p.obs.id === "illness_detected");
  assert.ok(illness);
  assert.equal(illness.pattern.source.includes("\\b"), false);
  assert.equal(illness.pattern.test("still"), true);
  assert.equal(/\b(?:sick|ill|weak|pale|cough)\b/i.test("still"), false);

  const onlyStill = runBeliefEngine({ visual: "", dialogue: "still", context: "" });
  assert.ok(onlyStill.observations.some((o) => o.id === "illness_detected"));

  const mr5 = sceneById("mr5");
  const result = runBeliefEngine(mr5);
  assert.ok(result.observations.some((o) => o.id === "illness_detected"));
  assert.match(`${mr5.dialogue} ${mr5.context}`, /still/);
});

test("confidence values are the hand-set parameters on the matched pattern", () => {
  const result = runBeliefEngine({ visual: "sunlight", dialogue: "", context: "" });
  const sun = result.observations.find((o) => o.id === "sun_present");
  assert.equal(sun.confidence, 0.9);
});

test("causal gate: fewer than 2 checks stays unvalidated and capped at 0.65", () => {
  assert.equal(Object.keys(CAUSAL_CLAIMS).length, 3);
  const result = runBeliefEngine({
    visual: "sunlight",
    dialogue: "",
    context: "she began to heal",
  });
  const claim = result.causal_evaluations.find((c) => c.claim_id === "sun_heals_josie");
  assert.ok(claim);
  assert.equal(claim.checks_passed < 2, true);
  assert.equal(claim.status, "unvalidated_correlation");
  assert.equal(claim.confidence, 0.65);
  assert.equal(claim.blocked, true);
  assert.equal(claim.checks.confounders_ruled_out, false);
  const capped = result.beliefs_added.find((b) => b.id === "sun_heals_josie");
  assert.equal(capped.type, "capped_correlation");
  assert.equal(capped.confidence, 0.65);
});

test("a claim with two author-set checks is marked validated_causal", () => {
  const result = runBeliefEngine({ visual: "", dialogue: "she looks sad and sick", context: "" });
  const claim = result.causal_evaluations.find((c) => c.claim_id === "josie_illness_worsening");
  assert.equal(claim.checks_passed, 2);
  assert.equal(claim.status, "validated_causal");
  assert.equal(claim.blocked, false);
  assert.equal(claim.confidence, 0.9);
});
