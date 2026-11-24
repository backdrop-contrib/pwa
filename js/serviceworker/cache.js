/**
 * @file
 * Caching rules for the service worker, built on Workbox.
 *
 * - Pages: network first, falling back to the cache, then the offline page.
 * - Assets: the strategy set for each type in the admin UI.
 * - Excluded paths: never cached; pages still fall back to the offline page.
 * - Responses Backdrop marks with the no-cache header (pages for logged-in
 *   users and anonymous visitors with a session) are never cached.
 * - Precaching is done here rather than with Workbox, without credentials,
 *   so the cached copies are always the anonymous versions.
 */

((self, {version, basePath, noCacheHeader, cache}, console) => {

  const {registerRoute, setCatchHandler} = workbox.routing;
  const strategies = workbox.strategies;
  const {ExpirationPlugin} = workbox.expiration;
  const STRATEGIES = ['CacheFirst', 'CacheOnly', 'NetworkFirst', 'NetworkOnly', 'StaleWhileRevalidate'];

  const CACHE = {
    precache: 'pwa-precache-' + version,
    page: 'pwa-page-' + version,
    asset: 'pwa-asset-' + version,
  };

  // Exclude patterns are matched against the path within the site, so
  // '^/admin/' works when Backdrop is installed in a subdirectory.
  const exclude = cache.exclude.reduce((list, pattern) => {
    try {
      list.push(new RegExp(pattern));
    }
    catch (error) {
      console.error('Ignoring invalid exclude pattern', pattern, error);
    }
    return list;
  }, []);

  /**
   * The path of a URL within the site, starting with '/'.
   *
   * @param {URL} url
   *
   * @return {string}
   */
  function sitePath(url) {
    const path = url.pathname;
    return path.indexOf(basePath) === 0 ? '/' + path.slice(basePath.length) : path;
  }

  /**
   * @param {URL} url
   *
   * @return {boolean}
   */
  function isSameOrigin(url) {
    return url.origin === self.location.origin;
  }

  /**
   * @param {URL} url
   *
   * @return {boolean}
   */
  function isExcluded(url) {
    return isSameOrigin(url) && exclude.some(regex => regex.test(sitePath(url)));
  }

  /**
   * Whether caching is allowed at all for this request.
   *
   * @param {Request} request
   * @param {URL} url
   *
   * @return {boolean}
   */
  function isCacheable(request, url) {
    return !self.pwaUninstalling
      && request.method === 'GET'
      && ['http:', 'https:'].includes(url.protocol)
      && !isExcluded(url);
  }

  /**
   * Workbox plugin: never store responses Backdrop marks as private, or
   * anything while the service worker is uninstalling.
   */
  const privatePlugin = {
    cacheWillUpdate: async ({response}) => {
      if (self.pwaUninstalling || !response) {
        return null;
      }
      if (response.headers.get(noCacheHeader) === 'no-store') {
        return null;
      }
      return response;
    },
  };

  /**
   * Workbox plugin: size limits and third-party responses for one asset
   * type.
   *
   * @param {object} config
   *   The asset settings from the admin UI.
   * @param {string} destination
   *   The request destination, e.g. 'image'.
   *
   * @return {object}
   */
  function assetPlugin({external, maxSize, limitMaxSize}, destination) {
    return {
      cacheWillUpdate: async ({request, response}) => {
        // Opaque third-party responses (status 0): only when allowed.
        if (response.status === 0) {
          return external ? response : null;
        }
        if (response.status !== 200) {
          return null;
        }
        if (limitMaxSize) {
          const size = parseInt(response.headers.get('Content-Length'), 10);
          if (!size || size > maxSize * 1000) {
            console.debug(`Not caching ${destination} over ${maxSize}kB (or of unknown size)`, request.url);
            return null;
          }
        }
        return response;
      },
    };
  }

  /**
   * Install: precache the offline page, the start page and the configured
   * pages and assets, anonymously.
   */
  self.addEventListener('install', event => {
    const urls = cache.precache.page.concat(cache.precache.asset);
    event.waitUntil(
      caches.open(CACHE.precache)
        .then(store => Promise.all(urls.map(url =>
          fetch(url, {credentials: 'omit'})
            .then(response => {
              if (!response.ok || response.headers.get(noCacheHeader) === 'no-store') {
                console.error('Could not precache', url, response.status);
                return;
              }
              return store.put(url, response);
            })
            .catch(error => console.error('Could not precache', url, error))
        )))
        .then(() => self.skipWaiting())
    );
  });

  /**
   * Activate: delete caches from earlier versions and take control of open
   * pages straight away.
   */
  self.addEventListener('activate', event => {
    event.waitUntil(
      caches.keys()
        .then(names => Promise.all(names
          .filter(name => name.indexOf('pwa-') === 0 && !Object.values(CACHE).includes(name))
          .map(name => caches.delete(name))))
        .then(() => self.clients.claim())
    );
  });

  // Excluded pages: straight to the network, never cached. The catch
  // handler below still shows the offline page when there is no connection.
  registerRoute(
    ({request, url}) => request.mode === 'navigate' && isExcluded(url),
    new strategies.NetworkOnly()
  );

  // Pages matching a custom pattern from the admin UI.
  cache.patterns.page.forEach(({strategy, value}) => {
    let regex;
    try {
      regex = new RegExp(value);
    }
    catch (error) {
      console.error('Ignoring invalid page pattern', value, error);
      return;
    }
    if (!STRATEGIES.includes(strategy)) {
      return;
    }
    registerRoute(
      ({request, url}) => request.mode === 'navigate' && isSameOrigin(url) && isCacheable(request, url) && regex.test(sitePath(url)),
      new strategies[strategy]({
        cacheName: CACHE.page,
        plugins: [privatePlugin, new ExpirationPlugin({maxEntries: 50})],
      })
    );
  });

  // All other pages: network first.
  registerRoute(
    ({request, url}) => request.mode === 'navigate' && isSameOrigin(url) && isCacheable(request, url),
    new strategies.NetworkFirst({
      cacheName: CACHE.page,
      plugins: [privatePlugin, new ExpirationPlugin({maxEntries: 50})],
    })
  );

  // Assets, by type.
  Object.entries(cache.assets).forEach(([destination, config]) => {
    if (!STRATEGIES.includes(config.strategy)) {
      // 'DoNotCache', or anything unknown.
      return;
    }
    registerRoute(
      ({request, url}) => request.destination === destination
        && isCacheable(request, url)
        && (config.external || isSameOrigin(url)),
      new strategies[config.strategy]({
        cacheName: CACHE.asset,
        plugins: [privatePlugin, assetPlugin(config, destination), new ExpirationPlugin({maxEntries: 200})],
      })
    );
  });

  // When a route fails (usually no connection): any cached copy, then the
  // offline page or image.
  setCatchHandler(async ({request}) => {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    if (request.destination === 'document') {
      return (await caches.match(cache.offline.page)) || Response.error();
    }
    if (request.destination === 'image') {
      return (await caches.match(cache.offline.image)) || Response.error();
    }
    return Response.error();
  });

})(self, pwaSettings, pwaConsole);
