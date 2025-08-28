/**
 * Enhanced DataFetchManager with sync/async mode support
 * Sync: Shared fetch intervals, subscribers wait for their timing requirements
 * Async: Individual fetch intervals per subscriber (more requests but precise timing)
 */
export default class DataFetchManager {
  constructor() {
    // Map of URL -> { data, lastFetch, error, subscribers }
    this.cache = new Map();
    
    // Map of URL -> intervalId for shared fetching (sync mode)
    this.intervals = new Map();
    
    // Map of subscriberId -> intervalId for individual fetching (async mode)
    this.asyncIntervals = new Map();
    
    // Map of URL -> Promise for in-flight requests
    this.inflightRequests = new Map();
    
    // Single-source listeners: subscriberId -> { url, callback, updateFrequency, lastUpdate }
    this.singleSourceListeners = new Map();
    
    // Multi-source listeners: subscriberId -> { sources, callback, updateFrequency, lastUpdates }
    this.multiSourceListeners = new Map();
    
    this.nextSubscriberId = 1;
    
    // Global mode: 'sync' or 'async'
    this.mode = 'sync';
  }

  /**
   * Set global sync/async mode
   * @param {string} mode - 'sync' or 'async'
   */
  setMode(mode) {
    if (this.mode === mode) return;
    
    this.mode = mode;
    
    // Rebuild all fetch strategies
    this._rebuildAllFetchStrategies();
  }

  /**
   * Get current mode
   * @returns {string} 'sync' or 'async'
   */
  getMode() {
    return this.mode;
  }

  /**
   * Subscribe to a single data source
   * @param {string} url - Data URL to subscribe to
   * @param {number} updateFrequency - Desired update frequency in seconds
   * @param {function} callback - Callback function (data, error) => void
   * @returns {string} subscriberId
   */
  subscribe(url, updateFrequency, callback) {
    const subscriberId = `single_${this.nextSubscriberId++}`;
    
    this.singleSourceListeners.set(subscriberId, {
      url,
      updateFrequency,
      callback,
      lastUpdate: 0,
    });
    
    this._addUrlSubscriber(url, subscriberId);
    this._updateFetchStrategy(url);
    
    // Immediate callback with cached data if available
    const cached = this.getCachedData(url);
    if (cached && (cached.data !== null || cached.error !== null)) {
      callback(cached.data, cached.error);
      this.singleSourceListeners.get(subscriberId).lastUpdate = Date.now();
    } else {
      this._fetchData(url);
    }
    
    return subscriberId;
  }

  /**
   * Subscribe to multiple coordinated data sources
   * @param {Array<string>} urls - Array of URLs to subscribe to
   * @param {number} updateFrequency - Desired update frequency in seconds
   * @param {function} callback - Callback function (dataMap, errorMap) => void
   * @returns {string} subscriberId
   */
  subscribeMultiple(urls, updateFrequency, callback) {
    const subscriberId = `multi_${this.nextSubscriberId++}`;
    
    this.multiSourceListeners.set(subscriberId, {
      sources: urls,
      updateFrequency,
      callback,
      lastUpdates: {}, // URL -> timestamp
    });
    
    // Add this subscriber to each URL
    for (const url of urls) {
      this._addUrlSubscriber(url, subscriberId);
      this._updateFetchStrategy(url);
    }
    
    // Check if we have all cached data and trigger callback if so
    this._tryMultiSourceCallback(subscriberId);
    
    // Trigger fetches for any missing data
    for (const url of urls) {
      const cached = this.getCachedData(url);
      if (!cached || (cached.data === null && cached.error === null)) {
        this._fetchData(url);
      }
    }
    
    return subscriberId;
  }

  /**
   * Unsubscribe from any type of subscription
   * @param {string} subscriberId
   */
  unsubscribe(subscriberId) {
    // Clean up async interval if exists
    const asyncIntervalId = this.asyncIntervals.get(subscriberId);
    if (asyncIntervalId) {
      clearInterval(asyncIntervalId);
      this.asyncIntervals.delete(subscriberId);
    }

    // Check single-source listeners first
    const singleListener = this.singleSourceListeners.get(subscriberId);
    if (singleListener) {
      this.singleSourceListeners.delete(subscriberId);
      this._removeUrlSubscriber(singleListener.url, subscriberId);
      this._updateFetchStrategy(singleListener.url);
      return;
    }
    
    // Check multi-source listeners
    const multiListener = this.multiSourceListeners.get(subscriberId);
    if (multiListener) {
      this.multiSourceListeners.delete(subscriberId);
      for (const url of multiListener.sources) {
        this._removeUrlSubscriber(url, subscriberId);
        this._updateFetchStrategy(url);
      }
    }
  }

