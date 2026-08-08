/* Answer-shape tells.
 *
 * A challenge is only measuring thinking if the answer cannot be found without
 * reading the question. Shuffling display order (gym.js optionOrder) removed the
 * positional tell, but it cannot hide a tell carried by the TEXT itself: if the
 * correct option is always the longest, most qualified sentence and the wrong
 * ones are short and obviously silly, the challenge is scoring prose taste.
 *
 * This measures several strategies that never read the question and requires each
 * to stay near chance. It is deliberately strict about Work It Out and Ask First,
 * the two formats where an author writes one considered answer beside throwaway
 * distractors and the tell creeps back in.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({
  console, Date, Math, JSON, Set, Map,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
});
for (const file of ["content.js", "gym-content.js", "everyday-content.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}
const challenges = vm.runInContext("MTC_GYM_CHALLENGES", context);

const words = (text) => (String(text).match(/[A-Za-z0-9£$€]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
// Hedging/qualifying vocabulary. A considered answer tends to attract these; if
// only the right answer ever carries them, they are a tell in their own right.
const HEDGE = /\b(and|then|before|after|while|whether|rather|instead|so that|because|if)\b/gi;
const hedges = (text) => (String(text).match(HEDGE) || []).length;

// Every option set that gets scored, flattened to { options, answer, where }.
const optionSets = [];
for (const challenge of challenges) {
  if (challenge.format === "workout") {
    challenge.payload.steps.forEach((step, i) => {
      optionSets.push({ options: step.options, answer: step.answer, where: `${challenge.id} step ${i + 1}` });
    });
  } else if (challenge.format === "ask") {
    const decision = challenge.payload.decision;
    optionSets.push({ options: decision.options, answer: decision.answer, where: `${challenge.id} decision` });
  } else if (challenge.format === "flaw") {
    optionSets.push({ options: challenge.payload.flawOptions, answer: challenge.payload.flawAnswer, where: `${challenge.id} flaw` });
  }
}

// Chance is not a flat 25%: option counts vary, so the baseline is the mean of 1/n.
const chance = optionSets.reduce((total, set) => total + 1 / set.options.length, 0) / optionSets.length;

const strategies = {
  "longest option": (options) => options.reduce((best, o, i) => (o.length > options[best].length ? i : best), 0),
  "shortest option": (options) => options.reduce((best, o, i) => (o.length < options[best].length ? i : best), 0),
  "most words": (options) => options.reduce((best, o, i) => (words(o) > words(options[best]) ? i : best), 0),
  "most hedging words": (options) => options.reduce((best, o, i) => (hedges(o) > hedges(options[best]) ? i : best), 0),
};

const CEILING = 0.40; // chance is ~0.25; anything at or above this is a systematic tell
const report = [];
const failures = [];
for (const [name, pick] of Object.entries(strategies)) {
  const wins = optionSets.filter((set) => pick(set.options) === set.answer).length;
  const rate = wins / optionSets.length;
  report.push(`  ${name.padEnd(20)} ${String(wins).padStart(4)}/${optionSets.length} = ${(rate * 100).toFixed(1)}%`);
  if (rate >= CEILING) failures.push(`"${name}" wins ${(rate * 100).toFixed(1)}% of scored option sets (chance ${(chance * 100).toFixed(1)}%, ceiling ${CEILING * 100}%)`);
}

// Ask First also scores WHICH questions you spend the budget on. If the
// question that matters is simply the longest one, the budget is not a decision.
const askSets = challenges.filter((c) => c.format === "ask");
let askWins = 0, askSlots = 0, askExpected = 0;
for (const challenge of askSets) {
  const { questions, budget } = challenge.payload;
  const byLength = [...questions].sort((a, b) => b.text.length - a.text.length).slice(0, budget);
  askWins += byLength.filter((q) => q.value === "high").length;
  askSlots += budget;
  askExpected += budget * (questions.filter((q) => q.value === "high").length / questions.length);
}
const askRate = askWins / askSlots;
const askChance = askExpected / askSlots;
report.push(`  ${"ask: longest questions".padEnd(20)} ${String(askWins).padStart(4)}/${askSlots} = ${(askRate * 100).toFixed(1)}%`);
if (askRate >= CEILING + 0.15) {
  failures.push(`spending the Ask First budget on the longest questions finds ${(askRate * 100).toFixed(1)}% of the high-value ones (chance ${(askChance * 100).toFixed(1)}%)`);
}

console.log(`Answer-shape tells across ${optionSets.length} scored option sets (chance ${(chance * 100).toFixed(1)}%):`);
console.log(report.join("\n"));

if (failures.length) {
  console.log("\nFAILED — the answer can be found without reading the question:");
  for (const failure of failures) console.log("  - " + failure);
  assert.fail(failures[0]);
}
console.log("\nNo strategy that ignores the question beats chance by a meaningful margin.");
