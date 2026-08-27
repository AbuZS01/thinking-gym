# AI Integration — Architecture Inspection & Phase 1 Plan

This document is the deliverable the brief (§22) asks for *before* coding: a map
of the existing app, where AI is inserted with the smallest change, the files
touched, and the privacy/security implications. It also records what was
**deliberately not built** in this first vertical.

North star (§23): Thinking Gym must not become an app where AI thinks for
people. AI here is a **coach that responds after the user reasons** — never an
answer machine.

## 1. What the existing app is (inspection)

- **Stack:** a self-contained static PWA. Plain `<script>` tags (no build step,
  no modules, no framework), `localStorage` persistence, a stale-while-revalidate
  service worker. Runs offline and from `file://`. **No backend, no AI anywhere.**
- **Files:** `content.js` / `gym-content.js` / `everyday-content.js` /
  `walkthroughs.js` (data), `engine.js` (pure state logic + persistence),
  `app.js` (UI: renders screens from state, event delegation), `gym.js` (tap-only
  board games), `style.css` + `index.html` (shell), `sw.js` (offline cache).
- **State:** one plain object in `localStorage` key `mtc_state_v1`, loaded once
  into `STATE`, mutated by `engine.js` functions, re-rendered wholesale. A
  `schema` field drives migrations. Export/import is a JSON dump of this object.
- **Two exercise families:**
  - **Gym challenges** — tap-only, *objectively* scored against a hand-written
    answer key. No free text. Not a fit for reasoning feedback.
  - **Deep Work exercises** (`MTC_EXERCISES`) — the user **writes a free-text
    answer**, the model answer stays locked until they've written ≥20 chars, then
    they **self-assess** against a rubric. Already subjective, already
    answer-first. **This is the natural insertion point.**
- **Submission flow:** `exerciseHTML()` renders the write → gate → reveal →
  self-assess steps; `submitExercise()` in `engine.js` records a history entry
  (`{date, exerciseId, type, score, xp, hintsUsed, answer, confidence}`) that
  also feeds the Journal and weakness profile.

## 2. Where AI is inserted (smallest change)

The PRACTISE-layer feedback (§7, §8) is added **only** to the Deep Work
self-assessment step, and only after the user has written their answer and
revealed the model answer. This satisfies the non-negotiable principle (§3): the
user always reasons first; AI evaluates the *reasoning process*, then the user
still owns the self-assessment and can ignore the feedback.

The non-AI path is completely unchanged: if AI is off (the default) or
unavailable, the exercise behaves exactly as before.

## 3. Files added / changed

**Added**
- `ai.js` — client-side AI service **abstraction**. Provider-agnostic
  (`MTC_AI.getFeedback(ctx)`), validates every response against the §8 schema,
  types its errors (`unavailable | timeout | network | ratelimit | malformed |
  server`), owns AI settings in a *separate* `localStorage` key so the exported
  progress schema is untouched. Ships two providers:
  - **local** — an offline heuristic coach that analyses the *shape* of the
    user's reasoning (did they offer an alternative? say what would change their
    mind? surface an assumption?). Honest: labelled as a heuristic, never as a
    model, and used as the brief's "mocked AI responses during UI development".
  - **backend** — POSTs a minimal payload to a configurable server endpoint that
    holds the model key. Used when the operator configures one.
- `api/feedback.js` — reference serverless function (Vercel/Netlify style) that
  keeps the model key server-side, calls Claude with a strict structured-output
  schema and a Socratic system prompt embodying the §14 behaviour rules, and
  validates before returning. `api/README.md` + `.env.example` document setup.
- `tests/ai.test.js` — unit tests for schema validation, error typing, and the
  local coach across short / empty / strong / weak answers (§15 step 7).

**Changed**
- `app.js` — an optional "Coach my reasoning" block in the self-assessment panel
  (loading / error+retry / unavailable states); saves accepted feedback with the
  attempt; a Profile → AI Coaching settings section (opt-in, provider choice,
  endpoint); Journal shows saved feedback.
- `engine.js` — `submitExercise()` gains an **optional** trailing `aiFeedback`
  param, stored on the history entry. No schema break, fully backward-compatible.
- `index.html` / `sw.js` — load `ai.js`; bump `CACHE_VERSION`.
- `style.css` — styles for the feedback card and settings.

## 4. Privacy & security implications

- **Keys never touch the client.** The browser only ever talks to a server
  endpoint the operator configures; the model key lives in that server's env.
- **Minimise data sent** (§17): only the exercise prompt, its type/skill, and the
  user's answer are sent — never the player's name, journal, or progress. No
  answer text is sent to analytics (there is no analytics).
- **AI is optional and off by default.** The offline learning experience is
  fully intact with AI disabled; the local coach needs no network at all.
- **Responses are validated before use** (§17). Malformed model output is
  rejected and surfaced as a retryable error, never written blindly into state.
- **AI output is never treated as evidence** (§14) and the user can reject it.

## 5. Explicitly NOT built in this vertical (§15, §20)

Investigation Mode / Case Board (Phase 2), the REFLECT thinking profile,
adaptive personalisation, any chatbot, and AI-authored lessons are out of scope
here. This release only proves that post-answer AI feedback helps people think.
