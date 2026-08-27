#!/usr/bin/env node
/* The Thinking Gym — coach tuning harness.
 *
 * Runs a curated set of varied-quality answers (tools/samples.js) through the
 * practice coach and prints the structured feedback per case, so you can read
 * the coach side by side across answer qualities and tune the system prompt in
 * api/prompt.js. Every response is validated against the §8 schema; failures are
 * flagged loudly.
 *
 * This is the prompt-tuning loop the brief (§15 step 7) asks for: test the
 * feature against short, incorrect, unusual and high-quality responses.
 *
 * Modes (pick one):
 *   --heuristic            Offline, no key. Runs the app's on-device heuristic
 *                          coach (ai.js). Good for checking plumbing + schema,
 *                          NOT prompt quality (the heuristic has no system prompt).
 *   --endpoint <url>       POST to your deployed server function (api/feedback.js).
 *                          This is the real tuning path once deployed.
 *   --model                Call the model directly via api/feedback.js. Needs
 *                          ANTHROPIC_API_KEY and `npm i @anthropic-ai/sdk`.
 *
 * Options:
 *   --type <t>             Only run samples of this exercise type (warmup, bias…).
 *   --show-prompt          Also print the exact system + user prompt sent.
 *   --json                 Emit machine-readable JSON instead of the report.
 *
 * Examples:
 *   node tools/coach-harness.js --heuristic
 *   node tools/coach-harness.js --endpoint https://your-app/api/feedback --show-prompt
 *   ANTHROPIC_API_KEY=sk-... node tools/coach-harness.js --model --type bias
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const SAMPLES = require("./samples");
const PROMPT = require("../api/prompt");

/* ---------- args ---------- */
function parseArgs(argv) {
  const a = { mode: null, endpoint: "", type: "", showPrompt: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--heuristic") a.mode = "heuristic";
    else if (t === "--model") a.mode = "model";
    else if (t === "--endpoint") { a.mode = "endpoint"; a.endpoint = argv[++i] || ""; }
    else if (t === "--type") a.type = argv[++i] || "";
    else if (t === "--show-prompt") a.showPrompt = true;
    else if (t === "--json") a.json = true;
    else if (t === "-h" || t === "--help") a.help = true;
  }
  if (!a.mode) a.mode = "heuristic"; // safe offline default
  return a;
}

/* ---------- the app's validator + heuristic, loaded from ai.js ---------- */
function loadAiModule() {
  const store = {};
  const ctx = {
    console, JSON, Date, Math, Object, Array, Promise, Error,
    setTimeout, clearTimeout,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "ai.js"), "utf8"), ctx, { filename: "ai.js" });
  return ctx.MTC_AI;
}

const MTC_AI = loadAiModule();

/* ---------- per-mode callers ---------- */
async function callHeuristic(exercise, answer) {
  return MTC_AI._localFeedback({ answer, skill: exercise.skill, prompt: exercise.prompt });
}

async function callEndpoint(endpoint, exercise, answer) {
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exercise, answer }),
  });
  if (!resp.ok) throw new Error("HTTP " + resp.status + " from endpoint");
  const data = await resp.json();
  return data && data.feedback ? data.feedback : data;
}

let generateFeedback = null;
async function callModel(exercise, answer) {
  if (!generateFeedback) {
    try {
      generateFeedback = require("../api/feedback").generateFeedback;
    } catch (e) {
      throw new Error("--model needs `npm i @anthropic-ai/sdk` (and ANTHROPIC_API_KEY): " + e.message);
    }
  }
  return generateFeedback({ exercise, answer });
}

async function runOne(mode, endpoint, exercise, answer) {
  if (mode === "endpoint") return callEndpoint(endpoint, exercise, answer);
  if (mode === "model") return callModel(exercise, answer);
  return callHeuristic(exercise, answer);
}

