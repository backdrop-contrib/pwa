(function (Drupal, navigator, window, $) {
  'use strict';

  // Feature detection for SW
  if (!('serviceWorker' in navigator)) {
    return;
  }

  /**
   * Helper function to register Service Worker. Registration occurrs during
   * different events according to admin configuration.
   */
  function pwaServiceWorkerRegister() {
    navigator.serviceWorker
    .register(Drupal.settings.pwa.path, {scope: Drupal.settings.basePath})
    .then(function () {
      // Everything ok!
    })
    .catch(function (error) {
      // Something went wrong.
    });
  }

  // Read Drupal.settings and register SW during the desired event.
  if (Drupal.settings.pwa.registrationEvent === 'immediate') {
    pwaServiceWorkerRegister();
  }
  else if (Drupal.settings.pwa.registrationEvent === 'documentready') {
    $(document).ready(pwaServiceWorkerRegister);
  }
  else {
    window.addEventListener('load', pwaServiceWorkerRegister);
  }

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

}(Drupal, navigator, window, jQuery));
