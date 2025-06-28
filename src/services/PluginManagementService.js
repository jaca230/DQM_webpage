/**
 * Service class that manages plugin operations using PluginLoader
 */
export default class PluginManagementService {
  constructor(pluginLoader, storageManager) {
    this.pluginLoader = pluginLoader;
    this.storageManager = storageManager;
    this.plugins = [];
    this.loading = false;
    this.listeners = new Set();
  }

  /**
   * Add a change listener
   * @param {Function} listener - Called when plugins change
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove a change listener
   * @param {Function} listener - Listener to remove
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener({
      plugins: this.getPlugins(),
      loading: this.isLoading()
    }));
  }

  /**
   * Get current plugins
   * @returns {Array} Array of plugin objects
   */
  getPlugins() {
    return [...this.plugins];
  }

  /**
   * Check if currently loading plugins
   * @returns {boolean} True if loading
   */
  isLoading() {
    return this.loading;
  }

  /**
   * Set loading state and notify listeners
   * @param {boolean} loading - Loading state
   */
  setLoading(loading) {
    this.loading = loading;
    this.notifyListeners();
  }

  /**
   * Initialize plugins from storage and default plugins
   * @param {Array} defaultPlugins - Default plugins to load if none in storage
   * @returns {Promise<void>}
   */
  async initialize(defaultPlugins = []) {
    this.setLoading(true);

    try {
      // Load plugins from storage
      const savedPlugins = this.storageManager.loadPlugins(defaultPlugins);
      const pluginsForStartup = savedPlugins.filter(p => p.loadOnStartup);

      // Start with all plugins
      this.plugins = [...savedPlugins];

      // Load startup plugins
      if (pluginsForStartup.length > 0) {
        await this.loadPluginsBatch(pluginsForStartup);
      }
    } catch (e) {
      console.error('Error initializing plugins:', e);
    }

    this.setLoading(false);
  }

  /**
   * Load multiple plugins in batch
   * @param {Array} pluginsToLoad - Array of plugin info objects
   * @returns {Promise<Array>} Array of load results
   */
  async loadPluginsBatch(pluginsToLoad) {
    if (!pluginsToLoad || pluginsToLoad.length === 0) {
      return [];
    }

    try {
      const results = await this.pluginLoader.loadPlugins(pluginsToLoad);
      
      // Update loaded status based on results
      this.plugins = this.plugins.map(plugin => {
        const result = results.find(r => r.pluginInfo.id === plugin.id);
        if (result) {
          return { 
            ...plugin, 
            loaded: result.success,
            loadMethod: result.success ? result.method : plugin.loadMethod
          };
        }
        return plugin;
      });

      // Log results
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
      
      // Mark all plugins as failed
      this.plugins = this.plugins.map(plugin => ({
        ...plugin,
        loaded: pluginsToLoad.some(p => p.id === plugin.id) ? false : plugin.loaded
      }));
      
      this.notifyListeners();
      throw e;
    }
  }

  /**
   * Add a new plugin and optionally load it
   * @param {Object} pluginInfo - Plugin information object
   * @param {boolean} loadImmediately - Whether to load the plugin immediately
   * @returns {Promise<boolean>} True if added (and loaded if requested) successfully
   */
  async addPlugin(pluginInfo, loadImmediately = true) {
    if (!pluginInfo || !pluginInfo.url) {
      throw new Error('Plugin info must include a URL');
    }

    // Ensure we have required PluginInfo fields
    const fullPluginInfo = {
      id: pluginInfo.id || `plugin-${Date.now()}`,
      name: pluginInfo.name || 'Unnamed Plugin',
      url: pluginInfo.url,
      description: pluginInfo.description || '',
      loaded: false,
      loadOnStartup: pluginInfo.loadOnStartup ?? true,
      loadMethod: pluginInfo.loadMethod || 'ES',
      metadata: pluginInfo.metadata || {},
      ...pluginInfo // Allow override of defaults
    };

    // Check for duplicate URLs
    if (this.plugins.find(p => p.url === fullPluginInfo.url)) {
      throw new Error('Plugin URL already exists');
    }

    if (loadImmediately) {
      this.setLoading(true);
      try {
        // Load plugin using fallback method
        const result = await this.pluginLoader.loadPluginWithFallback(
          fullPluginInfo, 
          15000, 
          ['ES', 'eval', 'script']
        );

        const newPlugin = {
          ...fullPluginInfo,
          loaded: true,
          loadMethod: result.method
        };

        console.log(`Loaded plugin: ${newPlugin.name} via ${result.method} (${result.newNames.length} figures)`);
        
        this.plugins.push(newPlugin);
        this.storageManager.savePlugins(this.plugins);
        this.setLoading(false);
        return true;
      } catch (e) {
        console.error(`Failed to load plugin ${fullPluginInfo.name}:`, e);
        
        // Still add the plugin but mark it as failed
        const failedPlugin = { ...fullPluginInfo, loaded: false };
        this.plugins.push(failedPlugin);
        this.storageManager.savePlugins(this.plugins);
        this.setLoading(false);
        throw e;
      }
    } else {
      // Just add without loading
      this.plugins.push(fullPluginInfo);
      this.storageManager.savePlugins(this.plugins);
      this.notifyListeners();
      return true;
    }
  }