  /**
   * Add a subscriber to a URL's cache entry
   * @private
   */
  _addUrlSubscriber(url, subscriberId) {
    if (!this.cache.has(url)) {
      this.cache.set(url, {
        data: null,
        lastFetch: 0,
        error: null,
        subscribers: new Set(),
      });
    }
    
    this.cache.get(url).subscribers.add(subscriberId);
  }

  /**
   * Remove a subscriber from a URL's cache entry
   * @private
   */
  _removeUrlSubscriber(url, subscriberId) {
    const cacheEntry = this.cache.get(url);
    if (!cacheEntry) return;
    
    cacheEntry.subscribers.delete(subscriberId);
    
    if (cacheEntry.subscribers.size === 0) {
      this._stopFetching(url);
      this.cache.delete(url);
    }
  }

  /**
   * Rebuild all fetch strategies (called when mode changes)
   * @private
   */
  _rebuildAllFetchStrategies() {
    // Stop all current fetching
    for (const intervalId of this.intervals.values()) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
    
    for (const intervalId of this.asyncIntervals.values()) {
      clearInterval(intervalId);
    }
    this.asyncIntervals.clear();

    // Rebuild strategies for all URLs
    const urls = new Set();
    
    for (const listener of this.singleSourceListeners.values()) {
      urls.add(listener.url);
    }
    
    for (const listener of this.multiSourceListeners.values()) {
      for (const url of listener.sources) {
        urls.add(url);
      }
    }
    
    for (const url of urls) {
      this._updateFetchStrategy(url);
    }
  }

  /**
   * Calculate optimal fetch frequency for a URL (sync mode only)
   * @private
   */
  _calculateOptimalFrequency(url) {
    const cacheEntry = this.cache.get(url);
    if (!cacheEntry || cacheEntry.subscribers.size === 0) {
      return null;
    }
    
    let minFrequency = Infinity;
    
    // Check single-source subscribers
    for (const subscriberId of cacheEntry.subscribers) {
      const singleListener = this.singleSourceListeners.get(subscriberId);
      if (singleListener) {
        minFrequency = Math.min(minFrequency, singleListener.updateFrequency);
      }
      
      const multiListener = this.multiSourceListeners.get(subscriberId);
      if (multiListener) {
        minFrequency = Math.min(minFrequency, multiListener.updateFrequency);
      }
    }
    
    return minFrequency === Infinity ? null : minFrequency;
  }

  /**
   * Update fetching strategy for a URL
   * @private
   */
  _updateFetchStrategy(url) {
    // Always clean up existing strategies
    this._stopFetching(url);
    this._stopAsyncFetchingForUrl(url);

    const cacheEntry = this.cache.get(url);
    if (!cacheEntry || cacheEntry.subscribers.size === 0) {
      return;
    }

    if (this.mode === 'sync') {
      // Sync mode: shared fetch interval based on fastest subscriber
      const optimalFrequency = this._calculateOptimalFrequency(url);
      if (optimalFrequency !== null) {
        const intervalMs = Math.max(optimalFrequency * 1000, 100);
        const intervalId = setInterval(() => {
          this._fetchData(url);
        }, intervalMs);
        
        this.intervals.set(url, intervalId);
      }
    } else {
      // Async mode: individual intervals for each subscriber
      for (const subscriberId of cacheEntry.subscribers) {
        this._setupAsyncInterval(subscriberId, url);
      }
    }
  }

  /**
   * Setup individual async interval for a subscriber
   * @private
   */
  _setupAsyncInterval(subscriberId, url) {
    // Clean up existing interval for this subscriber
    const existingInterval = this.asyncIntervals.get(subscriberId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    let frequency = null;
    
    const singleListener = this.singleSourceListeners.get(subscriberId);
    if (singleListener && singleListener.url === url) {
      frequency = singleListener.updateFrequency;
    }
    
    const multiListener = this.multiSourceListeners.get(subscriberId);
    if (multiListener && multiListener.sources.includes(url)) {
      frequency = multiListener.updateFrequency;
    }

    if (frequency !== null) {
      const intervalMs = Math.max(frequency * 1000, 100);
      const intervalId = setInterval(() => {
        this._fetchDataForSubscriber(url, subscriberId);
      }, intervalMs);
      
      this.asyncIntervals.set(subscriberId, intervalId);
    }
  }

  /**
   * Stop shared fetching for a URL
   * @private
   */
  _stopFetching(url) {
    const intervalId = this.intervals.get(url);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(url);
    }
  }

