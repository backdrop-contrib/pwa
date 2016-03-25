<?php


function pwa_deliver_js_file($page_callback_result) {
  drupal_add_http_header('Content-Type', 'application/javascript');
  print $page_callback_result;
}

function pwa_serviceworker_file_data() {
  $serviceworker = variable_get('pwa_filecache_serviceworker_data');
  return $serviceworker;
}

function pwa_offline_page() {
  return '<h1>You are offline.</h1>';
}
