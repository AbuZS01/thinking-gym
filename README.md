# The Thinking Gym

**Practise clearer everyday decisions.** Short, playable challenges cover money,
work, relationships, scams, health, home and personal safety. Thirty challenges
use familiar jobs and responsibilities such as hospitality, factories, teaching,
driving, parenting, care work, retail and delivery work. Ten of those train
practical creativity inside clear safety, cost and time limits.

A self-contained static web app — no backend, no build step, no external
services, and **no AI anywhere in the user journey**. Every challenge is scored
against a hand-written answer key, so feedback is instant, free, identical for
everyone, and never says "grade yourself". Progress lives in your browser's
`localStorage`: fully private, works offline.

## Getting around

Four tabs along the bottom:

| Tab | What's in it |
|---|---|
| **Home** | streak / points / challenges-done strip, today's challenge, track preview |
| **Challenges** | today's session, eight real-life areas, six thinking skills, Deep Work, Boss Battle, Calibration, Review |
| **Progress** | everyday improvement summary, skills to practise, calibration trend, weekly report, journal |
| **Profile** | level badge, achievements, toolbox and frameworks, export / import / erase |

Every screen is also a deep link (`#/gym/play/<id>`, `#/journal`, `#/toolbox`, …),
and the tab bar lights the owning tab whichever route you land on.

## The Gym

Three challenges a day, about ten minutes, played by tapping rather than typing.
**136 challenges** across seven formats, each objectively scored:

