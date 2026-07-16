/* Master Thinking Coach — UI layer. Renders from MTC engine state into #app. */

let STATE = MTC.loadState();
let exUI = null; // {exerciseId, hintsRevealed, checked:Set, showAssessment}
let bossUI = null; // {battleId, hintsShown:Set, checked:Set, showResolution}
let pendingResult = null;
let toolboxFilter = "";
let frameworksFilter = "";

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function frameworkNames(ids) {
  return ids.map((f) => (MTC_FRAMEWORKS.find((fw) => fw.id === f) || {}).name).filter(Boolean).join(" &middot; ");
}

function route() {
  const h = location.hash || "#/dashboard";
  return h.slice(2) || "dashboard";
}

function navigate(path) {
  location.hash = "#/" + path;
}

function levelInfo() {
  const { level, xpIntoLevel, xpForNext } = MTC.deriveLevel(STATE.totalXp);
  return { level, xpIntoLevel, xpForNext, title: MTC.titleForLevel(level), pct: Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100)) };
}

/* ---------- Layout ---------- */

function navBtn(key, label) {
  const r = route();
  const active = r === key || r.startsWith(key + "/") || (key === "quest" && r.startsWith("exercise/"));
  return `<a href="#/${key}" data-nav="${key}" ${active ? 'class="active" aria-current="page"' : ""}>${label}</a>`;
}

