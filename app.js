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
  const active = route() === key || route().startsWith(key + "/");
  return `<button data-nav="${key}" class="${active ? "active" : ""}">${label}</button>`;
}

function navHTML() {
  const li = levelInfo();
  return `<div class="topnav">
    <div class="brand"><span class="mark">&#9670;</span> Master Thinking Coach</div>
    <div class="navlinks">
      ${navBtn("dashboard", "Dashboard")}
      ${navBtn("quest", "Daily Quest")}
      ${navBtn("boss", "Boss Battle")}
      ${navBtn("toolbox", "Toolbox")}
      ${navBtn("frameworks", "Frameworks")}
      ${navBtn("achievements", "Achievements")}
    </div>
    <div class="status-chip">Lv <b>${li.level}</b> &middot; ${esc(li.title)} ${STATE.streak > 0 ? `&middot; &#128293;${STATE.streak}` : ""}</div>
  </div>`;
}

function footerHTML() {
  return `<footer class="foot">
    Local &amp; private &mdash; your progress lives only in this browser's storage.
    &middot; <button data-reset-progress>Reset all progress</button>
  </footer>`;
}

/* ---------- Onboarding ---------- */

function onboardingHTML() {
  return `<div class="onboarding">
    <h1>Master Thinking Coach</h1>
    <p>A long-term training program to help you think like an intelligence analyst, strategist, inventor, scientist, entrepreneur, and philosopher &mdash; combined. Daily quests, a thinking-frameworks encyclopedia, achievements, and weekly boss battles with no perfect answer.</p>
    <form data-onboard-form>
      <input type="text" name="playerName" placeholder="What should we call you?" maxlength="40" autofocus />
      <div class="field"><button class="btn" type="submit">Begin Training</button></div>
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
      <div class="level-badge" style="--pct:${li.pct}%"><div class="inner"><div class="num">${li.level}</div><div class="lbl">LVL</div></div></div>
      <div style="flex:1">
        <h2>${esc(li.title)}</h2>
        <div class="subtle">${li.xpIntoLevel} / ${li.xpForNext} XP to next level</div>
        <div class="xp-bar"><div class="fill" style="width:${li.pct}%"></div></div>
      </div>
    </div>
  </div>

  <div class="grid">
    <div class="panel card" data-nav="quest">
      <span class="tag">Today</span>
      <h3>Daily Quest</h3>
      <p class="subtle">${quest.completed.length} / ${quest.items.length} exercises done</p>
      <button class="btn">Continue &rarr;</button>
    </div>
    <div class="panel card" data-nav="boss">
      <span class="tag">This week</span>
      <h3>${battleState.completed ? "Boss Defeated" : "Boss Battle"}</h3>
      <p class="subtle">${battleState.completed ? "Come back next week for a new one." : esc(battle.name)}</p>
      <button class="btn secondary">${battleState.completed ? "Review" : "Enter Battle"} &rarr;</button>
    </div>
    <div class="panel card" data-nav="achievements">
      <span class="tag">Progress</span>
      <h3>Achievements</h3>
      <p class="subtle">${STATE.achievements.length} / ${MTC_ACHIEVEMENTS.length} unlocked</p>
      <button class="btn secondary">View &rarr;</button>
    </div>
  </div>

  <div class="panel">
    <h3>Weakness Radar</h3>
    ${weak.length === 0
      ? `<p class="subtle">Complete a few exercises to reveal where your thinking is weakest &mdash; the daily quest will start favoring those.</p>`
      : weak.map((w) => `<div class="weak-row"><span class="name">${esc(w.name)}</span><div class="weak-meter"><div class="fill" style="width:${Math.round(w.avg)}%"></div></div><span class="subtle">${Math.round(w.avg)}%</span></div>`).join("")}
  </div>

  <div class="grid tight">
    <div class="panel card" data-nav="toolbox"><h3>Thinking Toolbox</h3><p class="subtle">${MTC_TOOLBOX.length} quick-reference tools</p></div>
    <div class="panel card" data-nav="frameworks"><h3>Framework Encyclopedia</h3><p class="subtle">${MTC_FRAMEWORKS.length} thinking styles, deep-dived</p></div>
  </div>`;
}

/* ---------- Daily Quest ---------- */

const TYPE_LABELS = {
  warmup: "Warm-up", challenge: "Challenge", case: "Real-World Case", reflection: "Reflection",
  creativity: "Creativity", logic_puzzle: "Logic Puzzle", decision: "Decision Scenario",
  bias: "Bias Detection", observation: "Observation",
};

function questHTML() {
  const quest = MTC.getOrCreateDailyQuest(STATE);
  return `<div class="panel">
    <h2>Today's Thinking Quest</h2>
    <p class="subtle">Nine exercises, one of each type. About 20&ndash;30 minutes total. ${quest.completed.length}/${quest.items.length} done.</p>
  </div>
  <div class="grid">
    ${quest.items.map((item) => {
      const ex = MTC.getExercise(item.exerciseId);
      const done = quest.completed.includes(item.exerciseId);
      return `<div class="card ${done ? "done" : ""}" data-start-exercise="${ex.id}">
        <span class="tag">${TYPE_LABELS[item.type]}</span>
        <h3>${esc(ex.title)}</h3>
        <p class="subtle">${ex.frameworks.map((f) => (MTC_FRAMEWORKS.find((fw) => fw.id === f) || {}).name).filter(Boolean).join(" &middot; ")}</p>
      </div>`;
    }).join("")}
  </div>`;
}

/* ---------- Exercise player ---------- */

function exerciseHTML(id) {
  const ex = MTC.getExercise(id);
  if (!ex) return `<div class="panel">Exercise not found. <button class="btn" data-nav="quest">Back to Quest</button></div>`;
  const quest = MTC.getOrCreateDailyQuest(STATE);
  const alreadyDone = quest.completed.includes(id);
  const fwNames = ex.frameworks.map((f) => (MTC_FRAMEWORKS.find((fw) => fw.id === f) || {}).name).filter(Boolean).join(" &middot; ");

  const header = `<div class="panel">
    <span class="pill">${TYPE_LABELS[ex.type]}</span><span class="pill">${fwNames}</span>
    <h2>${esc(ex.title)}</h2>
    <p>${esc(ex.prompt)}</p>
  </div>`;

  if (alreadyDone) {
    const record = [...STATE.history].reverse().find((h) => h.exerciseId === id);
    return header + `<div class="panel">
      <p class="subtle">You already completed this today${record ? ` &mdash; self-assessed ${record.score}%, +${record.xp} XP` : ""}.</p>
      <div class="model-answer"><div class="lbl">Model Answer</div>${esc(ex.modelAnswer)}</div>
      <div class="model-answer"><div class="lbl">Expert Note</div>${esc(ex.expertNote)}</div>
      <div class="field"><button class="btn" data-nav="quest">Back to Quest</button></div>
    </div>`;
  }

  if (!exUI || exUI.exerciseId !== id) {
    exUI = { exerciseId: id, hintsRevealed: 0, checked: new Set(), showAssessment: false };
  }

  const hintsHTML = ex.hints.slice(0, exUI.hintsRevealed).map((h) => `<div class="hint-box">${esc(h)}</div>`).join("");
  const hintBtn = exUI.hintsRevealed < ex.hints.length
    ? `<button class="btn ghost" data-hint>Show a hint (${exUI.hintsRevealed}/${ex.hints.length} used)</button>`
    : `<p class="subtle">All hints revealed.</p>`;

  let assessmentHTML = "";
  if (!exUI.showAssessment) {
    assessmentHTML = `<div class="field"><button class="btn" data-show-assessment>I've made my attempt &mdash; reveal model answer &amp; self-assess</button></div>`;
  } else {
    const total = ex.rubric.length;
    const checkedCount = exUI.checked.size;
    const scorePreview = Math.round((checkedCount / total) * 100);
    assessmentHTML = `
      <div class="panel">
        <h3>Self-Assessment</h3>
        <p class="subtle">Honestly check off what you actually did &mdash; this determines your XP for this exercise.</p>
        ${ex.rubric.map((r, i) => `<label class="rubric-item"><input type="checkbox" data-rubric-idx="${i}" ${exUI.checked.has(i) ? "checked" : ""}/> <span>${esc(r)}</span></label>`).join("")}
        <div class="model-answer"><div class="lbl">Model Answer</div>${esc(ex.modelAnswer)}</div>
        <div class="model-answer"><div class="lbl">Expert Note</div>${esc(ex.expertNote)}</div>
        <p style="margin-top:12px">Self-assessed score: <b>${scorePreview}%</b> (${checkedCount}/${total} criteria) &middot; est. XP: <b>${Math.round(ex.xpBase * (scorePreview / 100) * Math.max(0.6, 1 - exUI.hintsRevealed * 0.1))}</b></p>
        <button class="btn" data-submit-exercise>Submit</button>
      </div>`;
  }

  return header + `<div class="panel">
    <textarea placeholder="Jot your own answer here first (this is just for you &mdash; it isn't saved or graded automatically)."></textarea>
    <div class="field">${hintBtn}</div>
    ${hintsHTML}
  </div>${assessmentHTML}`;
}

