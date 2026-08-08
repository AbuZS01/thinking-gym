/* Walk one whole course section in the real UI and require that every node hands you
   the next one. The failure this guards against is silent: you finish a board, tap the
   big button, and land back on the section list to hunt for where you were. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE = `http://localhost:${process.env.GYM_PORT || 8946}/index.html`;

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push('CONSOLE: ' + m.text()); });

  await page.goto(BASE);
  await page.click('button:has-text("Get started")');
  await page.waitForTimeout(500);

  const bad = [];
  const hash = () => page.evaluate(() => location.hash);

  // 1. The path screen, then the first node: the muscle's walk-through.
  await page.goto(BASE + '#/path'); await page.reload(); await page.waitForTimeout(400);
  const section = await page.evaluate(() => {
    const s = MTC.learningPath(MTC.loadState())[0];
    return { muscle: s.muscle.id, nodes: s.nodes.map((n) => ({ id: n.id, kind: n.kind, href: n.href })) };
  });
  console.log(`  section 1: ${section.muscle} — ${section.nodes.map((n) => n.kind).join(' → ')}`);

  const first = await page.evaluate(() => MTC.nextPathNode(MTC.loadState()).node);
  if (first.kind !== 'walkthrough') bad.push(`first node is ${first.kind}, expected walkthrough`);
  await page.goto(BASE + '#/' + first.href); await page.reload(); await page.waitForTimeout(400);

  // A format guide can also stand between you and a board; clear whatever guide is up.
  const clearGuides = async () => {
    for (let i = 0; i < 4; i++) {
      const cont = page.locator('[data-walkthrough-continue]');
      if (!(await cont.count())) return;
      await cont.first().click(); await page.waitForTimeout(450);
    }
  };
  if (!(await page.locator('[data-walkthrough-continue]').count())) bad.push('walk-through has no continue button');
  await clearGuides();
  const afterGuide = await hash();
  if (!/gym\/play\//.test(afterGuide)) bad.push(`after the guide the app went to ${afterGuide}, not into a challenge`);
  else console.log(`  guide → ${afterGuide}`);

  // 2. Play each challenge in the section to 100% and follow the button it offers.
  const challengeNodes = section.nodes.filter((n) => n.kind === 'challenge');
  for (let idx = 0; idx < challengeNodes.length; idx++) {
    const id = challengeNodes[idx].id;
    await clearGuides();
    const here = await hash();
    if (!here.endsWith('/' + id)) bad.push(`expected to be on ${id}, but the app is at ${here}`);

    const { format, p } = await page.evaluate((i) => {
      const c = MTC.getGymChallenge(i);
      return { format: c.format, p: JSON.parse(JSON.stringify(c.payload)) };
    }, id);
    const clickByText = (sel, text) => page.evaluate(([s, t]) => {
      const el = [...document.querySelectorAll(s)].find((b) => b.textContent.trim() === t.trim());
      if (!el) return false; el.click(); return true;
    }, [sel, text]);

    if (format === 'map') {
      await page.waitForSelector('[data-gym-slot]');
      for (let i = 0; i < p.pairs.length; i++) { await page.locator(`[data-gym-slot="${i}"]`).click(); await clickByText('[data-gym-card]', p.pairs[i].match); }
      await page.click('[data-gym-check]'); await page.waitForSelector('[data-gym-mislead]');
      for (const a of p.misleads.answers) await page.locator(`[data-gym-mislead="${a}"]`).click();
      await page.click('[data-gym-check]');
    } else if (format === 'flaw') {
      await page.waitForSelector('.sentence');
      await page.locator(`[data-gym-sentence="${p.flawIdx}"]`).click();
      await page.waitForSelector('[data-gym-flaw]');
      await page.locator(`[data-gym-flaw="${p.flawAnswer}"]`).click();
    } else if (format === 'chain') {
      await page.waitForSelector('[data-gym-order]');
      for (const step of p.steps) await clickByText('[data-gym-order]', step);
      await page.click('[data-gym-check]');
    } else if (format === 'signal') {
      await page.waitForSelector('[data-gym-evidence]');
      for (let i = 0; i < p.evidence.length; i++) { await page.locator(`[data-gym-evidence="${i}"]`).click(); await page.locator(`[data-gym-bucket="${p.evidence[i].bucket}"]`).click(); }
      await page.click('[data-gym-check]');
    } else if (format === 'workout') {
      await page.waitForSelector('[data-gym-step]');
      for (const s of p.steps) await page.locator(`[data-gym-step="${s.answer}"]`).click();
    } else if (format === 'ask') {
      await page.waitForSelector('[data-gym-ask]');
      const best = p.questions.map((q, i) => [q, i]).filter(([q]) => q.value === 'high').map(([, i]) => i);
      for (const i of best.slice(0, p.budget)) { await page.locator(`[data-gym-ask="${i}"]`).click(); await page.waitForTimeout(45); }
      await page.waitForSelector('[data-gym-decide]');
      await page.locator(`[data-gym-decide="${p.decision.answer}"]`).click();
    } else if (format === 'triage') {
      await page.waitForSelector('[data-gym-item]');
      for (let i = 0; i < p.items.length; i++) { await page.locator(`[data-gym-item="${i}"]`).click(); await page.locator(`[data-gym-band="${p.items[i].band}"]`).click(); }
      await page.click('[data-gym-check]');
    }
    if (await page.locator('[data-gym-confidence]').count()) { await page.locator('[data-gym-confidence="mid"]').click(); await page.waitForTimeout(80); }
    await page.waitForSelector('.result-hero');
    const pct = Number(((await page.locator('.result-hero').innerText()).match(/(\d+)\s*%/) || [])[1]);
    if (pct !== 100) bad.push(`${id}: scored ${pct}% on its own key`);

    // The button the result screen leads with is the one most people tap.
    const lead = page.locator('.field > a.btn.block, .field > button.btn.block').last();
    const label = (await lead.innerText()).trim();
    await lead.click(); await page.waitForTimeout(450);
    const landed = await hash();
    const expected = challengeNodes[idx + 1];
    if (expected) {
      if (!landed.endsWith('/' + expected.id)) bad.push(`after ${id} the lead button ("${label}") went to ${landed}, not on to ${expected.id}`);
      else console.log(`  ${id} 100% → "${label}" → ${expected.id}`);
    } else {
      console.log(`  ${id} 100% → "${label}" → ${landed} (last challenge in the section)`);
      if (!/path|review/.test(landed)) bad.push(`after the last challenge the app went to ${landed}`);
    }
  }

  // 3. The review should now be unlocked, since every board was mastered.
  const review = await page.evaluate((m) => {
    const s = MTC.learningPath(MTC.loadState()).find((x) => x.muscle.id === m);
    const r = s.nodes.find((n) => n.kind === 'review');
    return r ? { ready: !!r.ready, done: !!r.done } : null;
  }, section.muscle);
  if (!review) bad.push('the section has no review node');
  else if (!review.ready) bad.push('the review is still locked after mastering every challenge in the section');
  else console.log('  review unlocked after the section was mastered');

  if (bad.length) { console.log('\n  problems:'); bad.forEach((b) => console.log('   - ' + b)); }
  else console.log('\n  the course carries you from the guide through every board to the review without a detour');
  if (errors.length) console.log('\n  ERRORS: ' + errors.slice(0, 4).join('; '));
  await browser.close();
  process.exit(bad.length || errors.length ? 1 : 0);
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
