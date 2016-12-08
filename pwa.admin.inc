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

  /**
   * manifest.json configuration.
   */
  $form['manifest'] = [
    '#type' => 'fieldset',
    '#title' => t('Manifest'),
    '#description' => t('The manifest file allows the website to be added to home screen as an app. <a href="@url" target="_blank" rel="noopener">See the W3C example</a>.', array('@url' => 'https://www.w3.org/TR/appmanifest/#example-manifest')),
  ];
  $form['manifest']['pwa_short_name'] = [
    '#type' => 'textfield',
    '#title' => t('Short name'),
    '#description' => t('Name of the shortcut created on the device. Should be like an app name (one short word or an acronym).'),
    '#size' => 10,
    '#default_value' => variable_get('pwa_short_name', variable_get('site_name')),
    '#required' => TRUE,
  ];
  $form['manifest']['pwa_name'] = [
    '#type' => 'textfield',
    '#title' => t('Name'),
    '#description' => t('Usually appears as the name on the splash screen during launch.'),
    '#size' => 30,
    '#default_value' => variable_get('pwa_name', variable_get('site_name')),
    '#required' => TRUE,
  ];
  $form['manifest']['pwa_description'] = [
    '#type' => 'textfield',
    '#title' => t('Description'),
    '#description' => t('A short description of the Progressive Web App. Answer the question "Why do I need this app?"'),
    '#default_value' => variable_get('pwa_description', ''),
  ];
  $form['manifest']['pwa_background_color'] = [
    '#type' => 'textfield',
    '#title' => t('Background color'),
    '#description' => t('Color of the browser UI when launching from home screen.'),
    '#size' => 8,
    '#default_value' => variable_get('pwa_background_color', '#ffffff'),
  ];
  $form['manifest']['pwa_theme_color'] = [
    '#type' => 'textfield',
    '#title' => t('Theme color'),
    '#description' => t('Color of the background splash page when launching from home screen.'),
    '#size' => 8,
    '#default_value' => variable_get('pwa_theme_color', '#ffffff'),
  ];
  if (module_exists('color')) {
    $form['manifest']['pwa_background_color']['#value_callback'] = 'color_palette_color_value';
    $form['manifest']['pwa_theme_color']['#value_callback'] = 'color_palette_color_value';
  }
  $form['manifest']['pwa_start_url'] = [
    '#type' => 'textfield',
    '#title' => t('Start URL'),
    '#description' => t('Home page when launched from home screen. You can append a query string for analytics. For example <code>/home?startfrom=manifest</code>.'),
    '#default_value' => variable_get('pwa_start_url', '/' . variable_get('site_frontpage', '')),
  ];
  $form['manifest']['pwa_orientation'] = [
    '#type' => 'select',
    '#title' => t('Orientation'),
    '#options' => [
      'portrait' => t('Portrait'),
      'landscape' => t('Landscape'),
    ],
    '#default_value' => variable_get('pwa_orientation', 'portrait'),
  ];
  $form['manifest']['pwa_display'] = [
    '#type' => 'select',
    '#title' => t('Display'),
    '#options' => [
      'fullscreen' => t('Full screen'),
      'standalone' => t('Standalone (as an app)'),
      'minimal-ui' => t('Minimal UI'),
      'browser'    => t('Browser'),
    ],
    '#default_value' => variable_get('pwa_display', 'standalone'),
  ];

  $form['manifest']['pwa_icons'] = [
    // '#type' => 'textfield',
    '#title' => t('Icons'),
    '#description' => t('For now, you must use <code>hook_pwa_manifest_alter()</code> to configure icons.'),
    '#default_value' => variable_get('pwa_icons', ''),
  ];

  /**
   * Service Worker configuration.
   */
  $form['sw'] = [
    '#type' => 'fieldset',
    '#title' => t('Service Worker'),
    '#description' => t('Configure behavior of the Service Worker.'),
  ];
  $form['sw']['pwa_swcache_exclude'] = [
    '#type' => 'textarea',
    '#title' => t('Exclude URLs patterns'),
    '#description' => t('Paths matching these patterns will not be cached by the Service Worker. One JavaScript regex per line.'),
    '#default_value' => variable_get('pwa_swcache_exclude', implode("\n", ['admin/.*'])),
  ];
  $form['sw']['pwa_swcache_urls'] = [
    '#type' => 'textarea',
    '#title' => t('URLs to cache on install'),
    '#description' => t('Cache these URLs when the Service Worker is installed. If a URL is a page all its CSS and JS will be cached automatically.'),
    '#default_value' => variable_get('pwa_swcache_urls', implode("\n", ['/', '/offline', variable_get('pwa_start_url', '')])),
  ];
  $form['sw']['pwa_swcache_version'] = [
    '#type' => 'textfield',
    '#title' => t('Cache version'),
    '#description' => t('Changing this number will invalidate all Service Worker caches. Use it when assets have significantly changed or if you want to force a cache refresh for all clients.'),
    '#size' => 2,
    '#default_value' => variable_get('pwa_swcache_version', 1),
  ];

  $form = system_settings_form($form);

  // Wait for all the values to be saved before refreshing cache.
  $form['#submit'][] = 'pwa_admin_configuration_submit';

  return $form;
}

/**
 * Helper function to reset Service Worker once form is submitted.
 */
function pwa_admin_configuration_submit($form, &$form_state) {
  pwa_flush_caches();
}
