/**
 * @file
 * Drupal optimized fetch strategy.
 */

/**
 * Mix of several strategies:
 *  - only cache GET requests.
 *  - for js/css/fonts assets, use stale while revalidate.
 *  - for html pages, use network with cache fallback.
 *  - Do not cache images or HTTP errors and redirects.
 */
self.addEventListener('fetch', function (event) {

  /**
   * Tells if an asset should be cached.
   *
   * @param {string} assetUrl
   *
   * @return {boolean}
   */
  function isCacheableAsset(assetUrl) {
    // Cache all CSS and JS files.
    if (isAssetUrl.test(assetUrl)) {
      // If the URL looks like an image, check if it's in the cached urls.
      if (isImageUrl.test(assetUrl)) {
        var url = new URL(assetUrl);
        var assetPath = assetUrl.replace(url.origin, '');

        return CACHE_URLS.some(function (url) {
          return assetPath === url;
        });
      }
      return true;
    }
    return false;
  }

  /**
   * Helper to make sure we don't cache http errors.
   *
   * @param {Response} response
   *
   * @return {boolean}
   */
  function isCacheableResponse(response) {
    // Don't cache HTTP errors or redirects.
    return response.status < 300;
  }

  /**
   * @param {Request} request
   *
   * @return {Promise}
   */
  function fetchRessourceFromCache(request) {
    return this.match(request || event.request);
  }

  /**
   * Returns the cached version or reject the promise.
   *
   * @param {undefined|Response} response
   *
   * @return {Promise}
   */
  function returnRessourceFromCache(response) {
    if (!response) {
      return Promise.reject(new Error('Ressource not in cache'));
    }
    return response;
  }

  /**
   *
   * @return {Promise}
   */
  function fetchRessourceFromNetwork() {
    return fetch(event.request);
  }

  /**
   * @param {Response} response
   *
   * @return {Promise}
   */
  function cacheNetworkResponse(response) {
    // Don't cache redirects or errors.
    if (isCacheableResponse(response)) {
      this.put(event.request, response.clone());
    }
    else {
      console.log("Response not cacheable: ", response);
    }
    return response;
  }


  /**
   * Main point of entry.
   *
   * Separate handling of assets from all other requests.
   *
   * @param {Cache} cache
   *
   * @return {Promise}
   */
  function handleRequest(cache) {
    var promiseReturn;
    var fetchRessourceFromThisCache = fetchRessourceFromCache.bind(cache);

    // If it's an asset: stale while revalidate.
    if (isCacheableAsset(url)) {
      promiseReturn = fetchRessourceFromThisCache(event.request)
        .then(returnRessourceFromCache)
        .catch(fetchRessourceFromNetwork)
        .then(cacheNetworkResponse.bind(cache))
        .catch(logError);
    }
    // Non-cacheable images: no cache.
    else if (isImageUrl.test(url)) {
      promiseReturn = fetch(event.request)
        .catch(catchOfflineImage);
    }
    // Other ressources: network with cache fallback.
    else {
      promiseReturn = fetch(event.request)
        .then(cacheNetworkResponse.bind(cache))
        .catch(fetchRessourceFromThisCache)
        .then(returnRessourceFromCache)
        .catch(catchOffline);
    }

    return promiseReturn;
  }

  var url = event.request.url;
  var isAssetUrl = /\.(js|css|jpe?g|png|gif|svg|webp)\??/;
  var isImageUrl = /\.(jpe?g|png|gif|svg|webp)\??/;
  var isMethodGet = event.request.method === 'GET';
  var notExcluded = CACHE_EXCLUDE.every(urlNotExcluded(url));

  // Make sure the url is one we don't exclude from cache.
  if (isMethodGet && notExcluded) {
    event.respondWith(caches
      .open(CURRENT_CACHE)
      .then(handleRequest)
      .catch(logError)
    );
  }
  else {
    console.log('Excluded URL: ', event.request.url);
  }
});
