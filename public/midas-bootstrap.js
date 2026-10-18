(function bootstrapMidasPage() {
  const config = window.DQM_CONFIG || {};
  if (!config.midasEmbedded) {
    window.initializeDqmMidasPage = function initializeStandalonePage() {};
    return;
  }

  // mhttpd provides these resources. Synchronous loading keeps MIDAS styles
  // before the generated application CSS, so DQM component styles win.
  document.write('<link rel="stylesheet" href="/midas.css">');
  document.write('<link rel="stylesheet" href="/mhttpd.css">');
  document.write('<script src="/midas.js"></script>');
  document.write('<script src="/mhttpd.js"></script>');

  window.initializeDqmMidasPage = function initializeDqmMidasPage() {
    document.body.classList.add('midas-embedded');
    if (typeof window.mhttpd_init !== 'function') {
      console.error('MIDAS integration was requested, but mhttpd.js did not load');
      return;
    }
    window.mhttpd_init(config.midasPageName || 'DQM', 5000);
  };
}());
