/**
 * Manages tab operations including creation, deletion, renaming, and selection
 */
export default class TabManager {
  constructor(initialTabs = [], initialActiveTabId = null) {
    this.tabs = [...initialTabs];
    this.activeTabId = initialActiveTabId || (initialTabs.length > 0 ? initialTabs[0].id : null);
    this.listeners = new Set();
  }

  /**
   * Add a change listener
   * @param {Function} listener - Called when tabs change
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
      tabs: this.getTabs(),
      activeTabId: this.getActiveTabId()
    }));
  }

  /**
   * Get current tabs
   * @returns {Array} Array of tab objects
   */
  getTabs() {
    return [...this.tabs];
  }

  /**
   * Get current active tab ID
   * @returns {string|null} Active tab ID
   */
  getActiveTabId() {
    return this.activeTabId;
  }

  /**
   * Get active tab object
   * @returns {Object|null} Active tab object
   */
  getActiveTab() {
    return this.tabs.find(tab => tab.id === this.activeTabId) || null;
  }

  /**
   * Add a new tab
   * @param {Object} options - Tab options
   * @returns {string} New tab ID
   */
  addTab(options = {}) {
    const newTabId = options.id || `tab${Date.now()}`;
    const newTab = {
      id: newTabId,
      name: options.name || `New Tab ${this.tabs.length + 1}`,
      figures: options.figures || [],
      layout: options.layout || [],
      ...options
    };

    this.tabs.push(newTab);
    this.activeTabId = newTabId;
    this.notifyListeners();
    return newTabId;
  }

  /**
   * Delete a tab by ID
   * @param {string} tabId - Tab ID to delete
   * @returns {boolean} True if deleted, false if not found or last tab
   */
  deleteTab(tabId) {
    if (this.tabs.length <= 1) {
      return false; // Cannot delete last tab
    }

    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) {
      return false; // Tab not found
    }

    this.tabs.splice(tabIndex, 1);

    // Update active tab if deleted tab was active
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs[0].id;
    }

    this.notifyListeners();
    return true;
  }

  /**
   * Rename a tab
   * @param {string} tabId - Tab ID to rename
   * @param {string} newName - New name for the tab
   * @returns {boolean} True if renamed, false if not found
   */
  renameTab(tabId, newName) {
    const tab = this.tabs.find(tab => tab.id === tabId);
    if (!tab) {
      return false;
    }

    tab.name = newName;
    this.notifyListeners();
    return true;
  }

  /**
   * Select a tab
   * @param {string} tabId - Tab ID to select
   * @returns {boolean} True if selected, false if not found
   */
  selectTab(tabId) {
    const tab = this.tabs.find(tab => tab.id === tabId);
    if (!tab) {
      return false;
    }

    this.activeTabId = tabId;
    this.notifyListeners();
    return true;
  }

  /**
   * Update tab data (figures, layout, etc.)
   * @param {string} tabId - Tab ID to update
   * @param {Object} updates - Object with properties to update
   * @returns {boolean} True if updated, false if not found
   */
  updateTab(tabId, updates) {
    const tab = this.tabs.find(tab => tab.id === tabId);
    if (!tab) {
      return false;
    }

    Object.assign(tab, updates);
    this.notifyListeners();
    return true;
  }

  /**
   * Update active tab
   * @param {Object} updates - Object with properties to update
   * @returns {boolean} True if updated, false if no active tab
   */
  updateActiveTab(updates) {
    if (!this.activeTabId) {
      return false;
    }
    return this.updateTab(this.activeTabId, updates);
  }

  /**
   * Clear all tabs and create a default tab
   */
  clearTabs() {
    this.tabs = [{
      id: 'tab1',
      name: 'Default Tab',
      figures: [],
      layout: []
    }];
    this.activeTabId = 'tab1';
    this.notifyListeners();
  }

  /**
   * Load tabs from JSON data
   * @param {Object} data - Object containing tabs and activeTabId
   */
  loadFromJSON(data) {
    if (!data || !Array.isArray(data.tabs)) {
      throw new Error('Invalid tabs data');
    }

    this.tabs = [...data.tabs];
    this.activeTabId = data.activeTabId || (data.tabs.length > 0 ? data.tabs[0].id : null);
    this.notifyListeners();
  }

  /**
   * Export tabs to JSON
   * @returns {Object} Object containing tabs and activeTabId
   */
  toJSON() {
    return {
      tabs: this.getTabs(),
      activeTabId: this.getActiveTabId()
    };
  }
}