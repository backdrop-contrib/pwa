(function (Backdrop, navigator, window, $) {
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
    .register(Backdrop.settings.pwa.path, {scope: Backdrop.settings.basePath})
    .then(function () {
      // Everything ok!
    })
    .catch(function (error) {
      // Something went wrong.
    });
  }

  // Read Backdrop.settings and register SW during the desired event.
  if (Backdrop.settings.pwa.registrationEvent === 'immediate') {
    pwaServiceWorkerRegister();
  }
  else if (Backdrop.settings.pwa.registrationEvent === 'documentready') {
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
    if (loc.pathname !== Backdrop.settings.basePath + 'offline' && document.querySelector('[data-backdrop-pwa-offline]')) {
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

}(Backdrop, navigator, window, jQuery));
