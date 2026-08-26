/* The Thinking Gym — AI service abstraction (PRACTISE-layer reasoning coach).
 *
 * Design goals, straight from the brief:
 *  - AI is OPTIONAL and OFF by default; the offline learning app must work
 *    unchanged without it (§17, §21).
 *  - The user reasons first; this only ever runs AFTER a written answer (§3).
 *  - Provider-agnostic: swap models/providers without touching the UI (§17).
 *  - Model keys never touch the client — the browser talks to a server function
 *    the operator configures; the key lives there (§17).
 *  - Every response is validated against the §8 schema before the UI trusts it.
 *  - AI output is never presented as evidence, and the user can reject it (§14).
 *
 * Two providers ship here:
 *  - "local"  : an offline heuristic coach. It comments on the SHAPE of the
 *               user's reasoning (as the app's existing vague-answer nudge does)
 *               and is honestly labelled a heuristic, never a language model. It
 *               also doubles as the brief's "mocked AI responses" for dev.
 *  - "backend": POSTs a minimal payload to a configured endpoint (see
 *               api/feedback.js) that performs the real model call server-side.
 *
 * AI settings live in their OWN localStorage key, deliberately separate from the
 * exported progress state, so enabling AI never changes the progress schema.
 */
(function (global) {
  "use strict";

  var CONFIG_KEY = "mtc_ai_config_v1";
  var DEFAULT_TIMEOUT_MS = 20000;

  /* ---------------- Config ---------------- */

  function defaultConfig() {
    return { enabled: false, provider: "local", endpoint: "" };
  }

  function loadConfig() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(CONFIG_KEY);
      if (!raw) return defaultConfig();
      return Object.assign(defaultConfig(), JSON.parse(raw));
    } catch (e) {
      return defaultConfig();
    }
  }

  function saveConfig(patch) {
    var cfg = Object.assign(loadConfig(), patch || {});
    try {
      global.localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    } catch (e) {
      /* storage unavailable (private mode) — config just won't persist */
    }
    return cfg;
  }

  // Which provider a call will actually use, given the config. Falls back to the
  // offline coach unless a backend endpoint is genuinely configured.
  function activeProvider(cfg) {
    cfg = cfg || loadConfig();
    if (cfg.provider === "backend" && cfg.endpoint && cfg.endpoint.trim()) return "backend";
    return "local";
  }

  // Is the feature switched on at all? (The UI hides the coach entirely when not.)
  function isEnabled(cfg) {
    cfg = cfg || loadConfig();
    return !!cfg.enabled;
  }

  /* ---------------- Errors ---------------- */

  // Typed errors so the UI can show the right state (retry vs. configure vs. off).
  function aiError(kind, message) {
    var e = new Error(message || kind);
    e.aiKind = kind; // unavailable | timeout | network | ratelimit | malformed | server
    return e;
  }

  function messageForKind(kind) {
    switch (kind) {
      case "unavailable": return "AI coaching is turned off. Turn it on in Profile → Settings.";
      case "timeout": return "The coach took too long to respond. Check your connection and try again.";
      case "network": return "Couldn't reach the coach. Check your connection and try again.";
      case "ratelimit": return "The coach is busy right now. Give it a moment and try again.";
      case "malformed": return "The coach sent back something we couldn't read. Try again.";
      case "server": return "The coaching service hit an error. Try again shortly.";
      default: return "Something went wrong getting feedback. Try again.";
    }
  }

  /* ---------------- Schema (§8) validation ---------------- */

  var ARRAY_FIELDS = ["strengths", "missed_considerations", "assumptions_detected"];
  var STRING_FIELDS = ["alternative_angle", "skill_demonstrated", "improvement_tip", "feedback_summary"];

  // Coerce+validate an arbitrary object into the §8 feedback schema. Throws a
  // typed "malformed" error on anything we can't trust. Never let unvalidated
  // model output into app state (§17).
  function validateFeedback(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      throw aiError("malformed", "Feedback was not an object");
    }
    var out = {};
    for (var i = 0; i < ARRAY_FIELDS.length; i++) {
      var f = ARRAY_FIELDS[i];
      var v = obj[f];
      if (!Array.isArray(v)) throw aiError("malformed", "Field '" + f + "' must be an array");
      out[f] = v
        .filter(function (x) { return typeof x === "string" && x.trim(); })
        .map(function (x) { return String(x).trim(); })
        .slice(0, 6);
    }
    for (var j = 0; j < STRING_FIELDS.length; j++) {
      var g = STRING_FIELDS[j];
      var s = obj[g];
      if (typeof s !== "string") throw aiError("malformed", "Field '" + g + "' must be a string");
      out[g] = s.trim();
    }
    if (!out.feedback_summary) throw aiError("malformed", "Missing feedback_summary");
    return out;
  }

  /* ---------------- Local heuristic coach ---------------- */

  // Reasoning-shape tells. These read the STRUCTURE of an answer, not its
  // correctness — the same honest move the app already makes with its
  // vague-answer nudge. They never invent facts about the user's situation (§14).
  var TELLS = {
    alternative: /\b(alternativ|another (explanation|reason|possibilit|cause)|other explanation|on the other hand|could also be|might instead|rather than|competing|counter[- ]?argument|devil'?s advocate)\b/i,
    changeMind: /\b(change my mind|would (change|update|revise)|falsif|disconfirm|evidence (against|that would)|test (this|whether|if)|prove me wrong|rule out|disprove)\b/i,
    secondOrder: /\b(second[- ]order|knock[- ]on|downstream|in turn|which (then|would|could) (cause|lead|mean)|ripple|longer[- ]term|over time|later on)\b/i,
    assumption: /\b(assum|takes? for granted|presum|implicit|taken as given|hidden premise|relies on|depends on the idea)\b/i,
    unknowns: /\b(don'?t know|not sure|unknown|unclear|need to (know|check|find out|ask)|it depends|more (information|data|context)|missing|what if)\b/i,
    quantifies: /\d/,
    uncertainty: /\b(might|could|possibly|perhaps|probably|likely|seems|appears|tend to|roughly|approximately|uncertain|not certain)\b/i,
    causalMechanism: /\bbecause\b|\bso that\b|\bleads? to\b|\bcauses?\b|\bdue to\b|\bresults? in\b|\bdrives?\b/i,
  };

  var VAGUE_RE = /(turned out bad|went wrong|didn'?t work( out)?|it was bad|wasn'?t great|people were (unhappy|upset|angry)|bad fit|too much pressure|not good enough|poor performance|things went south|fell apart)/i;

  function words(text) {
    return (text || "").trim().split(/\s+/).filter(Boolean);
  }

  // Deterministic offline coach. Same shape as the model's structured output so
  // the UI treats both identically.
  function localFeedback(ctx) {
    ctx = ctx || {};
    var answer = String(ctx.answer || "");
    var skill = ctx.skill || "structured reasoning";

    var has = {};
    Object.keys(TELLS).forEach(function (k) { has[k] = TELLS[k].test(answer); });
    var wc = words(answer).length;
    var vague = VAGUE_RE.exec(answer);

    var strengths = [];
    if (has.alternative) strengths.push("You reached for at least one alternative explanation instead of settling on the first story.");
    if (has.changeMind) strengths.push("You named what would change your mind — that keeps the conclusion falsifiable.");
    if (has.assumption) strengths.push("You surfaced an assumption rather than leaving it hidden.");
    if (has.secondOrder) strengths.push("You followed the effect past its first step to what it causes next.");
    if (has.causalMechanism && !vague) strengths.push("You explained a mechanism (why/how), not just the outcome.");
    if (has.uncertainty) strengths.push("You signalled uncertainty rather than overstating a single answer.");
    if (wc >= 60) strengths.push("You gave the problem enough room to actually work it through.");
    if (strengths.length === 0) strengths.push("You committed to a written answer before revealing the model answer — active recall is the hard part most people skip.");

    var missed = [];
    if (!has.alternative) missed.push("A competing explanation for the same facts — what else could account for this?");
    if (!has.changeMind) missed.push("A falsifiable test: what specific evidence would change your conclusion?");
    if (!has.assumption) missed.push("The assumptions your answer rests on — name one and check whether it actually holds.");
    if (!has.secondOrder) missed.push("The second-order effect — once your first effect happens, what does IT cause?");
    if (!has.unknowns && !has.quantifies) missed.push("What you'd need to find out (or a rough number) before acting on this.");

    var assumptions = [];
    if (has.assumption) assumptions.push("You flagged an assumption explicitly — worth stating whether the answer survives if it's false.");
    else assumptions.push("No assumption was made explicit. Every answer has at least one — try to name the load-bearing one.");
    if (vague) assumptions.push('"' + vague[0] + '" states a result, not a mechanism — it hides an assumption about how it happened.');

    var alternative = has.alternative
      ? "You offered an alternative — push once more: which single piece of evidence would tell the two explanations apart?"
      : "Try generating one genuinely competing explanation and asking what evidence would separate it from your first one.";

    var tip;
    if (vague) tip = 'Replace "' + vague[0] + '" with who did what, and why that produced the result.';
    else if (!has.changeMind) tip = "End every answer with one line: 'I'd change my mind if ___.' It's the fastest way to sharpen reasoning.";
    else if (!has.alternative) tip = "Before committing, write one rival explanation — even a weak one — and say why you rejected it.";
    else if (!has.secondOrder) tip = "Ask 'and then what?' once more than feels necessary; the important effect is often one step further out.";
    else tip = "Strong structure. Next level: attach a rough probability or confidence to your conclusion.";

    var summary = wc < 25
      ? "A short answer to build on — the moves below are where the thinking gets deeper."
      : (strengths.length >= 3
        ? "Solid reasoning shape. Tighten it with a competing explanation and a falsifiable test."
        : "A reasonable start — the missed considerations below are the biggest levers.");

    return validateFeedback({
      strengths: strengths.slice(0, 4),
      missed_considerations: missed.slice(0, 4),
      assumptions_detected: assumptions.slice(0, 3),
      alternative_angle: alternative,
      skill_demonstrated: skill,
      improvement_tip: tip,
      feedback_summary: summary,
      _provider: "local", // stripped by validate; re-attached by getFeedback
    });
  }

  /* ---------------- Backend provider ---------------- */

  // POST a MINIMAL payload (§17) to the operator's endpoint. Never sends the
  // player's identity, journal, or progress — only what's needed to coach this
  // one answer.
  function backendFeedback(ctx, cfg) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, DEFAULT_TIMEOUT_MS) : null;

    var payload = {
      exercise: {
        prompt: ctx.prompt || "",
        type: ctx.type || "",
        skill: ctx.skill || "",
        // Model answer + rubric are grading context, not the user's data. Sent so
        // the coach can judge against the intended reasoning, not invent its own.
        modelAnswer: ctx.modelAnswer || "",
        rubric: Array.isArray(ctx.rubric) ? ctx.rubric : [],
      },
      answer: ctx.answer || "",
    };

    return fetch(cfg.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
    })
      .then(function (resp) {
        if (!resp.ok) {
          if (resp.status === 429) throw aiError("ratelimit", "Rate limited (429)");
          if (resp.status >= 500) throw aiError("server", "Server error (" + resp.status + ")");
          throw aiError("server", "Request failed (" + resp.status + ")");
        }
        return resp.json().catch(function () { throw aiError("malformed", "Response was not JSON"); });
      })
      .then(function (data) {
        // Accept either the bare schema object or { feedback: {...} }.
        var obj = data && data.feedback ? data.feedback : data;
        var validated = validateFeedback(obj);
        validated._provider = "backend";
        return validated;
      })
      .catch(function (err) {
        if (err && err.aiKind) throw err;
        if (err && err.name === "AbortError") throw aiError("timeout", "Request timed out");
        throw aiError("network", (err && err.message) || "Network error");
      })
      .then(function (v) {
        if (timer) clearTimeout(timer);
        return v;
      }, function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
  }

  /* ---------------- Public entry point ---------------- */

  // Returns a Promise resolving to validated §8 feedback (with a `_provider`
  // tag), or rejecting with a typed error. Always async-shaped so the UI's
  // loading/error states are identical for both providers.
  function getFeedback(ctx) {
    var cfg = loadConfig();
    if (!isEnabled(cfg)) return Promise.reject(aiError("unavailable", "AI coaching is off"));
    if (!ctx || !String(ctx.answer || "").trim()) {
      return Promise.reject(aiError("unavailable", "Write an answer first"));
    }
    if (activeProvider(cfg) === "backend") return backendFeedback(ctx, cfg);
    // Local coach: shaped as a Promise, with a tiny delay so loading UI is real.
    return new Promise(function (resolve) {
      setTimeout(function () {
        var fb = localFeedback(ctx);
        fb._provider = "local";
        resolve(fb);
      }, 250);
    });
  }

  global.MTC_AI = {
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    isEnabled: isEnabled,
    activeProvider: activeProvider,
    getFeedback: getFeedback,
    validateFeedback: validateFeedback,
    messageForKind: messageForKind,
    _localFeedback: localFeedback, // exposed for tests
    SCHEMA_FIELDS: { arrays: ARRAY_FIELDS, strings: STRING_FIELDS },
  };
})(typeof window !== "undefined" ? window : this);
