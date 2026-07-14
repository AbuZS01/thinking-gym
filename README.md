# Master Thinking Coach

A gamified, long-term training program for critical thinking, reasoning, mental
models, and decision-making — built as a self-contained static web app (no
backend, no build step, no external services). Progress is stored in your
browser's `localStorage`, so it's fully private and works offline.

## What's in it

- **Daily Quest** — 9 exercises a day (warm-up, challenge, real-world case,
  reflection, creativity, logic puzzle, decision scenario, bias detection,
  observation), pulled from a bank of 36 hand-written exercises and weighted
  toward whichever thinking frameworks you're weakest in.
- **Weekly Boss Battle** — a multi-stage, no-perfect-answer scenario (business,
  history, cybersecurity, AI, ethics, economics) that rotates weekly across 6
  battles.
- **Framework Encyclopedia** — 29 thinking styles (critical thinking, first
  principles, Bayesian thinking, game theory, red-team thinking, etc.), each
  covering what problem it solves, why smart people get it wrong, when it's
  dangerous, a famous example, and how an expert applies it.
- **Thinking Toolbox** — 26 quick-reference tools (OODA loop, Five Whys, MECE,
  premortem, base rates, Occam's razor, and more).
- **Leveling & Achievements** — an RPG-style level curve (1 → 100, with titles
  from "Beginner Observer" to "Grand Strategist"), XP, streaks, and 20
  achievements.

Every exercise uses a self-assessment model: you attempt it, optionally reveal
progressive Socratic hints, then check off a rubric against the model answer
and expert note — your XP is earned from how many criteria you honestly met.

## Running it

No build step, no dependencies. Any static file server works:

```bash
cd master-thinking-coach
python3 -m http.server 8080
# then open http://localhost:8080
```

Or just open `index.html` directly in a browser (everything is plain
`<script>` tags, no ES modules, so `file://` works too).

## Pushing this to your own GitHub repo

This project was built locally and isn't pushed anywhere yet. To publish it:

```bash
cd master-thinking-coach
git remote add origin <your-empty-repo-url>
git push -u origin master
```

## Project structure

- `content.js` — the content bank: frameworks, toolbox, exercises, boss
  battles, achievements, level titles. Plain data — edit this to add more
  content.
- `engine.js` — game logic: XP/leveling curve, streaks, daily quest
  generation (with weakness-weighted selection), achievement rules, boss
  battle rotation. Pure functions over a plain state object.
- `app.js` — UI layer: renders screens from engine state, handles all
  interaction via event delegation.
- `style.css`, `index.html` — presentation and shell.

## Extending it

- Add exercises/frameworks/toolbox entries/boss battles by adding objects to
  the arrays in `content.js` — no other file needs to change.
- Add achievements by adding `{ id, name, desc, xp, rule }` to
  `MTC_ACHIEVEMENTS`, where `rule` is a function of the aggregated stats
  object (see existing ones for examples).
