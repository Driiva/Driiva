/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging Service Worker
 *
 * This service worker is required by FCM to receive push notifications when
 * the web app is in the background or closed. The main window sends Firebase
 * config via postMessage after registering this SW; we defer init until then.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

let messaging = null;

function initFirebase(config) {
  if (firebase.apps.length > 0) return;
  firebase.initializeApp({
    apiKey: config.apiKey || '',
    projectId: config.projectId || '',
    messagingSenderId: config.messagingSenderId || '',
    appId: config.appId || '',
  });
  messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'Driiva';
    const options = {
      body: payload.notification?.body ?? '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: payload.data || {},
    };
    self.registration.showNotification(title, options);
  });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG' && event.data.config) {
    initFirebase(event.data.config);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
