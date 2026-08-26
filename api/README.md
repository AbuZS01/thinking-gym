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
