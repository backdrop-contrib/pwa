<?php
/**
 * @file
 * Hooks provided by the Progressive Web App module.
 */

/**
 * @addtogroup hooks
 * @{
 */

/**
 * Alter the web app manifest.
 *
 * The manifest is served from /manifest.webmanifest and cached; it is rebuilt
 * when the PWA settings are saved or caches are cleared.
 *
 * @param array $manifest
 *   The manifest, as an array that will be JSON-encoded.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest
 */
function hook_pwa_manifest_alter(array &$manifest) {
  // Use your own icons. A 192x192 and a 512x512 icon are needed for the app
  // to be installable. 'maskable' icons keep their important content inside
  // the central 80% circle, so devices can crop them to any shape.
  $path = backdrop_get_path('theme', 'MY_THEME');
  $manifest['icons'] = [
    [
      'src' => file_create_url($path . '/images/icon-192.png'),
      'sizes' => '192x192',
      'type' => 'image/png',
      'purpose' => 'any',
    ],
    [
      'src' => file_create_url($path . '/images/icon-512.png'),
      'sizes' => '512x512',
      'type' => 'image/png',
      'purpose' => 'any',
    ],
    [
      'src' => file_create_url($path . '/images/icon-maskable-512.png'),
      'sizes' => '512x512',
      'type' => 'image/png',
      'purpose' => 'maskable',
    ],
  ];

  // Add any other manifest member.
  $manifest['categories'] = ['education'];
}

/**
 * Alter the settings passed to the service worker.
 *
 * @param array $settings
 *   The settings, JSON-encoded into the service worker. Keys include
 *   'version', 'debug', 'basePath', 'cache' (exclude, precache, patterns,
 *   assets, offline) and 'phonehome'.
 */
function hook_pwa_serviceworker_data_alter(array &$settings) {
  // Always precache a page.
  $settings['cache']['precache']['page'][] = url('contact');
}

/**
 * Alter the scripts the service worker imports.
 *
 * Use this to add your own service worker code. Scripts are imported in
 * order; 'cache' sets up the Workbox routes, so add code that registers its
 * own fetch routes before it. Workbox (core, routing, strategies,
 * expiration) is available as the global 'workbox' from 'workbox-core' on.
 *
 * @param array $scripts
 *   Script paths relative to the Backdrop root, keyed by name. A NULL value
 *   is skipped.
 */
function hook_pwa_serviceworker_script_alter(array &$scripts) {
  $scripts['mymodule'] = backdrop_get_path('module', 'mymodule') . '/js/serviceworker.js';
}

/**
 * @} End of "addtogroup hooks".
 */
