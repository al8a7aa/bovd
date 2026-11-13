// Offline support: keeps a copy of the app on the device so it opens with no link to Earth.
// Health records are not stored here — they live in the browser's local storage.
const CACHE = 'bovd-app-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      const page = await fetch('./', { cache: 'no-cache' })
      const html = await page.clone().text()
      await cache.put('./', page)
      // the page lists its own script, style, icon and manifest files; save those too
      const files = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1])
      await cache.addAll(files)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  // live data from other sites (space weather) is never cached: the app shows "no link" instead
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    // online: take the newest app and remember it; offline: open the saved copy
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        try {
          const fresh = await fetch(req)
          if (fresh.ok) await cache.put('./', fresh.clone())
          return fresh
        } catch {
          return (await cache.match('./', { ignoreVary: true })) ?? Response.error()
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      // ignoreVary: some hosts mark files "Vary: Origin", which would hide our saved copy from script tags
      const saved = await cache.match(req, { ignoreVary: true })
      if (saved) return saved
      const fresh = await fetch(req)
      if (fresh.ok) await cache.put(req, fresh.clone())
      return fresh
    })(),
  )
})
