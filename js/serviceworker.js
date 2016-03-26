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
var CACHE_EXCLUDE = [/*cacheConditionsExclude*/].map(function (r) {return new RegExp(r);});
var CACHE_URLS = [/*cacheUrls*/];
var CACHE_OFFLINE_IMAGE = 'offline-image.png';
CACHE_URLS.push(CACHE_OFFLINE_IMAGE);

var CURRENT_CACHE = 'all-cache-v' + CACHE_VERSION;

// Perform install steps
self.addEventListener('install', function (event) {
  // Use the service woker ASAP.
  var tasks = [self.skipWaiting()];
  if (CACHE_URLS.length) {
    tasks.push(caches.open(CURRENT_CACHE).then(function (cache) { return cache.addAll(CACHE_URLS); }));
  }
  event.waitUntil(Promise.all(tasks));
});

self.addEventListener('activate', function(event) {
  // Delete all caches that are not CURRENT_CACHE.
  var tasks = [
    self.clients.claim(),
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
  ];

  event.waitUntil(Promise.all(tasks));
});

/**
 * @todo move that when we start using plugins.
 *
 * @param {string} url
 *
 * @return {Function}
 */
function urlNotExcluded(url) {
  return function (condition) {
    return !condition.test(url);
  }
}

/**
 * Default offline page.
 *
 * @param {object} error
 *
 * @return {Response}
 */
function catchOffline(error) {
  return caches.match('/offline');
}

/**
 * Default offline Image.
 *
 * @param {object} error
 *
 * @return {Response}
 */
function catchOfflineImage(error) {
  return caches.match(CACHE_OFFLINE_IMAGE);
}

// Fetch strategy.

/*fetchStrategy*/