/* ---------- formatting ---------- */
const BAR = "─".repeat(72);
function block(label, body) { return "  " + label + "\n" + body.split("\n").map((l) => "    " + l).join("\n"); }
function bullets(arr) { return arr && arr.length ? arr.map((x) => "• " + x).join("\n") : "(none)"; }

function printFeedback(fb) {
  const lines = [];
  lines.push(block("summary", fb.feedback_summary || "(missing)"));
  lines.push(block("strengths", bullets(fb.strengths)));
  lines.push(block("missed_considerations", bullets(fb.missed_considerations)));
  lines.push(block("assumptions_detected", bullets(fb.assumptions_detected)));
  lines.push(block("alternative_angle", fb.alternative_angle || "(none)"));
  lines.push(block("skill_demonstrated", fb.skill_demonstrated || "(none)"));
  lines.push(block("improvement_tip", fb.improvement_tip || "(none)"));
  return lines.join("\n");
}

/* ---------- main ---------- */
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace(/^\/\*|^ \* ?/gm, "")); return; }

  let cases = SAMPLES;
  if (args.type) cases = cases.filter((c) => c.exercise.type === args.type);
  if (cases.length === 0) { console.error("No samples for type: " + args.type); process.exit(1); }

  const results = [];
  const summary = { total: 0, ok: 0, invalid: 0, errors: 0 };

  for (const c of cases) {
    for (const ans of c.answers) {
      summary.total++;
      const rec = { sample: c.id, type: c.exercise.type, quality: ans.quality, ok: false };
      try {
        const raw = await runOne(args.mode, args.endpoint, c.exercise, ans.text);
        // Validate against the §8 schema exactly as the app does.
        rec.feedback = MTC_AI.validateFeedback(raw);
        rec.ok = true;
        summary.ok++;
      } catch (err) {
        if (err && err.aiKind === "malformed") summary.invalid++; else summary.errors++;
        rec.error = (err && err.message) || String(err);
      }
      results.push(rec);
    }
  }

  if (args.json) {
    console.log(JSON.stringify({ mode: args.mode, summary, results }, null, 2));
    return;
  }

  // Human report.
  console.log(BAR);
  console.log("COACH HARNESS — mode: " + args.mode + (args.endpoint ? " (" + args.endpoint + ")" : ""));
  if (args.mode === "heuristic") console.log("NOTE: the offline heuristic has NO system prompt — this checks plumbing + schema, not prompt quality.");
  console.log(BAR);

  let lastSample = null;
  for (const c of cases) {
    for (const ans of c.answers) {
      const rec = results.find((r) => r.sample === c.id && r.quality === ans.quality);
      if (lastSample !== c.id) {
        lastSample = c.id;
        console.log("\n" + BAR);
        console.log("EXERCISE: " + c.id + "  [" + c.exercise.type + " · " + c.exercise.skill + "]");
        console.log("  " + c.exercise.prompt);
        if (args.showPrompt) {
          console.log("\n  --- SYSTEM PROMPT ---\n" + PROMPT.buildSystemPrompt(c.exercise.type).split("\n").map((l) => "  " + l).join("\n"));
        }
        console.log(BAR);
      }
      console.log("\n▶ answer quality: " + ans.quality.toUpperCase());
      console.log(block("learner answer", ans.text ? ans.text : "(empty)"));
      if (args.showPrompt && args.mode !== "heuristic") {
        console.log(block("user prompt", PROMPT.buildUserPrompt(c.exercise, ans.text)));
      }
      if (rec.ok) console.log(printFeedback(rec.feedback));
      else console.log(block("ERROR", rec.error));
    }
  }

  console.log("\n" + BAR);
  console.log(
    "RESULT: " + summary.ok + "/" + summary.total + " valid" +
    (summary.invalid ? "  ·  " + summary.invalid + " schema-invalid" : "") +
    (summary.errors ? "  ·  " + summary.errors + " errors" : "")
  );
  console.log(BAR);
  if (summary.invalid || summary.errors) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