/* ---------- Boss Battle ---------- */

const BOSS_RUBRIC = [
  "Directly addressed Stage 1's question",
  "Directly addressed Stage 2's question",
  "Directly addressed Stage 3's question",
  "Explicitly named which thinking frameworks I applied",
  "Engaged honestly with the 'no perfect answer' tension instead of picking a falsely clean side",
];

function bossHTML() {
  const battleState = MTC.getCurrentBossBattle(STATE);
  const battle = MTC.getBossBattleDef(battleState.battleId);

  if (battleState.completed) {
    return `<div class="panel">
      <span class="pill">${esc(battle.domain)}</span>
      <h2>${esc(battle.name)}</h2>
      <p>${esc(battle.briefing)}</p>
      <div class="model-answer"><div class="lbl">Expert Framing</div>${esc(battle.noPerfectAnswerNote)}</div>
      <p class="subtle" style="margin-top:12px">Boss defeated this week. A new battle unlocks next week.</p>
    </div>`;
  }

  if (!bossUI || bossUI.battleId !== battle.id) {
    bossUI = { battleId: battle.id, hintsShown: new Set(), checked: new Set(), showResolution: false };
  }

  const stagesHTML = battle.stages.map((s, i) => `
    <div class="stage">
      <h3>Stage ${i + 1}</h3>
      <p>${esc(s.question)}</p>
      ${bossUI.hintsShown.has(i)
        ? `<div class="hint-box">${esc(s.considerations)}</div>`
        : `<button class="btn ghost" data-boss-hint="${i}">Show considerations</button>`}
    </div>`).join("");

  let resolutionHTML = "";
  if (!bossUI.showResolution) {
    resolutionHTML = `<div class="field"><button class="btn" data-boss-show-resolution>I've worked through all three stages &mdash; reveal expert framing &amp; self-assess</button></div>`;
  } else {
    const total = BOSS_RUBRIC.length;
    const checkedCount = bossUI.checked.size;
    const scorePreview = Math.round((checkedCount / total) * 100);
    resolutionHTML = `<div class="panel">
      <h3>Self-Assessment</h3>
      ${BOSS_RUBRIC.map((r, i) => `<label class="rubric-item"><input type="checkbox" data-boss-rubric-idx="${i}" ${bossUI.checked.has(i) ? "checked" : ""}/> <span>${esc(r)}</span></label>`).join("")}
      <div class="model-answer"><div class="lbl">Expert Framing (no perfect answer)</div>${esc(battle.noPerfectAnswerNote)}</div>
      <p style="margin-top:12px">Self-assessed score: <b>${scorePreview}%</b> &middot; est. XP: <b>${Math.round(battle.xpBase * (scorePreview / 100))}</b></p>
      <button class="btn" data-submit-boss="${battle.id}">Submit</button>
    </div>`;
  }

  return `<div class="panel">
    <span class="pill">${esc(battle.domain)}</span><span class="pill">Week ${esc(battleState.week)}</span>
    <h2>${esc(battle.name)}</h2>
    <p>${esc(battle.briefing)}</p>
    ${stagesHTML}
  </div>
  <div class="panel">
    <textarea placeholder="Work through your reasoning here (this is just for you)."></textarea>
    ${resolutionHTML}
  </div>`;
}

