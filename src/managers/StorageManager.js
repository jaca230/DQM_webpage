/**
 * Manages localStorage operations for dashboard data
 */
export default class StorageManager {
  constructor(options = {}) {
    this.storageKeys = {
      plugins: options.pluginsKey || 'dashboard-plugins',
      layout: options.layoutKey || 'dashboard-layout',
      ...options.storageKeys
    };
    
    this.autoSave = options.autoSave !== false; // Default to true
    this.listeners = new Set();
  }

  /**
   * Add a change listener
   * @param {Function} listener - Called when storage operations occur
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
   * Notify listeners of storage events
   * @param {string} operation - Operation type (save, load, clear, etc.)
   * @param {string} key - Storage key affected
   * @param {*} data - Data involved in operation
   */
  notifyListeners(operation, key, data = null) {
    this.listeners.forEach(listener => listener({ operation, key, data }));
  }

  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {*} data - Data to save
   * @param {Object} options - Save options
   * @returns {boolean} True if saved successfully
   */
  save(key, data, options = {}) {
    try {
      const serialized = JSON.stringify(data, null, options.pretty ? 2 : 0);
      localStorage.setItem(key, serialized);
      this.notifyListeners('save', key, data);
      return true;
    } catch (e) {
      console.warn(`Failed to save to localStorage (${key}):`, e);
      this.notifyListeners('save_error', key, { error: e, data });
      return false;
    }
  }

  /**
   * Load data from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Loaded data or default value
   */
  load(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) {
        this.notifyListeners('load_missing', key, defaultValue);
        return defaultValue;
      }
      
