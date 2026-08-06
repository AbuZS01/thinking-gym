/* The Thinking Gym — play UI.
   Four tap-only board formats, each objectively scored against an authored key.
   No drag (unreliable on touch, invisible to keyboards): every control is a
   button, so tab + Enter plays the whole game. */

const GYM = (() => {
  let play = null; // {id, format, stage, ...working, result}

  /* ---------- helpers ---------- */

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Multiple-choice options are authored with the right answer in a fixed slot (it is
  // almost always written first), so rendering them in authored order lets the whole
  // game be beaten by always tapping the top choice. Shuffle the DISPLAY order and keep
  // the authored index on the button, so scoring and answer keys stay untouched.
  // Deterministic per challenge, so a re-render never reorders things mid-play.
  function optionOrder(n, seedKey) {
    return seededShuffle(Array.from({ length: n }, (_, i) => i), seedKey);
  }

  // Deterministic shuffle: the same challenge always deals the same board, so a
  // re-render mid-play never reshuffles what the user is looking at.
  function seededShuffle(arr, seed) {
    let s = hash(seed);
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function e(s) { return esc(s); }

  function init(ch) {
    const base = { id: ch.id, format: ch.format, result: null, savedResult: null, note: "", noteSaved: false, hintShown: false };
    if (ch.format === "map") {
      const cards = seededShuffle(
        ch.payload.pairs.map((p) => p.match).concat(ch.payload.decoys), ch.id);
      return Object.assign(base, { stage: "board", cards, placed: {}, selectedSlot: null, misleads: [] });
    }
    if (ch.format === "flaw") {
      return Object.assign(base, { stage: "sentence", attempts: 0, pickedSentence: null, pickedFlaw: null });
    }
    if (ch.format === "chain") {
      const cards = seededShuffle(ch.payload.steps.concat([ch.payload.intruder]), ch.id);
      return Object.assign(base, { stage: "board", cards, order: [] });
    }
    if (ch.format === "triage") {
      return Object.assign(base, { stage: "board", assign: {}, selectedCard: null });
    }
    if (ch.format === "ask") {
      // asked holds the indexes queried, in order; once the budget is spent every answer
      // is revealed so the final call is fair even to someone who spent badly.
      return Object.assign(base, { stage: "asking", asked: [], pickedDecision: null });
    }
    if (ch.format === "workout") {
      // stepIdx is the step being worked; picks[i] is what was settled on (null = failed
      // out), tries[i] how many taps it took. Later steps stay hidden so the answer to
      // one cannot be reverse-engineered from the next.
      return Object.assign(base, { stage: "board", stepIdx: 0, picks: {}, tries: {}, lastWrong: null });
    }
    return Object.assign(base, { stage: "board", assign: {}, selectedCard: null });
  }

  function current() {
    return play ? MTC.getGymChallenge(play.id) : null;
  }

  /* ---------- scoring ---------- */

  function score(ch) {
    if (ch.format === "map") {
      const pairs = ch.payload.pairs;
      let correct = 0, decoysUsed = 0;
      pairs.forEach((p, i) => {
        const v = play.placed[i];
        if (v === p.match) correct++;
        if (v && ch.payload.decoys.includes(v)) decoysUsed++;
      });
      const ans = ch.payload.misleads.answers;
      const hit = play.misleads.filter((i) => ans.includes(i)).length;
      const miss = play.misleads.filter((i) => !ans.includes(i)).length;
      const points = Math.max(0, correct * 8 - decoysUsed * 5 + hit * 4 - miss * 4);
      return { points, max: pairs.length * 8 + ans.length * 4, correct, decoysUsed, hit, miss };
    }
    if (ch.format === "flaw") {
      const sentencePts = play.pickedSentence === ch.payload.flawIdx ? (play.attempts <= 1 ? 10 : 5) : 0;
      const namePts = play.pickedFlaw === ch.payload.flawAnswer ? 10 : 0;
      return { points: sentencePts + namePts, max: 20, sentencePts, namePts };
    }
    if (ch.format === "chain") {
      const steps = ch.payload.steps;
      let correct = 0;
      steps.forEach((s, i) => { if (play.order[i] === s) correct++; });
      const intruderUsed = play.order.includes(ch.payload.intruder);
      const points = Math.max(0, correct * 6 - (intruderUsed ? 6 : 0));
      return { points, max: steps.length * 6, correct, intruderUsed };
    }
    if (ch.format === "ask") {
      const p = ch.payload;
      const worth = p.questions.filter((q) => q.value === "high").length;
      const goodAsked = play.asked.filter((i) => p.questions[i].value === "high").length;
      const decisionPts = play.pickedDecision === p.decision.answer ? 20 : 0;
      return {
        points: goodAsked * 10 + decisionPts,
        max: Math.min(p.budget, worth) * 10 + 20,
        goodAsked, worth, decisionPts,
      };
    }
    if (ch.format === "triage") {
      const items = ch.payload.items;
      let correct = 0;
      items.forEach((x, i) => { if (play.assign[i] === x.band) correct++; });
      return { points: correct * 5, max: items.length * 5, correct };
    }
    if (ch.format === "workout") {
      // same 10 / 5 / 0 ladder per step that "flaw" uses for its two stages
      const steps = ch.payload.steps;
      let points = 0, firstTry = 0, secondTry = 0, missed = 0;
      steps.forEach((s, i) => {
        if (play.picks[i] !== s.answer) { missed++; return; }
        if ((play.tries[i] || 1) <= 1) { points += 10; firstTry++; }
        else { points += 5; secondTry++; }
      });
      return { points, max: steps.length * 10, firstTry, secondTry, missed };
    }
    const ev = ch.payload.evidence;
    let correct = 0;
    ev.forEach((x, i) => { if (play.assign[i] === x.bucket) correct++; });
    return { points: correct * 5, max: ev.length * 5, correct };
  }

  function pct(sc) {
    const raw = (sc.points / sc.max) * 100;
    return Math.max(0, Math.round(play.hintShown ? raw * 0.85 : raw));
  }

  function finish(ch) {
    if (play.result) return;
    play.result = score(ch);
    // The score belongs to the completed interaction, not to the optional note
    // below it. Persist it now so leaving the page cannot lose the attempt.
    play.savedResult = MTC.submitGymChallenge(STATE, ch.id, pct(play.result), "");
  }

  const TOMORROW_TIPS = {
    notice: "Before trusting a message, claim or first impression, pause and name the strongest clue for it and the strongest clue against it.",
    judge: "When two choices compete, write down the full cost, the real benefit and the fact that would change your choice.",
    connect: "When you feel stuck, ask where you have seen the same job being done in a different setting. Borrow the useful part, then check where the comparison fails.",
    prioritise: "When several things feel urgent, sort them by danger to people, harm that is growing and whether there is a safe way around the problem.",
    question: "Before deciding, ask the question whose answer could genuinely make you choose differently.",
    adapt: "If a conversation or plan goes off course, return to the facts, state what you need and choose the smallest safe next step.",
  };

  const LIFE_TIPS = {
    safety: "If something feels unsafe, move towards other people, good lighting or a member of staff. Call someone you trust or the emergency services if you are in immediate danger.",
    scams: "Do not use the link, phone number or payment method in the message. Stop and check the claim using contact details you find yourself.",
    health: "Check health claims with a reliable medical source or a qualified professional before changing treatment, spending money or sharing the claim.",
    money: "Compare the full cost, important conditions and what happens if things go wrong—not just the price shown first.",
    relationships: "Say what happened without guessing the other person's motive, explain what you need and set a clear boundary if the behaviour continues.",
    home: "Check the agreement and keep a written record. If the stakes are high, get independent advice before paying or agreeing.",
    study: "Check the full course cost, likely outcome and independent evidence. Compare it with at least one other route before deciding.",
    work: "Write down the facts, your priorities and the specific next step you want. This makes a difficult work conversation easier to handle.",
  };
  const LIFE_TIP_PRIORITY = ["safety", "scams", "health", "money", "relationships", "home", "study", "work"];
  const MODEL_TOMORROW_TIPS = {
    "map-territory": "Before trusting a list, report or plan, check one important detail against what is actually happening.",
    incentives: "When a target produces strange behaviour, ask what it rewards and whether that reward matches the real goal.",
    scale: "Before making a task much larger, find which limit in space, time, equipment or coordination will fail first.",
    diversification: "Identify anything important that depends on one source and begin building one realistic backup.",
    sampling: "When a few comments support a big claim, ask how many people were checked and who may be missing.",
    anchoring: "For your next price or estimate, find an independent comparison before using the first number you were shown.",
    "margin-of-safety": "Add a small time or money buffer to one plan where a modest surprise would otherwise cause serious trouble.",
    "activation-energy": "Prepare the first step of one useful task in advance and move one easy distraction out of reach.",
    "diminishing-returns": "Set a clear standard for one task, then move on when extra effort would add less value elsewhere.",
    "social-proof": "When popularity pushes you to decide, check whether the crowd is real, independent and relevant.",
    "attribution-error": "Before labelling someone, ask what situation or wider pattern could also explain the behaviour.",
    "working-backward": "For your next fixed deadline, work backward through every required step and include a realistic buffer.",
    "action-bias": "When pressure makes you want to change everything, confirm the problem and choose the smallest safe test.",
    "loss-aversion": "Ask whether you would choose the same option today if you did not already own it or expect to keep it.",
  };

  function tomorrowTip(ch) {
    if (ch.payload && ch.payload.creativity) {
      return "When a plan gets stuck, write down the limits first. Create at least two options, then check which one is safe, clear and practical.";
    }
    const areaTip = LIFE_TIP_PRIORITY
      .filter((area) => (ch.lifeAreas || []).includes(area))
      .map((area) => LIFE_TIPS[area])
      .find(Boolean);
    const modelTip = (ch.frameworks || []).map((model) => MODEL_TOMORROW_TIPS[model]).find(Boolean);
    return ch.useTomorrow || modelTip || areaTip || TOMORROW_TIPS[ch.muscle] || "Pause before your next decision, name what you know and choose one fact to check before acting.";
  }

  /* ---------- board renderers ---------- */

  function mapBoardHTML(ch) {
    const p = ch.payload;
    const used = Object.values(play.placed);
    const slots = p.pairs.map((pair, i) => {
      const filled = play.placed[i];
      const sel = play.selectedSlot === i;
      return `<div class="slot-row">
        <button class="slot ${filled ? "filled" : ""} ${sel ? "selected" : ""}" data-gym-slot="${i}">
          <span class="slot-prompt">${e(pair.prompt)}</span>
          <span class="slot-fill">${filled ? e(filled) : "Tap to choose &rarr;"}</span>
        </button>
      </div>`;
    }).join("");
    const cards = play.cards.map((c, i) =>
      `<button class="gcard ${used.includes(c) ? "used" : ""}" data-gym-card="${i}">${e(c)}</button>`).join("");
    const ready = p.pairs.every((_, i) => play.placed[i]);
    return `<div class="panel">
      <h2>${e(p.sourceDomain)} &rarr; ${e(p.targetDomain)}</h2>
      <p class="subtle">${play.selectedSlot === null ? "Tap one idea, then tap the action that does the same job." : "Now tap the action that matches."}</p>
      ${slots}
    </div>
    <div class="panel">
      <h2>Actions</h2>
      <p class="subtle">Two of these belong nowhere.</p>
      <div class="gcards">${cards}</div>
    </div>
    ${ideasHTML()}
    ${actionRowHTML("Check my mapping", ready)}`;
  }

  function mapMisleadsHTML(ch) {
    const m = ch.payload.misleads;
    return `<div class="panel">
      <h2>One more thing</h2>
      <p>${e(m.question)}</p>
      <p class="subtle">Select every answer that applies.</p>
      ${optionOrder(m.options.length, ch.id + ":mis").map((oi) =>
        `<button class="opt ${play.misleads.includes(oi) ? "picked" : ""}" data-gym-mislead="${oi}">${e(m.options[oi])}</button>`).join("")}
    </div>
    ${actionRowHTML("Finish", play.misleads.length > 0)}`;
  }

  function flawHTML(ch) {
    const p = ch.payload;
    if (play.stage === "sentence") {
      const wrongPick = play.pickedSentence !== null && play.pickedSentence !== p.flawIdx;
      return `<div class="panel">
        <h2>Where does the reasoning break?</h2>
        <p class="subtle">Tap the sentence that does not hold up.</p>
        ${p.argument.map((s, i) => {
          const isWrong = wrongPick && play.pickedSentence === i;
          return `<button class="sentence ${isWrong ? "wrong" : ""}" data-gym-sentence="${i}">${e(s)}</button>`;
        }).join("")}
        ${wrongPick ? `<p class="subtle nudge">Not that one &mdash; that sentence is just reporting what was found. Look for where a conclusion outruns the evidence. Try again (half marks now).</p>` : ""}
      </div>
      ${ideasHTML()}
      ${hintRowHTML()}`;
    }
    return `<div class="panel">
      <h2>Name the error</h2>
      <p class="subtle">You found it: <i>${e(p.argument[p.flawIdx])}</i></p>
      ${optionOrder(p.flawOptions.length, ch.id + ":flaw").map((oi) =>
        `<button class="opt" data-gym-flaw="${oi}">${e(p.flawOptions[oi])}</button>`).join("")}
    </div>
    ${hintRowHTML()}`;
  }

  function chainHTML(ch) {
    const p = ch.payload;
    const placed = play.order.map((t, i) =>
      `<button class="gcard placed" data-gym-unorder="${i}"><span class="ord">${i + 1}</span> ${e(t)}</button>`).join("");
    const remaining = play.cards.filter((c) => !play.order.includes(c)).map((c) =>
      `<button class="gcard" data-gym-order="${e(c)}">${e(c)}</button>`).join("");
    const ready = play.order.length === p.steps.length;
    return `<div class="panel">
      <h2>Starting point</h2>
      <p>${e(p.event)}</p>
    </div>
    <div class="panel">
      <h2>What follows, in order</h2>
      <p class="subtle">${play.order.length ? "Tap a placed card to take it back out." : "Tap the consequences in the order they unfold."}</p>
      <div class="gcards">${placed || `<p class="subtle">Nothing placed yet.</p>`}</div>
    </div>
    <div class="panel">
      <h2>Cards</h2>
      <p class="subtle">One of these does not belong in the chain at all &mdash; leave it out.</p>
      <div class="gcards">${remaining || `<p class="subtle">All placed.</p>`}</div>
    </div>
    ${ideasHTML()}
    ${actionRowHTML("Check my chain", ready)}`;
  }

  function signalHTML(ch) {
    const p = ch.payload;
    const cards = p.evidence.map((x, i) => {
      const b = play.assign[i];
      const sel = play.selectedCard === i;
      return `<button class="gcard ${b ? "b-" + b : ""} ${sel ? "selected" : ""}" data-gym-evidence="${i}">
        ${e(x.text)}${b ? `<span class="bucket-tag">${b}</span>` : ""}
      </button>`;
    }).join("");
    const ready = p.evidence.every((_, i) => play.assign[i]);
    return `<div class="panel">
      <h2>The claim</h2>
      <p>${e(p.claim)}</p>
    </div>
    <div class="panel">
      <h2>Evidence</h2>
      <p class="subtle">${play.selectedCard === null ? "Tap a piece of evidence." : "Now tap a bucket below."}</p>
      <div class="gcards">${cards}</div>
    </div>
    <div class="panel buckets">
      <button class="btn secondary" data-gym-bucket="supports" ${play.selectedCard === null ? "disabled" : ""}>Supports</button>
      <button class="btn secondary" data-gym-bucket="undermines" ${play.selectedCard === null ? "disabled" : ""}>Makes weaker</button>
      <button class="btn secondary" data-gym-bucket="irrelevant" ${play.selectedCard === null ? "disabled" : ""}>Neither</button>
    </div>
    ${ideasHTML()}
    ${actionRowHTML("Check my sorting", ready)}`;
  }

  function askHTML(ch) {
    const p = ch.payload;
    const left = p.budget - play.asked.length;

    if (play.stage === "asking") {
      const rows = p.questions.map((q, i) => {
        const done = play.asked.includes(i);
        return `<button class="opt ${done ? "picked" : ""}" data-gym-ask="${i}" ${done ? "disabled" : ""}>
          ${e(q.text)}
          ${done ? `<div class="subtle" style="margin-top:7px"><b>&rarr;</b> ${e(q.answer)}</div>` : ""}
        </button>`;
      }).join("");
      return `<div class="panel">
        <span class="tag">${left} question${left === 1 ? "" : "s"} left</span>
        <h2>${e(p.situation)}</h2>
        <p class="subtle">Ask the ones whose answers would change what you do.</p>
      </div>
      <div class="panel">${rows}</div>
      ${ideasHTML()}
      ${hintRowHTML()}`;
    }

    // budget spent — reveal everything, then take the decision
    const all = p.questions.map((q, i) => {
      const asked = play.asked.includes(i);
      return `<div class="review-row ${asked ? "ok" : ""}">
        <div class="subtle">${asked ? "You asked" : "You did not ask"}</div>
        ${e(q.text)}
        <div class="subtle"><b>&rarr;</b> ${e(q.answer)}</div>
      </div>`;
    }).join("");
    return `<div class="panel">
      <span class="tag">Everything you could have asked</span>
      ${all}
    </div>
    <div class="panel">
      <h2>${e(p.decision.ask)}</h2>
      ${optionOrder(p.decision.options.length, ch.id + ":dec").map((oi) =>
        `<button class="opt" data-gym-decide="${oi}">${e(p.decision.options[oi])}</button>`).join("")}
    </div>
    ${hintRowHTML()}`;
  }

  function triageHTML(ch) {
    const p = ch.payload;
    const label = (id) => (p.bands.find((b) => b.id === id) || {}).label || id;
    const cards = p.items.map((x, i) => {
      const b = play.assign[i];
      const sel = play.selectedCard === i;
      return `<button class="gcard ${b ? "b-band" : ""} ${sel ? "selected" : ""}" data-gym-item="${i}">
        ${e(x.text)}${b ? `<span class="bucket-tag">${e(label(b))}</span>` : ""}
      </button>`;
    }).join("");
    const ready = p.items.every((_, i) => play.assign[i]);
    return `<div class="panel">
      <span class="tag">The rule</span>
      <p>${e(p.protocol)}</p>
    </div>
    <div class="panel">
      <h2>${e(p.boardTitle || "Sort these")}</h2>
      <p class="subtle">${play.selectedCard === null ? "Tap an item." : "Now tap a band below."}</p>
      <div class="gcards">${cards}</div>
    </div>
    <div class="panel buckets">
      ${p.bands.map((b) =>
        `<button class="btn secondary" data-gym-band="${b.id}" ${play.selectedCard === null ? "disabled" : ""}>${e(b.label)}</button>`).join("")}
    </div>
    ${ideasHTML()}
    ${actionRowHTML("Check my sorting", ready)}`;
  }

  function workoutHTML(ch) {
    const p = ch.payload;
    // steps already settled, shown as a worked trail above the live one
    const done = p.steps.slice(0, play.stepIdx).map((s, i) => {
      const pick = play.picks[i];
      const right = pick === s.answer;
      return `<div class="review-row ${right ? "ok" : "no"}">
        <div class="subtle">${e(s.ask)}</div>
        <div>${right ? "&#10003;" : "&#10007;"} ${e(pick === null || pick === undefined ? "Moved on without it" : s.options[pick])}</div>
        <div class="subtle">${e(s.because)}</div>
      </div>`;
    }).join("");

    const step = p.steps[play.stepIdx];
    const tries = play.tries[play.stepIdx] || 0;
    const live = step ? `<div class="panel">
        <span class="tag">Step ${play.stepIdx + 1} of ${p.steps.length}</span>
        <h2>${e(step.ask)}</h2>
        ${optionOrder(step.options.length, ch.id + ":step" + play.stepIdx).map((oi) => {
          const wrong = play.lastWrong === oi;
          return `<button class="opt ${wrong ? "wrong" : ""}" data-gym-step="${oi}">${e(step.options[oi])}</button>`;
        }).join("")}
        ${tries >= 1 && play.lastWrong !== null
          ? `<p class="subtle nudge">Not that one &mdash; one more try, for half marks on this step.</p>` : ""}
      </div>` : "";

    return `<div class="panel">
      <h2>${e(p.problem)}</h2>
      <p class="subtle">${play.stepIdx} of ${p.steps.length} steps settled.</p>
    </div>
    ${done ? `<div class="panel"><span class="tag">Working</span>${done}</div>` : ""}
    ${live}
    ${ideasHTML()}
    ${hintRowHTML()}`;
  }

  // the reference's free-text box: optional, never graded, saved to the journal
  function ideasHTML() {
    const ch = current();
    const creative = Boolean(ch && ch.payload && ch.payload.creativity);
    return `<div class="panel">
      <h2>${creative ? "Try your own idea" : "Your thinking"} <span class="subtle">(optional)</span></h2>
      <p class="subtle">${creative ? "Your idea is not graded. Use the limits in the challenge to check whether it is safe, clear and practical." : "You can save this as a private journal note after you check the answer."}</p>
      <textarea id="gym-note" placeholder="${creative ? "Write another idea here..." : "Type your ideas here..."}">${e(play.note)}</textarea>
    </div>`;
  }

  function hintRowHTML() {
    const ch = current();
    if (!ch.hint) return "";
    return play.hintShown
      ? `<div class="hint-box">${e(ch.hint)}</div>`
      : `<div class="field"><button class="btn ghost" data-gym-hint>&#128161; Hint (costs 15%)</button></div>`;
  }

  function actionRowHTML(label, ready) {
    const ch = current();
    const hint = ch.hint && !play.hintShown
      ? `<button class="btn secondary" data-gym-hint>&#128161; Hint</button>`
      : "";
    return `${play.hintShown && ch.hint ? `<div class="hint-box">${e(ch.hint)}</div>` : ""}
      <div class="action-row">${hint}
        <button class="btn" data-gym-check ${ready ? "" : "disabled"}>${label}</button>
      </div>`;
  }

  /* ---------- result ---------- */

  function reviewHTML(ch, sc) {
    if (ch.format === "map") {
      const rows = ch.payload.pairs.map((pair, i) => {
        const v = play.placed[i];
        const ok = v === pair.match;
        return `<div class="review-row ${ok ? "ok" : "no"}">
          <div class="subtle">${e(pair.prompt)}</div>
          <div>${ok ? "&#10003;" : "&#10007;"} You chose: ${e(v || "nothing")}</div>
          ${ok ? "" : `<div class="subtle">Belongs here: ${e(pair.match)}</div>`}
        </div>`;
      }).join("");
      const ans = ch.payload.misleads.answers;
      // same display order the player saw, so the review lines up with the board
      const mis = optionOrder(ch.payload.misleads.options.length, ch.id + ":mis").map((i) => {
        const o = ch.payload.misleads.options[i];
        const picked = play.misleads.includes(i);
        const right = ans.includes(i);
        if (!picked && !right) return "";
        return `<div class="review-row ${picked === right ? "ok" : "no"}">${picked === right ? "&#10003;" : "&#10007;"} ${e(o)}${!picked && right ? ` <span class="subtle">(missed)</span>` : ""}</div>`;
      }).join("");
      return rows + (sc.decoysUsed ? `<p class="subtle nudge">${sc.decoysUsed} extra card${sc.decoysUsed === 1 ? "" : "s"} used &mdash; those actions sound sensible but do not match any of the ideas.</p>` : "") + mis;
    }
    if (ch.format === "flaw") {
      const p = ch.payload;
      return `<div class="review-row ${sc.sentencePts ? "ok" : "no"}">
          ${sc.sentencePts ? "&#10003;" : "&#10007;"} The broken step: <i>${e(p.argument[p.flawIdx])}</i>
          ${sc.sentencePts === 10 ? " <span class='subtle'>(first try)</span>" : sc.sentencePts === 5 ? " <span class='subtle'>(second try)</span>" : ""}
        </div>
        <div class="review-row ${sc.namePts ? "ok" : "no"}">
          ${sc.namePts ? "&#10003;" : "&#10007;"} ${e(p.flawOptions[p.flawAnswer])}
          ${sc.namePts ? "" : `<div class="subtle">You said: ${e(p.flawOptions[play.pickedFlaw] || "nothing")}</div>`}
        </div>`;
    }
    if (ch.format === "chain") {
      const p = ch.payload;
      const rows = p.steps.map((s, i) => {
        const ok = play.order[i] === s;
        return `<div class="review-row ${ok ? "ok" : "no"}">
          ${ok ? "&#10003;" : "&#10007;"} <b>${i + 1}.</b> ${e(s)}
          ${ok ? "" : `<div class="subtle">You placed: ${e(play.order[i] || "nothing")}</div>`}
        </div>`;
      }).join("");
      return rows + (sc.intruderUsed
        ? `<p class="subtle nudge">You included the card that does not belong: &ldquo;${e(p.intruder)}&rdquo;</p>`
        : `<p class="subtle">You correctly left out: &ldquo;${e(p.intruder)}&rdquo;</p>`);
    }
    if (ch.format === "ask") {
      const p = ch.payload;
      const rows = p.questions.map((q, i) => {
        const asked = play.asked.includes(i);
        const worth = q.value === "high";
        if (!asked && !worth) return ""; // an unasked low-value question is not a mistake
        return `<div class="review-row ${asked === worth ? "ok" : "no"}">
          ${asked === worth ? "&#10003;" : "&#10007;"} ${e(q.text)}
          <div class="subtle">${asked ? (worth ? "Asked — and it moved the answer" : "Asked — interesting, but it changed nothing") : "Not asked — this was the one that mattered"}</div>
          <div class="subtle">${e(q.because)}</div>
        </div>`;
      }).join("");
      const d = p.decision;
      const right = play.pickedDecision === d.answer;
      return rows + `<div class="review-row ${right ? "ok" : "no"}">
        ${right ? "&#10003;" : "&#10007;"} ${e(d.options[d.answer])}
        ${right ? "" : `<div class="subtle">You chose: ${e(d.options[play.pickedDecision] || "nothing")}</div>`}
        <div class="subtle">${e(d.because)}</div>
      </div>`;
    }
    if (ch.format === "triage") {
      const p = ch.payload;
      const label = (id) => (p.bands.find((b) => b.id === id) || {}).label || id;
      return p.items.map((x, i) => {
        const mine = play.assign[i];
        const okRow = mine === x.band;
        return `<div class="review-row ${okRow ? "ok" : "no"}">
          ${okRow ? "&#10003;" : "&#10007;"} ${e(x.text)}
          <div class="subtle">${okRow ? e(label(x.band)) : `You said ${e(label(mine))} &mdash; the rule puts it in ${e(label(x.band))}`}</div>
          <div class="subtle">${e(x.because)}</div>
        </div>`;
      }).join("");
    }
    if (ch.format === "workout") {
      return ch.payload.steps.map((s, i) => {
        const pick = play.picks[i];
        const right = pick === s.answer;
        const label = pick === null || pick === undefined ? "nothing" : s.options[pick];
        return `<div class="review-row ${right ? "ok" : "no"}">
          ${right ? "&#10003;" : "&#10007;"} <b>${i + 1}.</b> ${e(s.ask)}
          ${right
            ? `<div class="subtle">${e(s.options[s.answer])}${(play.tries[i] || 1) > 1 ? " (second try)" : ""}</div>`
            : `<div class="subtle">You chose: ${e(label)}<br>Answer: ${e(s.options[s.answer])}</div>`}
          <div class="subtle">${e(s.because)}</div>
        </div>`;
      }).join("");
    }
    return ch.payload.evidence.map((x, i) => {
      const mine = play.assign[i];
      const ok = mine === x.bucket;
      return `<div class="review-row ${ok ? "ok" : "no"}">
        ${ok ? "&#10003;" : "&#10007;"} ${e(x.text)}
        <div class="subtle">${ok ? x.bucket : `You filed it under ${e(mine)} &mdash; it ${x.bucket === "irrelevant" ? "does neither" : x.bucket + " the claim"}`}</div>
      </div>`;
    }).join("");
  }

  function resultHTML(ch) {
    const sc = play.result;
    const p = pct(sc);
    const tone = p >= 80 ? "" : p >= 50 ? " mid" : " low";
    // "Great connection!" only makes sense for Map It; the other three formats get
    // top marks for spotting, ordering and sorting, not for connecting.
    const nailedIt = { map: "Great connection!", flaw: "You found it!", chain: "Chain nailed!", signal: "Sorted correctly!", workout: "Worked it out!", triage: "Sorted under pressure!", ask: "You asked the right things!" };
    const headline = p >= 90 ? (nailedIt[ch.format] || "Nailed it!")
      : p >= 70 ? "Solid thinking" : p >= 40 ? "Partly there" : "Worth a rebuild";
    const nextCh = (MTC.gymSession(STATE).find((c) => c.id !== ch.id) || null);
    const unlocked = (play.savedResult && play.savedResult.achievementsUnlocked) || [];
    return `<div class="panel">
      <div class="result-hero">
        <div class="tick${tone}">${p >= 50 ? "&#10003;" : "!"}</div>
        <div>
          <h1>${headline}</h1>
          <p class="subtle">You earned <b>${sc.points}</b> of ${sc.max} points &middot; <span class="score-num">${p}<span>%</span></span></p>
        </div>
      </div>
      ${play.hintShown ? `<p class="subtle nudge">Hint used &mdash; 15% off this score.</p>` : ""}
      <p class="save-status" role="status">&#10003; Result saved automatically</p>
      ${unlocked.map((achievement) => `<p class="achievement-note">&#127942; ${e(achievement.name)} unlocked</p>`).join("")}
    </div>
    <div class="panel">
      <h2>What you did</h2>
      ${reviewHTML(ch, sc)}
    </div>
    ${ch.payload.creativity ? `<div class="panel">
      <div class="info-panel green"><div class="lbl">Try your own idea</div>${e(ch.payload.creativePrompt)} Your answer is not graded. Check it against the limits shown in the challenge.</div>
    </div>` : ""}
    <div class="panel">
      <div class="info-panel green"><div class="lbl">The principle</div>${e(ch.debrief.principle)}</div>
      <div class="info-panel purple"><div class="lbl">Where it misleads</div>${e(ch.debrief.whereItMisleads)}</div>
      <div class="info-panel blue"><div class="lbl">Use this tomorrow</div>${e(tomorrowTip(ch))}</div>
    </div>
    <div class="panel">
      <h2>${ch.payload.creativity ? "Save your idea" : "Save a journal note"} <span class="subtle">(optional, +5 points)</span></h2>
      <p class="subtle">The score is already saved. This note is private, never graded and can help you remember what you learned.</p>
      <textarea id="gym-note" placeholder="${ch.payload.creativity ? "Write another idea here..." : "Type your ideas here..."}">${e(play.note)}</textarea>
      <div class="field"><button class="btn ghost" data-gym-save-note="${ch.id}" ${play.note.trim() && !play.noteSaved ? "" : "disabled"}>${play.noteSaved ? "Note saved" : "Save note"}</button></div>
      ${play.noteSaved ? `<p class="save-status" role="status">&#10003; Saved to your journal</p>` : ""}
    </div>
    <div class="field">
      <button class="btn block" data-gym-next="${nextCh ? nextCh.id : ""}">
        ${nextCh ? "Next challenge" : "Back to challenges"}
      </button>
    </div>`;
  }

  /* ---------- entry point ---------- */

  function playHTML(challengeId) {
    const ch = MTC.getGymChallenge(challengeId);
    if (!ch) return `<div class="panel">Challenge not found. <a class="btn" href="#/gym">Back to the Gym</a></div>`;
    if (!play || play.id !== challengeId) play = init(ch);
    const fmt = MTC_GYM_FORMATS[ch.format];
    const muscle = MTC_MUSCLES.find((t) => t.id === ch.muscle) || {};
    const session = MTC.gymSession(STATE);
    const idx = session.findIndex((c) => c.id === ch.id);
    const progress = idx >= 0
      ? `<div class="play-progress">
          <div class="row"><span>${e(fmt.name)}</span><span>${idx + 1} of ${session.length}</span></div>
          <div class="progress"><div class="fill" style="width:${Math.round(((idx + (play.result ? 1 : 0)) / session.length) * 100)}%"></div></div>
        </div>` : "";
    const header = `${progress}
      <div class="challenge-card">
        <span class="label">Challenge</span>
        <div class="head">
          <div class="emoji-badge">${ch.emoji || (typeof muscleIcon === "function" ? muscleIcon(ch.muscle) : "\u{1F9E0}")}</div>
          <div><h1>${e(ch.title)}</h1><p class="subtle">${e(muscle.name || ch.muscle)}</p></div>
        </div>
        <p>${e(ch.scenario)}</p>
        ${ch.payload && ch.payload.fairnessNote ? `<p class="fairness-note"><b>How this is scored:</b> ${e(ch.payload.fairnessNote)}</p>` : ""}
        ${play.result ? "" : `<p class="subtle" style="margin-top:10px">${e(fmt.how)}</p>`}
      </div>`;

    if (play.result) return header + resultHTML(ch);
    if (ch.format === "map") return header + (play.stage === "board" ? mapBoardHTML(ch) : mapMisleadsHTML(ch));
    if (ch.format === "flaw") return header + flawHTML(ch);
    if (ch.format === "chain") return header + chainHTML(ch);
    if (ch.format === "workout") return header + workoutHTML(ch);
    if (ch.format === "triage") return header + triageHTML(ch);
    if (ch.format === "ask") return header + askHTML(ch);
    return header + signalHTML(ch);
  }

  /* ---------- events ---------- */

  function handleClick(ev) {
    const ch = current();
    if (!ch) return false;
    const hit = (attr) => ev.target.closest("[" + attr + "]");

    const slot = hit("data-gym-slot");
    if (slot) { play.selectedSlot = Number(slot.dataset.gymSlot); return true; }

    const card = hit("data-gym-card");
    if (card) {
      const text = play.cards[Number(card.dataset.gymCard)];
      // a card can only sit in one slot: taking it moves it
      for (const k of Object.keys(play.placed)) if (play.placed[k] === text) delete play.placed[k];
      if (play.selectedSlot !== null) {
        play.placed[play.selectedSlot] = text;
        play.selectedSlot = null;
      }
      return true;
    }

    const mis = hit("data-gym-mislead");
    if (mis) {
      const i = Number(mis.dataset.gymMislead);
      play.misleads = play.misleads.includes(i) ? play.misleads.filter((x) => x !== i) : play.misleads.concat(i);
      return true;
    }

    const sentence = hit("data-gym-sentence");
    if (sentence) {
      play.attempts++;
      play.pickedSentence = Number(sentence.dataset.gymSentence);
      if (play.pickedSentence === ch.payload.flawIdx || play.attempts >= 2) {
        if (play.pickedSentence !== ch.payload.flawIdx) play.pickedSentence = null; // ran out of tries
        play.stage = "name";
        if (play.pickedSentence === null) { play.pickedSentence = -1; }
      }
      return true;
    }

    const flaw = hit("data-gym-flaw");
    if (flaw) {
      play.pickedFlaw = Number(flaw.dataset.gymFlaw);
      finish(ch);
      return true;
    }

    const stepBtn = hit("data-gym-step");
    if (stepBtn) {
      const i = play.stepIdx;
      const step = ch.payload.steps[i];
      const choice = Number(stepBtn.dataset.gymStep);
      play.tries[i] = (play.tries[i] || 0) + 1;
      if (choice === step.answer) {
        play.picks[i] = choice;          // right: settle it and move on
        play.lastWrong = null;
        play.stepIdx++;
      } else if (play.tries[i] >= 2) {
        play.picks[i] = choice;          // out of tries: record what they settled on, 0 marks
        play.lastWrong = null;
        play.stepIdx++;
      } else {
        play.lastWrong = choice;         // first miss: flag it and let them retry for half
      }
      if (play.stepIdx >= ch.payload.steps.length) finish(ch);
      return true;
    }

    const ord = hit("data-gym-order");
    if (ord) { play.order = play.order.concat(ord.dataset.gymOrder); return true; }

    const unord = hit("data-gym-unorder");
    if (unord) {
      const i = Number(unord.dataset.gymUnorder);
      play.order = play.order.filter((_, idx) => idx !== i);
      return true;
    }

    const askBtn = hit("data-gym-ask");
    if (askBtn) {
      const i = Number(askBtn.dataset.gymAsk);
      if (play.asked.includes(i)) return false;
      play.asked.push(i);
      if (play.asked.length >= ch.payload.budget) play.stage = "deciding";
      return true;
    }

    const decide = hit("data-gym-decide");
    if (decide) {
      play.pickedDecision = Number(decide.dataset.gymDecide);
      finish(ch);
      return true;
    }

    const item = hit("data-gym-item");
    if (item) { play.selectedCard = Number(item.dataset.gymItem); return true; }

    const band = hit("data-gym-band");
    if (band) {
      if (play.selectedCard === null) return false;
      play.assign[play.selectedCard] = band.dataset.gymBand;
      play.selectedCard = null;
      return true;
    }

    const evi = hit("data-gym-evidence");
    if (evi) { play.selectedCard = Number(evi.dataset.gymEvidence); return true; }

    const bucket = hit("data-gym-bucket");
    if (bucket && play.selectedCard !== null) {
      play.assign[play.selectedCard] = bucket.dataset.gymBucket;
      play.selectedCard = null;
      return true;
    }

    if (hit("data-gym-check")) {
      if (ch.format === "map" && play.stage === "board") play.stage = "misleads";
      else finish(ch);
      return true;
    }

    if (hit("data-gym-hint")) { play.hintShown = true; return true; }

    const saveNote = hit("data-gym-save-note");
    if (saveNote) {
      MTC.saveGymNote(STATE, saveNote.dataset.gymSaveNote, play.note);
      play.noteSaved = true;
      return true;
    }

    const next = hit("data-gym-next");
    if (next) {
      const nextId = next.dataset.gymNext;
      play = null;
      navigate(nextId ? "gym/play/" + nextId : "gym");
      return true;
    }
    return false;
  }

  function handleInput(ev) {
    if (ev.target.id === "gym-note" && play) {
      play.note = ev.target.value;
      play.noteSaved = false;
      const button = document.querySelector("[data-gym-save-note]");
      if (button) {
        button.disabled = !play.note.trim();
        button.textContent = "Save note";
      }
      const status = document.querySelector(".panel .save-status[role='status']");
      if (status && status.textContent.includes("journal")) status.remove();
      return true;
    }
    return false;
  }

  function reset() { play = null; }

  return { playHTML, handleClick, handleInput, reset };
})();
