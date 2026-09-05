/* Daily reminder (reminders.js) — unit tests.
 *
 * Covers the pure due-time logic (isDueNow) that decides whether a reminder
 * should fire, the opt-in gating (never enabled without a granted browser
 * permission), and that maybeFire respects both.
 *
 * Run: node tests/reminders.test.js
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

// Minimal browser-ish sandbox, mirroring tests/ai.test.js. A fresh localStorage
// per context; Notification is a fake constructor whose static .permission is
// settable per test; document/navigator are stubbed just enough for
// startWatching()'s visibilitychange path (not exercised directly here).
function makeContext(opts) {
  opts = opts || {};
  const store = {};
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const notified = [];
  function FakeNotification(title, options) { notified.push({ title, options }); }
  FakeNotification.permission = opts.permission || "default";
  FakeNotification.requestPermission = opts.requestPermission || (() => Promise.resolve(FakeNotification.permission));

  const ctx = {
    console, JSON, Date, Math, Object, Array, Promise, Error, String,
    setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage,
    navigator: opts.navigator || {},
    Notification: opts.notificationSupported === false ? undefined : FakeNotification,
    indexedDB: undefined, // exercised as "unavailable" — mirroring must no-op silently
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "reminders.js"), "utf8"), ctx, { filename: "reminders.js" });
  return { MTC_REMINDERS: ctx.MTC_REMINDERS, notified };
}

let passed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(() => { passed++; console.log("  ok -", name); })
    .catch((e) => { console.error("  FAIL -", name); throw e; });
}

(async () => {
  // ---- config defaults + persistence ----
  await test("loadConfig defaults to disabled, 19:00, never fired", () => {
    const { MTC_REMINDERS } = makeContext();
    const cfg = MTC_REMINDERS.loadConfig();
    assert.equal(cfg.enabled, false);
    assert.equal(cfg.time, "19:00");
    assert.equal(cfg.lastFiredDate, null);
  });

  await test("saveConfig merges and round-trips through localStorage", () => {
    const { MTC_REMINDERS } = makeContext();
    MTC_REMINDERS.saveConfig({ enabled: true, time: "08:30" });
    const cfg = MTC_REMINDERS.loadConfig();
    assert.equal(cfg.enabled, true);
    assert.equal(cfg.time, "08:30");
  });

  // ---- supported() / permission() ----
  await test("supported() and permission() reflect the environment", () => {
    const { MTC_REMINDERS } = makeContext({ notificationSupported: false });
    assert.equal(MTC_REMINDERS.supported(), false);
    assert.equal(MTC_REMINDERS.permission(), "unsupported");

    const { MTC_REMINDERS: withNotif } = makeContext({ permission: "granted" });
    assert.equal(withNotif.supported(), true);
    assert.equal(withNotif.permission(), "granted");
  });

  // ---- enable()/disable() gating ----
  await test("enable() only turns on when permission is actually granted", async () => {
    const { MTC_REMINDERS } = makeContext({ permission: "denied", requestPermission: () => Promise.resolve("denied") });
    const res = await MTC_REMINDERS.enable();
    assert.equal(res.permission, "denied");
    assert.equal(res.config.enabled, false, "must not enable on a denied permission");
  });

  await test("enable() turns on when permission is granted", async () => {
    const { MTC_REMINDERS } = makeContext({ permission: "default", requestPermission: () => Promise.resolve("granted") });
    const res = await MTC_REMINDERS.enable();
    assert.equal(res.permission, "granted");
    assert.equal(res.config.enabled, true);
  });

  await test("disable() turns config off", () => {
    const { MTC_REMINDERS } = makeContext();
    MTC_REMINDERS.saveConfig({ enabled: true });
    const cfg = MTC_REMINDERS.disable();
    assert.equal(cfg.enabled, false);
  });

  // ---- isDueNow: pure due-time logic ----
  const at = (h, m) => new Date(2026, 0, 15, h, m, 0);

  await test("isDueNow is false when the feature is disabled", () => {
    const { MTC_REMINDERS } = makeContext();
    const cfg = { enabled: false, time: "19:00", lastFiredDate: null };
    assert.equal(MTC_REMINDERS.isDueNow(cfg, null, at(20, 0)), false);
  });

  await test("isDueNow is false before the configured time, true at/after it", () => {
    const { MTC_REMINDERS } = makeContext();
    const cfg = { enabled: true, time: "19:00", lastFiredDate: null };
    assert.equal(MTC_REMINDERS.isDueNow(cfg, null, at(18, 59)), false);
    assert.equal(MTC_REMINDERS.isDueNow(cfg, null, at(19, 0)), true);
    assert.equal(MTC_REMINDERS.isDueNow(cfg, null, at(23, 0)), true);
  });

  await test("isDueNow is false once the user already practised today", () => {
    const { MTC_REMINDERS } = makeContext();
    const today = MTC_REMINDERS._todayStr(at(19, 30));
    const cfg = { enabled: true, time: "19:00", lastFiredDate: null };
    assert.equal(MTC_REMINDERS.isDueNow(cfg, today, at(19, 30)), false);
    assert.equal(MTC_REMINDERS.isDueNow(cfg, "2020-01-01", at(19, 30)), true, "a stale lastActiveDate should not block it");
  });

  await test("isDueNow never fires twice in the same day", () => {
    const { MTC_REMINDERS } = makeContext();
    const today = MTC_REMINDERS._todayStr(at(19, 30));
    const cfg = { enabled: true, time: "19:00", lastFiredDate: today };
    assert.equal(MTC_REMINDERS.isDueNow(cfg, null, at(19, 30)), false);
  });

  // ---- maybeFire: composes permission + isDueNow + actually notifies ----
  await test("maybeFire does nothing without a granted permission, even if due", async () => {
    const { MTC_REMINDERS, notified } = makeContext({ permission: "default" });
    MTC_REMINDERS.saveConfig({ enabled: true, time: "00:00" });
    const fired = await MTC_REMINDERS.maybeFire(null);
    assert.equal(fired, false);
    assert.equal(notified.length, 0);
  });

  await test("maybeFire notifies and records lastFiredDate when granted and due", async () => {
    const { MTC_REMINDERS, notified } = makeContext({ permission: "granted" });
    MTC_REMINDERS.saveConfig({ enabled: true, time: "00:00" });
    const fired = await MTC_REMINDERS.maybeFire(null);
    assert.equal(fired, true);
    assert.equal(notified.length, 1);
    assert.match(notified[0].title, /think/i);
    const cfg = MTC_REMINDERS.loadConfig();
    assert.equal(cfg.lastFiredDate, MTC_REMINDERS._todayStr());
  });

  await test("maybeFire is a no-op on a second call the same day (already fired)", async () => {
    const { MTC_REMINDERS, notified } = makeContext({ permission: "granted" });
    MTC_REMINDERS.saveConfig({ enabled: true, time: "00:00" });
    await MTC_REMINDERS.maybeFire(null);
    const firedAgain = await MTC_REMINDERS.maybeFire(null);
    assert.equal(firedAgain, false);
    assert.equal(notified.length, 1, "should not have notified a second time");
  });

  await test("maybeFire is a no-op once lastActiveDate is today (already practised)", async () => {
    const { MTC_REMINDERS, notified } = makeContext({ permission: "granted" });
    MTC_REMINDERS.saveConfig({ enabled: true, time: "00:00" });
    const fired = await MTC_REMINDERS.maybeFire(MTC_REMINDERS._todayStr());
    assert.equal(fired, false);
    assert.equal(notified.length, 0);
  });

  console.log(`\nAll ${passed} reminder tests passed.`);
})().catch((err) => { console.error(err); process.exit(1); });
