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
        return cache.match(event.request).then(function(response) {
            return response || fetch(event.request);
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