- **Map It** — slots hold a mechanism from one domain (an immune system, an ant
  colony, an animation studio's process); you tap the action from a completely different
  domain that does the same job. Two cards belong nowhere. Ends by asking where
  the analogy misleads.
- **Spot the Flaw** — tap the sentence where an argument breaks, then name the
  error.
- **Order the Chain** — put the consequences of a decision in the order they
  unfold; one card doesn't belong in the chain at all.
- **Sort the Signal** — file each piece of evidence as supporting, undermining,
  or neither.
- **Work It Out** — an everyday problem worked one step at a time. Later steps
  stay hidden until the current one is settled. Job scenarios include every rule
  needed on the card, so the player never needs experience in that job.
- **Triage** — a plain rule is stated on the board and you sort items into priority
  groups by applying it. The answer follows from the rule shown, not from hidden
  knowledge or the writer's personal preference.
- **Ask First** — a situation full of unknowns and a budget of three questions.
  Tapping one reveals its answer. Marks go to the questions whose answers would
  actually change what you do; the rest are interesting and cost you a slot. Once
  the budget is spent everything is revealed, so the final call is fair even to
  someone who spent badly — the score separates *what you asked* from *what you
  concluded*.

Multiple-choice options are shuffled at render (deterministically per challenge, so
nothing reorders mid-play) while the authored answer key stays fixed. Without that,
every answer sits in the slot it was written in and the whole game falls to "always
tap the top option".

Creativity challenges do not pretend that one idea is the only imaginative answer.
Points are awarded for recognising the option that meets every stated limit. Players
are then invited to write another idea, which is private and never graded. A good
example is shown alongside checks for safety, clarity, cost and practical use.

The Gym uses global English. Familiar pound and dollar examples remain because the
currency does not change the reasoning. Speeds include both mph and km/h, and terms
such as cash machine / ATM or store credit / shop credit are paired when useful.
No answer depends on unstated local rules, an unexplained historical event or knowledge of a
particular company. Every rule needed to answer appears on the challenge card.

Challenges can be browsed first by **real-life area**: Money and bills, Scams and
online safety, Friends and relationships, Work and jobs, Home and renting, Health
and wellbeing, Study and early career, and Travel and personal safety. Every
challenge also keeps its **mental muscle** — what the challenge makes you *do*:

| | | |
|---|---|---|
| 🕵️ **Notice** | Spot what's easy to miss | 24 |
| ⚖️ **Judge** | Weigh conflicting evidence | 28 |
| 🧩 **Connect** | Find patterns across unrelated domains | 13 |
| 🔄 **Adapt** | Change the plan when reality changes | 23 |
| 🎯 **Prioritise** | Choose under pressure | 16 |
| 🔍 **Question** | Work out what's missing before you act | 18 |

Those last two are why organising this way was worth doing: framework families
hid the fact that almost nothing in the bank trained prioritising under pressure
or working out what you'd need to know before acting. Both have since been
filled in — the Triage and Ask First formats exist because of that gap.

A challenge's muscle and its framework tags are different axes — a Map It
challenge about casinos trains *Connect* while its subject is probability — so
playing one credits both.

Every challenge ends with three useful pieces: **the principle** you just used,
**where it can mislead you**, and **use this tomorrow**, which connects the skill
to an ordinary next decision. Challenges are graded 0–100%, replay themselves
on a spaced schedule based on how well you did, and feed the six thinking skills.

Each one also offers a **hint** (one nudge sentence, costing 15% of the score).
The result and progress save as soon as the answer appears. An optional journal
note is a separate action: it earns a flat +5 points and is never graded. The day's three
are picked from what's due for replay, then what you've never played, then your
weakest. They stay stable within a day so refreshing or completing one does not
reshuffle the session. When a life focus is chosen, relevance is allowed to matter
more than having three different game formats.

## Deep Work and the rest

- **Deep Work** — the long-form written bank: 10 exercises a day (warm-up,
  challenge, real-world case, reflection, creativity, logic puzzle, decision
  scenario, bias detection, observation, fluency) drawn from 77 hand-written
  exercises, weighted toward whichever thinking frameworks you're weakest in.
  Most of these now have a Gym twin — the same reasoning move, objectively scored —
  and keep their written form alongside it, since a model answer and three
  progressive Socratic hints are worth having even when a tap version exists.
  Reflection, fluency and divergent creativity stay written only: there is no
  honest answer key for "describe a belief you changed", and scoring a
  fifteen-ideas exercise for correctness would destroy what it trains.
- **Weekly Boss Battle** — a multi-stage, no-perfect-answer scenario (business,
  history, cybersecurity, AI, ethics, economics) that rotates weekly across 9
  battles.
- **Framework Encyclopedia** — 30 thinking styles (critical thinking, first
  principles, Bayesian thinking, game theory, red-team thinking, etc.), each
  covering what problem it solves, why smart people get it wrong, when it's
  dangerous, a famous example, and how an expert applies it.
- **Thinking Toolbox** — 38 quick-reference tools and mental models. Public names
  stay plain, such as **Leave a Safety Buffer**, **Follow the Reward** and **The
  Plan Is Not Reality**; formal names are shown as secondary information.
- **Leveling & Achievements** — an RPG-style level curve (1 → 100, with titles
  from "Beginner Observer" to "Grand Strategist"), XP, streaks, and 29
  achievements.
- **Calibration training** — auto-graded true/false questions answered with a
  confidence level (scored with a proper scoring rule, so honest confidence
  maximizes XP) plus 90%-confidence-interval estimates, with a personal
  accuracy-vs-confidence curve. No honor system.
- **Spaced review** — the frameworks and toolbox become an SM-2 style
  spaced-repetition deck (Again/Hard/Good/Easy), capped at 5 new cards a day.
- **Weekly Report** — XP, exercises, calibration and review activity this week
  vs last, plus a suggested focus from your weakness data.
- **Journal** — every answer you submit is saved and browsable, so you can
  watch how your reasoning changes over time.
- **Export / Import** — back up all progress (including the journal) to a JSON
  file from the Profile tab, and restore it on any device.

Gym challenges are graded objectively. Deep Work exercises are self-assessed:
you attempt one, optionally reveal progressive Socratic hints (each costs 20% of
that exercise's XP), then check off plain-language criteria against the model
answer — a written answer can only ever be graded by its writer, which is
exactly why the Gym exists alongside it.

Model answers stay locked until you've written a real attempt — active recall
before explanation. Two mechanics keep the daily habit sustainable: a visible
grace shield absorbs one missed day (spent automatically, re-earned by
finishing the ★ core trio), and each daily quest marks that core trio — the
warm-up plus the two exercises that best target your weakest frameworks — so a
short session still counts.

## Running it

No build step, no dependencies. Any static file server works:

```bash
cd master-thinking-coach
python3 -m http.server 8080
# then open http://localhost:8080
```

Or just open `index.html` directly in a browser (everything is plain
`<script>` tags, no ES modules, so `file://` works too — the service worker
simply stays inactive on `file://`).

## Installing it on your phone (PWA)

The app is an installable Progressive Web App: once it's served over HTTPS
(see hosting below), open it in the browser and:

- **iPhone (Safari):** Share button → "Add to Home Screen"
- **Android (Chrome):** the install prompt, or menu → "Install app"

It gets its own icon, launches full-screen without browser chrome, and works
fully offline (a service worker caches the whole app; your data was always
local).

The quickest free hosting: push this repo to GitHub, enable **GitHub Pages**
on the repository (Settings → Pages → deploy from branch), and it's live over
HTTPS at `https://<you>.github.io/<repo>/`. Netlify/Vercel free tiers work the
same way.

When you change any shipped file, bump `CACHE_VERSION` in `sw.js` so installed
copies pick up the update.

## Project structure

- `gym-content.js` — the Gym: challenges and their answer keys, one object per
  challenge. Plain data — add challenges here and they appear in rotation.
- `gym.js` — the play layer: four tap-only board formats, scoring, result
  screen. No drag-and-drop (unreliable on touch, invisible to keyboards) — every
  control is a button, so the whole game is playable by tab and Enter.
- `content.js` — the written bank: frameworks, toolbox, exercises, boss
  battles, achievements, level titles, skill tracks.
- `engine.js` — game logic: XP/leveling curve, streaks, daily quest
  generation (with weakness-weighted selection), achievement rules, boss
  battle rotation. Pure functions over a plain state object.
- `app.js` — UI layer: renders screens from engine state, handles all
  interaction via event delegation.
- `style.css`, `index.html` — presentation and shell. The theme is a violet
  mobile design system driven by custom properties in `:root`; `--tabbar-h` and
  the `scroll-padding` on `html` are coupled, since both sticky bars (app bar,
  play-screen action row) have to stay clear of anything the browser scrolls to.
- `sw.js` — service worker (stale-while-revalidate). Bump `CACHE_VERSION` on
  every shipped change or installed copies keep serving the old build.

## Extending it

- Add exercises/frameworks/toolbox entries/boss battles by adding objects to
  the arrays in `content.js` — no other file needs to change.
- Add achievements by adding `{ id, name, desc, xp, rule }` to
  `MTC_ACHIEVEMENTS`, where `rule` is a function of the aggregated stats
  object (see existing ones for examples).
- Add Gym challenges by appending to `MTC_GYM_CHALLENGES` in `gym-content.js`.
  Each needs `id, format, track, difficulty, xpBase, title, scenario,
  frameworks, emoji, hint, payload, debrief`; `frameworks` entries must be real
  ids from `MTC_FRAMEWORKS` or `MTC_TOOLBOX`, and each format has its own
  `payload` shape (see the five existing groups). Nothing else needs changing —
  new challenges enter rotation, the tracks, and the replay schedule on their
  own, and option order is shuffled for you, so write the answer wherever reads
  most clearly.
- Adding a **format** means: an entry in `MTC_GYM_FORMATS`, a board renderer and
  a branch in `score()`, `reviewHTML()` and the `playHTML` dispatch in `gym.js`,
  a click case in `handleClick`, an icon in `FORMAT_ICONS` (`app.js`), and a
  headline in the `nailedIt` map. `engine.js` needs nothing — `submitGymChallenge`
  works off `xpBase`, `frameworks` and the score, and `gymSession` picks on rank
  plus format diversity, so a new format enters rotation unaided.
