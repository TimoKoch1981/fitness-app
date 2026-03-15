/**
 * Push Notification Service Worker Extension
 *
 * Handles incoming Web Push messages and notification clicks.
 * This file is imported by the main Workbox SW via importScripts.
 */

// Listen for push events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'FitBuddy',
      body: event.data.text(),
    };
  }

  const options = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/icons/icon-192.png',
    badge: payload.badge ?? '/icons/icon-192.png',
    tag: payload.tag ?? `fitbuddy-${Date.now()}`,
    data: {
      url: payload.url ?? '/',
      ...payload.data,
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Open' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'FitBuddy', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? '/';
  const fullUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    // Try to focus an existing window/tab
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Find an existing FitBuddy tab
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(fullUrl);
            return;
          }
        }
        // No existing tab — open new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(fullUrl);
        }
      })
  );
});

// Handle notification close (for analytics)
self.addEventListener('notificationclose', (event) => {
  // Could send analytics event here
  console.log('[FitBuddy SW] Notification closed:', event.notification.tag);
});
