/**
 * @typedef {Object} PluginInfo
 * @property {string} id - Unique ID (UUID or similar)
 * @property {string} name - Friendly plugin name
 * @property {string} url - URL to load plugin from
 * @property {string} [description] - Optional plugin description
 * @property {boolean} loaded - Is the plugin loaded
 * @property {boolean} loadOnStartup - Should it load on app startup
 * @property {'ES' | 'script' | 'eval' | string} loadMethod - How plugin is loaded
 * @property {Object} [metadata] - Additional plugin metadata
 */