  /**
   * Stop async fetching for all subscribers of a URL
   * @private
   */
  _stopAsyncFetchingForUrl(url) {
    const cacheEntry = this.cache.get(url);
    if (!cacheEntry) return;

    for (const subscriberId of cacheEntry.subscribers) {
      const intervalId = this.asyncIntervals.get(subscriberId);
      if (intervalId) {
        clearInterval(intervalId);
        this.asyncIntervals.delete(subscriberId);
      }
    }
  }

  /**
   * Fetch data for a specific subscriber (async mode)
   * @private
   */
  async _fetchDataForSubscriber(url, subscriberId) {
    try {
      const data = await this._performFetch(url);
      this._handleFetchSuccessForSubscriber(url, data, subscriberId);
    } catch (error) {
      this._handleFetchErrorForSubscriber(url, error, subscriberId);
    }
  }

  /**
   * Fetch data for a URL (shared)
   * @private
   */
    async _fetchData(url) {
    if (this.inflightRequests.has(url)) return this.inflightRequests.get(url);

    const fetchPromise = (async () => {
        const { data, error } = await this._performFetch(url);
        if (error) {
        this._handleFetchError(url, new Error(error));
        } else {
        this._handleFetchSuccess(url, data);
        }
    })();

    this.inflightRequests.set(url, fetchPromise);
    fetchPromise.finally(() => this.inflightRequests.delete(url));
    return fetchPromise;
    }

