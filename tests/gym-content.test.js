const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const storage = new Map();
const context = vm.createContext({
  console,
  Date,
  Math,
  JSON,
  Set,
  Map,
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
});

function run(file, expose) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(`${source}\n;globalThis.${expose.name} = ${expose.value};`, context, { filename: file });
}

run("content.js", { name: "__contentLoaded", value: "true" });
run("gym-content.js", { name: "__gymData", value: "({ formats: MTC_GYM_FORMATS, challenges: MTC_GYM_CHALLENGES, areas: MTC_GYM_LIFE_AREAS })" });
run("everyday-content.js", { name: "__everydayLoaded", value: "true" });
run("engine.js", { name: "__engine", value: "MTC" });

const { formats, challenges, areas } = context.__gymData;
const MTC = context.__engine;
const areaIds = new Set(areas.map((area) => area.id));

assert.equal(challenges.length, 115, "README and onboarding count must match the content bank");
assert.equal(new Set(challenges.map((challenge) => challenge.id)).size, challenges.length, "challenge IDs must be unique");
assert.equal(areaIds.size, 8, "life-area IDs must be unique");
assert.deepEqual(
  Object.fromEntries([...new Set(challenges.map((challenge) => challenge.muscle))].sort().map((muscle) => [muscle, challenges.filter((challenge) => challenge.muscle === muscle).length])),
  { adapt: 21, connect: 13, judge: 26, notice: 24, prioritise: 13, question: 18 },
  "documented muscle counts must match the content bank",
);

for (const challenge of challenges) {
  assert.ok(formats[challenge.format], `${challenge.id}: unknown format`);
  assert.ok(challenge.title && challenge.scenario, `${challenge.id}: title and scenario are required`);
  assert.ok(challenge.debrief?.principle, `${challenge.id}: principle is required`);
  assert.ok(challenge.debrief?.whereItMisleads, `${challenge.id}: limitation is required`);
  assert.ok(Array.isArray(challenge.lifeAreas) && challenge.lifeAreas.length, `${challenge.id}: at least one life area is required`);
  for (const area of challenge.lifeAreas) assert.ok(areaIds.has(area), `${challenge.id}: unknown life area ${area}`);

  const payload = challenge.payload;
  if (challenge.format === "workout") {
    assert.ok(payload.steps.length >= 3, `${challenge.id}: workout needs several steps`);
    for (const step of payload.steps) {
      assert.ok(Number.isInteger(step.answer) && step.answer >= 0 && step.answer < step.options.length, `${challenge.id}: invalid workout answer`);
      assert.equal(new Set(step.options).size, step.options.length, `${challenge.id}: workout options must be distinct`);
      assert.ok(step.because, `${challenge.id}: every workout answer needs a reason`);
    }
  } else if (challenge.format === "flaw") {
    assert.ok(payload.flawIdx >= 0 && payload.flawIdx < payload.argument.length, `${challenge.id}: invalid flawed sentence`);
    assert.ok(payload.flawAnswer >= 0 && payload.flawAnswer < payload.flawOptions.length, `${challenge.id}: invalid flaw answer`);
  } else if (challenge.format === "map") {
    assert.ok(payload.pairs.length >= 3, `${challenge.id}: map needs several pairs`);
    assert.ok(payload.misleads.answers.every((answer) => answer >= 0 && answer < payload.misleads.options.length), `${challenge.id}: invalid map limitation answer`);
  } else if (challenge.format === "ask") {
    assert.ok(payload.budget > 0 && payload.budget <= payload.questions.length, `${challenge.id}: invalid question budget`);
    assert.ok(payload.decision.answer >= 0 && payload.decision.answer < payload.decision.options.length, `${challenge.id}: invalid final decision`);
  } else if (challenge.format === "triage") {
    const bands = new Set(payload.bands.map((band) => band.id));
    assert.ok(payload.items.every((item) => bands.has(item.band)), `${challenge.id}: item uses an unknown priority group`);
  } else if (challenge.format === "chain") {
    assert.ok(payload.steps.length >= 3 && !payload.steps.includes(payload.intruder), `${challenge.id}: invalid consequence chain`);
  } else if (challenge.format === "signal") {
    assert.ok(payload.evidence.every((item) => ["supports", "undermines", "irrelevant"].includes(item.bucket)), `${challenge.id}: invalid evidence bucket`);
  }
}

