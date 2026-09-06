/* Master Thinking Coach — service worker.
   Stale-while-revalidate: serve from cache instantly (works offline), refresh
   the cache in the background so the next load picks up updates.
   Bump CACHE_VERSION whenever shipped files change. */

const CACHE_VERSION = "mtc-v53";
const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./content.js",
  "./gym-content.js",
  "./walkthroughs.js",
  "./everyday-content.js",
  "./engine.js",
  "./ai.js",
  "./reminders.js",
  "./app.js",
  "./gym.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ---------- Daily reminder: periodic background sync (best-effort) ----------
   Chromium grants this automatically for installed, sufficiently-engaged
   PWAs — reminders.js only registers it where the API exists and is already
   granted; there's no permission prompt to show. Reads the tiny bit of state
   reminders.js and engine.js mirror into IndexedDB, since a service worker
   can't reach localStorage. Silently does nothing if either key is missing —
   the common case is just "not due yet" or "already handled in-app".

   importScripts pulls in reminders.js's own isDueNow/_todayStr/dbGet/dbPut —
   the due-time logic and IndexedDB access live in exactly one place, shared
   with the foreground check, instead of a second hand-rolled copy here. */
try { importScripts("./reminders.js"); } catch (e) {}

async function checkReminderDue() {
  if (!self.MTC_REMINDERS) return;
  const { dbGet, dbPut, isDueNow, _todayStr } = self.MTC_REMINDERS;
  const [cfg, lastActiveDate] = await Promise.all([dbGet("reminderConfig"), dbGet("lastActiveDate")]);
  if (!isDueNow(cfg, lastActiveDate)) return;
  await self.registration.showNotification("Time to think.", {
    body: "You haven't practised today — pick up your streak.",
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: "mtc-daily-reminder",
    data: { url: "./#/quest" },
  });
  await dbPut("reminderConfig", Object.assign({}, cfg, { lastFiredDate: _todayStr() }));
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "mtc-daily-reminder") event.waitUntil(checkReminderDue());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL((event.notification.data && event.notification.data.url) || "./", self.location).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(event.request, { ignoreSearch: event.request.mode === "navigate" }).then((cached) => {
        const refresh = fetch(event.request)
          .then((resp) => {
            if (resp && resp.ok) cache.put(event.request, resp.clone());
            return resp;
          })
          .catch(() => cached || (event.request.mode === "navigate" ? cache.match("./index.html") : undefined));
        return cached || refresh;
      })
    )
  );
});
