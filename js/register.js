/**
 * @file
 * Register the PWA service worker once the page has loaded.
 */

(function (Backdrop, navigator, window) {
  'use strict';

  if (!('serviceWorker' in navigator) || !Backdrop.settings.pwa) {
    return;
  }

  // Wait for the page to load so that registration doesn't slow it down.
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register(Backdrop.settings.pwa.path, {scope: Backdrop.settings.pwa.scope})
      .catch(function (error) {
        window.console && console.warn('PWA: service worker registration failed', error);
      });
  });

}(Backdrop, navigator, window));