/* ---------- Toolbox ---------- */

function toolboxHTML() {
  const q = toolboxFilter.toLowerCase();
  const items = MTC_TOOLBOX.filter((t) => !q || t.name.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q));
  return `<div class="panel">
    <h2>Thinking Toolbox</h2>
    <input type="text" id="toolbox-search" placeholder="Search tools..." value="${esc(toolboxFilter)}" />
  </div>
  <div class="grid">
    ${items.map((t) => `<div class="panel"><h3>${esc(t.name)}</h3><p>${esc(t.summary)}</p><p class="subtle"><b>When:</b> ${esc(t.when)}</p></div>`).join("") || `<p class="subtle">No tools match.</p>`}
  </div>`;
}

/* ---------- Framework encyclopedia ---------- */

function frameworksListHTML() {
  const q = frameworksFilter.toLowerCase();
  const items = MTC_FRAMEWORKS.filter((f) => !q || f.name.toLowerCase().includes(q) || f.core.toLowerCase().includes(q));
  return `<div class="panel">
    <h2>Framework Encyclopedia</h2>
    <input type="text" id="frameworks-search" placeholder="Search frameworks..." value="${esc(frameworksFilter)}" />
  </div>
  <div class="grid">
    ${items.map((f) => `<div class="card panel" data-nav="frameworks/${f.id}"><h3>${esc(f.name)}</h3><p class="subtle">${esc(f.core)}</p></div>`).join("") || `<p class="subtle">No frameworks match.</p>`}
  </div>`;
}

