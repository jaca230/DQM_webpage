// Deployment-time configuration. scripts/midas/configure_custom_page.sh
// replaces this file in build/ without modifying the source tree.
window.DQM_CONFIG = Object.assign({
  gatewayBaseUrl: '',
  midasEmbedded: false,
  midasPageName: 'DQM',
}, window.DQM_CONFIG || {});
