/* Master Thinking Coach — UI layer. Renders from MTC engine state into #app. */

let STATE = MTC.loadState();
let exUI = null; // {exerciseId, hintsRevealed, checked:Set, showAssessment}
let bossUI = null; // {battleId, hintsShown:Set, checked:Set, showResolution}
let pendingResult = null;
let calUI = null; // {queue, idx, responses, results}
let revUI = null; // {queue, idx, revealed, xp, count}
let toolboxFilter = "";
let frameworksFilter = "";
let journalFilter = "";
let gymAreaFilter = "all";
let gymLevelFilter = "all";
let gymTimeFilter = "all";
let lastRenderedRoute = null;
// Challenge id whose guide was just read. Marking a guide seen and returning to the
// challenge would otherwise re-enter the redirect below and hand over the second
// guide immediately, which is the stacking this is meant to prevent.
let guideJustShownFor = null;

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let activeRec = null;

const OUTLINES = {
  warmup: "First instinct:\n\nAlternative explanations:\n- ",
  challenge: "First-order effect:\n\nSecond-order effects:\n- \n\nWhat would change my mind:\n",
  case: "What happened, step by step:\n\nWhy it seemed sensible at the time:\n\nWhat I can learn from it:\n",
  reflection: "The specific case:\n\nWhat it shows about my thinking:\n\nWhat I'd do differently:\n",
  creativity: "Ideas (no judging yet):\n1. \n2. \n3. \n\nBest one and why:\n",
  logic_puzzle: "Given facts:\n\nStep by step:\n\nAnswer:\n",
  decision: "Options:\n- \nCriteria:\n- \nDecision and why:\n\nWhat would change my mind:\n",
  bias: "The bias:\n\nHow it operates here:\n\nThe fix:\n",
  observation: "What it claims:\n\nWhat's missing:\n\nWhat I'd check:\n",
};

const BOSS_OUTLINE = "The system and its loops:\n\nOptions and trade-offs:\n\nMy decision:\n\nPre-mortem (two most likely failure modes):\n1. \n2. \n\nLeading indicators to watch:\n";

const CHANGE_MIND_TYPES = ["challenge", "case", "decision", "bias", "observation"];

const BOSS_FINAL_STAGE = {
  question: "Commit to a decision. Pre-mortem its two most likely failure modes, and name the leading indicators that would tell you within weeks that you chose wrong.",
  considerations: "A decision without a monitoring plan is a bet you'll never learn from. Good leading indicators are observable soon, not at the post-mortem. If you can't name a failure mode, you haven't red-teamed your own choice yet.",
};
const BOSS_MONITOR_RUBRIC = "I committed to ONE decision, wrote the two most likely ways it fails, and named early signs that would tell me I chose wrong";

let wbUI = null; // {toolId, draft}

// Passive nudge: vague outcome-phrases that hide the mechanism.
const VAGUE_RE = /(turned out bad|went wrong|didn'?t work( out)?|it was bad|wasn'?t great|people were (unhappy|upset|angry)|bad fit|too much pressure|not good enough|poor performance|things went south|fell apart)/i;

function vagueTipHTML() {
  return `<p class="subtle nudge" data-vague-tip style="display:none"></p>`;
}

function checkVague(text) {
  const tip = document.querySelector("[data-vague-tip]");
  if (!tip) return;
  const m = text.match(VAGUE_RE);
  if (m) {
    tip.textContent = `"${m[0]}" tells us the result, but not how it happened. Can you say who did what differently?`;
    tip.style.display = "";
  } else {
    tip.style.display = "none";
  }
}

// Cutting at a fixed character count chops mid-word ("The Vaccine Rollou"), which
// reads as a rendering fault rather than a shortened title. Break on a word instead
// and mark the cut.
function truncateWords(text, max) {
  const s = String(text);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[,;:]$/, "") + "…";
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function frameworkNames(ids) {
  return ids.map((id) => (MTC_SKILL_CATALOG.find((skill) => skill.id === id) || {}).name).filter(Boolean).join(" &middot; ");
}

function route() {
  const h = location.hash || "#/dashboard";
  return h.slice(2) || "dashboard";
}

function navigate(path) {
  location.hash = "#/" + path;
}

const GYM_MINUTES = { flaw: 3, signal: 4, chain: 4, triage: 4, ask: 5, workout: 5, map: 6 };
const GYM_LEVELS = { 1: "Beginner", 2: "Everyday", 3: "Stretch" };

function lifeArea(id) {
  return MTC_GYM_LIFE_AREAS.find((area) => area.id === id) || null;
}

function challengeMinutes(challenge) {
  return GYM_MINUTES[challenge.format] || 5;
}

function challengeMatchesBrowseFilters(challenge, fixedArea) {
  const area = fixedArea || gymAreaFilter;
  if (area !== "all" && !challenge.lifeAreas.includes(area)) return false;
  if (gymLevelFilter !== "all" && challenge.difficulty !== Number(gymLevelFilter)) return false;
  const minutes = challengeMinutes(challenge);
  if (gymTimeFilter === "quick" && minutes > 4) return false;
  if (gymTimeFilter === "standard" && minutes <= 4) return false;
  return true;
}

function browseFiltersHTML(options = {}) {
  const showArea = options.showArea !== false;
  return `<div class="browse-filters" aria-label="Filter challenges">
    ${showArea ? `<label>Life area
      <select id="gym-area-filter">
        <option value="all">All life areas</option>
        ${MTC_GYM_LIFE_AREAS.map((area) => `<option value="${area.id}" ${gymAreaFilter === area.id ? "selected" : ""}>${area.emoji} ${esc(area.name)}</option>`).join("")}
      </select>
    </label>` : ""}
    <label>Level
      <select id="gym-level-filter">
        <option value="all">All levels</option>
        ${Object.entries(GYM_LEVELS).map(([value, label]) => `<option value="${value}" ${gymLevelFilter === value ? "selected" : ""}>${label}</option>`).join("")}
      </select>
    </label>
    <label>Time
      <select id="gym-time-filter">
        <option value="all">Any length</option>
        <option value="quick" ${gymTimeFilter === "quick" ? "selected" : ""}>About 3–4 min</option>
        <option value="standard" ${gymTimeFilter === "standard" ? "selected" : ""}>About 5–6 min</option>
      </select>
    </label>
  </div>`;
}

function challengeBrowseCardHTML(challenge) {
  const played = STATE.gym[challenge.id];
  const format = MTC_GYM_FORMATS[challenge.format];
  return `<a class="panel card ${played && played.bestScore >= 80 ? "done" : ""}" href="#/gym/play/${challenge.id}">
    <div class="card-tags"><span class="tag">${esc(format.name)}</span><span class="tag neutral">${GYM_LEVELS[challenge.difficulty] || "Everyday"} · ~${challengeMinutes(challenge)} min</span></div>
    <h2>${esc(challenge.title)}</h2>
    <p class="subtle">${esc(challenge.scenario)}</p>
    <span class="cta">${played ? "Play again" : "Start"} &rarr;</span>
  </a>`;
}

// Deep Work and Boss Battle are graded by ticking your own checklist, and their
// points land in the same total as challenges scored against an answer key. That
// is fine as long as the player can see it, otherwise the level quietly stops
// meaning "how well I did" and starts meaning "how generously I ticked".
const SELF_ASSESSED_TYPES = new Set([...MTC_QUEST_TYPES, "boss", "commitment"]);

function selfAssessedNoteHTML() {
  const total = STATE.history.reduce((sum, h) => sum + (h.xp || 0), 0);
  const own = STATE.history.filter((h) => SELF_ASSESSED_TYPES.has(h.type)).reduce((sum, h) => sum + (h.xp || 0), 0);
  if (!own || !total) return "";
  return `<p class="subtle" style="margin-top:8px">${Math.round((own / total) * 100)}% of your points come from written practice you scored yourself. The rest were scored against an answer key.</p>`;
}

function levelInfo() {
  const { level, xpIntoLevel, xpForNext } = MTC.deriveLevel(STATE.totalXp);
  return { level, xpIntoLevel, xpForNext, title: MTC.titleForLevel(level), pct: Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100)) };
}

/* ---------- Layout ---------- */

const TABS = [
  { id: "dashboard", label: "Home", ico: "\u{1F3E0}", owns: ["dashboard"] },
  { id: "gym", label: "Challenges", ico: "\u{1F9E9}", owns: ["gym", "quest", "exercise", "boss", "calibration", "review"] },
  { id: "progress", label: "Progress", ico: "\u{1F4C8}", owns: ["progress", "journal", "report", "used"] },
  { id: "profile", label: "Profile", ico: "\u{1F464}", owns: ["profile", "achievements", "toolbox", "frameworks", "workbench", "guides"] },
];

function activeTab() {
  const head = route().split("/")[0];
  const tab = TABS.find((t) => t.owns.includes(head));
  return tab ? tab.id : "dashboard";
}

function tabbarHTML() {
  const cur = activeTab();
  return `<nav class="tabbar" aria-label="Main navigation">${TABS.map((t) => `
    <a href="#/${t.id}" data-nav="${t.id}" class="${cur === t.id ? "active" : ""}" ${cur === t.id ? 'aria-current="page"' : ""}>
      <span class="ico" aria-hidden="true">${t.ico}</span>${t.label}
    </a>`).join("")}</nav>`;
}

// Screens that are a tab root show the brand; everything else shows a back arrow.
function appbarHTML(title, backTo) {
  const streak = STATE.streak > 0
    ? `<span class="streak-chip">&#128293; ${STATE.streak}</span>`
    : `<span class="streak-chip dim">&#128293; 0</span>`;
  if (backTo === null) {
    return `<header class="appbar"><h1 class="brand"><a href="#/dashboard"><span class="mark" aria-hidden="true">&#9670;</span> ${esc(title)}</a></h1>${streak}</header>`;
  }
  return `<header class="appbar">
    <a class="back" href="#/${backTo}" aria-label="Back">&#8249;</a>
    <h1 class="title">${esc(title)}</h1>${streak}
  </header>`;
}

