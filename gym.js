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
    const base = { id: ch.id, format: ch.format, result: null, note: "" };
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
    const ev = ch.payload.evidence;
    let correct = 0;
    ev.forEach((x, i) => { if (play.assign[i] === x.bucket) correct++; });
    return { points: correct * 5, max: ev.length * 5, correct };
  }

  function pct(sc) { return Math.round((sc.points / sc.max) * 100); }

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
      <p class="subtle">${play.selectedSlot === null ? "Tap a mechanism, then tap the action that does the same job." : "Now tap the action that matches."}</p>
      ${slots}
    </div>
    <div class="panel">
      <h2>Actions</h2>
      <p class="subtle">Two of these belong nowhere.</p>
      <div class="gcards">${cards}</div>
    </div>
    <div class="panel">
      <button class="btn" data-gym-check ${ready ? "" : "disabled"}>Check my mapping</button>
      ${ready ? "" : `<p class="subtle">Fill every slot to check.</p>`}
    </div>`;
  }

  function mapMisleadsHTML(ch) {
    const m = ch.payload.misleads;
    return `<div class="panel">
      <h2>One more thing</h2>
      <p>${e(m.question)}</p>
      <p class="subtle">Select every answer that applies.</p>
      ${m.options.map((o, i) =>
        `<button class="opt ${play.misleads.includes(i) ? "picked" : ""}" data-gym-mislead="${i}">${e(o)}</button>`).join("")}
      <div class="field"><button class="btn" data-gym-check ${play.misleads.length ? "" : "disabled"}>Finish</button></div>
    </div>`;
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
      </div>`;
    }
    return `<div class="panel">
      <h2>Name the error</h2>
      <p class="subtle">You found it: <i>${e(p.argument[p.flawIdx])}</i></p>
      ${p.flawOptions.map((o, i) =>
        `<button class="opt" data-gym-flaw="${i}">${e(o)}</button>`).join("")}
    </div>`;
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
    <div class="panel">
      <button class="btn" data-gym-check ${ready ? "" : "disabled"}>Check my chain</button>
      ${ready ? "" : `<p class="subtle">Place ${p.steps.length} cards to check.</p>`}
    </div>`;
  }

  function signalHTML(ch) {
    const p = ch.payload;
    const cards = p.evidence.map((x, i) => {
      const b = play.assign[i];
      const sel = play.selectedCard === i;
      return `<button class="gcard ${b ? "filed b-" + b : ""} ${sel ? "selected" : ""}" data-gym-evidence="${i}">
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
      <button class="btn secondary" data-gym-bucket="undermines" ${play.selectedCard === null ? "disabled" : ""}>Undermines</button>
      <button class="btn secondary" data-gym-bucket="irrelevant" ${play.selectedCard === null ? "disabled" : ""}>Neither</button>
    </div>
    <div class="panel">
      <button class="btn" data-gym-check ${ready ? "" : "disabled"}>Check my sorting</button>
      ${ready ? "" : `<p class="subtle">File every card to check.</p>`}
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
      const mis = ch.payload.misleads.options.map((o, i) => {
        const picked = play.misleads.includes(i);
        const right = ans.includes(i);
        if (!picked && !right) return "";
        return `<div class="review-row ${picked === right ? "ok" : "no"}">${picked === right ? "&#10003;" : "&#10007;"} ${e(o)}${!picked && right ? ` <span class="subtle">(missed)</span>` : ""}</div>`;
      }).join("");
      return rows + (sc.decoysUsed ? `<p class="subtle nudge">${sc.decoysUsed} decoy card${sc.decoysUsed === 1 ? "" : "s"} used &mdash; those actions sound sensible but match none of the mechanisms.</p>` : "") + mis;
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
    return `<div class="panel">
      <div class="score-hero">
        <div class="score-num">${p}<span>%</span></div>
        <div>
          <h1>${p >= 90 ? "Clean" : p >= 70 ? "Solid" : p >= 40 ? "Rough" : "Rebuild that"}</h1>
          <p class="subtle">${sc.points} of ${sc.max} points</p>
        </div>
      </div>
    </div>
    <div class="panel">
      <h2>What you did</h2>
      ${reviewHTML(ch, sc)}
    </div>
    <div class="panel">
      <div class="model-answer"><div class="lbl">The principle</div>${e(ch.debrief.principle)}</div>
      <div class="model-answer"><div class="lbl">Where it misleads</div>${e(ch.debrief.whereItMisleads)}</div>
    </div>
    <div class="panel">
      <h2>Anything to add? <span class="subtle">(optional, +5 XP)</span></h2>
      <p class="subtle">Not graded &mdash; saved to your journal.</p>
      <textarea id="gym-note" placeholder="What you spotted, or what you'd do differently.">${e(play.note)}</textarea>
      <div class="field"><button class="btn" data-gym-save="${ch.id}">Bank it${play.note.trim() ? " (+5)" : ""}</button></div>
    </div>`;
  }

  /* ---------- entry point ---------- */

  function playHTML(challengeId) {
    const ch = MTC.getGymChallenge(challengeId);
    if (!ch) return `<div class="panel">Challenge not found. <a class="btn" href="#/gym">Back to the Gym</a></div>`;
    if (!play || play.id !== challengeId) play = init(ch);
    const fmt = MTC_GYM_FORMATS[ch.format];
    const header = `<div class="panel">
      <a class="crumb" href="#/gym">&larr; The Gym</a>
      <div><span class="pill">${e(fmt.name)}</span><span class="pill">${e((MTC_SKILL_TRACKS.find((t) => t.id === ch.track) || {}).name || ch.track)}</span></div>
      <h1>${e(ch.title)}</h1>
      <p>${e(ch.scenario)}</p>
      ${play.result ? "" : `<p class="subtle">${e(fmt.how)}</p>`}
    </div>`;

    if (play.result) return header + resultHTML(ch);
    if (ch.format === "map") return header + (play.stage === "board" ? mapBoardHTML(ch) : mapMisleadsHTML(ch));
    if (ch.format === "flaw") return header + flawHTML(ch);
    if (ch.format === "chain") return header + chainHTML(ch);
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
      play.result = score(ch);
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
      else play.result = score(ch);
      return true;
    }

    const save = hit("data-gym-save");
    if (save) {
      const res = MTC.submitGymChallenge(STATE, save.dataset.gymSave, pct(play.result), play.note);
      pendingResult = res;
      play = null;
      navigate("gym");
      return true;
    }
    return false;
  }

  function handleInput(ev) {
    if (ev.target.id === "gym-note" && play) { play.note = ev.target.value; return true; }
    return false;
  }

  function reset() { play = null; }

  return { playHTML, handleClick, handleInput, reset };
})();