  /**
   * Perform HTTP request
   * @private
   */
    async _performFetch(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
        return { data: null, error: `HTTP ${response.status}: ${response.statusText}` };
        }
        const data = await response.json();
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err.message || 'Network error' };
    }
    }

  /**
   * Handle successful fetch (shared)
   * @private
   */
  _handleFetchSuccess(url, data) {
    const cacheEntry = this.cache.get(url);
    if (!cacheEntry) return;
    
    cacheEntry.data = data;
    cacheEntry.lastFetch = Date.now();
    cacheEntry.error = null;
    
    this._notifySubscribers(url);
  }

  /**
   * Handle fetch error (shared)
   * @private
   */
  _handleFetchError(url, error) {
    const cacheEntry = this.cache.get(url);
    if (!cacheEntry) return;
    
    cacheEntry.error = error.message;
    cacheEntry.lastFetch = Date.now();
    
    this._notifySubscribers(url);
    console.error(`Fetch error for ${url}:`, error);
  }

  /**
   * Handle successful fetch for specific subscriber (async mode)
   * @private
   */
  _handleFetchSuccessForSubscriber(url, data, subscriberId) {
    // Update cache
    const cacheEntry = this.cache.get(url);
    if (cacheEntry) {
      cacheEntry.data = data;
      cacheEntry.lastFetch = Date.now();
      cacheEntry.error = null;
    }
    
    // Notify only this subscriber
    this._notifySpecificSubscriber(subscriberId, url);
  }

  /**
   * Handle fetch error for specific subscriber (async mode)
   * @private
   */
  _handleFetchErrorForSubscriber(url, error, subscriberId) {
    // Update cache
    const cacheEntry = this.cache.get(url);
    if (cacheEntry) {
      cacheEntry.error = error.message;
      cacheEntry.lastFetch = Date.now();
    }
    
    console.error(`Fetch error for ${url} (subscriber ${subscriberId}):`, error);
    
    // Notify only this subscriber
    this._notifySpecificSubscriber(subscriberId, url);
  }

  /**
   * Notify all subscribers for a URL (sync mode)
   * @private
   */
  _notifySubscribers(url) {
    const cacheEntry = this.cache.get(url);
    if (!cacheEntry) return;
    
    const now = Date.now();
    
    for (const subscriberId of cacheEntry.subscribers) {
      this._notifySpecificSubscriber(subscriberId, url, now);
    }
  }

  /**
   * Notify a specific subscriber
   * @private
   */
  _notifySpecificSubscriber(subscriberId, url, now = Date.now()) {
    // Handle single-source subscribers
    const singleListener = this.singleSourceListeners.get(subscriberId);
    if (singleListener && singleListener.url === url) {
      this._notifySingleSubscriber(subscriberId, singleListener, now);
      return;
    }
    
    // Handle multi-source subscribers
    const multiListener = this.multiSourceListeners.get(subscriberId);
    if (multiListener && multiListener.sources.includes(url)) {
      this._notifyMultiSubscriber(subscriberId, multiListener, url, now);
    }
  }

  /**
   * Notify a single-source subscriber
   * @private
   */
  _notifySingleSubscriber(subscriberId, listener, now) {
    const { updateFrequency, callback, lastUpdate, url } = listener;
    const cacheEntry = this.cache.get(url);
    if (!cacheEntry) return;

    // In sync mode, check if enough time has passed
    // In async mode, always notify (timing handled by fetch intervals)
    const shouldNotify = this.mode === 'async' || 
                        (now - lastUpdate) >= (updateFrequency * 1000);

    if (shouldNotify) {
      try {
        callback(cacheEntry.data, cacheEntry.error);
        listener.lastUpdate = now;
      } catch (callbackError) {
        console.error(`Error in single-source callback ${subscriberId}:`, callbackError);
      }
    }
  }

  /**
   * Try to notify a multi-source subscriber
   * @private
   */
  _notifyMultiSubscriber(subscriberId, listener, updatedUrl, now) {
    const { updateFrequency, sources, callback, lastUpdates } = listener;
    
    // In sync mode, check if enough time has passed since last update for this URL
    // In async mode, always proceed (timing handled by fetch intervals)
    const lastUpdate = lastUpdates[updatedUrl] || 0;
    const shouldCheck = this.mode === 'async' || 
                       (now - lastUpdate) >= (updateFrequency * 1000);

    if (shouldCheck) {
      this._tryMultiSourceCallback(subscriberId);
      // Update the last update time for this URL
      lastUpdates[updatedUrl] = now;
    }
  }

  /**
   * Try to trigger callback for multi-source subscriber
   * @private
   */
  _tryMultiSourceCallback(subscriberId) {
    const listener = this.multiSourceListeners.get(subscriberId);
    if (!listener) return;
    
    const dataMap = {};
    const errorMap = {};
    let hasAllData = true;
    
    for (const url of listener.sources) {
      const cached = this.getCachedData(url);
      if (cached) {
        if (cached.data !== null) {
          dataMap[url] = cached.data;
        }
        if (cached.error !== null) {
          errorMap[url] = cached.error;
        }
      } else {
        hasAllData = false;
      }
    }
    
    // Only trigger callback if we have some data or errors for all sources
    if (hasAllData || Object.keys(errorMap).length > 0) {
      try {
        listener.callback(dataMap, Object.keys(errorMap).length > 0 ? errorMap : null);
      } catch (callbackError) {
        console.error(`Error in multi-source callback ${subscriberId}:`, callbackError);
      }
    }
  }

  /**
   * Get cached data for a URL (synchronous)
   */
  getCachedData(url) {
    const cacheEntry = this.cache.get(url);
    if (!cacheEntry) return null;
    
    return {
      data: cacheEntry.data,
      error: cacheEntry.error,
      lastFetch: cacheEntry.lastFetch,
    };
  }

  /**
   * Force fetch for a URL
   */
  forceFetch(url) {
    this._fetchData(url);
  }

  /**
   * Force fetch for multiple URLs
   */
  forceFetchMultiple(urls) {
    for (const url of urls) {
      this._fetchData(url);
    }
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    const info = {
      mode: this.mode,
      cachedUrls: Array.from(this.cache.keys()),
      activeSharedIntervals: Array.from(this.intervals.keys()),
      activeAsyncIntervals: Array.from(this.asyncIntervals.keys()),
      singleSourceSubscribers: this.singleSourceListeners.size,
      multiSourceSubscribers: this.multiSourceListeners.size,
      urlSubscriberCounts: {},
    };
    
    for (const [url, cacheEntry] of this.cache.entries()) {
      info.urlSubscriberCounts[url] = cacheEntry.subscribers.size;
    }
    
    return info;
  }

  /**
   * Clean up all resources
   */
  destroy() {
    for (const intervalId of this.intervals.values()) {
      clearInterval(intervalId);
    }
    
    for (const intervalId of this.asyncIntervals.values()) {
      clearInterval(intervalId);
    }
    
    this.cache.clear();
    this.intervals.clear();
    this.asyncIntervals.clear();
    this.inflightRequests.clear();
    this.singleSourceListeners.clear();
    this.multiSourceListeners.clear();
  }
}