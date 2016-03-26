/**
 * @file
 * Cache strategies from: https://jakearchibald.com/2014/offline-cookbook/
 */

self.addEventListener('fetch', function(event) {

  var isMethodGet = event.request.method === 'GET';
  var notExcluded = CACHE_EXCLUDE.every(urlNotExcluded(event.request.url));

  // Make sure the url is one we don't exclude from cache.
  if (isMethodGet && notExcluded) {
    var resp = caches
      .open(CURRENT_CACHE)
      .then(function (cache) {
        return cache
          .match(event.request)
          .then(function(response) {
            var fetchPromise = fetch(event.request)
              .then(function (networkResponse) {
                // Don't cache redirects or errors.
                if (networkResponse.status < 300) {
                  cache.put(event.request, networkResponse.clone());
                }
                else {
                  console.log("Don't cache ", networkResponse.status);
                }
                return networkResponse;
              });
            return response || fetchPromise;
          })
          .catch(catchOffline);
      })
      .catch(function (error) {
        // Oups.
      });
    event.respondWith(resp);
  }
  else {
    console.log('Ignored ', event.request.url);
  }
});
