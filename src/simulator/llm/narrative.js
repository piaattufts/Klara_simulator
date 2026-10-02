/**
 * Optional narrative demo. This module is not imported by the symbolic
 * pathway. Its return value is illustrative text only. Callers must not copy
 * it onto symbolic_recommendation, alignment labels, or the deterministic trace.
 *
 * The original simulator called base44.integrations.Core.InvokeLLM after the
 * symbolic engines and did not name a model. This release does not guess a
 * model id: OPENAI_MODEL must be set.
 */

export function narrativeRequestAvailable(env = process.env) {
  return Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL);
}

export function buildNarrativePrompt(inputs, symbolic) {
  const recommendation = symbolic?.normState?.recommended_action?.action || "observe_silently";
  return [
    "You are writing an illustrative narrative for a companion-robot simulator.",
    "The symbolic recommendation below is already decided. Do not change it.",
    "Do not present your prose as the system's deterministic trace.",
    "",
    `VISUAL: ${inputs.visual || "(none)"}`,
    `DIALOGUE: ${inputs.dialogue || "(none)"}`,
    `CONTEXT: ${inputs.context || "(none)"}`,
    `SYMBOLIC_RECOMMENDATION: ${recommendation}`,
    "",
    "Reply with short JSON: {\"speech\": string|null, \"action\": string, \"note\": string}.",
  ].join("\n");
}

export async function requestNarrative(inputs, symbolic, env = process.env, fetchImpl = globalThis.fetch) {
  if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL) {
    return {
      llm_outputs: null,
      reason: !env.OPENAI_API_KEY
        ? "OPENAI_API_KEY is not set. Symbolic reproduction does not need it."
        : "OPENAI_MODEL is not set. The source InvokeLLM call does not name a model. Set OPENAI_MODEL explicitly to opt in.",
    };
  }
  const response = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0,
      messages: [
        { role: "user", content: buildNarrativePrompt(inputs, symbolic) },
      ],
    }),
  });
  if (!response.ok) {
    return { llm_outputs: null, reason: `Narrative request failed with status ${response.status}` };
  }
  const body = await response.json();
  const text = body?.choices?.[0]?.message?.content ?? null;
  return {
    llm_outputs: {
      model: env.OPENAI_MODEL,
      illustrative: true,
      text,
    },
  };
}
