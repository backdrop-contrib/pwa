if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(Drupal.settings.pwa.path, {scope: '/'})
    .then(function () { })
    .catch(function (error) {
    // Something went wrong.
  });
}
