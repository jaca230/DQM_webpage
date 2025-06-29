export default class PluginManagementService {
  constructor(pluginLoader, storageManager) {
    this.pluginLoader = pluginLoader;
    this.storageManager = storageManager;
    this.plugins = [];
    this.loading = false;
    this.listeners = new Set();

    this.loadingTimeoutMs = 0;
    this.loadingStartTime = 0;
    this.loadingTimeoutId = null;
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener =>
      listener({
        plugins: this.getPlugins(),
        loading: this.isLoading(),
        loadingRemainingMs: this.getLoadingRemainingMs(),
      })
    );
  }

  getPlugins() {
    return [...this.plugins];
  }

  isLoading() {
    return this.loading;
  }

  setLoading(loading, timeoutMs = 0) {
    this.loading = loading;
    if (loading) {
      this.loadingTimeoutMs = timeoutMs;
      this.loadingStartTime = Date.now();

      if (this.loadingTimeoutId) clearTimeout(this.loadingTimeoutId);
      if (timeoutMs > 0) {
        this.loadingTimeoutId = setTimeout(() => {
          this.loadingTimeoutId = null;
          this.setLoading(false);
        }, timeoutMs);
      }
    } else {
      this.loadingTimeoutMs = 0;
      this.loadingStartTime = 0;
      if (this.loadingTimeoutId) {
        clearTimeout(this.loadingTimeoutId);
        this.loadingTimeoutId = null;
      }
    }
    this.notifyListeners();
  }

  getLoadingRemainingMs() {
    if (!this.loading || !this.loadingTimeoutMs) return 0;
    const elapsed = Date.now() - this.loadingStartTime;
    const remaining = this.loadingTimeoutMs - elapsed;
    return remaining > 0 ? remaining : 0;
  }

  async initialize(defaultPlugins = []) {
    this.setLoading(true, 15000);
    try {
      const savedPlugins = this.storageManager.loadPlugins(defaultPlugins);
      const pluginsForStartup = savedPlugins.filter(p => p.loadOnStartup);
      this.plugins = [...savedPlugins];
      if (pluginsForStartup.length > 0) {
        await this.loadPluginsBatch(pluginsForStartup);
      }
    } catch (e) {
      console.error('Error initializing plugins:', e);
    }
    this.setLoading(false);
  }

  async loadPluginsBatch(pluginsToLoad) {
    if (!pluginsToLoad || pluginsToLoad.length === 0) return [];

    this.setLoading(true, 15000);
    try {
      const results = await this.pluginLoader.loadPlugins(pluginsToLoad);

      this.plugins = this.plugins.map(plugin => {
        const result = results.find(r => r.pluginInfo.id === plugin.id);
        if (result) {
          return {
            ...plugin,
            loaded: result.success,
            loadMethod: result.success ? result.method : plugin.loadMethod,
            newFigures: result.success ? result.newNames : [],
            lastError: result.success ? null : result.error,
          };
        }
        return plugin;
      });

      results.forEach(result => {
        if (result.success) {
          console.log(`Loaded plugin: ${result.pluginInfo.name} (${result.newNames.length} figures)`);
        } else {
          console.warn(`Failed to load plugin: ${result.pluginInfo.name} - ${result.error}`);
        }
      });

      this.notifyListeners();
      return results;
    } catch (e) {
      console.error('Error loading plugins batch:', e);
      this.plugins = this.plugins.map(plugin => ({
        ...plugin,
        loaded: pluginsToLoad.some(p => p.id === plugin.id) ? false : plugin.loaded,
        newFigures: [],
        lastError: pluginsToLoad.some(p => p.id === plugin.id) ? e.message : plugin.lastError,
      }));
      this.notifyListeners();
      throw e;
    } finally {
      this.setLoading(false);
    }
  }

  async addPlugin(pluginInfo, loadImmediately = true) {
    if (!pluginInfo || !pluginInfo.url) {
      throw new Error('Plugin info must include a URL');
    }

    const fullPluginInfo = {
      id: pluginInfo.id || `plugin-${Date.now()}`,
      name: pluginInfo.name || 'Unnamed Plugin',
      url: pluginInfo.url,
      description: pluginInfo.description || '',
      loaded: false,
      loadOnStartup: pluginInfo.loadOnStartup ?? true,
      loadMethod: pluginInfo.loadMethod || 'ES',
      metadata: pluginInfo.metadata || {},
      newFigures: [],
      lastError: null,
      ...pluginInfo,
    };

    if (this.plugins.find(p => p.url === fullPluginInfo.url)) {
      throw new Error('Plugin URL already exists');
    }

    if (loadImmediately) {
      this.setLoading(true, 15000);
      try {
        const result = await this.pluginLoader.loadPluginWithFallback(
          fullPluginInfo,
          15000,
          ['ES', 'eval', 'script']
        );

        const newPlugin = {
          ...fullPluginInfo,
          loaded: true,
          loadMethod: result.method,
          newFigures: result.newNames,
          lastError: null,
        };

        console.log(`Loaded plugin: ${newPlugin.name} via ${result.method} (${result.newNames.length} figures)`);

        this.plugins.push(newPlugin);
        this.storageManager.savePlugins(this.plugins);
        this.setLoading(false);
        return result;
      } catch (e) {
        console.error(`Failed to load plugin ${fullPluginInfo.name}:`, e);

        const failedPlugin = {
          ...fullPluginInfo,
          loaded: false,
          newFigures: [],
          lastError: e.message || String(e),
        };

        this.plugins.push(failedPlugin);
        this.storageManager.savePlugins(this.plugins);
        this.setLoading(false);
        throw e;
      }
    } else {
      this.plugins.push(fullPluginInfo);
      this.storageManager.savePlugins(this.plugins);
      this.notifyListeners();
      return true;
    }
  }

  removePlugin(pluginId) {
    if (!pluginId) return false;
    const initialLength = this.plugins.length;
    this.plugins = this.plugins.filter(p => p.id !== pluginId);
    if (this.plugins.length < initialLength) {
      this.storageManager.savePlugins(this.plugins);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  async loadPlugin(pluginId) {
    const plugin = this.plugins.find(p => p.id === pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }

    this.setLoading(true, 15000);
    try {
      const result = await this.pluginLoader.loadPluginWithFallback(
        plugin,
        15000,
        ['ES', 'eval', 'script']
      );

      console.log(`Manually loaded plugin: ${plugin.name} via ${result.method} (${result.newNames.length} figures)`);

      this.plugins = this.plugins.map(p =>
        p.id === pluginId
          ? {
              ...p,
              loaded: true,
              loadMethod: result.method,
              newFigures: result.newNames,
              lastError: null,
            }
          : p
      );

      this.storageManager.savePlugins(this.plugins);
      this.setLoading(false);
      return result;
    } catch (e) {
      console.error(`Failed to load plugin ${plugin.name}:`, e);

      this.plugins = this.plugins.map(p =>
        p.id === pluginId
          ? {
              ...p,
              loaded: false,
              newFigures: [],
              lastError: e.message || String(e),
            }
          : p
      );

      this.setLoading(false);
      throw e;
    }
  }

  async reloadStartupPlugins() {
    const pluginsForReload = this.plugins.filter(p => p.loadOnStartup);
    if (pluginsForReload.length === 0) return [];

    this.setLoading(true, 15000);
    try {
      const results = await this.loadPluginsBatch(pluginsForReload);
      this.storageManager.savePlugins(this.plugins);
      return results;
    } finally {
      this.setLoading(false);
    }
  }

  updatePlugin(pluginId, updates) {
    const pluginIndex = this.plugins.findIndex(p => p.id === pluginId);
    if (pluginIndex === -1) return false;

    this.plugins[pluginIndex] = {
      ...this.plugins[pluginIndex],
      ...updates,
    };

    this.storageManager.savePlugins(this.plugins);
    this.notifyListeners();
    return true;
  }

  getPlugin(pluginId) {
    return this.plugins.find(p => p.id === pluginId) || null;
  }

  getLoadedPlugins() {
    return this.plugins.filter(p => p.loaded);
  }

  getFailedPlugins() {
    return this.plugins.filter(p => p.loadOnStartup && !p.loaded);
  }

  clearPlugins() {
    this.plugins = [];
    this.storageManager.clearPlugins();
    this.notifyListeners();
    return true;
  }

  async resetToDefault(defaultPlugins = []) {
    this.setLoading(true, 15000);
    try {
      this.plugins = [...defaultPlugins];
      const pluginsForStartup = defaultPlugins.filter(p => p.loadOnStartup);
      if (pluginsForStartup.length > 0) {
        await this.loadPluginsBatch(pluginsForStartup);
      }
      this.storageManager.savePlugins(this.plugins);
    } finally {
      this.setLoading(false);
    }
  }

  async importPlugins(pluginsArray) {
    if (!Array.isArray(pluginsArray)) {
      throw new Error('Invalid plugins array');
    }

    this.setLoading(true, 15000);
    try {
      this.plugins = [...pluginsArray];
      const pluginsForStartup = pluginsArray.filter(p => p.loadOnStartup);
      if (pluginsForStartup.length > 0) {
        await this.loadPluginsBatch(pluginsForStartup);
      }
      this.storageManager.savePlugins(this.plugins);
    } finally {
      this.setLoading(false);
    }
  }

  exportPlugins() {
    return this.plugins.map(plugin => ({
      ...plugin,
      loaded: false,
    }));
  }

  getStatistics() {
    const total = this.plugins.length;
    const loaded = this.plugins.filter(p => p.loaded).length;
    const failed = this.plugins.filter(p => p.loadOnStartup && !p.loaded).length;
    const startup = this.plugins.filter(p => p.loadOnStartup).length;

    return {
      total,
      loaded,
      failed,
      startup,
      loadedPercentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
    };
  }
}
