/**
 * @file
 * Reload the page when the connection comes back, if the offline page is
 * being shown in its place.
 */

(function (window, document) {
  'use strict';

  window.addEventListener('online', function () {
    if (document.querySelector('[data-backdrop-pwa-offline]')) {
      window.location.reload();
    }
  });

}(window, document));
