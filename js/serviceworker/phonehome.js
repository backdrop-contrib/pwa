/**
 * @file
 * Let the service worker remove itself when it should no longer run.
 *
 * Every so often the service worker asks the site whether it is still
 * wanted. A 404 means the module has been disabled; a 403 means this visitor
 * no longer has the 'access pwa' permission. Either way the service worker
 * unregisters itself and deletes its caches.
 */

((self, navigator, {phonehome: {url, idle, count}}, console) => {

  const state = {
    // Time of the last request.
    latestRequest: 0,
    // Page loads since the last check.
    pageCount: 0,
  };

  /**
   * Whether it is time to check again.
   *
   * @param {Event} event
   *
   * @return {boolean}
   */
  function shouldCheck(event) {
    if (!navigator.onLine) {
      return false;
    }
    const now = Date.now();
    if (event.type === 'fetch' && event.request.mode === 'navigate') {
      state.pageCount += 1;
    }
    const idleCheck = idle ? (now - state.latestRequest) > idle * 1000 : true;
    const countCheck = count > 0 ? state.pageCount >= count : true;
    state.latestRequest = now;
    if (countCheck) {
      state.pageCount = 0;
    }
    return idleCheck || countCheck;
  }

  /**
   * Unregister the service worker and delete its caches.
   */
  function uninstall() {
    // Stop the caching routes from storing anything from now on.
    self.pwaUninstalling = true;
    return self.registration.unregister()
      .then(success => {
        if (!success) {
          self.pwaUninstalling = false;
          console.error('Phone-home: the service worker could not unregister itself. Remove it in the browser developer tools.');
          return;
        }
        return caches.keys().then(names => Promise.all(
          names.filter(name => name.indexOf('pwa-') === 0).map(name => caches.delete(name))
        ));
      })
      .catch(error => {
        self.pwaUninstalling = false;
        console.error('Phone-home:', error);
      });
  }

  /**
   * Ask the site whether the service worker is still wanted.
   *
   * @param {Event} event
   */
  function phoneHome(event) {
    if (!shouldCheck(event)) {
      return;
    }
    fetch(url, {credentials: 'same-origin', cache: 'no-store'})
      .then(response => {
        switch (response.status) {
          case 200:
            console.debug('Phone-home: module active.');
            break;

          case 403:
          case 404:
            console.log('Phone-home: module disabled or access removed (' + response.status + '). Uninstalling.');
            uninstall();
            break;

          default:
            console.debug('Phone-home: unexpected response', response.status);
        }
      })
      .catch(error => console.debug('Phone-home: no response', error));
  }

  self.pwaUninstalling = false;
  self.addEventListener('fetch', phoneHome);
  self.addEventListener('activate', phoneHome);

})(self, navigator, pwaSettings, pwaConsole);
