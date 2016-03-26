<?php
/**
 * @file
 * PWA administration forms.
 */

/**
 * Configure all PWA settings.
 */
function pwa_admin_configuration() {
  $form = [];

  $form['manifest'] = [
    '#type' => 'fieldset',
    '#title' => t('Manifest'),
    '#description' => t("Change values of the manifest file used to add the website as an app."),
  ];
  $form['manifest']['pwa_name'] = [
    '#type' => 'textfield',
    '#title' => t('Title'),
    '#desctiption' => t(" "),
    '#default_value' => variable_get('pwa_name', variable_get('site_name')),
    '#required' => TRUE,
  ];
  $form['manifest']['pwa_short_name'] = [
    '#type' => 'textfield',
    '#title' => t('Short name'),
    '#desctiption' => t(" "),
    '#default_value' => variable_get('pwa_short_name', variable_get('site_name')),
  ];
  $form['manifest']['pwa_background_color'] = [
    '#type' => 'textfield',
    '#title' => t('Background color'),
    '#desctiption' => t(" "),
    '#size' => 4,
    '#default_value' => variable_get('pwa_background_color', '#ffffff'),
  ];
  $form['manifest']['pwa_theme_color'] = [
    '#type' => 'textfield',
    '#title' => t('Theme color'),
    '#desctiption' => t(" "),
    '#size' => 4,
    '#default_value' => variable_get('pwa_theme_color', '#ffffff'),
  ];
  $form['manifest']['pwa_start_url'] = [
    '#type' => 'textfield',
    '#title' => t('start_url'),
    '#desctiption' => t(" "),
    '#default_value' => variable_get('pwa_start_url', '/'),
  ];
  $form['manifest']['pwa_orientation'] = [
    '#type' => 'select',
    '#title' => t('orientation'),
    '#desctiption' => t(" "),
    '#options' => [
      'portrait' => t('Portrait'),
      'landscape' => t('Landscape'),
    ],
    '#default_value' => variable_get('pwa_orientation', 'portrait'),
  ];
  $form['manifest']['pwa_display'] = [
    '#type' => 'textfield',
    '#title' => t('Display'),
    '#desctiption' => t(" "),
    '#default_value' => variable_get('pwa_display', 'standalone'),
  ];
  /*
  $form['manifest']['pwa_icons'] = [
    '#type' => 'textfield',
    '#title' => t('icons'),
    '#desctiption' => t(" "),
    '#default_value' => variable_get('pwa_icons', ''),
  ];*/

  $form['sw'] = [
    '#type' => 'fieldset',
    '#title' => t('ServiceWorker'),
    '#description' => t("Configure behavior of the Service Worker."),
  ];
  $form['sw']['pwa_swcache_exclude'] = [
    '#type' => 'textarea',
    '#title' => t('Exclude URLs patterns'),
    '#description' => t("One javascript regex per line."),
    '#default_value' => variable_get('pwa_swcache_exclude', implode("\n", [
      '/serviceworker.js$',
      'admin/.*',
    ])),
  ];
  $form['sw']['pwa_swcache_urls'] = [
    '#type' => 'textarea',
    '#title' => t('Urls to cache on install'),
    '#description' => t("Cache those URLs when the service worker is installed."),
    '#default_value' => variable_get('pwa_swcache_urls', implode("\n", [
      '/',
      '/offline',
    ])),
  ];
  $form['sw']['pwa_swcache_version'] = [
    '#type' => 'textfield',
    '#title' => t('Cache version'),
    '#desctiption' => t("Changing this number will invalidate all ServiceWorker cache. Use when changing cache strategy."),
    '#size' => 1,
    '#default_value' => variable_get('pwa_swcache_version', 1),
  ];
  // @todo use plugins, and plugins config forms.
  $strategies = pwa_get_fetch_info();
  $options = [];
  foreach ($strategies as $name => $infos) {
    $options[$name] = $infos['label'];
  }
  $form['sw']['pwa_swcache_fetch_strategy'] = [
    '#type' => 'select',
    '#title' => t('Cache strategy'),
    '#options' => $options,
    '#desctiption' => t("As seen in @url.", ['@url' => l('The offline cookbook', 'https://jakearchibald.com/2014/offline-cookbook/')]),
    '#default_value' => variable_get('pwa_swcache_fetch_strategy', 'drupal'),
  ];

  $form = system_settings_form($form);
  // Wait for all the values to be saved before refreshing cache.
  $form['#submit'][] = 'pwa_admin_configuration_submit';

  return $form;
}

function pwa_admin_configuration_submit($form, &$form_state) {
  pwa_flush_caches();
}
