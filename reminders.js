/* The Thinking Gym — daily practice reminder (optional, off by default).
 *
 * Honest about what this can and can't do: this is a static, no-backend PWA,
 * so there is no push server. A reminder can only fire while code is actually
 * running, which means:
 *   - Reliably, whenever the app/tab is open (foreground or backgrounded) —
 *     handled by startWatching() below, checking once a minute.
 *   - Best-effort, when the app is fully closed but installed to the home
 *     screen — via the Periodic Background Sync API (Chromium/Android only,
 *     granted automatically based on site engagement, no user-facing
 *     permission prompt exists for it). sw.js handles the actual firing; this
 *     file just registers it and mirrors the tiny bit of state the service
 *     worker needs into IndexedDB, since a service worker can't read
 *     localStorage.
 * Nothing here ever fires a notification without the user first opting in via
 * enable(), which requests the browser's real Notification permission.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "mtc_reminder_v1";
  var DB_NAME = "mtc-reminders";
  var DB_STORE = "kv";
  var DEFAULT_TIME = "19:00";

  function defaultConfig() {
    return { enabled: false, time: DEFAULT_TIME, lastFiredDate: null };
  }

  function loadConfig() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultConfig();
      return Object.assign(defaultConfig(), JSON.parse(raw));
    } catch (e) {
      return defaultConfig();
    }
  }

  function saveConfig(patch) {
    var cfg = Object.assign(loadConfig(), patch || {});
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {
      /* storage unavailable (private mode) — config just won't persist */
    }
    mirrorConfigToIndexedDB(cfg);
    return cfg;
  }

  function todayStr(d) {
    return (d || new Date()).toISOString().slice(0, 10);
  }

  /* ---------------- Notification permission ---------------- */

  function supported() {
    return typeof Notification !== "undefined";
  }

  // "unsupported" | "default" | "granted" | "denied"
  function permission() {
    return supported() ? Notification.permission : "unsupported";
  }

  function requestPermission() {
    if (!supported()) return Promise.resolve("unsupported");
    try {
      var p = Notification.requestPermission();
      // Modern browsers return a Promise; a few very old ones took a callback.
      return p && typeof p.then === "function"
        ? p
        : new Promise(function (resolve) { Notification.requestPermission(resolve); });
    } catch (e) {
      return Promise.resolve("denied");
    }
  }

  // Turns the feature on: asks for real browser permission first. Only marks
  // enabled if permission was actually granted — never assume.
  function enable() {
    return requestPermission().then(function (perm) {
      var cfg = saveConfig({ enabled: perm === "granted" });
      return { permission: perm, config: cfg };
    });
  }

  function disable() {
    return saveConfig({ enabled: false });
  }

  /* ---------------- Due-time logic (pure, testable) ---------------- */

  // Whether a reminder should fire right now, given config and the app's
  // lastActiveDate (the day the user last completed any scored attempt).
  // Deliberately does NOT check Notification.permission — that's an
  // environment concern the caller (maybeFire) layers on, so this stays a
  // pure function of its inputs for testing.
  function isDueNow(cfg, lastActiveDate, now) {
    cfg = cfg || defaultConfig();
    if (!cfg.enabled) return false;
    now = now || new Date();
    var today = todayStr(now);
    if (lastActiveDate === today) return false; // already practised today
    if (cfg.lastFiredDate === today) return false; // already reminded today
    var hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    return hhmm >= (cfg.time || DEFAULT_TIME);
  }

  function showNotification() {
    var title = "Time to think.";
    var opts = {
      body: "You haven't practised today — pick up your streak.",
      icon: "icon-192.png",
      badge: "icon-192.png",
      tag: "mtc-daily-reminder",
      data: { url: "./#/quest" },
    };
    if (global.navigator && navigator.serviceWorker && navigator.serviceWorker.ready) {
      return navigator.serviceWorker.ready
        .then(function (reg) { return reg.showNotification(title, opts); })
        .catch(function () { try { new Notification(title, opts); } catch (e) {} });
    }
    try { new Notification(title, opts); } catch (e) {}
    return Promise.resolve();
  }

  // Checks whether a reminder is due and, if so, fires it and records today as
  // done so it never fires twice in one day. Returns a Promise<boolean>.
  function maybeFire(lastActiveDate) {
    var cfg = loadConfig();
    if (permission() !== "granted" || !isDueNow(cfg, lastActiveDate)) return Promise.resolve(false);
    return showNotification().then(function () {
      saveConfig({ lastFiredDate: todayStr() });
      return true;
    });
  }

  /* ---------------- Foreground watcher ---------------- */

  // Only fires the native notification while the tab is BACKGROUNDED
  // (document.hidden) — never pops a system notification over the app while
  // you're actively looking at it. `getLastActiveDate` is a callback so this
  // module never needs to know about the app's state shape.
  var timer = null;
  var visListener = null;

  function startWatching(getLastActiveDate) {
    stopWatching();
    var tick = function () {
      if (typeof document !== "undefined" && document.hidden) maybeFire(getLastActiveDate());
    };
    timer = setInterval(tick, 60000);
    if (typeof document !== "undefined") {
      visListener = tick;
      document.addEventListener("visibilitychange", visListener);
    }
  }

  function stopWatching() {
    if (timer) clearInterval(timer);
    timer = null;
    if (visListener && typeof document !== "undefined") document.removeEventListener("visibilitychange", visListener);
    visListener = null;
  }

  /* ---------------- IndexedDB mirror + periodic background sync ----------------
     Best-effort only: lets the service worker check "is a reminder due" while
     the app is fully closed, on browsers that support Periodic Background
     Sync (Chromium, installed PWA). Every step silently no-ops where the API
     is missing — this only ever adds reach, never a requirement. */

  var dbPromise = null;
  function openDb() {
    if (!dbPromise) {
      dbPromise = new Promise(function (resolve, reject) {
        if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () { req.result.createObjectStore(DB_STORE); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    }
    return dbPromise;
  }

  function mirrorConfigToIndexedDB(cfg) {
    openDb().then(function (db) {
      var tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(cfg, "reminderConfig");
    }).catch(function () {});
  }

  // Registers periodic sync only when the browser exposes it AND it has
  // already been granted (Chromium grants it automatically for installed,
  // sufficiently-engaged PWAs — there is no permission prompt to trigger).
  function registerPeriodicSync() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (!("periodicSync" in reg)) return;
      if (!(navigator.permissions && navigator.permissions.query)) return;
      navigator.permissions.query({ name: "periodic-background-sync" }).then(function (status) {
        if (status.state !== "granted") return;
        reg.periodicSync.register("mtc-daily-reminder", { minInterval: 6 * 60 * 60 * 1000 }).catch(function () {});
      }).catch(function () {});
    }).catch(function () {});
  }

  global.MTC_REMINDERS = {
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    supported: supported,
    permission: permission,
    requestPermission: requestPermission,
    enable: enable,
    disable: disable,
    isDueNow: isDueNow,
    maybeFire: maybeFire,
    startWatching: startWatching,
    stopWatching: stopWatching,
    registerPeriodicSync: registerPeriodicSync,
    DEFAULT_TIME: DEFAULT_TIME,
    _todayStr: todayStr, // exposed for tests
  };
})(typeof window !== "undefined" ? window : this);