// title + where the back arrow goes, per route (null = tab root, show brand)
function chromeFor(r) {
  if (r === "dashboard") return ["The Thinking Gym", null];
  if (r === "gym") return ["Challenges", null];
  if (r === "progress") return ["Progress", null];
  if (r === "profile") return ["Profile", null];
  if (r.startsWith("gym/play/")) return ["Today's Challenge", "gym"];
  if (r.startsWith("gym/muscle/") || r.startsWith("gym/track/")) return ["Muscle", "gym"];
  if (r.startsWith("gym/life/")) return ["Real-life challenges", "gym"];
  if (r.startsWith("gym/learn/")) {
    const [, , kind, id, resumeId] = r.split("/");
    const w = MTC.getWalkthrough(kind, id);
    return [w ? w.title : "Guide", resumeId ? "gym" : "guides"];
  }
  if (r === "guides") return ["Thinking Guides", "profile"];
  if (r === "quest") return ["Deep Work", "gym"];
  if (r.startsWith("exercise/")) return ["Exercise", "quest"];
  if (r === "boss") return ["Boss Battle", "gym"];
  if (r === "calibration") return ["Calibration", "gym"];
  if (r === "review") return ["Review", "gym"];
  if (r === "journal") return ["Journal", "progress"];
  if (r === "used") return ["Used in life", "progress"];
  if (r === "report") return ["Weekly Report", "progress"];
  if (r === "achievements") return ["Achievements", "profile"];
  if (r === "toolbox") return ["Toolbox", "profile"];
  if (r === "frameworks") return ["Frameworks", "profile"];
  if (r.startsWith("frameworks/")) return ["Framework", "frameworks"];
  if (r.startsWith("workbench/")) return ["Workbench", "toolbox"];
  return ["The Thinking Gym", null];
}

/* ---------- Onboarding (landing) ---------- */

function onboardingHTML() {
  const feats = [
    ["\u{1F9E9}", "Make everyday choices", "Short challenges about money, work, relationships, scams, health and safety"],
    ["\u{1F517}", "Learn from each answer", "See why an answer works, where it can fail and how to use it tomorrow"],
    ["\u{1F4C8}", "See real improvement", "Track what you are getting better at and what to practise next"],
  ];
  return `<div class="onboarding">
    <div class="logo"><span class="mark">&#9670;</span> The Thinking Gym</div>
    <div class="eyebrow">Your daily thinking practice</div>
    <h1>Think sharper.<br><span class="grad">Ten minutes a day.</span></h1>
    <p class="lede">Practise making clearer decisions in situations you may face at home, online, at work or with other people.</p>
    <div class="trust-row" aria-label="App benefits">
      <span>${MTC_GYM_CHALLENGES.length} challenges</span><span>Works without internet</span><span>No account needed</span>
    </div>
    <form data-onboard-form>
      <label class="onboard-label" for="player-name">What should we call you? <span>Optional</span></label>
      <input id="player-name" type="text" name="playerName" placeholder="Your name" maxlength="40" autocomplete="name" />
      <label class="onboard-label" for="life-focus">What would help most right now? <span>Optional</span></label>
      <select id="life-focus" name="lifeFocus">
        <option value="">A mix of everyday situations</option>
        ${MTC_GYM_LIFE_AREAS.map((area) => {
          const n = MTC.gymChallengesForLifeArea(area.id).length;
          return `<option value="${area.id}">${area.emoji} ${esc(area.name)} (${n})</option>`;
        }).join("")}
      </select>
      <p class="form-help">This shapes your daily mix. You can still browse every challenge.</p>
      <div class="field"><button class="btn block" type="submit">Get started <span aria-hidden="true">&rarr;</span></button></div>
      <p class="form-note">Answers use written answer keys, not AI judgement. Your progress stays on this device.</p>
    </form>
    <div style="margin-top:32px">
      ${feats.map(([i, h, p]) => `<div class="feat"><div class="ico">${i}</div><div><h3>${h}</h3><p>${p}</p></div></div>`).join("")}
    </div>
  </div>`;
}

/* ---------- Dashboard ---------- */

// Muscle emoji come from the data now, so a new muscle needs no change here.
const MUSCLE_ICONS = Object.fromEntries(MTC_MUSCLES.map((m) => [m.id, m.emoji]));
const FORMAT_ICONS = { map: "\u{1F517}", flaw: "\u{1F50D}", chain: "\u26D3\uFE0F", signal: "\u{1F4CA}", workout: "\u{1F9EE}", triage: "\u{1F6A6}", ask: "\u2753" };

function muscleIcon(id) { return MUSCLE_ICONS[id] || "\u{1F9E0}"; }
const trackIcon = muscleIcon; // pre-muscle name, still called from gym.js

// The check-in. This is the whole point of the app's claim to reach real life, so it
// sits above the day's challenges rather than buried: an unanswered one is worth more
// than another challenge played.
function checkInHTML() {
  const due = MTC.dueCommitments(STATE);
  if (!due.length) return "";
  const c = due[0];
  const ch = MTC.getGymChallenge(c.challengeId);
  return `<div class="panel checkin">
    <span class="tag">Your check-in</span>
    <h2>Did you get a chance to use this?</h2>
    <p class="subtle" style="margin-bottom:8px">From ${esc(ch ? ch.title : "an earlier challenge")}, ${esc(c.madeOn === MTC.todayStr() ? "today" : "a few days ago")}.</p>
    <div class="info-panel blue"><div class="lbl">You said you would try</div>${esc(c.tip)}</div>
    <textarea id="checkin-note" placeholder="Where did it come up? (optional)"></textarea>
    <div class="action-row">
      <button class="btn secondary" data-checkin-no="${c.id}">Not yet</button>
      <button class="btn" data-checkin-yes="${c.id}">Yes, I used it</button>
    </div>
  </div>`;
}

