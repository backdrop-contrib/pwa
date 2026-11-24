Progressive Web App
===================

Makes a Backdrop site a Progressive Web App (PWA): visitors can install it on their phone or desktop like an app, and pages they have visited keep working when the connection drops. It adds a [web app manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) and a [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) built on [Workbox](https://developer.chrome.com/docs/workbox).

2.x is a port of the Drupal 7.x-2.x branch. It replaces 1.x; see "Upgrading from 1.x" below.

Requirements
------------

- **HTTPS.** Browsers only install service workers on secure sites (and on `localhost` for testing).
- Icons of 192x192 and 512x512 pixels for the app to be installable. The module ships with Backdrop icons; set your own with `hook_pwa_manifest_alter()` (see `pwa.api.php`).

Installation
------------

Install this module using the [official Backdrop CMS instructions](https://docs.backdropcms.org/documentation/extend-with-modules).

On install, anonymous and authenticated users get the "Access Progressive Web App" permission.

Configuration
-------------

Go to **Configuration > System > Progressive Web App** (`admin/config/system/pwa`).

- **Manifest:** app name, short name, description, colours, start page, orientation and display mode.
- **Service worker:** cache version (change it to make every visitor fetch fresh files), automatic removal and debug messages.
- **Caching:** paths that are never cached, how each type of file is cached, and the strategy for particular pages.
- **Precaching:** pages and files to download when the service worker installs, so they work offline before they have been visited.

Permissions:

- **Access Progressive Web App:** visitors with this get the service worker.
- **Administer Progressive Web App manifest:** the Manifest tab.
- **Administer Progressive Web App service worker:** the other tabs. Marked as restricted: what it sets runs in every visitor's browser.

What gets cached
----------------

- **Pages** are fetched from the network first. A copy is kept so the page works offline; if there is no copy, the offline page is shown.
- **Scripts and stylesheets** are served from the cache and refreshed in the background. **Images and fonts** are served from the cache when present. Each type can be changed on the Caching tab.
- **The start page and the offline page** are downloaded when the service worker installs.

What is never cached:

- **Pages for logged-in users, and for anonymous visitors with session data** (a cart, checkout details, a status message). Backdrop marks these responses with an `X-PWA-Cache: no-store` header and the service worker skips them, whatever the caching settings say. Static files such as CSS and JS are still cached.
- **Paths on the "Never cache" list.** By default `/admin`, `/user/reset` (one-time login links) and the module's own `/pwa` paths.
- **Precached pages** are always fetched as an anonymous visitor, so they never hold a logged-in user's content.

When someone **logs in or out**, the site sends a `Clear-Site-Data` header. The browser deletes the service worker and everything it cached, so nothing from one session is shown in the next. The service worker installs again on the next page.

The service worker also **removes itself** when the module is disabled or the visitor loses the "Access Progressive Web App" permission. It checks every 10 page loads or after 10 minutes idle. This can be turned off on the Service worker tab.

Upgrading from 1.x
------------------

Run `update.php` after replacing the module. The updates:

- keep the manifest settings;
- turn the 1.x "Exclude URLs patterns" into "Never cache" patterns anchored to the start of the path (`admin/.*` becomes `^/admin/.*`), and add `^/pwa/.*`;
- turn "URLs to cache on install" into precached pages (`/` and `/offline` are dropped: 2.x always precaches the start page and the offline page);
- split the "Administer Progressive Web App configuration" permission into the two new admin permissions, for every role that had it;
- delete the old `files/pwa/manifest.json`. The manifest is now served from `/manifest.webmanifest`.

Custom icons set with `hook_pwa_manifest_alter()` keep working.

Extending
---------

See `pwa.api.php`:

- `hook_pwa_manifest_alter()`: change the manifest, for example to set your own icons.
- `hook_pwa_serviceworker_data_alter()`: change the settings passed to the service worker.
- `hook_pwa_serviceworker_script_alter()`: add your own scripts to the service worker. Workbox's core, routing, strategies and expiration modules are available.

Troubleshooting
---------------

If the service worker gets in the way (an old page keeps appearing, a login link doesn't work), remove it from your own browser:

- **Chrome or Edge:** DevTools > Application > Storage > **Clear site data**. This takes effect immediately.
- **Firefox:** Settings > Privacy & Security > Cookies and Site Data > Manage Data, then remove the site.
- To browse without it temporarily: DevTools > Application > Service workers > **Bypass for network**.

To remove it for every visitor, disable the module, or remove the "Access Progressive Web App" permission. Each visitor's service worker removes itself at its next check.

Third-party code
----------------

`js/workbox/` holds the production builds of [Workbox](https://github.com/GoogleChrome/workbox) 7.4.1 (`workbox-core`, `workbox-routing`, `workbox-strategies`, `workbox-expiration`), copied unchanged from npm. Workbox is MIT licensed; see `js/workbox/LICENSE.txt`. It is bundled so that no script is loaded from a CDN.

License
-------

This project is GPL v2 or later software. See the LICENSE.txt file in this directory for the complete text.

Current Maintainers
-------------------

- [Richard Peacock](https://github.com/swampopus)
- [Steve Moorhouse (albanycomputers)](https://github.com/albanycomputers)
- Additional maintainers welcomed.

Credits
-------

Ported to Backdrop by [Herb v/d Dool](https://github.com/herbdool). 2.x ported from the Drupal 7.x-2.x branch by [Steve Moorhouse](https://github.com/albanycomputers).

Based on the PWA module for Drupal, written and maintained by many contributors, including:

- [rupl](https://www.drupal.org/u/rupl)
- [nod_](https://www.drupal.org/u/nod_)
- [Alex Borsody](https://www.drupal.org/u/alexborsody)
