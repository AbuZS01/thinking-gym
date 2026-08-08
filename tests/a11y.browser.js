/* Accessibility audit across every screen. Not a lint pass — these are the four
   things that actually stop someone using the app: text too small to read, targets
   too small to hit, a heading order that lies to a screen reader, and a board that
   changes under you without saying so. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE = `http://localhost:${process.env.GYM_PORT || 8946}/index.html`;

const MIN_FONT = 12;   // below this, body text is unreadable for a lot of people
const MIN_TAP = 44;    // WCAG 2.5.5 target size

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto(BASE);
  await page.click('button:has-text("Get started")');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('mtc_state_v1'));
    s.seenWalkthroughs = { muscle: MTC_MUSCLES.map((m) => m.id), format: Object.keys(MTC_GYM_FORMATS) };
    const ids = MTC.sectionChallenges(MTC.loadState(), 'notice', 0).map((c) => c.id);
    s.gym = {};
    ids.slice(0, 3).forEach((id) => { s.gym[id] = { plays: 2, bestScore: 95, lastScore: 95, lastPlayed: MTC.todayStr() }; });
    localStorage.setItem('mtc_state_v1', JSON.stringify(s));
  });
  await page.reload(); await page.waitForTimeout(500);

  const ROUTES = [
    'dashboard', 'gym', 'path', 'progress', 'profile', 'guides', 'toolbox', 'frameworks',
    'journal', 'used', 'achievements', 'quest', 'boss', 'calibration', 'review', 'report',
    'gym/muscle/notice', 'gym/life/money', 'gym/learn/muscle/notice', 'gym/learn/format/flaw',
    'path/review/notice', 'frameworks/critical-thinking', 'workbench/ooda', 'gym/play/gym-flaw-1',
  ];

  const audit = async () => page.evaluate(([minFont, minTap]) => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
    };
    const label = (el) => (el.textContent || el.getAttribute('aria-label') || el.className || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 44);

    const tiny = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!vis(el)) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < minFont) tiny.push({ size, sel: el.tagName.toLowerCase() + '.' + (el.className || '').split(' ')[0], text: label(el) });
    }

    const small = [];
    for (const el of document.querySelectorAll('a[href], button, input, select, textarea, [role=button], [data-gym-card], [data-gym-slot], [data-gym-step], [data-gym-ask], [data-gym-order], [data-gym-evidence], [data-gym-bucket], [data-gym-item], [data-gym-band], [data-gym-sentence], [data-gym-flaw], [data-gym-decide], [data-gym-mislead], [data-gym-confidence]')) {
      if (!vis(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < minTap || r.width < minTap) small.push({ w: Math.round(r.width), h: Math.round(r.height), text: label(el) });
    }

    const heads = [...document.querySelectorAll('h1,h2,h3,h4')].filter(vis).map((h) => ({ level: Number(h.tagName[1]), text: label(h) }));
    const h1s = heads.filter((h) => h.level === 1);
    const skips = [];
    for (let i = 1; i < heads.length; i++) if (heads[i].level > heads[i - 1].level + 1) skips.push(`${heads[i - 1].text} (h${heads[i - 1].level}) → ${heads[i].text} (h${heads[i].level})`);

    const unlabelled = [...document.querySelectorAll('input, textarea, select')].filter(vis)
      .filter((el) => !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !(el.id && document.querySelector(`label[for="${el.id}"]`)) && !el.closest('label'))
      .map((el) => el.id || el.name || el.placeholder || el.tagName);

    const live = [...document.querySelectorAll('[aria-live], [role=status], [role=alert]')].filter(vis).map((el) => label(el));

    // Contrast. Walks up for the first painted background, so text on a card inside a
    // dark panel is measured against the card, not against the page.
    const rgb = (c) => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
    // A gradient is a real background even though backgroundColor reports transparent.
    // Take its lightest and darkest stops and keep whichever is worse for this text,
    // so a button whose gradient goes pale at one end is not scored on its dark end.
    const stopsOf = (img) => (img.match(/rgba?\([^)]+\)/g) || []).map(rgb);
    const bgOf = (el, fgLum) => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) {
          const stops = stopsOf(cs.backgroundImage);
          if (stops.length) {
            return stops.reduce((worst, c) =>
              Math.abs(lum(c) - fgLum) < Math.abs(lum(worst) - fgLum) ? c : worst);
          }
        }
        const c = cs.backgroundColor;
        const parts = (c.match(/[\d.]+/g) || []).map(Number);
        const a = parts.length > 3 ? parts[3] : 1;
        if (!parts.length || a === 0) continue;
        if (a === 1) return rgb(c);
        // Semi-transparent: composite it over whatever is behind it, or a tint reads
        // as pure white and every label on it looks like a contrast failure.
        const behind = n.parentElement ? bgOf(n.parentElement, fgLum) : [255, 255, 255];
        return rgb(c).map((v, i) => Math.round(v * a + behind[i] * (1 - a)));
      }
      return [255, 255, 255];
    };
    const faint = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!vis(el)) continue;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || 400;
      const fg = rgb(cs.color), l1 = lum(fg);
      const l2 = lum(bgOf(el, l1));
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      if (ratio < need) faint.push({ ratio: Math.round(ratio * 100) / 100, need, sel: el.tagName.toLowerCase() + '.' + (el.className || '').split(' ')[0], text: label(el) });
    }

    return { tiny, small, h1s, skips, unlabelled, live, faint };
  }, [MIN_FONT, MIN_TAP]);

  const report = {};
  for (const route of ROUTES) {
    await page.evaluate((r) => { location.hash = '#/' + r; }, route);
    await page.waitForTimeout(350);
    report[route] = await audit();
  }

  // The board mid-play is the case that matters most: taps rewrite the screen.
  await page.evaluate(() => { location.hash = '#/gym/play/gym-flaw-1'; });
  await page.waitForTimeout(400);
  const said = async () => (await page.locator('#a11y-status').innerText()).trim();
  const spoken = [];
  for (let i = 0; i < 3; i++) {
    const move = page.locator('[data-gym-step], [data-gym-sentence], [data-gym-slot], [data-gym-order], [data-gym-evidence], [data-gym-item], [data-gym-ask]').first();
    if (!(await move.count())) break;
    await move.click(); await page.waitForTimeout(250);
    spoken.push(await said());
    if (i === 0) report['gym/play (after a tap)'] = await audit();
  }
  console.log('\nWhat a screen reader hears while playing:');
  spoken.forEach((line) => console.log('   - ' + (line || '(nothing)')));

  const problems = { tiny: new Map(), faint: new Map(), small: new Map(), h1: [], skips: new Set(), unlabelled: new Set(), noLive: [] };
  for (const [route, r] of Object.entries(report)) {
    for (const t of r.tiny) problems.tiny.set(`${t.size}px  ${t.sel}  "${t.text}"`, route);
    for (const c of r.faint) problems.faint.set(`${c.ratio}:1 (needs ${c.need}) ${c.sel} "${c.text}"`, route);
    for (const s of r.small) problems.small.set(`${s.w}x${s.h}  "${s.text}"`, route);
    if (r.h1s.length !== 1) problems.h1.push(`${route}: ${r.h1s.length} h1 (${r.h1s.map((h) => `"${h.text}"`).join(', ') || 'none'})`);
    for (const s of r.skips) problems.skips.add(`${route}: ${s}`);
    for (const u of r.unlabelled) problems.unlabelled.add(`${route}: ${u}`);
    // A live region is only owed where the screen rewrites itself under the user.
    if (!r.live.length && route.includes('gym/play')) problems.noLive.push(route);
  }
  // Present but silent is no better than absent, so the region has to actually speak.
  if (!spoken.length || spoken.some((line) => !line)) problems.noLive.push('a tap on the board announced nothing');
  if (new Set(spoken).size < 2) problems.noLive.push(`the board said the same thing every tap: "${spoken[0]}"`);
  {
  }

  const show = (title, rows) => {
    console.log(`\n${title} (${rows.length})`);
    rows.slice(0, 20).forEach((r) => console.log('   - ' + r));
    if (rows.length > 20) console.log(`   ... and ${rows.length - 20} more`);
  };
  show('Text under 12px', [...problems.tiny].map(([k, v]) => `${k}   [${v}]`));
  show('Contrast below WCAG AA', [...problems.faint].map(([k, v]) => `${k}   [${v}]`));
  show('Tap targets under 44px', [...problems.small].map(([k, v]) => `${k}   [${v}]`));
  show('Wrong number of h1', problems.h1);
  show('Heading levels skipped', [...problems.skips]);
  show('Unlabelled form controls', [...problems.unlabelled]);
  show('Play screens with no live region', problems.noLive);
  if (errors.length) console.log('\nERRORS: ' + errors.slice(0, 4).join('; '));

  const total = problems.tiny.size + problems.faint.size + problems.small.size + problems.h1.length + problems.skips.size
    + problems.unlabelled.size + problems.noLive.length;
  console.log(`\n${total} accessibility problems across ${ROUTES.length + 1} screens`);
  await browser.close();
  process.exit(total || errors.length ? 1 : 0);
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
