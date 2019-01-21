/**
 * @file
 * Adapted from https://github.com/GoogleChrome/samples/tree/gh-pages/service-worker
 * and https://jakearchibald.com/2014/offline-cookbook/
 */
"use strict";

// If at any point you want to force pages that use this service worker to start
// using a fresh cache, then increment the CACHE_VERSION value in the Drupal UI.
// It will kick off the Service Worker update flow and the old cache(s) will be
// purged as part of the activate event handler when the updated Service Worker
// is activated.
//
// When Drupal replaces `cacheVersion` during server-side processing, it includes
// the packaged version number. That means any module upgrade will automatically
// result in a fresh SW installation.
const CACHE_VERSION = 1/*cacheVersion*/;

// Never include these URLs in the SW cache.
const CACHE_EXCLUDE = [/*cacheConditionsExclude*/].map(function (r) {return new RegExp(r);});

// Cached pages. Add URLs using the 'Service Worker' tab of the Drupal UI.
let CACHE_URLS = [/*cacheUrls*/];

// Cached assets. These are extracted using internal HTTP requests during Drupal
// cache clears and this list will be hardcoded in the resultant SW file.
const CACHE_URLS_ASSETS = [/*cacheUrlsAssets*/];

// When no connection is available, show this URL instead of the content that
// should be available at the URL. This URL is never shown in the browser.
const CACHE_OFFLINE = '/offline';

// When an image hasn't been cached, we use this fallback image instead.
const CACHE_OFFLINE_IMAGE = 'offline-image.png';

// Add critical offline URLs to the required asset list.
CACHE_URLS.push(CACHE_OFFLINE_IMAGE);
CACHE_URLS.push(CACHE_OFFLINE);

// Cache prefix
const CACHE_PREFIX = 'pwa-main-';

// Full cache name: Cache prefix + cache version.
const CACHE_CURRENT = CACHE_PREFIX + CACHE_VERSION;

// The cache should be assumed to be active by default. After uninstallation has
// successfully occurred we will set this to false in order to prevent certain
// conditions where the cache was deleted before new assets were added afterwards.
let CACHE_ACTIVE = true;

// Phone-home URL
const PWA_PHONE_HOME_URL = '/pwa/module-active';

// Phone-home should only happen once per life of the SW. This is initialized to
// FALSE and will be set to TRUE during phone-home. When the Service Worker goes
// idle it will reset the variable and the next time it activates, it will once
// again phone-home.
let PWA_PHONE_HOME_ALREADY = false;


/**
 * Install the Service Worker.
 *
 * This event runs only once for the entire life of the active SW. It will run
 * again once the value of CACHE_CURRENT changes, OR when the contents of this
 * file change in any way.
 */
self.addEventListener('install', function (event) {
  // Install assets for minimum viable website (MVW).
  if (CACHE_URLS.length) {
    event.waitUntil(caches
      .open(CACHE_CURRENT)
      .then(function (cache) {
        return Promise.all(CACHE_URLS.concat(CACHE_URLS_ASSETS).map(function (url) {
          // Instead of directly adding URLs to Cache API, reformat to include
          // the `no-cors` header to enable caching of third-party assets such
          // as hosted fonts, CDN libraries, etc.
          return fetch(url, { credentials: 'same-origin', mode: 'no-cors' })
            .then(function (response) {
              return cache.put(url, response);
            })
            .catch(function (error) {
              logError(error);

              // Uncommented Promise.resolve() will allow installation even when
              // assets aren't successfully cached.
              //
              // @TODO: is this conservative enough for a module expected to work
              //        without extensive configuration?
              //
              // @see https://www.drupal.org/project/pwa/issues/2986596
              //
              // return Promise.resolve();
            });
        }));
      }));
  }
});

/**
 * Once the Service Worker is installed, this event is fired to allow for
 * cleanup of the old caches and to prime the Service Worker for use.
 */
