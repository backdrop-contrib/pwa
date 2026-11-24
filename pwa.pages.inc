<?php
/**
 * @file
 * Page and delivery callbacks for the PWA module.
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

/**
 * Send a JSON status in place of a page for access denied and similar.
 *
 * The service worker removes itself on a 403 or 404 from its check URL, so
 * those must be real status codes, not themed pages.
 *
 * @param mixed $page_callback_result
 *   The page callback result.
 *
 * @return bool
 *   TRUE if the result is content that should be delivered.
 */
function _pwa_check_page_callback_result($page_callback_result) {
  if (!is_int($page_callback_result)) {
    return TRUE;
  }
  $statuses = [
    MENU_ACCESS_DENIED => ['403 Forbidden', 'access denied'],
    MENU_NOT_FOUND => ['404 Not Found', 'not found'],
    // A temporary error: the service worker is not removed.
    MENU_SITE_OFFLINE => ['503 Service unavailable', 'site under maintenance'],
  ];
  if (isset($statuses[$page_callback_result])) {
    list($status, $message) = $statuses[$page_callback_result];
    backdrop_add_http_header('Status', $status);
    backdrop_add_http_header('Content-Type', 'application/json');
    print backdrop_json_encode(['pwa' => $message]);
  }
  return FALSE;
}

/**
 * Delivery callback: JSON, without the theme layer.
 */
function pwa_deliver_json($page_callback_result) {
  if (_pwa_check_page_callback_result($page_callback_result)) {
    backdrop_add_http_header('Content-Type', 'application/json');
    backdrop_add_http_header('Cache-Control', 'no-store');
    print backdrop_json_encode($page_callback_result);
  }
  backdrop_page_footer();
}

/**
 * Delivery callback: the service worker script.
 *
 * Adds a Service-Worker-Allowed header so that a script served from
 * 'pwa/serviceworker/js' can control the whole site.
 */
function pwa_deliver_serviceworker_file($page_callback_result) {
  if (_pwa_check_page_callback_result($page_callback_result)) {
    backdrop_add_http_header('Content-Type', 'application/javascript; charset=utf-8');
    backdrop_add_http_header('Service-Worker-Allowed', base_path());
    // Browsers check for a new service worker on navigation; let them always
    // get the current one.
    backdrop_add_http_header('Cache-Control', 'no-cache');
    print $page_callback_result;
  }
  backdrop_page_footer();
}

/**
 * Delivery callback: the web app manifest.
 */
function pwa_deliver_manifest_file($page_callback_result) {
  if (_pwa_check_page_callback_result($page_callback_result)) {
    backdrop_add_http_header('Content-Type', 'application/manifest+json; charset=utf-8');
    backdrop_add_http_header('Cache-Control', 'public, max-age=86400');
    $flags = JSON_PRETTY_PRINT | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES;
    print json_encode($page_callback_result, $flags);
  }
  backdrop_page_footer();
}