  /**
   * Remove a plugin by ID
   * @param {string} pluginId - Plugin ID to remove
   * @returns {boolean} True if removed successfully
   */
  removePlugin(pluginId) {
    if (!pluginId) {
      return false;
    }

    const initialLength = this.plugins.length;
    this.plugins = this.plugins.filter(p => p.id !== pluginId);
    
    if (this.plugins.length < initialLength) {
      this.storageManager.savePlugins(this.plugins);
      this.notifyListeners();
      return true;
    }
    
    return false;
  }

  /**
   * Load a specific plugin manually
   * @param {string} pluginId - Plugin ID to load
   * @returns {Promise<boolean>} True if loaded successfully
   */
  async loadPlugin(pluginId) {
    const plugin = this.plugins.find(p => p.id === pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }

    this.setLoading(true);
    try {
      const result = await this.pluginLoader.loadPluginWithFallback(
        plugin, 
        15000, 
        ['ES', 'eval', 'script']
      );

      console.log(`Manually loaded plugin: ${plugin.name} via ${result.method} (${result.newNames.length} figures)`);

      // Update plugin status
      this.plugins = this.plugins.map(p => 
        p.id === pluginId ? { 
          ...p, 
          loaded: true, 
          loadMethod: result.method 
        } : p
      );

      this.storageManager.savePlugins(this.plugins);
      this.setLoading(false);
      return true;
    } catch (e) {
      console.error(`Failed to load plugin ${plugin.name}:`, e);
      
      // Update plugin status as failed
      this.plugins = this.plugins.map(p => 
        p.id === pluginId ? { ...p, loaded: false } : p
      );
      
      this.setLoading(false);
      throw e;
    }
  }

  /**
   * Reload all plugins marked for startup
   * @returns {Promise<Array>} Array of load results
   */
  async reloadStartupPlugins() {
    const pluginsForReload = this.plugins.filter(p => p.loadOnStartup);
    
    if (pluginsForReload.length === 0) {
      return [];
    }

    this.setLoading(true);
    try {
      const results = await this.loadPluginsBatch(pluginsForReload);
      this.storageManager.savePlugins(this.plugins);
      return results;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Update plugin information
   * @param {string} pluginId - Plugin ID to update
   * @param {Object} updates - Updates to apply
   * @returns {boolean} True if updated successfully
   */
  updatePlugin(pluginId, updates) {
    const pluginIndex = this.plugins.findIndex(p => p.id === pluginId);
    if (pluginIndex === -1) {
      return false;
    }

    this.plugins[pluginIndex] = { ...this.plugins[pluginIndex], ...updates };
    this.storageManager.savePlugins(this.plugins);
    this.notifyListeners();
    return true;
  }

  /**
   * Get plugin by ID
   * @param {string} pluginId - Plugin ID to find
   * @returns {Object|null} Plugin object or null if not found
   */
  getPlugin(pluginId) {
    return this.plugins.find(p => p.id === pluginId) || null;
  }

  /**
   * Get loaded plugins
   * @returns {Array} Array of loaded plugin objects
   */
  getLoadedPlugins() {
    return this.plugins.filter(p => p.loaded);
  }

  /**
   * Get failed plugins
   * @returns {Array} Array of failed plugin objects
   */
  getFailedPlugins() {
    return this.plugins.filter(p => p.loadOnStartup && !p.loaded);
  }

  /**
   * Clear all plugins
   * @returns {boolean} True if cleared successfully
   */
  clearPlugins() {
    this.plugins = [];
    this.storageManager.clearPlugins();
    this.notifyListeners();
    return true;
  }

  /**
   * Reset plugins to default set
   * @param {Array} defaultPlugins - Default plugins to reset to
   * @returns {Promise<void>}
   */
  async resetToDefault(defaultPlugins = []) {
    this.setLoading(true);
    
    try {
      // Reset plugins array
      this.plugins = [...defaultPlugins];
      
      // Load startup plugins
      const pluginsForStartup = defaultPlugins.filter(p => p.loadOnStartup);
      if (pluginsForStartup.length > 0) {
        await this.loadPluginsBatch(pluginsForStartup);
      }
      
      this.storageManager.savePlugins(this.plugins);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Import plugins from array
   * @param {Array} pluginsArray - Array of plugin objects to import
   * @returns {Promise<void>}
   */
  async importPlugins(pluginsArray) {
    if (!Array.isArray(pluginsArray)) {
      throw new Error('Invalid plugins array');
    }

    this.setLoading(true);
    
    try {
      // Set plugins
      this.plugins = [...pluginsArray];
      
      // Load startup plugins
      const pluginsForStartup = pluginsArray.filter(p => p.loadOnStartup);
      if (pluginsForStartup.length > 0) {
        await this.loadPluginsBatch(pluginsForStartup);
      }
      
      this.storageManager.savePlugins(this.plugins);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Export plugins for backup/sharing
   * @returns {Array} Sanitized plugins array
   */
  exportPlugins() {
    return this.plugins.map(plugin => ({
      ...plugin,
      loaded: false // Always export with loaded: false
    }));
  }

  /**
   * Get plugin statistics
   * @returns {Object} Statistics object
   */
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
      loadedPercentage: total > 0 ? Math.round((loaded / total) * 100) : 0
    };
  }
}