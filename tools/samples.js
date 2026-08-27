/* Coach tuning fixtures — a curated eval set for tools/coach-harness.js.
 *
 * The brief (§15 step 7) says to test the coach "against many answer qualities,
 * including short, incorrect, unusual and high-quality responses." This is that
 * set: a few real exercises, each with answers spanning empty → off-topic →
 * short → weak → strong, so you can read the coach's feedback side by side and
 * see whether the system prompt is calibrating (praising only what's there,
 * pushing the strong answer further, not inventing the learner's facts).
 *
 * Self-contained on purpose — no dependency on the app's content files — so the
 * harness is portable and the eval set is stable while you tune prompt.js.
 */

"use strict";

module.exports = [
  {
    id: "menu-decoy",
    exercise: {
      type: "warmup",
      skill: "Critical Thinking, Cognitive Bias Detection",
      prompt:
        "A restaurant removes its cheapest item from the menu and changes nothing else. Within a month, average order value rises noticeably. Write your first-instinct explanation. Then write one alternative explanation that has nothing to do with the removed item.",
      grounding:
        "Critical Thinking: evaluating claims and arguments before accepting them. An expert separates the claim, the evidence, and the arguer, and checks each independently before judging the whole. Trap: treating 'critical' as 'cynical' rather than actually checking.",
      modelAnswer:
        "Removing a cheap 'decoy' can shift the anchor customers use, so mid-priced items look better and people trade up — but a promotion, seasonality, or a different crowd that month could produce the same result. One month supports a hypothesis, not a conclusion.",
      rubric: [
        "Wrote a gut-instinct explanation before analysing",
        "Explained HOW removing the cheap dish could raise spend (it changed the comparison prices)",
        "Gave a second explanation unrelated to the menu change (season, promotion, different crowd)",
        "Did not treat one month of data as proof",
      ],
    },
    answers: [
      { quality: "empty", text: "" },
      { quality: "off-topic", text: "I think the food probably tasted better after they cleaned the kitchen." },
      { quality: "short", text: "Removing the cheap item made people spend more." },
      {
        quality: "weak",
        text: "They took away the cheapest thing so obviously people had to buy the more expensive stuff. That's why the average went up. It's the only explanation that makes sense.",
      },
      {
        quality: "strong",
        text: "First instinct: the cheap item was a price anchor, so once it's gone the mid-priced dishes look reasonable by comparison and people trade up. But that's one story. An unrelated alternative: the month they measured had a different crowd — fewer budget/solo diners, or a promotion ran — which raises the average without any anchoring effect. One month is a hypothesis, not proof; I'd compare the same month last year and check who was actually dining.",
      },
    ],
  },

  {
    id: "subscription-cliff",
    exercise: {
      type: "challenge",
      skill: "Second-Order Thinking, Decision Theory",
      prompt:
        "A SaaS company converts 15% of trial users to paid (industry average 8%). Leadership wants to cut the trial from 14 to 7 days to 'accelerate the funnel.' Map at least two rounds of consequences: the first-order effect, then what that effect itself causes next.",
      grounding:
        "Second-Order Thinking: tracing the consequences of consequences. An expert asks 'and then what?' past the first effect and watches for how the type of outcome shifts, not just the amount. Trap: stopping at one extra step and declaring victory.",
      modelAnswer:
        "First-order: users who need more than 7 days to see value stop converting, and the mix of who converts shifts toward the already-convinced. Second-order: that cohort is less informed, so churn and support cost rise months later, and the headline conversion rate looks fine while revenue quality drops.",
      rubric: [
        "Named a specific immediate effect",
        "Then asked 'and what does THAT cause?' and wrote the next effect",
        "Considered how the TYPE of customer changes, not just the number",
        "Looked past sign-ups to later numbers (churn, support load)",
      ],
    },
    answers: [
      { quality: "empty", text: "" },
      { quality: "short", text: "Shorter trial means faster conversions and more revenue, so they should do it." },
      {
        quality: "weak",
        text: "If the trial is shorter people will decide quicker, so conversions go up and the company makes more money faster. Seems like a good idea.",
      },
      {
        quality: "strong",
        text: "First-order: a 7-day window filters out users who need longer to reach an aha moment, so raw conversion count may hold but the composition changes — you keep the already-sold and lose the deliberate evaluators. Second-order: that new cohort is less informed about the product, so 60–90 days out you see higher churn and heavier support load, while the vanity 'conversion rate' still looks healthy. Third-order: leadership reads the flat rate as success and cuts further, compounding the quality problem. I'd change my mind if cohort churn stayed flat after the change.",
      },
    ],
  },

  {
    id: "hiring-anchor",
    exercise: {
      type: "bias",
      skill: "Cognitive Bias Detection",
      prompt:
        "A manager says: 'The first candidate asked for £80k, so everyone after them felt cheap and I hired the £65k one quickly.' Name the bias at work, explain how it operated in this specific case, and give one concrete way to reduce it next time.",
      grounding:
        "Cognitive Bias Detection: spotting predictable errors in judgement. An expert names the bias, shows its mechanism in the specific case, and proposes a concrete debias step. Trap: labelling the bias without showing how it actually distorted this decision.",
      modelAnswer:
        "Anchoring: the £80k figure became the reference point, so £65k read as 'cheap' regardless of the candidate's actual value. Debias: set the budget and the must-have criteria before seeing any salary numbers, and evaluate candidates against those, not against each other.",
      rubric: [
        "Named the bias (anchoring)",
        "Explained the mechanism in THIS case (the £80k set the reference point)",
        "Noted the decision was made against the anchor, not the candidate's value",
        "Gave a concrete debias (decide criteria/budget before seeing numbers)",
      ],
    },
    answers: [
      { quality: "empty", text: "" },
      { quality: "label-only", text: "That's anchoring bias." },
      {
        quality: "weak",
        text: "It's anchoring. The first number stuck in his head. He should just be more objective next time and not let numbers influence him.",
      },
      {
        quality: "strong",
        text: "This is anchoring. The £80k request became the reference point, so every later figure was judged as 'above' or 'below' 80 rather than against what the role is actually worth — £65k felt like a bargain purely because of the anchor, not because the candidate was the right hire. The speed ('hired quickly') is the tell: he was comparing to the anchor, not evaluating fit. Debias: fix the salary band and the must-have criteria in writing before any candidate names a number, then score each person against those criteria, never against each other.",
      },
    ],
  },
];
