import BaseFigure from './BaseFigure';
import SettingTypes from '../enums/SettingTypes';

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
    this.subscriptionId = null;
    this.state = {
      loading: true,
      error: null,
    };
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
   * Determine if resubscription is needed based on setting changes
   * @private
   */
  _needsResubscription(prevProps) {
    const urls = this.getDataUrls();
    const prevUrls = this._getPrevDataUrls(prevProps);
    const frequency = this.getUpdateFrequency();
    const prevFrequency = prevProps.settings?.updateFrequency || 2;

    // Check if frequency changed
    if (frequency !== prevFrequency) {
      return true;
    }

    if (urls === null && prevUrls === null) {
      // Single-source mode
      return this.getDataUrl() !== (prevProps.settings?.dataUrl || this.constructor.settingSchema.dataUrl?.default);
    }

    if (urls === null || prevUrls === null) {
      // Mode changed between single and multi
      return true;
    }

    // Multi-source mode - check if URLs changed
    return JSON.stringify(urls.sort()) !== JSON.stringify(prevUrls.sort());
  }

  /**
   * Get previous data URLs for comparison
   * @private
   */
  _getPrevDataUrls(prevProps) {
    // This is a bit tricky since we need to call getDataUrls() with previous settings
    // We'll temporarily swap settings and call getDataUrls()
    const currentSettings = this.settings;
    this.settings = prevProps.settings || {};
    const prevUrls = this.getDataUrls();
    this.settings = currentSettings;
    return prevUrls;
  }

  subscribeToDataManager() {
    const dataManager = this.getDataManager();
    if (!dataManager) {
      console.error('DataFetchManager not available');
      this.setState({ error: 'Data manager not available', loading: false });
      return;
    }

    const urls = this.getDataUrls();
    const frequency = this.getUpdateFrequency();

    if (urls === null) {
      // Single-source mode
      const url = this.getDataUrl();
      this.subscriptionId = dataManager.subscribe(
        url,
        frequency,
        (data, error) => {
          if (error) {
            this.setState({ error, loading: false });
            this.onDataError(error);
          } else {
            this.setState({ error: null, loading: false });
            this.onDataReceived(data);
          }
        }
      );

      // Check for immediate cached data
      const cached = dataManager.getCachedData(url);
      if (cached && cached.data !== null) {
        this.setState({ loading: false });
        this.onDataReceived(cached.data);
      } else if (cached && cached.error !== null) {
        this.setState({ loading: false, error: cached.error });
        this.onDataError(cached.error);
      }
    } else {
      // Multi-source mode
      this.subscriptionId = dataManager.subscribeMultiple(
        urls,
        frequency,
        (dataMap, errorMap) => {
          if (errorMap) {
            const errorMessages = Object.entries(errorMap).map(([url, error]) => `${url}: ${error}`);
            const combinedError = errorMessages.join('; ');
            this.setState({ error: combinedError, loading: false });
            this.onMultiDataError(errorMap);
          } else {
            this.setState({ error: null, loading: false });
            this.onMultiDataReceived(dataMap);
          }
        }
      );

      // Check for immediate cached data
      const allCached = {};
      let hasAllData = true;
      let hasAnyErrors = false;
      const errorMap = {};

      for (const url of urls) {
        const cached = dataManager.getCachedData(url);
        if (cached) {
          if (cached.data !== null) {
            allCached[url] = cached.data;
          }
          if (cached.error !== null) {
            errorMap[url] = cached.error;
            hasAnyErrors = true;
          }
        } else {
          hasAllData = false;
        }
      }

      if (hasAllData) {
        this.setState({ loading: false });
        if (hasAnyErrors) {
          this.onMultiDataError(errorMap);
        } else {
          this.onMultiDataReceived(allCached);
        }
      }
    }
  }

  unsubscribeFromDataManager() {
    if (this.subscriptionId) {
      const dataManager = this.getDataManager();
      if (dataManager) {
        dataManager.unsubscribe(this.subscriptionId);
      }
      this.subscriptionId = null;
    }
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

  // Multi-source hooks (new)
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