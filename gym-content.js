/* The Thinking Gym — playable challenges.
   Every scored interaction has an authored answer key, so grading is objective
   and needs no AI at runtime. Plain global, no bundler. */

const MTC_GYM_FORMATS = {
  map: {
    name: "Map It",
    tagline: "Connect two unrelated worlds",
    how: "Each slot is a mechanism from one domain. Tap a slot, then tap the action from the other domain that does the same job. Two cards belong nowhere.",
  },
  flaw: {
    name: "Spot the Flaw",
    tagline: "Find the broken step, then name it",
    how: "Tap the sentence where the reasoning breaks, then name the error.",
  },
  chain: {
    name: "Order the Chain",
    tagline: "And then what happens?",
    how: "Tap the consequences in the order they unfold. One card doesn't belong at all.",
  },
  signal: {
    name: "Sort the Signal",
    tagline: "What does this evidence actually do?",
    how: "For each piece of evidence, tap the card then tap the bucket: does it support the claim, undermine it, or neither?",
  },
};

const MTC_GYM_CHALLENGES = [
  /* ---------------- MAP IT ---------------- */
  {
    id: "gym-map-1", format: "map", track: "creative", difficulty: 1, xpBase: 60,
    title: "The Coffee Shop's Immune System",
    scenario: "A small coffee chain keeps getting burned: card skimmers on the terminals, every barista using one shared password, and a laptop full of customer data that walked out the back door. There is no budget for a security team. Solve it using how the human immune system defends a body.",
    frameworks: ["pattern-recognition", "lateral-thinking", "systems-thinking"],
    payload: {
      sourceDomain: "The human immune system",
      targetDomain: "A coffee shop's security",
      pairs: [
        { prompt: "Barrier defence — skin and mucus block most threats before they are ever inside", match: "Lock the back office and mount the card terminals so tampering leaves a visible mark" },
        { prompt: "Patrolling cells — cheap, constant surveillance that flags anything unfamiliar", match: "A five-second opening checklist: does anything on the till look different from yesterday?" },
        { prompt: "Immune memory — after one infection the body recognises that invader instantly", match: "Log every incident and what it looked like, so the next person spots the same trick in seconds" },
        { prompt: "Compartments — an infection in one tissue does not get free run of every organ", match: "Give each member of staff their own login, so one leaked password does not open everything" },
        { prompt: "Fever — an expensive whole-body response, reserved for genuine invasions", match: "A pre-agreed rule: if a terminal looks tampered with, it goes offline that day and you eat the lost sales" },
      ],
      decoys: [
        "Put up a sign saying the premises are monitored by CCTV",
        "Ask customers to choose a longer PIN at the terminal",
      ],
      misleads: {
        question: "The immune system is a strong model here. Where does it actively mislead you?",
        options: [
          "Immune systems evolved against attackers that cannot read the defence and adapt to it within a week — card fraudsters can, and do",
          "Immune systems have no barrier layer, so the door lock has no biological counterpart",
          "An immune system can overreact and attack the body itself; the business version is security so strict that staff invent workarounds around it",
          "Immune responses are instant, whereas businesses are always slow",
        ],
        answers: [0, 2],
      },
    },
    debrief: {
      principle: "You just did structural transfer: strip a system down to what it DOES — block, patrol, remember, compartmentalise, escalate — and those five jobs have counterparts in anything that has to defend itself, alive or commercial.",
      whereItMisleads: "Analogies smuggle in assumptions along with the useful structure. Biology's attackers do not study your defences and change tactics next month; human ones do. Use the analogy to generate the options, then test each one against the differences.",
    },
  },
  {
    id: "gym-map-2", format: "map", track: "systems", difficulty: 2, xpBase: 60,
    title: "What Ants Know About Logistics",
    scenario: "A delivery network keeps re-planning routes from head office, and keeps being wrong: roadworks, weather and demand move faster than the plan. Redesign the routing using how an ant colony finds food.",
    frameworks: ["systems-thinking", "pattern-recognition", "feedback-loops"],
    payload: {
      sourceDomain: "How an ant colony finds food",
      targetDomain: "A delivery network's routing",
      pairs: [
        { prompt: "No central planner — no ant holds a map, yet the colony still finds short routes", match: "Let each depot choose its own next hop from local conditions instead of routing every decision through head office" },
        { prompt: "Pheromone trails — routes that worked get chemically reinforced by each ant that uses them", match: "Score every route after each run, and bias tomorrow's assignments toward the ones that went cleanly" },
        { prompt: "Evaporation — a trail fades unless ants keep using it", match: "Let old route preferences decay, so a road that was closed six months ago stops shaping today's plan" },
        { prompt: "Wasteful explorers — a fraction of ants keep wandering down paths that turn out worse", match: "Deliberately send a small share of deliveries down non-optimal routes to keep discovering what has changed" },
        { prompt: "Colony-level goal — no individual ant is optimising the whole system, and none needs to", match: "Judge the network on total throughput, not on whether each driver took their own shortest run" },
      ],
      decoys: [
        "Add analysts at head office to plan every route the night before",
        "Pay each driver a bonus for the most parcels delivered per hour",
      ],
      misleads: {
        question: "Where does the ant-colony model mislead you here?",
        options: [
          "Ant terrain barely changes hour to hour, while traffic and weather change constantly — a reinforce-and-decay system can end up chasing noise",
          "Ants have no exploration behaviour, so trying new routes has no basis in the analogy",
          "A colony tolerates individual ants dying; a delivery network cannot treat drivers as expendable, so any mechanism relying on high failure rates transfers badly",
          "Ant colonies are directed by the queen, which makes them a poor model for decentralised routing",
        ],
        answers: [0, 2],
      },
    },
    debrief: {
      principle: "Decentralised systems solve routing with three moving parts: reinforce what worked, let old information decay, and keep a slice of effort exploring. That same triad shows up in ant colonies, search algorithms and any network that has to stay good while the world changes underneath it.",
      whereItMisleads: "The queen does not run the colony — she lays eggs. If your mental model had her directing foragers, you would have transferred the exact opposite lesson. Check you actually understand the source system before borrowing from it.",
    },
  },
  {
    id: "gym-map-3", format: "map", track: "creative", difficulty: 2, xpBase: 60,
    title: "If Pixar Ran the Outpatient Clinic",
    scenario: "An outpatient department has long waits, late discharges, and staff who have stopped suggesting improvements because the last three were cancelled after one complaint. Redesign how it improves itself, using how Pixar develops a film.",
    frameworks: ["design-thinking", "lateral-thinking", "systems-thinking"],
    payload: {
      sourceDomain: "How Pixar develops a film",
      targetDomain: "How a clinic improves itself",
      pairs: [
        { prompt: "The Braintrust — peers critique the work hard, but hold no power to force any change", match: "A monthly case review where clinicians challenge each other's decisions, with nobody's rota or job on the line" },
        { prompt: "'Every film is ugly at first' — early versions are expected to be bad, and this is said out loud", match: "Trial a new clinic layout for one afternoon a week, expecting it to fail, rather than launching it department-wide" },
        { prompt: "Story reels — a cheap, watchable version of the whole film exists long before any scene is finished", match: "Walk one imaginary patient end to end through the entire journey before rebuilding any single step of it" },
        { prompt: "Fix the process, not the person, when something goes wrong", match: "When a discharge runs late, ask which step made lateness likely rather than which nurse was on shift" },
        { prompt: "Protect the ugly baby — a new idea gets a sheltered period before it faces full scrutiny", match: "Give a new triage idea a fixed trial window in which it cannot be cancelled by the first complaint" },
      ],
      decoys: [
        "Commission a well-known consultancy to produce a best-practice report",
        "Add a satisfaction survey at the end of every appointment",
      ],
      misleads: {
        question: "Where does the Pixar model mislead you in a hospital?",
        options: [
          "Pixar can throw away two years of work and start the film again; a clinic cannot stop treating patients while it iterates",
          "Pixar has no peer critique process, so the case review has no counterpart",
          "A failed film costs money, a failed clinical process can cost lives — so 'expect early versions to be bad' has to be fenced to things that cannot hurt anyone",
          "Hospitals have no deadlines, unlike films",
        ],
        answers: [0, 2],
      },
    },
    debrief: {
      principle: "Pixar's real machinery is not creativity, it is a set of rules that make criticism cheap and failure survivable: critique without authority, ugly first versions, whole-thing prototypes, blame the process. Any organisation that wants to improve itself needs those four, whatever it makes.",
      whereItMisleads: "Iteration assumes you can afford a bad version. Where a bad version harms someone, you keep the mechanism and shrink the blast radius — one afternoon, one room, one imaginary patient.",
    },
  },

  /* ---------------- SPOT THE FLAW ---------------- */
  {
    id: "gym-flaw-1", format: "flaw", track: "metacognition", difficulty: 1, xpBase: 45,
    title: "The 5am Founders",
    scenario: "A bestselling productivity programme is built on the research below.",
    frameworks: ["survivorship-bias", "critical-thinking", "cognitive-bias-detection"],
    payload: {
      argument: [
        "We interviewed 100 founders whose companies passed £10m in revenue.",
        "Ninety of them told us they wake before 6am.",
        "We asked each one which single habit mattered most, and the early start came up again and again.",
        "So waking before 6am is what separates the founders who make it from the ones who don't.",
        "The programme is built around a 5:30am start.",
      ],
      flawIdx: 3,
      flawOptions: [
        "Survivorship bias — only successful founders were studied, so nothing at all is known about the early risers who failed",
        "Ad hominem — the argument attacks the founders personally instead of their reasoning",
        "Sunk cost — the programme has already been built, so it must continue",
        "Circular reasoning — the conclusion simply restates the first sentence",
      ],
      flawAnswer: 0,
    },
    debrief: {
      principle: "Any claim about what separates success from failure needs data from both groups. A study of winners alone can tell you what winners have in common — never what caused the winning.",
      whereItMisleads: "Watch sentence three: asking successful people which habit mattered adds confidence without adding evidence. People are poor witnesses to which of their own habits caused what.",
    },
  },
  {
    id: "gym-flaw-2", format: "flaw", track: "causal", difficulty: 2, xpBase: 45,
    title: "The Hospital That Got Worse",
    scenario: "A hospital board is reading this summary before a vote.",
    frameworks: ["analytical-thinking", "critical-thinking", "scientific-thinking"],
    payload: {
      argument: [
        "Last year St Aldate's recruited three leading cardiac surgeons and rebuilt its intensive care unit.",
        "This year its average recovery time is 11% longer than last year's.",
        "No other large change was made in that period.",
        "So the quality of care at St Aldate's has declined.",
        "The board is considering reversing the investment.",
      ],
      flawIdx: 3,
      flawOptions: [
        "Selection effect — better facilities attract sicker, more complex patients, so the average can worsen while every individual patient does better",
        "Straw man — the argument misrepresents what the board actually proposed",
        "False dilemma — only two possible courses of action are considered",
        "Appeal to authority — the argument leans on the surgeons' reputations",
      ],
      flawAnswer: 0,
    },
    debrief: {
      principle: "When the population being measured changes, a metric can move in the opposite direction to the reality underneath it. Averages only compare like with like.",
      whereItMisleads: "The honest comparison is severity-adjusted: how does each category of patient fare now versus before? Raw averages are a measure of who walked through the door as much as what happened to them.",
    },
  },
  {
    id: "gym-flaw-3", format: "flaw", track: "probabilistic", difficulty: 2, xpBase: 45,
    title: "Three Hours of Data",
    scenario: "From a growth team's weekly write-up.",
    frameworks: ["scientific-thinking", "probabilistic-thinking", "base-rates"],
    payload: {
      argument: [
        "On Tuesday morning we split traffic evenly between the old checkout and a new one.",
        "Three hours in, the new checkout was converting 40% better.",
        "We stopped the test there and shipped the new checkout to everyone.",
        "The 40% gain is real, because it came from a controlled experiment with evenly split traffic.",
        "Next quarter's revenue forecast now assumes the 40% uplift.",
      ],
      flawIdx: 3,
      flawOptions: [
        "Sample far too small, and stopped the moment it looked good — early results swing wildly, and a favourable stopping point turns noise into a finding",
        "Correlation mistaken for causation — an experiment like this cannot establish cause at all",
        "Survivorship bias — only customers who completed checkout were counted",
        "Base-rate neglect — the previous conversion rate was never considered",
      ],
      flawAnswer: 0,
    },
    debrief: {
      principle: "A randomised split test genuinely does establish causation — so the tempting answer about correlation is wrong. The failure here is statistical: tiny samples swing enormously, and stopping when the number looks good selects for luck.",
      whereItMisleads: "Fix the sample size and the run length before the test starts, and cover at least one full weekly cycle. 'We'll watch it and stop when it's clear' is how noise gets shipped.",
    },
  },

  /* ---------------- ORDER THE CHAIN ---------------- */
  {
    id: "gym-chain-1", format: "chain", track: "systems", difficulty: 1, xpBase: 50,
    title: "The Rent Cap",
    scenario: "Trace what follows, in order. One card describes something that does not happen at all.",
    frameworks: ["second-order-thinking", "systems-thinking"],
    payload: {
      event: "A city caps how much rent landlords may charge on existing flats.",
      steps: [
        "Tenants already in those flats pay less than before, and stay put far longer",
        "Fewer flats reach the rental market each month, because almost nobody moves out",
        "Landlords and developers shift new investment toward markets with no cap",
        "The supply of rentable homes grows more slowly than the population does",
        "Newcomers and young families face higher rents and longer waits than before the cap existed",
      ],
      intruder: "Rents for existing tenants rise sharply within the first year",
    },
    debrief: {
      principle: "First-order effects are immediate and visible; the effects that decide the outcome arrive later, through how people change their behaviour in response to the first one.",
      whereItMisleads: "Second-order chains lose reliability with every step. Treat steps four and five as strong hypotheses, not facts — and notice that the people harmed are the ones who are not in the room when the policy is written.",
    },
  },
  {
    id: "gym-chain-2", format: "chain", track: "adversarial", difficulty: 2, xpBase: 50,
    title: "Change Your Password Every 30 Days",
    scenario: "A security policy is introduced with good intentions. Order what actually follows.",
    frameworks: ["red-team-thinking", "systems-thinking", "second-order-thinking"],
    payload: {
      event: "A company forces every employee to change their password every 30 days, with strict complexity rules.",
      steps: [
        "Employees cannot memorise a fresh complex password every month",
        "They fall back on a predictable pattern — Summer2024!, then Autumn2024!",
        "Some write the current one on a note by the screen, or reuse it on other sites",
        "An attacker who cracks one old password can guess the next, or find it reused elsewhere",
        "The organisation is now easier to break into than it was before the policy",
      ],
      intruder: "Employees begin choosing longer, genuinely random passwords and store them in a manager",
    },
    debrief: {
      principle: "A rule that exceeds human capacity does not produce compliance, it produces workarounds — and the workaround, not the rule, is your real policy.",
      whereItMisleads: "This is why modern guidance dropped forced rotation in favour of long passphrases, multi-factor authentication and resets only after a suspected breach. Any policy designed for imaginary people is a policy for nobody.",
    },
  },
  {
    id: "gym-chain-3", format: "chain", track: "causal", difficulty: 2, xpBase: 50,
    title: "The Camera Kodak Buried",
    scenario: "Order the chain that ends a 130-year-old company.",
    frameworks: ["first-principles-thinking", "second-order-thinking", "strategic-thinking"],
    payload: {
      event: "In 1975 a Kodak engineer builds the first digital camera, and management shelves it.",
      steps: [
        "Film stays hugely profitable, and every incentive inside Kodak protects it",
        "Digital camera development happens at competitors instead",
        "Digital image quality passes the threshold ordinary customers actually care about",
        "Customers abandon film faster than Kodak can replace the profits it earned from film",
        "Kodak files for bankruptcy in 2012, holding digital patents it never built a business on",
      ],
      intruder: "Kodak's film sales grow through the 2000s as customers return to prints",
    },
    debrief: {
      principle: "Defining your business by the product you sell rather than the need you serve turns your most profitable line into the thing that kills you. Kodak sold film; customers wanted to keep memories.",
      whereItMisleads: "Hindsight makes the chain look obvious, but at each single step protecting film was the defensible choice. The skill is spotting the step where a reversible decision quietly became irreversible.",
    },
  },

  /* ---------------- SORT THE SIGNAL ---------------- */
  {
    id: "gym-signal-1", format: "signal", track: "causal", difficulty: 1, xpBase: 50,
    title: "Did the Coaching Work?",
    scenario: "Sort each finding by what it does to the claim.",
    frameworks: ["scientific-thinking", "regression-mean", "critical-thinking"],
    payload: {
      claim: "Our new sales coaching programme is what improved the team's numbers.",
      evidence: [
        { text: "Reps assigned at random to the coaching improved 12% more than reps who were not", bucket: "supports" },
        { text: "Commission rates were raised in the same month the coaching started", bucket: "undermines" },
        { text: "Across the whole industry, sales rose about 12% this quarter", bucket: "undermines" },
        { text: "Attendance was voluntary, and the reps who volunteered were already the top performers", bucket: "undermines" },
        { text: "Six months after the coaching ended, the improvement is still there", bucket: "supports" },
        { text: "The coach has twenty years of experience and excellent references", bucket: "irrelevant" },
        { text: "The team's job-satisfaction survey scores also went up", bucket: "irrelevant" },
      ],
    },
    debrief: {
      principle: "Evidence is never good or bad in the abstract — only for or against a specific claim. The question to ask of every item is: would I still expect to see this if the claim were false?",
      whereItMisleads: "Credentials, satisfaction scores and vivid individual stories feel like evidence, but they cannot separate the claim from its rivals. A rival explanation that also predicts your data is not weak evidence against you — it is the thing you have to rule out.",
    },
  },
  {
    id: "gym-signal-2", format: "signal", track: "adversarial", difficulty: 2, xpBase: 50,
    title: "Twelve Months of Runway",
    scenario: "You are deciding whether to join this startup. Sort what you have learned.",
    frameworks: ["intelligence-analysis", "risk-assessment", "critical-thinking"],
    payload: {
      claim: "This startup will run out of money within a year.",
      evidence: [
        { text: "Headcount doubled in six months while revenue stayed flat", bucket: "supports" },
        { text: "Their largest customer, worth 40% of revenue, did not renew", bucket: "supports" },
        { text: "They have just moved into a larger, more expensive office", bucket: "supports" },
        { text: "They closed a funding round two months ago giving 18 months of runway", bucket: "undermines" },
        { text: "Gross margin improved from 40% to 65% this quarter", bucket: "undermines" },
        { text: "They cut marketing spend by 60% and revenue did not fall", bucket: "undermines" },
        { text: "The founders post frequently and enthusiastically about growth", bucket: "irrelevant" },
        { text: "The chief executive gave a well-received keynote at a major conference", bucket: "irrelevant" },
      ],
    },
    debrief: {
      principle: "Analysts separate what changes the estimate from what merely feels informative. Cash-in, burn rate and revenue concentration move the answer; visibility and enthusiasm do not move it at all.",
      whereItMisleads: "Note that the same fact can flip depending on the claim: an expensive new office supports 'they will run out of money' but would undermine 'the founders are being cautious'. Always name the claim before you judge the evidence.",
    },
  },
  {
    id: "gym-signal-3", format: "signal", track: "probabilistic", difficulty: 2, xpBase: 50,
    title: "The Positive Screening Result",
    scenario: "A patient with no symptoms has just tested positive in a routine screen.",
    frameworks: ["bayesian-thinking", "base-rates", "probabilistic-thinking"],
    payload: {
      claim: "This positive result means the patient probably has the disease.",
      evidence: [
        { text: "The disease affects roughly 1 in 1,000 people in this population", bucket: "undermines" },
        { text: "The test wrongly flags 5% of healthy people as positive", bucket: "undermines" },
        { text: "The patient was screened routinely, with no symptoms at all", bucket: "undermines" },
        { text: "The test correctly identifies 99% of people who do have the disease", bucket: "supports" },
        { text: "The patient has three of the disease's known risk factors", bucket: "supports" },
        { text: "A second, independent test also came back positive", bucket: "supports" },
        { text: "The test was developed at a highly regarded university", bucket: "irrelevant" },
        { text: "The lab processed 400 samples that day", bucket: "irrelevant" },
      ],
    },
    debrief: {
      principle: "With a rare disease, false positives outnumber true ones even when the test is excellent. 1 in 1,000 prevalence and a 5% false-positive rate means about 50 healthy people flagged for every single true case — the base rate, not the accuracy, dominates the answer.",
      whereItMisleads: "'99% accurate' is the number everyone remembers and the one that misleads. The two numbers that decide it are how rare the condition is and how often the test cries wolf.",
    },
  },
];