function dashboardHTML() {
  const li = levelInfo();
  const session = MTC.gymSession(STATE);
  const muscles = MTC.muscleProgress(STATE);
  const focus = lifeArea(STATE.lifeFocus);
  const done = Object.values(STATE.gym).reduce((t, g) => t + g.plays, 0);
  const today = MTC.todayStr();
  const completedToday = session.filter((c) => STATE.gym[c.id] && STATE.gym[c.id].lastPlayed === today).length;
  const next = session.find((c) => !STATE.gym[c.id] || STATE.gym[c.id].lastPlayed !== today) || session[0];

  const loop = MTC.commitmentStats(STATE);
  return `
  <div class="stat-strip">
    <div class="stat"><div class="ico">&#128293;</div><div class="num">${STATE.streak}</div><div class="lbl">Day Streak</div></div>
    <div class="stat"><div class="ico">&#11088;</div><div class="num">${STATE.totalXp.toLocaleString()}</div><div class="lbl">Total Points</div></div>
    <div class="stat"><div class="ico">&#9989;</div><div class="num">${loop.used}</div><div class="lbl">Used In Life</div></div>
  </div>

  ${checkInHTML()}

  <div class="panel">
    <div class="subtle">${STATE.history.length ? "Welcome back" : "Welcome"}, ${esc(STATE.name)}</div>
    <h1 style="font-size:20px;margin:2px 0 10px">${esc(li.title)}</h1>
    <div class="progress"><div class="fill" style="width:${li.pct}%"></div></div>
    <p class="subtle" style="margin:8px 0 0">${li.xpIntoLevel} of ${li.xpForNext} points to level ${li.level + 1}
      ${STATE.graceShields > 0 ? "&middot; &#128737;&#65039; grace day ready" : ""}</p>
  </div>

  ${next ? `<section class="daily-session" aria-labelledby="daily-session-title">
    <div class="daily-session-head">
      <div><span class="tag">Today's practice${focus ? ` · ${esc(focus.name)}` : ""}</span><h2 id="daily-session-title">${completedToday === session.length ? "Practice complete" : `${session.length - completedToday} challenge${session.length - completedToday === 1 ? "" : "s"} left`}</h2></div>
      <div class="session-count" aria-label="${completedToday} of ${session.length} complete">${completedToday}<span>/${session.length}</span></div>
    </div>
    <div class="session-progress"><span style="width:${session.length ? Math.round(completedToday / session.length * 100) : 0}%"></span></div>
    <div class="session-list">
      ${session.map((challenge, index) => {
        const played = STATE.gym[challenge.id] && STATE.gym[challenge.id].lastPlayed === today;
        return `<a href="#/gym/play/${challenge.id}" class="session-item ${played ? "done" : challenge.id === next.id ? "next" : ""}">
          <span class="session-step">${played ? "&#10003;" : index + 1}</span>
          <span class="session-copy"><b>${esc(challenge.title)}</b><small>${esc(MTC_GYM_FORMATS[challenge.format].name)} &middot; up to ${challenge.xpBase} points</small></span>
          <span class="session-arrow">${played ? "Done" : challenge.id === next.id ? "Start" : "&#8250;"}</span>
        </a>`;
      }).join("")}
    </div>
    <a class="btn block daily-cta" href="#/gym/play/${next.id}">${completedToday === session.length ? "Practice again" : completedToday ? "Continue today's practice" : "Start today's practice"} <span aria-hidden="true">&rarr;</span></a>
  </section>` : ""}

  ${focus ? `<div class="section-head"><h2>Your chosen focus</h2><a href="#/gym">Change</a></div>
  <a class="panel focus-card" href="#/gym/life/${focus.id}"><span class="focus-emoji" aria-hidden="true">${focus.emoji}</span><span><b>${esc(focus.name)}</b><small>${esc(focus.blurb)}</small></span><span class="chev" aria-hidden="true">&#8250;</span></a>` : ""}

  <div class="section-head"><h2>Your muscles</h2><a href="#/gym">View all</a></div>
  <div class="grid tight">
    ${muscles.slice(0, 4).map((t, i) => `<a class="tile t${i % 6}" href="#/gym/muscle/${t.id}">
      <div class="ico">${muscleIcon(t.id)}</div>
      <h3>${esc(t.name)}</h3>
      <div class="meta">${t.mastered}/${t.total} at 80%+</div>
    </a>`).join("")}
  </div>

  <div class="section-head"><h2>Keep going</h2></div>
  <div class="panel">
    <a class="list-row" href="#/gym"><span class="ico">&#129513;</span><span class="label">Browse challenges</span><span class="val">${session.length} today</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/quest"><span class="ico">&#9997;&#65039;</span><span class="label">Deep Work</span><span class="val">written</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/progress"><span class="ico">&#128200;</span><span class="label">Progress</span><span class="chev">&#8250;</span></a>
  </div>`;
}

/* ---------- Challenges tab ---------- */

function challengesHTML() {
  const session = MTC.gymSession(STATE);
  const muscles = MTC.muscleProgress(STATE);
  const replays = MTC.dueGymReplays(STATE).length;
  const quest = MTC.getOrCreateDailyQuest(STATE);
  const battleState = MTC.getCurrentBossBattle(STATE);
  const battle = MTC.getBossBattleDef(battleState.battleId);
  const calStats = MTC.calibrationStats(STATE);
  const review = MTC.reviewCounts(STATE);
  const reviewLabel = review.due ? `${review.due} due` : review.fresh ? `${review.fresh} new` : "up to date";

  return `
  <div class="section-head"><h2>Today's session</h2><span class="subtle">${session.length} challenges &middot; ~10 min</span></div>
  <div class="grid">
    ${session.map((c) => {
      const g = STATE.gym[c.id];
      const fmt = MTC_GYM_FORMATS[c.format];
      return `<a class="card" href="#/gym/play/${c.id}">
        <span class="tag">${FORMAT_ICONS[c.format]} ${esc(fmt.name)}</span>${g ? `<span class="tag core">Replay</span>` : ""}
        <h2>${esc(c.title)}</h2>
        <p class="subtle">${esc(fmt.tagline)}${g ? ` &middot; best ${g.bestScore}%` : ""}</p>
        <span class="cta">${g ? "Play again" : "Start"} &rarr;</span>
      </a>`;
    }).join("")}
  </div>
  ${replays ? `<p class="subtle" style="margin:10px 2px">${replays} challenge${replays === 1 ? " is" : "s are"} due for a replay &mdash; already queued.</p>` : ""}

  <div class="section-head"><h2>Choose a real-life area</h2><span class="subtle">Start with what matters to you</span></div>
  <div class="grid tight life-area-grid">
    ${MTC_GYM_LIFE_AREAS.map((area) => {
      const count = MTC.gymChallengesForLifeArea(area.id).length;
      return `<a class="tile life-area" href="#/gym/life/${area.id}">
        <div class="ico" aria-hidden="true">${area.emoji}</div>
        <h3>${esc(area.name)}</h3>
        <p>${esc(area.blurb)}</p>
        <div class="meta">${count} challenge${count === 1 ? "" : "s"}${STATE.lifeFocus === area.id ? " · in your daily mix" : ""}</div>
      </a>`;
    }).join("")}
  </div>

  <div class="section-head"><h2>Or train a thinking skill</h2><span class="subtle">Six skills used across daily life</span></div>
  <div class="grid tight">
    ${muscles.map((t, i) => `<a class="tile t${i % 6}" href="#/gym/muscle/${t.id}">
      <div class="ico">${muscleIcon(t.id)}</div>
      <h3>${esc(t.name)}</h3>
      <div class="meta">${t.total} challenges &middot; ${t.mastered} at 80%+</div>
    </a>`).join("")}
  </div>

  <div class="section-head"><h2>Other training</h2></div>
  <p class="subtle" style="margin:-4px 0 10px">Written practice. Deep Work and Boss Battle are scored by ticking your own checklist, not against an answer key like the challenges above.</p>
  <div class="panel">
    <a class="list-row" href="#/quest"><span class="ico">&#9997;&#65039;</span><span class="label">Deep Work</span><span class="val">${quest.completed.length}/${quest.items.length}</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/boss"><span class="ico">&#128121;</span><span class="label">Boss Battle</span><span class="val">${battleState.completed ? "done" : esc(truncateWords(battle.name, 18))}</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/calibration"><span class="ico">&#127919;</span><span class="label">Calibration</span><span class="val">${calStats.total ? calStats.accuracy + "%" : "new"}</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/review"><span class="ico">&#128218;</span><span class="label">Review</span><span class="val">${reviewLabel}</span><span class="chev">&#8250;</span></a>
  </div>`;
}

function gymLifeAreaHTML(areaId) {
  const area = lifeArea(areaId);
  if (!area) return `<div class="panel"><p>Life area not found.</p><a class="btn" href="#/gym">Browse challenges</a></div>`;
  const all = MTC.gymChallengesForLifeArea(areaId);
  const challenges = all.filter((challenge) => challengeMatchesBrowseFilters(challenge, areaId));
  return `<div class="panel life-area-hero">
    <a class="crumb" href="#/gym">&larr; All challenges</a>
    <div class="life-area-title"><span aria-hidden="true">${area.emoji}</span><div><h2>${esc(area.name)}</h2><p>${esc(area.blurb)}</p></div></div>
    <button class="btn ${STATE.lifeFocus === area.id ? "" : "ghost"}" data-set-life-focus="${area.id}" ${STATE.lifeFocus === area.id ? 'aria-pressed="true"' : 'aria-pressed="false"'}>
      ${STATE.lifeFocus === area.id ? "Included in my daily mix" : "Use this for my daily mix"}
    </button>
  </div>
  ${browseFiltersHTML({ showArea: false })}
  <p class="browse-count" aria-live="polite">Showing ${challenges.length} of ${all.length} challenges</p>
  <div class="grid browse-results">
    ${challenges.length ? challenges.map(challengeBrowseCardHTML).join("") : `<div class="panel"><p>No challenges match these filters.</p><button class="btn ghost" data-clear-gym-filters>Clear filters</button></div>`}
  </div>`;
}

/* ---------- Progress tab ---------- */

const MUSCLE_OUTCOMES = {
  notice: "spotting details and warning signs before you act",
  judge: "comparing choices using the facts that matter",
  connect: "using a useful idea from one situation in another",
  prioritise: "deciding what needs attention first",
  question: "asking the questions that can change a decision",
  adapt: "changing your response when the situation changes",
};

function progressMessage(muscles, done) {
  if (!done) return "Complete one challenge and this page will show what you are improving.";
  const practised = muscles.filter((muscle) => muscle.played > 0).sort((a, b) => (b.avgBest || 0) - (a.avgBest || 0));
  const strongest = practised[0];
  if (!strongest) return "You have started building clearer everyday thinking.";
  return `You are getting better at ${MUSCLE_OUTCOMES[strongest.id] || strongest.name.toLowerCase()}.`;
}

function progressHTML() {
  const li = levelInfo();
  const muscles = MTC.muscleProgress(STATE);
  const weak = MTC.weaknessProfile(STATE).filter((w) => w.attempts > 0).slice(0, 5);
  const calStats = MTC.calibrationStats(STATE);
  const done = Object.values(STATE.gym).reduce((t, g) => t + g.plays, 0);
  const progressCopy = progressMessage(muscles, done);

  return `
  <div class="stat-strip">
    <div class="stat"><div class="ico">&#128293;</div><div class="num">${STATE.streak}</div><div class="lbl">Day Streak</div></div>
    <div class="stat"><div class="ico">&#11088;</div><div class="num">${STATE.totalXp.toLocaleString()}</div><div class="lbl">Total Points</div></div>
    <div class="stat"><div class="ico">&#127942;</div><div class="num">${done}</div><div class="lbl">Challenges Done</div></div>
  </div>

  <div class="panel">
    <h2>How your thinking is improving</h2>
    <p class="progress-message">${esc(progressCopy)}</p>
    <p class="subtle">Practice level ${li.level} &middot; ${esc(li.title)}</p>
    <div class="xp-bar"><div class="fill" style="width:${li.pct}%"></div></div>
    <p class="subtle">${li.xpIntoLevel} of ${li.xpForNext} points toward the next level</p>
    ${selfAssessedNoteHTML()}
  </div>

  <div class="section-head"><h2>Skills you are building</h2><a href="#/gym">Practise</a></div>
  <div class="panel">
    ${muscles.map((t) => `<a class="weak-row" href="#/gym/muscle/${t.id}">
      <span class="name">${muscleIcon(t.id)} ${esc(t.name)}</span>
      <div class="weak-meter" role="progressbar" aria-label="${esc(t.name)} challenges scored at 80 percent or more" aria-valuemin="0" aria-valuemax="${t.total}" aria-valuenow="${t.mastered}"><div class="fill" style="width:${t.pct}%"></div></div>
      <span class="subtle">${t.mastered}/${t.total} strong</span>
    </a>`).join("")}
  </div>

  <div class="section-head"><h2>What to practise next</h2></div>
  <div class="panel">
    ${weak.length === 0
      ? `<p class="subtle">Complete a few challenges and we will suggest a useful next skill.</p>`
      : weak.map((w) => `<div class="weak-row"><span class="name">${esc(w.name)}</span><div class="weak-meter"><div class="fill" style="width:${Math.round(w.avg)}%"></div></div><span class="subtle">${Math.round(w.avg)}%</span></div>`).join("")}
  </div>

  <div class="panel">
    <a class="list-row" href="#/report"><span class="ico">&#128197;</span><span class="label">Weekly report</span><span class="val">this vs last</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/used"><span class="ico">&#9989;</span><span class="label">Used in life</span><span class="val">${MTC.commitmentStats(STATE).used}</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/journal"><span class="ico">&#128214;</span><span class="label">Journal</span><span class="val">${STATE.history.filter((h) => h.answer).length}</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/calibration"><span class="ico">&#127919;</span><span class="label">Calibration</span><span class="val">${calStats.total ? `${calStats.accuracy}% @ ${calStats.avgConfidence}%` : "not started"}</span><span class="chev">&#8250;</span></a>
  </div>`;
}

/* ---------- Profile tab ---------- */

function profileHTML() {
  const li = levelInfo();
  const done = Object.values(STATE.gym).reduce((t, g) => t + g.plays, 0);
  const recent = MTC_ACHIEVEMENTS.filter((a) => STATE.achievements.includes(a.id)).slice(-3).reverse();

  return `
  <div class="panel">
    <div class="level-hero">
      <div class="level-num">${li.level}<sup>LVL</sup></div>
      <div style="flex:1">
        <h1 style="font-size:20px">${esc(STATE.name)}</h1>
        <p class="subtle" style="margin:2px 0 8px">${esc(li.title)}</p>
        <span class="badge">Level ${li.level}</span>
      </div>
    </div>
  </div>

  <div class="stat-strip">
    <div class="stat"><div class="ico">&#128293;</div><div class="num">${STATE.streak}</div><div class="lbl">Day Streak</div></div>
    <div class="stat"><div class="ico">&#11088;</div><div class="num">${STATE.totalXp.toLocaleString()}</div><div class="lbl">Total Points</div></div>
    <div class="stat"><div class="ico">&#127942;</div><div class="num">${done}</div><div class="lbl">Challenges Done</div></div>
  </div>

  <div class="section-head"><h2>Achievements</h2><a href="#/achievements">View all</a></div>
  <div class="panel">
    ${STATE.achievements.length === 0
      ? `<p class="subtle">Play your first challenge to start unlocking these.</p>`
      : recent.map((a) => `<div class="list-row"><span class="ico">&#127942;</span><span class="label">${esc(a.name)}</span><span class="val">+${a.xp}</span></div>`).join("")}
  </div>

  <div class="section-head"><h2>Library</h2></div>
  <div class="panel">
    <a class="list-row" href="#/guides"><span class="ico">\u{1F9E0}</span><span class="label">Thinking Guides</span><span class="val">${(STATE.seenWalkthroughs.muscle || []).length + (STATE.seenWalkthroughs.format || []).length}/13</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/toolbox"><span class="ico">&#129520;</span><span class="label">Thinking Toolbox</span><span class="val">${MTC_TOOLBOX.length}</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/frameworks"><span class="ico">&#128218;</span><span class="label">Frameworks</span><span class="val">${MTC_FRAMEWORKS.length}</span><span class="chev">&#8250;</span></a>
    <a class="list-row" href="#/achievements"><span class="ico">&#127941;</span><span class="label">All achievements</span><span class="val">${STATE.achievements.length}/${MTC_ACHIEVEMENTS.length}</span><span class="chev">&#8250;</span></a>
  </div>

  <div class="section-head"><h2>Settings</h2></div>
  <div class="panel">
    <button class="list-row" data-export-progress><span class="ico">&#11015;&#65039;</span><span class="label">Export progress</span><span class="chev">&#8250;</span></button>
    <button class="list-row" data-import-progress><span class="ico">&#11014;&#65039;</span><span class="label">Import progress</span><span class="chev">&#8250;</span></button>
    <button class="list-row" data-export-journal><span class="ico">&#128221;</span><span class="label">Export journal (.md)</span><span class="chev">&#8250;</span></button>
    <button class="list-row danger" data-reset-progress><span class="ico">&#128465;&#65039;</span><span class="label">Erase all progress</span><span class="chev">&#8250;</span></button>
    <input type="file" id="import-file" accept=".json,application/json" style="display:none" />
  </div>
  <p class="subtle" style="text-align:center;margin:14px 0">Everything is stored on this device only.</p>`;
}

/* ---------- Daily Quest ---------- */

const TYPE_LABELS = {
  warmup: "Warm-up", challenge: "Challenge", case: "Real-World Case", reflection: "Reflection",
  creativity: "Creativity", logic_puzzle: "Logic Puzzle", decision: "Decision Scenario",
  bias: "Bias Detection", observation: "Observation", fluency: "Fluency", boss: "Boss Battle",
  calibration: "Calibration", review: "Review", workbench: "Workbench", gym: "Gym",
};

function questHTML() {
  const quest = MTC.getOrCreateDailyQuest(STATE);
  // The quest is cached in localStorage for the day, so after an update it can still
  // name an exercise that has since been retired. Drop those rather than throwing on
  // ex.id below — tomorrow's quest is generated fresh from the current bank.
  const items = quest.items.filter((item) => MTC.getExercise(item.exerciseId));
  const hasCore = items.some((i) => i.core);
  return `<div class="panel">
    <h1>Daily Quest</h1>
    <p class="subtle">One of each type &middot; 20&ndash;30 min &middot; ${quest.completed.length}/${items.length} done.${hasCore ? ` Short on time? Do the <span style="color:var(--accent)">&#9733; core</span> three.` : ""}</p>
  </div>
  <div class="grid">
    ${items.map((item) => {
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
      <p class="subtle">Completed today${record ? ` &mdash; self-assessed ${record.score}%, +${record.xp} points` : ""}.</p>
      ${record && record.answer ? `<div class="model-answer"><div class="lbl">Your Answer</div><div class="journal-answer">${esc(record.answer)}</div></div>` : ""}
      <div class="model-answer"><div class="lbl">Model Answer</div>${esc(ex.modelAnswer)}</div>
      <div class="model-answer"><div class="lbl">Expert Note</div>${esc(ex.expertNote)}</div>
      <div class="field"><a class="btn" href="#/quest">Back to Daily Quest</a></div>
    </div>`;
  }

  if (!exUI || exUI.exerciseId !== id) {
    exUI = { exerciseId: id, hintsRevealed: 0, checked: new Set(), showAssessment: false, draft: "", confidence: 70 };
  }

  const hintsHTML = ex.hints.slice(0, exUI.hintsRevealed).map((h) => `<div class="hint-box">${esc(h)}</div>`).join("");
  const hintBtn = exUI.hintsRevealed < ex.hints.length
    ? `<button class="btn ghost" data-hint>Show a hint (&minus;20% points &middot; ${exUI.hintsRevealed}/${ex.hints.length} used)</button>`
    : `<p class="subtle">All hints revealed.</p>`;

  let assessmentHTML = "";
  if (!exUI.showAssessment) {
    const ready = exUI.draft.trim().length >= 20;
    assessmentHTML = `<div class="field">
      <label class="subtle" for="ex-confidence">Before revealing &mdash; how confident are you that your answer covers the key points? <b id="ex-conf-val">${exUI.confidence}</b>%</label>
      <input type="range" id="ex-confidence" min="0" max="100" value="${exUI.confidence}" />
    </div>
    <div class="field">
      <button class="btn" data-show-assessment ${ready ? "" : "disabled"}>Done &mdash; reveal model answer</button>
      <p class="subtle" data-gate-note ${ready ? 'style="display:none"' : ""}>Write your attempt above first &mdash; it unlocks the model answer.</p>
    </div>`;
  } else {
    const total = ex.rubric.length;
    const checkedCount = exUI.checked.size;
    const scorePreview = MTC.rubricScore(checkedCount, total);
    assessmentHTML = `
      <div class="panel">
        <h2>Self-Assessment</h2>
        <p class="subtle">Tick only what you truly did &mdash; if unsure, leave it unchecked. Strict grading is the training.</p>
        ${ex.rubric.map((r, i) => `<label class="rubric-item"><input type="checkbox" data-rubric-idx="${i}" ${exUI.checked.has(i) ? "checked" : ""}/> <span>${esc(r)}</span></label>`).join("")}
        <div class="compare">
          <div class="model-answer"><div class="lbl">Your Answer</div><div class="journal-answer" style="border:none;padding:0;margin:0">${esc(exUI.draft) || '<span class="subtle">(nothing written)</span>'}</div></div>
          <div class="model-answer"><div class="lbl">Model Answer</div>${esc(ex.modelAnswer)}</div>
        </div>
        <div class="model-answer"><div class="lbl">Expert Note</div>${esc(ex.expertNote)}</div>
        <p style="margin-top:12px">Self-assessed score: <b>${scorePreview}%</b> (${checkedCount}/${total} criteria) &middot; estimated points: <b>${MTC.estimateXp(ex.xpBase, scorePreview, exUI.hintsRevealed)}</b></p>
        <button class="btn" data-submit-exercise>Submit</button>
      </div>`;
  }

  const similar = MTC.lastSimilarAnswer(STATE, id);
  const tools = `<div class="field draft-tools">
      ${OUTLINES[ex.type] ? `<button class="btn ghost" data-outline="${ex.type}">Insert outline</button>` : ""}
      ${SpeechRec ? `<button class="btn ghost" data-mic="ex-draft">&#127908; Dictate</button>` : ""}
    </div>`;
  return header + `<div class="panel">
    <textarea id="ex-draft" placeholder="Write your answer &mdash; saved to your journal on submit.">${esc(exUI.draft)}</textarea>
    ${vagueTipHTML()}
    ${CHANGE_MIND_TYPES.includes(ex.type) ? `<p class="subtle" style="margin-top:6px">End with: what evidence would change your mind?</p>` : ""}
    ${tools}
    <div class="field">${hintBtn}</div>
    ${hintsHTML}
  </div>
  ${similar ? `<details class="panel past-answer"><summary class="subtle">Your last answer on a similar problem &mdash; ${esc(similar.title)} (${esc(similar.record.date)})</summary><div class="journal-answer">${esc(similar.record.answer)}</div></details>` : ""}
  ${assessmentHTML}`;
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
    bossUI = { battleId: battle.id, consShown: {}, checked: new Set(), showResolution: false, draft: "" };
  }
  const rubric = [...battle.rubric, BOSS_MONITOR_RUBRIC];

  const allStages = [...battle.stages, BOSS_FINAL_STAGE];
  const stagesHTML = allStages.map((s, i) => {
    const cues = s.considerations.split(/(?<=\.)\s+/);
    const shown = bossUI.consShown[i] || 0;
    const isFinal = i === allStages.length - 1;
    return `
    <div class="stage">
      <h2>${isFinal ? "Final Stage &mdash; Decide &amp; Monitor" : `Stage ${i + 1}`}</h2>
      <p>${esc(s.question)}</p>
      ${cues.slice(0, shown).map((c) => `<div class="hint-box">${esc(c)}</div>`).join("")}
      ${shown < cues.length ? `<button class="btn ghost" data-boss-hint="${i}">Show a consideration (${shown}/${cues.length})</button>` : ""}
    </div>`;
  }).join("");

  let resolutionHTML = "";
  if (!bossUI.showResolution) {
    const ready = bossUI.draft.trim().length >= 20;
    resolutionHTML = `<div class="field">
      <button class="btn" data-boss-show-resolution ${ready ? "" : "disabled"}>Done &mdash; reveal expert framing</button>
      <p class="subtle" data-gate-note ${ready ? 'style="display:none"' : ""}>Work through the stages above first &mdash; it unlocks the framing.</p>
    </div>`;
  } else {
    const total = rubric.length;
    const checkedCount = bossUI.checked.size;
    const scorePreview = MTC.rubricScore(checkedCount, total);
    resolutionHTML = `<div class="panel">
      <h2>Self-Assessment</h2>
      <p class="subtle">Tick only what you truly did &mdash; if unsure, leave it unchecked.</p>
      ${rubric.map((r, i) => `<label class="rubric-item"><input type="checkbox" data-boss-rubric-idx="${i}" ${bossUI.checked.has(i) ? "checked" : ""}/> <span>${esc(r)}</span></label>`).join("")}
      <div class="compare">
        <div class="model-answer"><div class="lbl">Your Answer</div><div class="journal-answer" style="border:none;padding:0;margin:0">${esc(bossUI.draft) || '<span class="subtle">(nothing written)</span>'}</div></div>
        <div class="model-answer"><div class="lbl">Expert Framing (no perfect answer)</div>${esc(battle.noPerfectAnswerNote)}</div>
      </div>
      <p style="margin-top:12px">Self-assessed score: <b>${scorePreview}%</b> &middot; estimated points: <b>${MTC.estimateXp(battle.xpBase, scorePreview, 0)}</b></p>
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
    ${vagueTipHTML()}
    <div class="field draft-tools">
      <button class="btn ghost" data-outline="boss">Insert outline</button>
      ${SpeechRec ? `<button class="btn ghost" data-mic="boss-draft">&#127908; Dictate</button>` : ""}
    </div>
    ${resolutionHTML}
  </div>`;
}

/* ---------- Toolbox ---------- */

function toolboxResultsHTML() {
  const q = toolboxFilter.toLowerCase();
  const items = MTC_TOOLBOX.filter((t) => !q || [t.name, t.formalName, t.summary].some((value) => String(value || "").toLowerCase().includes(q)));
  return items.map((t) => `<div class="panel"><h2>${esc(t.name)}</h2>${t.formalName ? `<span class="tag neutral">Also called ${esc(t.formalName)}</span>` : ""}<p>${esc(t.summary)}</p><p class="subtle"><b>When:</b> ${esc(t.when)}</p><a class="cta" href="#/workbench/${t.id}">Apply to my problem &rarr;</a></div>`).join("") || `<p class="subtle">No tools match.</p>`;
}

function toolboxHTML() {
  return `<div class="panel">
    <h1>Toolbox</h1>
    <input type="text" id="toolbox-search" placeholder="Search tools..." value="${esc(toolboxFilter)}" />
  </div>
  <div class="grid" id="toolbox-results">${toolboxResultsHTML()}</div>`;
}

/* ---------- Thinking Guides: one-off walkthroughs, revisitable anytime ---------- */

// The record no competitor can show: not points earned, but times the thinking
// actually changed something the player did.
function usedInLifeHTML() {
  const used = STATE.commitments.filter((c) => c.status === "used").slice().reverse();
  const open = STATE.commitments.filter((c) => c.status === "open");
  return `<div class="panel">
    <h1>Used in life</h1>
    <p class="subtle">Practice only counts when it reaches a real decision. This is the record of times you said it did.</p>
  </div>
  <div class="stat-strip">
    <div class="stat"><div class="ico">&#9989;</div><div class="num">${used.length}</div><div class="lbl">Times Used</div></div>
    <div class="stat"><div class="ico">&#128221;</div><div class="num">${used.filter((c) => c.note).length}</div><div class="lbl">With A Note</div></div>
    <div class="stat"><div class="ico">&#9203;</div><div class="num">${open.length}</div><div class="lbl">Waiting</div></div>
  </div>
  ${used.length ? `<div class="section-head"><h2>What you used</h2></div>
  <div class="grid">${used.map((c) => {
    const ch = MTC.getGymChallenge(c.challengeId);
    return `<div class="panel">
      <div class="card-tags"><span class="tag">${esc(c.closedOn)}</span></div>
      <h2>${esc(ch ? ch.title : "An earlier challenge")}</h2>
      <p class="subtle">${esc(c.tip)}</p>
      ${c.note ? `<div class="info-panel green"><div class="lbl">Where it came up</div>${esc(c.note)}</div>` : ""}
    </div>`;
  }).join("")}</div>`
  : `<div class="panel"><p class="subtle">Nothing here yet. Finish a challenge, tap <b>I will try this</b>, and the app will ask you afterwards whether it came up.</p></div>`}`;
}

function guidesHTML() {
  const seen = STATE.seenWalkthroughs || { muscle: [], format: [] };
  const row = (kind, id, name, emoji) => `<a class="list-row" href="#/gym/learn/${kind}/${id}">
    <span class="ico">${emoji}</span><span class="label">${esc(name)}</span>
    <span class="val">${(seen[kind] || []).includes(id) ? "Seen" : "New"}</span><span class="chev">&#8250;</span>
  </a>`;
  return `<div class="panel">
    <h1>Thinking Guides</h1>
    <p class="subtle">Short explainers for each type of thinking and each challenge format, each with a worked example. The first one for a new type or format shows automatically before your first challenge &mdash; revisit any of them here anytime.</p>
  </div>
  <div class="section-head"><h2>Types of thinking</h2></div>
  <div class="panel">${MTC_MUSCLES.map((m) => row("muscle", m.id, m.name, m.emoji)).join("")}</div>
  <div class="section-head"><h2>Challenge formats</h2></div>
  <div class="panel">${Object.keys(MTC_GYM_FORMATS).map((id) => row("format", id, MTC_GYM_FORMATS[id].name, FORMAT_ICONS[id])).join("")}</div>`;
}

function walkthroughHTML(kind, id, resumeId) {
  const w = MTC.getWalkthrough(kind, id);
  if (!w) return `<div class="panel"><p>Guide not found.</p><a class="btn" href="#/guides">Thinking Guides</a></div>`;
  const isMuscle = kind === "muscle";
  const tip = isMuscle ? GYM.muscleTip(id) : null;
  return `<div class="panel">
    <div class="level-hero">
      <div class="emoji-badge">${w.emoji}</div>
      <div><h1 style="font-size:20px">${esc(w.title)}</h1><p class="subtle" style="margin:2px 0 0">${isMuscle ? "A type of thinking" : "A challenge format"}</p></div>
    </div>
    <p style="margin-top:14px">${esc(w.lede)}</p>
  </div>
  <div class="panel">
    ${w.explain.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
  </div>
  <div class="panel">
    <h2>Worked example</h2>
    <p style="font-style:italic">${esc(w.example.scenario)}</p>
    ${w.example.walk.map((step) => `<div class="review-row"><div>${esc(step)}</div></div>`).join("")}
    <p style="margin-top:10px"><b>${esc(w.example.answer)}</b></p>
  </div>
  ${tip ? `<div class="panel"><div class="info-panel blue"><div class="lbl">Use this tomorrow</div>${esc(tip)}</div></div>` : ""}
  <div class="field">
    <button class="btn block" data-walkthrough-continue data-kind="${kind}" data-id="${id}" ${resumeId ? `data-resume="${resumeId}"` : ""}>
      ${resumeId ? "Start the challenge →" : "Got it"}
    </button>
  </div>`;
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
        <p class="xp">+${a.xp} points</p>
      </div>`;
    }).join("")}
  </div>`;
}

/* ---------- Calibration ---------- */

function calibrationLandingHTML() {
  const st = MTC.calibrationStats(STATE);
  const statsHTML = st.total === 0
    ? `<p class="subtle">Nothing answered yet. Your accuracy-vs-confidence curve appears here.</p>`
    : `<p class="subtle">${st.binaryCount} statements &middot; ${st.accuracy}% correct at ${st.avgConfidence}% average confidence${st.intervalCount ? ` &middot; ranges: ${st.intervalHitRate}% hit (target 90%)` : ""}</p>
       ${st.buckets.filter((b) => b.n > 0).map((b) => `
         <div class="weak-row"><span class="name">Said ${b.label}</span><div class="weak-meter"><div class="fill" style="width:${b.actual}%"></div></div><span class="subtle">right ${b.actual}% (${b.n})</span></div>`).join("")}`;
  const exGap = MTC.exerciseConfidenceGap(STATE);
  const trend = MTC.calibrationTrend(STATE);
  let trendHTML = "";
  if (trend.length >= 2) {
    const w = 300, hgt = 70, maxGap = Math.max(20, ...trend.map((t) => t.gap));
    const pts = trend.map((t, i) => `${(i / (trend.length - 1)) * w},${hgt - (t.gap / maxGap) * hgt}`).join(" ");
    trendHTML = `<div class="field">
      <p class="subtle">Confidence gap by week (lower is better calibrated):</p>
      <svg viewBox="0 0 ${w} ${hgt + 14}" class="trend" preserveAspectRatio="none" role="img" aria-label="Calibration gap trend">
        <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" />
        <line x1="0" y1="${hgt}" x2="${w}" y2="${hgt}" stroke="var(--hairline)" stroke-width="1" />
      </svg>
      <p class="subtle">${esc(trend[0].week)} &rarr; ${esc(trend[trend.length - 1].week)} &middot; latest gap: ${trend[trend.length - 1].gap} points</p>
    </div>`;
  } else if (trend.length === 1) {
    trendHTML = `<p class="subtle">Your week-by-week trend appears after a second week of sessions.</p>`;
  }
  return `<div class="panel">
    <h1>Calibration</h1>
    <p class="subtle">Checked against written answers. Honest confidence earns the most points; overconfidence loses points.</p>
    ${exGap ? `<p class="subtle">Daily exercises: your pre-reveal confidence differs from your rubric score by <b>${exGap.gap}</b> points on average (${exGap.n} exercise${exGap.n === 1 ? "" : "s"}).</p>` : ""}
  </div>
  <div class="panel">
    <h2>Your calibration</h2>
    ${statsHTML}
    ${trendHTML}
  </div>
  <div class="panel">
    <button class="btn" data-cal-start>Start a session &middot; 7 questions</button>
  </div>`;
}

function calibrationHTML() {
  if (!calUI) return calibrationLandingHTML();

  if (calUI.results) {
    return `<div class="panel"><h1>Session results</h1></div>` + calUI.results.map((g) => {
      if (g.kind === "binary") {
        return `<div class="panel">
          <p>${esc(g.statement)}</p>
          <p class="subtle">You said <b>${g.answer ? "true" : "false"}</b> at ${g.confidence}% &middot; ${g.correct ? "correct" : `wrong &mdash; it's ${g.truth ? "true" : "false"}`} &middot; +${g.points} points</p>
          <div class="model-answer"><div class="lbl">Why</div>${esc(g.note)}</div>
        </div>`;
      }
      return `<div class="panel">
        <p>${esc(g.prompt)} (${esc(g.unit)})</p>
        <p class="subtle">Your range: ${g.low}&ndash;${g.high} &middot; actual: <b>${g.truth}</b> &middot; ${g.hit ? "hit" : "miss"} &middot; +${g.points} points</p>
      </div>`;
    }).join("") + `<div class="panel"><button class="btn" data-cal-done>Done</button></div>`;
  }

  const q = calUI.queue[calUI.idx];
  const progress = `<p class="subtle">Question ${calUI.idx + 1} of ${calUI.queue.length}</p>`;
  if (q.kind === "binary") {
    return `<div class="panel">
      <button class="crumb" data-cal-quit>&larr; Calibration</button>
      ${progress}
      <h1>True or false?</h1>
      <p>${esc(q.statement)}</p>
      <label class="rubric-item"><input type="radio" name="cal-answer" value="true" /> <span>True</span></label>
      <label class="rubric-item"><input type="radio" name="cal-answer" value="false" /> <span>False</span></label>
      <div class="field">
        <label class="subtle" for="cal-conf">How confident? <b id="cal-conf-val">70</b>%</label>
        <input type="range" id="cal-conf" min="50" max="99" value="70" />
      </div>
      <div class="field"><button class="btn" data-cal-next disabled>Next</button></div>
    </div>`;
  }
  return `<div class="panel">
    <button class="crumb" data-cal-quit>&larr; Calibration</button>
    ${progress}
    <h1>Estimate a range</h1>
    <p>${esc(q.prompt)}, in <b>${esc(q.unit)}</b>. Give a range you're 90% sure contains the answer &mdash; too narrow and you'll miss, too wide and you're not saying much.</p>
    <div class="field"><input type="number" id="cal-low" placeholder="Low" step="any" /></div>
    <div class="field"><input type="number" id="cal-high" placeholder="High" step="any" /></div>
    <div class="field"><button class="btn" data-cal-next disabled>Next</button></div>
  </div>`;
}

/* ---------- Spaced review ---------- */

function reviewHTML() {
  if (!revUI) {
    const due = MTC.dueReviewCards(STATE);
    const next = MTC.nextReviewDue(STATE);
    return `<div class="panel">
      <h1>Review</h1>
      <p class="subtle">Spaced repetition for the frameworks and tools. Cards you find hard come back sooner.</p>
    </div>
    <div class="panel">
      ${due.length === 0
        ? `<p class="subtle">All caught up.${next ? ` Next review due ${esc(next)}.` : ""}</p>`
        : `<p class="subtle">${due.length} card${due.length === 1 ? "" : "s"} ready.</p>
           <div class="field"><button class="btn" data-rev-start>Start reviewing</button></div>`}
    </div>`;
  }
  const card = revUI.queue[revUI.idx];
  return `<div class="panel">
    <button class="crumb" data-rev-quit>&larr; Review</button>
    <p class="subtle">Card ${revUI.idx + 1} of ${revUI.queue.length}</p>
    <div><span class="pill">${esc(card.kind)}</span></div>
    <h1>${esc(card.front)}</h1>
    <p style="font-style:italic; color:var(--text-dim)">${esc(card.hint)}</p>
    ${revUI.revealed
      ? `<div class="model-answer"><div class="lbl">Answer</div>${esc(card.back)}</div>
         <div class="field rev-grades">
           <button class="btn secondary" data-rev-grade="again">Again</button>
           <button class="btn secondary" data-rev-grade="hard">Hard</button>
           <button class="btn" data-rev-grade="good">Good</button>
           <button class="btn" data-rev-grade="easy">Easy</button>
         </div>`
      : `<div class="field"><button class="btn" data-rev-reveal>Show answer</button></div>`}
  </div>`;
}

/* ---------- Weekly report ---------- */

function reportHTML() {
  const r = MTC.weeklyReport(STATE);
  const row = (label, cur, prev) => `<div class="weak-row"><span class="name">${label}</span><span><b>${cur}</b></span><span class="subtle">last week: ${prev}</span></div>`;
  return `<div class="panel">
    <a class="crumb" href="#/dashboard">&larr; Dashboard</a>
    <h1>Weekly Report</h1>
    <p class="subtle">Week ${esc(r.week)}</p>
  </div>
  <div class="panel">
    ${row("Points earned", r.current.xp, r.previous.xp)}
    ${row("Exercises", r.current.exercises, r.previous.exercises)}
    ${row("Avg self-score", r.current.avgScore === null ? "&mdash;" : r.current.avgScore + "%", r.previous.avgScore === null ? "&mdash;" : r.previous.avgScore + "%")}
    ${row("Calibration sessions", r.current.calibrationSessions, r.previous.calibrationSessions)}
    ${row("Review sessions", r.current.reviewSessions, r.previous.reviewSessions)}
    ${row("Boss battles", r.current.bosses, r.previous.bosses)}
  </div>
  ${r.focus ? `<div class="panel"><h2>Suggested focus</h2><p><i>${esc(r.focus.name)}</i> is your weakest framework &mdash; ${Math.round(r.focus.avg)}% average over ${r.focus.attempts} attempt${r.focus.attempts === 1 ? "" : "s"}. Daily quests will favor it until it improves.</p>
  <p><b>Field assignment:</b> apply ${esc(r.focus.name)} to one real decision this week, and write what happened in that exercise's answer box when it next appears.</p></div>` : ""}`;
}

/* ---------- Workbench: apply a tool to your own problem ---------- */

function workbenchTemplate(tool) {
  const fields = MTC_TOOL_TEMPLATES[tool.id] || [
    "My problem or decision:",
    "Applying the tool (" + tool.summary + "):",
    "What the tool reveals:",
    "My next concrete step:",
  ];
  return fields.map((f) => f + "\n\n").join("");
}

function workbenchHTML(toolId) {
  const tool = MTC_TOOLBOX.find((t) => t.id === toolId);
  if (!tool) return `<div class="panel">Tool not found. <a class="btn" href="#/toolbox">Toolbox</a></div>`;
  if (!wbUI || wbUI.toolId !== toolId) {
    wbUI = { toolId, draft: workbenchTemplate(tool) };
  }
  const ready = wbUI.draft.replace(/[^]*?:/g, "").trim().length >= 40;
  return `<div class="panel">
    <a class="crumb" href="#/toolbox">&larr; Toolbox</a>
    <h1>${esc(tool.name)} &mdash; on your problem</h1>
    ${tool.formalName ? `<span class="tag neutral">Also called ${esc(tool.formalName)}</span>` : ""}
    <p class="subtle">${esc(tool.summary)}</p>
    <p class="subtle"><b>When:</b> ${esc(tool.when)}</p>
  </div>
  <div class="panel">
    <textarea id="wb-draft" style="min-height:260px">${esc(wbUI.draft)}</textarea>
    <div class="field draft-tools">
      ${SpeechRec ? `<button class="btn ghost" data-mic="wb-draft">&#127908; Dictate</button>` : ""}
    </div>
    <div class="field">
      <button class="btn" data-submit-workbench="${tool.id}" ${ready ? "" : "disabled"}>Save to journal (+10 points)</button>
      <p class="subtle" data-gate-note ${ready ? 'style="display:none"' : ""}>Fill in the sections &mdash; it unlocks saving.</p>
    </div>
  </div>`;
}

/* ---------- The Gym ---------- */

function gymMuscleHTML(muscleId) {
  const m = MTC_MUSCLES.find((t) => t.id === muscleId);
  if (!m) return `<div class="panel">Muscle not found. <a class="btn" href="#/gym">The Gym</a></div>`;
  const all = MTC.gymChallengesForMuscle(muscleId);
  const challenges = all.filter((challenge) => challengeMatchesBrowseFilters(challenge));
  if (!all.length) {
    return `<div class="panel">
      <a class="crumb" href="#/gym">&larr; The Gym</a>
      <h2>${muscleIcon(m.id)} ${esc(m.name)}</h2>
      <p class="subtle">${esc(m.blurb)}</p>
      <p style="margin-top:14px">No challenges here yet &mdash; this muscle is next to be written.</p>
    </div>`;
  }
  return `<div class="panel">
    <a class="crumb" href="#/gym">&larr; All challenges</a>
    <h2>${muscleIcon(m.id)} ${esc(m.name)}</h2>
    <p class="subtle">${esc(m.blurb)} &middot; ${all.length} challenge${all.length === 1 ? "" : "s"}. A strong score is 80% or more.</p>
  </div>
  ${browseFiltersHTML()}
  <p class="browse-count" aria-live="polite">Showing ${challenges.length} of ${all.length} challenges</p>
  <div class="grid browse-results">
    ${challenges.length ? challenges.map(challengeBrowseCardHTML).join("") : `<div class="panel"><p>No challenges match these filters.</p><button class="btn ghost" data-clear-gym-filters>Clear filters</button></div>`}
  </div>`;
}

/* ---------- Journal ---------- */

function journalResultsHTML() {
  const q = journalFilter.toLowerCase();
  const entries = STATE.history
    .filter((h) => h.type !== "review" && h.type !== "calibration")
    .filter((h) => {
      if (!q) return true;
      return (journalEntryTitle(h) + " " + (h.answer || "") + " " + h.type).toLowerCase().includes(q);
    })
    .slice(-100)
    .reverse();
  if (entries.length === 0) {
    return `<div class="panel"><p class="subtle">${journalFilter ? "No entries match." : "Complete an exercise and your answer will appear here."}</p></div>`;
  }
  return entries.map((h) => {
    const title = journalEntryTitle(h);
    return `<div class="panel">
      <span class="pill">${TYPE_LABELS[h.type] || esc(h.type)}</span><span class="pill">${esc(h.date)}</span>
      <h2>${esc(title)}</h2>
      <p class="subtle">${h.type === "workbench" ? `+${h.xp} points` : `Self-assessed ${h.score}% &middot; +${h.xp} points${h.hintsUsed ? ` &middot; ${h.hintsUsed} hint${h.hintsUsed === 1 ? "" : "s"} used` : ""}`}</p>
      ${h.answer ? `<div class="journal-answer">${esc(h.answer)}</div>` : `<p class="subtle">(no written answer was saved with this entry)</p>`}
    </div>`;
  }).join("");
}

function journalEntryTitle(h) {
  if (h.type === "boss") {
    const b = MTC.getBossBattleDef(h.exerciseId);
    return b ? b.name : h.exerciseId;
  }
  if (h.type === "workbench") {
    const t = MTC_TOOLBOX.find((x) => "tool:" + x.id === h.exerciseId);
    return t ? t.name + " (your problem)" : h.exerciseId;
  }
  if (h.type === "gym") {
    const c = MTC.getGymChallenge(h.exerciseId);
    return c ? c.title : h.exerciseId;
  }
  const ex = MTC.getExercise(h.exerciseId);
  return ex ? ex.title : h.exerciseId;
}

function journalMarkdown() {
  const lines = ["# Master Thinking Coach — Journal", ""];
  for (const h of STATE.history) {
    if (!h.answer) continue;
    lines.push(`## ${h.date} — ${journalEntryTitle(h)} (${TYPE_LABELS[h.type] || h.type})`);
    if (h.type !== "workbench") lines.push(`Self-assessed ${h.score}% · +${h.xp} points`);
    lines.push("", h.answer, "");
  }
  return lines.join("\n");
}

