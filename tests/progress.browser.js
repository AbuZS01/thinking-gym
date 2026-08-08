/* Progress must not fall when the library grows. Snapshot every progress line a player
   sees, then pretend six new challenges were written and require the numbers to hold. */
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

  // A player who has mastered three Notice boards and half-done a fourth.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('mtc_state_v1'));
    s.seenWalkthroughs = { muscle: MTC_MUSCLES.map((m) => m.id), format: Object.keys(MTC_GYM_FORMATS) };
    const ids = MTC.sectionChallenges('notice').map((c) => c.id);
    s.gym = {};
    ids.slice(0, 3).forEach((id) => { s.gym[id] = { plays: 1, bestScore: 95, lastScore: 95, lastPlayed: MTC.todayStr() }; });
    s.gym[ids[3]] = { plays: 1, bestScore: 60, lastScore: 60, lastPlayed: MTC.todayStr() };
    localStorage.setItem('mtc_state_v1', JSON.stringify(s));
  });
  // Reload straight away: the live page still holds the old STATE and would save over it.
  await page.reload(); await page.waitForTimeout(500);
  const seeded = await page.evaluate(() => Object.keys(MTC.loadState().gym).length);
  if (seeded !== 4) { console.error(`seeding failed: ${seeded} played challenges, expected 4`); process.exit(1); }

  const lines = async () => {
    const out = {};
    for (const [name, hash, sel] of [
      ['dashboard', '#/dashboard', '.tile .meta'],
      ['gym', '#/gym', '.tile .meta'],
      ['progress', '#/progress', '.weak-row .subtle'],
    ]) {
      await page.goto(BASE + hash); await page.reload(); await page.waitForTimeout(400);
      out[name] = await page.$$eval(sel, (els) => els.map((e) => e.textContent.trim()));
    }
    return out;
  };

  const before = await lines();
  // Now grow the library: clone six existing Notice challenges under new ids.
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {});
  });
  await page.evaluate(() => {
    const extra = MTC_GYM_CHALLENGES.filter((c) => c.muscle === 'notice').slice(0, 6)
      .map((c, i) => ({ ...c, id: `${c.id}-clone-${i}`, difficulty: 5 }));
    MTC_GYM_CHALLENGES.push(...extra);
  });
  // Re-render in place rather than reloading, so the injected content survives.
  const after = {};
  for (const [name, hash, sel] of [
    ['dashboard', '#/dashboard', '.tile .meta'],
    ['gym', '#/gym', '.tile .meta'],
    ['progress', '#/progress', '.weak-row .subtle'],
  ]) {
    await page.evaluate((h) => { location.hash = h; }, hash);
    await page.waitForTimeout(400);
    after[name] = await page.$$eval(sel, (els) => els.map((e) => e.textContent.trim()));
  }

  const bad = [];
  for (const key of Object.keys(before)) {
    console.log(`  ${key}`);
    console.log(`    before: ${before[key].join(' | ')}`);
    console.log(`    after:  ${after[key].join(' | ')}`);
    const b = before[key], a = after[key];
    for (let i = 0; i < Math.min(b.length, a.length); i++) {
      // "N challenges" is a library count and is meant to grow. Everything else is
      // the player's own progress and must not move because someone wrote content.
      if (/\d+ challenges/.test(b[i])) continue;
      if (b[i] !== a[i]) bad.push(`${key}: "${b[i]}" became "${a[i]}" when six challenges were added`);
    }
  }
  if (bad.length) { console.log('\n  problems:'); bad.forEach((x) => console.log('   - ' + x)); }
  else console.log('\n  adding content changed no progress figure a player is shown');
  if (errors.length) console.log('\n  ERRORS: ' + errors.slice(0, 4).join('; '));
  await browser.close();
  process.exit(bad.length || errors.length ? 1 : 0);
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
