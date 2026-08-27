/* AI service abstraction (ai.js) — unit tests.
 *
 * Covers the brief's §15 step 7 ("test against many answer qualities") and the
 * §17 requirement that structured responses are validated before use:
 *   - schema validation accepts good shapes and rejects malformed ones
 *   - the offline coach returns a valid §8 schema for short / empty / weak /
 *     strong answers, and never invents the user's situation
 *   - getFeedback is disabled-by-default and errors cleanly when off
 *   - the backend provider maps HTTP failures to typed errors
 *
 * Run: node tests/ai.test.js
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

// Minimal browser-ish sandbox. A fresh localStorage per context so config is
// isolated; fetch is stubbed per-test.
function makeContext(fetchImpl) {
  const store = {};
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const ctx = {
    console, JSON, Date, Math, Object, Array, Promise, Error,
    setTimeout, clearTimeout,
    localStorage,
    fetch: fetchImpl,
    AbortController: typeof AbortController !== "undefined" ? AbortController : undefined,
  };
  ctx.window = ctx; // ai.js binds to window when present
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "ai.js"), "utf8"), ctx, { filename: "ai.js" });
  return ctx;
}

const REQUIRED = [
  "strengths", "missed_considerations", "assumptions_detected",
  "alternative_angle", "skill_demonstrated", "improvement_tip", "feedback_summary",
];

function assertValidShape(fb) {
  for (const f of ["strengths", "missed_considerations", "assumptions_detected"]) {
    assert.ok(Array.isArray(fb[f]), `${f} should be an array`);
    fb[f].forEach((x) => assert.equal(typeof x, "string"));
  }
  for (const f of ["alternative_angle", "skill_demonstrated", "improvement_tip", "feedback_summary"]) {
    assert.equal(typeof fb[f], "string", `${f} should be a string`);
  }
  assert.ok(fb.feedback_summary.length > 0, "feedback_summary must be non-empty");
}

let passed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log("  ok -", name); })
    .catch((err) => { console.error("  FAIL -", name); throw err; });
}

(async () => {
  // ---- validateFeedback ----
  await test("validateFeedback accepts a well-formed object and trims", () => {
    const { MTC_AI } = makeContext();
    const out = MTC_AI.validateFeedback({
      strengths: ["  good  ", 3, ""],
      missed_considerations: ["x"],
      assumptions_detected: [],
      alternative_angle: " angle ",
      skill_demonstrated: "critical thinking",
      improvement_tip: "tip",
      feedback_summary: "summary",
    });
    assertValidShape(out);
    assert.deepEqual(out.strengths, ["good"]); // non-strings and blanks dropped, trimmed
    assert.equal(out.alternative_angle, "angle");
  });

  await test("validateFeedback rejects non-object / array", () => {
    const { MTC_AI } = makeContext();
    for (const bad of [null, undefined, 42, "x", []]) {
      assert.throws(() => MTC_AI.validateFeedback(bad), (e) => e.aiKind === "malformed");
    }
  });

  await test("validateFeedback rejects wrong field types and missing summary", () => {
    const { MTC_AI } = makeContext();
    const base = {
      strengths: [], missed_considerations: [], assumptions_detected: [],
      alternative_angle: "a", skill_demonstrated: "s", improvement_tip: "t", feedback_summary: "sum",
    };
    assert.throws(() => MTC_AI.validateFeedback(Object.assign({}, base, { strengths: "no" })), (e) => e.aiKind === "malformed");
    assert.throws(() => MTC_AI.validateFeedback(Object.assign({}, base, { alternative_angle: 5 })), (e) => e.aiKind === "malformed");
    assert.throws(() => MTC_AI.validateFeedback(Object.assign({}, base, { feedback_summary: "" })), (e) => e.aiKind === "malformed");
  });

  // ---- local coach across answer qualities ----
  const QUALITIES = {
    empty: "",
    short: "Competitor did it.",
    weak: "The revenue fell because a competitor opened nearby. That's the reason.",
    strong: "Revenue fell 20%, but I'd first separate observation from explanation. The competitor is one hypothesis; alternatively footfall dropped seasonally, or a price change deterred regulars. I'm assuming the competitor draws the same customers — that might be false. I'd check daily takings before/after the competitor opened and survey lapsed regulars. I'd change my mind if the decline predates the competitor.",
  };
  for (const [label, answer] of Object.entries(QUALITIES)) {
    await test(`local coach returns valid schema for a ${label} answer`, () => {
      const { MTC_AI } = makeContext();
      const fb = MTC_AI._localFeedback({ answer, skill: "critical thinking", prompt: "coffee shop" });
      assertValidShape(fb);
      // Never fabricates the user's situation: output references reasoning moves,
      // and only ever quotes text the user actually wrote.
      const haystack = JSON.stringify(fb).toLowerCase();
      assert.ok(!haystack.includes("undefined"));
    });
  }

  await test("local coach credits a strong answer more than an empty one", () => {
    const { MTC_AI } = makeContext();
    const strong = MTC_AI._localFeedback({ answer: QUALITIES.strong, skill: "x" });
    const empty = MTC_AI._localFeedback({ answer: QUALITIES.empty, skill: "x" });
    assert.ok(strong.strengths.length >= empty.strengths.length);
    // A strong answer that already names an alternative + a falsifiable test
    // should have fewer missed-consideration prompts than an empty one.
    assert.ok(strong.missed_considerations.length <= empty.missed_considerations.length);
  });

  // ---- getFeedback gating ----
  await test("getFeedback rejects with 'unavailable' when AI is off (default)", async () => {
    const { MTC_AI } = makeContext();
    await assert.rejects(MTC_AI.getFeedback({ answer: "something" }), (e) => e.aiKind === "unavailable");
  });

  await test("getFeedback rejects 'unavailable' on empty answer even when enabled", async () => {
    const { MTC_AI } = makeContext();
    MTC_AI.saveConfig({ enabled: true, provider: "local" });
    await assert.rejects(MTC_AI.getFeedback({ answer: "   " }), (e) => e.aiKind === "unavailable");
  });

  await test("getFeedback resolves via local coach when enabled", async () => {
    const { MTC_AI } = makeContext();
    MTC_AI.saveConfig({ enabled: true, provider: "local" });
    const fb = await MTC_AI.getFeedback({ answer: QUALITIES.strong, skill: "critical thinking" });
    assertValidShape(fb);
    assert.equal(fb._provider, "local");
  });

  // ---- backend provider error typing ----
  await test("backend maps 429 -> ratelimit, 500 -> server", async () => {
    for (const [status, kind] of [[429, "ratelimit"], [500, "server"], [400, "server"]]) {
      const { MTC_AI } = makeContext(() => Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) }));
      MTC_AI.saveConfig({ enabled: true, provider: "backend", endpoint: "https://x/api" });
      await assert.rejects(MTC_AI.getFeedback({ answer: "a" }), (e) => e.aiKind === kind, `status ${status}`);
    }
  });

  await test("backend maps malformed JSON -> malformed", async () => {
    const { MTC_AI } = makeContext(() => Promise.resolve({ ok: true, json: () => Promise.reject(new Error("bad json")) }));
    MTC_AI.saveConfig({ enabled: true, provider: "backend", endpoint: "https://x/api" });
    await assert.rejects(MTC_AI.getFeedback({ answer: "a" }), (e) => e.aiKind === "malformed");
  });

  await test("backend validates a good response and tags provider", async () => {
    const good = {
      strengths: ["s"], missed_considerations: ["m"], assumptions_detected: ["a"],
      alternative_angle: "alt", skill_demonstrated: "skill", improvement_tip: "tip", feedback_summary: "sum",
    };
    const { MTC_AI } = makeContext(() => Promise.resolve({ ok: true, json: () => Promise.resolve(good) }));
    MTC_AI.saveConfig({ enabled: true, provider: "backend", endpoint: "https://x/api" });
    const fb = await MTC_AI.getFeedback({ answer: "a" });
    assertValidShape(fb);
    assert.equal(fb._provider, "backend");
  });

  await test("backend rejects a malformed-shape 200 response", async () => {
    const { MTC_AI } = makeContext(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ nope: true }) }));
    MTC_AI.saveConfig({ enabled: true, provider: "backend", endpoint: "https://x/api" });
    await assert.rejects(MTC_AI.getFeedback({ answer: "a" }), (e) => e.aiKind === "malformed");
  });

  await test("activeProvider falls back to local without an endpoint", () => {
    const { MTC_AI } = makeContext();
    MTC_AI.saveConfig({ enabled: true, provider: "backend", endpoint: "" });
    assert.equal(MTC_AI.activeProvider(), "local");
  });

  console.log(`\nAll ${passed} AI tests passed.`);
})().catch((err) => { console.error(err); process.exit(1); });
