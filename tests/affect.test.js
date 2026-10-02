import { test } from "node:test";
import assert from "node:assert/strict";
import { RESTING_STATE, runAffectEngine } from "../src/simulator/symbolic/affectEngine.js";
import { runBeliefEngine } from "../src/simulator/symbolic/beliefEngine.js";

test("every run starts from the same baseline and returns four dimensions", () => {
  const a = runAffectEngine([]);
  const b = runAffectEngine([]);
  assert.deepEqual(a.prior, RESTING_STATE);
  assert.deepEqual(b.prior, RESTING_STATE);
  assert.deepEqual(a.posterior, {
    valence: 0.2,
    arousal: 0.1,
    dominance: -0.1,
    caution: 0.2,
  });
  for (const key of ["valence", "arousal", "dominance", "caution"]) {
    assert.equal(typeof a.posterior[key], "number");
  }
});

test("deltas are summed, dampened, and clipped", () => {
  const belief = runBeliefEngine({
    visual: "angry crowd in the dark, pollution and danger, she is sick and afraid",
    dialogue: "this is a secret",
    context: "",
  });
  const affect = runAffectEngine(belief.observations);
  for (const key of ["valence", "arousal", "dominance"]) {
    assert.ok(affect.posterior[key] >= -1 && affect.posterior[key] <= 1);
  }
  assert.ok(affect.posterior.caution >= 0 && affect.posterior.caution <= 1);
  assert.ok(affect.appraisal_count > 1);
});
