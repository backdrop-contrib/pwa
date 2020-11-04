<?php
/**
 * @file
 * PWA administration forms.
 */

/**
 * Configure PWA settings for manifest.json
 */
function pwa_admin_configuration_manifest() {
  $config = config('pwa.settings');
  $form = [];
  $form['#config'] = 'pwa.settings';

  $form['manifest'] = [
    '#type' => 'fieldset',
    '#title' => 'manifest.json',
    '#description' => t('The manifest file allows the website to be added to home screen as an app. <a href="@url" target="_blank" rel="noopener">See the W3C example</a>.', array('@url' => 'https://www.w3.org/TR/appmanifest/#example-manifests'))
  ];

  $form['manifest']['pwa_short_name'] = [
    '#type' => 'textfield',
    '#title' => t('Short name'),
    '#description' => t('Name of the shortcut created on the device. Should be like an app name (one short word or an acronym).'),
    '#size' => 10,
    '#default_value' => $config->get('pwa_short_name'),
    '#required' => TRUE,
  ];

  $form['manifest']['pwa_name'] = [
    '#type' => 'textfield',
    '#title' => t('Name'),
    '#description' => t('Usually appears as the name on the splash screen during launch.'),
    '#size' => 30,
    '#default_value' => $config->get('pwa_name'),
    '#required' => TRUE,
  ];

  $form['manifest']['pwa_description'] = [
    '#type' => 'textfield',
    '#title' => t('Description'),
    '#description' => t('A short description of the Progressive Web App. Answer the question "Why do I need this app?"'),
    '#default_value' => $config->get('pwa_description'),
  ];

  $form['manifest']['pwa_background_color'] = [
    '#type' => 'textfield',
    '#title' => t('Background color'),
    '#description' => t('Color of the browser UI when launching from home screen.'),
    '#size' => 8,
    '#default_value' => $config->get('pwa_background_color'),
  ];

  $form['manifest']['pwa_theme_color'] = [
    '#type' => 'textfield',
    '#title' => t('Theme color'),
    '#description' => t('Color of the background splash page when launching from home screen.'),
    '#size' => 8,
    '#default_value' => $config->get('pwa_theme_color'),
  ];

  if (module_exists('color')) {
    $form['manifest']['pwa_background_color']['#value_callback'] = 'color_palette_color_value';
    $form['manifest']['pwa_theme_color']['#value_callback'] = 'color_palette_color_value';
  }

  $form['manifest']['pwa_start_url'] = [
    '#type' => 'textfield',
    '#title' => t('Start URL'),
    '#description' => t('Home page when launched from home screen. You can append a query string for analytics. For example <code>/home?startfrom=manifest</code>.'),
    '#default_value' => $config->get('pwa_start_url'),
  ];

  $form['manifest']['pwa_orientation'] = [
    '#type' => 'select',
    '#title' => t('Orientation'),
    '#options' => [
      'portrait' => t('Portrait'),
      'landscape' => t('Landscape'),
    ],
    '#default_value' => $config->get('pwa_orientation'),
  ];

  $form['manifest']['pwa_display'] = [
    '#type' => 'select',
    '#title' => t('Display'),
    '#options' => [
      'fullscreen' => t('Full screen'),
      'standalone' => t('Standalone'),
      'minimal-ui' => t('Minimal UI'),
      'browser' => t('Browser'),
    ],
    '#description' => t('Determines whether the PWA will behave like a web page or a native app. <a href="@mdn-display" target="_blank" rel="noopener">Read more at MDN</a>.', ['@mdn-display' => 'https://developer.mozilla.org/en-US/docs/Web/Manifest#display']),
    '#default_value' => $config->get('pwa_display'),
  ];

  $form['manifest']['pwa_icons'] = [
    '#type' => 'item',
    '#title' => t('Branding icons'),
    '#description' => t('Use <code>hook_pwa_manifest_alter()</code> to configure custom icons. <a href="@manifest-example" target="_blank" rel="noopener">See official example</a>.', ['@manifest-example' => 'https://github.com/backdrop-contrib/pwa/blob/1.x-1.x/pwa.api.php#L13-L53']),
    '#default_value' => $config->get('pwa_icons'),
  ];

  $form = system_settings_form($form);

  // Wait for all the values to be saved before refreshing cache.
  $form['#submit'][] = 'pwa_admin_configuration_submit';

  return $form;
}

/**
 * Configure PWA settings for Service Worker.
 */
function pwa_admin_configuration_sw() {
  $config = config('pwa.settings');
  $form = [];
  $form['#config'] = 'pwa.settings';

  $form['sw'] = [
    '#type' => 'fieldset',
    '#title' => t('Service Worker'),
    '#description' => t('Configure behavior of the Service Worker. These are advanced settings that don\'t need to be changed unless you know what you\'re doing.'),
  ];

  $form['sw']['pwa_sw_registration_event'] = [
    '#type' => 'select',
    '#title' => t('When should the Service Worker be registered?'),
    '#options' => [
      'immediate' => t('as soon as possible'),
      'documentready' => t('when DOM is ready'),
      'windowonload' => t('after CSS, JS and images have loaded'),
    ],
    '#description' => t('Registering during page load can have adverse effects on performance. The default is to wait until CSS, JS, and images have finished loading.'),
    '#default_value' => $config->get('pwa_sw_registration_event'),
  ];

  $form['sw']['pwa_sw_cache_exclude'] = [
    '#type' => 'textarea',
    '#title' => t('Exclude URLs patterns'),
    '#description' => t('Paths matching these patterns will not be cached by the Service Worker. One JavaScript regex per line.'),
    '#default_value' => $config->get('pwa_sw_cache_exclude'),
  ];

  $form['sw']['pwa_sw_cache_urls'] = [
    '#type' => 'textarea',
    '#title' => t('URLs to cache on install'),
    '#description' => t('Cache these URLs when the Service Worker is installed. If a URL is a page all its CSS and JS will be cached automatically.'),
    '#default_value' => $config->get('pwa_sw_cache_urls'),
  ];

  $form['sw']['pwa_sw_cache_version'] = [
    '#type' => 'textfield',
    '#title' => t('Cache version'),
    '#description' => t('Changing this number will invalidate all Service Worker caches. Use it when assets have significantly changed or if you want to force a cache refresh for all clients.'),
    '#size' => 5,
    '#default_value' => $config->get('pwa_sw_cache_version'),
  ];

  $form = system_settings_form($form);

  // Wait for all the values to be saved before refreshing cache.
  $form['#submit'][] = 'pwa_admin_configuration_submit';

  return $form;
}

/**
 * Helper function to refresh Service Worker once admin settings are saved.
 */
function pwa_admin_configuration_submit($form, &$form_state) {
  pwa_flush_caches();
}
