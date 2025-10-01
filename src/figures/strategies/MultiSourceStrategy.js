import FetchStrategy from './FetchStrategy';

/**
 * MultiSourceStrategy
 *
 * Used when a figure has multiple backend URLs.
 * Delegates to DataFetchManager.subscribeMultiple().
 */
export default class MultiSourceStrategy extends FetchStrategy {
  constructor(fig, dataManager, urls) {
    super(fig, dataManager);
    this.urls = urls;
    this.subscriptionId = null;
  }

  subscribe() {
    const freq = this.fig.getUpdateFrequency();

    this.subscriptionId = this.dataManager.subscribeMultiple(
      this.urls,
      freq,
      (dataMap, errorMap) => {
        if (errorMap) {
          const combinedError = Object.entries(errorMap)
            .map(([url, error]) => `${url}: ${error}`)
            .join('; ');
          this.fig.setState({ error: combinedError, loading: false });
          this.fig.onMultiDataError(errorMap);
        } else {
          this.fig.setState({ error: null, loading: false });
          this.fig.onMultiDataReceived(dataMap);
        }
      }
    );

    // Check cache immediately
    const allCached = {};
    let hasAllData = true;
    let hasAnyErrors = false;
    const errorMap = {};

    for (const url of this.urls) {
      const cached = this.dataManager.getCachedData(url);
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
      this.fig.setState({ loading: false });
      if (hasAnyErrors) {
        this.fig.onMultiDataError(errorMap);
      } else {
        this.fig.onMultiDataReceived(allCached);
      }
    }
  }

  unsubscribe() {
    if (this.subscriptionId) {
      this.dataManager.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
  }
}
