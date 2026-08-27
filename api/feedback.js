/* The Thinking Gym — PRACTISE feedback endpoint (reference server function).
 *
 * WHY THIS FILE EXISTS
 * The app itself is a static, offline PWA. The brief (§17) requires that model
 * API keys and privileged calls stay OFF the client, behind a secure server
 * function. This is that function: a provider-abstracted, framework-agnostic
 * Node handler you deploy alongside static hosting (Vercel, Netlify Functions,
 * Cloudflare, a tiny Express app — anything that gives you `req`/`res`).
 *
 * It is intentionally NOT loaded by index.html. Point the app at it by setting
 * the endpoint URL in Profile → AI Coaching once it's deployed. Until then the
 * app's offline "local coach" covers the same UI with no network at all.
 *
 * Contract (matches ai.js backendFeedback):
 *   POST { exercise: { prompt, type, skill, modelAnswer, rubric }, answer }
 *   200  -> the §8 feedback schema as JSON
 *
 * Setup: see api/README.md and .env.example. Requires ANTHROPIC_API_KEY.
 */

"use strict";

const Anthropic = require("@anthropic-ai/sdk");
const {
  buildSystemPrompt, buildUserPrompt, FEEDBACK_TOOL,
  CASE_SYSTEM_PROMPT, caseTool, buildCaseUserPrompt,
} = require("./prompt");

// Swappable per §17 — default to the current flagship, override via env.
const MODEL = process.env.AI_MODEL || "claude-opus-5";
const MAX_TOKENS = 1200;

// One strict-tool model call → guaranteed structured output. Shared by both the
// exercise coach and the Investigation Mode Case Board.
async function callTool(client, system, userPrompt, tool) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [{ role: "user", content: userPrompt }],
  });
  const block = (response.content || []).find((b) => b.type === "tool_use" && b.name === tool.name);
  if (!block) {
    const e = new Error("Model did not return structured output");
    e.statusCode = 502;
    throw e;
  }
  return block.input; // strict:true guarantees shape; the client validates again
}

// Investigation Mode: one of four Case Board helpers (§10, §16).
async function generateCaseHelp(body) {
  const kind = body && body.kind;
  const tool = caseTool(kind);
  if (!tool) {
    const e = new Error("Unknown case-help kind");
    e.statusCode = 400;
    throw e;
  }
  const c = (body && body.case) || {};
  if (!String(c.problem || "").trim()) {
    const e = new Error("Missing case problem");
    e.statusCode = 400;
    throw e;
  }
  const client = new Anthropic();
  return callTool(client, CASE_SYSTEM_PROMPT, buildCaseUserPrompt(kind, c), tool);
}

// Framework-agnostic core: takes the parsed body, returns the feedback object or
// throws. Wrap it for whatever runtime you deploy on (Vercel/Express handler at
// the bottom of this file, or import `generateFeedback` yourself).
async function generateFeedback(body) {
  const exercise = (body && body.exercise) || {};
  const answer = String((body && body.answer) || "").trim();
  if (!answer) {
    const e = new Error("Missing 'answer'");
    e.statusCode = 400;
    throw e;
  }

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env — never the client
  return callTool(client, buildSystemPrompt(exercise.type), buildUserPrompt(exercise, answer), FEEDBACK_TOOL);
}

// ---- Vercel / Node (req, res) handler. Adapt the wrapper for other runtimes. ----
// Dispatches on body.task: "case" → Case Board help, anything else → exercise
// feedback. One endpoint URL keeps the app's AI config simple.
module.exports = async function handler(req, res) {
  // CORS: lock this down to your app's origin in production.
  res.setHeader("Access-Control-Allow-Origin", process.env.AI_ALLOW_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = (body && body.task === "case")
      ? await generateCaseHelp(body || {})
      : await generateFeedback(body || {});
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || (err.status === 429 ? 429 : 500);
    // Don't leak internals to the client; the app maps status -> a friendly state.
    return res.status(status).json({ error: status === 400 ? err.message : "AI request failed" });
  }
};

module.exports.generateFeedback = generateFeedback;
module.exports.generateCaseHelp = generateCaseHelp;
module.exports.FEEDBACK_TOOL = FEEDBACK_TOOL;
