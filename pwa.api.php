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
 * Manually configure manifest.json
 *
 * This hook allows manual configuration of the manifest.json file. Some of the
 * options can be configured in the admin settings of the module, but it can all
 * be altered within the hook.
 *
 * After you make your modifications you do NOT need to return the results.
 * Since $manifest is passed by reference, any changes made to $manifest are
 * automatically registered.
 *
 * @return
 *   An array of options that are used to build manifest.json
 */
function hook_pwa_manifest_alter(&$manifest) {
  // Change a string-based property.
  $manifest['name'] = variable_get('pwa_name', variable_get('site_name'));

  // Change an array-based property. In this case we're manually specifying
  // which icons will appear in the manifest.
  $manifest['icons'] = array(
    [
      'src' => url($path . '/assets/customized-1.png'),
      'sizes' => '144x144',
      'type' => 'image/png',
    ],
    [
      'src' => url($path . '/assets/customized.svg'),
      'type' => 'image/svg+xml',
    ],
  );
}

/**
 * @} End of "addtogroup hooks".
 */
