/* The coach's prompt (api/prompt.js) — unit tests.
 *
 * The system prompt is the product, so its structure is pinned here: the base
 * behaviour rules are always present, the per-exercise-type lens is selected
 * correctly (with a safe fallback), and the user turn embeds the learner's
 * answer, the skill grounding, and the grading context in the right roles.
 *
 * Run: node tests/prompt.test.js
 */
const assert = require("node:assert/strict");
const P = require("../api/prompt");

let passed = 0;
function test(name, fn) { fn(); passed++; console.log("  ok -", name); }

// ---- system prompt ----
test("base system prompt carries the non-negotiable behaviour rules", () => {
  const s = P.buildSystemPrompt("challenge");
  for (const must of [
    "REASONING PROCESS",
    "never to re-solve",
    "Never invent facts",
    "competing explanation",
    "falsifiable",
    "Be specific to THIS answer",
  ]) {
    assert.ok(s.includes(must), `system prompt should mention: ${must}`);
  }
});

test("system prompt selects the lens matching the exercise type", () => {
  assert.ok(P.buildSystemPrompt("bias").includes(P.TYPE_LENSES.bias));
  assert.ok(P.buildSystemPrompt("decision").includes(P.TYPE_LENSES.decision));
  assert.ok(P.buildSystemPrompt("bias").includes("Bias Detection"));
});

test("every known type has its own distinct lens", () => {
  const lenses = Object.values(P.TYPE_LENSES);
  assert.equal(new Set(lenses).size, lenses.length, "lenses should be unique per type");
  // The lens actually changes the prompt across types.
  assert.notEqual(P.buildSystemPrompt("bias"), P.buildSystemPrompt("creativity"));
});

test("unknown/empty type falls back to the default lens, no crash", () => {
  assert.ok(P.buildSystemPrompt("nonsense").includes(P.DEFAULT_LENS));
  assert.ok(P.buildSystemPrompt(undefined).includes(P.DEFAULT_LENS));
});

// ---- user prompt ----
const EX = {
  type: "decision",
  skill: "Decision Theory",
  prompt: "Should the team adopt the new framework?",
  grounding: "Decision Theory: choosing under uncertainty by weighing outcomes. Trap: ignoring base rates.",
  modelAnswer: "Weigh options against explicit criteria and name a falsifiable trigger.",
  rubric: ["Listed real alternatives", "Named a falsifiable trigger"],
};

test("user prompt puts the learner's answer front and centre", () => {
  const u = P.buildUserPrompt(EX, "I'd adopt it because it's cleaner.");
  assert.ok(u.includes("THE LEARNER'S ANSWER"));
  assert.ok(u.includes("I'd adopt it because it's cleaner."));
  assert.ok(u.includes("Be specific to this answer"));
});

test("grounding is included and labelled as the standard, not lectured back", () => {
  const u = P.buildUserPrompt(EX, "answer");
  assert.ok(u.includes("WHAT GOOD REASONING LOOKS LIKE HERE"));
  assert.ok(u.includes("ignoring base rates"));
});

test("grounding header is omitted when there is no grounding", () => {
  const u = P.buildUserPrompt(Object.assign({}, EX, { grounding: "" }), "answer");
  assert.ok(!u.includes("WHAT GOOD REASONING LOOKS LIKE HERE"));
});

test("model answer + rubric are marked as grading context, never for readback", () => {
  const u = P.buildUserPrompt(EX, "answer");
  assert.ok(u.includes("never read this back to the learner"));
  assert.ok(u.includes("- Listed real alternatives"));
  assert.ok(u.includes("Decision Scenario")); // human label, not the raw key
});

// ---- tool contract ----
test("feedback tool locks the §8 schema (strict, all 7 fields, no extras)", () => {
  const t = P.FEEDBACK_TOOL;
  assert.equal(t.strict, true);
  assert.equal(t.input_schema.additionalProperties, false);
  const want = [
    "strengths", "missed_considerations", "assumptions_detected",
    "alternative_angle", "skill_demonstrated", "improvement_tip", "feedback_summary",
  ];
  assert.deepEqual(t.input_schema.required.slice().sort(), want.slice().sort());
  assert.deepEqual(Object.keys(t.input_schema.properties).sort(), want.slice().sort());
});

console.log(`\nAll ${passed} prompt tests passed.`);
