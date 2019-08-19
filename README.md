Progressive Web App
===================

This module provides basic components to progressively enhance your website with offline functionality. It uses [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and [manifest.json](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json) to provide a more app-like experience on mobile devices.

Configuration
-------------

Visit the configuration page (`/admin/configure/development/pwa`) and fill in what you need. To change the logo used in the manifest file the only way now is to implement `hook_pwa_manifest_alter(&$manifest)` and set the icons property. See the `pwa.api.php` file for a code example. The example assumes the images exist within your theme folder. Linking to uploaded media would require different code.

By default, the manifest has the following properties:

- `name`: from `site_name` core config variable
- `short_name`: from `site_name` core config variable
- `description`: blank
- `lang`: default site language
- `dir`: default site language direction
- `background_color`: white
- `theme_color`: white
- `start_url`: /
- `orientation`: portrait
- `display`: standalone
- `icons`: Backdrop icons in 144, 192, 512, and SVG

What is a Progressive Web App?
------------------------------

A Progressive Web App is:

- Reliable — Loads instantly and never show an "Offline" screen to the visitor, even in uncertain network conditions.
- Fast — Responds quickly to user interactions with silky smooth animations and no janky scrolling.
- Engaging — Feels like a natural app on the device, with an immersive user experience.

Continue reading more about PWAs from [Google](https://developers.google.com/web/progressive-web-apps/) or on [MDN](https://developer.mozilla.org/en-US/Apps/Progressive/Introduction).

In general a PWA depends on the following technologies to be available:

- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json)
- HTTPS

What does the PWA Backdrop module do?
-------------------------------------

The main benefit of this module is the use of Service Worker for caching and offline capabilities. Once the Service Worker is active, page loading is faster:

- All JS and CSS files will always be **served from cache** while being refreshed in the background. Same thing as *Stale While Revalidate* in Varnish.
- All pages are fetched from the network (as before) and a **copy is kept in cache** so it will be available when offline.
- **Images are cached** unless the `save-data` header is detected in order to be mindful of bandwidth usage and cache size. A fallback image should appear for any uncached image.

The module will also create a configurable `manifest.json` file to make the website installable on supporting mobile devices. Out of the box, the module fulfils enough PWA requirements that the "add to home screen" prompt is automatically triggered when a visitor returns often enough to your website. It provides a perfect PWA Lighthouse audit score by default as well.

Server Requirements
-------------------

This Backdrop module requires **PHP 7.2 or greater**. We will continue to modify this minimum requirement to avoid supporting any EOL version of PHP. If you are using an older version it is recommended to urgently upgrade your version of PHP to avoid unpatched security vulnerabilities.

Additionally, your web server **MUST support secure connections using HTTPS**. This is a requirement of the W3 specification and is not a choice made by the module maintainers.

Browser support
---------------

As of May 2018 there is wide cross-browser support! See current status at the following canonical resources:

- [Is Service Worker Ready?](https://jakearchibald.github.io/isserviceworkerready/) - browser support grouped by dependencies.
- [caniuse.com/#feat=serviceworkers](https://caniuse.com/#feat=serviceworkers) - historical support grouped by browser version.

A brief list of browsers that support Service Worker and Manifest:

- Chrome/Opera
- Firefox
- Edge 17+
- Safari macOS 11.1 / iOS 11.3+
- UC Browser 11.8+
- Samsung Internet 4+

Service Worker is a progressive enhancement, so browsers without support will behave exactly as normal websites. However, it will make things significantly faster, more network-resilient, and offer an offline branding opportunity in browsers that have support.

Related specifications
----------------------

The Cache API used by PWA is a [new cache defined by the Service Worker spec](https://developer.mozilla.org/en-US/docs/Web/API/Cache).

Help! Something is broken!
--------------------------

Do not fear, there are temporary workarounds when the Service Worker causes some trouble. Often you will just need to access the Backdrop admin in order to disable to module. For that, you can follow the official [Troubleshooting guide](https://www.drupal.org/docs/7/modules/progressive-web-app-pwa/troubleshooting).

License
-------

This project is GPL v2 or higher software. See the LICENSE.txt file in this directory for complete text.

Current Maintainers
-------------------

- Seeking maintainers.

Credits
-------

Ported by [Herb v/d Dool](https://github.com/herbdool).

This module is based on the PWA module for Drupal, originally written and maintained by a large number of contributors, including:

- [rupl](https://www.drupal.org/u/rupl)
- [nod_](https://www.drupal.org/u/nod_)
- [Alex Borsody](https://www.drupal.org/u/alexborsody)