const unattendedDrink = challenges.find((item) => item.title === "Your Drink Was Left Unattended");
assert.ok(unattendedDrink.lifeAreas.includes("safety") && !unattendedDrink.lifeAreas.includes("work"), "generic instructions such as 'work through' must not turn a safety challenge into a work challenge");
const onlineRelationship = challenges.find((item) => item.title === "The Online Relationship Emergency");
assert.ok(!onlineRelationship.lifeAreas.includes("safety"), "a word fragment inside 'treatment' must not be mistaken for ATM safety content");
const everydayReplacements = challenges.filter((item) => item.payload?.everydayReplacement);
assert.equal(everydayReplacements.length, 30, "thirty abstract challenges should be replaced with everyday job or creativity scenarios");
assert.equal(everydayReplacements.filter((item) => item.payload.creativity).length, 10, "the replacement set should include ten practical creativity challenges");
assert.ok(everydayReplacements.every((item) => item.payload.fairnessNote), "every replacement must explain how it is scored fairly");
assert.ok(everydayReplacements.filter((item) => item.payload.creativity).every((item) => item.payload.creativePrompt), "every creativity challenge must invite an ungraded original idea");
const wordCount = (text) => (text.match(/[A-Za-z0-9£]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
for (const item of everydayReplacements) {
  for (const sentence of item.scenario.split(/(?<=[.!?])\s+/)) {
    assert.ok(wordCount(sentence) <= 30, `${item.id}: scenario sentence is too long for quick reading`);
  }
  for (const step of item.payload.steps) {
    assert.ok(wordCount(step.ask) <= 20, `${item.id}: question is too long for quick reading`);
    assert.ok(step.options.every((option) => wordCount(option) <= 24), `${item.id}: answer option is too long for quick reading`);
    assert.ok(wordCount(step.because) <= 30, `${item.id}: answer explanation is too long for quick reading`);
  }
}

assert.ok(challenges.every((item) => item.payload?.globalClarityChecked), "every Gym card must pass the global-English audit");
assert.ok(challenges.every((item) => item.payload?.fairnessNote), "every Gym card must explain that outside knowledge is not being scored");

const structuralTextKeys = new Set(["id", "format", "muscle", "frameworks", "lifeAreas", "emoji", "bucket", "value"]);
const visibleStrings = (value, key = "", output = []) => {
  if (typeof value === "string") {
    if (!structuralTextKeys.has(key)) output.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) visibleStrings(item, key, output);
  } else if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) visibleStrings(childValue, childKey, output);
  }
  return output;
};

for (const item of challenges) {
  for (const text of visibleStrings(item)) {
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      assert.ok(wordCount(sentence) <= 30, `${item.id}: user-facing sentence is too long for quick reading`);
    }
  }
  const allText = visibleStrings(item).join(" ");
  if (/\bmph\b/i.test(allText)) assert.match(allText, /km\/h/i, `${item.id}: speed needs a metric equivalent`);
  if (/pavement/i.test(allText)) assert.match(allText, /sidewalk/i, `${item.id}: pair pavement with sidewalk`);
  if (/cash machine/i.test(allText)) assert.match(allText, /\bATM\b/i, `${item.id}: pair cash machine with ATM`);
  if (/store credit/i.test(allText)) assert.match(allText, /shop credit/i, `${item.id}: pair store credit with shop credit`);
}

const runtimeText = challenges.flatMap((item) => visibleStrings(item)).join(" ");
assert.doesNotMatch(runtimeText, /Pixar|\bBadr\b|Maginot|Coca-Cola|\bKodak\b|\bUmar\b/i, "brand or history knowledge must not be assumed by a Gym card");
assert.doesNotMatch(runtimeText, /\b(?:law|laws|legal|legally|rights)\b/i, "a Gym card must not test or imply unstated local rules");

const state = MTC.loadState();
state.name = "Test user";
const challenge = challenges.find((item) => item.id === "gym-workout-24");
const completion = MTC.submitGymChallenge(state, challenge.id, 80, "");
assert.ok(completion.xpAwarded > 0, "completion should award points immediately");
assert.equal(state.gym[challenge.id].plays, 1, "completion should create one play");
assert.equal(state.history.length, 1, "completion should create one history entry");

const noteResult = MTC.saveGymNote(state, challenge.id, "I will verify the employer through its own website.");
assert.equal(noteResult.xpAwarded, 5, "first journal note should award five points");
assert.equal(state.gym[challenge.id].plays, 1, "saving a note must not create another play");
assert.equal(state.history.length, 1, "saving a note must update the existing history entry");
assert.match(state.history[0].answer, /verify the employer/, "journal note should be stored on the completed attempt");

const editedNote = MTC.saveGymNote(state, challenge.id, "I will use the employer's official contact details.");
assert.equal(editedNote.xpAwarded, 0, "editing a saved note must not award the bonus twice");
assert.equal(state.gym[challenge.id].plays, 1, "editing a note must not change play count");

state.lifeFocus = "safety";
state.dailyGymSession = null;
const focusedSession = MTC.gymSession(state, 3);
assert.ok(focusedSession.every((item) => item.lifeAreas.includes("safety") || state.gym[item.id]?.due <= MTC.todayStr()), "daily session should prefer the chosen life area");
const focusedIds = focusedSession.map((item) => item.id);
MTC.submitGymChallenge(state, focusedIds[0], 90, "");
assert.deepEqual(MTC.gymSession(state, 3).map((item) => item.id), focusedIds, "today's daily session must stay stable after a challenge is completed");

console.log(`Validated ${challenges.length} globally clear challenges, ${everydayReplacements.length} everyday replacements, 10 creativity tasks, answer keys, fair scoring notes, stable daily sessions and autosave.`);