function navHTML() {
  const li = levelInfo();
  return `<div class="topnav">
    <a class="brand" href="#/dashboard"><span class="mark">&#9670;</span> Master Thinking Coach</a>
    <div class="navlinks">
      ${navBtn("dashboard", "Dashboard")}
      ${navBtn("quest", "Daily Quest")}
      ${navBtn("boss", "Boss Battle")}
      ${navBtn("journal", "Journal")}
      ${navBtn("toolbox", "Toolbox")}
      ${navBtn("frameworks", "Frameworks")}
      ${navBtn("achievements", "Achievements")}
    </div>
    <div class="status-chip">Lv <b>${li.level}</b> &middot; ${esc(li.title)} ${STATE.streak > 0 ? `&middot; &#128293;${STATE.streak}` : ""}</div>
  </div>`;
}

function footerHTML() {
  return `<footer class="foot">
    Progress is stored in this browser only.
    &middot; <button data-export-progress>Export progress</button>
    &middot; <button data-import-progress>Import progress</button>
    &middot; <button data-reset-progress>Erase all progress</button>
    <input type="file" id="import-file" accept=".json,application/json" style="display:none" />
  </footer>`;
}

/* ---------- Onboarding ---------- */

function onboardingHTML() {
  return `<div class="onboarding">
    <h1>Master Thinking Coach</h1>
    <p>Daily exercises that train sharper reasoning. Your progress stays on this device.</p>
    <form data-onboard-form>
      <input type="text" name="playerName" placeholder="Your name" maxlength="40" autofocus />
      <div class="field"><button class="btn" type="submit">Start</button></div>
    </form>
  </div>`;
}

/* ---------- Dashboard ---------- */

function dashboardHTML() {
  const li = levelInfo();
  const quest = MTC.getOrCreateDailyQuest(STATE);
  const battleState = MTC.getCurrentBossBattle(STATE);
  const battle = MTC.getBossBattleDef(battleState.battleId);
  const weak = MTC.weaknessProfile(STATE).filter((w) => w.attempts > 0).slice(0, 5);

  return `
  <div class="panel">
    <div class="level-hero">
      <div class="level-num">${li.level}<sup>lvl</sup></div>
      <div style="flex:1">
        <div class="subtle">Welcome back, ${esc(STATE.name)}</div>
        <h1>${esc(li.title)}</h1>
        <div class="subtle">${li.xpIntoLevel} / ${li.xpForNext} XP to next level</div>
        <div class="xp-bar"><div class="fill" style="width:${li.pct}%"></div></div>
      </div>
    </div>
  </div>

  <div class="grid">
    <a class="panel card" href="#/quest">
      <span class="tag">Today</span>
      <h2>Daily Quest</h2>
      <p class="subtle">${quest.completed.length} / ${quest.items.length} done</p>
      <span class="cta">Continue &rarr;</span>
    </a>
    <a class="panel card" href="#/boss">
      <span class="tag">This week</span>
      <h2>${battleState.completed ? "Boss Defeated" : "Boss Battle"}</h2>
      <p class="subtle">${battleState.completed ? "New battle next week." : esc(battle.name)}</p>
      <span class="cta">${battleState.completed ? "Review" : "Enter"} &rarr;</span>
    </a>
    <a class="panel card" href="#/achievements">
      <span class="tag">Progress</span>
      <h2>Achievements</h2>
      <p class="subtle">${STATE.achievements.length} / ${MTC_ACHIEVEMENTS.length} unlocked</p>
      <span class="cta">View &rarr;</span>
    </a>
  </div>

  <div class="panel">
    <h2>Weakness Radar</h2>
    ${weak.length === 0
      ? `<p class="subtle">Complete a few exercises to reveal your weakest frameworks.</p>`
      : weak.map((w) => `<div class="weak-row"><span class="name">${esc(w.name)}</span><div class="weak-meter"><div class="fill" style="width:${Math.round(w.avg)}%"></div></div><span class="subtle">${Math.round(w.avg)}%</span></div>`).join("")}
  </div>

  <div class="grid tight">
    <a class="panel card" href="#/journal"><h2>Journal</h2><p class="subtle">${STATE.history.length} answer${STATE.history.length === 1 ? "" : "s"}</p><span class="cta">Open &rarr;</span></a>
    <a class="panel card" href="#/toolbox"><h2>Toolbox</h2><p class="subtle">${MTC_TOOLBOX.length} thinking tools</p><span class="cta">Open &rarr;</span></a>
    <a class="panel card" href="#/frameworks"><h2>Frameworks</h2><p class="subtle">${MTC_FRAMEWORKS.length} thinking styles</p><span class="cta">Open &rarr;</span></a>
  </div>`;
}

/* ---------- Daily Quest ---------- */

const TYPE_LABELS = {
  warmup: "Warm-up", challenge: "Challenge", case: "Real-World Case", reflection: "Reflection",
  creativity: "Creativity", logic_puzzle: "Logic Puzzle", decision: "Decision Scenario",
  bias: "Bias Detection", observation: "Observation", boss: "Boss Battle",
};

function questHTML() {
  const quest = MTC.getOrCreateDailyQuest(STATE);
  const hasCore = quest.items.some((i) => i.core);
  return `<div class="panel">
    <h1>Daily Quest</h1>
    <p class="subtle">One of each type &middot; 20&ndash;30 min &middot; ${quest.completed.length}/${quest.items.length} done.${hasCore ? ` Short on time? Do the <span style="color:var(--accent)">&#9733; core</span> three.` : ""}</p>
  </div>
  <div class="grid">
    ${quest.items.map((item) => {
      const ex = MTC.getExercise(item.exerciseId);
      const done = quest.completed.includes(item.exerciseId);
      return `<a class="card ${done ? "done" : ""}" href="#/exercise/${ex.id}">
        <span class="tag">${TYPE_LABELS[item.type]}</span>${item.core ? `<span class="tag core">&#9733; Core</span>` : ""}
        <h2>${esc(ex.title)}</h2>
        <p class="subtle">${frameworkNames(ex.frameworks)}</p>
        <span class="cta">${done ? "Review" : "Start"} &rarr;</span>
      </a>`;
    }).join("")}
  </div>`;
}

/* ---------- Exercise player ---------- */

function exerciseHTML(id) {
  const ex = MTC.getExercise(id);
  if (!ex) return `<div class="panel">Exercise not found. <a class="btn" href="#/quest">Daily Quest</a></div>`;
  const quest = MTC.getOrCreateDailyQuest(STATE);
  const alreadyDone = quest.completed.includes(id);
  const fwNames = frameworkNames(ex.frameworks);

  const header = `<div class="panel">
    <a class="crumb" href="#/quest">&larr; Daily Quest</a>
    <div><span class="pill">${TYPE_LABELS[ex.type]}</span><span class="pill">${fwNames}</span></div>
    <h1>${esc(ex.title)}</h1>
    <p>${esc(ex.prompt)}</p>
  </div>`;

  if (alreadyDone) {
    const record = MTC.lastRecordFor(STATE, id);
    return header + `<div class="panel">
      <p class="subtle">Completed today${record ? ` &mdash; self-assessed ${record.score}%, +${record.xp} XP` : ""}.</p>
      ${record && record.answer ? `<div class="model-answer"><div class="lbl">Your Answer</div><div class="journal-answer">${esc(record.answer)}</div></div>` : ""}
      <div class="model-answer"><div class="lbl">Model Answer</div>${esc(ex.modelAnswer)}</div>
      <div class="model-answer"><div class="lbl">Expert Note</div>${esc(ex.expertNote)}</div>
      <div class="field"><a class="btn" href="#/quest">Back to Daily Quest</a></div>
    </div>`;
  }

  if (!exUI || exUI.exerciseId !== id) {
    exUI = { exerciseId: id, hintsRevealed: 0, checked: new Set(), showAssessment: false, draft: "" };
  }

  const hintsHTML = ex.hints.slice(0, exUI.hintsRevealed).map((h) => `<div class="hint-box">${esc(h)}</div>`).join("");
  const hintBtn = exUI.hintsRevealed < ex.hints.length
    ? `<button class="btn ghost" data-hint>Show a hint (&minus;20% XP &middot; ${exUI.hintsRevealed}/${ex.hints.length} used)</button>`
    : `<p class="subtle">All hints revealed.</p>`;

  let assessmentHTML = "";
  if (!exUI.showAssessment) {
    assessmentHTML = `<div class="field"><button class="btn" data-show-assessment>Done &mdash; reveal model answer</button></div>`;
  } else {
    const total = ex.rubric.length;
    const checkedCount = exUI.checked.size;
    const scorePreview = MTC.rubricScore(checkedCount, total);
    assessmentHTML = `
      <div class="panel">
        <h2>Self-Assessment</h2>
        <p class="subtle">Check what you actually did &mdash; it sets your XP.</p>
        ${ex.rubric.map((r, i) => `<label class="rubric-item"><input type="checkbox" data-rubric-idx="${i}" ${exUI.checked.has(i) ? "checked" : ""}/> <span>${esc(r)}</span></label>`).join("")}
        <div class="model-answer"><div class="lbl">Model Answer</div>${esc(ex.modelAnswer)}</div>
        <div class="model-answer"><div class="lbl">Expert Note</div>${esc(ex.expertNote)}</div>
        <p style="margin-top:12px">Self-assessed score: <b>${scorePreview}%</b> (${checkedCount}/${total} criteria) &middot; est. XP: <b>${MTC.estimateXp(ex.xpBase, scorePreview, exUI.hintsRevealed)}</b></p>
        <button class="btn" data-submit-exercise>Submit</button>
      </div>`;
  }

  return header + `<div class="panel">
    <textarea id="ex-draft" placeholder="Write your answer &mdash; saved to your journal on submit.">${esc(exUI.draft)}</textarea>
    <div class="field">${hintBtn}</div>
    ${hintsHTML}
  </div>${assessmentHTML}`;
}

/* ---------- Boss Battle ---------- */

function bossHTML() {
  const battleState = MTC.getCurrentBossBattle(STATE);
  const battle = MTC.getBossBattleDef(battleState.battleId);

  if (battleState.completed) {
    const record = MTC.lastRecordFor(STATE, battle.id, "boss");
    return `<div class="panel">
      <span class="pill">${esc(battle.domain)}</span>
      <h1>${esc(battle.name)}</h1>
      <p>${esc(battle.briefing)}</p>
      ${record && record.answer ? `<div class="model-answer"><div class="lbl">Your Answer</div><div class="journal-answer">${esc(record.answer)}</div></div>` : ""}
      <div class="model-answer"><div class="lbl">Expert Framing</div>${esc(battle.noPerfectAnswerNote)}</div>
      <p class="subtle" style="margin-top:12px">Boss defeated this week. A new battle unlocks next week.</p>
    </div>`;
  }

  if (!bossUI || bossUI.battleId !== battle.id) {
    bossUI = { battleId: battle.id, hintsShown: new Set(), checked: new Set(), showResolution: false, draft: "" };
  }
  const rubric = battle.rubric;

  const stagesHTML = battle.stages.map((s, i) => `
    <div class="stage">
      <h2>Stage ${i + 1}</h2>
      <p>${esc(s.question)}</p>
      ${bossUI.hintsShown.has(i)
        ? `<div class="hint-box">${esc(s.considerations)}</div>`
        : `<button class="btn ghost" data-boss-hint="${i}">Show considerations</button>`}
    </div>`).join("");

  let resolutionHTML = "";
  if (!bossUI.showResolution) {
    resolutionHTML = `<div class="field"><button class="btn" data-boss-show-resolution>Done &mdash; reveal expert framing</button></div>`;
  } else {
    const total = rubric.length;
    const checkedCount = bossUI.checked.size;
    const scorePreview = MTC.rubricScore(checkedCount, total);
    resolutionHTML = `<div class="panel">
      <h2>Self-Assessment</h2>
      ${rubric.map((r, i) => `<label class="rubric-item"><input type="checkbox" data-boss-rubric-idx="${i}" ${bossUI.checked.has(i) ? "checked" : ""}/> <span>${esc(r)}</span></label>`).join("")}
      <div class="model-answer"><div class="lbl">Expert Framing (no perfect answer)</div>${esc(battle.noPerfectAnswerNote)}</div>
      <p style="margin-top:12px">Self-assessed score: <b>${scorePreview}%</b> &middot; est. XP: <b>${MTC.estimateXp(battle.xpBase, scorePreview, 0)}</b></p>
      <button class="btn" data-submit-boss="${battle.id}">Submit</button>
    </div>`;
  }

  return `<div class="panel">
    <span class="pill">${esc(battle.domain)}</span><span class="pill">Week ${esc(battleState.week)}</span>
    <h1>${esc(battle.name)}</h1>
    <p>${esc(battle.briefing)}</p>
    ${stagesHTML}
  </div>
  <div class="panel">
    <textarea id="boss-draft" placeholder="Work through your reasoning &mdash; saved to your journal on submit.">${esc(bossUI.draft)}</textarea>
    ${resolutionHTML}
  </div>`;
}

/* ---------- Toolbox ---------- */

function toolboxResultsHTML() {
  const q = toolboxFilter.toLowerCase();
  const items = MTC_TOOLBOX.filter((t) => !q || t.name.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q));
  return items.map((t) => `<div class="panel"><h2>${esc(t.name)}</h2><p>${esc(t.summary)}</p><p class="subtle"><b>When:</b> ${esc(t.when)}</p></div>`).join("") || `<p class="subtle">No tools match.</p>`;
}

function toolboxHTML() {
  return `<div class="panel">
    <h1>Toolbox</h1>
    <input type="text" id="toolbox-search" placeholder="Search tools..." value="${esc(toolboxFilter)}" />
  </div>
  <div class="grid" id="toolbox-results">${toolboxResultsHTML()}</div>`;
}

/* ---------- Framework encyclopedia ---------- */

function frameworksResultsHTML() {
  const q = frameworksFilter.toLowerCase();
  const items = MTC_FRAMEWORKS.filter((f) => !q || f.name.toLowerCase().includes(q) || f.core.toLowerCase().includes(q));
  return items.map((f) => `<a class="card panel" href="#/frameworks/${f.id}"><h2>${esc(f.name)}</h2><p class="subtle">${esc(f.core)}</p><span class="cta">Read &rarr;</span></a>`).join("") || `<p class="subtle">No frameworks match.</p>`;
}

function frameworksListHTML() {
  return `<div class="panel">
    <h1>Frameworks</h1>
    <input type="text" id="frameworks-search" placeholder="Search frameworks..." value="${esc(frameworksFilter)}" />
  </div>
  <div class="grid" id="frameworks-results">${frameworksResultsHTML()}</div>`;
}

function frameworkDetailHTML(id) {
  const f = MTC_FRAMEWORKS.find((x) => x.id === id);
  if (!f) return `<div class="panel">Not found. <a class="btn" href="#/frameworks">Frameworks</a></div>`;
  const row = (label, val) => `<div class="panel"><h2>${label}</h2><p>${esc(val)}</p></div>`;
  return `<div class="panel">
      <a class="crumb" href="#/frameworks">&larr; Frameworks</a>
      <h1>${esc(f.name)}</h1>
      <p class="subtle">${esc(f.core)}</p>
    </div>
    ${row("What problem does this solve?", f.problem)}
    ${row("Why do smart people get this wrong?", f.whyWrong)}
    ${row("Mistakes to avoid", f.avoid)}
    ${row("When is this dangerous?", f.danger)}
    ${row("Famous example", f.example)}
    ${row("How an expert uses it", f.expertUse)}`;
}

/* ---------- Achievements ---------- */

function achievementsHTML() {
  return `<div class="panel">
    <h1>Achievements</h1>
    <p class="subtle">${STATE.achievements.length} / ${MTC_ACHIEVEMENTS.length} unlocked</p>
  </div>
  <div class="grid tight">
    ${MTC_ACHIEVEMENTS.map((a) => {
      const unlocked = STATE.achievements.includes(a.id);
      return `<div class="panel ach-card ${unlocked ? "" : "locked"}">
        <h2>${unlocked ? "&#127942; " : "&#128274; "}${esc(a.name)}</h2>
        <p class="subtle">${esc(a.desc)}</p>
        <p class="xp">+${a.xp} XP</p>
      </div>`;
    }).join("")}
  </div>`;
}

/* ---------- Journal ---------- */

function journalHTML() {
  const entries = STATE.history.slice(-100).reverse();
  const header = `<div class="panel">
    <h1>Journal</h1>
    <p class="subtle">Your answers, newest first.</p>
  </div>`;
  if (entries.length === 0) {
    return header + `<div class="panel"><p class="subtle">Complete an exercise and your answer will appear here.</p></div>`;
  }
  return header + entries.map((h) => {
    const isBoss = h.type === "boss";
    const def = isBoss ? MTC.getBossBattleDef(h.exerciseId) : MTC.getExercise(h.exerciseId);
    const title = def ? (isBoss ? def.name : def.title) : h.exerciseId;
    return `<div class="panel">
      <span class="pill">${TYPE_LABELS[h.type] || esc(h.type)}</span><span class="pill">${esc(h.date)}</span>
      <h2>${esc(title)}</h2>
      <p class="subtle">Self-assessed ${h.score}% &middot; +${h.xp} XP${h.hintsUsed ? ` &middot; ${h.hintsUsed} hint${h.hintsUsed === 1 ? "" : "s"} used` : ""}</p>
      ${h.answer ? `<div class="journal-answer">${esc(h.answer)}</div>` : `<p class="subtle">(no written answer was saved with this entry)</p>`}
    </div>`;
  }).join("");
}

/* ---------- Result toast ---------- */

function resultToastHTML(result) {
  return `<div class="toast-overlay">
    <div class="toast-card">
      <div class="subtle">Exercise complete</div>
      <div class="xp-gain">+${result.xpAwarded} XP</div>
      ${result.leveledUp ? `<p>&#127881; Level up! You're now <b>Level ${result.newLevel}</b> &mdash; ${esc(MTC.titleForLevel(result.newLevel))}</p>` : ""}
      ${result.achievementsUnlocked.length ? result.achievementsUnlocked.map((a) => `<div class="unlock">&#127942; Achievement unlocked: <b>${esc(a.name)}</b> (+${a.xp} XP)</div>`).join("") : ""}
      <div class="field"><button class="btn" data-dismiss-result>Continue</button></div>
    </div>
  </div>`;
}

/* ---------- Main render ---------- */

function render() {
  const app = document.getElementById("app");
  if (!STATE.name) {
    app.innerHTML = onboardingHTML();
    return;
  }
  const r = route();
  let body;
  if (r === "dashboard") body = dashboardHTML();
  else if (r === "quest") body = questHTML();
  else if (r.startsWith("exercise/")) body = exerciseHTML(r.split("/")[1]);
  else if (r === "boss") body = bossHTML();
  else if (r === "journal") body = journalHTML();
  else if (r === "toolbox") body = toolboxHTML();
  else if (r === "frameworks") body = frameworksListHTML();
  else if (r.startsWith("frameworks/")) body = frameworkDetailHTML(r.split("/")[1]);
  else if (r === "achievements") body = achievementsHTML();
  else body = dashboardHTML();

  app.innerHTML = navHTML() + body + footerHTML();
  if (pendingResult) app.insertAdjacentHTML("beforeend", resultToastHTML(pendingResult));
}

/* ---------- Events ---------- */

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-hint]")) {
    const ex = MTC.getExercise(exUI.exerciseId);
    exUI.hintsRevealed = Math.min(ex.hints.length, exUI.hintsRevealed + 1);
    render();
    return;
  }

  if (e.target.closest("[data-show-assessment]")) { exUI.showAssessment = true; render(); return; }

  if (e.target.closest("[data-submit-exercise]")) {
    const ex = MTC.getExercise(exUI.exerciseId);
    const score = MTC.rubricScore(exUI.checked.size, ex.rubric.length);
    const result = MTC.submitExercise(STATE, exUI.exerciseId, score, exUI.hintsRevealed, exUI.draft);
    pendingResult = result;
    exUI = null;
    render();
    return;
  }

  if (e.target.closest("[data-boss-hint]")) {
    const idx = Number(e.target.closest("[data-boss-hint]").dataset.bossHint);
    bossUI.hintsShown.add(idx);
    render();
    return;
  }

  if (e.target.closest("[data-boss-show-resolution]")) { bossUI.showResolution = true; render(); return; }

  const submitBoss = e.target.closest("[data-submit-boss]");
  if (submitBoss) {
    const battleId = submitBoss.dataset.submitBoss;
    const rubric = MTC.getBossBattleDef(battleId).rubric;
    const score = MTC.rubricScore(bossUI.checked.size, rubric.length);
    const result = MTC.submitBossBattle(STATE, battleId, score, bossUI.draft);
    pendingResult = result;
    bossUI = null;
    render();
    return;
  }

  if (e.target.closest("[data-dismiss-result]")) {
    pendingResult = null;
    const cur = route();
    const target = cur.startsWith("exercise/") ? "quest" : cur;
    if (target !== cur) navigate(target); else render();
    return;
  }

  if (e.target.closest("[data-export-progress]")) {
    const blob = new Blob([MTC.exportStateJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `thinking-coach-progress-${MTC.todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }

  if (e.target.closest("[data-import-progress]")) {
    document.getElementById("import-file").click();
    return;
  }

  if (e.target.closest("[data-reset-progress]")) {
    if (confirm("This will permanently erase all progress on this device. Continue?")) {
      localStorage.removeItem("mtc_state_v1");
      location.hash = "#/dashboard";
      location.reload();
    }
    return;
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "import-file") {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    file.text().then((text) => {
      if (!confirm("Importing will replace ALL progress on this device with the file's progress. Continue?")) return;
      try {
        STATE = MTC.importState(text);
        exUI = null;
        bossUI = null;
        pendingResult = null;
        render();
      } catch (err) {
        alert("That file doesn't look like a Thinking Coach progress export.");
      }
    });
    return;
  }
  if (e.target.matches("[data-rubric-idx]")) {
    const idx = Number(e.target.dataset.rubricIdx);
    if (e.target.checked) exUI.checked.add(idx); else exUI.checked.delete(idx);
    render();
  }
  if (e.target.matches("[data-boss-rubric-idx]")) {
    const idx = Number(e.target.dataset.bossRubricIdx);
    if (e.target.checked) bossUI.checked.add(idx); else bossUI.checked.delete(idx);
    render();
  }
});

document.addEventListener("input", (e) => {
  if (e.target.id === "ex-draft") { if (exUI) exUI.draft = e.target.value; return; }
  if (e.target.id === "boss-draft") { if (bossUI) bossUI.draft = e.target.value; return; }
  if (e.target.id === "toolbox-search") {
    toolboxFilter = e.target.value;
    document.getElementById("toolbox-results").innerHTML = toolboxResultsHTML();
  } else if (e.target.id === "frameworks-search") {
    frameworksFilter = e.target.value;
    document.getElementById("frameworks-results").innerHTML = frameworksResultsHTML();
  }
});

document.addEventListener("submit", (e) => {
  if (e.target.matches("[data-onboard-form]")) {
    e.preventDefault();
    const name = new FormData(e.target).get("playerName");
    STATE.name = (name && name.trim()) || "Thinker";
    MTC.saveState(STATE);
    render();
  }
});

window.addEventListener("hashchange", render);
// STATE is cached in memory; pick up writes from other tabs.
window.addEventListener("storage", (e) => {
  if (e.key === "mtc_state_v1") {
    STATE = MTC.loadState();
    render();
  }
});
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#/dashboard";
  render();
});
