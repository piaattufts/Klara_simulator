import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { requestNarrative } from "./src/simulator/llm/narrative.js";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function optionalNarrativeApi() {
  return {
    name: "optional-narrative-api",
    configureServer(server) {
      server.middlewares.use("/api/narrative", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        try {
          const inputs = JSON.parse((await readBody(req)) || "{}");
          const symbolic = inputs.symbolic;
          const result = await requestNarrative(
            {
              visual: inputs.visual || "",
              dialogue: inputs.dialogue || "",
              context: inputs.context || "",
            },
            symbolic,
          );
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(result));
        } catch (error) {
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ llm_outputs: null, reason: "Narrative request could not be completed." }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), optionalNarrativeApi()],
  server: {
    host: "0.0.0.0",
    port: 47231,
    strictPort: true,
  },
});