function journalHTML() {
  return `<div class="panel">
    <h1>Journal</h1>
    <input type="text" id="journal-search" placeholder="Search your answers..." value="${esc(journalFilter)}" />
    <div class="field"><button class="btn ghost" data-export-journal>Export journal (.md)</button></div>
  </div>
  <div id="journal-results">${journalResultsHTML()}</div>`;
}

/* ---------- Result toast ---------- */

function resultToastHTML(result) {
  return `<div class="toast-overlay">
    <div class="toast-card">
      <div class="subtle">${result.loopClosed ? "You used it" : "Exercise complete"}</div>
      <div class="xp-gain">+${result.xpAwarded} points</div>
      ${result.leveledUp ? `<p>&#127881; Level up! You're now <b>Level ${result.newLevel}</b> &mdash; ${esc(MTC.titleForLevel(result.newLevel))}</p>` : ""}
      ${result.missed && result.missed.length ? `<div class="unlock" style="text-align:left"><b>Focus next time:</b>${result.missed.map((m) => `<div>&middot; ${esc(m)}</div>`).join("")}</div>` : ""}
      ${result.achievementsUnlocked.length ? result.achievementsUnlocked.map((a) => `<div class="unlock">&#127942; Achievement unlocked: <b>${esc(a.name)}</b> (+${a.xp} points)</div>`).join("") : ""}
      <div class="field"><button class="btn" data-dismiss-result>Continue</button></div>
    </div>
  </div>`;
}

/* ---------- Main render ---------- */

function render() {
  const app = document.getElementById("app");
  if (!STATE.name) {
    document.body.classList.add("landing");
    app.innerHTML = onboardingHTML();
    const host = document.getElementById("tabbar-host");
    if (host) host.remove();
    if (lastRenderedRoute !== "onboarding") {
      lastRenderedRoute = "onboarding";
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
    }
    return;
  }
  document.body.classList.remove("landing");
  const r = route();

  // First time this challenge's muscle or format is encountered, detour through
  // its one-off guide before the (scored) challenge itself.
  if (r.startsWith("gym/play/")) {
    const id = r.split("/")[2];
    if (guideJustShownFor && guideJustShownFor !== id) guideJustShownFor = null;
    const ch = MTC.getGymChallenge(id);
    const need = ch && guideJustShownFor !== id && MTC.nextRequiredWalkthrough(STATE, ch);
    if (need) { navigate(`gym/learn/${need.kind}/${need.id}/${ch.id}`); return; }
  } else if (!r.startsWith("gym/learn/")) {
    guideJustShownFor = null;
  }

  let body;
  if (r === "dashboard") body = dashboardHTML();
  else if (r === "progress") body = progressHTML();
  else if (r === "profile") body = profileHTML();
  else if (r === "quest") body = questHTML();
  else if (r.startsWith("exercise/")) body = exerciseHTML(r.split("/")[1]);
  else if (r === "gym") body = challengesHTML();
  else if (r.startsWith("gym/muscle/")) body = gymMuscleHTML(r.split("/")[2]);
  else if (r.startsWith("gym/track/")) body = gymMuscleHTML(r.split("/")[2]); // pre-muscle links
  else if (r.startsWith("gym/life/")) body = gymLifeAreaHTML(r.split("/")[2]);
  else if (r.startsWith("gym/play/")) body = GYM.playHTML(r.split("/")[2]);
  else if (r.startsWith("gym/learn/")) { const [, , kind, id, resumeId] = r.split("/"); body = walkthroughHTML(kind, id, resumeId); }
  else if (r === "guides") body = guidesHTML();
  else if (r === "boss") body = bossHTML();
  else if (r === "calibration") body = calibrationHTML();
  else if (r === "review") body = reviewHTML();
  else if (r === "report") body = reportHTML();
  else if (r === "journal") body = journalHTML();
  else if (r === "used") body = usedInLifeHTML();
  else if (r === "toolbox") body = toolboxHTML();
  else if (r.startsWith("workbench/")) body = workbenchHTML(r.split("/")[1]);
  else if (r === "frameworks") body = frameworksListHTML();
  else if (r.startsWith("frameworks/")) body = frameworkDetailHTML(r.split("/")[1]);
  else if (r === "achievements") body = achievementsHTML();
  else body = dashboardHTML();

  const [title, backTo] = chromeFor(r);
  app.innerHTML = appbarHTML(title, backTo) + body;
  document.body.insertAdjacentHTML("beforeend", "");
  let bar = document.getElementById("tabbar-host");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "tabbar-host";
    document.body.appendChild(bar);
  }
  bar.innerHTML = tabbarHTML();
  if (pendingResult) app.insertAdjacentHTML("beforeend", resultToastHTML(pendingResult));
  if (r !== lastRenderedRoute) {
    lastRenderedRoute = r;
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }
}

/* ---------- Events ---------- */

document.addEventListener("click", (e) => {
  if (route().startsWith("gym/play/") && GYM.handleClick(e)) { render(); return; }

  const checkinYes = e.target.closest("[data-checkin-yes]");
  if (checkinYes) {
    const box = document.getElementById("checkin-note");
    const result = MTC.closeCommitment(STATE, checkinYes.dataset.checkinYes, true, box ? box.value : "");
    if (result) { result.loopClosed = true; pendingResult = result; }
    render();
    return;
  }

  const checkinNo = e.target.closest("[data-checkin-no]");
  if (checkinNo) {
    MTC.closeCommitment(STATE, checkinNo.dataset.checkinNo, false, "");
    render();
    return;
  }

  const wtContinue = e.target.closest("[data-walkthrough-continue]");
  if (wtContinue) {
    const { kind, id, resume } = wtContinue.dataset;
    MTC.markWalkthroughSeen(STATE, kind, id);
    // Straight into the challenge, never on to a second guide: chaining them made
    // a first session read guide, guide, challenge, guide, guide, challenge. Any
    // guide still owed is picked up before a later challenge instead.
    guideJustShownFor = resume || null;
    navigate(resume ? `gym/play/${resume}` : "guides");
    return;
  }

  const lifeFocusButton = e.target.closest("[data-set-life-focus]");
  if (lifeFocusButton) {
    STATE.lifeFocus = lifeFocusButton.dataset.setLifeFocus;
    // Choosing a new focus is an intentional request for a different daily mix.
    STATE.dailyGymSession = null;
    MTC.saveState(STATE);
    render();
    return;
  }

  if (e.target.closest("[data-clear-gym-filters]")) {
    gymAreaFilter = "all";
    gymLevelFilter = "all";
    gymTimeFilter = "all";
    render();
    return;
  }

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
    const result = MTC.submitExercise(STATE, exUI.exerciseId, score, exUI.hintsRevealed, exUI.draft, exUI.confidence);
    result.missed = ex.rubric.filter((r, i) => !exUI.checked.has(i)).slice(0, 3);
    pendingResult = result;
    exUI = null;
    render();
    return;
  }

  if (e.target.closest("[data-boss-hint]")) {
    const idx = Number(e.target.closest("[data-boss-hint]").dataset.bossHint);
    bossUI.consShown[idx] = (bossUI.consShown[idx] || 0) + 1;
    render();
    return;
  }

  if (e.target.closest("[data-boss-show-resolution]")) { bossUI.showResolution = true; render(); return; }

  const submitBoss = e.target.closest("[data-submit-boss]");
  if (submitBoss) {
    const battleId = submitBoss.dataset.submitBoss;
    const rubric = [...MTC.getBossBattleDef(battleId).rubric, BOSS_MONITOR_RUBRIC];
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

  if (e.target.closest("[data-cal-start]")) {
    const qs = MTC.pickCalibrationQuestions(STATE);
    calUI = {
      queue: [...qs.binary.map((q) => ({ ...q, kind: "binary" })), ...qs.intervals.map((q) => ({ ...q, kind: "interval" }))],
      idx: 0, responses: [], results: null,
    };
    render();
    return;
  }

  if (e.target.closest("[data-cal-next]")) {
    const q = calUI.queue[calUI.idx];
    if (q.kind === "binary") {
      const picked = document.querySelector('input[name="cal-answer"]:checked');
      if (!picked) return;
      calUI.responses.push({ id: q.id, kind: "binary", answer: picked.value === "true", confidence: Number(document.getElementById("cal-conf").value) });
    } else {
      calUI.responses.push({ id: q.id, kind: "interval", low: parseFloat(document.getElementById("cal-low").value), high: parseFloat(document.getElementById("cal-high").value) });
    }
    calUI.idx++;
    if (calUI.idx >= calUI.queue.length) {
      const result = MTC.gradeCalibration(STATE, calUI.responses);
      calUI.results = result.graded;
      pendingResult = result;
    }
    render();
    return;
  }

  if (e.target.closest("[data-cal-done]") || e.target.closest("[data-cal-quit]")) {
    calUI = null;
    render();
    return;
  }

  if (e.target.closest("[data-rev-start]")) {
    revUI = { queue: MTC.dueReviewCards(STATE), idx: 0, revealed: false, xp: 0, count: 0 };
    render();
    return;
  }

  if (e.target.closest("[data-rev-reveal]")) {
    revUI.revealed = true;
    render();
    return;
  }

  const gradeEl = e.target.closest("[data-rev-grade]");
  if (gradeEl) {
    const card = revUI.queue[revUI.idx];
    revUI.xp += MTC.gradeReviewCard(STATE, card.id, gradeEl.dataset.revGrade);
    revUI.count++;
    revUI.idx++;
    revUI.revealed = false;
    if (revUI.idx >= revUI.queue.length) {
      pendingResult = MTC.finishReviewSession(STATE, revUI.xp, revUI.count);
      revUI = null;
    }
    render();
    return;
  }

  if (e.target.closest("[data-rev-quit]")) {
    if (revUI && revUI.count > 0) pendingResult = MTC.finishReviewSession(STATE, revUI.xp, revUI.count);
    revUI = null;
    render();
    return;
  }

  const outlineBtn = e.target.closest("[data-outline]");
  if (outlineBtn) {
    const key = outlineBtn.dataset.outline;
    const targetId = key === "boss" ? "boss-draft" : "ex-draft";
    const template = key === "boss" ? BOSS_OUTLINE : OUTLINES[key];
    const ta = document.getElementById(targetId);
    if (ta && template) {
      ta.value = ta.value.trim() ? ta.value + "\n\n" + template : template;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      ta.focus();
    }
    return;
  }

  const micBtn = e.target.closest("[data-mic]");
  if (micBtn && SpeechRec) {
    if (activeRec) {
      activeRec.stop();
      return;
    }
    const targetId = micBtn.dataset.mic;
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = false;
    activeRec = rec;
    micBtn.textContent = "\u23F9 Stop dictating";
    rec.onresult = (ev) => {
      const ta = document.getElementById(targetId);
      if (!ta) return;
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) ta.value = (ta.value ? ta.value + " " : "") + ev.results[i][0].transcript.trim();
      }
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    };
    rec.onend = () => {
      activeRec = null;
      const btn = document.querySelector(`[data-mic="${targetId}"]`);
      if (btn) btn.innerHTML = "&#127908; Dictate";
    };
    rec.onerror = rec.onend;
    try { rec.start(); } catch (err) { activeRec = null; }
    return;
  }

  const wbSubmit = e.target.closest("[data-submit-workbench]");
  if (wbSubmit) {
    const result = MTC.submitWorkbench(STATE, wbSubmit.dataset.submitWorkbench, wbUI.draft);
    pendingResult = result;
    wbUI = null;
    render();
    return;
  }

  if (e.target.closest("[data-export-journal]")) {
    const blob = new Blob([journalMarkdown()], { type: "text/markdown" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `thinking-coach-journal-${MTC.todayStr()}.md`;
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  if (e.target.closest("[data-export-progress]")) {
    const blob = new Blob([MTC.exportStateJSON()], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `thinking-coach-progress-${MTC.todayStr()}.json`;
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  if (e.target.id === "gym-area-filter") {
    gymAreaFilter = e.target.value;
    render();
    return;
  }
  if (e.target.id === "gym-level-filter") {
    gymLevelFilter = e.target.value;
    render();
    return;
  }
  if (e.target.id === "gym-time-filter") {
    gymTimeFilter = e.target.value;
    render();
    return;
  }
  if (e.target.matches('input[name="cal-answer"]')) {
    const btn = document.querySelector("[data-cal-next]");
    if (btn) btn.disabled = false;
    return;
  }
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
        GYM.reset();
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

function toggleGate(btnSelector, value) {
  const ready = value.trim().length >= 20;
  const btn = document.querySelector(btnSelector);
  if (btn) btn.disabled = !ready;
  const note = document.querySelector("[data-gate-note]");
  if (note) note.style.display = ready ? "none" : "";
}

document.addEventListener("input", (e) => {
  if (GYM.handleInput(e)) return;
  if (e.target.id === "ex-draft") {
    if (exUI) exUI.draft = e.target.value;
    toggleGate("[data-show-assessment]", e.target.value);
    checkVague(e.target.value);
    return;
  }
  if (e.target.id === "boss-draft") {
    if (bossUI) bossUI.draft = e.target.value;
    toggleGate("[data-boss-show-resolution]", e.target.value);
    checkVague(e.target.value);
    return;
  }
  if (e.target.id === "wb-draft") {
    if (wbUI) wbUI.draft = e.target.value;
    const btn = document.querySelector("[data-submit-workbench]");
    const ready = e.target.value.replace(/[^]*?:/g, "").trim().length >= 40;
    if (btn) btn.disabled = !ready;
    const note = document.querySelector("[data-gate-note]");
    if (note) note.style.display = ready ? "none" : "";
    return;
  }
  if (e.target.id === "ex-confidence") {
    if (exUI) exUI.confidence = Number(e.target.value);
    const val = document.getElementById("ex-conf-val");
    if (val) val.textContent = e.target.value;
    return;
  }
  if (e.target.id === "journal-search") {
    journalFilter = e.target.value;
    const box = document.getElementById("journal-results");
    if (box) box.innerHTML = journalResultsHTML();
    return;
  }
  if (e.target.id === "cal-conf") {
    const val = document.getElementById("cal-conf-val");
    if (val) val.textContent = e.target.value;
    return;
  }
  if (e.target.id === "cal-low" || e.target.id === "cal-high") {
    const low = parseFloat(document.getElementById("cal-low").value);
    const high = parseFloat(document.getElementById("cal-high").value);
    const btn = document.querySelector("[data-cal-next]");
    if (btn) btn.disabled = !(isFinite(low) && isFinite(high) && low <= high);
    return;
  }
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
    const form = new FormData(e.target);
    const name = form.get("playerName");
    const selectedFocus = form.get("lifeFocus");
    STATE.name = (name && name.trim()) || "Thinker";
    STATE.lifeFocus = lifeArea(selectedFocus) ? selectedFocus : null;
    MTC.saveState(STATE);
    const first = MTC.gymSession(STATE)[0];
    if (first) navigate(`gym/play/${first.id}`);
    else render();
  }
});

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
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
