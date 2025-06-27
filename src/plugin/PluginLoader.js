export default class PluginLoader {
  constructor({ registryManager, baseClasses }) {
    this.registryManager = registryManager;
    this.baseClasses = baseClasses;
  }

  async loadPluginFromUrl(url, timeoutMs = 15000) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      // Fetch the plugin source as text
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const codeStr = await response.text();


      // Evaluate the bundle code globally
      // eslint-disable-next-line no-eval
      (0, eval)(codeStr); // indirect eval to run in global scope

      // Expect the plugin bundle to expose the registration function globally
      if (typeof window.PluginRegister !== 'function') {
        throw new Error('Plugin bundle did not expose a global registration function "PluginRegister"');
      }

      const figureRegistry = this.registryManager.get('figures');
      const beforeNames = figureRegistry.getNames();

      // Call the registration function with your registry and baseClasses
      await window.PluginRegister({
        registry: figureRegistry,
        baseClasses: this.baseClasses,
      });

      const afterNames = figureRegistry.getNames();
      const newNames = afterNames.filter(name => !beforeNames.includes(name));

      console.log('Figures Registered From Plugin:', newNames);
      console.debug(`Successfully loaded plugin from ${url}`);

      // Clean up global pollution if you want
      delete window.PluginRegister;

      return { newNames };
    } catch (err) {
      console.error(`Failed to load plugin from ${url}:`, err);
      throw err;
    }
  }

  async loadPluginsFromUrls(urls = [], timeoutMs = 15000) {
    const results = [];
    for (const url of urls) {
      try {
        const result = await this.loadPluginFromUrl(url, timeoutMs);
        results.push({ url, success: true, ...result });
      } catch (error) {
        results.push({ url, success: false, error: error.message });
      }
    }
    return results;
  }

  addPluginUrl(url, currentPluginUrls = []) {
    const urlsSet = new Set(currentPluginUrls);
    urlsSet.add(url);
    return [...urlsSet];
  }
}
