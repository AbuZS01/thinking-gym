/* Play a challenge, commit to the tip, jump the clock, answer the check-in,
   and confirm it lands in the record. The whole point of the feature is the
   day-later half, so the test has to cross a day boundary. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE = `http://localhost:${process.env.GYM_PORT || 8946}/index.html`;

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push('CONSOLE: ' + m.text()); });

  await page.goto(BASE);
  await page.fill('input[name=playerName]', 'Amir');
  await page.click('button:has-text("Get started")');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('mtc_state_v1'));
    s.seenWalkthroughs = { muscle: MTC_MUSCLES.map((m) => m.id), format: Object.keys(MTC_GYM_FORMATS) };
    localStorage.setItem('mtc_state_v1', JSON.stringify(s));
    location.hash = '#/gym/play/gym-workout-13'; location.reload();
  });
  await page.waitForSelector('[data-gym-step]');

  let g = 0;
  while ((await page.locator('[data-gym-step]').count()) && g++ < 10) {
    const ans = await page.evaluate(() => {
      const c = MTC.getGymChallenge(location.hash.split('/')[3]);
      const settled = document.querySelectorAll('.review-row').length;
      return c.payload.steps[settled] ? c.payload.steps[settled].answer : 0;
    });
    await page.locator(`[data-gym-step="${ans}"]`).click();
    await page.waitForTimeout(70);
  }
  if (await page.locator('[data-gym-confidence]').count()) {
    await page.locator('[data-gym-confidence="mid"]').click();
  }
  await page.waitForSelector('.result-hero');
  console.log('1) Reached result screen.');

  const cross = await page.locator('.tag:has-text("Same thinking, different setting")').count();
  console.log('2) Cross-domain offer present:', cross > 0 ? 'yes' : 'NO');
  if (cross) {
    const t = await page.locator('.panel:has(.tag:has-text("Same thinking")) h2').innerText();
    const link = await page.locator('.panel:has(.tag:has-text("Same thinking")) .cta').innerText();
    console.log('   ->', t, '|', link.trim());
  }

  await page.click('[data-gym-commit]');
  await page.waitForTimeout(250);
  const confirmed = await page.locator('text=Added to your check-ins').count();
  console.log('3) Commitment made:', confirmed ? 'yes' : 'NO');

  // The check-in is due tomorrow, so move the stored due date back a day.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('mtc_state_v1'));
    s.commitments.forEach((c) => { c.dueOn = '2000-01-01'; });
    localStorage.setItem('mtc_state_v1', JSON.stringify(s));
    location.hash = '#/dashboard'; location.reload();
  });
  await page.waitForTimeout(700);

  const hasCheckin = await page.locator('.panel.checkin').count();
  console.log('4) Check-in shown on dashboard:', hasCheckin ? 'yes' : 'NO');
  if (hasCheckin) {
    console.log('   ' + (await page.locator('.panel.checkin').innerText()).split('\n').slice(0, 4).join(' | '));
  }
  await page.screenshot({ path: '/tmp/checkin.png', fullPage: true });

  await page.fill('#checkin-note', 'A caller said my nephew was in trouble. I hung up and rang him directly.');
  await page.click('[data-checkin-yes]');
  await page.waitForTimeout(500);
  console.log('5) After answering yes, check-in gone:', (await page.locator('.panel.checkin').count()) ? 'NO' : 'yes');
  const strip = await page.locator('.stat-strip').innerText();
  console.log('   dashboard strip:', strip.replace(/\n/g, ' ').replace(/\s+/g, ' '));

  await page.goto(BASE + '#/used');
  await page.waitForTimeout(500);
  const rec = await page.locator('#app').innerText();
  console.log('6) Record page:\n   ' + rec.split('\n').filter(Boolean).slice(0, 12).join(' | '));
  await page.screenshot({ path: '/tmp/used.png', fullPage: true });

  if (errs.length) { console.log('\nERRORS:', errs.slice(0, 5)); process.exit(1); }
  console.log('\nLOOP: OK');
  await browser.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
