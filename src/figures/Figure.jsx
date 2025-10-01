import BaseFigure from './BaseFigure';
import SettingTypes from '../enums/SettingTypes';
import NoFetchStrategy from './strategies/NoFetchStrategy';
import SingleSourceStrategy from './strategies/SingleSourceStrategy';
import MultiSourceStrategy from './strategies/MultiSourceStrategy';

export default class Figure extends BaseFigure {
  static displayName = 'Figure';
  static name = 'Figure';

  static get settingSchema() {
    return {
      ...super.settingSchema,
      dataUrl: {
        type: SettingTypes.STRING,
        default: 'http://localhost/api/default_data',
        label: 'Data URL',
        advanced: true,
      },
      updateFrequency: {
        type: SettingTypes.NUMBER,
        default: 2,
        label: 'Update Interval (s)',
        onChange: 'onUpdateFrequencyChange',
        advanced: false,
      },
    };
  }

  constructor(props) {
    super(props);
    // Kept for backward compatibility; strategies now own their own IDs
    this.subscriptionId = null;

    this.state = {
      loading: true,
      error: null,
    };

    this.strategy = null;
  }

  /**
   * Override this method in subclasses to define multiple data sources
   * Return array of URLs or null for single-source behavior
   * @returns {Array<string>|null}
   */
  getDataUrls() {
    // Default: single source behavior
    return null;
  }

  /**
   * Get single data URL (backward compatibility)
   * @returns {string}
   */
  getDataUrl() {
    return this.settings.dataUrl;
  }

  /**
   * Get update frequency from settings
   * @returns {number}
   */
  getUpdateFrequency() {
    return this.settings.updateFrequency || 2;
  }

  componentDidMount() {
    this.subscribeToDataManager();
  }

  componentWillUnmount() {
    this.unsubscribeFromDataManager();
  }

  componentDidUpdate(prevProps) {
    super.componentDidUpdate(prevProps);

    // Check if we need to resubscribe
    if (this._needsResubscription(prevProps)) {
      this.unsubscribeFromDataManager();
      this.subscribeToDataManager();
    }
  }

  /**
   * Determine the fetch mode based on current configuration
   * Priority: settings.dataUrl === 'None' takes precedence over method overrides
   * @returns {'none'|'single'|'multi'}
   * @private
   */
  _getFetchMode() {
    // Check settings first - user can force 'None' mode via settings
    if (this.settings.dataUrl === 'None') {
      return 'none';
    }
    
    // Then check method override
    if (this.getDataUrl() === 'None') {
      return 'none';
    }
    
    const urls = this.getDataUrls();
    return urls === null ? 'single' : 'multi';
  }

  /**
   * Get the configuration for the current fetch mode
   * @returns {Object} { mode, urls, frequency }
   * @private
   */
  _getFetchConfig() {
    const mode = this._getFetchMode();
    const frequency = this.getUpdateFrequency();
    
    if (mode === 'none') {
      return { mode, urls: [], frequency };
    } else if (mode === 'single') {
      return { mode, urls: [this.getDataUrl()], frequency };
    } else {
      return { mode, urls: this.getDataUrls(), frequency };
    }
  }

  /**
   * Determine if resubscription is needed based on setting changes
   * @private
   */
  _needsResubscription(prevProps) {
    const currentConfig = this._getFetchConfig();
    const prevConfig = this._withPreviousSettings(prevProps, () => this._getFetchConfig());

    // Check if mode changed
    if (currentConfig.mode !== prevConfig.mode) {
      return true;
    }

    // Check if frequency changed
    if (currentConfig.frequency !== prevConfig.frequency) {
      return true;
    }

    // Check if URLs changed (sorted comparison for multi-source)
    const currentUrls = currentConfig.urls.slice().sort();
    const prevUrls = prevConfig.urls.slice().sort();
    
    return JSON.stringify(currentUrls) !== JSON.stringify(prevUrls);
  }

  /**
   * Helper to evaluate a method with previous props' settings
   * This allows us to call overridden methods (like getDataUrl/getDataUrls) 
   * as they would have behaved with the previous settings
   * @private
   */
  _withPreviousSettings(prevProps, callback) {
    const currentSettings = this.settings;
    this.settings = prevProps.settings || {};
    try {
      return callback();
    } finally {
      this.settings = currentSettings;
    }
  }



  /**
   * Choose and activate a fetch strategy based on current fetch mode.
   * - mode 'none' => NoFetchStrategy (local timer via onLocalTick)
   * - mode 'single' => SingleSourceStrategy
   * - mode 'multi' => MultiSourceStrategy
   */
  subscribeToDataManager() {
    const dataManager = this.getDataManager();
    const { mode, urls } = this._getFetchConfig();

    // Decide strategy based on mode
    if (mode === 'none') {
      this.strategy = new NoFetchStrategy(this);
    } else if (mode === 'single') {
      if (!dataManager) {
        console.error('DataFetchManager not available');
        this.setState({ error: 'Data manager not available', loading: false });
        return;
      }
      this.strategy = new SingleSourceStrategy(this, dataManager);
    } else if (mode === 'multi') {
      if (!dataManager) {
        console.error('DataFetchManager not available');
        this.setState({ error: 'Data manager not available', loading: false });
        return;
      }
      this.strategy = new MultiSourceStrategy(this, dataManager, urls);
    }

    // Activate strategy
    try {
      this.strategy.subscribe();
    } catch (err) {
      console.error('Strategy subscribe error:', err);
      this.setState({ error: String(err?.message || err), loading: false });
    }
  }

  unsubscribeFromDataManager() {
    if (this.strategy) {
      try {
        this.strategy.unsubscribe();
      } catch (err) {
        console.error('Strategy unsubscribe error:', err);
      }
      this.strategy = null;
    }
    // Keep legacy field cleanup no-op; strategy owns sub IDs now
    this.subscriptionId = null;
  }

  getDataManager() {
    return this.props.dataManager;
  }

  // Single-source hooks (backward compatibility)
  onDataReceived(data) {
    // Default implementation - subclasses should override
  }

  onDataError(error) {
    console.debug(`Data error in ${this.constructor.name}:`, error);
  }

  onMultiDataReceived(dataMap) {
    // Default implementation - subclasses should override
    // For backward compatibility, if there's only one URL, call single-source hook
    const urls = this.getDataUrls();
    if (urls && urls.length === 1 && dataMap[urls[0]]) {
      this.onDataReceived(dataMap[urls[0]]);
    }
  }

  onMultiDataError(errorMap) {
    // Default implementation - subclasses can override
    const errorMessages = Object.entries(errorMap).map(([url, error]) => `${url}: ${error}`);
    console.debug(`Multi-source data errors in ${this.constructor.name}:`, errorMessages.join('; '));
  }

  // Helper methods for forcing refresh
  refreshData() {
    // No-op in NoFetchStrategy
    if (this.getDataUrl() === 'None') return;

    const dataManager = this.getDataManager();
    if (!dataManager) return;

    const urls = this.getDataUrls();
    if (urls === null) {
      dataManager.forceFetch(this.getDataUrl());
    } else {
      dataManager.forceFetchMultiple(urls);
    }
  }

  render() {
    const { loading, error } = this.state;

    if (loading) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading...
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          Error: {error}
          <br />
          <button onClick={() => this.refreshData()} style={{ marginTop: '10px' }}>
            Retry
          </button>
        </div>
      );
    }

    return <div>Figure base class (override render!)</div>;
  }
}