if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(Drupal.settings.pwa.path, {scope: '/'}).then(function () {
    // Registration was successful. Now, check to see whether the service worker is controlling the page.
    if (navigator.serviceWorker.controller) {
      // If .controller is set, then this page is being actively controlled by the service worker.
      // 'This funky font has been cached by the controlling service worker.';
    }
    else {
      // If .controller isn't set, then prompt the user to reload the page so that the service worker can take
      // control. Until that happens, the service worker's fetch handler won't be used.
      // 'Please reload this page to allow the service worker to handle network operations.';
    }
  }).catch(function (error) {
    // Something went wrong.
  });
}
