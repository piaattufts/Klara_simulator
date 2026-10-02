import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSymbolicPathway } from "../src/simulator/pipeline.js";
import { reproduceAll } from "../scripts/lib/run-all.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("symbolic modules do not reference an API key or fetch", () => {
  for (const rel of [
    "src/simulator/symbolic/beliefEngine.js",
    "src/simulator/symbolic/affectEngine.js",
    "src/simulator/symbolic/normEngine.js",
    "src/simulator/pipeline.js",
    "src/simulator/trace.js",
    "scripts/reproduce.mjs",
    "scripts/lib/run-all.mjs",
  ]) {
    const text = readFileSync(path.join(root, rel), "utf8");
    assert.equal(text.includes("OPENAI_API_KEY"), false, rel);
    assert.equal(text.includes("fetch("), false, rel);
    assert.equal(text.includes("base44"), false, rel);
  }
});

test("reproduceAll ignores a set OPENAI_API_KEY and leaves llm_outputs null", () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-should-not-be-read";
  let called = false;
  const original = globalThis.fetch;
  globalThis.fetch = () => {
    called = true;
    throw new Error("symbolic reproduction must not fetch");
  };
  try {
    const { traces } = reproduceAll();
    assert.equal(called, false);
    assert.equal(traces.every((t) => t.llm_outputs === null), true);
    const symbolic = runSymbolicPathway({ visual: "sunlight", dialogue: "", context: "" });
    assert.equal(symbolic.normState.recommended_action.action, "absorb_sunlight");
  } finally {
    globalThis.fetch = original;
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});

test("reproduce script exits 0 without OPENAI_API_KEY", () => {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  delete env.OPENAI_MODEL;
  const result = spawnSync(process.execPath, [path.join(root, "scripts", "reproduce.mjs")], {
    cwd: root,
    env,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /6 aligned, 17 partially, 2 misaligned/);
});
