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

    // If it's an asset: stale while revalidate.
    if (isCacheableAsset(url)) {
      promiseReturn = cache
        .match(event.request)
        .then(handleCacheableAssetResponse.bind(cache));
    }
    // Non-cacheable images: no cache.
    else if (isImageUrl.test(url)) {
      promiseReturn = fetch(event.request)
        .catch(catchOfflineImage);
    }
    // Other ressources: network with cache fallback.
    else {
      promiseReturn = fetch(event.request)
        .then(handleResponse.bind(cache))
        .catch(handleOffline.bind(cache));
    }

    return promiseReturn;
  }

  /**
   *
   *
   * @param {Response} response
   */
  function handleResponse(response) {
    // Don't cache images.
    if (isCacheableResponse(response)) {
      this.put(event.request, response.clone());
    }
    return response;
  }

  /**
   * Serve offline page.
   *
   * @param error
   *
   * @return {Promise}
   */
  function handleOffline(error) {
    return this
      .match(event.request)
      .then(function (response) {
        if (!response) {
          throw new Error('Not in cache');
        }
        return response;
      })
      .catch(catchOffline);
  }

  /**
   *
   * @param {Response} response
   *
   * @return {Promise}
   */
  function handleCacheableAssetResponse(response) {

    /**
     * @param {Response} networkResponse
     *
     * @return {Promise}
     */
    function handleNetworkResponse(networkResponse) {
      // Don't cache redirects or errors.
      if (isCacheableResponse(networkResponse)) {
        this.put(event.request, networkResponse.clone());
      }
      else {
        console.log("Response not cacheable: ", networkResponse);
      }
      return networkResponse;
    }

    var fetchPromise = fetch(event.request).then(handleNetworkResponse.bind(this));
    return response || fetchPromise;
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
    );
  }
  else {
    console.log('Excluded URL: ', event.request.url);
  }
});
