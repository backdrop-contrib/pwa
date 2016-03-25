/**
 * @file
 * Adapted from https://github.com/GoogleChrome/samples/tree/gh-pages/service-worker
 * and https://jakearchibald.com/2014/offline-cookbook/
 */

"use strict";

// If at any point you want to force pages that use this service worker to start using a fresh
// cache, then increment the CACHE_VERSION value. It will kick off the service worker update
// flow and the old cache(s) will be purged as part of the activate event handler when the
// updated service worker is activated.
var CACHE_VERSION = 1/*cacheVersion*/;
var CURRENT_CACHE = 'all-cache-v' + CACHE_VERSION;
var CACHE_EXCLUDE = [/*cacheConditionsExclude*/].map(function (r) {return new RegExp(r);});
var CACHE_STRATEGY = '/*cacheStrategy*/';


self.addEventListener('activate', function(event) {
  // Delete all caches that are not CURRENT_CACHE.
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Delete any cache that doesn't have our version.
          if (CURRENT_CACHE !== cacheName) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


/**
 * Cache strategies from: https://jakearchibald.com/2014/offline-cookbook/
 */
self.addEventListener('fetch', function(event) {

  function urlNotExcluded(condition) {
    return !condition.test(event.request.url);
  }

  var strategies = {
    cacheThenNetwork: function(cache) {
      return fetch(event.request)
        .then(function(response) {
          if (response.status < 300) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
    },
    networkCacheFallback: function (cache) {
      return fetch(event.request)
        .catch(function() {
          return cache.match(event.request);
        });
    },
    staleWhileRevalidate: function (cache) {
      return cache.match(event.request)
        .then(function(response) {
          var fetchPromise = fetch(event.request)
            .then(function (networkResponse) {
              // Don't cache redirects or errors.
              if (networkResponse.status < 300) {
                cache.put(event.request, networkResponse.clone());
              }
              else {
                console.log('dont cache', networkResponse.status);
              }
              return networkResponse;
            });
          return response || fetchPromise;
        });
    },
    cacheNetworkFallback: function (cache) {
      return cache.match(event.request)
        .then(function(response) {
          return response || fetch(event.request);
        });
    }
  };

  // Make sure the url is one we don't exclude from cache.
  if (event.request.method === 'GET' && CACHE_EXCLUDE.every(urlNotExcluded)) {
    var resp = caches.open(CURRENT_CACHE)
      .then(strategies[CACHE_STRATEGY])
      .catch(function(error) {
        // Display a default page when trying to browse offline.
        return caches.match('/offline');
      });
    event.respondWith(resp);
  }
  else {
    console.log('Ignored ', event.request.url);
  }
});
