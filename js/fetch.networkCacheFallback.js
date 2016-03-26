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
        var ret = fetch(event.request)
          .then(function(response) {
            // Don't cache images, instead serve a dummy image.
            if (response.status < 300 && response.headers.get('Content-type').indexOf('image/') === 0) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(function() {
            return cache.match(event.request).catch(catchOffline);
          });

        return ret;
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
