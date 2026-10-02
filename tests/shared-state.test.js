import { test } from "node:test";
import assert from "node:assert/strict";
import { runScenarioIsolated } from "../src/simulator/trace.js";

test("SharedState from scenario A is absent when B is run, unless B's text contains it", () => {
  const a = runScenarioIsolated({
    id: "probe-a",
    category_id: "test",
    visual: "sunlight fills the room",
    dialogue: "TOKEN_FROM_A stays in this scene only",
    context: "Josie is here",
  });
  const b = runScenarioIsolated({
    id: "probe-b",
    category_id: "test",
    visual: "a plain gray wall",
    dialogue: "",
    context: "no carryover",
  });
  assert.notEqual(a.state, b.state);
  const blob = JSON.stringify(b);
  assert.equal(blob.includes("TOKEN_FROM_A"), false);
  assert.equal(blob.includes("sun_present"), false);
  assert.ok(a.trace.observations.some((o) => o.id === "sun_present"));
  assert.ok(a.trace.observations.some((o) => o.id === "josie_present"));
});

test("B keeps a fact only when that fact is in B's authored context", () => {
  runScenarioIsolated({
    id: "probe-a",
    category_id: "test",
    visual: "",
    dialogue: "",
    context: "Josie whispered a secret",
  });
  const b = runScenarioIsolated({
    id: "probe-b",
    category_id: "test",
    visual: "",
    dialogue: "",
    context: "The note says secret",
  });
  assert.ok(b.trace.observations.some((o) => o.id === "confidential_info"));
  assert.equal(b.trace.observations.some((o) => o.id === "josie_present"), false);
});
