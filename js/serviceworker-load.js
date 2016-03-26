if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(Drupal.settings.pwa.path, {scope: '/'})
    .then(function () { })
    .catch(function (error) {
      // Something went wrong.
    });

  /*

  In case you want to unregister the SW during testing:

  navigator.serviceWorker.getRegistration()
    .then(function(registration) {
      registration.unregister();
    });

   */
}
