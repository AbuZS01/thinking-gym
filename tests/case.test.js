/* Investigation Mode — unit tests.
 *
 * Covers the brief's §11 ("every AI-generated item must be editable, rejectable,
 * and reclassifiable") and §16 flow at the data + AI layer:
 *   - engine Case CRUD: create, add/reclassify/approve/delete items & hypotheses,
 *     conclusion, status, list ordering, and that AI items start UNCONFIRMED
 *   - ai.js case help: schema validation, gating, and the offline heuristic
 *   - api/prompt.js case prompt builder + strict tools
 *
 * Run: node tests/case.test.js
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

/* ---------- engine (loaded in a vm with content deps + fake storage) ---------- */
function loadEngine() {
  const store = {};
  const ctx = {
    console, Date, Math, JSON, Set, Map, Object, Array,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
  };
  vm.createContext(ctx);
  for (const f of ["content.js", "gym-content.js", "everyday-content.js", "walkthroughs.js", "engine.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
  }
  return vm.runInContext("MTC", ctx);
}

/* ---------- ai.js (its own vm context) ---------- */
function loadAi() {
  const store = {};
  const ctx = {
    console, JSON, Date, Math, Object, Array, Promise, Error, setTimeout, clearTimeout,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "ai.js"), "utf8"), ctx, { filename: "ai.js" });
  return ctx.MTC_AI;
}

const PROMPT = require("../api/prompt");

let passed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(() => { passed++; console.log("  ok -", name); })
    .catch((e) => { console.error("  FAIL -", name); throw e; });
}

