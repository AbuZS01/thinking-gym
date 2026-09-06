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

// Minimal in-memory fake of the one IndexedDB store reminders.js uses,
// async via setTimeout(0) like the real thing. Lets tests exercise
// dbGet/dbPut/reconcileFromIndexedDB without a real browser.
function makeFakeIndexedDB(seed) {
  const kv = new Map(Object.entries(seed || {}));
  return {
    _kv: kv,
    open() {
      const req = { onupgradeneeded: null, onsuccess: null, onerror: null, result: null };
      setTimeout(() => {
        const db = {
          createObjectStore() {},
          transaction() {
            const tx = { oncomplete: null, onerror: null };
            tx.objectStore = () => ({
              get(key) {
                const r = { onsuccess: null, onerror: null, result: undefined };
                setTimeout(() => { r.result = kv.get(key); if (r.onsuccess) r.onsuccess(); }, 0);
                return r;
              },
              put(value, key) {
                kv.set(key, value);
                setTimeout(() => { if (tx.oncomplete) tx.oncomplete(); }, 0);
                return { onsuccess: null, onerror: null };
              },
            });
            return tx;
          },
        };
        req.result = db;
        if (req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      }, 0);
      return req;
    },
  };
}

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

  const idb = opts.withIndexedDB ? makeFakeIndexedDB(opts.idbSeed) : undefined;
  const ctx = {
    console, JSON, Date, Math, Object, Array, Promise, Error, String,
    setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage,
    navigator: opts.navigator || {},
    Notification: opts.notificationSupported === false ? undefined : FakeNotification,
    // Undefined by default — exercised as "unavailable", mirroring must no-op
    // silently; opts.withIndexedDB swaps in the in-memory fake above.
    indexedDB: idb,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "reminders.js"), "utf8"), ctx, { filename: "reminders.js" });
  return { MTC_REMINDERS: ctx.MTC_REMINDERS, notified, idb };
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

  // todayStr must key off the LOCAL calendar day, not UTC — isDueNow compares
  // it against a local wall-clock time-of-day, so the two need to agree on
  // what day it is. Regression test for a real bug: in negative-UTC-offset
  // zones (US etc.), the UTC date rolls over mid-afternoon local time, so a
  // UTC-dated "today" could disagree with a local lastActiveDate recorded
  // earlier that same local day and fire again in the evening regardless.
  await test("todayStr uses the local day; isDueNow doesn't re-fire in the evening across a UTC date rollover", () => {
    const prevTz = process.env.TZ;
    process.env.TZ = "America/Los_Angeles"; // UTC-8: UTC rolls to the next day at 4pm local
    try {
      const { MTC_REMINDERS } = makeContext();
      const lateEvening = new Date(2026, 0, 15, 23, 30, 0); // 11:30pm local Jan 15 = 7:30am UTC Jan 16
      assert.equal(MTC_REMINDERS._todayStr(lateEvening), "2026-01-15", "todayStr must return the local date, not the UTC one");

      const morning = new Date(2026, 0, 15, 9, 0, 0); // practised earlier the same local day
      const lastActiveDate = MTC_REMINDERS._todayStr(morning);
      const cfg = { enabled: true, time: "19:00", lastFiredDate: null };
      assert.equal(
        MTC_REMINDERS.isDueNow(cfg, lastActiveDate, lateEvening),
        false,
        "must not fire in the evening after already practising earlier the same local day"
      );
    } finally {
      process.env.TZ = prevTz;
    }
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

  // ---- IndexedDB mirror + reconciliation ----
  // sw.js can only record "already fired today" in IndexedDB (no localStorage
  // there); reconcileFromIndexedDB pulls that mark back into localStorage on
  // the next foreground load so the two never disagree. Regression test for
  // a real split-brain bug: a closed-app notification fired by the service
  // worker was invisible to the foreground check, risking a duplicate.
  await test("saveConfig mirrors into IndexedDB via dbPut", async () => {
    const { MTC_REMINDERS, idb } = makeContext({ withIndexedDB: true });
    MTC_REMINDERS.saveConfig({ enabled: true, time: "08:00" });
    await new Promise((r) => setTimeout(r, 10)); // let the fake async IDB settle
    const mirrored = idb._kv.get("reminderConfig");
    assert.equal(mirrored.enabled, true);
    assert.equal(mirrored.time, "08:00");
  });

  await test("reconcileFromIndexedDB pulls a service-worker-recorded lastFiredDate into localStorage", async () => {
    const { MTC_REMINDERS } = makeContext({
      withIndexedDB: true,
      idbSeed: { reminderConfig: { enabled: true, time: "19:00", lastFiredDate: "2026-03-01" } },
    });
    // localStorage starts with no notion this ever fired.
    assert.equal(MTC_REMINDERS.loadConfig().lastFiredDate, null);
    await MTC_REMINDERS.reconcileFromIndexedDB();
    assert.equal(MTC_REMINDERS.loadConfig().lastFiredDate, "2026-03-01");
  });

  await test("reconcileFromIndexedDB never regresses a lastFiredDate localStorage already has", async () => {
    const { MTC_REMINDERS, idb } = makeContext({ withIndexedDB: true });
    MTC_REMINDERS.saveConfig({ lastFiredDate: "2026-03-01" });
    await new Promise((r) => setTimeout(r, 10));
    // Simulate a stale mirror left over from an earlier session, bypassing
    // the mirror this saveConfig call already did.
    idb._kv.set("reminderConfig", { enabled: true, time: "19:00", lastFiredDate: "2026-02-01" });
    await MTC_REMINDERS.reconcileFromIndexedDB();
    assert.equal(MTC_REMINDERS.loadConfig().lastFiredDate, "2026-03-01", "a stale IndexedDB mark must not overwrite a newer local one");
  });

  console.log(`\nAll ${passed} reminder tests passed.`);
})().catch((err) => { console.error(err); process.exit(1); });
