# Progressive Web App

This module provides basic components to progressively enhance your website with offline functionality. It uses [Service Worker][1] and [manifest.json][2] to provide a more app-like experience on mobile devices.

## HTTPS Required

**Your site MUST have valid HTTPS** for this module to function properly! Without HTTPS, the Service Worker refuses to install. You can do local testing on `localhost` without HTTPS, but that's the only plain HTTP URL which will work.

## Configuration

Visit the configuration page (`/admin/configure/development/pwa`) and fill in what you need. To change the logo used in the manifest file the only way now is to implement `hook_pwa_manifest_alter(&$manifest)` and set the icons property. See the `pwa.api.php` file for a code example. The example assumes the images exist within your theme folder. Linking to uploaded media would require different code.

Tip: once you've chosen your icons, add them to the list of "URLs to cache on install" to ensure that they're also available offline.

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
[2]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json
