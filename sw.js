// ===========================================================
// SERVICE WORKER: a helper that runs in the background.
// It does three jobs for the To-Do app:
//   1. Keeps a copy of the app, so it opens even with no internet.
//   2. Lets phones show reminder notifications.
//   3. Opens the app when you tap a notification.
// ===========================================================

// The name of our saved copy. If you change the app a lot, change this
// to "todo-app-v2" so everyone gets the new copy.
const CACHE_NAME = "todo-app-v1";

// The files we want to keep a copy of
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
];

// When the helper is first installed: save a copy of all the files.
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();   // start working right away
});

// When a new version takes over: throw away old saved copies.
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Every time the app asks for a file: try the internet first (so you
// always get the newest version). If that fails (no internet),
// use the saved copy instead.
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request).then(function (saved) {
        return saved || caches.match("index.html");
      });
    })
  );
});

// When you tap a notification: close it, then open the app.
// If the app is already open, switch to it instead of opening a second one.
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then(function (openWindows) {
      if (openWindows.length > 0) {
        return openWindows[0].focus();
      }
      return self.clients.openWindow("./");
    })
  );
});
