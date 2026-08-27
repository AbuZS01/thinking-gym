# AI feedback endpoint (optional server function)

The Thinking Gym is a static, offline PWA. The AI **practice coach** is optional,
and when it uses a real model it must do so **server-side** so the model key
never reaches the browser (brief §17). This folder is that server side.

`feedback.js` is a provider-abstracted, framework-agnostic handler. It is **not**
loaded by `index.html` — you deploy it separately and point the app at its URL.

## What it does

```
POST /api/feedback
Body: { "exercise": { "prompt", "type", "skill", "modelAnswer", "rubric" }, "answer": "..." }
200 : the §8 feedback schema (strengths, missed_considerations, assumptions_detected,
      alternative_angle, skill_demonstrated, improvement_tip, feedback_summary)
```

It calls Claude with a Socratic system prompt (the §14 behaviour rules) and a
**strict structured-output tool**, so the response always matches the schema.
The client (`ai.js`) validates the shape again before trusting it.

The **same endpoint** also powers Investigation Mode's Case Board: a request with
`{ "task": "case", "kind": "classify" | "hypotheses" | "evidence_gaps" |
"next_test", "case": {...} }` returns the matching structured suggestions. One
endpoint URL keeps the app's AI settings simple. The case system prompt and
strict tools live alongside the coach's in `prompt.js`.

### Tuning the coach

The system prompt **is** the product — it's the highest-leverage thing to iterate
on. It lives in [`prompt.js`](prompt.js), separate from transport, and is unit
tested in [`../tests/prompt.test.js`](../tests/prompt.test.js):

- `BASE_SYSTEM_PROMPT` — the coach's operating contract (the behaviour rules).
- `TYPE_LENSES` — a per-exercise-type focus line, so the coach scrutinises the
  right thing (a bias-detection answer is judged differently from a decision one).
- `buildUserPrompt` — embeds the learner's answer, the **skill grounding** the
  client passes (curated context for the trained framework — not RAG), and the
  model answer + rubric as clearly-walled-off grading context.

Edit the text in `prompt.js`, run `node tests/prompt.test.js`, and redeploy.

### The tuning loop

To read the coach's feedback across many answer qualities side by side, use the
harness:

```bash
# Offline, no key — checks plumbing + schema (uses the on-device heuristic):
npm run coach

# The real tuning path — against your deployed function (args go after --):
npm run coach -- --endpoint https://your-app/api/feedback --show-prompt

# Or call the model directly (needs `npm i @anthropic-ai/sdk` + ANTHROPIC_API_KEY):
npm run coach -- --model --type bias --show-prompt
```

(`npm run coach` just runs `node tools/coach-harness.js`; use the plain form if
you prefer.)

The eval set lives in [`../tools/samples.js`](../tools/samples.js) — real
exercises with answers spanning empty → off-topic → short → weak → strong. Every
response is validated against the §8 schema; add your own cases as you find edge
answers. The loop is: run the harness, spot where feedback drifts generic or
mis-calibrates, edit `prompt.js`, re-run.

## Setup

1. Install the SDK where the function is deployed:

   ```bash
   npm install @anthropic-ai/sdk
   ```

2. Set environment variables (see `.env.example`):

   - `ANTHROPIC_API_KEY` — **required**. Lives only on the server.
   - `AI_MODEL` — optional, defaults to `claude-opus-5`. Swap the model/provider
     here without touching the app.
   - `AI_ALLOW_ORIGIN` — optional CORS origin; set it to your app's origin in
     production instead of the `*` default.

3. Deploy. On **Vercel**, dropping this file at `api/feedback.js` exposes it at
   `/api/feedback` automatically. On **Netlify**, put it under
   `netlify/functions/` and export the same handler. For anything else, import
   `generateFeedback(body)` from this file and wire it to your router.

4. In the app: **Profile → AI Coaching → turn on**, choose **Server endpoint**,
   and paste the deployed URL (e.g. `https://your-app.vercel.app/api/feedback`).

## Privacy

The app sends only the exercise prompt/type/skill, its model answer + rubric
(grading context), and the user's answer — never the player's name, journal, or
progress. Nothing is logged to analytics. Keep it that way if you extend this.

## Without a server

Leave AI off, or use the **local coach** (Profile → AI Coaching → "On-device
heuristic"). It runs entirely offline, needs no key, and analyses the *shape* of
the user's reasoning. It's honest about being a heuristic rather than a model —
and it's what powers the UI during development.
