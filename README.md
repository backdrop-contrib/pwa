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

SSL Requirement for Service Worker
----------------------------------

Your web server **MUST support secure connections using HTTPS**. This is a requirement of the W3 specification. Only localhost will work using HTTP.


Browser support for PWA and Service Worker
------------------------------------------

There is very wide browser support! See current status at the following canonical resources:

- [Is Service Worker Ready?](https://jakearchibald.github.io/isserviceworkerready/) - browser support grouped by dependencies.
- [caniuse.com/#feat=serviceworkers](https://caniuse.com/#feat=serviceworkers) - historical support grouped by browser version.

Most web updated browsers (released within the last 5 years) will support PWA and Service Worker, including:

- Chrome/Opera
- Firefox
- Edge
- Safari
- UC Browser
- Samsung Internet

Service Worker is a progressive enhancement, so browsers without support will behave exactly as normal websites. However, it will make things significantly faster, more network-resilient, and offer an offline branding opportunity in browsers that have support.


Troubleshooting
---------------

Sometimes there are problems on a site which are caused by the PWA module's Service Worker, or made more complicated by its presence. In these cases it's best to temporarily disable the Service Worker within your web browser so the Backdrop admin is once again accessible, or login links function as expected. Use one of these options to disable the Service Worker in your browser:

- Chrome DevTools > Application > Service Workers: after navigating through the devtools screens, click Bypass for network. Afterwards, you should be able to browse without the interference of the SW, for example to use a one-time login link like you get from running drush uli or similar.
- Chrome DevTools > Application > Service Workers: if you have an old Service Worker which you want to permanently remove, click Unregister and close all tabs under the domain which hosts the Service Worker. You cannot just close one tab; it must be all tabs for that website.
- Chrome DevTools > Application > Clear storage: if bypassing is not working, try deleting the Service Worker and the associated caches entirely by using the built-in options in devtools. Clicking "clear site data" is immediate and you don't need to close all tabs for it to take effect.


Related specifications
----------------------

The Cache API used by PWA is a [cache defined by the Service Worker spec](https://developer.mozilla.org/en-US/docs/Web/API/Cache).


License
-------

This project is GPL v2 or higher software. See the LICENSE.txt file in this directory for complete text.

Current Maintainers
-------------------

- [Richard Peacock](https://github.com/swampopus)
- Seeking additional maintainers.


Credits
-------

Ported by [Herb v/d Dool](https://github.com/herbdool).

This module is based on the PWA module for Drupal, originally written and maintained by a large number of contributors, including:

- [rupl](https://www.drupal.org/u/rupl)
- [nod_](https://www.drupal.org/u/nod_)
- [Alex Borsody](https://www.drupal.org/u/alexborsody)
