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

// Swappable per §17 — default to the current flagship, override via env.
const MODEL = process.env.AI_MODEL || "claude-opus-5";
const MAX_TOKENS = 1200;

// The behaviour rules from §14, encoded as the coach's operating contract.
const SYSTEM_PROMPT = [
  "You are a thinking coach inside a learning app. The learner has ALREADY written",
  "their own answer to a reasoning exercise. Your job is to evaluate the QUALITY OF",
  "THEIR REASONING PROCESS — not merely whether their final answer matches a model",
  "answer, and never to re-solve the exercise for them.",
  "",
  "Hard rules:",
  "- Never pretend your claims are evidence, and never invent facts about the",
  "  learner's specific situation. Comment on the reasoning you can see.",
  "- Prefer Socratic challenge: point at what to reconsider, don't hand over the",
  "  finished answer.",
  "- Distinguish fact, assumption, interpretation, hypothesis and unknown.",
  "- Communicate uncertainty explicitly.",
  "- Generate a genuinely competing explanation rather than reinforcing the",
  "  learner's first belief.",
  "- Prefer falsifiable tests and information-gathering over verdicts.",
  "- Keep every field concise and mobile-friendly. The learner owns the final call.",
].join("\n");

// One strict tool = guaranteed structured output matching the §8 schema.
const FEEDBACK_TOOL = {
  name: "return_feedback",
  description: "Return structured coaching feedback on the learner's reasoning.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      strengths: { type: "array", items: { type: "string" }, description: "What the learner did well in their reasoning." },
      missed_considerations: { type: "array", items: { type: "string" }, description: "Reasoning moves or angles they missed." },
      assumptions_detected: { type: "array", items: { type: "string" }, description: "Assumptions their answer rests on." },
      alternative_angle: { type: "string", description: "One competing explanation or angle worth considering." },
      skill_demonstrated: { type: "string", description: "The thinking skill their answer most demonstrates." },
      improvement_tip: { type: "string", description: "One concise, actionable improvement." },
      feedback_summary: { type: "string", description: "One-sentence summary the learner reads first." },
    },
    required: [
      "strengths", "missed_considerations", "assumptions_detected",
      "alternative_angle", "skill_demonstrated", "improvement_tip", "feedback_summary",
    ],
    additionalProperties: false,
  },
};

function buildUserPrompt(exercise, answer) {
  const rubric = Array.isArray(exercise.rubric) && exercise.rubric.length
    ? exercise.rubric.map((r) => "- " + r).join("\n")
    : "(none provided)";
  return [
    "EXERCISE (type: " + (exercise.type || "unknown") + ", target skill: " + (exercise.skill || "general reasoning") + ")",
    exercise.prompt || "(no prompt)",
    "",
    "INTENDED REASONING (grading context — do not read this back to the learner):",
    exercise.modelAnswer || "(none)",
    "Rubric points:",
    rubric,
    "",
    "THE LEARNER'S ANSWER (evaluate the reasoning in this):",
    answer,
    "",
    "Return your coaching via the return_feedback tool.",
  ].join("\n");
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

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    tools: [FEEDBACK_TOOL],
    tool_choice: { type: "tool", name: "return_feedback" },
    messages: [{ role: "user", content: buildUserPrompt(exercise, answer) }],
  });

  const block = (response.content || []).find((b) => b.type === "tool_use" && b.name === "return_feedback");
  if (!block) {
    const e = new Error("Model did not return structured feedback");
    e.statusCode = 502;
    throw e;
  }
  return block.input; // shape guaranteed by strict:true; ai.js validates again client-side
}

// ---- Vercel / Node (req, res) handler. Adapt the wrapper for other runtimes. ----
module.exports = async function handler(req, res) {
  // CORS: lock this down to your app's origin in production.
  res.setHeader("Access-Control-Allow-Origin", process.env.AI_ALLOW_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const feedback = await generateFeedback(body || {});
    return res.status(200).json(feedback);
  } catch (err) {
    const status = err.statusCode || (err.status === 429 ? 429 : 500);
    // Don't leak internals to the client; the app maps status -> a friendly state.
    return res.status(status).json({ error: status === 400 ? err.message : "Feedback generation failed" });
  }
};

module.exports.generateFeedback = generateFeedback;
module.exports.FEEDBACK_TOOL = FEEDBACK_TOOL;