      const parsed = JSON.parse(stored);
      this.notifyListeners('load', key, parsed);
      return parsed;
    } catch (e) {
      console.warn(`Failed to load from localStorage (${key}):`, e);
      this.notifyListeners('load_error', key, { error: e, defaultValue });
      return defaultValue;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if removed successfully
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      this.notifyListeners('remove', key);
      return true;
    } catch (e) {
      console.warn(`Failed to remove from localStorage (${key}):`, e);
      this.notifyListeners('remove_error', key, { error: e });
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  exists(key) {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Clear all dashboard-related localStorage
   * @returns {boolean} True if cleared successfully
   */
  clearAll() {
    try {
      Object.values(this.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
      this.notifyListeners('clear_all', 'all');
      return true;
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
      this.notifyListeners('clear_all_error', 'all', { error: e });
      return false;
    }
  }

  // Specific methods for dashboard data types

  /**
   * Save plugins data
   * @param {Array} plugins - Array of plugin objects
   * @returns {boolean} True if saved successfully
   */
  savePlugins(plugins) {
    // Sanitize plugins for storage (remove loaded status)
    const sanitized = plugins.map(plugin => ({
      ...plugin,
      loaded: false // Always persist with loaded: false
    }));
    
    return this.save(this.storageKeys.plugins, sanitized);
  }

  /**
   * Load plugins data
   * @param {Array} defaultPlugins - Default plugins array
   * @returns {Array} Loaded plugins array
   */
  loadPlugins(defaultPlugins = []) {
    const savedRaw = localStorage.getItem(this.storageKeys.plugins);
    
    if (savedRaw === null) {
      // No saved plugins key at all → return default plugins
      return defaultPlugins;
    }
    
    try {
      const parsed = JSON.parse(savedRaw);

      // If parsed is empty array, return empty array (means load no plugins)
      if (Array.isArray(parsed) && parsed.length === 0) {
        return [];
      }

      // Otherwise return parsed plugins (non-empty array)
      return parsed;
    } catch (e) {
      console.warn('Error parsing saved plugins:', e);
      // On parse error fallback to defaults
      return defaultPlugins;
    }
  }


  /**
   * Save layout data
   * @param {Object} layoutData - Layout data object (tabs, activeTabId)
   * @returns {boolean} True if saved successfully
   */
  saveLayout(layoutData) {
    return this.save(this.storageKeys.layout, layoutData);
  }

  /**
   * Load layout data
   * @param {Object} defaultLayout - Default layout object
   * @returns {Object} Loaded layout data
   */
  loadLayout(defaultLayout = {}) {
    return this.load(this.storageKeys.layout, defaultLayout);
  }

  /**
   * Clear plugins data
   * @returns {boolean} True if cleared successfully
   */
  clearPlugins() {
    return this.remove(this.storageKeys.plugins);
  }

  /**
   * Clear layout data
   * @returns {boolean} True if cleared successfully
   */
  clearLayout() {
    return this.remove(this.storageKeys.layout);
  }

  // Import/Export functionality

  /**
   * Export data to downloadable file
   * @param {*} data - Data to export
   * @param {string} filename - Name of file to download
   * @param {string} contentType - MIME type of file
   */
  exportToFile(data, filename, contentType = 'application/json') {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      URL.revokeObjectURL(url);
      this.notifyListeners('export', filename, data);
      return true;
    } catch (e) {
      console.warn(`Failed to export ${filename}:`, e);
      this.notifyListeners('export_error', filename, { error: e, data });
      return false;
    }
  }

  /**
   * Import data from JSON string
   * @param {string} jsonString - JSON string to parse
   * @returns {*} Parsed data or null if failed
   */
  importFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      this.notifyListeners('import', 'json', parsed);
      return parsed;
    } catch (e) {
      console.warn('Failed to parse JSON for import:', e);
      this.notifyListeners('import_error', 'json', { error: e, jsonString });
      return null;
    }
  }

  /**
   * Export plugins to file
   * @param {Array} plugins - Plugins array to export
   * @param {string} filename - Filename for export
   * @returns {boolean} True if exported successfully
   */
  exportPlugins(plugins, filename = 'dashboard-plugins.json') {
    const sanitized = plugins.map(plugin => ({
      ...plugin,
      loaded: false
    }));
    
    return this.exportToFile(sanitized, filename);
  }

  /**
   * Export layout to file
   * @param {Object} layoutData - Layout data to export
   * @param {string} filename - Filename for export
   * @returns {boolean} True if exported successfully
   */
  exportLayout(layoutData, filename = 'dashboard-layout.json') {
    return this.exportToFile(layoutData, filename);
  }

  /**
   * Export a single tab as JSON file
   * @param {Object} tabData - Tab object to export
   * @param {string} filename - Optional custom filename
   * @returns {boolean} True if exported successfully
   */
  exportTab(tabData, filename = null) {
    try {
      if (!tabData || !tabData.id || !tabData.name) {
        throw new Error('Invalid tab data: missing required properties');
      }

      // Generate filename if not provided
      if (!filename) {
        const safeName = tabData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const timestamp = new Date().toISOString().split('T')[0];
        filename = `tab_${safeName}_${timestamp}.json`;
      }

      const success = this.exportToFile(tabData, filename);
      
      if (success) {
        this.notifyListeners('export_tab', tabData.id, tabData);
      }
      
      return success;
    } catch (error) {
      console.warn('Failed to export tab:', error);
      this.notifyListeners('export_tab_error', tabData.id || 'unknown', { error, tabData });
      return false;
    }
  }

  /**
   * Import a tab from JSON string
   * @param {string} jsonString - JSON string containing tab data
   * @returns {Object|null} Imported tab object with new ID, or null if failed
   */
  importTab(jsonString) {
    try {
      const tabData = this.importFromJSON(jsonString);
      
      if (!tabData || !tabData.id || !tabData.name) {
        throw new Error('Invalid tab format: expected tab object with id and name');
      }

      // Create imported tab with new ID to avoid conflicts
      const importedTab = {
        ...tabData,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${tabData.name} (Imported)`,
        figures: tabData.figures || [],
        layout: tabData.layout || []
      };

      this.notifyListeners('import_tab', importedTab.id, importedTab);
      return importedTab;
    } catch (error) {
      console.warn('Failed to import tab:', error);
      this.notifyListeners('import_tab_error', 'unknown', { error, jsonString });
      return null;
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Object with storage usage stats
   */
  getStorageInfo() {
    const info = {
      keys: {},
      totalSize: 0,
      available: true
    };

    try {
      Object.entries(this.storageKeys).forEach(([name, key]) => {
        const data = localStorage.getItem(key);
        info.keys[name] = {
          key,
          exists: data !== null,
          size: data ? data.length : 0
        };
        info.totalSize += info.keys[name].size;
      });
    } catch (e) {
      info.available = false;
      info.error = e.message;
    }

    return info;
  }

  /**
   * Test localStorage availability
   * @returns {boolean} True if localStorage is available
   */
  isAvailable() {
    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}