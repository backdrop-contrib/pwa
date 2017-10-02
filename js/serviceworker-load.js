(function (drupalSettings, navigator, window) {

  'use strict';

  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.register(Drupal.settings.pwa.path, {scope: Drupal.settings.basePath})
    .then(function () { })
    .catch(function (error) {
      // Something went wrong.
    });

  // Reload page when user is back online on a fallback offline page.
  document.body.addEventListener('online', function () {
    var loc = window.location;
    // If the page serve is the offline fallback, try a refresh when user
    // get back online.
    if (loc.pathname !== Drupal.settings.basePath + 'offline' && document.querySelector('[data-drupal-pwa-offline]')) {
      loc.reload();
    }
  });

  /*
  // In case you want to unregister the SW during testing:
  navigator.serviceWorker.getRegistration()
    .then(function(registration) {
      registration.unregister();
    });
  /**/

}(Drupal.settings, navigator, window));
