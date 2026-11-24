<?php
/**
 * @file
 * Page callbacks for the PWA module.
 */

/**
 * Page callback: the page shown when there is no connection.
 *
 * The service worker caches this page anonymously and shows it in place of
 * any page it can't fetch or find in its cache.
 */
function pwa_offline_page() {
  backdrop_set_title(t('You are offline'));
  return [
    '#markup' => '<p data-backdrop-pwa-offline>' . t('This page is not available offline. It will load again when you are back online.') . '</p>',
  ];
}

/**
 * Page callback: tells the service worker that it may stay installed.
 *
 * @return array
 *   A small array, delivered as JSON.
 */
function pwa_module_active() {
  return ['pwa' => 'ok'];
}
