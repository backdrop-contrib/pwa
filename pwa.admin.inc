<?php
/**
 * @file
 * Admin forms for the PWA module.
 */

/**
 * Form constructor: manifest settings.
 */
function pwa_admin_configuration_manifest($form, &$form_state) {
  $config = config('pwa.settings');
  $form['#config'] = 'pwa.settings';

  $form['intro'] = [
    '#markup' => '<p>' . t('The manifest lets visitors add the site to their home screen as an app. <a href="@url" target="_blank" rel="noopener">Read about web app manifests</a>.', ['@url' => 'https://developer.mozilla.org/en-US/docs/Web/Manifest']) . '</p>',
  ];

  $form['pwa_short_name'] = [
    '#type' => 'textfield',
    '#title' => t('Short name'),
    '#description' => t('Shown under the icon on the home screen. Keep it short: one word or an acronym. Leave empty to use the site name.'),
    '#size' => 20,
    '#maxlength' => 45,
    '#default_value' => $config->get('pwa_short_name'),
  ];

  $form['pwa_name'] = [
    '#type' => 'textfield',
    '#title' => t('Name'),
    '#description' => t('Usually shown on the splash screen while the app starts. Leave empty to use the site name.'),
    '#size' => 40,
    '#maxlength' => 128,
    '#default_value' => $config->get('pwa_name'),
  ];

  $form['pwa_description'] = [
    '#type' => 'textfield',
    '#title' => t('Description'),
    '#description' => t('A short description of the app: why would someone want it?'),
    '#maxlength' => 255,
    '#default_value' => $config->get('pwa_description'),
  ];

  $form['pwa_background_color'] = [
    '#type' => 'color',
    '#title' => t('Background colour'),
    '#description' => t('Background of the splash screen while the app starts.'),
    '#default_value' => $config->get('pwa_background_color'),
  ];

  $form['pwa_theme_color'] = [
    '#type' => 'color',
    '#title' => t('Theme colour'),
    '#description' => t('Colour of the browser or device toolbar around the app.'),
    '#default_value' => $config->get('pwa_theme_color'),
  ];

  $form['pwa_start_url'] = [
    '#type' => 'textfield',
    '#title' => t('Start page'),
    '#description' => t('The page the app opens on, as a path on this site. You can add a query string for analytics, for example <code>/?source=pwa</code>.'),
    '#default_value' => $config->get('pwa_start_url'),
    '#required' => TRUE,
  ];

  $form['pwa_orientation'] = [
    '#type' => 'select',
    '#title' => t('Orientation'),
    '#options' => [
      'any' => t('Any'),
      'natural' => t('Natural (the device default)'),
      'portrait' => t('Portrait'),
      'landscape' => t('Landscape'),
    ],
    '#default_value' => $config->get('pwa_orientation'),
  ];

  $form['pwa_display'] = [
    '#type' => 'select',
    '#title' => t('Display'),
    '#options' => [
      'fullscreen' => t('Full screen'),
      'standalone' => t('Standalone'),
      'minimal-ui' => t('Minimal UI'),
      'browser' => t('Browser'),
    ],
    '#description' => t('Whether the app looks like a web page or a native app. <a href="@url" target="_blank" rel="noopener">Read more at MDN</a>.', ['@url' => 'https://developer.mozilla.org/en-US/docs/Web/Manifest/display']),
    '#default_value' => $config->get('pwa_display'),
  ];

  $rows = [];
  foreach (_pwa_manifest_file()['icons'] as $icon) {
    $rows[] = [
      check_plain(isset($icon['sizes']) ? $icon['sizes'] : ''),
      check_plain(isset($icon['type']) ? $icon['type'] : ''),
      check_plain(isset($icon['purpose']) ? $icon['purpose'] : ''),
      theme('image', [
        'uri' => $icon['src'],
        'width' => 48,
        'height' => 48,
        'alt' => '',
      ]),
    ];
  }
  $form['icons'] = [
    '#type' => 'fieldset',
    '#title' => t('Icons'),
    '#description' => t('Set your own icons with <code>hook_pwa_manifest_alter()</code>; see <code>pwa.api.php</code>. A 192x192 and a 512x512 icon are needed for the app to be installable.'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
  ];
  $form['icons']['table'] = [
    '#theme' => 'table',
    '#header' => [t('Size'), t('Type'), t('Purpose'), t('Icon')],
    '#rows' => $rows,
  ];

  $form = system_settings_form($form);
  $form['#submit'][] = 'pwa_admin_clear_cache';
  return $form;
}

/**
 * Form validation handler for pwa_admin_configuration_manifest().
 */
function pwa_admin_configuration_manifest_validate($form, &$form_state) {
  foreach (['pwa_background_color', 'pwa_theme_color'] as $key) {
    if (!preg_match('/^#[0-9a-fA-F]{6}$/', $form_state['values'][$key])) {
      form_set_error($key, t('Enter a colour as #rrggbb.'));
    }
  }
  if (!_pwa_is_site_path($form_state['values']['pwa_start_url'])) {
    form_set_error('pwa_start_url', t('The start page must be a path on this site, starting with a slash.'));
  }
}

/**
 * Form constructor: service worker settings.
 */
function pwa_admin_configuration_sw($form, &$form_state) {
  $config = config('pwa.settings');
  $form['#config'] = 'pwa.settings';

  $form['pwa_sw_cache_version'] = [
    '#type' => 'number',
    '#title' => t('Cache version'),
    '#description' => t('Changing this number makes every visitor fetch a new service worker and empties their caches. Use it after big changes to the theme or assets.'),
    '#min' => 1,
    '#step' => 1,
    '#default_value' => $config->get('pwa_sw_cache_version'),
    '#required' => TRUE,
  ];

  $form['pwa_sw_phonehome'] = [
    '#type' => 'checkbox',
    '#title' => t('Remove the service worker when it is no longer wanted'),
    '#description' => t('The service worker checks the site every 10 page loads or after 10 minutes idle. If the module has been disabled, or the visitor no longer has permission to use the app, it removes itself and its caches. Without this a removed service worker can keep running for up to a day.'),
    '#default_value' => $config->get('pwa_sw_phonehome'),
  ];

  $form['pwa_sw_debug'] = [
    '#type' => 'checkbox',
    '#title' => t('Show debug messages'),
    '#description' => t('Log what the service worker does in the browser console.'),
    '#default_value' => $config->get('pwa_sw_debug'),
  ];

  $form = system_settings_form($form);
  array_unshift($form['#submit'], 'pwa_admin_configuration_sw_submit');
  $form['#submit'][] = 'pwa_admin_clear_cache';
  return $form;
}

/**
 * Form submission handler: store numbers and booleans with their types.
 */
function pwa_admin_configuration_sw_submit($form, &$form_state) {
  $values = &$form_state['values'];
  $values['pwa_sw_cache_version'] = (int) $values['pwa_sw_cache_version'];
  $values['pwa_sw_phonehome'] = (bool) $values['pwa_sw_phonehome'];
  $values['pwa_sw_debug'] = (bool) $values['pwa_sw_debug'];
}

/**
 * Form constructor: caching rules.
 */
function pwa_admin_configuration_sw_patterns($form, &$form_state) {
  $config = config('pwa.settings');
  $form['#config'] = 'pwa.settings';

  $form['intro'] = [
    '#markup' => '<p>' . t('Pages and files for logged-in users, and for anonymous visitors with a session (a cart, a form message), are never cached, whatever is set here.') . '</p>',
  ];

  $form['pwa_sw_cache_exclude'] = [
    '#type' => 'textarea',
    '#title' => t('Never cache'),
    '#description' => t('Paths matching any of these are never cached. One JavaScript regular expression per line, matched against the path within the site, for example <code>^/admin/.*</code>.'),
    '#default_value' => $config->get('pwa_sw_cache_exclude'),
  ];

  $form['pwa_sw_asset_config'] = [
    '#type' => 'fieldset',
    '#title' => t('Files'),
    '#description' => t('How each type of file is cached. "Cache third party" also caches files from other sites, such as a CDN. The size limit needs the server to send a Content-Length header; files without one are not cached when it is on.'),
    '#tree' => TRUE,
  ];
  $labels = [
    'image' => t('Images'),
    'script' => t('Scripts'),
    'style' => t('Stylesheets'),
    'font' => t('Fonts'),
  ];
  foreach ((array) $config->get('pwa_sw_asset_config') as $type => $settings) {
    if (!isset($labels[$type])) {
      continue;
    }
    $form['pwa_sw_asset_config'][$type] = [
      '#type' => 'fieldset',
      '#title' => $labels[$type],
      '#attributes' => ['class' => ['container-inline']],
    ];
    $form['pwa_sw_asset_config'][$type]['strategy'] = [
      '#type' => 'select',
      '#title' => t('Strategy'),
      '#options' => _pwa_strategy_options() + ['DoNotCache' => t('Do not cache')],
      '#default_value' => $settings['strategy'],
    ];
    $form['pwa_sw_asset_config'][$type]['external'] = [
      '#type' => 'checkbox',
      '#title' => t('Cache third party'),
      '#default_value' => $settings['external'],
    ];
    $form['pwa_sw_asset_config'][$type]['limitMaxSize'] = [
      '#type' => 'checkbox',
      '#title' => t('Limit size'),
      '#default_value' => $settings['limitMaxSize'],
    ];
    $form['pwa_sw_asset_config'][$type]['maxSize'] = [
      '#type' => 'number',
      '#title' => t('Maximum size'),
      '#min' => 1,
      '#step' => 1,
      '#field_suffix' => 'kB',
      '#default_value' => $settings['maxSize'],
    ];
  }

  $form['pwa_sw_patterns_page'] = [
    '#type' => 'textarea',
    '#title' => t('Strategy for particular pages'),
    '#description' => t('Pages use "network first" unless they match a line here. One per line as <code>Strategy|regular expression</code>, for example <code>StaleWhileRevalidate|^/blog/.*</code>. Strategies: @list.', [
      '@list' => implode(', ', array_keys(_pwa_strategy_options())),
    ]),
    '#default_value' => $config->get('pwa_sw_patterns_page'),
  ];

  $form = system_settings_form($form);
  array_unshift($form['#submit'], 'pwa_admin_configuration_sw_patterns_submit');
  $form['#submit'][] = 'pwa_admin_clear_cache';
  return $form;
}

/**
 * Form validation handler for pwa_admin_configuration_sw_patterns().
 */
function pwa_admin_configuration_sw_patterns_validate($form, &$form_state) {
  $values = $form_state['values'];

  foreach (_pwa_lines($values['pwa_sw_cache_exclude']) as $pattern) {
    if (!_pwa_is_valid_regex($pattern)) {
      form_set_error('pwa_sw_cache_exclude', t('%pattern is not a valid regular expression.', ['%pattern' => $pattern]));
    }
  }

  foreach (_pwa_lines($values['pwa_sw_patterns_page']) as $line) {
    $parts = array_map('trim', explode('|', $line, 2));
    if (count($parts) !== 2 || !in_array($parts[0], PWA_SW_STRATEGIES, TRUE) || !_pwa_is_valid_regex($parts[1])) {
      form_set_error('pwa_sw_patterns_page', t('%line must be a strategy and a valid regular expression, separated by |.', ['%line' => $line]));
    }
  }
}

/**
 * Form submission handler: store the file settings with their types.
 */
function pwa_admin_configuration_sw_patterns_submit($form, &$form_state) {
  foreach ($form_state['values']['pwa_sw_asset_config'] as $type => $settings) {
    $form_state['values']['pwa_sw_asset_config'][$type] = [
      'strategy' => (string) $settings['strategy'],
      'limitMaxSize' => (bool) $settings['limitMaxSize'],
      'maxSize' => max(1, (int) $settings['maxSize']),
      'external' => (bool) $settings['external'],
    ];
  }
}

/**
 * Form constructor: precaching.
 */
function pwa_admin_configuration_sw_precache($form, &$form_state) {
  $config = config('pwa.settings');
  $form['#config'] = 'pwa.settings';

  $form['intro'] = [
    '#markup' => '<p>' . t('Precached pages and files are downloaded when the service worker installs, so they are available offline even if the visitor never opened them. They are fetched as an anonymous visitor. The start page and the offline page are always precached. Keep these lists short: every visitor downloads them.') . '</p>',
  ];

  $form['pwa_sw_precache_page'] = [
    '#type' => 'textarea',
    '#title' => t('Pages'),
    '#description' => t('One path per line, for example <code>/about</code>.'),
    '#default_value' => $config->get('pwa_sw_precache_page'),
  ];

  $form['pwa_sw_precache_asset'] = [
    '#type' => 'textarea',
    '#title' => t('Files'),
    '#description' => t('One path per line, for example <code>/themes/mytheme/logo.png</code>. Files that rarely change: logos, fonts, icons.'),
    '#default_value' => $config->get('pwa_sw_precache_asset'),
  ];

  $form = system_settings_form($form);
  $form['#submit'][] = 'pwa_admin_clear_cache';
  return $form;
}

/**
 * Form validation handler for pwa_admin_configuration_sw_precache().
 */
function pwa_admin_configuration_sw_precache_validate($form, &$form_state) {
  foreach (['pwa_sw_precache_page', 'pwa_sw_precache_asset'] as $key) {
    foreach (_pwa_lines($form_state['values'][$key]) as $path) {
      if (!_pwa_is_site_path($path)) {
        form_set_error($key, t('%path must be a path on this site, starting with a slash.', ['%path' => $path]));
      }
    }
  }
}

/**
 * Form submission handler: rebuild the manifest and service worker.
 */
function pwa_admin_clear_cache($form, &$form_state) {
  cache_clear_all('pwa:', 'cache', TRUE);
}

/**
 * The caching strategies, for select lists.
 *
 * @return array
 *   Labels keyed by strategy name.
 */
function _pwa_strategy_options() {
  return [
    'NetworkFirst' => t('Network first'),
    'StaleWhileRevalidate' => t('Stale while revalidate'),
    'CacheFirst' => t('Cache first'),
    'NetworkOnly' => t('Network only'),
    'CacheOnly' => t('Cache only'),
  ];
}

/**
 * Split text into trimmed, non-empty lines.
 *
 * @param string $text
 *   The text.
 *
 * @return string[]
 *   The lines.
 */
function _pwa_lines($text) {
  $lines = array_map('trim', preg_split("/\r\n|\n|\r/", (string) $text));
  return array_values(array_filter($lines, 'strlen'));
}

/**
 * Whether a value is a path on this site: starts with one slash, no scheme.
 *
 * @param string $path
 *   The value to check.
 *
 * @return bool
 *   TRUE for a site path.
 */
function _pwa_is_site_path($path) {
  return is_string($path)
    && strpos($path, '/') === 0
    && strpos($path, '//') !== 0
    && strpos($path, '\\') === FALSE
    && !preg_match('/[\s<>"]/', $path);
}

/**
 * Whether a JavaScript regular expression is also valid in PCRE.
 *
 * Close enough to catch typos; the service worker also skips patterns it
 * can't compile.
 *
 * @param string $pattern
 *   The pattern, without delimiters.
 *
 * @return bool
 *   TRUE if it compiles.
 */
function _pwa_is_valid_regex($pattern) {
  return @preg_match('/' . str_replace('/', '\/', $pattern) . '/', '') !== FALSE;
}
