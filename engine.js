/* Master Thinking Coach — game engine (leveling, XP, streaks, quest generation, achievements).
   Pure functions over a plain-object state, persisted to localStorage. No build step. */

const MTC = (() => {
  const STORAGE_KEY = "mtc_state_v1";

  function todayStr(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  function isoWeekKey(d = new Date()) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  function weekIndex(d = new Date()) {
    const epoch = new Date(Date.UTC(2024, 0, 1));
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    return Math.floor((date - epoch) / (7 * 86400000));
  }

  function xpCostForLevel(level) {
    return 100 + (level - 1) * 40;
  }

  function deriveLevel(totalXp) {
    let level = 1;
    let remaining = totalXp;
    while (level < 100 && remaining >= xpCostForLevel(level)) {
      remaining -= xpCostForLevel(level);
      level++;
    }
    return { level, xpIntoLevel: remaining, xpForNext: xpCostForLevel(Math.min(level, 100)) };
  }

  function titleForLevel(level) {
    let title = MTC_LEVEL_TITLES[0][1];
    for (const [lvl, name] of MTC_LEVEL_TITLES) {
      if (level >= lvl) title = name;
    }
    return title;
  }

  function defaultState() {
    return {
      name: null,
      createdAt: new Date().toISOString(),
      totalXp: 0,
      streak: 0,
      lastActiveDate: null,
      totalExercises: 0,
      typeCounts: {},
      frameworkCounts: {},
      flags: {},
      achievements: [],
      bossBattlesCompleted: 0,
      weaknessScores: {}, // frameworkId -> {attempts, totalScore}
      history: [], // {date, exerciseId, type, score, xp, hintsUsed}
      dailyQuest: null, // {date, items: [{exerciseId, type}], completed: [exerciseId]}
      bossBattle: null, // {week, battleId, completed, stageNotes: []}
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      return defaultState();
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function statsView(state) {
    const { level } = deriveLevel(state.totalXp);
    return {
      totalExercises: state.totalExercises,
      typeCounts: state.typeCounts,
      frameworkCounts: state.frameworkCounts,
      flags: state.flags,
      streak: state.streak,
      level,
      bossBattlesCompleted: state.bossBattlesCompleted,
    };
  }

  function updateStreak(state) {
    const today = todayStr();
    if (state.lastActiveDate === today) return;
    if (state.lastActiveDate) {
      const prev = new Date(state.lastActiveDate + "T00:00:00Z");
      const diffDays = Math.round((new Date(today + "T00:00:00Z") - prev) / 86400000);
      state.streak = diffDays === 1 ? state.streak + 1 : 1;
    } else {
      state.streak = 1;
    }
    state.lastActiveDate = today;
  }

  function checkAchievements(state) {
    const stats = statsView(state);
    const unlocked = [];
    for (const a of MTC_ACHIEVEMENTS) {
      if (state.achievements.includes(a.id)) continue;
      if (a.rule(stats)) {
        state.achievements.push(a.id);
        state.totalXp += a.xp;
        unlocked.push(a);
      }
    }
    return unlocked;
  }

  function weaknessProfile(state) {
    const rows = Object.keys(state.weaknessScores).map((fw) => {
      const { attempts, totalScore } = state.weaknessScores[fw];
      const avg = attempts ? totalScore / attempts : 0;
      const meta = MTC_FRAMEWORKS.find((f) => f.id === fw);
      return { id: fw, name: meta ? meta.name : fw, avg, attempts };
    });
    rows.sort((a, b) => a.avg - b.avg);
    return rows;
  }

  function pickExerciseForType(state, type) {
    const pool = MTC_EXERCISES.filter((e) => e.type === type);
    const recentIds = state.history
      .filter((h) => h.type === type)
      .slice(-2)
      .map((h) => h.exerciseId);
    let candidates = pool.filter((e) => !recentIds.includes(e.id));
    if (candidates.length === 0) candidates = pool;

    const weak = weaknessProfile(state)
      .filter((w) => w.attempts > 0 && w.avg < 70)
      .map((w) => w.id);
    const weakMatches = candidates.filter((e) => e.frameworks.some((f) => weak.includes(f)));

    const useWeak = weakMatches.length > 0 && Math.random() < 0.6;
    const finalPool = useWeak ? weakMatches : candidates;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  }

  function getOrCreateDailyQuest(state) {
    const today = todayStr();
    if (state.dailyQuest && state.dailyQuest.date === today) return state.dailyQuest;
    const items = MTC_QUEST_TYPES.map((type) => {
      const ex = pickExerciseForType(state, type);
      return { exerciseId: ex.id, type };
    });
    state.dailyQuest = { date: today, items, completed: [] };
    saveState(state);
    return state.dailyQuest;
  }

  function getExercise(id) {
    return MTC_EXERCISES.find((e) => e.id === id);
  }

  function hintPenaltyFactor(hintsUsed) {
    return Math.max(0.6, 1 - hintsUsed * 0.1);
  }

  function submitExercise(state, exerciseId, selfScore, hintsUsed) {
    const ex = getExercise(exerciseId);
    if (!ex) throw new Error("Unknown exercise: " + exerciseId);
    const clampedScore = Math.max(0, Math.min(100, selfScore));
    const xpAwarded = Math.round(ex.xpBase * (clampedScore / 100) * hintPenaltyFactor(hintsUsed));

    state.totalExercises++;
    state.typeCounts[ex.type] = (state.typeCounts[ex.type] || 0) + 1;
    for (const fw of ex.frameworks) {
      state.frameworkCounts[fw] = (state.frameworkCounts[fw] || 0) + 1;
      if (!state.weaknessScores[fw]) state.weaknessScores[fw] = { attempts: 0, totalScore: 0 };
      state.weaknessScores[fw].attempts++;
      state.weaknessScores[fw].totalScore += clampedScore;
    }
    if (ex.flag) state.flags[ex.flag] = (state.flags[ex.flag] || 0) + 1;

    state.history.push({
      date: todayStr(),
      exerciseId,
      type: ex.type,
      score: clampedScore,
      xp: xpAwarded,
      hintsUsed,
    });

    const quest = getOrCreateDailyQuest(state);
    if (!quest.completed.includes(exerciseId)) quest.completed.push(exerciseId);

    const beforeLevel = deriveLevel(state.totalXp).level;
    updateStreak(state);
    state.totalXp += xpAwarded;
    const afterLevel = deriveLevel(state.totalXp).level;
    const achievementsUnlocked = checkAchievements(state);
    saveState(state);

    return {
      xpAwarded,
      leveledUp: afterLevel > beforeLevel,
      newLevel: afterLevel,
      achievementsUnlocked,
      questComplete: quest.completed.length >= quest.items.length,
    };
  }

  function getCurrentBossBattle(state) {
    const week = isoWeekKey();
    if (state.bossBattle && state.bossBattle.week === week) return state.bossBattle;
    const idx = ((weekIndex() % MTC_BOSS_BATTLES.length) + MTC_BOSS_BATTLES.length) % MTC_BOSS_BATTLES.length;
    const battle = MTC_BOSS_BATTLES[idx];
    state.bossBattle = { week, battleId: battle.id, completed: false };
    saveState(state);
    return state.bossBattle;
  }

  function getBossBattleDef(battleId) {
    return MTC_BOSS_BATTLES.find((b) => b.id === battleId);
  }

  function submitBossBattle(state, battleId, selfScore) {
    const battle = getBossBattleDef(battleId);
    const clampedScore = Math.max(0, Math.min(100, selfScore));
    const xpAwarded = Math.round(battle.xpBase * (clampedScore / 100));

    state.bossBattlesCompleted++;
    for (const fw of battle.frameworks) {
      state.frameworkCounts[fw] = (state.frameworkCounts[fw] || 0) + 1;
      if (!state.weaknessScores[fw]) state.weaknessScores[fw] = { attempts: 0, totalScore: 0 };
      state.weaknessScores[fw].attempts++;
      state.weaknessScores[fw].totalScore += clampedScore;
    }
    state.history.push({ date: todayStr(), exerciseId: battleId, type: "boss", score: clampedScore, xp: xpAwarded, hintsUsed: 0 });

    const beforeLevel = deriveLevel(state.totalXp).level;
    updateStreak(state);
    state.totalXp += xpAwarded;
    const afterLevel = deriveLevel(state.totalXp).level;

    if (state.bossBattle && state.bossBattle.battleId === battleId) state.bossBattle.completed = true;
    const achievementsUnlocked = checkAchievements(state);
    saveState(state);

    return { xpAwarded, leveledUp: afterLevel > beforeLevel, newLevel: afterLevel, achievementsUnlocked };
  }

  return {
    todayStr,
    isoWeekKey,
    deriveLevel,
    titleForLevel,
    xpCostForLevel,
    loadState,
    saveState,
    defaultState,
    statsView,
    weaknessProfile,
    getOrCreateDailyQuest,
    getExercise,
    submitExercise,
    getCurrentBossBattle,
    getBossBattleDef,
    submitBossBattle,
  };
})();
