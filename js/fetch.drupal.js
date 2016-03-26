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

  function responseIsImage(response) {
    return response.headers.get('Content-type').indexOf('image/') === 0;
  }

  /**
   * Helper to make sure we don't cache http errors.
   *
   * @param {Response} response
   *
   * @return {boolean}
   */
  function isCacheableResponse(response) {
    var statusOK = response.status < 300;
    var contentTypeOK = !responseIsImage(response);

    // This make sure we can still cache images with CACHE_URLS.
    var responseUrl = response.url;
    var parts = responseUrl.split('://');
    var hostname = parts[1].split('/', 1)[0];
    var isPreloaded = CACHE_URLS.some(function (url) {
      return responseUrl === parts[0] + '://' + hostname + url;
    });

    return statusOK && !isPreloaded && contentTypeOK;
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

    // If it's an asset, look in the cache and implement stale while revalidate.
    if (isCacheableAsset.test(url)) {
      promiseReturn = cache
        .match(event.request)
        .then(handleCacheableAssetResponse.bind(cache));
    }
    else {
      promiseReturn = fetch(event.request)
        .then(handleResponse.bind(cache))
        .catch(handleResponseError.bind(cache));
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
   * When the main response fails because user is offline.
   *
   * Try to serve the request from the cache, serve the default offline page
   * if request is not in cache.
   *
   * @param {*} error
   */
  function handleResponseError(error) {
    var response = this.match(event.request);

    if (isImageUrl.test(url)) {
      response.catch(catchOfflineImage);
    }
    else {
      response.catch(catchOffline);
    }

    return response;
  }

  /**
   *
   * @param {Response} response
   *
   * @return {Promise}
   */
  function handleCacheableAssetResponse(response) {

    /**
     *
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
  // Allow cache assets with query strings.
  var isCacheableAsset = /\.(js|css)\??/;
  var isImageUrl = /\.(jpe?g|png|gif|svg|webp)\??/;
  var isMethodGet = event.request.method === 'GET';
  var notExcluded = CACHE_EXCLUDE.every(urlNotExcluded(url));

  // Make sure the url is one we don't exclude from cache.
  if (isMethodGet && notExcluded) {
    event.respondWith(caches
      .open(CURRENT_CACHE)
      .then(handleRequest)
      .catch(function (error) {
        // Oups.
      })
    );
  }
  else {
    console.log('Excluded URL: ', event.request.url);
  }
});