function frameworkDetailHTML(id) {
  const f = MTC_FRAMEWORKS.find((x) => x.id === id);
  if (!f) return `<div class="panel">Not found. <button class="btn" data-nav="frameworks">Back</button></div>`;
  const row = (label, val) => `<div class="panel"><h3>${label}</h3><p>${esc(val)}</p></div>`;
  return `<div class="panel">
      <button class="btn ghost" data-nav="frameworks">&larr; All frameworks</button>
      <h2 style="margin-top:10px">${esc(f.name)}</h2>
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
    <h2>Achievements</h2>
    <p class="subtle">${STATE.achievements.length} / ${MTC_ACHIEVEMENTS.length} unlocked</p>
  </div>
  <div class="grid tight">
    ${MTC_ACHIEVEMENTS.map((a) => {
      const unlocked = STATE.achievements.includes(a.id);
      return `<div class="panel ach-card ${unlocked ? "" : "locked"}">
        <h3>${unlocked ? "&#127942; " : "&#128274; "}${esc(a.name)}</h3>
        <p class="subtle">${esc(a.desc)}</p>
        <p class="xp">+${a.xp} XP</p>
      </div>`;
    }).join("")}
  </div>`;
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
  STATE = MTC.loadState();
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
  else if (r === "toolbox") body = toolboxHTML();
  else if (r === "frameworks") body = frameworksListHTML();
  else if (r.startsWith("frameworks/")) body = frameworkDetailHTML(r.split("/")[1]);
  else if (r === "achievements") body = achievementsHTML();
  else body = dashboardHTML();

  app.innerHTML = navHTML() + body + footerHTML();
  if (pendingResult) app.insertAdjacentHTML("beforeend", resultToastHTML(pendingResult));
}

function refocus(id) {
  const el = document.getElementById(id);
  if (el) {
    el.focus();
    const v = el.value;
    el.value = "";
    el.value = v;
  }
}

/* ---------- Events ---------- */

document.addEventListener("click", (e) => {
  const navEl = e.target.closest("[data-nav]");
  if (navEl) { navigate(navEl.dataset.nav); return; }

  const startEx = e.target.closest("[data-start-exercise]");
  if (startEx) { navigate("exercise/" + startEx.dataset.startExercise); return; }

  if (e.target.closest("[data-hint]")) {
    const ex = MTC.getExercise(exUI.exerciseId);
    exUI.hintsRevealed = Math.min(ex.hints.length, exUI.hintsRevealed + 1);
    render();
    return;
  }

  if (e.target.closest("[data-show-assessment]")) { exUI.showAssessment = true; render(); return; }

  if (e.target.closest("[data-submit-exercise]")) {
    const ex = MTC.getExercise(exUI.exerciseId);
    const score = Math.round((exUI.checked.size / ex.rubric.length) * 100);
    const result = MTC.submitExercise(STATE, exUI.exerciseId, score, exUI.hintsRevealed);
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
    const score = Math.round((bossUI.checked.size / BOSS_RUBRIC.length) * 100);
    const result = MTC.submitBossBattle(STATE, battleId, score);
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
  if (e.target.id === "toolbox-search") { toolboxFilter = e.target.value; render(); refocus("toolbox-search"); }
  else if (e.target.id === "frameworks-search") { frameworksFilter = e.target.value; render(); refocus("frameworks-search"); }
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
window.addEventListener("DOMContentLoaded", () => {
  if (!location.hash) location.hash = "#/dashboard";
  render();
});
