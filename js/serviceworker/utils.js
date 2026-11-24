/**
 * @file
 * Logging for the service worker. Only errors are shown unless debug
 * messages are turned on in the PWA settings.
 */

const pwaConsole = {};

(({debug}, pwaConsole, console) => {
  const css = [
    'background: #0074bd',
    'border-radius: 0.5em',
    'color: white',
    'font-weight: bold',
    'padding: 2px 0.5em',
  ].join(';');

  ['log', 'info', 'debug', 'warn', 'error'].forEach(type => {
    pwaConsole[type] = (...params) => {
      if (debug || type === 'error') {
        console[type]('%cPWA', css, ...params);
      }
    };
  });
})(pwaSettings, pwaConsole, console);
