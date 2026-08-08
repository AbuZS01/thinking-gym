/* The Thinking Gym — walkthroughs.
   Static, no-AI explainers shown once before a player's first challenge in a new
   muscle or format: what the skill is, why it matters, a worked example — then
   into the real (scored) challenges. Revisitable anytime from Profile -> Thinking
   Guides. Kept in its own file so content.js/gym-content.js don't have to grow
   further to hold it. */

const MTC_WALKTHROUGHS = {
  muscle: {
    notice: {
      title: "Notice",
      emoji: "\u{1F575}️",
      lede: "Most bad decisions do not start with bad thinking. They start with missing something that was there all along.",
      explain: [
        "Notice is the muscle that catches the detail everyone else skims past — the missing number in a claim, the sentence that quietly changes the subject, the pattern that only shows up once you line a few things up side by side.",
        "It comes before judgement. You cannot weigh evidence you never spotted in the first place.",
      ],
      example: {
        scenario: "A job advert says: “Our team grew 300% last year!”",
        walk: [
          "The number sounds impressive on its own.",
          "Notice asks: 300% of what? A team that grew from 2 people to 8 has technically “grown 300%” and is still a tiny, possibly unstable team.",
          "The claim is true and still tells you almost nothing about whether this is a well-run company.",
        ],
        answer: "A striking number is a prompt to ask “compared to what, and is that the whole picture?” — not a reason to stop looking.",
      },
    },
    judge: {
      title: "Judge",
      emoji: "⚖️",
      lede: "Two sources can both be telling the truth and still point you in opposite directions. Judge is what lets you weigh them instead of just picking whichever one you saw first.",
      explain: [
        "Judge means holding more than one piece of evidence at once and asking how much each one should actually move your opinion — not just whether it agrees with what you already think.",
        "The instinct is to trust whichever fact arrived first, or whichever one sounds most dramatic. Judge slows that down.",
      ],
      example: {
        scenario: "A friend says a restaurant “gave him food poisoning” last week. The restaurant has 4.6 stars from 800 reviews.",
        walk: [
          "One vivid story feels stronger than eight hundred quiet ratings — but a sample of one tells you very little about the odds.",
          "Judge asks: how common is this in general, and does one report actually shift that much against eight hundred others?",
          "That doesn't mean ignoring your friend. It means weighing his one data point against the wider pattern, not letting it override it.",
        ],
        answer: "The honest conclusion is often “this could still be true, but it shouldn't outweigh everything else I know” — not “the review score must be wrong”.",
      },
    },
    connect: {
      title: "Connect",
      emoji: "\u{1F9E9}",
      lede: "The fastest way through an unfamiliar problem is often realising it isn't actually unfamiliar — something else has already solved a version of it.",
      explain: [
        "Connect means spotting that two things which look nothing alike are doing the same underlying job — a nightclub bouncer and a spam filter are both deciding who gets past a gate.",
        "Once you see the match, you can borrow the solution — and just as importantly, spot where the comparison breaks down.",
      ],
      example: {
        scenario: "A small charity is struggling to get volunteers to actually show up on the day.",
        walk: [
          "That isn't really a “charity” problem — it's a “getting people to keep a commitment” problem.",
          "Connect asks: who else has solved this? Gyms solve it with class bookings and a cancellation fee. Borrow the mechanism: a specific time slot plus a reminder does the same job.",
          "The charity isn't a gym, so the match isn't perfect — there's no fee to charge — but the underlying mechanism still transfers.",
        ],
        answer: "Borrowing the mechanism, not the exact solution, is what makes the comparison useful instead of misleading.",
      },
    },
    prioritise: {
      title: "Prioritise",
      emoji: "\u{1F3AF}",
      lede: "When everything feels urgent, the real risk isn't doing too little — it's spending your limited time on the wrong thing first.",
      explain: [
        "Prioritise means sorting by what actually matters — danger, how fast something is getting worse, whether it can wait — rather than by what's loudest or most recent.",
        "It's a skill you can only really practise under a constraint. With unlimited time, everything gets done anyway.",
      ],
      example: {
        scenario: "You come home to a dripping pipe under the sink, three missed calls from your landlord, and a parcel left on the doorstep in the rain.",
        walk: [
          "All three want attention right now. Prioritise asks which one gets worse the fastest if you ignore it.",
          "The pipe is actively causing damage every minute — that goes first. The parcel is already wet; a few more minutes changes little. The landlord's calls can wait until the pipe is off.",
        ],
        answer: "The rule isn't “what's most annoying” — it's “what gets worse the fastest if I do nothing”.",
      },
    },
    question: {
      title: "Question",
      emoji: "\u{1F50D}",
      lede: "The question you don't think to ask is usually the one that would have changed your decision.",
      explain: [
        "Question means finding the one or two facts you're currently missing that would actually change what you do — not asking everything, and not asking nothing.",
        "Some questions are just interesting. Others are load-bearing: the answer genuinely flips the decision. Question is about telling those apart before you spend your limited time asking.",
      ],
      example: {
        scenario: "A flatmate wants to sublet their room for a month while they're away.",
        walk: [
          "You could ask dozens of things — their travel plans, why now. Most wouldn't change your answer.",
          "Question asks: what would actually change my decision? “Who's moving in, and does my name stay on the lease if something goes wrong?” — that one matters. “Where are you going?” is nice to know either way.",
        ],
        answer: "Before asking, picture the answer. If your decision would be the same either way, it isn't one of your questions.",
      },
    },
    adapt: {
      title: "Adapt",
      emoji: "\u{1F504}",
      lede: "A good plan that ignores new information is worse than a rough plan that responds to it.",
      explain: [
        "Adapt means noticing when the situation has actually changed — not just gotten harder — and adjusting, rather than pushing through on autopilot.",
        "The trap is sunk cost: sticking with a plan because you've already invested in it, even after the facts that justified it have changed.",
      ],
      example: {
        scenario: "You planned a picnic. An hour before, the forecast flips from sunny to heavy rain.",
        walk: [
          "The plan was built on a fact — good weather — that no longer holds. Adapt asks: what's the actual goal underneath the plan? Time with friends, not specifically grass and sunshine.",
          "Moving it indoors keeps the real goal intact. Going ahead outdoors “because it's already planned” serves the old plan, not the goal.",
        ],
        answer: "Ask what fact your plan depends on, and check whether that fact is still true — not whether the plan is already in motion.",
      },
    },
  },

  format: {
    map: {
      title: "Map It",
      emoji: "\u{1F517}",
      lede: "Some ideas make more sense once you see them doing the same job in a completely different setting.",
      explain: [
        "Map It shows you how something works in one setting, then asks you to find the choice that does the same job in a different setting.",
        "It's the interactive version of the Connect muscle: matching by function, not by surface appearance.",
      ],
      example: {
        scenario: "Setting one: air traffic control. Setting two: your email inbox.",
        walk: [
          "A controller can't land every waiting plane at once — physical capacity limits how many can arrive per hour, so lower-priority flights get sequenced later.",
          "Your inbox faces the same underlying job — deciding what gets your limited attention first — solved by triaging urgency, not by first-in-first-out.",
        ],
        answer: "In the real board, two of the choices on offer will sound plausible but actually do a different job — Map It is testing whether you matched by function or just by vibe.",
      },
    },
    flaw: {
      title: "Spot the Flaw",
      emoji: "\u{1F50D}",
      lede: "An argument can use entirely real facts and still reach the wrong conclusion — because the flaw isn't in the facts, it's in the step connecting them.",
      explain: [
        "Spot the Flaw hands you a short chain of reasoning and asks you to find the exact sentence where it stops following.",
        "Most flawed arguments aren't lying. They're using a true fact to justify a jump that fact doesn't actually support.",
      ],
      example: {
        scenario: "“Sales rose after we launched the new logo. The new logo is working.”",
        walk: [
          "Sales rising is a real fact. The flaw is the next sentence: it assumes the logo caused the rise, without ruling out anything else happening at the same time — a sale, a season, a competitor closing.",
        ],
        answer: "The skill is naming the exact sentence where a true fact turns into an unsupported leap — not just sensing that “something feels off”.",
      },
    },
    chain: {
      title: "Order the Chain",
      emoji: "⛓️",
      lede: "Most consequences don't stop at the first effect — and the second-order effect is often the one nobody planned for.",
      explain: [
        "Order the Chain gives you a starting event and a set of consequences, and asks you to put them in the order they'd actually unfold.",
        "One card in the set is a plausible-sounding distractor that doesn't actually follow at all — leave it out.",
      ],
      example: {
        scenario: "Starting point: a city removes free parking in its centre.",
        walk: [
          "First: fewer people drive in, so town-centre traffic drops.",
          "Then: some of those trips don't disappear — they move to nearby streets that are still free, pushing congestion there instead.",
          "A distractor might claim “shops close within a week” — dramatic, but far too fast for a real behavioural shift.",
        ],
        answer: "Ordering the real chain means separating what happens first from what only becomes visible once the first effect has had time to play out.",
      },
    },
    signal: {
      title: "Sort the Signal",
      emoji: "\u{1F4CA}",
      lede: "Not every fact that gets mentioned next to a claim is actually evidence for or against it.",
      explain: [
        "Sort the Signal gives you a claim and a set of facts, and asks whether each one makes the claim stronger, weaker, or does neither.",
        "“Does neither” is the option people forget exists — plenty of true, relevant-sounding facts are just noise dressed up as signal.",
      ],
      example: {
        scenario: "Claim: “This diet works.” Fact: “The person who tried it also started walking to work.”",
        walk: [
          "That fact doesn't clearly support or undermine the claim on its own — it introduces a second explanation that muddies the result.",
          "A fact like “they lost weight in a trial with a control group” would genuinely strengthen it. A fact like “the packaging is green” does neither.",
        ],
        answer: "Sorting by what a fact actually does to the claim, not by whether it sounds impressive, is what makes this useful.",
      },
    },
    workout: {
      title: "Work It Out",
      emoji: "\u{1F9EE}",
      lede: "Some problems can't be solved in one leap — you have to lock in one correct step before the next one even makes sense.",
      explain: [
        "Work It Out breaks a problem into steps. You pick the best answer for the current step before the next one is revealed, so you can't skip ahead by pattern-matching the final answer.",
        "A wrong choice costs half the points for that step rather than the whole problem, so one stumble doesn't sink the run.",
      ],
      example: {
        scenario: "Problem: split a £90 bill three ways, but one person only had a starter.",
        walk: [
          "Step 1: work out what an equal split would be (£30 each) before adjusting anything.",
          "Step 2: only once that's settled does it make sense to work out the starter-only person's fair reduction.",
        ],
        answer: "Solving it step by step stops you from guessing the final number and working backwards to justify it.",
      },
    },
    ask: {
      title: "Ask First",
      emoji: "❓",
      lede: "You rarely get to ask everything before deciding — the skill is choosing which few questions are actually worth spending on.",
      explain: [
        "Ask First gives you a limited number of questions before you must commit to a decision. Tap a question to see its answer immediately.",
        "You're scored on asking the questions whose answers could genuinely change your choice — not on asking the most questions, or the most interesting ones.",
      ],
      example: {
        scenario: "You're about to lend a friend some money. You have two questions before you decide.",
        walk: [
          "“What's it for?” is interesting, but for most amounts it won't change whether you lend it.",
          "“When exactly can you pay it back, and what happens if that date slips?” — that answer could genuinely flip your decision.",
        ],
        answer: "Before asking, picture both possible answers. If your decision would be the same either way, it's not one of your questions.",
      },
    },
    triage: {
      title: "Sort by Priority",
      emoji: "\u{1F6A6}",
      lede: "Under pressure, a clear rule beats a gut feeling — because a rule treats the same situation the same way every time.",
      explain: [
        "Sort by Priority gives you a stated rule and a set of items, and asks you to sort every item into the right group using that rule — not your instinct about what feels most urgent.",
        "The point isn't guessing the “right” order from scratch. It's applying the rule you were given consistently, even to the items that don't feel dramatic.",
      ],
      example: {
        scenario: "Rule: a hospital reception sorts arrivals into “see immediately”, “see within the hour”, or “can wait”.",
        walk: [
          "Someone calmly describing chest pain goes to “see immediately” — even though they're not shouting — because the rule is based on risk, not volume.",
          "Someone visibly upset about a long wait, but there for a repeat prescription, goes to “can wait” — the rule doesn't move for how loud someone is.",
        ],
        answer: "Applying the rule the same way to every item, including the ones that don't feel dramatic, is the actual skill being tested.",
      },
    },
  },
};