(async () => {
  // ---------- engine ----------
  await test("createCase seeds an open case with the user's initial assessment", () => {
    const MTC = loadEngine();
    const s = MTC.loadState();
    const c = MTC.createCase(s, { title: "Job?", problem: "Take the offer?", context: "ctx", initialAssessment: "gut says yes" });
    assert.equal(c.status, "open");
    assert.equal(c.initialAssessment, "gut says yes");
    assert.equal(c.items.length, 0);
    assert.equal(MTC.listCases(s).length, 1);
    assert.equal(MTC.getCase(s, c.id).title, "Job?");
  });

  await test("user items are confirmed; AI items start UNCONFIRMED (pending review)", () => {
    const MTC = loadEngine();
    const s = MTC.loadState();
    const c = MTC.createCase(s, { problem: "p", initialAssessment: "a" });
    const mine = MTC.addCaseItem(s, c.id, { type: "fact", text: "salary +20%", source: "user" });
    const ai = MTC.addCaseItem(s, c.id, { type: "assumption", text: "commute is fine", source: "ai" });
    assert.equal(mine.userConfirmed, true);
    assert.equal(ai.userConfirmed, false); // §11: AI items await approval
    assert.equal(ai.source, "ai");
  });

  await test("items are reclassifiable, approvable, editable and deletable (§11)", () => {
    const MTC = loadEngine();
    const s = MTC.loadState();
    const c = MTC.createCase(s, { problem: "p", initialAssessment: "a" });
    const it = MTC.addCaseItem(s, c.id, { type: "claim", text: "x", source: "ai" });
    MTC.updateCaseItem(s, c.id, it.id, { type: "assumption" });   // reclassify
    MTC.updateCaseItem(s, c.id, it.id, { text: "x refined" });    // edit
    MTC.updateCaseItem(s, c.id, it.id, { userConfirmed: true });  // approve
    const got = MTC.getCase(s, c.id).items[0];
    assert.equal(got.type, "assumption");
    assert.equal(got.text, "x refined");
    assert.equal(got.userConfirmed, true);
    assert.equal(MTC.deleteCaseItem(s, c.id, it.id), true);
    assert.equal(MTC.getCase(s, c.id).items.length, 0);
  });

  await test("an invalid classification falls back to 'claim' and can't be set to junk", () => {
    const MTC = loadEngine();
    const s = MTC.loadState();
    const c = MTC.createCase(s, { problem: "p", initialAssessment: "a" });
    const it = MTC.addCaseItem(s, c.id, { type: "nonsense", text: "x", source: "user" });
    assert.equal(it.type, "claim");
    MTC.updateCaseItem(s, c.id, it.id, { type: "also-nonsense" });
    assert.equal(MTC.getCase(s, c.id).items[0].type, "claim"); // unchanged
  });

  await test("hypotheses: add/update/delete, status constrained, AI pending", () => {
    const MTC = loadEngine();
    const s = MTC.loadState();
    const c = MTC.createCase(s, { problem: "p", initialAssessment: "a" });
    const h = MTC.addHypothesis(s, c.id, { text: "it's the commute", source: "ai" });
    assert.equal(h.userConfirmed, false);
    assert.equal(h.status, "open");
    MTC.updateHypothesis(s, c.id, h.id, { status: "refuted", userConfirmed: true, opposing: "evidence" });
    const got = MTC.getCase(s, c.id).hypotheses[0];
    assert.equal(got.status, "refuted");
    assert.equal(got.userConfirmed, true);
    MTC.updateHypothesis(s, c.id, h.id, { status: "bogus" });
    assert.equal(MTC.getCase(s, c.id).hypotheses[0].status, "refuted"); // rejected bad status
    assert.equal(MTC.deleteHypothesis(s, c.id, h.id), true);
  });

  await test("conclusion + confidence + next action persist via updateCaseMeta", () => {
    const MTC = loadEngine();
    const s = MTC.loadState();
    const c = MTC.createCase(s, { problem: "p", initialAssessment: "a" });
    MTC.updateCaseMeta(s, c.id, { conclusion: "take it", confidence: "medium", nextAction: "ask HR", status: "closed" });
    const got = MTC.getCase(s, c.id);
    assert.equal(got.conclusion, "take it");
    assert.equal(got.confidence, "medium");
    assert.equal(got.nextAction, "ask HR");
    assert.equal(got.status, "closed");
  });

  await test("cases survive a save/load round-trip and list newest-first", () => {
    const MTC = loadEngine();
    const s = MTC.loadState();
    const a = MTC.createCase(s, { title: "A", problem: "p", initialAssessment: "x" });
    const b = MTC.createCase(s, { title: "B", problem: "p", initialAssessment: "x" });
    MTC.updateCaseMeta(s, a.id, { conclusion: "touch a" }); // a becomes most-recent
    const reloaded = MTC.loadState();
    assert.equal(reloaded.cases.length, 2);
    assert.equal(MTC.listCases(reloaded)[0].id, a.id);
    assert.equal(MTC.deleteCase(reloaded, b.id), true);
    assert.equal(MTC.loadState().cases.length, 1);
  });

  // ---------- ai.js case help ----------
  await test("local case help returns a valid shape for every kind", () => {
    const MTC_AI = loadAi();
    const ctx = { problem: "Revenue fell 20% because a competitor opened. I'm not sure why.", context: "" };
    for (const kind of ["classify", "hypotheses", "evidence_gaps", "next_test"]) {
      const out = MTC_AI._localCaseHelp(kind, ctx);
      assert.doesNotThrow(() => MTC_AI.validateCaseHelp(kind, out));
    }
  });

  await test("local classify sorts hedged sentences to assumptions, questions to unknowns", () => {
    const MTC_AI = loadAi();
    const out = MTC_AI._localCaseHelp("classify", {
      problem: "Sales dropped 20%. It's probably the competitor. What changed in our pricing?",
      context: "",
    });
    assert.ok(out.assumptions.some((a) => /probably the competitor/i.test(a)), "hedged -> assumption");
    assert.ok(out.unknowns.some((u) => /pricing/i.test(u)), "question -> unknown");
  });

  await test("validateCaseHelp rejects malformed payloads per kind", () => {
    const MTC_AI = loadAi();
    assert.throws(() => MTC_AI.validateCaseHelp("classify", { facts: "no" }), (e) => e.aiKind === "malformed");
    assert.throws(() => MTC_AI.validateCaseHelp("hypotheses", { hypotheses: [{}] }), (e) => e.aiKind === "malformed");
    assert.throws(() => MTC_AI.validateCaseHelp("next_test", { why: "x" }), (e) => e.aiKind === "malformed");
  });

  await test("getCaseHelp is gated: off by default, needs a problem, resolves when enabled", async () => {
    const MTC_AI = loadAi();
    await assert.rejects(MTC_AI.getCaseHelp("classify", { problem: "p" }), (e) => e.aiKind === "unavailable");
    MTC_AI.saveConfig({ enabled: true, provider: "local" });
    await assert.rejects(MTC_AI.getCaseHelp("classify", { problem: "" }), (e) => e.aiKind === "unavailable");
    await assert.rejects(MTC_AI.getCaseHelp("bogus", { problem: "p" }), (e) => e.aiKind === "malformed");
    const out = await MTC_AI.getCaseHelp("hypotheses", { problem: "why is revenue down" });
    assert.ok(Array.isArray(out.hypotheses) && out.hypotheses.length > 0);
  });

  // ---------- api/prompt.js case builder ----------
  await test("case prompt: system prompt carries the investigation rules", () => {
    for (const must of ["Never invent facts", "COMPETING", "DISCONFIRMING", "owns the conclusion"]) {
      assert.ok(PROMPT.CASE_SYSTEM_PROMPT.includes(must), "missing: " + must);
    }
  });

  await test("case tools are strict with locked schemas; unknown kind → null", () => {
    assert.equal(PROMPT.caseTool("bogus"), null);
    for (const kind of ["classify", "hypotheses", "evidence_gaps", "next_test"]) {
      const t = PROMPT.caseTool(kind);
      assert.equal(t.strict, true);
      assert.equal(t.input_schema.additionalProperties, false);
    }
  });

  await test("buildCaseUserPrompt includes problem, initial assessment, and existing board", () => {
    const u = PROMPT.buildCaseUserPrompt("classify", {
      problem: "Take the job?", initialAssessment: "gut says yes",
      items: [{ type: "fact", text: "salary +20%" }], hypotheses: [{ text: "commute is the issue" }],
    });
    assert.ok(u.includes("Take the job?"));
    assert.ok(u.includes("gut says yes"));
    assert.ok(u.includes("salary +20%"));
    assert.ok(u.includes("commute is the issue"));
    assert.ok(u.includes("suggestions only"));
  });

  console.log(`\nAll ${passed} Investigation Mode tests passed.`);
})().catch((err) => { console.error(err); process.exit(1); });