self.addEventListener('activate', function (event) {
  // The `activate` event happens in one of two situations:
  // 1) The Service Worker successfully installed and the visitor finished their
  //    previous session, allowing this current SW to claim control, OR...
  // 2) TODO: during the `install` event, we execute the `self.skipWaiting()`
  //    command to immediately pass control to the new SW as soon as it finishes
  //    installing. This is not yet implemented in the PWA Drupal module.
  //
  // @see https://www.drupal.org/project/pwa/issues/2986689
  //
  // The tasks we perform are:
  //
  // 1) Activate new Service Worker and take control of the client(s).
  // 2) Delete all caches that are not CACHE_CURRENT.
  var tasks = [
    self.clients.claim(),
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          // Delete any cache that...
          // 1) has our prefix at the beginning
          // 2) doesn't exactly match CURRENT_CACHE
          //
          // We intentionally skip other caches that lack our hardcoded prefix
          // in order to allow custom Cache entries from userland.
          //
          // @see https://www.drupal.org/project/pwa/issues/2984140
          if (cacheName.indexOf(CACHE_PREFIX) === 0 && cacheName.indexOf(CACHE_CURRENT) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  ];

  // Execute the tasks defined above.
  event.waitUntil(Promise.all(tasks));
});

/**
 * @TODO move that when we start using plugins.
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
  return caches.match(CACHE_OFFLINE);
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

/**
 * Default catch callback.
 *
 * @param {Error} error
 */
function logError(error) {
  console.error(error);
  return Response.error();
}

/**
 * Test if an asset should be cached.
 *
 * @param {URL} assetUrl
 *
 * @return {boolean}
 */
function isCacheableAsset(assetUrl) {

  // Url is not an asset, don't cache.
  if (!isAssetUrl(assetUrl)) {
    return false;
  }

  // It's an asset but not an image, always cache.
  if (!isImageUrl(assetUrl)) {
    return true;
  }

  // If it looks like an image, only cache images that are part of
  // assets cached on install.
  var assetPath = assetUrl.href.replace(assetUrl.origin, '');
  return CACHE_URLS.concat(CACHE_URLS_ASSETS).some(function (url) { return assetPath === url; });
}

/**
 * Helper for Assets files.
 *
 * @param {URL} assetUrl
 *
 * @return {boolean}
 */
function isAssetUrl(assetUrl) {
  return /\.(js|css|jpe?g|png|gif|svg|webp|eot|woff2?|ttf|otf)\??/.test(assetUrl.href);
}

/**
 * Helper for image files.
 *
 * @param {URL} imageUrl
 *
 * @return {boolean}
 */
function isImageUrl(imageUrl) {
  return /\.(jpe?g|png|gif|svg|webp)\??/.test(imageUrl.href);
}

/**
 * Mix of several strategies:
 * - only cache GET requests.
 * - CSS/JS/fonts use stale while revalidate.
 * - HTML responses use network with cache fallback.
 * - Images use stale while revalidate unless `save-data` header is present
 * - Do NOT cache HTTP errors and redirects.
 */
self.addEventListener('fetch', function (event) {
  // During every request give SW the chance to phone-home and unregister.
  phoneHome();

  /**
   * @param {Request} request
   *
   * @return {Promise}
   */
  function fetchResourceFromCache(request) {
    return caches.match(request.url ? request : event.request);
  }

  /**
   * Returns the cached version or reject the promise.
   *
   * @param {undefined|Response} response
   *
   * @return {Promise}
   */
  function returnResourceFromCache(response) {
    if (!response) {
      return Promise.reject(new Error('Resource not in cache'));
    }
    return response;
  }

  /**
   *
   * @return {Promise}
   */
  function fetchResourceFromNetwork() {
    return fetch(event.request);
  }

  /**
   * @param {Response} response
   *
   * @return {Promise}
   */
  function cacheNetworkResponse(response) {
    // Don't cache redirects or errors.
    if (response.ok) {
      // Copy now and not in the then() because by that time it's too late,
      // the request has already been used and can't be touched again.
      var copy = response.clone();

      if (CACHE_ACTIVE) {
        caches
          .open(CACHE_CURRENT)
          .then(function (cache) {
            return cache.put(event.request, copy);
          })
          .catch(logError);
      }
      else {
        console.debug('PWA: The Service Worker has been uninstalled so cache.put() was skipped.');
      }
    }

    // If response.ok was false, try one more time with `no-cors` header which
    // will allow valid third-party requests to be cached.
    else {
      fetch(event.request, { mode: 'no-cors' })
      .then(function (response) {
        // Don't cache redirects or errors.
        if (response.ok) {
          var copy = response.clone();

          if (CACHE_ACTIVE) {
            caches
              .open(CACHE_CURRENT)
              .then(function (cache) {
                return cache.put(event.request, copy);
              })
              .catch(logError);
          }
          else {
            console.debug('PWA: The Service Worker has been uninstalled so cache.put() was skipped.');
          }
        }
      })
      .catch(function (error) {
        logError(error);
        console.error("PWA: Response not cacheable ", response);
      });
    }

    return response;
  }

  var url = new URL(event.request.url);
  var isMethodGet = event.request.method === 'GET';
  var notExcludedPath = CACHE_EXCLUDE.every(urlNotExcluded(url.href));
  var includedProtocol = ['http:', 'https:'].indexOf(url.protocol) !== -1;

  var makeRequest = {
    networkWithOfflineImageFallback: function (request) {
      return fetch(request)
        .catch(catchOfflineImage)
        .catch(logError);
    },
    staleWhileRevalidate: function (request) {
      return fetchResourceFromCache(request)
        .then(returnResourceFromCache)
        .catch(function (error) {
          return fetchResourceFromNetwork(error)
            .then(cacheNetworkResponse);
        })
        .catch(logError);
    },
    staleWhileRevalidateImage: function (request) {
      return fetchResourceFromCache(request)
        .then(returnResourceFromCache)
        .catch(function (error) {
          return fetchResourceFromNetwork(error)
            .then(cacheNetworkResponse)
            .catch(catchOfflineImage);
        })
        .catch(logError);
    },
    networkWithCacheFallback: function (request) {
      return fetch(request)
        .then(cacheNetworkResponse)
        .catch(function (error) {
          return fetchResourceFromCache(error)
            .then(returnResourceFromCache)
            .catch(catchOffline);
        });
    }
  };

  // Make sure the URL is one we don't exclude from cache.
  if (isMethodGet && includedProtocol && notExcludedPath) {
    // If it's an asset: Stale-While-Revalidate.
    if (isCacheableAsset(url)) {
      event.respondWith(makeRequest.staleWhileRevalidate(event.request));
    }

    // Check for save-data Header and avoid caching when present.
    else if (isImageUrl(url)) {
      if (event.request.headers.get('save-data')) {
        console.debug('PWA: refusing to cache image due to save-data header.');
        event.respondWith(makeRequest.networkWithOfflineImageFallback(event.request));
      }
      else {
        event.respondWith(makeRequest.staleWhileRevalidateImage(event.request));
      }
    }

    // Other resources: network with cache fallback.
    else {
      event.respondWith(makeRequest.networkWithCacheFallback(event.request));
    }
  }
  else {
    console.debug('PWA: Excluded URL', event.request.url);
  }
});


/**
 * Phone home
 *
 * Check and see if the Drupal module still exists. The module specifies a
 * dedicated path and when the module is disabled or uninstalled, the URL
 * will 404, signalling to the SW that it needs to unregister itself.
 */
function phoneHome() {
  // Avoid constant phoning-home. Once this function has run, don't run again
  // until SW goes idle.
  if (PWA_PHONE_HOME_ALREADY) {
    console.debug('PWA: Phone-home - Last check was recent. Aborting.');
    return Promise.resolve();
  }
  else {
    // Enable flag to suppress future phone-homes until SW goes idle.
    PWA_PHONE_HOME_ALREADY = true;
  }

  // Fetch phone-home URL and process response.
  let phoneHomeUrl = fetch(PWA_PHONE_HOME_URL)
  .then(function (response) {
    // if no network, don't try to phone-home.
    if (!navigator.onLine) {
      console.debug('PWA: Phone-home - Network not detected.');
    }

    // if network + 200, do nothing
    if (response.status === 200) {
      console.debug('PWA: Phone-home - Network detected, module detected.');
    }

    // if network + 404, uninstall
    if (response.status === 404) {
      console.debug('PWA: Phone-home - Network detected, module NOT detected. UNINSTALLING.');

      // Let SW attempt to unregister itself.
      Promise.resolve(pwaUninstallServiceWorker());
    }

    return Promise.resolve();
  })
  .catch(function(error) {
    console.error('PWA: Phone-home - ', error);
  });
};

/**
 * Uninstall Service Worker
 */
function pwaUninstallServiceWorker() {
  return self.registration.unregister()
  .then(function(success) {
    if (success) {
      // Delete all Caches that belong to the PWA module.
      caches.keys().then(function(names) {
        for (let name of names) {
          console.debug('cache name: ', name);
          if (name.indexOf(CACHE_PREFIX) !== -1) {
            console.debug('PWA: Deleting cache with name ', name);
            caches.delete(name);
          }
        }

        // Disallow any future cache.put() coming from fetch listeners.
        CACHE_ACTIVE = false;

        console.debug('PWA: Phone-home - Service Worker has unregistered itself and destroyed old caches since the PWA Drupal module could not be detected.');
      });
    }
    else {
      console.error('PWA: Phone-home - Service Worker could not unregister itself. It might be necessary to manually delete this Service Worker using browser devtools.');
    }
  })
  .catch(function(error) {
    console.error('PWA: Phone-home - ', error);
  });
}
