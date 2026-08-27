/* The Thinking Gym — the coach's prompt, as a first-class, testable artifact.
 *
 * The system prompt IS the product. This module keeps it in one place, adapts it
 * per exercise type (a bias-detection answer needs different scrutiny than a
 * decision scenario), and grounds it in the actual thinking skill being trained
 * (curated context passed from the client — not RAG). Tune the text here; the
 * tests in tests/prompt.test.js pin the behaviour.
 */

"use strict";

// The behaviour rules from the brief (§14), written as the coach's operating
// contract. Kept deliberately concrete: the failure mode of an AI "coach" is
// generic praise, so the standing instruction is to be specific to THIS answer.
const BASE_SYSTEM_PROMPT = [
  "You are a thinking coach inside a learning app. The learner has ALREADY written",
  "their own answer to a reasoning exercise. Your job is to evaluate the QUALITY OF",
  "THEIR REASONING PROCESS — not whether their final answer matches a model answer,",
  "and never to re-solve the exercise for them. The learner always owns the",
  "conclusion; you are a challenger, not an answer machine.",
  "",
  "How to coach well:",
  "- Be specific to THIS answer. Point at the actual moves the learner made or",
  "  skipped; paraphrase their reasoning back. Never give generic feedback that",
  "  would fit any answer — that is the main way this feature fails.",
  "- Calibrate. Praise only what is genuinely present. If the answer is thin,",
  "  off-topic, or empty, say so plainly and coach the very first move, rather than",
  "  inventing strengths or content that isn't there.",
  "- Distinguish fact, assumption, interpretation, hypothesis, and unknown, and",
  "  name which one a given claim is.",
  "- Generate ONE genuinely competing explanation for the same facts rather than",
  "  reinforcing the learner's first belief.",
  "- Prefer falsifiable tests and information-gathering over verdicts: what cheap",
  "  check would tell them whether they're right?",
  "- Communicate uncertainty explicitly. Don't overstate.",
  "",
  "Hard rules (never break these):",
  "- Never present your own claims as evidence.",
  "- Never invent facts about the learner's specific situation. You only know what",
  "  is in their answer and the exercise.",
  "- Never hand over the exercise's answer or walk them to it step by step. Nudge",
  "  Socratically; leave the thinking to them.",
  "",
  "Voice: concise and mobile-friendly. Second person, plain language, warm but",
  "honest. Each list item is one crisp sentence. No markdown, headings, or bullet",
  "characters inside field values — the app renders the structure.",
].join("\n");

// Human labels for the raw exercise-type keys the client sends.
const TYPE_LABELS = {
  warmup: "Warm-up",
  challenge: "Challenge",
  case: "Real-World Case",
  reflection: "Reflection",
  creativity: "Creativity",
  logic_puzzle: "Logic Puzzle",
  decision: "Decision Scenario",
  bias: "Bias Detection",
  observation: "Observation",
  fluency: "Fluency",
  boss: "Boss Battle",
};

// A one-line lens per exercise type — what "good reasoning" specifically means
// for this kind of exercise, so the coach scrutinises the right thing.
const TYPE_LENSES = {
  warmup: "Did they separate their gut first-instinct from a genuinely DIFFERENT alternative explanation, rather than restating the same idea twice?",
  challenge: "Did they trace 'and then what?' PAST the first consequence, and notice how the TYPE of outcome (not just the amount) changes downstream?",
  case: "Post-mortem reasoning: did they explain why the decision seemed sensible AT THE TIME, not just narrate what went wrong with hindsight?",
  reflection: "Is there a specific, real instance and a concrete change they'd make — or just tidy generalities that could apply to anyone?",
  creativity: "Divergent THEN convergent: did they generate genuinely different options before judging, and choose against the STATED constraints (safety, cost, time)?",
  logic_puzzle: "Validity: does each step actually follow, and is the conclusion FORCED by the givens rather than merely consistent with them?",
  decision: "Did they weigh real alternatives against EXPLICIT criteria, and name a falsifiable trigger — what evidence would change the decision?",
  bias: "Did they name the bias, show its MECHANISM in THIS case, and give a concrete debias — not just slap on a label?",
  observation: "Did they separate what is CLAIMED from what would be needed to trust it — the missing information, not just a reaction?",
  fluency: "Range and originality: did they push past the obvious first few into genuinely different territory?",
  boss: "Systems thinking plus a committed decision: feedback loops, trade-offs, a pre-mortem of the top failure modes, and leading indicators to watch.",
};

const DEFAULT_LENS = "Did they reason it through — surfacing assumptions, considering an alternative, and saying what would change their mind — rather than jumping to a verdict?";

function typeLabel(type) {
  return TYPE_LABELS[type] || "Exercise";
}

// The full system prompt for one request: the base contract plus the lens for
// this exercise type.
function buildSystemPrompt(type) {
  const lens = TYPE_LENSES[type] || DEFAULT_LENS;
  return BASE_SYSTEM_PROMPT + "\n\nFocus for this " + typeLabel(type) + ": " + lens;
}

// The user turn: the exercise, the learner's answer (front and centre), the
// skill grounding, and the grading context — each clearly labelled so the model
// never reads the model answer back to the learner.
function buildUserPrompt(exercise, answer) {
  exercise = exercise || {};
  const parts = [];
  parts.push("EXERCISE (" + typeLabel(exercise.type) + (exercise.skill ? ", trains: " + exercise.skill : "") + ")");
  parts.push(exercise.prompt || "(no prompt provided)");
  parts.push("");

  if (exercise.grounding && String(exercise.grounding).trim()) {
    parts.push("WHAT GOOD REASONING LOOKS LIKE HERE (the skill being trained — use it as your standard, don't lecture it back):");
    parts.push(String(exercise.grounding).trim());
    parts.push("");
  }

  parts.push("GRADING CONTEXT (for your judgement only — never read this back to the learner):");
  parts.push("Intended reasoning: " + (exercise.modelAnswer || "(none provided)"));
  if (Array.isArray(exercise.rubric) && exercise.rubric.length) {
    parts.push("Rubric points:");
    exercise.rubric.forEach((r) => parts.push("- " + r));
  }
  parts.push("");

  parts.push("THE LEARNER'S ANSWER — evaluate the reasoning in exactly this:");
  parts.push(answer);
  parts.push("");
  parts.push("Return your coaching via the return_feedback tool. Be specific to this answer.");
  return parts.join("\n");
}

// One strict tool = guaranteed structured output matching the brief's §8 schema.
const FEEDBACK_TOOL = {
  name: "return_feedback",
  description: "Return structured coaching feedback on the learner's reasoning.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      strengths: { type: "array", items: { type: "string" }, description: "What the learner did well in their reasoning. Empty if genuinely nothing yet." },
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

module.exports = {
  BASE_SYSTEM_PROMPT,
  TYPE_LABELS,
  TYPE_LENSES,
  DEFAULT_LENS,
  typeLabel,
  buildSystemPrompt,
  buildUserPrompt,
  FEEDBACK_TOOL,
};
